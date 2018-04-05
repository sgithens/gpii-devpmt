/*
 * editprefset-productList-widget
 *
 * A component that renders a list of all the applications/products, as well
 * as including Generic Settings at the top of the list. Typically used on
 * the left hand side for navigation and adding new products to an NP Set.
 */
/* global lunr */
"use strict";

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");
fluid.registerNamespace("gpii.devpmt.productList");

/**
 *  Main infusion component for a filterable product list.
 */
fluid.defaults("gpii.devpmt.productListWidget", {
    gradeNames: ["gpii.devpmt.viewComponent"],
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
        productListFilterContainer: "#pmt-filter-container",
        productListItems: ".pmt-sidebar-toc-product",
        productListLinks: ".pmt-sidebar-product-link"
    },
    bindings: {
    },
    templates: {
        initial: "editprefset-productList-widget"
    },
    components: {
        filter: {
            type: "gpii.devpmt.filterWidget",
            createOnEvent: "onMarkupRendered",
            container: "{that}.dom.productListFilterContainer",
            options: {
                selectors: {
                    initial: "#pmt-common-filter-area"
                },
                model: {
                    filterText: "{productListWidget}.model.productListFilter"
                }
            }
        }
    },
    lunrIndex: null,
    invokers: {
        updateLunrIndex: {
            funcName: "gpii.devpmt.productList.updateProductListLunrIndex",
            args: ["{that}"]
        },
        filterProductList: {
            funcName: "gpii.devpmt.productList.filterProductList",
            args: ["{that}", "{that}.dom.productListItems", "{that}.model.productListFilter"]
        },
        // Used when clicking on the product, or otherwise activating it from the list.
        selectProduct: {
            funcName: "gpii.devpmt.productList.selectProduct",
            args: ["{that}", "{gpii.devpmt.editPrefs}", "{arguments}.0"]
        }
    },
    events: {
        activateProduct: null
    },
    markupEventBindings: {
        productListLinks: {
            method: "click",
            args: ["{that}.selectProduct"]
        }
    }
});

gpii.devpmt.productList.selectProduct = function (that, devpmt, event) {
    var appid = event.currentTarget.dataset.appid;
    that.events.activateProduct.fire(appid);
    // TODO Fix up the create order or figure out how to add a delayed listener,
    // such that devpmt can listen for this, since it can't create a listener, since
    // this component is created after it is finished being created.
    devpmt.openAddProductDialog(appid);
};

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

    var results = gpii.devpmt.lunrListFilterSearch(that.lunrIndex, productListFilter);

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
