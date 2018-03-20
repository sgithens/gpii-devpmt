# Development Preferences Test Tool and other Management Tools

This project is the foundation for the DPTT and other comprehensive preferences
management tools for the GPII.

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

To run the tests you'll need to install `chromedriver`. After that you can run,
`npm test`.  Linting tasks for javascript and json can be run
with `grunt eslint` and `grunt jsonlint` respectively.

# Building Stand Alone

While the tool is built to run primarily as a web application, it is possible
to build a stand alone version that runs using the Electron Shell. In this case,
the app is still running as a local web service, but the initialisation is
taken care of by Electron, and the app is conveniently displayed in an Electon
window. This currently uses the electron-packager.

```bash
npm install electron-packager -g
git clone therepo
npm install
npm prune --production
npm install dedupe-infusion
grunt dedupe-infusion
electron-packager .
```
