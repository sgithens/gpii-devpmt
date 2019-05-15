/**
 * Common JSON Dev Widget
 *
 * Contains a grade `gpii.devpmt.jsonDev` that can be used in
 * various places on the page to display underlying JSON for
 * development and debugging purposes.
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
