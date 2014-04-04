(function(){

'use strict';

/**
 * A module to include instead of `angularOauth` for a service preconfigured
 * for Google OAuth authentication.
 *
 * Guide: http://msdn.microsoft.com/en-us/library/live/hh243647.aspx
 */
angular.module('oauth.windowsid', ['angularOauth'])

  .factory('WindowsidTokenProvider', [ 'Token', 'WindowsidTokenVerifier', function(Token, WindowsidTokenVerifier){

    // Configure the WindowsId Token Provider with API Keys and scopes
    return function(clientId, oAuthScopes, redirectUri){
      Token.extendConfig({
        authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
        verifyFunc: WindowsidTokenVerifier,
        clientId: clientId,
        redirectUri: redirectUri,
        scopes: oAuthScopes
      });
      return Token;
    };
  }])

  .constant('WindowsidTokenVerifier', function(config, accessToken) {
    var $injector = angular.injector(['ng']);
    return $injector.invoke(['$http', '$rootScope', '$q', function($http, $rootScope, $q) {
      var deferred = $q.defer();
      var verificationEndpoint = 'https://login.live.com/oauth20_token.srf';

      $rootScope.$apply(function() {
        //@TODO WindowsLive token validation ?????
        /**
        $http({method: 'GET', url: verificationEndpoint, params: {access_token: accessToken}})
          .success(function(data) {
            debug.debug("Access token ID", accessToken);
            debug.debug("Debugging windows ID", data);
            if (data.audience == config.clientId) {
            } else {
              deferred.reject({name: 'invalid_audience'});
            }
        })
        .error(function(data, status, headers, config) {
          deferred.reject({
            name: 'error_response',
            data: data,
            status: status,
            headers: headers,
            config: config
          });
        });
        **/
          deferred.resolve(accessToken);
      });

      return deferred.promise;
    }]);
  });
}());
