/* eslint-env node */
"use strict";
var path = require("path");
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

/**
 * Page Dispatcher and Handlers for the PPT and related work.
 *
 * Current paths:
 *
 *  /                        Demo page with list of all snapsets and prefsets
 *  /editprefs/:npset        PPT Full page for editing the prefset
 *  /saveprefset/:npset      JSON endpoint for saving a prefset
 *  /add-prefset             HTML Form endpoint for adding a new prefset
 *
 * New paths for Safe creation and login work
 *  /login               Create a safe or login with existing safe page.
 *  /create/anonsafe     Create a new anonymous safe with password
 *  /mysafe              Landing page for a safe.
 *  /mysafe/prefsets     UI for editing and viewing prefsets in a safe
 *  /mysafe/keys         UI for editing and viewing keys in a safe
 *
 * New paths for demo and development
 * /widgetgallery        Gallery of different widgets for viewing prefsets,
 *                       keys, and other items.
 */

//
// Prefsets handlers from first iteration of PPT development
//

/**
 * gpii.devpmt.baseDispatcher - The simplest base dispatcher that
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

// URLPATH /

/**
 * Index Handler for /
 */
fluid.defaults("gpii.devpmt.dispatchers.index", {
    gradeNames: "gpii.devpmt.baseDispatcher",
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
});


// URLPATH /editprefs/:npset

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
 * Adds the `gpii.devpmt.npset` for the request to the handlebars context.
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

// URLPATH /saveprefset/:npset
fluid.registerNamespace("gpii.devpmt.savePrefsetHandler");

fluid.defaults("gpii.devpmt.savePrefsetHandler", {
    gradeNames: ["gpii.express.middleware"],
    path: ["/saveprefset/:npset"],
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.savePrefsetHandler.handleRequest",
            args: ["{that}", "{devpmt}", "{arguments}.0", "{arguments}.1" /*, "{arguments}.2" */]
        }
    }
});

gpii.devpmt.savePrefsetHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    devpmt.prefSetDataSource.set({prefSetId: req.params.npset}, req.body);
    res.send("{result: 'ok'}");
};

// URLPATH /add-prefset
fluid.registerNamespace("gpii.devpmt.addPrefsetFormHandler");

fluid.defaults("gpii.devpmt.addPrefsetFormHandler", {
    gradeNames: ["gpii.express.middleware"],
    path: ["/add-prefset"],
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

// URLPATH /widgetgallery
fluid.defaults("gpii.devpmt.widgetGalleryHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    path: ["/widgetgallery"],
    method: "get",
    defaultTemplate: "widgetgallery"
});
