'use strict';

const Promise      = require('bluebird');
const socketioAuth = require('socketio-auth');

const sockets = {};

function LoopbackSocket (name, timeout) {
  this._name      = name;
  this._timeout   = timeout || 3000;
  this._methods   = [];
  this._connected = [];
}

LoopbackSocket.get = function (name, timeout) {
  if (!sockets[name]) {
    sockets[name] = new LoopbackSocket(name, timeout);
  }
  return sockets[name];
};

LoopbackSocket.prototype.addMethod = function (m) {
  this._methods.push(m);
};

LoopbackSocket.prototype.onConnected = function (m) {
  this._connected.push(m)
};

function getMethod (m) {
  if (typeof m === 'function') {
    return m;
  }
  if (typeof m.method === 'function') {
    return m.method;
  }
  if (typeof m.model[m.method] === 'function') {
    return m.model[m.method];
  }
  throw new Error('Method no found');
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
      console.error('LoopbackSocket.buildHandler error:', error);
      return { error };
    })
    .then((data) => {
      done(data);
    });
  };
}

LoopbackSocket.prototype.auth = function (io, m) {
  // Permite autenticar a los usuarios que se conectan
  socketioAuth(io, {
    authenticate: (socket, credentials, cb) => {
      const authentication = promisify(getMethod(m));
      authentication(socket, credentials)
      .then((user) => {
        cb(null, true);
        return Promise.resolve()
        .then(() => {
          return this._connected;
        })
        .mapSeries(((m) => {
          return promisify(getMethod(m), socket, credentials);
        }))
        .then(() => {
          this._methods.map((m) => {
            const eventName = m.alias || `${m.model.modelName}.${m.method}`;
            socket.on(eventName, buildHandler(socket, getMethod(m)));
          });
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