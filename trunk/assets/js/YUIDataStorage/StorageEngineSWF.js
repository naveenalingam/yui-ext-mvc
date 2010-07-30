/*
 * SWF limitation:
 * 	- only 100,000 bytes of data may be stored this way
 *  - data is publicly available on user machine
 *
 * Thoughts:
 *  - data can be shared across browsers
 *  - how can we not use cookies to handle session location
 */
(function() {
	// internal shorthand
	var Y = YAHOO,
			Util = Y.util,
			Lang = Y.lang,
			Dom = Util.Dom,

		/*
		 * The minimum width required to be able to display the settings panel within the SWF.
		 */
			MINIMUM_WIDTH = 215,

		/*
		 * The minimum height required to be able to display the settings panel within the SWF.
		 */
			MINIMUM_HEIGHT = 138,

		// local variables
			_driver = null,

		/*
		 * Creates a location bound key.
		 */
			_getKey = function(that, sKey) {
				return that._location + that.DELIMITER + sKey;
			},

		/*
		 * Initializes the engine, if it isn't already initialized.
		 */
			_initDriver = function(oCfg) {
				if (! _driver) {
					if (! Lang.isString(oCfg.swfURL)) {oCfg.swfURL = _F.SWFURL;}
					if (! oCfg.containerID) {
						var bd = document.getElementsByTagName('body')[0],
								container = bd.appendChild(document.createElement('div'));
						oCfg.containerID = Dom.generateId(container);
					}

					if (! oCfg.attributes) {oCfg.attributes = {};}
					if (! oCfg.attributes.flashVars) {oCfg.attributes.flashVars = {};}
					oCfg.attributes.flashVars.useCompression = 'true';
					oCfg.attributes.version = 9.115;
					_driver = new Y.widget.SWF(oCfg.containerID, oCfg.swfURL, oCfg.attributes);

					// subscribe to save for info
					_driver.subscribe('save', function(o) {
						Y.log(o.message, 'info');
					});

					// subscribe to errors
					_driver.subscribe('quotaExceededError', function(o) {
						Y.log(o.message, 'error');
					});
					_driver.subscribe('inadequateDimensions', function(o) {
						Y.log(o.message, 'error');
					});
					_driver.subscribe('error', function(o) {
						Y.log(o.message, 'error');
					});
					_driver.subscribe('securityError', function(o) {
						Y.log(o.message, 'error');
					});
				}
			},

		/**
		 * The StorageEngineSWF class implements the SWF storage engine.
		 * @namespace YAHOO.util
		 * @class StorageEngineSWF
		 * @uses YAHOO.widget.SWF
		 * @constructor
		 * @extend YAHOO.util.Storage
		 * @param sLocation {String} Required. The storage location.
		 * @param oConf {Object} Required. A configuration object.
		 */
			StorageEngineSWF = function(sLocation, oConf) {
				var that = this;
				StorageEngineSWF.superclass.constructor.call(that, sLocation, StorageEngineSWF.ENGINE_NAME, oConf);

				_initDriver(that._cfg);

				var _onContentReady = function() {
					that._swf = _driver._swf;
					_driver.initialized = true;

					var isSessionStorage = Util.StorageManager.LOCATION_SESSION === that._location,
							sessionKey = Util.Cookie.get('sessionKey' + StorageEngineSWF.ENGINE_NAME),
							i, key, isKeySessionStorage;

					for (i = _driver.callSWF("getLength", []) - 1; 0 <= i; i -= 1) {
						key = _driver.callSWF("getNameAt", [i]);
						isKeySessionStorage = -1 < key.indexOf(Util.StorageManager.LOCATION_SESSION + that.DELIMITER);

						// this is session storage, but the session key is not set, so remove item
						if (isSessionStorage && ! sessionKey) {
							_driver.callSWF("removeItem", [key]);
						} else {
							if (isSessionStorage === isKeySessionStorage) {
								// the key matches the storage type, add to key collection
								that._addKey(key);
							}
						}
					}

					// this is session storage, ensure that the session key is set
					if (isSessionStorage) {
						Util.Cookie.set('sessionKey' + StorageEngineSWF.ENGINE_NAME, true);
					}

					that.fireEvent(Util.Storage.CE_READY);
				};

				// evaluate immediately, SWF is already loaded
				if (_driver.initialized) {
					_onContentReady();
				} else {
					// evaluates when the SWF is loaded
					_driver.addListener("contentReady", _onContentReady);
				}
			};

	Lang.extend(StorageEngineSWF, Util.StorageEngineKeyed, {
		/**
		 * The underlying SWF of the engine, exposed so developers can modify the adapter behavior.
		 * @property _swf
		 * @type {Object}
		 * @protected
		 */
		_swf: null,

		/*
		 * Implementation to clear the values from the storage engine.
		 * @see YAHOO.util.Storage._clear
		 */
		_clear: function() {
			for (var i = this._keys.length - 1, sKey; 0 <= i; i -= 1) {
				sKey = this._keys[i];
				_driver.callSWF("removeItem", [sKey]);
			}
			// since keys are used to clear, we call the super function second
			StorageEngineSWF.superclass._clear.call(this);
		},

		/*
		 * Implementation to fetch an item from the storage engine.
		 * @see YAHOO.util.Storage._getItem
		 */
		_getItem: function(sKey) {
			var _key = _getKey(this, sKey);
			return _driver.callSWF("getValueOf", [_key]);
		},

		/*
		 * Implementation to fetch a key from the storage engine.
		 * @see YAHOO.util.Storage.key
		 */
		_key: function(index) {
			return StorageEngineSWF.superclass._key.call(this, index).replace(/^.*?__/, '');
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._removeItem
		 */
		_removeItem: function(sKey) {
			Y.log("removing SWF key: " + sKey);
			var _key = _getKey(this, sKey);
			StorageEngineSWF.superclass._removeItem.call(this, _key);
			_driver.callSWF("removeItem", [_key]);
		},

		/*
		 * Implementation to remove an item from the storage engine.
		 * @see YAHOO.util.Storage._setItem
		 */
		_setItem: function(sKey, oData) {
			var _key = _getKey(this, sKey), swfNode;

			if (! _driver.callSWF("getValueOf", [_key])) {
				this._addKey(_key);
			}

			if (_driver.callSWF("setItem", [_key, oData])) {
				return true;
			} else {
				swfNode = Dom.get(_driver._id);
				if (MINIMUM_WIDTH > Dom.getStyle(swfNode, 'width').replace(/\D+/g, '')) {Dom.setStyle(swfNode, 'width', MINIMUM_WIDTH + 'px');}
				if (MINIMUM_HEIGHT > Dom.getStyle(swfNode, 'height').replace(/\D+/g, '')) {Dom.setStyle(swfNode, 'height', MINIMUM_HEIGHT + 'px');}
				Y.log("attempting to show settings. are dimensions adequate? " + _driver.callSWF("hasAdequateDimensions"));
				return _driver.callSWF("displaySettings", []);
			}
		}
	});

	StorageEngineSWF.SWFURL = "swfstore.swf";
	StorageEngineSWF.ENGINE_NAME = 'swf';

	StorageEngineSWF.isAvailable = function() {
		return (6 <= Y.env.ua.flash && Y.widget.SWF);
	};

	Util.StorageManager.register(StorageEngineSWF);
	Util.StorageEngineSWF = StorageEngineSWF;
}());