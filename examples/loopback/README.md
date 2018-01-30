# Loopback + AngularJS Sample

## Installation

 ```
 npm install
 bower install
 ```

## Start

 ```
 node .
 ```

## Relevants codes

### Server side

#### Starting

```js
// server/server.js
// ....
const lbSocket = LoopbackSocket.get('myapp');
const socketServer = io(handler);
lbSocket.start(socketServer);
// ....
```

#### Authentication

```js
// server/models/my-user.js
// ....
const lbSocket = LoopbackSocket.get('myapp');

lbSocket.auth({ model: MyUser, method: 'authenticate', });
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
// ....
```

#### Methods definitions

```js
// server/models/my-user.js
// ....
lbSocket.defineMethod('getProfile', { model: MyUser, method: 'getProfile', });
MyUser.getProfile = function (socket, credentials, args) {
  return app.models.MyUser.findById(credentials.userId);
};
// ....

// server/models/my-model.js
// ....
const lbSocket = LoopbackSocket.get('myapp');
lbSocket.defineMethod('getRecords', { model: MyModel, method: 'getRecords', });
MyModel.getRecords = function (socket, credentials, args) {
  return MyModel.find({
    skip: args.skip,
    limit: args.limit,
  });
};
// ....
```

### Client side

#### AngularJS Digest creator callback
```
.service('Handler', function () {
  return ($scope, cb) => {
    return function () {
      const args = arguments;
      $scope.$apply(() => {
        cb.apply(null, args);
      });
    };
  };
})
```

#### Sockect events handlers
```js
.service('CustomSocket', function (Handler) {
  return ($scope, url, token) => {
    const socket = io.connect(url);
    socket.authed = null;

    socket.on('connect', Handler($scope, () => {
      socket.emit('authentication', {
        id: token.id,
        userId: token.userId,
      });
    }));

    socket.on('authenticated', Handler($scope, () => {
      socket.authed = true;
    }));

    socket.on('unauthorized', Handler($scope, () => {
      socket.authed = false;
    }));

    socket.on('disconnected', Handler($scope, () => {
      socket.authed = null;
    }));

    return socket;

  }
})
```

#### Login and socket connection

```js
$scope.promiseLogin = MyUser.login($scope.credentials).$promise
.then((response) => {
  token = response;
  $scope.socket = socket = CustomSocket($scope, 'http://localhost:3000', token);
  socket.authed = null;
})
.finally(() => {
  delete $scope.promiseLogin;
});
```