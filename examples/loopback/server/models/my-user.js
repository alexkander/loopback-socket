'use strict';

const LoopbackSocket = require('loopback-socket');
const Promise        = require('bluebird');

const app = require('../server');

module.exports = function(MyUser) {

  const loopbackSocket = LoopbackSocket.get('myapp');

  loopbackSocket.auth({ model: MyUser, method: 'authenticate', });
  MyUser.authenticate = function (socket, credentials) {
    return Promise.resolve()
    .then(() => {
      if (!credentials) throw 'Socket Credentials not recieved';
      return app.models.AccessToken.findOne({
        where: {
          userId: credentials.userId,
          id: credentials.id
        }
      });
    })
    .then((token) => {
      if (!token) throw 'Socket Token not found';
      return MyUser.findById(token.userId);
    })
    .then((user) => {
      if (!user) throw 'Socket User not found';
    })
  };

  loopbackSocket.defineMethod('getProfile', { model: MyUser, method: 'getProfile', });
  MyUser.getProfile = function (socket, credentials, args) {
    return app.models.MyUser.findById(credentials.userId);
  };

  loopbackSocket.onConnected({ model: MyUser, method: 'onConnected', })
  MyUser.onConnected = function (socket, credentials) {
    // Do something with each autenticated socket
  };

  MyUser.removeOnConnectMethod = function () {

    // remove on connect handler with direct method
    loopbackSocket.removeOnConnected(MyUser.onConnected);

    // remove on connect handler with object argument
    loopbackSocket.removeOnConnected({ model: MyUser, method: 'onConnected', });

  };

  MyUser.removeMethodProfileMethod = function () {

    // remove on connect handler with direct method
    loopbackSocket.removeMethod('getProfile');

  };

};
