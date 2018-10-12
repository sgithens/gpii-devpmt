"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt.prefSettingAdjuster");


/*
 * The following transform functions, valueInputToBinder and binderToValueInput
 * sync the value being edited from our model to the adjust controler, and in
 * this situation take in to account the semantics for binding boolean values by
 * looking at the metadata schema of the term currently being edited, and if it
 * is boolean applying that semantic.
 *
 * At the moment these are looking up the prefSettingAdjuster component manually,
 * and should be changed to the correct way to set those values, and also prepare
 * for a future where there is more than one instance of a pref adjuster at a time
 * on a page.  They should really just be subcomponents on the prefSettingAdjuster
 * component, and be able to look at the item currently being edited to apply the
 * correct semantics. (Which could be even more complex in the future, at the moment
 * we only handle very simple types.)
 */

fluid.defaults("gpii.devpmt.prefSettingAdjuster.valueInputToBinder", {
    gradeNames: ["fluid.standardTransformFunction", "fluid.multiInputTransformFunction"],
    inputVariables: {
        schema: null
    }
});

gpii.devpmt.prefSettingAdjuster.valueInputToBinder = function (value, options) {
    var schema = options.schema().model.metadata.schema;
    if (schema.type === "boolean") {
        return value ? ["on"] : [];
    }
    else {
        return value;
    }
};

fluid.defaults("gpii.devpmt.prefSettingAdjuster.binderToValueInput", {
    gradeNames: ["fluid.standardTransformFunction", "fluid.multiInputTransformFunction"],
    inputVariables: {
        schema: null
    }
});

gpii.devpmt.prefSettingAdjuster.binderToValueInput = function (value, options) {
    var schema = options.schema().model.metadata.schema;
    if (schema.type === "boolean") {
        return value.length > 0;
    }
    else {
        return value;
    }
};

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
    gradeNames: ["gpii.devpmt.viewComponent"],
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
        // initial: "#pmt-prefsAdjuster",
        okButton: ".pmt-ok-button",
        cancelButton: ".pmt-cancel-button",
        valueInput: "#pmt-new-value",
        blankCheckbox: "#pmt-blank-value"
    },
    bindings: { // Binding selectors: modelPaths
        blankCheckbox: {
            selector: "blankCheckbox",
            path: "current.blank",
            rules: gpii.devpmt.booleanBinderRules
        },
        valueInput: {
            selector: "valueInput",
            path: "current.value",
            rules: {
                domToModel: {
                    "": {
                        transform: {
                            type: "gpii.devpmt.prefSettingAdjuster.binderToValueInput",
                            inputPath: "",
                            schema: "{that}"
                        }
                    }
                },
                modelToDom: {
                    "": {
                        transform: {
                            type: "gpii.devpmt.prefSettingAdjuster.valueInputToBinder",
                            inputPath: "",
                            schema: "{that}"
                        }
                    }
                }
            }
        }
    },
    templates: {
        initial: "editprefset-prefSettingAdjuster-widget"
    },
    invokers: {
        saveUpdateValue: {
            funcName: "gpii.devpmt.prefSettingAdjuster.saveUpdateValue",
            args: ["{that}", "{editPrefs}"]
        },
        cancelEditing: {
            funcName: "gpii.devpmt.prefSettingAdjuster.cancelEditing",
            args: ["{that}"]
        },
        watchInputKeys: {
            funcName: "gpii.devpmt.prefSettingAdjuster.watchInputKeys",
            args: ["{that}", "{arguments}.0"]
        },
        updateBlankDisabling: {
            funcName: "gpii.devpmt.prefSettingAdjuster.updateBlankDisabling",
            args: ["{that}"]
        }
    },
    markupEventBindings: {
        okButton: {
            method: "click",
            args: "{that}.saveUpdateValue"
        },
        cancelButton: {
            method: "click",
            args: "{that}.cancelEditing"
        },
        valueInput: {
            method: "keypress",
            args: "{that}.watchInputKeys"
        }
    },
    listeners: {
        onMarkupRendered: [{
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
gpii.devpmt.prefSettingAdjuster.updateBlankDisabling = function (that) {
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
gpii.devpmt.prefSettingAdjuster.watchInputKeys = function (that, e) {
    // Save the value when the enter key is pressed
    if (e.keyCode === 13) {
        that.saveUpdateValue();
    };
};

/**
 * Save/Update using the value the user has input. This is
 * typically caused by clicking the Ok button.
 */
gpii.devpmt.prefSettingAdjuster.saveUpdateValue = function (that, devpmt) {
    that.applier.change("active", false);
    var segs = ["contexts", that.model.current.context, "preferences"];
    if (that.model.current.product) {
        segs.push(that.model.current.product.replace(/\./g, "\\."), that.model.current.term.replace(/\./g, "\\."));
    }
    else {
        segs.push(that.model.current.term.replace(/\./g, "\\."));
    }
    var path = ["flatPrefs"].concat(segs).join(".");
    // If the `blank` checkbox is ticked than we are actually going
    // to delete this key, rather than update it.
    if (that.model.current.blank) {
        devpmt.applier.change(path, false, "DELETE");
        devpmt.addEditToUnsavedList("Removed setting " + that.model.metadata.name +
                " in context " + that.model.current.context);
    }
    else {
        var newValue = that.model.current.value; //that.dom.locate("valueInput").val();
        devpmt.applier.change(path, newValue);
        devpmt.addEditToUnsavedList("Changed setting " + that.model.metadata.name +
                " in context " + that.model.current.context + " to " + newValue);
    }
    // In the event that we didn't actually change any values, the model listener
    // won't rerender the entire page.
    that.renderInitialMarkup();
    // Remove the active editing highlight
    $(".pmt-value-display").removeClass("pmt-value-editing");
};

/**
 * Cancel any editing that has been done, and turn the active editing
 * portion of the widget off.
 */
gpii.devpmt.prefSettingAdjuster.cancelEditing = function (that) {
    that.applier.change("active", false);
    // In the event that we didn't actually change any values, the model listener
    // won't rerender the entire page.
    that.renderInitialMarkup();
    // Remove the active editing highlight
    $(".pmt-value-display").removeClass("pmt-value-editing");
};
