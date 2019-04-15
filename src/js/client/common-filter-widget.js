/**
 * Common Filter Widget
 *
 * A GPII Handlebars component to build a filter widget of the
 * type you would type in to filter something like a list of API
 * functions, a table of settings, or anything else really.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.tx
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.filterWidget");

fluid.defaults("gpii.devpmt.filterWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        filterText: null
    },
    bindings: { // Binding selectors: modelPaths
        filterInput: "filterText"
    },
    selectors: {
        filterInput: ".pmt-filter-input",
        resetButtonGroup: ".pmt-reset-button-group",
        resetButton: ".pmt-reset-button"
    },
    templates: {
        initial: "common-filter-widget"
    },
    invokers: {
        clearFilter: {
            funcName: "gpii.devpmt.filterWidget.clearFilter",
            args: ["{that}"]
        },
        updateResetButton: {
            funcName: "gpii.devpmt.filterWidget.updateResetButton",
            args: ["{that}", "{that}.model.filterText", "{that}.dom.resetButtonGroup"]
        },
        watchInputKeys: {
            funcName: "gpii.devpmt.filterWidget.watchInputKeys",
            args: ["{that}", "{arguments}.0"]
        }
    },
    markupEventBindings: {
        filterInput: {
            method: "keyup",
            args: "{that}.watchInputKeys"
        },
        resetButton: {
            method: "click",
            args: "{that}.clearFilter"
        }
    },
    listeners: {
        "onMarkupRendered.updateResetButton": {
            "func": "{that}.updateResetButton"
        }
    },
    modelListeners: {
        "filterText": {
            func: "{that}.updateResetButton"
        }
    }
});

/**
 * Clear Filter. The filter can be cleared typically by pressing the X button
 * the right of the field, the ESC key, or anything else bound to this function.
 */
gpii.devpmt.filterWidget.clearFilter = function (that) {
    that.applier.change("filterText", "");
};

/**
 * Update Reset Button
 * The button to the right of the input field text is the reset button.
 * It should only be visible when there is some current text in the filter
 * to be reset.
 */
gpii.devpmt.filterWidget.updateResetButton = function (that, filterText, resetButtonGroup) {
    if (filterText === "") {
        that.dom.locate("filterInput").removeClass("pmt-filter-active");
        resetButtonGroup.hide();
    }
    else {
        that.dom.locate("filterInput").addClass("pmt-filter-active");
        resetButtonGroup.show();
    }
};

gpii.devpmt.filterWidget.watchInputKeys = function (that, e) {
    // Clear the filter when the ESC key is pushed.
    if (e.keyCode === 27) {
        that.clearFilter();
    };
};
