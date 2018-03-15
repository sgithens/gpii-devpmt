/* eslint-env node */
"use strict";

require(__dirname + "/src/js/server/devpmt-express.js");
require(__dirname + "/src/js/server/devpmt-datasources.js");
require(__dirname + "/src/js/common/util.js");

fluid.module.register("gpii-devpmt", __dirname, require);

var gpii = fluid.registerNamespace("gpii");

gpii.devpmt();

module.exports = gpii.devpmt;
