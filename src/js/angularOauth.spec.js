'use strict';

var expect = chai.expect;

angular.module('testModule', ['angularOauth'])
	.config(['TokenProvider',
		function (TokenProvider) {
			TokenProvider.extendConfig({
				authorizationEndpoint: 'http://localhost',
				clientId: 'testClientId',
				redirectUri: 'testRedirect',
				scopes: ['testScope'],
				verifyFunc: function (config, accessToken) {
					return {
						accessToken: accessToken,
						clientId: config.clientId,
						msg: 'test successful'
					};
				}
			});
}]);

describe('Token Provider', function () {
	var tokenProvider;
	var $windowService;

	beforeEach(function () {

		module('testModule');

		inject(function (Token) {
			tokenProvider = Token;
		});

		inject(function ($window) {
			$windowService = $window;
			sinon.spy($windowService, "open");
		});

	});

	afterEach(function () {
		$windowService.open.restore();
	});

	it('should be defined', function () {
		expect(tokenProvider).to.not.be.undefined;
	});

	describe('Token.get()', function () {

		afterEach(function () {
			localStorage.removeItem('accessToken');
		});

		it('should not be undefined', function () {
			expect(tokenProvider.get).to.not.be.undefined;
		});

		it('should retrieve the accessToken from localStorage', function () {
			var token;

			localStorage['accessToken'] = 'testTokenForGetTest';
			token = tokenProvider.get();
			expect(token).to.equal('testTokenForGetTest');
		});

	});

	describe('Token.set()', function () {

		afterEach(function () {
			localStorage.removeItem('accessToken');
		});

		it('should not be undefined', function () {
			expect(tokenProvider.set).to.not.be.undefined;
		});

		it('should set the accessToken into localStorage', function () {
			var token;
			token = tokenProvider.get();
			expect(token).to.equal(undefined);
			tokenProvider.set('testTokenForSetTest');
			token = tokenProvider.get();
			expect(token).to.equal('testTokenForSetTest');
		});

	});

	describe('Token.clear()', function () {

		afterEach(function () {
			localStorage.removeItem('accessToken');
		});

		it('should not be undefined', function () {
			expect(tokenProvider.set).to.not.be.undefined;
		});

		it('should clear the accessToken from localStorage', function () {
			var token;
			token = tokenProvider.get();
			expect(token).to.equal(undefined);

			tokenProvider.set('testTokenForClearTest');
			token = tokenProvider.get();
			expect(token).to.equal('testTokenForClearTest');

			tokenProvider.clear();
			token = tokenProvider.get();
			expect(token).to.equal(undefined);
		});

	});

	describe('verifyAsync()', function () {

		it('should call the function defined in config.verifyFunc', function () {
			var test = tokenProvider.verifyAsync();
			expect(test.msg).to.equal('test successful');
		});

		it('should pass the config object as the first parameter', function () {
			var test = tokenProvider.verifyAsync();
			expect(test.clientId).to.equal('testClientId');
		});

		it('should accept and pass the token as the second parameter', function () {
			var test = tokenProvider.verifyAsync('testToken');
			expect(test.accessToken).to.equal('testToken');
		});

	});

	describe('getTokenByPopup()', function () {

		it('should return a promise', function () {
			var test = tokenProvider.getTokenByPopup();
			expect(test.then).to.not.be.undefined;
		});

		it('should open a new Angular $window to the authorizationEndpoint with response_type=token, client_id, redirect_uri and scope from options', function () {
			var test = tokenProvider.getTokenByPopup();
			var expectedUri = 'http://localhost?response_type=token&client_id=testClientId&redirect_uri=testRedirect&scope=testScope';
			var actualUri = $windowService.open.args[0][0];
			expect($windowService.open).to.have.been.calledOnce;
			expect(actualUri).to.equal(expectedUri);
		});

		it('should accept extraParams object and covert those to query arguments', function () {
			var extraParams = {
				theParam: 'theTestParam'
			};
			var test = tokenProvider.getTokenByPopup(extraParams);
			var expectedUri = 'http://localhost?response_type=token&client_id=testClientId&redirect_uri=testRedirect&scope=testScope&theParam=theTestParam';
			var actualUri = $windowService.open.args[0][0];
			expect(actualUri).to.equal(expectedUri);
		});

		it('should accept popupOptions object as second argument then format & pass those to the $window.open method', function () {
			var popupOptions = {
				name: 'testPopup',
				openParams: {
					width: 100,
					height: 100,
					resizable: true,
					scrollbars: true,
					status: false
				}
			};
			var test = tokenProvider.getTokenByPopup(null, popupOptions);
			var actualName = $windowService.open.args[0][1];
			var actualWindowArgs = $windowService.open.args[0][2];
			var expectedWindowArgs = 'width=100,height=100,resizable=yes,scrollbars=yes'; // True becomes yes, false is igored

			expect(actualWindowArgs).to.equal(expectedWindowArgs);
		});

		// TODO: Test message event

	});

	describe('getTokenInSameWindow()', function () {

		// TODO: test redirection

	});

});