/**
 * Mine / All Switch Widgets
 *
 * This includes a base grade and specific grades for a UI control that
 * allows for switching between two states: Viewing all of the settings
 * for a specific product/generic, or viewing only the settings that the
 * user currently has personalized values for.  This allows a shorter list
 * on the screen in the event that the category has tens or hundreds of
 * settings.
 *
 * We will provide 2 implementations.  One that uses 2 buttons, and another
 * that uses the Foundation boolean toggle. Additionally, the number of all
 * or mine settings is included in the control display.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.mineAllSwitch");

fluid.defaults("gpii.devpmt.mineAllSwitch.base", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        settingsFilter: "allsettings",
        allSettingsCount: 0,
        mySettingsCount: 0
    },
    invokers: {
        // Overriding renderInitialMarkup to use `that` as a render context.
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}"]
        }
    },
    modelListeners: {
        "*": {
            func: "{that}.renderInitialMarkup",
            excludeSource: ["init"]
        }
    }
});

fluid.defaults("gpii.devpmt.mineAllSwitch.toggleSwitch", {
    gradeNames: ["gpii.devpmt.mineAllSwitch.base"],
    templates: {
        initial: "editprefset-mineAllToggleSwitch-widget"
    },
    selectors: {
        allSettingsEnabledSwitch: ".pmt-all-settings-switch"
    },
    bindings: { // Binding selectors to model paths
        allSettingsEnabledSwitch: {
            selector: "allSettingsEnabledSwitch",
            path: "settingsFilter",
            rules: {
                domToModel: {
                    "": {
                        transform: {
                            type: "gpii.devpmt.mineAllSwitch.toggleSwitch.binderToValueInput",
                            inputPath: ""
                        }
                    }
                },
                modelToDom: {
                    "": {
                        transform: {
                            type: "gpii.devpmt.mineAllSwitch.toggleSwitch.valueInputToBinder",
                            inputPath: ""
                        }
                    }
                }
            }
        }
    }
});

fluid.defaults("gpii.devpmt.mineAllSwitch.toggleSwitch.valueInputToBinder", {
    gradeNames: ["fluid.standardTransformFunction"]
});

gpii.devpmt.mineAllSwitch.toggleSwitch.valueInputToBinder = function (value) {
    return value === "mysettings" ? value : "allsettings";
};

fluid.defaults("gpii.devpmt.mineAllSwitch.toggleSwitch.binderToValueInput", {
    gradeNames: ["fluid.standardTransformFunction"]
});

gpii.devpmt.mineAllSwitch.toggleSwitch.binderToValueInput = function (value) {
    return value.length > 0 ? "mysettings" : "allsettings";
};

fluid.defaults("gpii.devpmt.mineAllSwitch.buttonSwitch", {
    gradeNames: ["gpii.devpmt.mineAllSwitch.base"],
    templates: {
        initial: "editprefset-mineAllButtonSwitch-widget"
    },
    selectors: {
        mySettingsButton: ".pmt-mysettings-button",
        allSettingsButton: ".pmt-allsettings-button"
    },
    invokers: {
        setSettingsFilter: {
            funcName: "gpii.devpmt.mineAllSwitch.buttonSwitch.setSettingsFilter",
            args: ["{that}", "{editPrefs}", "{arguments}.0"]
        }
    },
    markupEventBindings: {
        mySettingsButton: {
            method: "click",
            args: ["mysettings", "{that}.setSettingsFilter"]
        },
        allSettingsButton: {
            method: "click",
            args: ["allsettings", "{that}.setSettingsFilter"]
        }
    }
});

gpii.devpmt.mineAllSwitch.buttonSwitch.setSettingsFilter = function (that, editPrefs, event) {
    that.applier.change("settingsFilter", event.data);
};

fluid.defaults("gpii.devpmt.mineAllSwitch.default", {
    // gradeNames: ["gpii.devpmt.mineAllSwitch.toggleSwitch"]
    gradeNames: ["gpii.devpmt.mineAllSwitch.buttonSwitch"]
});
