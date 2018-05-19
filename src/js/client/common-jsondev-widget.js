"use strict";

fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.jsonDev");

/**
 * `gpii.devpmt.jsonDev` An infusion viewComponent widget for the devpmt
 * to view, and potentially update some json in a model.
 */
fluid.defaults("gpii.devpmt.jsonDev", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        editing: null // The json tree we're actually editing
    },
    modelListeners: {
        editing: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    },
    templates: {
        initial: "common-jsondev-widget"
    }
});
