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
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        // Typically these will all have model relay linkages to the main editPrefs component
        npsetName: "",
        devModeOn: false,
        unsavedChangesExist: false
    },
    templates: {
        initial: "editprefset-topnavbar-widget"
    },
    selectors: {
        topbarSaveButton: "#pmt-topbar-save-button", // Button on topbar to open Preview/Confirm Save Dialog
        devModeIcon: "#pmt-topbar-devmode-button",
        topbarDownloadButton: "#pmt-topbar-download-button"
    },
    markupEventBindings: {
        topbarSaveButton: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.events.openConfirmSaveDialog.fire"
        },
        topbarDownloadButton: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.downloadPrefset"
        },
        devModeIcon: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.toggleDevModeView"
        }
    },
    modelListeners: {
        "*": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    }
});
