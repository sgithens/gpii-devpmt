/**
 * Morphic Create Safe Viewport
 *
 * Viewport for a full page component to create a new preference safe.
 * This is part of the UI for a public user workflow to create new accounts
 * and safes for Morphic.
 *
 * Copyright 2019 Raising the Floor - International
 *
 * Licensed under the New BSD license. You may not use this file except in
 * compliance with this License.
 *
 * You may obtain a copy of the License at
 * https://github.com/GPII/universal/blob/master/LICENSE.txt
 */
/* global zxcvbn */
"use strict";

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

fluid.defaults("gpii.devpmt.morphic.createSafeViewport", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    // gradeNames: ["fluid.component"],
    selectors: {
        initial: "#morphic-create-safe-viewport",
        usernameInput: "#morphic-username",
        passwordInput: "#morphic-password",
        passwordStrengthLabel: "#morphic-password-strength",
        acceptTermsCheckbox: "#morphic-accept-terms",
        signUpButton: "#morphic-sign-up-button"
    },
    invokers: {
        checkPasswordStrength: {
            funcName: "gpii.devpmt.morphic.createSafeViewport.checkPasswordStrength",
            args: ["{that}", "{arguments}.0"]
        }
    },
    markupEventBindings: {
        passwordInput: [{
            method: "change",
            args: "{that}.checkPasswordStrength"
        }, {
            method: "keydown",
            args: "{that}.checkPasswordStrength"
        }]
    },
    templates: {
        initial: "morphic-create-safe-viewport"
    }
});

gpii.devpmt.morphic.createSafeViewport.checkPasswordStrength = function (that/*, e */) {
    var passwd = that.dom.locate("passwordInput").val();
    var strengthLabel = that.dom.locate("passwordStrengthLabel");
    var strength = zxcvbn(passwd);
    var ranks = [
        "too guessable",
        "very guessable",
        "somewhat guessable",
        "safely unguessable",
        "very unguessable"
    ];
    var message = ranks[strength.score];
    strengthLabel.html(message);
};
