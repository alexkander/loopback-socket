'use strict';

const loopback       = require('loopback');
const boot           = require('loopback-boot');
const io             = require('socket.io');
const LoopbackSocket = require('../../../'); // const LoopbackSocket = require('loopback-socket');

const app = module.exports = loopback();

app.start = function() {
  // start the web server
  const handler = app.listen(function() {
    app.emit('started');
    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);

    // LoobakSocket setup
    const loopbackSocket = LoopbackSocket.get('myapp');
    const socketServer = io(handler);
    loopbackSocket.start(socketServer);

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
