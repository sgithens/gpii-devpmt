/**
 * Edit Preferences Viewport
 *
 * This is the primary entry point and container for the full page
 * preference safe editor. The grade `gpii.devpmt.editPrefs` orchestrates
 * the entire editor including it's model and subcomponents.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */

/* global saveAs, Foundation */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * A devpmt tailored view component that brings in some common
 * traits for our rendered widgets.
 *
 * Builds off of `gpii.handlbars.templateAware` and `gpii.binder.bindOnCreate`
 * grades.  Includes a standard renderInitialMarkup invoker that uses
 * the defined initial template and the model as the prefsSet for rendering.
 * Also includes a useful reRender invoker that can be bound to model
 * listeners or invoked programmatically.
 */
fluid.defaults("gpii.devpmt.viewComponent", {
    gradeNames: ["gpii.handlebars.templateAware.serverMessageAware", "gpii.binder.bindOnCreate",
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


        prefsSafeName: "{that}.options.prefsSafe.name",  // ""
        flatPrefs: "{that}.options.prefsSafe.preferences.flat",  // {}
        commonTerms: "{that}.options.commonTerms",            // []
        commonTermsSorted: [],
        prefsSetNames: [],
        prefsSafeApplications: "@expand:gpii.devpmt.prefsSafeApplications({that}.options.prefsSafe.preferences.flat)", // []
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
        // and if so, which prefsSet/term/product it's for and a
        // copy of the metadata.
        currentlyEditing: {
            active: false,
            current: {
                prefsSet: "",
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
        // different products to an Preferences Set, and presenting a confirm dialog
        // each time.
        activeModalDialog: {}
    },
    events: {
        createSettingsTable: null,
        openBaseDialog: null,
        openAddPrefsSetDialog: null,
        openEditPrefsSetDialog: null,
        openConfirmDialog: null,
        openConfirmAddProductDialog: null,
        openConfirmDeletePrefsSetDialog: null,
        openConfirmSaveDialog: null,
        openConfirmRemoveProductDialog: null,
        startDevWidgets: null
    },
    bindings: {
    },
    components: {
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
                    // TODO For some reason the mere presence of the below two model relays
                    // is breaking the toc widget, as it can't perform it's lookups as things
                    // are being rerendered as a byproduct of the creation of this dialog.
                    // allSolutions: "{gpii.devpmt.editPrefs}.model.allSolutions",
                    // prefsSetNames: "{gpii.devpmt.editPrefs}.model.prefsSetNames"
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
                    prefsSet: "{gpii.devpmt.editPrefs}.model.activeModalDialog.prefsSet"
                }
            }
        },
        addPrefsSetDialog: {
            type: "gpii.devpmt.dialogs.addPrefsSetDialog",
            createOnEvent: "openAddPrefsSetDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    prefsSetNames: "{gpii.devpmt.editPrefs}.model.prefsSetNames",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs"
                }
            }
        },
        editPrefsSetDialog: {
            type: "gpii.devpmt.dialogs.editPrefsSetDialog",
            createOnEvent: "openEditPrefsSetDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    prefsSetId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.prefsSetId",
                    originalPrefsSetId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.originalPrefsSetId",
                    prefsSetName: "{gpii.devpmt.editPrefs}.model.activeModalDialog.prefsSetName",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs"
                }
            }
        },
        confirmDeletePrefsSetDialog: {
            type: "gpii.devpmt.dialogs.confirmDeletePrefsSetDialog",
            createOnEvent: "openConfirmDeletePrefsSetDialog",
            container: "{that}.dom.modalDialogContainer",
            options: {
                selectors: {
                    initial: "#pmt-modal-dialog-render"
                },
                model: {
                    prefsSetId: "{gpii.devpmt.editPrefs}.model.activeModalDialog.prefsSetId",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs"
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
                    prefsSafeName: "{gpii.devpmt.editPrefs}.model.prefsSafeName",
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
                    inputData: {
                        allSolutions: "{gpii.devpmt.editPrefs}.model.allSolutions",
                        prefsSafeApplications: "{gpii.devpmt.editPrefs}.model.prefsSafeApplications"
                    }
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
                    prefsSetNames: "{gpii.devpmt.editPrefs}.model.prefsSetNames",
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
                    devModeOn: "{gpii.devpmt.editPrefs}.model.devModeOn",
                    flatPrefs: "{gpii.devpmt.editPrefs}.model.flatPrefs",
                    unsavedChanges: "{gpii.devpmt.editPrefs}.model.unsavedChanges"
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
                    prefsSetNames: "{gpii.devpmt.editPrefs}.model.prefsSetNames",
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
                    prefsSetNames: "{gpii.devpmt.editPrefs}.model.prefsSetNames",
                    settingsFilter: "",
                    allSettingsEnabled: "mysettings"
                },
                modelRelay: {
                    settingsFilter: {
                        source: {
                            prefsSet: "gpii.devpmt.editPrefs",
                            segs: ["productTableFilters", "{that}.options.appId", "settingsFilter"]
                        },
                        target: "settingsFilter",
                        singleTransform: {
                            type: "fluid.transforms.identity"
                        }
                    },
                    allSettingsEnabled: {
                        source: {
                            prefsSet: "gpii.devpmt.editPrefs",
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
        flatPrefsJsonDev: "#pmt-flatPrefs-jsonDev-container",
        sidebarAccordian: "#pmt-sidebar-accordian",
        valueDisplayCell: ".pmt-value-display",
        foundationSticky: ".sticky"
    },
    templates: {
        initial: "editprefset-viewport",
        editPrefWidget: "editpref-widget"
    },
    invokers: {
        addEditToUnsavedList: {
            funcName: "gpii.devpmt.addEditToUnsavedList",
            args: ["{that}.model.unsavedChanges", "{that}.applier", "{arguments}.0"]
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
            args: ["{that}.model.flatPrefs.contexts", "{arguments}.0", "{arguments}.1"] // prefsSet, commonTerm
        },
        lookupProductPrefValue: {
            funcName: "gpii.devpmt.lookupProductPrefValue",
            args: ["{that}.model.flatPrefs.contexts", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // prefsSet, product, settingTerm
        },
        onEditPrefsSet: {
            funcName: "gpii.devpmt.onEditPrefsSet",
            args: ["{that}", "{arguments}.0"] // event
        },
        onDeletePrefsSet: {
            funcName: "gpii.devpmt.onDeletePrefsSet",
            args: ["{that}", "{arguments}.0"] // event
        },
        updateFoundationSticky: {
            funcName: "gpii.devpmt.updateFoundationSticky",
            args: ["{that}"]
        }
    },
    listeners: {
        "onCreate.initialize": {
            funcName: "gpii.devpmt.editPrefs.initialize",
            args: ["{that}"]
        },
        "onMarkupRendered.updateFoundationSticky": {
            func: "{that}.updateFoundationSticky"
        },
        "onMarkupRendered.startFoundationAccordian": {
            func: "gpii.devpmt.startFoundationAccordian",
            args: ["{that}"]
        },
        "onMarkupRendered.initSettingsTableWidgets": {
            func: "{that}.initSettingTableWidgets"
        }
    },
    modelListeners: {
        "flatPrefs": [
            {
                func: "{that}.updateMetadataFromPrefs",
                args: ["{that}"],
                namespace: "updateMetadataFromPrefs",
                priority: "first"
            },
            {
                func: "{that}.updateCommonTermUsageCounts",
                namespace: "updateCommonTermUsageCounts",
                priority: "after:updateMetadataFromPrefs"
            }
        ],
        "prefsSafeApplications": {
            func: "{that}.reRender",
            namespace: "reRender",
            excludeSource: ["init"]
        },
        "currentlyEditing.active": {
            funcName: "gpii.devpmt.checkEditingHighlights",
            args: ["{change}.value", "{that}.dom.valueDisplayCell"],
            namespace: "checkEditingHighlights"
        }
    }
});

gpii.devpmt.checkEditingHighlights = function (active, cells) {
    if (!active) {
        cells.removeClass("pmt-value-editing");
    }
};

/**
 * Common term filter counts
 *
 * Returns the total number of common terms, and then the maximum
 * number that is set in the Preferences Set. This is used for rendering
 * information by the settings filters in the form:
 *
 * [[My Settings (3)]] [All Settings (225)]
 *
 * This provides the user with contextual knowledge before hiding
 * or showing all settings. This information could also be used
 * to perhaps only show the first 10 settings or something, and
 * then expand the rest when the user decides it is appropriate.
 *
 * If the user has multiple prefsSets, this will return the total
 * number of unique settings keys in the Preferences Set across all prefsSets.
 *
 * @param {Array} commonTermsSorted - List of our common terms, currently
 * known as generic preferences.
 * @param {Object} flatPrefs - Users current set of flat preferences.
 * @return {Object} Object with keys `prefsSafe` and `all`, such as
 *                  {
 *                      prefsSafe: 3,
 *                      all: 225
 *                  }
 */
gpii.devpmt.calculateCommonTermUsageCounts = function (commonTermsSorted, flatPrefs) {
    var all = commonTermsSorted.length;
    var prefsSafeKeys = {};
    fluid.each(flatPrefs.contexts, function (i) {
        fluid.each(i.preferences, function (j, jKey) {
            if (jKey.startsWith("http://registry.gpii.net/common")) {
                prefsSafeKeys[jKey] = true;
            }
        });
    });
    var counts = {
        all: all,
        prefsSafe: Object.keys(prefsSafeKeys).length
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
 * Lookup Generic Preference Setting.
 *
 * Using the prefsSet and commonTerm lookup the generic preference
 * value. If the preference set does not contain the value, we
 * return `undefined` to make this known, as `undefined` is not
 * a valid JSON value. Theoretically, and preference setting maybe
 * set as `null`.
 */
gpii.devpmt.lookupGenericPrefValue = function (contexts, prefsSet, commonTerm) {
    if (contexts[prefsSet].preferences[commonTerm] !== undefined) {
        return contexts[prefsSet].preferences[commonTerm];
    }
    else {
        return undefined;
    }
};

/**
 * Lookup Application Specific Setting. Similar to `lookupGenericPrefValue` lookups
 * in regard to return values, but takes an extra argument for the product.
 */
gpii.devpmt.lookupProductPrefValue = function (contexts, prefsSet, product, settingTerm) {
    if (contexts[prefsSet].preferences[product] &&
        contexts[prefsSet].preferences[product][settingTerm] !== undefined) {
        return contexts[prefsSet].preferences[product][settingTerm];
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
    fluid.each(that.model.prefsSafeApplications, function (item) {
        var sel = "#test-comp-" + item.appId;
        sel = sel.replace(/\./g, "\\.");
        var appUri = "http://registry.gpii.net/applications/" + item.appId;
        that.events.createSettingsTable.fire(sel, item.appId, that.model.allSolutions[item.appId], appUri);
    });
};

gpii.devpmt.addEditToUnsavedList = function (unsavedChanges, applier, description) {
    var curUnsavedChanges = fluid.copy(unsavedChanges);
    curUnsavedChanges.push({
        description: description
    });
    applier.change("unsavedChanges", curUnsavedChanges);
};

gpii.devpmt.updateFoundationSticky = function (that) {
    // https://github.com/zurb/foundation-sites/issues/7899
    that.dom.locate("foundationSticky").foundation("_calc", true);
};

/**
 * When the prefs are updated we need to usually update
 * some of the metadata that makes rendering easier, from
 * the new preference information.
 *
 * This should maybe be a set of model relay rules instead.
 */
gpii.devpmt.updateMetadataFromPrefs = function (that) {
    that.applier.change("prefsSetNames", gpii.devpmt.prefsSetNames(that.model.flatPrefs));
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
    $.ajax(options).done(function (/* data */) {
        //TODO what should be done here?
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
    saveAs(blob, that.model.prefsSafeName + ".json");
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
 * Edits whether a product is enabled for a specific prefsSet (preference set).
 * Can also be used to enable or unable the product for all prefsSets.
 *
 * @param {gpii.devpmt.editPrefs} that - Main prefs editor component
 * @param {Boolean} checked - `true` or `false` indicating if this product should be
 * enabled or unabled.
 * @param {String} prefsSet - PrefsSet (prefset). If this is null, the product will
 * be (un)enabled in all prefsSets.
 * @param {String} product - The uri of the product.
 */
gpii.devpmt.editProductEnabled = function (that, checked, prefsSet, product) {
    var contexts = [prefsSet];
    if (prefsSet === null) {
        contexts = fluid.copy(that.model.prefsSetNames);
    }

    fluid.each(contexts, function (prefsSet) {
        // TODO generalize these 4 lines with copied code in editwidgets.js:saveUpdateValue
        var segs = ["contexts", prefsSet, "preferences", product.replace(/\./g, "\\.")];
        var path = "flatPrefs";
        fluid.each(segs, function (item) { path += "." + item; });

        if (checked) {
            // Add a check in case it's already enabled
            that.applier.change(path, {});
            that.addEditToUnsavedList("Enabled Product for PrefsSet: " + product);
        }
        else {
            that.applier.change(path, false, "DELETE");
            that.addEditToUnsavedList("Un-enabled Product for PrefsSet: " + product);
        }
        that.applier.change("prefsSafeApplications", gpii.devpmt.prefsSafeApplications(that.model.flatPrefs));
        that.applier.change("unsavedChangesExist", true);
    });
};

/**
 * Event Listener for when a button is clicked to delete
 * a prefsSet. Fetches the prefsSet to delete from the elements
 * data-prefsSetid attribute.
 *
 * This listener doesn't actually delete the prefsSet, but
 * opens the confirm delete prefsSet dialog.
 *
 * @param {gpii.devpmt.editPrefs} that - Main prefs editor component
 * @param {DOMEvent} event - Browser event object
 */
gpii.devpmt.onDeletePrefsSet = function (that, event) {
    var prefsSetId = event.currentTarget.dataset.prefssetid;
    that.applier.change("activeModalDialog.prefsSetId", prefsSetId);
    that.events.openConfirmDeletePrefsSetDialog.fire();
};

/**
 * Event Listener for when a button is clicked to edit
 * a prefsSet. Fetches the prefsSet to delete from the elements
 * data-prefsSetid attribute.
 *
 * @param {gpii.devpmt.editPrefs} that - Main prefs editor component
 * @param {DOMEvent} event - Browser event object
 */
gpii.devpmt.onEditPrefsSet = function (that, event) {
    var prefsSetId = event.currentTarget.dataset.prefssetid;
    that.applier.change("activeModalDialog", {
        prefsSetId: prefsSetId,
        originalPrefsSetId: prefsSetId,
        prefsSetName: that.model.flatPrefs.contexts[prefsSetId].name
    });
    that.events.openEditPrefsSetDialog.fire();
};

gpii.devpmt.editValueEvent = function (that, event) {
    that.locate("valueDisplayCell").removeClass("pmt-value-editing");
    $(event.currentTarget).addClass("pmt-value-editing");
    var newCurrent = {
        prefsSet: event.currentTarget.dataset.prefsset,
        term: event.currentTarget.dataset.term,
        //value: event.currentTarget.dataset.value,
        product: event.currentTarget.dataset.product
    };

    var newMetadata = {};
    if (!newCurrent.product) {
        // Common Term
        newMetadata.schema = that.options.commonTerms[newCurrent.term];
        newCurrent.value = that.lookupGenericPrefValue(newCurrent.prefsSet, newCurrent.term);
    }
    else {
        // Application Specific
        var newProductAppId = newCurrent.product.slice("http://registry.gpii.net/applications/".length);
        newMetadata = gpii.devpmt.findProductSettingMetadata(that.model.allSolutions,
            newProductAppId, newCurrent.term);
        newCurrent.value = that.lookupProductPrefValue(newCurrent.prefsSet, newCurrent.product, newCurrent.term);
    }
    newMetadata.name = newMetadata.schema.title;
    newMetadata.description = newMetadata.schema.description;
    newCurrent.blank = newCurrent.value === undefined;

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
 * Setup various bits and pieces of the viewport.
 */
gpii.devpmt.editPrefs.initialize = function (that) {
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

    setInterval( function () {
        that.updateFoundationSticky();
    }, 250);

    $(window).bind("beforeunload", function () {
        return that.model.unsavedChangesExist ? true : undefined;
    });
};

gpii.devpmt.startFoundationAccordian = function (that) {
    var elem = that.dom.locate("sidebarAccordian");
    /* eslint-disable no-new */
    // This foundation plugin requires using the `new` operator to work.
    new Foundation.Accordion(elem);
    /* eslint-enable no-new */
};
