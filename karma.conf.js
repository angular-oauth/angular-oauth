module.exports = function (config) {
	'use strict';
	
	config.set({
		basePath: '.',
		files: [
			'node_modules/mocha/mocha.js',
			'node_modules/chai/chai.js',
			'node_modules/sinon/pkg/sinon.js',
			'node_modules/sinon-chai/lib/sinon-chai.js',

			'bower_components/angular/angular.js',
			'bower_components/angular-mocks/angular-mocks.js',

			'src/js/angularOauth.js',
            'src/js/angularOauth.spec.js'
        ],
		reporters: ['brackets'],
		frameworks: ['mocha'],
		port: 9876,
		runnerPort: 9100,
		colors: true,
		autoWatch: true,
		browsers: ['PhantomJS'],
		captureTimeout: 60000,
		singleRun: false
	});
};