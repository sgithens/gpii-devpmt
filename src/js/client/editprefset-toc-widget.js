/*
 * editprefset-toc-widget
 *
 * A widget to outline the various portions of the ppt editing page, from safe
 * overview through generic preferences, and a listing of all the applications
 * currently added to the site.  Meant to appear on the left hand side as a sort
 * of table of contents.
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

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.editPrefsTocWidget");

fluid.defaults("gpii.devpmt.editPrefsTocWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
    model: {
        npsetApplications: null,
        allSolutions: null,
        renderList: null
    },
    selectors: {
        editPrefsTocContainer: "#pmt-editprefstoc-container"
    },
    templates: {
        initial: "editprefset-toc-widget"
    },
    modelListeners: {
        "npsetApplications": {
            funcName: "gpii.devpmt.editPrefsTocWidget.generateRenderList",
            args: ["{that}"]
        },
        "renderList": {
            func: "{that}.reRender"
        }
    }
});


gpii.devpmt.editPrefsTocWidget.generateRenderList = function (that) {
    var togo = [];
    fluid.each(that.model.npsetApplications, function (app) {
        togo.push({
            appId: app.appId,
            name: that.model.allSolutions[app.appId].name
        });
        that.applier.change("renderList", togo);
    });
};
