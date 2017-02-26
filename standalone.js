/* eslint-env node */
"use strict";
require("./index.js");
var electron = require("electron");
var app = electron.app;
var BrowserWindow = require("electron").BrowserWindow;

app.on("ready", function () {
    var win = new BrowserWindow({width: 1200, height: 800});
    win.loadURL("http://localhost:8080/prefs/alice");
});
