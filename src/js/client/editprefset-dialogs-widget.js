/**
 * Dialog boxes for the DevPTT.
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.dialogs");

/**
 * Add NP Set Context Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.addContextDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    templates: {
        initial: "editprefset-addContext-dialog"
    },
    model: {
        contextId: ""
    },
    selectors: {
        contextIdInput: "#pmt-add-context-name-input"
    },
    bindings: {
        contextIdInput: "contextId"
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.addContextDialog.acceptConfirmDialog",
            args: ["{that}", "{gpii.devpmt.editPrefs}"]
        }
    }
});

gpii.devpmt.dialogs.addContextDialog.acceptConfirmDialog = function (that, editPrefs) {
    that.closeDialog();
    // TODO validation to see if already exists, and determining
    // the valid set of strings a context ID can take
    var path = "flatPrefs.contexts." + that.model.contextId;
    editPrefs.applier.change(path, {
        "name": that.model.contextId,
        "preferences": {}
    }, "ADD");

};

/**
 * Add Product to NP Set Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmAddProductDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmAddProduct-dialog"
    },
    model: {
        appId: null,
        name: null // Human Name of Product
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmAddProductDialog.acceptConfirmDialog",
            args: ["{that}", "{that}.model.appId", "{gpii.devpmt.editPrefs}.editProductEnabled"]
        }
    }
});

gpii.devpmt.dialogs.confirmAddProductDialog.acceptConfirmDialog = function (that, appId, editProductEnabled) {
    // In this case we actually need to close the dialog first... as the page
    // rerenders based on a model listener when the product is enabled, and does
    // wonky things... such as removing the ability to vertical scroll. Should look
    // at reworking this perhaps.
    that.closeDialog();
    // TODO Ontology!!!
    var appUrl = "http://registry.gpii.net/applications/" + appId;
    editProductEnabled(true, "gpii-default",  appUrl);
};

/**
 * Confirm NP Set Save Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmSaveDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmSave-dialog"
    },
    model: {
        unsavedChanges: []
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmSaveDialog.acceptConfirmDialog",
            args: ["{that}", "{gpii.devpmt.editPrefs}.savePrefset"]
        }
    }
});

gpii.devpmt.dialogs.confirmSaveDialog.acceptConfirmDialog = function (that, saveFunc) {
    saveFunc();
    that.closeDialog();
};
