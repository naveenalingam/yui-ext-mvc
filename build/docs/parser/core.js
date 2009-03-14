/*
 * Copyright (c) 2009, Matt Snider, LLC All rights reserved.
 * Version: 1.0.01
 */

/**
 * The Core object manages the MVC architecture of the pages and namespacing.
 * @module mvc
 */

/**
 * This file setups the Core MVC namespace.
 * @class Core
 * @static
 */
(function() {
    // the log severity level constants, used to determine if a debug statmenet should be logged or not
    var _LOG_LEVEL = {
		ALL: 1, // developer environments
		DEBUG: 2,
		INFO: 3, // production environments should be set to 3 or higher
		WARN: 4,
		SEVERE: 5
    };

    // private namespace
	var _logLevel = _LOG_LEVEL.INFO,
        _WL = window.location;

    // static namespace
    window.Core = {

		/**
		 * The current project version #.
		 * @property Version
		 * @type String
		 * @static
		 * @final
		 */
		VERSION: '1.0',

        /**
         * The controller namespace.
         * @property Controller
         * @type Object
		 * @static
         */
        Controller: {},

        /**
         * Object namespace placeholder for attaching global constants; inner Function to create Client Singleton.
         * @property Constants
         * @type Object
		 * @static
         */
        Constants: {},

        /**
         * The model object namespace.
         * @property Model
         * @type Object
         */
        Model: {},

        /**
         * The utility namespaces.
         * @property Util
         * @type Object
		 * @static
         */
        Util: {},

        /**
         * The view object namespace.
         * @property View
         * @type Object
		 * @static
         */
        View: {},

		/**
		 * Returns the log level of the application.
		 * @method getLogLevel
		 * @return {Number} The current log level.
		 * @static
		 */
		getLogLevel: function() {return _logLevel;},

        /**
		 * Retrieves the hash from the location object; ensures is a string.
		 * @method getHash
		 * @return {String} The page hash.
		 * @static
		 */
        getHash: function() {
            return ('' + _WL.hash);
        },

        /**
		 * Retrieves the host from the location object; ensures is a string.
		 * @method getHost
		 * @return {String} The page host.
		 * @static
		 */
        getHost: function() {
            return ('' + _WL.host);
        },

        /**
		 * Retrieves the page name from the URL.
		 * @method getPageName
		 * @return {String} The page name.
		 * @static
		 */
		getPageName: function() {
			return Core.getUrl().replace(/.*\/(.*)(\.|\?|\/).*/, '$1');
		},

        /**
		 * Retrieves the port from the location object; ensures is a string.
		 * @method getPort
		 * @return {String} The page port.
		 * @static
		 */
        getPort: function() {
            return ('' + _WL.port);
        },

        /**
		 * Retrieves the protocol from the location object; ensures is a string.
		 * @method getProtocol
		 * @return {String} The page protocol.
		 * @static
		 */
        getProtocol: function() {
            return ('' + _WL.protocol);
        },

        /**
		 * Retrieves the search from the location object; ensures is a string.
		 * @method getSearch
		 * @return {String} The page query string.
		 * @static
		 */
        getSearch: function() {
            return ('' + _WL.search);
        },

		/**
		 * Retrieves the value of XSRF token from the DOM, or throws an exception when not found.
		 * @method getToken
		 * @return {String} The XSRF token.
		 * @static
		 */
		getToken: function() {
			var token = YAHOO.util.Form.Element.getValue('javascript-token');

			if (! token) {
				throw ('Token Node requested before DOM INPUT node "javascript-token" was made available.');
			}

			Core.getToken = function() {
				return token;
			};

			return Core.getToken();
		},

        /**
		 * Retrieves the URL from the location object; ensures is a string.
		 * @method getUrl
		 * @return {String} The page URL.
		 * @static
		 */
        getUrl: function() {
            return ('' + _WL.href);
        },

		/**
		 * Sets the log level of the application.
		 * @method setLogLevel
		 * @param lvl {Number} Required. The new log level.
		 * @static
		 */
		setLogLevel: function(lvl) {_logLevel = lvl;},

        /**
         * Refreshes the page by calling window.location.reload.
         * @method reload
         * @static
         */
        reload: function() {
            _WL.reload();
        },

        /**
         * Replaces the page by calling window.location.replace(DOMString URL); does not call create a browser history node.
         * @method replace
         * @param url {String} Optional. The URL.
         * @static
         */
        replace: function(url) {
            if (! url) {url = window.location.href;}
            _WL.replace('' + url);
        }
    };
})();