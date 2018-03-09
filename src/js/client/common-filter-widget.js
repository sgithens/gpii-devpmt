/**
 * Filter Widget
 *
 * A GPII Handlebars component to build a filter widget of the
 * type you would type in to filter something like a list of API
 * functions, a table of settings, or anything else really.
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.filterWidget");

fluid.defaults("gpii.devpmt.filterWidget", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    model: {
        filterText: null
    },
    bindings: { // Binding selectors: modelPaths
        filterInput: "filterText"
    },
    selectors: {
        filterInput: ".filter-input",
        resetButtonGroup: ".reset-button-group",
        resetButton: ".reset-button"
    },
    templates: {
        initial: "common-filter-widget"
    },
    invokers: {
        clearFilter: {
            funcName: "gpii.devpmt.filterWidget.clearFilter",
            args: ["{that}"]
        },
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
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
    listeners: {
        onMarkupRendered: [
            {
                "this": "{that}.dom.filterInput",
                "method": "keyup",
                args: ["{that}.watchInputKeys"]
            },
            {
                "this": "{that}.dom.resetButton",
                "method": "click",
                args: ["{that}.clearFilter"]
            },
            {
                "func": "{that}.updateResetButton"
            }
        ]
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
    // For some reason just updating the model isn't updating the bound field.
    that.dom.locate("filterInput").val("");
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
    // Save the value when the enter key is pressed
    if (e.keyCode === 27) {
        that.clearFilter();
    };
};
