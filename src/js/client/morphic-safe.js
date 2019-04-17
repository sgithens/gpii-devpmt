/**
 * Morphic Safe Viewport
 *
 * Viewport for a full page component to view and potentially edit
 * a preference safe.
 * This is part of the UI for a public user workflow to view and manage
 * preference safes.
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

fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

fluid.defaults("gpii.devpmt.morphic.editsafe", {
    gradeNames: ["gpii.devpmt.editPrefs"]
});
