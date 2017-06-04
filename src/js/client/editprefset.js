"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * Edit Prefs is the main component for driving the page editing
 * a preference set.
 */
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
        allSolutions: {},
        unsavedChangesExist: false,
        unsavedChanges: [],

        settingsFilter: "allsettings",
        settingsSearch: "",
        productsFilter: "allproducts",
        productsSearch: ""
    },
    components: {
        productList: {
            type: "gpii.devpmt.productListWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.productListContainer",
            options: {
                selectors: {
                    initial: "#productList-widget"
                },
                model: {
                    allSolutionsSorted: "{gpii.devpmt.editPrefs}.model.allSolutionsSorted"
                }
            }
        },
        prefsAdjuster: {
            type: "gpii.devpmt.prefSettingAdjuster",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsAdjusterContainer",
            options: {
                selectors: {
                    initial: "#prefs-adjuster"
                }
            }
        },
        prefsFilter: {
            type: "gpii.devpmt.prefsFilter",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsFilter"
        }
    },
    selectors: {
        initial: "#editprefset-viewport",
        editWidgetSidebar: "#editwidget-sidebar",
        productListContainer: "#productList-container",
        prefsAdjusterContainer: "#prefs-adjuster-container",
        valueDisplayCell: ".pmt-value-display",
        enabledBooleanInputs: ".pmt-enabled-boolean",
        saveButton: ".pmt-save-button",
        // This might be nice as a separate component
        addContextDialog: "#pmt-add-context-modal",
        addContextNameInput: "#pmt-add-context-name-input",
        addContextButton: "#pmt-add-context-button",
        prefsFilter: "#pmt-settings-filters",
        // Each product table has this class
        eachProductArea: ".pmt-single-product-area",
        commonTermRow: ".pmt-commonterm-row"
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
        },
        processAddContextDialog: {
            funcName: "gpii.devpmt.processAddContextDialog",
            args: ["{that}"]
        },
        updateMetadataFromPrefs: {
            funcName: "gpii.devpmt.updateMetadataFromPrefs",
            args: ["{that}"]
        },
        updateSettingsFilter: {
            funcName: "gpii.devpmt.updateSettingsFilter",
            args: ["{that}", "{that}.dom.commonTermRow", "{that}.model.settingsFilter", "{that}.model.settingsSearch"]
        },
        updateProductsFilter: {
            funcName: "gpii.devpmt.updateProductsFilter",
            args: ["{that}", "{that}.dom.eachProductArea", "{that}.model.productsFilter", "{that}.model.productsSearch"]
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
            },
            {
                "this": "{that}.dom.addContextButton",
                "method": "click",
                args: ["{that}.processAddContextDialog"]
            },
            {
                func: "{that}.updateSettingsFilter"
            },
            {
                func: "{that}.updateProductsFilter"
            },
            {
                funcName: "gpii.devpmt.updateFoundationSticky",
                args: []
            }
        ]
    },
    modelListeners: {
        "flatPrefs": [{
            func: "{that}.updateMetadataFromPrefs",
            args: ["{that}"]
        }]
        // {
            // funcName: "gpii.devpmt.addEditToUnsavedList",
            // args: ["{that}", "{change}.path", "{change}.value", "{change.oldValue}"]
        // }]
    }
});

gpii.devpmt.addEditToUnsavedList = function (that, path, newValue, oldValue) {
    that.applier.change("unsavedChangesExist", true);
    // TODO use change applier
    that.model.unsavedChanges.push({
        path: path,
        newValue: newValue,
        oldValue: oldValue
    });
    that.renderInitialMarkup();
};

gpii.devpmt.updateFoundationSticky = function () {
    // https://github.com/zurb/foundation-sites/issues/7899
    $(".sticky").foundation("_calc", true);
};

gpii.devpmt.updateSettingsFilter = function (that, commonTermRows, filters, search) {

    if (filters === "allsettings") {
        commonTermRows.show();
    }
    else {
        commonTermRows.hide();
        fluid.each(commonTermRows, function (row) {
            var term = row.dataset.term;
            fluid.each(that.model.flatPrefs.contexts, function (context) {
                fluid.each(context.preferences, function (pref, key) {
                    if (key === term) {
                        $(row).show();
                    }
                });
            });
        });
    }

    // TODO For both the settings and products index, move them out into
    // a component, or part of the model (so they aren't regenerated each time).
    // Then also hook up a model listener such that if the solutions or
    // settings change, the index get's updated.
    var lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("term");
        this.b(0.01);

        fluid.each(that.model.commonTerms, function (commonTerm, term) {
            idx.add({
                "id": term,
                "name": commonTerm.name,
                "term": term
            });
        });
    });

    if (search) {
        var results = lunrIndex.search("*" + search + "*");
        commonTermRows.hide();
        fluid.each(commonTermRows, function (row) {
            var term = row.dataset.term;
            fluid.each(results, function (result) {
                if (result.ref === term) {
                    $(row).show();
                }
            });
        });
    }
};

gpii.devpmt.updateProductsFilter = function (that, productAreas, filters, search) {

    if (filters === "allproducts") {
        productAreas.show();
    }
    else {
        productAreas.hide();
        fluid.each(productAreas, function (product) {
            // TODO Use/fix ontology support for this tool
            var isoName = "http://registry.gpii.net/applications/" + product.dataset.appid;
            fluid.each(that.model.flatPrefs.contexts, function (item) {
                fluid.each(item.preferences, function (pref, key) {
                    if (key === isoName) {
                        $(product).show();
                    }
                });
            });
        });
    }

    var lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("appId");
        this.b(0.01);

        fluid.each(that.model.allSolutions, function (sol, key) {
            idx.add({
                "id": key,
                "name": sol.name,
                "appId": key
            });
        });
    });

    if (search) {
        var results = lunrIndex.search("*" + search + "*");
        productAreas.hide();
        fluid.each(productAreas, function (product) {
            var isoName = product.dataset.appid;
            fluid.each(results, function (result) {
                if (result.ref === isoName) {
                    $(product).show();
                }
            });
        });
    }
};

/**
 * When the prefs are updated we need to usually update
 * some of the metadata that makes rendering easier, from
 * the new preference information.
 *
 * This should maybe be a set of model relay rules instead.
 */
gpii.devpmt.updateMetadataFromPrefs = function (that) {
    that.applier.change("contextNames", gpii.devpmt.contextNames(that.model.flatPrefs));
};

/**
 * When the Add Context Dialog button is clicked, pull
 * the name from the text entry, process it, and then clear
 * it.
 */
gpii.devpmt.processAddContextDialog = function (that) {
    var contextName = that.dom.locate("addContextNameInput").val();
    // TODO validation to see if already exists, and determining
    // the valid set of strings a context ID can take
    var path = "flatPrefs.contexts." + contextName;
    that.applier.change(path, {
        "name": contextName,
        "preferences": {}
    }, "ADD");
    that.dom.locate("addContextNameInput").val("");
    that.renderInitialMarkup();
    that.dom.locate("addContextDialog").foundation("close");
};

gpii.devpmt.savePrefset = function (that /*, event */) {
    var options = {
        method: "POST",
        contentType: "application/json",
        url: "/saveprefset/" + that.model.npsetName,
        data: JSON.stringify({ flat: that.model.flatPrefs }, null, 4)
    };
    $.ajax(options);
    that.applier.change("unsavedChangesExist", false);
    that.renderInitialMarkup();
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
    that.applier.change("unsavedChangesExist", true);
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
    that.applier.change("unsavedChangesExist", true);
    that.prefsAdjuster.renderInitialMarkup();
    // $(document).foundation();
    // https://github.com/zurb/foundation-sites/issues/7899
    $(".sticky").foundation("_calc", true);
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

    // Add sorted solutions
    var allSolutionsSorted = []
    // that.model.allSolutionsSorted = [];
    fluid.each(that.model.allSolutions, function (item, key) {
        var flatItem = fluid.copy(item);
        flatItem.id = key;
        allSolutionsSorted.push(flatItem);
    });

    var sortName = function (a, b) {
        if (a.name > b.name) {
            return 1;
        }
        else if (a.name < b.name) {
            return -1;
        }
        else {
            return 0;
        }
    };

    fluid.stableSort(allSolutionsSorted, sortName);
    that.applier.change("allSolutionsSorted", allSolutionsSorted);

    // Add sorted commonTerms
    that.model.commonTermsSorted = [];
    fluid.each(that.model.commonTerms, function (item, key) {
        var flatTerm = fluid.copy(item);
        flatTerm.id = key;
        that.model.commonTermsSorted.push(flatTerm);
    });

    fluid.stableSort(that.model.commonTermsSorted, sortName);

    // Debugging so this component is available in the console
    var editPrefs = fluid.queryIoCSelector(fluid.rootComponent, "gpii.devpmt.editPrefs")[0];
    fluid.setGlobalValue("editPrefs", editPrefs);

    setInterval( function () { 
        gpii.devpmt.updateFoundationSticky();
    }, 250);

};
