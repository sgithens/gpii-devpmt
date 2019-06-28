/**
 * Prefs Safe Info Widget
 *
 * Simple display widget showing various metadata about the
 * preference safe in a table.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
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
