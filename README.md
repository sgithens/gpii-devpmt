# Development Preferences Test Tool and other Management Tools

This repository contains a web based tool for editing preferences safes and
sets as part of the larger eco-system of GPII modules. It contains resuable
routines and widgets as well that other preference editing user interfaces
can be based on.  While it's changed during the course of development and
testing, it's fundamental design is still based on these
[original designs](https://drive.google.com/open?id=0Bxy2B0Y99qCubGVUSlNCRFU3d0U).

# Installation

```bash
git clone https://github.com/sgithens/gpii-devpmt.git
cd gpii-devpmt
npm install
```

# Running

To run just the server on port 8080 run `node index.js`, and visit the following
link in a browser `http://localhost:8080/prefs/alice`.

To run in electron app (at the time of writing still requires port 8080),
run `npm start`.

# Development

## Running Tests and Linting

To run the tests you'll need to install `chromedriver`. After that you can run,
`npm test`.  Linting tasks for javascript and json can be run
with `grunt eslint` and `grunt jsonlint` respectively.

## Foundation theme development

This project has a customizations to the Foundation CSS framework.  Out of the box
foundation uses gulp for it's watch tasks, because of that we install gulp in
addition to grunt to reduce the number of changes we have to make to the foundation
tooling. To start the watch task for developing the foundation theme simply run `gulp`.
The local foundation scss files are located in `src/scss` and their compiled output
is placed in `src/css/app.css`. This happens automaticaly when you run `gulp`.