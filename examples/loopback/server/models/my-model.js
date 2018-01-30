'use strict';

const LoopbackSocket = require('loopback-socket');

module.exports = function(MyModel) {

  const loopbackSocket = LoopbackSocket.get('myapp');

  loopbackSocket.defineMethod('getRecords', { model: MyModel, method: 'getRecords', });
  MyModel.getRecords = function (socket, credentials, args) {
    return MyModel.find({
      skip: args.skip,
      limit: args.limit,
    });
  };

};
