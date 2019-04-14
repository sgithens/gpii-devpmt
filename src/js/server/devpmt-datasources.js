/**
 * Devpmt Data Sources
 *
 * Data sources for retrieving directory GPII solutions registry entries,
 * generic settings metadata, and GPII demo persona descriptions.
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

var gpii = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.devpmt");

/**
 * PreFetch DataSource
 * `gpii.devpmt.dataSource.prefetchDataSource`
 *
 * A `kettle.dataSource` like component that is backed by a
 * specific dataSource subcomponent. When the prefetchDataSource is
 * created, it immediately fetches a copy of data using the dataSource's
 * get method and stores it in the `current` member.  Each time the
 * get method is used, the value of `current` is updated.
 */
fluid.defaults("gpii.devpmt.dataSource.prefetchDataSource", {
    gradeNames: ["fluid.component"],
    components: {
        dataSource: null
    },
    invokers: {
        get: {
            funcName: "gpii.devpmt.dataSource.prefetchDataSource.get",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    },
    members: {
        current: null
    },
    listeners: {
        onCreate: {
            func: "{that}.get"
        }
    }
});

/**
 * `get` implementation for `gpii.devpmt.dataSource.prefetchDataSource`.
 * Fetches data from the underlying dataSource
 * @param  {Object} that        prefetchDataSource instance
 * @param  {Object} directModel `kettle.dataSource` directModel
 * @param  {Object} options     `kettle.dataSource` options
 * @return {Promise}            `kettle.dataSource.get` promise
 */
gpii.devpmt.dataSource.prefetchDataSource.get = function (that, directModel, options) {
    var promiseFetch = that.dataSource.get(directModel, options);
    promiseFetch.then(function (data) {
        that.current = data;
    });
    return promiseFetch;
};

/**
 * `gpii.devpmt.dataSource.prefSetDocs`
 *
 * File based dataSource that fetches a prefSet markdown documentation file
 * typically from testData/preferences.  That directory should be passed in as
 * `prefSetDir` in the construction options. And `prefSetId` is
 * used in the termMap.
 */
fluid.defaults("gpii.devpmt.dataSource.prefSetDocs", {
    gradeNames: "kettle.dataSource.file",
    prefSetDir: "", // Should be passed in options
    path: "%prefSetDir/%prefSetId.md",
    termMap: {
        prefSetId: "%prefSetId",
        prefSetDir: "{that}.options.prefSetDir"
    },
    writable: false,
    components: {
        encoding: {
            type: "kettle.dataSource.encoding.none"
        }
    }
});

/**
 * Prefetched DataSource for our new metadata that includes descriptive content for each
 * common term including a json schema.
 */
fluid.defaults("gpii.devpmt.dataSource.commonTermsMetadata", {
    gradeNames: ["gpii.devpmt.dataSource.prefetchDataSource"],
    components: {
        dataSource: {
            type: "kettle.dataSource.file",
            options: {
                path: "@expand:fluid.module.resolvePath(%gpii-devpmt/node_modules/gpii-universal/testData/ontologies/flat.json5)",
                components: {
                    encoding: {
                        type: "kettle.dataSource.encoding.JSON5"
                    }
                }
            }
        }
    }
});

/**
 * `gpii.devpmt.dataSource.solutions`
 *
 * File based dataSource that fetches the solutions for a particular
 * os, which should be passed in as the `osId` option.
 */
fluid.defaults("gpii.devpmt.dataSource.solutions", {
    gradeNames: "kettle.dataSource.file",
    solutionsDir: "", // Should be passed in options
    path: "%solutionsDir/%osId.json5",
    termMap: {
        osId: "%osId",
        solutionsDir: "{that}.options.solutionsDir"
    },
    writable: false,
    components: {
        encoding: {
            type: "kettle.dataSource.encoding.JSON5"
        }
    }
});
