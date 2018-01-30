'use strict';

angular.module('app', [
  'ngResource'
])

.config(['$httpProvider', ($httpProvider) => {
  $httpProvider.interceptors.push('MyInterceptor');
}])

.factory('MyInterceptor', ($q, $rootScope) => { 'ngInject';
  return {
    'request': (config) => {
      console.log('MyUser.$token', $rootScope.$token)
      if (!$rootScope.$token) return config;

      if ($rootScope.$token.id) {
        config.headers.authorization = $rootScope.$token.id;
      } else if (config.__isGetCurrentUser__) {
        // Return a stub 401 error for User.getCurrent() when
        // there is no user logged in
        const res = {
          body: { error: { status: 401 }},
          status: 401,
          config: config,
          headers: () => undefined,
        };
        return $q.reject(res);
      }
      return config || $q.when(config);
    },
  };
})

.service('MyUser', function ($rootScope, $resource) {
  const MyUser = $resource('/api/MyUsers/:id', { 'id': '@id' }, {
    login: {
      method: 'post',
      url: '/api/MyUsers/login'
    }
  });
  const loginMethod = MyUser.login;
  MyUser.login = function () {
    const response = loginMethod.apply(MyUser, arguments)

    response.$promise
    .then((result) => {
      $rootScope.$token = result;
    });

    return response;
  };

  MyUser.getCurrentToken = function () {
    return $rootScope.$token;
  };
  return MyUser;
})

.service('Utils', function () {
  return {
    handler: ($scope, cb) => {
      return function (aaa) {
        const args = arguments;
        $scope.$apply(() => {
          cb.apply(null, args);
        });
      };
    }
  };
})

.service('CustomSocket', function (Utils) {
  return ($scope, url, token) => {
    const socket = io.connect(url);
    socket.authed = null;

    socket.on('connect', Utils.handler($scope, () => {
      socket.emit('authentication', {
        id: token.id,
        userId: token.userId,
      });
    }));

    socket.on('authenticated', Utils.handler($scope, () => {
      socket.authed = true;
    }));

    socket.on('unauthorized', Utils.handler($scope, () => {
      socket.authed = false;
    }));

    socket.on('disconnected', Utils.handler($scope, () => {
      socket.authed = null;
    }));

    return socket;

  }
})

.controller('MainController', function ($scope, MyUser, CustomSocket, Utils) {
  
  $scope.credentials = {
    email: 'arondn2@gmail.com',
    password: '123456',
  };

  $scope.doLogin = function () {
    if ($scope.promiseLogin) return;
    $scope.promiseLogin = MyUser.login($scope.credentials).$promise
    .then(() => {
      $scope.socketConnect();
    })
    .finally(() => {
      delete $scope.promiseLogin;
    });
  };

  let socket;
  $scope.socketConnect = function () {
    $scope.socket = socket = CustomSocket($scope, 'http://localhost:3000', MyUser.getCurrentToken());
    socket.authed = null;
  };

  $scope.getProfile = () => {
    socket.emit('getProfile', $scope.getProfile.args, Utils.handler($scope, (response) => {
      $scope.getProfile.response = response;
    }));
  };
  $scope.getProfile.args = {};

  $scope.getRecords = () => {
    socket.emit('getRecords', $scope.getRecords.args, Utils.handler($scope, (response) => {
      $scope.getRecords.response = response;
    }));
  };
  $scope.getRecords.args = {};

  $scope.doLogin();

});