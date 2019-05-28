/**
 * Common Event Bindings
 *
 * Provides a grade `gpii.binder.bindMarkupEvents` to streamline the
 * process of attaching html events such as `click` to selectors.
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

/**
 * GPII Binder Markup Events Grade
 * This grade allows binding typical HTML events such as
 * mouse clicks and keypress events to selectors each time
 * the markup is rendered for a component. (Meaning they will
 * also apply if a component is rerendered after a model refresh
 * or similar situation)
 *
 * It adds a new area to a grades options called `markupEventBindings`
 * which allows binding `selectors` to jQuery events. Theoretically
 * other event constructs could be supported in the future, but only
 * jQuery events are implemented at the time of writing.
 *
 * Example usage of adding a click handler to a selector productListLinks.
 * ```
 * markupEventBindings: {
 *     productListLinks: {
 *         // type: jQuery <- Defaults to jQuery but could be configured ITF
 *         method: "click",
 *         args: ["{that}.selectProduct"]
 *     }
 * }
 * ```
 *
 * This work is currently being reviewed for inclusion in gpii-binder or another
 * dependency here: https://issues.gpii.net/browse/GPII-2933
 */
fluid.defaults("gpii.binder.bindMarkupEvents", {
    mergePolicy: {
        decorators: "noexpand"
    },
    events: {
        onDomBind: null,
        onDomUnbind: null
    },
    listeners: {
        "onMarkupRendered.bindMarkupEvents": "{that}.events.onDomBind.fire({that}, {that}.container)",
        "onDestroy.unbindMarkupEvents": {
            func: "{that}.events.onDomUnbind.fire",
            args: ["{that}", "{that}.container"],
            priority: "first"
        },
        "onDomBind.processDecorators": "fluid.decoratorViewComponent.processDecorators({that}, {that}.options.markupEventBindings)"
    }
});

fluid.registerNamespace("fluid.decoratorViewComponent");

//
// The methods below might be generic enough to go straight to infusion
//

fluid.expandCompoundArg = function (that, arg, name) {
    var expanded = arg;
    if (typeof(arg) === "string") {
        if (arg.indexOf("(") !== -1) {
            var invokerec = fluid.compactStringToRec(arg, "invoker");
            // TODO: perhaps a a courtesy we could expose {node} or even {this}
            expanded = fluid.makeInvoker(that, invokerec, name);
        } else {
            expanded = fluid.expandOptions(arg, that);
        }
    }
    return expanded;
};

fluid.processjQueryDecorator = function (dec, node, that, name) {
    var args = fluid.makeArray(dec.args);
    var expanded = fluid.transform(args, function (arg, index) {
        return fluid.expandCompoundArg(that, arg, name + " argument " + index);
    });
    fluid.log("Got expanded value of ", expanded, " for jQuery decorator");
    var func = node[dec.method];
    return func.apply(node, expanded);
};

fluid.decoratorViewComponent.processDecorators = function (that, decorators) {
    fluid.each(decorators, function (val, key) {
        var node = that.locate(key);
        if (node.length > 0) {
            var name = "Decorator for DOM node with selector " + key + " for component " + fluid.dumpThat(that);
            var decs = fluid.makeArray(val);
            fluid.each(decs, function (dec) {
                // If no type is specified default to jQuery
                if (!dec.type || dec.type === "jQuery") {
                    fluid.processjQueryDecorator(dec, node, that, name);
                }
            });
        }
    });
};
