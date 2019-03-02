/* eslint-env node */
"use strict";

var session = require("express-session");
var RedisStore = require("connect-redis")(session);

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.require("gpii-express");
fluid.require("gpii-express-user");
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
 * Base express grade for our devpmt based express apps
 */
fluid.defaults("gpii.devpmt.express.base", {
    gradeNames: ["gpii.express.withJsonQueryParser"],
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
        }
    }
});

gpii.devpmt.redisStore = function () {
    gpii.devpmt.GPII_REDIS_HOST = process.env.GPII_REDIS_HOST || "127.0.0.1";
    gpii.devpmt.GPII_REDIS_PORT = process.env.GPII_REDIS_PORT || 6379;
    return new RedisStore({
        host: gpii.devpmt.GPII_REDIS_HOST,
        port: gpii.devpmt.GPII_REDIS_PORT
    });
};

/**
 * gpii.devpmt - Main component of the gpii.devpmt server to view and edit
 * NP Sets.
 */
gpii.devpmt.LISTEN_PORT = process.env.GPII_DEVPMT_LISTEN_PORT || 8085;
gpii.devpmt.PREFERENCESSERVER_URL = process.env.GPII_DEVPMT_TO_PREFERENCESSERVER_URL || "http://localhost:8081";
fluid.defaults("gpii.devpmt", {
    gradeNames: ["gpii.devpmt.express.base", "fluid.modelComponent"],
    prefsServerURL: gpii.devpmt.PREFERENCESSERVER_URL,
    // prefsServerURL: "http://preferences.dev-sgithens.gpii.net",
    port: gpii.devpmt.LISTEN_PORT,
    prefsetDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/preferences/)",
    solutionsDirectory: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/solutions/)",
    events: {
        onFsChange: null,
        onListen: null // Needed for using the kettle unit tests
    },
    model: {
        messages: {},
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
        },
        "onStarted": {
            func: "{that}.events.onListen.fire"
        },
        "onDestroy": {
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
                    // store: "@expand:gpii.devpmt.redisStore()",
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
        inlineMiddleware: {
            type: "gpii.handlebars.inlineTemplateBundlingMiddleware",
            options: {
                path: "/hbs",
                templateDirs: ["@expand:fluid.module.resolvePath(%gpii-devpmt/src/templates)"]
            }
        },
        // gpii-express-user accounts and management
        gpiiExpressUserApi: {
            type: "gpii.express.user.api",
            options: {
                couch: {
                    userDbName: "gpii",
                    userDbUrl: "http://localhost:5984/gpii"
                }
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
         * Page Dispatchers, see devpmt-page-dispatchers.js
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
                path: "/editprefs/:npset"
            }
        },
        savePrefsetHandler: {
            type: "gpii.devpmt.savePrefsetHandler",
            options: {
                path: "/saveprefset/:npset"
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
         * Data Sources: see devpmt.datasources.js
         */
        commonTermsDataSource: {
            type: "gpii.devpmt.dataSource.commonTermsMetadata"
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
            // type: "gpii.devpmt.dataSource.prefsSafeListing.filesystem"
            // type: "gpii.devpmt.dataSource.prefsSafeListing.couchdb"
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
        },
        reverse: {
            funcName: "gpii.devpmt.reverse",
            args: ["{that}", "{arguments}.0"]
        },
        createCloudSafeLogin: {
            funcName: "gpii.devpmt.safemgmt.createCloudSafeLogin",
            // prefsSafeId, loginName, email, password
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2", "{arguments}.3"]
        }
    }
});

gpii.devpmt.reverse = function (that, urlName) {
    var urls = {
        cloudSafeLogin:  "/cloudsafelogin"
    };
    return urls[urlName];
};

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

    var prefsSafesList = that.prefsSafesListingDataSource.get();
    prefsSafesList.then(function (data) {
        var togo = [];
        fluid.each(data, function (item) {
            togo.push(item.prefsSafeId);
        });
        that.applier.change("npsetList", togo);
    });
};
