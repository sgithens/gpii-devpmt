"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * A gpii handlebars widget to create the adjuster for the
 * sidebar editing widget of the DevPMT.
 *
 * Each component will be constructed using the metadata
 * object for the preference, which at a bare minimum should
 * have a "title" entry and "schema" entry, the later which is
 * a JSON schema that will be used to construct the widget
 * layout and validate it's input.
 *
 * TODO A number of the html ID's and selectors on this need to be
 * fixed up so that we can have more than one of them on a page
 * at the same time.
 */
fluid.defaults("gpii.devpmt.prefSettingAdjuster", {
    gradeNames: ["gpii.handlebars.templateAware"],
    model: {
        active: false,
        current: {
            context: "",
            term: "",
            value: "",
            product: ""
        },
        metadata: {
            name: "ForegroundColor",
            description: "",
            schema: {
                type: "string"
            }
        }
    },
    selectors: {
        initial: "#prefsAdjuster",
        okButton: ".ok-button",
        valueInput: "#new-value",
        blankCheckbox: "#blank-value"
    },
    templates: {
        initial: "prefSettingAdjuster-widget"
    },
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        okButtonClicked: {
            funcName: "console.log",
            args: ["Ok Button Clicked", "{that}.model.metadata.name"]
        },
        saveUpdateValue: {
            funcName: "gpii.devpmt.saveUpdateValue",
            args: ["{that}", "{editPrefs}"]
        }
    },
    listeners: {
        onMarkupRendered: {
            "this": "{that}.dom.okButton",
            "method": "click",
            args: ["{that}.saveUpdateValue"]
        }
    },
    modelListeners: {
        "active": [{
            funcName: "console.log",
            args: ["Changed active: ", "{that}.model.active"]
        }]
    }
});

/**
 * Save/Update using the value the user has input. This is
 * typically caused by clicking the Ok button.
 */
gpii.devpmt.saveUpdateValue = function (that, devpmt) {
    var segs = ["contexts", that.model.current.context, "preferences"];
    if (that.model.current.product) {
        segs.push(that.model.current.product.replace(/\./g, "\\."), that.model.current.term.replace(/\./g, "\\."));
    }
    else {
        segs.push(that.model.current.term.replace(/\./g, "\\."));
    }
    var path = "flatPrefs";
    fluid.each(segs, function (item) { path += "." + item; });
    // If the `blank` checkbox is ticked than we are actually going
    // to delete this key, rather than update it.
    if (that.dom.locate("blankCheckbox").prop("checked")) {
        devpmt.applier.change(path, false, "DELETE");
    }
    else {
        if (that.model.metadata.schema.type === "boolean") {
            devpmt.applier.change(path, that.dom.locate("valueInput").prop("checked"));
        }
        else {
            devpmt.applier.change(path, that.dom.locate("valueInput").val());
        }
    }
    devpmt.renderInitialMarkup();
};
