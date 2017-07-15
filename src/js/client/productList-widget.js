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
        productListItems: ".pmt-sidebar-toc-product",
        productListLinks: ".pmt-sidebar-product-link"
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
    listeners: {
        "onMarkupRendered": [
            {
                "this": "{that}.dom.productListLinks",
                "method": "click",
                args: ["{that}.selectProduct"]
            }
        ],
        activateProduct: {
            funcName: "console.log",
            args: ["Listener to it: ", "{arguments}.0"]
        }
    }
});

gpii.devpmt.productList.selectProduct = function (that, devpmt, event) {
    var appid = event.currentTarget.dataset.appid;
    console.log("Activated Product: " + event.currentTarget.dataset.appid);
    that.events.activateProduct.fire(appid);
    console.log("Fired event");
    // TODO Fix up the create order or figure out how to add a delayed listener,
    // such that devpmt can listen for this, since it can't create a listener, since
    // this component is created after it is finished being created.
    console.log("Going to use: ", $(that.dom.addProductAppId).val());
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

    // var results = that.lunrIndex.search("*" + productListFilter + "*");
    var results = that.lunrIndex.query(function (q) {
        console.log(q);
        q.term(productListFilter);
        q.term("*" + productListFilter);
        q.term("*" + productListFilter + "*");
    });

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
