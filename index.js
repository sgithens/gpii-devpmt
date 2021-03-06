/* eslint-env node */
"use strict";

var fluid = require("infusion");
// Make sure we get a good copy of gpii-express
fluid.require("gpii-express");


require("./src/js/server/devpmt-express.js");
require("./src/js/server/devpmt-base-dispatchers.js");
require("./src/js/server/devpmt-ppt-dispatchers.js");
require("./src/js/server/devpmt-morphic-dispatchers.js");
require("./src/js/common/util.js");

fluid.module.register("gpii-devpmt", __dirname, require);

var gpii = fluid.registerNamespace("gpii");
var kettle = fluid.registerNamespace("kettle");

fluid.registerNamespace("gpii.devpmt");

gpii.devpmt.start = function () {
    kettle.config.loadConfig({
        configName: kettle.config.getConfigName("gpii.config.devpmt.express.base"),
        configPath: kettle.config.getConfigPath("%gpii-devpmt/configs")
    });
};

module.exports = fluid;
