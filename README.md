# Development Preferences Test Tool and other Management Tools

This repository contains a web based tool for editing preference safes and
sets as part of the larger eco-system of GPII modules. It contains resuable
routines and widgets as well that other preference editing user interfaces
can be built from.  While it has changed during the course of development and
testing, its fundamental design is still based on these
[original designs](https://drive.google.com/open?id=0Bxy2B0Y99qCubGVUSlNCRFU3d0U).

## Requirements

The base requirements for building this project are the same as other core
GPII projects and the setup is detailed in
[Setting Up Your Development Environment](http://wiki.gpii.net/w/Setting_Up_Your_Development_Environment).

Additionally this project currently relies on a running preferences server using a
branch containing more API's for the PPT. [GPII-2966](https://github.com/GPII/universal/pull/634).

## Installation

Building the PPT follows the typical set of `git` and `npm` commands.
Running the PPT depends on having some other external services running. These
include an instance of CouchDB, a GPII Preferences server, and optionally a
Redis server for session storage.

```bash
git clone https://github.com/sgithens/gpii-devpmt.git
cd gpii-devpmt
npm install
```

## Configs and Environment Variables

Currently 2 configs are made available, that can be used with the `NODE_ENV`
environment variable. The default config uses in-memory session storage for
browser sessions, whereas the second uses Redis to persist sessions.

| Name | Possible values | Usage |
| ---- | --------------- | ----- |
| NODE_ENV | `gpii.config.devpmt.express.base` | Default Config used if not set. In memory session store. |
|          | `gpii.config.devpmt.express.redisSessions` | Uses the Redis backend to persist sessions. |
| GPII_DEVPMT_LISTEN_PORT | Default is `8085` | Port number that the main web app is served on. |
| GPII_DEVPMT_TO_PREFERENCESSERVER_URL | Default is `http://localhost:8081` | This is required to call the preference server API's |
| GPII_REDIS_HOST | Default is `127.0.0.1` | (Optional) If using the Redis session backend |
| GPII_REDIS_PORT | Default is `6370` | (Optional) If using the Redis session backend |

## Running

To run just the server on port 8085 run `node index.js`, and visit the following
link in a browser `http://localhost:8085/prefs/alice`.

To run in electron app (at the time of writing still requires port 8085),
run `npm start`.

## Setting up dependent servers: PrefsServer, Redis, CouchDB

Information on setting up a cloud based Preferences Server can be found
[here](https://github.com/gpii/universal#quick-start).
If you want to test a full workflow using Morphic as well, you will need to run
the online Flowmanager endpoints as well.

Information on running Redis and CouchDB can be found at their respectives websites
[here](http://couchdb.apache.org) and [here](https://redis.io).

Additionally, docker can be used to quickly bring up these servers for development,
though more configuration would be necessary for a secure production environment.

```bash
# For development only

# Quickly bring up CouchDB using Docker
docker run -p 5984:5984 -v /directory/path/to/keep/persistent/couch:/opt/couchdb/data -d couchdb

# Quickly bring up Redis using Docker
docker run -p 6379:6379 -v /directory/path/to/keep/presistent/redis:/data -d redis redis-server --appendonly yes
```

### Using with Morphic

The PPT can be used to test preference safes and onboarding with the Morphic desktop
application. Settings can be edited in the PPT, tested on Morphic and vice versa.
If you save something using the Quick Set Strip, these settings can then be verified in
the PPT.  Morphic's configuration allows changing the GPII cloud server in use. By
configuring it to point to your PPT server, you can use it for development and debugging.

To temporarily point a desktop Morphic installation to a PPT development cloud, the
following changes can be made to `C:\Program Files (x86)\Morphic\start.cmd`
For this example we are using a GCP developers cloud.

```bat
@echo off
rem set GPII_CLOUD_URL=https://flowmanager.prd.gcp.gpii.net
set GPII_CLOUD_URL=https://flowmanager.sgithens.dev.gcp.gpii.net
set NODE_TLS_REJECT_UNAUTHORIZED=0
cd windows
start /min morphic-app.exe
```

Do note that this relaxes SSL restrictions in case your development cluster uses
self signed certs. Also, this should NOT be used with any "real" or production data.

## Development

### Running Tests and Linting

To run the tests you'll need to install `chromedriver`. After that you can run,
`npm test`.  Linting tasks can be run with `grunt lint`.

As noted above under requirements, currently this repository depends on the GPII-2966
branch of `universal`, and an instance of this branch must be running and available
to run the unit tests. This requirement to have a separate universal instance running
will go away in the next release.

The complete steps to setup the necessary branches and code are as follows:

1. CouchDB running on port 5984, with an empty datastore, or at least no `gpii` database, however you like to do that.

2. Universal GPII-2452

```bash
git clone git@github.com:GPII/universal.git
cd universal/
git remote rename origin GPII
git checkout -b GPII-2966 GPII/GPII-2966
npm install
GPII_COUCHDB_URL="http://localhost:5984/gpii" GPII_APP_DIR=$(pwd) bash -c ./scripts/deleteAndLoadSnapsets.sh

export NODE_ENV=gpii.config.preferencesServer.standalone.production
npm start
```

3. PPT

```bash
git clone git@github.com:GPII/gpii-devpmt.git
cd gpii-devpmt/
npm install
npm test
```

### Testing with a VM and Vagrant

Tests can be run using a vagrant provisioned virtual machine. The requirements are the same other GPII projects
and details can be found [here](https://github.com/GPII/qi-development-environments/#requirements).

The following commands run from the `gpii-devpmt` checkout will create a VM, setup the dependent servers, and
run the tests.

```bash
vagrant up
npm run test:vagrantSetup
npm run test:vagrant
```

### Foundation theme development

This project has a customizations to the Foundation CSS framework.  Out of the box
foundation uses gulp for its watch tasks, because of that we install gulp in
addition to grunt to reduce the number of changes we have to make to the foundation
tooling. To start the watch task for developing the foundation theme simply run `gulp`.
The local foundation scss files are located in `src/scss` and their compiled output
is placed in `src/css/app.css`. This happens automaticaly when you run `gulp`.

## Terminology

This sections contains some high and low level terminology to help understand the workings
and goals of this project. Some terms have undergone changes and renaming during the
course of development, and those will be highlighted here as well. This section can and
will change with updates over time.

- PMT - Preferences Management Tool - This was the original name for this project and is still
  occasionally used to reference tools for editing preferences.
- PPT - Power Preferences Tool - Current public facing name for the comprehensive editor in
  this project for "power" users, allowing detailed development and debugging of preference safes
  and solutions onboarding.
- Morphic - In progress set of UI specs and applications geared towards every day users of the system.
  Much friendlier and simpler user interface.
- Solutons - Solutions are third party applications that have been onboarded and made available such
  that the GPII can configure them and help manage their application lifecycle for users.
- Products - In the context of the PPT, we publicly refer to solutions as "Products". Internally, from
  a development standpoint, you can treat them the same.
- Preference Safe - A Preference Safe is a document detailing all the information for a user whose
  setup is stored in the GPII. It contains Preference Sets, metadata, and links to Keys and Tokens.
  This information is stored as JSON, usually in CouchDB.
- Preference Sets - A Preference Set is a listing of Generic Preferences and Solution specific preferences.
  A Preference Safe can contain multiple Preference Sets that could be used in different situations, such
  as at Home, or on Campus.
- Contexts - The historical precursor to Preference Sets. If you see any keys in a Preference Safe document
  called `contexts`, they are indeed Preference Sets.
- Generic Preferences - Preferences for a user that are generic enough to be translated to specific settings
  in a number of 3rd party solutions.
- Common Terms - The historial precursor to Generic Preferences. If you see anything in the code base referring
  to these, you can treat them as Generic Preferences.
