(function(){

'use strict';

/**
 * A module to include instead of `angularOauth` for a service preconfigured
 * for Google OAuth authentication.
 *
 * Guide: https://developers.google.com/accounts/docs/OAuth2UserAgent
 */
angular.module('oauth.google', ['angularOauth'])

  .factory('GoogleTokenProvider', [ 'Token', 'GoogleTokenVerifier', function(Token, GoogleTokenVerifier){

    // Configure the Google Token Provider with API Keys and scopes
    return function(clientId, oAuthScopes, redirectUri){
      Token.extendConfig({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
        verifyFunc: GoogleTokenVerifier,
        clientId: clientId,
        redirectUri: redirectUri,
        scopes: oAuthScopes
      });
      return Token;
    }
  }])

  .constant('GoogleTokenVerifier', function(config, accessToken) {
    var $injector = angular.injector(['ng']);
    return $injector.invoke(['$http', '$rootScope', '$q', function($http, $rootScope, $q) {
      var deferred = $q.defer();
      var verificationEndpoint = 'https://www.googleapis.com/oauth2/v1/tokeninfo';

      $rootScope.$apply(function() {
        debug.debug("access token", accessToken);
        $http({method: 'GET', url: verificationEndpoint, params: {access_token: accessToken}}).
          success(function(data) {
            debug.debug("data", data);
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

      return deferred.promise;
    }]);
  });
}());
