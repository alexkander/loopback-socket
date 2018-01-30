loopback-socket
=========

[![Build Status](https://travis-ci.org/arondn2/loopback-socket.svg?branch=master)](https://travis-ci.org/arondn2/loopback-socket)
[![Coverage Status](https://coveralls.io/repos/github/arondn2/loopback-socket/badge.svg?branch=master)](https://coveralls.io/github/arondn2/loopback-socket?branch=master)

Loopback module for create Socket.io connections and allow call methods.

## Installation

`npm install loopback-socket --save`

## Usage

### Server side

#### Include
```js
const LoopbackSocket = require('loopback-socket');
```

#### Instance

The method `LoopbackSocket.get` to create a new instance with a name or return the instance with the that name. The second argument of this method define the time to wait authentication after stablish connection before disconnect the socket.

```js
const lbSocket = LoopbackSocket.get('name');
const lbSocket = LoopbackSocket.get('name', 2000);
```

#### Initialize

To start it is necesary call `lbSocket.start` method indicating the server socket.

```js
const server = require('http').createServer();
const io = require('socket.io')(server);
lbSocket.start(io);
```

#### Authentication function

To autenticate the socket, it must send its credentials once it establish connection. It will be disconnected if authentication fails or if it is not authenticated within the established time in `LoopbackSocket.get` second parameter.

```js
// Method with NodeJs callback style
function myAuthentication(socket, credentials, cb) {
  User.getUserByCredentials(credentials, cb);
}

// Method with direct value returned o Promise style;
function myAuthentication(socket, credentials) {
  return User.getUserByCredentials(credentials); // return data or a promise
}
```

To set the autentication method use `lbSocket.auth` method.

##### Set simple authentication

```js
lbSocket.auth(myAuthentication);
```

##### Set Model method authentication

```js
function MyModel() {};

lbSocket.auth({
  model: MyModel,
  method: 'customAuthentication'
});

MyModel.customAuthentication = myAuthentication;
```

#### Method structure

The methods can receive until four arguments: `socket`, `credentials`, `args` and `cb`. If you define just the two first arguments the value returned to the client will be the return of the method. also if the returned value is a promise, then it will be resolved before send result to client.

```js
/// Method with NodeJs callback style
function myMethod(socket, credentials, args, cb) {
  let data;

  // Option 1
  cb(null, data); // Client receive { result: data }
  
  // Option 2
  cb('myError');  // Client receive { error: 'myError' }

}

/// Method with direct value returned o Promise style;
function myMethod(socket, credentials, args) {
  let dataOrPromise;

  // Option 1
  return dataOrPromise; // Client receive { result: dataOrPromiseResolvedValue }

  // Option 2
  throw 'myError'; // Client receive { error: 'myError' }

}
```

To define a method use the method `lbSocket.defineMethod`.

##### Define simple method

```js
lbSocket.defineMethod('myMethod', myMethod);
```

##### Define model method

```js
function MyModel() {};

lbSocket.defineMethod('myMethod', {
  model: MyModel,
  method: 'myMethod',
});

MyModel.myMethod = myMethod;

```

### Client side sample

```js
const socket = io('http://localhost');

socket.on('connect', (socket) => {
  // Send credentials
  socket.emit('authentication', credentials);
});

socket.on('authenticated', (socket) => {
  // socket authenticated

});

socket.on('unauthorized', (socket) => {
  // socket fail authentication
});

function callMyMethod() {
  // Call a defined socket method
  socket.emit('myMethod', {}, (response) => {
    if (response.error) {
      // Method return a error;
      return;
    }
    // Method success;
    console.log(response.result);
  });
}

```

### Samples

#### Loopback + AngularJS:

https://github.com/arondn2/loopback-socket/tree/master/examples/loopback

### Troubles

If you have any kind of trouble with it, just let me now by raising an issue on the GitHub issue tracker here:

https://github.com/arondn2/loopback-socket/issues

## Tests

`npm test` or `npm run cover`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
