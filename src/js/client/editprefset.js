"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

fluid.defaults("gpii.devpmt.editPrefs", {
    gradeNames: ["gpii.handlebars.templateAware"],
    mergePolicy: {
        allSolutions: "noexpand",
        commonTerms: "noexpand"
    },
    model: {
        flatPrefs: {},
        commonTerms: [],
        contextNames: [],
        npsetApplications: [],
        allSolutions: {}
    },
    components: {
        prefsAdjuster: {
            type: "gpii.devpmt.prefSettingAdjuster",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsAdjusterContainer",
            options: {
                selectors: {
                    initial: "#prefs-adjuster"
                }
            }
        }
    },
    selectors: {
        initial: "#editprefset-viewport",
        editWidgetSidebar: "#editwidget-sidebar",
        prefsAdjusterContainer: "#prefs-adjuster-container",
        valueDisplayCell: ".pmt-value-display",
        enabledBooleanInputs: ".pmt-enabled-boolean",
        saveButton: ".pmt-save-button"
    },
    templates: {
        initial: "editprefset-viewport",
        editPrefWidget: "editpref-widget"
    },
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        renderEditSidebar: {
            func: "{that}.renderMarkup",
            args: ["editWidgetSidebar", "{that}.options.templates.editPrefWidget", "{arguments}.0"]
        },
        editValueEvent: {
            funcName: "gpii.devpmt.editValueEvent",
            args: ["{that}", "{arguments}.0"]
        },
        editProductEnabled: {
            funcName: "gpii.devpmt.editProductEnabled",
            args: ["{that}", "{arguments}.0"]
        },
        savePrefset: {
            funcName: "gpii.devpmt.savePrefset",
            args: ["{that}" /*, "{arguments}.0" */]
        }
    },
    listeners: {
        "onCreate": {
            funcName: "gpii.devpmt.npsetInit",
            args: ["{that}"] //"onCreate listener"]
        },
        "onMarkupRendered": [
            {
                "this": "{that}.dom.valueDisplayCell",
                "method": "click",
                args: ["{that}.editValueEvent"]
            },
            {
                "this": "{that}.dom.enabledBooleanInputs",
                "method": "click",
                args: ["{that}.editProductEnabled"]
            },
            {
                "this": "{that}.dom.saveButton",
                "method": "click",
                args: ["{that}.savePrefset"]
            }
        ]
    }
});

gpii.devpmt.savePrefset = function (that /*, event */) {
    var options = {
        method: "POST",
        contentType: "application/json",
        url: "/saveprefset/" + that.model.npsetName,
        data: JSON.stringify({ flat: that.model.flatPrefs }, null, 4)
    };
    $.ajax(options);
};

gpii.devpmt.editProductEnabled = function (that, event) {
    var checked = event.currentTarget.checked;
    var context = event.currentTarget.dataset.context;
    var product = event.currentTarget.dataset.product;

    // TODO generalize these 4 lines with copied code in editwidgets.js:saveUpdateValue
    var segs = ["contexts", context, "preferences", product.replace(/\./g, "\\.")];
    var path = "flatPrefs";
    fluid.each(segs, function (item) { path += "." + item; });

    if (checked) {
        // Add a check in case it's already enabled
        that.applier.change(path, {});
    }
    else {
        that.applier.change(path, false, "DELETE");
    }
    that.applier.change("npsetApplications", gpii.devpmt.npsetApplications(that.model.flatPrefs));
    that.renderInitialMarkup();
};

gpii.devpmt.editValueEvent = function (that, event) {
    var newCurrent = {
        context: event.currentTarget.dataset.context,
        term: event.currentTarget.dataset.term,
        value: event.currentTarget.dataset.value,
        product: event.currentTarget.dataset.product
    };
    that.prefsAdjuster.applier.change("current", newCurrent);

    var newMetadata = {};
    if (!newCurrent.product) {
        // Application Specific
        newMetadata = that.options.commonTerms[newCurrent.term];
    }
    else {
        // Common Term
        newMetadata = {
            name: event.currentTarget.dataset.name,
            description: "",
            schema: {
                type: "string"
            }
        };
    }
    that.prefsAdjuster.applier.change("metadata", newMetadata);
    that.prefsAdjuster.applier.change("active", true);
    that.prefsAdjuster.renderInitialMarkup();
    // https://github.com/zurb/foundation-sites/issues/7899
    //        $('.sticky').foundation('_calc', true);
};


/**
 * Temporary workaround until we set up an ajax feed for these. The server
 * side template is rendering the transformed preferences in another script
 * element at the top of the page.
 */
gpii.devpmt.npsetInit = function (that) {
    // Should use change applier
    that.model.flatPrefs = that.options.npset.options.flatPrefs;
    that.model.commonTerms = that.options.commonTerms;
    that.model.contextNames = gpii.devpmt.contextNames(that.options.npset.options.flatPrefs);
    that.model.npsetApplications = gpii.devpmt.npsetApplications(that.options.npset.options.flatPrefs);
    that.model.docs = that.options.npset.options.docs;
    that.model.npsetName = that.options.npset.options.npsetName;
    that.model.allSolutions = that.options.allSolutions;

    // Debugging so this component is available in the console
    var editPrefs = fluid.queryIoCSelector(fluid.rootComponent, "gpii.devpmt.editPrefs")[0];
    fluid.setGlobalValue("editPrefs", editPrefs);
};
