/**
 * Dialog boxes
 *
 * - addContextDialog Adds a preference set to a preferences safe
 * - editContextDialog Edits metadata for a preference set
 * - confirmDeleteContextDialog Confirms with the user before permanently
 *   removing a preference set from a safe
 * - confirmAddProductDialog After clicking a product to add to
 *   preference safe, confirms before actual insertion.
 * - confirmSaveDialog Shows a list of changes since last save, and
 *   confirms with the user before saving preference set.
 * - confirmRemoveProductDialog Confirms with the user before permanently
 *   removing a product from the preference safe.
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

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.dialogs");

/**
 * Add Preferences Set Context Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.addContextDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-addContext-dialog"
    },
    model: {
        contextId: "",
        contextToCopy: "",
        contextNames: [],
        fieldErrors: ""
    },
    selectors: {
        contextIdInput: "#pmt-add-context-name-input",
        contextToCopySelect: "#pmt-context-to-copy-select"
    },
    bindings: {
        contextIdInput: "contextId",
        contextToCopySelect: "contextToCopy"
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.addContextDialog.acceptConfirmDialog",
            args: ["{that}.model", "{that}.applier", "{that}.closeDialog", "{arguments}.0"]
        }
    },
    modelListeners: {
        "fieldErrors": {
            func: "{that}.reRender"
        }
    }
});

/**
 * Dialog for adding a new preference set (context) to a preferences safe (prefset).
 * Includes a dropdown that can be used to select a context to copy the
 * initial settings from.
 *
 * @param {Object} model - Model as defined in `gpii.devpmt.dialogs.addContextDialog`.
 * @param {ChangeApplier} applier - Change applier for model
 * @param {Function} closeDialog - Zero-arg function to close dialog
 * @param {DOMEvent} event - Browser event triggered by the accept button.
 */
gpii.devpmt.dialogs.addContextDialog.acceptConfirmDialog = function (model, applier, closeDialog, event) {
    // We don't want the form to actually submit the page, just to enable
    // activating the submit button on Enter
    event.preventDefault();

    // Validate context name, eventually this will be replaced with
    // our new json schema work.
    if (model.contextId === "") {
        applier.change("fieldErrors", "Please enter a name.");
        return;
    }
    else if (!/^\w+$/.exec(model.contextId)) {
        applier.change("fieldErrors", "Please use only alphanumeric characters.");
        return;
    }
    else {
        // In case we are revalidating on a subsequent attempt
        applier.change("fieldErrors", "");
    }

    // TODO validation to see if already exists, and determining
    // the valid set of strings a preference set ID can take
    var contextToCopy = model.contextToCopy;
    var path = "flatPrefs.contexts." + model.contextId;
    var newPrefSet = {};
    // The select contains a blank option to start with a fresh set of values.
    if (model.contextToCopy !== "" && model.flatPrefs.contexts[contextToCopy]) {
        newPrefSet = fluid.copy(model.flatPrefs.contexts[contextToCopy].preferences);
    }
    applier.change(path, {
        "name": model.contextId,
        "preferences": newPrefSet
    }, "ADD");
    closeDialog();
};

/**
 * Edit Preferences Set Context Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.editContextDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-editContext-dialog"
    },
    model: {
        // Store so that we can fetch the context to copy to a new ID
        originalContextId: "",
        contextId: "",
        contextIdErrors: "",
        contextName: "",
        contextNameErrors: "",
        flatPrefs: {} // For use in prefsetExists
    },
    selectors: {
        contextIdInput: "#pmt-edit-context-id-input",
        contextNameInput: "#pmt-edit-context-name-input"
    },
    bindings: {
        contextIdInput: "contextId",
        contextNameInput: "contextName"
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.editContextDialog.acceptConfirmDialog",
            args: ["{that}.model", "{that}.applier", "{that}.closeDialog", "{arguments}.0"]
        }
    },
    modelListeners: {
        "contextIdErrors": {
            func: "{that}.reRender"
        },
        "contextNameErrors": {
            func: "{that}.reRender"
        }
    }
});

gpii.devpmt.dialogs.editContextDialog.acceptConfirmDialog = function (model, applier, closeDialog, event) {
    // We don't want the form to actually submit the page, just to enable
    // activating the submit button on Enter
    event.preventDefault();

    // Validate context name, eventually this will be replaced with
    // our new json schema work.
    if (model.contextId === "") {
        applier.change("contextIdErrors", "Please enter an ID.");
        return;
    }
    // TODO standardize the accepted regular expression for prefset ID's
    // and other parts of the schema.
    else if (!/^[\w-]+$/.exec(model.contextId)) {
        applier.change("contextIdErrors", "Please use only alphanumeric characters.");
        return;
    }
    // If we changed the contextId, make sure that there isn't an existing context with
    // that ID
    else if (model.contextId !== model.originalContextId &&
             gpii.devpmt.prefsetExists(model.flatPrefs, model.contextId)) {
        applier.change("contextIdErrors", "A Preference Set with that ID already exists.");
        return;
    }
    else {
        // In case we are revalidating on a subsequent attempt
        applier.change("contextIdErrors", "");
    }

    if (model.contextName === "") {
        applier.change("contextNameErrors", "Please enter a name.");
        return;
    }
    else {
        // In case we are revalidating on a subsequent attempt
        applier.change("contextNameErrors", "");
    }

    var transaction = applier.initiate();
    var prefsetToEdit = fluid.copy(model.flatPrefs.contexts[model.originalContextId]);
    prefsetToEdit.name = model.contextName;
    var oldPath = "flatPrefs.contexts." + model.originalContextId;
    var path = "flatPrefs.contexts." + model.contextId;

    transaction.fireChangeRequest({
        path: oldPath,
        type: "DELETE"
    });

    transaction.fireChangeRequest({
        path: path,
        value: prefsetToEdit
    });

    transaction.commit();
    closeDialog();
};


/**
 * Confirm deletion of Preferences Set Context Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmDeleteContextDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmDeleteContext-dialog"
    },
    model: {
        contextId: "", // Should be populated/relayed during construction before showing dialog
        flatPrefs: {}
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmDeleteContextDialog.acceptConfirmDialog",
            args: ["{that}.closeDialog", "{gpii.devpmt.editPrefs}", "{that}.model.contextId"]
        }
    }
});

gpii.devpmt.dialogs.confirmDeleteContextDialog.acceptConfirmDialog = function (closeDialog, editPrefs, contextId) {
    closeDialog();
    // In the rare event that this contextId no longer exists in the preferences,
    // the worse case scenerio here is that the change applier operation will merely
    // do nothing.
    var path = "flatPrefs.contexts." + contextId;
    //TODO We want to use the local change applier for this operation and have the model Relay
    //push the DELETE back to the editPrefs component. However, the DELETE does not seem to be
    //propagating. Investigate more.
    editPrefs.applier.change(path, false, "DELETE");
};

/**
 * Add Product to Preferences Set Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmAddProductDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmAddProduct-dialog"
    },
    model: {
        appId: null,
        name: null, // Human Name of Product,
        allSolutions: null,
        contextNames: null
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmAddProductDialog.acceptConfirmDialog",
            args: ["{that}.closeDialog", "{that}.model.appId", "{gpii.devpmt.editPrefs}.model.allSolutions", "{gpii.devpmt.editPrefs}.model.contextNames", "{gpii.devpmt.editPrefs}.editProductEnabled"]
        }
    }
});

/**
 * Clicking Add on the Product Dialog adds this product to the preference set.
 * A preference safe must have at least one context (prefset) in order to add
 * a product to it.
 *
 * @param {Function} closeDialog - Zero-arg function to close the dialog window.
 * @param {Object} that - Dialog instance
 * @param {String} appId - String indicating the appId
 *                                     ex. http://registry.gpii.net/applications/com.android.freespeech
 * @param {Object} solutions - Solutions registry entries.
 * @param {Array} contextNames - Array of Strings with the name/id the context is
 * keyed by. The product will be initially added to the first item in this array.
 * @param {Function} editProductEnabled - Invoker from `gpii.devpmt.editPrefs` to add the
 * product to.
 */
gpii.devpmt.dialogs.confirmAddProductDialog.acceptConfirmDialog = function (closeDialog, appId, allSolutions, contextNames, editProductEnabled) {
    // In this case we actually need to close the dialog first... as the page
    // rerenders based on a model listener when the product is enabled, and does
    // wonky things... such as removing the ability to vertical scroll. Should look
    // at reworking this perhaps.
    closeDialog();
    // It's unlikely that this dialog could have been instantiated with an appId not from
    // the list, but in any event, if the appId is not in the solutions listing, we will
    // return here.
    if (!allSolutions[appId]) {
        return;
    }
    // TODO Ontology!!!
    var appUrl = "http://registry.gpii.net/applications/" + appId;
    if (contextNames.length > 0) {
        editProductEnabled(true, contextNames[0],  appUrl);
    }
};

/**
 * Confirm Preferences Set Save Dialog
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
            args: ["{that}.closeDialog", "{gpii.devpmt.editPrefs}.savePrefset"]
        }
    }
});

gpii.devpmt.dialogs.confirmSaveDialog.acceptConfirmDialog = function (closeDialog, saveFunc) {
    saveFunc();
    closeDialog();
};


/**
 * Confirm Removing Product Dialog
 */
fluid.defaults("gpii.devpmt.dialogs.confirmRemoveProductDialog", {
    gradeNames: ["gpii.devpmt.dialogs.confirmDialog"],
    templates: {
        initial: "editprefset-confirmRemoveProduct-dialog"
    },
    model: {
        appId: "",
        name: "",
        product: "",
        context: ""
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.confirmRemoveProductDialog.acceptConfirmDialog",
            args: ["{that}.closeDialog", "{that}.model.context", "{that}.model.product", "{gpii.devpmt.editPrefs}.editProductEnabled"]
        }
    }
});

gpii.devpmt.dialogs.confirmRemoveProductDialog.acceptConfirmDialog = function (closeDialog, context, product, editProductEnabled) {
    closeDialog();
    editProductEnabled(false, context, product);
};
