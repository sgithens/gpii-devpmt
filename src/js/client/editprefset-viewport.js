"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * A devpmt tailored view component that brings in some common
 * traits for our rendered widgets.
 *
 * Builds off of `gpii.handlbars.templateAware` and `gpii.binder.bindOnCreate`
 * grades.  Includes a standard renderInitialMarkup invoker that uses
 * the defined initial template and the model as the context for rendering.
 * Also includes a useful reRender invoker that can be bound to model
 * listeners or invoked programmatically.
 */
fluid.defaults("gpii.devpmt.viewComponent", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate"],
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        reRender: {
            func: "{that}.events.refresh.fire"
        }
    }
});

/**
 * Edit Prefs is the main component for driving the page editing
 * a preference set.
 */
fluid.defaults("gpii.devpmt.editPrefs", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    mergePolicy: {
        allSolutions: "noexpand",
        commonTerms: "noexpand"
    },
    model: {
        npsetName: "",
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
        },

        commonTermUsageCounts: {},
        productTermUsageCounts: [],

        // Contains any free information that pertains to an active dialog.
        // While we can only display one modal dialog at a time, the options
        // and data for a dialog can change between instances, such as adding
        // different products to an NP Set, and presenting an confirm dialog
        // each time.
        //
        // notes: I had initially wanted to do this, by passing options to the
        // createOnEvent firing to create the deffered component, but it didn't
        // appear that I could get to the parameters being passed to the fire
        // method. In some ways though, it does make sense to track the state of
        // the entire page on this model, including the active dialog, for a
        // future scenerio where we want to be able to continue after a page
        // reload, or implement time-travel behavior to re-render back to any
        // point in time.
        activeModalDialog: {}
    },
    events: {
        createSettingsTable: null,
        openBaseDialog: null,
        openAddContextDialog: null,
        openConfirmDialog: null,
        openConfirmAddProductDialog: null,
        openConfirmDeleteContextDialog: null,
        openConfirmSaveDialog: null
    },
    bindings: {
    },
    components: {
        // TESTING
        baseDialog: {
            type: "gpii.devpmt.dialogs.baseDialog",
            createOnEvent: "openBaseDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                }
            }
        },
        // TESTING
        confirmationDialog: {
            type: "gpii.devpmt.dialogs.confirmDialog",
            createOnEvent: "openConfirmDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                }
            }
        },
        confirmAddProductDialog: {
            type: "gpii.devpmt.dialogs.confirmAddProductDialog",
            createOnEvent: "openConfirmAddProductDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                },
                model: {
                    appId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.appId",
                    name: "{gpii.devpmt.editPrefs}.model.activeModalDialog.name"
                }
            }
        },
        addContextDialog: {
            type: "gpii.devpmt.dialogs.addContextDialog",
            createOnEvent: "openAddContextDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                }
            }
        },
        confirmDeleteContextDialog: {
            type: "gpii.devpmt.dialogs.confirmDeleteContextDialog",
            createOnEvent: "openConfirmDeleteContextDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                },
                model: {
                    contextId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.contextId"
                }
            }
        },
        confirmSaveDialog: {
            type: "gpii.devpmt.dialogs.confirmSaveDialog",
            createOnEvent: "openConfirmSaveDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#modal-dialog-render"
                },
                model: {
                    unsavedChanges: "{gpii.devpmt.editPrefs}.model.unsavedChanges"
                }
            }
        },
        topNavBar: {
            type: "gpii.devpmt.topNavBar",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.topNavBar",
            options: {
                selectors: {
                    initial: "#topNavBar-widget"
                },
                model: {
                    npsetName: "{gpii.devpmt.editPrefs}.model.npsetName",
                    devModeOn: "{gpii.devpmt.editPrefs}.model.devModeOn",
                    unsavedChangesExist: "{gpii.devpmt.editPrefs}.model.unsavedChangesExist"
                }
            }
        },
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
                    settingsSearch: "{gpii.devpmt.editPrefs}.model.settingsSearch",
                    commonTermUsageCounts: "{gpii.devpmt.editPrefs}.model.commonTermUsageCounts"
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
        modalDialogContainer: "#modal-dialog-container",
        modalDialogRender: "#modal-dialog-render",
        topNavBar: "#topNavBar-container",
        editWidgetSidebar: "#editwidget-sidebar",
        productListContainer: "#productList-container",
        prefsAdjusterContainer: "#prefs-adjuster-container",
        genericSettingsTableContainer: "#genericSettingsTable-container",
        // Each product table has this class
        eachProductArea: ".pmt-single-product-area",
        deleteContextButtons: ".pmt-delete-context"
    },
    templates: {
        initial: "editprefset-viewport",
        editPrefWidget: "editpref-widget"
    },
    invokers: {
        addEditToUnsavedList: {
            funcName: "gpii.devpmt.addEditToUnsavedList",
            args: ["{that}", "{arguments}.0"]
        },
        updateCommonTermUsageCounts: {
            funcName: "gpii.devpmt.updateCommonTermUsageCounts",
            args: ["{that}", "{that}.model.commonTermsSorted", "{that}.model.flatPrefs"]
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
        updateMetadataFromPrefs: {
            funcName: "gpii.devpmt.updateMetadataFromPrefs",
            args: ["{that}"]
        },
        initSettingTableWidgets: {
            funcName: "gpii.devpmt.initSettingTableWidgets",
            args: ["{that}"]
        },
        openAddProductDialog: {
            funcName: "gpii.devpmt.openAddProductDialog",
            args: ["{that}", "{arguments}.0"] // appId
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
        },
        onDeleteContext: {
            funcName: "gpii.devpmt.onDeleteContext",
            args: ["{that}", "{arguments}.0"] // event
        }
    },
    listeners: {
        "onCreate": {
            funcName: "gpii.devpmt.npsetInit",
            args: ["{that}"] //"onCreate listener"]
        },
        "onMarkupRendered": [
            {
                "this": "{that}.dom.deleteContextButtons",
                "method": "click",
                args: ["{that}.onDeleteContext"]
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
        "flatPrefs": [
            {
                func: "{that}.updateMetadataFromPrefs",
                args: ["{that}"]
            },
            {
                func: "{that}.updateCommonTermUsageCounts"
            }
        ],
        "npsetApplications": {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    }
});

/**
 * Common term filter counts
 *
 * Returns the total number of common terms, and then the maximum
 * number that is set in the NP Set. This is used for rendering
 * information by the settings filters in the form:
 *
 * [[My Settings (3)]] [All Settings (225)]
 *
 * This provides the user with contextual knowledge before hiding
 * or showing all settings. This information could also be used
 * to perhaps only show the first 10 settings or something, and
 * then expand the rest when the user decides it is appropriate.
 *
 * If the user has multiple contexts, this will return the total
 * number of unique settings keys in the NP Set across all contexts.
 *
 * @return {Object} Object with keys `npset` and `all`, such as
 *                  {
 *                      npset: 3,
 *                      all: 225
 *                  }
 */
gpii.devpmt.calculateCommonTermUsageCounts = function (commonTermsSorted, flatPrefs) {
    var all = commonTermsSorted.length;
    var npsetKeys = {};
    fluid.each(flatPrefs.contexts, function (i) {
        fluid.each(i.preferences, function (j, jKey) {
            if (jKey.startsWith("http://registry.gpii.net/common")) {
                npsetKeys[jKey] = true;
            }
        });
    });
    var counts = {
        all: all,
        npset: Object.keys(npsetKeys).length
    };
    return counts;
};

/**
 * Calculate any changes in the common term filter counts and
 * update the model. See `gpii.devpmt.commonTermUsageCounts` for
 * details on the data.
 */
gpii.devpmt.updateCommonTermUsageCounts = function (that, commonTermsSorted, flatPrefs) {
    var counts = gpii.devpmt.calculateCommonTermUsageCounts(commonTermsSorted, flatPrefs);
    that.applier.change("commonTermUsageCounts", counts);
};

/**
 * Product Term Filter counts
 *
 * See `gpii.devpmt.commonTermUsageCounts` for overview.
 */
// gpii.devpmt.productTermUsageCounts = function (that,

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
    if (that.model.flatPrefs.contexts[context].preferences[product] &&
        that.model.flatPrefs.contexts[context].preferences[product][settingTerm] !== undefined) {
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

gpii.devpmt.openAddProductDialog = function (that, appId) {
    that.applier.change("activeModalDialog", {
        appId: appId,
        name: that.model.allSolutions[appId].name
    });
    that.events.openConfirmAddProductDialog.fire();
};

gpii.devpmt.savePrefset = function (that /*, event */) {
    var options = {
        method: "POST",
        contentType: "application/json",
        url: "/saveprefset/" + that.model.npsetName,
        data: JSON.stringify({ flat: that.model.flatPrefs }, null, 4)
    };
    $.ajax(options);
    var transaction = that.applier.initiate();
    transaction.fireChangeRequest({
        path: "unsavedChangesExist",
        value: false
    });
    transaction.fireChangeRequest({
        path: "unsavedChanges",
        value: []
    });
    transaction.commit();
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

/**
 * Event Listener for when a button is clicked to delete
 * a context. Fetches the context to delete from the elements
 * data-contextid attribute.
 *
 * This listener doesn't actually delete the context, but
 * opens the confirm delete context dialog.
 *
 * @param event (Event) Browser event object
 */
gpii.devpmt.onDeleteContext = function (that, event) {
    var contextId = event.currentTarget.dataset.contextid;
    that.applier.change("activeModalDialog.contextId", contextId);
    that.events.openConfirmDeleteContextDialog.fire();
};

gpii.devpmt.editValueEvent = function (that, event) {
    $(event.currentTarget).addClass("pmt-value-editing");
    var newCurrent = {
        context: event.currentTarget.dataset.context,
        term: event.currentTarget.dataset.term,
        //value: event.currentTarget.dataset.value,
        product: event.currentTarget.dataset.product
    };

    var newMetadata = {};
    if (!newCurrent.product) {
        // Common Term
        newMetadata.schema = that.options.commonTerms[newCurrent.term];
        newMetadata.name = newMetadata.schema.title;
        newMetadata.description = newMetadata.schema.description;
        newCurrent.value = that.lookupGenericPrefValue(newCurrent.context, newCurrent.term);
        newCurrent.blank = newCurrent.value === undefined;
    }
    else {
        // Application Specific
        // TODO ontology
        newMetadata = gpii.devpmt.findProductSettingMetadata(that.model.allSolutions,
            newCurrent.product.slice(38), newCurrent.term);
        newMetadata.name = newMetadata.schema.title;
        newMetadata.description = newMetadata.schema.description;
        newCurrent.value = that.lookupProductPrefValue(newCurrent.context, newCurrent.product, newCurrent.term);
        newCurrent.blank = newCurrent.value === undefined;
    }
    var transaction = that.applier.initiate();
    transaction.fireChangeRequest({
        path: "currentlyEditing.current", value: newCurrent
    });
    transaction.fireChangeRequest({
        path: "currentlyEditing.metadata", value: newMetadata
    });
    transaction.fireChangeRequest({
        path: "currentlyEditing.active", value: true
    });
    transaction.fireChangeRequest({
        path: "unsavedChangesExist", value: true
    });
    transaction.commit();
    that.prefsAdjuster.renderInitialMarkup();
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
        return a.name.localeCompare(b.name);
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
        return a.title.localeCompare(b.title);
    });

    that.updateCommonTermUsageCounts();

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

