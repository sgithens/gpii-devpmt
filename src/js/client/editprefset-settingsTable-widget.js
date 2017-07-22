/**
 * Settings Table Widget
 *
 * When editing a preference set, this widget will render all the settings for
 * either an application or the generic settings. It will have a column for
 * each context. In the upper left hand corner will be a search filter and
 * filter to show only settings the user has, or all available settings.
 * Clicking on a setting will launch a widget to edit the setting.
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.settingsTable");

/**
 * Main infusion component for a Setting Table Widget.
 */
fluid.defaults("gpii.devpmt.settingsTableWidget", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    solution: null, // The solutions registry entry for this app
    appId: null,
    appUri: null, // TODO Use ontology transforms
    model: {
        flatPrefs: null, // Model Relay to EditPrefs
        contextNames: null, // Model Relay to EditPrefs
        settingsFilter: "", // Bound to the text box for filtering/searching
        allSettingsEnabled: ["mysettings"] // For some reason this defaults to an array from binder
    },
    modelListeners: {
        settingsFilter: {
            func: "{that}.filterSettings"
        },
        allSettingsEnabled: {
            func: "{that}.filterSettings"
        }
    },
    bindings: { // Binding selectors to model paths
        "settingsFilter": "settingsFilter",
        "allSettingsEnabledSwitch": "allSettingsEnabled"
    },
    selectors: {
        valueDisplayCell: ".pmt-value-display",
        enabledBooleanInputs: ".pmt-enabled-boolean",
        settingsFilter: ".settings-list-filter",
        settingsRows: ".pmt-settings-table-row",
        allSettingsEnabledSwitch: ".all-settings-switch"
    },
    templates: {
        initial: "editprefset-settingsTable-widget"
    },
    invokers: {
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
        }
    },
    listeners: {
        "onCreate": [
            {
                "func": "{that}.updateLunrIndex"
            }
        ],
        "onMarkupRendered": [
            {
                "this": "{that}.dom.enabledBooleanInputs",
                "method": "click",
                args: ["{that}.enableProductListener"]
            },
            {
                "this": "{that}.dom.valueDisplayCell",
                "method": "click",
                args: ["{gpii.devpmt.editPrefs}.editValueEvent"]
            },
            {
                "func": "{that}.filterSettings"
            }
        ]
    },
    lunrIndex: null
});

gpii.devpmt.settingsTable.enableProductListener = function (that, devpmt, event) {
    var checked = event.currentTarget.checked;
    var context = event.currentTarget.dataset.context;
    var product = event.currentTarget.dataset.product;
    devpmt.editProductEnabled(checked, context, product);
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
        if (that.model.allSettingsEnabled.length === 0) {
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
                idx.add({
                    "id": key,
                    "name": setting.name,
                    "description": setting.description
                });
            });
        });
    });
};
