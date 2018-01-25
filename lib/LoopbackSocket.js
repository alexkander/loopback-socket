'use strict';

// const socketioAuth = require('socketio-auth');

const sockets = {};

function LoopbackSocket (name, _timeout) {
  this._name      = name;
  this._timeout   = _timeout || 3000;
  this._methods   = [];
  this._connected = [];
}

LoopbackSocket.get = function (name, _timeout) {
  if (!sockets[name]) {
    sockets[name] = new LoopbackSocket(name, _timeout);
  }
  return sockets[name];
};

LoopbackSocket.getMethod = function (m) {
  if (typeof m === 'function') {
    return m;
  }
  if (typeof m.method === 'function') {
    return m.method;
  }
  return m.model[m.method];
};

LoopbackSocket.prototype.addMethod = function (m) {
  this._methods.push(m);
};

LoopbackSocket.prototype.onConnected = function (m) {
  this._connected.push(m)
};

function buildHandler(socket, promiseBuild) {
  return (args, done) => {
//     return Promise.resolve()
//     .then(() => {
//       return promiseBuild(socket, args);
//     })
//     .then((result) => {
//       return { result };
//     })
//     .catch((error) => {
//       console.error('$buildHandler error:', error);
//       return { error };
//     })
//     .then((data) => {
//       done(data);
//     });
  };
}

LoopbackSocket.prototype.auth = function (server, m) {
  // Permite autenticar a los usuarios que se conectan
//   socketioAuth(server, {
//     authenticate: (socket, credentials, callback) => {
//       const authentication = LoopbackSocket.getMethod(m);
//       authentication(socket, credentials)
//       .then((response) => { callback(null, true); })
//       .then(() => {
//         return this._connected;
//       })
//       .mapSeries(((m) => {
//         const method = LoopbackSocket.getMethod(m);
//         return method(socket, credentials);
//       }))
//       .then(() => {
            // this._methods.map((m) => {
            //   const eventName = m.alias || `${m.model.modelName}.${m.method}`;
            //   socket.on(eventName, buildHandler(socket, LoopbackSocket.getMethod(m)));
            // });
//       })
//       .catch(callback);
//     },
//     timeout: this._timeout
//   });
};

module.exports = LoopbackSocket;