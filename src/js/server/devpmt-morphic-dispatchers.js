/**
 * Dispatchers for Morphic UI Workflow
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
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

// URLPATH /login
fluid.defaults("gpii.devpmt.morphic.loginToSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "use",
    defaultTemplate: "morphic-login",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.morphic.loginToSafeHandler.handleRequest",
            args: ["{that}", "{gpii.devpmt}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.morphic.loginToSafeHandler.handleRequest = function (that, devpmt, req, res, next) {
    if (req.method === "POST") {
        var unlockProm = devpmt.cloudSafeUnlockDataSource.set({}, {
            username: req.body.username,
            password: req.body.password
        });
        unlockProm.then(function (data) {
            req.session.loggedInToSafe = data.id;
            res.redirect("/morphic/safe");
        }, function (err) {
            fluid.log(err);
            res.redirect("/morphic/login");
        });
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

// URLPATH /logout
fluid.defaults("gpii.devpmt.morphic.logoutFromSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "use",
    defaultTemplate: "morphic-logout",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.morphic.logoutFromSafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.morphic.logoutFromSafeHandler.handleRequest = function (that, req, res /*, next */) {
    req.session.destroy(function (err) {
        if (err) {
            res.status(500).send(err);
        }
        res.redirect("/morphic/login");
    });
};

fluid.defaults("gpii.devpmt.morphic.createSafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "use",
    defaultTemplate: "morphic-create-safe",
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.morphic.createSafeHandler.handleRequest",
            args: ["{that}", "{gpii.devpmt}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.morphic.createSafeHandler.handleRequest = function (that, devpmt, req, res, next) {
    // If you're already logged in redirect to your safe
    if (req.session.loggedInToSafe) {
        res.redirect("/morphic/safe");
        return;
    }
    // Try and create a new safe, TODO update for GPII-2630 schema changes.
    if (req.method === "POST") {
        var prefsetName = req.body.username;
        var prefsetPassword = req.body.password;
        var prom = devpmt.prefsSafeCreationDataSource.set({prefsSafeId: prefsetName}, {
            "flat": {
                "name": "Default Morphic",
                "contexts": {
                    "gpii-default": {
                        "name": "Default preferences",
                        "preferences": {}
                    }
                }
            }
        });
        prom.then(function (data) {
            var prefsSafeId = data.prefsSafeId;
            var createCloudCredProm = devpmt.cloudSafeCredCreateDataSource.set({prefsSafeId: prefsSafeId}, {
                username: prefsetName,
                password: prefsetPassword
            });
            createCloudCredProm.then(function (/* credPromData */) {
                req.session.loggedInToSafe = data.prefsSafeId;
                res.redirect("/morphic/safe");
            }, function (/* credPromErr */) {
                res.redirect("/morphic/create/safe");
            });
        }, function (/* err */) {
        });
    }
    else {
        gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
    }
};

// URLPATH /mysafe
fluid.defaults("gpii.devpmt.morphic.mySafeHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    method: "get",
    defaultTemplate: "morphic-mysafe",
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
            funcName: "gpii.devpmt.morphic.mySafeHandler.handleRequest",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        },
        contextPromise: {
            funcName: "gpii.devpmt.morphic.mySafeHandler.contextPromise",
            args: ["{that}", "{devpmt}", "{arguments}.0"]
        }
    }
});

gpii.devpmt.morphic.mySafeHandler.handleRequest = function (that, req, res, next) {
    if (!req.session.loggedInToSafe) {
        res.redirect("/morphic/login");
        // res.status(403).send("Not logged in");
        return;
    }
    gpii.devpmt.baseDispatcher.middleware(that, req, res, next);
};

gpii.devpmt.morphic.mySafeHandler.contextPromise = function (that, devpmt, req) {
    var promTogo = fluid.promise();
    fluid.promise.map(devpmt.fullPrefSetDataSource.get({prefsSafeId: req.session.loggedInToSafe}), function (data) {
        if (!data) {
            promTogo.reject({
                isError: true,
                message: "Couldn't find preferences safe."
            });
            return;
        };

        // This data is coming from a convenience endpoint that includes
        // the keys, but when we go back to save the prefset they would be in their
        // own documents, so we are removing the keys to a separate data
        // field here to make life easier in the frontend.
        var prefsSafe = data.prefsSafe;
        var keys = data.keys;
        promTogo.resolve({
            prefsSafe: prefsSafe,
            keys: keys
        });
    });
    return promTogo;
};
