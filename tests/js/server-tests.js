/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");
require("../../index.js");
fluid.registerNamespace("gpii.tests.devpmt.server");

gpii.tests.devpmt.server.loadTestDataNPSetsTest = function () {
    var npsets = gpii.devpmt.loadTestDataNPSets("/../../../devpmtTestData/preferences");
    var haveAlice = false;
    fluid.each(npsets, function (val) {
        if (val === "alice") {
            haveAlice = true;
        }
    });
    jqUnit.assertEquals("Make sure we have alice.", haveAlice, true);
};

gpii.tests.devpmt.server.loadCommonTermsMetadataTest = function () {
    var terms = gpii.devpmt.loadCommonTermsMetadata();
    var fontSize = terms["http://registry.gpii.net/common/fontSize"];
    jqUnit.assertEquals("Font Size should have a name", "Font Size", fontSize.name);
};

fluid.defaults("gpii.tests.devpmt.server.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: [
        {
            name: "Devpmt tests...",
            tests: [
                {
                    name: "Devpmt Server Tests",
                    type: "test",
                    sequence: [
                        { funcName: "gpii.tests.devpmt.server.loadCommonTermsMetadataTest" },
                        { funcName: "gpii.tests.devpmt.server.loadTestDataNPSetsTest" }
                        // { funcName: "gpii.tests.devpmt.server.npsetLoadTest" },
                        // { funcName: "gpii.tests.devpmt.server.npsetApplicationsTest" }
                    ]
                }
            ]
        }
    ]
});

fluid.defaults("gpii.tests.devpmt.server.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    components: {
        testCaseHolder: {
            type: "gpii.tests.devpmt.server.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.devpmt.server.environment");

/* Tests for NP Sets */

gpii.tests.devpmt.server.npsetLoadTest = function () {
    var comp = gpii.devpmt.npset({
        npsetName: "elod"
    });
    jqUnit.assertEquals("Test that we've got Elod", comp.options.npsetName, "elod");
    jqUnit.assertEquals("There should only be 1 context", comp.contextNames().length, 1);
    jqUnit.assertEquals("and it should be gpii-default", comp.contextNames()[0], "gpii-default");
};

gpii.tests.devpmt.server.npsetApplicationsTest = function () {
    var davey = gpii.devpmt.npset({npsetName: "davey"});
    var andrei = gpii.devpmt.npset({npsetName: "andrei"});

    var daveyApps = davey.npsetApplications();
    jqUnit.assertEquals("Davey should have just RWG", 1, daveyApps.length);
    jqUnit.assertEquals("RWG Full URI ", daveyApps[0].uri, "http://registry.gpii.net/applications/com.texthelp.readWriteGold");
    jqUnit.assertEquals("RWG ID ", daveyApps[0].appId, "com.texthelp.readWriteGold");
    jqUnit.assertEquals("RWG Settings", 18, daveyApps[0].settingKeys.length);

    var andreiApps = andrei.npsetApplications();
    jqUnit.assertEquals("Andrei should have 6 apps right now", 6, andreiApps.length);
};
