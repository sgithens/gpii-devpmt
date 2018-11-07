/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");


// URLPATH /login
fluid.defaults("gpii.devpmt.loginToSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "use",
    defaultTemplate: "login",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.loginToSafeHandler.handleRequest",
            args: ["{that}", "{gpii.devpmt}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.loginToSafeHandler.handleRequest = function (that, devpmt, req, res, next) {
    if (req.method === "POST") {
        var promise = gpii.devpmt.safemgmt.loginToSafe(devpmt, req.body.username, req.body.password);
        promise.then(function (safe) {
            if (!safe.error) {
                req.session.loggedInToSafe = safe._id;
                res.redirect("/mycloudsafe");
            }
            else {
                res.redirect("/cloudsafelogin");
            }
        });
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

// URLPATH /logout
fluid.defaults("gpii.devpmt.logoutFromSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "use",
    defaultTemplate: "cloudsafe-logout",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.logoutFromSafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.logoutFromSafeHandler.handleRequest = function (that, req, res /*, next */) {
    req.session.destroy(function (err) {
        if (err) {
            res.status(500).send(err);
        }
        res.redirect("/cloudsafelogin");
    });
};

// URLPATH /create/anonsafe
fluid.defaults("gpii.devpmt.createAnonSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    path: ["/create/anonsafe"],
    method: "use",
    defaultTemplate: "create-anon-safe",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.createAnonSafeHandler.handleRequest",
            args: ["{that}", "{gpii.devpmt}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.createAnonSafeHandler.handleRequest = function (that, devpmt, req, res, next) {
    // If you're already logged in redirect to your safe
    if (req.session.loggedInToSafe) {
        res.redirect("/mysafe");
        return;
    }
    // Try and create a new safe, TODO update for GPII-2630 schema changes.
    if (req.method === "POST") {
        var prefsetName = req.body.username;
        var prefsetPassword = req.body.password;
        var prom = gpii.devpmt.safemgmt.createAnonSafe(prefsetName, prefsetPassword);
        prom.then(function () {
            req.session.loggedInToSafe = prefsetName;
            res.redirect("/mysafe");
        });
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

// URLPATH /mysafe
fluid.defaults("gpii.devpmt.mySafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "get",
    defaultTemplate: "mysafe",
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
        middleware: {
            funcName: "gpii.devpmt.mySafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        },
        contextPromise: {
            funcName: "gpii.devpmt.mySafeHandler.contextPromise",
            args: ["{that}", "{devpmt}", "{arguments}.0"]
        }
    }
});

gpii.devpmt.mySafeHandler.handleRequest = function (that, req, res, next) {
    if (!req.session.loggedInToSafe) {
        res.status(403).send("Not logged in");
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

gpii.devpmt.mySafeHandler.contextPromise = function (that, devpmt, req) {
    return fluid.promise.map(devpmt.fullPrefSetDataSource.get({prefsSafeId: req.session.loggedInToSafe}), function (data) {
        var npset = devpmt.ontologyHandler.rawPrefsToOntology(data.preferences, "flat");
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
