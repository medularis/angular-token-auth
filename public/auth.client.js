var myApp = angular.module('authApp', ['angular-jwt']);

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

/*
 CONTROLLERS
 */

myApp.controller('UserCtrl', function ($scope, $http, $window, jwtHelper) {
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

        // other functions in 'jwtHelper' are: 'urlBase64Decode' and 'isTokenExpired
        var tokenExpDate = jwtHelper.getTokenExpirationDate(data.token);
        console.log('token expiration date: ' + tokenExpDate);
        var tokenPayload = jwtHelper.decodeToken(data.token);

        $scope.error = '';
        $scope.welcome = 'Welcome ' + tokenPayload.first_name + ' ' + tokenPayload.last_name;
        // clear username and password
        $scope.username = '';
        $scope.password = '';
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
      /*
      if (canRecover(rejection)) {
        return responseOrNewPromise;
      }
       */
      console.log('authBearerInterceptor. status: ' + rejection.status);
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
