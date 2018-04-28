/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var bcrypt = require("bcrypt");

fluid.registerNamespace("gpii.devpmt.safemgmt");

/**
 * Create a hash from a plaintext password suitable to store
 * in the password field of a preferences safe.
 *
 * @param {String} password     Plain text password.
 * @return {String}             Hashed password.
 */
gpii.devpmt.safemgmt.hashPassword = function (password) {
    return bcrypt.hashSync(password, 10);
};

/**
 * Check a plainText password, perhaps from a safe login
 * against a hash, probably coming from a safe's password field.
 *
 * @param {String} plainText    Plain text password to check.
 * @param {String} hash         Hash, mostly likely from prefsSafe.password.
 * @return {Boolean}            True if the passwords match.
 */
gpii.devpmt.safemgmt.checkPassword = function (plainText, hash) {
    return bcrypt.compareSync(plainText, hash);
};

/**
 * Fetches the preferences safe by id name, checks to see if the password
 * is correct, and if so returns a promise with the safe json.
 *
 * @param {String} name         Safe id/name
 * @param {String} password     Plain text password
 * @return {Promise}
 */
gpii.devpmt.safemgmt.loginToSafe = function (name, password) {
    var safeByNameDS = gpii.devpmt.dataSource.safemgmt.prefSafeByName();
    var finalPromise = fluid.promise();
    var prom = safeByNameDS.get({name: name});
    prom.then(function (res) {
        var safe = res.rows[0].value;
        if (gpii.devpmt.safemgmt.checkPassword(password, safe.password)) {
            finalPromise.resolve(safe);
        }
        else {
            finalPromise.resolve({error: true, message: "Bad password"});
        }
    });
    return finalPromise;
};


gpii.devpmt.safemgmt.changeSafePassword = function (name, password) {
    // TODO use async version
    var hash = gpii.devpmt.safemgmt.hashPassword(password);

    var prefSafeDS = gpii.devpmt.dataSource.safemgmt.prefSafe();

    var safeByNameDS = gpii.devpmt.dataSource.safemgmt.prefSafeByName();
    var prom = safeByNameDS.get({name: name});
    prom.then(function (res) {
        var safe = res.rows[0].value;
        safe.password = hash;
        var updateProm = prefSafeDS.set({prefSafeId: safe._id}, safe);
        updateProm.then(function (res) {
            fluid.log("hopefully updated the safe", res);
        });
    });
};

gpii.devpmt.safemgmt.createAnonSafe = function (name, password) {
    var hash = gpii.devpmt.safemgmt.hashPassword(password);
    var prefSafeDS = gpii.devpmt.dataSource.safemgmt.prefSafe();

    // TODO Blow up if the safe already exists
    var safe = {
        "_id": name,
        "type": "prefsSafe",
        "schemaVersion": "0.1",
        "prefsSafeType": "user",
        "name": name,
        "password": hash,
        "email": null,
        "preferences": {
            "flat": {
                "name": name,
                "contexts": {
                    "gpii-default": {
                        "name": "Default preferences",
                        "preferences": {}
                    }
                }
            }
        },
        "timestampCreated": null,
        "timestampUpdated": null
    };

    var promTogo = fluid.promise();
    var promDS = prefSafeDS.set({prefSafeId: name}, safe);
    promDS.then(function (res) {
        promTogo.resolve(res);
    }, function (error) {
        fluid.error("Error creating prefsafe: ", error);
    });
    return promTogo;
};

