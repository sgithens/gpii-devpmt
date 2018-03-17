/* global Foundation */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
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
            args: ["{that}", "{that}.dom.dialogContainer"]
        }
    },
    selectors: {
        dialogContainer: "#dialog-container"
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
    var elem = new Foundation.Reveal(dialogContainer, {
        appendTo: that.options.selectors.initial
    });
    dialogContainer.on("closed.zf.reveal", function () {
        that.destroy();
    });
    dialogContainer.foundation("open");
    that.events.afterOpenDialog.fire();
};

gpii.devpmt.dialogs.baseDialog.closeDialog = function (that, dialogContainer) {
    dialogContainer.foundation("close");
};

/**
 * DevPMT Confirmation Dialog
 *
 * Suitable dialog for performing actions that require either an
 * 'accept' or 'cancel' type answer. Such as adding a product to
 * an NP Set, deleting a context from an NP Set, etc.
 *
 * To create confirmation dialogs, inherit this grade. Then the
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
        acceptButton: ".confirm-dialog-button",
        cancelButton: ".cancel-dialog-button"
    },
    invokers: {
        acceptConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.acceptConfirmDialog",
            args: ["{that}"]
        },
        cancelConfirmDialog: {
            funcName: "gpii.devpmt.dialogs.cancelConfirmDialog",
            args: ["{that}"]
        }
    },
    listeners: {
        "afterOpenDialog": [
            {
                "this": "{that}.dom.acceptButton",
                "method": "click",
                args: ["{that}.acceptConfirmDialog"]
            },
            {
                "this": "{that}.dom.cancelButton",
                "method": "click",
                args: ["{that}.cancelConfirmDialog"]
            }
        ]
    }
});

gpii.devpmt.dialogs.acceptConfirmDialog = function (that) {
    that.closeDialog();
};

gpii.devpmt.dialogs.cancelConfirmDialog = function (that) {
    that.closeDialog();
};
