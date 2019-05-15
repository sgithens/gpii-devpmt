/**
 * editprefset-prefSetsList-widget
 *
 * A widget for listing all preferences sets (contexts) in a
 * preference safe (preference set). Includes functionality for
 * listing information, and performing some operations, such as
 * deleting a preference set.
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

fluid.registerNamespace("gpii.devpmt.prefSetsList");

/**
 * Infusion component for a widget rendering a set of
 * prefSets (contexts) from a safe. Rerenders whenever
 * the set of contexts updates in the model. In most
 * situations this will be a model relay rule to the
 * central `editPrefs` component on the page.
 *
 * Delete buttons trigger the delete context method
 * on the central `editPrefs` component.
 */
fluid.defaults("gpii.devpmt.prefSetsListWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        contextNames: [],
        flatPrefs: {}
    },
    modelListeners: {
        contextNames: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        },
        flatPrefs: {
            func: "{that}.reRender",
            excludeSource: ["init"]
        }
    },
    templates: {
        initial: "editprefset-prefSetsList-widget"
    },
    selectors: {
        deletePrefsSetButtons: ".pmt-delete-context",
        editPrefsSetButtons: ".pmt-edit-context"
    },
    markupEventBindings: {
        deletePrefsSetButtons: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.onDeletePrefsSet"
        },
        editPrefsSetButtons: {
            method: "click",
            args: "{gpii.devpmt.editPrefs}.onEditPrefsSet"
        }
    }
});
