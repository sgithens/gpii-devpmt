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
