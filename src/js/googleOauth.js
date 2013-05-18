'use strict';

/**
 * A module to include instead of `angularOauth` for a service preconfigured
 * for Google OAuth authentication.
 *
 * Guide: https://developers.google.com/accounts/docs/OAuth2UserAgent
 */
angular.module('googleOauth', ['angularOauth']).

  constant('GoogleTokenVerifier', function(config, accessToken, deferred) {
    var $injector = angular.injector(['ng']);
    return $injector.invoke(['$http', '$rootScope', function($http, $rootScope) {
      var verificationEndpoint = 'https://www.googleapis.com/oauth2/v1/tokeninfo';

      $rootScope.$apply(function() {
        $http({method: 'GET', url: verificationEndpoint, params: {access_token: accessToken}}).
          success(function(data) {
            if (data.audience == config.clientId) {
              deferred.resolve(data);
            } else {
              deferred.reject({name: 'invalid_audience'});
            }
          }).
          error(function(data, status, headers, config) {
            deferred.reject({
              name: 'error_response',
              data: data,
              status: status,
              headers: headers,
              config: config
            });
          });
      });

      return deferred;
    }]);
  }).

  config(function(TokenProvider, GoogleTokenVerifier) {
    TokenProvider.extendConfig({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      scopes: ["https://www.googleapis.com/auth/userinfo.email"],
      verifyFunc: GoogleTokenVerifier
    });
  });

