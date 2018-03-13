"use strict";

module.exports = function (grunt) {

    grunt.initConfig({
        eslint: {
            all: ["*.js", "src/**/*.js", "tests/**/*.js"]
        },
        jsonlint: {
            all: [".eslintrc.json", "package.json", "configs/**/*.json", "src/**/*.json", "tests/**/*.json", "devpmtTestData/**/*.json"]
        },
        json5lint: {
            options: {
                enableJSON5: true
            },
            src: ["src/**/*.json5", "tests/**/*.json5", "*.json5"]
        },
        shell: {
            options: {
                stdout: true,
                srderr: true,
                failOnError: true
            }
        }
    });

    grunt.loadNpmTasks("fluid-grunt-eslint");
    grunt.loadNpmTasks("fluid-grunt-json5lint");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-shell");

    grunt.registerTask("default", ["lint"]);
    grunt.registerTask("lint", "Run eslint and jsonlint", ["eslint", "jsonlint", "json5lint"]);
};
