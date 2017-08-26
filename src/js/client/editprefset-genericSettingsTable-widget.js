/* global lunr */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.settingsTable");

fluid.defaults("gpii.devpmt.genericSettingsTableWidget", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    model: {
        flatPrefs: null, // Model Relay to EditPrefs
        contextNames: null, // Model Relay to EditPrefs
        commonTerms: null, // Model Relay to EditPrefs
        commonTermsSorted: null, // Model Relay to EditPrefs

        settingsFilter: "mysettings",
        settingsSearch: ""
    },
    templates: {
        initial: "editprefset-genericSettingsTable-widget"
    },
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        reRender: {
            func: "{that}.events.refresh.fire"
        },
        updateSettingsFilter: {
            funcName: "gpii.devpmt.updateSettingsFilter",
            args: ["{that}", "{that}.dom.commonTermRow", "{that}.model.settingsFilter", "{that}.model.settingsSearch"]
        },
        setSettingsFilter: {
            funcName: "gpii.devpmt.setSettingsFilter",
            args: ["{that}", "{editPrefs}", "{arguments}.0"]
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
        prefsFilter: "#filter-container",
        valueDisplayCell: ".pmt-value-display",

        // Generic Prefs Filters
        mySettingsButton: "#pmt-mysettings-button",
        allSettingsButton: "#pmt-allsettings-button",
        settingsSearchInput: "#pmt-settings-search-input"
    },
    components: {
        filter: {
            type: "gpii.devpmt.filterWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsFilter",
            options: {
                selectors: {
                    initial: "#common-filter-area"
                },
                model: {
                    filterText: "{genericSettingsTableWidget}.model.settingsSearch"
                }
            }
        }
    },
    listeners: {
        "onCreate": [
        ],
        "onMarkupRendered": [
            {
                "this": "{that}.dom.valueDisplayCell",
                "method": "click",
                args: ["{gpii.devpmt.editPrefs}.editValueEvent"]
            },
            {
                func: "{that}.updateSettingsFilter"
            },
            {
                "this": "{that}.dom.mySettingsButton",
                "method": "click",
                args: ["mysettings", "{that}.setSettingsFilter"]
            },
            {
                "this": "{that}.dom.allSettingsButton",
                "method": "click",
                args: ["allsettings", "{that}.setSettingsFilter"]
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
        }
    }
});

/* Generic Prefs Table Filters */
gpii.devpmt.searchSettings = function (that, searchInput) {
    that.applier.change("settingsSearch", searchInput);
    that.reRender();
};

gpii.devpmt.setSettingsFilter = function (that, editPrefs, event) {
    console.log("setSettingsFilter");
    that.applier.change("settingsFilter", event.data);
    that.reRender();
};
/* End Generic Prefs Table Filters */

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
        this.b(0.01);

        fluid.each(that.model.commonTerms, function (commonTerm, term) {
            idx.add({
                "id": term,
                "name": commonTerm.schema.title,
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
