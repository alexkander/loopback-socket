loopback-socket
=========

[![npm version](https://badge.fury.io/js/loopback-socket.svg)](https://badge.fury.io/js/loopback-socket) [![Build Status](https://travis-ci.org/arondn2/loopback-socket.svg?branch=master)](https://travis-ci.org/arondn2/loopback-socket)
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

#### LoopbackSocket.get(name, [timeout])

Create or get a instance with a specific name.

##### Arguments
 Name        | Type      | Description
-------------|-----------|-------------
 `name`      | `string`  | Name to instance. Required
 `[timeout]` | `integer` | Time to wait authentication after establish connection before disconnect the socket. Optional.

##### Example
```js
const loopbackSocket = LoopbackSocket.get('name');
const loopbackSocket = LoopbackSocket.get('name', 2000);
```

#### loopbackSocket.start(io)

Configure authentication, callbacks and methods with a server socket.

##### Arguments
 Name | Type     | Description
------|----------|-------------
 `io` | `object` | Server Socket IO instance. Required.

##### Example
```js
const server = require('http').createServer();
const io = require('socket.io')(server);
loopbackSocket.start(io);
```

#### loopbackSocket.auth(authentication)

Set the function to authenticate connected sockets.

##### Arguments
 Name             | Type                                 | Description
------------------|--------------------------------------|-------------
 `authentication` | `autentication function` or `object` | Function called with `(socket, credentials, [cb])` arguments or object like `{ model: Model, method: methodName }` where `Model` is a class and `methodName` is one of its methods (defined or to be defined) like `autentication function`.

##### Authentication function

If an error is thrown in this function or it return a false value then authentication fails. If argument `cb` is not defined then the returned value will be a the authentication response, and if this value is a promise, then it will be resolved before.

 Name          | Type       | Description
---------------|------------|-------------
 `socket`      | `object`   | Socket connected. Required.
 `credentials` | `object`   | Credentials received. Required.
 `[cb]`        | `function` | Callback with `(err, success)` arguments to async return value with NodeJs callback style. Optional.

##### Example
```js
// Authentication function with NodeJs callback style
function customAuthentication(socket, credentials, cb) {
  User.getUserByCredentials(credentials, cb);
}

// Authentication function with direct value returned o Promise style
function customAuthentication(socket, credentials) {
  return User.getUserByCredentials(credentials); // return data or a promise
}

// Direct setting
loopbackSocket.auth(customAuthentication);

// Setting through a Model
function MyModel() {};

loopbackSocket.auth({
  model: MyModel,
  method: 'customAuthentication'
});

MyModel.customAuthentication = authentication;
```

#### loopbackSocket.onConnected(handler)

Add a on connected handler.

##### Arguments
 Name      | Type                          | Description
-----------|-------------------------------|-------------
 `handler` | `handler function` or `object` | Function called with `(socket, credentials, [cb])` arguments or object like `{ model: Model, method: methodName }` where `Model` is a class and `methodName` is one of its methods (defined or to be defined) with like `handler function`.

##### Handler function

If argument `cb` is not defined then the returned value will be a the handler response, and if this value is a promise, then it will be resolved before.

 Name          | Type       | Description
---------------|------------|-------------
 `socket`      | `object`   | Socket connected. Required.
 `credentials` | `object`   | Credentials received. Required.
 `[cb]`        | `function` | Callback with `(err, success)` arguments to async return value with NodeJs callback style. Optional.

##### Example
```js
// Authentication function with NodeJs callback style
function customOnConnectedHandler(socket, credentials, cb) {
  User.getUserByCredentials(credentials, cb);
}

// Authentication function with direct value returned o Promise style
function customOnConnectedHandler(socket, credentials) {
  return User.getUserByCredentials(credentials); // return data or a promise
}

// Direct adding
loopbackSocket.onConnected(customOnConnectedHandler);

// Adding through a Model
function MyModel() {};

loopbackSocket.onConnected({
  model: MyModel,
  method: 'customOnConnectedHandler'
});

MyModel.customOnConnectedHandler = customOnConnectedHandler;
```

#### loopbackSocket.removeOnConnected(handler)

Remove a connected handler

##### Arguments
 Name      | Type                   | Description
-----------|------------------------|-------------
 `handler` | `function` or `object` | Function called with `(socket, credentials, [cb])` arguments or object like `{ model: Model, method: methodName }` where `Model` is a class and `methodName` is one of its methods (defined or to be defined) with like `handler function`.

##### Example
```js
// Direct remove
loopbackSocket.onConnected(customOnConnectedHandler);

// Remove Model method
function MyModel() {};

loopbackSocket.removeOnConnected({
  model: MyModel,
  method: 'customOnConnectedHandler'
});
```

#### loopbackSocket.defineMethod(methodName, method)

Define a method to call by socket connection or replace one existing.

##### Arguments
 Name         | Type                          | Description
--------------|-------------------------------|-------------
 `methodName` | `string`                      | Method name.
 `method`     | `method function` or `object` | Function called with `(socket, credentials, args, [cb])` arguments or object like `{ model: Model, method: methodName }` where `Model` is a class and `methodName` is one of its methods (defined or to be defined) with like `method function`.

##### Method function

If argument `cb` is not defined then the returned value will be the method called reponse, and if this value is a promise, then it will be resolved before.

 Name          | Type       | Description
---------------|------------|-------------
 `socket`      | `object`   | Socket connected. Required.
 `credentials` | `object`   | Credentials received. Required.
 `args`.       | `object`   | Arguments to call method. Required.
 `[cb]`        | `function` | Callback with `(err, success)` arguments to async return value with NodeJs callback style. Optional.

##### Example
```js
/// Method function with NodeJs callback style
function customMethod(socket, credentials, args, cb) {
  let data;

  // Option 1
  cb(null, data); // Client receives { result: data }
  
  // Option 2
  cb('myError');  // Client receives { error: 'myError' }

}

/// Method function with direct value returned o Promise style
function customMethod(socket, credentials, args) {
  let dataOrPromise;

  // Option 1
  return dataOrPromise; // Client receives { result: dataOrPromiseResolvedValue }

  // Option 2
  throw 'myError'; // Client receives { error: 'myError' }

}

// Direct definition
loopbackSocket.defineMethod('customMethod', customMethod);


// Definition through a Model
function MyModel() {};

loopbackSocket.defineMethod('customMethod', {
  model: MyModel,
  method: 'customMethod',
});

MyModel.customMethod = customMethod;

```

#### loopbackSocket.removeMethod(methodName)

Remove a method of socket.

##### Arguments
 Name      | Type        | Description
-----------|-------------|-------------
 `methodName` | `string` | Method name to remove.

##### Example
```js
// Direct remove
loopbackSocket.onConnected('customMethod');
```

### Client side sample

```js
const socket = io('http://localhost');

socket.on('connect', (socket) => {
  // send credentials
  socket.emit('authentication', credentials);
});

socket.on('authenticated', (socket) => {
  // socket authenticated
});

socket.on('unauthorized', (socket) => {
  // socket failed authentication
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

Also, you can report the orthographic errors in the READMEs files or comments. Sorry for that, I do not speak English.

## Tests

`npm test` or `npm run cover`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
