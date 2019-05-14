/**
 * Common Utilities
 *
 * Utility functions and components that can be used both in-browser
 * and in the node.js server.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * binderCheckboxToBoolean
 *
 * By default GPII binder, when bound to a checkbox input will
 * represent checked as an array of one item, and unchecked as
 * an empty array. For many situations we would like these to
 * be represented as true and false. These transforms accomplish
 * that mapping.
 *
 * @param {Array} value - The array coming from binder, most likely []
 * or ['on']
 * @return {Boolean} true or false based on the array size
 */
gpii.devpmt.binderCheckboxToBoolean = function (value) {
    return value.length > 0;
};

fluid.defaults("gpii.devpmt.binderCheckboxToBoolean", {
    gradeNames: ["fluid.standardTransformFunction"]
});

/**
 * booleanToBinderCheckbox
 *
 * See `gpii.devpmt.binderCheckboxToBoolean` for a description. This
 * is the reverse transform.
 *
 * @param {Boolean} value - Current value as a boolean
 * @return {Array} [] or ['on'] depending on value
 */
gpii.devpmt.booleanToBinderCheckbox = function (value) {
    return value ? ["on"] : [];
};

fluid.defaults("gpii.devpmt.booleanToBinderCheckbox", {
    gradeNames: ["fluid.standardTransformFunction"]
});

gpii.devpmt.booleanBinderRules = {
    domToModel: {
        "": {
            transform: {
                type: "gpii.devpmt.binderCheckboxToBoolean",
                inputPath: ""
            }
        }
    },
    modelToDom: {
        "": {
            transform: {
                type: "gpii.devpmt.booleanToBinderCheckbox",
                inputPath: ""
            }
        }
    }
};

/**
 * prefsetExists - Check a flatPrefs set to see if the context/prefset
 * keyed with a particular ID already exists.
 *
 * @param {Object} flatPrefs - A flatPrefs set.
 * @param {String} prefsetId - The id of the prefset that is used as it's key
 *     in the json.
 * @return {boolean} true if it exists, false otherwise.
 */
gpii.devpmt.prefsetExists = function (flatPrefs, prefsetId) {
    return flatPrefs.contexts[prefsetId] ? true : false;
};

/**
 * contextNames - Takes a rawPrefs set and returns a list of all the
 * context names. This function ensures that the first item in the list is
 * always the default context, 'gpii-default', and the rest of the contexts
 * in an order that will always be the same. The stability of the order is
 * so that we can build html tables and other structures successfully.
 *
 * @param {Object} prefs - A prefs set.
 * @return {Array} List of context names.
 */
gpii.devpmt.contextNames = function (prefs) {
    var contextNames = [];
    var hasDefaultContext = false;
    fluid.each(prefs.contexts, function (value, key) {
        if (key !== "gpii-default" && contextNames.indexOf(key) < 0) {
            contextNames.push(key);
        }
        else if (key === "gpii-default") {
            hasDefaultContext = true;
        }
    });
    contextNames.sort();
    if (hasDefaultContext) {
        contextNames.unshift("gpii-default");
    }
    return contextNames;
};

/**
 * Returns the prefsets (contexts) an Application is being
 * used in, as an array of prefset keys.  An example use of this
 * is for enabling and unabling products in the UI.  When a product
 * is removed from the last prefset, it is essentially completely
 * removed from the users safe.  Sometimes we would like to put up
 * a warning dialog before that happens, and could do that if we
 * see that the returned array from this function only has one
 * item.
 */
gpii.devpmt.prefsetsForApplication = function (prefs, appURI) {
    var contexts = [];
    fluid.each(prefs.contexts, function (context, contextKey) {
        fluid.each(context.preferences, function (prefBody, prefKey) {
            if (prefKey === appURI) {
                contexts.push(contextKey);
            }
        });
    });
    return contexts;
};

/**
 * prefsSafeApplications - Goes through all the preference sets in a preferences safe
 * and pulls out the flat pref URI and app ID. Returns all the apps a
 * user has settings for.
 *
 * @param {Object} prefs - Transformed flat preferences set
 * @return {Array} An array of objects structured as the following: (RWG example)
 *     {
 *         uri: "http://registry.gpii.net/applications/com.texthelp.readWriteGold",
 *         appId: "com.texthelp.readWriteGold"
 *     }
 */
gpii.devpmt.prefsSafeApplications = function (prefs) {
    var apps = {};
    fluid.each(prefs.contexts, function (context) {
        fluid.each(context.preferences, function (prefBody, prefKey) {
            if (prefKey.startsWith("http://registry.gpii.net/applications")) {
                if (!apps[prefKey]) {
                    apps[prefKey] = {
                        uri: prefKey,
                        appId: prefKey.split(/\//).pop(),
                        settingKeys: []
                    };
                }
                // Add any keys that may or may not be in one of the contexts
                fluid.each(prefBody, function (settingBody, settingKey) {
                    if (apps[prefKey].settingKeys.indexOf(settingKey) < 0) {
                        apps[prefKey].settingKeys.push(settingKey);
                    }
                });
            }
        });
    });
    return fluid.values(apps);
};

/**
 * Query a lunr index in our case insensitive, match anything style that
 * is used for the various list/API filter boxes that are typically rendered
 * at the top of a list or table. This routine is meant to encapsulate
 * any of the oddities of lunr search strings, and necessary usage of
 * various wildcards for list filtering use cases.
 *
 * @param {Object} lunrIndex - The existing lunr index to query.
 * @param {String} filterString - The string used to filter the results.
 * @return {Array} The matching lunr results.
 */
gpii.devpmt.lunrListFilterSearch = function (lunrIndex, filterString) {
    // TODO escape entire string so search keywords like 'not' can be used
    return lunrIndex.query(function (q) {
        // The lunr querystring documentation isn't great, but apparently
        // lowercasing the terms does a case insensitive search.
        var lowerFilterString = filterString.toLowerCase();
        q.term(lowerFilterString);
        q.term("*" + lowerFilterString);
        q.term("*" + lowerFilterString + "*");
    });
};

/**
 * Goes through a set of solutions, and for a productId and term,
 * finds the supportedSetting entry (there can be multiple blocks of them)
 * and returns it.
 */
gpii.devpmt.findProductSettingMetadata = function ( solutions, productId, term ) {
    var solution = solutions[productId];
    var togo = {};
    fluid.each(solution.settingsHandlers, function (settingHandler) {
        fluid.each(settingHandler.supportedSettings, function (supportedSetting, key) {
            if (key === term) {
                togo = supportedSetting;
            }
        });
    });
    return togo;
};
