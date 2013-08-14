// # config/routes

// Routes client requests to handlers
module.exports = function router (server, handlers) {
  'use strict';
  
  // Connection phase
  server.get('/init/connect', handlers.init.connect);
  server.get('/init/callback', handlers.init.callback);
};
