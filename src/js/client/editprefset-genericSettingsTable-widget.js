/**
 * Generic Settings Table Widget
 *
 * Contains UI component `gpii.devpmt.genericSettingsTableWidget` which
 * renders a partially interactive table on the page detailing all the
 * generic settings in the preference safe, with featuers such as filtering
 * and searching, and selecting to edit.
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

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.settingsTable");

/**
 * Component for rendering generic settings.  In the past these
 * have always been referred to as common terms, and they do not
 * apply to a specific application or product, but products can
 * support reading these generic settings. Examples include font
 * size, cursor size, etc.
 *
 * This renders a table of all the current generic settings
 * and allows users to read and filter the settings. Because there
 * are enough differences from product specific settings from a
 * storage and json perspective, this table has it's own widget.
 *
 * The following model entries will typically be set up as
 * model relays to the page `gpii.devpmt.prefsEditor` component.
 *
 * - flatPrefs
 * - contextNames
 * - commonTerms
 * - commonTermsSorted
 *
 * This components contains 2 invokers that are used internally by
 * the components for updating it's search and settings filters.
 * Several events on this component will trigger events for other
 * components to edit values.
 */
fluid.defaults("gpii.devpmt.genericSettingsTableWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        flatPrefs: null, // Model Relay to EditPrefs
        contextNames: null, // Model Relay to EditPrefs
        commonTerms: null, // Model Relay to EditPrefs
        commonTermsSorted: null, // Model Relay to EditPrefs

        settingsFilter: "mysettings",
        settingsSearch: "",

        commonTermUsageCounts: {}
    },
    templates: {
        initial: "editprefset-genericSettingsTable-widget"
    },
    invokers: {
        updateSettingsFilter: {
            funcName: "gpii.devpmt.updateSettingsFilter",
            args: ["{that}", "{that}.dom.commonTermRow", "{that}.model.settingsFilter", "{that}.model.settingsSearch"]
        },
        searchSettings: {
            funcName: "gpii.devpmt.searchSettings",
            args: ["{that}", "{that}.dom.settingsSearchInput"]
        }
    },
    bindings: {
    },
    selectors: {
        commonTermRow: ".pmt-commonterm-row",
        prefsFilter: "#pmt-filter-container",
        valueDisplayCell: ".pmt-value-display",

        // Generic Prefs Filters
        settingsSearchInput: "#pmt-settings-search-input",
        addContextButton: ".pmt-add-context-button",

        // mineAllWidget
        mineAllSwitchContainer: "#pmt-mineAllSwitch-container",

        // PSP items
        pspShowCheckboxes: ".pmt-psp-show-checkbox",
        pspMemoryCheckboxes: ".pmt-psp-memory-checkbox"
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
                    settingsFilter: "{genericSettingsTableWidget}.model.settingsFilter",
                    allSettingsCount: "{genericSettingsTableWidget}.model.commonTermUsageCounts.all",
                    mySettingsCount: "{genericSettingsTableWidget}.model.commonTermUsageCounts.npset"
                }
            }
        },
        filter: {
            type: "gpii.devpmt.filterWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsFilter",
            options: {
                selectors: {
                    initial: "#pmt-common-filter-area"
                },
                model: {
                    filterText: "{genericSettingsTableWidget}.model.settingsSearch"
                }
            }
        }
    },
    markupEventBindings: {
        valueDisplayCell: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.editValueEvent"
        },
        addContextButton: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.events.openAddContextDialog.fire"
        },
        pspShowCheckboxes: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.editPspShow"
        },
        pspMemoryCheckboxes: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.editPspMemory"
        }
    },
    listeners: {
        "onCreate": [
        ],
        "onMarkupRendered": [
            {
                func: "{that}.updateSettingsFilter"
            }
        ]
    },
    modelListeners: {
        "settingsSearch": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        },
        "settingsFilter": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        },
        "flatPrefs": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    }
});

gpii.devpmt.searchSettings = function (that, searchInput) {
    that.applier.change("settingsSearch", searchInput);
    that.reRender();
};

gpii.devpmt.updateSettingsFilter = function (that, commonTermRows, filters, search) {
    console.log("updateSettingsFilter", search);
    if (filters === "allsettings") {
        commonTermRows.show();
    }
    else {
        commonTermRows.hide();
        fluid.each(commonTermRows, function (row) {
            var term = row.dataset.term;
            fluid.each(that.model.flatPrefs.contexts, function (context) {
                fluid.each(context.preferences, function (pref, key) {
                    if (key === term) {
                        $(row).show();
                    }
                });
            });
        });
    }

    // TODO For both the settings and products index, move them out into
    // a component, or part of the model (so they aren't regenerated each time).
    // Then also hook up a model listener such that if the solutions or
    // settings change, the index get's updated.
    var lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("term");
        this.b(0.01); // lunr.js field length normalisation

        fluid.each(that.model.commonTerms, function (commonTerm, term) {
            idx.add({
                "id": term,
                "name": commonTerm.title,
                "term": term
            });
        });
    });

    if (search) {
        var results = gpii.devpmt.lunrListFilterSearch(lunrIndex, search);
        commonTermRows.hide();
        fluid.each(commonTermRows, function (row) {
            var term = row.dataset.term;
            fluid.each(results, function (result) {
                if (result.ref === term) {
                    $(row).show();
                }
            });
        });
    }
};
