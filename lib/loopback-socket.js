'use strict';

const Promise      = require('bluebird');
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

function buildHandler(socket, handler) {
  return (args, done) => {
    return Promise.resolve()
    .then(() => {
      return promisify(handler, socket, args);
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
}

LoopbackSocket.get = function (name, timeout) {
  if (!sockets[name]) {
    sockets[name] = new LoopbackSocket(name, timeout);
  }
  return sockets[name];
};

LoopbackSocket.prototype.addMethod = function (alias, method) {
  this._methods[alias] = method;
};

LoopbackSocket.prototype.removeMethod = function (alias) {
  delete this._methods[alias];
};

LoopbackSocket.prototype.onConnected = function (method) {
  this._connected.push(method)
};

LoopbackSocket.prototype.removeOnConnected = function (method) {
  const idx = this._connected.indexOf(getMethod(method));
  if (idx===-1) return;
  this._connected.splice(idx, 1);
};

LoopbackSocket.prototype.auth = function (io, m) {
  // Permite autenticar a los usuarios que se conectan
  this._io = io;
  socketioAuth(io, {
    authenticate: (socket, credentials, cb) => {
      promisify(getMethod(m), socket, credentials)
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
          .map((alias) => {
            socket.on(alias, buildHandler(socket, getMethod(this._methods[alias])));
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



// promisify(function (a,b,c) {
//   console.log(a,b,c)
//   return { a,b,c };
// }, 1,2,3)
// .then((result) => {
//   console.log('1', result);
// })

// promisify(function (a,b,c, cb) {
//   console.log(a,b,c)
//   cb(null, { a,b,c });
// }, 4,5,6)
// .then((result) => {
//   console.log('1', result);
// })

// buildHandler(null, function (socket, args) {
//   console.log('handler', arguments.length, args);
//   return { b:2 };
// })

// ({ a:1 }, (result) => {
//   console.log('done', result);
// });

// buildHandler(null, function (socket, args, cb) {
//   console.log('handler2', arguments.length, args);
//   cb(null, { b:2 });
// })

// ({ a:1 }, (result) => {
//   console.log('done2', result);
// });

// buildHandler(null, (socket, args) => {
//   console.log('handler3', arguments.length, args);
//   return { b:2 };
// })

// ({ a:1 }, (result) => {
//   console.log('done3', result);
// });

// buildHandler(null, (socket, args, cb) => {
//   console.log('handler4', arguments.length, args);
//   cb(null, { b:2 });
// })

// ({ a:1 }, (result) => {
//   console.log('done4', result);
// });