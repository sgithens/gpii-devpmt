/**
 * Settings Table Widget
 *
 * When editing a preference set, this widget will render all the settings for
 * either an application or the generic settings. It will have a column for
 * each context. In the upper left hand corner will be a search filter and
 * filter to show only settings the user has, or all available settings.
 * Clicking on a setting will launch a widget to edit the setting.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
/* global lunr */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.settingsTable");

/**
 * Main infusion component for a Setting Table Widget.
 */
fluid.defaults("gpii.devpmt.settingsTableWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    solution: null, // The solutions registry entry for this app
    appId: null,
    appUri: null, // TODO Use ontology transforms
    model: {
        flatPrefs: null, // Model Relay to EditPrefs
        contextNames: null, // Model Relay to EditPrefs
        settingsFilter: "", // Bound to the text box for filtering/searching
        allSettingsEnabled: "mysettings", // For some reason this defaults to an array from binder

        termUsage: {
            all: 0,
            prefsSafe: 0
        }
    },
    modelListeners: {
        settingsFilter: {
            func: "{that}.filterSettings"
        },
        allSettingsEnabled: {
            func: "{that}.filterSettings"
        },
        flatPrefs: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    },
    bindings: { // Binding selectors to model paths
    },
    selectors: {
        valueDisplayCell: ".pmt-value-display",
        enabledBooleanInputs: ".pmt-enabled-boolean",
        settingsFilter: "#pmt-filter-container",
        settingsRows: ".pmt-settings-table-row",
        addPrefsSetButton: ".pmt-add-context-button",
        mineAllSwitchContainer: "#pmt-mineAllSwitch-container",
        removeProductButton: ".pmt-remove-product"
    },
    templates: {
        initial: "editprefset-settingsTable-widget"
    },
    components: {
        mineAllSwitch: {
            type: "gpii.devpmt.mineAllSwitch.default",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.mineAllSwitchContainer",
            options: {
                selectors: {
                    initial: "#pmt-mineAllSwitch-area"
                },
                model: {
                    settingsFilter: "{settingsTableWidget}.model.allSettingsEnabled",
                    allSettingsCount: "{settingsTableWidget}.model.termUsage.all",
                    mySettingsCount: "{settingsTableWidget}.model.termUsage.prefsSafe"
                }
            }
        },
        filter: {
            type: "gpii.devpmt.filterWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.settingsFilter",
            options: {
                selectors: {
                    initial: "#pmt-common-filter-area"
                },
                model: {
                    filterText: "{settingsTableWidget}.model.settingsFilter"
                }
            }
        }
    },
    invokers: {
        // Overriding renderInitialMarkup to take `that` as a render context.
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}"]
        },
        updateLunrIndex: {
            funcName: "gpii.devpmt.settingsTable.updateLunrIndex",
            args: ["{that}"]
        },
        filterSettings: {
            funcName: "gpii.devpmt.settingsTable.filterSettings",
            args: ["{that}", "{that}.dom.settingsRows", "{that}.lunrIndex", "{that}.model.settingsFilter"]
        },
        enableProductListener: {
            funcName: "gpii.devpmt.settingsTable.enableProductListener",
            args: ["{that}", "{gpii.devpmt.editPrefs}", "{arguments}.0"] // event
        },
        updateTermUsage: {
            funcName: "gpii.devpmt.settingsTable.updateTermUsage",
            args: ["{that}"]
        },
        removeProduct: {
            funcName: "gpii.devpmt.settingsTable.removeProduct",
            args: ["{that}", "{gpii.devpmt.editPrefs}", "{arguments}.0"]
        },
        // Zero-arg version of removeProduct that can be used as a click hander
        removeProductEvent: {
            func: "{that}.removeProduct",
            args: [null]
        }
    },
    markupEventBindings: {
        enabledBooleanInputs: {
            method: "click",
            args: "{that}.enableProductListener"
        },
        addPrefsSetButton: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.events.openAddPrefsSetDialog.fire"
        },
        valueDisplayCell: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.editValueEvent"
        },
        removeProductButton: {
            method: "click",
            args: ["{that}.removeProductEvent"]
        }
    },
    listeners: {
        "onCreate.updateLunrIndex": {
            "func": "{that}.updateLunrIndex"
        },
        "onCreate.updateTermUsage": {
            "func": "{that}.updateTermUsage"
        },
        "onMarkupRendered.filterSettings": {
            "func": "{that}.filterSettings"
        }
    },
    lunrIndex: null
});

/*
 * This listener is called when the toggle switch is clicked for a specific prefset/context
 * in the settings table. These switches are in a top row before the actual settings. This
 * switch is necessary so that we could still have an empty object/entry for the product
 * inside the prefset/context, which in some matchmaking situations could make a difference.
 */
gpii.devpmt.settingsTable.enableProductListener = function (that, editPrefs, event) {
    var checked = event.currentTarget.checked;
    var context = event.currentTarget.dataset.context;
    var product = event.currentTarget.dataset.product;

    if (gpii.devpmt.prefsetsForApplication(editPrefs.model.flatPrefs, product).length === 1 &&
        checked === false) {
        that.removeProduct(context);
        // The reRender call below is so that the toggle button goes back
        // to it's toggled state. If the user were to click "Cancel", then
        // the product wouldn't be removed, but the toggle would still have
        // been moved to false in the page. (But there is no model change to
        // the preferences.)
        // If the user continues and clicks to Remove the Product, the
        // model listener will reRender the widgets anyways so the view will
        // be up to date.
        that.reRender();
        return;
    }
    editPrefs.editProductEnabled(checked, context, product);
};

gpii.devpmt.settingsTable.updateTermUsage = function (that) {
    var all = 0;
    var prefsSafeKeys = {};
    fluid.each(that.model.flatPrefs.contexts, function (context) {
        fluid.each(context.preferences[that.options.appUri], function (setting, settingKey) {
            prefsSafeKeys[settingKey] = true;
        });
    });
    fluid.each(that.options.solution.settingsHandlers, function (settingsHandler) {
        fluid.each(settingsHandler.supportedSettings, function (setting) {
            if (setting.schema) {
                all++;
            }
        });
    });
    that.applier.change("termUsage", {
        all: all,
        prefsSafe: Object.keys(prefsSafeKeys).length
    });
};

/**
 * Update the currently displayed settings in the table based upon a
 * filter string.
 *
 * @param {gpii.devpmt.settingsTableWidget} that - Settings Table Widget
 * @param {jQuery} settingsRows - Table rows, containing one setting per row.
 * @param {Object} lunrIndex - Index created by lunr.js
 * @param {String} filterText - Text string being used to filter settings.
 */
gpii.devpmt.settingsTable.filterSettings = function (that, settingsRows, lunrIndex, filterText) {
    if (!lunrIndex) {
        return;
    }

    var showBasedOnAllFilter = function (settingId) {
        var togo = false;
        if (that.model.allSettingsEnabled === "allsettings") {
            togo = true;
        }
        else {
            fluid.each(that.model.flatPrefs.contexts, function (context) {
                fluid.each(context.preferences[that.options.appUri], function (setting, settingKey) {
                    if (settingKey === settingId) {
                        togo = true;
                    }
                });
            });
        }
        return togo;
    };

    // TODO Refactor with gpii.devpmt.productList.filterProductList
    settingsRows.hide();

    var results = gpii.devpmt.lunrListFilterSearch(lunrIndex, filterText);

    // TODO Remove this double loop
    fluid.each(settingsRows, function (setting) {
        fluid.each(results, function (result) {
            if (result.ref === $(setting).data("term")) {
                if (showBasedOnAllFilter(result.ref)) {
                    $(setting).show();
                }
            }
        });
    });
};

gpii.devpmt.settingsTable.updateLunrIndex = function (that) {
    that.lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("description");

        fluid.each(that.options.solution.settingsHandlers, function (settingsHandler) {
            fluid.each(settingsHandler.supportedSettings, function (setting, key) {
                if (setting.schema) {
                    idx.add({
                        "id": key,
                        "name": setting.schema.title,
                        "description": setting.schema.description
                    });
                }
            });
        });
    });
};

/**
 * Completely remove this product from all preference sets (contexts).
 * Opens the standard Remove Product Confirmation Dialog from the page devpmt component.
 *
 * @param {gpii.devpmt.settingsTableWidget} that - Settings Table Widget
 * @param {Object} editPrefs Primary page component `gpii.devpmt.editPrefs`
 * @param {String} context Optional argument with the context this product is being
 * removed from. If `null`, this product will be removed from all contexts.
 */
gpii.devpmt.settingsTable.removeProduct = function (that, editPrefs, context) {
    var appId = that.options.appId;
    editPrefs.applier.change("activeModalDialog", {
        appId: appId,
        name: editPrefs.model.allSolutions[appId].name,
        product: that.options.appUri,
        context: context
    });
    editPrefs.events.openConfirmRemoveProductDialog.fire();
};
