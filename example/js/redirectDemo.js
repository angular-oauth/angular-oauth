(function angularFor(window, document, undefined) {
  'use strict';

  angular.module('demoPopup', ['googleOauth'])

  .config(function (TokenProvider) {
    // Demo configuration for the "angular-oauth demo" project on Google.
    // Log in at will!

    // Sorry about this way of getting a relative URL, powers that be.
    var baseUrl = document.URL.replace('example/demo.html', '');

    TokenProvider.extendConfig({
      clientId: '191261111313.apps.googleusercontent.com',
      redirectUri: baseUrl + 'src/oauth2callback.html', // allow lunching demo from a mirror
      scopes: ["https://www.googleapis.com/auth/userinfo.email"]
    });
  })

  .controller('PopupCtrl', function ($rootScope, $scope, $window, Token) {
    $scope.accessToken = Token.get();

    $scope.authenticate = function () {
      var extraParams = $scope.askApproval ? {
        approval_prompt: 'force'
      } : {};

      Token.getTokenByPopup(extraParams)
        .then(successHandler, errorHandler);
    };

    function successHandler(params) {
      // Verify the token before setting it, to avoid the confused deputy problem.
      Token.verifyAsync(params.access_token).
      then(function () {
        $rootScope.$apply(function () {
          $scope.accessToken = params.access_token;
          $scope.expiresIn = params.expires_in;

          Token.set(params.access_token);
        });
      }, function () {
        alert("Failed to verify token.");
      });
    }

    function errorHandler() {
      alert("Failed to get token from popup.");
    }
  });

})(window, document);