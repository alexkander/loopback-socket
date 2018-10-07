'use strict';

const socketioAuth = require('socketio-auth');

const sockets = {};

function invalidMethod(socket, args) {
  throw new Error('invalid method');
}

function getMethod (method) {
  if (typeof method === 'function') {
    return method;
  }
  if (method && method.model && typeof method.model[method.method] === 'function') {
    return method.model[method.method];
  }
  return invalidMethod;
}

function promisify (handler, ...args) {
  return Promise.resolve()
  .then(() => {
    if (handler.length<=args.length) {
      return handler.apply(null, args);
    }
    return new Promise((resolve, reject) => {
      handler.apply(null, [].concat(args).concat([(err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }]));
    });
  })
}

function buildHandler(socket, credentials, handler) {
  return (args, done) => {
    return Promise.resolve()
    .then(() => {
      return promisify(handler, socket, credentials, args);
    })
    .then((result) => {
      return { result };
    })
    .catch((error) => {
      return { error };
    })
    .then((data) => {
      done(data);
    });
  };
}

function LoopbackSocket (name, timeout) {
  this._name      = name;
  this._timeout   = timeout || 3000;
  this._methods   = {};
  this._connected = [];
  this._sockets   = [];
  this._io        = null;
  this._auth      = (socket, credentials) => {};
}

LoopbackSocket.get = function (name, timeout) {
  if (!sockets[name]) {
    sockets[name] = new LoopbackSocket(name, timeout);
  }
  return sockets[name];
};

LoopbackSocket.prototype.auth = function (auth) {
  this._auth = auth;
};

LoopbackSocket.prototype.defineMethod = function (methodName, method) {
  this._methods[methodName] = method;
};

LoopbackSocket.prototype.removeMethod = function (methodName) {
  delete this._methods[methodName];
};

LoopbackSocket.prototype.onConnected = function (method) {
  this._connected.push(method)
};

LoopbackSocket.prototype.removeOnConnected = function (method) {
  const idx = this._connected.indexOf(getMethod(method));
  if (idx===-1) return;
  this._connected.splice(idx, 1);
};

LoopbackSocket.prototype.start = function (io) {
  // Permite autenticar a los usuarios que se conectan
  this._io = io;
  socketioAuth(io, {
    authenticate: (socket, credentials, cb) => {
      promisify(getMethod(this._auth), socket, credentials)
      .then((user) => {
        return Promise.resolve()
        .then(() => {
          return this._connected;
        })
        .mapSeries(((m) => {
          return promisify(getMethod(m), socket, credentials);
        }))
        .then(() => {
          Object.keys(this._methods)
          .map((methodName) => {
            socket.on(methodName, buildHandler(socket, credentials, getMethod(this._methods[methodName])));
          });
        })
        .finally(() => {
          cb(null, true);
        })
      })
      .catch(cb);
    },
    timeout: this._timeout
  });
};

module.exports = LoopbackSocket;

