/* eslint-env node */
"use strict";

require(__dirname + "/src/js/server/devpmt-express.js");
require(__dirname + "/src/js/server/devpmt-datasources.js");
require(__dirname + "/src/js/common/util.js");

var gpii = fluid.registerNamespace("gpii");

gpii.devpmt();

module.exports = gpii.devpmt;
