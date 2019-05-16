/**
 * editprefset-prefSetsList-widget
 *
 * A widget for listing all preferences sets in a
 * preference safe. Includes functionality for
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
 * preference sets from a safe. Rerenders whenever
 * the set of prefsSets updates in the model. In most
 * situations this will be a model relay rule to the
 * central `editPrefs` component on the page.
 *
 * Delete buttons trigger the delete prefsSet method
 * on the central `editPrefs` component.
 */
fluid.defaults("gpii.devpmt.prefSetsListWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        prefsSetNames: [],
        flatPrefs: {}
    },
    modelListeners: {
        prefsSetNames: {
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
        deletePrefsSetButtons: ".pmt-delete-prefsSet",
        editPrefsSetButtons: ".pmt-edit-prefsSet"
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
