"use strict";

var fluid = require("infusion"),
    kettle = require("kettle"),
    gpii = fluid.registerNamespace("gpii"),
    jqUnit = fluid.registerNamespace("jqUnit");

require("../../index.js");

kettle.loadTestingSupport();

fluid.registerNamespace("gpii.tests.devpmt.server");

gpii.tests.devpmt.server.testRedirect = function (response, location, statusCode) {
    jqUnit.assertEquals("Check location:", location, response.headers.location);
    jqUnit.assertEquals("Check status code: ", statusCode, response.statusCode);
};

gpii.tests.devpmt.server.commonComponents = {
    config: {
        configName: "gpii.config.devpmt.express.base",
        configPath: "%gpii-devpmt/configs"
    },
    components: {
        indexGetRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: "/",
                method: "GET",
                port: 8085
            }
        },
        pptLoginPostRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: "/ppt/dev/login",
                method: "POST",
                port: 8085,
            }
        },
        pptHomeRequest: {
            type: "kettle.test.request.httpCookie",
            options: {
                path: "/ppt",
                method: "GET",
                port: 8085,
            }
        }
    }
}

gpii.tests.devpmt.server.testDefs = [{
    name: "Basic test for loading the index page.",
    sequence: [{
        func: "{indexGetRequest}.send"
    }, {
        event: "{indexGetRequest}.events.onComplete",
        listener: "kettle.test.assertResponse",
        args: {
            message: "Checking for part of the html page",
            string: "{arguments}.0",
            request: "{indexGetRequest}",
            plainText: true,
            expectedSubstring: "<title>Developers Preference Testing Tool</title>"
        }
    }]
},
{
    name: "Successfull login to PPT, and checking access to authorized page.",
    sequence: [{
        func: "{pptLoginPostRequest}.send",
        args: {
            "username": "morphic",
            "password": "gpii"
        }
    }, {
        event: "{pptLoginPostRequest}.events.onComplete",
        listener: "gpii.tests.devpmt.server.testRedirect",
        args: ["{arguments}.1.nativeResponse", "/ppt", 302] //, "{arguments}.1.nativeResponse"]
    }, {
        // All the pages below should require authentication. We should be able to view
        // them as we're logged in.
        func: "{pptHomeRequest}.send"
    }, {
        event: "{pptHomeRequest}.events.onComplete",
        listener: "kettle.test.assertResponse",
        args: {
            message: "Checking for part of the html page",
            string: "{arguments}.0",
            request: "{pptHomeRequest}",
            plainText: true,
            expectedSubstring: "prefsSafe-alice"
        }
    }]
},
{
    name: "Failed login to PPT, and checks to make sure we cannot access pages that require login.",
    sequence: [{
        func: "{pptLoginPostRequest}.send",
        args: {
            "username": "fakemorphic",
            "password": "gpii"
        }
    }, {
        event: "{pptLoginPostRequest}.events.onComplete",
        listener: "gpii.tests.devpmt.server.testRedirect",
        args: ["{arguments}.1.nativeResponse", "/", 302]
    }, {
        func: "{pptHomeRequest}.send"
    }, {
        event: "{pptHomeRequest}.events.onComplete",
        listener: "gpii.tests.devpmt.server.testRedirect",
        args: ["{arguments}.1.nativeResponse", "/", 302]
    }]
}];

gpii.tests.devpmt.server.finalTestDefs = fluid.transform(gpii.tests.devpmt.server.testDefs, function (testDef) {
    return fluid.extend({}, gpii.tests.devpmt.server.commonComponents, testDef);
});

kettle.test.bootstrapServer(gpii.tests.devpmt.server.finalTestDefs);
