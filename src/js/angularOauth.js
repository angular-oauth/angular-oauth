'use strict';


angular.module('angularOauth', []).

  provider('Token', function() {

    /**
     * Given an flat object, returns a query string for use in URLs.  Note
     * that for a given object, the return value may be.
     *
     * @example
     * <pre>
         // returns 'color=red&size=large'
         objectToQueryString({color: 'red', size: 'large'})
     * </pre>
     *
     * @param {Object} obj A flat object containing keys for such a string.
     * @returns {string} A string suitable as a query string.
     */
    var objectToQueryString = function(obj) {
      var str = [];
      angular.forEach(obj, function(value, key) {
        str.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
      });
      return str.join("&");
    };

    // This response_type MUST be passed to the authorization endpoint using
    // the implicit grant flow (4.2.1 of RFC 6749).
    var RESPONSE_TYPE = 'token';

    // Create a special object for config fields that are required and missing.
    // If any config items still contain it when Token is used, raise an error.
    var REQUIRED_AND_MISSING = {};

    var config = {
      clientId: REQUIRED_AND_MISSING,
      redirectUri: REQUIRED_AND_MISSING,
      authorizationEndpoint: REQUIRED_AND_MISSING,
      localStorageName: 'accessToken',
      verifyFunc: REQUIRED_AND_MISSING,
      scopes: []
    };

    this.extendConfig = function(configExtension) {
      config = angular.extend(config, configExtension);
    };

    this.$get = function($q, $http, $window, $rootScope) {
      var requiredAndMissing = [];
      angular.forEach(config, function(value, key) {
        if (value === REQUIRED_AND_MISSING) {
          requiredAndMissing.push(key);
        }
      });

      if (requiredAndMissing.length) {
        throw new Error("TokenProvider is insufficiently configured.  Please " +
          "configure the following options using " +
          "TokenProvider.extendConfig: " + requiredAndMissing.join(", "))
      }

      if (!config.clientId) {
        throw new Error("clientId needs to be configured using TokenProvider.");
      }

      var getParams = function() {
        // TODO: Facebook uses comma-delimited scopes. This is not compliant with section 3.3 but perhaps support later.

        return {
          response_type: RESPONSE_TYPE,
          client_id: config.clientId,
          redirect_uri: config.redirectUri,
          scope: config.scopes.join(" ")
        }
      };

      return {
        // TODO: get/set might want to support expiration to reauthenticate
        // TODO: check for localStorage support and otherwise perhaps use other methods of storing data (e.g. cookie)

        /**
         * Returns the stored access token.
         *
         * @returns {string} The access token.
         */
        get: function() {
          return localStorage[config.localStorageName];
        },

        /**
         * Persist the access token so that it can be retrieved later by.
         *
         * @param accessToken
         */
        set: function(accessToken) {
          localStorage[config.localStorageName] = accessToken;
        },

        /**
         * Verifies that the access token is was issued for the use of the current client.
         *
         * @param accessToken An access token received from the authorization server.
         * @returns {Promise} Promise that will be resolved when the authorization server has verified that the
         *  token is valid, and we've verified that the token is passed back has audience that matches our client
         *  ID (to prevent the Confused Deputy Problem).
         *
         *  If there's an error verifying the token, the promise is rejected with an object identifying the `name` error
         *  in the name member.  The `name` can be either:
         *
         *    - `invalid_audience`: The audience didn't match our client ID.
         *    - `error_response`: The server responded with an error, typically because the token was invalid.  In this
         *      case, the callback parameters to `error` callback on `$http` are available in the object (`data`,
         *      `status`, `headers`, `config`).
         */
        verifyAsync: function(accessToken) {
          return config.verifyFunc(config, accessToken);
        },

        /**
         * Verifies an access token asynchronously.
         *
         * @param extraParams An access token received from the authorization server.
         * @param popupOptions Settings for the display of the popup.
         * @returns {Promise} Promise that will be resolved when the authorization server has verified that the
         *  token is valid, and we've verified that the token is passed back has audience that matches our client
         *  ID (to prevent the Confused Deputy Problem).
         *
         *  If there's an error verifying the token, the promise is rejected with an object identifying the `name` error
         *  in the name member.  The `name` can be either:
         *
         *    - `invalid_audience`: The audience didn't match our client ID.
         *    - `error_response`: The server responded with an error, typically because the token was invalid.  In this
         *      case, the callback parameters to `error` callback on `$http` are available in the object (`data`,
         *      `status`, `headers`, `config`).
         */
        getTokenByPopup: function(extraParams, popupOptions) {
          popupOptions = angular.extend({
            name: 'AuthPopup',
            openParams: {
              width: 650,
              height: 300,
              resizable: true,
              scrollbars: true,
              status: true
            }
          }, popupOptions);

          var deferred = $q.defer(),
            params = angular.extend(getParams(), extraParams),
            url = config.authorizationEndpoint + '?' + objectToQueryString(params),
            resolved = false;

          var formatPopupOptions = function(options) {
            var pairs = [];
            angular.forEach(options, function(value, key) {
              if (value || value === 0) {
                value = value === true ? 'yes' : value;
                pairs.push(key + '=' + value);
              }
            });
            return pairs.join(',');
          };

          var popup = window.open(url, popupOptions.name, formatPopupOptions(popupOptions.openParams));

          // TODO: binding occurs for each reauthentication, leading to leaks for long-running apps.

          angular.element($window).bind('message', function(event) {
            if (event.source == popup && event.origin == window.location.origin) {
              $rootScope.$apply(function() {
                if (event.data.access_token) {
                  deferred.resolve(event.data)
                } else {
                  deferred.reject(event.data)
                }
              })
            }
          });

          // TODO: reject deferred if the popup was closed without a message being delivered + maybe offer a timeout

          return deferred.promise;
        }
      }
    }
  }).

  /**
   * A controller for the redirect endpoint that inspects the URL redirected to by the authorization server and sends
   * it back to other windows using.
   */
  controller('CallbackCtrl', function($scope, $location) {

    /**
     * Parses an escaped url query string into key-value pairs.
     *
     * (Copied from Angular.js in the AngularJS project.)
     *
     * @returns Object.<(string|boolean)>
     */
    function parseKeyValue(/**string*/keyValue) {
      var obj = {}, key_value, key;
      angular.forEach((keyValue || "").split('&'), function(keyValue){
        if (keyValue) {
          key_value = keyValue.split('=');
          key = decodeURIComponent(key_value[0]);
          obj[key] = angular.isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
        }
      });
      return obj;
    }

    var queryString = $location.path().substring(1);  // preceding slash omitted
    var params = parseKeyValue(queryString);

    // TODO: The target origin should be set to an explicit origin.  Otherwise, a malicious site that can receive
    //       the token if it manages to change the location of the parent. (See:
    //       https://developer.mozilla.org/en/docs/DOM/window.postMessage#Security_concerns)

    window.opener.postMessage(params, "*");
    window.close();
  });
