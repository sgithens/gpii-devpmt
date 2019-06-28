/**
 * Prefs Safe Key List Widget
 *
 * Widget which displays a table listing the keys and credentials
 * associated with a preferences safe.
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
