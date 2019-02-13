"use strict";

// A simple bootstrap file which allows a configuration of the devpmt to be
// started from the command line from universal

var fluid = require("./index.js"),
    gpii = fluid.registerNamespace("gpii");

gpii.devpmt.start();
