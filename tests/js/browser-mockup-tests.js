/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");
fluid.require("gpii-webdriver");
gpii.webdriver.loadTestingSupport();

require("../../index.js");

fluid.defaults("gpii.tests.devpmt.caseHolder.hello", {
    gradeNames: ["gpii.test.webdriver.caseHolder"],
    rawModules: [{
        name: "Almost there...",
        tests: [
            {
                name: "Basic hello world test...",
                type: "test",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.get",
                        args: "http://localhost:8080/src/templates/pages/mockup.html"
                    },
                    {
                        event: "{testEnvironment}.webdriver.events.onGetComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args: [{ id: "title" }]
                    },
                    {
                        event: "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "gpii.test.webdriver.inspectElement",
                        args: ["Testing the title", "{arguments}.0", "getText", "Generic Preference Settings"]
                    }
                ]
            },
            {
                name: "Prefs Editor Smoketest using Alice",
                type: "test",
                sequence: [
                    {
                        func: "{testEnvironment}.webdriver.get",
                        args: "http://localhost:8080/editprefs/alice"
                    },
                    {
                        event: "{testEnvironment}.webdriver.events.onGetComplete",
                        listener: "{testEnvironment}.webdriver.findElement",
                        args: [{ id: "top" }]
                    },
                    {
                        event: "{testEnvironment}.webdriver.events.onFindElementComplete",
                        listener: "gpii.test.webdriver.inspectElement",
                        args: ["Testing the title", "{arguments}.0", "getText", "Preference Set: alice"]
                    }
                ]
            }
        ]
    }],
    sequenceStart: [],
    sequenceEnd: []
});


fluid.defaults("gpii.tests.devpmt.testEnvironment", {
    gradeNames: ["gpii.test.webdriver.testEnvironment"],
    components: {
        basicCaseHolder: {
            type: "gpii.tests.devpmt.caseHolder.hello"
        }
    }
});

gpii.test.webdriver.allBrowsers({ baseTestEnvironment: "gpii.tests.devpmt.testEnvironment" });
