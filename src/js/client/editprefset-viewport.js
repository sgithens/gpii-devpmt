/* global saveAs, Foundation */
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
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate",
        "gpii.binder.bindMarkupEvents"],
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
        prefsSafe: "{that}.options.prefsSafe",
        // Example of a prefsSafe document from our model
            // id: "Alice prefsafe",
            // name: "Alice Alice",
            // email: "Alice@Wonderland.org",
            // timestampCreated: "2018-06-21T19:02:28.078Z",
            // timestampUpdated: null
        // },

        keys: "{that}.options.keys",
        // Example of keys documents from the data model
            // {
            //     id: "alice",
            //     type: "gpiiKey",
            //     schemaVersion: "0.1",
            //     prefsSafeId: "prefsSafe-alice",
            //     prefsSetId: "gpii-default",
            //     revoked: false,
            //     revokedReason: null,
            //     timestampCreated: "2018-06-21T19:02:28.057Z",
            //     timestampUpdated: null
            // },
            // {
            //     id: "alice-usb",
            //     type: "gpiiKey",
            //     schemaVersion: "0.1",
            //     prefsSafeId: "prefsSafe-alice",
            //     prefsSetId: "gpii-default",
            //     revoked: false,
            //     revokedReason: null,
            //     timestampCreated: "2018-06-21T19:02:28.057Z",
            //     timestampUpdated: null
            // }
        // ],


        npsetName: "{that}.options.npset.options.npsetName",  // ""
        flatPrefs: "{that}.options.prefsSafe.preferences.flat",  // {}
        commonTerms: "{that}.options.commonTerms",            // []
        commonTermsSorted: [],
        contextNames: [],
        npsetApplications: "@expand:gpii.devpmt.npsetApplications({that}.options.prefsSafe.preferences.flat)", // []
        allSolutions: "{that}.options.allSolutions", // {}

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
        activeModalDialog: {}
    },
    events: {
        createSettingsTable: null,
        openBaseDialog: null,
        openAddContextDialog: null,
        openEditContextDialog: null,
        openConfirmDialog: null,
        openConfirmAddProductDialog: null,
        openConfirmDeleteContextDialog: null,
        openConfirmSaveDialog: null,
        openConfirmRemoveProductDialog: null,
        startDevWidgets: null
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
                    initial: "#pmt-modal-dialog-render"
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
                    initial: "#pmt-modal-dialog-render"
                }
            }
        },
        confirmAddProductDialog: {
            type: "gpii.devpmt.dialogs.confirmAddProductDialog",
            createOnEvent: "openConfirmAddProductDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    appId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.appId",
                    name: "{gpii.devpmt.editPrefs}.model.activeModalDialog.name"
                }
            }
        },
        confirmRemoveProductDialog: {
            type: "gpii.devpmt.dialogs.confirmRemoveProductDialog",
            createOnEvent: "openConfirmRemoveProductDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    appId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.appId",
                    name: "{gpii.devpmt.editPrefs}.model.activeModalDialog.name",
                    product: "{gpii.devpmt.editPrefs}.model.activeModalDialog.product",
                    context: "{gpii.devpmt.editPrefs}.model.activeModalDialog.context"
                }
            }
        },
        addContextDialog: {
            type: "gpii.devpmt.dialogs.addContextDialog",
            createOnEvent: "openAddContextDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    contextNames: "{gpii.devpmt.editPrefs}.model.contextNames",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs"
                }
            }
        },
        editContextDialog: {
            type: "gpii.devpmt.dialogs.editContextDialog",
            createOnEvent: "openEditContextDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    contextId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.contextId",
                    originalContextId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.originalContextId",
                    contextName: "{gpii.devpmt.editPrefs}.model.activeModalDialog.contextName"
                }
            }
        },
        confirmDeleteContextDialog: {
            type: "gpii.devpmt.dialogs.confirmDeleteContextDialog",
            createOnEvent: "openConfirmDeleteContextDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
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
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    unsavedChanges: "{gpii.devpmt.editPrefs}.model.unsavedChanges"
                }
            }
        },
        flatPrefsJsonDev: {
            type: "gpii.devpmt.jsonDev",
            createOnEvent: "startDevWidgets",
            container: "{that}.dom.flatPrefsJsonDev",
            options: {
                selectors: {
                    initial: "#pmt-flatPrefs-jsonDev-render"
                },
                model: {
                    editing: "{gpii.devpmt.editPrefs}.model.flatPrefs"
                }
            }
        },
        topNavBar: {
            type: "gpii.devpmt.topNavBar",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.topNavBar",
            options: {
                selectors: {
                    initial: "#pmt-topNavBar-widget"
                },
                model: {
                    npsetName: "{gpii.devpmt.editPrefs}.model.npsetName",
                    devModeOn: "{gpii.devpmt.editPrefs}.model.devModeOn",
                    unsavedChangesExist: "{gpii.devpmt.editPrefs}.model.unsavedChangesExist"
                }
            }
        },
        tableOfContents: {
            type: "gpii.devpmt.editPrefsTocWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.tableOfContentsContainer",
            options: {
                selectors: {
                    initial: "#pmt-editPrefsTOC-widget"
                },
                model: {
                    allSolutions: "{gpii.devpmt.editPrefs}.model.allSolutions",
                    npsetApplications: "{gpii.devpmt.editPrefs}.model.npsetApplications"
                }
            }
        },
        productList: {
            type: "gpii.devpmt.productListWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.productListContainer",
            options: {
                selectors: {
                    initial: "#pmt-productList-widget"
                },
                model: {
                    allSolutionsSorted: "{gpii.devpmt.editPrefs}.model.allSolutionsSorted"
                }
            }
        },
        prefsSafeInfo: {
            type: "gpii.devpmt.prefsSafeInfoWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsSafeInfoContainer",
            options: {
                selectors: {
                    initial: "#pmt-prefsSafeInfo-widget"
                },
                model: {
                    prefsSafe: "{gpii.devpmt.editPrefs}.model.prefsSafe"
                }
            }
        },
        prefsSafeKeysList: {
            type: "gpii.devpmt.prefsSafeKeysList",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsSafeKeysListContainer",
            options: {
                selectors: {
                    initial: "#pmt-prefsSafeKeysList-widget"
                },
                model: {
                    keys: "{gpii.devpmt.editPrefs}.model.keys"
                }
            }
        },
        prefSetsList: {
            type: "gpii.devpmt.prefSetsListWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefSetsListContainer",
            options: {
                selectors: {
                    initial: "#pmt-prefSetsList-widget"
                },
                model: {
                    contextNames: "{gpii.devpmt.editPrefs}.model.contextNames",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs"
                }
            }
        },
        prefsAdjuster: {
            type: "gpii.devpmt.prefSettingAdjuster",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.prefsAdjusterContainer",
            options: {
                selectors: {
                    initial: "#pmt-prefs-adjuster"
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
                    initial: "#pmt-genericSettingsTable-widget"
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
                    initial: ".pmt-settings-table-div"
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
        initial: "#pmt-editprefset-viewport",
        modalDialogContainer: "#modal-dialog-container",
        modalDialogRender: "#pmt-modal-dialog-render",
        topNavBar: "#pmt-topNavBar-container",
        editWidgetSidebar: "#pmt-editwidget-sidebar",
        tableOfContentsContainer: "#pmt-editPrefsTOC-container",
        productListContainer: "#pmt-productList-container",
        prefsSafeInfoContainer: "#pmt-prefsSafeInfo-container",
        prefsSafeKeysListContainer: "#pmt-prefsSafeKeysList-container",
        prefSetsListContainer: "#pmt-prefSetsList-container",
        prefsAdjusterContainer: "#pmt-prefs-adjuster-container",
        genericSettingsTableContainer: "#pmt-genericSettingsTable-container",
        // Each product table has this class
        eachProductArea: ".pmt-single-product-area",
        flatPrefsJsonDev: "#pmt-flatPrefs-jsonDev-container"
    },
    templates: {
        initial: "editprefset-viewport",
        editPrefWidget: "editpref-widget"
    },
    invokers: {
        prefsetExists: {
            funcName: "gpii.devpmt.prefsetExists",
            args: ["{that}.model.flatPrefs", "{arguments}.0"]
        },
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
        editPspShow: {
            funcName: "gpii.devpmt.editPspShow",
            args: ["{that}", "{arguments}.0"]
        },
        editPspMemory: {
            funcName: "gpii.devpmt.editPspMemory",
            args: ["{that}", "{arguments}.0"]
        },
        editValueEvent: {
            funcName: "gpii.devpmt.editValueEvent",
            args: ["{that}", "{arguments}.0"]
        },
        editProductEnabled: {
            funcName: "gpii.devpmt.editProductEnabled",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        downloadPrefset: {
            funcName: "gpii.devpmt.downloadPrefset",
            args: ["{that}"]
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
        lookupPspMetadata: {
            funcName: "gpii.devpmt.lookupPspMetadata",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
                    // type: "show" or "memory", context, term, product
        },
        onEditContext: {
            funcName: "gpii.devpmt.onEditContext",
            args: ["{that}", "{arguments}.0"] // event
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
                funcName: "gpii.devpmt.updateFoundationSticky",
                args: []
            },
            {
                func: "{that}.initSettingTableWidgets"
            },
            {
                func: "gpii.devpmt.startFoundationAccordian",
                args: []
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

gpii.devpmt.lookupPspMetadata = function (that, type, context, term, product) {
    if (product) {
        if (that.model.flatPrefs.contexts[context].metadata &&
            that.model.flatPrefs.contexts[context].metadata.psp &&
            that.model.flatPrefs.contexts[context].metadata.psp[type] &&
            that.model.flatPrefs.contexts[context].metadata.psp[type][product] &&
            that.model.flatPrefs.contexts[context].metadata.psp[type][product][term]) {
            return true;
        }
        else {
            return false;
        }
    }
    else if (that.model.flatPrefs.contexts[context].metadata &&
        that.model.flatPrefs.contexts[context].metadata.psp &&
        that.model.flatPrefs.contexts[context].metadata.psp[type] &&
        that.model.flatPrefs.contexts[context].metadata.psp[type][term]) {
        return true;
    }
    return false;
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
    var curUnsavedChanges = fluid.copy(that.model.unsavedChanges);
    curUnsavedChanges.push({
        description: description
    });
    that.applier.change("unsavedChanges", curUnsavedChanges);
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
    //TODO Resolve the prefssafe vs prefsets model entries.
    var toSave = that.model.prefsSafe;
    toSave.preferences.flat = that.model.flatPrefs;

    var options = {
        method: "POST",
        contentType: "application/json",
        url: "/saveprefset/" + that.model.prefsSafe.id,
        data: JSON.stringify(toSave, null, 4)
    };
    $.ajax(options).done(function (data) {
        console.log("Returning from saving prefssafe:");
        console.log(data);
    });
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

gpii.devpmt.downloadPrefset = function (that) {
    var togoString = JSON.stringify({
        "flat": that.model.flatPrefs
    }, null, 4);
    var blob = new Blob([togoString], {type: "application/json;charset=utf-8"});
    saveAs(blob, that.model.npsetName + ".json");
};

gpii.devpmt.toggleDevModeView = function (that, status) {
    if (status) {
        that.applier.change("devModeOn", false);
        that.flatPrefsJsonDev.destroy();
        // TODO Concering the hide/show. I seem to be having some
        // issues creating and destroying this widget when devModeOn
        // is toggled. Eventually, these devwidgets could consume more
        // resources if they have editors, so I would actually like to
        // destroy them when they aren't in use, rather than hide them.
        // Currently, when the component is destroyed, via event or
        // the top level destroy method, it's markup is remaining on
        // the page. Also, eventually I would like this create/destroy
        // work to be keyed by a model listener on the `devModeOn` data.
        that.dom.locate("flatPrefsJsonDev").hide();
    }
    else {
        that.applier.change("devModeOn", true);
        that.events.startDevWidgets.fire();
        that.dom.locate("flatPrefsJsonDev").show();
    };
};

/**
 * Edits whether a product is enabled for a specific context (preference set).
 * Can also be used to enable or unable the product for all contexts.
 *
 * @param  {Object} that    `gpii.devpmt.editPrefs` instance
 * @param  {boolean} checked True or False indicating if this product should be
 * enabled or unabled.
 * @param  {string} context Context (prefset). If this is null, the product will
 * be (un)enabled in all contexts.
 * @param  {string} product The uri of the product.
 */
gpii.devpmt.editProductEnabled = function (that, checked, context, product) {
    var contexts = [context];
    if (context === null) {
        contexts = fluid.copy(that.model.contextNames);
    }

    fluid.each(contexts, function (context) {
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
    });
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

/**
 * Event Listener for when a button is clicked to edit
 * a context. Fetches the context to delete from the elements
 * data-contextid attribute.
 *
 * @param event (Event) Browser event object
 */
gpii.devpmt.onEditContext = function (that, event) {
    var contextId = event.currentTarget.dataset.contextid;
    that.applier.change("activeModalDialog", {
        contextId: contextId,
        originalContextId: contextId,
        contextName: that.model.flatPrefs.contexts[contextId].name
    });
    that.events.openEditContextDialog.fire();
};

gpii.devpmt.editPspShow = function (devpmt, event) {
    var context = event.currentTarget.dataset.context;
    var term = event.currentTarget.dataset.term;
    var product = event.currentTarget.dataset.product;
    var checked = event.currentTarget.checked;
    var segs = ["contexts", context, "metadata", "psp", "show"];
    if (product) {
        segs.push(product.replace(/\./g, "\\."), term.replace(/\./g, "\\."));
    }
    else {
        segs.push(term.replace(/\./g, "\\."));
    }
    var path = ["flatPrefs"].concat(segs).join(".");
    devpmt.applier.change(path, checked);
};

gpii.devpmt.editPspMemory = function (devpmt, event) {
    var context = event.currentTarget.dataset.context;
    var term = event.currentTarget.dataset.term;
    var product = event.currentTarget.dataset.product;
    var checked = event.currentTarget.checked;
    var segs = ["contexts", context, "metadata", "psp", "memory"];
    if (product) {
        segs.push(product.replace(/\./g, "\\."), term.replace(/\./g, "\\."));
    }
    else {
        segs.push(term.replace(/\./g, "\\."));
    }
    var path = ["flatPrefs"].concat(segs).join(".");
    devpmt.applier.change(path, checked);
};

gpii.devpmt.editValueEvent = function (that, event) {
    $(".pmt-value-display").removeClass("pmt-value-editing");
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

    // If blank to false so that you can immediately start editing
    // the value.
    newCurrent.blank = false;

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
    // Add sorted solutions
    var allSolutionsSorted = [];
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
    var commonTermsSorted = [];
    fluid.each(that.model.commonTerms, function (item, key) {
        var flatTerm = fluid.copy(item);
        flatTerm.id = key;
        commonTermsSorted.push(flatTerm);
    });
    that.applier.change("commonTermsSorted", commonTermsSorted);

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

gpii.devpmt.startFoundationAccordian = function () {
    var elem = jQuery("#pmt-sidebar-accordian");
    var accordian = new Foundation.Accordion(elem);
};
