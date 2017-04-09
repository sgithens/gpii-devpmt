/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var JSON5 = require("json5");
fluid.require("gpii-express");
fluid.require("gpii-handlebars");
var fs = require("fs");
require("universal");
require(__dirname + "/src/js/common/util.js");

fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.handlebars");

fluid.module.register("gpii-devpmt", __dirname, require);

/** gpii.handlebars.requestFuncTransform
 *  This component is sort of a facsimile of the functions available
 *  in many web frameworks that take a request instance or URL parameter
 *  and return something for the response. In this case what is returned
 *  will be assigned to the variable in the transform.
 */
fluid.defaults("gpii.handlebars.requestFuncTransform", {
    gradeNames: ["fluid.standartInputTransformFunction"]
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

gpii.devpmt.loadNPSet = function (prefsetDir, prefsetName, ontologyHandler) {
    var elod = JSON5.parse(fs.readFileSync(
        __dirname + prefsetDir + prefsetName + ".json"));
    var npset = ontologyHandler.rawPrefsToOntology(elod, "flat");
    return npset;
};

gpii.devpmt.loadNPSetDocs = function (prefsetDir, prefsetName) {
    var docs = "";
    var filename = __dirname + prefsetDir + prefsetName + ".md";
    if (fs.existsSync(filename)) {
        docs = fs.readFileSync(filename, {encoding: "UTF8"});
    }
    return docs;
};

gpii.devpmt.saveNPSet = function (prefsetDir, npsetName, data) {
    fs.writeFileSync(prefsetDir + npsetName + ".json", data);
};

/**
 * gpii.devpmt.basicDispath - The simplest base dispatcher that
 * has common features such as our templates.
 */
fluid.defaults("gpii.devpmt.baseDispather", {
    gradeNames: ["gpii.handlebars.dispatcherMiddleware"],
    method: "get",
    templateDirs: [__dirname + "/src/templates"],
    defaultLayout: "main"
});

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.express.withJsonQueryParser"],
    port: 8080,
    prefsetDirectory: "/node_modules/universal/testData/preferences/",
    components: {
        ontologyHandler: {
            type: "gpii.ontologyHandler"
        },
        jsonBodyParser: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        foundationRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/modules",
                content: __dirname + "/node_modules/"
            }
        },
        staticRouter: {
            type: "gpii.express.router.static",
            options: {
                path: "/src",
                content: __dirname + "/src/"
            }
        },
        hb: {
            type: "gpii.express.hb",
            options: {
                templateDirs: [__dirname + "/src/templates"]
            }
        },
        indexHandler: {
            type: "gpii.devpmt.baseDispather",
            options: {
                path: ["/"],
                defaultTemplate: "index",
                rules: {
                    contextToExpose: {
                        npsetList: { literalValue: "{devpmt}.options.npsetList" }
                    }
                }
            }
        },
        allSettingsPageHandler: {
            type: "gpii.devpmt.baseDispather",
            options: {
                path: ["/all-settings"],
                defaultTemplate: "all-settings",
                rules: {
                    contextToExpose: {
                        commonTerms: { literalValue: "{devpmt}.options.commonTermMetadata" },
                        allSolutions: { literalValue: "{devpmt}.options.allSolutions" }
                    }
                }
            }
        },
        editPrefSetHandler: {
            type: "gpii.devpmt.baseDispather",
            options: {
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
                }
            }
        },
        savePrefsetHandler: {
            type: "gpii.devpmt.savePrefsetHandler",
            options: {
                path: ["/saveprefset/:npset"]
            }
        },
        inline: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path: "/hbs",
                templateDirs: [__dirname + "/src/templates"]
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
        expander: { funcName: "gpii.devpmt.loadAllSolutions" }
    }
});

fluid.registerNamespace("gpii.devpmt.savePrefsetHandler");

gpii.devpmt.savePrefsetHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    gpii.devpmt.saveNPSet("./" + devpmt.options.prefsetDirectory, req.params.npset, JSON5.stringify(req.body, null, 4));
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


/**
 * Return our new metadata that includes descriptive content for each
 * common term including a json schema.
 *
 * @return (Object) Common terms keyed by flat id
 */
gpii.devpmt.loadCommonTermsMetadata = function () {
    var commonTerms = JSON5.parse(fs.readFileSync(
        __dirname + "/src/js/commonTerms.json5"));
    return commonTerms;
};

/**
 * For now load all the solutions documents from the universal repo,
 * this needs to be replaced with a straight call to the solutions
 * registry.
 */
gpii.devpmt.loadAllSolutions = function () {
    var solutionFiles = ["android","darwin","linux","web","win32"];
    var togo = {};
    fluid.each(solutionFiles, function (value) {
        var next = JSON5.parse(fs.readFileSync(
            __dirname + "/node_modules/universal/testData/solutions/" + value + ".json5"));
        togo = fluid.merge({"": ["replace,noexpand"]}, togo, next);
    });
    return togo;
};

/**
 * loadTestDataNPSets - A function to fetch the current list of NP sets that are
 * being used for development in GPII testData.
 *
 * @return (Array) Simple relay of file names without parent path, ex.
 *      ["alice.json", "elod.json"]
 */
gpii.devpmt.loadTestDataNPSets = function (folder) {
    var allFiles = fs.readdirSync(
        __dirname + folder);
    var npsets = [];
    fluid.each(allFiles, function (val) {
        if (val.endsWith(".json") || val.endsWith(".json5")) {
            npsets.push(val.split(/\./)[0]);
        }
    });
    return npsets;
};

gpii.devpmt();

module.exports = gpii.devpmt;
