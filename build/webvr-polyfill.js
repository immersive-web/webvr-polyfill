(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @api private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {Mixed} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Boolean} exists Only check if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn The listener function.
 * @param {Mixed} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events[evt]) this._events[evt] = listener, this._eventsCount++;
  else if (!this._events[evt].fn) this._events[evt].push(listener);
  else this._events[evt] = [this._events[evt], listener];

  return this;
};

/**
 * Remove the listeners of a given event.
 *
 * @param {String|Symbol} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {Mixed} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
         listeners.fn === fn
      && (!once || listeners.once)
      && (!context || listeners.context === context)
    ) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
           listeners[i].fn !== fn
        || (once && !listeners[i].once)
        || (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else if (--this._eventsCount === 0) this._events = new Events();
    else delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {String|Symbol} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) {
      if (--this._eventsCount === 0) this._events = new Events();
      else delete this._events[evt];
    }
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],2:[function(_dereq_,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WakeLock = _dereq_('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;
var hasShowDeprecationWarning = false;

var defaultLeftBounds = [0, 0, 0.5, 1];
var defaultRightBounds = [0.5, 0, 0.5, 1];

/**
 * The base class for all VR frame data.
 */

function VRFrameData() {
  this.leftProjectionMatrix = new Float32Array(16);
  this.leftViewMatrix = new Float32Array(16);
  this.rightProjectionMatrix = new Float32Array(16);
  this.rightViewMatrix = new Float32Array(16);
  this.pose = null;
};

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.depthNear = 0.01;
  this.depthFar = 10000.0;

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false,
    maxLayers: 1
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;
  this.fullscreenElementCachedStyle_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getFrameData = function(frameData) {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return Util.frameDataFromPose(frameData, this.getPose(), this);
};

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  // Don't wrap in iOS.
  if (Util.isIOS()) {
    return element;
  }
  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    var cssProperties = [
      'height: ' + Math.min(screen.height, screen.width) + 'px !important',
      'top: 0 !important',
      'left: 0 !important',
      'right: 0 !important',
      'border: 0',
      'margin: 0',
      'padding: 0',
      'z-index: 999999 !important',
      'position: fixed',
    ];
    this.fullscreenWrapper_.setAttribute('style', cssProperties.join('; ') + ';');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
  }

  if (this.fullscreenElement_ == element) {
    return this.fullscreenWrapper_;
  }

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);
  this.fullscreenElementCachedStyle_ = this.fullscreenElement_.getAttribute('style');

  var self = this;
  function applyFullscreenElementStyle() {
    if (!self.fullscreenElement_) {
      return;
    }

    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0',
    ];
    self.fullscreenElement_.setAttribute('style', cssProperties.join('; ') + ';');
  }

  applyFullscreenElementStyle();

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_) {
    return;
  }

  var element = this.fullscreenElement_;
  if (this.fullscreenElementCachedStyle_) {
    element.setAttribute('style', this.fullscreenElementCachedStyle_);
  } else {
    element.removeAttribute('style');
  }
  this.fullscreenElement_ = null;
  this.fullscreenElementCachedStyle_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layers) {
  var wasPresenting = this.isPresenting;
  var self = this;

  if (!(layers instanceof Array)) {
    if (!hasShowDeprecationWarning) {
      console.warn("Using a deprecated form of requestPresent. Should pass in an array of VRLayers.");
      hasShowDeprecationWarning = true;
    }
    layers = [layers];
  }

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    if (layers.length == 0 || layers.length > self.capabilities.maxLayers) {
      reject(new Error('Invalid number of layers.'));
      return;
    }

    var incomingLayer = layers[0];
    if (!incomingLayer.source) {
      /*
      todo: figure out the correct behavior if the source is not provided.
      see https://github.com/w3c/webvr/issues/58
      */
      resolve();
      return;
    }

    var leftBounds = incomingLayer.leftBounds || defaultLeftBounds;
    var rightBounds = incomingLayer.rightBounds || defaultRightBounds;
    if (wasPresenting) {
      // Already presenting, just changing configuration
      var layer = self.layer_;
      if (layer.source !== incomingLayer.source) {
        layer.source = incomingLayer.source;
      }

      for (var i = 0; i < 4; i++) {
        if (layer.leftBounds[i] !== leftBounds[i]) {
          layer.leftBounds[i] = leftBounds[i];
        }
        if (layer.rightBounds[i] !== rightBounds[i]) {
          layer.rightBounds[i] = rightBounds[i];
        }
      }

      resolve();
      return;
    }

    // Was not already presenting.
    self.layer_ = {
      predistorted: incomingLayer.predistorted,
      source: incomingLayer.source,
      leftBounds: leftBounds.slice(0),
      rightBounds: rightBounds.slice(0)
    };

    self.waitingForPresent_ = false;
    if (self.layer_ && self.layer_.source) {
      var fullscreenElement = self.wrapForFullscreen(self.layer_.source);

      function onFullscreenChange() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary').catch(function(error){
                    console.error('screen.orientation.lock() failed due to', error.message)
            });
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
        self.fireVRDisplayPresentChange_();
      }
      function onFullscreenError() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.beginPresent_();
        self.fireVRDisplayPresentChange_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.endPresent_();
        self.fireVRDisplayPresentChange_();
      }

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return [];
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {display: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenchange', changeHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenchange', changeHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenchange', changeHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenchange', changeHandler, false);
    }
  }

  if (errorHandler) {
    if (document.fullscreenEnabled) {
      element.addEventListener('fullscreenerror', errorHandler, false);
    } else if (document.webkitFullscreenEnabled) {
      element.addEventListener('webkitfullscreenerror', errorHandler, false);
    } else if (document.mozFullScreenEnabled) {
      document.addEventListener('mozfullscreenerror', errorHandler, false);
    } else if (document.msFullscreenEnabled) {
      element.addEventListener('msfullscreenerror', errorHandler, false);
    }
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters if canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRFrameData = VRFrameData;
module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":22,"./wakelock.js":24}],4:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardUI = _dereq_('./cardboard-ui.js');
var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = WebVRConfig.BUFFER_SCALE;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  if (!WebVRConfig.CARDBOARD_UI_DISABLED) {
    this.cardboardUI = new CardboardUI(gl);
  }
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  if (this.cardboardUI) {
    this.cardboardUI.destroy();
  }
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.realCanvasWidth.set.call(canvas, value);
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.realCanvasHeight.set.call(canvas, value);
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
  Util.safariCssSizeWorkaround(canvas);
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;

  setTimeout(function() {
    Util.safariCssSizeWorkaround(canvas);
  }, 1);
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    if (self.cardboardUI) {
      self.cardboardUI.renderNoState();
    }

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":5,"./deps/wglu-preserve-state.js":7,"./util.js":22}],5:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var WGLUPreserveGLState = _dereq_('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // Assumes your canvas width and height is scaled proportionately.
    // TODO(smus): The following causes buttons to become huge on iOS, but seems
    // like the right thing to do. For now, added a hack. But really, investigate why.
    var dps = (gl.drawingBufferWidth / (screen.width * window.devicePixelRatio));
    if (!Util.isIOS()) {
      dps *= window.devicePixelRatio;
    }

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":7,"./util.js":22}],6:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardDistorter = _dereq_('./cardboard-distorter.js');
var CardboardUI = _dereq_('./cardboard-ui.js');
var DeviceInfo = _dereq_('./device-info.js');
var Dpdb = _dereq_('./dpdb/dpdb.js');
var FusionPoseSensor = _dereq_('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = _dereq_('./rotate-instructions.js');
var ViewerSelector = _dereq_('./viewer-selector.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var Util = _dereq_('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = WebVRConfig.BUFFER_SCALE;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.on('change', this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  if (!WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED) {
    this.rotateInstructions_ = new RotateInstructions();
  }

  if (Util.isIOS()) {
    // Listen for resize events to workaround this awful Safari bug.
    window.addEventListener('resize', this.onResize_.bind(this));
  }
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  if (Util.isDebug()) {
    console.log('DPDB reported that device params were updated.');
  }
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.updateBounds_ = function () {
  if (this.layer_ && this.distorter_ && (this.layer_.leftBounds || this.layer_.rightBounds)) {
    this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    if (!WebVRConfig.CARDBOARD_UI_DISABLED) {
      gl.canvas.width = Util.getScreenWidth() * this.bufferScale_;
      gl.canvas.height = Util.getScreenHeight() * this.bufferScale_;
      this.cardboardUI_ = new CardboardUI(gl);
    }
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;
  }

  if (this.cardboardUI_) {
    this.cardboardUI_.listen(function(e) {
      // Options clicked.
      this.viewerSelector_.show(this.layer_.source.parentElement);
      e.stopPropagation();
      e.preventDefault();
    }.bind(this), function(e) {
      // Back clicked.
      this.exitPresent();
      e.stopPropagation();
      e.preventDefault();
    }.bind(this));
  }

  if (this.rotateInstructions_) {
    if (Util.isLandscapeMode() && Util.isMobile()) {
      // In landscape mode, temporarily show the "put into Cardboard"
      // interstitial. Otherwise, do the default thing.
      this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
    } else {
      this.rotateInstructions_.update();
    }
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Listen for present display change events in order to update distorter dimensions
  this.vrdisplaypresentchangeHandler = this.updateBounds_.bind(this);
  window.addEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  if (this.rotateInstructions_) {
    this.rotateInstructions_.hide();
  }
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
  window.removeEventListener('vrdisplaypresentchange', this.vrdisplaypresentchangeHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_ && this.layer_) {
    // Hack for predistorted: true.
    var canvas = this.layer_.source.getContext('webgl').canvas;
    if (canvas.width != this.lastWidth || canvas.height != this.lastHeight) {
      this.cardboardUI_.onResize();
    }
    this.lastWidth = canvas.width;
    this.lastHeight = canvas.height;

    // Render the Cardboard UI.
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  if (this.rotateInstructions_) {
    this.rotateInstructions_.update();
  }

  this.onResize_();
};

CardboardVRDisplay.prototype.onResize_ = function(e) {
  if (this.layer_) {
    var gl = this.layer_.source.getContext('webgl');
    // Size the CSS canvas.
    // Added padding on right and bottom because iPhone 5 will not
    // hide the URL bar unless content is bigger than the screen.
    // This will not be visible as long as the container element (e.g. body)
    // is set to 'overflow: hidden'.
    var cssProperties = [
      'position: absolute',
      'top: 0',
      'left: 0',
      'width: ' + Math.max(screen.width, screen.height) + 'px',
      'height: ' + Math.min(screen.height, screen.width) + 'px',
      'border: 0',
      'margin: 0',
      'padding: 0 10px 10px 0',
    ];
    gl.canvas.setAttribute('style', cssProperties.join('; ') + ';');

    Util.safariCssSizeWorkaround(gl.canvas);
  }
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  if (this.distorter_) {
    // Update the distortion appropriately.
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
  }

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":3,"./cardboard-distorter.js":4,"./cardboard-ui.js":5,"./device-info.js":8,"./dpdb/dpdb.js":12,"./rotate-instructions.js":16,"./sensor-fusion/fusion-pose-sensor.js":18,"./util.js":22,"./viewer-selector.js":23}],7:[function(_dereq_,module,exports){
/*
Copyright (c) 2016, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Caches specified GL state, runs a callback, and restores the cached state when
done.

Example usage:

var savedState = [
  gl.ARRAY_BUFFER_BINDING,

  // TEXTURE_BINDING_2D or _CUBE_MAP must always be followed by the texure unit.
  gl.TEXTURE_BINDING_2D, gl.TEXTURE0,

  gl.CLEAR_COLOR,
];
// After this call the array buffer, texture unit 0, active texture, and clear
// color will be restored. The viewport will remain changed, however, because
// gl.VIEWPORT was not included in the savedState list.
WGLUPreserveGLState(gl, savedState, function(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, ....);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, ...);

  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
});

Note that this is not intended to be fast. Managing state in your own code to
avoid redundant state setting and querying will always be faster. This function
is most useful for cases where you may not have full control over the WebGL
calls being made, such as tooling or effect injectors.
*/

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;
},{}],8:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Distortion = _dereq_('./distortion/distortion.js');
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance));
  var innerAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance));
  var bottomAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance));
  var topAngle = MathUtil.radToDeg * Math.atan(
      distortion.distort(topDist / eyeToScreenDistance));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-MathUtil.degToRad * viewer.fov);
  var fovTop = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovRight = Math.tan(MathUtil.degToRad * viewer.fov);
  var fovBottom = Math.tan(-MathUtil.degToRad * viewer.fov);
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  var fovTop = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovRight = distortion.distortInverse(Math.tan(MathUtil.degToRad * viewer.fov));
  var fovBottom = distortion.distortInverse(Math.tan(-MathUtil.degToRad * viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: MathUtil.radToDeg * Math.atan(p.outerDist),
    rightDegrees: MathUtil.radToDeg * Math.atan(p.innerDist),
    downDegrees: MathUtil.radToDeg * Math.atan(p.bottomDist),
    upDegrees: MathUtil.radToDeg * Math.atan(p.topDist)
  };
};

DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  // Distances stored in local variables are in tan-angle units unless otherwise
  // noted.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(MathUtil.degToRad * maxFov));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;

},{"./distortion/distortion.js":10,"./math-util.js":14,"./util.js":22}],9:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var VRDisplay = _dereq_('./base.js').VRDisplay;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-polyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":3}],10:[function(_dereq_,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
};

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
};

// Functions below roughly ported from
// https://github.com/googlesamples/cardboard-unity/blob/master/Cardboard/Scripts/CardboardProfile.cs#L412

// Solves a small linear equation via destructive gaussian
// elimination and back substitution.  This isn't generic numeric
// code, it's just a quick hack to work with the generally
// well-behaved symmetric matrices for least-squares fitting.
// Not intended for reuse.
//
// @param a Input positive definite symmetrical matrix. Destroyed
//     during calculation.
// @param y Input right-hand-side values. Destroyed during calculation.
// @return Resulting x value vector.
//
Distortion.prototype.solveLinear_ = function(a, y) {
  var n = a.length;

  // Gaussian elimination (no row exchange) to triangular matrix.
  // The input matrix is a A^T A product which should be a positive
  // definite symmetrical matrix, and if I remember my linear
  // algebra right this implies that the pivots will be nonzero and
  // calculations sufficiently accurate without needing row
  // exchange.
  for (var j = 0; j < n - 1; ++j) {
    for (var k = j + 1; k < n; ++k) {
      var p = a[j][k] / a[j][j];
      for (var i = j + 1; i < n; ++i) {
        a[i][k] -= p * a[i][j];
      }
      y[k] -= p * y[j];
    }
  }
  // From this point on, only the matrix elements a[j][i] with i>=j are
  // valid. The elimination doesn't fill in eliminated 0 values.

  var x = new Array(n);

  // Back substitution.
  for (var j = n - 1; j >= 0; --j) {
    var v = y[j];
    for (var i = j + 1; i < n; ++i) {
      v -= a[i][j] * x[i];
    }
    x[j] = v / a[j][j];
  }

  return x;
};

// Solves a least-squares matrix equation.  Given the equation A * x = y, calculate the
// least-square fit x = inverse(A * transpose(A)) * transpose(A) * y.  The way this works
// is that, while A is typically not a square matrix (and hence not invertible), A * transpose(A)
// is always square.  That is:
//   A * x = y
//   transpose(A) * (A * x) = transpose(A) * y   <- multiply both sides by transpose(A)
//   (transpose(A) * A) * x = transpose(A) * y   <- associativity
//   x = inverse(transpose(A) * A) * transpose(A) * y  <- solve for x
// Matrix A's row count (first index) must match y's value count.  A's column count (second index)
// determines the length of the result vector x.
Distortion.prototype.solveLeastSquares_ = function(matA, vecY) {
  var i, j, k, sum;
  var numSamples = matA.length;
  var numCoefficients = matA[0].length;
  if (numSamples != vecY.Length) {
    throw new Error("Matrix / vector dimension mismatch");
  }

  // Calculate transpose(A) * A
  var matATA = new Array(numCoefficients);
  for (k = 0; k < numCoefficients; ++k) {
    matATA[k] = new Array(numCoefficients);
    for (j = 0; j < numCoefficients; ++j) {
      sum = 0;
      for (i = 0; i < numSamples; ++i) {
        sum += matA[j][i] * matA[k][i];
      }
      matATA[k][j] = sum;
    }
  }

  // Calculate transpose(A) * y
  var vecATY = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    sum = 0;
    for (i = 0; i < numSamples; ++i) {
      sum += matA[j][i] * vecY[i];
    }
    vecATY[j] = sum;
  }

  // Now solve (A * transpose(A)) * x = transpose(A) * y.
  return this.solveLinear_(matATA, vecATY);
};

/// Calculates an approximate inverse to the given radial distortion parameters.
Distortion.prototype.approximateInverse = function(maxRadius, numSamples) {
  maxRadius = maxRadius || 1;
  numSamples = numSamples || 100;
  var numCoefficients = 6;
  var i, j;

  // R + K1*R^3 + K2*R^5 = r, with R = rp = distort(r)
  // Repeating for numSamples:
  //   [ R0^3, R0^5 ] * [ K1 ] = [ r0 - R0 ]
  //   [ R1^3, R1^5 ]   [ K2 ]   [ r1 - R1 ]
  //   [ R2^3, R2^5 ]            [ r2 - R2 ]
  //   [ etc... ]                [ etc... ]
  // That is:
  //   matA * [K1, K2] = y
  // Solve:
  //   [K1, K2] = inverse(transpose(matA) * matA) * transpose(matA) * y
  var matA = new Array(numCoefficients);
  for (j = 0; j < numCoefficients; ++j) {
    matA[j] = new Array(numSamples);
  }
  var vecY = new Array(numSamples);

  for (i = 0; i < numSamples; ++i) {
    var r = maxRadius * (i + 1) / numSamples;
    var rp = this.distort(r);
    var v = rp;
    for (j = 0; j < numCoefficients; ++j) {
      v *= rp * rp;
      matA[j][i] = v;
    }
    vecY[i] = r - rp;
  }

  var inverseCoefficients = this.solveLeastSquares_(matA, vecY);

  return new Distortion(inverseCoefficients);
};

module.exports = Distortion;

},{}],11:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * DPDB cache.
 */
var DPDB_CACHE = {
  "format": 1,
  "last_updated": "2016-01-20T00:18:35Z",
  "devices": [

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/Nexus 7/*" },
      { "ua": "Nexus 7" }
    ],
    "dpi": [ 320.8, 323.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/ASUS_Z00AD/*" },
      { "ua": "ASUS_Z00AD" }
    ],
    "dpi": [ 403.0, 404.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC6435LVW/*" },
      { "ua": "HTC6435LVW" }
    ],
    "dpi": [ 449.7, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One XL/*" },
      { "ua": "HTC One XL" }
    ],
    "dpi": [ 315.3, 314.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "htc/*/Nexus 9/*" },
      { "ua": "Nexus 9" }
    ],
    "dpi": 289.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One M9/*" },
      { "ua": "HTC One M9" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One_M8/*" },
      { "ua": "HTC One_M8" }
    ],
    "dpi": [ 449.7, 447.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One/*" },
      { "ua": "HTC One" }
    ],
    "dpi": 472.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Huawei/*/Nexus 6P/*" },
      { "ua": "Nexus 6P" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5X/*" },
      { "ua": "Nexus 5X" }
    ],
    "dpi": [ 422.0, 419.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS345/*" },
      { "ua": "LGMS345" }
    ],
    "dpi": [ 221.7, 219.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D800/*" },
      { "ua": "LG-D800" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D850/*" },
      { "ua": "LG-D850" }
    ],
    "dpi": [ 537.9, 541.9 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/VS985 4G/*" },
      { "ua": "VS985 4G" }
    ],
    "dpi": [ 537.9, 535.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5/*" },
      { "ua": "Nexus 5 " }
    ],
    "dpi": [ 442.4, 444.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 4/*" },
      { "ua": "Nexus 4" }
    ],
    "dpi": [ 319.8, 318.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-P769/*" },
      { "ua": "LG-P769" }
    ],
    "dpi": [ 240.6, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS323/*" },
      { "ua": "LGMS323" }
    ],
    "dpi": [ 206.6, 204.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGLS996/*" },
      { "ua": "LGLS996" }
    ],
    "dpi": [ 403.4, 401.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/4560MMX/*" },
      { "ua": "4560MMX" }
    ],
    "dpi": [ 240.0, 219.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/A250/*" },
      { "ua": "Micromax A250" }
    ],
    "dpi": [ 480.0, 446.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/Micromax AQ4501/*" },
      { "ua": "Micromax AQ4501" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/DROID RAZR/*" },
      { "ua": "DROID RAZR" }
    ],
    "dpi": [ 368.1, 256.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT830C/*" },
      { "ua": "XT830C" }
    ],
    "dpi": [ 254.0, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1021/*" },
      { "ua": "XT1021" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1023/*" },
      { "ua": "XT1023" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1028/*" },
      { "ua": "XT1028" }
    ],
    "dpi": [ 326.6, 327.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1034/*" },
      { "ua": "XT1034" }
    ],
    "dpi": [ 326.6, 328.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1053/*" },
      { "ua": "XT1053" }
    ],
    "dpi": [ 315.3, 316.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1562/*" },
      { "ua": "XT1562" }
    ],
    "dpi": [ 403.4, 402.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/Nexus 6/*" },
      { "ua": "Nexus 6 " }
    ],
    "dpi": [ 494.3, 489.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1063/*" },
      { "ua": "XT1063" }
    ],
    "dpi": [ 295.0, 296.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1064/*" },
      { "ua": "XT1064" }
    ],
    "dpi": [ 295.0, 295.6 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1092/*" },
      { "ua": "XT1092" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1095/*" },
      { "ua": "XT1095" }
    ],
    "dpi": [ 422.0, 423.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/A0001/*" },
      { "ua": "A0001" }
    ],
    "dpi": [ 403.4, 401.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE E1005/*" },
      { "ua": "ONE E1005" }
    ],
    "dpi": [ 442.4, 441.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE A2005/*" },
      { "ua": "ONE A2005" }
    ],
    "dpi": [ 391.9, 405.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OPPO/*/X909/*" },
      { "ua": "X909" }
    ],
    "dpi": [ 442.4, 444.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9082/*" },
      { "ua": "GT-I9082" }
    ],
    "dpi": [ 184.7, 185.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G360P/*" },
      { "ua": "SM-G360P" }
    ],
    "dpi": [ 196.7, 205.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Nexus S/*" },
      { "ua": "Nexus S" }
    ],
    "dpi": [ 234.5, 229.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 304.8, 303.9 ],
    "bw": 5,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T230NU/*" },
      { "ua": "SM-T230NU" }
    ],
    "dpi": 216.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SGH-T399/*" },
      { "ua": "SGH-T399" }
    ],
    "dpi": [ 217.7, 231.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N9005/*" },
      { "ua": "SM-N9005" }
    ],
    "dpi": [ 386.4, 387.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SM-N900A/*" },
      { "ua": "SAMSUNG-SM-N900A" }
    ],
    "dpi": [ 386.4, 387.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9500/*" },
      { "ua": "GT-I9500" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9505/*" },
      { "ua": "GT-I9505" }
    ],
    "dpi": 439.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900F/*" },
      { "ua": "SM-G900F" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900M/*" },
      { "ua": "SM-G900M" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G800F/*" },
      { "ua": "SM-G800F" }
    ],
    "dpi": 326.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G906S/*" },
      { "ua": "SM-G906S" }
    ],
    "dpi": [ 562.7, 572.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 306.7, 304.8 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T535/*" },
      { "ua": "SM-T535" }
    ],
    "dpi": [ 142.6, 136.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N920C/*" },
      { "ua": "SM-N920C" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300I/*" },
      { "ua": "GT-I9300I" }
    ],
    "dpi": [ 304.8, 305.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9195/*" },
      { "ua": "GT-I9195" }
    ],
    "dpi": [ 249.4, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-L520/*" },
      { "ua": "SPH-L520" }
    ],
    "dpi": [ 249.4, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SGH-I717/*" },
      { "ua": "SAMSUNG-SGH-I717" }
    ],
    "dpi": 285.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-D710/*" },
      { "ua": "SPH-D710" }
    ],
    "dpi": [ 217.7, 204.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-N7100/*" },
      { "ua": "GT-N7100" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SCH-I605/*" },
      { "ua": "SCH-I605" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Galaxy Nexus/*" },
      { "ua": "Galaxy Nexus" }
    ],
    "dpi": [ 315.3, 314.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910H/*" },
      { "ua": "SM-N910H" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910C/*" },
      { "ua": "SM-N910C" }
    ],
    "dpi": [ 515.2, 520.2 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G130M/*" },
      { "ua": "SM-G130M" }
    ],
    "dpi": [ 165.9, 164.8 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G928I/*" },
      { "ua": "SM-G928I" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920F/*" },
      { "ua": "SM-G920F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920P/*" },
      { "ua": "SM-G920P" }
    ],
    "dpi": [ 522.5, 577.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925F/*" },
      { "ua": "SM-G925F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925V/*" },
      { "ua": "SM-G925V" }
    ],
    "dpi": [ 522.5, 576.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/C6903/*" },
      { "ua": "C6903" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/D6653/*" },
      { "ua": "D6653" }
    ],
    "dpi": [ 428.6, 427.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6653/*" },
      { "ua": "E6653" }
    ],
    "dpi": [ 428.6, 425.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6853/*" },
      { "ua": "E6853" }
    ],
    "dpi": [ 403.4, 401.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/SGP321/*" },
      { "ua": "SGP321" }
    ],
    "dpi": [ 224.7, 224.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*" },
      { "ua": "ALCATEL ONE TOUCH Fierce" }
    ],
    "dpi": [ 240.0, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "THL/*/thl 5000/*" },
      { "ua": "thl 5000" }
    ],
    "dpi": [ 480.0, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "ZTE/*/ZTE Blade L2/*" },
      { "ua": "ZTE Blade L2" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  }
]};

module.exports = DPDB_CACHE;

},{}],12:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = _dereq_('./dpdb-cache.js');
var Util = _dereq_('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL = 'https://storage.googleapis.com/cardboard-dpdb/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  var newDeviceParams = this.calcDeviceParams_();
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;

},{"../util.js":22,"./dpdb-cache.js":11}],13:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Util = _dereq_('./util.js');
var WebVRPolyfill = _dereq_('./webvr-polyfill.js').WebVRPolyfill;

// Initialize a WebVRConfig just in case.
window.WebVRConfig = Util.extend({
  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: false,

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  K_FILTER: 0.98,

  // How far into the future to predict during fast motion (in seconds).
  PREDICTION_TIME_S: 0.040,

  // Flag to enable touch panner. In case you have your own touch controls.
  TOUCH_PANNER_DISABLED: true,

  // Flag to disabled the UI in VR Mode.
  CARDBOARD_UI_DISABLED: false, // Default: false

  // Flag to disable the instructions to rotate your device.
  ROTATE_INSTRUCTIONS_DISABLED: false, // Default: false.

  // Enable yaw panning only, disabling roll and pitch. This can be useful
  // for panoramas with nothing interesting above or below.
  YAW_ONLY: false,

  // To disable keyboard and mouse controls, if you want to use your own
  // implementation.
  MOUSE_KEYBOARD_CONTROLS_DISABLED: false,

  // Prevent the polyfill from initializing immediately. Requires the app
  // to call InitializeWebVRPolyfill() before it can be used.
  DEFER_INITIALIZATION: false,

  // Enable the deprecated version of the API (navigator.getVRDevices).
  ENABLE_DEPRECATED_API: false,

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance.
  // UPDATE(2016-05-03): Setting this to 0.5 by default since 1.0 does not
  // perform well on many mobile devices.
  BUFFER_SCALE: 0.5,

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind its resources on the
  // next frame anyway. This has been seen to cause rendering glitches with
  // THREE.js.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0.
  DIRTY_SUBMIT_FRAME_BINDINGS: false,

  // When set to true, this will cause a polyfilled VRDisplay to always be
  // appended to the list returned by navigator.getVRDisplays(), even if that
  // list includes a native VRDisplay.
  ALWAYS_APPEND_POLYFILL_DISPLAY: false
}, window.WebVRConfig);

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
    new WebVRPolyfill();
  }
}

},{"./util.js":22,"./webvr-polyfill.js":25}],14:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.multiplyScalar(invScalar);
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  multiplyScalar: function ( scalar ) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],15:[function(_dereq_,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VRDisplay = _dereq_('./base.js').VRDisplay;
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.orientation_ = new MathUtil.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new MathUtil.Vector2();
  this.rotateEnd_ = new MathUtil.Vector2();
  this.rotateDelta_ = new MathUtil.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.orientation_.setFromEulerYXZ(this.phi_, this.theta_, 0);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    cancelAnimationFrame(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = requestAnimationFrame(function animate() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      cancelAnimationFrame(this.angleAnimation_);
      return;
    }
    // loop with requestAnimationFrame
    this.angleAnimation_ = requestAnimationFrame(animate.bind(this))
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this));
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":3,"./math-util.js":14,"./util.js":22}],16:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';
  // Force this to be above the fullscreen canvas, which is at zIndex: 999999.
  s.zIndex = 1000000;

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  snackbarButton.target = '_blank';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":22}],17:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var SensorSample = _dereq_('./sensor-sample.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Set default look direction to be in the correct direction.
  if (Util.isIOS()) {
    this.filterQ = new MathUtil.Quaternion(-1, 0, 0, 1);
  } else {
    this.filterQ = new MathUtil.Quaternion(1, 0, 0, 1);
  }
  this.previousFilterQ = new MathUtil.Quaternion();
  this.previousFilterQ.copy(this.filterQ);

  // Orientation based on the accelerometer.
  this.accelQ = new MathUtil.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new MathUtil.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new MathUtil.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new MathUtil.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }

  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new MathUtil.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new MathUtil.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (Util.isDebug()) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                MathUtil.radToDeg * Util.getQuaternionAngle(deltaQ),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new MathUtil.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new MathUtil.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new MathUtil.Quaternion();
  quat.setFromUnitVectors(new MathUtil.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new MathUtil.Quaternion();
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../math-util.js":14,"../util.js":22,"./sensor-sample.js":20}],18:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = _dereq_('./complementary-filter.js');
var PosePredictor = _dereq_('./pose-predictor.js');
var TouchPanner = _dereq_('../touch-panner.js');
var MathUtil = _dereq_('../math-util.js');
var Util = _dereq_('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new MathUtil.Vector3();
  this.gyroscope = new MathUtil.Vector3();

  this.start();

  this.filter = new ComplementaryFilter(WebVRConfig.K_FILTER);
  this.posePredictor = new PosePredictor(WebVRConfig.PREDICTION_TIME_S);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new MathUtil.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), Math.PI / 2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new MathUtil.Vector3(1, 0, 0), -Math.PI / 2);
  }

  this.inverseWorldToScreenQ = new MathUtil.Quaternion();
  this.worldToScreenQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ = new MathUtil.Quaternion();
  this.originalPoseAdjustQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1),
                                           -window.orientation * Math.PI / 180);

  this.setScreenTransform_();
  // Adjust this filter for being in landscape mode.
  if (Util.isLandscapeMode()) {
    this.filterToWorldQ.multiply(this.inverseWorldToScreenQ);
  }

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new MathUtil.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new MathUtil.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  // Reduce to inverted yaw-only.
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  // Take into account extra transformations in landscape mode.
  if (Util.isLandscapeMode()) {
    this.resetQ.multiply(this.inverseWorldToScreenQ);
  }

  // Take into account original pose.
  this.resetQ.multiply(this.originalPoseAdjustQ);

  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotionChange_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  // Firefox Android timeStamp returns one thousandth of a millisecond.
  if (this.isFirefoxAndroid) {
    timestampS /= 1000;
  }

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }
  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isFirefoxAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.setScreenTransform_();
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), -Math.PI / 2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new MathUtil.Vector3(0, 0, 1), Math.PI / 2);
      break;
    case 180:
      // TODO.
      break;
  }
  this.inverseWorldToScreenQ.copy(this.worldToScreenQ);
  this.inverseWorldToScreenQ.inverse();
};

FusionPoseSensor.prototype.start = function() {
  this.onDeviceMotionCallback_ = this.onDeviceMotionChange_.bind(this);
  this.onScreenOrientationCallback_ = this.onScreenOrientationChange_.bind(this);
  
  window.addEventListener('devicemotion', this.onDeviceMotionCallback_);
  window.addEventListener('orientationchange', this.onScreenOrientationCallback_);
};

FusionPoseSensor.prototype.stop = function() {
  window.removeEventListener('devicemotion', this.onDeviceMotionCallback_);
  window.removeEventListener('orientationchange', this.onScreenOrientationCallback_);
};

module.exports = FusionPoseSensor;

},{"../math-util.js":14,"../touch-panner.js":21,"../util.js":22,"./complementary-filter.js":17,"./pose-predictor.js":19}],19:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('../math-util');
var Util = _dereq_('../util');

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (Util.isDebug()) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);
  this.previousTimestampS = timestampS;

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util":14,"../util":22}],20:[function(_dereq_,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],21:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = _dereq_('./math-util.js');
var Util = _dereq_('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  if (e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":14,"./util.js":22}],22:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var objectAssign = _dereq_('object-assign');

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = objectAssign;

Util.safariCssSizeWorkaround = function(canvas) {
  // TODO(smus): Remove this workaround when Safari for iOS is fixed.
  // iOS only workaround (for https://bugs.webkit.org/show_bug.cgi?id=152556).
  //
  // "To the last I grapple with thee;
  //  from hell's heart I stab at thee;
  //  for hate's sake I spit my last breath at thee."
  // -- Moby Dick, by Herman Melville
  if (Util.isIOS()) {
    var width = canvas.style.width;
    var height = canvas.style.height;
    canvas.style.width = (parseInt(width) + 1) + 'px';
    canvas.style.height = (parseInt(height)) + 'px';
    setTimeout(function() {
      canvas.style.width = width;
      canvas.style.height = height;
    }, 100);
  }

  // Debug only.
  window.Util = Util;
  window.canvas = canvas;
};

Util.isDebug = function() {
  return Util.getQueryParameter('debug');
};

Util.getQueryParameter = function(name) {
  var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.search);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};

Util.frameDataFromPose = (function() {
  var piOver180 = Math.PI / 180.0;
  var rad45 = Math.PI * 0.25;

  // Borrowed from glMatrix.
  function mat4_perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov ? (fov.upDegrees * piOver180) : rad45),
    downTan = Math.tan(fov ? (fov.downDegrees * piOver180) : rad45),
    leftTan = Math.tan(fov ? (fov.leftDegrees * piOver180) : rad45),
    rightTan = Math.tan(fov ? (fov.rightDegrees * piOver180) : rad45),
    xScale = 2.0 / (leftTan + rightTan),
    yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
  }

  function mat4_fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;

    return out;
  };

  function mat4_translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
      a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
      a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

      out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
      out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
      out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
  };

  function mat4_invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
  };

  var defaultOrientation = new Float32Array([0, 0, 0, 1]);
  var defaultPosition = new Float32Array([0, 0, 0]);

  function updateEyeMatrices(projection, view, pose, parameters, vrDisplay) {
    mat4_perspectiveFromFieldOfView(projection, parameters ? parameters.fieldOfView : null, vrDisplay.depthNear, vrDisplay.depthFar);

    var orientation = pose.orientation || defaultOrientation;
    var position = pose.position || defaultPosition;

    mat4_fromRotationTranslation(view, orientation, position);
    if (parameters)
      mat4_translate(view, view, parameters.offset);
    mat4_invert(view, view);
  }

  return function(frameData, pose, vrDisplay) {
    if (!frameData || !pose)
      return false;

    frameData.pose = pose;
    frameData.timestamp = pose.timestamp;

    updateEyeMatrices(
        frameData.leftProjectionMatrix, frameData.leftViewMatrix,
        pose, vrDisplay.getEyeParameters("left"), vrDisplay);
    updateEyeMatrices(
        frameData.rightProjectionMatrix, frameData.rightViewMatrix,
        pose, vrDisplay.getEyeParameters("right"), vrDisplay);

    return true;
  };
})();

module.exports = Util;

},{"object-assign":2}],23:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var DeviceInfo = _dereq_('./device-info.js');
var EventEmitter3 = _dereq_('eventemitter3');
var Util = _dereq_('./util.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage. If none exists, use the
  // default key.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY) || DEFAULT_VIEWER;
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }
  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
}
ViewerSelector.prototype = new EventEmitter3();

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.emit('change', DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":8,"./util.js":22,"eventemitter3":1}],24:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');

  video.addEventListener('ended', function() {
    video.play();
  });

  this.request = function() {
    if (video.paused) {
      // Base64 version of videos_src/no-sleep-120s.mp4.
      video.src = Util.base64('video/mp4', 'AAAAGGZ0eXBpc29tAAAAAG1wNDFhdmMxAAAIA21vb3YAAABsbXZoZAAAAADSa9v60mvb+gABX5AAlw/gAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAdkdHJhawAAAFx0a2hkAAAAAdJr2/rSa9v6AAAAAQAAAAAAlw/gAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAQAAAAHAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAJcP4AAAAAAAAQAAAAAG3G1kaWEAAAAgbWRoZAAAAADSa9v60mvb+gAPQkAGjneAFccAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAABodtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAZHc3RibAAAAJdzdHNkAAAAAAAAAAEAAACHYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAMABwASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAADFhdmNDAWQAC//hABlnZAALrNlfllw4QAAAAwBAAAADAKPFCmWAAQAFaOvssiwAAAAYc3R0cwAAAAAAAAABAAAAbgAPQkAAAAAUc3RzcwAAAAAAAAABAAAAAQAAA4BjdHRzAAAAAAAAAG4AAAABAD0JAAAAAAEAehIAAAAAAQA9CQAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEALcbAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAABuAAAAAQAAAcxzdHN6AAAAAAAAAAAAAABuAAADCQAAABgAAAAOAAAADgAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABMAAAAUc3RjbwAAAAAAAAABAAAIKwAAACt1ZHRhAAAAI6llbmMAFwAAdmxjIDIuMi4xIHN0cmVhbSBvdXRwdXQAAAAId2lkZQAACRRtZGF0AAACrgX//6vcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTQyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MTIgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1hYnIgbWJ0cmVlPTEgYml0cmF0ZT0xMDAgcmF0ZXRvbD0xLjAgcWNvbXA9MC42MCBxcG1pbj0xMCBxcG1heD01MSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAU2WIhAAQ/8ltlOe+cTZuGkKg+aRtuivcDZ0pBsfsEi9p/i1yU9DxS2lq4dXTinViF1URBKXgnzKBd/Uh1bkhHtMrwrRcOJslD01UB+fyaL6ef+DBAAAAFEGaJGxBD5B+v+a+4QqF3MgBXz9MAAAACkGeQniH/+94r6EAAAAKAZ5hdEN/8QytwAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFomUwIIf/+4QAAAApBnoZFESw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAOQZrwSahBbJlMCCH//uEAAAAKQZ8ORRUsP/++gQAAAAgBny10Q3/EgQAAAAgBny9qQ3/EgAAAAA5BmzRJqEFsmUwIIf/+4AAAAApBn1JFFSw//76BAAAACAGfcXRDf8SAAAAACAGfc2pDf8SAAAAADkGbeEmoQWyZTAgh//7hAAAACkGflkUVLD//voAAAAAIAZ+1dEN/xIEAAAAIAZ+3akN/xIEAAAAOQZu8SahBbJlMCCH//uAAAAAKQZ/aRRUsP/++gQAAAAgBn/l0Q3/EgAAAAAgBn/tqQ3/EgQAAAA5Bm+BJqEFsmUwIIf/+4QAAAApBnh5FFSw//76AAAAACAGePXRDf8SAAAAACAGeP2pDf8SBAAAADkGaJEmoQWyZTAgh//7gAAAACkGeQkUVLD//voEAAAAIAZ5hdEN/xIAAAAAIAZ5jakN/xIEAAAAOQZpoSahBbJlMCCH//uEAAAAKQZ6GRRUsP/++gQAAAAgBnqV0Q3/EgQAAAAgBnqdqQ3/EgAAAAA5BmqxJqEFsmUwIIf/+4AAAAApBnspFFSw//76BAAAACAGe6XRDf8SAAAAACAGe62pDf8SAAAAADkGa8EmoQWyZTAgh//7hAAAACkGfDkUVLD//voEAAAAIAZ8tdEN/xIEAAAAIAZ8vakN/xIAAAAAOQZs0SahBbJlMCCH//uAAAAAKQZ9SRRUsP/++gQAAAAgBn3F0Q3/EgAAAAAgBn3NqQ3/EgAAAAA5Bm3hJqEFsmUwIIf/+4QAAAApBn5ZFFSw//76AAAAACAGftXRDf8SBAAAACAGft2pDf8SBAAAADkGbvEmoQWyZTAgh//7gAAAACkGf2kUVLD//voEAAAAIAZ/5dEN/xIAAAAAIAZ/7akN/xIEAAAAOQZvgSahBbJlMCCH//uEAAAAKQZ4eRRUsP/++gAAAAAgBnj10Q3/EgAAAAAgBnj9qQ3/EgQAAAA5BmiRJqEFsmUwIIf/+4AAAAApBnkJFFSw//76BAAAACAGeYXRDf8SAAAAACAGeY2pDf8SBAAAADkGaaEmoQWyZTAgh//7hAAAACkGehkUVLD//voEAAAAIAZ6ldEN/xIEAAAAIAZ6nakN/xIAAAAAOQZqsSahBbJlMCCH//uAAAAAKQZ7KRRUsP/++gQAAAAgBnul0Q3/EgAAAAAgBnutqQ3/EgAAAAA5BmvBJqEFsmUwIIf/+4QAAAApBnw5FFSw//76BAAAACAGfLXRDf8SBAAAACAGfL2pDf8SAAAAADkGbNEmoQWyZTAgh//7gAAAACkGfUkUVLD//voEAAAAIAZ9xdEN/xIAAAAAIAZ9zakN/xIAAAAAOQZt4SahBbJlMCCH//uEAAAAKQZ+WRRUsP/++gAAAAAgBn7V0Q3/EgQAAAAgBn7dqQ3/EgQAAAA5Bm7xJqEFsmUwIIf/+4AAAAApBn9pFFSw//76BAAAACAGf+XRDf8SAAAAACAGf+2pDf8SBAAAADkGb4EmoQWyZTAgh//7hAAAACkGeHkUVLD//voAAAAAIAZ49dEN/xIAAAAAIAZ4/akN/xIEAAAAOQZokSahBbJlMCCH//uAAAAAKQZ5CRRUsP/++gQAAAAgBnmF0Q3/EgAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFsmUwIIf/+4QAAAApBnoZFFSw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAPQZruSahBbJlMFEw3//7B');
      video.play();
    }
  };

  this.release = function() {
    video.pause();
    video.src = '';
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":22}],25:[function(_dereq_,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = _dereq_('./util.js');
var CardboardVRDisplay = _dereq_('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = _dereq_('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = _dereq_('./base.js').VRDisplay;
var VRFrameData = _dereq_('./base.js').VRFrameData;
var HMDVRDevice = _dereq_('./base.js').HMDVRDevice;
var PositionSensorVRDevice = _dereq_('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = _dereq_('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = _dereq_('./display-wrappers.js').VRDisplayPositionSensorDevice;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();
  this.nativeGetVRDisplaysFunc = this.nativeWebVRAvailable ?
                                 navigator.getVRDisplays :
                                 null;

  if (!this.nativeLegacyWebVRAvailable) {
    this.enablePolyfill();
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }

  // Put a shim in place to update the API to 1.1 if needed.
  InstallWebVRSpecShim();
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Provide the VRDisplay object.
  window.VRDisplay = VRDisplay;

  // Provide navigator.vrEnabled.
  var self = this;
  Object.defineProperty(navigator, 'vrEnabled', {
    get: function () {
      return self.isCardboardCompatible() &&
          (self.isFullScreenAvailable() || Util.isIOS());
    }
  });

  if (!'VRFrameData' in window) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;
  }
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var polyfillDisplays = this.displays;

  if (this.nativeWebVRAvailable) {
    return this.nativeGetVRDisplaysFunc.call(navigator).then(function(nativeDisplays) {
      if (WebVRConfig.ALWAYS_APPEND_POLYFILL_DISPLAY) {
        return nativeDisplays.concat(polyfillDisplays);
      } else {
        return nativeDisplays.length > 0 ? nativeDisplays : polyfillDisplays;
      }
    });
  } else {
    return new Promise(function(resolve, reject) {
      try {
        resolve(polyfillDisplays);
      } catch (e) {
        reject(e);
      }
    });
  }
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || WebVRConfig.FORCE_ENABLE_VR;
};

WebVRPolyfill.prototype.isFullScreenAvailable = function() {
  return (document.fullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.webkitFullscreenEnabled ||
          false);
};

// Installs a shim that updates a WebVR 1.0 spec implementation to WebVR 1.1
function InstallWebVRSpecShim() {
  if ('VRDisplay' in window && !('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;

    // A lot of Chrome builds don't have depthNear and depthFar, even
    // though they're in the WebVR 1.0 spec. Patch them in if they're not present.
    if(!('depthNear' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthNear = 0.01;
    }

    if(!('depthFar' in window.VRDisplay.prototype)) {
      window.VRDisplay.prototype.depthFar = 10000.0;
    }

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      return Util.frameDataFromPose(frameData, this.getPose(), this);
    }
  }
};

module.exports.WebVRPolyfill = WebVRPolyfill;

},{"./base.js":3,"./cardboard-vr-display.js":6,"./display-wrappers.js":9,"./mouse-keyboard-vr-display.js":15,"./util.js":22}]},{},[13])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJzcmMvYmFzZS5qcyIsInNyYy9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzIiwic3JjL2NhcmRib2FyZC11aS5qcyIsInNyYy9jYXJkYm9hcmQtdnItZGlzcGxheS5qcyIsInNyYy9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMiLCJzcmMvZGV2aWNlLWluZm8uanMiLCJzcmMvZGlzcGxheS13cmFwcGVycy5qcyIsInNyYy9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanMiLCJzcmMvZHBkYi9kcGRiLWNhY2hlLmpzIiwic3JjL2RwZGIvZHBkYi5qcyIsInNyYy9tYWluLmpzIiwic3JjL21hdGgtdXRpbC5qcyIsInNyYy9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzIiwic3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMiLCJzcmMvc2Vuc29yLWZ1c2lvbi9jb21wbGVtZW50YXJ5LWZpbHRlci5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL3Bvc2UtcHJlZGljdG9yLmpzIiwic3JjL3NlbnNvci1mdXNpb24vc2Vuc29yLXNhbXBsZS5qcyIsInNyYy90b3VjaC1wYW5uZXIuanMiLCJzcmMvdXRpbC5qcyIsInNyYy92aWV3ZXItc2VsZWN0b3IuanMiLCJzcmMvd2FrZWxvY2suanMiLCJzcmMvd2VidnItcG9seWZpbGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6OEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIHByZWZpeCA9ICd+JztcblxuLyoqXG4gKiBDb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBzdG9yYWdlIGZvciBvdXIgYEVFYCBvYmplY3RzLlxuICogQW4gYEV2ZW50c2AgaW5zdGFuY2UgaXMgYSBwbGFpbiBvYmplY3Qgd2hvc2UgcHJvcGVydGllcyBhcmUgZXZlbnQgbmFtZXMuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRXZlbnRzKCkge31cblxuLy9cbi8vIFdlIHRyeSB0byBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC4gSW4gc29tZSBlbmdpbmVzIGNyZWF0aW5nIGFuXG4vLyBpbnN0YW5jZSBpbiB0aGlzIHdheSBpcyBmYXN0ZXIgdGhhbiBjYWxsaW5nIGBPYmplY3QuY3JlYXRlKG51bGwpYCBkaXJlY3RseS5cbi8vIElmIGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBub3Qgc3VwcG9ydGVkIHdlIHByZWZpeCB0aGUgZXZlbnQgbmFtZXMgd2l0aCBhXG4vLyBjaGFyYWN0ZXIgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIGJ1aWx0LWluIG9iamVjdCBwcm9wZXJ0aWVzIGFyZSBub3Rcbi8vIG92ZXJyaWRkZW4gb3IgdXNlZCBhcyBhbiBhdHRhY2sgdmVjdG9yLlxuLy9cbmlmIChPYmplY3QuY3JlYXRlKSB7XG4gIEV2ZW50cy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIC8vXG4gIC8vIFRoaXMgaGFjayBpcyBuZWVkZWQgYmVjYXVzZSB0aGUgYF9fcHJvdG9fX2AgcHJvcGVydHkgaXMgc3RpbGwgaW5oZXJpdGVkIGluXG4gIC8vIHNvbWUgb2xkIGJyb3dzZXJzIGxpa2UgQW5kcm9pZCA0LCBpUGhvbmUgNS4xLCBPcGVyYSAxMSBhbmQgU2FmYXJpIDUuXG4gIC8vXG4gIGlmICghbmV3IEV2ZW50cygpLl9fcHJvdG9fXykgcHJlZml4ID0gZmFsc2U7XG59XG5cbi8qKlxuICogUmVwcmVzZW50YXRpb24gb2YgYSBzaW5nbGUgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCB0byBpbnZva2UgdGhlIGxpc3RlbmVyIHdpdGguXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvbmNlPWZhbHNlXSBTcGVjaWZ5IGlmIHRoZSBsaXN0ZW5lciBpcyBhIG9uZS10aW1lIGxpc3RlbmVyLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gRUUoZm4sIGNvbnRleHQsIG9uY2UpIHtcbiAgdGhpcy5mbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLm9uY2UgPSBvbmNlIHx8IGZhbHNlO1xufVxuXG4vKipcbiAqIE1pbmltYWwgYEV2ZW50RW1pdHRlcmAgaW50ZXJmYWNlIHRoYXQgaXMgbW9sZGVkIGFnYWluc3QgdGhlIE5vZGUuanNcbiAqIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJuIGFuIGFycmF5IGxpc3RpbmcgdGhlIGV2ZW50cyBmb3Igd2hpY2ggdGhlIGVtaXR0ZXIgaGFzIHJlZ2lzdGVyZWRcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICB2YXIgbmFtZXMgPSBbXVxuICAgICwgZXZlbnRzXG4gICAgLCBuYW1lO1xuXG4gIGlmICh0aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgcmV0dXJuIG5hbWVzO1xuXG4gIGZvciAobmFtZSBpbiAoZXZlbnRzID0gdGhpcy5fZXZlbnRzKSkge1xuICAgIGlmIChoYXMuY2FsbChldmVudHMsIG5hbWUpKSBuYW1lcy5wdXNoKHByZWZpeCA/IG5hbWUuc2xpY2UoMSkgOiBuYW1lKTtcbiAgfVxuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG4gICAgcmV0dXJuIG5hbWVzLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGV2ZW50cykpO1xuICB9XG5cbiAgcmV0dXJuIG5hbWVzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBPbmx5IGNoZWNrIGlmIHRoZXJlIGFyZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7QXJyYXl8Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24gbGlzdGVuZXJzKGV2ZW50LCBleGlzdHMpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnRcbiAgICAsIGF2YWlsYWJsZSA9IHRoaXMuX2V2ZW50c1tldnRdO1xuXG4gIGlmIChleGlzdHMpIHJldHVybiAhIWF2YWlsYWJsZTtcbiAgaWYgKCFhdmFpbGFibGUpIHJldHVybiBbXTtcbiAgaWYgKGF2YWlsYWJsZS5mbikgcmV0dXJuIFthdmFpbGFibGUuZm5dO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXZhaWxhYmxlLmxlbmd0aCwgZWUgPSBuZXcgQXJyYXkobCk7IGkgPCBsOyBpKyspIHtcbiAgICBlZVtpXSA9IGF2YWlsYWJsZVtpXS5mbjtcbiAgfVxuXG4gIHJldHVybiBlZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgZWFjaCBvZiB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGV2ZW50IGhhZCBsaXN0ZW5lcnMsIGVsc2UgYGZhbHNlYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gZmFsc2U7XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1tldnRdXG4gICAgLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgLCBhcmdzXG4gICAgLCBpO1xuXG4gIGlmIChsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgNDogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMiwgYTMpOyBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAoIWFyZ3MpIGZvciAoaiA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4uYXBwbHkobGlzdGVuZXJzW2ldLmNvbnRleHQsIGFyZ3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBBZGQgYSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIG9uKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcylcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lciwgdGhpcy5fZXZlbnRzQ291bnQrKztcbiAgZWxzZSBpZiAoIXRoaXMuX2V2ZW50c1tldnRdLmZuKSB0aGlzLl9ldmVudHNbZXZ0XS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFt0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgYSBvbmUtdGltZSBsaXN0ZW5lciBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gW2NvbnRleHQ9dGhpc10gVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gb25jZShldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMsIHRydWUpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBsaXN0ZW5lcnMgb2YgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gT25seSByZW1vdmUgdGhlIGxpc3RlbmVycyB0aGF0IG1hdGNoIHRoaXMgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBoYXZlIHRoaXMgY29udGV4dC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IHJlbW92ZSBvbmUtdGltZSBsaXN0ZW5lcnMuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuICBpZiAoIWZuKSB7XG4gICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKFxuICAgICAgICAgbGlzdGVuZXJzLmZuID09PSBmblxuICAgICAgJiYgKCFvbmNlIHx8IGxpc3RlbmVycy5vbmNlKVxuICAgICAgJiYgKCFjb250ZXh0IHx8IGxpc3RlbmVycy5jb250ZXh0ID09PSBjb250ZXh0KVxuICAgICkge1xuICAgICAgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMCwgZXZlbnRzID0gW10sIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnNbaV0uZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzW2ldLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL1xuICAgIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgICAvL1xuICAgIGlmIChldmVudHMubGVuZ3RoKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gICAgZWxzZSBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIGVsc2UgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLCBvciB0aG9zZSBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gW2V2ZW50XSBUaGUgZXZlbnQgbmFtZS5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50KSB7XG4gIHZhciBldnQ7XG5cbiAgaWYgKGV2ZW50KSB7XG4gICAgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcbiAgICBpZiAodGhpcy5fZXZlbnRzW2V2dF0pIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEFsaWFzIG1ldGhvZHMgbmFtZXMgYmVjYXVzZSBwZW9wbGUgcm9sbCBsaWtlIHRoYXQuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XG5cbi8vXG4vLyBUaGlzIGZ1bmN0aW9uIGRvZXNuJ3QgYXBwbHkgYW55bW9yZS5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uIHNldE1heExpc3RlbmVycygpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBwcmVmaXguXG4vL1xuRXZlbnRFbWl0dGVyLnByZWZpeGVkID0gcHJlZml4O1xuXG4vL1xuLy8gQWxsb3cgYEV2ZW50RW1pdHRlcmAgdG8gYmUgaW1wb3J0ZWQgYXMgbW9kdWxlIG5hbWVzcGFjZS5cbi8vXG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG4vL1xuLy8gRXhwb3NlIHRoZSBtb2R1bGUuXG4vL1xuaWYgKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgbW9kdWxlKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXYWtlTG9jayA9IHJlcXVpcmUoJy4vd2FrZWxvY2suanMnKTtcblxuLy8gU3RhcnQgYXQgYSBoaWdoZXIgbnVtYmVyIHRvIHJlZHVjZSBjaGFuY2Ugb2YgY29uZmxpY3QuXG52YXIgbmV4dERpc3BsYXlJZCA9IDEwMDA7XG52YXIgaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZyA9IGZhbHNlO1xuXG52YXIgZGVmYXVsdExlZnRCb3VuZHMgPSBbMCwgMCwgMC41LCAxXTtcbnZhciBkZWZhdWx0UmlnaHRCb3VuZHMgPSBbMC41LCAwLCAwLjUsIDFdO1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZnJhbWUgZGF0YS5cbiAqL1xuXG5mdW5jdGlvbiBWUkZyYW1lRGF0YSgpIHtcbiAgdGhpcy5sZWZ0UHJvamVjdGlvbk1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLmxlZnRWaWV3TWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucmlnaHRQcm9qZWN0aW9uTWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucmlnaHRWaWV3TWF0cml4ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gIHRoaXMucG9zZSA9IG51bGw7XG59O1xuXG4vKipcbiAqIFRoZSBiYXNlIGNsYXNzIGZvciBhbGwgVlIgZGlzcGxheXMuXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmRpc3BsYXlJZCA9IG5leHREaXNwbGF5SWQrKztcbiAgdGhpcy5kaXNwbGF5TmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkaXNwbGF5TmFtZSc7XG5cbiAgdGhpcy5kZXB0aE5lYXIgPSAwLjAxO1xuICB0aGlzLmRlcHRoRmFyID0gMTAwMDAuMDtcblxuICB0aGlzLmlzQ29ubmVjdGVkID0gdHJ1ZTtcbiAgdGhpcy5pc1ByZXNlbnRpbmcgPSBmYWxzZTtcbiAgdGhpcy5jYXBhYmlsaXRpZXMgPSB7XG4gICAgaGFzUG9zaXRpb246IGZhbHNlLFxuICAgIGhhc09yaWVudGF0aW9uOiBmYWxzZSxcbiAgICBoYXNFeHRlcm5hbERpc3BsYXk6IGZhbHNlLFxuICAgIGNhblByZXNlbnQ6IGZhbHNlLFxuICAgIG1heExheWVyczogMVxuICB9O1xuICB0aGlzLnN0YWdlUGFyYW1ldGVycyA9IG51bGw7XG5cbiAgLy8gXCJQcml2YXRlXCIgbWVtYmVycy5cbiAgdGhpcy53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgdGhpcy5sYXllcl8gPSBudWxsO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xuXG4gIHRoaXMud2FrZWxvY2tfID0gbmV3IFdha2VMb2NrKCk7XG59XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RnJhbWVEYXRhID0gZnVuY3Rpb24oZnJhbWVEYXRhKSB7XG4gIC8vIFRPRE86IFRlY2huaWNhbGx5IHRoaXMgc2hvdWxkIHJldGFpbiBpdCdzIHZhbHVlIGZvciB0aGUgZHVyYXRpb24gb2YgYSBmcmFtZVxuICAvLyBidXQgSSBkb3VidCB0aGF0J3MgcHJhY3RpY2FsIHRvIGRvIGluIGphdmFzY3JpcHQuXG4gIHJldHVybiBVdGlsLmZyYW1lRGF0YUZyb21Qb3NlKGZyYW1lRGF0YSwgdGhpcy5nZXRQb3NlKCksIHRoaXMpO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRPRE86IFRlY2huaWNhbGx5IHRoaXMgc2hvdWxkIHJldGFpbiBpdCdzIHZhbHVlIGZvciB0aGUgZHVyYXRpb24gb2YgYSBmcmFtZVxuICAvLyBidXQgSSBkb3VidCB0aGF0J3MgcHJhY3RpY2FsIHRvIGRvIGluIGphdmFzY3JpcHQuXG4gIHJldHVybiB0aGlzLmdldEltbWVkaWF0ZVBvc2UoKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGlkKSB7XG4gIHJldHVybiB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS53cmFwRm9yRnVsbHNjcmVlbiA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgLy8gRG9uJ3Qgd3JhcCBpbiBpT1MuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuICBpZiAoIXRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKSB7XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgY3NzUHJvcGVydGllcyA9IFtcbiAgICAgICdoZWlnaHQ6ICcgKyBNYXRoLm1pbihzY3JlZW4uaGVpZ2h0LCBzY3JlZW4ud2lkdGgpICsgJ3B4ICFpbXBvcnRhbnQnLFxuICAgICAgJ3RvcDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdsZWZ0OiAwICFpbXBvcnRhbnQnLFxuICAgICAgJ3JpZ2h0OiAwICFpbXBvcnRhbnQnLFxuICAgICAgJ2JvcmRlcjogMCcsXG4gICAgICAnbWFyZ2luOiAwJyxcbiAgICAgICdwYWRkaW5nOiAwJyxcbiAgICAgICd6LWluZGV4OiA5OTk5OTkgIWltcG9ydGFudCcsXG4gICAgICAncG9zaXRpb246IGZpeGVkJyxcbiAgICBdO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmNsYXNzTGlzdC5hZGQoJ3dlYnZyLXBvbHlmaWxsLWZ1bGxzY3JlZW4td3JhcHBlcicpO1xuICB9XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID09IGVsZW1lbnQpIHtcbiAgICByZXR1cm4gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl87XG4gIH1cblxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgYXBwbGllZCB3cmFwcGVyc1xuICB0aGlzLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBlbGVtZW50O1xuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8ucGFyZW50RWxlbWVudDtcbiAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8sIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmZpcnN0Q2hpbGQpO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8uZ2V0QXR0cmlidXRlKCdzdHlsZScpO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgZnVuY3Rpb24gYXBwbHlGdWxsc2NyZWVuRWxlbWVudFN0eWxlKCkge1xuICAgIGlmICghc2VsZi5mdWxsc2NyZWVuRWxlbWVudF8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY3NzUHJvcGVydGllcyA9IFtcbiAgICAgICdwb3NpdGlvbjogYWJzb2x1dGUnLFxuICAgICAgJ3RvcDogMCcsXG4gICAgICAnbGVmdDogMCcsXG4gICAgICAnd2lkdGg6ICcgKyBNYXRoLm1heChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpICsgJ3B4JyxcbiAgICAgICdoZWlnaHQ6ICcgKyBNYXRoLm1pbihzY3JlZW4uaGVpZ2h0LCBzY3JlZW4ud2lkdGgpICsgJ3B4JyxcbiAgICAgICdib3JkZXI6IDAnLFxuICAgICAgJ21hcmdpbjogMCcsXG4gICAgICAncGFkZGluZzogMCcsXG4gICAgXTtcbiAgICBzZWxmLmZ1bGxzY3JlZW5FbGVtZW50Xy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcbiAgfVxuXG4gIGFwcGx5RnVsbHNjcmVlbkVsZW1lbnRTdHlsZSgpO1xuXG4gIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Xykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBlbGVtZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF87XG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfKSB7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyk7XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ3N0eWxlJyk7XG4gIH1cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50Q2FjaGVkU3R5bGVfID0gbnVsbDtcblxuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8ucGFyZW50RWxlbWVudDtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8ucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gIHBhcmVudC5pbnNlcnRCZWZvcmUoZWxlbWVudCwgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8pO1xuXG4gIHJldHVybiBlbGVtZW50O1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZXF1ZXN0UHJlc2VudCA9IGZ1bmN0aW9uKGxheWVycykge1xuICB2YXIgd2FzUHJlc2VudGluZyA9IHRoaXMuaXNQcmVzZW50aW5nO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgaWYgKCEobGF5ZXJzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgaWYgKCFoYXNTaG93RGVwcmVjYXRpb25XYXJuaW5nKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJVc2luZyBhIGRlcHJlY2F0ZWQgZm9ybSBvZiByZXF1ZXN0UHJlc2VudC4gU2hvdWxkIHBhc3MgaW4gYW4gYXJyYXkgb2YgVlJMYXllcnMuXCIpO1xuICAgICAgaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZyA9IHRydWU7XG4gICAgfVxuICAgIGxheWVycyA9IFtsYXllcnNdO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGlmICghc2VsZi5jYXBhYmlsaXRpZXMuY2FuUHJlc2VudCkge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignVlJEaXNwbGF5IGlzIG5vdCBjYXBhYmxlIG9mIHByZXNlbnRpbmcuJykpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChsYXllcnMubGVuZ3RoID09IDAgfHwgbGF5ZXJzLmxlbmd0aCA+IHNlbGYuY2FwYWJpbGl0aWVzLm1heExheWVycykge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignSW52YWxpZCBudW1iZXIgb2YgbGF5ZXJzLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgaW5jb21pbmdMYXllciA9IGxheWVyc1swXTtcbiAgICBpZiAoIWluY29taW5nTGF5ZXIuc291cmNlKSB7XG4gICAgICAvKlxuICAgICAgdG9kbzogZmlndXJlIG91dCB0aGUgY29ycmVjdCBiZWhhdmlvciBpZiB0aGUgc291cmNlIGlzIG5vdCBwcm92aWRlZC5cbiAgICAgIHNlZSBodHRwczovL2dpdGh1Yi5jb20vdzNjL3dlYnZyL2lzc3Vlcy81OFxuICAgICAgKi9cbiAgICAgIHJlc29sdmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbGVmdEJvdW5kcyA9IGluY29taW5nTGF5ZXIubGVmdEJvdW5kcyB8fCBkZWZhdWx0TGVmdEJvdW5kcztcbiAgICB2YXIgcmlnaHRCb3VuZHMgPSBpbmNvbWluZ0xheWVyLnJpZ2h0Qm91bmRzIHx8IGRlZmF1bHRSaWdodEJvdW5kcztcbiAgICBpZiAod2FzUHJlc2VudGluZykge1xuICAgICAgLy8gQWxyZWFkeSBwcmVzZW50aW5nLCBqdXN0IGNoYW5naW5nIGNvbmZpZ3VyYXRpb25cbiAgICAgIHZhciBsYXllciA9IHNlbGYubGF5ZXJfO1xuICAgICAgaWYgKGxheWVyLnNvdXJjZSAhPT0gaW5jb21pbmdMYXllci5zb3VyY2UpIHtcbiAgICAgICAgbGF5ZXIuc291cmNlID0gaW5jb21pbmdMYXllci5zb3VyY2U7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgIGlmIChsYXllci5sZWZ0Qm91bmRzW2ldICE9PSBsZWZ0Qm91bmRzW2ldKSB7XG4gICAgICAgICAgbGF5ZXIubGVmdEJvdW5kc1tpXSA9IGxlZnRCb3VuZHNbaV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxheWVyLnJpZ2h0Qm91bmRzW2ldICE9PSByaWdodEJvdW5kc1tpXSkge1xuICAgICAgICAgIGxheWVyLnJpZ2h0Qm91bmRzW2ldID0gcmlnaHRCb3VuZHNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdhcyBub3QgYWxyZWFkeSBwcmVzZW50aW5nLlxuICAgIHNlbGYubGF5ZXJfID0ge1xuICAgICAgcHJlZGlzdG9ydGVkOiBpbmNvbWluZ0xheWVyLnByZWRpc3RvcnRlZCxcbiAgICAgIHNvdXJjZTogaW5jb21pbmdMYXllci5zb3VyY2UsXG4gICAgICBsZWZ0Qm91bmRzOiBsZWZ0Qm91bmRzLnNsaWNlKDApLFxuICAgICAgcmlnaHRCb3VuZHM6IHJpZ2h0Qm91bmRzLnNsaWNlKDApXG4gICAgfTtcblxuICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgaWYgKHNlbGYubGF5ZXJfICYmIHNlbGYubGF5ZXJfLnNvdXJjZSkge1xuICAgICAgdmFyIGZ1bGxzY3JlZW5FbGVtZW50ID0gc2VsZi53cmFwRm9yRnVsbHNjcmVlbihzZWxmLmxheWVyXy5zb3VyY2UpO1xuXG4gICAgICBmdW5jdGlvbiBvbkZ1bGxzY3JlZW5DaGFuZ2UoKSB7XG4gICAgICAgIHZhciBhY3R1YWxGdWxsc2NyZWVuRWxlbWVudCA9IFV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQoKTtcblxuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IChmdWxsc2NyZWVuRWxlbWVudCA9PT0gYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQpO1xuICAgICAgICBpZiAoc2VsZi5pc1ByZXNlbnRpbmcpIHtcbiAgICAgICAgICBpZiAoc2NyZWVuLm9yaWVudGF0aW9uICYmIHNjcmVlbi5vcmllbnRhdGlvbi5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24ubG9jaygnbGFuZHNjYXBlLXByaW1hcnknKS5jYXRjaChmdW5jdGlvbihlcnJvcil7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NjcmVlbi5vcmllbnRhdGlvbi5sb2NrKCkgZmFpbGVkIGR1ZSB0bycsIGVycm9yLm1lc3NhZ2UpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSBmYWxzZTtcbiAgICAgICAgICBzZWxmLmJlZ2luUHJlc2VudF8oKTtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKSB7XG4gICAgICAgICAgICBzY3JlZW4ub3JpZW50YXRpb24udW5sb2NrKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcbiAgICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgICAgc2VsZi5lbmRQcmVzZW50XygpO1xuICAgICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gb25GdWxsc2NyZWVuRXJyb3IoKSB7XG4gICAgICAgIGlmICghc2VsZi53YWl0aW5nRm9yUHJlc2VudF8pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZWxlYXNlKCk7XG4gICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gZmFsc2U7XG5cbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVW5hYmxlIHRvIHByZXNlbnQuJykpO1xuICAgICAgfVxuXG4gICAgICBzZWxmLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfKGZ1bGxzY3JlZW5FbGVtZW50LFxuICAgICAgICAgIG9uRnVsbHNjcmVlbkNoYW5nZSwgb25GdWxsc2NyZWVuRXJyb3IpO1xuXG4gICAgICBpZiAoVXRpbC5yZXF1ZXN0RnVsbHNjcmVlbihmdWxsc2NyZWVuRWxlbWVudCkpIHtcbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgICAgICAvLyAqc2lnaCogSnVzdCBmYWtlIGl0LlxuICAgICAgICBzZWxmLndha2Vsb2NrXy5yZXF1ZXN0KCk7XG4gICAgICAgIHNlbGYuaXNQcmVzZW50aW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfICYmICFVdGlsLmlzSU9TKCkpIHtcbiAgICAgIFV0aWwuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5leGl0UHJlc2VudCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2FzUHJlc2VudGluZyA9IHRoaXMuaXNQcmVzZW50aW5nO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcbiAgdGhpcy53YWtlbG9ja18ucmVsZWFzZSgpO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAod2FzUHJlc2VudGluZykge1xuICAgICAgaWYgKCFVdGlsLmV4aXRGdWxsc2NyZWVuKCkgJiYgVXRpbC5pc0lPUygpKSB7XG4gICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdXYXMgbm90IHByZXNlbnRpbmcgdG8gVlJEaXNwbGF5LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRMYXllcnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubGF5ZXJfKSB7XG4gICAgcmV0dXJuIFt0aGlzLmxheWVyX107XG4gIH1cbiAgcmV0dXJuIFtdO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywge2RldGFpbDoge2Rpc3BsYXk6IHRoaXN9fSk7XG4gIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYWRkRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbihlbGVtZW50LCBjaGFuZ2VIYW5kbGVyLCBlcnJvckhhbmRsZXIpIHtcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXygpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XyA9IGVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfID0gY2hhbmdlSGFuZGxlcjtcbiAgdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXyA9IGVycm9ySGFuZGxlcjtcblxuICBpZiAoY2hhbmdlSGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGVycm9ySGFuZGxlcikge1xuICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbiAgfVxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF87XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfKSB7XG4gICAgdmFyIGNoYW5nZUhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXykge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3Igd2hlbiBwcmVzZW50YXRpb24gYmVnaW5zLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5lbmRQcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGVuZHMuXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIGZvciBmcmFtZSBzdWJtaXNzaW9uLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gcmV0dXJuIGFjY3VyYXRlIGV5ZSBwYXJhbWV0ZXJzIGlmIGNhblByZXNlbnQgaXMgdHJ1ZS5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKlxuICogRGVwcmVjYXRlZCBjbGFzc2VzXG4gKi9cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBWUkRldmljZSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gJ3dlYnZyLXBvbHlmaWxsIGhhcmR3YXJlVW5pdElkJztcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VJZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VOYW1lJztcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIEhNRCBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gSE1EVlJEZXZpY2UoKSB7XG59XG5ITURWUkRldmljZS5wcm90b3R5cGUgPSBuZXcgVlJEZXZpY2UoKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIHBvc2l0aW9uIHNlbnNvciBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gUG9zaXRpb25TZW5zb3JWUkRldmljZSgpIHtcbn1cblBvc2l0aW9uU2Vuc29yVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbm1vZHVsZS5leHBvcnRzLlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG5tb2R1bGUuZXhwb3J0cy5WUkRpc3BsYXkgPSBWUkRpc3BsYXk7XG5tb2R1bGUuZXhwb3J0cy5WUkRldmljZSA9IFZSRGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuSE1EVlJEZXZpY2UgPSBITURWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSBQb3NpdGlvblNlbnNvclZSRGV2aWNlO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIENhcmRib2FyZFVJID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtdWkuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IHJlcXVpcmUoJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciBkaXN0b3J0aW9uVlMgPSBbXG4gICdhdHRyaWJ1dGUgdmVjMiBwb3NpdGlvbjsnLFxuICAnYXR0cmlidXRlIHZlYzMgdGV4Q29vcmQ7JyxcblxuICAndmFyeWluZyB2ZWMyIHZUZXhDb29yZDsnLFxuXG4gICd1bmlmb3JtIHZlYzQgdmlld3BvcnRPZmZzZXRTY2FsZVsyXTsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgdmVjNCB2aWV3cG9ydCA9IHZpZXdwb3J0T2Zmc2V0U2NhbGVbaW50KHRleENvb3JkLnopXTsnLFxuICAnICB2VGV4Q29vcmQgPSAodGV4Q29vcmQueHkgKiB2aWV3cG9ydC56dykgKyB2aWV3cG9ydC54eTsnLFxuICAnICBnbF9Qb3NpdGlvbiA9IHZlYzQoIHBvc2l0aW9uLCAxLjAsIDEuMCApOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbnZhciBkaXN0b3J0aW9uRlMgPSBbXG4gICdwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDsnLFxuICAndW5pZm9ybSBzYW1wbGVyMkQgZGlmZnVzZTsnLFxuXG4gICd2YXJ5aW5nIHZlYzIgdlRleENvb3JkOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICBnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQoZGlmZnVzZSwgdlRleENvb3JkKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG4vKipcbiAqIEEgbWVzaC1iYXNlZCBkaXN0b3J0ZXIuXG4gKi9cbmZ1bmN0aW9uIENhcmRib2FyZERpc3RvcnRlcihnbCkge1xuICB0aGlzLmdsID0gZ2w7XG4gIHRoaXMuY3R4QXR0cmlicyA9IGdsLmdldENvbnRleHRBdHRyaWJ1dGVzKCk7XG5cbiAgdGhpcy5tZXNoV2lkdGggPSAyMDtcbiAgdGhpcy5tZXNoSGVpZ2h0ID0gMjA7XG5cbiAgdGhpcy5idWZmZXJTY2FsZSA9IFdlYlZSQ29uZmlnLkJVRkZFUl9TQ0FMRTtcblxuICB0aGlzLmJ1ZmZlcldpZHRoID0gZ2wuZHJhd2luZ0J1ZmZlcldpZHRoO1xuICB0aGlzLmJ1ZmZlckhlaWdodCA9IGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQ7XG5cbiAgLy8gUGF0Y2hpbmcgc3VwcG9ydFxuICB0aGlzLnJlYWxCaW5kRnJhbWVidWZmZXIgPSBnbC5iaW5kRnJhbWVidWZmZXI7XG4gIHRoaXMucmVhbEVuYWJsZSA9IGdsLmVuYWJsZTtcbiAgdGhpcy5yZWFsRGlzYWJsZSA9IGdsLmRpc2FibGU7XG4gIHRoaXMucmVhbENvbG9yTWFzayA9IGdsLmNvbG9yTWFzaztcbiAgdGhpcy5yZWFsQ2xlYXJDb2xvciA9IGdsLmNsZWFyQ29sb3I7XG4gIHRoaXMucmVhbFZpZXdwb3J0ID0gZ2wudmlld3BvcnQ7XG5cbiAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLnJlYWxDYW52YXNXaWR0aCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2wuY2FudmFzLl9fcHJvdG9fXywgJ3dpZHRoJyk7XG4gICAgdGhpcy5yZWFsQ2FudmFzSGVpZ2h0ID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbC5jYW52YXMuX19wcm90b19fLCAnaGVpZ2h0Jyk7XG4gIH1cblxuICB0aGlzLmlzUGF0Y2hlZCA9IGZhbHNlO1xuXG4gIC8vIFN0YXRlIHRyYWNraW5nXG4gIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBudWxsO1xuICB0aGlzLmN1bGxGYWNlID0gZmFsc2U7XG4gIHRoaXMuZGVwdGhUZXN0ID0gZmFsc2U7XG4gIHRoaXMuYmxlbmQgPSBmYWxzZTtcbiAgdGhpcy5zY2lzc29yVGVzdCA9IGZhbHNlO1xuICB0aGlzLnN0ZW5jaWxUZXN0ID0gZmFsc2U7XG4gIHRoaXMudmlld3BvcnQgPSBbMCwgMCwgMCwgMF07XG4gIHRoaXMuY29sb3JNYXNrID0gW3RydWUsIHRydWUsIHRydWUsIHRydWVdO1xuICB0aGlzLmNsZWFyQ29sb3IgPSBbMCwgMCwgMCwgMF07XG5cbiAgdGhpcy5hdHRyaWJzID0ge1xuICAgIHBvc2l0aW9uOiAwLFxuICAgIHRleENvb3JkOiAxXG4gIH07XG4gIHRoaXMucHJvZ3JhbSA9IFV0aWwubGlua1Byb2dyYW0oZ2wsIGRpc3RvcnRpb25WUywgZGlzdG9ydGlvbkZTLCB0aGlzLmF0dHJpYnMpO1xuICB0aGlzLnVuaWZvcm1zID0gVXRpbC5nZXRQcm9ncmFtVW5pZm9ybXMoZ2wsIHRoaXMucHJvZ3JhbSk7XG5cbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlID0gbmV3IEZsb2F0MzJBcnJheSg4KTtcbiAgdGhpcy5zZXRUZXh0dXJlQm91bmRzKCk7XG5cbiAgdGhpcy52ZXJ0ZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgdGhpcy5pbmRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmluZGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucmVuZGVyVGFyZ2V0ID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuICB0aGlzLmZyYW1lYnVmZmVyID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcblxuICB0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuZGVwdGhCdWZmZXIgPSBudWxsO1xuICB0aGlzLnN0ZW5jaWxCdWZmZXIgPSBudWxsO1xuXG4gIGlmICh0aGlzLmN0eEF0dHJpYnMuZGVwdGggJiYgdGhpcy5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICB0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICB9IGVsc2UgaWYgKHRoaXMuY3R4QXR0cmlicy5kZXB0aCkge1xuICAgIHRoaXMuZGVwdGhCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgIHRoaXMuc3RlbmNpbEJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICB9XG5cbiAgdGhpcy5wYXRjaCgpO1xuXG4gIHRoaXMub25SZXNpemUoKTtcblxuICBpZiAoIVdlYlZSQ29uZmlnLkNBUkRCT0FSRF9VSV9ESVNBQkxFRCkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkgPSBuZXcgQ2FyZGJvYXJkVUkoZ2wpO1xuICB9XG59O1xuXG4vKipcbiAqIFRlYXJzIGRvd24gYWxsIHRoZSByZXNvdXJjZXMgY3JlYXRlZCBieSB0aGUgZGlzdG9ydGVyIGFuZCByZW1vdmVzIGFueVxuICogcGF0Y2hlcy5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgdGhpcy51bnBhdGNoKCk7XG5cbiAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy5pbmRleEJ1ZmZlcik7XG4gIGdsLmRlbGV0ZVRleHR1cmUodGhpcy5yZW5kZXJUYXJnZXQpO1xuICBnbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmZyYW1lYnVmZmVyKTtcbiAgaWYgKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5kZXB0aEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmRlcHRoQnVmZmVyKTtcbiAgfVxuICBpZiAodGhpcy5zdGVuY2lsQnVmZmVyKSB7XG4gICAgZ2wuZGVsZXRlUmVuZGVyYnVmZmVyKHRoaXMuc3RlbmNpbEJ1ZmZlcik7XG4gIH1cblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSSkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkuZGVzdHJveSgpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUmVzaXplcyB0aGUgYmFja2J1ZmZlciB0byBtYXRjaCB0aGUgY2FudmFzIHdpZHRoIGFuZCBoZWlnaHQuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLlJFTkRFUkJVRkZFUl9CSU5ESU5HLFxuICAgIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTBcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIEJpbmQgcmVhbCBiYWNrYnVmZmVyIGFuZCBjbGVhciBpdCBvbmNlLiBXZSBkb24ndCBuZWVkIHRvIGNsZWFyIGl0IGFnYWluXG4gICAgLy8gYWZ0ZXIgdGhhdCBiZWNhdXNlIHdlJ3JlIG92ZXJ3cml0aW5nIHRoZSBzYW1lIGFyZWEgZXZlcnkgZnJhbWUuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIFB1dCB0aGluZ3MgaW4gYSBnb29kIHN0YXRlXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcblxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuXG4gICAgLy8gTm93IGJpbmQgYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmZyYW1lYnVmZmVyKTtcblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0KTtcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsXG4gICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0LCAwLFxuICAgICAgICBzZWxmLmN0eEF0dHJpYnMuYWxwaGEgPyBnbC5SR0JBIDogZ2wuUkdCLCBnbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0LCAwKTtcblxuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGggJiYgc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsXG4gICAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQpO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5TVEVOQ0lMX0lOREVYOCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgY29uc29sZS5lcnJvcignRnJhbWVidWZmZXIgaW5jb21wbGV0ZSEnKTtcbiAgICB9XG5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cblxuICAgIHNlbGYucmVhbENvbG9yTWFzay5hcHBseShnbCwgc2VsZi5jb2xvck1hc2spO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmFwcGx5KGdsLCBzZWxmLnZpZXdwb3J0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmFwcGx5KGdsLCBzZWxmLmNsZWFyQ29sb3IpO1xuICB9KTtcblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSSkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkub25SZXNpemUoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc1BhdGNoZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIGNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG4gICAgY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ3dpZHRoJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlcldpZHRoO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCA9IHZhbHVlO1xuICAgICAgICBzZWxmLnJlYWxDYW52YXNXaWR0aC5zZXQuY2FsbChjYW52YXMsIHZhbHVlKTtcbiAgICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ2hlaWdodCcsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5idWZmZXJIZWlnaHQ7XG4gICAgICB9LFxuICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBzZWxmLmJ1ZmZlckhlaWdodCA9IHZhbHVlO1xuICAgICAgICBzZWxmLnJlYWxDYW52YXNIZWlnaHQuc2V0LmNhbGwoY2FudmFzLCB2YWx1ZSk7XG4gICAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuRlJBTUVCVUZGRVJfQklORElORyk7XG5cbiAgaWYgKHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPT0gbnVsbCkge1xuICAgIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSB0aGlzLmZyYW1lYnVmZmVyO1xuICAgIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZyYW1lYnVmZmVyKTtcbiAgfVxuXG4gIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyID0gZnVuY3Rpb24odGFyZ2V0LCBmcmFtZWJ1ZmZlcikge1xuICAgIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBmcmFtZWJ1ZmZlciA/IGZyYW1lYnVmZmVyIDogc2VsZi5mcmFtZWJ1ZmZlcjtcbiAgICAvLyBTaWxlbnRseSBtYWtlIGNhbGxzIHRvIGJpbmQgdGhlIGRlZmF1bHQgZnJhbWVidWZmZXIgYmluZCBvdXJzIGluc3RlYWQuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIHRhcmdldCwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG4gIH07XG5cbiAgdGhpcy5jdWxsRmFjZSA9IGdsLmdldFBhcmFtZXRlcihnbC5DVUxMX0ZBQ0UpO1xuICB0aGlzLmRlcHRoVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5ERVBUSF9URVNUKTtcbiAgdGhpcy5ibGVuZCA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORCk7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU0NJU1NPUl9URVNUKTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX1RFU1QpO1xuXG4gIGdsLmVuYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDogc2VsZi5kZXB0aFRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNURU5DSUxfVEVTVDogc2VsZi5zdGVuY2lsVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIGdsLmRpc2FibGUgPSBmdW5jdGlvbihwbmFtZSkge1xuICAgIHN3aXRjaCAocG5hbWUpIHtcbiAgICAgIGNhc2UgZ2wuQ1VMTF9GQUNFOiBzZWxmLmN1bGxGYWNlID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDogc2VsZi5zY2lzc29yVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIHBuYW1lKTtcbiAgfTtcblxuICB0aGlzLmNvbG9yTWFzayA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9XUklURU1BU0spO1xuICBnbC5jb2xvck1hc2sgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jb2xvck1hc2tbMF0gPSByO1xuICAgIHNlbGYuY29sb3JNYXNrWzFdID0gZztcbiAgICBzZWxmLmNvbG9yTWFza1syXSA9IGI7XG4gICAgc2VsZi5jb2xvck1hc2tbM10gPSBhO1xuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLmNsZWFyQ29sb3IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09MT1JfQ0xFQVJfVkFMVUUpO1xuICBnbC5jbGVhckNvbG9yID0gZnVuY3Rpb24ociwgZywgYiwgYSkge1xuICAgIHNlbGYuY2xlYXJDb2xvclswXSA9IHI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzFdID0gZztcbiAgICBzZWxmLmNsZWFyQ29sb3JbMl0gPSBiO1xuICAgIHNlbGYuY2xlYXJDb2xvclszXSA9IGE7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLnZpZXdwb3J0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlZJRVdQT1JUKTtcbiAgZ2wudmlld3BvcnQgPSBmdW5jdGlvbih4LCB5LCB3LCBoKSB7XG4gICAgc2VsZi52aWV3cG9ydFswXSA9IHg7XG4gICAgc2VsZi52aWV3cG9ydFsxXSA9IHk7XG4gICAgc2VsZi52aWV3cG9ydFsyXSA9IHc7XG4gICAgc2VsZi52aWV3cG9ydFszXSA9IGg7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgeCwgeSwgdywgaCk7XG4gIH07XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSB0cnVlO1xuICBVdGlsLnNhZmFyaUNzc1NpemVXb3JrYXJvdW5kKGNhbnZhcyk7XG59O1xuXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnVucGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmlzUGF0Y2hlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICd3aWR0aCcsIHRoaXMucmVhbENhbnZhc1dpZHRoKTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0JywgdGhpcy5yZWFsQ2FudmFzSGVpZ2h0KTtcbiAgfVxuICBjYW52YXMud2lkdGggPSB0aGlzLmJ1ZmZlcldpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gdGhpcy5idWZmZXJIZWlnaHQ7XG5cbiAgZ2wuYmluZEZyYW1lYnVmZmVyID0gdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyO1xuICBnbC5lbmFibGUgPSB0aGlzLnJlYWxFbmFibGU7XG4gIGdsLmRpc2FibGUgPSB0aGlzLnJlYWxEaXNhYmxlO1xuICBnbC5jb2xvck1hc2sgPSB0aGlzLnJlYWxDb2xvck1hc2s7XG4gIGdsLmNsZWFyQ29sb3IgPSB0aGlzLnJlYWxDbGVhckNvbG9yO1xuICBnbC52aWV3cG9ydCA9IHRoaXMucmVhbFZpZXdwb3J0O1xuXG4gIC8vIENoZWNrIHRvIHNlZSBpZiBvdXIgZmFrZSBiYWNrYnVmZmVyIGlzIGJvdW5kIGFuZCBiaW5kIHRoZSByZWFsIGJhY2tidWZmZXJcbiAgLy8gaWYgdGhhdCdzIHRoZSBjYXNlLlxuICBpZiAodGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9PSB0aGlzLmZyYW1lYnVmZmVyKSB7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBVdGlsLnNhZmFyaUNzc1NpemVXb3JrYXJvdW5kKGNhbnZhcyk7XG4gIH0sIDEpO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zZXRUZXh0dXJlQm91bmRzID0gZnVuY3Rpb24obGVmdEJvdW5kcywgcmlnaHRCb3VuZHMpIHtcbiAgaWYgKCFsZWZ0Qm91bmRzKSB7XG4gICAgbGVmdEJvdW5kcyA9IFswLCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgaWYgKCFyaWdodEJvdW5kcykge1xuICAgIHJpZ2h0Qm91bmRzID0gWzAuNSwgMCwgMC41LCAxXTtcbiAgfVxuXG4gIC8vIExlZnQgZXllXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVswXSA9IGxlZnRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzFdID0gbGVmdEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMl0gPSBsZWZ0Qm91bmRzWzJdOyAvLyBXaWR0aFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbM10gPSBsZWZ0Qm91bmRzWzNdOyAvLyBIZWlnaHRcblxuICAvLyBSaWdodCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzRdID0gcmlnaHRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzVdID0gcmlnaHRCb3VuZHNbMV07IC8vIFlcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzZdID0gcmlnaHRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs3XSA9IHJpZ2h0Qm91bmRzWzNdOyAvLyBIZWlnaHRcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW107XG5cbiAgaWYgKCFXZWJWUkNvbmZpZy5ESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1MpIHtcbiAgICBnbFN0YXRlLnB1c2goXG4gICAgICBnbC5DVVJSRU5UX1BST0dSQU0sXG4gICAgICBnbC5BUlJBWV9CVUZGRVJfQklORElORyxcbiAgICAgIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gICAgICBnbC5URVhUVVJFX0JJTkRJTkdfMkQsIGdsLlRFWFRVUkUwXG4gICAgKTtcbiAgfVxuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCB0aGUgcmVhbCBkZWZhdWx0IGZyYW1lYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgR0wgc3RhdGUgaXMgaW4gYSBnb29kIHBsYWNlXG4gICAgaWYgKHNlbGYuY3VsbEZhY2UpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5DVUxMX0ZBQ0UpOyB9XG4gICAgaWYgKHNlbGYuZGVwdGhUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkJMRU5EKTsgfVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIGlmIChzZWxmLnN0ZW5jaWxUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCAwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gICAgLy8gSWYgdGhlIGJhY2tidWZmZXIgaGFzIGFuIGFscGhhIGNoYW5uZWwgY2xlYXIgZXZlcnkgZnJhbWUgc28gdGhlIHBhZ2VcbiAgICAvLyBkb2Vzbid0IHNob3cgdGhyb3VnaC5cbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmFscGhhIHx8IFV0aWwuaXNJT1MoKSkge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gICAgZ2wudXNlUHJvZ3JhbShzZWxmLnByb2dyYW0pO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNlbGYuYXR0cmlicy5wb3NpdGlvbik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2VsZi5hdHRyaWJzLnRleENvb3JkKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNlbGYuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgMCk7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzZWxmLmF0dHJpYnMudGV4Q29vcmQsIDMsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDgpO1xuXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gICAgZ2wudW5pZm9ybTFpKHNlbGYudW5pZm9ybXMuZGlmZnVzZSwgMCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuXG4gICAgZ2wudW5pZm9ybTRmdihzZWxmLnVuaWZvcm1zLnZpZXdwb3J0T2Zmc2V0U2NhbGUsIHNlbGYudmlld3BvcnRPZmZzZXRTY2FsZSk7XG5cbiAgICAvLyBEcmF3cyBib3RoIGV5ZXNcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBzZWxmLmluZGV4Q291bnQsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcblxuICAgIGlmIChzZWxmLmNhcmRib2FyZFVJKSB7XG4gICAgICBzZWxmLmNhcmRib2FyZFVJLnJlbmRlck5vU3RhdGUoKTtcbiAgICB9XG5cbiAgICAvLyBCaW5kIHRoZSBmYWtlIGRlZmF1bHQgZnJhbWVidWZmZXIgYWdhaW5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChzZWxmLmdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5mcmFtZWJ1ZmZlcik7XG5cbiAgICAvLyBJZiBwcmVzZXJ2ZURyYXdpbmdCdWZmZXIgPT0gZmFsc2UgY2xlYXIgdGhlIGZyYW1lYnVmZmVyXG4gICAgaWYgKCFzZWxmLmN0eEF0dHJpYnMucHJlc2VydmVEcmF3aW5nQnVmZmVyKSB7XG4gICAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmNhbGwoZ2wsIDAsIDAsIDAsIDApO1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfVxuXG4gICAgaWYgKCFXZWJWUkNvbmZpZy5ESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1MpIHtcbiAgICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG4gICAgfVxuXG4gICAgLy8gUmVzdG9yZSBzdGF0ZVxuICAgIGlmIChzZWxmLmN1bGxGYWNlKSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5DVUxMX0ZBQ0UpOyB9XG4gICAgaWYgKHNlbGYuZGVwdGhUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5ERVBUSF9URVNUKTsgfVxuICAgIGlmIChzZWxmLmJsZW5kKSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5CTEVORCk7IH1cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIGlmIChzZWxmLnN0ZW5jaWxUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5TVEVOQ0lMX1RFU1QpOyB9XG5cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suYXBwbHkoZ2wsIHNlbGYuY29sb3JNYXNrKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5hcHBseShnbCwgc2VsZi52aWV3cG9ydCk7XG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5hbHBoYSB8fCAhc2VsZi5jdHhBdHRyaWJzLnByZXNlcnZlRHJhd2luZ0J1ZmZlcikge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5hcHBseShnbCwgc2VsZi5jbGVhckNvbG9yKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIFdvcmthcm91bmQgZm9yIHRoZSBmYWN0IHRoYXQgU2FmYXJpIGRvZXNuJ3QgYWxsb3cgdXMgdG8gcGF0Y2ggdGhlIGNhbnZhc1xuICAvLyB3aWR0aCBhbmQgaGVpZ2h0IGNvcnJlY3RseS4gQWZ0ZXIgZWFjaCBzdWJtaXQgZnJhbWUgY2hlY2sgdG8gc2VlIHdoYXQgdGhlXG4gIC8vIHJlYWwgYmFja2J1ZmZlciBzaXplIGhhcyBiZWVuIHNldCB0byBhbmQgcmVzaXplIHRoZSBmYWtlIGJhY2tidWZmZXIgc2l6ZVxuICAvLyB0byBtYXRjaC5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHZhciBjYW52YXMgPSBnbC5jYW52YXM7XG4gICAgaWYgKGNhbnZhcy53aWR0aCAhPSBzZWxmLmJ1ZmZlcldpZHRoIHx8IGNhbnZhcy5oZWlnaHQgIT0gc2VsZi5idWZmZXJIZWlnaHQpIHtcbiAgICAgIHNlbGYuYnVmZmVyV2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICBzZWxmLmJ1ZmZlckhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIENhbGwgd2hlbiB0aGUgZGV2aWNlSW5mbyBoYXMgY2hhbmdlZC4gQXQgdGhpcyBwb2ludCB3ZSBuZWVkXG4gKiB0byByZS1jYWxjdWxhdGUgdGhlIGRpc3RvcnRpb24gbWVzaC5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS51cGRhdGVEZXZpY2VJbmZvID0gZnVuY3Rpb24oZGV2aWNlSW5mbykge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkddO1xuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IHNlbGYuY29tcHV0ZU1lc2hWZXJ0aWNlc18oc2VsZi5tZXNoV2lkdGgsIHNlbGYubWVzaEhlaWdodCwgZGV2aWNlSW5mbyk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNlbGYudmVydGV4QnVmZmVyKTtcbiAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdmVydGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcblxuICAgIC8vIEluZGljZXMgZG9uJ3QgY2hhbmdlIGJhc2VkIG9uIGRldmljZSBwYXJhbWV0ZXJzLCBzbyBvbmx5IGNvbXB1dGUgb25jZS5cbiAgICBpZiAoIXNlbGYuaW5kZXhDb3VudCkge1xuICAgICAgdmFyIGluZGljZXMgPSBzZWxmLmNvbXB1dGVNZXNoSW5kaWNlc18oc2VsZi5tZXNoV2lkdGgsIHNlbGYubWVzaEhlaWdodCk7XG4gICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBzZWxmLmluZGV4QnVmZmVyKTtcbiAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGluZGljZXMsIGdsLlNUQVRJQ19EUkFXKTtcbiAgICAgIHNlbGYuaW5kZXhDb3VudCA9IGluZGljZXMubGVuZ3RoO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHRoZSBkaXN0b3J0aW9uIG1lc2ggdmVydGljZXMuXG4gKiBCYXNlZCBvbiBjb2RlIGZyb20gdGhlIFVuaXR5IGNhcmRib2FyZCBwbHVnaW4uXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuY29tcHV0ZU1lc2hWZXJ0aWNlc18gPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBkZXZpY2VJbmZvKSB7XG4gIHZhciB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkoMiAqIHdpZHRoICogaGVpZ2h0ICogNSk7XG5cbiAgdmFyIGxlbnNGcnVzdHVtID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllVmlzaWJsZVRhbkFuZ2xlcygpO1xuICB2YXIgbm9MZW5zRnJ1c3R1bSA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZU5vTGVuc1RhbkFuZ2xlcygpO1xuICB2YXIgdmlld3BvcnQgPSBkZXZpY2VJbmZvLmdldExlZnRFeWVWaXNpYmxlU2NyZWVuUmVjdChub0xlbnNGcnVzdHVtKTtcbiAgdmFyIHZpZHggPSAwO1xuICB2YXIgaWlkeCA9IDA7XG4gIGZvciAodmFyIGUgPSAwOyBlIDwgMjsgZSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWR0aDsgaSsrLCB2aWR4KyspIHtcbiAgICAgICAgdmFyIHUgPSBpIC8gKHdpZHRoIC0gMSk7XG4gICAgICAgIHZhciB2ID0gaiAvIChoZWlnaHQgLSAxKTtcblxuICAgICAgICAvLyBHcmlkIHBvaW50cyByZWd1bGFybHkgc3BhY2VkIGluIFN0cmVvU2NyZWVuLCBhbmQgYmFycmVsIGRpc3RvcnRlZCBpblxuICAgICAgICAvLyB0aGUgbWVzaC5cbiAgICAgICAgdmFyIHMgPSB1O1xuICAgICAgICB2YXIgdCA9IHY7XG4gICAgICAgIHZhciB4ID0gVXRpbC5sZXJwKGxlbnNGcnVzdHVtWzBdLCBsZW5zRnJ1c3R1bVsyXSwgdSk7XG4gICAgICAgIHZhciB5ID0gVXRpbC5sZXJwKGxlbnNGcnVzdHVtWzNdLCBsZW5zRnJ1c3R1bVsxXSwgdik7XG4gICAgICAgIHZhciBkID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xuICAgICAgICB2YXIgciA9IGRldmljZUluZm8uZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShkKTtcbiAgICAgICAgdmFyIHAgPSB4ICogciAvIGQ7XG4gICAgICAgIHZhciBxID0geSAqIHIgLyBkO1xuICAgICAgICB1ID0gKHAgLSBub0xlbnNGcnVzdHVtWzBdKSAvIChub0xlbnNGcnVzdHVtWzJdIC0gbm9MZW5zRnJ1c3R1bVswXSk7XG4gICAgICAgIHYgPSAocSAtIG5vTGVuc0ZydXN0dW1bM10pIC8gKG5vTGVuc0ZydXN0dW1bMV0gLSBub0xlbnNGcnVzdHVtWzNdKTtcblxuICAgICAgICAvLyBDb252ZXJ0IHUsdiB0byBtZXNoIHNjcmVlbiBjb29yZGluYXRlcy5cbiAgICAgICAgdmFyIGFzcGVjdCA9IGRldmljZUluZm8uZGV2aWNlLndpZHRoTWV0ZXJzIC8gZGV2aWNlSW5mby5kZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuXG4gICAgICAgIC8vIEZJWE1FOiBUaGUgb3JpZ2luYWwgVW5pdHkgcGx1Z2luIG11bHRpcGxpZWQgVSBieSB0aGUgYXNwZWN0IHJhdGlvXG4gICAgICAgIC8vIGFuZCBkaWRuJ3QgbXVsdGlwbHkgZWl0aGVyIHZhbHVlIGJ5IDIsIGJ1dCB0aGF0IHNlZW1zIHRvIGdldCBpdFxuICAgICAgICAvLyByZWFsbHkgY2xvc2UgdG8gY29ycmVjdCBsb29raW5nIGZvciBtZS4gSSBoYXRlIHRoaXMga2luZCBvZiBcIkRvbid0XG4gICAgICAgIC8vIGtub3cgd2h5IGl0IHdvcmtzXCIgY29kZSB0aG91Z2gsIGFuZCB3b2xkIGxvdmUgYSBtb3JlIGxvZ2ljYWxcbiAgICAgICAgLy8gZXhwbGFuYXRpb24gb2Ygd2hhdCBuZWVkcyB0byBoYXBwZW4gaGVyZS5cbiAgICAgICAgdSA9ICh2aWV3cG9ydC54ICsgdSAqIHZpZXdwb3J0LndpZHRoIC0gMC41KSAqIDIuMDsgLy8qIGFzcGVjdDtcbiAgICAgICAgdiA9ICh2aWV3cG9ydC55ICsgdiAqIHZpZXdwb3J0LmhlaWdodCAtIDAuNSkgKiAyLjA7XG5cbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDBdID0gdTsgLy8gcG9zaXRpb24ueFxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMV0gPSB2OyAvLyBwb3NpdGlvbi55XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAyXSA9IHM7IC8vIHRleENvb3JkLnhcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDNdID0gdDsgLy8gdGV4Q29vcmQueVxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgNF0gPSBlOyAvLyB0ZXhDb29yZC56ICh2aWV3cG9ydCBpbmRleClcbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIHcgPSBsZW5zRnJ1c3R1bVsyXSAtIGxlbnNGcnVzdHVtWzBdO1xuICAgIGxlbnNGcnVzdHVtWzBdID0gLSh3ICsgbGVuc0ZydXN0dW1bMF0pO1xuICAgIGxlbnNGcnVzdHVtWzJdID0gdyAtIGxlbnNGcnVzdHVtWzJdO1xuICAgIHcgPSBub0xlbnNGcnVzdHVtWzJdIC0gbm9MZW5zRnJ1c3R1bVswXTtcbiAgICBub0xlbnNGcnVzdHVtWzBdID0gLSh3ICsgbm9MZW5zRnJ1c3R1bVswXSk7XG4gICAgbm9MZW5zRnJ1c3R1bVsyXSA9IHcgLSBub0xlbnNGcnVzdHVtWzJdO1xuICAgIHZpZXdwb3J0LnggPSAxIC0gKHZpZXdwb3J0LnggKyB2aWV3cG9ydC53aWR0aCk7XG4gIH1cbiAgcmV0dXJuIHZlcnRpY2VzO1xufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBkaXN0b3J0aW9uIG1lc2ggaW5kaWNlcy5cbiAqIEJhc2VkIG9uIGNvZGUgZnJvbSB0aGUgVW5pdHkgY2FyZGJvYXJkIHBsdWdpbi5cbiAqL1xuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5jb21wdXRlTWVzaEluZGljZXNfID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICB2YXIgaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheSgyICogKHdpZHRoIC0gMSkgKiAoaGVpZ2h0IC0gMSkgKiA2KTtcbiAgdmFyIGhhbGZ3aWR0aCA9IHdpZHRoIC8gMjtcbiAgdmFyIGhhbGZoZWlnaHQgPSBoZWlnaHQgLyAyO1xuICB2YXIgdmlkeCA9IDA7XG4gIHZhciBpaWR4ID0gMDtcbiAgZm9yICh2YXIgZSA9IDA7IGUgPCAyOyBlKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGhlaWdodDsgaisrKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdpZHRoOyBpKyssIHZpZHgrKykge1xuICAgICAgICBpZiAoaSA9PSAwIHx8IGogPT0gMClcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgLy8gQnVpbGQgYSBxdWFkLiAgTG93ZXIgcmlnaHQgYW5kIHVwcGVyIGxlZnQgcXVhZHJhbnRzIGhhdmUgcXVhZHMgd2l0aFxuICAgICAgICAvLyB0aGUgdHJpYW5nbGUgZGlhZ29uYWwgZmxpcHBlZCB0byBnZXQgdGhlIHZpZ25ldHRlIHRvIGludGVycG9sYXRlXG4gICAgICAgIC8vIGNvcnJlY3RseS5cbiAgICAgICAgaWYgKChpIDw9IGhhbGZ3aWR0aCkgPT0gKGogPD0gaGFsZmhlaWdodCkpIHtcbiAgICAgICAgICAvLyBRdWFkIGRpYWdvbmFsIGxvd2VyIGxlZnQgdG8gdXBwZXIgcmlnaHQuXG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUXVhZCBkaWFnb25hbCB1cHBlciBsZWZ0IHRvIGxvd2VyIHJpZ2h0LlxuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSB3aWR0aDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGggLSAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBpbmRpY2VzO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JfID0gZnVuY3Rpb24ocHJvdG8sIGF0dHJOYW1lKSB7XG4gIHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihwcm90bywgYXR0ck5hbWUpO1xuICAvLyBJbiBzb21lIGNhc2VzIChhaGVtLi4uIFNhZmFyaSksIHRoZSBkZXNjcmlwdG9yIHJldHVybnMgdW5kZWZpbmVkIGdldCBhbmRcbiAgLy8gc2V0IGZpZWxkcy4gSW4gdGhpcyBjYXNlLCB3ZSBuZWVkIHRvIGNyZWF0ZSBhIHN5bnRoZXRpYyBwcm9wZXJ0eVxuICAvLyBkZXNjcmlwdG9yLiBUaGlzIHdvcmtzIGFyb3VuZCBzb21lIG9mIHRoZSBpc3N1ZXMgaW5cbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2JvcmlzbXVzL3dlYnZyLXBvbHlmaWxsL2lzc3Vlcy80NlxuICBpZiAoZGVzY3JpcHRvci5nZXQgPT09IHVuZGVmaW5lZCB8fCBkZXNjcmlwdG9yLnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IHRydWU7XG4gICAgZGVzY3JpcHRvci5nZXQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgfTtcbiAgICBkZXNjcmlwdG9yLnNldCA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIHZhbCk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZGVzY3JpcHRvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkRGlzdG9ydGVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXR0xVUHJlc2VydmVHTFN0YXRlID0gcmVxdWlyZSgnLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMnKTtcblxudmFyIHVpVlMgPSBbXG4gICdhdHRyaWJ1dGUgdmVjMiBwb3NpdGlvbjsnLFxuXG4gICd1bmlmb3JtIG1hdDQgcHJvamVjdGlvbk1hdDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfUG9zaXRpb24gPSBwcm9qZWN0aW9uTWF0ICogdmVjNCggcG9zaXRpb24sIC0xLjAsIDEuMCApOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbnZhciB1aUZTID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcblxuICAndW5pZm9ybSB2ZWM0IGNvbG9yOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICBnbF9GcmFnQ29sb3IgPSBjb2xvcjsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgREVHMlJBRCA9IE1hdGguUEkvMTgwLjA7XG5cbi8vIFRoZSBnZWFyIGhhcyA2IGlkZW50aWNhbCBzZWN0aW9ucywgZWFjaCBzcGFubmluZyA2MCBkZWdyZWVzLlxudmFyIGtBbmdsZVBlckdlYXJTZWN0aW9uID0gNjA7XG5cbi8vIEhhbGYtYW5nbGUgb2YgdGhlIHNwYW4gb2YgdGhlIG91dGVyIHJpbS5cbnZhciBrT3V0ZXJSaW1FbmRBbmdsZSA9IDEyO1xuXG4vLyBBbmdsZSBiZXR3ZWVuIHRoZSBtaWRkbGUgb2YgdGhlIG91dGVyIHJpbSBhbmQgdGhlIHN0YXJ0IG9mIHRoZSBpbm5lciByaW0uXG52YXIga0lubmVyUmltQmVnaW5BbmdsZSA9IDIwO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBvdXRlciByaW0sIG5vcm1hbGl6ZWQgc28gdGhhdCB0aGUgZW50aXJlIG1vZGVsXG4vLyBmaXRzIGluIGEgWy0xLCAxXSB4IFstMSwgMV0gc3F1YXJlLlxudmFyIGtPdXRlclJhZGl1cyA9IDE7XG5cbi8vIERpc3RhbmNlIGZyb20gY2VudGVyIHRvIGRlcHJlc3NlZCByaW0sIGluIG1vZGVsIHVuaXRzLlxudmFyIGtNaWRkbGVSYWRpdXMgPSAwLjc1O1xuXG4vLyBSYWRpdXMgb2YgdGhlIGlubmVyIGhvbGxvdyBjaXJjbGUsIGluIG1vZGVsIHVuaXRzLlxudmFyIGtJbm5lclJhZGl1cyA9IDAuMzEyNTtcblxuLy8gQ2VudGVyIGxpbmUgdGhpY2tuZXNzIGluIERQLlxudmFyIGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgPSA0O1xuXG4vLyBCdXR0b24gd2lkdGggaW4gRFAuXG52YXIga0J1dHRvbldpZHRoRHAgPSAyODtcblxuLy8gRmFjdG9yIHRvIHNjYWxlIHRoZSB0b3VjaCBhcmVhIHRoYXQgcmVzcG9uZHMgdG8gdGhlIHRvdWNoLlxudmFyIGtUb3VjaFNsb3BGYWN0b3IgPSAxLjU7XG5cbnZhciBBbmdsZXMgPSBbXG4gIDAsIGtPdXRlclJpbUVuZEFuZ2xlLCBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUsXG4gIGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga091dGVyUmltRW5kQW5nbGVcbl07XG5cbi8qKlxuICogUmVuZGVycyB0aGUgYWxpZ25tZW50IGxpbmUgYW5kIFwib3B0aW9uc1wiIGdlYXIuIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgY2FudmFzXG4gKiB0aGlzIGlzIHJlbmRlcmVkIGludG8gY292ZXJzIHRoZSBlbnRpcmUgc2NyZWVuIChvciBjbG9zZSB0byBpdC4pXG4gKi9cbmZ1bmN0aW9uIENhcmRib2FyZFVJKGdsKSB7XG4gIHRoaXMuZ2wgPSBnbDtcblxuICB0aGlzLmF0dHJpYnMgPSB7XG4gICAgcG9zaXRpb246IDBcbiAgfTtcbiAgdGhpcy5wcm9ncmFtID0gVXRpbC5saW5rUHJvZ3JhbShnbCwgdWlWUywgdWlGUywgdGhpcy5hdHRyaWJzKTtcbiAgdGhpcy51bmlmb3JtcyA9IFV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zKGdsLCB0aGlzLnByb2dyYW0pO1xuXG4gIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuZ2Vhck9mZnNldCA9IDA7XG4gIHRoaXMuZ2VhclZlcnRleENvdW50ID0gMDtcbiAgdGhpcy5hcnJvd09mZnNldCA9IDA7XG4gIHRoaXMuYXJyb3dWZXJ0ZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5wcm9qTWF0ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG5cbiAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG5cbiAgdGhpcy5vblJlc2l6ZSgpO1xufTtcblxuLyoqXG4gKiBUZWFycyBkb3duIGFsbCB0aGUgcmVzb3VyY2VzIGNyZWF0ZWQgYnkgdGhlIFVJIHJlbmRlcmVyLlxuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIGlmICh0aGlzLmxpc3RlbmVyKSB7XG4gICAgZ2wuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xuICB9XG5cbiAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICBnbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbGlzdGVuZXIgdG8gY2xpY2tzIG9uIHRoZSBnZWFyIGFuZCBiYWNrIGljb25zXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5saXN0ZW4gPSBmdW5jdGlvbihvcHRpb25zQ2FsbGJhY2ssIGJhY2tDYWxsYmFjaykge1xuICB2YXIgY2FudmFzID0gdGhpcy5nbC5jYW52YXM7XG4gIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBtaWRsaW5lID0gY2FudmFzLmNsaWVudFdpZHRoIC8gMjtcbiAgICB2YXIgYnV0dG9uU2l6ZSA9IGtCdXR0b25XaWR0aERwICoga1RvdWNoU2xvcEZhY3RvcjtcbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHVzZXIgY2xpY2tlZCBvbiAob3IgYXJvdW5kKSB0aGUgZ2VhciBpY29uXG4gICAgaWYgKGV2ZW50LmNsaWVudFggPiBtaWRsaW5lIC0gYnV0dG9uU2l6ZSAmJlxuICAgICAgICBldmVudC5jbGllbnRYIDwgbWlkbGluZSArIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WSA+IGNhbnZhcy5jbGllbnRIZWlnaHQgLSBidXR0b25TaXplKSB7XG4gICAgICBvcHRpb25zQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHVzZXIgY2xpY2tlZCBvbiAob3IgYXJvdW5kKSB0aGUgYmFjayBpY29uXG4gICAgZWxzZSBpZiAoZXZlbnQuY2xpZW50WCA8IGJ1dHRvblNpemUgJiYgZXZlbnQuY2xpZW50WSA8IGJ1dHRvblNpemUpIHtcbiAgICAgIGJhY2tDYWxsYmFjayhldmVudCk7XG4gICAgfVxuICB9O1xuICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmxpc3RlbmVyLCBmYWxzZSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkcyB0aGUgVUkgbWVzaC5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLm9uUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtcbiAgICBnbC5BUlJBWV9CVUZGRVJfQklORElOR1xuICBdO1xuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgdmFyIHZlcnRpY2VzID0gW107XG5cbiAgICB2YXIgbWlkbGluZSA9IGdsLmRyYXdpbmdCdWZmZXJXaWR0aCAvIDI7XG5cbiAgICAvLyBBc3N1bWVzIHlvdXIgY2FudmFzIHdpZHRoIGFuZCBoZWlnaHQgaXMgc2NhbGVkIHByb3BvcnRpb25hdGVseS5cbiAgICAvLyBUT0RPKHNtdXMpOiBUaGUgZm9sbG93aW5nIGNhdXNlcyBidXR0b25zIHRvIGJlY29tZSBodWdlIG9uIGlPUywgYnV0IHNlZW1zXG4gICAgLy8gbGlrZSB0aGUgcmlnaHQgdGhpbmcgdG8gZG8uIEZvciBub3csIGFkZGVkIGEgaGFjay4gQnV0IHJlYWxseSwgaW52ZXN0aWdhdGUgd2h5LlxuICAgIHZhciBkcHMgPSAoZ2wuZHJhd2luZ0J1ZmZlcldpZHRoIC8gKHNjcmVlbi53aWR0aCAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvKSk7XG4gICAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICAgIGRwcyAqPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICB9XG5cbiAgICB2YXIgbGluZVdpZHRoID0ga0NlbnRlckxpbmVUaGlja25lc3NEcCAqIGRwcyAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IgKiBkcHM7XG4gICAgdmFyIGJ1dHRvblNjYWxlID0ga0J1dHRvbldpZHRoRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25Cb3JkZXIgPSAoKGtCdXR0b25XaWR0aERwICoga1RvdWNoU2xvcEZhY3RvcikgLSBrQnV0dG9uV2lkdGhEcCkgKiBkcHM7XG5cbiAgICAvLyBCdWlsZCBjZW50ZXJsaW5lXG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBidXR0b25TaXplKTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgLSBsaW5lV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lICsgbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIC8vIEJ1aWxkIGdlYXJcbiAgICBzZWxmLmdlYXJPZmZzZXQgPSAodmVydGljZXMubGVuZ3RoIC8gMik7XG5cbiAgICBmdW5jdGlvbiBhZGRHZWFyU2VnbWVudCh0aGV0YSwgcikge1xuICAgICAgdmFyIGFuZ2xlID0gKDkwIC0gdGhldGEpICogREVHMlJBRDtcbiAgICAgIHZhciB4ID0gTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgdmFyIHkgPSBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKGtJbm5lclJhZGl1cyAqIHggKiBidXR0b25TY2FsZSArIG1pZGxpbmUsIGtJbm5lclJhZGl1cyAqIHkgKiBidXR0b25TY2FsZSArIGJ1dHRvblNjYWxlKTtcbiAgICAgIHZlcnRpY2VzLnB1c2gociAqIHggKiBidXR0b25TY2FsZSArIG1pZGxpbmUsIHIgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gNjsgaSsrKSB7XG4gICAgICB2YXIgc2VnbWVudFRoZXRhID0gaSAqIGtBbmdsZVBlckdlYXJTZWN0aW9uO1xuXG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrT3V0ZXJSaW1FbmRBbmdsZSwga091dGVyUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIGtJbm5lclJpbUJlZ2luQW5nbGUsIGtNaWRkbGVSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsgKGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga0lubmVyUmltQmVnaW5BbmdsZSksIGtNaWRkbGVSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsgKGtBbmdsZVBlckdlYXJTZWN0aW9uIC0ga091dGVyUmltRW5kQW5nbGUpLCBrT3V0ZXJSYWRpdXMpO1xuICAgIH1cblxuICAgIHNlbGYuZ2VhclZlcnRleENvdW50ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpIC0gc2VsZi5nZWFyT2Zmc2V0O1xuXG4gICAgLy8gQnVpbGQgYmFjayBhcnJvd1xuICAgIHNlbGYuYXJyb3dPZmZzZXQgPSAodmVydGljZXMubGVuZ3RoIC8gMik7XG5cbiAgICBmdW5jdGlvbiBhZGRBcnJvd1ZlcnRleCh4LCB5KSB7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKGJ1dHRvbkJvcmRlciArIHgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQgLSBidXR0b25Cb3JkZXIgLSB5KTtcbiAgICB9XG5cbiAgICB2YXIgYW5nbGVkTGluZVdpZHRoID0gbGluZVdpZHRoIC8gTWF0aC5zaW4oNDUgKiBERUcyUkFEKTtcblxuICAgIGFkZEFycm93VmVydGV4KDAsIGJ1dHRvblNjYWxlKTtcbiAgICBhZGRBcnJvd1ZlcnRleChidXR0b25TY2FsZSwgMCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgsIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSArIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIGJ1dHRvblNjYWxlICogMik7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgsIChidXR0b25TY2FsZSAqIDIpIC0gYW5nbGVkTGluZVdpZHRoKTtcblxuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgLSBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KDAsIGJ1dHRvblNjYWxlKTtcblxuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSAtIGxpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoa0J1dHRvbldpZHRoRHAgKiBkcHMsIGJ1dHRvblNjYWxlICsgbGluZVdpZHRoKTtcblxuICAgIHNlbGYuYXJyb3dWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuYXJyb3dPZmZzZXQ7XG5cbiAgICAvLyBCdWZmZXIgZGF0YVxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkodmVydGljZXMpLCBnbC5TVEFUSUNfRFJBVyk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBQZXJmb3JtcyBkaXN0b3J0aW9uIHBhc3Mgb24gdGhlIGluamVjdGVkIGJhY2tidWZmZXIsIHJlbmRlcmluZyBpdCB0byB0aGUgcmVhbFxuICogYmFja2J1ZmZlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQ1VMTF9GQUNFLFxuICAgIGdsLkRFUFRIX1RFU1QsXG4gICAgZ2wuQkxFTkQsXG4gICAgZ2wuU0NJU1NPUl9URVNULFxuICAgIGdsLlNURU5DSUxfVEVTVCxcbiAgICBnbC5DT0xPUl9XUklURU1BU0ssXG4gICAgZ2wuVklFV1BPUlQsXG5cbiAgICBnbC5DVVJSRU5UX1BST0dSQU0sXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIE1ha2Ugc3VyZSB0aGUgR0wgc3RhdGUgaXMgaW4gYSBnb29kIHBsYWNlXG4gICAgZ2wuZGlzYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gICAgZ2wuZGlzYWJsZShnbC5CTEVORCk7XG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuU1RFTkNJTF9URVNUKTtcbiAgICBnbC5jb2xvck1hc2sodHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIHNlbGYucmVuZGVyTm9TdGF0ZSgpO1xuICB9KTtcbn07XG5cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXJOb1N0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgLy8gQmluZCBkaXN0b3J0aW9uIHByb2dyYW0gYW5kIG1lc2hcbiAgZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLnZlcnRleEJ1ZmZlcik7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHRoaXMuYXR0cmlicy5wb3NpdGlvbik7XG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIodGhpcy5hdHRyaWJzLnBvc2l0aW9uLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDgsIDApO1xuXG4gIGdsLnVuaWZvcm00Zih0aGlzLnVuaWZvcm1zLmNvbG9yLCAxLjAsIDEuMCwgMS4wLCAxLjApO1xuXG4gIFV0aWwub3J0aG9NYXRyaXgodGhpcy5wcm9qTWF0LCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIDAsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQsIDAuMSwgMTAyNC4wKTtcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdih0aGlzLnVuaWZvcm1zLnByb2plY3Rpb25NYXQsIGZhbHNlLCB0aGlzLnByb2pNYXQpO1xuXG4gIC8vIERyYXdzIFVJIGVsZW1lbnRcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgMCwgNCk7XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIHRoaXMuZ2Vhck9mZnNldCwgdGhpcy5nZWFyVmVydGV4Q291bnQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmFycm93T2Zmc2V0LCB0aGlzLmFycm93VmVydGV4Q291bnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmRVSTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmREaXN0b3J0ZXIgPSByZXF1aXJlKCcuL2NhcmRib2FyZC1kaXN0b3J0ZXIuanMnKTtcbnZhciBDYXJkYm9hcmRVSSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgRGV2aWNlSW5mbyA9IHJlcXVpcmUoJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBEcGRiID0gcmVxdWlyZSgnLi9kcGRiL2RwZGIuanMnKTtcbnZhciBGdXNpb25Qb3NlU2Vuc29yID0gcmVxdWlyZSgnLi9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcycpO1xudmFyIFJvdGF0ZUluc3RydWN0aW9ucyA9IHJlcXVpcmUoJy4vcm90YXRlLWluc3RydWN0aW9ucy5qcycpO1xudmFyIFZpZXdlclNlbGVjdG9yID0gcmVxdWlyZSgnLi92aWV3ZXItc2VsZWN0b3IuanMnKTtcbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG52YXIgRXllID0ge1xuICBMRUZUOiAnbGVmdCcsXG4gIFJJR0hUOiAncmlnaHQnXG59O1xuXG4vKipcbiAqIFZSRGlzcGxheSBiYXNlZCBvbiBtb2JpbGUgZGV2aWNlIHBhcmFtZXRlcnMgYW5kIERldmljZU1vdGlvbiBBUElzLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRWUkRpc3BsYXkoKSB7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnQ2FyZGJvYXJkIFZSRGlzcGxheSAod2VidnItcG9seWZpbGwpJztcblxuICB0aGlzLmNhcGFiaWxpdGllcy5oYXNPcmllbnRhdGlvbiA9IHRydWU7XG4gIHRoaXMuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQgPSB0cnVlO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMuYnVmZmVyU2NhbGVfID0gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFO1xuICB0aGlzLnBvc2VTZW5zb3JfID0gbmV3IEZ1c2lvblBvc2VTZW5zb3IoKTtcbiAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuXG4gIHRoaXMuZHBkYl8gPSBuZXcgRHBkYih0cnVlLCB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8uYmluZCh0aGlzKSk7XG4gIHRoaXMuZGV2aWNlSW5mb18gPSBuZXcgRGV2aWNlSW5mbyh0aGlzLmRwZGJfLmdldERldmljZVBhcmFtcygpKTtcblxuICB0aGlzLnZpZXdlclNlbGVjdG9yXyA9IG5ldyBWaWV3ZXJTZWxlY3RvcigpO1xuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5vbignY2hhbmdlJywgdGhpcy5vblZpZXdlckNoYW5nZWRfLmJpbmQodGhpcykpO1xuXG4gIC8vIFNldCB0aGUgY29ycmVjdCBpbml0aWFsIHZpZXdlci5cbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodGhpcy52aWV3ZXJTZWxlY3Rvcl8uZ2V0Q3VycmVudFZpZXdlcigpKTtcblxuICBpZiAoIVdlYlZSQ29uZmlnLlJPVEFURV9JTlNUUlVDVElPTlNfRElTQUJMRUQpIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18gPSBuZXcgUm90YXRlSW5zdHJ1Y3Rpb25zKCk7XG4gIH1cblxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgLy8gTGlzdGVuIGZvciByZXNpemUgZXZlbnRzIHRvIHdvcmthcm91bmQgdGhpcyBhd2Z1bCBTYWZhcmkgYnVnLlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLm9uUmVzaXplXy5iaW5kKHRoaXMpKTtcbiAgfVxufVxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZSA9IG5ldyBWUkRpc3BsYXkoKTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHRoaXMucG9zZVNlbnNvcl8uZ2V0UG9zaXRpb24oKSxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRPcmllbnRhdGlvbigpLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NlU2Vuc29yXy5yZXNldFBvc2UoKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBvZmZzZXQgPSBbdGhpcy5kZXZpY2VJbmZvXy52aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgKiAwLjUsIDAuMCwgMC4wXTtcbiAgdmFyIGZpZWxkT2ZWaWV3O1xuXG4gIC8vIFRPRE86IEZvViBjYW4gYmUgYSBsaXR0bGUgZXhwZW5zaXZlIHRvIGNvbXB1dGUuIENhY2hlIHdoZW4gZGV2aWNlIHBhcmFtcyBjaGFuZ2UuXG4gIGlmICh3aGljaEV5ZSA9PSBFeWUuTEVGVCkge1xuICAgIG9mZnNldFswXSAqPSAtMS4wO1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbiAgfSBlbHNlIGlmICh3aGljaEV5ZSA9PSBFeWUuUklHSFQpIHtcbiAgICBmaWVsZE9mVmlldyA9IHRoaXMuZGV2aWNlSW5mb18uZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZXllIHByb3ZpZGVkOiAlcycsIHdoaWNoRXllKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmllbGRPZlZpZXc6IGZpZWxkT2ZWaWV3LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIC8vIFRPRE86IFNob3VsZCBiZSBhYmxlIHRvIHByb3ZpZGUgYmV0dGVyIHZhbHVlcyB0aGFuIHRoZXNlLlxuICAgIHJlbmRlcldpZHRoOiB0aGlzLmRldmljZUluZm9fLmRldmljZS53aWR0aCAqIDAuNSAqIHRoaXMuYnVmZmVyU2NhbGVfLFxuICAgIHJlbmRlckhlaWdodDogdGhpcy5kZXZpY2VJbmZvXy5kZXZpY2UuaGVpZ2h0ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8gPSBmdW5jdGlvbihuZXdQYXJhbXMpIHtcbiAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgY29uc29sZS5sb2coJ0RQREIgcmVwb3J0ZWQgdGhhdCBkZXZpY2UgcGFyYW1zIHdlcmUgdXBkYXRlZC4nKTtcbiAgfVxuICB0aGlzLmRldmljZUluZm9fLnVwZGF0ZURldmljZVBhcmFtcyhuZXdQYXJhbXMpO1xuXG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8udXBkYXRlRGV2aWNlSW5mbyh0aGlzLmRldmljZUluZm9fKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS51cGRhdGVCb3VuZHNfID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5sYXllcl8gJiYgdGhpcy5kaXN0b3J0ZXJfICYmICh0aGlzLmxheWVyXy5sZWZ0Qm91bmRzIHx8IHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKSkge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5zZXRUZXh0dXJlQm91bmRzKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMsIHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsMicpO1xuXG4gIGlmICghZ2wpXG4gICAgcmV0dXJuOyAvLyBDYW4ndCBkbyBkaXN0b3J0aW9uIHdpdGhvdXQgYSBXZWJHTCBjb250ZXh0LlxuXG4gIC8vIFByb3ZpZGVzIGEgd2F5IHRvIG9wdCBvdXQgb2YgZGlzdG9ydGlvblxuICBpZiAodGhpcy5sYXllcl8ucHJlZGlzdG9ydGVkKSB7XG4gICAgaWYgKCFXZWJWUkNvbmZpZy5DQVJEQk9BUkRfVUlfRElTQUJMRUQpIHtcbiAgICAgIGdsLmNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGVfO1xuICAgICAgZ2wuY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlXztcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gbmV3IENhcmRib2FyZFVJKGdsKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ3JlYXRlIGEgbmV3IGRpc3RvcnRlciBmb3IgdGhlIHRhcmdldCBjb250ZXh0XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbmV3IENhcmRib2FyZERpc3RvcnRlcihnbCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSB0aGlzLmRpc3RvcnRlcl8uY2FyZGJvYXJkVUk7XG4gIH1cblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5saXN0ZW4oZnVuY3Rpb24oZSkge1xuICAgICAgLy8gT3B0aW9ucyBjbGlja2VkLlxuICAgICAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uc2hvdyh0aGlzLmxheWVyXy5zb3VyY2UucGFyZW50RWxlbWVudCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oZSkge1xuICAgICAgLy8gQmFjayBjbGlja2VkLlxuICAgICAgdGhpcy5leGl0UHJlc2VudCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpICYmIFV0aWwuaXNNb2JpbGUoKSkge1xuICAgICAgLy8gSW4gbGFuZHNjYXBlIG1vZGUsIHRlbXBvcmFyaWx5IHNob3cgdGhlIFwicHV0IGludG8gQ2FyZGJvYXJkXCJcbiAgICAgIC8vIGludGVyc3RpdGlhbC4gT3RoZXJ3aXNlLCBkbyB0aGUgZGVmYXVsdCB0aGluZy5cbiAgICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5zaG93VGVtcG9yYXJpbHkoMzAwMCwgdGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18udXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gTGlzdGVuIGZvciBvcmllbnRhdGlvbiBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHNob3cgaW50ZXJzdGl0aWFsLlxuICB0aGlzLm9yaWVudGF0aW9uSGFuZGxlciA9IHRoaXMub25PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIpO1xuXG4gIC8vIExpc3RlbiBmb3IgcHJlc2VudCBkaXNwbGF5IGNoYW5nZSBldmVudHMgaW4gb3JkZXIgdG8gdXBkYXRlIGRpc3RvcnRlciBkaW1lbnNpb25zXG4gIHRoaXMudnJkaXNwbGF5cHJlc2VudGNoYW5nZUhhbmRsZXIgPSB0aGlzLnVwZGF0ZUJvdW5kc18uYmluZCh0aGlzKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcblxuICAvLyBGaXJlIHRoaXMgZXZlbnQgaW5pdGlhbGx5LCB0byBnaXZlIGdlb21ldHJ5LWRpc3RvcnRpb24gY2xpZW50cyB0aGUgY2hhbmNlXG4gIC8vIHRvIGRvIHNvbWV0aGluZyBjdXN0b20uXG4gIHRoaXMuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5kZXN0cm95KCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgfVxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5kZXN0cm95KCk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuICB9XG5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5oaWRlKCk7XG4gIH1cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbihwb3NlKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uc3VibWl0RnJhbWUoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmNhcmRib2FyZFVJXyAmJiB0aGlzLmxheWVyXykge1xuICAgIC8vIEhhY2sgZm9yIHByZWRpc3RvcnRlZDogdHJ1ZS5cbiAgICB2YXIgY2FudmFzID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJykuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gdGhpcy5sYXN0V2lkdGggfHwgY2FudmFzLmhlaWdodCAhPSB0aGlzLmxhc3RIZWlnaHQpIHtcbiAgICAgIHRoaXMuY2FyZGJvYXJkVUlfLm9uUmVzaXplKCk7XG4gICAgfVxuICAgIHRoaXMubGFzdFdpZHRoID0gY2FudmFzLndpZHRoO1xuICAgIHRoaXMubGFzdEhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAvLyBSZW5kZXIgdGhlIENhcmRib2FyZCBVSS5cbiAgICB0aGlzLmNhcmRib2FyZFVJXy5yZW5kZXIoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk9yaWVudGF0aW9uQ2hhbmdlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gSGlkZSB0aGUgdmlld2VyIHNlbGVjdG9yLlxuICB0aGlzLnZpZXdlclNlbGVjdG9yXy5oaWRlKCk7XG5cbiAgLy8gVXBkYXRlIHRoZSByb3RhdGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAodGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfKSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICB9XG5cbiAgdGhpcy5vblJlc2l6ZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25SZXNpemVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5sYXllcl8pIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgICAvLyBTaXplIHRoZSBDU1MgY2FudmFzLlxuICAgIC8vIEFkZGVkIHBhZGRpbmcgb24gcmlnaHQgYW5kIGJvdHRvbSBiZWNhdXNlIGlQaG9uZSA1IHdpbGwgbm90XG4gICAgLy8gaGlkZSB0aGUgVVJMIGJhciB1bmxlc3MgY29udGVudCBpcyBiaWdnZXIgdGhhbiB0aGUgc2NyZWVuLlxuICAgIC8vIFRoaXMgd2lsbCBub3QgYmUgdmlzaWJsZSBhcyBsb25nIGFzIHRoZSBjb250YWluZXIgZWxlbWVudCAoZS5nLiBib2R5KVxuICAgIC8vIGlzIHNldCB0byAnb3ZlcmZsb3c6IGhpZGRlbicuXG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICd0b3A6IDAnLFxuICAgICAgJ2xlZnQ6IDAnLFxuICAgICAgJ3dpZHRoOiAnICsgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSArICdweCcsXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAgMTBweCAxMHB4IDAnLFxuICAgIF07XG4gICAgZ2wuY2FudmFzLnNldEF0dHJpYnV0ZSgnc3R5bGUnLCBjc3NQcm9wZXJ0aWVzLmpvaW4oJzsgJykgKyAnOycpO1xuXG4gICAgVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZChnbC5jYW52YXMpO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uVmlld2VyQ2hhbmdlZF8gPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgdGhpcy5kZXZpY2VJbmZvXy5zZXRWaWV3ZXIodmlld2VyKTtcblxuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgLy8gVXBkYXRlIHRoZSBkaXN0b3J0aW9uIGFwcHJvcHJpYXRlbHkuXG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gIH1cblxuICAvLyBGaXJlIGEgbmV3IGV2ZW50IGNvbnRhaW5pbmcgdmlld2VyIGFuZCBkZXZpY2UgcGFyYW1ldGVycyBmb3IgY2xpZW50cyB0aGF0XG4gIC8vIHdhbnQgdG8gaW1wbGVtZW50IHRoZWlyIG93biBnZW9tZXRyeS1iYXNlZCBkaXN0b3J0aW9uLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJywge1xuICAgIGRldGFpbDoge1xuICAgICAgdnJkaXNwbGF5OiB0aGlzLFxuICAgICAgZGV2aWNlSW5mbzogdGhpcy5kZXZpY2VJbmZvXyxcbiAgICB9XG4gIH0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZFZSRGlzcGxheTtcbiIsIi8qXG5Db3B5cmlnaHQgKGMpIDIwMTYsIEJyYW5kb24gSm9uZXMuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cbiovXG5cbi8qXG5DYWNoZXMgc3BlY2lmaWVkIEdMIHN0YXRlLCBydW5zIGEgY2FsbGJhY2ssIGFuZCByZXN0b3JlcyB0aGUgY2FjaGVkIHN0YXRlIHdoZW5cbmRvbmUuXG5cbkV4YW1wbGUgdXNhZ2U6XG5cbnZhciBzYXZlZFN0YXRlID0gW1xuICBnbC5BUlJBWV9CVUZGRVJfQklORElORyxcblxuICAvLyBURVhUVVJFX0JJTkRJTkdfMkQgb3IgX0NVQkVfTUFQIG11c3QgYWx3YXlzIGJlIGZvbGxvd2VkIGJ5IHRoZSB0ZXh1cmUgdW5pdC5cbiAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMCxcblxuICBnbC5DTEVBUl9DT0xPUixcbl07XG4vLyBBZnRlciB0aGlzIGNhbGwgdGhlIGFycmF5IGJ1ZmZlciwgdGV4dHVyZSB1bml0IDAsIGFjdGl2ZSB0ZXh0dXJlLCBhbmQgY2xlYXJcbi8vIGNvbG9yIHdpbGwgYmUgcmVzdG9yZWQuIFRoZSB2aWV3cG9ydCB3aWxsIHJlbWFpbiBjaGFuZ2VkLCBob3dldmVyLCBiZWNhdXNlXG4vLyBnbC5WSUVXUE9SVCB3YXMgbm90IGluY2x1ZGVkIGluIHRoZSBzYXZlZFN0YXRlIGxpc3QuXG5XR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBzYXZlZFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICBnbC52aWV3cG9ydCgwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpO1xuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgLi4uLik7XG5cbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xuICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIC4uLik7XG5cbiAgZ2wuY2xlYXJDb2xvcigxLCAwLCAwLCAxKTtcbiAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG59KTtcblxuTm90ZSB0aGF0IHRoaXMgaXMgbm90IGludGVuZGVkIHRvIGJlIGZhc3QuIE1hbmFnaW5nIHN0YXRlIGluIHlvdXIgb3duIGNvZGUgdG9cbmF2b2lkIHJlZHVuZGFudCBzdGF0ZSBzZXR0aW5nIGFuZCBxdWVyeWluZyB3aWxsIGFsd2F5cyBiZSBmYXN0ZXIuIFRoaXMgZnVuY3Rpb25cbmlzIG1vc3QgdXNlZnVsIGZvciBjYXNlcyB3aGVyZSB5b3UgbWF5IG5vdCBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIHRoZSBXZWJHTFxuY2FsbHMgYmVpbmcgbWFkZSwgc3VjaCBhcyB0b29saW5nIG9yIGVmZmVjdCBpbmplY3RvcnMuXG4qL1xuXG5mdW5jdGlvbiBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBiaW5kaW5ncywgY2FsbGJhY2spIHtcbiAgaWYgKCFiaW5kaW5ncykge1xuICAgIGNhbGxiYWNrKGdsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYm91bmRWYWx1ZXMgPSBbXTtcblxuICB2YXIgYWN0aXZlVGV4dHVyZSA9IG51bGw7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYmluZGluZyA9IGJpbmRpbmdzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfMkQ6XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVEVYVFVSRV9CSU5ESU5HXzJEIG9yIFRFWFRVUkVfQklORElOR19DVUJFX01BUCBtdXN0IGJlIGZvbGxvd2VkIGJ5IGEgdmFsaWQgdGV4dHVyZSB1bml0XCIpO1xuICAgICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhY3RpdmVUZXh0dXJlKSB7XG4gICAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2goZ2wuZ2V0UGFyYW1ldGVyKGJpbmRpbmcpLCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkFDVElWRV9URVhUVVJFOlxuICAgICAgICBhY3RpdmVUZXh0dXJlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKTtcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNhbGxiYWNrKGdsKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICB2YXIgYm91bmRWYWx1ZSA9IGJvdW5kVmFsdWVzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYnJlYWs7IC8vIElnbm9yZSB0aGlzIGJpbmRpbmcsIHNpbmNlIHdlIHNwZWNpYWwtY2FzZSBpdCB0byBoYXBwZW4gbGFzdC5cbiAgICAgIGNhc2UgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX0NMRUFSX1ZBTFVFOlxuICAgICAgICBnbC5jbGVhckNvbG9yKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ09MT1JfV1JJVEVNQVNLOlxuICAgICAgICBnbC5jb2xvck1hc2soYm91bmRWYWx1ZVswXSwgYm91bmRWYWx1ZVsxXSwgYm91bmRWYWx1ZVsyXSwgYm91bmRWYWx1ZVszXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DVVJSRU5UX1BST0dSQU06XG4gICAgICAgIGdsLnVzZVByb2dyYW0oYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5SRU5ERVJCVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVklFV1BPUlQ6XG4gICAgICAgIGdsLnZpZXdwb3J0KGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTpcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOlxuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6XG4gICAgICAgIGlmIChib3VuZFZhbHVlKSB7XG4gICAgICAgICAgZ2wuZW5hYmxlKGJpbmRpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdsLmRpc2FibGUoYmluZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmxvZyhcIk5vIEdMIHJlc3RvcmUgYmVoYXZpb3IgZm9yIDB4XCIgKyBiaW5kaW5nLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChhY3RpdmVUZXh0dXJlKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmUpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdHTFVQcmVzZXJ2ZUdMU3RhdGU7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIERpc3RvcnRpb24gPSByZXF1aXJlKCcuL2Rpc3RvcnRpb24vZGlzdG9ydGlvbi5qcycpO1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIERldmljZShwYXJhbXMpIHtcbiAgdGhpcy53aWR0aCA9IHBhcmFtcy53aWR0aCB8fCBVdGlsLmdldFNjcmVlbldpZHRoKCk7XG4gIHRoaXMuaGVpZ2h0ID0gcGFyYW1zLmhlaWdodCB8fCBVdGlsLmdldFNjcmVlbkhlaWdodCgpO1xuICB0aGlzLndpZHRoTWV0ZXJzID0gcGFyYW1zLndpZHRoTWV0ZXJzO1xuICB0aGlzLmhlaWdodE1ldGVycyA9IHBhcmFtcy5oZWlnaHRNZXRlcnM7XG4gIHRoaXMuYmV2ZWxNZXRlcnMgPSBwYXJhbXMuYmV2ZWxNZXRlcnM7XG59XG5cblxuLy8gRmFsbGJhY2sgQW5kcm9pZCBkZXZpY2UgKGJhc2VkIG9uIE5leHVzIDUgbWVhc3VyZW1lbnRzKSBmb3IgdXNlIHdoZW5cbi8vIHdlIGNhbid0IHJlY29nbml6ZSBhbiBBbmRyb2lkIGRldmljZS5cbnZhciBERUZBVUxUX0FORFJPSUQgPSBuZXcgRGV2aWNlKHtcbiAgd2lkdGhNZXRlcnM6IDAuMTEwLFxuICBoZWlnaHRNZXRlcnM6IDAuMDYyLFxuICBiZXZlbE1ldGVyczogMC4wMDRcbn0pO1xuXG4vLyBGYWxsYmFjayBpT1MgZGV2aWNlIChiYXNlZCBvbiBpUGhvbmU2KSBmb3IgdXNlIHdoZW5cbi8vIHdlIGNhbid0IHJlY29nbml6ZSBhbiBBbmRyb2lkIGRldmljZS5cbnZhciBERUZBVUxUX0lPUyA9IG5ldyBEZXZpY2Uoe1xuICB3aWR0aE1ldGVyczogMC4xMDM4LFxuICBoZWlnaHRNZXRlcnM6IDAuMDU4NCxcbiAgYmV2ZWxNZXRlcnM6IDAuMDA0XG59KTtcblxuXG52YXIgVmlld2VycyA9IHtcbiAgQ2FyZGJvYXJkVjE6IG5ldyBDYXJkYm9hcmRWaWV3ZXIoe1xuICAgIGlkOiAnQ2FyZGJvYXJkVjEnLFxuICAgIGxhYmVsOiAnQ2FyZGJvYXJkIEkvTyAyMDE0JyxcbiAgICBmb3Y6IDQwLFxuICAgIGludGVyTGVuc0Rpc3RhbmNlOiAwLjA2MCxcbiAgICBiYXNlbGluZUxlbnNEaXN0YW5jZTogMC4wMzUsXG4gICAgc2NyZWVuTGVuc0Rpc3RhbmNlOiAwLjA0MixcbiAgICBkaXN0b3J0aW9uQ29lZmZpY2llbnRzOiBbMC40NDEsIDAuMTU2XSxcbiAgICBpbnZlcnNlQ29lZmZpY2llbnRzOiBbLTAuNDQxMDAzNSwgMC40Mjc1NjE1NSwgLTAuNDgwNDQzOSwgMC41NDYwMTM5LFxuICAgICAgLTAuNTg4MjExODMsIDAuNTczMzkzOCwgLTAuNDgzMDMyMDIsIDAuMzMyOTkwODMsIC0wLjE3NTczODQxLFxuICAgICAgMC4wNjUxNzcyLCAtMC4wMTQ4ODk2MywgMC4wMDE1NTk4MzRdXG4gIH0pLFxuICBDYXJkYm9hcmRWMjogbmV3IENhcmRib2FyZFZpZXdlcih7XG4gICAgaWQ6ICdDYXJkYm9hcmRWMicsXG4gICAgbGFiZWw6ICdDYXJkYm9hcmQgSS9PIDIwMTUnLFxuICAgIGZvdjogNjAsXG4gICAgaW50ZXJMZW5zRGlzdGFuY2U6IDAuMDY0LFxuICAgIGJhc2VsaW5lTGVuc0Rpc3RhbmNlOiAwLjAzNSxcbiAgICBzY3JlZW5MZW5zRGlzdGFuY2U6IDAuMDM5LFxuICAgIGRpc3RvcnRpb25Db2VmZmljaWVudHM6IFswLjM0LCAwLjU1XSxcbiAgICBpbnZlcnNlQ29lZmZpY2llbnRzOiBbLTAuMzM4MzY3MDQsIC0wLjE4MTYyMTg1LCAwLjg2MjY1NSwgLTEuMjQ2MjA1MSxcbiAgICAgIDEuMDU2MDYwMiwgLTAuNTgyMDgzMTcsIDAuMjE2MDkwNzgsIC0wLjA1NDQ0ODIzLCAwLjAwOTE3Nzk1NixcbiAgICAgIC05LjkwNDE2OUUtNCwgNi4xODM1MzVFLTUsIC0xLjY5ODE4MDNFLTZdXG4gIH0pXG59O1xuXG5cbnZhciBERUZBVUxUX0xFRlRfQ0VOVEVSID0ge3g6IDAuNSwgeTogMC41fTtcbnZhciBERUZBVUxUX1JJR0hUX0NFTlRFUiA9IHt4OiAwLjUsIHk6IDAuNX07XG5cbi8qKlxuICogTWFuYWdlcyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgZGV2aWNlIGFuZCB0aGUgdmlld2VyLlxuICpcbiAqIGRldmljZVBhcmFtcyBpbmRpY2F0ZXMgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIGRldmljZSB0byB1c2UgKGdlbmVyYWxseVxuICogb2J0YWluZWQgZnJvbSBkcGRiLmdldERldmljZVBhcmFtcygpKS4gQ2FuIGJlIG51bGwgdG8gbWVhbiBubyBkZXZpY2VcbiAqIHBhcmFtcyB3ZXJlIGZvdW5kLlxuICovXG5mdW5jdGlvbiBEZXZpY2VJbmZvKGRldmljZVBhcmFtcykge1xuICB0aGlzLnZpZXdlciA9IFZpZXdlcnMuQ2FyZGJvYXJkVjI7XG4gIHRoaXMudXBkYXRlRGV2aWNlUGFyYW1zKGRldmljZVBhcmFtcyk7XG4gIHRoaXMuZGlzdG9ydGlvbiA9IG5ldyBEaXN0b3J0aW9uKHRoaXMudmlld2VyLmRpc3RvcnRpb25Db2VmZmljaWVudHMpO1xufVxuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS51cGRhdGVEZXZpY2VQYXJhbXMgPSBmdW5jdGlvbihkZXZpY2VQYXJhbXMpIHtcbiAgdGhpcy5kZXZpY2UgPSB0aGlzLmRldGVybWluZURldmljZV8oZGV2aWNlUGFyYW1zKSB8fCB0aGlzLmRldmljZTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldERldmljZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kZXZpY2U7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5zZXRWaWV3ZXIgPSBmdW5jdGlvbih2aWV3ZXIpIHtcbiAgdGhpcy52aWV3ZXIgPSB2aWV3ZXI7XG4gIHRoaXMuZGlzdG9ydGlvbiA9IG5ldyBEaXN0b3J0aW9uKHRoaXMudmlld2VyLmRpc3RvcnRpb25Db2VmZmljaWVudHMpO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZGV0ZXJtaW5lRGV2aWNlXyA9IGZ1bmN0aW9uKGRldmljZVBhcmFtcykge1xuICBpZiAoIWRldmljZVBhcmFtcykge1xuICAgIC8vIE5vIHBhcmFtZXRlcnMsIHNvIHVzZSBhIGRlZmF1bHQuXG4gICAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgICAgY29uc29sZS53YXJuKCdVc2luZyBmYWxsYmFjayBpT1MgZGV2aWNlIG1lYXN1cmVtZW50cy4nKTtcbiAgICAgIHJldHVybiBERUZBVUxUX0lPUztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdVc2luZyBmYWxsYmFjayBBbmRyb2lkIGRldmljZSBtZWFzdXJlbWVudHMuJyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9BTkRST0lEO1xuICAgIH1cbiAgfVxuXG4gIC8vIENvbXB1dGUgZGV2aWNlIHNjcmVlbiBkaW1lbnNpb25zIGJhc2VkIG9uIGRldmljZVBhcmFtcy5cbiAgdmFyIE1FVEVSU19QRVJfSU5DSCA9IDAuMDI1NDtcbiAgdmFyIG1ldGVyc1BlclBpeGVsWCA9IE1FVEVSU19QRVJfSU5DSCAvIGRldmljZVBhcmFtcy54ZHBpO1xuICB2YXIgbWV0ZXJzUGVyUGl4ZWxZID0gTUVURVJTX1BFUl9JTkNIIC8gZGV2aWNlUGFyYW1zLnlkcGk7XG4gIHZhciB3aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdmFyIGhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG4gIHJldHVybiBuZXcgRGV2aWNlKHtcbiAgICB3aWR0aE1ldGVyczogbWV0ZXJzUGVyUGl4ZWxYICogd2lkdGgsXG4gICAgaGVpZ2h0TWV0ZXJzOiBtZXRlcnNQZXJQaXhlbFkgKiBoZWlnaHQsXG4gICAgYmV2ZWxNZXRlcnM6IGRldmljZVBhcmFtcy5iZXZlbE1tICogMC4wMDEsXG4gIH0pO1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIGZpZWxkIG9mIHZpZXcgZm9yIHRoZSBsZWZ0IGV5ZS5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBEZXZpY2UuaGVpZ2h0IGFuZCBkZXZpY2Uud2lkdGggZm9yIGRldmljZSBpbiBwb3J0cmFpdCBtb2RlLCBzbyB0cmFuc3Bvc2UuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcblxuICB2YXIgb3V0ZXJEaXN0ID0gKGRldmljZS53aWR0aE1ldGVycyAtIHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSkgLyAyO1xuICB2YXIgaW5uZXJEaXN0ID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMjtcbiAgdmFyIGJvdHRvbURpc3QgPSB2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnM7XG4gIHZhciB0b3BEaXN0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAtIGJvdHRvbURpc3Q7XG5cbiAgdmFyIG91dGVyQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChvdXRlckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSk7XG4gIHZhciBpbm5lckFuZ2xlID0gTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQoaW5uZXJEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuICB2YXIgYm90dG9tQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChib3R0b21EaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuICB2YXIgdG9wQW5nbGUgPSBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydCh0b3BEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuXG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IE1hdGgubWluKG91dGVyQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHJpZ2h0RGVncmVlczogTWF0aC5taW4oaW5uZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgZG93bkRlZ3JlZXM6IE1hdGgubWluKGJvdHRvbUFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICB1cERlZ3JlZXM6IE1hdGgubWluKHRvcEFuZ2xlLCB2aWV3ZXIuZm92KVxuICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSB0YW4tYW5nbGVzIGZyb20gdGhlIG1heGltdW0gRk9WIGZvciB0aGUgbGVmdCBleWUgZm9yIHRoZVxuICogY3VycmVudCBkZXZpY2UgYW5kIHNjcmVlbiBwYXJhbWV0ZXJzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllVmlzaWJsZVRhbkFuZ2xlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgLy8gVGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXggRk9WLlxuICB2YXIgZm92TGVmdCA9IE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICB2YXIgZm92VG9wID0gTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgdmFyIGZvdlJpZ2h0ID0gTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgdmFyIGZvdkJvdHRvbSA9IE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggLSBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Ub3AgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICB2YXIgc2NyZWVuUmlnaHQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggKyBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgLSBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICAvLyBDb21wYXJlIHRoZSB0d28gc2V0cyBvZiB0YW4tYW5nbGVzIGFuZCB0YWtlIHRoZSB2YWx1ZSBjbG9zZXIgdG8gemVybyBvbiBlYWNoIHNpZGUuXG4gIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMsIGFzc3VtaW5nIG5vIGxlbnNlcy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZU5vTGVuc1RhbkFuZ2xlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIC8vIFRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4IEZPVi5cbiAgdmFyIGZvdkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgdmFyIGZvdlRvcCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZSaWdodCA9IGRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoTWF0aC50YW4oTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZCb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1NYXRoVXRpbC5kZWdUb1JhZCAqIHZpZXdlci5mb3YpKTtcbiAgLy8gVmlld3BvcnQgc2l6ZS5cbiAgdmFyIGhhbGZXaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIDQ7XG4gIHZhciBoYWxmSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIDI7XG4gIC8vIFZpZXdwb3J0IGNlbnRlciwgbWVhc3VyZWQgZnJvbSBsZWZ0IGxlbnMgcG9zaXRpb24uXG4gIHZhciB2ZXJ0aWNhbExlbnNPZmZzZXQgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzIC0gaGFsZkhlaWdodCk7XG4gIHZhciBjZW50ZXJYID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMiAtIGhhbGZXaWR0aDtcbiAgdmFyIGNlbnRlclkgPSAtdmVydGljYWxMZW5zT2Zmc2V0O1xuICB2YXIgY2VudGVyWiA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIC8vIFRhbi1hbmdsZXMgb2YgdGhlIHZpZXdwb3J0IGVkZ2VzLCBhcyBzZWVuIHRocm91Z2ggdGhlIGxlbnMuXG4gIHZhciBzY3JlZW5MZWZ0ID0gKGNlbnRlclggLSBoYWxmV2lkdGgpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlblRvcCA9IChjZW50ZXJZICsgaGFsZkhlaWdodCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuUmlnaHQgPSAoY2VudGVyWCArIGhhbGZXaWR0aCkgLyBjZW50ZXJaO1xuICB2YXIgc2NyZWVuQm90dG9tID0gKGNlbnRlclkgLSBoYWxmSGVpZ2h0KSAvIGNlbnRlclo7XG4gIC8vIENvbXBhcmUgdGhlIHR3byBzZXRzIG9mIHRhbi1hbmdsZXMgYW5kIHRha2UgdGhlIHZhbHVlIGNsb3NlciB0byB6ZXJvIG9uIGVhY2ggc2lkZS5cbiAgcmVzdWx0WzBdID0gTWF0aC5tYXgoZm92TGVmdCwgc2NyZWVuTGVmdCk7XG4gIHJlc3VsdFsxXSA9IE1hdGgubWluKGZvdlRvcCwgc2NyZWVuVG9wKTtcbiAgcmVzdWx0WzJdID0gTWF0aC5taW4oZm92UmlnaHQsIHNjcmVlblJpZ2h0KTtcbiAgcmVzdWx0WzNdID0gTWF0aC5tYXgoZm92Qm90dG9tLCBzY3JlZW5Cb3R0b20pO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzY3JlZW4gcmVjdGFuZ2xlIHZpc2libGUgZnJvbSB0aGUgbGVmdCBleWUgZm9yIHRoZVxuICogY3VycmVudCBkZXZpY2UgYW5kIHNjcmVlbiBwYXJhbWV0ZXJzLlxuICovXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRMZWZ0RXllVmlzaWJsZVNjcmVlblJlY3QgPSBmdW5jdGlvbih1bmRpc3RvcnRlZEZydXN0dW0pIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG5cbiAgdmFyIGRpc3QgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgZXllWCA9IChkZXZpY2Uud2lkdGhNZXRlcnMgLSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UpIC8gMjtcbiAgdmFyIGV5ZVkgPSB2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnM7XG4gIHZhciBsZWZ0ID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVswXSAqIGRpc3QgKyBleWVYKSAvIGRldmljZS53aWR0aE1ldGVycztcbiAgdmFyIHRvcCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMV0gKiBkaXN0ICsgZXllWSkgLyBkZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuICB2YXIgcmlnaHQgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzJdICogZGlzdCArIGV5ZVgpIC8gZGV2aWNlLndpZHRoTWV0ZXJzO1xuICB2YXIgYm90dG9tID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVszXSAqIGRpc3QgKyBleWVZKSAvIGRldmljZS5oZWlnaHRNZXRlcnM7XG4gIHJldHVybiB7XG4gICAgeDogbGVmdCxcbiAgICB5OiBib3R0b20sXG4gICAgd2lkdGg6IHJpZ2h0IC0gbGVmdCxcbiAgICBoZWlnaHQ6IHRvcCAtIGJvdHRvbVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24ob3B0X2lzVW5kaXN0b3J0ZWQpIHtcbiAgcmV0dXJuIG9wdF9pc1VuZGlzdG9ydGVkID8gdGhpcy5nZXRVbmRpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSgpIDpcbiAgICAgIHRoaXMuZ2V0RGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllKCk7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRGaWVsZE9mVmlld1JpZ2h0RXllID0gZnVuY3Rpb24ob3B0X2lzVW5kaXN0b3J0ZWQpIHtcbiAgdmFyIGZvdiA9IHRoaXMuZ2V0RmllbGRPZlZpZXdMZWZ0RXllKG9wdF9pc1VuZGlzdG9ydGVkKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogZm92LnJpZ2h0RGVncmVlcyxcbiAgICByaWdodERlZ3JlZXM6IGZvdi5sZWZ0RGVncmVlcyxcbiAgICB1cERlZ3JlZXM6IGZvdi51cERlZ3JlZXMsXG4gICAgZG93bkRlZ3JlZXM6IGZvdi5kb3duRGVncmVlc1xuICB9O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHVuZGlzdG9ydGVkIGZpZWxkIG9mIHZpZXcgZm9yIHRoZSBsZWZ0IGV5ZS5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHAgPSB0aGlzLmdldFVuZGlzdG9ydGVkUGFyYW1zXygpO1xuXG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAub3V0ZXJEaXN0KSxcbiAgICByaWdodERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAuaW5uZXJEaXN0KSxcbiAgICBkb3duRGVncmVlczogTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4ocC5ib3R0b21EaXN0KSxcbiAgICB1cERlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAudG9wRGlzdClcbiAgfTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkVmlld3BvcnRMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5nZXRVbmRpc3RvcnRlZFBhcmFtc18oKTtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG5cbiAgLy8gRGlzdGFuY2VzIHN0b3JlZCBpbiBsb2NhbCB2YXJpYWJsZXMgYXJlIGluIHRhbi1hbmdsZSB1bml0cyB1bmxlc3Mgb3RoZXJ3aXNlXG4gIC8vIG5vdGVkLlxuICB2YXIgZXllVG9TY3JlZW5EaXN0YW5jZSA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5XaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5IZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHhQeFBlclRhbkFuZ2xlID0gZGV2aWNlLndpZHRoIC8gc2NyZWVuV2lkdGg7XG4gIHZhciB5UHhQZXJUYW5BbmdsZSA9IGRldmljZS5oZWlnaHQgLyBzY3JlZW5IZWlnaHQ7XG5cbiAgdmFyIHggPSBNYXRoLnJvdW5kKChwLmV5ZVBvc1ggLSBwLm91dGVyRGlzdCkgKiB4UHhQZXJUYW5BbmdsZSk7XG4gIHZhciB5ID0gTWF0aC5yb3VuZCgocC5leWVQb3NZIC0gcC5ib3R0b21EaXN0KSAqIHlQeFBlclRhbkFuZ2xlKTtcbiAgcmV0dXJuIHtcbiAgICB4OiB4LFxuICAgIHk6IHksXG4gICAgd2lkdGg6IE1hdGgucm91bmQoKHAuZXllUG9zWCArIHAuaW5uZXJEaXN0KSAqIHhQeFBlclRhbkFuZ2xlKSAtIHgsXG4gICAgaGVpZ2h0OiBNYXRoLnJvdW5kKChwLmV5ZVBvc1kgKyBwLnRvcERpc3QpICogeVB4UGVyVGFuQW5nbGUpIC0geVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBNb3N0IG9mIHRoZXNlIHZhcmlhYmxlcyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGhhbGZMZW5zRGlzdGFuY2UgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuXG4gIHZhciBleWVQb3NYID0gc2NyZWVuV2lkdGggLyAyIC0gaGFsZkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVBvc1kgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzKSAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIG1heEZvdiA9IHZpZXdlci5mb3Y7XG4gIHZhciB2aWV3ZXJNYXggPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogbWF4Rm92KSk7XG4gIHZhciBvdXRlckRpc3QgPSBNYXRoLm1pbihleWVQb3NYLCB2aWV3ZXJNYXgpO1xuICB2YXIgaW5uZXJEaXN0ID0gTWF0aC5taW4oaGFsZkxlbnNEaXN0YW5jZSwgdmlld2VyTWF4KTtcbiAgdmFyIGJvdHRvbURpc3QgPSBNYXRoLm1pbihleWVQb3NZLCB2aWV3ZXJNYXgpO1xuICB2YXIgdG9wRGlzdCA9IE1hdGgubWluKHNjcmVlbkhlaWdodCAtIGV5ZVBvc1ksIHZpZXdlck1heCk7XG5cbiAgcmV0dXJuIHtcbiAgICBvdXRlckRpc3Q6IG91dGVyRGlzdCxcbiAgICBpbm5lckRpc3Q6IGlubmVyRGlzdCxcbiAgICB0b3BEaXN0OiB0b3BEaXN0LFxuICAgIGJvdHRvbURpc3Q6IGJvdHRvbURpc3QsXG4gICAgZXllUG9zWDogZXllUG9zWCxcbiAgICBleWVQb3NZOiBleWVQb3NZXG4gIH07XG59O1xuXG5cbmZ1bmN0aW9uIENhcmRib2FyZFZpZXdlcihwYXJhbXMpIHtcbiAgLy8gQSBtYWNoaW5lIHJlYWRhYmxlIElELlxuICB0aGlzLmlkID0gcGFyYW1zLmlkO1xuICAvLyBBIGh1bWFuIHJlYWRhYmxlIGxhYmVsLlxuICB0aGlzLmxhYmVsID0gcGFyYW1zLmxhYmVsO1xuXG4gIC8vIEZpZWxkIG9mIHZpZXcgaW4gZGVncmVlcyAocGVyIHNpZGUpLlxuICB0aGlzLmZvdiA9IHBhcmFtcy5mb3Y7XG5cbiAgLy8gRGlzdGFuY2UgYmV0d2VlbiBsZW5zIGNlbnRlcnMgaW4gbWV0ZXJzLlxuICB0aGlzLmludGVyTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmludGVyTGVuc0Rpc3RhbmNlO1xuICAvLyBEaXN0YW5jZSBiZXR3ZWVuIHZpZXdlciBiYXNlbGluZSBhbmQgbGVucyBjZW50ZXIgaW4gbWV0ZXJzLlxuICB0aGlzLmJhc2VsaW5lTGVuc0Rpc3RhbmNlID0gcGFyYW1zLmJhc2VsaW5lTGVuc0Rpc3RhbmNlO1xuICAvLyBTY3JlZW4tdG8tbGVucyBkaXN0YW5jZSBpbiBtZXRlcnMuXG4gIHRoaXMuc2NyZWVuTGVuc0Rpc3RhbmNlID0gcGFyYW1zLnNjcmVlbkxlbnNEaXN0YW5jZTtcblxuICAvLyBEaXN0b3J0aW9uIGNvZWZmaWNpZW50cy5cbiAgdGhpcy5kaXN0b3J0aW9uQ29lZmZpY2llbnRzID0gcGFyYW1zLmRpc3RvcnRpb25Db2VmZmljaWVudHM7XG4gIC8vIEludmVyc2UgZGlzdG9ydGlvbiBjb2VmZmljaWVudHMuXG4gIC8vIFRPRE86IENhbGN1bGF0ZSB0aGVzZSBmcm9tIGRpc3RvcnRpb25Db2VmZmljaWVudHMgaW4gdGhlIGZ1dHVyZS5cbiAgdGhpcy5pbnZlcnNlQ29lZmZpY2llbnRzID0gcGFyYW1zLmludmVyc2VDb2VmZmljaWVudHM7XG59XG5cbi8vIEV4cG9ydCB2aWV3ZXIgaW5mb3JtYXRpb24uXG5EZXZpY2VJbmZvLlZpZXdlcnMgPSBWaWV3ZXJzO1xubW9kdWxlLmV4cG9ydHMgPSBEZXZpY2VJbmZvO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgSE1EVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5ITURWUkRldmljZTtcbnZhciBQb3NpdGlvblNlbnNvclZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuUG9zaXRpb25TZW5zb3JWUkRldmljZTtcblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIEhNRFZSRGV2aWNlXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5KSB7XG4gIHRoaXMuZGlzcGxheSA9IGRpc3BsYXk7XG5cbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9IGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZUlkID0gJ3dlYnZyLXBvbHlmaWxsOkhNRDonICsgZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlTmFtZSA9IGRpc3BsYXkuZGlzcGxheU5hbWUgKyAnIChITUQpJztcbn1cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUgPSBuZXcgSE1EVlJEZXZpY2UoKTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIGV5ZVBhcmFtZXRlcnMgPSB0aGlzLmRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyh3aGljaEV5ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50RmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgbWF4aW11bUZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1pbmltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICByZWNvbW1lbmRlZEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIGV5ZVRyYW5zbGF0aW9uOiB7IHg6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzBdLCB5OiBleWVQYXJhbWV0ZXJzLm9mZnNldFsxXSwgejogZXllUGFyYW1ldGVycy5vZmZzZXRbMl0gfSxcbiAgICByZW5kZXJSZWN0OiB7XG4gICAgICB4OiAod2hpY2hFeWUgPT0gJ3JpZ2h0JykgPyBleWVQYXJhbWV0ZXJzLnJlbmRlcldpZHRoIDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB3aWR0aDogZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCxcbiAgICAgIGhlaWdodDogZXllUGFyYW1ldGVycy5yZW5kZXJIZWlnaHRcbiAgICB9XG4gIH07XG59O1xuXG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlLnNldEZpZWxkT2ZWaWV3ID1cbiAgICBmdW5jdGlvbihvcHRfZm92TGVmdCwgb3B0X2ZvdlJpZ2h0LCBvcHRfek5lYXIsIG9wdF96RmFyKSB7XG4gIC8vIE5vdCBzdXBwb3J0ZWQuIGdldEV5ZVBhcmFtZXRlcnMgcmVwb3J0cyB0aGF0IHRoZSBtaW4sIG1heCwgYW5kIHJlY29tbWVuZGVkXG4gIC8vIEZvViBpcyBhbGwgdGhlIHNhbWUsIHNvIG5vIGFkanVzdG1lbnQgY2FuIGJlIG1hZGUuXG59O1xuXG4vLyBUT0RPOiBOZWVkIHRvIGhvb2sgcmVxdWVzdEZ1bGxzY3JlZW4gdG8gc2VlIGlmIGEgd3JhcHBlZCBWUkRpc3BsYXkgd2FzIHBhc3NlZFxuLy8gaW4gYXMgYW4gb3B0aW9uLiBJZiBzbyB3ZSBzaG91bGQgcHJldmVudCB0aGUgZGVmYXVsdCBmdWxsc2NyZWVuIGJlaGF2aW9yIGFuZFxuLy8gY2FsbCBWUkRpc3BsYXkucmVxdWVzdFByZXNlbnQgaW5zdGVhZC5cblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpQb3NpdGlvblNlbnNvcjogJyArIGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZU5hbWUgPSBkaXNwbGF5LmRpc3BsYXlOYW1lICsgJyAoUG9zaXRpb25TZW5zb3IpJztcbn1cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBQb3NpdGlvblNlbnNvclZSRGV2aWNlKCk7XG5cblZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcG9zZSA9IHRoaXMuZGlzcGxheS5nZXRQb3NlKCk7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHBvc2UucG9zaXRpb24gPyB7IHg6IHBvc2UucG9zaXRpb25bMF0sIHk6IHBvc2UucG9zaXRpb25bMV0sIHo6IHBvc2UucG9zaXRpb25bMl0gfSA6IG51bGwsXG4gICAgb3JpZW50YXRpb246IHBvc2Uub3JpZW50YXRpb24gPyB7IHg6IHBvc2Uub3JpZW50YXRpb25bMF0sIHk6IHBvc2Uub3JpZW50YXRpb25bMV0sIHo6IHBvc2Uub3JpZW50YXRpb25bMl0sIHc6IHBvc2Uub3JpZW50YXRpb25bM10gfSA6IG51bGwsXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUucmVzZXRTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5wb3NpdGlvbkRldmljZS5yZXNldFBvc2UoKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5SE1ERGV2aWNlID0gVlJEaXNwbGF5SE1ERGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UgPSBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZTtcblxuIiwiLyoqXG4gKiBUT0RPKHNtdXMpOiBJbXBsZW1lbnQgY29lZmZpY2llbnQgaW52ZXJzaW9uLlxuICovXG5mdW5jdGlvbiBEaXN0b3J0aW9uKGNvZWZmaWNpZW50cykge1xuICB0aGlzLmNvZWZmaWNpZW50cyA9IGNvZWZmaWNpZW50cztcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBpbnZlcnNlIGRpc3RvcnRpb24gZm9yIGEgcmFkaXVzLlxuICogPC9wPjxwPlxuICogQWxsb3dzIHRvIGNvbXB1dGUgdGhlIG9yaWdpbmFsIHVuZGlzdG9ydGVkIHJhZGl1cyBmcm9tIGEgZGlzdG9ydGVkIG9uZS5cbiAqIFNlZSBhbHNvIGdldEFwcHJveGltYXRlSW52ZXJzZURpc3RvcnRpb24oKSBmb3IgYSBmYXN0ZXIgYnV0IHBvdGVudGlhbGx5XG4gKiBsZXNzIGFjY3VyYXRlIG1ldGhvZC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIERpc3RvcnRlZCByYWRpdXMgZnJvbSB0aGUgbGVucyBjZW50ZXIgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgdW5kaXN0b3J0ZWQgcmFkaXVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuZGlzdG9ydEludmVyc2UgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgLy8gU2VjYW50IG1ldGhvZC5cbiAgdmFyIHIwID0gMDtcbiAgdmFyIHIxID0gMTtcbiAgdmFyIGRyMCA9IHJhZGl1cyAtIHRoaXMuZGlzdG9ydChyMCk7XG4gIHdoaWxlIChNYXRoLmFicyhyMSAtIHIwKSA+IDAuMDAwMSAvKiogMC4xbW0gKi8pIHtcbiAgICB2YXIgZHIxID0gcmFkaXVzIC0gdGhpcy5kaXN0b3J0KHIxKTtcbiAgICB2YXIgcjIgPSByMSAtIGRyMSAqICgocjEgLSByMCkgLyAoZHIxIC0gZHIwKSk7XG4gICAgcjAgPSByMTtcbiAgICByMSA9IHIyO1xuICAgIGRyMCA9IGRyMTtcbiAgfVxuICByZXR1cm4gcjE7XG59O1xuXG4vKipcbiAqIERpc3RvcnRzIGEgcmFkaXVzIGJ5IGl0cyBkaXN0b3J0aW9uIGZhY3RvciBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxlbnNlcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIFJhZGl1cyBmcm9tIHRoZSBsZW5zIGNlbnRlciBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBkaXN0b3J0ZWQgcmFkaXVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuZGlzdG9ydCA9IGZ1bmN0aW9uKHJhZGl1cykge1xuICB2YXIgcjIgPSByYWRpdXMgKiByYWRpdXM7XG4gIHZhciByZXQgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmV0ID0gcjIgKiAocmV0ICsgdGhpcy5jb2VmZmljaWVudHNbaV0pO1xuICB9XG4gIHJldHVybiAocmV0ICsgMSkgKiByYWRpdXM7XG59O1xuXG4vLyBGdW5jdGlvbnMgYmVsb3cgcm91Z2hseSBwb3J0ZWQgZnJvbVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2dvb2dsZXNhbXBsZXMvY2FyZGJvYXJkLXVuaXR5L2Jsb2IvbWFzdGVyL0NhcmRib2FyZC9TY3JpcHRzL0NhcmRib2FyZFByb2ZpbGUuY3MjTDQxMlxuXG4vLyBTb2x2ZXMgYSBzbWFsbCBsaW5lYXIgZXF1YXRpb24gdmlhIGRlc3RydWN0aXZlIGdhdXNzaWFuXG4vLyBlbGltaW5hdGlvbiBhbmQgYmFjayBzdWJzdGl0dXRpb24uICBUaGlzIGlzbid0IGdlbmVyaWMgbnVtZXJpY1xuLy8gY29kZSwgaXQncyBqdXN0IGEgcXVpY2sgaGFjayB0byB3b3JrIHdpdGggdGhlIGdlbmVyYWxseVxuLy8gd2VsbC1iZWhhdmVkIHN5bW1ldHJpYyBtYXRyaWNlcyBmb3IgbGVhc3Qtc3F1YXJlcyBmaXR0aW5nLlxuLy8gTm90IGludGVuZGVkIGZvciByZXVzZS5cbi8vXG4vLyBAcGFyYW0gYSBJbnB1dCBwb3NpdGl2ZSBkZWZpbml0ZSBzeW1tZXRyaWNhbCBtYXRyaXguIERlc3Ryb3llZFxuLy8gICAgIGR1cmluZyBjYWxjdWxhdGlvbi5cbi8vIEBwYXJhbSB5IElucHV0IHJpZ2h0LWhhbmQtc2lkZSB2YWx1ZXMuIERlc3Ryb3llZCBkdXJpbmcgY2FsY3VsYXRpb24uXG4vLyBAcmV0dXJuIFJlc3VsdGluZyB4IHZhbHVlIHZlY3Rvci5cbi8vXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5zb2x2ZUxpbmVhcl8gPSBmdW5jdGlvbihhLCB5KSB7XG4gIHZhciBuID0gYS5sZW5ndGg7XG5cbiAgLy8gR2F1c3NpYW4gZWxpbWluYXRpb24gKG5vIHJvdyBleGNoYW5nZSkgdG8gdHJpYW5ndWxhciBtYXRyaXguXG4gIC8vIFRoZSBpbnB1dCBtYXRyaXggaXMgYSBBXlQgQSBwcm9kdWN0IHdoaWNoIHNob3VsZCBiZSBhIHBvc2l0aXZlXG4gIC8vIGRlZmluaXRlIHN5bW1ldHJpY2FsIG1hdHJpeCwgYW5kIGlmIEkgcmVtZW1iZXIgbXkgbGluZWFyXG4gIC8vIGFsZ2VicmEgcmlnaHQgdGhpcyBpbXBsaWVzIHRoYXQgdGhlIHBpdm90cyB3aWxsIGJlIG5vbnplcm8gYW5kXG4gIC8vIGNhbGN1bGF0aW9ucyBzdWZmaWNpZW50bHkgYWNjdXJhdGUgd2l0aG91dCBuZWVkaW5nIHJvd1xuICAvLyBleGNoYW5nZS5cbiAgZm9yICh2YXIgaiA9IDA7IGogPCBuIC0gMTsgKytqKSB7XG4gICAgZm9yICh2YXIgayA9IGogKyAxOyBrIDwgbjsgKytrKSB7XG4gICAgICB2YXIgcCA9IGFbal1ba10gLyBhW2pdW2pdO1xuICAgICAgZm9yICh2YXIgaSA9IGogKyAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGFbaV1ba10gLT0gcCAqIGFbaV1bal07XG4gICAgICB9XG4gICAgICB5W2tdIC09IHAgKiB5W2pdO1xuICAgIH1cbiAgfVxuICAvLyBGcm9tIHRoaXMgcG9pbnQgb24sIG9ubHkgdGhlIG1hdHJpeCBlbGVtZW50cyBhW2pdW2ldIHdpdGggaT49aiBhcmVcbiAgLy8gdmFsaWQuIFRoZSBlbGltaW5hdGlvbiBkb2Vzbid0IGZpbGwgaW4gZWxpbWluYXRlZCAwIHZhbHVlcy5cblxuICB2YXIgeCA9IG5ldyBBcnJheShuKTtcblxuICAvLyBCYWNrIHN1YnN0aXR1dGlvbi5cbiAgZm9yICh2YXIgaiA9IG4gLSAxOyBqID49IDA7IC0taikge1xuICAgIHZhciB2ID0geVtqXTtcbiAgICBmb3IgKHZhciBpID0gaiArIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgIHYgLT0gYVtpXVtqXSAqIHhbaV07XG4gICAgfVxuICAgIHhbal0gPSB2IC8gYVtqXVtqXTtcbiAgfVxuXG4gIHJldHVybiB4O1xufTtcblxuLy8gU29sdmVzIGEgbGVhc3Qtc3F1YXJlcyBtYXRyaXggZXF1YXRpb24uICBHaXZlbiB0aGUgZXF1YXRpb24gQSAqIHggPSB5LCBjYWxjdWxhdGUgdGhlXG4vLyBsZWFzdC1zcXVhcmUgZml0IHggPSBpbnZlcnNlKEEgKiB0cmFuc3Bvc2UoQSkpICogdHJhbnNwb3NlKEEpICogeS4gIFRoZSB3YXkgdGhpcyB3b3Jrc1xuLy8gaXMgdGhhdCwgd2hpbGUgQSBpcyB0eXBpY2FsbHkgbm90IGEgc3F1YXJlIG1hdHJpeCAoYW5kIGhlbmNlIG5vdCBpbnZlcnRpYmxlKSwgQSAqIHRyYW5zcG9zZShBKVxuLy8gaXMgYWx3YXlzIHNxdWFyZS4gIFRoYXQgaXM6XG4vLyAgIEEgKiB4ID0geVxuLy8gICB0cmFuc3Bvc2UoQSkgKiAoQSAqIHgpID0gdHJhbnNwb3NlKEEpICogeSAgIDwtIG11bHRpcGx5IGJvdGggc2lkZXMgYnkgdHJhbnNwb3NlKEEpXG4vLyAgICh0cmFuc3Bvc2UoQSkgKiBBKSAqIHggPSB0cmFuc3Bvc2UoQSkgKiB5ICAgPC0gYXNzb2NpYXRpdml0eVxuLy8gICB4ID0gaW52ZXJzZSh0cmFuc3Bvc2UoQSkgKiBBKSAqIHRyYW5zcG9zZShBKSAqIHkgIDwtIHNvbHZlIGZvciB4XG4vLyBNYXRyaXggQSdzIHJvdyBjb3VudCAoZmlyc3QgaW5kZXgpIG11c3QgbWF0Y2ggeSdzIHZhbHVlIGNvdW50LiAgQSdzIGNvbHVtbiBjb3VudCAoc2Vjb25kIGluZGV4KVxuLy8gZGV0ZXJtaW5lcyB0aGUgbGVuZ3RoIG9mIHRoZSByZXN1bHQgdmVjdG9yIHguXG5EaXN0b3J0aW9uLnByb3RvdHlwZS5zb2x2ZUxlYXN0U3F1YXJlc18gPSBmdW5jdGlvbihtYXRBLCB2ZWNZKSB7XG4gIHZhciBpLCBqLCBrLCBzdW07XG4gIHZhciBudW1TYW1wbGVzID0gbWF0QS5sZW5ndGg7XG4gIHZhciBudW1Db2VmZmljaWVudHMgPSBtYXRBWzBdLmxlbmd0aDtcbiAgaWYgKG51bVNhbXBsZXMgIT0gdmVjWS5MZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYXRyaXggLyB2ZWN0b3IgZGltZW5zaW9uIG1pc21hdGNoXCIpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRyYW5zcG9zZShBKSAqIEFcbiAgdmFyIG1hdEFUQSA9IG5ldyBBcnJheShudW1Db2VmZmljaWVudHMpO1xuICBmb3IgKGsgPSAwOyBrIDwgbnVtQ29lZmZpY2llbnRzOyArK2spIHtcbiAgICBtYXRBVEFba10gPSBuZXcgQXJyYXkobnVtQ29lZmZpY2llbnRzKTtcbiAgICBmb3IgKGogPSAwOyBqIDwgbnVtQ29lZmZpY2llbnRzOyArK2opIHtcbiAgICAgIHN1bSA9IDA7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtU2FtcGxlczsgKytpKSB7XG4gICAgICAgIHN1bSArPSBtYXRBW2pdW2ldICogbWF0QVtrXVtpXTtcbiAgICAgIH1cbiAgICAgIG1hdEFUQVtrXVtqXSA9IHN1bTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgdHJhbnNwb3NlKEEpICogeVxuICB2YXIgdmVjQVRZID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gIGZvciAoaiA9IDA7IGogPCBudW1Db2VmZmljaWVudHM7ICsraikge1xuICAgIHN1bSA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IG51bVNhbXBsZXM7ICsraSkge1xuICAgICAgc3VtICs9IG1hdEFbal1baV0gKiB2ZWNZW2ldO1xuICAgIH1cbiAgICB2ZWNBVFlbal0gPSBzdW07XG4gIH1cblxuICAvLyBOb3cgc29sdmUgKEEgKiB0cmFuc3Bvc2UoQSkpICogeCA9IHRyYW5zcG9zZShBKSAqIHkuXG4gIHJldHVybiB0aGlzLnNvbHZlTGluZWFyXyhtYXRBVEEsIHZlY0FUWSk7XG59O1xuXG4vLy8gQ2FsY3VsYXRlcyBhbiBhcHByb3hpbWF0ZSBpbnZlcnNlIHRvIHRoZSBnaXZlbiByYWRpYWwgZGlzdG9ydGlvbiBwYXJhbWV0ZXJzLlxuRGlzdG9ydGlvbi5wcm90b3R5cGUuYXBwcm94aW1hdGVJbnZlcnNlID0gZnVuY3Rpb24obWF4UmFkaXVzLCBudW1TYW1wbGVzKSB7XG4gIG1heFJhZGl1cyA9IG1heFJhZGl1cyB8fCAxO1xuICBudW1TYW1wbGVzID0gbnVtU2FtcGxlcyB8fCAxMDA7XG4gIHZhciBudW1Db2VmZmljaWVudHMgPSA2O1xuICB2YXIgaSwgajtcblxuICAvLyBSICsgSzEqUl4zICsgSzIqUl41ID0gciwgd2l0aCBSID0gcnAgPSBkaXN0b3J0KHIpXG4gIC8vIFJlcGVhdGluZyBmb3IgbnVtU2FtcGxlczpcbiAgLy8gICBbIFIwXjMsIFIwXjUgXSAqIFsgSzEgXSA9IFsgcjAgLSBSMCBdXG4gIC8vICAgWyBSMV4zLCBSMV41IF0gICBbIEsyIF0gICBbIHIxIC0gUjEgXVxuICAvLyAgIFsgUjJeMywgUjJeNSBdICAgICAgICAgICAgWyByMiAtIFIyIF1cbiAgLy8gICBbIGV0Yy4uLiBdICAgICAgICAgICAgICAgIFsgZXRjLi4uIF1cbiAgLy8gVGhhdCBpczpcbiAgLy8gICBtYXRBICogW0sxLCBLMl0gPSB5XG4gIC8vIFNvbHZlOlxuICAvLyAgIFtLMSwgSzJdID0gaW52ZXJzZSh0cmFuc3Bvc2UobWF0QSkgKiBtYXRBKSAqIHRyYW5zcG9zZShtYXRBKSAqIHlcbiAgdmFyIG1hdEEgPSBuZXcgQXJyYXkobnVtQ29lZmZpY2llbnRzKTtcbiAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgbWF0QVtqXSA9IG5ldyBBcnJheShudW1TYW1wbGVzKTtcbiAgfVxuICB2YXIgdmVjWSA9IG5ldyBBcnJheShudW1TYW1wbGVzKTtcblxuICBmb3IgKGkgPSAwOyBpIDwgbnVtU2FtcGxlczsgKytpKSB7XG4gICAgdmFyIHIgPSBtYXhSYWRpdXMgKiAoaSArIDEpIC8gbnVtU2FtcGxlcztcbiAgICB2YXIgcnAgPSB0aGlzLmRpc3RvcnQocik7XG4gICAgdmFyIHYgPSBycDtcbiAgICBmb3IgKGogPSAwOyBqIDwgbnVtQ29lZmZpY2llbnRzOyArK2opIHtcbiAgICAgIHYgKj0gcnAgKiBycDtcbiAgICAgIG1hdEFbal1baV0gPSB2O1xuICAgIH1cbiAgICB2ZWNZW2ldID0gciAtIHJwO1xuICB9XG5cbiAgdmFyIGludmVyc2VDb2VmZmljaWVudHMgPSB0aGlzLnNvbHZlTGVhc3RTcXVhcmVzXyhtYXRBLCB2ZWNZKTtcblxuICByZXR1cm4gbmV3IERpc3RvcnRpb24oaW52ZXJzZUNvZWZmaWNpZW50cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3RvcnRpb247XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIERQREIgY2FjaGUuXG4gKi9cbnZhciBEUERCX0NBQ0hFID0ge1xuICBcImZvcm1hdFwiOiAxLFxuICBcImxhc3RfdXBkYXRlZFwiOiBcIjIwMTYtMDEtMjBUMDA6MTg6MzVaXCIsXG4gIFwiZGV2aWNlc1wiOiBbXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiYXN1cy8qL05leHVzIDcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA3XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMjAuOCwgMzIzLjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJhc3VzLyovQVNVU19aMDBBRC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkFTVVNfWjAwQURcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy4wLCA0MDQuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEM2NDM1TFZXLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDNjQzNUxWV1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQ5LjcsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUgWEwvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lIFhMXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTUuMywgMzE0LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiaHRjLyovTmV4dXMgOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyODkuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIE05LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZSBNOVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjUsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZV9NOC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQyBPbmVfTThcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0OS43LCA0NDcuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogNDcyLjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkh1YXdlaS8qL05leHVzIDZQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNlBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1WC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDVYXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDE5LjkgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzM0NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHTVMzNDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIyMS43LCAyMTkuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHLUQ4MDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMRy1EODAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODUwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEctRDg1MFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTM3LjksIDU0MS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovVlM5ODUgNEcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJWUzk4NSA0R1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTM3LjksIDUzNS42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA1IFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0NC44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA0XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTkuOCwgMzE4LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEctUDc2OS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHLVA3NjlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC42LCAyNDcuNSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MR01TMzIzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEdNUzMyM1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjA2LjYsIDIwNC42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHTFM5OTYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMR0xTOTk2XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuNCwgNDAxLjUgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi80NTYwTU1YLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiNDU2ME1NWFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQwLjAsIDIxOS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk1pY3JvbWF4LyovQTI1MC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk1pY3JvbWF4IEEyNTBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ4MC4wLCA0NDYuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJNaWNyb21heC8qL01pY3JvbWF4IEFRNDUwMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk1pY3JvbWF4IEFRNDUwMVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDI0MC4wLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovRFJPSUQgUkFaUi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkRST0lEIFJBWlJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM2OC4xLCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUODMwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUODMwQ1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1NS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDIxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDIxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNTQuMCwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAyM1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1Ni43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMjhcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMyNi42LCAzMjcuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAzNC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAzNFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzI2LjYsIDMyOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMxNS4zLCAzMTYuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTU2Mi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTU2MlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMi43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovTmV4dXMgNi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDYgXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0OTQuMywgNDg5LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI5NS4wLCAyOTYuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA2NC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTA2NFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjk1LjAsIDI5NS42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwOTIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwOTJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQyMi4wLCA0MjQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDk1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDk1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDIzLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL0EwMDAxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiQTAwMDFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDEuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJPbmVQbHVzLyovT05FIEUxMDA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiT05FIEUxMDA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNCwgNDQxLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBBMjAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk9ORSBBMjAwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzkxLjksIDQwNS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9QUE8vKi9YOTA5LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWDkwOVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0NC4xIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTA4Mi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MDgyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxODQuNywgMTg1LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUczNjBQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzM2MFBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDE5Ni43LCAyMDUuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovTmV4dXMgUy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIFNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIzNC41LCAyMjkuOCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTMwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA0LjgsIDMwMy45IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLVQyMzBOVS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLVQyMzBOVVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDIxNi4wLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TR0gtVDM5OS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNHSC1UMzk5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMTcuNywgMjMxLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MDA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkwMDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM4Ni40LCAzODcuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNNLU45MDBBLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0FNU1VORy1TTS1OOTAwQVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzg2LjQsIDM4Ny43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTUwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5NTAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNSwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTUwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDQzOS40LFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwMEYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTAwRlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDE1LjYsIDQzMS42IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTAwTS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MDBNXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MTUuNiwgNDMxLjYgXSxcbiAgICBcImJ3XCI6IDUsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc4MDBGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzgwMEZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAzMjYuOCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDZTLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkwNlNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDU2Mi43LCA1NzIuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTMwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA2LjcsIDMwNC44IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UNTM1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tVDUzNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTQyLjYsIDEzNi40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MjBDLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkyMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDBJLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBJXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMDQuOCwgMzA1LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MTk1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkxOTVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0OS40LCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtTDUyMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNQSC1MNTIwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDkuNCwgMjU1LjkgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NBTVNVTkctU0dILUk3MTcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTQU1TVU5HLVNHSC1JNzE3XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjg1LjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtRDcxMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNQSC1ENzEwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMTcuNywgMjA0LjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULU43MTAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtTjcxMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNjUuMSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NDSC1JNjA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0NILUk2MDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNjUuMSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dhbGF4eSBOZXh1cy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdhbGF4eSBOZXh1c1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE1LjMsIDMxNC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwSC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MTBIXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MTBDLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkxMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4yLCA1MjAuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMTMwTS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUcxMzBNXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxNjUuOSwgMTY0LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyOEkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI4SVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTE1LjEsIDUxOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwRi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjBGXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogNTgwLjYsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjBQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyMFBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUyMi41LCA1NzcuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyNUYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI1RlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDU4MC42LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTI1Vi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjVWXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MjIuNSwgNTc2LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0M2OTAzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiQzY5MDNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi41LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9ENjY1My8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkQ2NjUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjguNiwgNDI3LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0U2NjUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiRTY2NTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQyOC42LCA0MjUuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovRTY4NTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJFNjg1M1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9TR1AzMjEvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTR1AzMjFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIyNC43LCAyMjQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlRDVC8qL0FMQ0FURUwgT05FIFRPVUNIIEZpZXJjZS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkFMQ0FURUwgT05FIFRPVUNIIEZpZXJjZVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQwLjAsIDI0Ny41IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlRITC8qL3RobCA1MDAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwidGhsIDUwMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ4MC4wLCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJaVEUvKi9aVEUgQmxhZGUgTDIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJaVEUgQmxhZGUgTDJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNDAuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDk2MCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMyNS4xLCAzMjguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDk2MCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMyNS4xLCAzMjguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDExMzYgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMTcuMSwgMzIwLjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCAxMTM2IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgMzE3LjEsIDMyMC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDc1MCwgMTMzNCBdIH0gXSxcbiAgICBcImRwaVwiOiAzMjYuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNzUwLCAxMzM0IF0gfSBdLFxuICAgIFwiZHBpXCI6IDMyNi40LFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyAxMjQyLCAyMjA4IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgNDUzLjYsIDQ1OC40IF0sXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDEyNDIsIDIyMDggXSB9IF0sXG4gICAgXCJkcGlcIjogWyA0NTMuNiwgNDU4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH1cbl19O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERQREJfQ0FDSEU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBPZmZsaW5lIGNhY2hlIG9mIHRoZSBEUERCLCB0byBiZSB1c2VkIHVudGlsIHdlIGxvYWQgdGhlIG9ubGluZSBvbmUgKGFuZFxuLy8gYXMgYSBmYWxsYmFjayBpbiBjYXNlIHdlIGNhbid0IGxvYWQgdGhlIG9ubGluZSBvbmUpLlxudmFyIERQREJfQ0FDSEUgPSByZXF1aXJlKCcuL2RwZGItY2FjaGUuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG4vLyBPbmxpbmUgRFBEQiBVUkwuXG52YXIgT05MSU5FX0RQREJfVVJMID0gJ2h0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9jYXJkYm9hcmQtZHBkYi9kcGRiLmpzb24nO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZGV2aWNlIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIgKERldmljZSBQYXJhbWV0ZXIgRGF0YWJhc2UpLlxuICogSW5pdGlhbGx5LCB1c2VzIHRoZSBjYWNoZWQgRFBEQiB2YWx1ZXMuXG4gKlxuICogSWYgZmV0Y2hPbmxpbmUgPT0gdHJ1ZSwgdGhlbiB0aGlzIG9iamVjdCB0cmllcyB0byBmZXRjaCB0aGUgb25saW5lIHZlcnNpb25cbiAqIG9mIHRoZSBEUERCIGFuZCB1cGRhdGVzIHRoZSBkZXZpY2UgaW5mbyBpZiBhIGJldHRlciBtYXRjaCBpcyBmb3VuZC5cbiAqIENhbGxzIHRoZSBvbkRldmljZVBhcmFtc1VwZGF0ZWQgY2FsbGJhY2sgd2hlbiB0aGVyZSBpcyBhbiB1cGRhdGUgdG8gdGhlXG4gKiBkZXZpY2UgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIERwZGIoZmV0Y2hPbmxpbmUsIG9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAvLyBTdGFydCB3aXRoIHRoZSBvZmZsaW5lIERQREIgY2FjaGUgd2hpbGUgd2UgYXJlIGxvYWRpbmcgdGhlIHJlYWwgb25lLlxuICB0aGlzLmRwZGIgPSBEUERCX0NBQ0hFO1xuXG4gIC8vIENhbGN1bGF0ZSBkZXZpY2UgcGFyYW1zIGJhc2VkIG9uIHRoZSBvZmZsaW5lIHZlcnNpb24gb2YgdGhlIERQREIuXG4gIHRoaXMucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfKCk7XG5cbiAgLy8gWEhSIHRvIGZldGNoIG9ubGluZSBEUERCIGZpbGUsIGlmIHJlcXVlc3RlZC5cbiAgaWYgKGZldGNoT25saW5lKSB7XG4gICAgLy8gU2V0IHRoZSBjYWxsYmFjay5cbiAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCA9IG9uRGV2aWNlUGFyYW1zVXBkYXRlZDtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICB4aHIub3BlbignR0VUJywgT05MSU5FX0RQREJfVVJMLCB0cnVlKTtcbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb2JqLmxvYWRpbmcgPSBmYWxzZTtcbiAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDw9IDI5OSkge1xuICAgICAgICAvLyBTdWNjZXNzLlxuICAgICAgICBvYmouZHBkYiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgb2JqLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRXJyb3IgbG9hZGluZyB0aGUgRFBEQi5cbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBvbmxpbmUgRFBEQiEnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB4aHIuc2VuZCgpO1xuICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGN1cnJlbnQgZGV2aWNlIHBhcmFtZXRlcnMuXG5EcGRiLnByb3RvdHlwZS5nZXREZXZpY2VQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlUGFyYW1zO1xufTtcblxuLy8gUmVjYWxjdWxhdGVzIHRoaXMgZGV2aWNlJ3MgcGFyYW1ldGVycyBiYXNlZCBvbiB0aGUgRFBEQi5cbkRwZGIucHJvdG90eXBlLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbmV3RGV2aWNlUGFyYW1zID0gdGhpcy5jYWxjRGV2aWNlUGFyYW1zXygpO1xuICBpZiAobmV3RGV2aWNlUGFyYW1zKSB7XG4gICAgdGhpcy5kZXZpY2VQYXJhbXMgPSBuZXdEZXZpY2VQYXJhbXM7XG4gICAgLy8gSW52b2tlIGNhbGxiYWNrLCBpZiBpdCBpcyBzZXQuXG4gICAgaWYgKHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCh0aGlzLmRldmljZVBhcmFtcyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNhbGN1bGF0ZSBkZXZpY2UgcGFyYW1ldGVycy4nKTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIERldmljZVBhcmFtcyBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBiZXN0IGd1ZXNzIGFzIHRvIHRoaXNcbi8vIGRldmljZSdzIHBhcmFtZXRlcnMuIENhbiByZXR1cm4gbnVsbCBpZiB0aGUgZGV2aWNlIGRvZXMgbm90IG1hdGNoIGFueVxuLy8ga25vd24gZGV2aWNlcy5cbkRwZGIucHJvdG90eXBlLmNhbGNEZXZpY2VQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYiA9IHRoaXMuZHBkYjsgLy8gc2hvcnRoYW5kXG4gIGlmICghZGIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKGRiLmZvcm1hdCAhPSAxKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBoYXMgdW5leHBlY3RlZCBmb3JtYXQgdmVyc2lvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoIWRiLmRldmljZXMgfHwgIWRiLmRldmljZXMubGVuZ3RoKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBkb2VzIG5vdCBoYXZlIGEgZGV2aWNlcyBzZWN0aW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBhY3R1YWwgdXNlciBhZ2VudCBhbmQgc2NyZWVuIGRpbWVuc2lvbnMgaW4gcGl4ZWxzLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcblxuICBpZiAoIWRiLmRldmljZXMpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIGhhcyBubyBkZXZpY2VzIHNlY3Rpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRiLmRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGV2aWNlID0gZGIuZGV2aWNlc1tpXTtcbiAgICBpZiAoIWRldmljZS5ydWxlcykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgbm8gcnVsZXMgc2VjdGlvbi4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChkZXZpY2UudHlwZSAhPSAnaW9zJyAmJiBkZXZpY2UudHlwZSAhPSAnYW5kcm9pZCcpIHtcbiAgICAgIGNvbnNvbGUud2FybignRGV2aWNlWycgKyBpICsgJ10gaGFzIGludmFsaWQgdHlwZS4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNlZSBpZiB0aGlzIGRldmljZSBpcyBvZiB0aGUgYXBwcm9wcmlhdGUgdHlwZS5cbiAgICBpZiAoVXRpbC5pc0lPUygpICE9IChkZXZpY2UudHlwZSA9PSAnaW9zJykpIGNvbnRpbnVlO1xuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIG1hdGNoZXMgYW55IG9mIHRoZSBydWxlczpcbiAgICB2YXIgbWF0Y2hlZCA9IGZhbHNlO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGV2aWNlLnJ1bGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgcnVsZSA9IGRldmljZS5ydWxlc1tqXTtcbiAgICAgIGlmICh0aGlzLm1hdGNoUnVsZV8ocnVsZSwgdXNlckFnZW50LCB3aWR0aCwgaGVpZ2h0KSkge1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbWF0Y2hlZCkgY29udGludWU7XG5cbiAgICAvLyBkZXZpY2UuZHBpIG1pZ2h0IGJlIGFuIGFycmF5IG9mIFsgeGRwaSwgeWRwaV0gb3IganVzdCBhIHNjYWxhci5cbiAgICB2YXIgeGRwaSA9IGRldmljZS5kcGlbMF0gfHwgZGV2aWNlLmRwaTtcbiAgICB2YXIgeWRwaSA9IGRldmljZS5kcGlbMV0gfHwgZGV2aWNlLmRwaTtcblxuICAgIHJldHVybiBuZXcgRGV2aWNlUGFyYW1zKHsgeGRwaTogeGRwaSwgeWRwaTogeWRwaSwgYmV2ZWxNbTogZGV2aWNlLmJ3IH0pO1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdObyBEUERCIGRldmljZSBtYXRjaC4nKTtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5EcGRiLnByb3RvdHlwZS5tYXRjaFJ1bGVfID0gZnVuY3Rpb24ocnVsZSwgdWEsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpIHtcbiAgLy8gV2UgY2FuIG9ubHkgbWF0Y2ggJ3VhJyBhbmQgJ3JlcycgcnVsZXMsIG5vdCBvdGhlciB0eXBlcyBsaWtlICdtZG1oJ1xuICAvLyAod2hpY2ggYXJlIG1lYW50IGZvciBuYXRpdmUgcGxhdGZvcm1zKS5cbiAgaWYgKCFydWxlLnVhICYmICFydWxlLnJlcykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIG91ciB1c2VyIGFnZW50IHN0cmluZyBkb2Vzbid0IGNvbnRhaW4gdGhlIGluZGljYXRlZCB1c2VyIGFnZW50IHN0cmluZyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS51YSAmJiB1YS5pbmRleE9mKHJ1bGUudWEpIDwgMCkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZSBydWxlIHNwZWNpZmllcyBzY3JlZW4gZGltZW5zaW9ucyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gb3VycyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS5yZXMpIHtcbiAgICBpZiAoIXJ1bGUucmVzWzBdIHx8ICFydWxlLnJlc1sxXSkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByZXNYID0gcnVsZS5yZXNbMF07XG4gICAgdmFyIHJlc1kgPSBydWxlLnJlc1sxXTtcbiAgICAvLyBDb21wYXJlIG1pbiBhbmQgbWF4IHNvIGFzIHRvIG1ha2UgdGhlIG9yZGVyIG5vdCBtYXR0ZXIsIGkuZS4sIGl0IHNob3VsZFxuICAgIC8vIGJlIHRydWUgdGhhdCA2NDB4NDgwID09IDQ4MHg2NDAuXG4gICAgaWYgKE1hdGgubWluKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpICE9IE1hdGgubWluKHJlc1gsIHJlc1kpIHx8XG4gICAgICAgIChNYXRoLm1heChzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1heChyZXNYLCByZXNZKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gRGV2aWNlUGFyYW1zKHBhcmFtcykge1xuICB0aGlzLnhkcGkgPSBwYXJhbXMueGRwaTtcbiAgdGhpcy55ZHBpID0gcGFyYW1zLnlkcGk7XG4gIHRoaXMuYmV2ZWxNbSA9IHBhcmFtcy5iZXZlbE1tO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERwZGI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXZWJWUlBvbHlmaWxsID0gcmVxdWlyZSgnLi93ZWJ2ci1wb2x5ZmlsbC5qcycpLldlYlZSUG9seWZpbGw7XG5cbi8vIEluaXRpYWxpemUgYSBXZWJWUkNvbmZpZyBqdXN0IGluIGNhc2UuXG53aW5kb3cuV2ViVlJDb25maWcgPSBVdGlsLmV4dGVuZCh7XG4gIC8vIEZvcmNlcyBhdmFpbGFiaWxpdHkgb2YgVlIgbW9kZSwgZXZlbiBmb3Igbm9uLW1vYmlsZSBkZXZpY2VzLlxuICBGT1JDRV9FTkFCTEVfVlI6IGZhbHNlLFxuXG4gIC8vIENvbXBsZW1lbnRhcnkgZmlsdGVyIGNvZWZmaWNpZW50LiAwIGZvciBhY2NlbGVyb21ldGVyLCAxIGZvciBneXJvLlxuICBLX0ZJTFRFUjogMC45OCxcblxuICAvLyBIb3cgZmFyIGludG8gdGhlIGZ1dHVyZSB0byBwcmVkaWN0IGR1cmluZyBmYXN0IG1vdGlvbiAoaW4gc2Vjb25kcykuXG4gIFBSRURJQ1RJT05fVElNRV9TOiAwLjA0MCxcblxuICAvLyBGbGFnIHRvIGVuYWJsZSB0b3VjaCBwYW5uZXIuIEluIGNhc2UgeW91IGhhdmUgeW91ciBvd24gdG91Y2ggY29udHJvbHMuXG4gIFRPVUNIX1BBTk5FUl9ESVNBQkxFRDogdHJ1ZSxcblxuICAvLyBGbGFnIHRvIGRpc2FibGVkIHRoZSBVSSBpbiBWUiBNb2RlLlxuICBDQVJEQk9BUkRfVUlfRElTQUJMRUQ6IGZhbHNlLCAvLyBEZWZhdWx0OiBmYWxzZVxuXG4gIC8vIEZsYWcgdG8gZGlzYWJsZSB0aGUgaW5zdHJ1Y3Rpb25zIHRvIHJvdGF0ZSB5b3VyIGRldmljZS5cbiAgUk9UQVRFX0lOU1RSVUNUSU9OU19ESVNBQkxFRDogZmFsc2UsIC8vIERlZmF1bHQ6IGZhbHNlLlxuXG4gIC8vIEVuYWJsZSB5YXcgcGFubmluZyBvbmx5LCBkaXNhYmxpbmcgcm9sbCBhbmQgcGl0Y2guIFRoaXMgY2FuIGJlIHVzZWZ1bFxuICAvLyBmb3IgcGFub3JhbWFzIHdpdGggbm90aGluZyBpbnRlcmVzdGluZyBhYm92ZSBvciBiZWxvdy5cbiAgWUFXX09OTFk6IGZhbHNlLFxuXG4gIC8vIFRvIGRpc2FibGUga2V5Ym9hcmQgYW5kIG1vdXNlIGNvbnRyb2xzLCBpZiB5b3Ugd2FudCB0byB1c2UgeW91ciBvd25cbiAgLy8gaW1wbGVtZW50YXRpb24uXG4gIE1PVVNFX0tFWUJPQVJEX0NPTlRST0xTX0RJU0FCTEVEOiBmYWxzZSxcblxuICAvLyBQcmV2ZW50IHRoZSBwb2x5ZmlsbCBmcm9tIGluaXRpYWxpemluZyBpbW1lZGlhdGVseS4gUmVxdWlyZXMgdGhlIGFwcFxuICAvLyB0byBjYWxsIEluaXRpYWxpemVXZWJWUlBvbHlmaWxsKCkgYmVmb3JlIGl0IGNhbiBiZSB1c2VkLlxuICBERUZFUl9JTklUSUFMSVpBVElPTjogZmFsc2UsXG5cbiAgLy8gRW5hYmxlIHRoZSBkZXByZWNhdGVkIHZlcnNpb24gb2YgdGhlIEFQSSAobmF2aWdhdG9yLmdldFZSRGV2aWNlcykuXG4gIEVOQUJMRV9ERVBSRUNBVEVEX0FQSTogZmFsc2UsXG5cbiAgLy8gU2NhbGVzIHRoZSByZWNvbW1lbmRlZCBidWZmZXIgc2l6ZSByZXBvcnRlZCBieSBXZWJWUiwgd2hpY2ggY2FuIGltcHJvdmVcbiAgLy8gcGVyZm9ybWFuY2UuXG4gIC8vIFVQREFURSgyMDE2LTA1LTAzKTogU2V0dGluZyB0aGlzIHRvIDAuNSBieSBkZWZhdWx0IHNpbmNlIDEuMCBkb2VzIG5vdFxuICAvLyBwZXJmb3JtIHdlbGwgb24gbWFueSBtb2JpbGUgZGV2aWNlcy5cbiAgQlVGRkVSX1NDQUxFOiAwLjUsXG5cbiAgLy8gQWxsb3cgVlJEaXNwbGF5LnN1Ym1pdEZyYW1lIHRvIGNoYW5nZSBnbCBiaW5kaW5ncywgd2hpY2ggaXMgbW9yZVxuICAvLyBlZmZpY2llbnQgaWYgdGhlIGFwcGxpY2F0aW9uIGNvZGUgd2lsbCByZS1iaW5kIGl0cyByZXNvdXJjZXMgb24gdGhlXG4gIC8vIG5leHQgZnJhbWUgYW55d2F5LiBUaGlzIGhhcyBiZWVuIHNlZW4gdG8gY2F1c2UgcmVuZGVyaW5nIGdsaXRjaGVzIHdpdGhcbiAgLy8gVEhSRUUuanMuXG4gIC8vIERpcnR5IGJpbmRpbmdzIGluY2x1ZGU6IGdsLkZSQU1FQlVGRkVSX0JJTkRJTkcsIGdsLkNVUlJFTlRfUFJPR1JBTSxcbiAgLy8gZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gIC8vIGFuZCBnbC5URVhUVVJFX0JJTkRJTkdfMkQgZm9yIHRleHR1cmUgdW5pdCAwLlxuICBESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1M6IGZhbHNlLFxuXG4gIC8vIFdoZW4gc2V0IHRvIHRydWUsIHRoaXMgd2lsbCBjYXVzZSBhIHBvbHlmaWxsZWQgVlJEaXNwbGF5IHRvIGFsd2F5cyBiZVxuICAvLyBhcHBlbmRlZCB0byB0aGUgbGlzdCByZXR1cm5lZCBieSBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cygpLCBldmVuIGlmIHRoYXRcbiAgLy8gbGlzdCBpbmNsdWRlcyBhIG5hdGl2ZSBWUkRpc3BsYXkuXG4gIEFMV0FZU19BUFBFTkRfUE9MWUZJTExfRElTUExBWTogZmFsc2Vcbn0sIHdpbmRvdy5XZWJWUkNvbmZpZyk7XG5cbmlmICghd2luZG93LldlYlZSQ29uZmlnLkRFRkVSX0lOSVRJQUxJWkFUSU9OKSB7XG4gIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG59IGVsc2Uge1xuICB3aW5kb3cuSW5pdGlhbGl6ZVdlYlZSUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgICBuZXcgV2ViVlJQb2x5ZmlsbCgpO1xuICB9XG59XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgTWF0aFV0aWwgPSB3aW5kb3cuTWF0aFV0aWwgfHwge307XG5cbk1hdGhVdGlsLmRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MDtcbk1hdGhVdGlsLnJhZFRvRGVnID0gMTgwIC8gTWF0aC5QSTtcblxuLy8gU29tZSBtaW5pbWFsIG1hdGggZnVuY3Rpb25hbGl0eSBib3Jyb3dlZCBmcm9tIFRIUkVFLk1hdGggYW5kIHN0cmlwcGVkIGRvd25cbi8vIGZvciB0aGUgcHVycG9zZXMgb2YgdGhpcyBsaWJyYXJ5LlxuXG5cbk1hdGhVdGlsLlZlY3RvcjIgPSBmdW5jdGlvbiAoIHgsIHkgKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xufTtcblxuTWF0aFV0aWwuVmVjdG9yMi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5WZWN0b3IyLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggdiApIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc3ViVmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIHRoaXMueCA9IGEueCAtIGIueDtcbiAgICB0aGlzLnkgPSBhLnkgLSBiLnk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjMgPSBmdW5jdGlvbiAoIHgsIHksIHogKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG59O1xuXG5NYXRoVXRpbC5WZWN0b3IzLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlZlY3RvcjMsXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHksIHogKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHYgKSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICB0aGlzLnogPSB2Lno7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLnggKiB0aGlzLnggKyB0aGlzLnkgKiB0aGlzLnkgKyB0aGlzLnogKiB0aGlzLnogKTtcbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2NhbGFyID0gdGhpcy5sZW5ndGgoKTtcblxuICAgIGlmICggc2NhbGFyICE9PSAwICkge1xuICAgICAgdmFyIGludlNjYWxhciA9IDEgLyBzY2FsYXI7XG5cbiAgICAgIHRoaXMubXVsdGlwbHlTY2FsYXIoaW52U2NhbGFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLnogPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbiAoIHNjYWxhciApIHtcbiAgICB0aGlzLnggKj0gc2NhbGFyO1xuICAgIHRoaXMueSAqPSBzY2FsYXI7XG4gICAgdGhpcy56ICo9IHNjYWxhcjtcbiAgfSxcblxuICBhcHBseVF1YXRlcm5pb246IGZ1bmN0aW9uICggcSApIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBxeCA9IHEueDtcbiAgICB2YXIgcXkgPSBxLnk7XG4gICAgdmFyIHF6ID0gcS56O1xuICAgIHZhciBxdyA9IHEudztcblxuICAgIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjdG9yXG4gICAgdmFyIGl4ID0gIHF3ICogeCArIHF5ICogeiAtIHF6ICogeTtcbiAgICB2YXIgaXkgPSAgcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6O1xuICAgIHZhciBpeiA9ICBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XG4gICAgdmFyIGl3ID0gLSBxeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgdGhpcy54ID0gaXggKiBxdyArIGl3ICogLSBxeCArIGl5ICogLSBxeiAtIGl6ICogLSBxeTtcbiAgICB0aGlzLnkgPSBpeSAqIHF3ICsgaXcgKiAtIHF5ICsgaXogKiAtIHF4IC0gaXggKiAtIHF6O1xuICAgIHRoaXMueiA9IGl6ICogcXcgKyBpdyAqIC0gcXogKyBpeCAqIC0gcXkgLSBpeSAqIC0gcXg7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkb3Q6IGZ1bmN0aW9uICggdiApIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xuICB9LFxuXG4gIGNyb3NzVmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIHZhciBheCA9IGEueCwgYXkgPSBhLnksIGF6ID0gYS56O1xuICAgIHZhciBieCA9IGIueCwgYnkgPSBiLnksIGJ6ID0gYi56O1xuXG4gICAgdGhpcy54ID0gYXkgKiBieiAtIGF6ICogYnk7XG4gICAgdGhpcy55ID0gYXogKiBieCAtIGF4ICogYno7XG4gICAgdGhpcy56ID0gYXggKiBieSAtIGF5ICogYng7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24gPSBmdW5jdGlvbiAoIHgsIHksIHosIHcgKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHRoaXMudyA9ICggdyAhPT0gdW5kZWZpbmVkICkgPyB3IDogMTtcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuUXVhdGVybmlvbixcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcbiAgICB0aGlzLncgPSB3O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCBxdWF0ZXJuaW9uICkge1xuICAgIHRoaXMueCA9IHF1YXRlcm5pb24ueDtcbiAgICB0aGlzLnkgPSBxdWF0ZXJuaW9uLnk7XG4gICAgdGhpcy56ID0gcXVhdGVybmlvbi56O1xuICAgIHRoaXMudyA9IHF1YXRlcm5pb24udztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlclhZWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyArIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgLSBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tRXVsZXJZWFo6IGZ1bmN0aW9uKCB4LCB5LCB6ICkge1xuICAgIHZhciBjMSA9IE1hdGguY29zKCB4IC8gMiApO1xuICAgIHZhciBjMiA9IE1hdGguY29zKCB5IC8gMiApO1xuICAgIHZhciBjMyA9IE1hdGguY29zKCB6IC8gMiApO1xuICAgIHZhciBzMSA9IE1hdGguc2luKCB4IC8gMiApO1xuICAgIHZhciBzMiA9IE1hdGguc2luKCB5IC8gMiApO1xuICAgIHZhciBzMyA9IE1hdGguc2luKCB6IC8gMiApO1xuXG4gICAgdGhpcy54ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuICAgIHRoaXMueSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcbiAgICB0aGlzLnogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG4gICAgdGhpcy53ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUF4aXNBbmdsZTogZnVuY3Rpb24gKCBheGlzLCBhbmdsZSApIHtcbiAgICAvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvYW5nbGVUb1F1YXRlcm5pb24vaW5kZXguaHRtXG4gICAgLy8gYXNzdW1lcyBheGlzIGlzIG5vcm1hbGl6ZWRcblxuICAgIHZhciBoYWxmQW5nbGUgPSBhbmdsZSAvIDIsIHMgPSBNYXRoLnNpbiggaGFsZkFuZ2xlICk7XG5cbiAgICB0aGlzLnggPSBheGlzLnggKiBzO1xuICAgIHRoaXMueSA9IGF4aXMueSAqIHM7XG4gICAgdGhpcy56ID0gYXhpcy56ICogcztcbiAgICB0aGlzLncgPSBNYXRoLmNvcyggaGFsZkFuZ2xlICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBtdWx0aXBseTogZnVuY3Rpb24gKCBxICkge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGx5UXVhdGVybmlvbnMoIHRoaXMsIHEgKTtcbiAgfSxcblxuICBtdWx0aXBseVF1YXRlcm5pb25zOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgLy8gZnJvbSBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9hbGdlYnJhL3JlYWxOb3JtZWRBbGdlYnJhL3F1YXRlcm5pb25zL2NvZGUvaW5kZXguaHRtXG5cbiAgICB2YXIgcWF4ID0gYS54LCBxYXkgPSBhLnksIHFheiA9IGEueiwgcWF3ID0gYS53O1xuICAgIHZhciBxYnggPSBiLngsIHFieSA9IGIueSwgcWJ6ID0gYi56LCBxYncgPSBiLnc7XG5cbiAgICB0aGlzLnggPSBxYXggKiBxYncgKyBxYXcgKiBxYnggKyBxYXkgKiBxYnogLSBxYXogKiBxYnk7XG4gICAgdGhpcy55ID0gcWF5ICogcWJ3ICsgcWF3ICogcWJ5ICsgcWF6ICogcWJ4IC0gcWF4ICogcWJ6O1xuICAgIHRoaXMueiA9IHFheiAqIHFidyArIHFhdyAqIHFieiArIHFheCAqIHFieSAtIHFheSAqIHFieDtcbiAgICB0aGlzLncgPSBxYXcgKiBxYncgLSBxYXggKiBxYnggLSBxYXkgKiBxYnkgLSBxYXogKiBxYno7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBpbnZlcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy54ICo9IC0xO1xuICAgIHRoaXMueSAqPSAtMTtcbiAgICB0aGlzLnogKj0gLTE7XG5cbiAgICB0aGlzLm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGwgPSBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiArIHRoaXMudyAqIHRoaXMudyApO1xuXG4gICAgaWYgKCBsID09PSAwICkge1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLnogPSAwO1xuICAgICAgdGhpcy53ID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbCA9IDEgLyBsO1xuXG4gICAgICB0aGlzLnggPSB0aGlzLnggKiBsO1xuICAgICAgdGhpcy55ID0gdGhpcy55ICogbDtcbiAgICAgIHRoaXMueiA9IHRoaXMueiAqIGw7XG4gICAgICB0aGlzLncgPSB0aGlzLncgKiBsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNsZXJwOiBmdW5jdGlvbiAoIHFiLCB0ICkge1xuICAgIGlmICggdCA9PT0gMCApIHJldHVybiB0aGlzO1xuICAgIGlmICggdCA9PT0gMSApIHJldHVybiB0aGlzLmNvcHkoIHFiICk7XG5cbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgeiA9IHRoaXMueiwgdyA9IHRoaXMudztcblxuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvc2xlcnAvXG5cbiAgICB2YXIgY29zSGFsZlRoZXRhID0gdyAqIHFiLncgKyB4ICogcWIueCArIHkgKiBxYi55ICsgeiAqIHFiLno7XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA8IDAgKSB7XG4gICAgICB0aGlzLncgPSAtIHFiLnc7XG4gICAgICB0aGlzLnggPSAtIHFiLng7XG4gICAgICB0aGlzLnkgPSAtIHFiLnk7XG4gICAgICB0aGlzLnogPSAtIHFiLno7XG5cbiAgICAgIGNvc0hhbGZUaGV0YSA9IC0gY29zSGFsZlRoZXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvcHkoIHFiICk7XG4gICAgfVxuXG4gICAgaWYgKCBjb3NIYWxmVGhldGEgPj0gMS4wICkge1xuICAgICAgdGhpcy53ID0gdztcbiAgICAgIHRoaXMueCA9IHg7XG4gICAgICB0aGlzLnkgPSB5O1xuICAgICAgdGhpcy56ID0gejtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyggY29zSGFsZlRoZXRhICk7XG4gICAgdmFyIHNpbkhhbGZUaGV0YSA9IE1hdGguc3FydCggMS4wIC0gY29zSGFsZlRoZXRhICogY29zSGFsZlRoZXRhICk7XG5cbiAgICBpZiAoIE1hdGguYWJzKCBzaW5IYWxmVGhldGEgKSA8IDAuMDAxICkge1xuICAgICAgdGhpcy53ID0gMC41ICogKCB3ICsgdGhpcy53ICk7XG4gICAgICB0aGlzLnggPSAwLjUgKiAoIHggKyB0aGlzLnggKTtcbiAgICAgIHRoaXMueSA9IDAuNSAqICggeSArIHRoaXMueSApO1xuICAgICAgdGhpcy56ID0gMC41ICogKCB6ICsgdGhpcy56ICk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciByYXRpb0EgPSBNYXRoLnNpbiggKCAxIC0gdCApICogaGFsZlRoZXRhICkgLyBzaW5IYWxmVGhldGEsXG4gICAgcmF0aW9CID0gTWF0aC5zaW4oIHQgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YTtcblxuICAgIHRoaXMudyA9ICggdyAqIHJhdGlvQSArIHRoaXMudyAqIHJhdGlvQiApO1xuICAgIHRoaXMueCA9ICggeCAqIHJhdGlvQSArIHRoaXMueCAqIHJhdGlvQiApO1xuICAgIHRoaXMueSA9ICggeSAqIHJhdGlvQSArIHRoaXMueSAqIHJhdGlvQiApO1xuICAgIHRoaXMueiA9ICggeiAqIHJhdGlvQSArIHRoaXMueiAqIHJhdGlvQiApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbVVuaXRWZWN0b3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaHR0cDovL2xvbGVuZ2luZS5uZXQvYmxvZy8yMDE0LzAyLzI0L3F1YXRlcm5pb24tZnJvbS10d28tdmVjdG9ycy1maW5hbFxuICAgIC8vIGFzc3VtZXMgZGlyZWN0aW9uIHZlY3RvcnMgdkZyb20gYW5kIHZUbyBhcmUgbm9ybWFsaXplZFxuXG4gICAgdmFyIHYxLCByO1xuICAgIHZhciBFUFMgPSAwLjAwMDAwMTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoIHZGcm9tLCB2VG8gKSB7XG4gICAgICBpZiAoIHYxID09PSB1bmRlZmluZWQgKSB2MSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgICAgIHIgPSB2RnJvbS5kb3QoIHZUbyApICsgMTtcblxuICAgICAgaWYgKCByIDwgRVBTICkge1xuICAgICAgICByID0gMDtcblxuICAgICAgICBpZiAoIE1hdGguYWJzKCB2RnJvbS54ICkgPiBNYXRoLmFicyggdkZyb20ueiApICkge1xuICAgICAgICAgIHYxLnNldCggLSB2RnJvbS55LCB2RnJvbS54LCAwICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdjEuc2V0KCAwLCAtIHZGcm9tLnosIHZGcm9tLnkgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdjEuY3Jvc3NWZWN0b3JzKCB2RnJvbSwgdlRvICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMueCA9IHYxLng7XG4gICAgICB0aGlzLnkgPSB2MS55O1xuICAgICAgdGhpcy56ID0gdjEuejtcbiAgICAgIHRoaXMudyA9IHI7XG5cbiAgICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSgpLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRoVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuLy8gSG93IG11Y2ggdG8gcm90YXRlIHBlciBrZXkgc3Ryb2tlLlxudmFyIEtFWV9TUEVFRCA9IDAuMTU7XG52YXIgS0VZX0FOSU1BVElPTl9EVVJBVElPTiA9IDgwO1xuXG4vLyBIb3cgbXVjaCB0byByb3RhdGUgZm9yIG1vdXNlIGV2ZW50cy5cbnZhciBNT1VTRV9TUEVFRF9YID0gMC41O1xudmFyIE1PVVNFX1NQRUVEX1kgPSAwLjM7XG5cbi8qKlxuICogVlJEaXNwbGF5IGJhc2VkIG9uIG1vdXNlIGFuZCBrZXlib2FyZCBpbnB1dC4gRGVzaWduZWQgZm9yIGRlc2t0b3BzL2xhcHRvcHNcbiAqIHdoZXJlIG9yaWVudGF0aW9uIGV2ZW50cyBhcmVuJ3Qgc3VwcG9ydGVkLiBDYW5ub3QgcHJlc2VudC5cbiAqL1xuZnVuY3Rpb24gTW91c2VLZXlib2FyZFZSRGlzcGxheSgpIHtcbiAgdGhpcy5kaXNwbGF5TmFtZSA9ICdNb3VzZSBhbmQgS2V5Ym9hcmQgVlJEaXNwbGF5ICh3ZWJ2ci1wb2x5ZmlsbCknO1xuXG4gIHRoaXMuY2FwYWJpbGl0aWVzLmhhc09yaWVudGF0aW9uID0gdHJ1ZTtcblxuICAvLyBBdHRhY2ggdG8gbW91c2UgYW5kIGtleWJvYXJkIGV2ZW50cy5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLm9uS2V5RG93bl8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZURvd25fLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwXy5iaW5kKHRoaXMpKTtcblxuICAvLyBcIlByaXZhdGVcIiBtZW1iZXJzLlxuICB0aGlzLnBoaV8gPSAwO1xuICB0aGlzLnRoZXRhXyA9IDA7XG5cbiAgLy8gVmFyaWFibGVzIGZvciBrZXlib2FyZC1iYXNlZCByb3RhdGlvbiBhbmltYXRpb24uXG4gIHRoaXMudGFyZ2V0QW5nbGVfID0gbnVsbDtcbiAgdGhpcy5hbmdsZUFuaW1hdGlvbl8gPSBudWxsO1xuXG4gIC8vIFN0YXRlIHZhcmlhYmxlcyBmb3IgY2FsY3VsYXRpb25zLlxuICB0aGlzLm9yaWVudGF0aW9uXyA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG5cbiAgLy8gVmFyaWFibGVzIGZvciBtb3VzZS1iYXNlZCByb3RhdGlvbi5cbiAgdGhpcy5yb3RhdGVTdGFydF8gPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZUVuZF8gPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZURlbHRhXyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMuaXNEcmFnZ2luZ18gPSBmYWxzZTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0XyA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG59XG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZSA9IG5ldyBWUkRpc3BsYXkoKTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0SW1tZWRpYXRlUG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9yaWVudGF0aW9uXy5zZXRGcm9tRXVsZXJZWFoodGhpcy5waGlfLCB0aGlzLnRoZXRhXywgMCk7XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMF0gPSB0aGlzLm9yaWVudGF0aW9uXy54O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1sxXSA9IHRoaXMub3JpZW50YXRpb25fLnk7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzJdID0gdGhpcy5vcmllbnRhdGlvbl8uejtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bM10gPSB0aGlzLm9yaWVudGF0aW9uXy53O1xuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IG51bGwsXG4gICAgb3JpZW50YXRpb246IHRoaXMub3JpZW50YXRpb25PdXRfLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25LZXlEb3duXyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gVHJhY2sgV0FTRCBhbmQgYXJyb3cga2V5cy5cbiAgaWYgKGUua2V5Q29kZSA9PSAzOCkgeyAvLyBVcCBrZXkuXG4gICAgdGhpcy5hbmltYXRlUGhpXyh0aGlzLnBoaV8gKyBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAzOSkgeyAvLyBSaWdodCBrZXkuXG4gICAgdGhpcy5hbmltYXRlVGhldGFfKHRoaXMudGhldGFfIC0gS0VZX1NQRUVEKTtcbiAgfSBlbHNlIGlmIChlLmtleUNvZGUgPT0gNDApIHsgLy8gRG93biBrZXkuXG4gICAgdGhpcy5hbmltYXRlUGhpXyh0aGlzLnBoaV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSAzNykgeyAvLyBMZWZ0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gKyBLRVlfU1BFRUQpO1xuICB9XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5hbmltYXRlVGhldGFfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgdGhpcy5hbmltYXRlS2V5VHJhbnNpdGlvbnNfKCd0aGV0YV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5hbmltYXRlUGhpXyA9IGZ1bmN0aW9uKHRhcmdldEFuZ2xlKSB7XG4gIC8vIFByZXZlbnQgbG9va2luZyB0b28gZmFyIHVwIG9yIGRvd24uXG4gIHRhcmdldEFuZ2xlID0gVXRpbC5jbGFtcCh0YXJnZXRBbmdsZSwgLU1hdGguUEkvMiwgTWF0aC5QSS8yKTtcbiAgdGhpcy5hbmltYXRlS2V5VHJhbnNpdGlvbnNfKCdwaGlfJywgdGFyZ2V0QW5nbGUpO1xufTtcblxuLyoqXG4gKiBTdGFydCBhbiBhbmltYXRpb24gdG8gdHJhbnNpdGlvbiBhbiBhbmdsZSBmcm9tIG9uZSB2YWx1ZSB0byBhbm90aGVyLlxuICovXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5hbmltYXRlS2V5VHJhbnNpdGlvbnNfID0gZnVuY3Rpb24oYW5nbGVOYW1lLCB0YXJnZXRBbmdsZSkge1xuICAvLyBJZiBhbiBhbmltYXRpb24gaXMgY3VycmVudGx5IHJ1bm5pbmcsIGNhbmNlbCBpdC5cbiAgaWYgKHRoaXMuYW5nbGVBbmltYXRpb25fKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmdsZUFuaW1hdGlvbl8pO1xuICB9XG4gIHZhciBzdGFydEFuZ2xlID0gdGhpc1thbmdsZU5hbWVdO1xuICB2YXIgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgLy8gU2V0IHVwIGFuIGludGVydmFsIHRpbWVyIHRvIHBlcmZvcm0gdGhlIGFuaW1hdGlvbi5cbiAgdGhpcy5hbmdsZUFuaW1hdGlvbl8gPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gYW5pbWF0ZSgpIHtcbiAgICAvLyBPbmNlIHdlJ3JlIGZpbmlzaGVkIHRoZSBhbmltYXRpb24sIHdlJ3JlIGRvbmUuXG4gICAgdmFyIGVsYXBzZWQgPSBuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lO1xuICAgIGlmIChlbGFwc2VkID49IEtFWV9BTklNQVRJT05fRFVSQVRJT04pIHtcbiAgICAgIHRoaXNbYW5nbGVOYW1lXSA9IHRhcmdldEFuZ2xlO1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5hbmdsZUFuaW1hdGlvbl8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBsb29wIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgdGhpcy5hbmdsZUFuaW1hdGlvbl8gPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZS5iaW5kKHRoaXMpKVxuICAgIC8vIExpbmVhcmx5IGludGVycG9sYXRlIHRoZSBhbmdsZSBzb21lIGFtb3VudC5cbiAgICB2YXIgcGVyY2VudCA9IGVsYXBzZWQgLyBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OO1xuICAgIHRoaXNbYW5nbGVOYW1lXSA9IHN0YXJ0QW5nbGUgKyAodGFyZ2V0QW5nbGUgLSBzdGFydEFuZ2xlKSAqIHBlcmNlbnQ7XG4gIH0uYmluZCh0aGlzKSk7XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk1vdXNlRG93bl8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMucm90YXRlU3RhcnRfLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIHRoaXMuaXNEcmFnZ2luZ18gPSB0cnVlO1xufTtcblxuLy8gVmVyeSBzaW1pbGFyIHRvIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL21yZmxpeC84MzUxMDIwXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk1vdXNlTW92ZV8gPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5pc0RyYWdnaW5nXyAmJiAhdGhpcy5pc1BvaW50ZXJMb2NrZWRfKCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gU3VwcG9ydCBwb2ludGVyIGxvY2sgQVBJLlxuICBpZiAodGhpcy5pc1BvaW50ZXJMb2NrZWRfKCkpIHtcbiAgICB2YXIgbW92ZW1lbnRYID0gZS5tb3ZlbWVudFggfHwgZS5tb3pNb3ZlbWVudFggfHwgMDtcbiAgICB2YXIgbW92ZW1lbnRZID0gZS5tb3ZlbWVudFkgfHwgZS5tb3pNb3ZlbWVudFkgfHwgMDtcbiAgICB0aGlzLnJvdGF0ZUVuZF8uc2V0KHRoaXMucm90YXRlU3RhcnRfLnggLSBtb3ZlbWVudFgsIHRoaXMucm90YXRlU3RhcnRfLnkgLSBtb3ZlbWVudFkpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucm90YXRlRW5kXy5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB9XG4gIC8vIENhbGN1bGF0ZSBob3cgbXVjaCB3ZSBtb3ZlZCBpbiBtb3VzZSBzcGFjZS5cbiAgdGhpcy5yb3RhdGVEZWx0YV8uc3ViVmVjdG9ycyh0aGlzLnJvdGF0ZUVuZF8sIHRoaXMucm90YXRlU3RhcnRfKTtcbiAgdGhpcy5yb3RhdGVTdGFydF8uY29weSh0aGlzLnJvdGF0ZUVuZF8pO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgdGhlIGN1bXVsYXRpdmUgZXVsZXIgYW5nbGVzLlxuICB0aGlzLnBoaV8gKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhXy55IC8gc2NyZWVuLmhlaWdodCAqIE1PVVNFX1NQRUVEX1k7XG4gIHRoaXMudGhldGFfICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YV8ueCAvIHNjcmVlbi53aWR0aCAqIE1PVVNFX1NQRUVEX1g7XG5cbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGhpcy5waGlfID0gVXRpbC5jbGFtcCh0aGlzLnBoaV8sIC1NYXRoLlBJLzIsIE1hdGguUEkvMik7XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbk1vdXNlVXBfID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gZmFsc2U7XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5pc1BvaW50ZXJMb2NrZWRfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBlbCA9IGRvY3VtZW50LnBvaW50ZXJMb2NrRWxlbWVudCB8fCBkb2N1bWVudC5tb3pQb2ludGVyTG9ja0VsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50LndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudDtcbiAgcmV0dXJuIGVsICE9PSB1bmRlZmluZWQ7XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5waGlfID0gMDtcbiAgdGhpcy50aGV0YV8gPSAwO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNb3VzZUtleWJvYXJkVlJEaXNwbGF5O1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuZnVuY3Rpb24gUm90YXRlSW5zdHJ1Y3Rpb25zKCkge1xuICB0aGlzLmxvYWRJY29uXygpO1xuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMudG9wID0gMDtcbiAgcy5yaWdodCA9IDA7XG4gIHMuYm90dG9tID0gMDtcbiAgcy5sZWZ0ID0gMDtcbiAgcy5iYWNrZ3JvdW5kQ29sb3IgPSAnZ3JheSc7XG4gIHMuZm9udEZhbWlseSA9ICdzYW5zLXNlcmlmJztcbiAgLy8gRm9yY2UgdGhpcyB0byBiZSBhYm92ZSB0aGUgZnVsbHNjcmVlbiBjYW52YXMsIHdoaWNoIGlzIGF0IHpJbmRleDogOTk5OTk5LlxuICBzLnpJbmRleCA9IDEwMDAwMDA7XG5cbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWcuc3JjID0gdGhpcy5pY29uO1xuICB2YXIgcyA9IGltZy5zdHlsZTtcbiAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gIHMubWFyZ2luVG9wID0gJzI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChpbWcpO1xuXG4gIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gdGV4dC5zdHlsZTtcbiAgcy50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgcy5mb250U2l6ZSA9ICcxNnB4JztcbiAgcy5saW5lSGVpZ2h0ID0gJzI0cHgnO1xuICBzLm1hcmdpbiA9ICcyNHB4IDI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgdGV4dC5pbm5lckhUTUwgPSAnUGxhY2UgeW91ciBwaG9uZSBpbnRvIHlvdXIgQ2FyZGJvYXJkIHZpZXdlci4nO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHRleHQpO1xuXG4gIHZhciBzbmFja2JhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IHNuYWNrYmFyLnN0eWxlO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICcjQ0ZEOERDJztcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMuYm90dG9tID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnNDhweCc7XG4gIHMucGFkZGluZyA9ICcxNHB4IDI0cHgnO1xuICBzLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChzbmFja2Jhcik7XG5cbiAgdmFyIHNuYWNrYmFyVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzbmFja2JhclRleHQuc3R5bGUuZmxvYXQgPSAnbGVmdCc7XG4gIHNuYWNrYmFyVGV4dC5pbm5lckhUTUwgPSAnTm8gQ2FyZGJvYXJkIHZpZXdlcj8nO1xuXG4gIHZhciBzbmFja2JhckJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgc25hY2tiYXJCdXR0b24uaHJlZiA9ICdodHRwczovL3d3dy5nb29nbGUuY29tL2dldC9jYXJkYm9hcmQvZ2V0LWNhcmRib2FyZC8nO1xuICBzbmFja2JhckJ1dHRvbi5pbm5lckhUTUwgPSAnZ2V0IG9uZSc7XG4gIHNuYWNrYmFyQnV0dG9uLnRhcmdldCA9ICdfYmxhbmsnO1xuICB2YXIgcyA9IHNuYWNrYmFyQnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy5mb250V2VpZ2h0ID0gNjAwO1xuICBzLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcbiAgcy5ib3JkZXJMZWZ0ID0gJzFweCBzb2xpZCBncmF5JztcbiAgcy5wYWRkaW5nTGVmdCA9ICcyNHB4JztcbiAgcy50ZXh0RGVjb3JhdGlvbiA9ICdub25lJztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcblxuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhclRleHQpO1xuICBzbmFja2Jhci5hcHBlbmRDaGlsZChzbmFja2JhckJ1dHRvbik7XG5cbiAgdGhpcy5vdmVybGF5ID0gb3ZlcmxheTtcbiAgdGhpcy50ZXh0ID0gdGV4dDtcblxuICB0aGlzLmhpZGUoKTtcbn1cblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocGFyZW50KSB7XG4gIGlmICghcGFyZW50ICYmICF0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCkge1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5vdmVybGF5KTtcbiAgfSBlbHNlIGlmIChwYXJlbnQpIHtcbiAgICBpZiAodGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgJiYgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQgIT0gcGFyZW50KVxuICAgICAgdGhpcy5vdmVybGF5LnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5vdmVybGF5KTtcblxuICAgIHBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9XG5cbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gIHZhciBpbWcgPSB0aGlzLm92ZXJsYXkucXVlcnlTZWxlY3RvcignaW1nJyk7XG4gIHZhciBzID0gaW1nLnN0eWxlO1xuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgcy53aWR0aCA9ICcyMCUnO1xuICAgIHMubWFyZ2luTGVmdCA9ICc0MCUnO1xuICAgIHMubWFyZ2luVG9wID0gJzMlJztcbiAgfSBlbHNlIHtcbiAgICBzLndpZHRoID0gJzUwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMjUlJztcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5zaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbihtcywgcGFyZW50KSB7XG4gIHRoaXMuc2hvdyhwYXJlbnQpO1xuICB0aGlzLnRpbWVyID0gc2V0VGltZW91dCh0aGlzLmhpZGUuYmluZCh0aGlzKSwgbXMpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5ID0gZnVuY3Rpb24oKSB7XG4gIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuZGlzYWJsZVNob3dUZW1wb3JhcmlseSgpO1xuICAvLyBJbiBwb3J0cmFpdCBWUiBtb2RlLCB0ZWxsIHRoZSB1c2VyIHRvIHJvdGF0ZSB0byBsYW5kc2NhcGUuIE90aGVyd2lzZSwgaGlkZVxuICAvLyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICBpZiAoIVV0aWwuaXNMYW5kc2NhcGVNb2RlKCkgJiYgVXRpbC5pc01vYmlsZSgpKSB7XG4gICAgdGhpcy5zaG93KCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5oaWRlKCk7XG4gIH1cbn07XG5cblJvdGF0ZUluc3RydWN0aW9ucy5wcm90b3R5cGUubG9hZEljb25fID0gZnVuY3Rpb24oKSB7XG4gIC8vIEVuY29kZWQgYXNzZXRfc3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuc3ZnXG4gIHRoaXMuaWNvbiA9IFV0aWwuYmFzZTY0KCdpbWFnZS9zdmcreG1sJywgJ1BEOTRiV3dnZG1WeWMybHZiajBpTVM0d0lpQmxibU52WkdsdVp6MGlWVlJHTFRnaUlITjBZVzVrWVd4dmJtVTlJbTV2SWo4K0NqeHpkbWNnZDJsa2RHZzlJakU1T0hCNElpQm9aV2xuYUhROUlqSTBNSEI0SWlCMmFXVjNRbTk0UFNJd0lEQWdNVGs0SURJME1DSWdkbVZ5YzJsdmJqMGlNUzR4SWlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhodGJHNXpPbmhzYVc1clBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1TDNoc2FXNXJJaUI0Yld4dWN6cHphMlYwWTJnOUltaDBkSEE2THk5M2QzY3VZbTlvWlcxcFlXNWpiMlJwYm1jdVkyOXRMM05yWlhSamFDOXVjeUkrQ2lBZ0lDQThJUzB0SUVkbGJtVnlZWFJ2Y2pvZ1UydGxkR05vSURNdU15NHpJQ2d4TWpBNE1Ta2dMU0JvZEhSd09pOHZkM2QzTG1KdmFHVnRhV0Z1WTI5a2FXNW5MbU52YlM5emEyVjBZMmdnTFMwK0NpQWdJQ0E4ZEdsMGJHVStkSEpoYm5OcGRHbHZiand2ZEdsMGJHVStDaUFnSUNBOFpHVnpZejVEY21WaGRHVmtJSGRwZEdnZ1UydGxkR05vTGp3dlpHVnpZejRLSUNBZ0lEeGtaV1p6UGp3dlpHVm1jejRLSUNBZ0lEeG5JR2xrUFNKUVlXZGxMVEVpSUhOMGNtOXJaVDBpYm05dVpTSWdjM1J5YjJ0bExYZHBaSFJvUFNJeElpQm1hV3hzUFNKdWIyNWxJaUJtYVd4c0xYSjFiR1U5SW1WMlpXNXZaR1FpSUhOclpYUmphRHAwZVhCbFBTSk5VMUJoWjJVaVBnb2dJQ0FnSUNBZ0lEeG5JR2xrUFNKMGNtRnVjMmwwYVc5dUlpQnphMlYwWTJnNmRIbHdaVDBpVFZOQmNuUmliMkZ5WkVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ1BHY2dhV1E5SWtsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUUXRLeTFKYlhCdmNuUmxaQzFNWVhsbGNuTXRRMjl3ZVMwckxVbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVEl0UTI5d2VTSWdjMnRsZEdOb09uUjVjR1U5SWsxVFRHRjVaWEpIY205MWNDSStDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa3ROQ0lnZEhKaGJuTm1iM0p0UFNKMGNtRnVjMnhoZEdVb01DNHdNREF3TURBc0lERXdOeTR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMall5TlN3eUxqVXlOeUJETVRRNUxqWXlOU3d5TGpVeU55QXhOVFV1T0RBMUxEWXVNRGsySURFMU5pNHpOaklzTmk0ME1UZ2dUREUxTmk0ek5qSXNOeTR6TURRZ1F6RTFOaTR6TmpJc055NDBPREVnTVRVMkxqTTNOU3czTGpZMk5DQXhOVFl1TkN3M0xqZzFNeUJETVRVMkxqUXhMRGN1T1RNMElERTFOaTQwTWl3NExqQXhOU0F4TlRZdU5ESTNMRGd1TURrMUlFTXhOVFl1TlRZM0xEa3VOVEVnTVRVM0xqUXdNU3d4TVM0d09UTWdNVFU0TGpVek1pd3hNaTR3T1RRZ1RERTJOQzR5TlRJc01UY3VNVFUySUV3eE5qUXVNek16TERFM0xqQTJOaUJETVRZMExqTXpNeXd4Tnk0d05qWWdNVFk0TGpjeE5Td3hOQzQxTXpZZ01UWTVMalUyT0N3eE5DNHdORElnUXpFM01TNHdNalVzTVRRdU9EZ3pJREU1TlM0MU16Z3NNamt1TURNMUlERTVOUzQxTXpnc01qa3VNRE0xSUV3eE9UVXVOVE00TERnekxqQXpOaUJETVRrMUxqVXpPQ3c0TXk0NE1EY2dNVGsxTGpFMU1pdzROQzR5TlRNZ01UazBMalU1TERnMExqSTFNeUJETVRrMExqTTFOeXc0TkM0eU5UTWdNVGswTGpBNU5TdzROQzR4TnpjZ01Ua3pMamd4T0N3NE5DNHdNVGNnVERFMk9TNDROVEVzTnpBdU1UYzVJRXd4TmprdU9ETTNMRGN3TGpJd015Qk1NVFF5TGpVeE5TdzROUzQ1TnpnZ1RERTBNUzQyTmpVc09EUXVOalUxSUVNeE16WXVPVE0wTERnekxqRXlOaUF4TXpFdU9URTNMRGd4TGpreE5TQXhNall1TnpFMExEZ3hMakEwTlNCRE1USTJMamN3T1N3NE1TNHdOaUF4TWpZdU56QTNMRGd4TGpBMk9TQXhNall1TnpBM0xEZ3hMakEyT1NCTU1USXhMalkwTERrNExqQXpJRXd4TVRNdU56UTVMREV3TWk0MU9EWWdUREV4TXk0M01USXNNVEF5TGpVeU15Qk1NVEV6TGpjeE1pd3hNekF1TVRFeklFTXhNVE11TnpFeUxERXpNQzQ0T0RVZ01URXpMak15Tml3eE16RXVNek1nTVRFeUxqYzJOQ3d4TXpFdU16TWdRekV4TWk0MU16SXNNVE14TGpNeklERXhNaTR5Tmprc01UTXhMakkxTkNBeE1URXVPVGt5TERFek1TNHdPVFFnVERZNUxqVXhPU3d4TURZdU5UY3lJRU0yT0M0MU5qa3NNVEEyTGpBeU15QTJOeTQzT1Rrc01UQTBMalk1TlNBMk55NDNPVGtzTVRBekxqWXdOU0JNTmpjdU56azVMREV3TWk0MU55Qk1OamN1TnpjNExERXdNaTQyTVRjZ1F6WTNMakkzTERFd01pNHpPVE1nTmpZdU5qUTRMREV3TWk0eU5Ea2dOalV1T1RZeUxERXdNaTR5TVRnZ1F6WTFMamczTlN3eE1ESXVNakUwSURZMUxqYzRPQ3d4TURJdU1qRXlJRFkxTGpjd01Td3hNREl1TWpFeUlFTTJOUzQyTURZc01UQXlMakl4TWlBMk5TNDFNVEVzTVRBeUxqSXhOU0EyTlM0ME1UWXNNVEF5TGpJeE9TQkROalV1TVRrMUxERXdNaTR5TWprZ05qUXVPVGMwTERFd01pNHlNelVnTmpRdU56VTBMREV3TWk0eU16VWdRelkwTGpNek1Td3hNREl1TWpNMUlEWXpMamt4TVN3eE1ESXVNakUySURZekxqUTVPQ3d4TURJdU1UYzRJRU0yTVM0NE5ETXNNVEF5TGpBeU5TQTJNQzR5T1Rnc01UQXhMalUzT0NBMU9TNHdPVFFzTVRBd0xqZzRNaUJNTVRJdU5URTRMRGN6TGprNU1pQk1NVEl1TlRJekxEYzBMakF3TkNCTU1pNHlORFVzTlRVdU1qVTBJRU14TGpJME5DdzFNeTQwTWpjZ01pNHdNRFFzTlRFdU1ETTRJRE11T1RRekxEUTVMamt4T0NCTU5Ua3VPVFUwTERFM0xqVTNNeUJETmpBdU5qSTJMREUzTGpFNE5TQTJNUzR6TlN3eE55NHdNREVnTmpJdU1EVXpMREUzTGpBd01TQkROak11TXpjNUxERTNMakF3TVNBMk5DNDJNalVzTVRjdU5qWWdOalV1TWpnc01UZ3VPRFUwSUV3Mk5TNHlPRFVzTVRndU9EVXhJRXcyTlM0MU1USXNNVGt1TWpZMElFdzJOUzQxTURZc01Ua3VNalk0SUVNMk5TNDVNRGtzTWpBdU1EQXpJRFkyTGpRd05Td3lNQzQyT0NBMk5pNDVPRE1zTWpFdU1qZzJJRXcyTnk0eU5pd3lNUzQxTlRZZ1F6WTVMakUzTkN3eU15NDBNRFlnTnpFdU56STRMREkwTGpNMU55QTNOQzR6TnpNc01qUXVNelUzSUVNM05pNHpNaklzTWpRdU16VTNJRGM0TGpNeU1Td3lNeTQ0TkNBNE1DNHhORGdzTWpJdU56ZzFJRU00TUM0eE5qRXNNakl1TnpnMUlEZzNMalEyTnl3eE9DNDFOallnT0RjdU5EWTNMREU0TGpVMk5pQkRPRGd1TVRNNUxERTRMakUzT0NBNE9DNDROak1zTVRjdU9UazBJRGc1TGpVMk5pd3hOeTQ1T1RRZ1F6a3dMamc1TWl3eE55NDVPVFFnT1RJdU1UTTRMREU0TGpZMU1pQTVNaTQzT1RJc01Ua3VPRFEzSUV3NU5pNHdORElzTWpVdU56YzFJRXc1Tmk0d05qUXNNalV1TnpVM0lFd3hNREl1T0RRNUxESTVMalkzTkNCTU1UQXlMamMwTkN3eU9TNDBPVElnVERFME9TNDJNalVzTWk0MU1qY2dUVEUwT1M0Mk1qVXNNQzQ0T1RJZ1F6RTBPUzR6TkRNc01DNDRPVElnTVRRNUxqQTJNaXd3TGprMk5TQXhORGd1T0RFc01TNHhNU0JNTVRBeUxqWTBNU3d5Tnk0Mk5qWWdURGszTGpJek1Td3lOQzQxTkRJZ1REazBMakl5Tml3eE9TNHdOakVnUXprekxqTXhNeXd4Tnk0ek9UUWdPVEV1TlRJM0xERTJMak0xT1NBNE9TNDFOallzTVRZdU16VTRJRU00T0M0MU5UVXNNVFl1TXpVNElEZzNMalUwTml3eE5pNDJNeklnT0RZdU5qUTVMREUzTGpFMUlFTTRNeTQ0Tnpnc01UZ3VOelVnTnprdU5qZzNMREl4TGpFMk9TQTNPUzR6TnpRc01qRXVNelExSUVNM09TNHpOVGtzTWpFdU16VXpJRGM1TGpNME5Td3lNUzR6TmpFZ056a3VNek1zTWpFdU16WTVJRU0zTnk0M09UZ3NNakl1TWpVMElEYzJMakE0TkN3eU1pNDNNaklnTnpRdU16Y3pMREl5TGpjeU1pQkROekl1TURneExESXlMamN5TWlBMk9TNDVOVGtzTWpFdU9Ea2dOamd1TXprM0xESXdMak00SUV3Mk9DNHhORFVzTWpBdU1UTTFJRU0yTnk0M01EWXNNVGt1TmpjeUlEWTNMak15TXl3eE9TNHhOVFlnTmpjdU1EQTJMREU0TGpZd01TQkROall1T1RnNExERTRMalUxT1NBMk5pNDVOamdzTVRndU5URTVJRFkyTGprME5pd3hPQzQwTnprZ1REWTJMamN4T1N3eE9DNHdOalVnUXpZMkxqWTVMREU0TGpBeE1pQTJOaTQyTlRnc01UY3VPVFlnTmpZdU5qSTBMREUzTGpreE1TQkROalV1TmpnMkxERTJMak16TnlBMk15NDVOVEVzTVRVdU16WTJJRFl5TGpBMU15d3hOUzR6TmpZZ1F6WXhMakEwTWl3eE5TNHpOallnTmpBdU1ETXpMREUxTGpZMElEVTVMakV6Tml3eE5pNHhOVGdnVERNdU1USTFMRFE0TGpVd01pQkRNQzQwTWpZc05UQXVNRFl4SUMwd0xqWXhNeXcxTXk0ME5ESWdNQzQ0TVRFc05UWXVNRFFnVERFeExqQTRPU3czTkM0M09TQkRNVEV1TWpZMkxEYzFMakV4TXlBeE1TNDFNemNzTnpVdU16VXpJREV4TGpnMUxEYzFMalE1TkNCTU5UZ3VNamMyTERFd01pNHlPVGdnUXpVNUxqWTNPU3d4TURNdU1UQTRJRFl4TGpRek15d3hNRE11TmpNZ05qTXVNelE0TERFd015NDRNRFlnUXpZekxqZ3hNaXd4TURNdU9EUTRJRFkwTGpJNE5Td3hNRE11T0RjZ05qUXVOelUwTERFd015NDROeUJETmpVc01UQXpMamczSURZMUxqSTBPU3d4TURNdU9EWTBJRFkxTGpRNU5Dd3hNRE11T0RVeUlFTTJOUzQxTmpNc01UQXpMamcwT1NBMk5TNDJNeklzTVRBekxqZzBOeUEyTlM0M01ERXNNVEF6TGpnME55QkROalV1TnpZMExERXdNeTQ0TkRjZ05qVXVPREk0TERFd015NDRORGtnTmpVdU9Ea3NNVEF6TGpnMU1pQkROalV1T1RnMkxERXdNeTQ0TlRZZ05qWXVNRGdzTVRBekxqZzJNeUEyTmk0eE56TXNNVEF6TGpnM05DQkROall1TWpneUxERXdOUzQwTmpjZ05qY3VNek15TERFd055NHhPVGNnTmpndU56QXlMREV3Tnk0NU9EZ2dUREV4TVM0eE56UXNNVE15TGpVeElFTXhNVEV1TmprNExERXpNaTQ0TVRJZ01URXlMakl6TWl3eE16SXVPVFkxSURFeE1pNDNOalFzTVRNeUxqazJOU0JETVRFMExqSTJNU3d4TXpJdU9UWTFJREV4TlM0ek5EY3NNVE14TGpjMk5TQXhNVFV1TXpRM0xERXpNQzR4TVRNZ1RERXhOUzR6TkRjc01UQXpMalUxTVNCTU1USXlMalExT0N3NU9TNDBORFlnUXpFeU1pNDRNVGtzT1RrdU1qTTNJREV5TXk0d09EY3NPVGd1T0RrNElERXlNeTR5TURjc09UZ3VORGs0SUV3eE1qY3VPRFkxTERneUxqa3dOU0JETVRNeUxqSTNPU3c0TXk0M01ESWdNVE0yTGpVMU55dzROQzQzTlRNZ01UUXdMall3Tnl3NE5pNHdNek1nVERFME1TNHhOQ3c0Tmk0NE5qSWdRekUwTVM0ME5URXNPRGN1TXpRMklERTBNUzQ1Tnpjc09EY3VOakV6SURFME1pNDFNVFlzT0RjdU5qRXpJRU14TkRJdU56azBMRGczTGpZeE15QXhORE11TURjMkxEZzNMalUwTWlBeE5ETXVNek16TERnM0xqTTVNeUJNTVRZNUxqZzJOU3czTWk0d056WWdUREU1TXl3NE5TNDBNek1nUXpFNU15NDFNak1zT0RVdU56TTFJREU1TkM0d05UZ3NPRFV1T0RnNElERTVOQzQxT1N3NE5TNDRPRGdnUXpFNU5pNHdPRGNzT0RVdU9EZzRJREU1Tnk0eE56TXNPRFF1TmpnNUlERTVOeTR4TnpNc09ETXVNRE0ySUV3eE9UY3VNVGN6TERJNUxqQXpOU0JETVRrM0xqRTNNeXd5T0M0ME5URWdNVGsyTGpnMk1Td3lOeTQ1TVRFZ01UazJMak0xTlN3eU55NDJNVGtnUXpFNU5pNHpOVFVzTWpjdU5qRTVJREUzTVM0NE5ETXNNVE11TkRZM0lERTNNQzR6T0RVc01USXVOakkySUVNeE56QXVNVE15TERFeUxqUTRJREUyT1M0NE5Td3hNaTQwTURjZ01UWTVMalUyT0N3eE1pNDBNRGNnUXpFMk9TNHlPRFVzTVRJdU5EQTNJREUyT1M0d01ESXNNVEl1TkRneElERTJPQzQzTkRrc01USXVOakkzSUVNeE5qZ3VNVFF6TERFeUxqazNPQ0F4TmpVdU56VTJMREUwTGpNMU55QXhOalF1TkRJMExERTFMakV5TlNCTU1UVTVMall4TlN3eE1DNDROeUJETVRVNExqYzVOaXd4TUM0eE5EVWdNVFU0TGpFMU5DdzRMamt6TnlBeE5UZ3VNRFUwTERjdU9UTTBJRU14TlRndU1EUTFMRGN1T0RNM0lERTFPQzR3TXpRc055NDNNemtnTVRVNExqQXlNU3czTGpZMElFTXhOVGd1TURBMUxEY3VOVEl6SURFMU55NDVPVGdzTnk0ME1TQXhOVGN1T1RrNExEY3VNekEwSUV3eE5UY3VPVGs0TERZdU5ERTRJRU14TlRjdU9UazRMRFV1T0RNMElERTFOeTQyT0RZc05TNHlPVFVnTVRVM0xqRTRNU3cxTGpBd01pQkRNVFUyTGpZeU5DdzBMalk0SURFMU1DNDBORElzTVM0eE1URWdNVFV3TGpRME1pd3hMakV4TVNCRE1UVXdMakU0T1N3d0xqazJOU0F4TkRrdU9UQTNMREF1T0RreUlERTBPUzQyTWpVc01DNDRPVElpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9UWXVNREkzTERJMUxqWXpOaUJNTVRReUxqWXdNeXcxTWk0MU1qY2dRekUwTXk0NE1EY3NOVE11TWpJeUlERTBOQzQxT0RJc05UUXVNVEUwSURFME5DNDRORFVzTlRVdU1EWTRJRXd4TkRRdU9ETTFMRFUxTGpBM05TQk1Oak11TkRZeExERXdNaTR3TlRjZ1REWXpMalEyTERFd01pNHdOVGNnUXpZeExqZ3dOaXd4TURFdU9UQTFJRFl3TGpJMk1Td3hNREV1TkRVM0lEVTVMakExTnl3eE1EQXVOell5SUV3eE1pNDBPREVzTnpNdU9EY3hJRXc1Tmk0d01qY3NNalV1TmpNMklpQnBaRDBpUm1sc2JDMHlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFl6TGpRMk1Td3hNREl1TVRjMElFTTJNeTQwTlRNc01UQXlMakUzTkNBMk15NDBORFlzTVRBeUxqRTNOQ0EyTXk0ME16a3NNVEF5TGpFM01pQkROakV1TnpRMkxERXdNaTR3TVRZZ05qQXVNakV4TERFd01TNDFOak1nTlRndU9UazRMREV3TUM0NE5qTWdUREV5TGpReU1pdzNNeTQ1TnpNZ1F6RXlMak00Tml3M015NDVOVElnTVRJdU16WTBMRGN6TGpreE5DQXhNaTR6TmpRc056TXVPRGN4SUVNeE1pNHpOalFzTnpNdU9ETWdNVEl1TXpnMkxEY3pMamM1TVNBeE1pNDBNaklzTnpNdU56Y2dURGsxTGprMk9Dd3lOUzQxTXpVZ1F6azJMakF3TkN3eU5TNDFNVFFnT1RZdU1EUTVMREkxTGpVeE5DQTVOaTR3T0RVc01qVXVOVE0xSUV3eE5ESXVOall4TERVeUxqUXlOaUJETVRRekxqZzRPQ3cxTXk0eE16UWdNVFEwTGpZNE1pdzFOQzR3TXpnZ01UUTBMamsxTnl3MU5TNHdNemNnUXpFME5DNDVOeXcxTlM0d09ETWdNVFEwTGprMU15dzFOUzR4TXpNZ01UUTBMamt4TlN3MU5TNHhOakVnUXpFME5DNDVNVEVzTlRVdU1UWTFJREUwTkM0NE9UZ3NOVFV1TVRjMElERTBOQzQ0T1RRc05UVXVNVGMzSUV3Mk15NDFNVGtzTVRBeUxqRTFPQ0JETmpNdU5UQXhMREV3TWk0eE5qa2dOak11TkRneExERXdNaTR4TnpRZ05qTXVORFl4TERFd01pNHhOelFnVERZekxqUTJNU3d4TURJdU1UYzBJRm9nVFRFeUxqY3hOQ3czTXk0NE56RWdURFU1TGpFeE5Td3hNREF1TmpZeElFTTJNQzR5T1RNc01UQXhMak0wTVNBMk1TNDNPRFlzTVRBeExqYzRNaUEyTXk0ME16VXNNVEF4TGprek55Qk1NVFEwTGpjd055dzFOUzR3TVRVZ1F6RTBOQzQwTWpnc05UUXVNVEE0SURFME15NDJPRElzTlRNdU1qZzFJREUwTWk0MU5EUXNOVEl1TmpJNElFdzVOaTR3TWpjc01qVXVOemN4SUV3eE1pNDNNVFFzTnpNdU9EY3hJRXd4TWk0M01UUXNOek11T0RjeElGb2lJR2xrUFNKR2FXeHNMVE1pSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNExqTXlOeXcxT0M0ME56RWdRekUwT0M0eE5EVXNOVGd1TkRnZ01UUTNMamsyTWl3MU9DNDBPQ0F4TkRjdU56Z3hMRFU0TGpRM01pQkRNVFExTGpnNE55dzFPQzR6T0RrZ01UUTBMalEzT1N3MU55NDBNelFnTVRRMExqWXpOaXcxTmk0ek5DQkRNVFEwTGpZNE9TdzFOUzQ1TmpjZ01UUTBMalkyTkN3MU5TNDFPVGNnTVRRMExqVTJOQ3cxTlM0eU16VWdURFl6TGpRMk1Td3hNREl1TURVM0lFTTJOQzR3T0Rrc01UQXlMakV4TlNBMk5DNDNNek1zTVRBeUxqRXpJRFkxTGpNM09Td3hNREl1TURrNUlFTTJOUzQxTmpFc01UQXlMakE1SURZMUxqYzBNeXd4TURJdU1Ea2dOalV1T1RJMUxERXdNaTR3T1RnZ1F6WTNMamd4T1N3eE1ESXVNVGd4SURZNUxqSXlOeXd4TURNdU1UTTJJRFk1TGpBM0xERXdOQzR5TXlCTU1UUTRMak15Tnl3MU9DNDBOekVpSUdsa1BTSkdhV3hzTFRRaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk5qa3VNRGNzTVRBMExqTTBOeUJETmprdU1EUTRMREV3TkM0ek5EY2dOamt1TURJMUxERXdOQzR6TkNBMk9TNHdNRFVzTVRBMExqTXlOeUJETmpndU9UWTRMREV3TkM0ek1ERWdOamd1T1RRNExERXdOQzR5TlRjZ05qZ3VPVFUxTERFd05DNHlNVE1nUXpZNUxERXdNeTQ0T1RZZ05qZ3VPRGs0TERFd015NDFOellnTmpndU5qVTRMREV3TXk0eU9EZ2dRelk0TGpFMU15d3hNREl1TmpjNElEWTNMakV3TXl3eE1ESXVNalkySURZMUxqa3lMREV3TWk0eU1UUWdRelkxTGpjME1pd3hNREl1TWpBMklEWTFMalUyTXl3eE1ESXVNakEzSURZMUxqTTROU3d4TURJdU1qRTFJRU0yTkM0M05ESXNNVEF5TGpJME5pQTJOQzR3T0Rjc01UQXlMakl6TWlBMk15NDBOU3d4TURJdU1UYzBJRU0yTXk0ek9Ua3NNVEF5TGpFMk9TQTJNeTR6TlRnc01UQXlMakV6TWlBMk15NHpORGNzTVRBeUxqQTRNaUJETmpNdU16TTJMREV3TWk0d016TWdOak11TXpVNExERXdNUzQ1T0RFZ05qTXVOREF5TERFd01TNDVOVFlnVERFME5DNDFNRFlzTlRVdU1UTTBJRU14TkRRdU5UTTNMRFUxTGpFeE5pQXhORFF1TlRjMUxEVTFMakV4TXlBeE5EUXVOakE1TERVMUxqRXlOeUJETVRRMExqWTBNaXcxTlM0eE5ERWdNVFEwTGpZMk9DdzFOUzR4TnlBeE5EUXVOamMzTERVMUxqSXdOQ0JETVRRMExqYzRNU3cxTlM0MU9EVWdNVFEwTGpnd05pdzFOUzQ1TnpJZ01UUTBMamMxTVN3MU5pNHpOVGNnUXpFME5DNDNNRFlzTlRZdU5qY3pJREUwTkM0NE1EZ3NOVFl1T1RrMElERTBOUzR3TkRjc05UY3VNamd5SUVNeE5EVXVOVFV6TERVM0xqZzVNaUF4TkRZdU5qQXlMRFU0TGpNd015QXhORGN1TnpnMkxEVTRMak0xTlNCRE1UUTNMamsyTkN3MU9DNHpOak1nTVRRNExqRTBNeXcxT0M0ek5qTWdNVFE0TGpNeU1TdzFPQzR6TlRRZ1F6RTBPQzR6Tnpjc05UZ3VNelV5SURFME9DNDBNalFzTlRndU16ZzNJREUwT0M0ME16a3NOVGd1TkRNNElFTXhORGd1TkRVMExEVTRMalE1SURFME9DNDBNeklzTlRndU5UUTFJREUwT0M0ek9EVXNOVGd1TlRjeUlFdzJPUzR4TWprc01UQTBMak16TVNCRE5qa3VNVEV4TERFd05DNHpORElnTmprdU1Ea3NNVEEwTGpNME55QTJPUzR3Tnl3eE1EUXVNelEzSUV3Mk9TNHdOeXd4TURRdU16UTNJRm9nVFRZMUxqWTJOU3d4TURFdU9UYzFJRU0yTlM0M05UUXNNVEF4TGprM05TQTJOUzQ0TkRJc01UQXhMamszTnlBMk5TNDVNeXd4TURFdU9UZ3hJRU0yTnk0eE9UWXNNVEF5TGpBek55QTJPQzR5T0RNc01UQXlMalEyT1NBMk9DNDRNemdzTVRBekxqRXpPU0JETmprdU1EWTFMREV3TXk0ME1UTWdOamt1TVRnNExERXdNeTQzTVRRZ05qa3VNVGs0TERFd05DNHdNakVnVERFME55NDRPRE1zTlRndU5Ua3lJRU14TkRjdU9EUTNMRFU0TGpVNU1pQXhORGN1T0RFeExEVTRMalU1TVNBeE5EY3VOemMyTERVNExqVTRPU0JETVRRMkxqVXdPU3cxT0M0MU16TWdNVFExTGpReU1pdzFPQzR4SURFME5DNDROamNzTlRjdU5ETXhJRU14TkRRdU5UZzFMRFUzTGpBNU1TQXhORFF1TkRZMUxEVTJMamN3TnlBeE5EUXVOVElzTlRZdU16STBJRU14TkRRdU5UWXpMRFUyTGpBeU1TQXhORFF1TlRVeUxEVTFMamN4TmlBeE5EUXVORGc0TERVMUxqUXhOQ0JNTmpNdU9EUTJMREV3TVM0NU55QkROalF1TXpVekxERXdNaTR3TURJZ05qUXVPRFkzTERFd01pNHdNRFlnTmpVdU16YzBMREV3TVM0NU9ESWdRelkxTGpRM01Td3hNREV1T1RjM0lEWTFMalUyT0N3eE1ERXVPVGMxSURZMUxqWTJOU3d4TURFdU9UYzFJRXcyTlM0Mk5qVXNNVEF4TGprM05TQmFJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRJdU1qQTRMRFUxTGpFek5DQkRNUzR5TURjc05UTXVNekEzSURFdU9UWTNMRFV3TGpreE55QXpMamt3Tml3ME9TNDNPVGNnVERVNUxqa3hOeXd4Tnk0ME5UTWdRell4TGpnMU5pd3hOaTR6TXpNZ05qUXVNalF4TERFMkxqa3dOeUEyTlM0eU5ETXNNVGd1TnpNMElFdzJOUzQwTnpVc01Ua3VNVFEwSUVNMk5TNDROeklzTVRrdU9EZ3lJRFkyTGpNMk9Dd3lNQzQxTmlBMk5pNDVORFVzTWpFdU1UWTFJRXcyTnk0eU1qTXNNakV1TkRNMUlFTTNNQzQxTkRnc01qUXVOalE1SURjMUxqZ3dOaXd5TlM0eE5URWdPREF1TVRFeExESXlMalkyTlNCTU9EY3VORE1zTVRndU5EUTFJRU00T1M0ek55d3hOeTR6TWpZZ09URXVOelUwTERFM0xqZzVPU0E1TWk0M05UVXNNVGt1TnpJM0lFdzVOaTR3TURVc01qVXVOalUxSUV3eE1pNDBPRFlzTnpNdU9EZzBJRXd5TGpJd09DdzFOUzR4TXpRZ1dpSWdhV1E5SWtacGJHd3ROaUlnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWk0ME9EWXNOelF1TURBeElFTXhNaTQwTnpZc056UXVNREF4SURFeUxqUTJOU3czTXk0NU9Ua2dNVEl1TkRVMUxEY3pMams1TmlCRE1USXVOREkwTERjekxqazRPQ0F4TWk0ek9Ua3NOek11T1RZM0lERXlMak00TkN3M015NDVOQ0JNTWk0eE1EWXNOVFV1TVRrZ1F6RXVNRGMxTERVekxqTXhJREV1T0RVM0xEVXdMamcwTlNBekxqZzBPQ3cwT1M0Mk9UWWdURFU1TGpnMU9Dd3hOeTR6TlRJZ1F6WXdMalV5TlN3eE5pNDVOamNnTmpFdU1qY3hMREUyTGpjMk5DQTJNaTR3TVRZc01UWXVOelkwSUVNMk15NDBNekVzTVRZdU56WTBJRFkwTGpZMk5pd3hOeTQwTmpZZ05qVXVNekkzTERFNExqWTBOaUJETmpVdU16TTNMREU0TGpZMU5DQTJOUzR6TkRVc01UZ3VOall6SURZMUxqTTFNU3d4T0M0Mk56UWdURFkxTGpVM09Dd3hPUzR3T0RnZ1F6WTFMalU0TkN3eE9TNHhJRFkxTGpVNE9Td3hPUzR4TVRJZ05qVXVOVGt4TERFNUxqRXlOaUJETmpVdU9UZzFMREU1TGpnek9DQTJOaTQwTmprc01qQXVORGszSURZM0xqQXpMREl4TGpBNE5TQk1OamN1TXpBMUxESXhMak0xTVNCRE5qa3VNVFV4TERJekxqRXpOeUEzTVM0Mk5Ea3NNalF1TVRJZ056UXVNek0yTERJMExqRXlJRU0zTmk0ek1UTXNNalF1TVRJZ056Z3VNamtzTWpNdU5UZ3lJRGd3TGpBMU15d3lNaTQxTmpNZ1F6Z3dMakEyTkN3eU1pNDFOVGNnT0RBdU1EYzJMREl5TGpVMU15QTRNQzR3T0Rnc01qSXVOVFVnVERnM0xqTTNNaXd4T0M0ek5EUWdRemc0TGpBek9Dd3hOeTQ1TlRrZ09EZ3VOemcwTERFM0xqYzFOaUE0T1M0MU1qa3NNVGN1TnpVMklFTTVNQzQ1TlRZc01UY3VOelUySURreUxqSXdNU3d4T0M0ME56SWdPVEl1T0RVNExERTVMalkzSUV3NU5pNHhNRGNzTWpVdU5UazVJRU01Tmk0eE16Z3NNalV1TmpVMElEazJMakV4T0N3eU5TNDNNalFnT1RZdU1EWXpMREkxTGpjMU5pQk1NVEl1TlRRMUxEY3pMams0TlNCRE1USXVOVEkyTERjekxqazVOaUF4TWk0MU1EWXNOelF1TURBeElERXlMalE0Tml3M05DNHdNREVnVERFeUxqUTROaXczTkM0d01ERWdXaUJOTmpJdU1ERTJMREUyTGprNU55QkROakV1TXpFeUxERTJMams1TnlBMk1DNDJNRFlzTVRjdU1Ua2dOVGt1T1RjMUxERTNMalUxTkNCTU15NDVOalVzTkRrdU9EazVJRU15TGpBNE15dzFNQzQ1T0RVZ01TNHpOREVzTlRNdU16QTRJREl1TXpFc05UVXVNRGM0SUV3eE1pNDFNekVzTnpNdU56SXpJRXc1TlM0NE5EZ3NNalV1TmpFeElFdzVNaTQyTlRNc01Ua3VOemd5SUVNNU1pNHdNemdzTVRndU5qWWdPVEF1T0Rjc01UY3VPVGtnT0RrdU5USTVMREUzTGprNUlFTTRPQzQ0TWpVc01UY3VPVGtnT0RndU1URTVMREU0TGpFNE1pQTROeTQwT0Rrc01UZ3VOVFEzSUV3NE1DNHhOeklzTWpJdU56Y3lJRU00TUM0eE5qRXNNakl1TnpjNElEZ3dMakUwT1N3eU1pNDNPRElnT0RBdU1UTTNMREl5TGpjNE5TQkROemd1TXpRMkxESXpMamd4TVNBM05pNHpOREVzTWpRdU16VTBJRGMwTGpNek5pd3lOQzR6TlRRZ1F6Y3hMalU0T0N3eU5DNHpOVFFnTmprdU1ETXpMREl6TGpNME55QTJOeTR4TkRJc01qRXVOVEU1SUV3Mk5pNDROalFzTWpFdU1qUTVJRU0yTmk0eU56Y3NNakF1TmpNMElEWTFMamMzTkN3eE9TNDVORGNnTmpVdU16WTNMREU1TGpJd015QkROalV1TXpZc01Ua3VNVGt5SURZMUxqTTFOaXd4T1M0eE56a2dOalV1TXpVMExERTVMakUyTmlCTU5qVXVNVFl6TERFNExqZ3hPU0JETmpVdU1UVTBMREU0TGpneE1TQTJOUzR4TkRZc01UZ3VPREF4SURZMUxqRTBMREU0TGpjNUlFTTJOQzQxTWpVc01UY3VOalkzSURZekxqTTFOeXd4Tmk0NU9UY2dOakl1TURFMkxERTJMams1TnlCTU5qSXVNREUyTERFMkxqazVOeUJhSWlCcFpEMGlSbWxzYkMwM0lpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUUXlMalF6TkN3ME9DNDRNRGdnVERReUxqUXpOQ3cwT0M0NE1EZ2dRek01TGpreU5DdzBPQzQ0TURjZ016Y3VOek0zTERRM0xqVTFJRE0yTGpVNE1pdzBOUzQwTkRNZ1F6TTBMamMzTVN3ME1pNHhNemtnTXpZdU1UUTBMRE0zTGpnd09TQXpPUzQyTkRFc016VXVOemc1SUV3MU1TNDVNeklzTWpndU5qa3hJRU0xTXk0eE1ETXNNamd1TURFMUlEVTBMalF4TXl3eU55NDJOVGdnTlRVdU56SXhMREkzTGpZMU9DQkROVGd1TWpNeExESTNMalkxT0NBMk1DNDBNVGdzTWpndU9URTJJRFl4TGpVM015d3pNUzR3TWpNZ1F6WXpMak00TkN3ek5DNHpNamNnTmpJdU1ERXlMRE00TGpZMU55QTFPQzQxTVRRc05EQXVOamMzSUV3ME5pNHlNak1zTkRjdU56YzFJRU0wTlM0d05UTXNORGd1TkRVZ05ETXVOelF5TERRNExqZ3dPQ0EwTWk0ME16UXNORGd1T0RBNElFdzBNaTQwTXpRc05EZ3VPREE0SUZvZ1RUVTFMamN5TVN3eU9DNHhNalVnUXpVMExqUTVOU3d5T0M0eE1qVWdOVE11TWpZMUxESTRMalEyTVNBMU1pNHhOallzTWprdU1EazJJRXd6T1M0NE56VXNNell1TVRrMElFTXpOaTQxT1RZc016Z3VNRGczSURNMUxqTXdNaXcwTWk0eE16WWdNell1T1RreUxEUTFMakl4T0NCRE16Z3VNRFl6TERRM0xqRTNNeUEwTUM0d09UZ3NORGd1TXpRZ05ESXVORE0wTERRNExqTTBJRU0wTXk0Mk5qRXNORGd1TXpRZ05EUXVPRGtzTkRndU1EQTFJRFExTGprNUxEUTNMak0zSUV3MU9DNHlPREVzTkRBdU1qY3lJRU0yTVM0MU5pd3pPQzR6TnprZ05qSXVPRFV6TERNMExqTXpJRFl4TGpFMk5Dd3pNUzR5TkRnZ1F6WXdMakE1TWl3eU9TNHlPVE1nTlRndU1EVTRMREk0TGpFeU5TQTFOUzQzTWpFc01qZ3VNVEkxSUV3MU5TNDNNakVzTWpndU1USTFJRm9pSUdsa1BTSkdhV3hzTFRnaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UUTVMalU0T0N3eUxqUXdOeUJETVRRNUxqVTRPQ3d5TGpRd055QXhOVFV1TnpZNExEVXVPVGMxSURFMU5pNHpNalVzTmk0eU9UY2dUREUxTmk0ek1qVXNOeTR4T0RRZ1F6RTFOaTR6TWpVc055NHpOaUF4TlRZdU16TTRMRGN1TlRRMElERTFOaTR6TmpJc055NDNNek1nUXpFMU5pNHpOek1zTnk0NE1UUWdNVFUyTGpNNE1pdzNMamc1TkNBeE5UWXVNemtzTnk0NU56VWdRekUxTmk0MU15dzVMak01SURFMU55NHpOak1zTVRBdU9UY3pJREUxT0M0ME9UVXNNVEV1T1RjMElFd3hOalV1T0RreExERTRMalV4T1NCRE1UWTJMakEyT0N3eE9DNDJOelVnTVRZMkxqSTBPU3d4T0M0NE1UUWdNVFkyTGpRek1pd3hPQzQ1TXpRZ1F6RTJPQzR3TVRFc01Ua3VPVGMwSURFMk9TNHpPRElzTVRrdU5DQXhOamt1TkRrMExERTNMalkxTWlCRE1UWTVMalUwTXl3eE5pNDROamdnTVRZNUxqVTFNU3d4Tmk0d05UY2dNVFk1TGpVeE55d3hOUzR5TWpNZ1RERTJPUzQxTVRRc01UVXVNRFl6SUV3eE5qa3VOVEUwTERFekxqa3hNaUJETVRjd0xqYzRMREUwTGpZME1pQXhPVFV1TlRBeExESTRMamt4TlNBeE9UVXVOVEF4TERJNExqa3hOU0JNTVRrMUxqVXdNU3c0TWk0NU1UVWdRekU1TlM0MU1ERXNPRFF1TURBMUlERTVOQzQzTXpFc09EUXVORFExSURFNU15NDNPREVzT0RNdU9EazNJRXd4TlRFdU16QTRMRFU1TGpNM05DQkRNVFV3TGpNMU9DdzFPQzQ0TWpZZ01UUTVMalU0T0N3MU55NDBPVGNnTVRRNUxqVTRPQ3cxTmk0ME1EZ2dUREUwT1M0MU9EZ3NNakl1TXpjMUlpQnBaRDBpUm1sc2JDMDVJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEU1TkM0MU5UTXNPRFF1TWpVZ1F6RTVOQzR5T1RZc09EUXVNalVnTVRrMExqQXhNeXc0TkM0eE5qVWdNVGt6TGpjeU1pdzRNeTQ1T1RjZ1RERTFNUzR5TlN3MU9TNDBOellnUXpFMU1DNHlOamtzTlRndU9UQTVJREUwT1M0ME56RXNOVGN1TlRNeklERTBPUzQwTnpFc05UWXVOREE0SUV3eE5Ea3VORGN4TERJeUxqTTNOU0JNTVRRNUxqY3dOU3d5TWk0ek56VWdUREUwT1M0M01EVXNOVFl1TkRBNElFTXhORGt1TnpBMUxEVTNMalExT1NBeE5UQXVORFVzTlRndU56UTBJREUxTVM0ek5qWXNOVGt1TWpjMElFd3hPVE11T0RNNUxEZ3pMamM1TlNCRE1UazBMakkyTXl3NE5DNHdOQ0F4T1RRdU5qVTFMRGcwTGpBNE15QXhPVFF1T1RReUxEZ3pMamt4TnlCRE1UazFMakl5Tnl3NE15NDNOVE1nTVRrMUxqTTROQ3c0TXk0ek9UY2dNVGsxTGpNNE5DdzRNaTQ1TVRVZ1RERTVOUzR6T0RRc01qZ3VPVGd5SUVNeE9UUXVNVEF5TERJNExqSTBNaUF4TnpJdU1UQTBMREUxTGpVME1pQXhOamt1TmpNeExERTBMakV4TkNCTU1UWTVMall6TkN3eE5TNHlNaUJETVRZNUxqWTJPQ3d4Tmk0d05USWdNVFk1TGpZMkxERTJMamczTkNBeE5qa3VOakVzTVRjdU5qVTVJRU14TmprdU5UVTJMREU0TGpVd015QXhOamt1TWpFMExERTVMakV5TXlBeE5qZ3VOalEzTERFNUxqUXdOU0JETVRZNExqQXlPQ3d4T1M0M01UUWdNVFkzTGpFNU55d3hPUzQxTnpnZ01UWTJMak0yTnl3eE9TNHdNeklnUXpFMk5pNHhPREVzTVRndU9UQTVJREUyTlM0NU9UVXNNVGd1TnpZMklERTJOUzQ0TVRRc01UZ3VOakEySUV3eE5UZ3VOREUzTERFeUxqQTJNaUJETVRVM0xqSTFPU3d4TVM0d016WWdNVFUyTGpReE9DdzVMalF6TnlBeE5UWXVNamMwTERjdU9UZzJJRU14TlRZdU1qWTJMRGN1T1RBM0lERTFOaTR5TlRjc055NDRNamNnTVRVMkxqSTBOeXczTGpjME9DQkRNVFUyTGpJeU1TdzNMalUxTlNBeE5UWXVNakE1TERjdU16WTFJREUxTmk0eU1Ea3NOeTR4T0RRZ1RERTFOaTR5TURrc05pNHpOalFnUXpFMU5TNHpOelVzTlM0NE9ETWdNVFE1TGpVeU9Td3lMalV3T0NBeE5Ea3VOVEk1TERJdU5UQTRJRXd4TkRrdU5qUTJMREl1TXpBMklFTXhORGt1TmpRMkxESXVNekEySURFMU5TNDRNamNzTlM0NE56UWdNVFUyTGpNNE5DdzJMakU1TmlCTU1UVTJMalEwTWl3MkxqSXpJRXd4TlRZdU5EUXlMRGN1TVRnMElFTXhOVFl1TkRReUxEY3VNelUxSURFMU5pNDBOVFFzTnk0MU16VWdNVFUyTGpRM09DdzNMamN4TnlCRE1UVTJMalE0T1N3M0xqZ2dNVFUyTGpRNU9TdzNMamc0TWlBeE5UWXVOVEEzTERjdU9UWXpJRU14TlRZdU5qUTFMRGt1TXpVNElERTFOeTQwTlRVc01UQXVPRGs0SURFMU9DNDFOeklzTVRFdU9EZzJJRXd4TmpVdU9UWTVMREU0TGpRek1TQkRNVFkyTGpFME1pd3hPQzQxT0RRZ01UWTJMak14T1N3eE9DNDNNaUF4TmpZdU5EazJMREU0TGpnek55QkRNVFkzTGpJMU5Dd3hPUzR6TXpZZ01UWTRMREU1TGpRMk55QXhOamd1TlRRekxERTVMakU1TmlCRE1UWTVMakF6TXl3eE9DNDVOVE1nTVRZNUxqTXlPU3d4T0M0ME1ERWdNVFk1TGpNM055d3hOeTQyTkRVZ1F6RTJPUzQwTWpjc01UWXVPRFkzSURFMk9TNDBNelFzTVRZdU1EVTBJREUyT1M0ME1ERXNNVFV1TWpJNElFd3hOamt1TXprM0xERTFMakEyTlNCTU1UWTVMak01Tnl3eE15NDNNU0JNTVRZNUxqVTNNaXd4TXk0NE1TQkRNVGN3TGpnek9Td3hOQzQxTkRFZ01UazFMalUxT1N3eU9DNDRNVFFnTVRrMUxqVTFPU3d5T0M0NE1UUWdUREU1TlM0Mk1UZ3NNamd1T0RRM0lFd3hPVFV1TmpFNExEZ3lMamt4TlNCRE1UazFMall4T0N3NE15NDBPRFFnTVRrMUxqUXlMRGd6TGpreE1TQXhPVFV1TURVNUxEZzBMakV4T1NCRE1UazBMamt3T0N3NE5DNHlNRFlnTVRrMExqY3pOeXc0TkM0eU5TQXhPVFF1TlRVekxEZzBMakkxSWlCcFpEMGlSbWxzYkMweE1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhORFV1TmpnMUxEVTJMakUyTVNCTU1UWTVMamdzTnpBdU1EZ3pJRXd4TkRNdU9ESXlMRGcxTGpBNE1TQk1NVFF5TGpNMkxEZzBMamMzTkNCRE1UTTFMamd5Tml3NE1pNDJNRFFnTVRJNExqY3pNaXc0TVM0d05EWWdNVEl4TGpNME1TdzRNQzR4TlRnZ1F6RXhOaTQ1TnpZc056a3VOak0wSURFeE1pNDJOemdzT0RFdU1qVTBJREV4TVM0M05ETXNPRE11TnpjNElFTXhNVEV1TlRBMkxEZzBMalF4TkNBeE1URXVOVEF6TERnMUxqQTNNU0F4TVRFdU56TXlMRGcxTGpjd05pQkRNVEV6TGpJM0xEZzVMamszTXlBeE1UVXVPVFk0TERrMExqQTJPU0F4TVRrdU56STNMRGszTGpnME1TQk1NVEl3TGpJMU9TdzVPQzQyT0RZZ1F6RXlNQzR5Tml3NU9DNDJPRFVnT1RRdU1qZ3lMREV4TXk0Mk9ETWdPVFF1TWpneUxERXhNeTQyT0RNZ1REY3dMakUyTnl3NU9TNDNOakVnVERFME5TNDJPRFVzTlRZdU1UWXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswNU5DNHlPRElzTVRFekxqZ3hPQ0JNT1RRdU1qSXpMREV4TXk0M09EVWdURFk1TGprek15dzVPUzQzTmpFZ1REY3dMakV3T0N3NU9TNDJOaUJNTVRRMUxqWTROU3cxTmk0d01qWWdUREUwTlM0M05ETXNOVFl1TURVNUlFd3hOekF1TURNekxEY3dMakE0TXlCTU1UUXpMamcwTWl3NE5TNHlNRFVnVERFME15NDNPVGNzT0RVdU1UazFJRU14TkRNdU56Y3lMRGcxTGpFNUlERTBNaTR6TXpZc09EUXVPRGc0SURFME1pNHpNellzT0RRdU9EZzRJRU14TXpVdU56ZzNMRGd5TGpjeE5DQXhNamd1TnpJekxEZ3hMakUyTXlBeE1qRXVNekkzTERnd0xqSTNOQ0JETVRJd0xqYzRPQ3c0TUM0eU1Ea2dNVEl3TGpJek5pdzRNQzR4TnpjZ01URTVMalk0T1N3NE1DNHhOemNnUXpFeE5TNDVNekVzT0RBdU1UYzNJREV4TWk0Mk16VXNPREV1TnpBNElERXhNUzQ0TlRJc09ETXVPREU1SUVNeE1URXVOakkwTERnMExqUXpNaUF4TVRFdU5qSXhMRGcxTGpBMU15QXhNVEV1T0RReUxEZzFMalkyTnlCRE1URXpMak0zTnl3NE9TNDVNalVnTVRFMkxqQTFPQ3c1TXk0NU9UTWdNVEU1TGpneExEazNMamMxT0NCTU1URTVMamd5Tml3NU55NDNOemtnVERFeU1DNHpOVElzT1RndU5qRTBJRU14TWpBdU16VTBMRGs0TGpZeE55QXhNakF1TXpVMkxEazRMall5SURFeU1DNHpOVGdzT1RndU5qSTBJRXd4TWpBdU5ESXlMRGs0TGpjeU5pQk1NVEl3TGpNeE55dzVPQzQzT0RjZ1F6RXlNQzR5TmpRc09UZ3VPREU0SURrMExqVTVPU3d4TVRNdU5qTTFJRGswTGpNMExERXhNeTQzT0RVZ1REazBMakk0TWl3eE1UTXVPREU0SUV3NU5DNHlPRElzTVRFekxqZ3hPQ0JhSUUwM01DNDBNREVzT1RrdU56WXhJRXc1TkM0eU9ESXNNVEV6TGpVME9TQk1NVEU1TGpBNE5DdzVPUzR5TWprZ1F6RXhPUzQyTXl3NU9DNDVNVFFnTVRFNUxqa3pMRGs0TGpjMElERXlNQzR4TURFc09UZ3VOalUwSUV3eE1Ua3VOak0xTERrM0xqa3hOQ0JETVRFMUxqZzJOQ3c1TkM0eE1qY2dNVEV6TGpFMk9DdzVNQzR3TXpNZ01URXhMall5TWl3NE5TNDNORFlnUXpFeE1TNHpPRElzT0RVdU1EYzVJREV4TVM0ek9EWXNPRFF1TkRBMElERXhNUzQyTXpNc09ETXVOek00SUVNeE1USXVORFE0TERneExqVXpPU0F4TVRVdU9ETTJMRGM1TGprME15QXhNVGt1TmpnNUxEYzVMamswTXlCRE1USXdMakkwTml3M09TNDVORE1nTVRJd0xqZ3dOaXczT1M0NU56WWdNVEl4TGpNMU5TdzRNQzR3TkRJZ1F6RXlPQzQzTmpjc09EQXVPVE16SURFek5TNDRORFlzT0RJdU5EZzNJREUwTWk0ek9UWXNPRFF1TmpZeklFTXhORE11TWpNeUxEZzBMamd6T0NBeE5ETXVOakV4TERnMExqa3hOeUF4TkRNdU56ZzJMRGcwTGprMk55Qk1NVFk1TGpVMk5pdzNNQzR3T0RNZ1RERTBOUzQyT0RVc05UWXVNamsxSUV3M01DNDBNREVzT1RrdU56WXhJRXczTUM0ME1ERXNPVGt1TnpZeElGb2lJR2xrUFNKR2FXeHNMVEV5SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk55NHlNeXd4T0M0NU56a2dUREUyTnk0eU15dzJPUzQ0TlNCTU1UTTVMamt3T1N3NE5TNDJNak1nVERFek15NDBORGdzTnpFdU5EVTJJRU14TXpJdU5UTTRMRFk1TGpRMklERXpNQzR3TWl3Mk9TNDNNVGdnTVRJM0xqZ3lOQ3czTWk0d015QkRNVEkyTGpjMk9TdzNNeTR4TkNBeE1qVXVPVE14TERjMExqVTROU0F4TWpVdU5EazBMRGMyTGpBME9DQk1NVEU1TGpBek5DdzVOeTQyTnpZZ1REa3hMamN4TWl3eE1UTXVORFVnVERreExqY3hNaXcyTWk0MU56a2dUREUyTnk0eU15d3hPQzQ1TnpraUlHbGtQU0pHYVd4c0xURXpJaUJtYVd4c1BTSWpSa1pHUmtaR0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGt4TGpjeE1pd3hNVE11TlRZM0lFTTVNUzQyT1RJc01URXpMalUyTnlBNU1TNDJOeklzTVRFekxqVTJNU0E1TVM0Mk5UTXNNVEV6TGpVMU1TQkRPVEV1TmpFNExERXhNeTQxTXlBNU1TNDFPVFVzTVRFekxqUTVNaUE1TVM0MU9UVXNNVEV6TGpRMUlFdzVNUzQxT1RVc05qSXVOVGM1SUVNNU1TNDFPVFVzTmpJdU5UTTNJRGt4TGpZeE9DdzJNaTQwT1RrZ09URXVOalV6TERZeUxqUTNPQ0JNTVRZM0xqRTNNaXd4T0M0NE56Z2dRekUyTnk0eU1EZ3NNVGd1T0RVM0lERTJOeTR5TlRJc01UZ3VPRFUzSURFMk55NHlPRGdzTVRndU9EYzRJRU14TmpjdU16STBMREU0TGpnNU9TQXhOamN1TXpRM0xERTRMamt6TnlBeE5qY3VNelEzTERFNExqazNPU0JNTVRZM0xqTTBOeXcyT1M0NE5TQkRNVFkzTGpNME55dzJPUzQ0T1RFZ01UWTNMak15TkN3Mk9TNDVNeUF4TmpjdU1qZzRMRFk1TGprMUlFd3hNemt1T1RZM0xEZzFMamN5TlNCRE1UTTVMamt6T1N3NE5TNDNOREVnTVRNNUxqa3dOU3c0TlM0M05EVWdNVE01TGpnM015dzROUzQzTXpVZ1F6RXpPUzQ0TkRJc09EVXVOekkxSURFek9TNDRNVFlzT0RVdU56QXlJREV6T1M0NE1ESXNPRFV1TmpjeUlFd3hNek11TXpReUxEY3hMalV3TkNCRE1UTXlMamsyTnl3M01DNDJPRElnTVRNeUxqSTRMRGN3TGpJeU9TQXhNekV1TkRBNExEY3dMakl5T1NCRE1UTXdMak14T1N3M01DNHlNamtnTVRJNUxqQTBOQ3czTUM0NU1UVWdNVEkzTGprd09DdzNNaTR4TVNCRE1USTJMamczTkN3M015NHlJREV5Tmk0d016UXNOelF1TmpRM0lERXlOUzQyTURZc056WXVNRGd5SUV3eE1Ua3VNVFEyTERrM0xqY3dPU0JETVRFNUxqRXpOeXc1Tnk0M016Z2dNVEU1TGpFeE9DdzVOeTQzTmpJZ01URTVMakE1TWl3NU55NDNOemNnVERreExqYzNMREV4TXk0MU5URWdRemt4TGpjMU1pd3hNVE11TlRZeElEa3hMamN6TWl3eE1UTXVOVFkzSURreExqY3hNaXd4TVRNdU5UWTNJRXc1TVM0M01USXNNVEV6TGpVMk55QmFJRTA1TVM0NE1qa3NOakl1TmpRM0lFdzVNUzQ0TWprc01URXpMakkwT0NCTU1URTRMamt6TlN3NU55NDFPVGdnVERFeU5TNHpPRElzTnpZdU1ERTFJRU14TWpVdU9ESTNMRGMwTGpVeU5TQXhNall1TmpZMExEY3pMakE0TVNBeE1qY3VOek01TERjeExqazFJRU14TWpndU9URTVMRGN3TGpjd09DQXhNekF1TWpVMkxEWTVMams1TmlBeE16RXVOREE0TERZNUxqazVOaUJETVRNeUxqTTNOeXcyT1M0NU9UWWdNVE16TGpFek9TdzNNQzQwT1RjZ01UTXpMalUxTkN3M01TNDBNRGNnVERFek9TNDVOakVzT0RVdU5EVTRJRXd4TmpjdU1URXpMRFk1TGpjNE1pQk1NVFkzTGpFeE15d3hPUzR4T0RFZ1REa3hMamd5T1N3Mk1pNDJORGNnVERreExqZ3lPU3cyTWk0Mk5EY2dXaUlnYVdROUlrWnBiR3d0TVRRaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UWTRMalUwTXl3eE9TNHlNVE1nVERFMk9DNDFORE1zTnpBdU1EZ3pJRXd4TkRFdU1qSXhMRGcxTGpnMU55Qk1NVE0wTGpjMk1TdzNNUzQyT0RrZ1F6RXpNeTQ0TlRFc05qa3VOamswSURFek1TNHpNek1zTmprdU9UVXhJREV5T1M0eE16Y3NOekl1TWpZeklFTXhNamd1TURneUxEY3pMak0zTkNBeE1qY3VNalEwTERjMExqZ3hPU0F4TWpZdU9EQTNMRGMyTGpJNE1pQk1NVEl3TGpNME5pdzVOeTQ1TURrZ1REa3pMakF5TlN3eE1UTXVOamd6SUV3NU15NHdNalVzTmpJdU9ERXpJRXd4TmpndU5UUXpMREU1TGpJeE15SWdhV1E5SWtacGJHd3RNVFVpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RNdU1ESTFMREV4TXk0NElFTTVNeTR3TURVc01URXpMamdnT1RJdU9UZzBMREV4TXk0M09UVWdPVEl1T1RZMkxERXhNeTQzT0RVZ1F6a3lMamt6TVN3eE1UTXVOelkwSURreUxqa3dPQ3d4TVRNdU56STFJRGt5TGprd09Dd3hNVE11TmpnMElFdzVNaTQ1TURnc05qSXVPREV6SUVNNU1pNDVNRGdzTmpJdU56Y3hJRGt5TGprek1TdzJNaTQzTXpNZ09USXVPVFkyTERZeUxqY3hNaUJNTVRZNExqUTROQ3d4T1M0eE1USWdRekUyT0M0MU1pd3hPUzR3T1NBeE5qZ3VOVFkxTERFNUxqQTVJREUyT0M0Mk1ERXNNVGt1TVRFeUlFTXhOamd1TmpNM0xERTVMakV6TWlBeE5qZ3VOallzTVRrdU1UY3hJREUyT0M0Mk5pd3hPUzR5TVRJZ1RERTJPQzQyTml3M01DNHdPRE1nUXpFMk9DNDJOaXczTUM0eE1qVWdNVFk0TGpZek55dzNNQzR4TmpRZ01UWTRMall3TVN3M01DNHhPRFFnVERFME1TNHlPQ3c0TlM0NU5UZ2dRekUwTVM0eU5URXNPRFV1T1RjMUlERTBNUzR5TVRjc09EVXVPVGM1SURFME1TNHhPRFlzT0RVdU9UWTRJRU14TkRFdU1UVTBMRGcxTGprMU9DQXhOREV1TVRJNUxEZzFMamt6TmlBeE5ERXVNVEUxTERnMUxqa3dOaUJNTVRNMExqWTFOU3czTVM0M016Z2dRekV6TkM0eU9DdzNNQzQ1TVRVZ01UTXpMalU1TXl3M01DNDBOak1nTVRNeUxqY3lMRGN3TGpRMk15QkRNVE14TGpZek1pdzNNQzQwTmpNZ01UTXdMak0xTnl3M01TNHhORGdnTVRJNUxqSXlNU3czTWk0ek5EUWdRekV5T0M0eE9EWXNOek11TkRNeklERXlOeTR6TkRjc056UXVPRGd4SURFeU5pNDVNVGtzTnpZdU16RTFJRXd4TWpBdU5EVTRMRGszTGprME15QkRNVEl3TGpRMUxEazNMamszTWlBeE1qQXVORE14TERrM0xqazVOaUF4TWpBdU5EQTFMRGs0TGpBeElFdzVNeTR3T0RNc01URXpMamM0TlNCRE9UTXVNRFkxTERFeE15NDNPVFVnT1RNdU1EUTFMREV4TXk0NElEa3pMakF5TlN3eE1UTXVPQ0JNT1RNdU1ESTFMREV4TXk0NElGb2dUVGt6TGpFME1pdzJNaTQ0T0RFZ1REa3pMakUwTWl3eE1UTXVORGd4SUV3eE1qQXVNalE0TERrM0xqZ3pNaUJNTVRJMkxqWTVOU3czTmk0eU5EZ2dRekV5Tnk0eE5DdzNOQzQzTlRnZ01USTNMamszTnl3M015NHpNVFVnTVRJNUxqQTFNaXczTWk0eE9ETWdRekV6TUM0eU16RXNOekF1T1RReUlERXpNUzQxTmpnc056QXVNakk1SURFek1pNDNNaXczTUM0eU1qa2dRekV6TXk0Mk9Ea3NOekF1TWpJNUlERXpOQzQwTlRJc056QXVOek14SURFek5DNDROamNzTnpFdU5qUXhJRXd4TkRFdU1qYzBMRGcxTGpZNU1pQk1NVFk0TGpReU5pdzNNQzR3TVRZZ1RERTJPQzQwTWpZc01Ua3VOREUxSUV3NU15NHhORElzTmpJdU9EZ3hJRXc1TXk0eE5ESXNOakl1T0RneElGb2lJR2xrUFNKR2FXeHNMVEUySWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDRMRGN3TGpBNE15Qk1NVFF5TGpRM09DdzROUzQ0TlRjZ1RERXpOaTR3TVRnc056RXVOamc1SUVNeE16VXVNVEE0TERZNUxqWTVOQ0F4TXpJdU5Ua3NOamt1T1RVeElERXpNQzR6T1RNc056SXVNall6SUVNeE1qa3VNek01TERjekxqTTNOQ0F4TWpndU5TdzNOQzQ0TVRrZ01USTRMakEyTkN3M05pNHlPRElnVERFeU1TNDJNRE1zT1RjdU9UQTVJRXc1TkM0eU9ESXNNVEV6TGpZNE15Qk1PVFF1TWpneUxEWXlMamd4TXlCTU1UWTVMamdzTVRrdU1qRXpJRXd4TmprdU9DdzNNQzR3T0RNZ1dpSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RRdU1qZ3lMREV4TXk0NU1UY2dRemswTGpJME1Td3hNVE11T1RFM0lEazBMakl3TVN3eE1UTXVPVEEzSURrMExqRTJOU3d4TVRNdU9EZzJJRU01TkM0d09UTXNNVEV6TGpnME5TQTVOQzR3TkRnc01URXpMamMyTnlBNU5DNHdORGdzTVRFekxqWTROQ0JNT1RRdU1EUTRMRFl5TGpneE15QkRPVFF1TURRNExEWXlMamN6SURrMExqQTVNeXcyTWk0Mk5USWdPVFF1TVRZMUxEWXlMall4TVNCTU1UWTVMalk0TXl3eE9TNHdNU0JETVRZNUxqYzFOU3d4T0M0NU5qa2dNVFk1TGpnME5Dd3hPQzQ1TmprZ01UWTVMamt4Tnl3eE9TNHdNU0JETVRZNUxqazRPU3d4T1M0d05USWdNVGN3TGpBek15d3hPUzR4TWprZ01UY3dMakF6TXl3eE9TNHlNVElnVERFM01DNHdNek1zTnpBdU1EZ3pJRU14TnpBdU1ETXpMRGN3TGpFMk5pQXhOamt1T1RnNUxEY3dMakkwTkNBeE5qa3VPVEUzTERjd0xqSTROU0JNTVRReUxqVTVOU3c0Tmk0d05pQkRNVFF5TGpVek9DdzROaTR3T1RJZ01UUXlMalEyT1N3NE5pNHhJREUwTWk0ME1EY3NPRFl1TURnZ1F6RTBNaTR6TkRRc09EWXVNRFlnTVRReUxqSTVNeXc0Tmk0d01UUWdNVFF5TGpJMk5pdzROUzQ1TlRRZ1RERXpOUzQ0TURVc056RXVOemcySUVNeE16VXVORFExTERjd0xqazVOeUF4TXpRdU9ERXpMRGN3TGpVNElERXpNeTQ1Tnpjc056QXVOVGdnUXpFek1pNDVNakVzTnpBdU5UZ2dNVE14TGpZM05pdzNNUzR5TlRJZ01UTXdMalUyTWl3M01pNDBNalFnUXpFeU9TNDFOQ3czTXk0MU1ERWdNVEk0TGpjeE1TdzNOQzQ1TXpFZ01USTRMakk0Tnl3M05pNHpORGdnVERFeU1TNDRNamNzT1RjdU9UYzJJRU14TWpFdU9ERXNPVGd1TURNMElERXlNUzQzTnpFc09UZ3VNRGd5SURFeU1TNDNNaXc1T0M0eE1USWdURGswTGpNNU9Dd3hNVE11T0RnMklFTTVOQzR6TmpJc01URXpMamt3TnlBNU5DNHpNaklzTVRFekxqa3hOeUE1TkM0eU9ESXNNVEV6TGpreE55Qk1PVFF1TWpneUxERXhNeTQ1TVRjZ1dpQk5PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERFeE15NHlOemtnVERFeU1TNDBNRFlzT1RjdU56VTBJRXd4TWpjdU9EUXNOell1TWpFMUlFTXhNamd1TWprc056UXVOekE0SURFeU9TNHhNemNzTnpNdU1qUTNJREV6TUM0eU1qUXNOekl1TVRBeklFTXhNekV1TkRJMUxEY3dMamd6T0NBeE16SXVOemt6TERjd0xqRXhNaUF4TXpNdU9UYzNMRGN3TGpFeE1pQkRNVE0wTGprNU5TdzNNQzR4TVRJZ01UTTFMamM1TlN3M01DNDJNemdnTVRNMkxqSXpMRGN4TGpVNU1pQk1NVFF5TGpVNE5DdzROUzQxTWpZZ1RERTJPUzQxTmpZc05qa3VPVFE0SUV3eE5qa3VOVFkyTERFNUxqWXhOeUJNT1RRdU5URTFMRFl5TGprME9DQk1PVFF1TlRFMUxEWXlMamswT0NCYUlpQnBaRDBpUm1sc2JDMHhPQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TURrdU9EazBMRGt5TGprME15Qk1NVEE1TGpnNU5DdzVNaTQ1TkRNZ1F6RXdPQzR4TWl3NU1pNDVORE1nTVRBMkxqWTFNeXc1TWk0eU1UZ2dNVEExTGpZMUxEa3dMamd5TXlCRE1UQTFMalU0TXl3NU1DNDNNekVnTVRBMUxqVTVNeXc1TUM0Mk1TQXhNRFV1TmpjekxEa3dMalV5T1NCRE1UQTFMamMxTXl3NU1DNDBORGdnTVRBMUxqZzRMRGt3TGpRMElERXdOUzQ1TnpRc09UQXVOVEEySUVNeE1EWXVOelUwTERreExqQTFNeUF4TURjdU5qYzVMRGt4TGpNek15QXhNRGd1TnpJMExEa3hMak16TXlCRE1URXdMakEwTnl3NU1TNHpNek1nTVRFeExqUTNPQ3c1TUM0NE9UUWdNVEV5TGprNExEa3dMakF5TnlCRE1URTRMakk1TVN3NE5pNDVOaUF4TWpJdU5qRXhMRGM1TGpVd09TQXhNakl1TmpFeExEY3pMalF4TmlCRE1USXlMall4TVN3M01TNDBPRGtnTVRJeUxqRTJPU3cyT1M0NE5UWWdNVEl4TGpNek15dzJPQzQyT1RJZ1F6RXlNUzR5TmpZc05qZ3VOaUF4TWpFdU1qYzJMRFk0TGpRM015QXhNakV1TXpVMkxEWTRMak01TWlCRE1USXhMalF6Tml3Mk9DNHpNVEVnTVRJeExqVTJNeXcyT0M0eU9Ua2dNVEl4TGpZMU5pdzJPQzR6TmpVZ1F6RXlNeTR6TWpjc05qa3VOVE0zSURFeU5DNHlORGNzTnpFdU56UTJJREV5TkM0eU5EY3NOelF1TlRnMElFTXhNalF1TWpRM0xEZ3dMamd5TmlBeE1Ua3VPREl4TERnNExqUTBOeUF4TVRRdU16Z3lMRGt4TGpVNE55QkRNVEV5TGpnd09DdzVNaTQwT1RVZ01URXhMakk1T0N3NU1pNDVORE1nTVRBNUxqZzVOQ3c1TWk0NU5ETWdUREV3T1M0NE9UUXNPVEl1T1RReklGb2dUVEV3Tmk0NU1qVXNPVEV1TkRBeElFTXhNRGN1TnpNNExEa3lMakExTWlBeE1EZ3VOelExTERreUxqSTNPQ0F4TURrdU9Ea3pMRGt5TGpJM09DQk1NVEE1TGpnNU5DdzVNaTR5TnpnZ1F6RXhNUzR5TVRVc09USXVNamM0SURFeE1pNDJORGNzT1RFdU9UVXhJREV4TkM0eE5EZ3NPVEV1TURnMElFTXhNVGt1TkRVNUxEZzRMakF4TnlBeE1qTXVOemdzT0RBdU5qSXhJREV5TXk0M09DdzNOQzQxTWpnZ1F6RXlNeTQzT0N3M01pNDFORGtnTVRJekxqTXhOeXczTUM0NU1qa2dNVEl5TGpRMU5DdzJPUzQzTmpjZ1F6RXlNaTQ0TmpVc056QXVPREF5SURFeU15NHdOemtzTnpJdU1EUXlJREV5TXk0d056a3NOek11TkRBeUlFTXhNak11TURjNUxEYzVMalkwTlNBeE1UZ3VOalV6TERnM0xqSTROU0F4TVRNdU1qRTBMRGt3TGpReU5TQkRNVEV4TGpZMExEa3hMak16TkNBeE1UQXVNVE1zT1RFdU56UXlJREV3T0M0M01qUXNPVEV1TnpReUlFTXhNRGd1TURnekxEa3hMamMwTWlBeE1EY3VORGd4TERreExqVTVNeUF4TURZdU9USTFMRGt4TGpRd01TQk1NVEEyTGpreU5TdzVNUzQwTURFZ1dpSWdhV1E5SWtacGJHd3RNVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqQTVOeXc1TUM0eU15QkRNVEU0TGpRNE1TdzROeTR4TWpJZ01USXlMamcwTlN3M09TNDFPVFFnTVRJeUxqZzBOU3czTXk0ME1UWWdRekV5TWk0NE5EVXNOekV1TXpZMUlERXlNaTR6TmpJc05qa3VOekkwSURFeU1TNDFNaklzTmpndU5UVTJJRU14TVRrdU56TTRMRFkzTGpNd05DQXhNVGN1TVRRNExEWTNMak0yTWlBeE1UUXVNalkxTERZNUxqQXlOaUJETVRBNExqZzRNU3czTWk0eE16UWdNVEEwTGpVeE55dzNPUzQyTmpJZ01UQTBMalV4Tnl3NE5TNDROQ0JETVRBMExqVXhOeXc0Tnk0NE9URWdNVEExTERnNUxqVXpNaUF4TURVdU9EUXNPVEF1TnlCRE1UQTNMall5TkN3NU1TNDVOVElnTVRFd0xqSXhOQ3c1TVM0NE9UUWdNVEV6TGpBNU55dzVNQzR5TXlJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEE0TGpjeU5DdzVNUzQyTVRRZ1RERXdPQzQzTWpRc09URXVOakUwSUVNeE1EY3VOVGd5TERreExqWXhOQ0F4TURZdU5UWTJMRGt4TGpRd01TQXhNRFV1TnpBMUxEa3dMamM1TnlCRE1UQTFMalk0TkN3NU1DNDNPRE1nTVRBMUxqWTJOU3c1TUM0NE1URWdNVEExTGpZMUxEa3dMamM1SUVNeE1EUXVOelUyTERnNUxqVTBOaUF4TURRdU1qZ3pMRGczTGpnME1pQXhNRFF1TWpnekxEZzFMamd4TnlCRE1UQTBMakk0TXl3M09TNDFOelVnTVRBNExqY3dPU3czTVM0NU5UTWdNVEUwTGpFME9DdzJPQzQ0TVRJZ1F6RXhOUzQzTWpJc05qY3VPVEEwSURFeE55NHlNeklzTmpjdU5EUTVJREV4T0M0Mk16Z3NOamN1TkRRNUlFTXhNVGt1Tnpnc05qY3VORFE1SURFeU1DNDNPVFlzTmpjdU56VTRJREV5TVM0Mk5UWXNOamd1TXpZeUlFTXhNakV1TmpjNExEWTRMak0zTnlBeE1qRXVOamszTERZNExqTTVOeUF4TWpFdU56RXlMRFk0TGpReE9DQkRNVEl5TGpZd05pdzJPUzQyTmpJZ01USXpMakEzT1N3M01TNHpPU0F4TWpNdU1EYzVMRGN6TGpReE5TQkRNVEl6TGpBM09TdzNPUzQyTlRnZ01URTRMalkxTXl3NE55NHhPVGdnTVRFekxqSXhOQ3c1TUM0ek16Z2dRekV4TVM0Mk5DdzVNUzR5TkRjZ01URXdMakV6TERreExqWXhOQ0F4TURndU56STBMRGt4TGpZeE5DQk1NVEE0TGpjeU5DdzVNUzQyTVRRZ1dpQk5NVEEyTGpBd05pdzVNQzQxTURVZ1F6RXdOaTQzT0N3NU1TNHdNemNnTVRBM0xqWTVOQ3c1TVM0eU9ERWdNVEE0TGpjeU5DdzVNUzR5T0RFZ1F6RXhNQzR3TkRjc09URXVNamd4SURFeE1TNDBOemdzT1RBdU9EWTRJREV4TWk0NU9DdzVNQzR3TURFZ1F6RXhPQzR5T1RFc09EWXVPVE0xSURFeU1pNDJNVEVzTnprdU5EazJJREV5TWk0Mk1URXNOek11TkRBeklFTXhNakl1TmpFeExEY3hMalE1TkNBeE1qSXVNVGMzTERZNUxqZzRJREV5TVM0ek5UWXNOamd1TnpFNElFTXhNakF1TlRneUxEWTRMakU0TlNBeE1Ua3VOalk0TERZM0xqa3hPU0F4TVRndU5qTTRMRFkzTGpreE9TQkRNVEUzTGpNeE5TdzJOeTQ1TVRrZ01URTFMamc0TXl3Mk9DNHpOaUF4TVRRdU16Z3lMRFk1TGpJeU55QkRNVEE1TGpBM01TdzNNaTR5T1RNZ01UQTBMamMxTVN3M09TNDNNek1nTVRBMExqYzFNU3c0TlM0NE1qWWdRekV3TkM0M05URXNPRGN1TnpNMUlERXdOUzR4T0RVc09Ea3VNelF6SURFd05pNHdNRFlzT1RBdU5UQTFJRXd4TURZdU1EQTJMRGt3TGpVd05TQmFJaUJwWkQwaVJtbHNiQzB5TVNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5Ea3VNekU0TERjdU1qWXlJRXd4TXprdU16TTBMREUyTGpFMElFd3hOVFV1TWpJM0xESTNMakUzTVNCTU1UWXdMamd4Tml3eU1TNHdOVGtnVERFME9TNHpNVGdzTnk0eU5qSWlJR2xrUFNKR2FXeHNMVEl5SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFMk9TNDJOellzTVRNdU9EUWdUREUxT1M0NU1qZ3NNVGt1TkRZM0lFTXhOVFl1TWpnMkxESXhMalUzSURFMU1DNDBMREl4TGpVNElERTBOaTQzT0RFc01Ua3VORGt4SUVNeE5ETXVNVFl4TERFM0xqUXdNaUF4TkRNdU1UZ3NNVFF1TURBeklERTBOaTQ0TWpJc01URXVPU0JNTVRVMkxqTXhOeXcyTGpJNU1pQk1NVFE1TGpVNE9Dd3lMalF3TnlCTU5qY3VOelV5TERRNUxqUTNPQ0JNTVRFekxqWTNOU3czTlM0NU9USWdUREV4Tmk0M05UWXNOelF1TWpFeklFTXhNVGN1TXpnM0xEY3pMamcwT0NBeE1UY3VOakkxTERjekxqTXhOU0F4TVRjdU16YzBMRGN5TGpneU15QkRNVEUxTGpBeE55dzJPQzR4T1RFZ01URTBMamM0TVN3Mk15NHlOemNnTVRFMkxqWTVNU3cxT0M0MU5qRWdRekV5TWk0ek1qa3NORFF1TmpReElERTBNUzR5TERNekxqYzBOaUF4TmpVdU16QTVMRE13TGpRNU1TQkRNVGN6TGpRM09Dd3lPUzR6T0RnZ01UZ3hMams0T1N3eU9TNDFNalFnTVRrd0xqQXhNeXd6TUM0NE9EVWdRekU1TUM0NE5qVXNNekV1TURNZ01Ua3hMamM0T1N3ek1DNDRPVE1nTVRreUxqUXlMRE13TGpVeU9DQk1NVGsxTGpVd01Td3lPQzQzTlNCTU1UWTVMalkzTml3eE15NDROQ0lnYVdROUlrWnBiR3d0TWpNaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXpMalkzTlN3M05pNDBOVGtnUXpFeE15NDFPVFFzTnpZdU5EVTVJREV4TXk0MU1UUXNOell1TkRNNElERXhNeTQwTkRJc056WXVNemszSUV3Mk55NDFNVGdzTkRrdU9EZ3lJRU0yTnk0ek56UXNORGt1TnprNUlEWTNMakk0TkN3ME9TNDJORFVnTmpjdU1qZzFMRFE1TGpRM09DQkROamN1TWpnMUxEUTVMak14TVNBMk55NHpOelFzTkRrdU1UVTNJRFkzTGpVeE9TdzBPUzR3TnpNZ1RERTBPUzR6TlRVc01pNHdNRElnUXpFME9TNDBPVGtzTVM0NU1Ua2dNVFE1TGpZM055d3hMamt4T1NBeE5Ea3VPREl4TERJdU1EQXlJRXd4TlRZdU5UVXNOUzQ0T0RjZ1F6RTFOaTQzTnpRc05pNHdNVGNnTVRVMkxqZzFMRFl1TXpBeUlERTFOaTQzTWpJc05pNDFNallnUXpFMU5pNDFPVElzTmk0M05Ea2dNVFUyTGpNd055dzJMamd5TmlBeE5UWXVNRGd6TERZdU5qazJJRXd4TkRrdU5UZzNMREl1T1RRMklFdzJPQzQyT0Rjc05Ea3VORGM1SUV3eE1UTXVOamMxTERjMUxqUTFNaUJNTVRFMkxqVXlNeXczTXk0NE1EZ2dRekV4Tmk0M01UVXNOek11TmprM0lERXhOeTR4TkRNc056TXVNems1SURFeE5pNDVOVGdzTnpNdU1ETTFJRU14TVRRdU5UUXlMRFk0TGpJNE55QXhNVFF1TXl3Mk15NHlNakVnTVRFMkxqSTFPQ3cxT0M0ek9EVWdRekV4T1M0d05qUXNOVEV1TkRVNElERXlOUzR4TkRNc05EVXVNVFF6SURFek15NDROQ3cwTUM0eE1qSWdRekUwTWk0ME9UY3NNelV1TVRJMElERTFNeTR6TlRnc016RXVOak16SURFMk5TNHlORGNzTXpBdU1ESTRJRU14TnpNdU5EUTFMREk0TGpreU1TQXhPREl1TURNM0xESTVMakExT0NBeE9UQXVNRGt4TERNd0xqUXlOU0JETVRrd0xqZ3pMRE13TGpVMUlERTVNUzQyTlRJc016QXVORE15SURFNU1pNHhPRFlzTXpBdU1USTBJRXd4T1RRdU5UWTNMREk0TGpjMUlFd3hOamt1TkRReUxERTBMakkwTkNCRE1UWTVMakl4T1N3eE5DNHhNVFVnTVRZNUxqRTBNaXd4TXk0NE1qa2dNVFk1TGpJM01Td3hNeTQyTURZZ1F6RTJPUzQwTERFekxqTTRNaUF4TmprdU5qZzFMREV6TGpNd05pQXhOamt1T1RBNUxERXpMalF6TlNCTU1UazFMamN6TkN3eU9DNHpORFVnUXpFNU5TNDROemtzTWpndU5ESTRJREU1TlM0NU5qZ3NNamd1TlRneklERTVOUzQ1Tmpnc01qZ3VOelVnUXpFNU5TNDVOamdzTWpndU9URTJJREU1TlM0NE56a3NNamt1TURjeElERTVOUzQzTXpRc01qa3VNVFUwSUV3eE9USXVOalV6TERNd0xqa3pNeUJETVRreExqa3pNaXd6TVM0ek5TQXhPVEF1T0Rrc016RXVOVEE0SURFNE9TNDVNelVzTXpFdU16UTJJRU14T0RFdU9UY3lMREk1TGprNU5TQXhOek11TkRjNExESTVMamcySURFMk5TNHpOeklzTXpBdU9UVTBJRU14TlRNdU5qQXlMRE15TGpVME15QXhOREl1T0RZc016VXVPVGt6SURFek5DNHpNRGNzTkRBdU9UTXhJRU14TWpVdU56a3pMRFExTGpnME55QXhNVGt1T0RVeExEVXlMakF3TkNBeE1UY3VNVEkwTERVNExqY3pOaUJETVRFMUxqSTNMRFl6TGpNeE5DQXhNVFV1TlRBeExEWTRMakV4TWlBeE1UY3VOemtzTnpJdU5qRXhJRU14TVRndU1UWXNOek11TXpNMklERXhOeTQ0TkRVc056UXVNVEkwSURFeE5pNDVPU3czTkM0Mk1UY2dUREV4TXk0NU1Ea3NOell1TXprM0lFTXhNVE11T0RNMkxEYzJMalF6T0NBeE1UTXVOelUyTERjMkxqUTFPU0F4TVRNdU5qYzFMRGMyTGpRMU9TSWdhV1E5SWtacGJHd3RNalFpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRVekxqTXhOaXd5TVM0eU56a2dRekUxTUM0NU1ETXNNakV1TWpjNUlERTBPQzQwT1RVc01qQXVOelV4SURFME5pNDJOalFzTVRrdU5qa3pJRU14TkRRdU9EUTJMREU0TGpZME5DQXhORE11T0RRMExERTNMakl6TWlBeE5ETXVPRFEwTERFMUxqY3hPQ0JETVRRekxqZzBOQ3d4TkM0eE9URWdNVFEwTGpnMkxERXlMamMyTXlBeE5EWXVOekExTERFeExqWTVPQ0JNTVRVMkxqRTVPQ3cyTGpBNU1TQkRNVFUyTGpNd09TdzJMakF5TlNBeE5UWXVORFV5TERZdU1EWXlJREUxTmk0MU1UZ3NOaTR4TnpNZ1F6RTFOaTQxT0RNc05pNHlPRFFnTVRVMkxqVTBOeXcyTGpReU55QXhOVFl1TkRNMkxEWXVORGt6SUV3eE5EWXVPVFFzTVRJdU1UQXlJRU14TkRVdU1qUTBMREV6TGpBNE1TQXhORFF1TXpFeUxERTBMak0yTlNBeE5EUXVNekV5TERFMUxqY3hPQ0JETVRRMExqTXhNaXd4Tnk0d05UZ2dNVFExTGpJekxERTRMak15TmlBeE5EWXVPRGszTERFNUxqSTRPU0JETVRVd0xqUTBOaXd5TVM0ek16Z2dNVFUyTGpJMExESXhMak15TnlBeE5Ua3VPREV4TERFNUxqSTJOU0JNTVRZNUxqVTFPU3d4TXk0Mk16Y2dRekUyT1M0Mk55d3hNeTQxTnpNZ01UWTVMamd4TXl3eE15NDJNVEVnTVRZNUxqZzNPQ3d4TXk0M01qTWdRekUyT1M0NU5ETXNNVE11T0RNMElERTJPUzQ1TURRc01UTXVPVGMzSURFMk9TNDNPVE1zTVRRdU1EUXlJRXd4TmpBdU1EUTFMREU1TGpZM0lFTXhOVGd1TVRnM0xESXdMamMwTWlBeE5UVXVOelE1TERJeExqSTNPU0F4TlRNdU16RTJMREl4TGpJM09TSWdhV1E5SWtacGJHd3RNalVpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTlM0NU9USWdURFkzTGpjMk1pdzBPUzQwT0RRaUlHbGtQU0pHYVd4c0xUSTJJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TXk0Mk56VXNOell1TXpReUlFTXhNVE11TmpFMUxEYzJMak0wTWlBeE1UTXVOVFUxTERjMkxqTXlOeUF4TVRNdU5TdzNOaTR5T1RVZ1REWTNMalU0Tnl3ME9TNDNPRGNnUXpZM0xqUXhPU3cwT1M0Mk9TQTJOeTR6TmpJc05Ea3VORGMySURZM0xqUTFPU3cwT1M0ek1Ea2dRelkzTGpVMU5pdzBPUzR4TkRFZ05qY3VOemNzTkRrdU1EZ3pJRFkzTGprek55dzBPUzR4T0NCTU1URXpMamcxTERjMUxqWTRPQ0JETVRFMExqQXhPQ3czTlM0M09EVWdNVEUwTGpBM05TdzNOaUF4TVRNdU9UYzRMRGMyTGpFMk55QkRNVEV6TGpreE5DdzNOaTR5TnprZ01URXpMamM1Tml3M05pNHpORElnTVRFekxqWTNOU3czTmk0ek5ESWlJR2xrUFNKR2FXeHNMVEkzSWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZM0xqYzJNaXcwT1M0ME9EUWdURFkzTGpjMk1pd3hNRE11TkRnMUlFTTJOeTQzTmpJc01UQTBMalUzTlNBMk9DNDFNeklzTVRBMUxqa3dNeUEyT1M0ME9ESXNNVEEyTGpRMU1pQk1NVEV4TGprMU5Td3hNekF1T1RjeklFTXhNVEl1T1RBMUxERXpNUzQxTWpJZ01URXpMalkzTlN3eE16RXVNRGd6SURFeE15NDJOelVzTVRJNUxqazVNeUJNTVRFekxqWTNOU3czTlM0NU9USWlJR2xrUFNKR2FXeHNMVEk0SWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFeE1pNDNNamNzTVRNeExqVTJNU0JETVRFeUxqUXpMREV6TVM0MU5qRWdNVEV5TGpFd055d3hNekV1TkRZMklERXhNUzQzT0N3eE16RXVNamMySUV3Mk9TNHpNRGNzTVRBMkxqYzFOU0JETmpndU1qUTBMREV3Tmk0eE5ESWdOamN1TkRFeUxERXdOQzQzTURVZ05qY3VOREV5TERFd015NDBPRFVnVERZM0xqUXhNaXcwT1M0ME9EUWdRelkzTGpReE1pdzBPUzR5T1NBMk55NDFOamtzTkRrdU1UTTBJRFkzTGpjMk1pdzBPUzR4TXpRZ1F6WTNMamsxTml3ME9TNHhNelFnTmpndU1URXpMRFE1TGpJNUlEWTRMakV4TXl3ME9TNDBPRFFnVERZNExqRXhNeXd4TURNdU5EZzFJRU0yT0M0eE1UTXNNVEEwTGpRME5TQTJPQzQ0TWl3eE1EVXVOalkxSURZNUxqWTFOeXd4TURZdU1UUTRJRXd4TVRJdU1UTXNNVE13TGpZM0lFTXhNVEl1TkRjMExERXpNQzQ0TmpnZ01URXlMamM1TVN3eE16QXVPVEV6SURFeE15d3hNekF1TnpreUlFTXhNVE11TWpBMkxERXpNQzQyTnpNZ01URXpMak15TlN3eE16QXVNemd4SURFeE15NHpNalVzTVRJNUxqazVNeUJNTVRFekxqTXlOU3czTlM0NU9USWdRekV4TXk0ek1qVXNOelV1TnprNElERXhNeTQwT0RJc056VXVOalF4SURFeE15NDJOelVzTnpVdU5qUXhJRU14TVRNdU9EWTVMRGMxTGpZME1TQXhNVFF1TURJMUxEYzFMamM1T0NBeE1UUXVNREkxTERjMUxqazVNaUJNTVRFMExqQXlOU3d4TWprdU9Ua3pJRU14TVRRdU1ESTFMREV6TUM0Mk5EZ2dNVEV6TGpjNE5pd3hNekV1TVRRM0lERXhNeTR6TlN3eE16RXVNems1SUVNeE1UTXVNVFl5TERFek1TNDFNRGNnTVRFeUxqazFNaXd4TXpFdU5UWXhJREV4TWk0M01qY3NNVE14TGpVMk1TSWdhV1E5SWtacGJHd3RNamtpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFeUxqZzJMRFF3TGpVeE1pQkRNVEV5TGpnMkxEUXdMalV4TWlBeE1USXVPRFlzTkRBdU5URXlJREV4TWk0NE5Ua3NOREF1TlRFeUlFTXhNVEF1TlRReExEUXdMalV4TWlBeE1EZ3VNellzTXprdU9Ua2dNVEEyTGpjeE55d3pPUzR3TkRFZ1F6RXdOUzR3TVRJc016Z3VNRFUzSURFd05DNHdOelFzTXpZdU56STJJREV3TkM0d056UXNNelV1TWpreUlFTXhNRFF1TURjMExETXpMamcwTnlBeE1EVXVNREkyTERNeUxqVXdNU0F4TURZdU56VTBMRE14TGpVd05DQk1NVEU0TGpjNU5Td3lOQzQxTlRFZ1F6RXlNQzQwTmpNc01qTXVOVGc1SURFeU1pNDJOamtzTWpNdU1EVTRJREV5TlM0d01EY3NNak11TURVNElFTXhNamN1TXpJMUxESXpMakExT0NBeE1qa3VOVEEyTERJekxqVTRNU0F4TXpFdU1UVXNNalF1TlRNZ1F6RXpNaTQ0TlRRc01qVXVOVEUwSURFek15NDNPVE1zTWpZdU9EUTFJREV6TXk0M09UTXNNamd1TWpjNElFTXhNek11TnprekxESTVMamN5TkNBeE16SXVPRFF4TERNeExqQTJPU0F4TXpFdU1URXpMRE15TGpBMk55Qk1NVEU1TGpBM01Td3pPUzR3TVRrZ1F6RXhOeTQwTURNc016a3VPVGd5SURFeE5TNHhPVGNzTkRBdU5URXlJREV4TWk0NE5pdzBNQzQxTVRJZ1RERXhNaTQ0Tml3ME1DNDFNVElnV2lCTk1USTFMakF3Tnl3eU15NDNOVGtnUXpFeU1pNDNPU3d5TXk0M05Ua2dNVEl3TGpjd09Td3lOQzR5TlRZZ01URTVMakUwTml3eU5TNHhOVGdnVERFd055NHhNRFFzTXpJdU1URWdRekV3TlM0Mk1ESXNNekl1T1RjNElERXdOQzQzTnpRc016UXVNVEE0SURFd05DNDNOelFzTXpVdU1qa3lJRU14TURRdU56YzBMRE0yTGpRMk5TQXhNRFV1TlRnNUxETTNMalU0TVNBeE1EY3VNRFkzTERNNExqUXpOQ0JETVRBNExqWXdOU3d6T1M0ek1qTWdNVEV3TGpZMk15d3pPUzQ0TVRJZ01URXlMamcxT1N3ek9TNDRNVElnVERFeE1pNDROaXd6T1M0NE1USWdRekV4TlM0d056WXNNemt1T0RFeUlERXhOeTR4TlRnc016a3VNekUxSURFeE9DNDNNakVzTXpndU5ERXpJRXd4TXpBdU56WXlMRE14TGpRMklFTXhNekl1TWpZMExETXdMalU1TXlBeE16TXVNRGt5TERJNUxqUTJNeUF4TXpNdU1Ea3lMREk0TGpJM09DQkRNVE16TGpBNU1pd3lOeTR4TURZZ01UTXlMakkzT0N3eU5TNDVPU0F4TXpBdU9Dd3lOUzR4TXpZZ1F6RXlPUzR5TmpFc01qUXVNalE0SURFeU55NHlNRFFzTWpNdU56VTVJREV5TlM0d01EY3NNak11TnpVNUlFd3hNalV1TURBM0xESXpMamMxT1NCYUlpQnBaRDBpUm1sc2JDMHpNQ0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TmpVdU5qTXNNVFl1TWpFNUlFd3hOVGt1T0RrMkxERTVMalV6SUVNeE5UWXVOekk1TERJeExqTTFPQ0F4TlRFdU5qRXNNakV1TXpZM0lERTBPQzQwTmpNc01Ua3VOVFVnUXpFME5TNHpNVFlzTVRjdU56TXpJREUwTlM0ek16SXNNVFF1TnpjNElERTBPQzQwT1Rrc01USXVPVFE1SUV3eE5UUXVNak16TERrdU5qTTVJRXd4TmpVdU5qTXNNVFl1TWpFNUlpQnBaRDBpUm1sc2JDMHpNU0lnWm1sc2JEMGlJMFpCUmtGR1FTSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TlRRdU1qTXpMREV3TGpRME9DQk1NVFkwTGpJeU9Dd3hOaTR5TVRrZ1RERTFPUzQxTkRZc01UZ3VPVEl6SUVNeE5UZ3VNVEV5TERFNUxqYzFJREUxTmk0eE9UUXNNakF1TWpBMklERTFOQzR4TkRjc01qQXVNakEySUVNeE5USXVNVEU0TERJd0xqSXdOaUF4TlRBdU1qSTBMREU1TGpjMU55QXhORGd1T0RFMExERTRMamswTXlCRE1UUTNMalV5TkN3eE9DNHhPVGtnTVRRMkxqZ3hOQ3d4Tnk0eU5Ea2dNVFEyTGpneE5Dd3hOaTR5TmprZ1F6RTBOaTQ0TVRRc01UVXVNamM0SURFME55NDFNemNzTVRRdU16RTBJREUwT0M0NE5Td3hNeTQxTlRZZ1RERTFOQzR5TXpNc01UQXVORFE0SUUweE5UUXVNak16TERrdU5qTTVJRXd4TkRndU5EazVMREV5TGprME9TQkRNVFExTGpNek1pd3hOQzQzTnpnZ01UUTFMak14Tml3eE55NDNNek1nTVRRNExqUTJNeXd4T1M0MU5TQkRNVFV3TGpBek1Td3lNQzQwTlRVZ01UVXlMakE0Tml3eU1DNDVNRGNnTVRVMExqRTBOeXd5TUM0NU1EY2dRekUxTmk0eU1qUXNNakF1T1RBM0lERTFPQzR6TURZc01qQXVORFEzSURFMU9TNDRPVFlzTVRrdU5UTWdUREUyTlM0Mk15d3hOaTR5TVRrZ1RERTFOQzR5TXpNc09TNDJNemtpSUdsa1BTSkdhV3hzTFRNeUlpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBOUzQwTkRVc056SXVOalkzSUV3eE5EVXVORFExTERjeUxqWTJOeUJETVRRekxqWTNNaXczTWk0Mk5qY2dNVFF5TGpJd05DdzNNUzQ0TVRjZ01UUXhMakl3TWl3M01DNDBNaklnUXpFME1TNHhNelVzTnpBdU16TWdNVFF4TGpFME5TdzNNQzR4TkRjZ01UUXhMakl5TlN3M01DNHdOallnUXpFME1TNHpNRFVzTmprdU9UZzFJREUwTVM0ME16SXNOamt1T1RRMklERTBNUzQxTWpVc056QXVNREV4SUVNeE5ESXVNekEyTERjd0xqVTFPU0F4TkRNdU1qTXhMRGN3TGpneU15QXhORFF1TWpjMkxEY3dMamd5TWlCRE1UUTFMalU1T0N3M01DNDRNaklnTVRRM0xqQXpMRGN3TGpNM05pQXhORGd1TlRNeUxEWTVMalV3T1NCRE1UVXpMamcwTWl3Mk5pNDBORE1nTVRVNExqRTJNeXcxT0M0NU9EY2dNVFU0TGpFMk15dzFNaTQ0T1RRZ1F6RTFPQzR4TmpNc05UQXVPVFkzSURFMU55NDNNakVzTkRrdU16TXlJREUxTmk0NE9EUXNORGd1TVRZNElFTXhOVFl1T0RFNExEUTRMakEzTmlBeE5UWXVPREk0TERRM0xqazBPQ0F4TlRZdU9UQTRMRFEzTGpnMk55QkRNVFUyTGprNE9DdzBOeTQzT0RZZ01UVTNMakV4TkN3ME55NDNOelFnTVRVM0xqSXdPQ3cwTnk0NE5DQkRNVFU0TGpnM09DdzBPUzR3TVRJZ01UVTVMamM1T0N3MU1TNHlNaUF4TlRrdU56azRMRFUwTGpBMU9TQkRNVFU1TGpjNU9DdzJNQzR6TURFZ01UVTFMak0zTXl3Mk9DNHdORFlnTVRRNUxqa3pNeXczTVM0eE9EWWdRekUwT0M0ek5pdzNNaTR3T1RRZ01UUTJMamcxTERjeUxqWTJOeUF4TkRVdU5EUTFMRGN5TGpZMk55Qk1NVFExTGpRME5TdzNNaTQyTmpjZ1dpQk5NVFF5TGpRM05pdzNNU0JETVRRekxqSTVMRGN4TGpZMU1TQXhORFF1TWprMkxEY3lMakF3TWlBeE5EVXVORFExTERjeUxqQXdNaUJETVRRMkxqYzJOeXczTWk0d01ESWdNVFE0TGpFNU9DdzNNUzQxTlNBeE5Ea3VOeXczTUM0Mk9ESWdRekUxTlM0d01TdzJOeTQyTVRjZ01UVTVMak16TVN3Mk1DNHhOVGtnTVRVNUxqTXpNU3cxTkM0d05qVWdRekUxT1M0ek16RXNOVEl1TURnMUlERTFPQzQ0Tmpnc05UQXVORE0xSURFMU9DNHdNRFlzTkRrdU1qY3lJRU14TlRndU5ERTNMRFV3TGpNd055QXhOVGd1TmpNc05URXVOVE15SURFMU9DNDJNeXcxTWk0NE9USWdRekUxT0M0Mk15dzFPUzR4TXpRZ01UVTBMakl3TlN3Mk5pNDNOamNnTVRRNExqYzJOU3cyT1M0NU1EY2dRekUwTnk0eE9USXNOekF1T0RFMklERTBOUzQyT0RFc056RXVNamd6SURFME5DNHlOellzTnpFdU1qZ3pJRU14TkRNdU5qTTBMRGN4TGpJNE15QXhORE11TURNekxEY3hMakU1TWlBeE5ESXVORGMyTERjeElFd3hOREl1TkRjMkxEY3hJRm9pSUdsa1BTSkdhV3hzTFRNeklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTBPQzQyTkRnc05qa3VOekEwSUVNeE5UUXVNRE15TERZMkxqVTVOaUF4TlRndU16azJMRFU1TGpBMk9DQXhOVGd1TXprMkxEVXlMamc1TVNCRE1UVTRMak01Tml3MU1DNDRNemtnTVRVM0xqa3hNeXcwT1M0eE9UZ2dNVFUzTGpBM05DdzBPQzR3TXlCRE1UVTFMakk0T1N3ME5pNDNOemdnTVRVeUxqWTVPU3cwTmk0NE16WWdNVFE1TGpneE5pdzBPQzQxTURFZ1F6RTBOQzQwTXpNc05URXVOakE1SURFME1DNHdOamdzTlRrdU1UTTNJREUwTUM0d05qZ3NOalV1TXpFMElFTXhOREF1TURZNExEWTNMak0yTlNBeE5EQXVOVFV5TERZNUxqQXdOaUF4TkRFdU16a3hMRGN3TGpFM05DQkRNVFF6TGpFM05pdzNNUzQwTWpjZ01UUTFMamMyTlN3M01TNHpOamtnTVRRNExqWTBPQ3cyT1M0M01EUWlJR2xrUFNKR2FXeHNMVE0wSWlCbWFXeHNQU0lqUmtGR1FVWkJJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5DNHlOellzTnpFdU1qYzJJRXd4TkRRdU1qYzJMRGN4TGpJM05pQkRNVFF6TGpFek15dzNNUzR5TnpZZ01UUXlMakV4T0N3M01DNDVOamtnTVRReExqSTFOeXczTUM0ek5qVWdRekUwTVM0eU16WXNOekF1TXpVeElERTBNUzR5TVRjc056QXVNek15SURFME1TNHlNRElzTnpBdU16RXhJRU14TkRBdU16QTNMRFk1TGpBMk55QXhNemt1T0RNMUxEWTNMak16T1NBeE16a3VPRE0xTERZMUxqTXhOQ0JETVRNNUxqZ3pOU3cxT1M0d056TWdNVFEwTGpJMkxEVXhMalF6T1NBeE5Ea3VOeXcwT0M0eU9UZ2dRekUxTVM0eU56TXNORGN1TXprZ01UVXlMamM0TkN3ME5pNDVNamtnTVRVMExqRTRPU3cwTmk0NU1qa2dRekUxTlM0ek16SXNORFl1T1RJNUlERTFOaTR6TkRjc05EY3VNak0ySURFMU55NHlNRGdzTkRjdU9ETTVJRU14TlRjdU1qSTVMRFEzTGpnMU5DQXhOVGN1TWpRNExEUTNMamczTXlBeE5UY3VNall6TERRM0xqZzVOQ0JETVRVNExqRTFOeXcwT1M0eE16Z2dNVFU0TGpZekxEVXdMamcyTlNBeE5UZ3VOak1zTlRJdU9Ea3hJRU14TlRndU5qTXNOVGt1TVRNeUlERTFOQzR5TURVc05qWXVOelkySURFME9DNDNOalVzTmprdU9UQTNJRU14TkRjdU1Ua3lMRGN3TGpneE5TQXhORFV1TmpneExEY3hMakkzTmlBeE5EUXVNamMyTERjeExqSTNOaUJNTVRRMExqSTNOaXczTVM0eU56WWdXaUJOTVRReExqVTFPQ3czTUM0eE1EUWdRekUwTWk0ek16RXNOekF1TmpNM0lERTBNeTR5TkRVc056RXVNREExSURFME5DNHlOellzTnpFdU1EQTFJRU14TkRVdU5UazRMRGN4TGpBd05TQXhORGN1TURNc056QXVORFkzSURFME9DNDFNeklzTmprdU5pQkRNVFV6TGpnME1pdzJOaTQxTXpRZ01UVTRMakUyTXl3MU9TNHdNek1nTVRVNExqRTJNeXcxTWk0NU16a2dRekUxT0M0eE5qTXNOVEV1TURNeElERTFOeTQzTWprc05Ea3VNemcxSURFMU5pNDVNRGNzTkRndU1qSXpJRU14TlRZdU1UTXpMRFEzTGpZNU1TQXhOVFV1TWpFNUxEUTNMalF3T1NBeE5UUXVNVGc1TERRM0xqUXdPU0JETVRVeUxqZzJOeXcwTnk0ME1Ea2dNVFV4TGpRek5TdzBOeTQ0TkRJZ01UUTVMamt6TXl3ME9DNDNNRGtnUXpFME5DNDJNak1zTlRFdU56YzFJREUwTUM0ek1ESXNOVGt1TWpjeklERTBNQzR6TURJc05qVXVNelkySUVNeE5EQXVNekF5TERZM0xqSTNOaUF4TkRBdU56TTJMRFk0TGprME1pQXhOREV1TlRVNExEY3dMakV3TkNCTU1UUXhMalUxT0N3M01DNHhNRFFnV2lJZ2FXUTlJa1pwYkd3dE16VWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV3TGpjeUxEWTFMak0yTVNCTU1UVXdMak0xTnl3Mk5TNHdOallnUXpFMU1TNHhORGNzTmpRdU1Ea3lJREUxTVM0NE5qa3NOak11TURRZ01UVXlMalV3TlN3Mk1TNDVNemdnUXpFMU15NHpNVE1zTmpBdU5UTTVJREUxTXk0NU56Z3NOVGt1TURZM0lERTFOQzQwT0RJc05UY3VOVFl6SUV3eE5UUXVPVEkxTERVM0xqY3hNaUJETVRVMExqUXhNaXcxT1M0eU5EVWdNVFV6TGpjek15dzJNQzQzTkRVZ01UVXlMamt4TERZeUxqRTNNaUJETVRVeUxqSTJNaXcyTXk0eU9UVWdNVFV4TGpVeU5TdzJOQzR6TmpnZ01UVXdMamN5TERZMUxqTTJNU0lnYVdROUlrWnBiR3d0TXpZaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URTFMamt4Tnl3NE5DNDFNVFFnVERFeE5TNDFOVFFzT0RRdU1qSWdRekV4Tmk0ek5EUXNPRE11TWpRMUlERXhOeTR3TmpZc09ESXVNVGswSURFeE55NDNNRElzT0RFdU1Ea3lJRU14TVRndU5URXNOemt1TmpreUlERXhPUzR4TnpVc056Z3VNaklnTVRFNUxqWTNPQ3czTmk0M01UY2dUREV5TUM0eE1qRXNOell1T0RZMUlFTXhNVGt1TmpBNExEYzRMak01T0NBeE1UZ3VPVE1zTnprdU9EazVJREV4T0M0eE1EWXNPREV1TXpJMklFTXhNVGN1TkRVNExEZ3lMalEwT0NBeE1UWXVOekl5TERnekxqVXlNU0F4TVRVdU9URTNMRGcwTGpVeE5DSWdhV1E5SWtacGJHd3RNemNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMExERXpNQzQwTnpZZ1RERXhOQ3d4TXpBdU1EQTRJRXd4TVRRc056WXVNRFV5SUV3eE1UUXNOelV1TlRnMElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc01UTXdMakF3T0NCTU1URTBMREV6TUM0ME56WWlJR2xrUFNKR2FXeHNMVE00SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThMMmMrQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4WnlCcFpEMGlTVzF3YjNKMFpXUXRUR0Y1WlhKekxVTnZjSGtpSUhSeVlXNXpabTl5YlQwaWRISmhibk5zWVhSbEtEWXlMakF3TURBd01Dd2dNQzR3TURBd01EQXBJaUJ6YTJWMFkyZzZkSGx3WlQwaVRWTlRhR0Z3WlVkeWIzVndJajRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1Ua3VPREl5TERNM0xqUTNOQ0JETVRrdU9ETTVMRE0zTGpNek9TQXhPUzQzTkRjc016Y3VNVGswSURFNUxqVTFOU3d6Tnk0d09ESWdRekU1TGpJeU9Dd3pOaTQ0T1RRZ01UZ3VOekk1TERNMkxqZzNNaUF4T0M0ME5EWXNNemN1TURNM0lFd3hNaTQwTXpRc05EQXVOVEE0SUVNeE1pNHpNRE1zTkRBdU5UZzBJREV5TGpJMExEUXdMalk0TmlBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5EVXNOREF1T1RJMUlERXlMakkwTlN3ME1TNHlOVFFnTVRJdU1qUTFMRFF4TGpNM01TQk1NVEl1TWpRMUxEUXhMalF4TkNCTU1USXVNak00TERReExqVTBNaUJET0M0eE5EZ3NORE11T0RnM0lEVXVOalEzTERRMUxqTXlNU0ExTGpZME55dzBOUzR6TWpFZ1F6VXVOalEyTERRMUxqTXlNU0F6TGpVM0xEUTJMak0yTnlBeUxqZzJMRFV3TGpVeE15QkRNaTQ0Tml3MU1DNDFNVE1nTVM0NU5EZ3NOVGN1TkRjMElERXVPVFl5TERjd0xqSTFPQ0JETVM0NU56Y3NPREl1T0RJNElESXVOVFk0TERnM0xqTXlPQ0F6TGpFeU9TdzVNUzQyTURrZ1F6TXVNelE1TERrekxqSTVNeUEyTGpFekxEa3pMamN6TkNBMkxqRXpMRGt6TGpjek5DQkROaTQwTmpFc09UTXVOemMwSURZdU9ESTRMRGt6TGpjd055QTNMakl4TERrekxqUTROaUJNT0RJdU5EZ3pMRFE1TGprek5TQkRPRFF1TWpreExEUTRMamcyTmlBNE5TNHhOU3cwTmk0eU1UWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EWXVOelV5TERNMUxqWTJNU0E0Tnk0eU1UUXNNVEF1TmpjeklEZzFMakkyTkN3ekxqYzNNeUJET0RVdU1EWTRMRE11TURnZ09EUXVOelUwTERJdU5qa2dPRFF1TXprMkxESXVORGt4SUV3NE1pNHpNU3d4TGpjd01TQkRPREV1TlRnekxERXVOekk1SURnd0xqZzVOQ3d5TGpFMk9DQTRNQzQzTnpZc01pNHlNellnUXpnd0xqWXpOaXd5TGpNeE55QTBNUzQ0TURjc01qUXVOVGcxSURJd0xqQXpNaXd6Tnk0d056SWdUREU1TGpneU1pd3pOeTQwTnpRaUlHbGtQU0pHYVd4c0xURWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PREl1TXpFeExERXVOekF4SUV3NE5DNHpPVFlzTWk0ME9URWdRemcwTGpjMU5Dd3lMalk1SURnMUxqQTJPQ3d6TGpBNElEZzFMakkyTkN3ekxqYzNNeUJET0RjdU1qRXpMREV3TGpZM015QTROaTQzTlRFc016VXVOallnT0RVdU5UTTVMRFF6TGpZMU1TQkRPRFV1TVRRNUxEUTJMakl4TmlBNE5DNHlPU3cwT0M0NE5qWWdPREl1TkRnekxEUTVMamt6TlNCTU55NHlNU3c1TXk0ME9EWWdRell1T0RrM0xEa3pMalkyTnlBMkxqVTVOU3c1TXk0M05EUWdOaTR6TVRRc09UTXVOelEwSUV3MkxqRXpNU3c1TXk0M016TWdRell1TVRNeExEa3pMamN6TkNBekxqTTBPU3c1TXk0eU9UTWdNeTR4TWpnc09URXVOakE1SUVNeUxqVTJPQ3c0Tnk0ek1qY2dNUzQ1Tnpjc09ESXVPREk0SURFdU9UWXpMRGN3TGpJMU9DQkRNUzQ1TkRnc05UY3VORGMwSURJdU9EWXNOVEF1TlRFeklESXVPRFlzTlRBdU5URXpJRU16TGpVM0xEUTJMak0yTnlBMUxqWTBOeXcwTlM0ek1qRWdOUzQyTkRjc05EVXVNekl4SUVNMUxqWTBOeXcwTlM0ek1qRWdPQzR4TkRnc05ETXVPRGczSURFeUxqSXpPQ3cwTVM0MU5ESWdUREV5TGpJME5TdzBNUzQwTVRRZ1RERXlMakkwTlN3ME1TNHpOekVnUXpFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXdMamt5TlNBeE1pNHlORE1zTkRBdU56a3pJRU14TWk0eU5DdzBNQzQyT0RZZ01USXVNekF5TERRd0xqVTRNeUF4TWk0ME16UXNOREF1TlRBNElFd3hPQzQwTkRZc016Y3VNRE0ySUVNeE9DNDFOelFzTXpZdU9UWXlJREU0TGpjME5pd3pOaTQ1TWpZZ01UZ3VPVEkzTERNMkxqa3lOaUJETVRrdU1UUTFMRE0yTGpreU5pQXhPUzR6TnpZc016WXVPVGM1SURFNUxqVTFOQ3d6Tnk0d09ESWdRekU1TGpjME55d3pOeTR4T1RRZ01Ua3VPRE01TERNM0xqTTBJREU1TGpneU1pd3pOeTQwTnpRZ1RESXdMakF6TXl3ek55NHdOeklnUXpReExqZ3dOaXd5TkM0MU9EVWdPREF1TmpNMkxESXVNekU0SURnd0xqYzNOeXd5TGpJek5pQkRPREF1T0RrMExESXVNVFk0SURneExqVTRNeXd4TGpjeU9TQTRNaTR6TVRFc01TNDNNREVnVFRneUxqTXhNU3d3TGpjd05DQk1PREl1TWpjeUxEQXVOekExSUVNNE1TNDJOVFFzTUM0M01qZ2dPREF1T1RnNUxEQXVPVFE1SURnd0xqSTVPQ3d4TGpNMk1TQk1PREF1TWpjM0xERXVNemN6SUVNNE1DNHhNamtzTVM0ME5UZ2dOVGt1TnpZNExERXpMakV6TlNBeE9TNDNOVGdzTXpZdU1EYzVJRU14T1M0MUxETTFMams0TVNBeE9TNHlNVFFzTXpVdU9USTVJREU0TGpreU55d3pOUzQ1TWprZ1F6RTRMalUyTWl3ek5TNDVNamtnTVRndU1qSXpMRE0yTGpBeE15QXhOeTQ1TkRjc016WXVNVGN6SUV3eE1TNDVNelVzTXprdU5qUTBJRU14TVM0ME9UTXNNemt1T0RrNUlERXhMakl6Tml3ME1DNHpNelFnTVRFdU1qUTJMRFF3TGpneElFd3hNUzR5TkRjc05EQXVPVFlnVERVdU1UWTNMRFEwTGpRME55QkROQzQzT1RRc05EUXVOalEySURJdU5qSTFMRFExTGprM09DQXhMamczTnl3MU1DNHpORFVnVERFdU9EY3hMRFV3TGpNNE5DQkRNUzQ0TmpJc05UQXVORFUwSURBdU9UVXhMRFUzTGpVMU55QXdMamsyTlN3M01DNHlOVGtnUXpBdU9UYzVMRGd5TGpnM09TQXhMalUyT0N3NE55NHpOelVnTWk0eE16Y3NPVEV1TnpJMElFd3lMakV6T1N3NU1TNDNNemtnUXpJdU5EUTNMRGswTGpBNU5DQTFMall4TkN3NU5DNDJOaklnTlM0NU56VXNPVFF1TnpFNUlFdzJMakF3T1N3NU5DNDNNak1nUXpZdU1URXNPVFF1TnpNMklEWXVNakV6TERrMExqYzBNaUEyTGpNeE5DdzVOQzQzTkRJZ1F6WXVOemtzT1RRdU56UXlJRGN1TWpZc09UUXVOakVnTnk0M01TdzVOQzR6TlNCTU9ESXVPVGd6TERVd0xqYzVPQ0JET0RRdU56azBMRFE1TGpjeU55QTROUzQ1T0RJc05EY3VNemMxSURnMkxqVXlOU3cwTXk0NE1ERWdRemczTGpjeE1Td3pOUzQ1T0RjZ09EZ3VNalU1TERFd0xqY3dOU0E0Tmk0eU1qUXNNeTQxTURJZ1F6ZzFMamszTVN3eUxqWXdPU0E0TlM0MU1pd3hMamszTlNBNE5DNDRPREVzTVM0Mk1pQk1PRFF1TnpRNUxERXVOVFU0SUV3NE1pNDJOalFzTUM0M05qa2dRemd5TGpVMU1Td3dMamN5TlNBNE1pNDBNekVzTUM0M01EUWdPREl1TXpFeExEQXVOekEwSWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWTJMakkyTnl3eE1TNDFOalVnVERZM0xqYzJNaXd4TVM0NU9Ua2dUREV4TGpReU15dzBOQzR6TWpVaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TWpBeUxEa3dMalUwTlNCRE1USXVNREk1TERrd0xqVTBOU0F4TVM0NE5qSXNPVEF1TkRVMUlERXhMamMyT1N3NU1DNHlPVFVnUXpFeExqWXpNaXc1TUM0d05UY2dNVEV1TnpFekxEZzVMamMxTWlBeE1TNDVOVElzT0RrdU5qRTBJRXd6TUM0ek9Ea3NOemd1T1RZNUlFTXpNQzQyTWpnc056Z3VPRE14SURNd0xqa3pNeXczT0M0NU1UTWdNekV1TURjeExEYzVMakUxTWlCRE16RXVNakE0TERjNUxqTTVJRE14TGpFeU55dzNPUzQyT1RZZ016QXVPRGc0TERjNUxqZ3pNeUJNTVRJdU5EVXhMRGt3TGpRM09DQk1NVEl1TWpBeUxEa3dMalUwTlNJZ2FXUTlJa1pwYkd3dE5DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNeTQzTmpRc05ESXVOalUwSUV3eE15NDJOVFlzTkRJdU5Ua3lJRXd4TXk0M01ESXNOREl1TkRJeElFd3hPQzQ0TXpjc016a3VORFUzSUV3eE9TNHdNRGNzTXprdU5UQXlJRXd4T0M0NU5qSXNNemt1TmpjeklFd3hNeTQ0TWpjc05ESXVOak0zSUV3eE15NDNOalFzTkRJdU5qVTBJaUJwWkQwaVJtbHNiQzAxSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRndU5USXNPVEF1TXpjMUlFdzRMalV5TERRMkxqUXlNU0JNT0M0MU9ETXNORFl1TXpnMUlFdzNOUzQ0TkN3M0xqVTFOQ0JNTnpVdU9EUXNOVEV1TlRBNElFdzNOUzQzTnpnc05URXVOVFEwSUV3NExqVXlMRGt3TGpNM05TQk1PQzQxTWl3NU1DNHpOelVnV2lCTk9DNDNOeXcwTmk0MU5qUWdURGd1Tnpjc09Ea3VPVFEwSUV3M05TNDFPVEVzTlRFdU16WTFJRXczTlM0MU9URXNOeTQ1T0RVZ1REZ3VOemNzTkRZdU5UWTBJRXc0TGpjM0xEUTJMalUyTkNCYUlpQnBaRDBpUm1sc2JDMDJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEkwTGprNE5pdzRNeTR4T0RJZ1F6STBMamMxTml3NE15NHpNekVnTWpRdU16YzBMRGd6TGpVMk5pQXlOQzR4TXpjc09ETXVOekExSUV3eE1pNDJNeklzT1RBdU5EQTJJRU14TWk0ek9UVXNPVEF1TlRRMUlERXlMalF5Tml3NU1DNDJOVGdnTVRJdU55dzVNQzQyTlRnZ1RERXpMakkyTlN3NU1DNDJOVGdnUXpFekxqVTBMRGt3TGpZMU9DQXhNeTQ1TlRnc09UQXVOVFExSURFMExqRTVOU3c1TUM0ME1EWWdUREkxTGpjc09ETXVOekExSUVNeU5TNDVNemNzT0RNdU5UWTJJREkyTGpFeU9DdzRNeTQwTlRJZ01qWXVNVEkxTERnekxqUTBPU0JETWpZdU1USXlMRGd6TGpRME55QXlOaTR4TVRrc09ETXVNaklnTWpZdU1URTVMRGd5TGprME5pQkRNall1TVRFNUxEZ3lMalkzTWlBeU5TNDVNekVzT0RJdU5UWTVJREkxTGpjd01TdzRNaTQzTVRrZ1RESTBMams0Tml3NE15NHhPRElpSUdsa1BTSkdhV3hzTFRjaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UTXVNalkyTERrd0xqYzRNaUJNTVRJdU55dzVNQzQzT0RJZ1F6RXlMalVzT1RBdU56Z3lJREV5TGpNNE5DdzVNQzQzTWpZZ01USXVNelUwTERrd0xqWXhOaUJETVRJdU16STBMRGt3TGpVd05pQXhNaTR6T1Rjc09UQXVNems1SURFeUxqVTJPU3c1TUM0eU9Ua2dUREkwTGpBM05DdzRNeTQxT1RjZ1F6STBMak14TERnekxqUTFPU0F5TkM0Mk9Ea3NPRE11TWpJMklESTBMamt4T0N3NE15NHdOemdnVERJMUxqWXpNeXc0TWk0Mk1UUWdRekkxTGpjeU15dzRNaTQxTlRVZ01qVXVPREV6TERneUxqVXlOU0F5TlM0NE9Ua3NPREl1TlRJMUlFTXlOaTR3TnpFc09ESXVOVEkxSURJMkxqSTBOQ3c0TWk0Mk5UVWdNall1TWpRMExEZ3lMamswTmlCRE1qWXVNalEwTERnekxqRTJJREkyTGpJME5TdzRNeTR6TURrZ01qWXVNalEzTERnekxqTTRNeUJNTWpZdU1qVXpMRGd6TGpNNE55Qk1Nall1TWpRNUxEZ3pMalExTmlCRE1qWXVNalEyTERnekxqVXpNU0F5Tmk0eU5EWXNPRE11TlRNeElESTFMamMyTXl3NE15NDRNVElnVERFMExqSTFPQ3c1TUM0MU1UUWdRekUwTERrd0xqWTJOU0F4TXk0MU5qUXNPVEF1TnpneUlERXpMakkyTml3NU1DNDNPRElnVERFekxqSTJOaXc1TUM0M09ESWdXaUJOTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1Tnl3NU1DNDFNek1nVERFekxqSTJOaXc1TUM0MU16TWdRekV6TGpVeE9DdzVNQzQxTXpNZ01UTXVPVEUxTERrd0xqUXlOU0F4TkM0eE16SXNPVEF1TWprNUlFd3lOUzQyTXpjc09ETXVOVGszSUVNeU5TNDRNRFVzT0RNdU5EazVJREkxTGprek1TdzRNeTQwTWpRZ01qVXVPVGs0TERnekxqTTRNeUJETWpVdU9UazBMRGd6TGpJNU9TQXlOUzQ1T1RRc09ETXVNVFkxSURJMUxqazVOQ3c0TWk0NU5EWWdUREkxTGpnNU9TdzRNaTQzTnpVZ1RESTFMamMyT0N3NE1pNDRNalFnVERJMUxqQTFOQ3c0TXk0eU9EY2dRekkwTGpneU1pdzRNeTQwTXpjZ01qUXVORE00TERnekxqWTNNeUF5TkM0eUxEZ3pMamd4TWlCTU1USXVOamsxTERrd0xqVXhOQ0JNTVRJdU5qWTJMRGt3TGpVek1pQk1NVEl1TmpZMkxEa3dMalV6TWlCYUlpQnBaRDBpUm1sc2JDMDRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV6TGpJMk5pdzRPUzQ0TnpFZ1RERXlMamNzT0RrdU9EY3hJRU14TWk0MUxEZzVMamczTVNBeE1pNHpPRFFzT0RrdU9ERTFJREV5TGpNMU5DdzRPUzQzTURVZ1F6RXlMak15TkN3NE9TNDFPVFVnTVRJdU16azNMRGc1TGpRNE9DQXhNaTQxTmprc09Ea3VNemc0SUV3eU5DNHdOelFzT0RJdU5qZzJJRU15TkM0ek16SXNPREl1TlRNMUlESTBMamMyT0N3NE1pNDBNVGdnTWpVdU1EWTNMRGd5TGpReE9DQk1NalV1TmpNeUxEZ3lMalF4T0NCRE1qVXVPRE15TERneUxqUXhPQ0F5TlM0NU5EZ3NPREl1TkRjMElESTFMamszT0N3NE1pNDFPRFFnUXpJMkxqQXdPQ3c0TWk0Mk9UUWdNalV1T1RNMUxEZ3lMamd3TVNBeU5TNDNOak1zT0RJdU9UQXhJRXd4TkM0eU5UZ3NPRGt1TmpBeklFTXhOQ3c0T1M0M05UUWdNVE11TlRZMExEZzVMamczTVNBeE15NHlOallzT0RrdU9EY3hJRXd4TXk0eU5qWXNPRGt1T0RjeElGb2dUVEV5TGpZMk5pdzRPUzQyTWpFZ1RERXlMamNzT0RrdU5qSXlJRXd4TXk0eU5qWXNPRGt1TmpJeUlFTXhNeTQxTVRnc09Ea3VOakl5SURFekxqa3hOU3c0T1M0MU1UVWdNVFF1TVRNeUxEZzVMak00T0NCTU1qVXVOak0zTERneUxqWTROaUJNTWpVdU5qWTNMRGd5TGpZMk9DQk1NalV1TmpNeUxEZ3lMalkyTnlCTU1qVXVNRFkzTERneUxqWTJOeUJETWpRdU9ERTFMRGd5TGpZMk55QXlOQzQwTVRnc09ESXVOemMxSURJMExqSXNPREl1T1RBeElFd3hNaTQyT1RVc09Ea3VOakF6SUV3eE1pNDJOallzT0RrdU5qSXhJRXd4TWk0Mk5qWXNPRGt1TmpJeElGb2lJR2xrUFNKR2FXeHNMVGtpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRJdU16Y3NPVEF1T0RBeElFd3hNaTR6Tnl3NE9TNDFOVFFnVERFeUxqTTNMRGt3TGpnd01TSWdhV1E5SWtacGJHd3RNVEFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmk0eE15dzVNeTQ1TURFZ1F6VXVNemM1TERrekxqZ3dPQ0EwTGpneE5pdzVNeTR4TmpRZ05DNDJPVEVzT1RJdU5USTFJRU16TGpnMkxEZzRMakk0TnlBekxqVTBMRGd6TGpjME15QXpMalV5Tml3M01TNHhOek1nUXpNdU5URXhMRFU0TGpNNE9TQTBMalF5TXl3MU1TNDBNamdnTkM0ME1qTXNOVEV1TkRJNElFTTFMakV6TkN3ME55NHlPRElnTnk0eU1TdzBOaTR5TXpZZ055NHlNU3cwTmk0eU16WWdRemN1TWpFc05EWXVNak0ySURneExqWTJOeXd6TGpJMUlEZ3lMakEyT1N3ekxqQXhOeUJET0RJdU1qa3lMREl1T0RnNElEZzBMalUxTml3eExqUXpNeUE0TlM0eU5qUXNNeTQ1TkNCRE9EY3VNakUwTERFd0xqZzBJRGcyTGpjMU1pd3pOUzQ0TWpjZ09EVXVOVE01TERRekxqZ3hPQ0JET0RVdU1UVXNORFl1TXpneklEZzBMakk1TVN3ME9TNHdNek1nT0RJdU5EZ3pMRFV3TGpFd01TQk1OeTR5TVN3NU15NDJOVE1nUXpZdU9ESTRMRGt6TGpnM05DQTJMalEyTVN3NU15NDVOREVnTmk0eE15dzVNeTQ1TURFZ1F6WXVNVE1zT1RNdU9UQXhJRE11TXpRNUxEa3pMalEySURNdU1USTVMRGt4TGpjM05pQkRNaTQxTmpnc09EY3VORGsxSURFdU9UYzNMRGd5TGprNU5TQXhMamsyTWl3M01DNDBNalVnUXpFdU9UUTRMRFUzTGpZME1TQXlMamcyTERVd0xqWTRJREl1T0RZc05UQXVOamdnUXpNdU5UY3NORFl1TlRNMElEVXVOalEzTERRMUxqUTRPU0ExTGpZME55dzBOUzQwT0RrZ1F6VXVOalEyTERRMUxqUTRPU0E0TGpBMk5TdzBOQzR3T1RJZ01USXVNalExTERReExqWTNPU0JNTVRNdU1URTJMRFF4TGpVMklFd3hPUzQzTVRVc016Y3VOek1nVERFNUxqYzJNU3d6Tnk0eU5qa2dURFl1TVRNc09UTXVPVEF4SWlCcFpEMGlSbWxzYkMweE1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMak14Tnl3NU5DNHhOakVnVERZdU1UQXlMRGswTGpFME9DQk1OaTR4TURFc09UUXVNVFE0SUV3MUxqZzFOeXc1TkM0eE1ERWdRelV1TVRNNExEa3pMamswTlNBekxqQTROU3c1TXk0ek5qVWdNaTQ0T0RFc09URXVPREE1SUVNeUxqTXhNeXc0Tnk0ME5qa2dNUzQzTWpjc09ESXVPVGsySURFdU56RXpMRGN3TGpReU5TQkRNUzQyT1Rrc05UY3VOemN4SURJdU5qQTBMRFV3TGpjeE9DQXlMall4TXl3MU1DNDJORGdnUXpNdU16TTRMRFEyTGpReE55QTFMalEwTlN3ME5TNHpNU0ExTGpVek5TdzBOUzR5TmpZZ1RERXlMakUyTXl3ME1TNDBNemtnVERFekxqQXpNeXcwTVM0ek1pQk1NVGt1TkRjNUxETTNMalUzT0NCTU1Ua3VOVEV6TERNM0xqSTBOQ0JETVRrdU5USTJMRE0zTGpFd055QXhPUzQyTkRjc016Y3VNREE0SURFNUxqYzROaXd6Tnk0d01qRWdRekU1TGpreU1pd3pOeTR3TXpRZ01qQXVNREl6TERNM0xqRTFOaUF5TUM0d01Ea3NNemN1TWpreklFd3hPUzQ1TlN3ek55NDRPRElnVERFekxqRTVPQ3cwTVM0NE1ERWdUREV5TGpNeU9DdzBNUzQ1TVRrZ1REVXVOemN5TERRMUxqY3dOQ0JETlM0M05ERXNORFV1TnpJZ015NDNPRElzTkRZdU56Y3lJRE11TVRBMkxEVXdMamN5TWlCRE15NHdPVGtzTlRBdU56Z3lJREl1TVRrNExEVTNMamd3T0NBeUxqSXhNaXczTUM0ME1qUWdRekl1TWpJMkxEZ3lMamsyTXlBeUxqZ3dPU3c0Tnk0ME1pQXpMak0zTXl3NU1TNDNNamtnUXpNdU5EWTBMRGt5TGpReUlEUXVNRFl5TERreUxqZzRNeUEwTGpZNE1pdzVNeTR4T0RFZ1F6UXVOVFkyTERreUxqazROQ0EwTGpRNE5pdzVNaTQzTnpZZ05DNDBORFlzT1RJdU5UY3lJRU16TGpZMk5TdzRPQzQxT0RnZ015NHlPVEVzT0RRdU16Y2dNeTR5TnpZc056RXVNVGN6SUVNekxqSTJNaXcxT0M0MU1pQTBMakUyTnl3MU1TNDBOallnTkM0eE56WXNOVEV1TXprMklFTTBMamt3TVN3ME55NHhOalVnTnk0d01EZ3NORFl1TURVNUlEY3VNRGs0TERRMkxqQXhOQ0JETnk0d09UUXNORFl1TURFMUlEZ3hMalUwTWl3ekxqQXpOQ0E0TVM0NU5EUXNNaTQ0TURJZ1REZ3hMamszTWl3eUxqYzROU0JET0RJdU9EYzJMREl1TWpRM0lEZ3pMalk1TWl3eUxqQTVOeUE0TkM0ek16SXNNaTR6TlRJZ1F6ZzBMamc0Tnl3eUxqVTNNeUE0TlM0eU9ERXNNeTR3T0RVZ09EVXVOVEEwTERNdU9EY3lJRU00Tnk0MU1UZ3NNVEVnT0RZdU9UWTBMRE0yTGpBNU1TQTROUzQzT0RVc05ETXVPRFUxSUVNNE5TNHlOemdzTkRjdU1UazJJRGcwTGpJeExEUTVMak0zSURneUxqWXhMRFV3TGpNeE55Qk1OeTR6TXpVc09UTXVPRFk1SUVNMkxqazVPU3c1TkM0d05qTWdOaTQyTlRnc09UUXVNVFl4SURZdU16RTNMRGswTGpFMk1TQk1OaTR6TVRjc09UUXVNVFl4SUZvZ1RUWXVNVGNzT1RNdU5qVTBJRU0yTGpRMk15dzVNeTQyT1NBMkxqYzNOQ3c1TXk0Mk1UY2dOeTR3T0RVc09UTXVORE0zSUV3NE1pNHpOVGdzTkRrdU9EZzJJRU00TkM0eE9ERXNORGd1T0RBNElEZzBMamsyTERRMUxqazNNU0E0TlM0eU9USXNORE11TnpnZ1F6ZzJMalEyTml3ek5pNHdORGtnT0RjdU1ESXpMREV4TGpBNE5TQTROUzR3TWpRc05DNHdNRGdnUXpnMExqZzBOaXd6TGpNM055QTROQzQxTlRFc01pNDVOellnT0RRdU1UUTRMREl1T0RFMklFTTRNeTQyTmpRc01pNDJNak1nT0RJdU9UZ3lMREl1TnpZMElEZ3lMakl5Tnl3ekxqSXhNeUJNT0RJdU1Ua3pMRE11TWpNMElFTTRNUzQzT1RFc015NDBOallnTnk0ek16VXNORFl1TkRVeUlEY3VNek0xTERRMkxqUTFNaUJETnk0ek1EUXNORFl1TkRZNUlEVXVNelEyTERRM0xqVXlNU0EwTGpZMk9TdzFNUzQwTnpFZ1F6UXVOall5TERVeExqVXpJRE11TnpZeExEVTRMalUxTmlBekxqYzNOU3czTVM0eE56TWdRek11Tnprc09EUXVNekk0SURRdU1UWXhMRGc0TGpVeU5DQTBMamt6Tml3NU1pNDBOellnUXpVdU1ESTJMRGt5TGprek55QTFMalF4TWl3NU15NDBOVGtnTlM0NU56TXNPVE11TmpFMUlFTTJMakE0Tnl3NU15NDJOQ0EyTGpFMU9DdzVNeTQyTlRJZ05pNHhOamtzT1RNdU5qVTBJRXcyTGpFM0xEa3pMalkxTkNCTU5pNHhOeXc1TXk0Mk5UUWdXaUlnYVdROUlrWnBiR3d0TVRJaUlHWnBiR3c5SWlNME5UVkJOalFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHpNVGNzTmpndU9UZ3lJRU0zTGpnd05pdzJPQzQzTURFZ09DNHlNRElzTmpndU9USTJJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROaTQ0TWprc056RXVNamswSURZdU5ETXpMRGN4TGpBMk9TQTJMalF6TXl3M01DNDFNRGdnUXpZdU5ETXpMRFk1TGprME9DQTJMamd5T1N3Mk9TNHlOalVnTnk0ek1UY3NOamd1T1RneUlpQnBaRDBpUm1sc2JDMHhNeUlnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazAyTGpreUxEY3hMakV6TXlCRE5pNDJNekVzTnpFdU1UTXpJRFl1TkRNekxEY3dMamt3TlNBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SUVNM0xqUTJMRFk0TGprZ055NDFPVFVzTmpndU9EWXhJRGN1TnpFMExEWTRMamcyTVNCRE9DNHdNRE1zTmpndU9EWXhJRGd1TWpBeUxEWTVMakE1SURndU1qQXlMRFk1TGpRNE55QkRPQzR5TURJc056QXVNRFEzSURjdU9EQTJMRGN3TGpjeklEY3VNekUzTERjeExqQXhNaUJETnk0eE56UXNOekV1TURrMElEY3VNRE01TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCTk55NDNNVFFzTmpndU5qYzBJRU0zTGpVMU55dzJPQzQyTnpRZ055NHpPVElzTmpndU56SXpJRGN1TWpJMExEWTRMamd5TVNCRE5pNDJOellzTmprdU1UTTRJRFl1TWpRMkxEWTVMamczT1NBMkxqSTBOaXczTUM0MU1EZ2dRell1TWpRMkxEY3dMams1TkNBMkxqVXhOeXczTVM0ek1pQTJMamt5TERjeExqTXlJRU0zTGpBM09DdzNNUzR6TWlBM0xqSTBNeXczTVM0eU56RWdOeTQwTVRFc056RXVNVGMwSUVNM0xqazFPU3czTUM0NE5UY2dPQzR6T0Rrc056QXVNVEUzSURndU16ZzVMRFk1TGpRNE55QkRPQzR6T0Rrc05qa3VNREF4SURndU1URTNMRFk0TGpZM05DQTNMamN4TkN3Mk9DNDJOelFpSUdsa1BTSkdhV3hzTFRFMElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXVPVElzTnpBdU9UUTNJRU0yTGpZME9TdzNNQzQ1TkRjZ05pNDJNakVzTnpBdU5qUWdOaTQyTWpFc056QXVOVEE0SUVNMkxqWXlNU3czTUM0d01UY2dOaTQ1T0RJc05qa3VNemt5SURjdU5ERXhMRFk1TGpFME5TQkROeTQxTWpFc05qa3VNRGd5SURjdU5qSTFMRFk1TGpBME9TQTNMamN4TkN3Mk9TNHdORGtnUXpjdU9UZzJMRFk1TGpBME9TQTRMakF4TlN3Mk9TNHpOVFVnT0M0d01UVXNOamt1TkRnM0lFTTRMakF4TlN3Mk9TNDVOemdnTnk0Mk5USXNOekF1TmpBeklEY3VNakkwTERjd0xqZzFNU0JETnk0eE1UVXNOekF1T1RFMElEY3VNREVzTnpBdU9UUTNJRFl1T1RJc056QXVPVFEzSUUwM0xqY3hOQ3cyT0M0NE5qRWdRemN1TlRrMUxEWTRMamcyTVNBM0xqUTJMRFk0TGprZ055NHpNVGNzTmpndU9UZ3lJRU0yTGpneU9TdzJPUzR5TmpVZ05pNDBNek1zTmprdU9UUTRJRFl1TkRNekxEY3dMalV3T0NCRE5pNDBNek1zTnpBdU9UQTFJRFl1TmpNeExEY3hMakV6TXlBMkxqa3lMRGN4TGpFek15QkROeTR3TXprc056RXVNVE16SURjdU1UYzBMRGN4TGpBNU5DQTNMak14Tnl3M01TNHdNVElnUXpjdU9EQTJMRGN3TGpjeklEZ3VNakF5TERjd0xqQTBOeUE0TGpJd01pdzJPUzQwT0RjZ1F6Z3VNakF5TERZNUxqQTVJRGd1TURBekxEWTRMamcyTVNBM0xqY3hOQ3cyT0M0NE5qRWlJR2xrUFNKR2FXeHNMVEUxSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRjdU5EUTBMRGcxTGpNMUlFTTNMamN3T0N3NE5TNHhPVGdnTnk0NU1qRXNPRFV1TXpFNUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1T1RJMUlEY3VOekE0TERnMkxqSTVNaUEzTGpRME5DdzROaTQwTkRRZ1F6Y3VNVGd4TERnMkxqVTVOeUEyTGprMk55dzROaTQwTnpVZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSWlCcFpEMGlSbWxzYkMweE5pSWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDNMakl6TERnMkxqVXhJRU0zTGpBM05DdzROaTQxTVNBMkxqazJOeXc0Tmk0ek9EY2dOaTQ1Tmpjc09EWXVNVGN6SUVNMkxqazJOeXc0TlM0NE56RWdOeTR4T0RFc09EVXVOVEF5SURjdU5EUTBMRGcxTGpNMUlFTTNMalV5TVN3NE5TNHpNRFVnTnk0MU9UUXNPRFV1TWpnMElEY3VOalU0TERnMUxqSTROQ0JETnk0NE1UUXNPRFV1TWpnMElEY3VPVEl4TERnMUxqUXdPQ0EzTGpreU1TdzROUzQyTWpJZ1F6Y3VPVEl4TERnMUxqa3lOU0EzTGpjd09DdzROaTR5T1RJZ055NDBORFFzT0RZdU5EUTBJRU0zTGpNMk55dzROaTQwT0RrZ055NHlPVFFzT0RZdU5URWdOeTR5TXl3NE5pNDFNU0JOTnk0Mk5UZ3NPRFV1TURrNElFTTNMalUxT0N3NE5TNHdPVGdnTnk0ME5UVXNPRFV1TVRJM0lEY3VNelV4TERnMUxqRTRPQ0JETnk0d016RXNPRFV1TXpjeklEWXVOemd4TERnMUxqZ3dOaUEyTGpjNE1TdzROaTR4TnpNZ1F6WXVOemd4TERnMkxqUTRNaUEyTGprMk5pdzROaTQyT1RjZ055NHlNeXc0Tmk0Mk9UY2dRemN1TXpNc09EWXVOamszSURjdU5ETXpMRGcyTGpZMk5pQTNMalV6T0N3NE5pNDJNRGNnUXpjdU9EVTRMRGcyTGpReU1pQTRMakV3T0N3NE5TNDVPRGtnT0M0eE1EZ3NPRFV1TmpJeUlFTTRMakV3T0N3NE5TNHpNVE1nTnk0NU1qTXNPRFV1TURrNElEY3VOalU0TERnMUxqQTVPQ0lnYVdROUlrWnBiR3d0TVRjaUlHWnBiR3c5SWlNNE1EazNRVElpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk55NHlNeXc0Tmk0ek1qSWdURGN1TVRVMExEZzJMakUzTXlCRE55NHhOVFFzT0RVdU9UTTRJRGN1TXpNekxEZzFMall5T1NBM0xqVXpPQ3c0TlM0MU1USWdURGN1TmpVNExEZzFMalEzTVNCTU55NDNNelFzT0RVdU5qSXlJRU0zTGpjek5DdzROUzQ0TlRZZ055NDFOVFVzT0RZdU1UWTBJRGN1TXpVeExEZzJMakk0TWlCTU55NHlNeXc0Tmk0ek1qSWdUVGN1TmpVNExEZzFMakk0TkNCRE55NDFPVFFzT0RVdU1qZzBJRGN1TlRJeExEZzFMak13TlNBM0xqUTBOQ3c0TlM0ek5TQkROeTR4T0RFc09EVXVOVEF5SURZdU9UWTNMRGcxTGpnM01TQTJMamsyTnl3NE5pNHhOek1nUXpZdU9UWTNMRGcyTGpNNE55QTNMakEzTkN3NE5pNDFNU0EzTGpJekxEZzJMalV4SUVNM0xqSTVOQ3c0Tmk0MU1TQTNMak0yTnl3NE5pNDBPRGtnTnk0ME5EUXNPRFl1TkRRMElFTTNMamN3T0N3NE5pNHlPVElnTnk0NU1qRXNPRFV1T1RJMUlEY3VPVEl4TERnMUxqWXlNaUJETnk0NU1qRXNPRFV1TkRBNElEY3VPREUwTERnMUxqSTROQ0EzTGpZMU9DdzROUzR5T0RRaUlHbGtQU0pHYVd4c0xURTRJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGMzTGpJM09DdzNMamMyT1NCTU56Y3VNamM0TERVeExqUXpOaUJNTVRBdU1qQTRMRGt3TGpFMklFd3hNQzR5TURnc05EWXVORGt6SUV3M055NHlOemdzTnk0M05qa2lJR2xrUFNKR2FXeHNMVEU1SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFd0xqQTRNeXc1TUM0ek56VWdUREV3TGpBNE15dzBOaTQwTWpFZ1RERXdMakUwTml3ME5pNHpPRFVnVERjM0xqUXdNeXczTGpVMU5DQk1OemN1TkRBekxEVXhMalV3T0NCTU56Y3VNelF4TERVeExqVTBOQ0JNTVRBdU1EZ3pMRGt3TGpNM05TQk1NVEF1TURnekxEa3dMak0zTlNCYUlFMHhNQzR6TXpNc05EWXVOVFkwSUV3eE1DNHpNek1zT0RrdU9UUTBJRXczTnk0eE5UUXNOVEV1TXpZMUlFdzNOeTR4TlRRc055NDVPRFVnVERFd0xqTXpNeXcwTmk0MU5qUWdUREV3TGpNek15dzBOaTQxTmpRZ1dpSWdhV1E5SWtacGJHd3RNakFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TWpVdU56TTNMRGc0TGpZME55Qk1NVEU0TGpBNU9DdzVNUzQ1T0RFZ1RERXhPQzR3T1Rnc09EUWdUREV3Tmk0Mk16a3NPRGd1TnpFeklFd3hNRFl1TmpNNUxEazJMams0TWlCTU9Ua3NNVEF3TGpNeE5TQk1NVEV5TGpNMk9Td3hNRE11T1RZeElFd3hNalV1TnpNM0xEZzRMalkwTnlJZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRJaUlHWnBiR3c5SWlNME5UVkJOalFpSUhOclpYUmphRHAwZVhCbFBTSk5VMU5vWVhCbFIzSnZkWEFpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ1BDOW5QZ29nSUNBZ0lDQWdJRHd2Wno0S0lDQWdJRHd2Wno0S1BDOXpkbWMrJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdGF0ZUluc3RydWN0aW9ucztcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBTZW5zb3JTYW1wbGUgPSByZXF1aXJlKCcuL3NlbnNvci1zYW1wbGUuanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW4gaW1wbGVtZW50YXRpb24gb2YgYSBzaW1wbGUgY29tcGxlbWVudGFyeSBmaWx0ZXIsIHdoaWNoIGZ1c2VzIGd5cm9zY29wZSBhbmRcbiAqIGFjY2VsZXJvbWV0ZXIgZGF0YSBmcm9tIHRoZSAnZGV2aWNlbW90aW9uJyBldmVudC5cbiAqXG4gKiBBY2NlbGVyb21ldGVyIGRhdGEgaXMgdmVyeSBub2lzeSwgYnV0IHN0YWJsZSBvdmVyIHRoZSBsb25nIHRlcm0uXG4gKiBHeXJvc2NvcGUgZGF0YSBpcyBzbW9vdGgsIGJ1dCB0ZW5kcyB0byBkcmlmdCBvdmVyIHRoZSBsb25nIHRlcm0uXG4gKlxuICogVGhpcyBmdXNpb24gaXMgcmVsYXRpdmVseSBzaW1wbGU6XG4gKiAxLiBHZXQgb3JpZW50YXRpb24gZXN0aW1hdGVzIGZyb20gYWNjZWxlcm9tZXRlciBieSBhcHBseWluZyBhIGxvdy1wYXNzIGZpbHRlclxuICogICAgb24gdGhhdCBkYXRhLlxuICogMi4gR2V0IG9yaWVudGF0aW9uIGVzdGltYXRlcyBmcm9tIGd5cm9zY29wZSBieSBpbnRlZ3JhdGluZyBvdmVyIHRpbWUuXG4gKiAzLiBDb21iaW5lIHRoZSB0d28gZXN0aW1hdGVzLCB3ZWlnaGluZyAoMSkgaW4gdGhlIGxvbmcgdGVybSwgYnV0ICgyKSBmb3IgdGhlXG4gKiAgICBzaG9ydCB0ZXJtLlxuICovXG5mdW5jdGlvbiBDb21wbGVtZW50YXJ5RmlsdGVyKGtGaWx0ZXIpIHtcbiAgdGhpcy5rRmlsdGVyID0ga0ZpbHRlcjtcblxuICAvLyBSYXcgc2Vuc29yIG1lYXN1cmVtZW50cy5cbiAgdGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcbiAgdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuXG4gIC8vIFNldCBkZWZhdWx0IGxvb2sgZGlyZWN0aW9uIHRvIGJlIGluIHRoZSBjb3JyZWN0IGRpcmVjdGlvbi5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMuZmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKC0xLCAwLCAwLCAxKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigxLCAwLCAwLCAxKTtcbiAgfVxuICB0aGlzLnByZXZpb3VzRmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcblxuICAvLyBPcmllbnRhdGlvbiBiYXNlZCBvbiB0aGUgYWNjZWxlcm9tZXRlci5cbiAgdGhpcy5hY2NlbFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgb3JpZW50YXRpb24gaGFzIGJlZW4gaW5pdGlhbGl6ZWQuXG4gIHRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkID0gZmFsc2U7XG4gIC8vIFJ1bm5pbmcgZXN0aW1hdGUgb2YgZ3Jhdml0eSBiYXNlZCBvbiB0aGUgY3VycmVudCBvcmllbnRhdGlvbi5cbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgLy8gTWVhc3VyZWQgZ3Jhdml0eSBiYXNlZCBvbiBhY2NlbGVyb21ldGVyLlxuICB0aGlzLm1lYXN1cmVkR3Jhdml0eSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgLy8gRGVidWcgb25seSBxdWF0ZXJuaW9uIG9mIGd5cm8tYmFzZWQgb3JpZW50YXRpb24uXG4gIHRoaXMuZ3lyb0ludGVncmFsUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFkZEFjY2VsTWVhc3VyZW1lbnQgPSBmdW5jdGlvbih2ZWN0b3IsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zZXQodmVjdG9yLCB0aW1lc3RhbXBTKTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFkZEd5cm9NZWFzdXJlbWVudCA9IGZ1bmN0aW9uKHZlY3RvciwgdGltZXN0YW1wUykge1xuICB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQuc2V0KHZlY3RvciwgdGltZXN0YW1wUyk7XG5cbiAgdmFyIGRlbHRhVCA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFM7XG4gIGlmIChVdGlsLmlzVGltZXN0YW1wRGVsdGFWYWxpZChkZWx0YVQpKSB7XG4gICAgdGhpcy5ydW5fKCk7XG4gIH1cblxuICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LmNvcHkodGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50KTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLnJ1bl8gPSBmdW5jdGlvbigpIHtcblxuICBpZiAoIXRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkKSB7XG4gICAgdGhpcy5hY2NlbFEgPSB0aGlzLmFjY2VsVG9RdWF0ZXJuaW9uXyh0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNhbXBsZSk7XG4gICAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmFjY2VsUSk7XG4gICAgdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBkZWx0YVQgPSB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUyAtXG4gICAgICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFM7XG5cbiAgLy8gQ29udmVydCBneXJvIHJvdGF0aW9uIHZlY3RvciB0byBhIHF1YXRlcm5pb24gZGVsdGEuXG4gIHZhciBneXJvRGVsdGFRID0gdGhpcy5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfKHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC5zYW1wbGUsIGRlbHRhVCk7XG4gIHRoaXMuZ3lyb0ludGVncmFsUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBmaWx0ZXJfMSA9IEsgKiAoZmlsdGVyXzAgKyBneXJvICogZFQpICsgKDEgLSBLKSAqIGFjY2VsLlxuICB0aGlzLmZpbHRlclEuY29weSh0aGlzLnByZXZpb3VzRmlsdGVyUSk7XG4gIHRoaXMuZmlsdGVyUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRlbHRhIGJldHdlZW4gdGhlIGN1cnJlbnQgZXN0aW1hdGVkIGdyYXZpdHkgYW5kIHRoZSByZWFsXG4gIC8vIGdyYXZpdHkgdmVjdG9yIGZyb20gYWNjZWxlcm9tZXRlci5cbiAgdmFyIGludkZpbHRlclEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBpbnZGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgaW52RmlsdGVyUS5pbnZlcnNlKCk7XG5cbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnNldCgwLCAwLCAtMSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5hcHBseVF1YXRlcm5pb24oaW52RmlsdGVyUSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5ub3JtYWxpemUoKTtcblxuICB0aGlzLm1lYXN1cmVkR3Jhdml0eS5jb3B5KHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2FtcGxlKTtcbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkubm9ybWFsaXplKCk7XG5cbiAgLy8gQ29tcGFyZSBlc3RpbWF0ZWQgZ3Jhdml0eSB3aXRoIG1lYXN1cmVkIGdyYXZpdHksIGdldCB0aGUgZGVsdGEgcXVhdGVybmlvblxuICAvLyBiZXR3ZWVuIHRoZSB0d28uXG4gIHZhciBkZWx0YVEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBkZWx0YVEuc2V0RnJvbVVuaXRWZWN0b3JzKHRoaXMuZXN0aW1hdGVkR3Jhdml0eSwgdGhpcy5tZWFzdXJlZEdyYXZpdHkpO1xuICBkZWx0YVEuaW52ZXJzZSgpO1xuXG4gIGlmIChVdGlsLmlzRGVidWcoKSkge1xuICAgIGNvbnNvbGUubG9nKCdEZWx0YTogJWQgZGVnLCBHX2VzdDogKCVzLCAlcywgJXMpLCBHX21lYXM6ICglcywgJXMsICVzKScsXG4gICAgICAgICAgICAgICAgTWF0aFV0aWwucmFkVG9EZWcgKiBVdGlsLmdldFF1YXRlcm5pb25BbmdsZShkZWx0YVEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueCkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnkpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS56KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS54KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS55KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLm1lYXN1cmVkR3Jhdml0eS56KS50b0ZpeGVkKDEpKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSB0aGUgU0xFUlAgdGFyZ2V0OiBjdXJyZW50IG9yaWVudGF0aW9uIHBsdXMgdGhlIG1lYXN1cmVkLWVzdGltYXRlZFxuICAvLyBxdWF0ZXJuaW9uIGRlbHRhLlxuICB2YXIgdGFyZ2V0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRhcmdldFEuY29weSh0aGlzLmZpbHRlclEpO1xuICB0YXJnZXRRLm11bHRpcGx5KGRlbHRhUSk7XG5cbiAgLy8gU0xFUlAgZmFjdG9yOiAwIGlzIHB1cmUgZ3lybywgMSBpcyBwdXJlIGFjY2VsLlxuICB0aGlzLmZpbHRlclEuc2xlcnAodGFyZ2V0USwgMSAtIHRoaXMua0ZpbHRlcik7XG5cbiAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZmlsdGVyUTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmFjY2VsVG9RdWF0ZXJuaW9uXyA9IGZ1bmN0aW9uKGFjY2VsKSB7XG4gIHZhciBub3JtQWNjZWwgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICBub3JtQWNjZWwuY29weShhY2NlbCk7XG4gIG5vcm1BY2NlbC5ub3JtYWxpemUoKTtcbiAgdmFyIHF1YXQgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICBxdWF0LnNldEZyb21Vbml0VmVjdG9ycyhuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAtMSksIG5vcm1BY2NlbCk7XG4gIHF1YXQuaW52ZXJzZSgpO1xuICByZXR1cm4gcXVhdDtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmd5cm9Ub1F1YXRlcm5pb25EZWx0YV8gPSBmdW5jdGlvbihneXJvLCBkdCkge1xuICAvLyBFeHRyYWN0IGF4aXMgYW5kIGFuZ2xlIGZyb20gdGhlIGd5cm9zY29wZSBkYXRhLlxuICB2YXIgcXVhdCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuICBxdWF0LnNldEZyb21BeGlzQW5nbGUoYXhpcywgZ3lyby5sZW5ndGgoKSAqIGR0KTtcbiAgcmV0dXJuIHF1YXQ7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ29tcGxlbWVudGFyeUZpbHRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgQ29tcGxlbWVudGFyeUZpbHRlciA9IHJlcXVpcmUoJy4vY29tcGxlbWVudGFyeS1maWx0ZXIuanMnKTtcbnZhciBQb3NlUHJlZGljdG9yID0gcmVxdWlyZSgnLi9wb3NlLXByZWRpY3Rvci5qcycpO1xudmFyIFRvdWNoUGFubmVyID0gcmVxdWlyZSgnLi4vdG91Y2gtcGFubmVyLmpzJyk7XG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG4vKipcbiAqIFRoZSBwb3NlIHNlbnNvciwgaW1wbGVtZW50ZWQgdXNpbmcgRGV2aWNlTW90aW9uIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIEZ1c2lvblBvc2VTZW5zb3IoKSB7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6ZnVzZWQnO1xuICB0aGlzLmRldmljZU5hbWUgPSAnVlIgUG9zaXRpb24gRGV2aWNlICh3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCknO1xuXG4gIHRoaXMuYWNjZWxlcm9tZXRlciA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIHRoaXMuZ3lyb3Njb3BlID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICB0aGlzLnN0YXJ0KCk7XG5cbiAgdGhpcy5maWx0ZXIgPSBuZXcgQ29tcGxlbWVudGFyeUZpbHRlcihXZWJWUkNvbmZpZy5LX0ZJTFRFUik7XG4gIHRoaXMucG9zZVByZWRpY3RvciA9IG5ldyBQb3NlUHJlZGljdG9yKFdlYlZSQ29uZmlnLlBSRURJQ1RJT05fVElNRV9TKTtcbiAgdGhpcy50b3VjaFBhbm5lciA9IG5ldyBUb3VjaFBhbm5lcigpO1xuXG4gIHRoaXMuZmlsdGVyVG9Xb3JsZFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIC8vIFNldCB0aGUgZmlsdGVyIHRvIHdvcmxkIHRyYW5zZm9ybSwgZGVwZW5kaW5nIG9uIE9TLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDEsIDAsIDApLCBNYXRoLlBJIC8gMik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDEsIDAsIDApLCAtTWF0aC5QSSAvIDIpO1xuICB9XG5cbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLndvcmxkVG9TY3JlZW5RID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5vcmlnaW5hbFBvc2VBZGp1c3RRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5vcmlnaW5hbFBvc2VBZGp1c3RRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLXdpbmRvdy5vcmllbnRhdGlvbiAqIE1hdGguUEkgLyAxODApO1xuXG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xuICAvLyBBZGp1c3QgdGhpcyBmaWx0ZXIgZm9yIGJlaW5nIGluIGxhbmRzY2FwZSBtb2RlLlxuICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEubXVsdGlwbHkodGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEpO1xuICB9XG5cbiAgLy8gS2VlcCB0cmFjayBvZiBhIHJlc2V0IHRyYW5zZm9ybSBmb3IgcmVzZXRTZW5zb3IuXG4gIHRoaXMucmVzZXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICB0aGlzLmlzRmlyZWZveEFuZHJvaWQgPSBVdGlsLmlzRmlyZWZveEFuZHJvaWQoKTtcbiAgdGhpcy5pc0lPUyA9IFV0aWwuaXNJT1MoKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0XyA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG59XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLmdldFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRoaXMgUG9zZVNlbnNvciBkb2Vzbid0IHN1cHBvcnQgcG9zaXRpb25cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvLyBDb252ZXJ0IGZyb20gZmlsdGVyIHNwYWNlIHRvIHRoZSB0aGUgc2FtZSBzeXN0ZW0gdXNlZCBieSB0aGVcbiAgLy8gZGV2aWNlb3JpZW50YXRpb24gZXZlbnQuXG4gIHZhciBvcmllbnRhdGlvbiA9IHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCk7XG5cbiAgLy8gUHJlZGljdCBvcmllbnRhdGlvbi5cbiAgdGhpcy5wcmVkaWN0ZWRRID0gdGhpcy5wb3NlUHJlZGljdG9yLmdldFByZWRpY3Rpb24ob3JpZW50YXRpb24sIHRoaXMuZ3lyb3Njb3BlLCB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyk7XG5cbiAgLy8gQ29udmVydCB0byBUSFJFRSBjb29yZGluYXRlIHN5c3RlbTogLVogZm9yd2FyZCwgWSB1cCwgWCByaWdodC5cbiAgdmFyIG91dCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIG91dC5jb3B5KHRoaXMuZmlsdGVyVG9Xb3JsZFEpO1xuICBvdXQubXVsdGlwbHkodGhpcy5yZXNldFEpO1xuICBpZiAoIVdlYlZSQ29uZmlnLlRPVUNIX1BBTk5FUl9ESVNBQkxFRCkge1xuICAgIG91dC5tdWx0aXBseSh0aGlzLnRvdWNoUGFubmVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB9XG4gIG91dC5tdWx0aXBseSh0aGlzLnByZWRpY3RlZFEpO1xuICBvdXQubXVsdGlwbHkodGhpcy53b3JsZFRvU2NyZWVuUSk7XG5cbiAgLy8gSGFuZGxlIHRoZSB5YXctb25seSBjYXNlLlxuICBpZiAoV2ViVlJDb25maWcuWUFXX09OTFkpIHtcbiAgICAvLyBNYWtlIGEgcXVhdGVybmlvbiB0aGF0IG9ubHkgdHVybnMgYXJvdW5kIHRoZSBZLWF4aXMuXG4gICAgb3V0LnggPSAwO1xuICAgIG91dC56ID0gMDtcbiAgICBvdXQubm9ybWFsaXplKCk7XG4gIH1cblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IG91dC54O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1sxXSA9IG91dC55O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1syXSA9IG91dC56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IG91dC53O1xuICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbk91dF87XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgLy8gUmVkdWNlIHRvIGludmVydGVkIHlhdy1vbmx5LlxuICB0aGlzLnJlc2V0US5jb3B5KHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB0aGlzLnJlc2V0US54ID0gMDtcbiAgdGhpcy5yZXNldFEueSA9IDA7XG4gIHRoaXMucmVzZXRRLnogKj0gLTE7XG4gIHRoaXMucmVzZXRRLm5vcm1hbGl6ZSgpO1xuXG4gIC8vIFRha2UgaW50byBhY2NvdW50IGV4dHJhIHRyYW5zZm9ybWF0aW9ucyBpbiBsYW5kc2NhcGUgbW9kZS5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSk7XG4gIH1cblxuICAvLyBUYWtlIGludG8gYWNjb3VudCBvcmlnaW5hbCBwb3NlLlxuICB0aGlzLnJlc2V0US5tdWx0aXBseSh0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEpO1xuXG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgdGhpcy50b3VjaFBhbm5lci5yZXNldFNlbnNvcigpO1xuICB9XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbkRldmljZU1vdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihkZXZpY2VNb3Rpb24pIHtcbiAgdmFyIGFjY0dyYXZpdHkgPSBkZXZpY2VNb3Rpb24uYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgdmFyIHJvdFJhdGUgPSBkZXZpY2VNb3Rpb24ucm90YXRpb25SYXRlO1xuICB2YXIgdGltZXN0YW1wUyA9IGRldmljZU1vdGlvbi50aW1lU3RhbXAgLyAxMDAwO1xuXG4gIC8vIEZpcmVmb3ggQW5kcm9pZCB0aW1lU3RhbXAgcmV0dXJucyBvbmUgdGhvdXNhbmR0aCBvZiBhIG1pbGxpc2Vjb25kLlxuICBpZiAodGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGltZXN0YW1wUyAvPSAxMDAwO1xuICB9XG5cbiAgdmFyIGRlbHRhUyA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgaWYgKGRlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCB8fCBkZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIGNvbnNvbGUud2FybignSW52YWxpZCB0aW1lc3RhbXBzIGRldGVjdGVkLiBUaW1lIHN0ZXAgYmV0d2VlbiBzdWNjZXNzaXZlICcgK1xuICAgICAgICAgICAgICAgICAnZ3lyb3Njb3BlIHNlbnNvciBzYW1wbGVzIGlzIHZlcnkgc21hbGwgb3Igbm90IG1vbm90b25pYycpO1xuICAgIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY2NlbGVyb21ldGVyLnNldCgtYWNjR3Jhdml0eS54LCAtYWNjR3Jhdml0eS55LCAtYWNjR3Jhdml0eS56KTtcbiAgdGhpcy5neXJvc2NvcGUuc2V0KHJvdFJhdGUuYWxwaGEsIHJvdFJhdGUuYmV0YSwgcm90UmF0ZS5nYW1tYSk7XG5cbiAgLy8gV2l0aCBpT1MgYW5kIEZpcmVmb3ggQW5kcm9pZCwgcm90YXRpb25SYXRlIGlzIHJlcG9ydGVkIGluIGRlZ3JlZXMsXG4gIC8vIHNvIHdlIGZpcnN0IGNvbnZlcnQgdG8gcmFkaWFucy5cbiAgaWYgKHRoaXMuaXNJT1MgfHwgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGhpcy5neXJvc2NvcGUubXVsdGlwbHlTY2FsYXIoTWF0aC5QSSAvIDE4MCk7XG4gIH1cblxuICB0aGlzLmZpbHRlci5hZGRBY2NlbE1lYXN1cmVtZW50KHRoaXMuYWNjZWxlcm9tZXRlciwgdGltZXN0YW1wUyk7XG4gIHRoaXMuZmlsdGVyLmFkZEd5cm9NZWFzdXJlbWVudCh0aGlzLmd5cm9zY29wZSwgdGltZXN0YW1wUyk7XG5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUub25TY3JlZW5PcmllbnRhdGlvbkNoYW5nZV8gPVxuICAgIGZ1bmN0aW9uKHNjcmVlbk9yaWVudGF0aW9uKSB7XG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc2V0U2NyZWVuVHJhbnNmb3JtXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldCgwLCAwLCAwLCAxKTtcbiAgc3dpdGNoICh3aW5kb3cub3JpZW50YXRpb24pIHtcbiAgICBjYXNlIDA6XG4gICAgICBicmVhaztcbiAgICBjYXNlIDkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIDEpLCAtTWF0aC5QSSAvIDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAtOTA6XG4gICAgICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksIE1hdGguUEkgLyAyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMTgwOlxuICAgICAgLy8gVE9ETy5cbiAgICAgIGJyZWFrO1xuICB9XG4gIHRoaXMuaW52ZXJzZVdvcmxkVG9TY3JlZW5RLmNvcHkodGhpcy53b3JsZFRvU2NyZWVuUSk7XG4gIHRoaXMuaW52ZXJzZVdvcmxkVG9TY3JlZW5RLmludmVyc2UoKTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub25EZXZpY2VNb3Rpb25DYWxsYmFja18gPSB0aGlzLm9uRGV2aWNlTW90aW9uQ2hhbmdlXy5iaW5kKHRoaXMpO1xuICB0aGlzLm9uU2NyZWVuT3JpZW50YXRpb25DYWxsYmFja18gPSB0aGlzLm9uU2NyZWVuT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcyk7XG4gIFxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlbW90aW9uJywgdGhpcy5vbkRldmljZU1vdGlvbkNhbGxiYWNrXyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub25TY3JlZW5PcmllbnRhdGlvbkNhbGxiYWNrXyk7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uQ2FsbGJhY2tfKTtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vblNjcmVlbk9yaWVudGF0aW9uQ2FsbGJhY2tfKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRnVzaW9uUG9zZVNlbnNvcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuLi9tYXRoLXV0aWwnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG4vKipcbiAqIEdpdmVuIGFuIG9yaWVudGF0aW9uIGFuZCB0aGUgZ3lyb3Njb3BlIGRhdGEsIHByZWRpY3RzIHRoZSBmdXR1cmUgb3JpZW50YXRpb25cbiAqIG9mIHRoZSBoZWFkLiBUaGlzIG1ha2VzIHJlbmRlcmluZyBhcHBlYXIgZmFzdGVyLlxuICpcbiAqIEFsc28gc2VlOiBodHRwOi8vbXNsLmNzLnVpdWMuZWR1L35sYXZhbGxlL3BhcGVycy9MYXZZZXJLYXRBbnQxNC5wZGZcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcHJlZGljdGlvblRpbWVTIHRpbWUgZnJvbSBoZWFkIG1vdmVtZW50IHRvIHRoZSBhcHBlYXJhbmNlIG9mXG4gKiB0aGUgY29ycmVzcG9uZGluZyBpbWFnZS5cbiAqL1xuZnVuY3Rpb24gUG9zZVByZWRpY3RvcihwcmVkaWN0aW9uVGltZVMpIHtcbiAgdGhpcy5wcmVkaWN0aW9uVGltZVMgPSBwcmVkaWN0aW9uVGltZVM7XG5cbiAgLy8gVGhlIHF1YXRlcm5pb24gY29ycmVzcG9uZGluZyB0byB0aGUgcHJldmlvdXMgc3RhdGUuXG4gIHRoaXMucHJldmlvdXNRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgLy8gUHJldmlvdXMgdGltZSBhIHByZWRpY3Rpb24gb2NjdXJyZWQuXG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gbnVsbDtcblxuICAvLyBUaGUgZGVsdGEgcXVhdGVybmlvbiB0aGF0IGFkanVzdHMgdGhlIGN1cnJlbnQgcG9zZS5cbiAgdGhpcy5kZWx0YVEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBUaGUgb3V0cHV0IHF1YXRlcm5pb24uXG4gIHRoaXMub3V0USA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cblBvc2VQcmVkaWN0b3IucHJvdG90eXBlLmdldFByZWRpY3Rpb24gPSBmdW5jdGlvbihjdXJyZW50USwgZ3lybywgdGltZXN0YW1wUykge1xuICBpZiAoIXRoaXMucHJldmlvdXNUaW1lc3RhbXBTKSB7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xuICAgIHJldHVybiBjdXJyZW50UTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSBheGlzIGFuZCBhbmdsZSBiYXNlZCBvbiBneXJvc2NvcGUgcm90YXRpb24gcmF0ZSBkYXRhLlxuICB2YXIgYXhpcyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIGF4aXMuY29weShneXJvKTtcbiAgYXhpcy5ub3JtYWxpemUoKTtcblxuICB2YXIgYW5ndWxhclNwZWVkID0gZ3lyby5sZW5ndGgoKTtcblxuICAvLyBJZiB3ZSdyZSByb3RhdGluZyBzbG93bHksIGRvbid0IGRvIHByZWRpY3Rpb24uXG4gIGlmIChhbmd1bGFyU3BlZWQgPCBNYXRoVXRpbC5kZWdUb1JhZCAqIDIwKSB7XG4gICAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgICBjb25zb2xlLmxvZygnTW92aW5nIHNsb3dseSwgYXQgJXMgZGVnL3M6IG5vIHByZWRpY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgKE1hdGhVdGlsLnJhZFRvRGVnICogYW5ndWxhclNwZWVkKS50b0ZpeGVkKDEpKTtcbiAgICB9XG4gICAgdGhpcy5vdXRRLmNvcHkoY3VycmVudFEpO1xuICAgIHRoaXMucHJldmlvdXNRLmNvcHkoY3VycmVudFEpO1xuICAgIHJldHVybiB0aGlzLm91dFE7XG4gIH1cblxuICAvLyBHZXQgdGhlIHByZWRpY3RlZCBhbmdsZSBiYXNlZCBvbiB0aGUgdGltZSBkZWx0YSBhbmQgbGF0ZW5jeS5cbiAgdmFyIGRlbHRhVCA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgdmFyIHByZWRpY3RBbmdsZSA9IGFuZ3VsYXJTcGVlZCAqIHRoaXMucHJlZGljdGlvblRpbWVTO1xuXG4gIHRoaXMuZGVsdGFRLnNldEZyb21BeGlzQW5nbGUoYXhpcywgcHJlZGljdEFuZ2xlKTtcbiAgdGhpcy5vdXRRLmNvcHkodGhpcy5wcmV2aW91c1EpO1xuICB0aGlzLm91dFEubXVsdGlwbHkodGhpcy5kZWx0YVEpO1xuXG4gIHRoaXMucHJldmlvdXNRLmNvcHkoY3VycmVudFEpO1xuICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG5cbiAgcmV0dXJuIHRoaXMub3V0UTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBQb3NlUHJlZGljdG9yO1xuIiwiZnVuY3Rpb24gU2Vuc29yU2FtcGxlKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNldChzYW1wbGUsIHRpbWVzdGFtcFMpO1xufTtcblxuU2Vuc29yU2FtcGxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihzYW1wbGUsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5zYW1wbGUgPSBzYW1wbGU7XG4gIHRoaXMudGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihzZW5zb3JTYW1wbGUpIHtcbiAgdGhpcy5zZXQoc2Vuc29yU2FtcGxlLnNhbXBsZSwgc2Vuc29yU2FtcGxlLnRpbWVzdGFtcFMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZW5zb3JTYW1wbGU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi9tYXRoLXV0aWwuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbnZhciBST1RBVEVfU1BFRUQgPSAwLjU7XG4vKipcbiAqIFByb3ZpZGVzIGEgcXVhdGVybmlvbiByZXNwb25zaWJsZSBmb3IgcHJlLXBhbm5pbmcgdGhlIHNjZW5lIGJlZm9yZSBmdXJ0aGVyXG4gKiB0cmFuc2Zvcm1hdGlvbnMgZHVlIHRvIGRldmljZSBzZW5zb3JzLlxuICovXG5mdW5jdGlvbiBUb3VjaFBhbm5lcigpIHtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydF8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kXy5iaW5kKHRoaXMpKTtcblxuICB0aGlzLmlzVG91Y2hpbmcgPSBmYWxzZTtcbiAgdGhpcy5yb3RhdGVTdGFydCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVEZWx0YSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG5cbiAgdGhpcy50aGV0YSA9IDA7XG4gIHRoaXMub3JpZW50YXRpb24gPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xufVxuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vcmllbnRhdGlvbi5zZXRGcm9tRXVsZXJYWVooMCwgMCwgdGhpcy50aGV0YSk7XG4gIHJldHVybiB0aGlzLm9yaWVudGF0aW9uO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLnJlc2V0U2Vuc29yID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMudGhldGEgPSAwO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hTdGFydF8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIE9ubHkgcmVzcG9uZCBpZiB0aGVyZSBpcyBleGFjdGx5IG9uZSB0b3VjaC5cbiAgaWYgKGUudG91Y2hlcy5sZW5ndGggIT0gMSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnJvdGF0ZVN0YXJ0LnNldChlLnRvdWNoZXNbMF0ucGFnZVgsIGUudG91Y2hlc1swXS5wYWdlWSk7XG4gIHRoaXMuaXNUb3VjaGluZyA9IHRydWU7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaE1vdmVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuaXNUb3VjaGluZykge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnJvdGF0ZUVuZC5zZXQoZS50b3VjaGVzWzBdLnBhZ2VYLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuICB0aGlzLnJvdGF0ZURlbHRhLnN1YlZlY3RvcnModGhpcy5yb3RhdGVFbmQsIHRoaXMucm90YXRlU3RhcnQpO1xuICB0aGlzLnJvdGF0ZVN0YXJ0LmNvcHkodGhpcy5yb3RhdGVFbmQpO1xuXG4gIC8vIE9uIGlPUywgZGlyZWN0aW9uIGlzIGludmVydGVkLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5yb3RhdGVEZWx0YS54ICo9IC0xO1xuICB9XG5cbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuICB0aGlzLnRoZXRhICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YS54IC8gZWxlbWVudC5jbGllbnRXaWR0aCAqIFJPVEFURV9TUEVFRDtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoRW5kXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5pc1RvdWNoaW5nID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoUGFubmVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIFV0aWwgPSB3aW5kb3cuVXRpbCB8fCB7fTtcblxuVXRpbC5NSU5fVElNRVNURVAgPSAwLjAwMTtcblV0aWwuTUFYX1RJTUVTVEVQID0gMTtcblxuVXRpbC5iYXNlNjQgPSBmdW5jdGlvbihtaW1lVHlwZSwgYmFzZTY0KSB7XG4gIHJldHVybiAnZGF0YTonICsgbWltZVR5cGUgKyAnO2Jhc2U2NCwnICsgYmFzZTY0O1xufTtcblxuVXRpbC5jbGFtcCA9IGZ1bmN0aW9uKHZhbHVlLCBtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobWluLCB2YWx1ZSksIG1heCk7XG59O1xuXG5VdGlsLmxlcnAgPSBmdW5jdGlvbihhLCBiLCB0KSB7XG4gIHJldHVybiBhICsgKChiIC0gYSkgKiB0KTtcbn07XG5cblV0aWwuaXNJT1MgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0lPUyA9IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KG5hdmlnYXRvci5wbGF0Zm9ybSk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNJT1M7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzU2FmYXJpID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNTYWZhcmkgPSAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzU2FmYXJpO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0ZpcmVmb3hBbmRyb2lkID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNGaXJlZm94QW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignRmlyZWZveCcpICE9PSAtMSAmJlxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT09IC0xO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzRmlyZWZveEFuZHJvaWQ7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzTGFuZHNjYXBlTW9kZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHdpbmRvdy5vcmllbnRhdGlvbiA9PSA5MCB8fCB3aW5kb3cub3JpZW50YXRpb24gPT0gLTkwKTtcbn07XG5cbi8vIEhlbHBlciBtZXRob2QgdG8gdmFsaWRhdGUgdGhlIHRpbWUgc3RlcHMgb2Ygc2Vuc29yIHRpbWVzdGFtcHMuXG5VdGlsLmlzVGltZXN0YW1wRGVsdGFWYWxpZCA9IGZ1bmN0aW9uKHRpbWVzdGFtcERlbHRhUykge1xuICBpZiAoaXNOYU4odGltZXN0YW1wRGVsdGFTKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGltZXN0YW1wRGVsdGFTIDw9IFV0aWwuTUlOX1RJTUVTVEVQKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0aW1lc3RhbXBEZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0U2NyZWVuV2lkdGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWF4KHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwuZ2V0U2NyZWVuSGVpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1pbih3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLnJlcXVlc3RGdWxsc2NyZWVuID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICBpZiAoZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4pIHtcbiAgICBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC5tc1JlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmV4aXRGdWxsc2NyZWVuID0gZnVuY3Rpb24oKSB7XG4gIGlmIChkb2N1bWVudC5leGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZ2V0RnVsbHNjcmVlbkVsZW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVsZW1lbnQ7XG59O1xuXG5VdGlsLmxpbmtQcm9ncmFtID0gZnVuY3Rpb24oZ2wsIHZlcnRleFNvdXJjZSwgZnJhZ21lbnRTb3VyY2UsIGF0dHJpYkxvY2F0aW9uTWFwKSB7XG4gIC8vIE5vIGVycm9yIGNoZWNraW5nIGZvciBicmV2aXR5LlxuICB2YXIgdmVydGV4U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKHZlcnRleFNoYWRlcik7XG5cbiAgdmFyIGZyYWdtZW50U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTb3VyY2UpO1xuICBnbC5jb21waWxlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZlcnRleFNoYWRlcik7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XG5cbiAgZm9yICh2YXIgYXR0cmliTmFtZSBpbiBhdHRyaWJMb2NhdGlvbk1hcClcbiAgICBnbC5iaW5kQXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYXR0cmliTG9jYXRpb25NYXBbYXR0cmliTmFtZV0sIGF0dHJpYk5hbWUpO1xuXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuXG4gIGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuICBnbC5kZWxldGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gIHJldHVybiBwcm9ncmFtO1xufTtcblxuVXRpbC5nZXRQcm9ncmFtVW5pZm9ybXMgPSBmdW5jdGlvbihnbCwgcHJvZ3JhbSkge1xuICB2YXIgdW5pZm9ybXMgPSB7fTtcbiAgdmFyIHVuaWZvcm1Db3VudCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgdmFyIHVuaWZvcm1OYW1lID0gJyc7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdW5pZm9ybUNvdW50OyBpKyspIHtcbiAgICB2YXIgdW5pZm9ybUluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGkpO1xuICAgIHVuaWZvcm1OYW1lID0gdW5pZm9ybUluZm8ubmFtZS5yZXBsYWNlKCdbMF0nLCAnJyk7XG4gICAgdW5pZm9ybXNbdW5pZm9ybU5hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIHVuaWZvcm1OYW1lKTtcbiAgfVxuICByZXR1cm4gdW5pZm9ybXM7XG59O1xuXG5VdGlsLm9ydGhvTWF0cml4ID0gZnVuY3Rpb24gKG91dCwgbGVmdCwgcmlnaHQsIGJvdHRvbSwgdG9wLCBuZWFyLCBmYXIpIHtcbiAgdmFyIGxyID0gMSAvIChsZWZ0IC0gcmlnaHQpLFxuICAgICAgYnQgPSAxIC8gKGJvdHRvbSAtIHRvcCksXG4gICAgICBuZiA9IDEgLyAobmVhciAtIGZhcik7XG4gIG91dFswXSA9IC0yICogbHI7XG4gIG91dFsxXSA9IDA7XG4gIG91dFsyXSA9IDA7XG4gIG91dFszXSA9IDA7XG4gIG91dFs0XSA9IDA7XG4gIG91dFs1XSA9IC0yICogYnQ7XG4gIG91dFs2XSA9IDA7XG4gIG91dFs3XSA9IDA7XG4gIG91dFs4XSA9IDA7XG4gIG91dFs5XSA9IDA7XG4gIG91dFsxMF0gPSAyICogbmY7XG4gIG91dFsxMV0gPSAwO1xuICBvdXRbMTJdID0gKGxlZnQgKyByaWdodCkgKiBscjtcbiAgb3V0WzEzXSA9ICh0b3AgKyBib3R0b20pICogYnQ7XG4gIG91dFsxNF0gPSAoZmFyICsgbmVhcikgKiBuZjtcbiAgb3V0WzE1XSA9IDE7XG4gIHJldHVybiBvdXQ7XG59O1xuXG5VdGlsLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjaGVjayA9IGZhbHNlO1xuICAoZnVuY3Rpb24oYSl7aWYoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlyaXN8a2luZGxlfGxnZSB8bWFlbW98bWlkcHxtbXB8bW9iaWxlLitmaXJlZm94fG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIGNlfHhkYXx4aWluby9pLnRlc3QoYSl8fC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QoYS5zdWJzdHIoMCw0KSkpY2hlY2sgPSB0cnVlfSkobmF2aWdhdG9yLnVzZXJBZ2VudHx8bmF2aWdhdG9yLnZlbmRvcnx8d2luZG93Lm9wZXJhKTtcbiAgcmV0dXJuIGNoZWNrO1xufTtcblxuVXRpbC5leHRlbmQgPSBvYmplY3RBc3NpZ247XG5cblV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQgPSBmdW5jdGlvbihjYW52YXMpIHtcbiAgLy8gVE9ETyhzbXVzKTogUmVtb3ZlIHRoaXMgd29ya2Fyb3VuZCB3aGVuIFNhZmFyaSBmb3IgaU9TIGlzIGZpeGVkLlxuICAvLyBpT1Mgb25seSB3b3JrYXJvdW5kIChmb3IgaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE1MjU1NikuXG4gIC8vXG4gIC8vIFwiVG8gdGhlIGxhc3QgSSBncmFwcGxlIHdpdGggdGhlZTtcbiAgLy8gIGZyb20gaGVsbCdzIGhlYXJ0IEkgc3RhYiBhdCB0aGVlO1xuICAvLyAgZm9yIGhhdGUncyBzYWtlIEkgc3BpdCBteSBsYXN0IGJyZWF0aCBhdCB0aGVlLlwiXG4gIC8vIC0tIE1vYnkgRGljaywgYnkgSGVybWFuIE1lbHZpbGxlXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB2YXIgd2lkdGggPSBjYW52YXMuc3R5bGUud2lkdGg7XG4gICAgdmFyIGhlaWdodCA9IGNhbnZhcy5zdHlsZS5oZWlnaHQ7XG4gICAgY2FudmFzLnN0eWxlLndpZHRoID0gKHBhcnNlSW50KHdpZHRoKSArIDEpICsgJ3B4JztcbiAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gKHBhcnNlSW50KGhlaWdodCkpICsgJ3B4JztcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgY2FudmFzLnN0eWxlLndpZHRoID0gd2lkdGg7XG4gICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgIH0sIDEwMCk7XG4gIH1cblxuICAvLyBEZWJ1ZyBvbmx5LlxuICB3aW5kb3cuVXRpbCA9IFV0aWw7XG4gIHdpbmRvdy5jYW52YXMgPSBjYW52YXM7XG59O1xuXG5VdGlsLmlzRGVidWcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIoJ2RlYnVnJyk7XG59O1xuXG5VdGlsLmdldFF1ZXJ5UGFyYW1ldGVyID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW10vLCBcIlxcXFxbXCIpLnJlcGxhY2UoL1tcXF1dLywgXCJcXFxcXVwiKTtcbiAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChcIltcXFxcPyZdXCIgKyBuYW1lICsgXCI9KFteJiNdKilcIiksXG4gICAgICByZXN1bHRzID0gcmVnZXguZXhlYyhsb2NhdGlvbi5zZWFyY2gpO1xuICByZXR1cm4gcmVzdWx0cyA9PT0gbnVsbCA/IFwiXCIgOiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1sxXS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpKTtcbn07XG5cblV0aWwuZnJhbWVEYXRhRnJvbVBvc2UgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBwaU92ZXIxODAgPSBNYXRoLlBJIC8gMTgwLjA7XG4gIHZhciByYWQ0NSA9IE1hdGguUEkgKiAwLjI1O1xuXG4gIC8vIEJvcnJvd2VkIGZyb20gZ2xNYXRyaXguXG4gIGZ1bmN0aW9uIG1hdDRfcGVyc3BlY3RpdmVGcm9tRmllbGRPZlZpZXcob3V0LCBmb3YsIG5lYXIsIGZhcikge1xuICAgIHZhciB1cFRhbiA9IE1hdGgudGFuKGZvdiA/IChmb3YudXBEZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICBkb3duVGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi5kb3duRGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgbGVmdFRhbiA9IE1hdGgudGFuKGZvdiA/IChmb3YubGVmdERlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIHJpZ2h0VGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi5yaWdodERlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIHhTY2FsZSA9IDIuMCAvIChsZWZ0VGFuICsgcmlnaHRUYW4pLFxuICAgIHlTY2FsZSA9IDIuMCAvICh1cFRhbiArIGRvd25UYW4pO1xuXG4gICAgb3V0WzBdID0geFNjYWxlO1xuICAgIG91dFsxXSA9IDAuMDtcbiAgICBvdXRbMl0gPSAwLjA7XG4gICAgb3V0WzNdID0gMC4wO1xuICAgIG91dFs0XSA9IDAuMDtcbiAgICBvdXRbNV0gPSB5U2NhbGU7XG4gICAgb3V0WzZdID0gMC4wO1xuICAgIG91dFs3XSA9IDAuMDtcbiAgICBvdXRbOF0gPSAtKChsZWZ0VGFuIC0gcmlnaHRUYW4pICogeFNjYWxlICogMC41KTtcbiAgICBvdXRbOV0gPSAoKHVwVGFuIC0gZG93blRhbikgKiB5U2NhbGUgKiAwLjUpO1xuICAgIG91dFsxMF0gPSBmYXIgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzExXSA9IC0xLjA7XG4gICAgb3V0WzEyXSA9IDAuMDtcbiAgICBvdXRbMTNdID0gMC4wO1xuICAgIG91dFsxNF0gPSAoZmFyICogbmVhcikgLyAobmVhciAtIGZhcik7XG4gICAgb3V0WzE1XSA9IDAuMDtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgZnVuY3Rpb24gbWF0NF9mcm9tUm90YXRpb25UcmFuc2xhdGlvbihvdXQsIHEsIHYpIHtcbiAgICAvLyBRdWF0ZXJuaW9uIG1hdGhcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHh5ID0geCAqIHkyLFxuICAgICAgICB4eiA9IHggKiB6MixcbiAgICAgICAgeXkgPSB5ICogeTIsXG4gICAgICAgIHl6ID0geSAqIHoyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSAoeXkgKyB6eik7XG4gICAgb3V0WzFdID0geHkgKyB3ejtcbiAgICBvdXRbMl0gPSB4eiAtIHd5O1xuICAgIG91dFszXSA9IDA7XG4gICAgb3V0WzRdID0geHkgLSB3ejtcbiAgICBvdXRbNV0gPSAxIC0gKHh4ICsgenopO1xuICAgIG91dFs2XSA9IHl6ICsgd3g7XG4gICAgb3V0WzddID0gMDtcbiAgICBvdXRbOF0gPSB4eiArIHd5O1xuICAgIG91dFs5XSA9IHl6IC0gd3g7XG4gICAgb3V0WzEwXSA9IDEgLSAoeHggKyB5eSk7XG4gICAgb3V0WzExXSA9IDA7XG4gICAgb3V0WzEyXSA9IHZbMF07XG4gICAgb3V0WzEzXSA9IHZbMV07XG4gICAgb3V0WzE0XSA9IHZbMl07XG4gICAgb3V0WzE1XSA9IDE7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIGZ1bmN0aW9uIG1hdDRfdHJhbnNsYXRlKG91dCwgYSwgdikge1xuICAgIHZhciB4ID0gdlswXSwgeSA9IHZbMV0sIHogPSB2WzJdLFxuICAgICAgICBhMDAsIGEwMSwgYTAyLCBhMDMsXG4gICAgICAgIGExMCwgYTExLCBhMTIsIGExMyxcbiAgICAgICAgYTIwLCBhMjEsIGEyMiwgYTIzO1xuXG4gICAgaWYgKGEgPT09IG91dCkge1xuICAgICAgb3V0WzEyXSA9IGFbMF0gKiB4ICsgYVs0XSAqIHkgKyBhWzhdICogeiArIGFbMTJdO1xuICAgICAgb3V0WzEzXSA9IGFbMV0gKiB4ICsgYVs1XSAqIHkgKyBhWzldICogeiArIGFbMTNdO1xuICAgICAgb3V0WzE0XSA9IGFbMl0gKiB4ICsgYVs2XSAqIHkgKyBhWzEwXSAqIHogKyBhWzE0XTtcbiAgICAgIG91dFsxNV0gPSBhWzNdICogeCArIGFbN10gKiB5ICsgYVsxMV0gKiB6ICsgYVsxNV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGEwMCA9IGFbMF07IGEwMSA9IGFbMV07IGEwMiA9IGFbMl07IGEwMyA9IGFbM107XG4gICAgICBhMTAgPSBhWzRdOyBhMTEgPSBhWzVdOyBhMTIgPSBhWzZdOyBhMTMgPSBhWzddO1xuICAgICAgYTIwID0gYVs4XTsgYTIxID0gYVs5XTsgYTIyID0gYVsxMF07IGEyMyA9IGFbMTFdO1xuXG4gICAgICBvdXRbMF0gPSBhMDA7IG91dFsxXSA9IGEwMTsgb3V0WzJdID0gYTAyOyBvdXRbM10gPSBhMDM7XG4gICAgICBvdXRbNF0gPSBhMTA7IG91dFs1XSA9IGExMTsgb3V0WzZdID0gYTEyOyBvdXRbN10gPSBhMTM7XG4gICAgICBvdXRbOF0gPSBhMjA7IG91dFs5XSA9IGEyMTsgb3V0WzEwXSA9IGEyMjsgb3V0WzExXSA9IGEyMztcblxuICAgICAgb3V0WzEyXSA9IGEwMCAqIHggKyBhMTAgKiB5ICsgYTIwICogeiArIGFbMTJdO1xuICAgICAgb3V0WzEzXSA9IGEwMSAqIHggKyBhMTEgKiB5ICsgYTIxICogeiArIGFbMTNdO1xuICAgICAgb3V0WzE0XSA9IGEwMiAqIHggKyBhMTIgKiB5ICsgYTIyICogeiArIGFbMTRdO1xuICAgICAgb3V0WzE1XSA9IGEwMyAqIHggKyBhMTMgKiB5ICsgYTIzICogeiArIGFbMTVdO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWF0NF9pbnZlcnQob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcblxuICAgIGlmICghZGV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZGV0ID0gMS4wIC8gZGV0O1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGIxMSAtIGExMiAqIGIxMCArIGExMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzFdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgb3V0WzJdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzNdID0gKGEyMiAqIGIwNCAtIGEyMSAqIGIwNSAtIGEyMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzRdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzVdID0gKGEwMCAqIGIxMSAtIGEwMiAqIGIwOCArIGEwMyAqIGIwNykgKiBkZXQ7XG4gICAgb3V0WzZdID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGExMCAqIGIxMCAtIGExMSAqIGIwOCArIGExMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzldID0gKGEwMSAqIGIwOCAtIGEwMCAqIGIxMCAtIGEwMyAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEwXSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMV0gPSAoYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTJdID0gKGExMSAqIGIwNyAtIGExMCAqIGIwOSAtIGExMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzEzXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogZGV0O1xuICAgIG91dFsxNF0gPSAoYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwKSAqIGRldDtcbiAgICBvdXRbMTVdID0gKGEyMCAqIGIwMyAtIGEyMSAqIGIwMSArIGEyMiAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xuICB9O1xuXG4gIHZhciBkZWZhdWx0T3JpZW50YXRpb24gPSBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwLCAxXSk7XG4gIHZhciBkZWZhdWx0UG9zaXRpb24gPSBuZXcgRmxvYXQzMkFycmF5KFswLCAwLCAwXSk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlRXllTWF0cmljZXMocHJvamVjdGlvbiwgdmlldywgcG9zZSwgcGFyYW1ldGVycywgdnJEaXNwbGF5KSB7XG4gICAgbWF0NF9wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyhwcm9qZWN0aW9uLCBwYXJhbWV0ZXJzID8gcGFyYW1ldGVycy5maWVsZE9mVmlldyA6IG51bGwsIHZyRGlzcGxheS5kZXB0aE5lYXIsIHZyRGlzcGxheS5kZXB0aEZhcik7XG5cbiAgICB2YXIgb3JpZW50YXRpb24gPSBwb3NlLm9yaWVudGF0aW9uIHx8IGRlZmF1bHRPcmllbnRhdGlvbjtcbiAgICB2YXIgcG9zaXRpb24gPSBwb3NlLnBvc2l0aW9uIHx8IGRlZmF1bHRQb3NpdGlvbjtcblxuICAgIG1hdDRfZnJvbVJvdGF0aW9uVHJhbnNsYXRpb24odmlldywgb3JpZW50YXRpb24sIHBvc2l0aW9uKTtcbiAgICBpZiAocGFyYW1ldGVycylcbiAgICAgIG1hdDRfdHJhbnNsYXRlKHZpZXcsIHZpZXcsIHBhcmFtZXRlcnMub2Zmc2V0KTtcbiAgICBtYXQ0X2ludmVydCh2aWV3LCB2aWV3KTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihmcmFtZURhdGEsIHBvc2UsIHZyRGlzcGxheSkge1xuICAgIGlmICghZnJhbWVEYXRhIHx8ICFwb3NlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZnJhbWVEYXRhLnBvc2UgPSBwb3NlO1xuICAgIGZyYW1lRGF0YS50aW1lc3RhbXAgPSBwb3NlLnRpbWVzdGFtcDtcblxuICAgIHVwZGF0ZUV5ZU1hdHJpY2VzKFxuICAgICAgICBmcmFtZURhdGEubGVmdFByb2plY3Rpb25NYXRyaXgsIGZyYW1lRGF0YS5sZWZ0Vmlld01hdHJpeCxcbiAgICAgICAgcG9zZSwgdnJEaXNwbGF5LmdldEV5ZVBhcmFtZXRlcnMoXCJsZWZ0XCIpLCB2ckRpc3BsYXkpO1xuICAgIHVwZGF0ZUV5ZU1hdHJpY2VzKFxuICAgICAgICBmcmFtZURhdGEucmlnaHRQcm9qZWN0aW9uTWF0cml4LCBmcmFtZURhdGEucmlnaHRWaWV3TWF0cml4LFxuICAgICAgICBwb3NlLCB2ckRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyhcInJpZ2h0XCIpLCB2ckRpc3BsYXkpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRGV2aWNlSW5mbyA9IHJlcXVpcmUoJy4vZGV2aWNlLWluZm8uanMnKTtcbnZhciBFdmVudEVtaXR0ZXIzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIERFRkFVTFRfVklFV0VSID0gJ0NhcmRib2FyZFYxJztcbnZhciBWSUVXRVJfS0VZID0gJ1dFQlZSX0NBUkRCT0FSRF9WSUVXRVInO1xudmFyIENMQVNTX05BTUUgPSAnd2VidnItcG9seWZpbGwtdmlld2VyLXNlbGVjdG9yJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgdmlld2VyIHNlbGVjdG9yIHdpdGggdGhlIG9wdGlvbnMgc3BlY2lmaWVkLiBTdXBwb3J0cyBiZWluZyBzaG93blxuICogYW5kIGhpZGRlbi4gR2VuZXJhdGVzIGV2ZW50cyB3aGVuIHZpZXdlciBwYXJhbWV0ZXJzIGNoYW5nZS4gQWxzbyBzdXBwb3J0c1xuICogc2F2aW5nIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaW5kZXggaW4gbG9jYWxTdG9yYWdlLlxuICovXG5mdW5jdGlvbiBWaWV3ZXJTZWxlY3RvcigpIHtcbiAgLy8gVHJ5IHRvIGxvYWQgdGhlIHNlbGVjdGVkIGtleSBmcm9tIGxvY2FsIHN0b3JhZ2UuIElmIG5vbmUgZXhpc3RzLCB1c2UgdGhlXG4gIC8vIGRlZmF1bHQga2V5LlxuICB0cnkge1xuICAgIHRoaXMuc2VsZWN0ZWRLZXkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShWSUVXRVJfS0VZKSB8fCBERUZBVUxUX1ZJRVdFUjtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cbiAgdGhpcy5kaWFsb2cgPSB0aGlzLmNyZWF0ZURpYWxvZ18oRGV2aWNlSW5mby5WaWV3ZXJzKTtcbiAgdGhpcy5yb290ID0gbnVsbDtcbn1cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIzKCk7XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24ocm9vdCkge1xuICB0aGlzLnJvb3QgPSByb290O1xuXG4gIHJvb3QuYXBwZW5kQ2hpbGQodGhpcy5kaWFsb2cpO1xuXG4gIC8vIEVuc3VyZSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gaXMgY2hlY2tlZC5cbiAgdmFyIHNlbGVjdGVkID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignIycgKyB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgc2VsZWN0ZWQuY2hlY2tlZCA9IHRydWU7XG5cbiAgLy8gU2hvdyB0aGUgVUkuXG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMucm9vdCAmJiB0aGlzLnJvb3QuY29udGFpbnModGhpcy5kaWFsb2cpKSB7XG4gICAgdGhpcy5yb290LnJlbW92ZUNoaWxkKHRoaXMuZGlhbG9nKTtcbiAgfVxuICB0aGlzLmRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldEN1cnJlbnRWaWV3ZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5nZXRTZWxlY3RlZEtleV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlucHV0ID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1maWVsZF06Y2hlY2tlZCcpO1xuICBpZiAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQuaWQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUub25TYXZlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNlbGVjdGVkS2V5ID0gdGhpcy5nZXRTZWxlY3RlZEtleV8oKTtcbiAgaWYgKCF0aGlzLnNlbGVjdGVkS2V5IHx8ICFEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pIHtcbiAgICBjb25zb2xlLmVycm9yKCdWaWV3ZXJTZWxlY3Rvci5vblNhdmVfOiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW4hJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pO1xuXG4gIC8vIEF0dGVtcHQgdG8gc2F2ZSB0aGUgdmlld2VyIHByb2ZpbGUsIGJ1dCBmYWlscyBpbiBwcml2YXRlIG1vZGUuXG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oVklFV0VSX0tFWSwgdGhpcy5zZWxlY3RlZEtleSk7XG4gIH0gY2F0Y2goZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cbiAgdGhpcy5oaWRlKCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGRpYWxvZy5cbiAqL1xuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZURpYWxvZ18gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoQ0xBU1NfTkFNRSk7XG4gIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAvLyBDcmVhdGUgYW4gb3ZlcmxheSB0aGF0IGRpbXMgdGhlIGJhY2tncm91bmQsIGFuZCB3aGljaCBnb2VzIGF3YXkgd2hlbiB5b3VcbiAgLy8gdGFwIGl0LlxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLmxlZnQgPSAwO1xuICBzLnRvcCA9IDA7XG4gIHMud2lkdGggPSAnMTAwJSc7XG4gIHMuaGVpZ2h0ID0gJzEwMCUnO1xuICBzLmJhY2tncm91bmQgPSAncmdiYSgwLCAwLCAwLCAwLjMpJztcbiAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGlkZS5iaW5kKHRoaXMpKTtcblxuICB2YXIgd2lkdGggPSAyODA7XG4gIHZhciBkaWFsb2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBkaWFsb2cuc3R5bGU7XG4gIHMuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy50b3AgPSAnMjRweCc7XG4gIHMubGVmdCA9ICc1MCUnO1xuICBzLm1hcmdpbkxlZnQgPSAoLXdpZHRoLzIpICsgJ3B4JztcbiAgcy53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgcy5wYWRkaW5nID0gJzI0cHgnO1xuICBzLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gIHMuYmFja2dyb3VuZCA9ICcjZmFmYWZhJztcbiAgcy5mb250RmFtaWx5ID0gXCInUm9ib3RvJywgc2Fucy1zZXJpZlwiO1xuICBzLmJveFNoYWRvdyA9ICcwcHggNXB4IDIwcHggIzY2Nic7XG5cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSDFfKCdTZWxlY3QgeW91ciB2aWV3ZXInKSk7XG4gIGZvciAodmFyIGlkIGluIG9wdGlvbnMpIHtcbiAgICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVDaG9pY2VfKGlkLCBvcHRpb25zW2lkXS5sYWJlbCkpO1xuICB9XG4gIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUJ1dHRvbl8oJ1NhdmUnLCB0aGlzLm9uU2F2ZV8uYmluZCh0aGlzKSkpO1xuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChvdmVybGF5KTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRpYWxvZyk7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVIMV8gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBoMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gIHZhciBzID0gaDEuc3R5bGU7XG4gIHMuY29sb3IgPSAnYmxhY2snO1xuICBzLmZvbnRTaXplID0gJzIwcHgnO1xuICBzLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG4gIHMubWFyZ2luVG9wID0gMDtcbiAgcy5tYXJnaW5Cb3R0b20gPSAnMjRweCc7XG4gIGgxLmlubmVySFRNTCA9IG5hbWU7XG4gIHJldHVybiBoMTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVDaG9pY2VfID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcbiAgLypcbiAgPGRpdiBjbGFzcz1cImNob2ljZVwiPlxuICA8aW5wdXQgaWQ9XCJ2MVwiIHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJmaWVsZFwiIHZhbHVlPVwidjFcIj5cbiAgPGxhYmVsIGZvcj1cInYxXCI+Q2FyZGJvYXJkIFYxPC9sYWJlbD5cbiAgPC9kaXY+XG4gICovXG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LnN0eWxlLm1hcmdpblRvcCA9ICc4cHgnO1xuICBkaXYuc3R5bGUuY29sb3IgPSAnYmxhY2snO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzMwcHgnO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIGlkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCduYW1lJywgJ2ZpZWxkJyk7XG5cbiAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgbGFiZWwuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsIGlkKTtcbiAgbGFiZWwuaW5uZXJIVE1MID0gbmFtZTtcblxuICBkaXYuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICBkaXYuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gIHJldHVybiBkaXY7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlQnV0dG9uXyA9IGZ1bmN0aW9uKGxhYmVsLCBvbmNsaWNrKSB7XG4gIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgYnV0dG9uLmlubmVySFRNTCA9IGxhYmVsO1xuICB2YXIgcyA9IGJ1dHRvbi5zdHlsZTtcbiAgcy5mbG9hdCA9ICdyaWdodCc7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmNvbG9yID0gJyMxMDk0ZjcnO1xuICBzLmZvbnRTaXplID0gJzE0cHgnO1xuICBzLmxldHRlclNwYWNpbmcgPSAwO1xuICBzLmJvcmRlciA9IDA7XG4gIHMuYmFja2dyb3VuZCA9ICdub25lJztcbiAgcy5tYXJnaW5Ub3AgPSAnMTZweCc7XG5cbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25jbGljayk7XG5cbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyU2VsZWN0b3I7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEFuZHJvaWQgYW5kIGlPUyBjb21wYXRpYmxlIHdha2Vsb2NrIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFJlZmFjdG9yZWQgdGhhbmtzIHRvIGRrb3ZhbGV2QC5cbiAqL1xuZnVuY3Rpb24gQW5kcm9pZFdha2VMb2NrKCkge1xuICB2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuXG4gIHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgdmlkZW8ucGxheSgpO1xuICB9KTtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodmlkZW8ucGF1c2VkKSB7XG4gICAgICAvLyBCYXNlNjQgdmVyc2lvbiBvZiB2aWRlb3Nfc3JjL25vLXNsZWVwLTEyMHMubXA0LlxuICAgICAgdmlkZW8uc3JjID0gVXRpbC5iYXNlNjQoJ3ZpZGVvL21wNCcsICdBQUFBR0daMGVYQnBjMjl0QUFBQUFHMXdOREZoZG1NeEFBQUlBMjF2YjNZQUFBQnNiWFpvWkFBQUFBRFNhOXY2MG12YitnQUJYNUFBbHcvZ0FBRUFBQUVBQUFBQUFBQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFJQUFBZGtkSEpoYXdBQUFGeDBhMmhrQUFBQUFkSnIyL3JTYTl2NkFBQUFBUUFBQUFBQWx3L2dBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQVFBQUFBSEFBQUFBQUFKR1ZrZEhNQUFBQWNaV3h6ZEFBQUFBQUFBQUFCQUpjUDRBQUFBQUFBQVFBQUFBQUczRzFrYVdFQUFBQWdiV1JvWkFBQUFBRFNhOXY2MG12YitnQVBRa0FHam5lQUZjY0FBQUFBQUMxb1pHeHlBQUFBQUFBQUFBQjJhV1JsQUFBQUFBQUFBQUFBQUFBQVZtbGtaVzlJWVc1a2JHVnlBQUFBQm9kdGFXNW1BQUFBRkhadGFHUUFBQUFCQUFBQUFBQUFBQUFBQUFBa1pHbHVaZ0FBQUJ4a2NtVm1BQUFBQUFBQUFBRUFBQUFNZFhKc0lBQUFBQUVBQUFaSGMzUmliQUFBQUpkemRITmtBQUFBQUFBQUFBRUFBQUNIWVhaak1RQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBTUFCd0FTQUFBQUVnQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQmovL3dBQUFERmhkbU5EQVdRQUMvL2hBQmxuWkFBTHJObGZsbHc0UUFBQUF3QkFBQUFEQUtQRkNtV0FBUUFGYU92c3Npd0FBQUFZYzNSMGN3QUFBQUFBQUFBQkFBQUFiZ0FQUWtBQUFBQVVjM1J6Y3dBQUFBQUFBQUFCQUFBQUFRQUFBNEJqZEhSekFBQUFBQUFBQUc0QUFBQUJBRDBKQUFBQUFBRUFlaElBQUFBQUFRQTlDUUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFMY2JBQUFBQUhITjBjMk1BQUFBQUFBQUFBUUFBQUFFQUFBQnVBQUFBQVFBQUFjeHpkSE42QUFBQUFBQUFBQUFBQUFCdUFBQURDUUFBQUJnQUFBQU9BQUFBRGdBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJNQUFBQVVjM1JqYndBQUFBQUFBQUFCQUFBSUt3QUFBQ3QxWkhSaEFBQUFJNmxsYm1NQUZ3QUFkbXhqSURJdU1pNHhJSE4wY21WaGJTQnZkWFJ3ZFhRQUFBQUlkMmxrWlFBQUNSUnRaR0YwQUFBQ3JnWC8vNnZjUmVtOTV0bEl0NVlzMkNEWkkrN3ZlREkyTkNBdElHTnZjbVVnTVRReUlDMGdTQzR5TmpRdlRWQkZSeTAwSUVGV1F5QmpiMlJsWXlBdElFTnZjSGxzWldaMElESXdNRE10TWpBeE5DQXRJR2gwZEhBNkx5OTNkM2N1ZG1sa1pXOXNZVzR1YjNKbkwzZ3lOalF1YUhSdGJDQXRJRzl3ZEdsdmJuTTZJR05oWW1GalBURWdjbVZtUFRNZ1pHVmliRzlqYXoweE9qQTZNQ0JoYm1Gc2VYTmxQVEI0TXpvd2VERXpJRzFsUFdobGVDQnpkV0p0WlQwM0lIQnplVDB4SUhCemVWOXlaRDB4TGpBd09qQXVNREFnYldsNFpXUmZjbVZtUFRFZ2JXVmZjbUZ1WjJVOU1UWWdZMmh5YjIxaFgyMWxQVEVnZEhKbGJHeHBjejB4SURoNE9HUmpkRDB4SUdOeGJUMHdJR1JsWVdSNmIyNWxQVEl4TERFeElHWmhjM1JmY0hOcmFYQTlNU0JqYUhKdmJXRmZjWEJmYjJabWMyVjBQUzB5SUhSb2NtVmhaSE05TVRJZ2JHOXZhMkZvWldGa1gzUm9jbVZoWkhNOU1TQnpiR2xqWldSZmRHaHlaV0ZrY3owd0lHNXlQVEFnWkdWamFXMWhkR1U5TVNCcGJuUmxjbXhoWTJWa1BUQWdZbXgxY21GNVgyTnZiWEJoZEQwd0lHTnZibk4wY21GcGJtVmtYMmx1ZEhKaFBUQWdZbVp5WVcxbGN6MHpJR0pmY0hseVlXMXBaRDB5SUdKZllXUmhjSFE5TVNCaVgySnBZWE05TUNCa2FYSmxZM1E5TVNCM1pXbG5hSFJpUFRFZ2IzQmxibDluYjNBOU1DQjNaV2xuYUhSd1BUSWdhMlY1YVc1MFBUSTFNQ0JyWlhscGJuUmZiV2x1UFRFZ2MyTmxibVZqZFhROU5EQWdhVzUwY21GZmNtVm1jbVZ6YUQwd0lISmpYMnh2YjJ0aGFHVmhaRDAwTUNCeVl6MWhZbklnYldKMGNtVmxQVEVnWW1sMGNtRjBaVDB4TURBZ2NtRjBaWFJ2YkQweExqQWdjV052YlhBOU1DNDJNQ0J4Y0cxcGJqMHhNQ0J4Y0cxaGVEMDFNU0J4Y0hOMFpYQTlOQ0JwY0Y5eVlYUnBiejB4TGpRd0lHRnhQVEU2TVM0d01BQ0FBQUFBVTJXSWhBQVEvOGx0bE9lK2NUWnVHa0tnK2FSdHVpdmNEWjBwQnNmc0VpOXAvaTF5VTlEeFMybHE0ZFhUaW5WaUYxVVJCS1hnbnpLQmQvVWgxYmtoSHRNcndyUmNPSnNsRDAxVUIrZnlhTDZlZitEQkFBQUFGRUdhSkd4QkQ1Qit2K2ErNFFxRjNNZ0JYejlNQUFBQUNrR2VRbmlILys5NHI2RUFBQUFLQVo1aGRFTi84UXl0d0FBQUFBZ0JubU5xUTMvRWdRQUFBQTVCbW1oSnFFRm9tVXdJSWYvKzRRQUFBQXBCbm9aRkVTdy8vNzZCQUFBQUNBR2VwWFJEZjhTQkFBQUFDQUdlcDJwRGY4U0FBQUFBRGtHYXJFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZXlrVVZMRC8vdm9FQUFBQUlBWjdwZEVOL3hJQUFBQUFJQVo3cmFrTi94SUFBQUFBT1FacndTYWhCYkpsTUNDSC8vdUVBQUFBS1FaOE9SUlVzUC8rK2dRQUFBQWdCbnkxMFEzL0VnUUFBQUFnQm55OXFRMy9FZ0FBQUFBNUJtelJKcUVGc21Vd0lJZi8rNEFBQUFBcEJuMUpGRlN3Ly83NkJBQUFBQ0FHZmNYUkRmOFNBQUFBQUNBR2ZjMnBEZjhTQUFBQUFEa0diZUVtb1FXeVpUQWdoLy83aEFBQUFDa0dmbGtVVkxELy92b0FBQUFBSUFaKzFkRU4veElFQUFBQUlBWiszYWtOL3hJRUFBQUFPUVp1OFNhaEJiSmxNQ0NILy91QUFBQUFLUVovYVJSVXNQLysrZ1FBQUFBZ0JuL2wwUTMvRWdBQUFBQWdCbi90cVEzL0VnUUFBQUE1Qm0rQkpxRUZzbVV3SUlmLys0UUFBQUFwQm5oNUZGU3cvLzc2QUFBQUFDQUdlUFhSRGY4U0FBQUFBQ0FHZVAycERmOFNCQUFBQURrR2FKRW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2VRa1VWTEQvL3ZvRUFBQUFJQVo1aGRFTi94SUFBQUFBSUFaNWpha04veElFQUFBQU9RWnBvU2FoQmJKbE1DQ0gvL3VFQUFBQUtRWjZHUlJVc1AvKytnUUFBQUFnQm5xVjBRMy9FZ1FBQUFBZ0JucWRxUTMvRWdBQUFBQTVCbXF4SnFFRnNtVXdJSWYvKzRBQUFBQXBCbnNwRkZTdy8vNzZCQUFBQUNBR2U2WFJEZjhTQUFBQUFDQUdlNjJwRGY4U0FBQUFBRGtHYThFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZkRrVVZMRC8vdm9FQUFBQUlBWjh0ZEVOL3hJRUFBQUFJQVo4dmFrTi94SUFBQUFBT1FaczBTYWhCYkpsTUNDSC8vdUFBQUFBS1FaOVNSUlVzUC8rK2dRQUFBQWdCbjNGMFEzL0VnQUFBQUFnQm4zTnFRMy9FZ0FBQUFBNUJtM2hKcUVGc21Vd0lJZi8rNFFBQUFBcEJuNVpGRlN3Ly83NkFBQUFBQ0FHZnRYUkRmOFNCQUFBQUNBR2Z0MnBEZjhTQkFBQUFEa0didkVtb1FXeVpUQWdoLy83Z0FBQUFDa0dmMmtVVkxELy92b0VBQUFBSUFaLzVkRU4veElBQUFBQUlBWi83YWtOL3hJRUFBQUFPUVp2Z1NhaEJiSmxNQ0NILy91RUFBQUFLUVo0ZVJSVXNQLysrZ0FBQUFBZ0JuajEwUTMvRWdBQUFBQWdCbmo5cVEzL0VnUUFBQUE1Qm1pUkpxRUZzbVV3SUlmLys0QUFBQUFwQm5rSkZGU3cvLzc2QkFBQUFDQUdlWVhSRGY4U0FBQUFBQ0FHZVkycERmOFNCQUFBQURrR2FhRW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2Voa1VWTEQvL3ZvRUFBQUFJQVo2bGRFTi94SUVBQUFBSUFaNm5ha04veElBQUFBQU9RWnFzU2FoQmJKbE1DQ0gvL3VBQUFBQUtRWjdLUlJVc1AvKytnUUFBQUFnQm51bDBRMy9FZ0FBQUFBZ0JudXRxUTMvRWdBQUFBQTVCbXZCSnFFRnNtVXdJSWYvKzRRQUFBQXBCbnc1RkZTdy8vNzZCQUFBQUNBR2ZMWFJEZjhTQkFBQUFDQUdmTDJwRGY4U0FBQUFBRGtHYk5FbW9RV3laVEFnaC8vN2dBQUFBQ2tHZlVrVVZMRC8vdm9FQUFBQUlBWjl4ZEVOL3hJQUFBQUFJQVo5emFrTi94SUFBQUFBT1FadDRTYWhCYkpsTUNDSC8vdUVBQUFBS1FaK1dSUlVzUC8rK2dBQUFBQWdCbjdWMFEzL0VnUUFBQUFnQm43ZHFRMy9FZ1FBQUFBNUJtN3hKcUVGc21Vd0lJZi8rNEFBQUFBcEJuOXBGRlN3Ly83NkJBQUFBQ0FHZitYUkRmOFNBQUFBQUNBR2YrMnBEZjhTQkFBQUFEa0diNEVtb1FXeVpUQWdoLy83aEFBQUFDa0dlSGtVVkxELy92b0FBQUFBSUFaNDlkRU4veElBQUFBQUlBWjQvYWtOL3hJRUFBQUFPUVpva1NhaEJiSmxNQ0NILy91QUFBQUFLUVo1Q1JSVXNQLysrZ1FBQUFBZ0JubUYwUTMvRWdBQUFBQWdCbm1OcVEzL0VnUUFBQUE1Qm1taEpxRUZzbVV3SUlmLys0UUFBQUFwQm5vWkZGU3cvLzc2QkFBQUFDQUdlcFhSRGY4U0JBQUFBQ0FHZXAycERmOFNBQUFBQURrR2FyRW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2V5a1VWTEQvL3ZvRUFBQUFJQVo3cGRFTi94SUFBQUFBSUFaN3Jha04veElBQUFBQVBRWnJ1U2FoQmJKbE1GRXczLy83QicpO1xuICAgICAgdmlkZW8ucGxheSgpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLnJlbGVhc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wYXVzZSgpO1xuICAgIHZpZGVvLnNyYyA9ICcnO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpT1NXYWtlTG9jaygpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICAgIHNldFRpbWVvdXQod2luZG93LnN0b3AsIDApO1xuICAgICAgfSwgMzAwMDApO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aW1lcikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0V2FrZUxvY2soKSB7XG4gIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICBpZiAodXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgdXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpKSB7XG4gICAgcmV0dXJuIGlPU1dha2VMb2NrO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBbmRyb2lkV2FrZUxvY2s7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRXYWtlTG9jaygpOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgQ2FyZGJvYXJkVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtdnItZGlzcGxheS5qcycpO1xudmFyIE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkgPSByZXF1aXJlKCcuL21vdXNlLWtleWJvYXJkLXZyLWRpc3BsYXkuanMnKTtcbi8vIFVuY29tbWVudCB0byBhZGQgcG9zaXRpb25hbCB0cmFja2luZyB2aWEgd2ViY2FtLlxuLy92YXIgV2ViY2FtUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vd2ViY2FtLXBvc2l0aW9uLXNlbnNvci12ci1kZXZpY2UuanMnKTtcbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVlJGcmFtZURhdGEgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkZyYW1lRGF0YTtcbnZhciBITURWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLkhNRFZSRGV2aWNlO1xudmFyIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5Qb3NpdGlvblNlbnNvclZSRGV2aWNlO1xudmFyIFZSRGlzcGxheUhNRERldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheUhNRERldmljZTtcbnZhciBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlO1xuXG5mdW5jdGlvbiBXZWJWUlBvbHlmaWxsKCkge1xuICB0aGlzLmRpc3BsYXlzID0gW107XG4gIHRoaXMuZGV2aWNlcyA9IFtdOyAvLyBGb3IgZGVwcmVjYXRlZCBvYmplY3RzXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IGZhbHNlO1xuICB0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlID0gdGhpcy5pc1dlYlZSQXZhaWxhYmxlKCk7XG4gIHRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzRGVwcmVjYXRlZFdlYlZSQXZhaWxhYmxlKCk7XG4gIHRoaXMubmF0aXZlR2V0VlJEaXNwbGF5c0Z1bmMgPSB0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGw7XG5cbiAgaWYgKCF0aGlzLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgdGhpcy5lbmFibGVQb2x5ZmlsbCgpO1xuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZW5hYmxlRGVwcmVjYXRlZFBvbHlmaWxsKCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHV0IGEgc2hpbSBpbiBwbGFjZSB0byB1cGRhdGUgdGhlIEFQSSB0byAxLjEgaWYgbmVlZGVkLlxuICBJbnN0YWxsV2ViVlJTcGVjU2hpbSgpO1xufVxuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc1dlYlZSQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoJ2dldFZSRGlzcGxheXMnIGluIG5hdmlnYXRvcik7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0RlcHJlY2F0ZWRXZWJWUkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKCdnZXRWUkRldmljZXMnIGluIG5hdmlnYXRvcikgfHwgKCdtb3pHZXRWUkRldmljZXMnIGluIG5hdmlnYXRvcik7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5wb3B1bGF0ZURldmljZXMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGV2aWNlc1BvcHVsYXRlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgb3VyIHZpcnR1YWwgVlIgZGV2aWNlcy5cbiAgdmFyIHZyRGlzcGxheSA9IG51bGw7XG5cbiAgLy8gQWRkIGEgQ2FyZGJvYXJkIFZSRGlzcGxheSBvbiBjb21wYXRpYmxlIG1vYmlsZSBkZXZpY2VzXG4gIGlmICh0aGlzLmlzQ2FyZGJvYXJkQ29tcGF0aWJsZSgpKSB7XG4gICAgdnJEaXNwbGF5ID0gbmV3IENhcmRib2FyZFZSRGlzcGxheSgpO1xuICAgIHRoaXMuZGlzcGxheXMucHVzaCh2ckRpc3BsYXkpO1xuXG4gICAgLy8gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgaWYgKFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZSh2ckRpc3BsYXkpKTtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSh2ckRpc3BsYXkpKTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgYSBNb3VzZSBhbmQgS2V5Ym9hcmQgZHJpdmVuIFZSRGlzcGxheSBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICBpZiAoIXRoaXMuaXNNb2JpbGUoKSAmJiAhV2ViVlJDb25maWcuTU9VU0VfS0VZQk9BUkRfQ09OVFJPTFNfRElTQUJMRUQpIHtcbiAgICB2ckRpc3BsYXkgPSBuZXcgTW91c2VLZXlib2FyZFZSRGlzcGxheSgpO1xuICAgIHRoaXMuZGlzcGxheXMucHVzaCh2ckRpc3BsYXkpO1xuXG4gICAgLy8gRm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgaWYgKFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZSh2ckRpc3BsYXkpKTtcbiAgICAgIHRoaXMuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSh2ckRpc3BsYXkpKTtcbiAgICB9XG4gIH1cblxuICAvLyBVbmNvbW1lbnQgdG8gYWRkIHBvc2l0aW9uYWwgdHJhY2tpbmcgdmlhIHdlYmNhbS5cbiAgLy9pZiAoIXRoaXMuaXNNb2JpbGUoKSAmJiBXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgLy8gIHBvc2l0aW9uRGV2aWNlID0gbmV3IFdlYmNhbVBvc2l0aW9uU2Vuc29yVlJEZXZpY2UoKTtcbiAgLy8gIHRoaXMuZGV2aWNlcy5wdXNoKHBvc2l0aW9uRGV2aWNlKTtcbiAgLy99XG5cbiAgdGhpcy5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmVuYWJsZVBvbHlmaWxsID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByb3ZpZGUgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMuXG4gIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzID0gdGhpcy5nZXRWUkRpc3BsYXlzLmJpbmQodGhpcyk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgVlJEaXNwbGF5IG9iamVjdC5cbiAgd2luZG93LlZSRGlzcGxheSA9IFZSRGlzcGxheTtcblxuICAvLyBQcm92aWRlIG5hdmlnYXRvci52ckVuYWJsZWQuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG5hdmlnYXRvciwgJ3ZyRW5hYmxlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzZWxmLmlzQ2FyZGJvYXJkQ29tcGF0aWJsZSgpICYmXG4gICAgICAgICAgKHNlbGYuaXNGdWxsU2NyZWVuQXZhaWxhYmxlKCkgfHwgVXRpbC5pc0lPUygpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmICghJ1ZSRnJhbWVEYXRhJyBpbiB3aW5kb3cpIHtcbiAgICAvLyBQcm92aWRlIHRoZSBWUkZyYW1lRGF0YSBvYmplY3QuXG4gICAgd2luZG93LlZSRnJhbWVEYXRhID0gVlJGcmFtZURhdGE7XG4gIH1cbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmVuYWJsZURlcHJlY2F0ZWRQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRldmljZXMuXG4gIG5hdmlnYXRvci5nZXRWUkRldmljZXMgPSB0aGlzLmdldFZSRGV2aWNlcy5iaW5kKHRoaXMpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIENhcmRib2FyZEhNRFZSRGV2aWNlIGFuZCBQb3NpdGlvblNlbnNvclZSRGV2aWNlIG9iamVjdHMuXG4gIHdpbmRvdy5ITURWUkRldmljZSA9IEhNRFZSRGV2aWNlO1xuICB3aW5kb3cuUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IFBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRpc3BsYXlzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9wdWxhdGVEZXZpY2VzKCk7XG4gIHZhciBwb2x5ZmlsbERpc3BsYXlzID0gdGhpcy5kaXNwbGF5cztcblxuICBpZiAodGhpcy5uYXRpdmVXZWJWUkF2YWlsYWJsZSkge1xuICAgIHJldHVybiB0aGlzLm5hdGl2ZUdldFZSRGlzcGxheXNGdW5jLmNhbGwobmF2aWdhdG9yKS50aGVuKGZ1bmN0aW9uKG5hdGl2ZURpc3BsYXlzKSB7XG4gICAgICBpZiAoV2ViVlJDb25maWcuQUxXQVlTX0FQUEVORF9QT0xZRklMTF9ESVNQTEFZKSB7XG4gICAgICAgIHJldHVybiBuYXRpdmVEaXNwbGF5cy5jb25jYXQocG9seWZpbGxEaXNwbGF5cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmF0aXZlRGlzcGxheXMubGVuZ3RoID4gMCA/IG5hdGl2ZURpc3BsYXlzIDogcG9seWZpbGxEaXNwbGF5cztcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKHBvbHlmaWxsRGlzcGxheXMpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmdldFZSRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLndhcm4oJ2dldFZSRGV2aWNlcyBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXBkYXRlIHlvdXIgY29kZSB0byB1c2UgZ2V0VlJEaXNwbGF5cyBpbnN0ZWFkLicpO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFzZWxmLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICAgICAgaWYgKHNlbGYubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlzcGxheXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5c1tpXSkpO1xuICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIChuYXZpZ2F0b3IuZ2V0VlJERGV2aWNlcyB8fCBuYXZpZ2F0b3IubW96R2V0VlJEZXZpY2VzKShmdW5jdGlvbihkZXZpY2VzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRldmljZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgaWYgKGRldmljZXNbaV0gaW5zdGFuY2VvZiBITURWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgUG9zaXRpb25TZW5zb3JWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5wb3B1bGF0ZURldmljZXMoKTtcbiAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZWplY3QoZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgZGV2aWNlIGlzIG1vYmlsZS5cbiAqL1xuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNNb2JpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSB8fFxuICAgICAgL2lQaG9uZXxpUGFkfGlQb2QvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNDYXJkYm9hcmRDb21wYXRpYmxlID0gZnVuY3Rpb24oKSB7XG4gIC8vIEZvciBub3csIHN1cHBvcnQgYWxsIGlPUyBhbmQgQW5kcm9pZCBkZXZpY2VzLlxuICAvLyBBbHNvIGVuYWJsZSB0aGUgV2ViVlJDb25maWcuRk9SQ0VfVlIgZmxhZyBmb3IgZGVidWdnaW5nLlxuICByZXR1cm4gdGhpcy5pc01vYmlsZSgpIHx8IFdlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzRnVsbFNjcmVlbkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKGRvY3VtZW50LmZ1bGxzY3JlZW5FbmFibGVkIHx8XG4gICAgICAgICAgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVuYWJsZWQgfHxcbiAgICAgICAgICBkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCB8fFxuICAgICAgICAgIGZhbHNlKTtcbn07XG5cbi8vIEluc3RhbGxzIGEgc2hpbSB0aGF0IHVwZGF0ZXMgYSBXZWJWUiAxLjAgc3BlYyBpbXBsZW1lbnRhdGlvbiB0byBXZWJWUiAxLjFcbmZ1bmN0aW9uIEluc3RhbGxXZWJWUlNwZWNTaGltKCkge1xuICBpZiAoJ1ZSRGlzcGxheScgaW4gd2luZG93ICYmICEoJ1ZSRnJhbWVEYXRhJyBpbiB3aW5kb3cpKSB7XG4gICAgLy8gUHJvdmlkZSB0aGUgVlJGcmFtZURhdGEgb2JqZWN0LlxuICAgIHdpbmRvdy5WUkZyYW1lRGF0YSA9IFZSRnJhbWVEYXRhO1xuXG4gICAgLy8gQSBsb3Qgb2YgQ2hyb21lIGJ1aWxkcyBkb24ndCBoYXZlIGRlcHRoTmVhciBhbmQgZGVwdGhGYXIsIGV2ZW5cbiAgICAvLyB0aG91Z2ggdGhleSdyZSBpbiB0aGUgV2ViVlIgMS4wIHNwZWMuIFBhdGNoIHRoZW0gaW4gaWYgdGhleSdyZSBub3QgcHJlc2VudC5cbiAgICBpZighKCdkZXB0aE5lYXInIGluIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlKSkge1xuICAgICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZGVwdGhOZWFyID0gMC4wMTtcbiAgICB9XG5cbiAgICBpZighKCdkZXB0aEZhcicgaW4gd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUpKSB7XG4gICAgICB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZS5kZXB0aEZhciA9IDEwMDAwLjA7XG4gICAgfVxuXG4gICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RnJhbWVEYXRhID0gZnVuY3Rpb24oZnJhbWVEYXRhKSB7XG4gICAgICByZXR1cm4gVXRpbC5mcmFtZURhdGFGcm9tUG9zZShmcmFtZURhdGEsIHRoaXMuZ2V0UG9zZSgpLCB0aGlzKTtcbiAgICB9XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLldlYlZSUG9seWZpbGwgPSBXZWJWUlBvbHlmaWxsO1xuIl19
