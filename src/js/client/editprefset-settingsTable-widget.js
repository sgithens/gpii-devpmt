/**
 * Settings Table Widget
 *
 * When editing a preference set, this widget will render all the settings for
 * either an application or the generic settings. It will have a column for
 * each context. In the upper left hand corner will be a search filter and
 * filter to show only settings the user has, or all available settings.
 * Clicking on a setting will launch a widget to edit the setting.
 */
/* global lunr */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
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
        settingsFilter: null, // Bound to the text box for filtering/searching
        allSettingsEnabled: null, // For some reason this defaults to an array from binder

        termUsage: {
            all: 0,
            npset: 0
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
        addContextButton: ".pmt-add-context-button",
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
                    mySettingsCount: "{settingsTableWidget}.model.termUsage.npset"
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
        filterInit: {
            funcName: "gpii.devpmt.settingsTable.filterInit",
            args: ["{that}"]
        },
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
            args: ["{that}", "{gpii.devpmt.editPrefs}"]
        }
    },
    markupEventBindings: {
        enabledBooleanInputs: {
            method: "click",
            args: "{that}.enableProductListener"
        },
        addContextButton: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.events.openAddContextDialog.fire"
        },
        valueDisplayCell: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.editValueEvent"
        },
        removeProductButton: {
            method: "click",
            args: "{that}.removeProduct"
        }
    },
    listeners: {
        "onCreate": [
            {
                "func": "{that}.updateLunrIndex"
            },
            {
                "func": "{that}.filterInit"
            },
            {
                "func": "{that}.updateTermUsage"
            }
        ],
        "onMarkupRendered": [
            {
                "func": "{that}.filterSettings"
            }
        ]
    },
    lunrIndex: null
});

/**
 * gpii.devpmt.settingsTable.filterInit - The users current filter options
 * will be stored on the parent component and updated via model relay, such
 * that they are saved if this component is destroyed and recreated.
 * The first time it is created though, we want to set the default values,
 * and trigger them via change applier so they are set on the parent.
 *
 * @param (Object) that
 */
gpii.devpmt.settingsTable.filterInit = function (that) {
    if (that.model.settingsFilter === null) {
        that.applier.change("settingsFilter", "");
    }
    if (that.model.allSettingsEnabled === null) {
        that.applier.change("allSettingsEnabled", "mysettings");
    }
};

gpii.devpmt.settingsTable.enableProductListener = function (that, devpmt, event) {
    var checked = event.currentTarget.checked;
    var context = event.currentTarget.dataset.context;
    var product = event.currentTarget.dataset.product;

    if (gpii.devpmt.prefsetsForApplication(devpmt.model.flatPrefs, product).length === 1 &&
        checked === false) {
        var appId = product.slice(38); // TODO Ontology lookup
        devpmt.applier.change("activeModalDialog", {
            appId: appId,
            name: devpmt.model.allSolutions[appId].name,
            product: product,
            context: context
        });
        devpmt.events.openConfirmRemoveProductDialog.fire();
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

    devpmt.editProductEnabled(checked, context, product);
};

gpii.devpmt.settingsTable.updateTermUsage = function (that) {
    var all = 0;
    var npsetKeys = {};
    fluid.each(that.model.flatPrefs.contexts, function (context) {
        fluid.each(context.preferences[that.options.appUri], function (setting, settingKey) {
            npsetKeys[settingKey] = true;
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
        npset: Object.keys(npsetKeys).length
    });
};

/**
 * Update the currently displayed settings in the table based upon a
 * filter string.
 *
 * @param filterText
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

 * @param  {Object} that
 * @param  {Object} editPrefs Primary page component `gpii.devpmt.editPrefs`
 */
gpii.devpmt.settingsTable.removeProduct = function (that, editPrefs) {
    editPrefs.editProductEnabled(false, null, that.options.appUri);
};
