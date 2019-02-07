"use strict";

fluid.defaults("gpii.devpmt.prefsSafeKeysList", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        keys: []
    },
    modelListeners: {
        prefsSafe: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    },
    templates: {
        initial: "editprefset-prefsSafeKeysList-widget"
    }
});
