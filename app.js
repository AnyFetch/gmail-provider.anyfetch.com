// # app
// Configures the application

// Load configuration and initialize server
var restify       = require('restify'),
    mongoose      = require('mongoose'),
    configuration = require('./config/configuration.js'),
    lib           = require("./lib/provider-google-contact"),
    handlers      = lib.handlers,
    middleware    = lib.middleware,
    server        = restify.createServer();

// Connect mongoose
mongoose.connect(configuration.mongo_url);

// Middleware Goes Here
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// Load routes
require("./config/routes.js")(server, handlers);

// Expose the server
module.exports = server;
