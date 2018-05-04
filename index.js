/* eslint-env node */
"use strict";

require(__dirname + "/src/js/server/devpmt-express.js");
require(__dirname + "/src/js/server/devpmt-datasources.js");
require(__dirname + "/src/js/server/devpmt-page-dispatchers.js");
require(__dirname + "/src/js/server/devpmt-safe-mgmt.js");
require(__dirname + "/src/js/server/devpmt-personal-cloudSafes-express.js");
require(__dirname + "/src/js/server/devpmt-personal-cloudSafes-page-dispatchers.js");
require(__dirname + "/src/js/common/util.js");

fluid.module.register("gpii-devpmt", __dirname, require);

var gpii = fluid.registerNamespace("gpii");

gpii.devpmt();
gpii.personalCloudSafe.express();

module.exports = gpii.devpmt;
