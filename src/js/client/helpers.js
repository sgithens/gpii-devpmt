"use strict";

/**
 * Extract a GPII Application ID from a preferences URI.
 * ie. Convert http://registry.gpii.net/applications/org.gnome.orca
 * to org.gnome.orca .
 */
Handlebars.registerHelper("appIDfromURI", function (uri) {
    return uri.split(/\//).pop();
});

Handlebars.registerHelper("appURIfromID", function (appId) {
    return "http://registry.gpii.net/applications/" + appId;
});

// TODO Total hack in a rush
Handlebars.registerHelper("checkForApp", function (npsetApplications, appId) {
    return fluid.find(npsetApplications, function (i) {
        if (i.appId === appId) {
            return i;
        }
    });
});

// TODO Temporarily including this until I figure out how to include it.
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

Handlebars.registerHelper("compare", function(a, operator, b, options) {
  /*eslint eqeqeq: 0*/

  if (arguments.length < 4) {
    throw new Error('handlebars Helper {{compare}} expects 4 arguments');
  }

  var result;
  switch (operator) {
    case '==':
      result = a == b;
      break;
    case '===':
      result = a === b;
      break;
    case '!=':
      result = a != b;
      break;
    case '!==':
      result = a !== b;
      break;
    case '<':
      result = a < b;
      break;
    case '>':
      result = a > b;
      break;
    case '<=':
      result = a <= b;
      break;
    case '>=':
      result = a >= b;
      break;
    case 'typeof':
      result = typeof a === b;
      break;
    default: {
      throw new Error('helper {{compare}}: invalid operator: `' + operator + '`');
    }
  }

  if (result === false) {
    return options.inverse(this);
  }
  return options.fn(this);
});
