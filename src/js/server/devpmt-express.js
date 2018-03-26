/* eslint-env node */
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var JSON5 = require("json5");
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
 * gpii.devpmt.basicDispath - The simplest base dispatcher that
 * has common features such as our templates.
 */
fluid.defaults("gpii.devpmt.baseDispather", {
    gradeNames: ["gpii.express.middleware.requestAware", "gpii.handlebars.dispatcherMiddleware"],
    method: "get",
    templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"],
    defaultLayout: "main"
});

fluid.defaults("gpii.devpmt.editPrefSetHandler", {
    gradeNames: ["gpii.devpmt.baseDispather"],
    handlerGrades: [],
    path: ["/editprefs/:npset"],
    defaultTemplate: "editprefset",
    rules: {
        contextToExpose: {
            commonTerms: { literalValue: "{devpmt}.options.commonTermMetadata" },
            allSolutions: { literalValue: "{devpmt}.options.allSolutions" },
            npset: {
                "transform": {
                    type: "gpii.handlebars.requestFuncTransform",
                    func: "gpii.devpmt.requestNPSet",
                    inputPath: "req",
                    that: "{devpmt}"
                }
            }
        }
    },
    listeners: {
        "onCreate": [
        ]
    }
});

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
var thePort = process.env.PORT || 8080;
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.express.withJsonQueryParser"],
    port: thePort,
    prefsetDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/preferences/)",
    solutionsDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/solutions/)",
    events: {
        onFsChange: null
    },
    listeners: {
        "onFsChange.reloadInlineTemplates": {
            func: "{inlineMiddleware}.events.loadTemplates.fire"
        }
    },
    components: {
        ontologyHandler: {
            type: "gpii.ontologyHandler"
        },
        urlEncodedParser: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        jsonBodyParser: {
            type: "gpii.express.middleware.bodyparser.json"
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
        indexHandler: {
            type: "gpii.devpmt.baseDispather",
            options: {
                path: ["/"],
                defaultTemplate: "index",
                rules: {
                    contextToExpose: {
                        npsetList: { literalValue: "{devpmt}.options.npsetList" },
                        prefsetDirectory: { literalValue: "{devpmt}.options.prefsetDirectory" },
                        selectedDemoSets: { literalValue: "{devpmt}.options.selectedDemoSets" }
                    }
                }
            }
        },
        editPrefSetHandler: {
            type: "gpii.devpmt.editPrefSetHandler"
            // options: {
            //     path: ["/editprefs/:npset"],
            //     defaultTemplate: "editprefset",
            //     rules: {
            //         contextToExpose: {
            //             commonTerms: { literalValue: "{devpmt}.options.commonTermMetadata" },
            //             allSolutions: { literalValue: "{devpmt}.options.allSolutions" },
            //             theRealNpsetParam: { literalValue: "{that}.request" }, //{ literalValue: "{that}.options.request.npset" },
            //             npset: {
            //                 "transform": {
            //                     type: "gpii.handlebars.requestFuncTransform",
            //                     func: "gpii.devpmt.requestNPSet",
            //                     inputPath: "req",
            //                     that: "{devpmt}"
            //                 }
            //             }
            //         }
            //     }
            // }
        },
        savePrefsetHandler: {
            type: "gpii.devpmt.savePrefsetHandler",
            options: {
                path: ["/saveprefset/:npset"]
            }
        },
        addPrefsetFormHandler: {
            type: "gpii.devpmt.addPrefsetFormHandler",
            options: {
                path: ["/add-prefset"]
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
            type: "gpii.devpmt.baseDispather",
            options: {
                priority: "before:htmlErrorHandler",
                path: ["/:template", "/"]
            }
        }
        // htmlErrorHandler: {
        //     type: "gpii.handlebars.errorRenderingMiddleware",
        //     options: {
        //         priority: "last",
        //         templateKey: "pages/error"
        //     }
        // },
    },
    npsetList: {
        expander: {
            funcName: "gpii.devpmt.loadTestDataNPSets",
            args: ["{that}.options.prefsetDirectory"]
        }
    },
    commonTermMetadata: {
        expander: { funcName: "gpii.devpmt.loadCommonTermsMetadata" }
    },
    allSolutions: {
        expander: {
            funcName: "gpii.devpmt.loadAllSolutions",
            args: ["{that}.options.solutionsDirectory"]
        }
    },
    selectedDemoSets: {
        expander: { funcName: "{that}.loadSelectedDemoSets" }
    },
    invokers: {
        loadSelectedDemoSets: {
            funcName: "gpii.devpmt.loadSelectedDemoSets",
            args: ["{that}"]
        }
    }
});

/**
 * gpii.devpmt.loadSelectedDemoSets
 * For our selected demo personas (alice, davey, etc) this will return
 * an object keyed by persona token. Each entry will have at least 1 key
 * of name `doc` that is their markdown description.
 *
 * @return (Object) Demo persona information keyed by token/key
 */
gpii.devpmt.loadSelectedDemoSets = function (that) {
    var personaKeys = ["alice", "davey", "david", "elmer", "elod", "livia"];
    var togo = {};
    fluid.each(personaKeys, function (i) {
        togo[i] = {
            doc: gpii.devpmt.loadNPSetDocs(that.options.prefsetDirectory, i)
        };
    });
    return togo;
};

fluid.registerNamespace("gpii.devpmt.addPrefsetFormHandler");

fluid.defaults("gpii.devpmt.addPrefsetFormHandler", {
    gradeNames: ["gpii.express.middleware"],
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.addPrefsetFormHandler.handleRequest",
            args: ["{that}", "{devpmt}", "{arguments}.0", "{arguments}.1" /*, "{arguments}.2" */]
        }
    }
});

gpii.devpmt.addPrefsetFormHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    var prefsetName = req.body["prefset-name"];
    gpii.devpmt.addNPSet(devpmt.options.prefsetDirectory, prefsetName);
    res.redirect("/editprefs/" + prefsetName);
};

fluid.registerNamespace("gpii.devpmt.savePrefsetHandler");

gpii.devpmt.savePrefsetHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    gpii.devpmt.saveNPSet(devpmt.options.prefsetDirectory, req.params.npset, JSON5.stringify(req.body, null, 4));
    res.send("{result: 'ok'}");
};

fluid.defaults("gpii.devpmt.savePrefsetHandler", {
    gradeNames: ["gpii.express.middleware"],
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.savePrefsetHandler.handleRequest",
            args: ["{that}", "{devpmt}", "{arguments}.0", "{arguments}.1" /*, "{arguments}.2" */]
        }
    }
});

/**
 * gpii.devpmt.requestNPSet
 * Grabs the npset from the URL parameter :npset, builds an npset
 * component with that name, and returns it.
 *
 * @param (Object) request - GPII Express Request Instance
 * @returns (Object) The NP Set component
 */
gpii.devpmt.requestNPSet = function (that, request) {
    var flatPrefs = gpii.devpmt.loadNPSet(that.options.prefsetDirectory, request.params.npset, that.ontologyHandler);
    var docs = gpii.devpmt.loadNPSetDocs(that.options.prefsetDirectory, request.params.npset);
    return gpii.devpmt.npset({
        npsetName: request.params.npset,
        flatPrefs: flatPrefs,
        docs: docs
    });
};
