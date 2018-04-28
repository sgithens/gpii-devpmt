/**
 * Personal Cloud Safe Web Application
 *
 * This GPII Express application allows creating anonymous preference
 * safes, as well as logging in to them to see current preference sets
 * and keys attached to the safe.
 *
 * These endpoints are being served in a separate express instance from
 * the admin PPT as the login mechanisms will be different. This
 * application uses the prefsSafe._id and prefsSafe.password to authenticate.
 */
/* eslint-env node */
"use strict";

var fluid = require("infusion");
fluid.registerNamespace("gpii");
fluid.require("gpii-express");
fluid.require("gpii-handlebars");
require("gpii-universal");

fluid.registerNamespace("gpii.personalCloudSafe");
fluid.registerNamespace("gpii.handlebars");

var thePort = process.env.PORT || 8082;
fluid.defaults("gpii.personalCloudSafe.express", {
    gradeNames: ["gpii.express.withJsonQueryParser"],
    port: thePort,
    events: {
        onFsChange: null
    },
    listeners: {
        "onFsChange.reloadInlineTemplates": {
            func: "{inlineMiddleware}.events.loadTemplates.fire"
        }
    },
    components: {
        // TODO copied from devpmt-express
        urlEncodedParser: {
            type: "gpii.express.middleware.bodyparser.urlencoded"
        },
        jsonBodyParser: {
            type: "gpii.express.middleware.bodyparser.json"
        },
        cookieparser: {
            type: "gpii.express.middleware.cookieparser",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                },
                priority: "before:sessionMiddleware"
            }
        },
        sessionMiddleware: {
            type: "gpii.express.middleware.session",
            options: {
                middlewareOptions: {
                    secret: "TODO Override"
                }
            }
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
                        func: "{gpii.personalCloudSafe.express}.events.onFsChange.fire"
                    }
                }
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
        // END copied from devpmt-express
        loginToSafeHandler: {
            type: "gpii.devpmt.loginToSafeHandler",
            options: {
                path: "/login"
            }
        },
        logoutFromSafeHandler: {
            type: "gpii.devpmt.logoutFromSafeHandler",
            options: {
                path: "/logout"
            }
        },
        mysafeHandler: {
            type: "gpii.devpmt.mySafeHandler",
            options: {
                path: "/mysafe"
            }
        },
        createAnonSafeHandler: {
            type: "gpii.devpmt.createAnonSafeHandler",
            options: {
                path: "/create/anonsafe"
            }
        }
    }
});
