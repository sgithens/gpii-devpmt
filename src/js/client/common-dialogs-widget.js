/**
 * Common Dialog Widgets
 *
 * Contains dialog widgets that can be used for routine confirmation
 * messages and building more complex widgets for tasks such as
 * adding products and saving preference sets.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global Foundation */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt.dialogs");

/**
 * DevPMT Base Dialog
 *
 * Creates the simplest dialog, currently based on the foundation
 * modal dialog. Can be inherited to create more complex dialogs.
 */
fluid.defaults("gpii.devpmt.dialogs.baseDialog", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    templates: {
        initial: "common-dialog-widget"
    },
    model: {},
    invokers: {
        openDialog: {
            funcName: "gpii.devpmt.dialogs.baseDialog.openDialog",
            args: ["{that}", "{that}.dom.dialogContainer"]
        },
        closeDialog: {
            funcName: "gpii.devpmt.dialogs.baseDialog.closeDialog",
            args: ["{that}.dom.dialogContainer"]
        }
    },
    selectors: {
        dialogContainer: "#pmt-dialog-container"
    },
    listeners: {
        "onMarkupRendered.openDialog": {
            func: "{that}.openDialog"
        }
    },
    events: {
        // Sometimes foundation can move around the markup for the
        // dialog to float it, etc. and we can lose event bindings.
        // This allows activity to happen immediately after the dialog
        // is opened.
        afterOpenDialog: null
    }
});

gpii.devpmt.dialogs.baseDialog.openDialog = function (that, dialogContainer) {
    /* eslint-disable no-new */
    // This foundation plugin requires using the `new` operator to work.
    new Foundation.Reveal(dialogContainer, {
        appendTo: that.options.selectors.initial
    });
    /* eslint-enable no-new */
    dialogContainer.on("closed.zf.reveal", function () {
        that.destroy();
    });
    dialogContainer.foundation("open");
    that.events.afterOpenDialog.fire();
};

gpii.devpmt.dialogs.baseDialog.closeDialog = function (dialogContainer) {
    dialogContainer.foundation("close");
};

/**
 * DevPMT Confirmation Dialog
 *
 * Suitable dialog for performing actions that require either an
 * 'accept' or 'cancel' type answer.
 *
 * To create confirmation dialogs, inherit from this grade. Then the
 * following items need to be overriden:
 *
 * - Create a handlebars template in the standard partials area
 * - Override the `templates.initial` option with that template.
 * - The template need only retain the class names for the open
 *   and close buttons in this grades selectors, to allow wiring.
 * - You can optionally override the `acceptConfirmDialog` and
 *   `cancelConfirmDialog` invokers with custom behavior, and
 *   then close the dialog if your processing is successful.
 */
fluid.defaults("gpii.devpmt.dialogs.confirmDialog", {
    gradeNames: ["gpii.devpmt.dialogs.baseDialog"],
    templates: {
        initial: "common-confirm-dialog-widget"
    },
    selectors: {
        acceptButton: ".pmt-confirm-dialog-button",
        cancelButton: ".pmt-cancel-dialog-button"
    },
    events: {
        acceptConfirmDialog: null,
        cancelConfirmDialog: null
    },
    listeners: {
        "afterOpenDialog.bindAcceptButton": {
            "this": "{that}.dom.acceptButton",
            "method": "click",
            args: ["{that}.events.acceptConfirmDialog.fire"]
        },
        "afterOpenDialog.bindCancelButton": {
            "this": "{that}.dom.cancelButton",
            "method": "click",
            args: ["{that}.events.cancelConfirmDialog.fire"]
        },
        // This closes the dialog after any other listeners have acted,
        // upon and processed the results of the dialog. Because of how
        // the foundation unbinds the selector, it has the result of also
        // causing the dialog component to be destroyed. Some dialogs have
        // the need to actually close the dialog before they finish processing
        // the results to make the screen render cleanly. In that case, this
        // listener won't actually be called at all as the the component will
        // be destroyed. For most cases though, the dialog can perform it's work
        // in another namespaced listener, and then this will clean it up.
        "acceptConfirmDialog.closeDialog": {
            func: "{that}.closeDialog",
            priority: "last"
        },
        "cancelConfirmDialog.closeDialog": {
            func: "{that}.closeDialog"
        }
    }
});
