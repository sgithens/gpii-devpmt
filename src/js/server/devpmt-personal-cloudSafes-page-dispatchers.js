/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");


// URLPATH /login
fluid.defaults("gpii.devpmt.loginToSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    path: ["/login"],
    method: "use",
    defaultTemplate: "login",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.loginToSafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.loginToSafeHandler.handleRequest = function (that, req, res, next) {
    if (req.method === "POST") {
        var promise = gpii.devpmt.safemgmt.loginToSafe(req.body.username, req.body.password);
        promise.then(function (safe) {
            if (!safe.error) {
                req.session.loggedInToSafe = req.body.username;
                res.redirect("/mysafe");
            }
            else {
                res.redirect("/login");
            }
        });
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

// URLPATH /logout
fluid.defaults("gpii.devpmt.logoutFromSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    path: ["/logout"],
    method: "use",
    defaultTemplate: "personal-cloudSafes-logout",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.logoutFromSafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.logoutFromSafeHandler.handleRequest = function (that, req, res, next) {
    req.session.loggedInToSafe = null;
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
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
        // gpii.devpmt.addNPSet(devpmt.prefSetDataSource, prefsetName);
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
    path: ["/mysafe"],
    method: "get",
    defaultTemplate: "mysafe",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.mySafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        },
        contextPromise: {
            funcName: "gpii.devpmt.mySafeHandler.contextPromise",
            args: ["{that}", "{arguments}.0"]
        }
    }
});

gpii.devpmt.mySafeHandler.handleRequest = function (that, req, res, next) {
    if (!req.session.loggedInToSafe) {
        res.redirect("/login");
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

gpii.devpmt.mySafeHandler.contextPromise = function (that, req) {
    var prefsDS = gpii.devpmt.dataSource.safemgmt.prefSafeByName();
    var keysDS = gpii.devpmt.dataSource.safemgmt.keysForPrefsSafe();

    var name = req.session.loggedInToSafe;

    var promTogo = fluid.promise();

    var prom = prefsDS.get({name: name});
    var prom2 = keysDS.get({name: "prefsSafe-" + name});

    prom.then(function (prefsSet) {
        prom2.then(function (keys) {
            var finalPayload = {
                prefsSafe: prefsSet.rows[0].value,
                keys: keys.rows,
                safename: req.session.loggedInToSafe
            };
            promTogo.resolve(finalPayload);
        });
    });

    return promTogo;
};

// URLPATH /mysafe/prefsets

// URLPATH /mysafe/keys
