"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * Edit Prefs is the main component for driving the page editing
 * a preference set.
 */
fluid.defaults("gpii.devpmt.editPrefs", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    mergePolicy: {
        allSolutions: "noexpand",
        commonTerms: "noexpand"
    },
    model: {
        flatPrefs: {},
        commonTerms: [],
        commonTermsSorted: [],
        contextNames: [],
        npsetApplications: [],
        allSolutions: {},
        unsavedChangesExist: false,
        unsavedChanges: [],

        // Generic Prefs Filters
        settingsFilter: "mysettings",
        settingsSearch: "",

        // A hash which could include an entry for each
        // settingsTables dynamicComponent that contains
        // it's local display options (such as mine/all settings),
        // kept here in case we need to rerender the entire page
        // for a major prefset change.
        productTableFilters: {},

        devModeOn: false,

        // Information for if we are currently editing a setting,
        // and if so, which context/term/product it's for and a
        // copy of the metadata.
        currentlyEditing: {
            active: false,
            current: {
                context: "",
                term: "",
                value: "",
                product: ""
            },
            metadata: {
                name: "",
                description: "",
                schema: {}
            }
        }
    },
    events: {
        createSettingsTable: null
    },
    bindings: {
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
                },
                model: {
                    active: "{gpii.devpmt.editPrefs}.model.currentlyEditing.active",
                    current: "{gpii.devpmt.editPrefs}.model.currentlyEditing.current",
                    metadata: "{gpii.devpmt.editPrefs}.model.currentlyEditing.metadata",
                    devModeOn: "{gpii.devpmt.editPrefs}.model.devModeOn"
                }
            }
        },
        genericPrefsTable: {
            type: "gpii.devpmt.genericSettingsTableWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.genericSettingsTableContainer",
            options: {
                selectors: {
                    initial: "#genericSettingsTable-widget"
                },
                model: {
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs",
                    contextNames: "{gpii.devpmt.editPrefs}.model.contextNames",
                    commonTermsSorted: "{gpii.devpmt.editPrefs}.model.commonTermsSorted",
                    commonTerms: "{gpii.devpmt.editPrefs}.model.commonTerms",
                    settingsFilter: "{gpii.devpmt.editPrefs}.model.settingsFilter",
                    settingsSearch: "{gpii.devpmt.editPrefs}.model.settingsSearch"
                }
            }
        }
    },
    dynamicComponents: {
        settingsTables: {
            createOnEvent: "createSettingsTable",
            type: "gpii.devpmt.settingsTableWidget",
            container: "{arguments}.0",
            options: {
                selectors: {
                    initial: ".settings-table-div"
                },
                appId: "{arguments}.1",
                solution: "{arguments}.2",
                appUri: "{arguments}.3",
                model: {
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs",
                    contextNames: "{gpii.devpmt.editPrefs}.model.contextNames"
                },
                modelRelay: {
                    settingsFilter: {
                        source: {
                            context: "gpii.devpmt.editPrefs",
                            segs: ["productTableFilters", "{that}.options.appId", "settingsFilter"]
                        },
                        target: "settingsFilter",
                        singleTransform: {
                            type: "fluid.transforms.identity"
                        }
                    },
                    allSettingsEnabled: {
                        source: {
                            context: "gpii.devpmt.editPrefs",
                            segs: ["productTableFilters", "{that}.options.appId", "allSettingsEnabled"]
                        },
                        target: "allSettingsEnabled",
                        singleTransform: {
                            type: "fluid.transforms.identity"
                        }
                    }
                }
            }
        }
    },
    selectors: {
        initial: "#editprefset-viewport",
        editWidgetSidebar: "#editwidget-sidebar",
        productListContainer: "#productList-container",
        prefsAdjusterContainer: "#prefs-adjuster-container",
        genericSettingsTableContainer: "#genericSettingsTable-container",
        saveButton: ".pmt-save-button",
        // This might be nice as a separate component
        addContextDialog: "#pmt-add-context-modal",
        confirmSaveDialog: "#pmt-confirm-save-modal",
        addContextNameInput: "#pmt-add-context-name-input",
        addContextButton: "#pmt-add-context-button",
        // Each product table has this class
        eachProductArea: ".pmt-single-product-area",
        topbarSaveButton: "#pmt-topbar-save-button", // Button on topbar to open Preview/Confirm Save Dialog
        // List of unsaved changes in the save/confirm dialog
        unsavedChangeList: "#pmt-unsaved-change-list",
        addProductModal: "#pmt-add-product-modal",
        addProductRender: "#pmt-add-product-render",
        addProductConfirmButton: "#pmt-confirm-addproduct-button",
        addProductAppId: "#pmt-add-product-appId",
        devModeIcon: "#pmt-topbar-devmode-button"
    },
    templates: {
        initial: "editprefset-viewport",
        editPrefWidget: "editpref-widget"
    },
    invokers: {
        reRender: {
            func: "{that}.events.refresh.fire"
        },
        addEditToUnsavedList: {
            funcName: "gpii.devpmt.addEditToUnsavedList",
            args: ["{that}", "{arguments}.0"]
        },
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
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
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
        initSettingTableWidgets: {
            funcName: "gpii.devpmt.initSettingTableWidgets",
            args: ["{that}"]
        },
        openSaveConfirmDialog: {
            funcName: "gpii.devpmt.openSaveConfirmDialog",
            args: ["{that}"]
        },
        openAddProductDialog: {
            funcName: "gpii.devpmt.openAddProductDialog",
            args: ["{that}", "{arguments}.0"] // appId
        },
        confirmAddProductDialog: {
            funcName: "gpii.devpmt.confirmAddProductDialog",
            args: ["{that}", "{arguments}.0"]
        },
        toggleDevModeView: {
            funcName: "gpii.devpmt.toggleDevModeView",
            args: ["{that}", "{that}.model.devModeOn"]
        },
        lookupGenericPrefValue: {
            funcName: "gpii.devpmt.lookupGenericPrefValue",
            args: ["{that}", "{arguments}.0", "{arguments}.1"] // context, commonTerm
        },
        lookupProductPrefValue: {
            funcName: "gpii.devpmt.lookupProductPrefValue",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // context, product, settingTerm
        }
    },
    listeners: {
        "onCreate": {
            funcName: "gpii.devpmt.npsetInit",
            args: ["{that}"] //"onCreate listener"]
        },
        "onMarkupRendered.firstPageRender": [
            {
                "this": "{that}.dom.addContextButton",
                "method": "click",
                args: ["{that}.processAddContextDialog"]
            }
        ],
        "onMarkupRendered": [
            {
                "this": "{that}.dom.addProductConfirmButton",
                "method": "click",
                args: ["{that}.confirmAddProductDialog"]
            },
            {
                "this": "{that}.dom.saveButton",
                "method": "click",
                args: ["{that}.savePrefset"]
            },
            {
                "this": "{that}.dom.topbarSaveButton",
                "method": "click",
                args: ["{that}.openSaveConfirmDialog"]
            },
            {
                "this": "{that}.dom.devModeIcon",
                "method": "click",
                args: ["{that}.toggleDevModeView"]
            },
            {
                funcName: "gpii.devpmt.updateFoundationSticky",
                args: []
            },
            {
                func: "{that}.initSettingTableWidgets"
            }
        ]
    },
    modelListeners: {
        "flatPrefs": [{
            func: "{that}.updateMetadataFromPrefs",
            args: ["{that}"]
        }, {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }],
        "unsavedChangesExist": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        },
        "npsetApplications": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    }
});

/**
 * Lookup Generic Preference Setting.
 *
 * Using the context and commonTerm lookup the generic preference
 * value. If the preference set does not contain the value, we
 * return `undefined` to make this known, as `undefined` is not
 * a valid JSON value. Theoretically, and preference setting maybe
 * set as `null`.
 */
gpii.devpmt.lookupGenericPrefValue = function (that, context, commonTerm) {
    if (that.model.flatPrefs.contexts[context].preferences[commonTerm] !== undefined) {
        return that.model.flatPrefs.contexts[context].preferences[commonTerm];
    }
    else {
        return undefined;
    }
};

/**
 * Lookup Application Specific Setting. Similar to `lookupGenericPrefValue` lookups
 * in regard to return values, but takes an extra argument for the product.
 */
gpii.devpmt.lookupProductPrefValue = function (that, context, product, settingTerm) {
    if (that.model.flatPrefs.contexts[context].preferences[product][settingTerm] !== undefined) {
        return that.model.flatPrefs.contexts[context].preferences[product][settingTerm];
    }
    else {
        return undefined;
    }
};

gpii.devpmt.initSettingTableWidgets = function (that) {
    var existingTables = fluid.queryIoCSelector(fluid.rootComponent, "gpii.devpmt.settingsTableWidget");
    fluid.each(existingTables, function (item) {
        item.destroy();
    });
    fluid.each(that.model.npsetApplications, function (item) {
        var sel = "#test-comp-" + item.appId;
        sel = sel.replace(/\./g, "\\.");
        var appUri = "http://registry.gpii.net/applications/" + item.appId;
        that.events.createSettingsTable.fire(sel, item.appId, that.model.allSolutions[item.appId], appUri);
    });
};

gpii.devpmt.addEditToUnsavedList = function (that, description) { // that, path, newValue, oldValue) {
    that.model.unsavedChanges.push({
        // path: path,
        // newValue: newValue,
        // oldValue: oldValue
        description: description
    });
};

gpii.devpmt.updateFoundationSticky = function () {
    // https://github.com/zurb/foundation-sites/issues/7899
    $(".sticky").foundation("_calc", true);
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
    // TODO Refactor dialogs into components, or determine what is
    // triggering this a second time with a blank string.
    if (contextName === "") {
        return;
    }

    // TODO validation to see if already exists, and determining
    // the valid set of strings a context ID can take
    var path = "flatPrefs.contexts." + contextName;
    that.applier.change(path, {
        "name": contextName,
        "preferences": {}
    }, "ADD");
    that.dom.locate("addContextNameInput").val("");
    that.dom.locate("addContextDialog").foundation("close");
};

gpii.devpmt.openSaveConfirmDialog = function (that) {
    that.renderer.html(that.dom.locate("unsavedChangeList"), "editprefset-unsavedChanges-list", that.model);
    that.dom.locate("confirmSaveDialog").foundation("open");
};

gpii.devpmt.openAddProductDialog = function (that, appId) {
    that.renderer.html(that.dom.locate("addProductRender"), "editprefset-addProduct-dialog", {
        appId: appId,
        name: that.model.allSolutions[appId].name
    });
    that.dom.locate("addProductModal").foundation("open");
};

gpii.devpmt.confirmAddProductDialog = function (that) {
    // TODO Ontology!!!
    var appUrl = "http://registry.gpii.net/applications/" + $(that.dom.locate("addProductAppId")).val();
    that.editProductEnabled(true, "gpii-default",  appUrl);
    that.dom.locate("addProductModal").foundation("close");
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
    that.applier.change("unsavedChanges", []);
    that.dom.locate("confirmSaveDialog").foundation("close");
    that.reRender();
};

gpii.devpmt.toggleDevModeView = function (that, status) {
    if (status) {
        that.applier.change("devModeOn", false);
    }
    else {
        that.applier.change("devModeOn", true);
    };
    that.reRender();
};

gpii.devpmt.editProductEnabled = function (that, checked, context, product) {
    // TODO generalize these 4 lines with copied code in editwidgets.js:saveUpdateValue
    var segs = ["contexts", context, "preferences", product.replace(/\./g, "\\.")];
    var path = "flatPrefs";
    fluid.each(segs, function (item) { path += "." + item; });

    if (checked) {
        // Add a check in case it's already enabled
        that.applier.change(path, {});
        that.addEditToUnsavedList("Enabled Product for Context: " + product);
    }
    else {
        that.applier.change(path, false, "DELETE");
        that.addEditToUnsavedList("Un-enabled Product for Context: " + product);
    }
    that.applier.change("npsetApplications", gpii.devpmt.npsetApplications(that.model.flatPrefs));
    that.applier.change("unsavedChangesExist", true);
};

gpii.devpmt.editValueEvent = function (that, event) {
    var newCurrent = {
        context: event.currentTarget.dataset.context,
        term: event.currentTarget.dataset.term,
        //value: event.currentTarget.dataset.value,
        product: event.currentTarget.dataset.product
    };

    var newMetadata = {};
    if (!newCurrent.product) {
        // Application Specific
        newMetadata = that.options.commonTerms[newCurrent.term];
        newMetadata.name = newMetadata.schema.title;
        newMetadata.description = newMetadata.schema.description;
        newCurrent.value = that.lookupGenericPrefValue(newCurrent.context, newCurrent.term);
        newCurrent.blank = newCurrent.value === undefined;
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
        newCurrent.value = that.lookupProductPrefValue(newCurrent.context, newCurrent.product, newCurrent.term);
        newCurrent.blank = newCurrent.value === undefined;
    }
    that.applier.change("currentlyEditing.current", newCurrent);
    that.applier.change("currentlyEditing.metadata", newMetadata);
    that.applier.change("currentlyEditing.active", true);
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
    var allSolutionsSorted = [];
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

    fluid.stableSort(that.model.commonTermsSorted, function (a, b) {
        if (a.schema.title > b.schema.title) {
            return 1;
        }
        else if (a.schema.title < b.schema.title) {
            return -1;
        }
        else {
            return 0;
        }
    });

    // Debugging so this component is available in the console
    var editPrefs = fluid.queryIoCSelector(fluid.rootComponent, "gpii.devpmt.editPrefs")[0];
    fluid.setGlobalValue("editPrefs", editPrefs);

    setInterval( function () {
        gpii.devpmt.updateFoundationSticky();
    }, 250);

    $(window).bind("beforeunload", function () {
        return that.model.unsavedChangesExist ? true : undefined;
    });

};

