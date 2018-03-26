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
 * Confirm deletion of NP Set Context Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmDeleteContextDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmDeleteContext-dialog"
    },
    model: {
        contextId: "" // Should be populated/relayed during construction before showing dialog
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmDeleteContextDialog.acceptConfirmDialog",
            args: ["{that}", "{gpii.devpmt.editPrefs}", "{that}.model.contextId"]
        }
    }
});

gpii.devpmt.dialogs.confirmDeleteContextDialog.acceptConfirmDialog = function (that, editPrefs, contextId) {
    that.closeDialog();
    var path = "flatPrefs.contexts." + contextId;
    editPrefs.applier.change(path, false, "DELETE");
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
            args: ["{that}", "{that}.model.appId", "{gpii.devpmt.editPrefs}.model.contextNames", "{gpii.devpmt.editPrefs}.editProductEnabled"]
        }
    }
});

/**
 * Clicking Add on the Product Dialog adds this product to the preference set.
 * A preference safe must have at least one context (prefset) in order to add
 * a product to it.
 *
 * @param  {Object} that               Dialog instance
 * @param  {String} appId              String indicating the appId
 *                                     ex. http://registry.gpii.net/applications/com.android.freespeech
 * @param  {Array} contextNames        Array of Strings with the name/id the context is
 *                                     keyed by. The product will be initially added to the first
 *                                     item in this array.
 * @param  {Function} editProductEnabled Invoker from `gpii.devpmt.editPrefs` to add the
 *                                       product to.
 */
gpii.devpmt.dialogs.confirmAddProductDialog.acceptConfirmDialog = function (that, appId, contextNames, editProductEnabled) {
    // In this case we actually need to close the dialog first... as the page
    // rerenders based on a model listener when the product is enabled, and does
    // wonky things... such as removing the ability to vertical scroll. Should look
    // at reworking this perhaps.
    that.closeDialog();
    // TODO Ontology!!!
    var appUrl = "http://registry.gpii.net/applications/" + appId;
    if (contextNames.length > 0) {
        editProductEnabled(true, contextNames[0],  appUrl);
    }
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
