/* eslint-env node */
"use strict";

var path = require("path");
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
 * gpii.devpmt.basicDispath - The simplest base dispatcher that
 * has common features such as our templates.
 *
 * This dispatcher container an invoker `contextPromise` that can
 * be overridden to add extra keys to the context that is given to
 * the handlebars renderer.
 */
fluid.defaults("gpii.devpmt.baseDispatcher", {
    gradeNames: ["gpii.express.middleware.requestAware", "gpii.handlebars.dispatcherMiddleware"],
    method: "get",
    templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"],
    defaultLayout: "main",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.baseDispatcher.middleware",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        contextPromise: {
            funcName: "gpii.devpmt.baseDispatcher.contextPromise",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

/**
 * Default implementation of the `contextPromise` invoker that adds
 * no new values to the context. This can be overridden with further
 * contextual data.
 */
gpii.devpmt.baseDispatcher.contextPromise = function (/* that, req */) {
    return fluid.promise().resolve({});
};

/**
 * TODO Create a ticket in gpii-handlebars and reference here.
 *
 * The combination of this method and `gpii.devpmt.baseDispatcher.getRenderInfo`
 * tear up the following method in gpii-handlebars and insert functionality
 * to allow adding a promise to the request that will add more data to the
 * context that is provided to the template renderer.
 *  https://github.com/GPII/gpii-handlebars/blob/master/src/js/server/dispatcher.js#L19
 */
gpii.devpmt.baseDispatcher.middleware = function (that, req, res, next) {
    var renderInfo = gpii.devpmt.baseDispatcher.getRenderInfo(that, req);
    if (renderInfo && renderInfo.templatePath) {
        that.contextPromise(req).then(function (data) {
            var context = fluid.merge("replace", {}, renderInfo.context, data);
            res.status(200).render(renderInfo.templatePath, context);
        });
    }
    else {
        next({ isError: true, message: "The page you requested could not be found."});
    }
};

/**
 * See comments for gpii.devpmt.baseDispatcher.middleware for the functionality that
 * this stubs in until addressed upstream.
 */
gpii.devpmt.baseDispatcher.getRenderInfo = function (that, req) {
    var template     = req.params.template ? req.params.template : that.options.defaultTemplate;
    var templateName = template + ".handlebars";

    var resolvedTemplateDirs = gpii.express.hb.resolveAllPaths(that.options.templateDirs);
    var templateExists =  fluid.find(resolvedTemplateDirs, gpii.express.hb.getPathSearchFn(["pages", templateName]));
    if (templateExists) {
        var layoutExists    = fluid.find(resolvedTemplateDirs, gpii.express.hb.getPathSearchFn(["layouts", templateName]));
        var layoutName      = layoutExists ? templateName : that.options.defaultLayout;
        var contextToExpose = fluid.model.transformWithRules({ model: that.model, req: req, layout: layoutName }, that.options.rules.contextToExpose);
        return {
            templatePath: path.join("pages", templateName),
            context: contextToExpose
        };
    }
    else {
        // fluid.error("Could not find template... properly handle this.");
        return null;
    }
};

/**
 * Dispatcher for the page allowing you to edit a preferences safe.
 */
fluid.defaults("gpii.devpmt.editPrefSetHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    handlerGrades: [],
    path: ["/editprefs/:npset"],
    defaultTemplate: "editprefset",
    rules: {
        contextToExpose: {
            commonTerms: {
                "transform": {
                    type: "fluid.transforms.free",
                    func: "fluid.getForComponent",
                    args: ["{gpii.devpmt}", "commonTermsDataSource.current.schemas"]
                }
            },
            allSolutions: {
                "transform": {
                    type: "fluid.transforms.free",
                    func: "fluid.getForComponent",
                    args: ["{devpmt}", "model.solutions"]
                }
            }
        }
    },
    invokers: {
        contextPromise: {
            funcName: "gpii.devpmt.editPrefSetHandler.contextPromise",
            args: ["{that}", "{gpii.devpmt}", "{arguments}.0"]
        }
    }
});

/**
 * Adds the `gpii.devpmt.npset` for the request to the handlebars
 * context.
 */
gpii.devpmt.editPrefSetHandler.contextPromise = function (that, devpmt, req) {
    return fluid.promise.map(devpmt.prefSetDataSource.get({prefSetId: req.params.npset}), function (data) {
        var npset = devpmt.ontologyHandler.rawPrefsToOntology(data, "flat");
        var prefset = gpii.devpmt.npset({
            npsetName: req.params.npset,
            flatPrefs: npset,
            docs: ""
        });
        return {
            npset: prefset
        };
    });
};

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
var thePort = process.env.PORT || 8080;
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
            type: "gpii.devpmt.baseDispatcher",
            options: {
                path: ["/"],
                defaultTemplate: "index",
                rules: {
                    contextToExpose: {
                        npsetList: {
                            "transform": {
                                type: "fluid.transforms.free",
                                func: "fluid.getForComponent",
                                args: ["{devpmt}", "model.npsetList"]
                            }
                        },
                        selectedDemoSets: {
                            "transform": {
                                type: "fluid.transforms.free",
                                func: "fluid.getForComponent",
                                args: ["{devpmt}", "model.selectedDemoSets"]
                            }
                        }
                    }
                }
            }
        },
        editPrefSetHandler: {
            type: "gpii.devpmt.editPrefSetHandler"
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
            type: "gpii.devpmt.baseDispatcher",
            options: {
                priority: "before:htmlErrorHandler",
                path: ["/:template", "/"]
            }
        },
        // htmlErrorHandler: {
        //     type: "gpii.handlebars.errorRenderingMiddleware",
        //     options: {
        //         priority: "last",
        //         templateKey: "pages/error"
        //     }
        // },
        commonTermsDataSource: {
            type: "gpii.devpmt.dataSource.commonTermsMetadata"
        },
        prefSetDataSource: {
            type: "gpii.devpmt.dataSource.prefSet",
            options: {
                prefSetDir: "{gpii.devpmt}.options.prefsetDirectory"
            }
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
        dirListingDataSource: {
            type: "gpii.devpmt.dataSource.prefsetListing",
            options: {
                prefSetDir: "{gpii.devpmt}.options.prefsetDirectory"
            }
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

    var dirListPromise = that.dirListingDataSource.get();
    dirListPromise.then(function (data) {
        var npsets = [];
        fluid.each(data, function (val) {
            if (val.endsWith(".json") || val.endsWith(".json5")) {
                npsets.push(val.split(/\./)[0]);
            }
        });
        that.applier.change("npsetList", npsets);
    });
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
    gpii.devpmt.addNPSet(devpmt.prefSetDataSource, prefsetName);
    res.redirect("/editprefs/" + prefsetName);
};

fluid.registerNamespace("gpii.devpmt.savePrefsetHandler");

gpii.devpmt.savePrefsetHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    devpmt.prefSetDataSource.set({prefSetId: req.params.npset}, req.body);
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
