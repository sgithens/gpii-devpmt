/* global Handlebars */
"use strict";

/**
 * appIDfromURI Handlebars Helper
 *
 * Extract a GPII Application ID from a preferences URI.
 * ie. Convert http://registry.gpii.net/applications/org.gnome.orca
 * to org.gnome.orca .
 * This should likely be replaced with correct ontology usage.
 *
 * @param uri {String} a flat URI of a GPII application.
 * @return {String} The application ID.
 */
Handlebars.registerHelper("appIDfromURI", function (uri) {
    return uri.split(/\//).pop();
});

/**
 * appURIfromID Handlebars Helper
 *
 * Extract a GPII Flat URL ID from a  URI.
 * ie. Convert org.gnome.orca to
 * http://registry.gpii.net/applications/org.gnome.orca
 * This should likely be replaced with correct ontology usage.
 *
 * @param uri {String} The application ID.
 * @return {String} A flat URI of a GPII application.
 */
Handlebars.registerHelper("appURIfromID", function (appId) {
    return "http://registry.gpii.net/applications/" + appId;
});

/**
 * checkForApp Handlebars helper
 * Takes a list of GPII Applications, and returns the object if
 * it's of type appId. It would be nice to wrap some of the infusion
 * find/map functions as helpers rather than use this custom function.
 *
 * @param npsetApplications {Object} The listing of GPII app solutions.
 * @param appId {String} The ID of the application we're looking for.
 * @return {Object} The solution entry of the IP, otherwise undefined.
 */
Handlebars.registerHelper("checkForApp", function (npsetApplications, appId) {
    return fluid.find(npsetApplications, function (i) {
        if (i.appId === appId) {
            return i;
        }
    });
});

/**
 * checkForSupportedSetting Handlebars helper
 * Takes a solutions registry entry and settingKey, then checks to see if
 * it's a setting that the solution supports. This is primarily used to see
 * if a generic preference setting is supported by the solution and used
 * in one of it's transformations.
 * The underlying functionality for this should be moved to a utility method
 * with unit tests.
 *
 * @param solution {Object} The solution registry entry.
 * @param settingKey {String} The generic pref setting key.
 * @return {boolean} Returns `true` if this solution supports the setting, otherwise `false`.
 */
Handlebars.registerHelper("checkForSupportedSetting", function (solution, settingKey) {
    var togo = false;
    fluid.each(solution.settingsHandlers, function (i) {
        fluid.each(i.supportedSettings, function (j, jkey) {
            if (jkey === settingKey) {
                togo = true;
            }
        });
    });
    return togo;
});

// The below helpers are currently being included from:
// https://github.com/helpers/handlebars-helpers/blob/master/lib/comparison.js
// because it needs to be bundled with browserify to use in the browser and I
// haven't had time to set that up properly yet.

/**
 * Render a block when a comparison of the first and third
 * arguments returns true. The second argument is
 * the [arithemetic operator][operators] to use. You may also
 * optionally specify an inverse block to render when falsy.
 *
 * @param `a`
 * @param `operator` The operator to use. Operators must be enclosed in quotes: `">"`, `"="`, `"<="`, and so on.
 * @param `b`
 * @param {Object} `options` Handlebars provided options object
 * @return {String} Block, or if specified the inverse block is rendered if falsey.
 * @block
 * @api public
 */

Handlebars.registerHelper("compare", function (a, operator, b, options) {
    /*eslint eqeqeq: 0*/

    if (arguments.length < 4) {
        throw new Error("handlebars Helper {{compare}} expects 4 arguments");
    }

    var result;
    switch (operator) {
    case "==":
        result = a == b;
        break;
    case "===":
        result = a === b;
        break;
    case "!=":
        result = a != b;
        break;
    case "!==":
        result = a !== b;
        break;
    case "<":
        result = a < b;
        break;
    case ">":
        result = a > b;
        break;
    case "<=":
        result = a <= b;
        break;
    case ">=":
        result = a >= b;
        break;
    case "typeof":
        result = typeof a === b;
        break;
    default: {
        throw new Error("helper {{compare}}: invalid operator: `" + operator + "`");
    }
    }

    if (result === false) {
        return options.inverse(this);
    }
    return options.fn(this);
});
