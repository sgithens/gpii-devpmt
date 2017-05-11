"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * Component for showing My/All Settings and Products, and then
 * also searching them via input.
 */
fluid.defaults("gpii.devpmt.prefsFilter", {
    gradeNames: ["fluid.viewComponent"],
    selectors: {
        mySettingsButton: "#pmt-mysettings-button",
        allSettingsButton: "#pmt-allsettings-button",
        settingsSearchInput: "#pmt-settings-search-input",
        settingsSearchButton: "#pmt-settings-search-button",
        myProductsButton: "#pmt-myproducts-button",
        allProductsButton: "#pmt-allproducts-button",
        productsSearchInput: "#pmt-products-search-input",
        productsSearchButton: "#pmt-products-search-button"
    },
    model: {
    },
    invokers: {
        setSettingsFilter: {
            funcName: "gpii.devpmt.prefsFilter.setSettingsFilter",
            args: ["{that}", "{editPrefs}", "{arguments}.0"]
        },
        setProductsFilter: {
            funcName: "gpii.devpmt.prefsFilter.setProductsFilter",
            args: ["{that}", "{editPrefs}", "{arguments}.0"]
        },
        searchSettings: {
            funcName: "gpii.devpmt.prefsFilter.searchSettings",
            args: ["{that}", "{that}.dom.settingsSearchInput", "{editPrefs}"]
        },
        searchProducts: {
            funcName: "gpii.devpmt.prefsFilter.searchProducts",
            args: ["{that}", "{that}.dom.productsSearchInput", "{editPrefs}"]
        }
    },
    listeners: {
        "onCreate": [
            {
                "this": "{that}.dom.mySettingsButton",
                "method": "click",
                args: ["mysettings", "{that}.setSettingsFilter"]
            },
            {
                "this": "{that}.dom.allSettingsButton",
                "method": "click",
                args: ["allsettings", "{that}.setSettingsFilter"]
            },
            {
                "this": "{that}.dom.settingsSearchButton",
                "method": "click",
                args: ["{that}.searchSettings"]
            },
            {
                "this": "{that}.dom.myProductsButton",
                "method": "click",
                args: ["myproducts", "{that}.setProductsFilter"]
            },
            {
                "this": "{that}.dom.allProductsButton",
                "method": "click",
                args: ["allproducts", "{that}.setProductsFilter"]
            },
            {
                "this": "{that}.dom.productsSearchButton",
                "method": "click",
                args: ["{that}.searchProducts"]
            }
        ]
    }
});

fluid.registerNamespace("gpii.devpmt.prefsFilter");

gpii.devpmt.prefsFilter.searchSettings = function (that, searchInput, editPrefs) {
    editPrefs.applier.change("settingsSearch", searchInput.val());
    editPrefs.renderInitialMarkup();
};

gpii.devpmt.prefsFilter.searchProducts = function (that, searchInput, editPrefs) {
    editPrefs.applier.change("productsSearch", searchInput.val());
    editPrefs.renderInitialMarkup();
};

gpii.devpmt.prefsFilter.setSettingsFilter = function (that, editPrefs, event) {
    editPrefs.applier.change("settingsFilter", event.data);
    editPrefs.renderInitialMarkup();
};

gpii.devpmt.prefsFilter.setProductsFilter = function (that, editPrefs, event) {
    editPrefs.applier.change("productsFilter", event.data);
    editPrefs.renderInitialMarkup();
};
