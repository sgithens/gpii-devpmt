/*
 * productList-widget
 *
 * A component that renders a list of all the applications/products, as well
 * as including Generic Settings at the top of the list. Typically used on
 * the left hand side for navigation and adding new products to an NP Set.
 */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.productList");

/**
 *  Main infusion component for a filterable product list.
 */
fluid.defaults("gpii.devpmt.productListWidget", {
    gradeNames: ["gpii.handlebars.templateAware", "gpii.binder.bindOnCreate", "gpii.binder.bindOnDomChange"],
    model: {
        productListFilter: "",
        allSolutionsSorted: []
    },
    modelListeners: {
        productListFilter: {
            func: "{that}.filterProductList"
        },
        allSolutionsSorted: {
            func: "{that}.updateLunrIndex"
        }
    },
    selectors: {
        productListFilter: "#product-list-filter",
        productListItems: ".pmt-sidebar-toc-product"
    },
    bindings: {
        "productListFilter": "productListFilter"
    },
    templates: {
        initial: "productList-widget"
    },
    lunrIndex: null,
    invokers: {
        renderInitialMarkup: {
            func: "{that}.renderMarkup",
            args: ["initial", "{that}.options.templates.initial", "{that}.model"]
        },
        updateLunrIndex: {
            funcName: "gpii.devpmt.productList.updateProductListLunrIndex",
            args: ["{that}"]
        },
        filterProductList: {
            funcName: "gpii.devpmt.productList.filterProductList",
            args: ["{that}", "{that}.dom.productListItems", "{that}.model.productListFilter"]
        }
    }
});

/**
 * Filters the products in the list, usually runs on a model listener for when
 * a user updates the filter text.
 *
 * @param that
 * @param productListItems
 * @param productListFilter
 */
gpii.devpmt.productList.filterProductList = function (that, productListItems, productListFilter) {
    if (!that.lunrIndex) {
        return;
    }
    productListItems.hide();

    var results = that.lunrIndex.search("*" + productListFilter + "*");
    // TODO Remove this double loop
    fluid.each(productListItems, function (product) {
        fluid.each(results, function (result) {
            if (result.ref === product.dataset.appid) {
                $(product).show();
            }
        });
    });
};

/**
 * Typically runs in response to a change in the list of products in the
 * list so that the lunr index can either be rebuilt or updated.
 *
 * @param that
 */
gpii.devpmt.productList.updateProductListLunrIndex = function (that) {
    var lunrIndex = lunr(function () {
        var idx = this;
        this.ref("id");
        this.field("name");
        this.field("appId");
        this.b(0.01);

        fluid.each(that.model.allSolutionsSorted, function (sol) {
            idx.add({
                "id": sol.id,
                "name": sol.name,
                "appId": sol.id
            });
        });
    });
    that.lunrIndex = lunrIndex;
};
