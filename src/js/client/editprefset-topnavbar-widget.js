/*
 * editprefset-topnavbar-widget
 *
 * Widget for the top bar when editing a prefset. Includes information such
 * as the prefset currently being edited, and icons for toggling devmode and
 * saving the prefset.
 */
"use strict";

fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.topNavBar");

/**
 * Top Navigation Bar Fluid View Component
 */
fluid.defaults("gpii.devpmt.topNavBar", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    model: {
        // Typically these will all have model relay linkages to the main editPrefs component
        npsetName: "",
        devModeOn: false,
        unsavedChangesExist: false
    },
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        reRender: {
            func: "{that}.events.refresh.fire"
        }
    },
    templates: {
        initial: "editprefset-topnavbar-widget"
    },
    selectors: {
        topbarSaveButton: "#pmt-topbar-save-button", // Button on topbar to open Preview/Confirm Save Dialog
        devModeIcon: "#pmt-topbar-devmode-button"
    },
    listeners: {
        "onMarkupRendered": [
            {
                "this": "{that}.dom.topbarSaveButton",
                "method": "click",
                args: ["{gpii.devpmt.editPrefs}.events.openConfirmSaveDialog.fire"]
            },
            {
                "this": "{that}.dom.devModeIcon",
                "method": "click",
                args: ["{gpii.devpmt.editPrefs}.toggleDevModeView"]
            }
        ]
    },
    modelListeners: {
        "*": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    }
});
