"use strict";

fluid.defaults("gpii.devpmt.prefsSafeInfoWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        prefsSafe: null
    },
    modelListeners: {
        prefsSafe: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    },
    templates: {
        initial: "editprefset-prefsSafeInfo-widget"
    }
});
