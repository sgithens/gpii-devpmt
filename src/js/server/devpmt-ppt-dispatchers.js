/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.devpmt.ppt");

gpii.devpmt.ppt.checkAuthorization = function (that, req, res /*, next */) {
    //TODO Temporary change to demo on AWS cluster until the persistent session node is setup
    return true;

    if (req.session.loggedInToPPT) {
        return true;
    }
    res.status("401").redirect("/pptlogin");
};

/**
 * Index Handler for /
 */
fluid.defaults("gpii.devpmt.dispatchers.index", {
    gradeNames: "gpii.devpmt.baseDispatcher",
    defaultTemplate: "index",
    rules: {
        contextToExpose: {
        }
    },
    invokers: {
        checkAuthorization: {
            funcName: "gpii.devpmt.ppt.checkAuthorization",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        },
        contextPromise: {
            funcName: "gpii.devpmt.dispatchers.index.contextPromise",
            args: ["{that}", "{devpmt}", "{arguments}.0"]
        }
    }
});

gpii.devpmt.dispatchers.index.contextPromise = function (that, devpmt /*, req */) {
    var promTogo = fluid.promise();
    var prefsSafesProm = devpmt.prefsSafesListingDataSource.get();
    prefsSafesProm.then(function (data) {
        promTogo.resolve({
            prefsSafesList: data
        });
    });
    return promTogo;
};

// URLPATH /editprefs/:npset
fluid.defaults("gpii.devpmt.ppt.loginHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    defaultTemplate: "ppt-login",
    method: "use",
    invokers: {
        checkAuthorization: {
            funcName: "gpii.devpmt.ppt.loginHandler.checkAuthorization",
            args: ["{that}", "{gpii.devpmt}.gpiiExpressUserApi", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.ppt.loginHandler.checkAuthorization = function (that, userAPI, req, res /*, next */) {
    if (req.method !== "POST") {
        return true;
    }
    //TODO Move to gpii-couch-user
    var loginProm = userAPI.utils.unlockUser(req.body.username, req.body.password);
    loginProm.then(function (data) {
        console.log("LoginProm: ", loginProm.value);
        if (loginProm.value.isError) {
            // return true;
            res.redirect("/pptlogin");
        }
        if (loginProm.value.roles.includes("ppt_admin")) {
            req.session.loggedInToPPT = true;
            res.redirect("/ppt");
            // return false;
        }
    // if (req.body.username === "morphic" && req.body.password === "gpii") {
    //     req.session.loggedInToPPT = true;
    //     res.redirect("/ppt");
    //     return false;
    // }
    });
    return false;
};

fluid.defaults("gpii.devpmt.ppt.logoutHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    defaultTemplate: "ppt-login",
    method: "use",
    invokers: {
        checkAuthorization: {
            funcName: "gpii.devpmt.ppt.logoutHandler.checkAuthorization",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

gpii.devpmt.ppt.logoutHandler.checkAuthorization = function (that, req, res /*, next */) {
    req.session.destroy(function (err) {
        if (err) {
            res.status(500).send(err);
        }
        res.redirect("/pptlogin");
    });
    return false;
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
        },
        checkAuthorization: {
            funcName: "gpii.devpmt.ppt.checkAuthorization",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"] // req, res, next
        }
    }
});

/**
 * Adds the `gpii.devpmt.npset` for the request to the handlebars context.
 */
gpii.devpmt.editPrefSetHandler.contextPromise = function (that, devpmt, req) {
    var promTogo = fluid.promise();
    fluid.promise.map(devpmt.prefSetDataSource.get({prefsSafeId: req.params.npset}), function (data) {
        if (!data) {
            promTogo.reject({
                isError: true,
                message: "Couldn't find preferences safe."
            });
            return;
        };
        var npset = devpmt.ontologyHandler.rawPrefsToOntology(data.preferences, "flat");
        var prefset = gpii.devpmt.npset({
            npsetName: req.params.npset,
            flatPrefs: npset,
            docs: ""
        });
        // This data is coming from a convenience endpoint that includes
        // the keys, but when we go back to save the prefset they would be in their
        // own documents, so we are removing the keys to a separate data
        // field here to make life easier in the frontend.
        var prefsSafe = data;
        var keys = prefsSafe.keys;
        delete prefsSafe.keys;
        promTogo.resolve({
            npset: prefset,
            prefsSafe: prefsSafe,
            keys: keys
        });
    });
    return promTogo;
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
    if (gpii.devpmt.ppt.loginHandler.checkAuthorization) {
        var prom = devpmt.prefSetDataSource.set({prefsSafeId: req.params.npset}, req.body);
        prom.then(req.events.onSuccess.fire, req.events.onError.fire);
    }
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
        //TODO Auth check
    }
});

gpii.devpmt.addPrefsetFormHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    var prefsPromise = devpmt.prefsSafeCreationDataSource.set({}, {
        contexts: {
            "gpii-default": {
                "name": "Default Preferences",
                "preferences": {}
            }
        }
    });
    prefsPromise.then(function (data) {
        res.redirect("/ppt"); //"/editprefs/" + prefsetName);
    });

};
