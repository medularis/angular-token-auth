var myApp = angular.module('authApp', []);

/*
 UTILS
 */

var myUtils = myUtils || {};

myUtils.splitJwt = function (token) {
  // JWT's format is this: 'encodedHeader.encodedPayload.signature' e.g.
  // 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ4IjoieSIsImlhdCI6MTQxMzkzMzY3OSwiZXhwIjoxNDEzOTUxNjc5fQ.ATiZ5Sw0qLxoMyhgohpHxjInIoXyKGLNXcUIYvnlyyg'
  var tokenSplit = token.split('.');
  return {
    encodedHeader: tokenSplit[0],
    encodedPayload: tokenSplit[1],
    signature: tokenSplit[2]
  };
};

myUtils.decodeBase64url = function (str) {
  // Unfortunately there are variants of Base64 and we need to handle them
  // http://en.wikipedia.org/wiki/Base64#Implementations_and_history
  var output = str.replace('-', '+').replace('_', '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw 'Illegal base64url string!';
  }
  return window.atob(output); //polifyll https://github.com/davidchambers/Base64.js
};

/*
 CONTROLLERS
 */

myApp.controller('UserCtrl', function ($scope, $http, $window) {
  $scope.username = '';
  $scope.password = '';
  $scope.isAuthenticated = false;
  $scope.error = '';
  $scope.welcome = '';
  $scope.message = '';

  $scope.authenticate = function () {
    $http
      .post('/authenticate', {username: $scope.username, password: $scope.password})
      .success(function (data, status, headers, config) {
        console.log('token: ' + data.token);
        $window.sessionStorage.token = data.token;
        $scope.isAuthenticated = true;
        var encodedProfile = myUtils.splitJwt(data.token).encodedPayload;
        var profile = JSON.parse(myUtils.decodeBase64url(encodedProfile));
        $scope.error = '';
        $scope.welcome = 'Welcome ' + profile.first_name + ' ' + profile.last_name;
      })
      .error(function (data, status, headers, config) {
        // Erase the token if the user fails to log in
        delete $window.sessionStorage.token;
        $scope.isAuthenticated = false;

        // Handle login errors here
        $scope.error = 'Error: Invalid user or password';
        $scope.welcome = '';
      });
  };

  $scope.logout = function () {
    $scope.welcome = '';
    $scope.message = '';
    $scope.isAuthenticated = false;
    delete $window.sessionStorage.token;
  };

  $scope.callRestricted = function () {
    $http({url: '/api/restricted', method: 'GET'})
    .success(function (data, status, headers, config) {
      $scope.message = $scope.message + ' ' + data.name; // Should log 'foo'
    })
    .error(function (data, status, headers, config) {
      alert(data);
    });
  };

});

/*
 INTERCEPTORS
 */

myApp.factory('authBearerInterceptor', function ($rootScope, $q, $window) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
        config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    responseError: function (rejection) {
      if (rejection.status === 401) {
        // handle the case where the user is not authenticated
      }
      return $q.reject(rejection);
    }
  };
});

myApp.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authBearerInterceptor');
});
