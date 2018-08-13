/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.devpmt.safemgmt");

/**
 * Creates a new Cloud Safe Login for a user, by creating a gpiiKey and 
 * then a gpii-express-user account that will be tied to that login.
 *
 */
gpii.devpmt.safemgmt.createCloudSafeLogin = function (devpmt, prefsSafeId, loginName, email, password) {

var gpiiExpressEntry = devpmt.gpiiExpressUserApi.createNewUser(loginName, email, password);

var keyData = {
    type: "gpiiKey",
    schemaVersion: "0.1",
    prefsSafeId: prefsSafeId,
    revoked: false,
    revokedReason: null,
    timestampCreated: null,
    timestampUpdated: null,

    access: "login",
    keyType: "gpiiExpressUser",
    gpiiExpressUserId: gpiiExpressEntry._id
};

var prom = devpmt.prefsSafeKeyCreationDataSource.set({}, keyData);

return prom;

};


// Old work below, gpii-express-user work above

/**
 * Fetches the preferences safe by id name, checks to see if the password
 * is correct, and if so returns a promise with the safe json.
 *
 * @param {String} name         Safe id/name
 * @param {String} password     Plain text password
 * @return {Promise}
 */
gpii.devpmt.safemgmt.loginToSafe = function (devpmt, name, password) {
    var safeProm = devpmt.unlockSafeDataSource.set({}, {
        username: name,
        password: password
    });
    return safeProm;



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

