# Development Preferences Test Tool and other Management Tools

This repository contains a web based tool for editing preferences safes and
sets as part of the larger eco-system of GPII modules. It contains resuable
routines and widgets as well that other preference editing user interfaces
can be based on.  While it's changed during the course of development and
testing, it's fundamental design is still based on these
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

### Using with Morphic

The PPT can be used to test preference safes and onboarding with the Morphic desktop
application. By pointing your local morphic install to the same cloud that the PPT
is using for it's data once can make preference safe changes in the PPT and test
the results by keying in and out of Morphic.

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
self signed certs. Also, this should be used with any "real" or production data.

## Development

### Running Tests and Linting

To run the tests you'll need to install `chromedriver`. After that you can run,
`npm test`.  Linting tasks can be run with `grunt lint`.

### Foundation theme development

This project has a customizations to the Foundation CSS framework.  Out of the box
foundation uses gulp for it's watch tasks, because of that we install gulp in
addition to grunt to reduce the number of changes we have to make to the foundation
tooling. To start the watch task for developing the foundation theme simply run `gulp`.
The local foundation scss files are located in `src/scss` and their compiled output
is placed in `src/css/app.css`. This happens automaticaly when you run `gulp`.
