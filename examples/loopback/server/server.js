'use strict';

const loopback       = require('loopback');
const boot           = require('loopback-boot');
const LoopbackSocket = require('loopback-socket');
const io             = require('socket.io');

const app = module.exports = loopback();

app.start = function() {
  // start the web server
  const handler = app.listen(function() {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      const explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }

    // LoobakSocket setup
    const lbSocket = LoopbackSocket.get('myapp');
    const socketServer = io(handler);
    lbSocket.start(socketServer);

  });

  return handler;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
