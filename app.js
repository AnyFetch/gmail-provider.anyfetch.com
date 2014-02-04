"use strict";

// Load configuration and initialize server
var anyfetchProvider = require('anyfetch-provider');
var serverConfig = require('./lib/');

var server = anyfetchProvider.createServer(serverConfig);

// Expose the server
module.exports = server;
