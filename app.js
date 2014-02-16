"use strict";

// Load configuration and initialize server
var AnyfetchProvider = require('anyfetch-provider');
var serverConfig = require('./lib/');

var server = AnyfetchProvider.createServer(serverConfig);

// Expose the server
module.exports = server;
