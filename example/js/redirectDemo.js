(function angularFor(window, document, undefined) {
	'use strict';

	angular.module('demoRedirect', ['ngRoute', 'googleOauth'])
	
	.config(function (TokenProvider) {
		TokenProvider.extendConfig({
			clientId: '341957022064-ca5hebgbh6ks5pjs48jlbf2cpeq55r1d.apps.googleusercontent.com',
			redirectUri: 'http://localhost:9000/example/demo-redirect.html',
			scopes: ["https://www.googleapis.com/auth/userinfo.email"]
		});
	})
	
	.controller('RedirectCtrl', function ($rootScope, $scope, $location, Token) {
		$scope.accessToken = Token.get();
		
		$scope.authenticate = function () {
			var extraParams = $scope.askApproval ? {
				approval_prompt: 'force'
			} : {};

			Token.getTokenInSameWindow(extraParams);
		};
		
		// Don't do it this way in production.
		// TODO: Make a more production ready example
		if($location.path().substring(1)) {
			var params = parseKeyValue($location.path().substring(1));
			verifyToken(params);
		}
		
		function parseKeyValue(keyValue) {
			var obj = {};
			var key_value, key;
			
			angular.forEach((keyValue || "").split('&'), function (keyValue) {
				if (keyValue) {
					key_value = keyValue.split('=');
					key = decodeURIComponent(key_value[0]);
					obj[key] = angular.isDefined(key_value[1]) ? decodeURIComponent(key_value[1]) : true;
				}
			});
			return obj;
		}

		function verifyToken(params) {
			// Verify the token before setting it, to avoid the confused deputy problem.
			Token.verifyAsync(params.access_token).
			then(function (data) {
				$scope.$apply(function () {
					$scope.accessToken = params.access_token;
					$scope.expiresIn = params.expires_in;

					Token.set(params.access_token);
				});
			}, function () {
				alert("Failed to verify token.")
			});
		}
	});

})(window, document);