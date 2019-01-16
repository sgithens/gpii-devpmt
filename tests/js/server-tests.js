/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");
var lunr = require("lunr");
require("../../index.js");
fluid.registerNamespace("gpii.tests.devpmt.server");

gpii.tests.devpmt.server.loadTestDataNPSetsTest = function () {
    var npsets = gpii.devpmt.loadTestDataNPSets(fluid.module.resolvePath("%gpii-devpmt/node_modules/gpii-universal/testData/preferences/"));
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
    jqUnit.assertEquals("Font Size should have a name", "Font Size", fontSize.title);
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
                        // { funcName: "gpii.tests.devpmt.server.loadCommonTermsMetadataTest" },
                        // { funcName: "gpii.tests.devpmt.server.loadTestDataNPSetsTest" },
                        { funcName: "gpii.tests.devpmt.server.lunrCaseInsesitiveTest" }
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

/**
 * Tests for Searching, Lunr, etc.
 */

gpii.tests.devpmt.server.makeTestProductIndex = function () {
    var entries = [
        {
            id: "com.freedomscientific.jaws",
            "name": "JAWS"
        }, {
            id: "org.nvda-project",
            "name": "NVDA Screen Reader"
        }, {
            id: "com.microsoft.windows.onscreenKeyboard",
            "name": "Windows Built-in Onscreen Keyboard"
        }
    ];

    var lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("appId");
        this.b(0.01); // lunr.js field length normalisation

        fluid.each(entries, function (sol) {
            idx.add({
                "id": sol.id,
                "name": sol.name,
                "appId": sol.id
            });
        });
    });

    return lunrIndex;
};

gpii.tests.devpmt.server.lunrCaseInsesitiveTest = function () {
    var index = gpii.tests.devpmt.server.makeTestProductIndex();

    var jawsResults = gpii.devpmt.lunrListFilterSearch(index, "jaws");
    jqUnit.assertEquals("lcase: There should be 1 result for jaws", jawsResults.length, 1);
    jqUnit.assertEquals("lcase: The ref should be the jaws ID", jawsResults[0].ref, "com.freedomscientific.jaws");

    jawsResults = gpii.devpmt.lunrListFilterSearch(index, "JAWS");
    jqUnit.assertEquals("ucase: There should be 1 result for JAWS", jawsResults.length, 1);
    jqUnit.assertEquals("ucase: The ref should be the JAWS ID", jawsResults[0].ref, "com.freedomscientific.jaws");
};

gpii.tests.devpmt.server.passwordCreateUnlockTest = function () {
};
