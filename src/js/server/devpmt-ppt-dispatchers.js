/**
 * Dispatchers for PPT pages and workflow
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

fluid.registerNamespace("gpii.devpmt.ppt");

gpii.devpmt.ppt.checkAuthorization = function (that, req, res /*, next */) {
    if (req.session.loggedInToPPT) {
        return true;
    }
    res.status("401").redirect("/");
};

/**
 * Index Handler
 *
 * This the landing view after logging in to edit and view safes. Shows a
 * listing of safes, search widget, and button to create new prefsSafes.
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

gpii.devpmt.dispatchers.index.contextPromise = function (that, devpmt, req) {
    var promTogo = fluid.promise();
    var prefsSafesProm = devpmt.prefsSafesListingDataSource.get();
    prefsSafesProm.then(function (data) {
        promTogo.resolve({
            prefsSafesList: data.rows,
            perms: req.session.perms
        });
    });
    return promTogo;
};

/**
 * General Login Handler
 *
 * Handler for PPT login pages, can be overridden to change the
 * permissions that are added. This is currently used for the prototype
 * views of having 2 different editing logins, one that can see a view
 * of all the safes, and one that only has a widget to lookup a safe
 * by a specific ID.
 *
 * During our next round of work, we will finish hooking the PPT up to
 * native gpii-express-user accounts. For current requirements, the demo
 * login of username `morphic` and password `gpii` suffices.
 */
fluid.defaults("gpii.devpmt.ppt.loginHandler", {
    gradeNames: ["gpii.devpmt.baseDispatcher"],
    defaultTemplate: "ppt-login",
    method: "use",
    // list of extra permissions to be added to session on successful login
    permissions: {
    },
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

    if (req.body.username === "morphic" && req.body.password === "gpii") {
        req.session.loggedInToPPT = true;
        req.session.perms = that.options.permissions;
        res.redirect("/ppt");
    }
    else {
        res.redirect("/");
    }

    return false;
};

/**
 * Dev Login Handler
 *
 * Login handler for the development and testing version of the PPT.
 * This adds a `listSafes` permission which can be used to see the list
 * of all preference safes in order to select which one to debug or edit.
 */
fluid.defaults("gpii.devpmt.ppt.devLoginHandler", {
    gradeNames: ["gpii.devpmt.ppt.loginHandler"],
    permissions: {
        listSafes: true
    }
});

/**
 * Support Login Handler
 *
 * Login handler that adds no new permissions, and is meant to showcase
 * how a view may look for a support staff person who can look up a users
 * safe by ID, but is not allowed to arbitrarily view lists of safes.
 */
fluid.defaults("gpii.devpmt.ppt.supportLoginHandler", {
    gradeNames: ["gpii.devpmt.ppt.loginHandler"]
});

/**
 * Logout Handler
 *
 * Handler to log the current user out of the PPT and destroy their
 * session.
 */
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
        res.redirect("/");
    });
    return false;
};

/**
 * Edit PrefsSafe Handler
 *
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
    fluid.promise.map(devpmt.fullPrefSetDataSource.get({prefsSafeId: req.params.npset}), function (data) {
        if (!data.prefsSafe) {
            promTogo.reject({
                isError: true,
                message: "Couldn't find preferences safe."
            });
            return;
        };
        var npset = devpmt.ontologyHandler.rawPrefsToOntology(data.prefsSafe.preferences, "flat");
        var prefset = gpii.devpmt.npset({
            npsetName: req.params.npset,
            flatPrefs: npset,
            docs: ""
        });
        // This data is coming from a convenience endpoint that includes
        // the keys, but when we go back to save the prefset they would be in their
        // own documents, so we are removing the keys to a separate data
        // field here to make life easier in the frontend.
        var prefsSafe = data.prefsSafe;
        var keys = data.keys;
        promTogo.resolve({
            npset: prefset,
            prefsSafe: prefsSafe,
            keys: keys
        });
    });
    return promTogo;
};

fluid.registerNamespace("gpii.devpmt.savePrefsetHandler");

/**
 * Save PrefSafe Handler
 *
 * A JSON operated endpoint for saving prefsSafe data.
 */
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
    if (gpii.devpmt.ppt.checkAuthorization(that, req, res)) {
        var prom = devpmt.prefSetDataSource.set({prefsSafeId: req.params.npset}, req.body);
        prom.then(function () {
            res.send({
                message: "Saved"
            });
        }, function(err) {
            fluid.log("Failure saving prefsSafe: ", err);
            res.status(500).send({
                isError: true,
                message: "Error saving"
            });
        });
    }
};

fluid.registerNamespace("gpii.devpmt.addPrefsetFormHandler");

/**
 * Add PrefsSafe Form Handler
 *
 * Handles a traditional HTML form submission to create a new prefsSafe.
 * Currently accepts no further options or metadata, will be a focus of
 * future work.
 */
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
    prefsPromise.then(function (/* data */) {
        res.redirect("/ppt");
    });

};

fluid.registerNamespace("gpii.devpmt.lookupFormHandler");

/**
 * Lookup Form Handler
 *
 * Handles a traditional HTML form request to look up a preference safe by
 * it's full ID.
 */
fluid.defaults("gpii.devpmt.lookupFormHandler", {
    gradeNames: ["gpii.express.middleware"],
    path: ["/ppt-lookup"],
    invokers: {
        middleware: {
            funcName: "gpii.devpmt.lookupFormHandler.handleRequest",
            args: ["{that}", "{devpmt}", "{arguments}.0", "{arguments}.1" /*, "{arguments}.2" */]
        }
        //TODO Auth check
    }
});

gpii.devpmt.lookupFormHandler.handleRequest = function (that, devpmt, req, res /*, next */) {
    if (req.method !== "POST") {
        res.redirect("/ppt");
    }
    else {
        var prefsSafeId = req.body.lookup;
        res.redirect("/editprefs/" + prefsSafeId);
    }
};
