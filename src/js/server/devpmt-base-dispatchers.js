/**
 * Base Dispatchers
 *
 * Contains `gpii.devpmt.baseDispatcher` which can be used for building
 * the specific dispatchers in the system. Brings in functionality from
 * gpii-express and gpii-handlebars and adds extra hooks for performing
 * authorization checks and adding additional context to the rendering
 * contexts.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
/* eslint-env node */
"use strict";
var path = require("path");
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");


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
        },
        checkAuthorization: {
            funcName: "gpii.devpmt.baseDispatcher.checkAuthorization",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
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
 * The combination of this method and `gpii.devpmt.baseDispatcher.getRenderInfo`
 * tear up the following method in gpii-handlebars and insert functionality
 * to allow adding a promise to the request that will add more data to the
 * context that is provided to the template renderer.
 *  https://github.com/GPII/gpii-handlebars/blob/master/src/js/server/dispatcher.js#L19
 */
gpii.devpmt.baseDispatcher.middleware = function (that, req, res, next) {
    // Allow for an authorization check
    if (!that.checkAuthorization(req, res, next)) {
        return;
    }

    var renderInfo = gpii.devpmt.baseDispatcher.getRenderInfo(that, req);
    if (renderInfo && renderInfo.templatePath) {
        that.contextPromise(req).then(function (data) {
            var context = fluid.merge("replace", {}, renderInfo.context, data);
            res.status(200).render(renderInfo.templatePath, context);
        }, function (err) {
            res.status(400).send(err);
        });
    }
    else {
        next({ isError: true, message: "The page you requested could not be found."});
    }
};

/**
 * Empty authorization check that can be overridden by implementors.
 * Takes the same signature as middleware for flexibility as to the behavior.
 *
 * @return True or false if the authorization passed. If the value is False,
 * we won't perform any additional processing.
 */
gpii.devpmt.baseDispatcher.checkAuthorization = function (/* that, req, res, next */) {
    return true;
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
        fluid.log("Could not find template... properly handle this.");
        return null;
    }
};
