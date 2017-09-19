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
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    model: {
        active: false,
        current: {
            context: "",
            term: "",
            value: "",
            product: "",
            blank: false
        },
        metadata: {
            name: "ForegroundColor",
            description: "",
            schema: {
                type: "string"
            }
        },
        devModeOn: false
    },
    selectors: {
        initial: "#prefsAdjuster",
        okButton: ".ok-button",
        valueInput: "#new-value",
        blankCheckbox: "#blank-value"
    },
    bindings: { // Binding selectors: modelPaths
        blankCheckbox: {
            selector: "blankCheckbox",
            path: "current.blank",
            rules: gpii.devpmt.booleanBinderRules
        },
        valueInput: "current.value"
    },
    templates: {
        initial: "editprefset-prefSettingAdjuster-widget"
    },
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        saveUpdateValue: {
            funcName: "gpii.devpmt.saveUpdateValue",
            args: ["{that}", "{editPrefs}"]
        },
        watchInputKeys: {
            funcName: "gpii.devpmt.watchInputKeys",
            args: ["{that}", "{arguments}.0"]
        },
        updateBlankDisabling: {
            funcName: "gpii.devpmt.updateBlankDisabling",
            args: ["{that}"]
        }
    },
    listeners: {
        onMarkupRendered: [{
            "this": "{that}.dom.okButton",
            "method": "click",
            args: ["{that}.saveUpdateValue"]
        },
        {
            "this": "{that}.dom.valueInput",
            "method": "keypress",
            args: ["{that}.watchInputKeys"]
        },
        {
            funcName: "fluid.focus",
            args: ["{that}.dom.valueInput"]
        },
        {
            func: "{that}.updateBlankDisabling"
        }]
    },
    modelListeners: {
        "current.blank": {
            func: "{that}.updateBlankDisabling"
        }
    }
});

/**
 * Updates the UI based on whether Blank is selected.
 * If blank is selected, then the rest of the editing
 * apparatus is disabled.
 */
gpii.devpmt.updateBlankDisabling = function (that) {
    var disable = that.model.current.blank;
    that.dom.locate("valueInput").prop("disabled", disable);
};

/**
 * watchInputKeys - Watches value input and saves
 * on Enter.
 *
 * @param (Object) that - prefSettingAdjuster
 * @param (Object) e - jQuery Event
 */
gpii.devpmt.watchInputKeys = function (that, e) {
    // Save the value when the enter key is pressed
    if (e.keyCode === 13) {
        that.saveUpdateValue();
    };
};

/**
 * Save/Update using the value the user has input. This is
 * typically caused by clicking the Ok button.
 */
gpii.devpmt.saveUpdateValue = function (that, devpmt) {
    that.applier.change("active", false);
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
    if (that.model.current.blank) {
        devpmt.applier.change(path, false, "DELETE");
        devpmt.addEditToUnsavedList("Removed setting " + that.model.metadata.name +
                " in context " + that.model.current.context);
    }
    else {
        var newValue = "";
        if (that.model.metadata.schema.type === "boolean") {
            newValue = gpii.devpmt.binderBooleanFalse(that.model.current.value); //that.dom.locate("valueInput").prop("checked");
        }
        else {
            newValue = that.model.current.value; //that.dom.locate("valueInput").val();
        }
        devpmt.applier.change(path, newValue);
        devpmt.addEditToUnsavedList("Changed setting " + that.model.metadata.name +
                " in context " + that.model.current.context + " to " + newValue);
    }
    // In the event that we didn't actually change any values, the model listener
    // won't rerender the entire page.
    that.renderInitialMarkup();
};
