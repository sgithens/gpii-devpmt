"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * Component for showing My/All Settings and Products, and then
 * also searching them via input.
 */
fluid.defaults("gpii.devpmt.prefsFilter", {
    gradeNames: ["fluid.viewComponent"], //, "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    selectors: {
        mySettingsButton: "#pmt-mysettings-button",
        allSettingsButton: "#pmt-allsettings-button"
    },
    model: {
    },
    // modelListeners: {
    //     settingsFilter: {
    //         func: "{that}.searchSettings",
    //         excludeSource: ["init"],
    //         args: ["{this}", "{change}.value", "{editPrefs}"]
    //     }
    // },
    // bindings: {
        // "settingsSearchInput": "settingsFilter"
    // },
    invokers: {
        setSettingsFilter: {
            funcName: "gpii.devpmt.prefsFilter.setSettingsFilter",
            args: ["{that}", "{editPrefs}", "{arguments}.0"]
        },
        searchSettings: {
            funcName: "gpii.devpmt.prefsFilter.searchSettings",
            args: ["{that}", "{that}.dom.settingsSearchInput", "{editPrefs}"]
        }
    },
    listeners: {
        "onCreate": [
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
    }
});

fluid.registerNamespace("gpii.devpmt.prefsFilter");

gpii.devpmt.prefsFilter.searchSettings = function (that, searchInput, editPrefs) {
    editPrefs.applier.change("settingsSearch", searchInput);
    editPrefs.renderInitialMarkup();
};

gpii.devpmt.prefsFilter.setSettingsFilter = function (that, editPrefs, event) {
    editPrefs.applier.change("settingsFilter", event.data);
    editPrefs.renderInitialMarkup();
};
