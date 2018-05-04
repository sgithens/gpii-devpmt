/* eslint-env node */
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.require("gpii-express");
fluid.require("gpii-handlebars");
require("gpii-universal");

fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.handlebars");


/** gpii.handlebars.requestFuncTransform
 *  This component is sort of a facsimile of the functions available
 *  in many web frameworks that take a request instance or URL parameter
 *  and return something for the response. In this case what is returned
 *  will be assigned to the variable in the transform.
 */
fluid.defaults("gpii.handlebars.requestFuncTransform", {
    gradeNames: ["fluid.component"]
});

gpii.handlebars.requestFuncTransform = function (value, transformSpec) {
    return fluid.invokeGlobalFunction(transformSpec.func, [transformSpec.that, value]);
};

/**
 * Allows fetching a component from the tree using an IoC expression of the
 * type one would normally place in a components defaults block. If there is
 * more than one instance of this component, will use the first instance in
 * the returned list.
 *
 * An example path might be:
 * "{gpii.devpmt}.options.prefSetDir"
 *
 * but could be any resolvable path on the component.
 *
 * @param  {string} path  The IoC path to look up.
 * @return {Any}          The value at the path.
 */
fluid.getValueByGlobalPath = function (path) {
    var contextRef = fluid.parseContextReference(path);
    var comp = fluid.queryIoCSelector(fluid.rootComponent, contextRef.context)[0];
    return fluid.getForComponent(comp, contextRef.path);
};

/**
 * gpii.devpmt.npset - Infusion component representing a single NP Set for
 * a user or snapset. Based on current hardwire, loads it's NP Set from
 * the bundled GPII's testData.
 *
 * When creating a new instance, the npsetName is required in the options
 * block.
 *
 * gpii.devpmt.npset({ npsetName: "alice" , flatPrefs: flatPrefsObject});
 *
 * This will become a model component for NP set editing.
 */
fluid.defaults("gpii.devpmt.npset", {
    gradeNames: ["fluid.component"],
    // npsetName: "elod",
    // flatPrefs: {},
    // docs: {
    //     expander: {
    //         funcName: "gpii.devpmt.loadNPSetDocs",
    //         args: ["{that}.options.npsetName"]
    //     }
    // },
    invokers: {
        contextNames: {
            funcName: "gpii.devpmt.contextNames",
            args: ["{that}.options.flatPrefs"]
        },
        npsetApplications: {
            funcName: "gpii.devpmt.npsetApplications",
            args: ["{that}.options.flatPrefs"]
        }
    }
});

/**
 * Base express grade for our devpmt based express apps
 */
fluid.defaults("gpii.devpmt.express.base", {
    gradeNames: ["gpii.express.withJsonQueryParser"],
    components: {
        urlEncodedParser: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        jsonBodyParser: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        cookieparser: {
            type: "gpii.express.middleware.cookieparser",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                },
                priority: "before:sessionMiddleware"
            }
        },
        sessionMiddleware: {
            type: "gpii.express.middleware.session",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                }
            }
        },
        foundationRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/modules",
                content: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/)"
            }
        },
        staticRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/src",
                content:  "@expand:fluid.module.resolvePath(%gpii-devpmt/src/)"
            }
        },
        inlineMiddleware: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path: "/hbs",
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"]
            }
        },
        dispatcher: {
            type: "gpii.devpmt.baseDispatcher",
            options: {
                priority: "before:htmlErrorHandler",
                path: ["/:template", "/"]
            }
        }
    }
});

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
var thePort = process.env.PORT || 8085;
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.express.withJsonQueryParser", "fluid.modelComponent"],
    port: thePort,
    prefsetDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/preferences/)",
    solutionsDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/solutions/)",
    events: {
        onFsChange: null
    },
    model: {
        selectedDemoSets: {},
        solutions: {},
        npsetList: []
    },
    listeners: {
        "onCreate": {
            funcName: "gpii.devpmt.initialize",
            args: ["{that}"]
        },
        "onFsChange.reloadInlineTemplates": {
            func: "{inlineMiddleware}.events.loadTemplates.fire"
        }
    },
    components: {
        urlEncodedParser: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        jsonBodyParser: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        cookieparser: {
            type: "gpii.express.middleware.cookieparser",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                },
                priority: "before:sessionMiddleware"
            }
        },
        sessionMiddleware: {
            type: "gpii.express.middleware.session",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                }
            }
        },
        foundationRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/modules",
                content: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/)"
            }
        },
        staticRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/src",
                content:  "@expand:fluid.module.resolvePath(%gpii-devpmt/src/)"
            }
        },
        inlineMiddleware: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path: "/hbs",
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"]
            }
        },
        // dispatcher: {
        //     type: "gpii.devpmt.baseDispatcher",
        //     options: {
        //         priority: "before:htmlErrorHandler",
        //         path: ["/:template", "/"]
        //     }
        // },
        // Removed the above from the common express base grade
        ontologyHandler: {
            type: "gpii.ontologyHandler"
        },
        hb: {
            type: "gpii.express.hb.live",
            options: {
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"],
                listeners: {
                    "onFsChange.notifyExpress": {
                        func: "{gpii.devpmt}.events.onFsChange.fire"
                    }
                }
            }
        },
        /*
         * Page Dispatchers, see devpmt-page-dispatchers.js
         */
        indexHandler: {
            type: "gpii.devpmt.dispatchers.index",
            options: {
                path: "/"
            }
        },
        editPrefSetHandler: {
            type: "gpii.devpmt.editPrefSetHandler",
            options: {
                path: "/editprefs/:npset"
            }
        },
        savePrefsetHandler: {
            type: "gpii.devpmt.savePrefsetHandler",
            options: {
                path: "/saveprefset/:npset"
            }
        },
        addPrefsetFormHandler: {
            type: "gpii.devpmt.addPrefsetFormHandler",
            options: {
                path: "/add-prefset"
            }
        },
        widgetGalleryHandler: {
            type: "gpii.devpmt.widgetGalleryHandler",
            options: {
                path: "/widgetgallery"
            }
        },
        // htmlErrorHandler: {
        //     type: "gpii.handlebars.errorRenderingMiddleware",
        //     options: {
        //         priority: "last",
        //         templateKey: "pages/error"
        //     }
        // },

        /**
         * Data Sources: see devpmt.datasources.js
         */
        commonTermsDataSource: {
            type: "gpii.devpmt.dataSource.commonTermsMetadata"
        },
        prefSetDataSource: {
            type: "gpii.devpmt.dataSource.prefSet.couchdb"
            // type: "gpii.devpmt.dataSource.prefSet.filesystem",
            // options: {
            //     prefSetDir: "{gpii.devpmt}.options.prefsetDirectory"
            // }
        },
        prefSetDocsDataSource: {
            type: "gpii.devpmt.dataSource.prefSetDocs",
            options: {
                prefSetDir: "{gpii.devpmt}.options.prefsetDirectory"
            }
        },
        solutionsDataSource: {
            type: "gpii.devpmt.dataSource.solutions",
            options: {
                solutionsDir: "{gpii.devpmt}.options.solutionsDirectory"
            }
        },
        prefsSafesListingDataSource: {
            // type: "gpii.devpmt.dataSource.prefsSafeListing.filesystem"
            type: "gpii.devpmt.dataSource.prefsSafeListing.couchdb"
        }
    }
});

gpii.devpmt.initialize = function (that) {
    var personaKeys = ["alice", "davey", "david", "elmer", "elod", "livia"];
    fluid.each(personaKeys, function (i) {
        var prom = that.prefSetDocsDataSource.get({prefSetId: i});
        prom.then(function (data) {
            that.applier.change("selectedDemoSets." + i, {doc: data});
        });
    });

    var osList = ["android","darwin","linux","web","win32"];
    fluid.each(osList, function (osId) {
        var prom = that.solutionsDataSource.get({osId: osId});
        prom.then(function (data) {
            var solutions = fluid.copy(that.model.solutions);
            solutions = fluid.merge({"": ["replace,noexpand"]}, solutions, data);
            that.applier.change("solutions", solutions);
        });
    });

    var prefsSafesList = that.prefsSafesListingDataSource.get();
    prefsSafesList.then(function (data) {
        that.applier.change("npsetList", data);
    });
};

/**
 * gpii.devpmt.requestNPSet
 * Grabs the npset from the URL parameter :npset, builds an npset
 * component with that name, and returns it.
 *
 * @param (Object) request - GPII Express Request Instance
 * @returns (Object) The NP Set component
 */
gpii.devpmt.requestNPSet = function (that, request) {
    that.prefSetDataSource.get({
        prefSetId: request.params.npset
    });

    var flatPrefs = gpii.devpmt.loadNPSet(that.options.prefsetDirectory, request.params.npset, that.ontologyHandler);
    var docs = gpii.devpmt.loadNPSetDocs(that.options.prefsetDirectory, request.params.npset);
    return gpii.devpmt.npset({
        npsetName: request.params.npset,
        flatPrefs: flatPrefs,
        docs: docs
    });
};
