var vows = require('vows'), 
assert = require('assert');

var mockLog4js = {
    levels: {
	TRACE: 0,
	DEBUG: 1,
	INFO: 2,
	WARN: 3,
	ERROR: 4,
	FATAL: 5
    }
}

function MockLogger() {

    var that = this;
    this.messages = [];

    this.log = function(level, message, exception) {
	that.messages.push({ level: level, message: message });
    };

    this.isLevelEnabled = function(level) {
	return (level >= that.level);
    };

    this.level = mockLog4js.levels.TRACE;

}

function MockRequest(remoteAddr, method, originalUrl) {

    this.socket = { remoteAddress: remoteAddr };
    this.originalUrl = originalUrl;
    this.method = method;
    this.httpVersionMajor = '5';
    this.httpVersionMinor = '0';
    this.headers = {}

}

function MockResponse(statusCode) {

    this.statusCode = statusCode;

    this.end = function(chunk, encoding) {

    }

}

vows.describe('log4js connect logger').addBatch({
    'getConnectLoggerModule': {
	topic: function() {
	    var clm = require('../lib/connect-logger')(mockLog4js);
	    return clm;
	},

	'should return a "connect logger" factory' : function(clm) {
	    assert.isObject(clm);
	},

	'take a log4js logger and return a "connect logger"' : {
	    topic: function(clm) {
		var ml = new MockLogger();
		var cl = clm.connectLogger(ml);
		return cl;
	    },

	    'should return a "connect logger"': function(cl) {
		assert.isFunction(cl);
	    }
	},

	'log events' : {
	    topic: function(clm) {
		var ml = new MockLogger();
		var cl = clm.connectLogger(ml);
		var req = new MockRequest('my.remote.addr', 'GET', 'http://url');
		var res = new MockResponse(200);
		cl(req, res, function() { });
		res.end('chunk', 'encoding');
		return ml.messages;
	    },

	    'check message': function(messages) {
		assert.isArray(messages);
		assert.length(messages, 1);
		assert.equal(messages[0].level, mockLog4js.levels.TRACE);
		assert.include(messages[0].message, 'GET');
		assert.include(messages[0].message, 'http://url');
		assert.include(messages[0].message, 'my.remote.addr');
		assert.include(messages[0].message, '200');
	    }
	},

	'log events with level below logging level' : {
	    topic: function(clm) {
		var ml = new MockLogger();
		ml.level = mockLog4js.levels.FATAL;
		var cl = clm.connectLogger(ml);
		var req = new MockRequest('my.remote.addr', 'GET', 'http://url');
		var res = new MockResponse(200);
		cl(req, res, function() { });
		res.end('chunk', 'encoding');
		return ml.messages;
	    },

	    'check message': function(messages) {
		assert.isArray(messages);
		assert.isEmpty(messages);
	    }
	},

	'log events with non-default level and custom format' : {
	    topic: function(clm) {
		var ml = new MockLogger();
		ml.level = mockLog4js.levels.INFO;
		var cl = clm.connectLogger(ml, { level: mockLog4js.levels.INFO, format: ':method :url' } );
		var req = new MockRequest('my.remote.addr', 'GET', 'http://url');
		var res = new MockResponse(200);
		cl(req, res, function() { });
		res.end('chunk', 'encoding');
		return ml.messages;
	    },

	    'check message': function(messages) {
		assert.isArray(messages);
		assert.length(messages, 1);
		assert.equal(messages[0].level, mockLog4js.levels.INFO);
		assert.equal(messages[0].message, 'GET http://url');
	    }
	}

    }

}).export(module);
