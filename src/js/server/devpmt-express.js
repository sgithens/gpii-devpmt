/**
 * Devpmt Express Server
 *
 * Contains `gpii.devpmt` the primary component for our express server,
 * and other tooling it requires.
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

var session = require("express-session");
var RedisStore = require("connect-redis")(session);
var PouchSession = require("session-pouchdb-store");

var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var kettle = fluid.require("kettle");
fluid.require("gpii-express");
fluid.require("gpii-handlebars");
require("gpii-universal");
var json5 = require("json5");

fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.handlebars");

gpii.devpmt.redisStore = function (options) {
    return new RedisStore({
        host: options.host || "127.0.0.1",
        port: options.port || 6379
    });
};

gpii.devpmt.pouchSessionStore = function (options) {
    var options = options || {};
    var couchDbHost = options.couchDbHost || "http://localhost";
    var couchDbPort = options.couchDbPort || "5984";
    var couchDbName = options.couchDbName || "sessions";
    var couchDbUrl = couchDbHost + ":" + couchDbPort + "/" + couchDbName;
    return new PouchSession(couchDbUrl);
};

gpii.devpmt.json5resolver = function (path) {
    return json5.parse(kettle.resolvers.file(fluid.module.resolvePath(path)));
};

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * Preferences Sets.
 */
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.express.withJsonQueryParser", "fluid.modelComponent"],
    prefsServerURL: "http://localhost:8081",
    port: 8085,
    prefsetDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/preferences/)",
    solutionsDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/solutions/)",
    osList: ["android","darwin","linux","web","win32"],
    events: {
        onFsChange: null,
        onListen: null // Needed for using the kettle unit tests
    },
    model: {
        messages: {},
        solutions: {},
        commonTerms: "@expand:gpii.devpmt.json5resolver(%gpii-devpmt/node_modules/gpii-universal/testData/ontologies/flat.json5)"
    },
    listeners: {
        "onCreate.loadAllSolutions": {
            funcName: "gpii.devpmt.loadAllSolutions",
            args: ["{that}"]
        },
        "onFsChange.reloadInlineTemplates": {
            func: "{inlineMiddleware}.events.loadTemplates.fire"
        },
        "onStarted.listen": {
            func: "{that}.events.onListen.fire"
        },
        "onDestroy.stopped": {
            func: "{that}.events.onStopped.fire"
        }
    },
    components: {
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
                    // Examples: Blank `store` will use the default in-memory sessions
                    // store: "@expand:gpii.devpmt.redisStore({})",
                    // store: "@expand:gpii.devpmt.pouchSessionStore({})",
                    secret: "TODO Override",
                    saveUninitialized: true, // For the pouch/couch connector this must be true
                    resave: false,
                    path: "/"
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
        inlineMiddleware: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path: "/hbs",
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"]
            }
        },
        // For some reason the above don't work if from a sub grade, GPII-3000
        dispatcher: {
            type: "gpii.devpmt.baseDispatcher",
            options: {
                priority: "before:htmlErrorHandler",
                path: ["/:template", "/"]
            }
        },
        // Removed the above from the common express base grade
        ontologyHandler: {
            type: "gpii.ontologyHandler"
        },
        hb: {
            type: "gpii.express.hb.live",
            options: {
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"],
                listeners: {
                    "onFsChange.notifyExpress": {
                        func: "{gpii.devpmt}.events.onFsChange.fire"
                    }
                },
                components: {
                    renderer: {
                        options: {
                            model: {
                                messages: "{gpii.devpmt}.model.messages",
                                messageBundles: "{gpii.devpmt}.model.messages"
                            }
                        }
                    }
                }
            }
        },
        messageLoader: {
            type: "gpii.handlebars.i18n.messageLoader",
            options: {
                messageDirs: "%gpii-devpmt/src/messageBundles",
                model: {
                    messages: "{gpii.devpmt}.model.messages"
                }
            }
        },
        messages: {
            type: "gpii.handlebars.inlineMessageBundlingMiddleware",
            priority: "last",
            options: {
                model: {
                    messageBundles: "{messageLoader}.model.messageBundles"
                }
            }
        },
        /*
         * Page Dispatchers, see devpmt-ppt-dispatchers.js
         */
        pptLogoutHandler: {
            type: "gpii.devpmt.ppt.logoutHandler",
            options: {
                path: "/pptlogout"
            }
        },
        landingPageHandler: {
            type: "gpii.devpmt.baseDispatcher",
            options: {
                path: "/",
                defaultTemplate: "landing-page",
                model: {
                    messageBundles: "{gpii.devpmt}.model.messageBundles"
                }
            }
        },
        indexHandler: {
            type: "gpii.devpmt.dispatchers.index",
            options: {
                path: "/ppt"
            }
        },
        editPrefSetHandler: {
            type: "gpii.devpmt.editPrefSetHandler",
            options: {
                path: "/editprefs/:prefsSafe"
            }
        },
        savePrefsetHandler: {
            type: "gpii.devpmt.savePrefsetHandler",
            options: {
                path: "/saveprefset/:prefsSafe"
            }
        },
        addPrefsetFormHandler: {
            type: "gpii.devpmt.addPrefsetFormHandler",
            options: {
                path: "/add-prefset"
            }
        },
        lookupFormHandler: {
            type: "gpii.devpmt.lookupFormHandler",
            options: {
                path: "/ppt-lookup"
            }
        },
        htmlErrorHandler: {
            type: "gpii.handlebars.errorRenderingMiddleware",
            options: {
                priority: "last",
                templateKey: "pages/error"
            }
        },

        // Dev/Testing Login Endpoints
        pptDevLoginHandler: {
            type: "gpii.devpmt.ppt.devLoginHandler",
            options: {
                path: "/ppt/dev/login"
            }
        },

        pptSupportLoginHandler: {
            type: "gpii.devpmt.ppt.supportLoginHandler",
            options: {
                path: "/ppt/support/login"
            }
        },

        // Admin Support Login Endpoints

        // Personal CloudSafes Endpoints
        // TODO: Factor these out, as well as the ppt ones above
        // to their own grades once we fix the express issues
        loginToSafeHandler: {
            type: "gpii.devpmt.morphic.loginToSafeHandler",
            options: {
                path: "/morphic/login"
            }
        },
        logoutFromSafeHandler: {
            type: "gpii.devpmt.morphic.logoutFromSafeHandler",
            options: {
                path: "/morphic/logout"
            }
        },
        mysafeHandler: {
            type: "gpii.devpmt.morphic.mySafeHandler",
            options: {
                path: "/morphic/safe"
            }
        },
        createAnonSafeHandler: {
            type: "gpii.devpmt.morphic.createSafeHandler",
            options: {
                path: "/morphic/create/safe"
            }
        },

        /**
         * Data Sources
         */
        solutionsDataSource: {
            type: "kettle.dataSource.file",
            options: {
                solutionsDir: "{gpii.devpmt}.options.solutionsDirectory",
                path: "%solutionsDir/%osId.json5",
                termMap: {
                    osId: "%osId",
                    solutionsDir: "{that}.options.solutionsDir"
                },
                writable: false,
                components: {
                    encoding: {
                        type: "kettle.dataSource.encoding.JSON5"
                    }
                }
            }
        },
        fullPrefSetDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/prefssafe-with-keys/%prefsSafeId", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                termMap: {
                    prefsSafeId: "%prefsSafeId"
                },
                writable: false
            }
        },
        prefSetDataSource: {
            //TODO there seems to be an issue which calling higher level
            //ports, for instance this wouldn't work if the prefserver was on 9081...
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/prefssafe/%prefsSafeId", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                termMap: {
                    prefsSafeId: "%prefsSafeId"
                },
                writable: true
                // writeMethod: "PUT"
            }
        },
        prefsSafesListingDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/prefssafes", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                }
            }
        },
        prefsSafeCreationDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/preferences", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                writable: true,
                writeMethod: "POST"
            }
        },
        prefsSafeKeyCreationDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/prefssafe-key-create", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                writable: true,
                writeMethod: "POST"
            }
        },
        prefsSafeByGpiiKeyDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/prefssafe/%prefsSafeId", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                termMap: {
                    prefsSafeId: "%prefsSafeId"
                }
            }
        },
        cloudSafeCredCreateDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/add-cloud-credentials/%prefsSafeId", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                termMap: {
                    prefsSafeId: "%prefsSafeId"
                },
                writable: true,
                writeMethod: "PUT"
            }
        },
        cloudSafeUnlockDataSource: {
            type: "kettle.dataSource.URL",
            options: {
                url: {
                    expander: {
                        funcName: "fluid.stringTemplate",
                        args: ["%prefsServerURL/unlock-cloud-safe", {
                            prefsServerURL: "{gpii.devpmt}.options.prefsServerURL"
                        }]
                    }
                },
                writable: true,
                writeMethod: "POST"
            }
        }
    },
    invokers: {
        stop: {
            func: "{that}.destroy"
            // funcName: "gpii.express.stopServer",
            // args: ["that"]
        }
    }
});

gpii.devpmt.loadAllSolutions = function (that) {
    fluid.each(that.options.osList, function (osId) {
        var prom = that.solutionsDataSource.get({osId: osId});
        prom.then(function (data) {
            var solutions = fluid.copy(that.model.solutions);
            solutions = fluid.merge({"": ["replace,noexpand"]}, solutions, data);
            that.applier.change("solutions", solutions);
        });
    });
};
