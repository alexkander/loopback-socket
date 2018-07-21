'use strict';

angular.module('app', [
  'ngResource'
])

.service('MyUser', function ($resource) {
  const MyUser = $resource('/api/MyUsers/:id', { 'id': '@id' }, {
    login: {
      method: 'post',
      url: '/api/MyUsers/login'
    }
  });
  return MyUser;
})

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

.controller('MainController', function ($scope, MyUser, CustomSocket, Handler) {
  
  let socket, token;

  $scope.credentials = {
    email: 'arondn2@gmail.com',
    password: '123456',
  };

  $scope.doLogin = function () {
    if ($scope.promiseLogin) return;
    token = null;
    if (socket) {
      socket.emit('disconnect');
      $scope.socket = socket = null;
    }
    $scope.promiseLogin = MyUser.login($scope.credentials).$promise
    .then((response) => {
      token = response;
      $scope.socket = socket = CustomSocket($scope, 'http://localhost:3000', token);
      socket.authed = null;
    })
    .finally(() => {
      delete $scope.promiseLogin;
    });
  };

  $scope.exec = function (method, args) {
    if (!socket) {
      method.response = 'disconnected';
    } else if(!socket.authed){
      method.response = 'unauthorized';
    } else {
      method(args);
    }
  };

  $scope.responses = {};
  $scope.args      = {};

  $scope.getProfile = (args) => {
    $scope.responses.getProfile = null;
    socket.emit('getProfile', args, Handler($scope, (response) => {
      $scope.responses.getProfile = response;
    }));
  };
  $scope.args.getProfile = {};

  $scope.getRecords = (args) => {
    $scope.responses.getRecords = null;
    socket.emit('getRecords', args, Handler($scope, (response) => {
      $scope.responses.getRecords = response;
    }));
  };
  $scope.args.getRecords = {};

  $scope.doLogin();

})

.filter('socketState', function () {
  return (socket) => {
    if(!socket) return 'disconnected';
    if(socket.authed===true) return 'authenticated';
    if(socket.authed===false) return 'unauthorized';
    return 'connecting';
  };
});