/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var JSON5 = require("json5");
fluid.require("gpii-express");
fluid.require("gpii-handlebars");
var fs = require("fs");
require("universal");

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
    gradeNames: ["fluid.standardTransformFunction"]
});

gpii.handlebars.requestFuncTransform = function (value, transformSpec) {
    return fluid.invokeGlobalFunction(transformSpec.func, value);
};

/**
 * gpii.devpmt.npset - Infusion component representing a single NP Set for
 * a user or snapset. Based on current hardwire, loads it's NP Set from
 * the bundled GPII's testData.
 *
 * When creating a new instance, the npsetName is required in the options
 * block.
 *
 * gpii.devpmt.npset({ npsetName: "alice" });
 *
 * This will become a model component for NP set editing.
 */
fluid.defaults("gpii.devpmt.npset", {
    gradeNames: ["fluid.component"],
    // npsetName: "elod",
    flatPrefs: {
        expander: {
            funcName: "gpii.devpmt.loadNPSet",
            args: ["{that}.options.npsetName", "{ontologyHandler}"]
        }
    },
    docs: {
        expander: {
            funcName: "gpii.devpmt.loadNPSetDocs",
            args: ["{that}.options.npsetName"]
        }
    },
    invokers: {
        contextNames: {
            funcName: "gpii.devpmt.contextNames",
            args: ["{that}.options.flatPrefs"]
        },
        prettyPrintFlatPrefs: {
            funcName: "JSON.stringify",
            args: ["{that}.options.flatPrefs", null, 4]
        },
        npsetApplications: {
            funcName: "gpii.devpmt.npsetApplications",
            args: ["{that}.options.flatPrefs"]
        }
    },
    components: {
        ontologyHandler: {
            type: "gpii.ontologyHandler"
        }
    }
});


/**
 * npsetApplications - Goes through all the contexts in a flat prefs set
 * and pulls out the flat pref URI and app ID. Returns all the apps a
 * user has settings.
 *
 * @param prefs (Object) Transformed flat preferences set
 * @return (Array) An array of objects structured as the following: (RWG example)
 *     {
 *         uri: "http://registry.gpii.net/applications/com.texthelp.readWriteGold",
 *         appId: "com.texthelp.readWriteGold"
 *     }
 */
gpii.devpmt.npsetApplications = function (prefs) {
    var apps = {};
    fluid.each(prefs.contexts, function (context) {
        fluid.each(context.preferences, function (prefBody, prefKey) {
            if (prefKey.startsWith("http://registry.gpii.net/applications")) {
                if (!apps[prefKey]) {
                    apps[prefKey] = {
                        uri: prefKey,
                        appId: prefKey.split(/\//).pop(),
                        settingKeys: []
                    };
                }
                // Add any keys that may or may not be in one of the contexts
                fluid.each(prefBody, function (settingBody, settingKey) {
                    if (apps[prefKey].settingKeys.indexOf(settingKey) < 0) {
                        apps[prefKey].settingKeys.push(settingKey);
                    }
                });
            }
        });
    });
    return fluid.values(apps);
};

/**
 * contextNames - Takes a rawPrefs set and returns a list of all the
 * context names. This function ensures that the first item in the list is
 * always the default context, 'gpii-default', and the rest of the contexts
 * in an order that will always be the same. The stability of the order is
 * so that we can build html tables and other structures successfully.
 *
 * @param prefs (Object) - A prefs set.
 * @return (Array) - List of context names.
 */
gpii.devpmt.contextNames = function (prefs) {
    var contextNames = [];
    fluid.each(prefs.contexts, function (value, key) {
        if (key !== "gpii-default" && contextNames.indexOf(key) < 0) {
            contextNames.push(key);
        }
    });
    contextNames.sort();
    contextNames.unshift("gpii-default");
    return contextNames;
};

gpii.devpmt.loadNPSet = function (prefsetName, ontologyHandler) {
    var elod = JSON5.parse(fs.readFileSync(
        __dirname + "/node_modules/universal/testData/preferences/" + prefsetName + ".json"));
    var npset = ontologyHandler.rawPrefsToOntology(elod, "flat");
    return npset;
};

gpii.devpmt.loadNPSetDocs = function (prefsetName) {
    var docs = "";
    var filename = __dirname + "/node_modules/universal/testData/preferences/" + prefsetName + ".md";
    if (fs.existsSync(filename)) {
        docs = fs.readFileSync(filename);
    }
    return docs;
};

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.express"],
    port: 8080,
    components: {
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
                path: "/",
                content: __dirname + "/src/templates/pages/"
            }
        },
        hb: {
            type: "gpii.express.hb",
            options: {
                templateDirs: [__dirname + "/src/templates"]
            }
        },
        prefSetHandler: {
            type: "gpii.handlebars.dispatcherMiddleware",
            options: {
                path: ["/prefs/:npset"],
                method: "get",
                defaultTemplate: "prefset",
                templateDirs: [__dirname + "/src/templates"],
                rules: {
                    contextToExpose: {
                        commonTerms: { literalValue: "{devpmt}.options.commonTermList" },
                        npsetList: { literalValue: "{devpmt}.options.npsetList" },
                        req: { params: "req.params", query: "req.query" },
                        npset: {
                            "transform": {
                                type: "gpii.handlebars.requestFuncTransform",
                                func: "gpii.devpmt.requestNPSet",
                                inputPath: "req"
                            }
                        }
                    }
                }
            }
        },
        dispatcher: {
            type: "gpii.handlebars.dispatcherMiddleware",
            options: {
                priority: "before:htmlErrorHandler",
                path: ["/:template", "/"],
                method: "get",
                templateDirs: [__dirname + "/src/templates"]
            }
        },
        // htmlErrorHandler: {
        //     type: "gpii.handlebars.errorRenderingMiddleware",
        //     options: {
        //         priority: "last",
        //         templateKey: "pages/error"
        //     }
        // },
        npset: {
            type: "gpii.devpmt.npset",
            options: {
                npsetName: "elod"
            }
        }
    },
    commonTermList: {
        expander: { funcName: "gpii.devpmt.loadCommonTerms" }
    },
    npsetList: {
        expander: { funcName: "gpii.devpmt.loadTestDataNPSets" }
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
gpii.devpmt.requestNPSet = function (request) {
    return gpii.devpmt.npset({ npsetName: request.params.npset });
};

/**
 * loadCommonTerms - A function to fetch the current list of common terms
 * to populate the generic preferences table.
 *
 * TODO Currently this is being fetched from the ISO24751-flat.json5 mapping
 * file in universal, the only place listing all these terms. This will be replaced,
 * along with extra metadata by a seperate repo documenting these terms.
 *
 * @return (Array) Simple array of flat common term names.
 */
gpii.devpmt.loadCommonTerms = function () {
    var isoToFlatMapping = JSON5.parse(fs.readFileSync(
        __dirname + "/node_modules/universal/testData/ontologies/mappings/ISO24751-flat.json5"));
    var commonTerms = [];
    fluid.each(isoToFlatMapping, function (val, key) {
        if (key.indexOf("common") > 0) {
            commonTerms.push({
                name: key.split("/").pop(),
                term: key.replace(/\\./g, ".") // TODO Hack only while we are reading from ISO27451-flat.json
            });
        }
    });
    return commonTerms;
};

/**
 * loadTestDataNPSets - A function to fetch the current list of NP sets that are
 * being used for development in GPII testData.
 *
 * @return (Array) Simple relay of file names without parent path, ex.
 *      ["alice.json", "elod.json"]
 */
gpii.devpmt.loadTestDataNPSets = function () {
    var allFiles = fs.readdirSync(
        __dirname + "/node_modules/universal/testData/preferences/");
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
