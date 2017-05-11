"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
var fs = require("fs");
var JSON5 = require("json5");

gpii.devpmt.loadNPSet = function (prefsetDir, prefsetName, ontologyHandler) {
    var elod = JSON5.parse(fs.readFileSync(
        __dirname + prefsetDir + prefsetName + ".json"));
    var npset = ontologyHandler.rawPrefsToOntology(elod, "flat");
    return npset;
};

gpii.devpmt.loadNPSetDocs = function (prefsetDir, prefsetName) {
    var docs = "";
    var filename = __dirname + prefsetDir + prefsetName + ".md";
    if (fs.existsSync(filename)) {
        docs = fs.readFileSync(filename, {encoding: "UTF8"});
    }
    return docs;
};

gpii.devpmt.saveNPSet = function (prefsetDir, npsetName, data) {
    var filename = prefsetDir + npsetName + ".json"; 
    console.log("About to writte to: ", filename);
    fs.writeFileSync(filename, data);
};

/**
 * Return our new metadata that includes descriptive content for each
 * common term including a json schema.
 *
 * @return (Object) Common terms keyed by flat id
 */
gpii.devpmt.loadCommonTermsMetadata = function () {
    var commonTerms = JSON5.parse(fs.readFileSync(
        __dirname + "/../../../src/js/commonTerms.json5"));
    return commonTerms;
};

/**
 * For now load all the solutions documents from the universal repo,
 * this needs to be replaced with a straight call to the solutions
 * registry.
 */
gpii.devpmt.loadAllSolutions = function (solutionsDirectory) {
    var solutionFiles = ["android","darwin","linux","web","win32"];
    var togo = {};
    fluid.each(solutionFiles, function (value) {
        var next = JSON5.parse(fs.readFileSync(
            __dirname + solutionsDirectory + value + ".json5"));
        togo = fluid.merge({"": ["replace,noexpand"]}, togo, next);
    });
    return togo;
};

/**
 * loadTestDataNPSets - A function to fetch the current list of NP sets that are
 * being used for development in GPII testData.
 *
 * @return (Array) Simple relay of file names without parent path, ex.
 *      ["alice.json", "elod.json"]
 */
gpii.devpmt.loadTestDataNPSets = function (folder) {
    var allFiles = fs.readdirSync(
        __dirname + folder);
    var npsets = [];
    fluid.each(allFiles, function (val) {
        if (val.endsWith(".json") || val.endsWith(".json5")) {
            npsets.push(val.split(/\./)[0]);
        }
    });
    return npsets;
};
