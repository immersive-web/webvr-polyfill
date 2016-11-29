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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudGVtaXR0ZXIzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJzcmMvYmFzZS5qcyIsInNyYy9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzIiwic3JjL2NhcmRib2FyZC11aS5qcyIsInNyYy9jYXJkYm9hcmQtdnItZGlzcGxheS5qcyIsInNyYy9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMiLCJzcmMvZGV2aWNlLWluZm8uanMiLCJzcmMvZGlzcGxheS13cmFwcGVycy5qcyIsInNyYy9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanMiLCJzcmMvZHBkYi9kcGRiLWNhY2hlLmpzIiwic3JjL2RwZGIvZHBkYi5qcyIsInNyYy9tYWluLmpzIiwic3JjL21hdGgtdXRpbC5qcyIsInNyYy9tb3VzZS1rZXlib2FyZC12ci1kaXNwbGF5LmpzIiwic3JjL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMiLCJzcmMvc2Vuc29yLWZ1c2lvbi9jb21wbGVtZW50YXJ5LWZpbHRlci5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL2Z1c2lvbi1wb3NlLXNlbnNvci5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL3Bvc2UtcHJlZGljdG9yLmpzIiwic3JjL3NlbnNvci1mdXNpb24vc2Vuc29yLXNhbXBsZS5qcyIsInNyYy90b3VjaC1wYW5uZXIuanMiLCJzcmMvdXRpbC5qcyIsInNyYy92aWV3ZXItc2VsZWN0b3IuanMiLCJzcmMvd2FrZWxvY2suanMiLCJzcmMvd2VidnItcG9seWZpbGwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6OEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBwcmVmaXggPSAnfic7XG5cbi8qKlxuICogQ29uc3RydWN0b3IgdG8gY3JlYXRlIGEgc3RvcmFnZSBmb3Igb3VyIGBFRWAgb2JqZWN0cy5cbiAqIEFuIGBFdmVudHNgIGluc3RhbmNlIGlzIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEV2ZW50cygpIHt9XG5cbi8vXG4vLyBXZSB0cnkgdG8gbm90IGluaGVyaXQgZnJvbSBgT2JqZWN0LnByb3RvdHlwZWAuIEluIHNvbWUgZW5naW5lcyBjcmVhdGluZyBhblxuLy8gaW5zdGFuY2UgaW4gdGhpcyB3YXkgaXMgZmFzdGVyIHRoYW4gY2FsbGluZyBgT2JqZWN0LmNyZWF0ZShudWxsKWAgZGlyZWN0bHkuXG4vLyBJZiBgT2JqZWN0LmNyZWF0ZShudWxsKWAgaXMgbm90IHN1cHBvcnRlZCB3ZSBwcmVmaXggdGhlIGV2ZW50IG5hbWVzIHdpdGggYVxuLy8gY2hhcmFjdGVyIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBidWlsdC1pbiBvYmplY3QgcHJvcGVydGllcyBhcmUgbm90XG4vLyBvdmVycmlkZGVuIG9yIHVzZWQgYXMgYW4gYXR0YWNrIHZlY3Rvci5cbi8vXG5pZiAoT2JqZWN0LmNyZWF0ZSkge1xuICBFdmVudHMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvL1xuICAvLyBUaGlzIGhhY2sgaXMgbmVlZGVkIGJlY2F1c2UgdGhlIGBfX3Byb3RvX19gIHByb3BlcnR5IGlzIHN0aWxsIGluaGVyaXRlZCBpblxuICAvLyBzb21lIG9sZCBicm93c2VycyBsaWtlIEFuZHJvaWQgNCwgaVBob25lIDUuMSwgT3BlcmEgMTEgYW5kIFNhZmFyaSA1LlxuICAvL1xuICBpZiAoIW5ldyBFdmVudHMoKS5fX3Byb3RvX18pIHByZWZpeCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIFJlcHJlc2VudGF0aW9uIG9mIGEgc2luZ2xlIGV2ZW50IGxpc3RlbmVyLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHQgVGhlIGNvbnRleHQgdG8gaW52b2tlIHRoZSBsaXN0ZW5lciB3aXRoLlxuICogQHBhcmFtIHtCb29sZWFufSBbb25jZT1mYWxzZV0gU3BlY2lmeSBpZiB0aGUgbGlzdGVuZXIgaXMgYSBvbmUtdGltZSBsaXN0ZW5lci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIGBFdmVudEVtaXR0ZXJgIGludGVyZmFjZSB0aGF0IGlzIG1vbGRlZCBhZ2FpbnN0IHRoZSBOb2RlLmpzXG4gKiBgRXZlbnRFbWl0dGVyYCBpbnRlcmZhY2UuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAYXBpIHB1YmxpY1xuICovXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xufVxuXG4vKipcbiAqIFJldHVybiBhbiBhcnJheSBsaXN0aW5nIHRoZSBldmVudHMgZm9yIHdoaWNoIHRoZSBlbWl0dGVyIGhhcyByZWdpc3RlcmVkXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5ldmVudE5hbWVzID0gZnVuY3Rpb24gZXZlbnROYW1lcygpIHtcbiAgdmFyIG5hbWVzID0gW11cbiAgICAsIGV2ZW50c1xuICAgICwgbmFtZTtcblxuICBpZiAodGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHJldHVybiBuYW1lcztcblxuICBmb3IgKG5hbWUgaW4gKGV2ZW50cyA9IHRoaXMuX2V2ZW50cykpIHtcbiAgICBpZiAoaGFzLmNhbGwoZXZlbnRzLCBuYW1lKSkgbmFtZXMucHVzaChwcmVmaXggPyBuYW1lLnNsaWNlKDEpIDogbmFtZSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuICAgIHJldHVybiBuYW1lcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhldmVudHMpKTtcbiAgfVxuXG4gIHJldHVybiBuYW1lcztcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IGV2ZW50IFRoZSBldmVudCBuYW1lLlxuICogQHBhcmFtIHtCb29sZWFufSBleGlzdHMgT25seSBjaGVjayBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHNbZXZ0XTtcblxuICBpZiAoZXhpc3RzKSByZXR1cm4gISFhdmFpbGFibGU7XG4gIGlmICghYXZhaWxhYmxlKSByZXR1cm4gW107XG4gIGlmIChhdmFpbGFibGUuZm4pIHJldHVybiBbYXZhaWxhYmxlLmZuXTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGF2YWlsYWJsZS5sZW5ndGgsIGVlID0gbmV3IEFycmF5KGwpOyBpIDwgbDsgaSsrKSB7XG4gICAgZWVbaV0gPSBhdmFpbGFibGVbaV0uZm47XG4gIH1cblxuICByZXR1cm4gZWU7XG59O1xuXG4vKipcbiAqIENhbGxzIGVhY2ggb2YgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfFN5bWJvbH0gZXZlbnQgVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBldmVudCBoYWQgbGlzdGVuZXJzLCBlbHNlIGBmYWxzZWAuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2ZW50LCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtcbiAgdmFyIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgbGVuID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICwgYXJnc1xuICAgICwgaTtcblxuICBpZiAobGlzdGVuZXJzLmZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnMuZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgY2FzZSAxOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQpLCB0cnVlO1xuICAgICAgY2FzZSAyOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExKSwgdHJ1ZTtcbiAgICAgIGNhc2UgMzogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIpLCB0cnVlO1xuICAgICAgY2FzZSA0OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMpLCB0cnVlO1xuICAgICAgY2FzZSA1OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0KSwgdHJ1ZTtcbiAgICAgIGNhc2UgNjogcmV0dXJuIGxpc3RlbmVycy5mbi5jYWxsKGxpc3RlbmVycy5jb250ZXh0LCBhMSwgYTIsIGEzLCBhNCwgYTUpLCB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoaSA9IDEsIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0xKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICB9XG5cbiAgICBsaXN0ZW5lcnMuZm4uYXBwbHkobGlzdGVuZXJzLmNvbnRleHQsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoXG4gICAgICAsIGo7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChsaXN0ZW5lcnNbaV0ub25jZSkgdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXJzW2ldLmZuLCB1bmRlZmluZWQsIHRydWUpO1xuXG4gICAgICBzd2l0Y2ggKGxlbikge1xuICAgICAgICBjYXNlIDE6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0KTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMjogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExKTsgYnJlYWs7XG4gICAgICAgIGNhc2UgMzogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQsIGExLCBhMik7IGJyZWFrO1xuICAgICAgICBjYXNlIDQ6IGxpc3RlbmVyc1tpXS5mbi5jYWxsKGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhMSwgYTIsIGEzKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogQWRkIGEgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXIsIHRoaXMuX2V2ZW50c0NvdW50Kys7XG4gIGVsc2UgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbdGhpcy5fZXZlbnRzW2V2dF0sIGxpc3RlbmVyXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkIGEgb25lLXRpbWUgbGlzdGVuZXIgZm9yIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7TWl4ZWR9IFtjb250ZXh0PXRoaXNdIFRoZSBjb250ZXh0IHRvIGludm9rZSB0aGUgbGlzdGVuZXIgd2l0aC5cbiAqIEByZXR1cm5zIHtFdmVudEVtaXR0ZXJ9IGB0aGlzYC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGZuLCBjb250ZXh0KSB7XG4gIHZhciBsaXN0ZW5lciA9IG5ldyBFRShmbiwgY29udGV4dCB8fCB0aGlzLCB0cnVlKVxuICAgICwgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSB0aGlzLl9ldmVudHNbZXZ0XSA9IGxpc3RlbmVyLCB0aGlzLl9ldmVudHNDb3VudCsrO1xuICBlbHNlIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlIHRoaXMuX2V2ZW50c1tldnRdID0gW3RoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgbGlzdGVuZXJzIG9mIGEgZ2l2ZW4gZXZlbnQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8U3ltYm9sfSBldmVudCBUaGUgZXZlbnQgbmFtZS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIE9ubHkgcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgdGhhdCBtYXRjaCB0aGlzIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSB0aGUgbGlzdGVuZXJzIHRoYXQgaGF2ZSB0aGlzIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IG9uY2UgT25seSByZW1vdmUgb25lLXRpbWUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gYHRoaXNgLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1tldnRdKSByZXR1cm4gdGhpcztcbiAgaWYgKCFmbikge1xuICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgIGlmIChcbiAgICAgICAgIGxpc3RlbmVycy5mbiA9PT0gZm5cbiAgICAgICYmICghb25jZSB8fCBsaXN0ZW5lcnMub25jZSlcbiAgICAgICYmICghY29udGV4dCB8fCBsaXN0ZW5lcnMuY29udGV4dCA9PT0gY29udGV4dClcbiAgICApIHtcbiAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKSB0aGlzLl9ldmVudHMgPSBuZXcgRXZlbnRzKCk7XG4gICAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGV2ZW50cyA9IFtdLCBsZW5ndGggPSBsaXN0ZW5lcnMubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChcbiAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICB8fCAob25jZSAmJiAhbGlzdGVuZXJzW2ldLm9uY2UpXG4gICAgICAgIHx8IChjb250ZXh0ICYmIGxpc3RlbmVyc1tpXS5jb250ZXh0ICE9PSBjb250ZXh0KVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50cy5wdXNoKGxpc3RlbmVyc1tpXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBSZXNldCB0aGUgYXJyYXksIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5IGlmIHdlIGhhdmUgbm8gbW9yZSBsaXN0ZW5lcnMuXG4gICAgLy9cbiAgICBpZiAoZXZlbnRzLmxlbmd0aCkgdGhpcy5fZXZlbnRzW2V2dF0gPSBldmVudHMubGVuZ3RoID09PSAxID8gZXZlbnRzWzBdIDogZXZlbnRzO1xuICAgIGVsc2UgaWYgKC0tdGhpcy5fZXZlbnRzQ291bnQgPT09IDApIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICBlbHNlIGRlbGV0ZSB0aGlzLl9ldmVudHNbZXZ0XTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgYWxsIGxpc3RlbmVycywgb3IgdGhvc2Ugb2YgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xTeW1ib2x9IFtldmVudF0gVGhlIGV2ZW50IG5hbWUuXG4gKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSBgdGhpc2AuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyhldmVudCkge1xuICB2YXIgZXZ0O1xuXG4gIGlmIChldmVudCkge1xuICAgIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG4gICAgaWYgKHRoaXMuX2V2ZW50c1tldnRdKSB7XG4gICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMCkgdGhpcy5fZXZlbnRzID0gbmV3IEV2ZW50cygpO1xuICAgICAgZWxzZSBkZWxldGUgdGhpcy5fZXZlbnRzW2V2dF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX2V2ZW50cyA9IG5ldyBFdmVudHMoKTtcbiAgICB0aGlzLl9ldmVudHNDb3VudCA9IDA7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBBbGlhcyBtZXRob2RzIG5hbWVzIGJlY2F1c2UgcGVvcGxlIHJvbGwgbGlrZSB0aGF0LlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lcjtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uO1xuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBkb2Vzbid0IGFwcGx5IGFueW1vcmUuXG4vL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbiBzZXRNYXhMaXN0ZW5lcnMoKSB7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLy9cbi8vIEV4cG9zZSB0aGUgcHJlZml4LlxuLy9cbkV2ZW50RW1pdHRlci5wcmVmaXhlZCA9IHByZWZpeDtcblxuLy9cbi8vIEFsbG93IGBFdmVudEVtaXR0ZXJgIHRvIGJlIGltcG9ydGVkIGFzIG1vZHVsZSBuYW1lc3BhY2UuXG4vL1xuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuLy9cbi8vIEV4cG9zZSB0aGUgbW9kdWxlLlxuLy9cbmlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIG1vZHVsZSkge1xuICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHByb3BJc0VudW1lcmFibGUgPSBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG5mdW5jdGlvbiB0b09iamVjdCh2YWwpIHtcblx0aWYgKHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ09iamVjdC5hc3NpZ24gY2Fubm90IGJlIGNhbGxlZCB3aXRoIG51bGwgb3IgdW5kZWZpbmVkJyk7XG5cdH1cblxuXHRyZXR1cm4gT2JqZWN0KHZhbCk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFVzZU5hdGl2ZSgpIHtcblx0dHJ5IHtcblx0XHRpZiAoIU9iamVjdC5hc3NpZ24pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBEZXRlY3QgYnVnZ3kgcHJvcGVydHkgZW51bWVyYXRpb24gb3JkZXIgaW4gb2xkZXIgVjggdmVyc2lvbnMuXG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD00MTE4XG5cdFx0dmFyIHRlc3QxID0gbmV3IFN0cmluZygnYWJjJyk7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBXZSBkb24ndCBleHBlY3QgYW55IG9mIHRoZSBhYm92ZSB0byB0aHJvdywgYnV0IGJldHRlciB0byBiZSBzYWZlLlxuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHNob3VsZFVzZU5hdGl2ZSgpID8gT2JqZWN0LmFzc2lnbiA6IGZ1bmN0aW9uICh0YXJnZXQsIHNvdXJjZSkge1xuXHR2YXIgZnJvbTtcblx0dmFyIHRvID0gdG9PYmplY3QodGFyZ2V0KTtcblx0dmFyIHN5bWJvbHM7XG5cblx0Zm9yICh2YXIgcyA9IDE7IHMgPCBhcmd1bWVudHMubGVuZ3RoOyBzKyspIHtcblx0XHRmcm9tID0gT2JqZWN0KGFyZ3VtZW50c1tzXSk7XG5cblx0XHRmb3IgKHZhciBrZXkgaW4gZnJvbSkge1xuXHRcdFx0aWYgKGhhc093blByb3BlcnR5LmNhbGwoZnJvbSwga2V5KSkge1xuXHRcdFx0XHR0b1trZXldID0gZnJvbVtrZXldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV2FrZUxvY2sgPSByZXF1aXJlKCcuL3dha2Vsb2NrLmpzJyk7XG5cbi8vIFN0YXJ0IGF0IGEgaGlnaGVyIG51bWJlciB0byByZWR1Y2UgY2hhbmNlIG9mIGNvbmZsaWN0LlxudmFyIG5leHREaXNwbGF5SWQgPSAxMDAwO1xudmFyIGhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcgPSBmYWxzZTtcblxudmFyIGRlZmF1bHRMZWZ0Qm91bmRzID0gWzAsIDAsIDAuNSwgMV07XG52YXIgZGVmYXVsdFJpZ2h0Qm91bmRzID0gWzAuNSwgMCwgMC41LCAxXTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGZyYW1lIGRhdGEuXG4gKi9cblxuZnVuY3Rpb24gVlJGcmFtZURhdGEoKSB7XG4gIHRoaXMubGVmdFByb2plY3Rpb25NYXRyaXggPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgdGhpcy5sZWZ0Vmlld01hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnJpZ2h0UHJvamVjdGlvbk1hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnJpZ2h0Vmlld01hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuICB0aGlzLnBvc2UgPSBudWxsO1xufTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRpc3BsYXlzLlxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXkoKSB7XG4gIHRoaXMuaXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgdGhpcy5kaXNwbGF5SWQgPSBuZXh0RGlzcGxheUlkKys7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnd2VidnItcG9seWZpbGwgZGlzcGxheU5hbWUnO1xuXG4gIHRoaXMuZGVwdGhOZWFyID0gMC4wMTtcbiAgdGhpcy5kZXB0aEZhciA9IDEwMDAwLjA7XG5cbiAgdGhpcy5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gIHRoaXMuaXNQcmVzZW50aW5nID0gZmFsc2U7XG4gIHRoaXMuY2FwYWJpbGl0aWVzID0ge1xuICAgIGhhc1Bvc2l0aW9uOiBmYWxzZSxcbiAgICBoYXNPcmllbnRhdGlvbjogZmFsc2UsXG4gICAgaGFzRXh0ZXJuYWxEaXNwbGF5OiBmYWxzZSxcbiAgICBjYW5QcmVzZW50OiBmYWxzZSxcbiAgICBtYXhMYXllcnM6IDFcbiAgfTtcbiAgdGhpcy5zdGFnZVBhcmFtZXRlcnMgPSBudWxsO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IG51bGw7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfID0gbnVsbDtcblxuICB0aGlzLndha2Vsb2NrXyA9IG5ldyBXYWtlTG9jaygpO1xufVxuXG5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YSA9IGZ1bmN0aW9uKGZyYW1lRGF0YSkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gVXRpbC5mcmFtZURhdGFGcm9tUG9zZShmcmFtZURhdGEsIHRoaXMuZ2V0UG9zZSgpLCB0aGlzKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gdGhpcy5nZXRJbW1lZGlhdGVQb3NlKCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUud3JhcEZvckZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIC8vIERvbid0IHdyYXAgaW4gaU9TLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXykge1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCAhaW1wb3J0YW50JyxcbiAgICAgICd0b3A6IDAgIWltcG9ydGFudCcsXG4gICAgICAnbGVmdDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdyaWdodDogMCAhaW1wb3J0YW50JyxcbiAgICAgICdib3JkZXI6IDAnLFxuICAgICAgJ21hcmdpbjogMCcsXG4gICAgICAncGFkZGluZzogMCcsXG4gICAgICAnei1pbmRleDogOTk5OTk5ICFpbXBvcnRhbnQnLFxuICAgICAgJ3Bvc2l0aW9uOiBmaXhlZCcsXG4gICAgXTtcbiAgICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcbiAgICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5jbGFzc0xpc3QuYWRkKCd3ZWJ2ci1wb2x5ZmlsbC1mdWxsc2NyZWVuLXdyYXBwZXInKTtcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9PSBlbGVtZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91c2x5IGFwcGxpZWQgd3JhcHBlcnNcbiAgdGhpcy5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuXG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gZWxlbWVudDtcbiAgdmFyIHBhcmVudCA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLnBhcmVudEVsZW1lbnQ7XG4gIHBhcmVudC5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8sIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfKTtcbiAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uaW5zZXJ0QmVmb3JlKHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLCB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5maXJzdENoaWxkKTtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfLmdldEF0dHJpYnV0ZSgnc3R5bGUnKTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGZ1bmN0aW9uIGFwcGx5RnVsbHNjcmVlbkVsZW1lbnRTdHlsZSgpIHtcbiAgICBpZiAoIXNlbGYuZnVsbHNjcmVlbkVsZW1lbnRfKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGNzc1Byb3BlcnRpZXMgPSBbXG4gICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICd0b3A6IDAnLFxuICAgICAgJ2xlZnQ6IDAnLFxuICAgICAgJ3dpZHRoOiAnICsgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSArICdweCcsXG4gICAgICAnaGVpZ2h0OiAnICsgTWF0aC5taW4oc2NyZWVuLmhlaWdodCwgc2NyZWVuLndpZHRoKSArICdweCcsXG4gICAgICAnYm9yZGVyOiAwJyxcbiAgICAgICdtYXJnaW46IDAnLFxuICAgICAgJ3BhZGRpbmc6IDAnLFxuICAgIF07XG4gICAgc2VsZi5mdWxsc2NyZWVuRWxlbWVudF8uc2V0QXR0cmlidXRlKCdzdHlsZScsIGNzc1Byb3BlcnRpZXMuam9pbignOyAnKSArICc7Jyk7XG4gIH1cblxuICBhcHBseUZ1bGxzY3JlZW5FbGVtZW50U3R5bGUoKTtcblxuICByZXR1cm4gdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl87XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZWxlbWVudCA9IHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfO1xuICBpZiAodGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXykge1xuICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRDYWNoZWRTdHlsZV8pO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdzdHlsZScpO1xuICB9XG4gIHRoaXMuZnVsbHNjcmVlbkVsZW1lbnRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudENhY2hlZFN0eWxlXyA9IG51bGw7XG5cbiAgdmFyIHBhcmVudCA9IHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnBhcmVudEVsZW1lbnQ7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xuICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGVsZW1lbnQsIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKTtcbiAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfKTtcblxuICByZXR1cm4gZWxlbWVudDtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVxdWVzdFByZXNlbnQgPSBmdW5jdGlvbihsYXllcnMpIHtcbiAgdmFyIHdhc1ByZXNlbnRpbmcgPSB0aGlzLmlzUHJlc2VudGluZztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIGlmICghKGxheWVycyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgIGlmICghaGFzU2hvd0RlcHJlY2F0aW9uV2FybmluZykge1xuICAgICAgY29uc29sZS53YXJuKFwiVXNpbmcgYSBkZXByZWNhdGVkIGZvcm0gb2YgcmVxdWVzdFByZXNlbnQuIFNob3VsZCBwYXNzIGluIGFuIGFycmF5IG9mIFZSTGF5ZXJzLlwiKTtcbiAgICAgIGhhc1Nob3dEZXByZWNhdGlvbldhcm5pbmcgPSB0cnVlO1xuICAgIH1cbiAgICBsYXllcnMgPSBbbGF5ZXJzXTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoIXNlbGYuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1ZSRGlzcGxheSBpcyBub3QgY2FwYWJsZSBvZiBwcmVzZW50aW5nLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAobGF5ZXJzLmxlbmd0aCA9PSAwIHx8IGxheWVycy5sZW5ndGggPiBzZWxmLmNhcGFiaWxpdGllcy5tYXhMYXllcnMpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0ludmFsaWQgbnVtYmVyIG9mIGxheWVycy4nKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGluY29taW5nTGF5ZXIgPSBsYXllcnNbMF07XG4gICAgaWYgKCFpbmNvbWluZ0xheWVyLnNvdXJjZSkge1xuICAgICAgLypcbiAgICAgIHRvZG86IGZpZ3VyZSBvdXQgdGhlIGNvcnJlY3QgYmVoYXZpb3IgaWYgdGhlIHNvdXJjZSBpcyBub3QgcHJvdmlkZWQuXG4gICAgICBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3czYy93ZWJ2ci9pc3N1ZXMvNThcbiAgICAgICovXG4gICAgICByZXNvbHZlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGxlZnRCb3VuZHMgPSBpbmNvbWluZ0xheWVyLmxlZnRCb3VuZHMgfHwgZGVmYXVsdExlZnRCb3VuZHM7XG4gICAgdmFyIHJpZ2h0Qm91bmRzID0gaW5jb21pbmdMYXllci5yaWdodEJvdW5kcyB8fCBkZWZhdWx0UmlnaHRCb3VuZHM7XG4gICAgaWYgKHdhc1ByZXNlbnRpbmcpIHtcbiAgICAgIC8vIEFscmVhZHkgcHJlc2VudGluZywganVzdCBjaGFuZ2luZyBjb25maWd1cmF0aW9uXG4gICAgICB2YXIgbGF5ZXIgPSBzZWxmLmxheWVyXztcbiAgICAgIGlmIChsYXllci5zb3VyY2UgIT09IGluY29taW5nTGF5ZXIuc291cmNlKSB7XG4gICAgICAgIGxheWVyLnNvdXJjZSA9IGluY29taW5nTGF5ZXIuc291cmNlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICBpZiAobGF5ZXIubGVmdEJvdW5kc1tpXSAhPT0gbGVmdEJvdW5kc1tpXSkge1xuICAgICAgICAgIGxheWVyLmxlZnRCb3VuZHNbaV0gPSBsZWZ0Qm91bmRzW2ldO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYXllci5yaWdodEJvdW5kc1tpXSAhPT0gcmlnaHRCb3VuZHNbaV0pIHtcbiAgICAgICAgICBsYXllci5yaWdodEJvdW5kc1tpXSA9IHJpZ2h0Qm91bmRzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXYXMgbm90IGFscmVhZHkgcHJlc2VudGluZy5cbiAgICBzZWxmLmxheWVyXyA9IHtcbiAgICAgIHByZWRpc3RvcnRlZDogaW5jb21pbmdMYXllci5wcmVkaXN0b3J0ZWQsXG4gICAgICBzb3VyY2U6IGluY29taW5nTGF5ZXIuc291cmNlLFxuICAgICAgbGVmdEJvdW5kczogbGVmdEJvdW5kcy5zbGljZSgwKSxcbiAgICAgIHJpZ2h0Qm91bmRzOiByaWdodEJvdW5kcy5zbGljZSgwKVxuICAgIH07XG5cbiAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgIGlmIChzZWxmLmxheWVyXyAmJiBzZWxmLmxheWVyXy5zb3VyY2UpIHtcbiAgICAgIHZhciBmdWxsc2NyZWVuRWxlbWVudCA9IHNlbGYud3JhcEZvckZ1bGxzY3JlZW4oc2VsZi5sYXllcl8uc291cmNlKTtcblxuICAgICAgZnVuY3Rpb24gb25GdWxsc2NyZWVuQ2hhbmdlKCkge1xuICAgICAgICB2YXIgYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQgPSBVdGlsLmdldEZ1bGxzY3JlZW5FbGVtZW50KCk7XG5cbiAgICAgICAgc2VsZi5pc1ByZXNlbnRpbmcgPSAoZnVsbHNjcmVlbkVsZW1lbnQgPT09IGFjdHVhbEZ1bGxzY3JlZW5FbGVtZW50KTtcbiAgICAgICAgaWYgKHNlbGYuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24ubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLmxvY2soJ2xhbmRzY2FwZS1wcmltYXJ5JykuY2F0Y2goZnVuY3Rpb24oZXJyb3Ipe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzY3JlZW4ub3JpZW50YXRpb24ubG9jaygpIGZhaWxlZCBkdWUgdG8nLCBlcnJvci5tZXNzYWdlKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChzY3JlZW4ub3JpZW50YXRpb24gJiYgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIG9uRnVsbHNjcmVlbkVycm9yKCkge1xuICAgICAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5hZGRGdWxsc2NyZWVuTGlzdGVuZXJzXyhmdWxsc2NyZWVuRWxlbWVudCxcbiAgICAgICAgICBvbkZ1bGxzY3JlZW5DaGFuZ2UsIG9uRnVsbHNjcmVlbkVycm9yKTtcblxuICAgICAgaWYgKFV0aWwucmVxdWVzdEZ1bGxzY3JlZW4oZnVsbHNjcmVlbkVsZW1lbnQpKSB7XG4gICAgICAgIHNlbGYud2FrZWxvY2tfLnJlcXVlc3QoKTtcbiAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICAgICAgLy8gKnNpZ2gqIEp1c3QgZmFrZSBpdC5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuYmVnaW5QcmVzZW50XygpO1xuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZWxmLndhaXRpbmdGb3JQcmVzZW50XyAmJiAhVXRpbC5pc0lPUygpKSB7XG4gICAgICBVdGlsLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcHJlc2VudC4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZXhpdFByZXNlbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHdhc1ByZXNlbnRpbmcgPSB0aGlzLmlzUHJlc2VudGluZztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuICB0aGlzLmxheWVyXyA9IG51bGw7XG4gIHRoaXMud2FrZWxvY2tfLnJlbGVhc2UoKTtcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHdhc1ByZXNlbnRpbmcpIHtcbiAgICAgIGlmICghVXRpbC5leGl0RnVsbHNjcmVlbigpICYmIFV0aWwuaXNJT1MoKSkge1xuICAgICAgICBzZWxmLmVuZFByZXNlbnRfKCk7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcignV2FzIG5vdCBwcmVzZW50aW5nIHRvIFZSRGlzcGxheS4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0TGF5ZXJzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmxheWVyXykge1xuICAgIHJldHVybiBbdGhpcy5sYXllcl9dO1xuICB9XG4gIHJldHVybiBbXTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5cHJlc2VudGNoYW5nZScsIHtkZXRhaWw6IHtkaXNwbGF5OiB0aGlzfX0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfID0gZnVuY3Rpb24oZWxlbWVudCwgY2hhbmdlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XG4gIHRoaXMucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBlbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IGNoYW5nZUhhbmRsZXI7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBlcnJvckhhbmRsZXI7XG5cbiAgaWYgKGNoYW5nZUhhbmRsZXIpIHtcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbmFibGVkKSB7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pGdWxsU2NyZWVuRW5hYmxlZCkge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlcnJvckhhbmRsZXIpIHtcbiAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRGdWxsc2NyZWVuRW5hYmxlZCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRnVsbHNjcmVlbkVuYWJsZWQpIHtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18gPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8pXG4gICAgcmV0dXJuO1xuXG4gIHZhciBlbGVtZW50ID0gdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfO1xuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXykge1xuICAgIHZhciBjaGFuZ2VIYW5kbGVyID0gdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl87XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmNoYW5nZScsIGNoYW5nZUhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICB9XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8pIHtcbiAgICB2YXIgZXJyb3JIYW5kbGVyID0gdGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignd2Via2l0ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICB9XG5cbiAgdGhpcy5mdWxsc2NyZWVuRXZlbnRUYXJnZXRfID0gbnVsbDtcbiAgdGhpcy5mdWxsc2NyZWVuQ2hhbmdlSGFuZGxlcl8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfID0gbnVsbDtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuYmVnaW5QcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGJlZ2lucy5cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gYWRkIGN1c3RvbSBiZWhhdmlvciB3aGVuIHByZXNlbnRhdGlvbiBlbmRzLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5zdWJtaXRGcmFtZSA9IGZ1bmN0aW9uKHBvc2UpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gYWRkIGN1c3RvbSBiZWhhdmlvciBmb3IgZnJhbWUgc3VibWlzc2lvbi5cbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIC8vIE92ZXJyaWRlIHRvIHJldHVybiBhY2N1cmF0ZSBleWUgcGFyYW1ldGVycyBpZiBjYW5QcmVzZW50IGlzIHRydWUuXG4gIHJldHVybiBudWxsO1xufTtcblxuLypcbiAqIERlcHJlY2F0ZWQgY2xhc3Nlc1xuICovXG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gVlJEZXZpY2UoKSB7XG4gIHRoaXMuaXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgdGhpcy5oYXJkd2FyZVVuaXRJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBoYXJkd2FyZVVuaXRJZCc7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGwgZGV2aWNlSWQnO1xuICB0aGlzLmRldmljZU5hbWUgPSAnd2VidnItcG9seWZpbGwgZGV2aWNlTmFtZSc7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBITUQgZGV2aWNlcy4gKERlcHJlY2F0ZWQpXG4gKi9cbmZ1bmN0aW9uIEhNRFZSRGV2aWNlKCkge1xufVxuSE1EVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbi8qKlxuICogVGhlIGJhc2UgY2xhc3MgZm9yIGFsbCBWUiBwb3NpdGlvbiBzZW5zb3IgZGV2aWNlcy4gKERlcHJlY2F0ZWQpXG4gKi9cbmZ1bmN0aW9uIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UoKSB7XG59XG5Qb3NpdGlvblNlbnNvclZSRGV2aWNlLnByb3RvdHlwZSA9IG5ldyBWUkRldmljZSgpO1xuXG5tb2R1bGUuZXhwb3J0cy5WUkZyYW1lRGF0YSA9IFZSRnJhbWVEYXRhO1xubW9kdWxlLmV4cG9ydHMuVlJEaXNwbGF5ID0gVlJEaXNwbGF5O1xubW9kdWxlLmV4cG9ydHMuVlJEZXZpY2UgPSBWUkRldmljZTtcbm1vZHVsZS5leHBvcnRzLkhNRFZSRGV2aWNlID0gSE1EVlJEZXZpY2U7XG5tb2R1bGUuZXhwb3J0cy5Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBDYXJkYm9hcmRVSSA9IHJlcXVpcmUoJy4vY2FyZGJvYXJkLXVpLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdHTFVQcmVzZXJ2ZUdMU3RhdGUgPSByZXF1aXJlKCcuL2RlcHMvd2dsdS1wcmVzZXJ2ZS1zdGF0ZS5qcycpO1xuXG52YXIgZGlzdG9ydGlvblZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcbiAgJ2F0dHJpYnV0ZSB2ZWMzIHRleENvb3JkOycsXG5cbiAgJ3ZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7JyxcblxuICAndW5pZm9ybSB2ZWM0IHZpZXdwb3J0T2Zmc2V0U2NhbGVbMl07JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIHZlYzQgdmlld3BvcnQgPSB2aWV3cG9ydE9mZnNldFNjYWxlW2ludCh0ZXhDb29yZC56KV07JyxcbiAgJyAgdlRleENvb3JkID0gKHRleENvb3JkLnh5ICogdmlld3BvcnQuencpICsgdmlld3BvcnQueHk7JyxcbiAgJyAgZ2xfUG9zaXRpb24gPSB2ZWM0KCBwb3NpdGlvbiwgMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgZGlzdG9ydGlvbkZTID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcbiAgJ3VuaWZvcm0gc2FtcGxlcjJEIGRpZmZ1c2U7JyxcblxuICAndmFyeWluZyB2ZWMyIHZUZXhDb29yZDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKGRpZmZ1c2UsIHZUZXhDb29yZCk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxuLyoqXG4gKiBBIG1lc2gtYmFzZWQgZGlzdG9ydGVyLlxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpIHtcbiAgdGhpcy5nbCA9IGdsO1xuICB0aGlzLmN0eEF0dHJpYnMgPSBnbC5nZXRDb250ZXh0QXR0cmlidXRlcygpO1xuXG4gIHRoaXMubWVzaFdpZHRoID0gMjA7XG4gIHRoaXMubWVzaEhlaWdodCA9IDIwO1xuXG4gIHRoaXMuYnVmZmVyU2NhbGUgPSBXZWJWUkNvbmZpZy5CVUZGRVJfU0NBTEU7XG5cbiAgdGhpcy5idWZmZXJXaWR0aCA9IGdsLmRyYXdpbmdCdWZmZXJXaWR0aDtcbiAgdGhpcy5idWZmZXJIZWlnaHQgPSBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0O1xuXG4gIC8vIFBhdGNoaW5nIHN1cHBvcnRcbiAgdGhpcy5yZWFsQmluZEZyYW1lYnVmZmVyID0gZ2wuYmluZEZyYW1lYnVmZmVyO1xuICB0aGlzLnJlYWxFbmFibGUgPSBnbC5lbmFibGU7XG4gIHRoaXMucmVhbERpc2FibGUgPSBnbC5kaXNhYmxlO1xuICB0aGlzLnJlYWxDb2xvck1hc2sgPSBnbC5jb2xvck1hc2s7XG4gIHRoaXMucmVhbENsZWFyQ29sb3IgPSBnbC5jbGVhckNvbG9yO1xuICB0aGlzLnJlYWxWaWV3cG9ydCA9IGdsLnZpZXdwb3J0O1xuXG4gIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5yZWFsQ2FudmFzV2lkdGggPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICd3aWR0aCcpO1xuICAgIHRoaXMucmVhbENhbnZhc0hlaWdodCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZ2wuY2FudmFzLl9fcHJvdG9fXywgJ2hlaWdodCcpO1xuICB9XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSBmYWxzZTtcblxuICAvLyBTdGF0ZSB0cmFja2luZ1xuICB0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gbnVsbDtcbiAgdGhpcy5jdWxsRmFjZSA9IGZhbHNlO1xuICB0aGlzLmRlcHRoVGVzdCA9IGZhbHNlO1xuICB0aGlzLmJsZW5kID0gZmFsc2U7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBmYWxzZTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGZhbHNlO1xuICB0aGlzLnZpZXdwb3J0ID0gWzAsIDAsIDAsIDBdO1xuICB0aGlzLmNvbG9yTWFzayA9IFt0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXTtcbiAgdGhpcy5jbGVhckNvbG9yID0gWzAsIDAsIDAsIDBdO1xuXG4gIHRoaXMuYXR0cmlicyA9IHtcbiAgICBwb3NpdGlvbjogMCxcbiAgICB0ZXhDb29yZDogMVxuICB9O1xuICB0aGlzLnByb2dyYW0gPSBVdGlsLmxpbmtQcm9ncmFtKGdsLCBkaXN0b3J0aW9uVlMsIGRpc3RvcnRpb25GUywgdGhpcy5hdHRyaWJzKTtcbiAgdGhpcy51bmlmb3JtcyA9IFV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zKGdsLCB0aGlzLnByb2dyYW0pO1xuXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZSA9IG5ldyBGbG9hdDMyQXJyYXkoOCk7XG4gIHRoaXMuc2V0VGV4dHVyZUJvdW5kcygpO1xuXG4gIHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhCdWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgdGhpcy5pbmRleENvdW50ID0gMDtcblxuICB0aGlzLnJlbmRlclRhcmdldCA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgdGhpcy5mcmFtZWJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG5cbiAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBudWxsO1xuICB0aGlzLmRlcHRoQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5zdGVuY2lsQnVmZmVyID0gbnVsbDtcblxuICBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoICYmIHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5kZXB0aFN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmN0eEF0dHJpYnMuZGVwdGgpIHtcbiAgICB0aGlzLmRlcHRoQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICB0aGlzLnN0ZW5jaWxCdWZmZXIgPSBnbC5jcmVhdGVSZW5kZXJidWZmZXIoKTtcbiAgfVxuXG4gIHRoaXMucGF0Y2goKTtcblxuICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgaWYgKCFXZWJWUkNvbmZpZy5DQVJEQk9BUkRfVUlfRElTQUJMRUQpIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJID0gbmV3IENhcmRib2FyZFVJKGdsKTtcbiAgfVxufTtcblxuLyoqXG4gKiBUZWFycyBkb3duIGFsbCB0aGUgcmVzb3VyY2VzIGNyZWF0ZWQgYnkgdGhlIGRpc3RvcnRlciBhbmQgcmVtb3ZlcyBhbnlcbiAqIHBhdGNoZXMuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIHRoaXMudW5wYXRjaCgpO1xuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaW5kZXhCdWZmZXIpO1xuICBnbC5kZWxldGVUZXh0dXJlKHRoaXMucmVuZGVyVGFyZ2V0KTtcbiAgZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mcmFtZWJ1ZmZlcik7XG4gIGlmICh0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gIH1cbiAgaWYgKHRoaXMuZGVwdGhCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5kZXB0aEJ1ZmZlcik7XG4gIH1cbiAgaWYgKHRoaXMuc3RlbmNpbEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnN0ZW5jaWxCdWZmZXIpO1xuICB9XG5cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUkpIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJLmRlc3Ryb3koKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFJlc2l6ZXMgdGhlIGJhY2tidWZmZXIgdG8gbWF0Y2ggdGhlIGNhbnZhcyB3aWR0aCBhbmQgaGVpZ2h0LlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLm9uUmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtcbiAgICBnbC5SRU5ERVJCVUZGRVJfQklORElORyxcbiAgICBnbC5URVhUVVJFX0JJTkRJTkdfMkQsIGdsLlRFWFRVUkUwXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBCaW5kIHJlYWwgYmFja2J1ZmZlciBhbmQgY2xlYXIgaXQgb25jZS4gV2UgZG9uJ3QgbmVlZCB0byBjbGVhciBpdCBhZ2FpblxuICAgIC8vIGFmdGVyIHRoYXQgYmVjYXVzZSB3ZSdyZSBvdmVyd3JpdGluZyB0aGUgc2FtZSBhcmVhIGV2ZXJ5IGZyYW1lLlxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG5cbiAgICAvLyBQdXQgdGhpbmdzIGluIGEgZ29vZCBzdGF0ZVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCAwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuICAgIHNlbGYucmVhbENsZWFyQ29sb3IuY2FsbChnbCwgMCwgMCwgMCwgMSk7XG5cbiAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcblxuICAgIC8vIE5vdyBiaW5kIGFuZCByZXNpemUgdGhlIGZha2UgYmFja2J1ZmZlclxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgc2VsZi5mcmFtZWJ1ZmZlcik7XG5cbiAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBzZWxmLnJlbmRlclRhcmdldCk7XG4gICAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBzZWxmLmN0eEF0dHJpYnMuYWxwaGEgPyBnbC5SR0JBIDogZ2wuUkdCLFxuICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCwgMCxcbiAgICAgICAgc2VsZi5jdHhBdHRyaWJzLmFscGhhID8gZ2wuUkdCQSA6IGdsLlJHQiwgZ2wuVU5TSUdORURfQllURSwgbnVsbCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUik7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2wuQ0xBTVBfVE9fRURHRSk7XG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCBzZWxmLnJlbmRlclRhcmdldCwgMCk7XG5cbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmRlcHRoICYmIHNlbGYuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX1NURU5DSUwsXG4gICAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQpO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX1NURU5DSUxfQVRUQUNITUVOVCxcbiAgICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhTdGVuY2lsQnVmZmVyKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYuY3R4QXR0cmlicy5kZXB0aCkge1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHNlbGYuZGVwdGhCdWZmZXIpO1xuICAgICAgZ2wucmVuZGVyYnVmZmVyU3RvcmFnZShnbC5SRU5ERVJCVUZGRVIsIGdsLkRFUFRIX0NPTVBPTkVOVDE2LFxuICAgICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0KTtcbiAgICAgIGdsLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBnbC5ERVBUSF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aEJ1ZmZlcik7XG4gICAgfSBlbHNlIGlmIChzZWxmLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIHNlbGYuc3RlbmNpbEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuU1RFTkNJTF9JTkRFWDgsXG4gICAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQpO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLlNURU5DSUxfQVRUQUNITUVOVCxcbiAgICAgICAgICBnbC5SRU5ERVJCVUZGRVIsIHNlbGYuc3RlbmNpbEJ1ZmZlcik7XG4gICAgfVxuXG4gICAgaWYgKCFnbC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKGdsLkZSQU1FQlVGRkVSKSA9PT0gZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZyYW1lYnVmZmVyIGluY29tcGxldGUhJyk7XG4gICAgfVxuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyKTtcblxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbEVuYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG5cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suYXBwbHkoZ2wsIHNlbGYuY29sb3JNYXNrKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5hcHBseShnbCwgc2VsZi52aWV3cG9ydCk7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5hcHBseShnbCwgc2VsZi5jbGVhckNvbG9yKTtcbiAgfSk7XG5cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUkpIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJLm9uUmVzaXplKCk7XG4gIH1cbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUucGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuaXNQYXRjaGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgY2FudmFzID0gdGhpcy5nbC5jYW52YXM7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG5cbiAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICBjYW52YXMud2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCkgKiB0aGlzLmJ1ZmZlclNjYWxlO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpICogdGhpcy5idWZmZXJTY2FsZTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICd3aWR0aCcsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VsZi5idWZmZXJXaWR0aDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNlbGYuYnVmZmVyV2lkdGggPSB2YWx1ZTtcbiAgICAgICAgc2VsZi5yZWFsQ2FudmFzV2lkdGguc2V0LmNhbGwoY2FudmFzLCB2YWx1ZSk7XG4gICAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShjYW52YXMsICdoZWlnaHQnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGYuYnVmZmVySGVpZ2h0O1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgc2VsZi5idWZmZXJIZWlnaHQgPSB2YWx1ZTtcbiAgICAgICAgc2VsZi5yZWFsQ2FudmFzSGVpZ2h0LnNldC5jYWxsKGNhbnZhcywgdmFsdWUpO1xuICAgICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkZSQU1FQlVGRkVSX0JJTkRJTkcpO1xuXG4gIGlmICh0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID09IG51bGwpIHtcbiAgICB0aGlzLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gdGhpcy5mcmFtZWJ1ZmZlcjtcbiAgICB0aGlzLmdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgdGhpcy5mcmFtZWJ1ZmZlcik7XG4gIH1cblxuICB0aGlzLmdsLmJpbmRGcmFtZWJ1ZmZlciA9IGZ1bmN0aW9uKHRhcmdldCwgZnJhbWVidWZmZXIpIHtcbiAgICBzZWxmLmxhc3RCb3VuZEZyYW1lYnVmZmVyID0gZnJhbWVidWZmZXIgPyBmcmFtZWJ1ZmZlciA6IHNlbGYuZnJhbWVidWZmZXI7XG4gICAgLy8gU2lsZW50bHkgbWFrZSBjYWxscyB0byBiaW5kIHRoZSBkZWZhdWx0IGZyYW1lYnVmZmVyIGJpbmQgb3VycyBpbnN0ZWFkLlxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCB0YXJnZXQsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuICB9O1xuXG4gIHRoaXMuY3VsbEZhY2UgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ1VMTF9GQUNFKTtcbiAgdGhpcy5kZXB0aFRlc3QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuREVQVEhfVEVTVCk7XG4gIHRoaXMuYmxlbmQgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQkxFTkQpO1xuICB0aGlzLnNjaXNzb3JUZXN0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlNDSVNTT1JfVEVTVCk7XG4gIHRoaXMuc3RlbmNpbFRlc3QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU1RFTkNJTF9URVNUKTtcblxuICBnbC5lbmFibGUgPSBmdW5jdGlvbihwbmFtZSkge1xuICAgIHN3aXRjaCAocG5hbWUpIHtcbiAgICAgIGNhc2UgZ2wuQ1VMTF9GQUNFOiBzZWxmLmN1bGxGYWNlID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6IHNlbGYuZGVwdGhUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkJMRU5EOiBzZWxmLmJsZW5kID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDogc2VsZi5zY2lzc29yVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6IHNlbGYuc3RlbmNpbFRlc3QgPSB0cnVlOyBicmVhaztcbiAgICB9XG4gICAgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIHBuYW1lKTtcbiAgfTtcblxuICBnbC5kaXNhYmxlID0gZnVuY3Rpb24ocG5hbWUpIHtcbiAgICBzd2l0Y2ggKHBuYW1lKSB7XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTogc2VsZi5jdWxsRmFjZSA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDogc2VsZi5kZXB0aFRlc3QgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLkJMRU5EOiBzZWxmLmJsZW5kID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5TQ0lTU09SX1RFU1Q6IHNlbGYuc2Npc3NvclRlc3QgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNURU5DSUxfVEVTVDogc2VsZi5zdGVuY2lsVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICB9XG4gICAgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBwbmFtZSk7XG4gIH07XG5cbiAgdGhpcy5jb2xvck1hc2sgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09MT1JfV1JJVEVNQVNLKTtcbiAgZ2wuY29sb3JNYXNrID0gZnVuY3Rpb24ociwgZywgYiwgYSkge1xuICAgIHNlbGYuY29sb3JNYXNrWzBdID0gcjtcbiAgICBzZWxmLmNvbG9yTWFza1sxXSA9IGc7XG4gICAgc2VsZi5jb2xvck1hc2tbMl0gPSBiO1xuICAgIHNlbGYuY29sb3JNYXNrWzNdID0gYTtcbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgciwgZywgYiwgYSk7XG4gIH07XG5cbiAgdGhpcy5jbGVhckNvbG9yID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkNPTE9SX0NMRUFSX1ZBTFVFKTtcbiAgZ2wuY2xlYXJDb2xvciA9IGZ1bmN0aW9uKHIsIGcsIGIsIGEpIHtcbiAgICBzZWxmLmNsZWFyQ29sb3JbMF0gPSByO1xuICAgIHNlbGYuY2xlYXJDb2xvclsxXSA9IGc7XG4gICAgc2VsZi5jbGVhckNvbG9yWzJdID0gYjtcbiAgICBzZWxmLmNsZWFyQ29sb3JbM10gPSBhO1xuICAgIHNlbGYucmVhbENsZWFyQ29sb3IuY2FsbChnbCwgciwgZywgYiwgYSk7XG4gIH07XG5cbiAgdGhpcy52aWV3cG9ydCA9IGdsLmdldFBhcmFtZXRlcihnbC5WSUVXUE9SVCk7XG4gIGdsLnZpZXdwb3J0ID0gZnVuY3Rpb24oeCwgeSwgdywgaCkge1xuICAgIHNlbGYudmlld3BvcnRbMF0gPSB4O1xuICAgIHNlbGYudmlld3BvcnRbMV0gPSB5O1xuICAgIHNlbGYudmlld3BvcnRbMl0gPSB3O1xuICAgIHNlbGYudmlld3BvcnRbM10gPSBoO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIHgsIHksIHcsIGgpO1xuICB9O1xuXG4gIHRoaXMuaXNQYXRjaGVkID0gdHJ1ZTtcbiAgVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZChjYW52YXMpO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS51bnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc1BhdGNoZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgY2FudmFzID0gdGhpcy5nbC5jYW52YXM7XG5cbiAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnd2lkdGgnLCB0aGlzLnJlYWxDYW52YXNXaWR0aCk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ2hlaWdodCcsIHRoaXMucmVhbENhbnZhc0hlaWdodCk7XG4gIH1cbiAgY2FudmFzLndpZHRoID0gdGhpcy5idWZmZXJXaWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IHRoaXMuYnVmZmVySGVpZ2h0O1xuXG4gIGdsLmJpbmRGcmFtZWJ1ZmZlciA9IHRoaXMucmVhbEJpbmRGcmFtZWJ1ZmZlcjtcbiAgZ2wuZW5hYmxlID0gdGhpcy5yZWFsRW5hYmxlO1xuICBnbC5kaXNhYmxlID0gdGhpcy5yZWFsRGlzYWJsZTtcbiAgZ2wuY29sb3JNYXNrID0gdGhpcy5yZWFsQ29sb3JNYXNrO1xuICBnbC5jbGVhckNvbG9yID0gdGhpcy5yZWFsQ2xlYXJDb2xvcjtcbiAgZ2wudmlld3BvcnQgPSB0aGlzLnJlYWxWaWV3cG9ydDtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgb3VyIGZha2UgYmFja2J1ZmZlciBpcyBib3VuZCBhbmQgYmluZCB0aGUgcmVhbCBiYWNrYnVmZmVyXG4gIC8vIGlmIHRoYXQncyB0aGUgY2FzZS5cbiAgaWYgKHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPT0gdGhpcy5mcmFtZWJ1ZmZlcikge1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gIH1cblxuICB0aGlzLmlzUGF0Y2hlZCA9IGZhbHNlO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZChjYW52YXMpO1xuICB9LCAxKTtcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuc2V0VGV4dHVyZUJvdW5kcyA9IGZ1bmN0aW9uKGxlZnRCb3VuZHMsIHJpZ2h0Qm91bmRzKSB7XG4gIGlmICghbGVmdEJvdW5kcykge1xuICAgIGxlZnRCb3VuZHMgPSBbMCwgMCwgMC41LCAxXTtcbiAgfVxuXG4gIGlmICghcmlnaHRCb3VuZHMpIHtcbiAgICByaWdodEJvdW5kcyA9IFswLjUsIDAsIDAuNSwgMV07XG4gIH1cblxuICAvLyBMZWZ0IGV5ZVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMF0gPSBsZWZ0Qm91bmRzWzBdOyAvLyBYXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVsxXSA9IGxlZnRCb3VuZHNbMV07IC8vIFlcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzJdID0gbGVmdEJvdW5kc1syXTsgLy8gV2lkdGhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzNdID0gbGVmdEJvdW5kc1szXTsgLy8gSGVpZ2h0XG5cbiAgLy8gUmlnaHQgZXllXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs0XSA9IHJpZ2h0Qm91bmRzWzBdOyAvLyBYXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs1XSA9IHJpZ2h0Qm91bmRzWzFdOyAvLyBZXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs2XSA9IHJpZ2h0Qm91bmRzWzJdOyAvLyBXaWR0aFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbN10gPSByaWdodEJvdW5kc1szXTsgLy8gSGVpZ2h0XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGRpc3RvcnRpb24gcGFzcyBvbiB0aGUgaW5qZWN0ZWQgYmFja2J1ZmZlciwgcmVuZGVyaW5nIGl0IHRvIHRoZSByZWFsXG4gKiBiYWNrYnVmZmVyLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuZ2w7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgZ2xTdGF0ZSA9IFtdO1xuXG4gIGlmICghV2ViVlJDb25maWcuRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTKSB7XG4gICAgZ2xTdGF0ZS5wdXNoKFxuICAgICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gICAgICBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAgICAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMFxuICAgICk7XG4gIH1cblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIEJpbmQgdGhlIHJlYWwgZGVmYXVsdCBmcmFtZWJ1ZmZlclxuICAgIHNlbGYucmVhbEJpbmRGcmFtZWJ1ZmZlci5jYWxsKGdsLCBnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG5cbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGlmIChzZWxmLmN1bGxGYWNlKSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuQ1VMTF9GQUNFKTsgfVxuICAgIGlmIChzZWxmLmRlcHRoVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkRFUFRIX1RFU1QpOyB9XG4gICAgaWYgKHNlbGYuYmxlbmQpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5CTEVORCk7IH1cbiAgICBpZiAoc2VsZi5zY2lzc29yVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5zdGVuY2lsVGVzdCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLlNURU5DSUxfVEVTVCk7IH1cbiAgICBzZWxmLnJlYWxDb2xvck1hc2suY2FsbChnbCwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICAgIC8vIElmIHRoZSBiYWNrYnVmZmVyIGhhcyBhbiBhbHBoYSBjaGFubmVsIGNsZWFyIGV2ZXJ5IGZyYW1lIHNvIHRoZSBwYWdlXG4gICAgLy8gZG9lc24ndCBzaG93IHRocm91Z2guXG4gICAgaWYgKHNlbGYuY3R4QXR0cmlicy5hbHBoYSB8fCBVdGlsLmlzSU9TKCkpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuY2FsbChnbCwgMCwgMCwgMCwgMSk7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9XG5cbiAgICAvLyBCaW5kIGRpc3RvcnRpb24gcHJvZ3JhbSBhbmQgbWVzaFxuICAgIGdsLnVzZVByb2dyYW0oc2VsZi5wcm9ncmFtKTtcblxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHNlbGYuaW5kZXhCdWZmZXIpO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHNlbGYudmVydGV4QnVmZmVyKTtcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzZWxmLmF0dHJpYnMucG9zaXRpb24pO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNlbGYuYXR0cmlicy50ZXhDb29yZCk7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzZWxmLmF0dHJpYnMucG9zaXRpb24sIDIsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDApO1xuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2VsZi5hdHRyaWJzLnRleENvb3JkLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDIwLCA4KTtcblxuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgIGdsLnVuaWZvcm0xaShzZWxmLnVuaWZvcm1zLmRpZmZ1c2UsIDApO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0KTtcblxuICAgIGdsLnVuaWZvcm00ZnYoc2VsZi51bmlmb3Jtcy52aWV3cG9ydE9mZnNldFNjYWxlLCBzZWxmLnZpZXdwb3J0T2Zmc2V0U2NhbGUpO1xuXG4gICAgLy8gRHJhd3MgYm90aCBleWVzXG4gICAgZ2wuZHJhd0VsZW1lbnRzKGdsLlRSSUFOR0xFUywgc2VsZi5pbmRleENvdW50LCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG5cbiAgICBpZiAoc2VsZi5jYXJkYm9hcmRVSSkge1xuICAgICAgc2VsZi5jYXJkYm9hcmRVSS5yZW5kZXJOb1N0YXRlKCk7XG4gICAgfVxuXG4gICAgLy8gQmluZCB0aGUgZmFrZSBkZWZhdWx0IGZyYW1lYnVmZmVyIGFnYWluXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoc2VsZi5nbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgLy8gSWYgcHJlc2VydmVEcmF3aW5nQnVmZmVyID09IGZhbHNlIGNsZWFyIHRoZSBmcmFtZWJ1ZmZlclxuICAgIGlmICghc2VsZi5jdHhBdHRyaWJzLnByZXNlcnZlRHJhd2luZ0J1ZmZlcikge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAwKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIGlmICghV2ViVlJDb25maWcuRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTKSB7XG4gICAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuICAgIH1cblxuICAgIC8vIFJlc3RvcmUgc3RhdGVcbiAgICBpZiAoc2VsZi5jdWxsRmFjZSkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQ1VMTF9GQUNFKTsgfVxuICAgIGlmIChzZWxmLmRlcHRoVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQkxFTkQpOyB9XG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5zdGVuY2lsVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuYWxwaGEgfHwgIXNlbGYuY3R4QXR0cmlicy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXIpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gICAgfVxuICB9KTtcblxuICAvLyBXb3JrYXJvdW5kIGZvciB0aGUgZmFjdCB0aGF0IFNhZmFyaSBkb2Vzbid0IGFsbG93IHVzIHRvIHBhdGNoIHRoZSBjYW52YXNcbiAgLy8gd2lkdGggYW5kIGhlaWdodCBjb3JyZWN0bHkuIEFmdGVyIGVhY2ggc3VibWl0IGZyYW1lIGNoZWNrIHRvIHNlZSB3aGF0IHRoZVxuICAvLyByZWFsIGJhY2tidWZmZXIgc2l6ZSBoYXMgYmVlbiBzZXQgdG8gYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyIHNpemVcbiAgLy8gdG8gbWF0Y2guXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB2YXIgY2FudmFzID0gZ2wuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gc2VsZi5idWZmZXJXaWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9IHNlbGYuYnVmZmVySGVpZ2h0KSB7XG4gICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgc2VsZi5idWZmZXJIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDYWxsIHdoZW4gdGhlIGRldmljZUluZm8gaGFzIGNoYW5nZWQuIEF0IHRoaXMgcG9pbnQgd2UgbmVlZFxuICogdG8gcmUtY2FsY3VsYXRlIHRoZSBkaXN0b3J0aW9uIG1lc2guXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUudXBkYXRlRGV2aWNlSW5mbyA9IGZ1bmN0aW9uKGRldmljZUluZm8pIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW2dsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HXTtcbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICB2YXIgdmVydGljZXMgPSBzZWxmLmNvbXB1dGVNZXNoVmVydGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQsIGRldmljZUluZm8pO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAvLyBJbmRpY2VzIGRvbid0IGNoYW5nZSBiYXNlZCBvbiBkZXZpY2UgcGFyYW1ldGVycywgc28gb25seSBjb21wdXRlIG9uY2UuXG4gICAgaWYgKCFzZWxmLmluZGV4Q291bnQpIHtcbiAgICAgIHZhciBpbmRpY2VzID0gc2VsZi5jb21wdXRlTWVzaEluZGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICBzZWxmLmluZGV4Q291bnQgPSBpbmRpY2VzLmxlbmd0aDtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIHZlcnRpY2VzLlxuICogQmFzZWQgb24gY29kZSBmcm9tIHRoZSBVbml0eSBjYXJkYm9hcmQgcGx1Z2luLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmNvbXB1dGVNZXNoVmVydGljZXNfID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgZGV2aWNlSW5mbykge1xuICB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDIgKiB3aWR0aCAqIGhlaWdodCAqIDUpO1xuXG4gIHZhciBsZW5zRnJ1c3R1bSA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZVZpc2libGVUYW5BbmdsZXMoKTtcbiAgdmFyIG5vTGVuc0ZydXN0dW0gPSBkZXZpY2VJbmZvLmdldExlZnRFeWVOb0xlbnNUYW5BbmdsZXMoKTtcbiAgdmFyIHZpZXdwb3J0ID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllVmlzaWJsZVNjcmVlblJlY3Qobm9MZW5zRnJ1c3R1bSk7XG4gIHZhciB2aWR4ID0gMDtcbiAgdmFyIGlpZHggPSAwO1xuICBmb3IgKHZhciBlID0gMDsgZSA8IDI7IGUrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVpZ2h0OyBqKyspIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lkdGg7IGkrKywgdmlkeCsrKSB7XG4gICAgICAgIHZhciB1ID0gaSAvICh3aWR0aCAtIDEpO1xuICAgICAgICB2YXIgdiA9IGogLyAoaGVpZ2h0IC0gMSk7XG5cbiAgICAgICAgLy8gR3JpZCBwb2ludHMgcmVndWxhcmx5IHNwYWNlZCBpbiBTdHJlb1NjcmVlbiwgYW5kIGJhcnJlbCBkaXN0b3J0ZWQgaW5cbiAgICAgICAgLy8gdGhlIG1lc2guXG4gICAgICAgIHZhciBzID0gdTtcbiAgICAgICAgdmFyIHQgPSB2O1xuICAgICAgICB2YXIgeCA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVswXSwgbGVuc0ZydXN0dW1bMl0sIHUpO1xuICAgICAgICB2YXIgeSA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVszXSwgbGVuc0ZydXN0dW1bMV0sIHYpO1xuICAgICAgICB2YXIgZCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgdmFyIHIgPSBkZXZpY2VJbmZvLmRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoZCk7XG4gICAgICAgIHZhciBwID0geCAqIHIgLyBkO1xuICAgICAgICB2YXIgcSA9IHkgKiByIC8gZDtcbiAgICAgICAgdSA9IChwIC0gbm9MZW5zRnJ1c3R1bVswXSkgLyAobm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgICAgICB2ID0gKHEgLSBub0xlbnNGcnVzdHVtWzNdKSAvIChub0xlbnNGcnVzdHVtWzFdIC0gbm9MZW5zRnJ1c3R1bVszXSk7XG5cbiAgICAgICAgLy8gQ29udmVydCB1LHYgdG8gbWVzaCBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICAgICAgIHZhciBhc3BlY3QgPSBkZXZpY2VJbmZvLmRldmljZS53aWR0aE1ldGVycyAvIGRldmljZUluZm8uZGV2aWNlLmhlaWdodE1ldGVycztcblxuICAgICAgICAvLyBGSVhNRTogVGhlIG9yaWdpbmFsIFVuaXR5IHBsdWdpbiBtdWx0aXBsaWVkIFUgYnkgdGhlIGFzcGVjdCByYXRpb1xuICAgICAgICAvLyBhbmQgZGlkbid0IG11bHRpcGx5IGVpdGhlciB2YWx1ZSBieSAyLCBidXQgdGhhdCBzZWVtcyB0byBnZXQgaXRcbiAgICAgICAgLy8gcmVhbGx5IGNsb3NlIHRvIGNvcnJlY3QgbG9va2luZyBmb3IgbWUuIEkgaGF0ZSB0aGlzIGtpbmQgb2YgXCJEb24ndFxuICAgICAgICAvLyBrbm93IHdoeSBpdCB3b3Jrc1wiIGNvZGUgdGhvdWdoLCBhbmQgd29sZCBsb3ZlIGEgbW9yZSBsb2dpY2FsXG4gICAgICAgIC8vIGV4cGxhbmF0aW9uIG9mIHdoYXQgbmVlZHMgdG8gaGFwcGVuIGhlcmUuXG4gICAgICAgIHUgPSAodmlld3BvcnQueCArIHUgKiB2aWV3cG9ydC53aWR0aCAtIDAuNSkgKiAyLjA7IC8vKiBhc3BlY3Q7XG4gICAgICAgIHYgPSAodmlld3BvcnQueSArIHYgKiB2aWV3cG9ydC5oZWlnaHQgLSAwLjUpICogMi4wO1xuXG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAwXSA9IHU7IC8vIHBvc2l0aW9uLnhcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDFdID0gdjsgLy8gcG9zaXRpb24ueVxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMl0gPSBzOyAvLyB0ZXhDb29yZC54XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAzXSA9IHQ7IC8vIHRleENvb3JkLnlcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDRdID0gZTsgLy8gdGV4Q29vcmQueiAodmlld3BvcnQgaW5kZXgpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciB3ID0gbGVuc0ZydXN0dW1bMl0gLSBsZW5zRnJ1c3R1bVswXTtcbiAgICBsZW5zRnJ1c3R1bVswXSA9IC0odyArIGxlbnNGcnVzdHVtWzBdKTtcbiAgICBsZW5zRnJ1c3R1bVsyXSA9IHcgLSBsZW5zRnJ1c3R1bVsyXTtcbiAgICB3ID0gbm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF07XG4gICAgbm9MZW5zRnJ1c3R1bVswXSA9IC0odyArIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgIG5vTGVuc0ZydXN0dW1bMl0gPSB3IC0gbm9MZW5zRnJ1c3R1bVsyXTtcbiAgICB2aWV3cG9ydC54ID0gMSAtICh2aWV3cG9ydC54ICsgdmlld3BvcnQud2lkdGgpO1xuICB9XG4gIHJldHVybiB2ZXJ0aWNlcztcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIGluZGljZXMuXG4gKiBCYXNlZCBvbiBjb2RlIGZyb20gdGhlIFVuaXR5IGNhcmRib2FyZCBwbHVnaW4uXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuY29tcHV0ZU1lc2hJbmRpY2VzXyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgdmFyIGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkoMiAqICh3aWR0aCAtIDEpICogKGhlaWdodCAtIDEpICogNik7XG4gIHZhciBoYWxmd2lkdGggPSB3aWR0aCAvIDI7XG4gIHZhciBoYWxmaGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgdmFyIHZpZHggPSAwO1xuICB2YXIgaWlkeCA9IDA7XG4gIGZvciAodmFyIGUgPSAwOyBlIDwgMjsgZSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWR0aDsgaSsrLCB2aWR4KyspIHtcbiAgICAgICAgaWYgKGkgPT0gMCB8fCBqID09IDApXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIEJ1aWxkIGEgcXVhZC4gIExvd2VyIHJpZ2h0IGFuZCB1cHBlciBsZWZ0IHF1YWRyYW50cyBoYXZlIHF1YWRzIHdpdGhcbiAgICAgICAgLy8gdGhlIHRyaWFuZ2xlIGRpYWdvbmFsIGZsaXBwZWQgdG8gZ2V0IHRoZSB2aWduZXR0ZSB0byBpbnRlcnBvbGF0ZVxuICAgICAgICAvLyBjb3JyZWN0bHkuXG4gICAgICAgIGlmICgoaSA8PSBoYWxmd2lkdGgpID09IChqIDw9IGhhbGZoZWlnaHQpKSB7XG4gICAgICAgICAgLy8gUXVhZCBkaWFnb25hbCBsb3dlciBsZWZ0IHRvIHVwcGVyIHJpZ2h0LlxuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFF1YWQgZGlhZ29uYWwgdXBwZXIgbGVmdCB0byBsb3dlciByaWdodC5cbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kaWNlcztcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXyA9IGZ1bmN0aW9uKHByb3RvLCBhdHRyTmFtZSkge1xuICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG8sIGF0dHJOYW1lKTtcbiAgLy8gSW4gc29tZSBjYXNlcyAoYWhlbS4uLiBTYWZhcmkpLCB0aGUgZGVzY3JpcHRvciByZXR1cm5zIHVuZGVmaW5lZCBnZXQgYW5kXG4gIC8vIHNldCBmaWVsZHMuIEluIHRoaXMgY2FzZSwgd2UgbmVlZCB0byBjcmVhdGUgYSBzeW50aGV0aWMgcHJvcGVydHlcbiAgLy8gZGVzY3JpcHRvci4gVGhpcyB3b3JrcyBhcm91bmQgc29tZSBvZiB0aGUgaXNzdWVzIGluXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ib3Jpc211cy93ZWJ2ci1wb2x5ZmlsbC9pc3N1ZXMvNDZcbiAgaWYgKGRlc2NyaXB0b3IuZ2V0ID09PSB1bmRlZmluZWQgfHwgZGVzY3JpcHRvci5zZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH07XG4gICAgZGVzY3JpcHRvci5zZXQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCB2YWwpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGRlc2NyaXB0b3I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZERpc3RvcnRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IHJlcXVpcmUoJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciB1aVZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcblxuICAndW5pZm9ybSBtYXQ0IHByb2plY3Rpb25NYXQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdCAqIHZlYzQoIHBvc2l0aW9uLCAtMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgdWlGUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG5cbiAgJ3VuaWZvcm0gdmVjNCBjb2xvcjsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIERFRzJSQUQgPSBNYXRoLlBJLzE4MC4wO1xuXG4vLyBUaGUgZ2VhciBoYXMgNiBpZGVudGljYWwgc2VjdGlvbnMsIGVhY2ggc3Bhbm5pbmcgNjAgZGVncmVlcy5cbnZhciBrQW5nbGVQZXJHZWFyU2VjdGlvbiA9IDYwO1xuXG4vLyBIYWxmLWFuZ2xlIG9mIHRoZSBzcGFuIG9mIHRoZSBvdXRlciByaW0uXG52YXIga091dGVyUmltRW5kQW5nbGUgPSAxMjtcblxuLy8gQW5nbGUgYmV0d2VlbiB0aGUgbWlkZGxlIG9mIHRoZSBvdXRlciByaW0gYW5kIHRoZSBzdGFydCBvZiB0aGUgaW5uZXIgcmltLlxudmFyIGtJbm5lclJpbUJlZ2luQW5nbGUgPSAyMDtcblxuLy8gRGlzdGFuY2UgZnJvbSBjZW50ZXIgdG8gb3V0ZXIgcmltLCBub3JtYWxpemVkIHNvIHRoYXQgdGhlIGVudGlyZSBtb2RlbFxuLy8gZml0cyBpbiBhIFstMSwgMV0geCBbLTEsIDFdIHNxdWFyZS5cbnZhciBrT3V0ZXJSYWRpdXMgPSAxO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBkZXByZXNzZWQgcmltLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrTWlkZGxlUmFkaXVzID0gMC43NTtcblxuLy8gUmFkaXVzIG9mIHRoZSBpbm5lciBob2xsb3cgY2lyY2xlLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrSW5uZXJSYWRpdXMgPSAwLjMxMjU7XG5cbi8vIENlbnRlciBsaW5lIHRoaWNrbmVzcyBpbiBEUC5cbnZhciBrQ2VudGVyTGluZVRoaWNrbmVzc0RwID0gNDtcblxuLy8gQnV0dG9uIHdpZHRoIGluIERQLlxudmFyIGtCdXR0b25XaWR0aERwID0gMjg7XG5cbi8vIEZhY3RvciB0byBzY2FsZSB0aGUgdG91Y2ggYXJlYSB0aGF0IHJlc3BvbmRzIHRvIHRoZSB0b3VjaC5cbnZhciBrVG91Y2hTbG9wRmFjdG9yID0gMS41O1xuXG52YXIgQW5nbGVzID0gW1xuICAwLCBrT3V0ZXJSaW1FbmRBbmdsZSwga0lubmVyUmltQmVnaW5BbmdsZSxcbiAga0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlXG5dO1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGFsaWdubWVudCBsaW5lIGFuZCBcIm9wdGlvbnNcIiBnZWFyLiBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIGNhbnZhc1xuICogdGhpcyBpcyByZW5kZXJlZCBpbnRvIGNvdmVycyB0aGUgZW50aXJlIHNjcmVlbiAob3IgY2xvc2UgdG8gaXQuKVxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRVSShnbCkge1xuICB0aGlzLmdsID0gZ2w7XG5cbiAgdGhpcy5hdHRyaWJzID0ge1xuICAgIHBvc2l0aW9uOiAwXG4gIH07XG4gIHRoaXMucHJvZ3JhbSA9IFV0aWwubGlua1Byb2dyYW0oZ2wsIHVpVlMsIHVpRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmdlYXJPZmZzZXQgPSAwO1xuICB0aGlzLmdlYXJWZXJ0ZXhDb3VudCA9IDA7XG4gIHRoaXMuYXJyb3dPZmZzZXQgPSAwO1xuICB0aGlzLmFycm93VmVydGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJvak1hdCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuXG4gIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuXG4gIHRoaXMub25SZXNpemUoKTtcbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBVSSByZW5kZXJlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAodGhpcy5saXN0ZW5lcikge1xuICAgIGdsLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIGxpc3RlbmVyIHRvIGNsaWNrcyBvbiB0aGUgZ2VhciBhbmQgYmFjayBpY29uc1xuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24ob3B0aW9uc0NhbGxiYWNrLCBiYWNrQ2FsbGJhY2spIHtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgbWlkbGluZSA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3I7XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGdlYXIgaWNvblxuICAgIGlmIChldmVudC5jbGllbnRYID4gbWlkbGluZSAtIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WCA8IG1pZGxpbmUgKyBidXR0b25TaXplICYmXG4gICAgICAgIGV2ZW50LmNsaWVudFkgPiBjYW52YXMuY2xpZW50SGVpZ2h0IC0gYnV0dG9uU2l6ZSkge1xuICAgICAgb3B0aW9uc0NhbGxiYWNrKGV2ZW50KTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGJhY2sgaWNvblxuICAgIGVsc2UgaWYgKGV2ZW50LmNsaWVudFggPCBidXR0b25TaXplICYmIGV2ZW50LmNsaWVudFkgPCBidXR0b25TaXplKSB7XG4gICAgICBiYWNrQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVJIG1lc2guXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgdmFyIG1pZGxpbmUgPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGggLyAyO1xuXG4gICAgLy8gQXNzdW1lcyB5b3VyIGNhbnZhcyB3aWR0aCBhbmQgaGVpZ2h0IGlzIHNjYWxlZCBwcm9wb3J0aW9uYXRlbHkuXG4gICAgLy8gVE9ETyhzbXVzKTogVGhlIGZvbGxvd2luZyBjYXVzZXMgYnV0dG9ucyB0byBiZWNvbWUgaHVnZSBvbiBpT1MsIGJ1dCBzZWVtc1xuICAgIC8vIGxpa2UgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvLiBGb3Igbm93LCBhZGRlZCBhIGhhY2suIEJ1dCByZWFsbHksIGludmVzdGlnYXRlIHdoeS5cbiAgICB2YXIgZHBzID0gKGdsLmRyYXdpbmdCdWZmZXJXaWR0aCAvIChzY3JlZW4ud2lkdGggKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykpO1xuICAgIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgICBkcHMgKj0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgfVxuXG4gICAgdmFyIGxpbmVXaWR0aCA9IGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25TaXplID0ga0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yICogZHBzO1xuICAgIHZhciBidXR0b25TY2FsZSA9IGtCdXR0b25XaWR0aERwICogZHBzIC8gMjtcbiAgICB2YXIgYnV0dG9uQm9yZGVyID0gKChrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IpIC0ga0J1dHRvbldpZHRoRHApICogZHBzO1xuXG4gICAgLy8gQnVpbGQgY2VudGVybGluZVxuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSAtIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgKyBsaW5lV2lkdGgsIGJ1dHRvblNpemUpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBCdWlsZCBnZWFyXG4gICAgc2VsZi5nZWFyT2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkR2VhclNlZ21lbnQodGhldGEsIHIpIHtcbiAgICAgIHZhciBhbmdsZSA9ICg5MCAtIHRoZXRhKSAqIERFRzJSQUQ7XG4gICAgICB2YXIgeCA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHZhciB5ID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmVydGljZXMucHVzaChrSW5uZXJSYWRpdXMgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCBrSW5uZXJSYWRpdXMgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHIgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCByICogeSAqIGJ1dHRvblNjYWxlICsgYnV0dG9uU2NhbGUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDY7IGkrKykge1xuICAgICAgdmFyIHNlZ21lbnRUaGV0YSA9IGkgKiBrQW5nbGVQZXJHZWFyU2VjdGlvbjtcblxuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhLCBrT3V0ZXJSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsga091dGVyUmltRW5kQW5nbGUsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrSW5uZXJSaW1CZWdpbkFuZ2xlLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUpLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlKSwga091dGVyUmFkaXVzKTtcbiAgICB9XG5cbiAgICBzZWxmLmdlYXJWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuZ2Vhck9mZnNldDtcblxuICAgIC8vIEJ1aWxkIGJhY2sgYXJyb3dcbiAgICBzZWxmLmFycm93T2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkQXJyb3dWZXJ0ZXgoeCwgeSkge1xuICAgICAgdmVydGljZXMucHVzaChidXR0b25Cb3JkZXIgKyB4LCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0IC0gYnV0dG9uQm9yZGVyIC0geSk7XG4gICAgfVxuXG4gICAgdmFyIGFuZ2xlZExpbmVXaWR0aCA9IGxpbmVXaWR0aCAvIE1hdGguc2luKDQ1ICogREVHMlJBRCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIDApO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlLCBidXR0b25TY2FsZSAqIDIpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCAoYnV0dG9uU2NhbGUgKiAyKSAtIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChrQnV0dG9uV2lkdGhEcCAqIGRwcywgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG5cbiAgICBzZWxmLmFycm93VmVydGV4Q291bnQgPSAodmVydGljZXMubGVuZ3RoIC8gMikgLSBzZWxmLmFycm93T2Zmc2V0O1xuXG4gICAgLy8gQnVmZmVyIGRhdGFcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKSwgZ2wuU1RBVElDX0RSQVcpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLkNVTExfRkFDRSxcbiAgICBnbC5ERVBUSF9URVNULFxuICAgIGdsLkJMRU5ELFxuICAgIGdsLlNDSVNTT1JfVEVTVCxcbiAgICBnbC5TVEVOQ0lMX1RFU1QsXG4gICAgZ2wuQ09MT1JfV1JJVEVNQVNLLFxuICAgIGdsLlZJRVdQT1JULFxuXG4gICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNURU5DSUxfVEVTVCk7XG4gICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICBzZWxmLnJlbmRlck5vU3RhdGUoKTtcbiAgfSk7XG59O1xuXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUucmVuZGVyTm9TdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLmF0dHJpYnMucG9zaXRpb24pO1xuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCA4LCAwKTtcblxuICBnbC51bmlmb3JtNGYodGhpcy51bmlmb3Jtcy5jb2xvciwgMS4wLCAxLjAsIDEuMCwgMS4wKTtcblxuICBVdGlsLm9ydGhvTWF0cml4KHRoaXMucHJvak1hdCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCAwLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0LCAwLjEsIDEwMjQuMCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0LCBmYWxzZSwgdGhpcy5wcm9qTWF0KTtcblxuICAvLyBEcmF3cyBVSSBlbGVtZW50XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIDQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmdlYXJPZmZzZXQsIHRoaXMuZ2VhclZlcnRleENvdW50KTtcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5hcnJvd09mZnNldCwgdGhpcy5hcnJvd1ZlcnRleENvdW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkVUk7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgQ2FyZGJvYXJkRGlzdG9ydGVyID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzJyk7XG52YXIgQ2FyZGJvYXJkVUkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC11aS5qcycpO1xudmFyIERldmljZUluZm8gPSByZXF1aXJlKCcuL2RldmljZS1pbmZvLmpzJyk7XG52YXIgRHBkYiA9IHJlcXVpcmUoJy4vZHBkYi9kcGRiLmpzJyk7XG52YXIgRnVzaW9uUG9zZVNlbnNvciA9IHJlcXVpcmUoJy4vc2Vuc29yLWZ1c2lvbi9mdXNpb24tcG9zZS1zZW5zb3IuanMnKTtcbnZhciBSb3RhdGVJbnN0cnVjdGlvbnMgPSByZXF1aXJlKCcuL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMnKTtcbnZhciBWaWV3ZXJTZWxlY3RvciA9IHJlcXVpcmUoJy4vdmlld2VyLXNlbGVjdG9yLmpzJyk7XG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIEV5ZSA9IHtcbiAgTEVGVDogJ2xlZnQnLFxuICBSSUdIVDogJ3JpZ2h0J1xufTtcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW9iaWxlIGRldmljZSBwYXJhbWV0ZXJzIGFuZCBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ0NhcmRib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuICB0aGlzLmNhcGFiaWxpdGllcy5jYW5QcmVzZW50ID0gdHJ1ZTtcblxuICAvLyBcIlByaXZhdGVcIiBtZW1iZXJzLlxuICB0aGlzLmJ1ZmZlclNjYWxlXyA9IFdlYlZSQ29uZmlnLkJVRkZFUl9TQ0FMRTtcbiAgdGhpcy5wb3NlU2Vuc29yXyA9IG5ldyBGdXNpb25Qb3NlU2Vuc29yKCk7XG4gIHRoaXMuZGlzdG9ydGVyXyA9IG51bGw7XG4gIHRoaXMuY2FyZGJvYXJkVUlfID0gbnVsbDtcblxuICB0aGlzLmRwZGJfID0gbmV3IERwZGIodHJ1ZSwgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWRfLmJpbmQodGhpcykpO1xuICB0aGlzLmRldmljZUluZm9fID0gbmV3IERldmljZUluZm8odGhpcy5kcGRiXy5nZXREZXZpY2VQYXJhbXMoKSk7XG5cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8gPSBuZXcgVmlld2VyU2VsZWN0b3IoKTtcbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8ub24oJ2NoYW5nZScsIHRoaXMub25WaWV3ZXJDaGFuZ2VkXy5iaW5kKHRoaXMpKTtcblxuICAvLyBTZXQgdGhlIGNvcnJlY3QgaW5pdGlhbCB2aWV3ZXIuXG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHRoaXMudmlld2VyU2VsZWN0b3JfLmdldEN1cnJlbnRWaWV3ZXIoKSk7XG5cbiAgaWYgKCFXZWJWUkNvbmZpZy5ST1RBVEVfSU5TVFJVQ1RJT05TX0RJU0FCTEVEKSB7XG4gICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfID0gbmV3IFJvdGF0ZUluc3RydWN0aW9ucygpO1xuICB9XG5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIC8vIExpc3RlbiBmb3IgcmVzaXplIGV2ZW50cyB0byB3b3JrYXJvdW5kIHRoaXMgYXdmdWwgU2FmYXJpIGJ1Zy5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5vblJlc2l6ZV8uYmluZCh0aGlzKSk7XG4gIH1cbn1cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUgPSBuZXcgVlJEaXNwbGF5KCk7XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0SW1tZWRpYXRlUG9zZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiB0aGlzLnBvc2VTZW5zb3JfLmdldFBvc2l0aW9uKCksXG4gICAgb3JpZW50YXRpb246IHRoaXMucG9zZVNlbnNvcl8uZ2V0T3JpZW50YXRpb24oKSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbnVsbCxcbiAgICBsaW5lYXJBY2NlbGVyYXRpb246IG51bGwsXG4gICAgYW5ndWxhclZlbG9jaXR5OiBudWxsLFxuICAgIGFuZ3VsYXJBY2NlbGVyYXRpb246IG51bGxcbiAgfTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9zZVNlbnNvcl8ucmVzZXRQb3NlKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmdldEV5ZVBhcmFtZXRlcnMgPSBmdW5jdGlvbih3aGljaEV5ZSkge1xuICB2YXIgb2Zmc2V0ID0gW3RoaXMuZGV2aWNlSW5mb18udmlld2VyLmludGVyTGVuc0Rpc3RhbmNlICogMC41LCAwLjAsIDAuMF07XG4gIHZhciBmaWVsZE9mVmlldztcblxuICAvLyBUT0RPOiBGb1YgY2FuIGJlIGEgbGl0dGxlIGV4cGVuc2l2ZSB0byBjb21wdXRlLiBDYWNoZSB3aGVuIGRldmljZSBwYXJhbXMgY2hhbmdlLlxuICBpZiAod2hpY2hFeWUgPT0gRXllLkxFRlQpIHtcbiAgICBvZmZzZXRbMF0gKj0gLTEuMDtcbiAgICBmaWVsZE9mVmlldyA9IHRoaXMuZGV2aWNlSW5mb18uZ2V0RmllbGRPZlZpZXdMZWZ0RXllKCk7XG4gIH0gZWxzZSBpZiAod2hpY2hFeWUgPT0gRXllLlJJR0hUKSB7XG4gICAgZmllbGRPZlZpZXcgPSB0aGlzLmRldmljZUluZm9fLmdldEZpZWxkT2ZWaWV3UmlnaHRFeWUoKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIGV5ZSBwcm92aWRlZDogJXMnLCB3aGljaEV5ZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGZpZWxkT2ZWaWV3OiBmaWVsZE9mVmlldyxcbiAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAvLyBUT0RPOiBTaG91bGQgYmUgYWJsZSB0byBwcm92aWRlIGJldHRlciB2YWx1ZXMgdGhhbiB0aGVzZS5cbiAgICByZW5kZXJXaWR0aDogdGhpcy5kZXZpY2VJbmZvXy5kZXZpY2Uud2lkdGggKiAwLjUgKiB0aGlzLmJ1ZmZlclNjYWxlXyxcbiAgICByZW5kZXJIZWlnaHQ6IHRoaXMuZGV2aWNlSW5mb18uZGV2aWNlLmhlaWdodCAqIHRoaXMuYnVmZmVyU2NhbGVfLFxuICB9O1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbkRldmljZVBhcmFtc1VwZGF0ZWRfID0gZnVuY3Rpb24obmV3UGFyYW1zKSB7XG4gIGlmIChVdGlsLmlzRGVidWcoKSkge1xuICAgIGNvbnNvbGUubG9nKCdEUERCIHJlcG9ydGVkIHRoYXQgZGV2aWNlIHBhcmFtcyB3ZXJlIHVwZGF0ZWQuJyk7XG4gIH1cbiAgdGhpcy5kZXZpY2VJbmZvXy51cGRhdGVEZXZpY2VQYXJhbXMobmV3UGFyYW1zKTtcblxuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnVwZGF0ZURldmljZUluZm8odGhpcy5kZXZpY2VJbmZvXyk7XG4gIH1cbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUudXBkYXRlQm91bmRzXyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMubGF5ZXJfICYmIHRoaXMuZGlzdG9ydGVyXyAmJiAodGhpcy5sYXllcl8ubGVmdEJvdW5kcyB8fCB0aGlzLmxheWVyXy5yaWdodEJvdW5kcykpIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uc2V0VGV4dHVyZUJvdW5kcyh0aGlzLmxheWVyXy5sZWZ0Qm91bmRzLCB0aGlzLmxheWVyXy5yaWdodEJvdW5kcyk7XG4gIH1cbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuYmVnaW5QcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmxheWVyXy5zb3VyY2UuZ2V0Q29udGV4dCgnd2ViZ2wnKTtcbiAgaWYgKCFnbClcbiAgICBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgaWYgKCFnbClcbiAgICBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbDInKTtcblxuICBpZiAoIWdsKVxuICAgIHJldHVybjsgLy8gQ2FuJ3QgZG8gZGlzdG9ydGlvbiB3aXRob3V0IGEgV2ViR0wgY29udGV4dC5cblxuICAvLyBQcm92aWRlcyBhIHdheSB0byBvcHQgb3V0IG9mIGRpc3RvcnRpb25cbiAgaWYgKHRoaXMubGF5ZXJfLnByZWRpc3RvcnRlZCkge1xuICAgIGlmICghV2ViVlJDb25maWcuQ0FSREJPQVJEX1VJX0RJU0FCTEVEKSB7XG4gICAgICBnbC5jYW52YXMud2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCkgKiB0aGlzLmJ1ZmZlclNjYWxlXztcbiAgICAgIGdsLmNhbnZhcy5oZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpICogdGhpcy5idWZmZXJTY2FsZV87XG4gICAgICB0aGlzLmNhcmRib2FyZFVJXyA9IG5ldyBDYXJkYm9hcmRVSShnbCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBkaXN0b3J0ZXIgZm9yIHRoZSB0YXJnZXQgY29udGV4dFxuICAgIHRoaXMuZGlzdG9ydGVyXyA9IG5ldyBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpO1xuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gdGhpcy5kaXN0b3J0ZXJfLmNhcmRib2FyZFVJO1xuICB9XG5cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUlfKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8ubGlzdGVuKGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIE9wdGlvbnMgY2xpY2tlZC5cbiAgICAgIHRoaXMudmlld2VyU2VsZWN0b3JfLnNob3codGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9LmJpbmQodGhpcyksIGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIEJhY2sgY2xpY2tlZC5cbiAgICAgIHRoaXMuZXhpdFByZXNlbnQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGlmICh0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18pIHtcbiAgICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSAmJiBVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICAgIC8vIEluIGxhbmRzY2FwZSBtb2RlLCB0ZW1wb3JhcmlseSBzaG93IHRoZSBcInB1dCBpbnRvIENhcmRib2FyZFwiXG4gICAgICAvLyBpbnRlcnN0aXRpYWwuIE90aGVyd2lzZSwgZG8gdGhlIGRlZmF1bHQgdGhpbmcuXG4gICAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18uc2hvd1RlbXBvcmFyaWx5KDMwMDAsIHRoaXMubGF5ZXJfLnNvdXJjZS5wYXJlbnRFbGVtZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLnVwZGF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIExpc3RlbiBmb3Igb3JpZW50YXRpb24gY2hhbmdlIGV2ZW50cyBpbiBvcmRlciB0byBzaG93IGludGVyc3RpdGlhbC5cbiAgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIgPSB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcblxuICAvLyBMaXN0ZW4gZm9yIHByZXNlbnQgZGlzcGxheSBjaGFuZ2UgZXZlbnRzIGluIG9yZGVyIHRvIHVwZGF0ZSBkaXN0b3J0ZXIgZGltZW5zaW9uc1xuICB0aGlzLnZyZGlzcGxheXByZXNlbnRjaGFuZ2VIYW5kbGVyID0gdGhpcy51cGRhdGVCb3VuZHNfLmJpbmQodGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywgdGhpcy52cmRpc3BsYXlwcmVzZW50Y2hhbmdlSGFuZGxlcik7XG5cbiAgLy8gRmlyZSB0aGlzIGV2ZW50IGluaXRpYWxseSwgdG8gZ2l2ZSBnZW9tZXRyeS1kaXN0b3J0aW9uIGNsaWVudHMgdGhlIGNoYW5jZVxuICAvLyB0byBkbyBzb21ldGhpbmcgY3VzdG9tLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmVuZFByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uZGVzdHJveSgpO1xuICAgIHRoaXMuZGlzdG9ydGVyXyA9IG51bGw7XG4gIH1cbiAgaWYgKHRoaXMuY2FyZGJvYXJkVUlfKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8uZGVzdHJveSgpO1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gbnVsbDtcbiAgfVxuXG4gIGlmICh0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18pIHtcbiAgICB0aGlzLnJvdGF0ZUluc3RydWN0aW9uc18uaGlkZSgpO1xuICB9XG4gIHRoaXMudmlld2VyU2VsZWN0b3JfLmhpZGUoKTtcblxuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9yaWVudGF0aW9uSGFuZGxlcik7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCd2cmRpc3BsYXlwcmVzZW50Y2hhbmdlJywgdGhpcy52cmRpc3BsYXlwcmVzZW50Y2hhbmdlSGFuZGxlcik7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgdGhpcy5kaXN0b3J0ZXJfLnN1Ym1pdEZyYW1lKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jYXJkYm9hcmRVSV8gJiYgdGhpcy5sYXllcl8pIHtcbiAgICAvLyBIYWNrIGZvciBwcmVkaXN0b3J0ZWQ6IHRydWUuXG4gICAgdmFyIGNhbnZhcyA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpLmNhbnZhcztcbiAgICBpZiAoY2FudmFzLndpZHRoICE9IHRoaXMubGFzdFdpZHRoIHx8IGNhbnZhcy5oZWlnaHQgIT0gdGhpcy5sYXN0SGVpZ2h0KSB7XG4gICAgICB0aGlzLmNhcmRib2FyZFVJXy5vblJlc2l6ZSgpO1xuICAgIH1cbiAgICB0aGlzLmxhc3RXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICB0aGlzLmxhc3RIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgLy8gUmVuZGVyIHRoZSBDYXJkYm9hcmQgVUkuXG4gICAgdGhpcy5jYXJkYm9hcmRVSV8ucmVuZGVyKCk7XG4gIH1cbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25PcmllbnRhdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihlKSB7XG4gIC8vIEhpZGUgdGhlIHZpZXdlciBzZWxlY3Rvci5cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIC8vIFVwZGF0ZSB0aGUgcm90YXRlIGluc3RydWN0aW9ucy5cbiAgaWYgKHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXykge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy51cGRhdGUoKTtcbiAgfVxuXG4gIHRoaXMub25SZXNpemVfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uUmVzaXplXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKHRoaXMubGF5ZXJfKSB7XG4gICAgdmFyIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsJyk7XG4gICAgLy8gU2l6ZSB0aGUgQ1NTIGNhbnZhcy5cbiAgICAvLyBBZGRlZCBwYWRkaW5nIG9uIHJpZ2h0IGFuZCBib3R0b20gYmVjYXVzZSBpUGhvbmUgNSB3aWxsIG5vdFxuICAgIC8vIGhpZGUgdGhlIFVSTCBiYXIgdW5sZXNzIGNvbnRlbnQgaXMgYmlnZ2VyIHRoYW4gdGhlIHNjcmVlbi5cbiAgICAvLyBUaGlzIHdpbGwgbm90IGJlIHZpc2libGUgYXMgbG9uZyBhcyB0aGUgY29udGFpbmVyIGVsZW1lbnQgKGUuZy4gYm9keSlcbiAgICAvLyBpcyBzZXQgdG8gJ292ZXJmbG93OiBoaWRkZW4nLlxuICAgIHZhciBjc3NQcm9wZXJ0aWVzID0gW1xuICAgICAgJ3Bvc2l0aW9uOiBhYnNvbHV0ZScsXG4gICAgICAndG9wOiAwJyxcbiAgICAgICdsZWZ0OiAwJyxcbiAgICAgICd3aWR0aDogJyArIE1hdGgubWF4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCkgKyAncHgnLFxuICAgICAgJ2hlaWdodDogJyArIE1hdGgubWluKHNjcmVlbi5oZWlnaHQsIHNjcmVlbi53aWR0aCkgKyAncHgnLFxuICAgICAgJ2JvcmRlcjogMCcsXG4gICAgICAnbWFyZ2luOiAwJyxcbiAgICAgICdwYWRkaW5nOiAwIDEwcHggMTBweCAwJyxcbiAgICBdO1xuICAgIGdsLmNhbnZhcy5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgY3NzUHJvcGVydGllcy5qb2luKCc7ICcpICsgJzsnKTtcblxuICAgIFV0aWwuc2FmYXJpQ3NzU2l6ZVdvcmthcm91bmQoZ2wuY2FudmFzKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vblZpZXdlckNoYW5nZWRfID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHZpZXdlcik7XG5cbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIC8vIFVwZGF0ZSB0aGUgZGlzdG9ydGlvbiBhcHByb3ByaWF0ZWx5LlxuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICB9XG5cbiAgLy8gRmlyZSBhIG5ldyBldmVudCBjb250YWluaW5nIHZpZXdlciBhbmQgZGV2aWNlIHBhcmFtZXRlcnMgZm9yIGNsaWVudHMgdGhhdFxuICAvLyB3YW50IHRvIGltcGxlbWVudCB0aGVpciBvd24gZ2VvbWV0cnktYmFzZWQgZGlzdG9ydGlvbi5cbiAgdGhpcy5maXJlVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXygpO1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5maXJlVlJEaXNwbGF5RGV2aWNlUGFyYW1zQ2hhbmdlXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3ZyZGlzcGxheWRldmljZXBhcmFtc2NoYW5nZScsIHtcbiAgICBkZXRhaWw6IHtcbiAgICAgIHZyZGlzcGxheTogdGhpcyxcbiAgICAgIGRldmljZUluZm86IHRoaXMuZGV2aWNlSW5mb18sXG4gICAgfVxuICB9KTtcbiAgd2luZG93LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYXJkYm9hcmRWUkRpc3BsYXk7XG4iLCIvKlxuQ29weXJpZ2h0IChjKSAyMDE2LCBCcmFuZG9uIEpvbmVzLlxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG4qL1xuXG4vKlxuQ2FjaGVzIHNwZWNpZmllZCBHTCBzdGF0ZSwgcnVucyBhIGNhbGxiYWNrLCBhbmQgcmVzdG9yZXMgdGhlIGNhY2hlZCBzdGF0ZSB3aGVuXG5kb25lLlxuXG5FeGFtcGxlIHVzYWdlOlxuXG52YXIgc2F2ZWRTdGF0ZSA9IFtcbiAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG5cbiAgLy8gVEVYVFVSRV9CSU5ESU5HXzJEIG9yIF9DVUJFX01BUCBtdXN0IGFsd2F5cyBiZSBmb2xsb3dlZCBieSB0aGUgdGV4dXJlIHVuaXQuXG4gIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTAsXG5cbiAgZ2wuQ0xFQVJfQ09MT1IsXG5dO1xuLy8gQWZ0ZXIgdGhpcyBjYWxsIHRoZSBhcnJheSBidWZmZXIsIHRleHR1cmUgdW5pdCAwLCBhY3RpdmUgdGV4dHVyZSwgYW5kIGNsZWFyXG4vLyBjb2xvciB3aWxsIGJlIHJlc3RvcmVkLiBUaGUgdmlld3BvcnQgd2lsbCByZW1haW4gY2hhbmdlZCwgaG93ZXZlciwgYmVjYXVzZVxuLy8gZ2wuVklFV1BPUlQgd2FzIG5vdCBpbmNsdWRlZCBpbiB0aGUgc2F2ZWRTdGF0ZSBsaXN0LlxuV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgc2F2ZWRTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgZ2wudmlld3BvcnQoMCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKTtcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIC4uLi4pO1xuXG4gIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcbiAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAuLi4pO1xuXG4gIGdsLmNsZWFyQ29sb3IoMSwgMCwgMCwgMSk7XG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xufSk7XG5cbk5vdGUgdGhhdCB0aGlzIGlzIG5vdCBpbnRlbmRlZCB0byBiZSBmYXN0LiBNYW5hZ2luZyBzdGF0ZSBpbiB5b3VyIG93biBjb2RlIHRvXG5hdm9pZCByZWR1bmRhbnQgc3RhdGUgc2V0dGluZyBhbmQgcXVlcnlpbmcgd2lsbCBhbHdheXMgYmUgZmFzdGVyLiBUaGlzIGZ1bmN0aW9uXG5pcyBtb3N0IHVzZWZ1bCBmb3IgY2FzZXMgd2hlcmUgeW91IG1heSBub3QgaGF2ZSBmdWxsIGNvbnRyb2wgb3ZlciB0aGUgV2ViR0xcbmNhbGxzIGJlaW5nIG1hZGUsIHN1Y2ggYXMgdG9vbGluZyBvciBlZmZlY3QgaW5qZWN0b3JzLlxuKi9cblxuZnVuY3Rpb24gV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgYmluZGluZ3MsIGNhbGxiYWNrKSB7XG4gIGlmICghYmluZGluZ3MpIHtcbiAgICBjYWxsYmFjayhnbCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGJvdW5kVmFsdWVzID0gW107XG5cbiAgdmFyIGFjdGl2ZVRleHR1cmUgPSBudWxsO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVA6XG4gICAgICAgIHZhciB0ZXh0dXJlVW5pdCA9IGJpbmRpbmdzWysraV07XG4gICAgICAgIGlmICh0ZXh0dXJlVW5pdCA8IGdsLlRFWFRVUkUwIHx8IHRleHR1cmVVbml0ID4gZ2wuVEVYVFVSRTMxKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlRFWFRVUkVfQklORElOR18yRCBvciBURVhUVVJFX0JJTkRJTkdfQ1VCRV9NQVAgbXVzdCBiZSBmb2xsb3dlZCBieSBhIHZhbGlkIHRleHR1cmUgdW5pdFwiKTtcbiAgICAgICAgICBib3VuZFZhbHVlcy5wdXNoKG51bGwsIG51bGwpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWN0aXZlVGV4dHVyZSkge1xuICAgICAgICAgIGFjdGl2ZVRleHR1cmUgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQUNUSVZFX1RFWFRVUkUpO1xuICAgICAgICB9XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSwgbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChnbC5nZXRQYXJhbWV0ZXIoYmluZGluZykpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBjYWxsYmFjayhnbCk7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBiaW5kaW5nID0gYmluZGluZ3NbaV07XG4gICAgdmFyIGJvdW5kVmFsdWUgPSBib3VuZFZhbHVlc1tpXTtcbiAgICBzd2l0Y2ggKGJpbmRpbmcpIHtcbiAgICAgIGNhc2UgZ2wuQUNUSVZFX1RFWFRVUkU6XG4gICAgICAgIGJyZWFrOyAvLyBJZ25vcmUgdGhpcyBiaW5kaW5nLCBzaW5jZSB3ZSBzcGVjaWFsLWNhc2UgaXQgdG8gaGFwcGVuIGxhc3QuXG4gICAgICBjYXNlIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DT0xPUl9DTEVBUl9WQUxVRTpcbiAgICAgICAgZ2wuY2xlYXJDb2xvcihib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX1dSSVRFTUFTSzpcbiAgICAgICAgZ2wuY29sb3JNYXNrKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ1VSUkVOVF9QUk9HUkFNOlxuICAgICAgICBnbC51c2VQcm9ncmFtKGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5GUkFNRUJVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuUkVOREVSQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR18yRDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUodGV4dHVyZVVuaXQpO1xuICAgICAgICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFX0NVQkVfTUFQLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLlZJRVdQT1JUOlxuICAgICAgICBnbC52aWV3cG9ydChib3VuZFZhbHVlWzBdLCBib3VuZFZhbHVlWzFdLCBib3VuZFZhbHVlWzJdLCBib3VuZFZhbHVlWzNdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkJMRU5EOlxuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6XG4gICAgICBjYXNlIGdsLkRFUFRIX1RFU1Q6XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOlxuICAgICAgICBpZiAoYm91bmRWYWx1ZSkge1xuICAgICAgICAgIGdsLmVuYWJsZShiaW5kaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBnbC5kaXNhYmxlKGJpbmRpbmcpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coXCJObyBHTCByZXN0b3JlIGJlaGF2aW9yIGZvciAweFwiICsgYmluZGluZy50b1N0cmluZygxNikpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoYWN0aXZlVGV4dHVyZSkge1xuICAgICAgZ2wuYWN0aXZlVGV4dHVyZShhY3RpdmVUZXh0dXJlKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXR0xVUHJlc2VydmVHTFN0YXRlOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBEaXN0b3J0aW9uID0gcmVxdWlyZSgnLi9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBEZXZpY2UocGFyYW1zKSB7XG4gIHRoaXMud2lkdGggPSBwYXJhbXMud2lkdGggfHwgVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB0aGlzLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQgfHwgVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgdGhpcy53aWR0aE1ldGVycyA9IHBhcmFtcy53aWR0aE1ldGVycztcbiAgdGhpcy5oZWlnaHRNZXRlcnMgPSBwYXJhbXMuaGVpZ2h0TWV0ZXJzO1xuICB0aGlzLmJldmVsTWV0ZXJzID0gcGFyYW1zLmJldmVsTWV0ZXJzO1xufVxuXG5cbi8vIEZhbGxiYWNrIEFuZHJvaWQgZGV2aWNlIChiYXNlZCBvbiBOZXh1cyA1IG1lYXN1cmVtZW50cykgZm9yIHVzZSB3aGVuXG4vLyB3ZSBjYW4ndCByZWNvZ25pemUgYW4gQW5kcm9pZCBkZXZpY2UuXG52YXIgREVGQVVMVF9BTkRST0lEID0gbmV3IERldmljZSh7XG4gIHdpZHRoTWV0ZXJzOiAwLjExMCxcbiAgaGVpZ2h0TWV0ZXJzOiAwLjA2MixcbiAgYmV2ZWxNZXRlcnM6IDAuMDA0XG59KTtcblxuLy8gRmFsbGJhY2sgaU9TIGRldmljZSAoYmFzZWQgb24gaVBob25lNikgZm9yIHVzZSB3aGVuXG4vLyB3ZSBjYW4ndCByZWNvZ25pemUgYW4gQW5kcm9pZCBkZXZpY2UuXG52YXIgREVGQVVMVF9JT1MgPSBuZXcgRGV2aWNlKHtcbiAgd2lkdGhNZXRlcnM6IDAuMTAzOCxcbiAgaGVpZ2h0TWV0ZXJzOiAwLjA1ODQsXG4gIGJldmVsTWV0ZXJzOiAwLjAwNFxufSk7XG5cblxudmFyIFZpZXdlcnMgPSB7XG4gIENhcmRib2FyZFYxOiBuZXcgQ2FyZGJvYXJkVmlld2VyKHtcbiAgICBpZDogJ0NhcmRib2FyZFYxJyxcbiAgICBsYWJlbDogJ0NhcmRib2FyZCBJL08gMjAxNCcsXG4gICAgZm92OiA0MCxcbiAgICBpbnRlckxlbnNEaXN0YW5jZTogMC4wNjAsXG4gICAgYmFzZWxpbmVMZW5zRGlzdGFuY2U6IDAuMDM1LFxuICAgIHNjcmVlbkxlbnNEaXN0YW5jZTogMC4wNDIsXG4gICAgZGlzdG9ydGlvbkNvZWZmaWNpZW50czogWzAuNDQxLCAwLjE1Nl0sXG4gICAgaW52ZXJzZUNvZWZmaWNpZW50czogWy0wLjQ0MTAwMzUsIDAuNDI3NTYxNTUsIC0wLjQ4MDQ0MzksIDAuNTQ2MDEzOSxcbiAgICAgIC0wLjU4ODIxMTgzLCAwLjU3MzM5MzgsIC0wLjQ4MzAzMjAyLCAwLjMzMjk5MDgzLCAtMC4xNzU3Mzg0MSxcbiAgICAgIDAuMDY1MTc3MiwgLTAuMDE0ODg5NjMsIDAuMDAxNTU5ODM0XVxuICB9KSxcbiAgQ2FyZGJvYXJkVjI6IG5ldyBDYXJkYm9hcmRWaWV3ZXIoe1xuICAgIGlkOiAnQ2FyZGJvYXJkVjInLFxuICAgIGxhYmVsOiAnQ2FyZGJvYXJkIEkvTyAyMDE1JyxcbiAgICBmb3Y6IDYwLFxuICAgIGludGVyTGVuc0Rpc3RhbmNlOiAwLjA2NCxcbiAgICBiYXNlbGluZUxlbnNEaXN0YW5jZTogMC4wMzUsXG4gICAgc2NyZWVuTGVuc0Rpc3RhbmNlOiAwLjAzOSxcbiAgICBkaXN0b3J0aW9uQ29lZmZpY2llbnRzOiBbMC4zNCwgMC41NV0sXG4gICAgaW52ZXJzZUNvZWZmaWNpZW50czogWy0wLjMzODM2NzA0LCAtMC4xODE2MjE4NSwgMC44NjI2NTUsIC0xLjI0NjIwNTEsXG4gICAgICAxLjA1NjA2MDIsIC0wLjU4MjA4MzE3LCAwLjIxNjA5MDc4LCAtMC4wNTQ0NDgyMywgMC4wMDkxNzc5NTYsXG4gICAgICAtOS45MDQxNjlFLTQsIDYuMTgzNTM1RS01LCAtMS42OTgxODAzRS02XVxuICB9KVxufTtcblxuXG52YXIgREVGQVVMVF9MRUZUX0NFTlRFUiA9IHt4OiAwLjUsIHk6IDAuNX07XG52YXIgREVGQVVMVF9SSUdIVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xuXG4vKipcbiAqIE1hbmFnZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGRldmljZSBhbmQgdGhlIHZpZXdlci5cbiAqXG4gKiBkZXZpY2VQYXJhbXMgaW5kaWNhdGVzIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBkZXZpY2UgdG8gdXNlIChnZW5lcmFsbHlcbiAqIG9idGFpbmVkIGZyb20gZHBkYi5nZXREZXZpY2VQYXJhbXMoKSkuIENhbiBiZSBudWxsIHRvIG1lYW4gbm8gZGV2aWNlXG4gKiBwYXJhbXMgd2VyZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gRGV2aWNlSW5mbyhkZXZpY2VQYXJhbXMpIHtcbiAgdGhpcy52aWV3ZXIgPSBWaWV3ZXJzLkNhcmRib2FyZFYyO1xuICB0aGlzLnVwZGF0ZURldmljZVBhcmFtcyhkZXZpY2VQYXJhbXMpO1xuICB0aGlzLmRpc3RvcnRpb24gPSBuZXcgRGlzdG9ydGlvbih0aGlzLnZpZXdlci5kaXN0b3J0aW9uQ29lZmZpY2llbnRzKTtcbn1cblxuRGV2aWNlSW5mby5wcm90b3R5cGUudXBkYXRlRGV2aWNlUGFyYW1zID0gZnVuY3Rpb24oZGV2aWNlUGFyYW1zKSB7XG4gIHRoaXMuZGV2aWNlID0gdGhpcy5kZXRlcm1pbmVEZXZpY2VfKGRldmljZVBhcmFtcykgfHwgdGhpcy5kZXZpY2U7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXREZXZpY2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuc2V0Vmlld2VyID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIHRoaXMudmlld2VyID0gdmlld2VyO1xuICB0aGlzLmRpc3RvcnRpb24gPSBuZXcgRGlzdG9ydGlvbih0aGlzLnZpZXdlci5kaXN0b3J0aW9uQ29lZmZpY2llbnRzKTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmRldGVybWluZURldmljZV8gPSBmdW5jdGlvbihkZXZpY2VQYXJhbXMpIHtcbiAgaWYgKCFkZXZpY2VQYXJhbXMpIHtcbiAgICAvLyBObyBwYXJhbWV0ZXJzLCBzbyB1c2UgYSBkZWZhdWx0LlxuICAgIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICAgIGNvbnNvbGUud2FybignVXNpbmcgZmFsbGJhY2sgaU9TIGRldmljZSBtZWFzdXJlbWVudHMuJyk7XG4gICAgICByZXR1cm4gREVGQVVMVF9JT1M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybignVXNpbmcgZmFsbGJhY2sgQW5kcm9pZCBkZXZpY2UgbWVhc3VyZW1lbnRzLicpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfQU5EUk9JRDtcbiAgICB9XG4gIH1cblxuICAvLyBDb21wdXRlIGRldmljZSBzY3JlZW4gZGltZW5zaW9ucyBiYXNlZCBvbiBkZXZpY2VQYXJhbXMuXG4gIHZhciBNRVRFUlNfUEVSX0lOQ0ggPSAwLjAyNTQ7XG4gIHZhciBtZXRlcnNQZXJQaXhlbFggPSBNRVRFUlNfUEVSX0lOQ0ggLyBkZXZpY2VQYXJhbXMueGRwaTtcbiAgdmFyIG1ldGVyc1BlclBpeGVsWSA9IE1FVEVSU19QRVJfSU5DSCAvIGRldmljZVBhcmFtcy55ZHBpO1xuICB2YXIgd2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCk7XG4gIHZhciBoZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpO1xuICByZXR1cm4gbmV3IERldmljZSh7XG4gICAgd2lkdGhNZXRlcnM6IG1ldGVyc1BlclBpeGVsWCAqIHdpZHRoLFxuICAgIGhlaWdodE1ldGVyczogbWV0ZXJzUGVyUGl4ZWxZICogaGVpZ2h0LFxuICAgIGJldmVsTWV0ZXJzOiBkZXZpY2VQYXJhbXMuYmV2ZWxNbSAqIDAuMDAxLFxuICB9KTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBmaWVsZCBvZiB2aWV3IGZvciB0aGUgbGVmdCBleWUuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldERpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgLy8gRGV2aWNlLmhlaWdodCBhbmQgZGV2aWNlLndpZHRoIGZvciBkZXZpY2UgaW4gcG9ydHJhaXQgbW9kZSwgc28gdHJhbnNwb3NlLlxuICB2YXIgZXllVG9TY3JlZW5EaXN0YW5jZSA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG5cbiAgdmFyIG91dGVyRGlzdCA9IChkZXZpY2Uud2lkdGhNZXRlcnMgLSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UpIC8gMjtcbiAgdmFyIGlubmVyRGlzdCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDI7XG4gIHZhciBib3R0b21EaXN0ID0gdmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzO1xuICB2YXIgdG9wRGlzdCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLSBib3R0b21EaXN0O1xuXG4gIHZhciBvdXRlckFuZ2xlID0gTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQob3V0ZXJEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpO1xuICB2YXIgaW5uZXJBbmdsZSA9IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKFxuICAgICAgZGlzdG9ydGlvbi5kaXN0b3J0KGlubmVyRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcbiAgdmFyIGJvdHRvbUFuZ2xlID0gTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQoYm90dG9tRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcbiAgdmFyIHRvcEFuZ2xlID0gTWF0aFV0aWwucmFkVG9EZWcgKiBNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQodG9wRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKTtcblxuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBNYXRoLm1pbihvdXRlckFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICByaWdodERlZ3JlZXM6IE1hdGgubWluKGlubmVyQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIGRvd25EZWdyZWVzOiBNYXRoLm1pbihib3R0b21BbmdsZSwgdmlld2VyLmZvdiksXG4gICAgdXBEZWdyZWVzOiBNYXRoLm1pbih0b3BBbmdsZSwgdmlld2VyLmZvdilcbiAgfTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgdGFuLWFuZ2xlcyBmcm9tIHRoZSBtYXhpbXVtIEZPViBmb3IgdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZVZpc2libGVUYW5BbmdsZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIC8vIFRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4IEZPVi5cbiAgdmFyIGZvdkxlZnQgPSBNYXRoLnRhbigtTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgdmFyIGZvdlRvcCA9IE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIHZhciBmb3ZSaWdodCA9IE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdik7XG4gIHZhciBmb3ZCb3R0b20gPSBNYXRoLnRhbigtTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KTtcbiAgLy8gVmlld3BvcnQgc2l6ZS5cbiAgdmFyIGhhbGZXaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIDQ7XG4gIHZhciBoYWxmSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIDI7XG4gIC8vIFZpZXdwb3J0IGNlbnRlciwgbWVhc3VyZWQgZnJvbSBsZWZ0IGxlbnMgcG9zaXRpb24uXG4gIHZhciB2ZXJ0aWNhbExlbnNPZmZzZXQgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzIC0gaGFsZkhlaWdodCk7XG4gIHZhciBjZW50ZXJYID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMiAtIGhhbGZXaWR0aDtcbiAgdmFyIGNlbnRlclkgPSAtdmVydGljYWxMZW5zT2Zmc2V0O1xuICB2YXIgY2VudGVyWiA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIC8vIFRhbi1hbmdsZXMgb2YgdGhlIHZpZXdwb3J0IGVkZ2VzLCBhcyBzZWVuIHRocm91Z2ggdGhlIGxlbnMuXG4gIHZhciBzY3JlZW5MZWZ0ID0gZGlzdG9ydGlvbi5kaXN0b3J0KChjZW50ZXJYIC0gaGFsZldpZHRoKSAvIGNlbnRlclopO1xuICB2YXIgc2NyZWVuVG9wID0gZGlzdG9ydGlvbi5kaXN0b3J0KChjZW50ZXJZICsgaGFsZkhlaWdodCkgLyBjZW50ZXJaKTtcbiAgdmFyIHNjcmVlblJpZ2h0ID0gZGlzdG9ydGlvbi5kaXN0b3J0KChjZW50ZXJYICsgaGFsZldpZHRoKSAvIGNlbnRlclopO1xuICB2YXIgc2NyZWVuQm90dG9tID0gZGlzdG9ydGlvbi5kaXN0b3J0KChjZW50ZXJZIC0gaGFsZkhlaWdodCkgLyBjZW50ZXJaKTtcbiAgLy8gQ29tcGFyZSB0aGUgdHdvIHNldHMgb2YgdGFuLWFuZ2xlcyBhbmQgdGFrZSB0aGUgdmFsdWUgY2xvc2VyIHRvIHplcm8gb24gZWFjaCBzaWRlLlxuICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgcmVzdWx0WzBdID0gTWF0aC5tYXgoZm92TGVmdCwgc2NyZWVuTGVmdCk7XG4gIHJlc3VsdFsxXSA9IE1hdGgubWluKGZvdlRvcCwgc2NyZWVuVG9wKTtcbiAgcmVzdWx0WzJdID0gTWF0aC5taW4oZm92UmlnaHQsIHNjcmVlblJpZ2h0KTtcbiAgcmVzdWx0WzNdID0gTWF0aC5tYXgoZm92Qm90dG9tLCBzY3JlZW5Cb3R0b20pO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSB0YW4tYW5nbGVzIGZyb20gdGhlIG1heGltdW0gRk9WIGZvciB0aGUgbGVmdCBleWUgZm9yIHRoZVxuICogY3VycmVudCBkZXZpY2UgYW5kIHNjcmVlbiBwYXJhbWV0ZXJzLCBhc3N1bWluZyBubyBsZW5zZXMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVOb0xlbnNUYW5BbmdsZXMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG4gIHZhciBkaXN0b3J0aW9uID0gdGhpcy5kaXN0b3J0aW9uO1xuXG4gIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAvLyBUYW4tYW5nbGVzIGZyb20gdGhlIG1heCBGT1YuXG4gIHZhciBmb3ZMZWZ0ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbigtTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZUb3AgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICB2YXIgZm92UmlnaHQgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKE1hdGhVdGlsLmRlZ1RvUmFkICogdmlld2VyLmZvdikpO1xuICB2YXIgZm92Qm90dG9tID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbigtTWF0aFV0aWwuZGVnVG9SYWQgKiB2aWV3ZXIuZm92KSk7XG4gIC8vIFZpZXdwb3J0IHNpemUuXG4gIHZhciBoYWxmV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyA0O1xuICB2YXIgaGFsZkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyAyO1xuICAvLyBWaWV3cG9ydCBjZW50ZXIsIG1lYXN1cmVkIGZyb20gbGVmdCBsZW5zIHBvc2l0aW9uLlxuICB2YXIgdmVydGljYWxMZW5zT2Zmc2V0ID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycyAtIGhhbGZIZWlnaHQpO1xuICB2YXIgY2VudGVyWCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLSBoYWxmV2lkdGg7XG4gIHZhciBjZW50ZXJZID0gLXZlcnRpY2FsTGVuc09mZnNldDtcbiAgdmFyIGNlbnRlclogPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICAvLyBUYW4tYW5nbGVzIG9mIHRoZSB2aWV3cG9ydCBlZGdlcywgYXMgc2VlbiB0aHJvdWdoIHRoZSBsZW5zLlxuICB2YXIgc2NyZWVuTGVmdCA9IChjZW50ZXJYIC0gaGFsZldpZHRoKSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5Ub3AgPSAoY2VudGVyWSArIGhhbGZIZWlnaHQpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlblJpZ2h0ID0gKGNlbnRlclggKyBoYWxmV2lkdGgpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlbkJvdHRvbSA9IChjZW50ZXJZIC0gaGFsZkhlaWdodCkgLyBjZW50ZXJaO1xuICAvLyBDb21wYXJlIHRoZSB0d28gc2V0cyBvZiB0YW4tYW5nbGVzIGFuZCB0YWtlIHRoZSB2YWx1ZSBjbG9zZXIgdG8gemVybyBvbiBlYWNoIHNpZGUuXG4gIHJlc3VsdFswXSA9IE1hdGgubWF4KGZvdkxlZnQsIHNjcmVlbkxlZnQpO1xuICByZXN1bHRbMV0gPSBNYXRoLm1pbihmb3ZUb3AsIHNjcmVlblRvcCk7XG4gIHJlc3VsdFsyXSA9IE1hdGgubWluKGZvdlJpZ2h0LCBzY3JlZW5SaWdodCk7XG4gIHJlc3VsdFszXSA9IE1hdGgubWF4KGZvdkJvdHRvbSwgc2NyZWVuQm90dG9tKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc2NyZWVuIHJlY3RhbmdsZSB2aXNpYmxlIGZyb20gdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZVZpc2libGVTY3JlZW5SZWN0ID0gZnVuY3Rpb24odW5kaXN0b3J0ZWRGcnVzdHVtKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuXG4gIHZhciBkaXN0ID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVggPSAoZGV2aWNlLndpZHRoTWV0ZXJzIC0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlKSAvIDI7XG4gIHZhciBleWVZID0gdmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzO1xuICB2YXIgbGVmdCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMF0gKiBkaXN0ICsgZXllWCkgLyBkZXZpY2Uud2lkdGhNZXRlcnM7XG4gIHZhciB0b3AgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzFdICogZGlzdCArIGV5ZVkpIC8gZGV2aWNlLmhlaWdodE1ldGVycztcbiAgdmFyIHJpZ2h0ID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVsyXSAqIGRpc3QgKyBleWVYKSAvIGRldmljZS53aWR0aE1ldGVycztcbiAgdmFyIGJvdHRvbSA9ICh1bmRpc3RvcnRlZEZydXN0dW1bM10gKiBkaXN0ICsgZXllWSkgLyBkZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuICByZXR1cm4ge1xuICAgIHg6IGxlZnQsXG4gICAgeTogYm90dG9tLFxuICAgIHdpZHRoOiByaWdodCAtIGxlZnQsXG4gICAgaGVpZ2h0OiB0b3AgLSBib3R0b21cbiAgfTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKG9wdF9pc1VuZGlzdG9ydGVkKSB7XG4gIHJldHVybiBvcHRfaXNVbmRpc3RvcnRlZCA/IHRoaXMuZ2V0VW5kaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUoKSA6XG4gICAgICB0aGlzLmdldERpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSgpO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSA9IGZ1bmN0aW9uKG9wdF9pc1VuZGlzdG9ydGVkKSB7XG4gIHZhciBmb3YgPSB0aGlzLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZShvcHRfaXNVbmRpc3RvcnRlZCk7XG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IGZvdi5yaWdodERlZ3JlZXMsXG4gICAgcmlnaHREZWdyZWVzOiBmb3YubGVmdERlZ3JlZXMsXG4gICAgdXBEZWdyZWVzOiBmb3YudXBEZWdyZWVzLFxuICAgIGRvd25EZWdyZWVzOiBmb3YuZG93bkRlZ3JlZXNcbiAgfTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB1bmRpc3RvcnRlZCBmaWVsZCBvZiB2aWV3IGZvciB0aGUgbGVmdCBleWUuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5nZXRVbmRpc3RvcnRlZFBhcmFtc18oKTtcblxuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLm91dGVyRGlzdCksXG4gICAgcmlnaHREZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLmlubmVyRGlzdCksXG4gICAgZG93bkRlZ3JlZXM6IE1hdGhVdGlsLnJhZFRvRGVnICogTWF0aC5hdGFuKHAuYm90dG9tRGlzdCksXG4gICAgdXBEZWdyZWVzOiBNYXRoVXRpbC5yYWRUb0RlZyAqIE1hdGguYXRhbihwLnRvcERpc3QpXG4gIH07XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXRVbmRpc3RvcnRlZFZpZXdwb3J0TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcCA9IHRoaXMuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfKCk7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuXG4gIC8vIERpc3RhbmNlcyBzdG9yZWQgaW4gbG9jYWwgdmFyaWFibGVzIGFyZSBpbiB0YW4tYW5nbGUgdW5pdHMgdW5sZXNzIG90aGVyd2lzZVxuICAvLyBub3RlZC5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgc2NyZWVuV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciB4UHhQZXJUYW5BbmdsZSA9IGRldmljZS53aWR0aCAvIHNjcmVlbldpZHRoO1xuICB2YXIgeVB4UGVyVGFuQW5nbGUgPSBkZXZpY2UuaGVpZ2h0IC8gc2NyZWVuSGVpZ2h0O1xuXG4gIHZhciB4ID0gTWF0aC5yb3VuZCgocC5leWVQb3NYIC0gcC5vdXRlckRpc3QpICogeFB4UGVyVGFuQW5nbGUpO1xuICB2YXIgeSA9IE1hdGgucm91bmQoKHAuZXllUG9zWSAtIHAuYm90dG9tRGlzdCkgKiB5UHhQZXJUYW5BbmdsZSk7XG4gIHJldHVybiB7XG4gICAgeDogeCxcbiAgICB5OiB5LFxuICAgIHdpZHRoOiBNYXRoLnJvdW5kKChwLmV5ZVBvc1ggKyBwLmlubmVyRGlzdCkgKiB4UHhQZXJUYW5BbmdsZSkgLSB4LFxuICAgIGhlaWdodDogTWF0aC5yb3VuZCgocC5leWVQb3NZICsgcC50b3BEaXN0KSAqIHlQeFBlclRhbkFuZ2xlKSAtIHlcbiAgfTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgLy8gTW9zdCBvZiB0aGVzZSB2YXJpYWJsZXMgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICB2YXIgZXllVG9TY3JlZW5EaXN0YW5jZSA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG4gIHZhciBoYWxmTGVuc0Rpc3RhbmNlID0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlIC8gMiAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5XaWR0aCA9IGRldmljZS53aWR0aE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciBzY3JlZW5IZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcblxuICB2YXIgZXllUG9zWCA9IHNjcmVlbldpZHRoIC8gMiAtIGhhbGZMZW5zRGlzdGFuY2U7XG4gIHZhciBleWVQb3NZID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycykgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuXG4gIHZhciBtYXhGb3YgPSB2aWV3ZXIuZm92O1xuICB2YXIgdmlld2VyTWF4ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihNYXRoVXRpbC5kZWdUb1JhZCAqIG1heEZvdikpO1xuICB2YXIgb3V0ZXJEaXN0ID0gTWF0aC5taW4oZXllUG9zWCwgdmlld2VyTWF4KTtcbiAgdmFyIGlubmVyRGlzdCA9IE1hdGgubWluKGhhbGZMZW5zRGlzdGFuY2UsIHZpZXdlck1heCk7XG4gIHZhciBib3R0b21EaXN0ID0gTWF0aC5taW4oZXllUG9zWSwgdmlld2VyTWF4KTtcbiAgdmFyIHRvcERpc3QgPSBNYXRoLm1pbihzY3JlZW5IZWlnaHQgLSBleWVQb3NZLCB2aWV3ZXJNYXgpO1xuXG4gIHJldHVybiB7XG4gICAgb3V0ZXJEaXN0OiBvdXRlckRpc3QsXG4gICAgaW5uZXJEaXN0OiBpbm5lckRpc3QsXG4gICAgdG9wRGlzdDogdG9wRGlzdCxcbiAgICBib3R0b21EaXN0OiBib3R0b21EaXN0LFxuICAgIGV5ZVBvc1g6IGV5ZVBvc1gsXG4gICAgZXllUG9zWTogZXllUG9zWVxuICB9O1xufTtcblxuXG5mdW5jdGlvbiBDYXJkYm9hcmRWaWV3ZXIocGFyYW1zKSB7XG4gIC8vIEEgbWFjaGluZSByZWFkYWJsZSBJRC5cbiAgdGhpcy5pZCA9IHBhcmFtcy5pZDtcbiAgLy8gQSBodW1hbiByZWFkYWJsZSBsYWJlbC5cbiAgdGhpcy5sYWJlbCA9IHBhcmFtcy5sYWJlbDtcblxuICAvLyBGaWVsZCBvZiB2aWV3IGluIGRlZ3JlZXMgKHBlciBzaWRlKS5cbiAgdGhpcy5mb3YgPSBwYXJhbXMuZm92O1xuXG4gIC8vIERpc3RhbmNlIGJldHdlZW4gbGVucyBjZW50ZXJzIGluIG1ldGVycy5cbiAgdGhpcy5pbnRlckxlbnNEaXN0YW5jZSA9IHBhcmFtcy5pbnRlckxlbnNEaXN0YW5jZTtcbiAgLy8gRGlzdGFuY2UgYmV0d2VlbiB2aWV3ZXIgYmFzZWxpbmUgYW5kIGxlbnMgY2VudGVyIGluIG1ldGVycy5cbiAgdGhpcy5iYXNlbGluZUxlbnNEaXN0YW5jZSA9IHBhcmFtcy5iYXNlbGluZUxlbnNEaXN0YW5jZTtcbiAgLy8gU2NyZWVuLXRvLWxlbnMgZGlzdGFuY2UgaW4gbWV0ZXJzLlxuICB0aGlzLnNjcmVlbkxlbnNEaXN0YW5jZSA9IHBhcmFtcy5zY3JlZW5MZW5zRGlzdGFuY2U7XG5cbiAgLy8gRGlzdG9ydGlvbiBjb2VmZmljaWVudHMuXG4gIHRoaXMuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyA9IHBhcmFtcy5kaXN0b3J0aW9uQ29lZmZpY2llbnRzO1xuICAvLyBJbnZlcnNlIGRpc3RvcnRpb24gY29lZmZpY2llbnRzLlxuICAvLyBUT0RPOiBDYWxjdWxhdGUgdGhlc2UgZnJvbSBkaXN0b3J0aW9uQ29lZmZpY2llbnRzIGluIHRoZSBmdXR1cmUuXG4gIHRoaXMuaW52ZXJzZUNvZWZmaWNpZW50cyA9IHBhcmFtcy5pbnZlcnNlQ29lZmZpY2llbnRzO1xufVxuXG4vLyBFeHBvcnQgdmlld2VyIGluZm9ybWF0aW9uLlxuRGV2aWNlSW5mby5WaWV3ZXJzID0gVmlld2Vycztcbm1vZHVsZS5leHBvcnRzID0gRGV2aWNlSW5mbztcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIEhNRFZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuSE1EVlJEZXZpY2U7XG52YXIgUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG5cbi8qKlxuICogV3JhcHMgYSBWUkRpc3BsYXkgYW5kIGV4cG9zZXMgaXQgYXMgYSBITURWUkRldmljZVxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXlITUREZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpITUQ6JyArIGRpc3BsYXkuZGlzcGxheUlkO1xuICB0aGlzLmRldmljZU5hbWUgPSBkaXNwbGF5LmRpc3BsYXlOYW1lICsgJyAoSE1EKSc7XG59XG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlID0gbmV3IEhNRFZSRGV2aWNlKCk7XG5cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBleWVQYXJhbWV0ZXJzID0gdGhpcy5kaXNwbGF5LmdldEV5ZVBhcmFtZXRlcnMod2hpY2hFeWUpO1xuXG4gIHJldHVybiB7XG4gICAgY3VycmVudEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1heGltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICBtaW5pbXVtRmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgcmVjb21tZW5kZWRGaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICBleWVUcmFuc2xhdGlvbjogeyB4OiBleWVQYXJhbWV0ZXJzLm9mZnNldFswXSwgeTogZXllUGFyYW1ldGVycy5vZmZzZXRbMV0sIHo6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzJdIH0sXG4gICAgcmVuZGVyUmVjdDoge1xuICAgICAgeDogKHdoaWNoRXllID09ICdyaWdodCcpID8gZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCA6IDAsXG4gICAgICB5OiAwLFxuICAgICAgd2lkdGg6IGV5ZVBhcmFtZXRlcnMucmVuZGVyV2lkdGgsXG4gICAgICBoZWlnaHQ6IGV5ZVBhcmFtZXRlcnMucmVuZGVySGVpZ2h0XG4gICAgfVxuICB9O1xufTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5zZXRGaWVsZE9mVmlldyA9XG4gICAgZnVuY3Rpb24ob3B0X2ZvdkxlZnQsIG9wdF9mb3ZSaWdodCwgb3B0X3pOZWFyLCBvcHRfekZhcikge1xuICAvLyBOb3Qgc3VwcG9ydGVkLiBnZXRFeWVQYXJhbWV0ZXJzIHJlcG9ydHMgdGhhdCB0aGUgbWluLCBtYXgsIGFuZCByZWNvbW1lbmRlZFxuICAvLyBGb1YgaXMgYWxsIHRoZSBzYW1lLCBzbyBubyBhZGp1c3RtZW50IGNhbiBiZSBtYWRlLlxufTtcblxuLy8gVE9ETzogTmVlZCB0byBob29rIHJlcXVlc3RGdWxsc2NyZWVuIHRvIHNlZSBpZiBhIHdyYXBwZWQgVlJEaXNwbGF5IHdhcyBwYXNzZWRcbi8vIGluIGFzIGFuIG9wdGlvbi4gSWYgc28gd2Ugc2hvdWxkIHByZXZlbnQgdGhlIGRlZmF1bHQgZnVsbHNjcmVlbiBiZWhhdmlvciBhbmRcbi8vIGNhbGwgVlJEaXNwbGF5LnJlcXVlc3RQcmVzZW50IGluc3RlYWQuXG5cbi8qKlxuICogV3JhcHMgYSBWUkRpc3BsYXkgYW5kIGV4cG9zZXMgaXQgYXMgYSBQb3NpdGlvblNlbnNvclZSRGV2aWNlXG4gKi9cbmZ1bmN0aW9uIFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKGRpc3BsYXkpIHtcbiAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheTtcblxuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9seWZpbGw6UG9zaXRpb25TZW5zb3I6ICcgKyBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VOYW1lID0gZGlzcGxheS5kaXNwbGF5TmFtZSArICcgKFBvc2l0aW9uU2Vuc29yKSc7XG59XG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUgPSBuZXcgUG9zaXRpb25TZW5zb3JWUkRldmljZSgpO1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBvc2UgPSB0aGlzLmRpc3BsYXkuZ2V0UG9zZSgpO1xuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiBwb3NlLnBvc2l0aW9uID8geyB4OiBwb3NlLnBvc2l0aW9uWzBdLCB5OiBwb3NlLnBvc2l0aW9uWzFdLCB6OiBwb3NlLnBvc2l0aW9uWzJdIH0gOiBudWxsLFxuICAgIG9yaWVudGF0aW9uOiBwb3NlLm9yaWVudGF0aW9uID8geyB4OiBwb3NlLm9yaWVudGF0aW9uWzBdLCB5OiBwb3NlLm9yaWVudGF0aW9uWzFdLCB6OiBwb3NlLm9yaWVudGF0aW9uWzJdLCB3OiBwb3NlLm9yaWVudGF0aW9uWzNdIH0gOiBudWxsLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UucHJvdG90eXBlLnJlc2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucG9zaXRpb25EZXZpY2UucmVzZXRQb3NlKCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheUhNRERldmljZSA9IFZSRGlzcGxheUhNRERldmljZTtcbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG5cbiIsIi8qKlxuICogVE9ETyhzbXVzKTogSW1wbGVtZW50IGNvZWZmaWNpZW50IGludmVyc2lvbi5cbiAqL1xuZnVuY3Rpb24gRGlzdG9ydGlvbihjb2VmZmljaWVudHMpIHtcbiAgdGhpcy5jb2VmZmljaWVudHMgPSBjb2VmZmljaWVudHM7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBkaXN0b3J0aW9uIGZvciBhIHJhZGl1cy5cbiAqIDwvcD48cD5cbiAqIEFsbG93cyB0byBjb21wdXRlIHRoZSBvcmlnaW5hbCB1bmRpc3RvcnRlZCByYWRpdXMgZnJvbSBhIGRpc3RvcnRlZCBvbmUuXG4gKiBTZWUgYWxzbyBnZXRBcHByb3hpbWF0ZUludmVyc2VEaXN0b3J0aW9uKCkgZm9yIGEgZmFzdGVyIGJ1dCBwb3RlbnRpYWxseVxuICogbGVzcyBhY2N1cmF0ZSBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZGl1cyBEaXN0b3J0ZWQgcmFkaXVzIGZyb20gdGhlIGxlbnMgY2VudGVyIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIHVuZGlzdG9ydGVkIHJhZGl1cyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKi9cbkRpc3RvcnRpb24ucHJvdG90eXBlLmRpc3RvcnRJbnZlcnNlID0gZnVuY3Rpb24ocmFkaXVzKSB7XG4gIC8vIFNlY2FudCBtZXRob2QuXG4gIHZhciByMCA9IDA7XG4gIHZhciByMSA9IDE7XG4gIHZhciBkcjAgPSByYWRpdXMgLSB0aGlzLmRpc3RvcnQocjApO1xuICB3aGlsZSAoTWF0aC5hYnMocjEgLSByMCkgPiAwLjAwMDEgLyoqIDAuMW1tICovKSB7XG4gICAgdmFyIGRyMSA9IHJhZGl1cyAtIHRoaXMuZGlzdG9ydChyMSk7XG4gICAgdmFyIHIyID0gcjEgLSBkcjEgKiAoKHIxIC0gcjApIC8gKGRyMSAtIGRyMCkpO1xuICAgIHIwID0gcjE7XG4gICAgcjEgPSByMjtcbiAgICBkcjAgPSBkcjE7XG4gIH1cbiAgcmV0dXJuIHIxO1xufTtcblxuLyoqXG4gKiBEaXN0b3J0cyBhIHJhZGl1cyBieSBpdHMgZGlzdG9ydGlvbiBmYWN0b3IgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBsZW5zZXMuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZGl1cyBSYWRpdXMgZnJvbSB0aGUgbGVucyBjZW50ZXIgaW4gdGFuLWFuZ2xlIHVuaXRzLlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZGlzdG9ydGVkIHJhZGl1cyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKi9cbkRpc3RvcnRpb24ucHJvdG90eXBlLmRpc3RvcnQgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgdmFyIHIyID0gcmFkaXVzICogcmFkaXVzO1xuICB2YXIgcmV0ID0gMDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJldCA9IHIyICogKHJldCArIHRoaXMuY29lZmZpY2llbnRzW2ldKTtcbiAgfVxuICByZXR1cm4gKHJldCArIDEpICogcmFkaXVzO1xufTtcblxuLy8gRnVuY3Rpb25zIGJlbG93IHJvdWdobHkgcG9ydGVkIGZyb21cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9nb29nbGVzYW1wbGVzL2NhcmRib2FyZC11bml0eS9ibG9iL21hc3Rlci9DYXJkYm9hcmQvU2NyaXB0cy9DYXJkYm9hcmRQcm9maWxlLmNzI0w0MTJcblxuLy8gU29sdmVzIGEgc21hbGwgbGluZWFyIGVxdWF0aW9uIHZpYSBkZXN0cnVjdGl2ZSBnYXVzc2lhblxuLy8gZWxpbWluYXRpb24gYW5kIGJhY2sgc3Vic3RpdHV0aW9uLiAgVGhpcyBpc24ndCBnZW5lcmljIG51bWVyaWNcbi8vIGNvZGUsIGl0J3MganVzdCBhIHF1aWNrIGhhY2sgdG8gd29yayB3aXRoIHRoZSBnZW5lcmFsbHlcbi8vIHdlbGwtYmVoYXZlZCBzeW1tZXRyaWMgbWF0cmljZXMgZm9yIGxlYXN0LXNxdWFyZXMgZml0dGluZy5cbi8vIE5vdCBpbnRlbmRlZCBmb3IgcmV1c2UuXG4vL1xuLy8gQHBhcmFtIGEgSW5wdXQgcG9zaXRpdmUgZGVmaW5pdGUgc3ltbWV0cmljYWwgbWF0cml4LiBEZXN0cm95ZWRcbi8vICAgICBkdXJpbmcgY2FsY3VsYXRpb24uXG4vLyBAcGFyYW0geSBJbnB1dCByaWdodC1oYW5kLXNpZGUgdmFsdWVzLiBEZXN0cm95ZWQgZHVyaW5nIGNhbGN1bGF0aW9uLlxuLy8gQHJldHVybiBSZXN1bHRpbmcgeCB2YWx1ZSB2ZWN0b3IuXG4vL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuc29sdmVMaW5lYXJfID0gZnVuY3Rpb24oYSwgeSkge1xuICB2YXIgbiA9IGEubGVuZ3RoO1xuXG4gIC8vIEdhdXNzaWFuIGVsaW1pbmF0aW9uIChubyByb3cgZXhjaGFuZ2UpIHRvIHRyaWFuZ3VsYXIgbWF0cml4LlxuICAvLyBUaGUgaW5wdXQgbWF0cml4IGlzIGEgQV5UIEEgcHJvZHVjdCB3aGljaCBzaG91bGQgYmUgYSBwb3NpdGl2ZVxuICAvLyBkZWZpbml0ZSBzeW1tZXRyaWNhbCBtYXRyaXgsIGFuZCBpZiBJIHJlbWVtYmVyIG15IGxpbmVhclxuICAvLyBhbGdlYnJhIHJpZ2h0IHRoaXMgaW1wbGllcyB0aGF0IHRoZSBwaXZvdHMgd2lsbCBiZSBub256ZXJvIGFuZFxuICAvLyBjYWxjdWxhdGlvbnMgc3VmZmljaWVudGx5IGFjY3VyYXRlIHdpdGhvdXQgbmVlZGluZyByb3dcbiAgLy8gZXhjaGFuZ2UuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbiAtIDE7ICsraikge1xuICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IG47ICsraykge1xuICAgICAgdmFyIHAgPSBhW2pdW2tdIC8gYVtqXVtqXTtcbiAgICAgIGZvciAodmFyIGkgPSBqICsgMTsgaSA8IG47ICsraSkge1xuICAgICAgICBhW2ldW2tdIC09IHAgKiBhW2ldW2pdO1xuICAgICAgfVxuICAgICAgeVtrXSAtPSBwICogeVtqXTtcbiAgICB9XG4gIH1cbiAgLy8gRnJvbSB0aGlzIHBvaW50IG9uLCBvbmx5IHRoZSBtYXRyaXggZWxlbWVudHMgYVtqXVtpXSB3aXRoIGk+PWogYXJlXG4gIC8vIHZhbGlkLiBUaGUgZWxpbWluYXRpb24gZG9lc24ndCBmaWxsIGluIGVsaW1pbmF0ZWQgMCB2YWx1ZXMuXG5cbiAgdmFyIHggPSBuZXcgQXJyYXkobik7XG5cbiAgLy8gQmFjayBzdWJzdGl0dXRpb24uXG4gIGZvciAodmFyIGogPSBuIC0gMTsgaiA+PSAwOyAtLWopIHtcbiAgICB2YXIgdiA9IHlbal07XG4gICAgZm9yICh2YXIgaSA9IGogKyAxOyBpIDwgbjsgKytpKSB7XG4gICAgICB2IC09IGFbaV1bal0gKiB4W2ldO1xuICAgIH1cbiAgICB4W2pdID0gdiAvIGFbal1bal07XG4gIH1cblxuICByZXR1cm4geDtcbn07XG5cbi8vIFNvbHZlcyBhIGxlYXN0LXNxdWFyZXMgbWF0cml4IGVxdWF0aW9uLiAgR2l2ZW4gdGhlIGVxdWF0aW9uIEEgKiB4ID0geSwgY2FsY3VsYXRlIHRoZVxuLy8gbGVhc3Qtc3F1YXJlIGZpdCB4ID0gaW52ZXJzZShBICogdHJhbnNwb3NlKEEpKSAqIHRyYW5zcG9zZShBKSAqIHkuICBUaGUgd2F5IHRoaXMgd29ya3Ncbi8vIGlzIHRoYXQsIHdoaWxlIEEgaXMgdHlwaWNhbGx5IG5vdCBhIHNxdWFyZSBtYXRyaXggKGFuZCBoZW5jZSBub3QgaW52ZXJ0aWJsZSksIEEgKiB0cmFuc3Bvc2UoQSlcbi8vIGlzIGFsd2F5cyBzcXVhcmUuICBUaGF0IGlzOlxuLy8gICBBICogeCA9IHlcbi8vICAgdHJhbnNwb3NlKEEpICogKEEgKiB4KSA9IHRyYW5zcG9zZShBKSAqIHkgICA8LSBtdWx0aXBseSBib3RoIHNpZGVzIGJ5IHRyYW5zcG9zZShBKVxuLy8gICAodHJhbnNwb3NlKEEpICogQSkgKiB4ID0gdHJhbnNwb3NlKEEpICogeSAgIDwtIGFzc29jaWF0aXZpdHlcbi8vICAgeCA9IGludmVyc2UodHJhbnNwb3NlKEEpICogQSkgKiB0cmFuc3Bvc2UoQSkgKiB5ICA8LSBzb2x2ZSBmb3IgeFxuLy8gTWF0cml4IEEncyByb3cgY291bnQgKGZpcnN0IGluZGV4KSBtdXN0IG1hdGNoIHkncyB2YWx1ZSBjb3VudC4gIEEncyBjb2x1bW4gY291bnQgKHNlY29uZCBpbmRleClcbi8vIGRldGVybWluZXMgdGhlIGxlbmd0aCBvZiB0aGUgcmVzdWx0IHZlY3RvciB4LlxuRGlzdG9ydGlvbi5wcm90b3R5cGUuc29sdmVMZWFzdFNxdWFyZXNfID0gZnVuY3Rpb24obWF0QSwgdmVjWSkge1xuICB2YXIgaSwgaiwgaywgc3VtO1xuICB2YXIgbnVtU2FtcGxlcyA9IG1hdEEubGVuZ3RoO1xuICB2YXIgbnVtQ29lZmZpY2llbnRzID0gbWF0QVswXS5sZW5ndGg7XG4gIGlmIChudW1TYW1wbGVzICE9IHZlY1kuTGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWF0cml4IC8gdmVjdG9yIGRpbWVuc2lvbiBtaXNtYXRjaFwiKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSB0cmFuc3Bvc2UoQSkgKiBBXG4gIHZhciBtYXRBVEEgPSBuZXcgQXJyYXkobnVtQ29lZmZpY2llbnRzKTtcbiAgZm9yIChrID0gMDsgayA8IG51bUNvZWZmaWNpZW50czsgKytrKSB7XG4gICAgbWF0QVRBW2tdID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gICAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgICBzdW0gPSAwO1xuICAgICAgZm9yIChpID0gMDsgaSA8IG51bVNhbXBsZXM7ICsraSkge1xuICAgICAgICBzdW0gKz0gbWF0QVtqXVtpXSAqIG1hdEFba11baV07XG4gICAgICB9XG4gICAgICBtYXRBVEFba11bal0gPSBzdW07XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRyYW5zcG9zZShBKSAqIHlcbiAgdmFyIHZlY0FUWSA9IG5ldyBBcnJheShudW1Db2VmZmljaWVudHMpO1xuICBmb3IgKGogPSAwOyBqIDwgbnVtQ29lZmZpY2llbnRzOyArK2opIHtcbiAgICBzdW0gPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBudW1TYW1wbGVzOyArK2kpIHtcbiAgICAgIHN1bSArPSBtYXRBW2pdW2ldICogdmVjWVtpXTtcbiAgICB9XG4gICAgdmVjQVRZW2pdID0gc3VtO1xuICB9XG5cbiAgLy8gTm93IHNvbHZlIChBICogdHJhbnNwb3NlKEEpKSAqIHggPSB0cmFuc3Bvc2UoQSkgKiB5LlxuICByZXR1cm4gdGhpcy5zb2x2ZUxpbmVhcl8obWF0QVRBLCB2ZWNBVFkpO1xufTtcblxuLy8vIENhbGN1bGF0ZXMgYW4gYXBwcm94aW1hdGUgaW52ZXJzZSB0byB0aGUgZ2l2ZW4gcmFkaWFsIGRpc3RvcnRpb24gcGFyYW1ldGVycy5cbkRpc3RvcnRpb24ucHJvdG90eXBlLmFwcHJveGltYXRlSW52ZXJzZSA9IGZ1bmN0aW9uKG1heFJhZGl1cywgbnVtU2FtcGxlcykge1xuICBtYXhSYWRpdXMgPSBtYXhSYWRpdXMgfHwgMTtcbiAgbnVtU2FtcGxlcyA9IG51bVNhbXBsZXMgfHwgMTAwO1xuICB2YXIgbnVtQ29lZmZpY2llbnRzID0gNjtcbiAgdmFyIGksIGo7XG5cbiAgLy8gUiArIEsxKlJeMyArIEsyKlJeNSA9IHIsIHdpdGggUiA9IHJwID0gZGlzdG9ydChyKVxuICAvLyBSZXBlYXRpbmcgZm9yIG51bVNhbXBsZXM6XG4gIC8vICAgWyBSMF4zLCBSMF41IF0gKiBbIEsxIF0gPSBbIHIwIC0gUjAgXVxuICAvLyAgIFsgUjFeMywgUjFeNSBdICAgWyBLMiBdICAgWyByMSAtIFIxIF1cbiAgLy8gICBbIFIyXjMsIFIyXjUgXSAgICAgICAgICAgIFsgcjIgLSBSMiBdXG4gIC8vICAgWyBldGMuLi4gXSAgICAgICAgICAgICAgICBbIGV0Yy4uLiBdXG4gIC8vIFRoYXQgaXM6XG4gIC8vICAgbWF0QSAqIFtLMSwgSzJdID0geVxuICAvLyBTb2x2ZTpcbiAgLy8gICBbSzEsIEsyXSA9IGludmVyc2UodHJhbnNwb3NlKG1hdEEpICogbWF0QSkgKiB0cmFuc3Bvc2UobWF0QSkgKiB5XG4gIHZhciBtYXRBID0gbmV3IEFycmF5KG51bUNvZWZmaWNpZW50cyk7XG4gIGZvciAoaiA9IDA7IGogPCBudW1Db2VmZmljaWVudHM7ICsraikge1xuICAgIG1hdEFbal0gPSBuZXcgQXJyYXkobnVtU2FtcGxlcyk7XG4gIH1cbiAgdmFyIHZlY1kgPSBuZXcgQXJyYXkobnVtU2FtcGxlcyk7XG5cbiAgZm9yIChpID0gMDsgaSA8IG51bVNhbXBsZXM7ICsraSkge1xuICAgIHZhciByID0gbWF4UmFkaXVzICogKGkgKyAxKSAvIG51bVNhbXBsZXM7XG4gICAgdmFyIHJwID0gdGhpcy5kaXN0b3J0KHIpO1xuICAgIHZhciB2ID0gcnA7XG4gICAgZm9yIChqID0gMDsgaiA8IG51bUNvZWZmaWNpZW50czsgKytqKSB7XG4gICAgICB2ICo9IHJwICogcnA7XG4gICAgICBtYXRBW2pdW2ldID0gdjtcbiAgICB9XG4gICAgdmVjWVtpXSA9IHIgLSBycDtcbiAgfVxuXG4gIHZhciBpbnZlcnNlQ29lZmZpY2llbnRzID0gdGhpcy5zb2x2ZUxlYXN0U3F1YXJlc18obWF0QSwgdmVjWSk7XG5cbiAgcmV0dXJuIG5ldyBEaXN0b3J0aW9uKGludmVyc2VDb2VmZmljaWVudHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaXN0b3J0aW9uO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBEUERCIGNhY2hlLlxuICovXG52YXIgRFBEQl9DQUNIRSA9IHtcbiAgXCJmb3JtYXRcIjogMSxcbiAgXCJsYXN0X3VwZGF0ZWRcIjogXCIyMDE2LTAxLTIwVDAwOjE4OjM1WlwiLFxuICBcImRldmljZXNcIjogW1xuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImFzdXMvKi9OZXh1cyA3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzIwLjgsIDMyMy4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiYXN1cy8qL0FTVVNfWjAwQUQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBU1VTX1owMEFEXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuMCwgNDA0LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDNjQzNUxWVy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQzY0MzVMVldcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0OS43LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIFhMLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZSBYTFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE1LjMsIDMxNC42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcImh0Yy8qL05leHVzIDkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjg5LjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZSBNOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQyBPbmUgTTlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi41LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmVfTTgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lX004XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDkuNywgNDQ3LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDQ3Mi44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIdWF3ZWkvKi9OZXh1cyA2UC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDZQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTmV4dXMgNVgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA1WFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQxOS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHTVMzNDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMR01TMzQ1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjEuNywgMjE5LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEctRDgwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyNC4xIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEctRDg1MC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHLUQ4NTBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1NDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL1ZTOTg1IDRHLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiVlM5ODUgNEdcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUzNy45LCA1MzUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNSBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuOCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA0LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE5LjgsIDMxOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHLVA3NjkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMRy1QNzY5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDAuNiwgMjQ3LjUgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzMyMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHTVMzMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIwNi42LCAyMDQuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MR0xTOTk2LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEdMUzk5NlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMS41IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk1pY3JvbWF4LyovNDU2ME1NWC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIjQ1NjBNTVhcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyMTkuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJNaWNyb21heC8qL0EyNTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBMjUwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQ2LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi9NaWNyb21heCBBUTQ1MDEvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJNaWNyb21heCBBUTQ1MDFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNDAuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL0RST0lEIFJBWlIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJEUk9JRCBSQVpSXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzNjguMSwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDgzMEMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDgzMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTUuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAyMVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1Ni43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI1NC4wLCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDI4LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDI4XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMjYuNiwgMzI3LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMzQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMzRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMyNi42LCAzMjguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTUuMywgMzE2LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDE1NjIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDE1NjJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDIuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL05leHVzIDYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA2IFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDk0LjMsIDQ4OS43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDYzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDYzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyOTUuMCwgMjk2LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNjRcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI5NS4wLCAyOTUuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDkyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDkyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTA5NVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDIyLjAsIDQyMy40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9BMDAwMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkEwMDAxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuNCwgNDAxLjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBFMTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk9ORSBFMTAwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0MS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9uZVBsdXMvKi9PTkUgQTIwMDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJPTkUgQTIwMDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM5MS45LCA0MDUuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJPUFBPLyovWDkwOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlg5MDlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi40LCA0NDQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkwODIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTA4MlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTg0LjcsIDE4NS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMzYwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUczNjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxOTYuNywgMjA1LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL05leHVzIFMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyBTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMzQuNSwgMjI5LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNC44LCAzMDMuOSBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UMjMwTlUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1UMjMwTlVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyMTYuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0dILVQzOTkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTR0gtVDM5OVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIzMS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MDA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzODYuNCwgMzg3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU0FNU1VORy1TTS1OOTAwQS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNBTVNVTkctU00tTjkwMEFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM4Ni40LCAzODcuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTUwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjUsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5NTA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTk1MDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA0MzkuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDBGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkwMEZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQxNS42LCA0MzEuNiBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTAwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDE1LjYsIDQzMS42IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HODAwRi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc4MDBGXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMzI2LjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTA2Uy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MDZTXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1NjIuNywgNTcyLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMwNi43LCAzMDQuOCBdLFxuICAgIFwiYndcIjogNSxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tVDUzNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLVQ1MzVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDE0Mi42LCAxMzYuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTIwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MjBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MzAwSS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MzAwSVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA0LjgsIDMwNS44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTE5NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MTk1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDkuNCwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUw1MjAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtTDUyMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQ5LjQsIDI1NS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNHSC1JNzE3LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0FNU1VORy1TR0gtSTcxN1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDI4NS44LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU1BILUQ3MTAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTUEgtRDcxMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjE3LjcsIDIwNC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1ONzEwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULU43MTAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQ0gtSTYwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNDSC1JNjA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjY1LjEsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HYWxheHkgTmV4dXMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHYWxheHkgTmV4dXNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMxNS4zLCAzMTQuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tTjkxMEgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1OOTEwSFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTE1LjEsIDUxOC4wIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MTBDXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMiwgNTIwLjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzEzME0vKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HMTMwTVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTY1LjksIDE2NC44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjhJLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyOElcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyMEYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTIwRlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDU4MC42LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwUC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjBQXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MjIuNSwgNTc3LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjVGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyNUZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiA1ODAuNixcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyNVYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI1VlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTIyLjUsIDU3Ni42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9DNjkwMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkM2OTAzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNSwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovRDY2NTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJENjY1M1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDI4LjYsIDQyNy42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9FNjY1My8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkU2NjUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjguNiwgNDI1LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0U2ODUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiRTY4NTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDEuOSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovU0dQMzIxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0dQMzIxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMjQuNywgMjI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUQ1QvKi9BTENBVEVMIE9ORSBUT1VDSCBGaWVyY2UvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJBTENBVEVMIE9ORSBUT1VDSCBGaWVyY2VcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC4wLCAyNDcuNSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJUSEwvKi90aGwgNTAwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcInRobCA1MDAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0ODAuMCwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiWlRFLyovWlRFIEJsYWRlIEwyLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWlRFIEJsYWRlIEwyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjQwLjAsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCA5NjAgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMjUuMSwgMzI4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCAxMTM2IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgMzE3LjEsIDMyMC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDY0MCwgMTEzNiBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMxNy4xLCAzMjAuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA3NTAsIDEzMzQgXSB9IF0sXG4gICAgXCJkcGlcIjogMzI2LjQsXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDc1MCwgMTMzNCBdIH0gXSxcbiAgICBcImRwaVwiOiAzMjYuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgMTI0MiwgMjIwOCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDQ1My42LCA0NTguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyAxMjQyLCAyMjA4IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgNDUzLjYsIDQ1OC40IF0sXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9XG5dfTtcblxubW9kdWxlLmV4cG9ydHMgPSBEUERCX0NBQ0hFO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gT2ZmbGluZSBjYWNoZSBvZiB0aGUgRFBEQiwgdG8gYmUgdXNlZCB1bnRpbCB3ZSBsb2FkIHRoZSBvbmxpbmUgb25lIChhbmRcbi8vIGFzIGEgZmFsbGJhY2sgaW4gY2FzZSB3ZSBjYW4ndCBsb2FkIHRoZSBvbmxpbmUgb25lKS5cbnZhciBEUERCX0NBQ0hFID0gcmVxdWlyZSgnLi9kcGRiLWNhY2hlLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuLy8gT25saW5lIERQREIgVVJMLlxudmFyIE9OTElORV9EUERCX1VSTCA9ICdodHRwczovL3N0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vY2FyZGJvYXJkLWRwZGIvZHBkYi5qc29uJztcblxuLyoqXG4gKiBDYWxjdWxhdGVzIGRldmljZSBwYXJhbWV0ZXJzIGJhc2VkIG9uIHRoZSBEUERCIChEZXZpY2UgUGFyYW1ldGVyIERhdGFiYXNlKS5cbiAqIEluaXRpYWxseSwgdXNlcyB0aGUgY2FjaGVkIERQREIgdmFsdWVzLlxuICpcbiAqIElmIGZldGNoT25saW5lID09IHRydWUsIHRoZW4gdGhpcyBvYmplY3QgdHJpZXMgdG8gZmV0Y2ggdGhlIG9ubGluZSB2ZXJzaW9uXG4gKiBvZiB0aGUgRFBEQiBhbmQgdXBkYXRlcyB0aGUgZGV2aWNlIGluZm8gaWYgYSBiZXR0ZXIgbWF0Y2ggaXMgZm91bmQuXG4gKiBDYWxscyB0aGUgb25EZXZpY2VQYXJhbXNVcGRhdGVkIGNhbGxiYWNrIHdoZW4gdGhlcmUgaXMgYW4gdXBkYXRlIHRvIHRoZVxuICogZGV2aWNlIGluZm9ybWF0aW9uLlxuICovXG5mdW5jdGlvbiBEcGRiKGZldGNoT25saW5lLCBvbkRldmljZVBhcmFtc1VwZGF0ZWQpIHtcbiAgLy8gU3RhcnQgd2l0aCB0aGUgb2ZmbGluZSBEUERCIGNhY2hlIHdoaWxlIHdlIGFyZSBsb2FkaW5nIHRoZSByZWFsIG9uZS5cbiAgdGhpcy5kcGRiID0gRFBEQl9DQUNIRTtcblxuICAvLyBDYWxjdWxhdGUgZGV2aWNlIHBhcmFtcyBiYXNlZCBvbiB0aGUgb2ZmbGluZSB2ZXJzaW9uIG9mIHRoZSBEUERCLlxuICB0aGlzLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuXG4gIC8vIFhIUiB0byBmZXRjaCBvbmxpbmUgRFBEQiBmaWxlLCBpZiByZXF1ZXN0ZWQuXG4gIGlmIChmZXRjaE9ubGluZSkge1xuICAgIC8vIFNldCB0aGUgY2FsbGJhY2suXG4gICAgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWQgPSBvbkRldmljZVBhcmFtc1VwZGF0ZWQ7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgeGhyLm9wZW4oJ0dFVCcsIE9OTElORV9EUERCX1VSTCwgdHJ1ZSk7XG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIG9iai5sb2FkaW5nID0gZmFsc2U7XG4gICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8PSAyOTkpIHtcbiAgICAgICAgLy8gU3VjY2Vzcy5cbiAgICAgICAgb2JqLmRwZGIgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZSk7XG4gICAgICAgIG9iai5yZWNhbGN1bGF0ZURldmljZVBhcmFtc18oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEVycm9yIGxvYWRpbmcgdGhlIERQREIuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgb25saW5lIERQREIhJyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgeGhyLnNlbmQoKTtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIHRoZSBjdXJyZW50IGRldmljZSBwYXJhbWV0ZXJzLlxuRHBkYi5wcm90b3R5cGUuZ2V0RGV2aWNlUGFyYW1zID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmRldmljZVBhcmFtcztcbn07XG5cbi8vIFJlY2FsY3VsYXRlcyB0aGlzIGRldmljZSdzIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIuXG5EcGRiLnByb3RvdHlwZS5yZWNhbGN1bGF0ZURldmljZVBhcmFtc18gPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5ld0RldmljZVBhcmFtcyA9IHRoaXMuY2FsY0RldmljZVBhcmFtc18oKTtcbiAgaWYgKG5ld0RldmljZVBhcmFtcykge1xuICAgIHRoaXMuZGV2aWNlUGFyYW1zID0gbmV3RGV2aWNlUGFyYW1zO1xuICAgIC8vIEludm9rZSBjYWxsYmFjaywgaWYgaXQgaXMgc2V0LlxuICAgIGlmICh0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAgICAgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWQodGhpcy5kZXZpY2VQYXJhbXMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVjYWxjdWxhdGUgZGV2aWNlIHBhcmFtZXRlcnMuJyk7XG4gIH1cbn07XG5cbi8vIFJldHVybnMgYSBEZXZpY2VQYXJhbXMgb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgYmVzdCBndWVzcyBhcyB0byB0aGlzXG4vLyBkZXZpY2UncyBwYXJhbWV0ZXJzLiBDYW4gcmV0dXJuIG51bGwgaWYgdGhlIGRldmljZSBkb2VzIG5vdCBtYXRjaCBhbnlcbi8vIGtub3duIGRldmljZXMuXG5EcGRiLnByb3RvdHlwZS5jYWxjRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZGIgPSB0aGlzLmRwZGI7IC8vIHNob3J0aGFuZFxuICBpZiAoIWRiKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBub3QgYXZhaWxhYmxlLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGlmIChkYi5mb3JtYXQgIT0gMSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgaGFzIHVuZXhwZWN0ZWQgZm9ybWF0IHZlcnNpb24uJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKCFkYi5kZXZpY2VzIHx8ICFkYi5kZXZpY2VzLmxlbmd0aCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgZG9lcyBub3QgaGF2ZSBhIGRldmljZXMgc2VjdGlvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIEdldCB0aGUgYWN0dWFsIHVzZXIgYWdlbnQgYW5kIHNjcmVlbiBkaW1lbnNpb25zIGluIHBpeGVscy5cbiAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gIHZhciB3aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKTtcbiAgdmFyIGhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCk7XG5cbiAgaWYgKCFkYi5kZXZpY2VzKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBoYXMgbm8gZGV2aWNlcyBzZWN0aW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYi5kZXZpY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRldmljZSA9IGRiLmRldmljZXNbaV07XG4gICAgaWYgKCFkZXZpY2UucnVsZXMpIHtcbiAgICAgIGNvbnNvbGUud2FybignRGV2aWNlWycgKyBpICsgJ10gaGFzIG5vIHJ1bGVzIHNlY3Rpb24uJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoZGV2aWNlLnR5cGUgIT0gJ2lvcycgJiYgZGV2aWNlLnR5cGUgIT0gJ2FuZHJvaWQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0RldmljZVsnICsgaSArICddIGhhcyBpbnZhbGlkIHR5cGUuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBTZWUgaWYgdGhpcyBkZXZpY2UgaXMgb2YgdGhlIGFwcHJvcHJpYXRlIHR5cGUuXG4gICAgaWYgKFV0aWwuaXNJT1MoKSAhPSAoZGV2aWNlLnR5cGUgPT0gJ2lvcycpKSBjb250aW51ZTtcblxuICAgIC8vIFNlZSBpZiB0aGlzIGRldmljZSBtYXRjaGVzIGFueSBvZiB0aGUgcnVsZXM6XG4gICAgdmFyIG1hdGNoZWQgPSBmYWxzZTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRldmljZS5ydWxlcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIHJ1bGUgPSBkZXZpY2UucnVsZXNbal07XG4gICAgICBpZiAodGhpcy5tYXRjaFJ1bGVfKHJ1bGUsIHVzZXJBZ2VudCwgd2lkdGgsIGhlaWdodCkpIHtcbiAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIW1hdGNoZWQpIGNvbnRpbnVlO1xuXG4gICAgLy8gZGV2aWNlLmRwaSBtaWdodCBiZSBhbiBhcnJheSBvZiBbIHhkcGksIHlkcGldIG9yIGp1c3QgYSBzY2FsYXIuXG4gICAgdmFyIHhkcGkgPSBkZXZpY2UuZHBpWzBdIHx8IGRldmljZS5kcGk7XG4gICAgdmFyIHlkcGkgPSBkZXZpY2UuZHBpWzFdIHx8IGRldmljZS5kcGk7XG5cbiAgICByZXR1cm4gbmV3IERldmljZVBhcmFtcyh7IHhkcGk6IHhkcGksIHlkcGk6IHlkcGksIGJldmVsTW06IGRldmljZS5idyB9KTtcbiAgfVxuXG4gIGNvbnNvbGUud2FybignTm8gRFBEQiBkZXZpY2UgbWF0Y2guJyk7XG4gIHJldHVybiBudWxsO1xufTtcblxuRHBkYi5wcm90b3R5cGUubWF0Y2hSdWxlXyA9IGZ1bmN0aW9uKHJ1bGUsIHVhLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSB7XG4gIC8vIFdlIGNhbiBvbmx5IG1hdGNoICd1YScgYW5kICdyZXMnIHJ1bGVzLCBub3Qgb3RoZXIgdHlwZXMgbGlrZSAnbWRtaCdcbiAgLy8gKHdoaWNoIGFyZSBtZWFudCBmb3IgbmF0aXZlIHBsYXRmb3JtcykuXG4gIGlmICghcnVsZS51YSAmJiAhcnVsZS5yZXMpIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiBvdXIgdXNlciBhZ2VudCBzdHJpbmcgZG9lc24ndCBjb250YWluIHRoZSBpbmRpY2F0ZWQgdXNlciBhZ2VudCBzdHJpbmcsXG4gIC8vIHRoZSBtYXRjaCBmYWlscy5cbiAgaWYgKHJ1bGUudWEgJiYgdWEuaW5kZXhPZihydWxlLnVhKSA8IDApIHJldHVybiBmYWxzZTtcblxuICAvLyBJZiB0aGUgcnVsZSBzcGVjaWZpZXMgc2NyZWVuIGRpbWVuc2lvbnMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIG91cnMsXG4gIC8vIHRoZSBtYXRjaCBmYWlscy5cbiAgaWYgKHJ1bGUucmVzKSB7XG4gICAgaWYgKCFydWxlLnJlc1swXSB8fCAhcnVsZS5yZXNbMV0pIHJldHVybiBmYWxzZTtcbiAgICB2YXIgcmVzWCA9IHJ1bGUucmVzWzBdO1xuICAgIHZhciByZXNZID0gcnVsZS5yZXNbMV07XG4gICAgLy8gQ29tcGFyZSBtaW4gYW5kIG1heCBzbyBhcyB0byBtYWtlIHRoZSBvcmRlciBub3QgbWF0dGVyLCBpLmUuLCBpdCBzaG91bGRcbiAgICAvLyBiZSB0cnVlIHRoYXQgNjQweDQ4MCA9PSA0ODB4NjQwLlxuICAgIGlmIChNYXRoLm1pbihzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1pbihyZXNYLCByZXNZKSB8fFxuICAgICAgICAoTWF0aC5tYXgoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkgIT0gTWF0aC5tYXgocmVzWCwgcmVzWSkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIERldmljZVBhcmFtcyhwYXJhbXMpIHtcbiAgdGhpcy54ZHBpID0gcGFyYW1zLnhkcGk7XG4gIHRoaXMueWRwaSA9IHBhcmFtcy55ZHBpO1xuICB0aGlzLmJldmVsTW0gPSBwYXJhbXMuYmV2ZWxNbTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEcGRiO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV2ViVlJQb2x5ZmlsbCA9IHJlcXVpcmUoJy4vd2VidnItcG9seWZpbGwuanMnKS5XZWJWUlBvbHlmaWxsO1xuXG4vLyBJbml0aWFsaXplIGEgV2ViVlJDb25maWcganVzdCBpbiBjYXNlLlxud2luZG93LldlYlZSQ29uZmlnID0gVXRpbC5leHRlbmQoe1xuICAvLyBGb3JjZXMgYXZhaWxhYmlsaXR5IG9mIFZSIG1vZGUsIGV2ZW4gZm9yIG5vbi1tb2JpbGUgZGV2aWNlcy5cbiAgRk9SQ0VfRU5BQkxFX1ZSOiBmYWxzZSxcblxuICAvLyBDb21wbGVtZW50YXJ5IGZpbHRlciBjb2VmZmljaWVudC4gMCBmb3IgYWNjZWxlcm9tZXRlciwgMSBmb3IgZ3lyby5cbiAgS19GSUxURVI6IDAuOTgsXG5cbiAgLy8gSG93IGZhciBpbnRvIHRoZSBmdXR1cmUgdG8gcHJlZGljdCBkdXJpbmcgZmFzdCBtb3Rpb24gKGluIHNlY29uZHMpLlxuICBQUkVESUNUSU9OX1RJTUVfUzogMC4wNDAsXG5cbiAgLy8gRmxhZyB0byBlbmFibGUgdG91Y2ggcGFubmVyLiBJbiBjYXNlIHlvdSBoYXZlIHlvdXIgb3duIHRvdWNoIGNvbnRyb2xzLlxuICBUT1VDSF9QQU5ORVJfRElTQUJMRUQ6IHRydWUsXG5cbiAgLy8gRmxhZyB0byBkaXNhYmxlZCB0aGUgVUkgaW4gVlIgTW9kZS5cbiAgQ0FSREJPQVJEX1VJX0RJU0FCTEVEOiBmYWxzZSwgLy8gRGVmYXVsdDogZmFsc2VcblxuICAvLyBGbGFnIHRvIGRpc2FibGUgdGhlIGluc3RydWN0aW9ucyB0byByb3RhdGUgeW91ciBkZXZpY2UuXG4gIFJPVEFURV9JTlNUUlVDVElPTlNfRElTQUJMRUQ6IGZhbHNlLCAvLyBEZWZhdWx0OiBmYWxzZS5cblxuICAvLyBFbmFibGUgeWF3IHBhbm5pbmcgb25seSwgZGlzYWJsaW5nIHJvbGwgYW5kIHBpdGNoLiBUaGlzIGNhbiBiZSB1c2VmdWxcbiAgLy8gZm9yIHBhbm9yYW1hcyB3aXRoIG5vdGhpbmcgaW50ZXJlc3RpbmcgYWJvdmUgb3IgYmVsb3cuXG4gIFlBV19PTkxZOiBmYWxzZSxcblxuICAvLyBUbyBkaXNhYmxlIGtleWJvYXJkIGFuZCBtb3VzZSBjb250cm9scywgaWYgeW91IHdhbnQgdG8gdXNlIHlvdXIgb3duXG4gIC8vIGltcGxlbWVudGF0aW9uLlxuICBNT1VTRV9LRVlCT0FSRF9DT05UUk9MU19ESVNBQkxFRDogZmFsc2UsXG5cbiAgLy8gUHJldmVudCB0aGUgcG9seWZpbGwgZnJvbSBpbml0aWFsaXppbmcgaW1tZWRpYXRlbHkuIFJlcXVpcmVzIHRoZSBhcHBcbiAgLy8gdG8gY2FsbCBJbml0aWFsaXplV2ViVlJQb2x5ZmlsbCgpIGJlZm9yZSBpdCBjYW4gYmUgdXNlZC5cbiAgREVGRVJfSU5JVElBTElaQVRJT046IGZhbHNlLFxuXG4gIC8vIEVuYWJsZSB0aGUgZGVwcmVjYXRlZCB2ZXJzaW9uIG9mIHRoZSBBUEkgKG5hdmlnYXRvci5nZXRWUkRldmljZXMpLlxuICBFTkFCTEVfREVQUkVDQVRFRF9BUEk6IGZhbHNlLFxuXG4gIC8vIFNjYWxlcyB0aGUgcmVjb21tZW5kZWQgYnVmZmVyIHNpemUgcmVwb3J0ZWQgYnkgV2ViVlIsIHdoaWNoIGNhbiBpbXByb3ZlXG4gIC8vIHBlcmZvcm1hbmNlLlxuICAvLyBVUERBVEUoMjAxNi0wNS0wMyk6IFNldHRpbmcgdGhpcyB0byAwLjUgYnkgZGVmYXVsdCBzaW5jZSAxLjAgZG9lcyBub3RcbiAgLy8gcGVyZm9ybSB3ZWxsIG9uIG1hbnkgbW9iaWxlIGRldmljZXMuXG4gIEJVRkZFUl9TQ0FMRTogMC41LFxuXG4gIC8vIEFsbG93IFZSRGlzcGxheS5zdWJtaXRGcmFtZSB0byBjaGFuZ2UgZ2wgYmluZGluZ3MsIHdoaWNoIGlzIG1vcmVcbiAgLy8gZWZmaWNpZW50IGlmIHRoZSBhcHBsaWNhdGlvbiBjb2RlIHdpbGwgcmUtYmluZCBpdHMgcmVzb3VyY2VzIG9uIHRoZVxuICAvLyBuZXh0IGZyYW1lIGFueXdheS4gVGhpcyBoYXMgYmVlbiBzZWVuIHRvIGNhdXNlIHJlbmRlcmluZyBnbGl0Y2hlcyB3aXRoXG4gIC8vIFRIUkVFLmpzLlxuICAvLyBEaXJ0eSBiaW5kaW5ncyBpbmNsdWRlOiBnbC5GUkFNRUJVRkZFUl9CSU5ESU5HLCBnbC5DVVJSRU5UX1BST0dSQU0sXG4gIC8vIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HLFxuICAvLyBhbmQgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEIGZvciB0ZXh0dXJlIHVuaXQgMC5cbiAgRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTOiBmYWxzZVxufSwgd2luZG93LldlYlZSQ29uZmlnKTtcblxuaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuREVGRVJfSU5JVElBTElaQVRJT04pIHtcbiAgbmV3IFdlYlZSUG9seWZpbGwoKTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5Jbml0aWFsaXplV2ViVlJQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgIG5ldyBXZWJWUlBvbHlmaWxsKCk7XG4gIH1cbn1cbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBNYXRoVXRpbCA9IHdpbmRvdy5NYXRoVXRpbCB8fCB7fTtcblxuTWF0aFV0aWwuZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuTWF0aFV0aWwucmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXG4vLyBTb21lIG1pbmltYWwgbWF0aCBmdW5jdGlvbmFsaXR5IGJvcnJvd2VkIGZyb20gVEhSRUUuTWF0aCBhbmQgc3RyaXBwZWQgZG93blxuLy8gZm9yIHRoZSBwdXJwb3NlcyBvZiB0aGlzIGxpYnJhcnkuXG5cblxuTWF0aFV0aWwuVmVjdG9yMiA9IGZ1bmN0aW9uICggeCwgeSApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG59O1xuXG5NYXRoVXRpbC5WZWN0b3IyLnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IE1hdGhVdGlsLlZlY3RvcjIsXG5cbiAgc2V0OiBmdW5jdGlvbiAoIHgsIHkgKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCB2ICkge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzdWJWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdGhpcy54ID0gYS54IC0gYi54O1xuICAgIHRoaXMueSA9IGEueSAtIGIueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuVmVjdG9yMyA9IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjMucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuVmVjdG9yMyxcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGNvcHk6IGZ1bmN0aW9uICggdiApIHtcbiAgICB0aGlzLnggPSB2Lng7XG4gICAgdGhpcy55ID0gdi55O1xuICAgIHRoaXMueiA9IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGxlbmd0aDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiApO1xuICB9LFxuXG4gIG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzY2FsYXIgPSB0aGlzLmxlbmd0aCgpO1xuXG4gICAgaWYgKCBzY2FsYXIgIT09IDAgKSB7XG4gICAgICB2YXIgaW52U2NhbGFyID0gMSAvIHNjYWxhcjtcblxuICAgICAgdGhpcy5tdWx0aXBseVNjYWxhcihpbnZTY2FsYXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uICggc2NhbGFyICkge1xuICAgIHRoaXMueCAqPSBzY2FsYXI7XG4gICAgdGhpcy55ICo9IHNjYWxhcjtcbiAgICB0aGlzLnogKj0gc2NhbGFyO1xuICB9LFxuXG4gIGFwcGx5UXVhdGVybmlvbjogZnVuY3Rpb24gKCBxICkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuICAgIHZhciB6ID0gdGhpcy56O1xuXG4gICAgdmFyIHF4ID0gcS54O1xuICAgIHZhciBxeSA9IHEueTtcbiAgICB2YXIgcXogPSBxLno7XG4gICAgdmFyIHF3ID0gcS53O1xuXG4gICAgLy8gY2FsY3VsYXRlIHF1YXQgKiB2ZWN0b3JcbiAgICB2YXIgaXggPSAgcXcgKiB4ICsgcXkgKiB6IC0gcXogKiB5O1xuICAgIHZhciBpeSA9ICBxdyAqIHkgKyBxeiAqIHggLSBxeCAqIHo7XG4gICAgdmFyIGl6ID0gIHF3ICogeiArIHF4ICogeSAtIHF5ICogeDtcbiAgICB2YXIgaXcgPSAtIHF4ICogeCAtIHF5ICogeSAtIHF6ICogejtcblxuICAgIC8vIGNhbGN1bGF0ZSByZXN1bHQgKiBpbnZlcnNlIHF1YXRcbiAgICB0aGlzLnggPSBpeCAqIHF3ICsgaXcgKiAtIHF4ICsgaXkgKiAtIHF6IC0gaXogKiAtIHF5O1xuICAgIHRoaXMueSA9IGl5ICogcXcgKyBpdyAqIC0gcXkgKyBpeiAqIC0gcXggLSBpeCAqIC0gcXo7XG4gICAgdGhpcy56ID0gaXogKiBxdyArIGl3ICogLSBxeiArIGl4ICogLSBxeSAtIGl5ICogLSBxeDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRvdDogZnVuY3Rpb24gKCB2ICkge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XG4gIH0sXG5cbiAgY3Jvc3NWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgdmFyIGF4ID0gYS54LCBheSA9IGEueSwgYXogPSBhLno7XG4gICAgdmFyIGJ4ID0gYi54LCBieSA9IGIueSwgYnogPSBiLno7XG5cbiAgICB0aGlzLnggPSBheSAqIGJ6IC0gYXogKiBieTtcbiAgICB0aGlzLnkgPSBheiAqIGJ4IC0gYXggKiBiejtcbiAgICB0aGlzLnogPSBheCAqIGJ5IC0gYXkgKiBieDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbiA9IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgdGhpcy54ID0geCB8fCAwO1xuICB0aGlzLnkgPSB5IHx8IDA7XG4gIHRoaXMueiA9IHogfHwgMDtcbiAgdGhpcy53ID0gKCB3ICE9PSB1bmRlZmluZWQgKSA/IHcgOiAxO1xufTtcblxuTWF0aFV0aWwuUXVhdGVybmlvbi5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5RdWF0ZXJuaW9uLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5LCB6LCB3ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuICAgIHRoaXMudyA9IHc7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHF1YXRlcm5pb24gKSB7XG4gICAgdGhpcy54ID0gcXVhdGVybmlvbi54O1xuICAgIHRoaXMueSA9IHF1YXRlcm5pb24ueTtcbiAgICB0aGlzLnogPSBxdWF0ZXJuaW9uLno7XG4gICAgdGhpcy53ID0gcXVhdGVybmlvbi53O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUV1bGVyWFlaOiBmdW5jdGlvbiggeCwgeSwgeiApIHtcbiAgICB2YXIgYzEgPSBNYXRoLmNvcyggeCAvIDIgKTtcbiAgICB2YXIgYzIgPSBNYXRoLmNvcyggeSAvIDIgKTtcbiAgICB2YXIgYzMgPSBNYXRoLmNvcyggeiAvIDIgKTtcbiAgICB2YXIgczEgPSBNYXRoLnNpbiggeCAvIDIgKTtcbiAgICB2YXIgczIgPSBNYXRoLnNpbiggeSAvIDIgKTtcbiAgICB2YXIgczMgPSBNYXRoLnNpbiggeiAvIDIgKTtcblxuICAgIHRoaXMueCA9IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMztcbiAgICB0aGlzLnkgPSBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczM7XG4gICAgdGhpcy56ID0gYzEgKiBjMiAqIHMzICsgczEgKiBzMiAqIGMzO1xuICAgIHRoaXMudyA9IGMxICogYzIgKiBjMyAtIHMxICogczIgKiBzMztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlcllYWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyAtIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgKyBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tQXhpc0FuZ2xlOiBmdW5jdGlvbiAoIGF4aXMsIGFuZ2xlICkge1xuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2dlb21ldHJ5L3JvdGF0aW9ucy9jb252ZXJzaW9ucy9hbmdsZVRvUXVhdGVybmlvbi9pbmRleC5odG1cbiAgICAvLyBhc3N1bWVzIGF4aXMgaXMgbm9ybWFsaXplZFxuXG4gICAgdmFyIGhhbGZBbmdsZSA9IGFuZ2xlIC8gMiwgcyA9IE1hdGguc2luKCBoYWxmQW5nbGUgKTtcblxuICAgIHRoaXMueCA9IGF4aXMueCAqIHM7XG4gICAgdGhpcy55ID0gYXhpcy55ICogcztcbiAgICB0aGlzLnogPSBheGlzLnogKiBzO1xuICAgIHRoaXMudyA9IE1hdGguY29zKCBoYWxmQW5nbGUgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG11bHRpcGx5OiBmdW5jdGlvbiAoIHEgKSB7XG4gICAgcmV0dXJuIHRoaXMubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGhpcywgcSApO1xuICB9LFxuXG4gIG11bHRpcGx5UXVhdGVybmlvbnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICAvLyBmcm9tIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvY29kZS9pbmRleC5odG1cblxuICAgIHZhciBxYXggPSBhLngsIHFheSA9IGEueSwgcWF6ID0gYS56LCBxYXcgPSBhLnc7XG4gICAgdmFyIHFieCA9IGIueCwgcWJ5ID0gYi55LCBxYnogPSBiLnosIHFidyA9IGIudztcblxuICAgIHRoaXMueCA9IHFheCAqIHFidyArIHFhdyAqIHFieCArIHFheSAqIHFieiAtIHFheiAqIHFieTtcbiAgICB0aGlzLnkgPSBxYXkgKiBxYncgKyBxYXcgKiBxYnkgKyBxYXogKiBxYnggLSBxYXggKiBxYno7XG4gICAgdGhpcy56ID0gcWF6ICogcWJ3ICsgcWF3ICogcWJ6ICsgcWF4ICogcWJ5IC0gcWF5ICogcWJ4O1xuICAgIHRoaXMudyA9IHFhdyAqIHFidyAtIHFheCAqIHFieCAtIHFheSAqIHFieSAtIHFheiAqIHFiejtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGludmVyc2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnggKj0gLTE7XG4gICAgdGhpcy55ICo9IC0xO1xuICAgIHRoaXMueiAqPSAtMTtcblxuICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbCA9IE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICsgdGhpcy53ICogdGhpcy53ICk7XG5cbiAgICBpZiAoIGwgPT09IDAgKSB7XG4gICAgICB0aGlzLnggPSAwO1xuICAgICAgdGhpcy55ID0gMDtcbiAgICAgIHRoaXMueiA9IDA7XG4gICAgICB0aGlzLncgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBsID0gMSAvIGw7XG5cbiAgICAgIHRoaXMueCA9IHRoaXMueCAqIGw7XG4gICAgICB0aGlzLnkgPSB0aGlzLnkgKiBsO1xuICAgICAgdGhpcy56ID0gdGhpcy56ICogbDtcbiAgICAgIHRoaXMudyA9IHRoaXMudyAqIGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2xlcnA6IGZ1bmN0aW9uICggcWIsIHQgKSB7XG4gICAgaWYgKCB0ID09PSAwICkgcmV0dXJuIHRoaXM7XG4gICAgaWYgKCB0ID09PSAxICkgcmV0dXJuIHRoaXMuY29weSggcWIgKTtcblxuICAgIHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB6ID0gdGhpcy56LCB3ID0gdGhpcy53O1xuXG4gICAgLy8gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvYWxnZWJyYS9yZWFsTm9ybWVkQWxnZWJyYS9xdWF0ZXJuaW9ucy9zbGVycC9cblxuICAgIHZhciBjb3NIYWxmVGhldGEgPSB3ICogcWIudyArIHggKiBxYi54ICsgeSAqIHFiLnkgKyB6ICogcWIuejtcblxuICAgIGlmICggY29zSGFsZlRoZXRhIDwgMCApIHtcbiAgICAgIHRoaXMudyA9IC0gcWIudztcbiAgICAgIHRoaXMueCA9IC0gcWIueDtcbiAgICAgIHRoaXMueSA9IC0gcWIueTtcbiAgICAgIHRoaXMueiA9IC0gcWIuejtcblxuICAgICAgY29zSGFsZlRoZXRhID0gLSBjb3NIYWxmVGhldGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29weSggcWIgKTtcbiAgICB9XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA+PSAxLjAgKSB7XG4gICAgICB0aGlzLncgPSB3O1xuICAgICAgdGhpcy54ID0geDtcbiAgICAgIHRoaXMueSA9IHk7XG4gICAgICB0aGlzLnogPSB6O1xuXG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgaGFsZlRoZXRhID0gTWF0aC5hY29zKCBjb3NIYWxmVGhldGEgKTtcbiAgICB2YXIgc2luSGFsZlRoZXRhID0gTWF0aC5zcXJ0KCAxLjAgLSBjb3NIYWxmVGhldGEgKiBjb3NIYWxmVGhldGEgKTtcblxuICAgIGlmICggTWF0aC5hYnMoIHNpbkhhbGZUaGV0YSApIDwgMC4wMDEgKSB7XG4gICAgICB0aGlzLncgPSAwLjUgKiAoIHcgKyB0aGlzLncgKTtcbiAgICAgIHRoaXMueCA9IDAuNSAqICggeCArIHRoaXMueCApO1xuICAgICAgdGhpcy55ID0gMC41ICogKCB5ICsgdGhpcy55ICk7XG4gICAgICB0aGlzLnogPSAwLjUgKiAoIHogKyB0aGlzLnogKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIHJhdGlvQSA9IE1hdGguc2luKCAoIDEgLSB0ICkgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YSxcbiAgICByYXRpb0IgPSBNYXRoLnNpbiggdCAqIGhhbGZUaGV0YSApIC8gc2luSGFsZlRoZXRhO1xuXG4gICAgdGhpcy53ID0gKCB3ICogcmF0aW9BICsgdGhpcy53ICogcmF0aW9CICk7XG4gICAgdGhpcy54ID0gKCB4ICogcmF0aW9BICsgdGhpcy54ICogcmF0aW9CICk7XG4gICAgdGhpcy55ID0gKCB5ICogcmF0aW9BICsgdGhpcy55ICogcmF0aW9CICk7XG4gICAgdGhpcy56ID0gKCB6ICogcmF0aW9BICsgdGhpcy56ICogcmF0aW9CICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tVW5pdFZlY3RvcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBodHRwOi8vbG9sZW5naW5lLm5ldC9ibG9nLzIwMTQvMDIvMjQvcXVhdGVybmlvbi1mcm9tLXR3by12ZWN0b3JzLWZpbmFsXG4gICAgLy8gYXNzdW1lcyBkaXJlY3Rpb24gdmVjdG9ycyB2RnJvbSBhbmQgdlRvIGFyZSBub3JtYWxpemVkXG5cbiAgICB2YXIgdjEsIHI7XG4gICAgdmFyIEVQUyA9IDAuMDAwMDAxO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICggdkZyb20sIHZUbyApIHtcbiAgICAgIGlmICggdjEgPT09IHVuZGVmaW5lZCApIHYxID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICAgICAgciA9IHZGcm9tLmRvdCggdlRvICkgKyAxO1xuXG4gICAgICBpZiAoIHIgPCBFUFMgKSB7XG4gICAgICAgIHIgPSAwO1xuXG4gICAgICAgIGlmICggTWF0aC5hYnMoIHZGcm9tLnggKSA+IE1hdGguYWJzKCB2RnJvbS56ICkgKSB7XG4gICAgICAgICAgdjEuc2V0KCAtIHZGcm9tLnksIHZGcm9tLngsIDAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2MS5zZXQoIDAsIC0gdkZyb20ueiwgdkZyb20ueSApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2MS5jcm9zc1ZlY3RvcnMoIHZGcm9tLCB2VG8gKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy54ID0gdjEueDtcbiAgICAgIHRoaXMueSA9IHYxLnk7XG4gICAgICB0aGlzLnogPSB2MS56O1xuICAgICAgdGhpcy53ID0gcjtcblxuICAgICAgdGhpcy5ub3JtYWxpemUoKTtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9KCksXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hdGhVdGlsO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG4vLyBIb3cgbXVjaCB0byByb3RhdGUgcGVyIGtleSBzdHJva2UuXG52YXIgS0VZX1NQRUVEID0gMC4xNTtcbnZhciBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OID0gODA7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBmb3IgbW91c2UgZXZlbnRzLlxudmFyIE1PVVNFX1NQRUVEX1ggPSAwLjU7XG52YXIgTU9VU0VfU1BFRURfWSA9IDAuMztcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW91c2UgYW5kIGtleWJvYXJkIGlucHV0LiBEZXNpZ25lZCBmb3IgZGVza3RvcHMvbGFwdG9wc1xuICogd2hlcmUgb3JpZW50YXRpb24gZXZlbnRzIGFyZW4ndCBzdXBwb3J0ZWQuIENhbm5vdCBwcmVzZW50LlxuICovXG5mdW5jdGlvbiBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ01vdXNlIGFuZCBLZXlib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuXG4gIC8vIEF0dGFjaCB0byBtb3VzZSBhbmQga2V5Ym9hcmQgZXZlbnRzLlxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMub25LZXlEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlRG93bl8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlVXBfLmJpbmQodGhpcykpO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcblxuICAvLyBWYXJpYWJsZXMgZm9yIGtleWJvYXJkLWJhc2VkIHJvdGF0aW9uIGFuaW1hdGlvbi5cbiAgdGhpcy50YXJnZXRBbmdsZV8gPSBudWxsO1xuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IG51bGw7XG5cbiAgLy8gU3RhdGUgdmFyaWFibGVzIGZvciBjYWxjdWxhdGlvbnMuXG4gIHRoaXMub3JpZW50YXRpb25fID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcblxuICAvLyBWYXJpYWJsZXMgZm9yIG1vdXNlLWJhc2VkIHJvdGF0aW9uLlxuICB0aGlzLnJvdGF0ZVN0YXJ0XyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRW5kXyA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGFfID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlID0gbmV3IFZSRGlzcGxheSgpO1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb25fLnNldEZyb21FdWxlcllYWih0aGlzLnBoaV8sIHRoaXMudGhldGFfLCAwKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IHRoaXMub3JpZW50YXRpb25fLng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gdGhpcy5vcmllbnRhdGlvbl8ueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSB0aGlzLm9yaWVudGF0aW9uXy56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IHRoaXMub3JpZW50YXRpb25fLnc7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5vcmllbnRhdGlvbk91dF8sXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbktleURvd25fID0gZnVuY3Rpb24oZSkge1xuICAvLyBUcmFjayBXQVNEIGFuZCBhcnJvdyBrZXlzLlxuICBpZiAoZS5rZXlDb2RlID09IDM4KSB7IC8vIFVwIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyArIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM5KSB7IC8vIFJpZ2h0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSA0MCkgeyAvLyBEb3duIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM3KSB7IC8vIExlZnQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyArIEtFWV9TUEVFRCk7XG4gIH1cbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVUaGV0YV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3RoZXRhXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVQaGlfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGFyZ2V0QW5nbGUgPSBVdGlsLmNsYW1wKHRhcmdldEFuZ2xlLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3BoaV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGFuIGFuaW1hdGlvbiB0byB0cmFuc2l0aW9uIGFuIGFuZ2xlIGZyb20gb25lIHZhbHVlIHRvIGFub3RoZXIuXG4gKi9cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18gPSBmdW5jdGlvbihhbmdsZU5hbWUsIHRhcmdldEFuZ2xlKSB7XG4gIC8vIElmIGFuIGFuaW1hdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZywgY2FuY2VsIGl0LlxuICBpZiAodGhpcy5hbmdsZUFuaW1hdGlvbl8pIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gIH1cbiAgdmFyIHN0YXJ0QW5nbGUgPSB0aGlzW2FuZ2xlTmFtZV07XG4gIHZhciBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAvLyBTZXQgdXAgYW4gaW50ZXJ2YWwgdGltZXIgdG8gcGVyZm9ybSB0aGUgYW5pbWF0aW9uLlxuICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBhbmltYXRlKCkge1xuICAgIC8vIE9uY2Ugd2UncmUgZmluaXNoZWQgdGhlIGFuaW1hdGlvbiwgd2UncmUgZG9uZS5cbiAgICB2YXIgZWxhcHNlZCA9IG5ldyBEYXRlKCkgLSBzdGFydFRpbWU7XG4gICAgaWYgKGVsYXBzZWQgPj0gS0VZX0FOSU1BVElPTl9EVVJBVElPTikge1xuICAgICAgdGhpc1thbmdsZU5hbWVdID0gdGFyZ2V0QW5nbGU7XG4gICAgICBjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuZ2xlQW5pbWF0aW9uXyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGxvb3Agd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB0aGlzLmFuZ2xlQW5pbWF0aW9uXyA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlLmJpbmQodGhpcykpXG4gICAgLy8gTGluZWFybHkgaW50ZXJwb2xhdGUgdGhlIGFuZ2xlIHNvbWUgYW1vdW50LlxuICAgIHZhciBwZXJjZW50ID0gZWxhcHNlZCAvIEtFWV9BTklNQVRJT05fRFVSQVRJT047XG4gICAgdGhpc1thbmdsZU5hbWVdID0gc3RhcnRBbmdsZSArICh0YXJnZXRBbmdsZSAtIHN0YXJ0QW5nbGUpICogcGVyY2VudDtcbiAgfS5iaW5kKHRoaXMpKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VEb3duXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5yb3RhdGVTdGFydF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IHRydWU7XG59O1xuXG4vLyBWZXJ5IHNpbWlsYXIgdG8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vbXJmbGl4LzgzNTEwMjBcbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzRHJhZ2dpbmdfICYmICF0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBTdXBwb3J0IHBvaW50ZXIgbG9jayBBUEkuXG4gIGlmICh0aGlzLmlzUG9pbnRlckxvY2tlZF8oKSkge1xuICAgIHZhciBtb3ZlbWVudFggPSBlLm1vdmVtZW50WCB8fCBlLm1vek1vdmVtZW50WCB8fCAwO1xuICAgIHZhciBtb3ZlbWVudFkgPSBlLm1vdmVtZW50WSB8fCBlLm1vek1vdmVtZW50WSB8fCAwO1xuICAgIHRoaXMucm90YXRlRW5kXy5zZXQodGhpcy5yb3RhdGVTdGFydF8ueCAtIG1vdmVtZW50WCwgdGhpcy5yb3RhdGVTdGFydF8ueSAtIG1vdmVtZW50WSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldChlLmNsaWVudFgsIGUuY2xpZW50WSk7XG4gIH1cbiAgLy8gQ2FsY3VsYXRlIGhvdyBtdWNoIHdlIG1vdmVkIGluIG1vdXNlIHNwYWNlLlxuICB0aGlzLnJvdGF0ZURlbHRhXy5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kXywgdGhpcy5yb3RhdGVTdGFydF8pO1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5jb3B5KHRoaXMucm90YXRlRW5kXyk7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB0aGUgY3VtdWxhdGl2ZSBldWxlciBhbmdsZXMuXG4gIHRoaXMucGhpXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnkgLyBzY3JlZW4uaGVpZ2h0ICogTU9VU0VfU1BFRURfWTtcbiAgdGhpcy50aGV0YV8gKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhXy54IC8gc2NyZWVuLndpZHRoICogTU9VU0VfU1BFRURfWDtcblxuICAvLyBQcmV2ZW50IGxvb2tpbmcgdG9vIGZhciB1cCBvciBkb3duLlxuICB0aGlzLnBoaV8gPSBVdGlsLmNsYW1wKHRoaXMucGhpXywgLU1hdGguUEkvMiwgTWF0aC5QSS8yKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uTW91c2VVcF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNEcmFnZ2luZ18gPSBmYWxzZTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmlzUG9pbnRlckxvY2tlZF8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50IHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50O1xuICByZXR1cm4gZWwgIT09IHVuZGVmaW5lZDtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBoaV8gPSAwO1xuICB0aGlzLnRoZXRhXyA9IDA7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXk7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBSb3RhdGVJbnN0cnVjdGlvbnMoKSB7XG4gIHRoaXMubG9hZEljb25fKCk7XG5cbiAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBvdmVybGF5LnN0eWxlO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy50b3AgPSAwO1xuICBzLnJpZ2h0ID0gMDtcbiAgcy5ib3R0b20gPSAwO1xuICBzLmxlZnQgPSAwO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICdncmF5JztcbiAgcy5mb250RmFtaWx5ID0gJ3NhbnMtc2VyaWYnO1xuICAvLyBGb3JjZSB0aGlzIHRvIGJlIGFib3ZlIHRoZSBmdWxsc2NyZWVuIGNhbnZhcywgd2hpY2ggaXMgYXQgekluZGV4OiA5OTk5OTkuXG4gIHMuekluZGV4ID0gMTAwMDAwMDtcblxuICB2YXIgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGltZy5zcmMgPSB0aGlzLmljb247XG4gIHZhciBzID0gaW1nLnN0eWxlO1xuICBzLm1hcmdpbkxlZnQgPSAnMjUlJztcbiAgcy5tYXJnaW5Ub3AgPSAnMjUlJztcbiAgcy53aWR0aCA9ICc1MCUnO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKGltZyk7XG5cbiAgdmFyIHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSB0ZXh0LnN0eWxlO1xuICBzLnRleHRBbGlnbiA9ICdjZW50ZXInO1xuICBzLmZvbnRTaXplID0gJzE2cHgnO1xuICBzLmxpbmVIZWlnaHQgPSAnMjRweCc7XG4gIHMubWFyZ2luID0gJzI0cHggMjUlJztcbiAgcy53aWR0aCA9ICc1MCUnO1xuICB0ZXh0LmlubmVySFRNTCA9ICdQbGFjZSB5b3VyIHBob25lIGludG8geW91ciBDYXJkYm9hcmQgdmlld2VyLic7XG4gIG92ZXJsYXkuYXBwZW5kQ2hpbGQodGV4dCk7XG5cbiAgdmFyIHNuYWNrYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gc25hY2tiYXIuc3R5bGU7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJyNDRkQ4REMnO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy5ib3R0b20gPSAwO1xuICBzLndpZHRoID0gJzEwMCUnO1xuICBzLmhlaWdodCA9ICc0OHB4JztcbiAgcy5wYWRkaW5nID0gJzE0cHggMjRweCc7XG4gIHMuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBzLmNvbG9yID0gJyM2NTZBNkInO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHNuYWNrYmFyKTtcblxuICB2YXIgc25hY2tiYXJUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHNuYWNrYmFyVGV4dC5zdHlsZS5mbG9hdCA9ICdsZWZ0JztcbiAgc25hY2tiYXJUZXh0LmlubmVySFRNTCA9ICdObyBDYXJkYm9hcmQgdmlld2VyPyc7XG5cbiAgdmFyIHNuYWNrYmFyQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBzbmFja2JhckJ1dHRvbi5ocmVmID0gJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vZ2V0L2NhcmRib2FyZC9nZXQtY2FyZGJvYXJkLyc7XG4gIHNuYWNrYmFyQnV0dG9uLmlubmVySFRNTCA9ICdnZXQgb25lJztcbiAgc25hY2tiYXJCdXR0b24udGFyZ2V0ID0gJ19ibGFuayc7XG4gIHZhciBzID0gc25hY2tiYXJCdXR0b24uc3R5bGU7XG4gIHMuZmxvYXQgPSAncmlnaHQnO1xuICBzLmZvbnRXZWlnaHQgPSA2MDA7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmJvcmRlckxlZnQgPSAnMXB4IHNvbGlkIGdyYXknO1xuICBzLnBhZGRpbmdMZWZ0ID0gJzI0cHgnO1xuICBzLnRleHREZWNvcmF0aW9uID0gJ25vbmUnO1xuICBzLmNvbG9yID0gJyM2NTZBNkInO1xuXG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyVGV4dCk7XG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyQnV0dG9uKTtcblxuICB0aGlzLm92ZXJsYXkgPSBvdmVybGF5O1xuICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gIHRoaXMuaGlkZSgpO1xufVxuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgaWYgKCFwYXJlbnQgJiYgIXRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9IGVsc2UgaWYgKHBhcmVudCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAmJiB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAhPSBwYXJlbnQpXG4gICAgICB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLm92ZXJsYXkpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMub3ZlcmxheSk7XG4gIH1cblxuICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgdmFyIGltZyA9IHRoaXMub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgdmFyIHMgPSBpbWcuc3R5bGU7XG5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICBzLndpZHRoID0gJzIwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzQwJSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMyUnO1xuICB9IGVsc2Uge1xuICAgIHMud2lkdGggPSAnNTAlJztcbiAgICBzLm1hcmdpbkxlZnQgPSAnMjUlJztcbiAgICBzLm1hcmdpblRvcCA9ICcyNSUnO1xuICB9XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3dUZW1wb3JhcmlseSA9IGZ1bmN0aW9uKG1zLCBwYXJlbnQpIHtcbiAgdGhpcy5zaG93KHBhcmVudCk7XG4gIHRoaXMudGltZXIgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZS5iaW5kKHRoaXMpLCBtcyk7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmRpc2FibGVTaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbigpIHtcbiAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5KCk7XG4gIC8vIEluIHBvcnRyYWl0IFZSIG1vZGUsIHRlbGwgdGhlIHVzZXIgdG8gcm90YXRlIHRvIGxhbmRzY2FwZS4gT3RoZXJ3aXNlLCBoaWRlXG4gIC8vIHRoZSBpbnN0cnVjdGlvbnMuXG4gIGlmICghVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSAmJiBVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICB0aGlzLnNob3coKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhpZGUoKTtcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5sb2FkSWNvbl8gPSBmdW5jdGlvbigpIHtcbiAgLy8gRW5jb2RlZCBhc3NldF9zcmMvcm90YXRlLWluc3RydWN0aW9ucy5zdmdcbiAgdGhpcy5pY29uID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrQ2p4emRtY2dkMmxrZEdnOUlqRTVPSEI0SWlCb1pXbG5hSFE5SWpJME1IQjRJaUIyYVdWM1FtOTRQU0l3SURBZ01UazRJREkwTUNJZ2RtVnljMmx2YmowaU1TNHhJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGh0Ykc1ek9uaHNhVzVyUFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eE9UazVMM2hzYVc1cklpQjRiV3h1Y3pwemEyVjBZMmc5SW1oMGRIQTZMeTkzZDNjdVltOW9aVzFwWVc1amIyUnBibWN1WTI5dEwzTnJaWFJqYUM5dWN5SStDaUFnSUNBOElTMHRJRWRsYm1WeVlYUnZjam9nVTJ0bGRHTm9JRE11TXk0eklDZ3hNakE0TVNrZ0xTQm9kSFJ3T2k4dmQzZDNMbUp2YUdWdGFXRnVZMjlrYVc1bkxtTnZiUzl6YTJWMFkyZ2dMUzArQ2lBZ0lDQThkR2wwYkdVK2RISmhibk5wZEdsdmJqd3ZkR2wwYkdVK0NpQWdJQ0E4WkdWell6NURjbVZoZEdWa0lIZHBkR2dnVTJ0bGRHTm9Mand2WkdWell6NEtJQ0FnSUR4a1pXWnpQand2WkdWbWN6NEtJQ0FnSUR4bklHbGtQU0pRWVdkbExURWlJSE4wY205clpUMGlibTl1WlNJZ2MzUnliMnRsTFhkcFpIUm9QU0l4SWlCbWFXeHNQU0p1YjI1bElpQm1hV3hzTFhKMWJHVTlJbVYyWlc1dlpHUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxQmhaMlVpUGdvZ0lDQWdJQ0FnSUR4bklHbGtQU0owY21GdWMybDBhVzl1SWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5CY25SaWIyRnlaRWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdjZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRRdEt5MUpiWEJ2Y25SbFpDMU1ZWGxsY25NdFEyOXdlUzByTFVsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUSXRRMjl3ZVNJZ2MydGxkR05vT25SNWNHVTlJazFUVEdGNVpYSkhjbTkxY0NJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFp5QnBaRDBpU1cxd2IzSjBaV1F0VEdGNVpYSnpMVU52Y0hrdE5DSWdkSEpoYm5ObWIzSnRQU0owY21GdWMyeGhkR1VvTUM0d01EQXdNREFzSURFd055NHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqWXlOU3d5TGpVeU55QkRNVFE1TGpZeU5Td3lMalV5TnlBeE5UVXVPREExTERZdU1EazJJREUxTmk0ek5qSXNOaTQwTVRnZ1RERTFOaTR6TmpJc055NHpNRFFnUXpFMU5pNHpOaklzTnk0ME9ERWdNVFUyTGpNM05TdzNMalkyTkNBeE5UWXVOQ3czTGpnMU15QkRNVFUyTGpReExEY3VPVE0wSURFMU5pNDBNaXc0TGpBeE5TQXhOVFl1TkRJM0xEZ3VNRGsxSUVNeE5UWXVOVFkzTERrdU5URWdNVFUzTGpRd01Td3hNUzR3T1RNZ01UVTRMalV6TWl3eE1pNHdPVFFnVERFMk5DNHlOVElzTVRjdU1UVTJJRXd4TmpRdU16TXpMREUzTGpBMk5pQkRNVFkwTGpNek15d3hOeTR3TmpZZ01UWTRMamN4TlN3eE5DNDFNellnTVRZNUxqVTJPQ3d4TkM0d05ESWdRekUzTVM0d01qVXNNVFF1T0RneklERTVOUzQxTXpnc01qa3VNRE0xSURFNU5TNDFNemdzTWprdU1ETTFJRXd4T1RVdU5UTTRMRGd6TGpBek5pQkRNVGsxTGpVek9DdzRNeTQ0TURjZ01UazFMakUxTWl3NE5DNHlOVE1nTVRrMExqVTVMRGcwTGpJMU15QkRNVGswTGpNMU55dzROQzR5TlRNZ01UazBMakE1TlN3NE5DNHhOemNnTVRrekxqZ3hPQ3c0TkM0d01UY2dUREUyT1M0NE5URXNOekF1TVRjNUlFd3hOamt1T0RNM0xEY3dMakl3TXlCTU1UUXlMalV4TlN3NE5TNDVOemdnVERFME1TNDJOalVzT0RRdU5qVTFJRU14TXpZdU9UTTBMRGd6TGpFeU5pQXhNekV1T1RFM0xEZ3hMamt4TlNBeE1qWXVOekUwTERneExqQTBOU0JETVRJMkxqY3dPU3c0TVM0d05pQXhNall1TnpBM0xEZ3hMakEyT1NBeE1qWXVOekEzTERneExqQTJPU0JNTVRJeExqWTBMRGs0TGpBeklFd3hNVE11TnpRNUxERXdNaTQxT0RZZ1RERXhNeTQzTVRJc01UQXlMalV5TXlCTU1URXpMamN4TWl3eE16QXVNVEV6SUVNeE1UTXVOekV5TERFek1DNDRPRFVnTVRFekxqTXlOaXd4TXpFdU16TWdNVEV5TGpjMk5Dd3hNekV1TXpNZ1F6RXhNaTQxTXpJc01UTXhMak16SURFeE1pNHlOamtzTVRNeExqSTFOQ0F4TVRFdU9Ua3lMREV6TVM0d09UUWdURFk1TGpVeE9Td3hNRFl1TlRjeUlFTTJPQzQxTmprc01UQTJMakF5TXlBMk55NDNPVGtzTVRBMExqWTVOU0EyTnk0M09Ua3NNVEF6TGpZd05TQk1OamN1TnprNUxERXdNaTQxTnlCTU5qY3VOemM0TERFd01pNDJNVGNnUXpZM0xqSTNMREV3TWk0ek9UTWdOall1TmpRNExERXdNaTR5TkRrZ05qVXVPVFl5TERFd01pNHlNVGdnUXpZMUxqZzNOU3d4TURJdU1qRTBJRFkxTGpjNE9Dd3hNREl1TWpFeUlEWTFMamN3TVN3eE1ESXVNakV5SUVNMk5TNDJNRFlzTVRBeUxqSXhNaUEyTlM0MU1URXNNVEF5TGpJeE5TQTJOUzQwTVRZc01UQXlMakl4T1NCRE5qVXVNVGsxTERFd01pNHlNamtnTmpRdU9UYzBMREV3TWk0eU16VWdOalF1TnpVMExERXdNaTR5TXpVZ1F6WTBMak16TVN3eE1ESXVNak0xSURZekxqa3hNU3d4TURJdU1qRTJJRFl6TGpRNU9Dd3hNREl1TVRjNElFTTJNUzQ0TkRNc01UQXlMakF5TlNBMk1DNHlPVGdzTVRBeExqVTNPQ0ExT1M0d09UUXNNVEF3TGpnNE1pQk1NVEl1TlRFNExEY3pMams1TWlCTU1USXVOVEl6TERjMExqQXdOQ0JNTWk0eU5EVXNOVFV1TWpVMElFTXhMakkwTkN3MU15NDBNamNnTWk0d01EUXNOVEV1TURNNElETXVPVFF6TERRNUxqa3hPQ0JNTlRrdU9UVTBMREUzTGpVM015QkROakF1TmpJMkxERTNMakU0TlNBMk1TNHpOU3d4Tnk0d01ERWdOakl1TURVekxERTNMakF3TVNCRE5qTXVNemM1TERFM0xqQXdNU0EyTkM0Mk1qVXNNVGN1TmpZZ05qVXVNamdzTVRndU9EVTBJRXcyTlM0eU9EVXNNVGd1T0RVeElFdzJOUzQxTVRJc01Ua3VNalkwSUV3Mk5TNDFNRFlzTVRrdU1qWTRJRU0yTlM0NU1Ea3NNakF1TURBeklEWTJMalF3TlN3eU1DNDJPQ0EyTmk0NU9ETXNNakV1TWpnMklFdzJOeTR5Tml3eU1TNDFOVFlnUXpZNUxqRTNOQ3d5TXk0ME1EWWdOekV1TnpJNExESTBMak0xTnlBM05DNHpOek1zTWpRdU16VTNJRU0zTmk0ek1qSXNNalF1TXpVM0lEYzRMak15TVN3eU15NDROQ0E0TUM0eE5EZ3NNakl1TnpnMUlFTTRNQzR4TmpFc01qSXVOemcxSURnM0xqUTJOeXd4T0M0MU5qWWdPRGN1TkRZM0xERTRMalUyTmlCRE9EZ3VNVE01TERFNExqRTNPQ0E0T0M0NE5qTXNNVGN1T1RrMElEZzVMalUyTml3eE55NDVPVFFnUXprd0xqZzVNaXd4Tnk0NU9UUWdPVEl1TVRNNExERTRMalkxTWlBNU1pNDNPVElzTVRrdU9EUTNJRXc1Tmk0d05ESXNNalV1TnpjMUlFdzVOaTR3TmpRc01qVXVOelUzSUV3eE1ESXVPRFE1TERJNUxqWTNOQ0JNTVRBeUxqYzBOQ3d5T1M0ME9USWdUREUwT1M0Mk1qVXNNaTQxTWpjZ1RURTBPUzQyTWpVc01DNDRPVElnUXpFME9TNHpORE1zTUM0NE9USWdNVFE1TGpBMk1pd3dMamsyTlNBeE5EZ3VPREVzTVM0eE1TQk1NVEF5TGpZME1Td3lOeTQyTmpZZ1REazNMakl6TVN3eU5DNDFORElnVERrMExqSXlOaXd4T1M0d05qRWdRemt6TGpNeE15d3hOeTR6T1RRZ09URXVOVEkzTERFMkxqTTFPU0E0T1M0MU5qWXNNVFl1TXpVNElFTTRPQzQxTlRVc01UWXVNelU0SURnM0xqVTBOaXd4Tmk0Mk16SWdPRFl1TmpRNUxERTNMakUxSUVNNE15NDROemdzTVRndU56VWdOemt1TmpnM0xESXhMakUyT1NBM09TNHpOelFzTWpFdU16UTFJRU0zT1M0ek5Ua3NNakV1TXpVeklEYzVMak0wTlN3eU1TNHpOakVnTnprdU16TXNNakV1TXpZNUlFTTNOeTQzT1Rnc01qSXVNalUwSURjMkxqQTROQ3d5TWk0M01qSWdOelF1TXpjekxESXlMamN5TWlCRE56SXVNRGd4TERJeUxqY3lNaUEyT1M0NU5Ua3NNakV1T0RrZ05qZ3VNemszTERJd0xqTTRJRXcyT0M0eE5EVXNNakF1TVRNMUlFTTJOeTQzTURZc01Ua3VOamN5SURZM0xqTXlNeXd4T1M0eE5UWWdOamN1TURBMkxERTRMall3TVNCRE5qWXVPVGc0TERFNExqVTFPU0EyTmk0NU5qZ3NNVGd1TlRFNUlEWTJMamswTml3eE9DNDBOemtnVERZMkxqY3hPU3d4T0M0d05qVWdRelkyTGpZNUxERTRMakF4TWlBMk5pNDJOVGdzTVRjdU9UWWdOall1TmpJMExERTNMamt4TVNCRE5qVXVOamcyTERFMkxqTXpOeUEyTXk0NU5URXNNVFV1TXpZMklEWXlMakExTXl3eE5TNHpOallnUXpZeExqQTBNaXd4TlM0ek5qWWdOakF1TURNekxERTFMalkwSURVNUxqRXpOaXd4Tmk0eE5UZ2dURE11TVRJMUxEUTRMalV3TWlCRE1DNDBNallzTlRBdU1EWXhJQzB3TGpZeE15dzFNeTQwTkRJZ01DNDRNVEVzTlRZdU1EUWdUREV4TGpBNE9TdzNOQzQzT1NCRE1URXVNalkyTERjMUxqRXhNeUF4TVM0MU16Y3NOelV1TXpVeklERXhMamcxTERjMUxqUTVOQ0JNTlRndU1qYzJMREV3TWk0eU9UZ2dRelU1TGpZM09Td3hNRE11TVRBNElEWXhMalF6TXl3eE1ETXVOak1nTmpNdU16UTRMREV3TXk0NE1EWWdRell6TGpneE1pd3hNRE11T0RRNElEWTBMakk0TlN3eE1ETXVPRGNnTmpRdU56VTBMREV3TXk0NE55QkROalVzTVRBekxqZzNJRFkxTGpJME9Td3hNRE11T0RZMElEWTFMalE1TkN3eE1ETXVPRFV5SUVNMk5TNDFOak1zTVRBekxqZzBPU0EyTlM0Mk16SXNNVEF6TGpnME55QTJOUzQzTURFc01UQXpMamcwTnlCRE5qVXVOelkwTERFd015NDRORGNnTmpVdU9ESTRMREV3TXk0NE5Ea2dOalV1T0Rrc01UQXpMamcxTWlCRE5qVXVPVGcyTERFd015NDROVFlnTmpZdU1EZ3NNVEF6TGpnMk15QTJOaTR4TnpNc01UQXpMamczTkNCRE5qWXVNamd5TERFd05TNDBOamNnTmpjdU16TXlMREV3Tnk0eE9UY2dOamd1TnpBeUxERXdOeTQ1T0RnZ1RERXhNUzR4TnpRc01UTXlMalV4SUVNeE1URXVOams0TERFek1pNDRNVElnTVRFeUxqSXpNaXd4TXpJdU9UWTFJREV4TWk0M05qUXNNVE15TGprMk5TQkRNVEUwTGpJMk1Td3hNekl1T1RZMUlERXhOUzR6TkRjc01UTXhMamMyTlNBeE1UVXVNelEzTERFek1DNHhNVE1nVERFeE5TNHpORGNzTVRBekxqVTFNU0JNTVRJeUxqUTFPQ3c1T1M0ME5EWWdRekV5TWk0NE1Ua3NPVGt1TWpNM0lERXlNeTR3T0Rjc09UZ3VPRGs0SURFeU15NHlNRGNzT1RndU5EazRJRXd4TWpjdU9EWTFMRGd5TGprd05TQkRNVE15TGpJM09TdzRNeTQzTURJZ01UTTJMalUxTnl3NE5DNDNOVE1nTVRRd0xqWXdOeXc0Tmk0d016TWdUREUwTVM0eE5DdzROaTQ0TmpJZ1F6RTBNUzQwTlRFc09EY3VNelEySURFME1TNDVOemNzT0RjdU5qRXpJREUwTWk0MU1UWXNPRGN1TmpFeklFTXhOREl1TnprMExEZzNMall4TXlBeE5ETXVNRGMyTERnM0xqVTBNaUF4TkRNdU16TXpMRGczTGpNNU15Qk1NVFk1TGpnMk5TdzNNaTR3TnpZZ1RERTVNeXc0TlM0ME16TWdRekU1TXk0MU1qTXNPRFV1TnpNMUlERTVOQzR3TlRnc09EVXVPRGc0SURFNU5DNDFPU3c0TlM0NE9EZ2dRekU1Tmk0d09EY3NPRFV1T0RnNElERTVOeTR4TnpNc09EUXVOamc1SURFNU55NHhOek1zT0RNdU1ETTJJRXd4T1RjdU1UY3pMREk1TGpBek5TQkRNVGszTGpFM015d3lPQzQwTlRFZ01UazJMamcyTVN3eU55NDVNVEVnTVRrMkxqTTFOU3d5Tnk0Mk1Ua2dRekU1Tmk0ek5UVXNNamN1TmpFNUlERTNNUzQ0TkRNc01UTXVORFkzSURFM01DNHpPRFVzTVRJdU5qSTJJRU14TnpBdU1UTXlMREV5TGpRNElERTJPUzQ0TlN3eE1pNDBNRGNnTVRZNUxqVTJPQ3d4TWk0ME1EY2dRekUyT1M0eU9EVXNNVEl1TkRBM0lERTJPUzR3TURJc01USXVORGd4SURFMk9DNDNORGtzTVRJdU5qSTNJRU14TmpndU1UUXpMREV5TGprM09DQXhOalV1TnpVMkxERTBMak0xTnlBeE5qUXVOREkwTERFMUxqRXlOU0JNTVRVNUxqWXhOU3d4TUM0NE55QkRNVFU0TGpjNU5pd3hNQzR4TkRVZ01UVTRMakUxTkN3NExqa3pOeUF4TlRndU1EVTBMRGN1T1RNMElFTXhOVGd1TURRMUxEY3VPRE0zSURFMU9DNHdNelFzTnk0M016a2dNVFU0TGpBeU1TdzNMalkwSUVNeE5UZ3VNREExTERjdU5USXpJREUxTnk0NU9UZ3NOeTQwTVNBeE5UY3VPVGs0TERjdU16QTBJRXd4TlRjdU9UazRMRFl1TkRFNElFTXhOVGN1T1RrNExEVXVPRE0wSURFMU55NDJPRFlzTlM0eU9UVWdNVFUzTGpFNE1TdzFMakF3TWlCRE1UVTJMall5TkN3MExqWTRJREUxTUM0ME5ESXNNUzR4TVRFZ01UVXdMalEwTWl3eExqRXhNU0JETVRVd0xqRTRPU3d3TGprMk5TQXhORGt1T1RBM0xEQXVPRGt5SURFME9TNDJNalVzTUM0NE9USWlJR2xrUFNKR2FXeHNMVEVpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RZdU1ESTNMREkxTGpZek5pQk1NVFF5TGpZd015dzFNaTQxTWpjZ1F6RTBNeTQ0TURjc05UTXVNakl5SURFME5DNDFPRElzTlRRdU1URTBJREUwTkM0NE5EVXNOVFV1TURZNElFd3hORFF1T0RNMUxEVTFMakEzTlNCTU5qTXVORFl4TERFd01pNHdOVGNnVERZekxqUTJMREV3TWk0d05UY2dRell4TGpnd05pd3hNREV1T1RBMUlEWXdMakkyTVN3eE1ERXVORFUzSURVNUxqQTFOeXd4TURBdU56WXlJRXd4TWk0ME9ERXNOek11T0RjeElFdzVOaTR3TWpjc01qVXVOak0ySWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXpMalEyTVN3eE1ESXVNVGMwSUVNMk15NDBOVE1zTVRBeUxqRTNOQ0EyTXk0ME5EWXNNVEF5TGpFM05DQTJNeTQwTXprc01UQXlMakUzTWlCRE5qRXVOelEyTERFd01pNHdNVFlnTmpBdU1qRXhMREV3TVM0MU5qTWdOVGd1T1RrNExERXdNQzQ0TmpNZ1RERXlMalF5TWl3M015NDVOek1nUXpFeUxqTTROaXczTXk0NU5USWdNVEl1TXpZMExEY3pMamt4TkNBeE1pNHpOalFzTnpNdU9EY3hJRU14TWk0ek5qUXNOek11T0RNZ01USXVNemcyTERjekxqYzVNU0F4TWk0ME1qSXNOek11TnpjZ1REazFMamsyT0N3eU5TNDFNelVnUXprMkxqQXdOQ3d5TlM0MU1UUWdPVFl1TURRNUxESTFMalV4TkNBNU5pNHdPRFVzTWpVdU5UTTFJRXd4TkRJdU5qWXhMRFV5TGpReU5pQkRNVFF6TGpnNE9DdzFNeTR4TXpRZ01UUTBMalk0TWl3MU5DNHdNemdnTVRRMExqazFOeXcxTlM0d016Y2dRekUwTkM0NU55dzFOUzR3T0RNZ01UUTBMamsxTXl3MU5TNHhNek1nTVRRMExqa3hOU3cxTlM0eE5qRWdRekUwTkM0NU1URXNOVFV1TVRZMUlERTBOQzQ0T1Rnc05UVXVNVGMwSURFME5DNDRPVFFzTlRVdU1UYzNJRXcyTXk0MU1Ua3NNVEF5TGpFMU9DQkROak11TlRBeExERXdNaTR4TmprZ05qTXVORGd4TERFd01pNHhOelFnTmpNdU5EWXhMREV3TWk0eE56UWdURFl6TGpRMk1Td3hNREl1TVRjMElGb2dUVEV5TGpjeE5DdzNNeTQ0TnpFZ1REVTVMakV4TlN3eE1EQXVOall4SUVNMk1DNHlPVE1zTVRBeExqTTBNU0EyTVM0M09EWXNNVEF4TGpjNE1pQTJNeTQwTXpVc01UQXhMamt6TnlCTU1UUTBMamN3Tnl3MU5TNHdNVFVnUXpFME5DNDBNamdzTlRRdU1UQTRJREUwTXk0Mk9ESXNOVE11TWpnMUlERTBNaTQxTkRRc05USXVOakk0SUV3NU5pNHdNamNzTWpVdU56Y3hJRXd4TWk0M01UUXNOek11T0RjeElFd3hNaTQzTVRRc056TXVPRGN4SUZvaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE0TGpNeU55dzFPQzQwTnpFZ1F6RTBPQzR4TkRVc05UZ3VORGdnTVRRM0xqazJNaXcxT0M0ME9DQXhORGN1TnpneExEVTRMalEzTWlCRE1UUTFMamc0Tnl3MU9DNHpPRGtnTVRRMExqUTNPU3cxTnk0ME16UWdNVFEwTGpZek5pdzFOaTR6TkNCRE1UUTBMalk0T1N3MU5TNDVOamNnTVRRMExqWTJOQ3cxTlM0MU9UY2dNVFEwTGpVMk5DdzFOUzR5TXpVZ1REWXpMalEyTVN3eE1ESXVNRFUzSUVNMk5DNHdPRGtzTVRBeUxqRXhOU0EyTkM0M016TXNNVEF5TGpFeklEWTFMak0zT1N3eE1ESXVNRGs1SUVNMk5TNDFOakVzTVRBeUxqQTVJRFkxTGpjME15d3hNREl1TURrZ05qVXVPVEkxTERFd01pNHdPVGdnUXpZM0xqZ3hPU3d4TURJdU1UZ3hJRFk1TGpJeU55d3hNRE11TVRNMklEWTVMakEzTERFd05DNHlNeUJNTVRRNExqTXlOeXcxT0M0ME56RWlJR2xrUFNKR2FXeHNMVFFpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmprdU1EY3NNVEEwTGpNME55QkROamt1TURRNExERXdOQzR6TkRjZ05qa3VNREkxTERFd05DNHpOQ0EyT1M0d01EVXNNVEEwTGpNeU55QkROamd1T1RZNExERXdOQzR6TURFZ05qZ3VPVFE0TERFd05DNHlOVGNnTmpndU9UVTFMREV3TkM0eU1UTWdRelk1TERFd015NDRPVFlnTmpndU9EazRMREV3TXk0MU56WWdOamd1TmpVNExERXdNeTR5T0RnZ1F6WTRMakUxTXl3eE1ESXVOamM0SURZM0xqRXdNeXd4TURJdU1qWTJJRFkxTGpreUxERXdNaTR5TVRRZ1F6WTFMamMwTWl3eE1ESXVNakEySURZMUxqVTJNeXd4TURJdU1qQTNJRFkxTGpNNE5Td3hNREl1TWpFMUlFTTJOQzQzTkRJc01UQXlMakkwTmlBMk5DNHdPRGNzTVRBeUxqSXpNaUEyTXk0ME5Td3hNREl1TVRjMElFTTJNeTR6T1Rrc01UQXlMakUyT1NBMk15NHpOVGdzTVRBeUxqRXpNaUEyTXk0ek5EY3NNVEF5TGpBNE1pQkROak11TXpNMkxERXdNaTR3TXpNZ05qTXVNelU0TERFd01TNDVPREVnTmpNdU5EQXlMREV3TVM0NU5UWWdUREUwTkM0MU1EWXNOVFV1TVRNMElFTXhORFF1TlRNM0xEVTFMakV4TmlBeE5EUXVOVGMxTERVMUxqRXhNeUF4TkRRdU5qQTVMRFUxTGpFeU55QkRNVFEwTGpZME1pdzFOUzR4TkRFZ01UUTBMalkyT0N3MU5TNHhOeUF4TkRRdU5qYzNMRFUxTGpJd05DQkRNVFEwTGpjNE1TdzFOUzQxT0RVZ01UUTBMamd3Tml3MU5TNDVOeklnTVRRMExqYzFNU3cxTmk0ek5UY2dRekUwTkM0M01EWXNOVFl1TmpjeklERTBOQzQ0TURnc05UWXVPVGswSURFME5TNHdORGNzTlRjdU1qZ3lJRU14TkRVdU5UVXpMRFUzTGpnNU1pQXhORFl1TmpBeUxEVTRMak13TXlBeE5EY3VOemcyTERVNExqTTFOU0JETVRRM0xqazJOQ3cxT0M0ek5qTWdNVFE0TGpFME15dzFPQzR6TmpNZ01UUTRMak15TVN3MU9DNHpOVFFnUXpFME9DNHpOemNzTlRndU16VXlJREUwT0M0ME1qUXNOVGd1TXpnM0lERTBPQzQwTXprc05UZ3VORE00SUVNeE5EZ3VORFUwTERVNExqUTVJREUwT0M0ME16SXNOVGd1TlRRMUlERTBPQzR6T0RVc05UZ3VOVGN5SUV3Mk9TNHhNamtzTVRBMExqTXpNU0JETmprdU1URXhMREV3TkM0ek5ESWdOamt1TURrc01UQTBMak0wTnlBMk9TNHdOeXd4TURRdU16UTNJRXcyT1M0d055d3hNRFF1TXpRM0lGb2dUVFkxTGpZMk5Td3hNREV1T1RjMUlFTTJOUzQzTlRRc01UQXhMamszTlNBMk5TNDRORElzTVRBeExqazNOeUEyTlM0NU15d3hNREV1T1RneElFTTJOeTR4T1RZc01UQXlMakF6TnlBMk9DNHlPRE1zTVRBeUxqUTJPU0EyT0M0NE16Z3NNVEF6TGpFek9TQkROamt1TURZMUxERXdNeTQwTVRNZ05qa3VNVGc0TERFd015NDNNVFFnTmprdU1UazRMREV3TkM0d01qRWdUREUwTnk0NE9ETXNOVGd1TlRreUlFTXhORGN1T0RRM0xEVTRMalU1TWlBeE5EY3VPREV4TERVNExqVTVNU0F4TkRjdU56YzJMRFU0TGpVNE9TQkRNVFEyTGpVd09TdzFPQzQxTXpNZ01UUTFMalF5TWl3MU9DNHhJREUwTkM0NE5qY3NOVGN1TkRNeElFTXhORFF1TlRnMUxEVTNMakE1TVNBeE5EUXVORFkxTERVMkxqY3dOeUF4TkRRdU5USXNOVFl1TXpJMElFTXhORFF1TlRZekxEVTJMakF5TVNBeE5EUXVOVFV5TERVMUxqY3hOaUF4TkRRdU5EZzRMRFUxTGpReE5DQk1Oak11T0RRMkxERXdNUzQ1TnlCRE5qUXVNelV6TERFd01pNHdNRElnTmpRdU9EWTNMREV3TWk0d01EWWdOalV1TXpjMExERXdNUzQ1T0RJZ1F6WTFMalEzTVN3eE1ERXVPVGMzSURZMUxqVTJPQ3d4TURFdU9UYzFJRFkxTGpZMk5Td3hNREV1T1RjMUlFdzJOUzQyTmpVc01UQXhMamszTlNCYUlpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEl1TWpBNExEVTFMakV6TkNCRE1TNHlNRGNzTlRNdU16QTNJREV1T1RZM0xEVXdMamt4TnlBekxqa3dOaXcwT1M0M09UY2dURFU1TGpreE55d3hOeTQwTlRNZ1F6WXhMamcxTml3eE5pNHpNek1nTmpRdU1qUXhMREUyTGprd055QTJOUzR5TkRNc01UZ3VOek0wSUV3Mk5TNDBOelVzTVRrdU1UUTBJRU0yTlM0NE56SXNNVGt1T0RneUlEWTJMak0yT0N3eU1DNDFOaUEyTmk0NU5EVXNNakV1TVRZMUlFdzJOeTR5TWpNc01qRXVORE0xSUVNM01DNDFORGdzTWpRdU5qUTVJRGMxTGpnd05pd3lOUzR4TlRFZ09EQXVNVEV4TERJeUxqWTJOU0JNT0RjdU5ETXNNVGd1TkRRMUlFTTRPUzR6Tnl3eE55NHpNallnT1RFdU56VTBMREUzTGpnNU9TQTVNaTQzTlRVc01Ua3VOekkzSUV3NU5pNHdNRFVzTWpVdU5qVTFJRXd4TWk0ME9EWXNOek11T0RnMElFd3lMakl3T0N3MU5TNHhNelFnV2lJZ2FXUTlJa1pwYkd3dE5pSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNaTQwT0RZc056UXVNREF4SUVNeE1pNDBOellzTnpRdU1EQXhJREV5TGpRMk5TdzNNeTQ1T1RrZ01USXVORFUxTERjekxqazVOaUJETVRJdU5ESTBMRGN6TGprNE9DQXhNaTR6T1Rrc056TXVPVFkzSURFeUxqTTROQ3czTXk0NU5DQk1NaTR4TURZc05UVXVNVGtnUXpFdU1EYzFMRFV6TGpNeElERXVPRFUzTERVd0xqZzBOU0F6TGpnME9DdzBPUzQyT1RZZ1REVTVMamcxT0N3eE55NHpOVElnUXpZd0xqVXlOU3d4Tmk0NU5qY2dOakV1TWpjeExERTJMamMyTkNBMk1pNHdNVFlzTVRZdU56WTBJRU0yTXk0ME16RXNNVFl1TnpZMElEWTBMalkyTml3eE55NDBOallnTmpVdU16STNMREU0TGpZME5pQkROalV1TXpNM0xERTRMalkxTkNBMk5TNHpORFVzTVRndU5qWXpJRFkxTGpNMU1Td3hPQzQyTnpRZ1REWTFMalUzT0N3eE9TNHdPRGdnUXpZMUxqVTROQ3d4T1M0eElEWTFMalU0T1N3eE9TNHhNVElnTmpVdU5Ua3hMREU1TGpFeU5pQkROalV1T1RnMUxERTVMamd6T0NBMk5pNDBOamtzTWpBdU5EazNJRFkzTGpBekxESXhMakE0TlNCTU5qY3VNekExTERJeExqTTFNU0JETmprdU1UVXhMREl6TGpFek55QTNNUzQyTkRrc01qUXVNVElnTnpRdU16TTJMREkwTGpFeUlFTTNOaTR6TVRNc01qUXVNVElnTnpndU1qa3NNak11TlRneUlEZ3dMakExTXl3eU1pNDFOak1nUXpnd0xqQTJOQ3d5TWk0MU5UY2dPREF1TURjMkxESXlMalUxTXlBNE1DNHdPRGdzTWpJdU5UVWdURGczTGpNM01pd3hPQzR6TkRRZ1F6ZzRMakF6T0N3eE55NDVOVGtnT0RndU56ZzBMREUzTGpjMU5pQTRPUzQxTWprc01UY3VOelUySUVNNU1DNDVOVFlzTVRjdU56VTJJRGt5TGpJd01Td3hPQzQwTnpJZ09USXVPRFU0TERFNUxqWTNJRXc1Tmk0eE1EY3NNalV1TlRrNUlFTTVOaTR4TXpnc01qVXVOalUwSURrMkxqRXhPQ3d5TlM0M01qUWdPVFl1TURZekxESTFMamMxTmlCTU1USXVOVFExTERjekxqazROU0JETVRJdU5USTJMRGN6TGprNU5pQXhNaTQxTURZc056UXVNREF4SURFeUxqUTROaXczTkM0d01ERWdUREV5TGpRNE5pdzNOQzR3TURFZ1dpQk5Oakl1TURFMkxERTJMams1TnlCRE5qRXVNekV5TERFMkxqazVOeUEyTUM0Mk1EWXNNVGN1TVRrZ05Ua3VPVGMxTERFM0xqVTFOQ0JNTXk0NU5qVXNORGt1T0RrNUlFTXlMakE0TXl3MU1DNDVPRFVnTVM0ek5ERXNOVE11TXpBNElESXVNekVzTlRVdU1EYzRJRXd4TWk0MU16RXNOek11TnpJeklFdzVOUzQ0TkRnc01qVXVOakV4SUV3NU1pNDJOVE1zTVRrdU56Z3lJRU01TWk0d016Z3NNVGd1TmpZZ09UQXVPRGNzTVRjdU9Ua2dPRGt1TlRJNUxERTNMams1SUVNNE9DNDRNalVzTVRjdU9Ua2dPRGd1TVRFNUxERTRMakU0TWlBNE55NDBPRGtzTVRndU5UUTNJRXc0TUM0eE56SXNNakl1TnpjeUlFTTRNQzR4TmpFc01qSXVOemM0SURnd0xqRTBPU3d5TWk0M09ESWdPREF1TVRNM0xESXlMamM0TlNCRE56Z3VNelEyTERJekxqZ3hNU0EzTmk0ek5ERXNNalF1TXpVMElEYzBMak16Tml3eU5DNHpOVFFnUXpjeExqVTRPQ3d5TkM0ek5UUWdOamt1TURNekxESXpMak0wTnlBMk55NHhORElzTWpFdU5URTVJRXcyTmk0NE5qUXNNakV1TWpRNUlFTTJOaTR5Tnpjc01qQXVOak0wSURZMUxqYzNOQ3d4T1M0NU5EY2dOalV1TXpZM0xERTVMakl3TXlCRE5qVXVNellzTVRrdU1Ua3lJRFkxTGpNMU5pd3hPUzR4TnprZ05qVXVNelUwTERFNUxqRTJOaUJNTmpVdU1UWXpMREU0TGpneE9TQkROalV1TVRVMExERTRMamd4TVNBMk5TNHhORFlzTVRndU9EQXhJRFkxTGpFMExERTRMamM1SUVNMk5DNDFNalVzTVRjdU5qWTNJRFl6TGpNMU55d3hOaTQ1T1RjZ05qSXVNREUyTERFMkxqazVOeUJNTmpJdU1ERTJMREUyTGprNU55QmFJaUJwWkQwaVJtbHNiQzAzSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRReUxqUXpOQ3cwT0M0NE1EZ2dURFF5TGpRek5DdzBPQzQ0TURnZ1F6TTVMamt5TkN3ME9DNDRNRGNnTXpjdU56TTNMRFEzTGpVMUlETTJMalU0TWl3ME5TNDBORE1nUXpNMExqYzNNU3cwTWk0eE16a2dNell1TVRRMExETTNMamd3T1NBek9TNDJOREVzTXpVdU56ZzVJRXcxTVM0NU16SXNNamd1TmpreElFTTFNeTR4TURNc01qZ3VNREUxSURVMExqUXhNeXd5Tnk0Mk5UZ2dOVFV1TnpJeExESTNMalkxT0NCRE5UZ3VNak14TERJM0xqWTFPQ0EyTUM0ME1UZ3NNamd1T1RFMklEWXhMalUzTXl3ek1TNHdNak1nUXpZekxqTTROQ3d6TkM0ek1qY2dOakl1TURFeUxETTRMalkxTnlBMU9DNDFNVFFzTkRBdU5qYzNJRXcwTmk0eU1qTXNORGN1TnpjMUlFTTBOUzR3TlRNc05EZ3VORFVnTkRNdU56UXlMRFE0TGpnd09DQTBNaTQwTXpRc05EZ3VPREE0SUV3ME1pNDBNelFzTkRndU9EQTRJRm9nVFRVMUxqY3lNU3d5T0M0eE1qVWdRelUwTGpRNU5Td3lPQzR4TWpVZ05UTXVNalkxTERJNExqUTJNU0ExTWk0eE5qWXNNamt1TURrMklFd3pPUzQ0TnpVc016WXVNVGswSUVNek5pNDFPVFlzTXpndU1EZzNJRE0xTGpNd01pdzBNaTR4TXpZZ016WXVPVGt5TERRMUxqSXhPQ0JETXpndU1EWXpMRFEzTGpFM015QTBNQzR3T1Rnc05EZ3VNelFnTkRJdU5ETTBMRFE0TGpNMElFTTBNeTQyTmpFc05EZ3VNelFnTkRRdU9Ea3NORGd1TURBMUlEUTFMams1TERRM0xqTTNJRXcxT0M0eU9ERXNOREF1TWpjeUlFTTJNUzQxTml3ek9DNHpOemtnTmpJdU9EVXpMRE0wTGpNeklEWXhMakUyTkN3ek1TNHlORGdnUXpZd0xqQTVNaXd5T1M0eU9UTWdOVGd1TURVNExESTRMakV5TlNBMU5TNDNNakVzTWpndU1USTFJRXcxTlM0M01qRXNNamd1TVRJMUlGb2lJR2xrUFNKR2FXeHNMVGdpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqVTRPQ3d5TGpRd055QkRNVFE1TGpVNE9Dd3lMalF3TnlBeE5UVXVOelk0TERVdU9UYzFJREUxTmk0ek1qVXNOaTR5T1RjZ1RERTFOaTR6TWpVc055NHhPRFFnUXpFMU5pNHpNalVzTnk0ek5pQXhOVFl1TXpNNExEY3VOVFEwSURFMU5pNHpOaklzTnk0M016TWdRekUxTmk0ek56TXNOeTQ0TVRRZ01UVTJMak00TWl3M0xqZzVOQ0F4TlRZdU16a3NOeTQ1TnpVZ1F6RTFOaTQxTXl3NUxqTTVJREUxTnk0ek5qTXNNVEF1T1RjeklERTFPQzQwT1RVc01URXVPVGMwSUV3eE5qVXVPRGt4TERFNExqVXhPU0JETVRZMkxqQTJPQ3d4T0M0Mk56VWdNVFkyTGpJME9Td3hPQzQ0TVRRZ01UWTJMalF6TWl3eE9DNDVNelFnUXpFMk9DNHdNVEVzTVRrdU9UYzBJREUyT1M0ek9ESXNNVGt1TkNBeE5qa3VORGswTERFM0xqWTFNaUJETVRZNUxqVTBNeXd4Tmk0NE5qZ2dNVFk1TGpVMU1Td3hOaTR3TlRjZ01UWTVMalV4Tnl3eE5TNHlNak1nVERFMk9TNDFNVFFzTVRVdU1EWXpJRXd4TmprdU5URTBMREV6TGpreE1pQkRNVGN3TGpjNExERTBMalkwTWlBeE9UVXVOVEF4TERJNExqa3hOU0F4T1RVdU5UQXhMREk0TGpreE5TQk1NVGsxTGpVd01TdzRNaTQ1TVRVZ1F6RTVOUzQxTURFc09EUXVNREExSURFNU5DNDNNekVzT0RRdU5EUTFJREU1TXk0M09ERXNPRE11T0RrM0lFd3hOVEV1TXpBNExEVTVMak0zTkNCRE1UVXdMak0xT0N3MU9DNDRNallnTVRRNUxqVTRPQ3cxTnk0ME9UY2dNVFE1TGpVNE9DdzFOaTQwTURnZ1RERTBPUzQxT0Rnc01qSXVNemMxSWlCcFpEMGlSbWxzYkMwNUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTVOQzQxTlRNc09EUXVNalVnUXpFNU5DNHlPVFlzT0RRdU1qVWdNVGswTGpBeE15dzROQzR4TmpVZ01Ua3pMamN5TWl3NE15NDVPVGNnVERFMU1TNHlOU3cxT1M0ME56WWdRekUxTUM0eU5qa3NOVGd1T1RBNUlERTBPUzQwTnpFc05UY3VOVE16SURFME9TNDBOekVzTlRZdU5EQTRJRXd4TkRrdU5EY3hMREl5TGpNM05TQk1NVFE1TGpjd05Td3lNaTR6TnpVZ1RERTBPUzQzTURVc05UWXVOREE0SUVNeE5Ea3VOekExTERVM0xqUTFPU0F4TlRBdU5EVXNOVGd1TnpRMElERTFNUzR6TmpZc05Ua3VNamMwSUV3eE9UTXVPRE01TERnekxqYzVOU0JETVRrMExqSTJNeXc0TkM0d05DQXhPVFF1TmpVMUxEZzBMakE0TXlBeE9UUXVPVFF5TERnekxqa3hOeUJETVRrMUxqSXlOeXc0TXk0M05UTWdNVGsxTGpNNE5DdzRNeTR6T1RjZ01UazFMak00TkN3NE1pNDVNVFVnVERFNU5TNHpPRFFzTWpndU9UZ3lJRU14T1RRdU1UQXlMREk0TGpJME1pQXhOekl1TVRBMExERTFMalUwTWlBeE5qa3VOak14TERFMExqRXhOQ0JNTVRZNUxqWXpOQ3d4TlM0eU1pQkRNVFk1TGpZMk9Dd3hOaTR3TlRJZ01UWTVMalkyTERFMkxqZzNOQ0F4TmprdU5qRXNNVGN1TmpVNUlFTXhOamt1TlRVMkxERTRMalV3TXlBeE5qa3VNakUwTERFNUxqRXlNeUF4TmpndU5qUTNMREU1TGpRd05TQkRNVFk0TGpBeU9Dd3hPUzQzTVRRZ01UWTNMakU1Tnl3eE9TNDFOemdnTVRZMkxqTTJOeXd4T1M0d016SWdRekUyTmk0eE9ERXNNVGd1T1RBNUlERTJOUzQ1T1RVc01UZ3VOelkySURFMk5TNDRNVFFzTVRndU5qQTJJRXd4TlRndU5ERTNMREV5TGpBMk1pQkRNVFUzTGpJMU9Td3hNUzR3TXpZZ01UVTJMalF4T0N3NUxqUXpOeUF4TlRZdU1qYzBMRGN1T1RnMklFTXhOVFl1TWpZMkxEY3VPVEEzSURFMU5pNHlOVGNzTnk0NE1qY2dNVFUyTGpJME55dzNMamMwT0NCRE1UVTJMakl5TVN3M0xqVTFOU0F4TlRZdU1qQTVMRGN1TXpZMUlERTFOaTR5TURrc055NHhPRFFnVERFMU5pNHlNRGtzTmk0ek5qUWdRekUxTlM0ek56VXNOUzQ0T0RNZ01UUTVMalV5T1N3eUxqVXdPQ0F4TkRrdU5USTVMREl1TlRBNElFd3hORGt1TmpRMkxESXVNekEySUVNeE5Ea3VOalEyTERJdU16QTJJREUxTlM0NE1qY3NOUzQ0TnpRZ01UVTJMak00TkN3MkxqRTVOaUJNTVRVMkxqUTBNaXcyTGpJeklFd3hOVFl1TkRReUxEY3VNVGcwSUVNeE5UWXVORFF5TERjdU16VTFJREUxTmk0ME5UUXNOeTQxTXpVZ01UVTJMalEzT0N3M0xqY3hOeUJETVRVMkxqUTRPU3czTGpnZ01UVTJMalE1T1N3M0xqZzRNaUF4TlRZdU5UQTNMRGN1T1RZeklFTXhOVFl1TmpRMUxEa3VNelU0SURFMU55NDBOVFVzTVRBdU9EazRJREUxT0M0MU56SXNNVEV1T0RnMklFd3hOalV1T1RZNUxERTRMalF6TVNCRE1UWTJMakUwTWl3eE9DNDFPRFFnTVRZMkxqTXhPU3d4T0M0M01pQXhOall1TkRrMkxERTRMamd6TnlCRE1UWTNMakkxTkN3eE9TNHpNellnTVRZNExERTVMalEyTnlBeE5qZ3VOVFF6TERFNUxqRTVOaUJETVRZNUxqQXpNeXd4T0M0NU5UTWdNVFk1TGpNeU9Td3hPQzQwTURFZ01UWTVMak0zTnl3eE55NDJORFVnUXpFMk9TNDBNamNzTVRZdU9EWTNJREUyT1M0ME16UXNNVFl1TURVMElERTJPUzQwTURFc01UVXVNakk0SUV3eE5qa3VNemszTERFMUxqQTJOU0JNTVRZNUxqTTVOeXd4TXk0M01TQk1NVFk1TGpVM01pd3hNeTQ0TVNCRE1UY3dMamd6T1N3eE5DNDFOREVnTVRrMUxqVTFPU3d5T0M0NE1UUWdNVGsxTGpVMU9Td3lPQzQ0TVRRZ1RERTVOUzQyTVRnc01qZ3VPRFEzSUV3eE9UVXVOakU0TERneUxqa3hOU0JETVRrMUxqWXhPQ3c0TXk0ME9EUWdNVGsxTGpReUxEZ3pMamt4TVNBeE9UVXVNRFU1TERnMExqRXhPU0JETVRrMExqa3dPQ3c0TkM0eU1EWWdNVGswTGpjek55dzROQzR5TlNBeE9UUXVOVFV6TERnMExqSTFJaUJwWkQwaVJtbHNiQzB4TUNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5EVXVOamcxTERVMkxqRTJNU0JNTVRZNUxqZ3NOekF1TURneklFd3hORE11T0RJeUxEZzFMakE0TVNCTU1UUXlMak0yTERnMExqYzNOQ0JETVRNMUxqZ3lOaXc0TWk0Mk1EUWdNVEk0TGpjek1pdzRNUzR3TkRZZ01USXhMak0wTVN3NE1DNHhOVGdnUXpFeE5pNDVOellzTnprdU5qTTBJREV4TWk0Mk56Z3NPREV1TWpVMElERXhNUzQzTkRNc09ETXVOemM0SUVNeE1URXVOVEEyTERnMExqUXhOQ0F4TVRFdU5UQXpMRGcxTGpBM01TQXhNVEV1TnpNeUxEZzFMamN3TmlCRE1URXpMakkzTERnNUxqazNNeUF4TVRVdU9UWTRMRGswTGpBMk9TQXhNVGt1TnpJM0xEazNMamcwTVNCTU1USXdMakkxT1N3NU9DNDJPRFlnUXpFeU1DNHlOaXc1T0M0Mk9EVWdPVFF1TWpneUxERXhNeTQyT0RNZ09UUXVNamd5TERFeE15NDJPRE1nVERjd0xqRTJOeXc1T1M0M05qRWdUREUwTlM0Mk9EVXNOVFl1TVRZeElpQnBaRDBpUm1sc2JDMHhNU0lnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazA1TkM0eU9ESXNNVEV6TGpneE9DQk1PVFF1TWpJekxERXhNeTQzT0RVZ1REWTVMamt6TXl3NU9TNDNOakVnVERjd0xqRXdPQ3c1T1M0Mk5pQk1NVFExTGpZNE5TdzFOaTR3TWpZZ1RERTBOUzQzTkRNc05UWXVNRFU1SUV3eE56QXVNRE16TERjd0xqQTRNeUJNTVRRekxqZzBNaXc0TlM0eU1EVWdUREUwTXk0M09UY3NPRFV1TVRrMUlFTXhORE11TnpjeUxEZzFMakU1SURFME1pNHpNellzT0RRdU9EZzRJREUwTWk0ek16WXNPRFF1T0RnNElFTXhNelV1TnpnM0xEZ3lMamN4TkNBeE1qZ3VOekl6TERneExqRTJNeUF4TWpFdU16STNMRGd3TGpJM05DQkRNVEl3TGpjNE9DdzRNQzR5TURrZ01USXdMakl6Tml3NE1DNHhOemNnTVRFNUxqWTRPU3c0TUM0eE56Y2dRekV4TlM0NU16RXNPREF1TVRjM0lERXhNaTQyTXpVc09ERXVOekE0SURFeE1TNDROVElzT0RNdU9ERTVJRU14TVRFdU5qSTBMRGcwTGpRek1pQXhNVEV1TmpJeExEZzFMakExTXlBeE1URXVPRFF5TERnMUxqWTJOeUJETVRFekxqTTNOeXc0T1M0NU1qVWdNVEUyTGpBMU9DdzVNeTQ1T1RNZ01URTVMamd4TERrM0xqYzFPQ0JNTVRFNUxqZ3lOaXc1Tnk0M056a2dUREV5TUM0ek5USXNPVGd1TmpFMElFTXhNakF1TXpVMExEazRMall4TnlBeE1qQXVNelUyTERrNExqWXlJREV5TUM0ek5UZ3NPVGd1TmpJMElFd3hNakF1TkRJeUxEazRMamN5TmlCTU1USXdMak14Tnl3NU9DNDNPRGNnUXpFeU1DNHlOalFzT1RndU9ERTRJRGswTGpVNU9Td3hNVE11TmpNMUlEazBMak0wTERFeE15NDNPRFVnVERrMExqSTRNaXd4TVRNdU9ERTRJRXc1TkM0eU9ESXNNVEV6TGpneE9DQmFJRTAzTUM0ME1ERXNPVGt1TnpZeElFdzVOQzR5T0RJc01URXpMalUwT1NCTU1URTVMakE0TkN3NU9TNHlNamtnUXpFeE9TNDJNeXc1T0M0NU1UUWdNVEU1TGprekxEazRMamMwSURFeU1DNHhNREVzT1RndU5qVTBJRXd4TVRrdU5qTTFMRGszTGpreE5DQkRNVEUxTGpnMk5DdzVOQzR4TWpjZ01URXpMakUyT0N3NU1DNHdNek1nTVRFeExqWXlNaXc0TlM0M05EWWdRekV4TVM0ek9ESXNPRFV1TURjNUlERXhNUzR6T0RZc09EUXVOREEwSURFeE1TNDJNek1zT0RNdU56TTRJRU14TVRJdU5EUTRMRGd4TGpVek9TQXhNVFV1T0RNMkxEYzVMamswTXlBeE1Ua3VOamc1TERjNUxqazBNeUJETVRJd0xqSTBOaXczT1M0NU5ETWdNVEl3TGpnd05pdzNPUzQ1TnpZZ01USXhMak0xTlN3NE1DNHdORElnUXpFeU9DNDNOamNzT0RBdU9UTXpJREV6TlM0NE5EWXNPREl1TkRnM0lERTBNaTR6T1RZc09EUXVOall6SUVNeE5ETXVNak15TERnMExqZ3pPQ0F4TkRNdU5qRXhMRGcwTGpreE55QXhORE11TnpnMkxEZzBMamsyTnlCTU1UWTVMalUyTml3M01DNHdPRE1nVERFME5TNDJPRFVzTlRZdU1qazFJRXczTUM0ME1ERXNPVGt1TnpZeElFdzNNQzQwTURFc09Ua3VOell4SUZvaUlHbGtQU0pHYVd4c0xURXlJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyTnk0eU15d3hPQzQ1TnprZ1RERTJOeTR5TXl3Mk9TNDROU0JNTVRNNUxqa3dPU3c0TlM0Mk1qTWdUREV6TXk0ME5EZ3NOekV1TkRVMklFTXhNekl1TlRNNExEWTVMalEySURFek1DNHdNaXcyT1M0M01UZ2dNVEkzTGpneU5DdzNNaTR3TXlCRE1USTJMamMyT1N3M015NHhOQ0F4TWpVdU9UTXhMRGMwTGpVNE5TQXhNalV1TkRrMExEYzJMakEwT0NCTU1URTVMakF6TkN3NU55NDJOellnVERreExqY3hNaXd4TVRNdU5EVWdURGt4TGpjeE1pdzJNaTQxTnprZ1RERTJOeTR5TXl3eE9DNDVOemtpSUdsa1BTSkdhV3hzTFRFeklpQm1hV3hzUFNJalJrWkdSa1pHSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUa3hMamN4TWl3eE1UTXVOVFkzSUVNNU1TNDJPVElzTVRFekxqVTJOeUE1TVM0Mk56SXNNVEV6TGpVMk1TQTVNUzQyTlRNc01URXpMalUxTVNCRE9URXVOakU0TERFeE15NDFNeUE1TVM0MU9UVXNNVEV6TGpRNU1pQTVNUzQxT1RVc01URXpMalExSUV3NU1TNDFPVFVzTmpJdU5UYzVJRU01TVM0MU9UVXNOakl1TlRNM0lEa3hMall4T0N3Mk1pNDBPVGtnT1RFdU5qVXpMRFl5TGpRM09DQk1NVFkzTGpFM01pd3hPQzQ0TnpnZ1F6RTJOeTR5TURnc01UZ3VPRFUzSURFMk55NHlOVElzTVRndU9EVTNJREUyTnk0eU9EZ3NNVGd1T0RjNElFTXhOamN1TXpJMExERTRMamc1T1NBeE5qY3VNelEzTERFNExqa3pOeUF4TmpjdU16UTNMREU0TGprM09TQk1NVFkzTGpNME55dzJPUzQ0TlNCRE1UWTNMak0wTnl3Mk9TNDRPVEVnTVRZM0xqTXlOQ3cyT1M0NU15QXhOamN1TWpnNExEWTVMamsxSUV3eE16a3VPVFkzTERnMUxqY3lOU0JETVRNNUxqa3pPU3c0TlM0M05ERWdNVE01TGprd05TdzROUzQzTkRVZ01UTTVMamczTXl3NE5TNDNNelVnUXpFek9TNDRORElzT0RVdU56STFJREV6T1M0NE1UWXNPRFV1TnpBeUlERXpPUzQ0TURJc09EVXVOamN5SUV3eE16TXVNelF5TERjeExqVXdOQ0JETVRNeUxqazJOeXczTUM0Mk9ESWdNVE15TGpJNExEY3dMakl5T1NBeE16RXVOREE0TERjd0xqSXlPU0JETVRNd0xqTXhPU3czTUM0eU1qa2dNVEk1TGpBME5DdzNNQzQ1TVRVZ01USTNMamt3T0N3M01pNHhNU0JETVRJMkxqZzNOQ3czTXk0eUlERXlOaTR3TXpRc056UXVOalEzSURFeU5TNDJNRFlzTnpZdU1EZ3lJRXd4TVRrdU1UUTJMRGszTGpjd09TQkRNVEU1TGpFek55dzVOeTQzTXpnZ01URTVMakV4T0N3NU55NDNOaklnTVRFNUxqQTVNaXc1Tnk0M056Y2dURGt4TGpjM0xERXhNeTQxTlRFZ1F6a3hMamMxTWl3eE1UTXVOVFl4SURreExqY3pNaXd4TVRNdU5UWTNJRGt4TGpjeE1pd3hNVE11TlRZM0lFdzVNUzQzTVRJc01URXpMalUyTnlCYUlFMDVNUzQ0TWprc05qSXVOalEzSUV3NU1TNDRNamtzTVRFekxqSTBPQ0JNTVRFNExqa3pOU3c1Tnk0MU9UZ2dUREV5TlM0ek9ESXNOell1TURFMUlFTXhNalV1T0RJM0xEYzBMalV5TlNBeE1qWXVOalkwTERjekxqQTRNU0F4TWpjdU56TTVMRGN4TGprMUlFTXhNamd1T1RFNUxEY3dMamN3T0NBeE16QXVNalUyTERZNUxqazVOaUF4TXpFdU5EQTRMRFk1TGprNU5pQkRNVE15TGpNM055dzJPUzQ1T1RZZ01UTXpMakV6T1N3M01DNDBPVGNnTVRNekxqVTFOQ3czTVM0ME1EY2dUREV6T1M0NU5qRXNPRFV1TkRVNElFd3hOamN1TVRFekxEWTVMamM0TWlCTU1UWTNMakV4TXl3eE9TNHhPREVnVERreExqZ3lPU3cyTWk0Mk5EY2dURGt4TGpneU9TdzJNaTQyTkRjZ1dpSWdhV1E5SWtacGJHd3RNVFFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRZNExqVTBNeXd4T1M0eU1UTWdUREUyT0M0MU5ETXNOekF1TURneklFd3hOREV1TWpJeExEZzFMamcxTnlCTU1UTTBMamMyTVN3M01TNDJPRGtnUXpFek15NDROVEVzTmprdU5qazBJREV6TVM0ek16TXNOamt1T1RVeElERXlPUzR4TXpjc056SXVNall6SUVNeE1qZ3VNRGd5TERjekxqTTNOQ0F4TWpjdU1qUTBMRGMwTGpneE9TQXhNall1T0RBM0xEYzJMakk0TWlCTU1USXdMak0wTml3NU55NDVNRGtnVERrekxqQXlOU3d4TVRNdU5qZ3pJRXc1TXk0d01qVXNOakl1T0RFeklFd3hOamd1TlRRekxERTVMakl4TXlJZ2FXUTlJa1pwYkd3dE1UVWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVE11TURJMUxERXhNeTQ0SUVNNU15NHdNRFVzTVRFekxqZ2dPVEl1T1RnMExERXhNeTQzT1RVZ09USXVPVFkyTERFeE15NDNPRFVnUXpreUxqa3pNU3d4TVRNdU56WTBJRGt5TGprd09Dd3hNVE11TnpJMUlEa3lMamt3T0N3eE1UTXVOamcwSUV3NU1pNDVNRGdzTmpJdU9ERXpJRU01TWk0NU1EZ3NOakl1TnpjeElEa3lMamt6TVN3Mk1pNDNNek1nT1RJdU9UWTJMRFl5TGpjeE1pQk1NVFk0TGpRNE5Dd3hPUzR4TVRJZ1F6RTJPQzQxTWl3eE9TNHdPU0F4TmpndU5UWTFMREU1TGpBNUlERTJPQzQyTURFc01Ua3VNVEV5SUVNeE5qZ3VOak0zTERFNUxqRXpNaUF4TmpndU5qWXNNVGt1TVRjeElERTJPQzQyTml3eE9TNHlNVElnVERFMk9DNDJOaXczTUM0d09ETWdRekUyT0M0Mk5pdzNNQzR4TWpVZ01UWTRMall6Tnl3M01DNHhOalFnTVRZNExqWXdNU3czTUM0eE9EUWdUREUwTVM0eU9DdzROUzQ1TlRnZ1F6RTBNUzR5TlRFc09EVXVPVGMxSURFME1TNHlNVGNzT0RVdU9UYzVJREUwTVM0eE9EWXNPRFV1T1RZNElFTXhOREV1TVRVMExEZzFMamsxT0NBeE5ERXVNVEk1TERnMUxqa3pOaUF4TkRFdU1URTFMRGcxTGprd05pQk1NVE0wTGpZMU5TdzNNUzQzTXpnZ1F6RXpOQzR5T0N3M01DNDVNVFVnTVRNekxqVTVNeXczTUM0ME5qTWdNVE15TGpjeUxEY3dMalEyTXlCRE1UTXhMall6TWl3M01DNDBOak1nTVRNd0xqTTFOeXczTVM0eE5EZ2dNVEk1TGpJeU1TdzNNaTR6TkRRZ1F6RXlPQzR4T0RZc056TXVORE16SURFeU55NHpORGNzTnpRdU9EZ3hJREV5Tmk0NU1Ua3NOell1TXpFMUlFd3hNakF1TkRVNExEazNMamswTXlCRE1USXdMalExTERrM0xqazNNaUF4TWpBdU5ETXhMRGszTGprNU5pQXhNakF1TkRBMUxEazRMakF4SUV3NU15NHdPRE1zTVRFekxqYzROU0JET1RNdU1EWTFMREV4TXk0M09UVWdPVE11TURRMUxERXhNeTQ0SURrekxqQXlOU3d4TVRNdU9DQk1PVE11TURJMUxERXhNeTQ0SUZvZ1RUa3pMakUwTWl3Mk1pNDRPREVnVERrekxqRTBNaXd4TVRNdU5EZ3hJRXd4TWpBdU1qUTRMRGszTGpnek1pQk1NVEkyTGpZNU5TdzNOaTR5TkRnZ1F6RXlOeTR4TkN3M05DNDNOVGdnTVRJM0xqazNOeXczTXk0ek1UVWdNVEk1TGpBMU1pdzNNaTR4T0RNZ1F6RXpNQzR5TXpFc056QXVPVFF5SURFek1TNDFOamdzTnpBdU1qSTVJREV6TWk0M01pdzNNQzR5TWprZ1F6RXpNeTQyT0Rrc056QXVNakk1SURFek5DNDBOVElzTnpBdU56TXhJREV6TkM0NE5qY3NOekV1TmpReElFd3hOREV1TWpjMExEZzFMalk1TWlCTU1UWTRMalF5Tml3M01DNHdNVFlnVERFMk9DNDBNallzTVRrdU5ERTFJRXc1TXk0eE5ESXNOakl1T0RneElFdzVNeTR4TkRJc05qSXVPRGd4SUZvaUlHbGtQU0pHYVd4c0xURTJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0NExEY3dMakE0TXlCTU1UUXlMalEzT0N3NE5TNDROVGNnVERFek5pNHdNVGdzTnpFdU5qZzVJRU14TXpVdU1UQTRMRFk1TGpZNU5DQXhNekl1TlRrc05qa3VPVFV4SURFek1DNHpPVE1zTnpJdU1qWXpJRU14TWprdU16TTVMRGN6TGpNM05DQXhNamd1TlN3M05DNDRNVGtnTVRJNExqQTJOQ3czTmk0eU9ESWdUREV5TVM0Mk1ETXNPVGN1T1RBNUlFdzVOQzR5T0RJc01URXpMalk0TXlCTU9UUXVNamd5TERZeUxqZ3hNeUJNTVRZNUxqZ3NNVGt1TWpFeklFd3hOamt1T0N3M01DNHdPRE1nV2lJZ2FXUTlJa1pwYkd3dE1UY2lJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVFF1TWpneUxERXhNeTQ1TVRjZ1F6azBMakkwTVN3eE1UTXVPVEUzSURrMExqSXdNU3d4TVRNdU9UQTNJRGswTGpFMk5Td3hNVE11T0RnMklFTTVOQzR3T1RNc01URXpMamcwTlNBNU5DNHdORGdzTVRFekxqYzJOeUE1TkM0d05EZ3NNVEV6TGpZNE5DQk1PVFF1TURRNExEWXlMamd4TXlCRE9UUXVNRFE0TERZeUxqY3pJRGswTGpBNU15dzJNaTQyTlRJZ09UUXVNVFkxTERZeUxqWXhNU0JNTVRZNUxqWTRNeXd4T1M0d01TQkRNVFk1TGpjMU5Td3hPQzQ1TmprZ01UWTVMamcwTkN3eE9DNDVOamtnTVRZNUxqa3hOeXd4T1M0d01TQkRNVFk1TGprNE9Td3hPUzR3TlRJZ01UY3dMakF6TXl3eE9TNHhNamtnTVRjd0xqQXpNeXd4T1M0eU1USWdUREUzTUM0d016TXNOekF1TURneklFTXhOekF1TURNekxEY3dMakUyTmlBeE5qa3VPVGc1TERjd0xqSTBOQ0F4TmprdU9URTNMRGN3TGpJNE5TQk1NVFF5TGpVNU5TdzROaTR3TmlCRE1UUXlMalV6T0N3NE5pNHdPVElnTVRReUxqUTJPU3c0Tmk0eElERTBNaTQwTURjc09EWXVNRGdnUXpFME1pNHpORFFzT0RZdU1EWWdNVFF5TGpJNU15dzROaTR3TVRRZ01UUXlMakkyTml3NE5TNDVOVFFnVERFek5TNDRNRFVzTnpFdU56ZzJJRU14TXpVdU5EUTFMRGN3TGprNU55QXhNelF1T0RFekxEY3dMalU0SURFek15NDVOemNzTnpBdU5UZ2dRekV6TWk0NU1qRXNOekF1TlRnZ01UTXhMalkzTml3M01TNHlOVElnTVRNd0xqVTJNaXczTWk0ME1qUWdRekV5T1M0MU5DdzNNeTQxTURFZ01USTRMamN4TVN3M05DNDVNekVnTVRJNExqSTROeXczTmk0ek5EZ2dUREV5TVM0NE1qY3NPVGN1T1RjMklFTXhNakV1T0RFc09UZ3VNRE0wSURFeU1TNDNOekVzT1RndU1EZ3lJREV5TVM0M01pdzVPQzR4TVRJZ1REazBMak01T0N3eE1UTXVPRGcySUVNNU5DNHpOaklzTVRFekxqa3dOeUE1TkM0ek1qSXNNVEV6TGpreE55QTVOQzR5T0RJc01URXpMamt4TnlCTU9UUXVNamd5TERFeE15NDVNVGNnV2lCTk9UUXVOVEUxTERZeUxqazBPQ0JNT1RRdU5URTFMREV4TXk0eU56a2dUREV5TVM0ME1EWXNPVGN1TnpVMElFd3hNamN1T0RRc056WXVNakUxSUVNeE1qZ3VNamtzTnpRdU56QTRJREV5T1M0eE16Y3NOek11TWpRM0lERXpNQzR5TWpRc056SXVNVEF6SUVNeE16RXVOREkxTERjd0xqZ3pPQ0F4TXpJdU56a3pMRGN3TGpFeE1pQXhNek11T1RjM0xEY3dMakV4TWlCRE1UTTBMams1TlN3M01DNHhNVElnTVRNMUxqYzVOU3czTUM0Mk16Z2dNVE0yTGpJekxEY3hMalU1TWlCTU1UUXlMalU0TkN3NE5TNDFNallnVERFMk9TNDFOallzTmprdU9UUTRJRXd4TmprdU5UWTJMREU1TGpZeE55Qk1PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERZeUxqazBPQ0JhSWlCcFpEMGlSbWxzYkMweE9DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNRGt1T0RrMExEa3lMamswTXlCTU1UQTVMamc1TkN3NU1pNDVORE1nUXpFd09DNHhNaXc1TWk0NU5ETWdNVEEyTGpZMU15dzVNaTR5TVRnZ01UQTFMalkxTERrd0xqZ3lNeUJETVRBMUxqVTRNeXc1TUM0M016RWdNVEExTGpVNU15dzVNQzQyTVNBeE1EVXVOamN6TERrd0xqVXlPU0JETVRBMUxqYzFNeXc1TUM0ME5EZ2dNVEExTGpnNExEa3dMalEwSURFd05TNDVOelFzT1RBdU5UQTJJRU14TURZdU56VTBMRGt4TGpBMU15QXhNRGN1TmpjNUxEa3hMak16TXlBeE1EZ3VOekkwTERreExqTXpNeUJETVRFd0xqQTBOeXc1TVM0ek16TWdNVEV4TGpRM09DdzVNQzQ0T1RRZ01URXlMams0TERrd0xqQXlOeUJETVRFNExqSTVNU3c0Tmk0NU5pQXhNakl1TmpFeExEYzVMalV3T1NBeE1qSXVOakV4TERjekxqUXhOaUJETVRJeUxqWXhNU3czTVM0ME9Ea2dNVEl5TGpFMk9TdzJPUzQ0TlRZZ01USXhMak16TXl3Mk9DNDJPVElnUXpFeU1TNHlOallzTmpndU5pQXhNakV1TWpjMkxEWTRMalEzTXlBeE1qRXVNelUyTERZNExqTTVNaUJETVRJeExqUXpOaXcyT0M0ek1URWdNVEl4TGpVMk15dzJPQzR5T1RrZ01USXhMalkxTml3Mk9DNHpOalVnUXpFeU15NHpNamNzTmprdU5UTTNJREV5TkM0eU5EY3NOekV1TnpRMklERXlOQzR5TkRjc056UXVOVGcwSUVNeE1qUXVNalEzTERnd0xqZ3lOaUF4TVRrdU9ESXhMRGc0TGpRME55QXhNVFF1TXpneUxEa3hMalU0TnlCRE1URXlMamd3T0N3NU1pNDBPVFVnTVRFeExqSTVPQ3c1TWk0NU5ETWdNVEE1TGpnNU5DdzVNaTQ1TkRNZ1RERXdPUzQ0T1RRc09USXVPVFF6SUZvZ1RURXdOaTQ1TWpVc09URXVOREF4SUVNeE1EY3VOek00TERreUxqQTFNaUF4TURndU56UTFMRGt5TGpJM09DQXhNRGt1T0RrekxEa3lMakkzT0NCTU1UQTVMamc1TkN3NU1pNHlOemdnUXpFeE1TNHlNVFVzT1RJdU1qYzRJREV4TWk0Mk5EY3NPVEV1T1RVeElERXhOQzR4TkRnc09URXVNRGcwSUVNeE1Ua3VORFU1TERnNExqQXhOeUF4TWpNdU56Z3NPREF1TmpJeElERXlNeTQzT0N3M05DNDFNamdnUXpFeU15NDNPQ3czTWk0MU5Ea2dNVEl6TGpNeE55dzNNQzQ1TWprZ01USXlMalExTkN3Mk9TNDNOamNnUXpFeU1pNDROalVzTnpBdU9EQXlJREV5TXk0d056a3NOekl1TURReUlERXlNeTR3Tnprc056TXVOREF5SUVNeE1qTXVNRGM1TERjNUxqWTBOU0F4TVRndU5qVXpMRGczTGpJNE5TQXhNVE11TWpFMExEa3dMalF5TlNCRE1URXhMalkwTERreExqTXpOQ0F4TVRBdU1UTXNPVEV1TnpReUlERXdPQzQzTWpRc09URXVOelF5SUVNeE1EZ3VNRGd6TERreExqYzBNaUF4TURjdU5EZ3hMRGt4TGpVNU15QXhNRFl1T1RJMUxEa3hMalF3TVNCTU1UQTJMamt5TlN3NU1TNDBNREVnV2lJZ2FXUTlJa1pwYkd3dE1Ua2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpBNU55dzVNQzR5TXlCRE1URTRMalE0TVN3NE55NHhNaklnTVRJeUxqZzBOU3czT1M0MU9UUWdNVEl5TGpnME5TdzNNeTQwTVRZZ1F6RXlNaTQ0TkRVc056RXVNelkxSURFeU1pNHpOaklzTmprdU56STBJREV5TVM0MU1qSXNOamd1TlRVMklFTXhNVGt1TnpNNExEWTNMak13TkNBeE1UY3VNVFE0TERZM0xqTTJNaUF4TVRRdU1qWTFMRFk1TGpBeU5pQkRNVEE0TGpnNE1TdzNNaTR4TXpRZ01UQTBMalV4Tnl3M09TNDJOaklnTVRBMExqVXhOeXc0TlM0NE5DQkRNVEEwTGpVeE55dzROeTQ0T1RFZ01UQTFMRGc1TGpVek1pQXhNRFV1T0RRc09UQXVOeUJETVRBM0xqWXlOQ3c1TVM0NU5USWdNVEV3TGpJeE5DdzVNUzQ0T1RRZ01URXpMakE1Tnl3NU1DNHlNeUlnYVdROUlrWnBiR3d0TWpBaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UQTRMamN5TkN3NU1TNDJNVFFnVERFd09DNDNNalFzT1RFdU5qRTBJRU14TURjdU5UZ3lMRGt4TGpZeE5DQXhNRFl1TlRZMkxEa3hMalF3TVNBeE1EVXVOekExTERrd0xqYzVOeUJETVRBMUxqWTROQ3c1TUM0M09ETWdNVEExTGpZMk5TdzVNQzQ0TVRFZ01UQTFMalkxTERrd0xqYzVJRU14TURRdU56VTJMRGc1TGpVME5pQXhNRFF1TWpnekxEZzNMamcwTWlBeE1EUXVNamd6TERnMUxqZ3hOeUJETVRBMExqSTRNeXczT1M0MU56VWdNVEE0TGpjd09TdzNNUzQ1TlRNZ01URTBMakUwT0N3Mk9DNDRNVElnUXpFeE5TNDNNaklzTmpjdU9UQTBJREV4Tnk0eU16SXNOamN1TkRRNUlERXhPQzQyTXpnc05qY3VORFE1SUVNeE1Ua3VOemdzTmpjdU5EUTVJREV5TUM0M09UWXNOamN1TnpVNElERXlNUzQyTlRZc05qZ3VNell5SUVNeE1qRXVOamM0TERZNExqTTNOeUF4TWpFdU5qazNMRFk0TGpNNU55QXhNakV1TnpFeUxEWTRMalF4T0NCRE1USXlMall3Tml3Mk9TNDJOaklnTVRJekxqQTNPU3czTVM0ek9TQXhNak11TURjNUxEY3pMalF4TlNCRE1USXpMakEzT1N3M09TNDJOVGdnTVRFNExqWTFNeXc0Tnk0eE9UZ2dNVEV6TGpJeE5DdzVNQzR6TXpnZ1F6RXhNUzQyTkN3NU1TNHlORGNnTVRFd0xqRXpMRGt4TGpZeE5DQXhNRGd1TnpJMExEa3hMall4TkNCTU1UQTRMamN5TkN3NU1TNDJNVFFnV2lCTk1UQTJMakF3Tml3NU1DNDFNRFVnUXpFd05pNDNPQ3c1TVM0d016Y2dNVEEzTGpZNU5DdzVNUzR5T0RFZ01UQTRMamN5TkN3NU1TNHlPREVnUXpFeE1DNHdORGNzT1RFdU1qZ3hJREV4TVM0ME56Z3NPVEF1T0RZNElERXhNaTQ1T0N3NU1DNHdNREVnUXpFeE9DNHlPVEVzT0RZdU9UTTFJREV5TWk0Mk1URXNOemt1TkRrMklERXlNaTQyTVRFc056TXVOREF6SUVNeE1qSXVOakV4TERjeExqUTVOQ0F4TWpJdU1UYzNMRFk1TGpnNElERXlNUzR6TlRZc05qZ3VOekU0SUVNeE1qQXVOVGd5TERZNExqRTROU0F4TVRrdU5qWTRMRFkzTGpreE9TQXhNVGd1TmpNNExEWTNMamt4T1NCRE1URTNMak14TlN3Mk55NDVNVGtnTVRFMUxqZzRNeXcyT0M0ek5pQXhNVFF1TXpneUxEWTVMakl5TnlCRE1UQTVMakEzTVN3M01pNHlPVE1nTVRBMExqYzFNU3czT1M0M016TWdNVEEwTGpjMU1TdzROUzQ0TWpZZ1F6RXdOQzQzTlRFc09EY3VOek0xSURFd05TNHhPRFVzT0RrdU16UXpJREV3Tmk0d01EWXNPVEF1TlRBMUlFd3hNRFl1TURBMkxEa3dMalV3TlNCYUlpQnBaRDBpUm1sc2JDMHlNU0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TkRrdU16RTRMRGN1TWpZeUlFd3hNemt1TXpNMExERTJMakUwSUV3eE5UVXVNakkzTERJM0xqRTNNU0JNTVRZd0xqZ3hOaXd5TVM0d05Ua2dUREUwT1M0ek1UZ3NOeTR5TmpJaUlHbGtQU0pHYVd4c0xUSXlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0Mk56WXNNVE11T0RRZ1RERTFPUzQ1TWpnc01Ua3VORFkzSUVNeE5UWXVNamcyTERJeExqVTNJREUxTUM0MExESXhMalU0SURFME5pNDNPREVzTVRrdU5Ea3hJRU14TkRNdU1UWXhMREUzTGpRd01pQXhORE11TVRnc01UUXVNREF6SURFME5pNDRNaklzTVRFdU9TQk1NVFUyTGpNeE55dzJMakk1TWlCTU1UUTVMalU0T0N3eUxqUXdOeUJNTmpjdU56VXlMRFE1TGpRM09DQk1NVEV6TGpZM05TdzNOUzQ1T1RJZ1RERXhOaTQzTlRZc056UXVNakV6SUVNeE1UY3VNemczTERjekxqZzBPQ0F4TVRjdU5qSTFMRGN6TGpNeE5TQXhNVGN1TXpjMExEY3lMamd5TXlCRE1URTFMakF4Tnl3Mk9DNHhPVEVnTVRFMExqYzRNU3cyTXk0eU56Y2dNVEUyTGpZNU1TdzFPQzQxTmpFZ1F6RXlNaTR6TWprc05EUXVOalF4SURFME1TNHlMRE16TGpjME5pQXhOalV1TXpBNUxETXdMalE1TVNCRE1UY3pMalEzT0N3eU9TNHpPRGdnTVRneExqazRPU3d5T1M0MU1qUWdNVGt3TGpBeE15d3pNQzQ0T0RVZ1F6RTVNQzQ0TmpVc016RXVNRE1nTVRreExqYzRPU3d6TUM0NE9UTWdNVGt5TGpReUxETXdMalV5T0NCTU1UazFMalV3TVN3eU9DNDNOU0JNTVRZNUxqWTNOaXd4TXk0NE5DSWdhV1E5SWtacGJHd3RNak1pSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTmk0ME5Ua2dRekV4TXk0MU9UUXNOell1TkRVNUlERXhNeTQxTVRRc056WXVORE00SURFeE15NDBORElzTnpZdU16azNJRXcyTnk0MU1UZ3NORGt1T0RneUlFTTJOeTR6TnpRc05Ea3VOems1SURZM0xqSTROQ3cwT1M0Mk5EVWdOamN1TWpnMUxEUTVMalEzT0NCRE5qY3VNamcxTERRNUxqTXhNU0EyTnk0ek56UXNORGt1TVRVM0lEWTNMalV4T1N3ME9TNHdOek1nVERFME9TNHpOVFVzTWk0d01ESWdRekUwT1M0ME9Ua3NNUzQ1TVRrZ01UUTVMalkzTnl3eExqa3hPU0F4TkRrdU9ESXhMREl1TURBeUlFd3hOVFl1TlRVc05TNDRPRGNnUXpFMU5pNDNOelFzTmk0d01UY2dNVFUyTGpnMUxEWXVNekF5SURFMU5pNDNNaklzTmk0MU1qWWdRekUxTmk0MU9USXNOaTQzTkRrZ01UVTJMak13Tnl3MkxqZ3lOaUF4TlRZdU1EZ3pMRFl1TmprMklFd3hORGt1TlRnM0xESXVPVFEySUV3Mk9DNDJPRGNzTkRrdU5EYzVJRXd4TVRNdU5qYzFMRGMxTGpRMU1pQk1NVEUyTGpVeU15dzNNeTQ0TURnZ1F6RXhOaTQzTVRVc056TXVOamszSURFeE55NHhORE1zTnpNdU16azVJREV4Tmk0NU5UZ3NOek11TURNMUlFTXhNVFF1TlRReUxEWTRMakk0TnlBeE1UUXVNeXcyTXk0eU1qRWdNVEUyTGpJMU9DdzFPQzR6T0RVZ1F6RXhPUzR3TmpRc05URXVORFU0SURFeU5TNHhORE1zTkRVdU1UUXpJREV6TXk0NE5DdzBNQzR4TWpJZ1F6RTBNaTQwT1Rjc016VXVNVEkwSURFMU15NHpOVGdzTXpFdU5qTXpJREUyTlM0eU5EY3NNekF1TURJNElFTXhOek11TkRRMUxESTRMamt5TVNBeE9ESXVNRE0zTERJNUxqQTFPQ0F4T1RBdU1Ea3hMRE13TGpReU5TQkRNVGt3TGpnekxETXdMalUxSURFNU1TNDJOVElzTXpBdU5ETXlJREU1TWk0eE9EWXNNekF1TVRJMElFd3hPVFF1TlRZM0xESTRMamMxSUV3eE5qa3VORFF5TERFMExqSTBOQ0JETVRZNUxqSXhPU3d4TkM0eE1UVWdNVFk1TGpFME1pd3hNeTQ0TWprZ01UWTVMakkzTVN3eE15NDJNRFlnUXpFMk9TNDBMREV6TGpNNE1pQXhOamt1TmpnMUxERXpMak13TmlBeE5qa3VPVEE1TERFekxqUXpOU0JNTVRrMUxqY3pOQ3d5T0M0ek5EVWdRekU1TlM0NE56a3NNamd1TkRJNElERTVOUzQ1Tmpnc01qZ3VOVGd6SURFNU5TNDVOamdzTWpndU56VWdRekU1TlM0NU5qZ3NNamd1T1RFMklERTVOUzQ0Tnprc01qa3VNRGN4SURFNU5TNDNNelFzTWprdU1UVTBJRXd4T1RJdU5qVXpMRE13TGprek15QkRNVGt4TGprek1pd3pNUzR6TlNBeE9UQXVPRGtzTXpFdU5UQTRJREU0T1M0NU16VXNNekV1TXpRMklFTXhPREV1T1RjeUxESTVMams1TlNBeE56TXVORGM0TERJNUxqZzJJREUyTlM0ek56SXNNekF1T1RVMElFTXhOVE11TmpBeUxETXlMalUwTXlBeE5ESXVPRFlzTXpVdU9Ua3pJREV6TkM0ek1EY3NOREF1T1RNeElFTXhNalV1TnprekxEUTFMamcwTnlBeE1Ua3VPRFV4TERVeUxqQXdOQ0F4TVRjdU1USTBMRFU0TGpjek5pQkRNVEUxTGpJM0xEWXpMak14TkNBeE1UVXVOVEF4TERZNExqRXhNaUF4TVRjdU56a3NOekl1TmpFeElFTXhNVGd1TVRZc056TXVNek0ySURFeE55NDRORFVzTnpRdU1USTBJREV4Tmk0NU9TdzNOQzQyTVRjZ1RERXhNeTQ1TURrc056WXVNemszSUVNeE1UTXVPRE0yTERjMkxqUXpPQ0F4TVRNdU56VTJMRGMyTGpRMU9TQXhNVE11TmpjMUxEYzJMalExT1NJZ2FXUTlJa1pwYkd3dE1qUWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV6TGpNeE5pd3lNUzR5TnprZ1F6RTFNQzQ1TURNc01qRXVNamM1SURFME9DNDBPVFVzTWpBdU56VXhJREUwTmk0Mk5qUXNNVGt1TmpreklFTXhORFF1T0RRMkxERTRMalkwTkNBeE5ETXVPRFEwTERFM0xqSXpNaUF4TkRNdU9EUTBMREUxTGpjeE9DQkRNVFF6TGpnME5Dd3hOQzR4T1RFZ01UUTBMamcyTERFeUxqYzJNeUF4TkRZdU56QTFMREV4TGpZNU9DQk1NVFUyTGpFNU9DdzJMakE1TVNCRE1UVTJMak13T1N3MkxqQXlOU0F4TlRZdU5EVXlMRFl1TURZeUlERTFOaTQxTVRnc05pNHhOek1nUXpFMU5pNDFPRE1zTmk0eU9EUWdNVFUyTGpVME55dzJMalF5TnlBeE5UWXVORE0yTERZdU5Ea3pJRXd4TkRZdU9UUXNNVEl1TVRBeUlFTXhORFV1TWpRMExERXpMakE0TVNBeE5EUXVNekV5TERFMExqTTJOU0F4TkRRdU16RXlMREUxTGpjeE9DQkRNVFEwTGpNeE1pd3hOeTR3TlRnZ01UUTFMakl6TERFNExqTXlOaUF4TkRZdU9EazNMREU1TGpJNE9TQkRNVFV3TGpRME5pd3lNUzR6TXpnZ01UVTJMakkwTERJeExqTXlOeUF4TlRrdU9ERXhMREU1TGpJMk5TQk1NVFk1TGpVMU9Td3hNeTQyTXpjZ1F6RTJPUzQyTnl3eE15NDFOek1nTVRZNUxqZ3hNeXd4TXk0Mk1URWdNVFk1TGpnM09Dd3hNeTQzTWpNZ1F6RTJPUzQ1TkRNc01UTXVPRE0wSURFMk9TNDVNRFFzTVRNdU9UYzNJREUyT1M0M09UTXNNVFF1TURReUlFd3hOakF1TURRMUxERTVMalkzSUVNeE5UZ3VNVGczTERJd0xqYzBNaUF4TlRVdU56UTVMREl4TGpJM09TQXhOVE11TXpFMkxESXhMakkzT1NJZ2FXUTlJa1pwYkd3dE1qVWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpZM05TdzNOUzQ1T1RJZ1REWTNMamMyTWl3ME9TNDBPRFFpSUdsa1BTSkdhV3hzTFRJMklpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXhNeTQyTnpVc056WXVNelF5SUVNeE1UTXVOakUxTERjMkxqTTBNaUF4TVRNdU5UVTFMRGMyTGpNeU55QXhNVE11TlN3M05pNHlPVFVnVERZM0xqVTROeXcwT1M0M09EY2dRelkzTGpReE9TdzBPUzQyT1NBMk55NHpOaklzTkRrdU5EYzJJRFkzTGpRMU9TdzBPUzR6TURrZ1F6WTNMalUxTml3ME9TNHhOREVnTmpjdU56Y3NORGt1TURneklEWTNMamt6Tnl3ME9TNHhPQ0JNTVRFekxqZzFMRGMxTGpZNE9DQkRNVEUwTGpBeE9DdzNOUzQzT0RVZ01URTBMakEzTlN3M05pQXhNVE11T1RjNExEYzJMakUyTnlCRE1URXpMamt4TkN3M05pNHlOemtnTVRFekxqYzVOaXczTmk0ek5ESWdNVEV6TGpZM05TdzNOaTR6TkRJaUlHbGtQU0pHYVd4c0xUSTNJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFkzTGpjMk1pdzBPUzQwT0RRZ1REWTNMamMyTWl3eE1ETXVORGcxSUVNMk55NDNOaklzTVRBMExqVTNOU0EyT0M0MU16SXNNVEExTGprd015QTJPUzQwT0RJc01UQTJMalExTWlCTU1URXhMamsxTlN3eE16QXVPVGN6SUVNeE1USXVPVEExTERFek1TNDFNaklnTVRFekxqWTNOU3d4TXpFdU1EZ3pJREV4TXk0Mk56VXNNVEk1TGprNU15Qk1NVEV6TGpZM05TdzNOUzQ1T1RJaUlHbGtQU0pHYVd4c0xUSTRJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TWk0M01qY3NNVE14TGpVMk1TQkRNVEV5TGpRekxERXpNUzQxTmpFZ01URXlMakV3Tnl3eE16RXVORFkySURFeE1TNDNPQ3d4TXpFdU1qYzJJRXcyT1M0ek1EY3NNVEEyTGpjMU5TQkROamd1TWpRMExERXdOaTR4TkRJZ05qY3VOREV5TERFd05DNDNNRFVnTmpjdU5ERXlMREV3TXk0ME9EVWdURFkzTGpReE1pdzBPUzQwT0RRZ1F6WTNMalF4TWl3ME9TNHlPU0EyTnk0MU5qa3NORGt1TVRNMElEWTNMamMyTWl3ME9TNHhNelFnUXpZM0xqazFOaXcwT1M0eE16UWdOamd1TVRFekxEUTVMakk1SURZNExqRXhNeXcwT1M0ME9EUWdURFk0TGpFeE15d3hNRE11TkRnMUlFTTJPQzR4TVRNc01UQTBMalEwTlNBMk9DNDRNaXd4TURVdU5qWTFJRFk1TGpZMU55d3hNRFl1TVRRNElFd3hNVEl1TVRNc01UTXdMalkzSUVNeE1USXVORGMwTERFek1DNDROamdnTVRFeUxqYzVNU3d4TXpBdU9URXpJREV4TXl3eE16QXVOemt5SUVNeE1UTXVNakEyTERFek1DNDJOek1nTVRFekxqTXlOU3d4TXpBdU16Z3hJREV4TXk0ek1qVXNNVEk1TGprNU15Qk1NVEV6TGpNeU5TdzNOUzQ1T1RJZ1F6RXhNeTR6TWpVc056VXVOems0SURFeE15NDBPRElzTnpVdU5qUXhJREV4TXk0Mk56VXNOelV1TmpReElFTXhNVE11T0RZNUxEYzFMalkwTVNBeE1UUXVNREkxTERjMUxqYzVPQ0F4TVRRdU1ESTFMRGMxTGprNU1pQk1NVEUwTGpBeU5Td3hNamt1T1RreklFTXhNVFF1TURJMUxERXpNQzQyTkRnZ01URXpMamM0Tml3eE16RXVNVFEzSURFeE15NHpOU3d4TXpFdU16azVJRU14TVRNdU1UWXlMREV6TVM0MU1EY2dNVEV5TGprMU1pd3hNekV1TlRZeElERXhNaTQzTWpjc01UTXhMalUyTVNJZ2FXUTlJa1pwYkd3dE1qa2lJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV5TGpnMkxEUXdMalV4TWlCRE1URXlMamcyTERRd0xqVXhNaUF4TVRJdU9EWXNOREF1TlRFeUlERXhNaTQ0TlRrc05EQXVOVEV5SUVNeE1UQXVOVFF4TERRd0xqVXhNaUF4TURndU16WXNNemt1T1RrZ01UQTJMamN4Tnl3ek9TNHdOREVnUXpFd05TNHdNVElzTXpndU1EVTNJREV3TkM0d056UXNNell1TnpJMklERXdOQzR3TnpRc016VXVNamt5SUVNeE1EUXVNRGMwTERNekxqZzBOeUF4TURVdU1ESTJMRE15TGpVd01TQXhNRFl1TnpVMExETXhMalV3TkNCTU1URTRMamM1TlN3eU5DNDFOVEVnUXpFeU1DNDBOak1zTWpNdU5UZzVJREV5TWk0Mk5qa3NNak11TURVNElERXlOUzR3TURjc01qTXVNRFU0SUVNeE1qY3VNekkxTERJekxqQTFPQ0F4TWprdU5UQTJMREl6TGpVNE1TQXhNekV1TVRVc01qUXVOVE1nUXpFek1pNDROVFFzTWpVdU5URTBJREV6TXk0M09UTXNNall1T0RRMUlERXpNeTQzT1RNc01qZ3VNamM0SUVNeE16TXVOemt6TERJNUxqY3lOQ0F4TXpJdU9EUXhMRE14TGpBMk9TQXhNekV1TVRFekxETXlMakEyTnlCTU1URTVMakEzTVN3ek9TNHdNVGtnUXpFeE55NDBNRE1zTXprdU9UZ3lJREV4TlM0eE9UY3NOREF1TlRFeUlERXhNaTQ0Tml3ME1DNDFNVElnVERFeE1pNDROaXcwTUM0MU1USWdXaUJOTVRJMUxqQXdOeXd5TXk0M05Ua2dRekV5TWk0M09Td3lNeTQzTlRrZ01USXdMamN3T1N3eU5DNHlOVFlnTVRFNUxqRTBOaXd5TlM0eE5UZ2dUREV3Tnk0eE1EUXNNekl1TVRFZ1F6RXdOUzQyTURJc016SXVPVGM0SURFd05DNDNOelFzTXpRdU1UQTRJREV3TkM0M056UXNNelV1TWpreUlFTXhNRFF1TnpjMExETTJMalEyTlNBeE1EVXVOVGc1TERNM0xqVTRNU0F4TURjdU1EWTNMRE00TGpRek5DQkRNVEE0TGpZd05Td3pPUzR6TWpNZ01URXdMalkyTXl3ek9TNDRNVElnTVRFeUxqZzFPU3d6T1M0NE1USWdUREV4TWk0NE5pd3pPUzQ0TVRJZ1F6RXhOUzR3TnpZc016a3VPREV5SURFeE55NHhOVGdzTXprdU16RTFJREV4T0M0M01qRXNNemd1TkRFeklFd3hNekF1TnpZeUxETXhMalEySUVNeE16SXVNalkwTERNd0xqVTVNeUF4TXpNdU1Ea3lMREk1TGpRMk15QXhNek11TURreUxESTRMakkzT0NCRE1UTXpMakE1TWl3eU55NHhNRFlnTVRNeUxqSTNPQ3d5TlM0NU9TQXhNekF1T0N3eU5TNHhNellnUXpFeU9TNHlOakVzTWpRdU1qUTRJREV5Tnk0eU1EUXNNak11TnpVNUlERXlOUzR3TURjc01qTXVOelU1SUV3eE1qVXVNREEzTERJekxqYzFPU0JhSWlCcFpEMGlSbWxzYkMwek1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOalV1TmpNc01UWXVNakU1SUV3eE5Ua3VPRGsyTERFNUxqVXpJRU14TlRZdU56STVMREl4TGpNMU9DQXhOVEV1TmpFc01qRXVNelkzSURFME9DNDBOak1zTVRrdU5UVWdRekUwTlM0ek1UWXNNVGN1TnpNeklERTBOUzR6TXpJc01UUXVOemM0SURFME9DNDBPVGtzTVRJdU9UUTVJRXd4TlRRdU1qTXpMRGt1TmpNNUlFd3hOalV1TmpNc01UWXVNakU1SWlCcFpEMGlSbWxzYkMwek1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOVFF1TWpNekxERXdMalEwT0NCTU1UWTBMakl5T0N3eE5pNHlNVGtnVERFMU9TNDFORFlzTVRndU9USXpJRU14TlRndU1URXlMREU1TGpjMUlERTFOaTR4T1RRc01qQXVNakEySURFMU5DNHhORGNzTWpBdU1qQTJJRU14TlRJdU1URTRMREl3TGpJd05pQXhOVEF1TWpJMExERTVMamMxTnlBeE5EZ3VPREUwTERFNExqazBNeUJETVRRM0xqVXlOQ3d4T0M0eE9Ua2dNVFEyTGpneE5Dd3hOeTR5TkRrZ01UUTJMamd4TkN3eE5pNHlOamtnUXpFME5pNDRNVFFzTVRVdU1qYzRJREUwTnk0MU16Y3NNVFF1TXpFMElERTBPQzQ0TlN3eE15NDFOVFlnVERFMU5DNHlNek1zTVRBdU5EUTRJRTB4TlRRdU1qTXpMRGt1TmpNNUlFd3hORGd1TkRrNUxERXlMamswT1NCRE1UUTFMak16TWl3eE5DNDNOemdnTVRRMUxqTXhOaXd4Tnk0M016TWdNVFE0TGpRMk15d3hPUzQxTlNCRE1UVXdMakF6TVN3eU1DNDBOVFVnTVRVeUxqQTROaXd5TUM0NU1EY2dNVFUwTGpFME55d3lNQzQ1TURjZ1F6RTFOaTR5TWpRc01qQXVPVEEzSURFMU9DNHpNRFlzTWpBdU5EUTNJREUxT1M0NE9UWXNNVGt1TlRNZ1RERTJOUzQyTXl3eE5pNHlNVGtnVERFMU5DNHlNek1zT1M0Mk16a2lJR2xrUFNKR2FXeHNMVE15SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5TNDBORFVzTnpJdU5qWTNJRXd4TkRVdU5EUTFMRGN5TGpZMk55QkRNVFF6TGpZM01pdzNNaTQyTmpjZ01UUXlMakl3TkN3M01TNDRNVGNnTVRReExqSXdNaXczTUM0ME1qSWdRekUwTVM0eE16VXNOekF1TXpNZ01UUXhMakUwTlN3M01DNHhORGNnTVRReExqSXlOU3czTUM0d05qWWdRekUwTVM0ek1EVXNOamt1T1RnMUlERTBNUzQwTXpJc05qa3VPVFEySURFME1TNDFNalVzTnpBdU1ERXhJRU14TkRJdU16QTJMRGN3TGpVMU9TQXhORE11TWpNeExEY3dMamd5TXlBeE5EUXVNamMyTERjd0xqZ3lNaUJETVRRMUxqVTVPQ3czTUM0NE1qSWdNVFEzTGpBekxEY3dMak0zTmlBeE5EZ3VOVE15TERZNUxqVXdPU0JETVRVekxqZzBNaXcyTmk0ME5ETWdNVFU0TGpFMk15dzFPQzQ1T0RjZ01UVTRMakUyTXl3MU1pNDRPVFFnUXpFMU9DNHhOak1zTlRBdU9UWTNJREUxTnk0M01qRXNORGt1TXpNeUlERTFOaTQ0T0RRc05EZ3VNVFk0SUVNeE5UWXVPREU0TERRNExqQTNOaUF4TlRZdU9ESTRMRFEzTGprME9DQXhOVFl1T1RBNExEUTNMamcyTnlCRE1UVTJMams0T0N3ME55NDNPRFlnTVRVM0xqRXhOQ3cwTnk0M056UWdNVFUzTGpJd09DdzBOeTQ0TkNCRE1UVTRMamczT0N3ME9TNHdNVElnTVRVNUxqYzVPQ3cxTVM0eU1pQXhOVGt1TnprNExEVTBMakExT1NCRE1UVTVMamM1T0N3Mk1DNHpNREVnTVRVMUxqTTNNeXcyT0M0d05EWWdNVFE1TGprek15dzNNUzR4T0RZZ1F6RTBPQzR6Tml3M01pNHdPVFFnTVRRMkxqZzFMRGN5TGpZMk55QXhORFV1TkRRMUxEY3lMalkyTnlCTU1UUTFMalEwTlN3M01pNDJOamNnV2lCTk1UUXlMalEzTml3M01TQkRNVFF6TGpJNUxEY3hMalkxTVNBeE5EUXVNamsyTERjeUxqQXdNaUF4TkRVdU5EUTFMRGN5TGpBd01pQkRNVFEyTGpjMk55dzNNaTR3TURJZ01UUTRMakU1T0N3M01TNDFOU0F4TkRrdU55dzNNQzQyT0RJZ1F6RTFOUzR3TVN3Mk55NDJNVGNnTVRVNUxqTXpNU3cyTUM0eE5Ua2dNVFU1TGpNek1TdzFOQzR3TmpVZ1F6RTFPUzR6TXpFc05USXVNRGcxSURFMU9DNDROamdzTlRBdU5ETTFJREUxT0M0d01EWXNORGt1TWpjeUlFTXhOVGd1TkRFM0xEVXdMak13TnlBeE5UZ3VOak1zTlRFdU5UTXlJREUxT0M0Mk15dzFNaTQ0T1RJZ1F6RTFPQzQyTXl3MU9TNHhNelFnTVRVMExqSXdOU3cyTmk0M05qY2dNVFE0TGpjMk5TdzJPUzQ1TURjZ1F6RTBOeTR4T1RJc056QXVPREUySURFME5TNDJPREVzTnpFdU1qZ3pJREUwTkM0eU56WXNOekV1TWpneklFTXhORE11TmpNMExEY3hMakk0TXlBeE5ETXVNRE16TERjeExqRTVNaUF4TkRJdU5EYzJMRGN4SUV3eE5ESXVORGMyTERjeElGb2lJR2xrUFNKR2FXeHNMVE16SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME9DNDJORGdzTmprdU56QTBJRU14TlRRdU1ETXlMRFkyTGpVNU5pQXhOVGd1TXprMkxEVTVMakEyT0NBeE5UZ3VNemsyTERVeUxqZzVNU0JETVRVNExqTTVOaXcxTUM0NE16a2dNVFUzTGpreE15dzBPUzR4T1RnZ01UVTNMakEzTkN3ME9DNHdNeUJETVRVMUxqSTRPU3cwTmk0M056Z2dNVFV5TGpZNU9TdzBOaTQ0TXpZZ01UUTVMamd4Tml3ME9DNDFNREVnUXpFME5DNDBNek1zTlRFdU5qQTVJREUwTUM0d05qZ3NOVGt1TVRNM0lERTBNQzR3Tmpnc05qVXVNekUwSUVNeE5EQXVNRFk0TERZM0xqTTJOU0F4TkRBdU5UVXlMRFk1TGpBd05pQXhOREV1TXpreExEY3dMakUzTkNCRE1UUXpMakUzTml3M01TNDBNamNnTVRRMUxqYzJOU3czTVM0ek5qa2dNVFE0TGpZME9DdzJPUzQzTURRaUlHbGtQU0pHYVd4c0xUTTBJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwTkM0eU56WXNOekV1TWpjMklFd3hORFF1TWpjMkxEY3hMakkzTmlCRE1UUXpMakV6TXl3M01TNHlOellnTVRReUxqRXhPQ3czTUM0NU5qa2dNVFF4TGpJMU55dzNNQzR6TmpVZ1F6RTBNUzR5TXpZc056QXVNelV4SURFME1TNHlNVGNzTnpBdU16TXlJREUwTVM0eU1ESXNOekF1TXpFeElFTXhOREF1TXpBM0xEWTVMakEyTnlBeE16a3VPRE0xTERZM0xqTXpPU0F4TXprdU9ETTFMRFkxTGpNeE5DQkRNVE01TGpnek5TdzFPUzR3TnpNZ01UUTBMakkyTERVeExqUXpPU0F4TkRrdU55dzBPQzR5T1RnZ1F6RTFNUzR5TnpNc05EY3VNemtnTVRVeUxqYzROQ3cwTmk0NU1qa2dNVFUwTGpFNE9TdzBOaTQ1TWprZ1F6RTFOUzR6TXpJc05EWXVPVEk1SURFMU5pNHpORGNzTkRjdU1qTTJJREUxTnk0eU1EZ3NORGN1T0RNNUlFTXhOVGN1TWpJNUxEUTNMamcxTkNBeE5UY3VNalE0TERRM0xqZzNNeUF4TlRjdU1qWXpMRFEzTGpnNU5DQkRNVFU0TGpFMU55dzBPUzR4TXpnZ01UVTRMall6TERVd0xqZzJOU0F4TlRndU5qTXNOVEl1T0RreElFTXhOVGd1TmpNc05Ua3VNVE15SURFMU5DNHlNRFVzTmpZdU56WTJJREUwT0M0M05qVXNOamt1T1RBM0lFTXhORGN1TVRreUxEY3dMamd4TlNBeE5EVXVOamd4TERjeExqSTNOaUF4TkRRdU1qYzJMRGN4TGpJM05pQk1NVFEwTGpJM05pdzNNUzR5TnpZZ1dpQk5NVFF4TGpVMU9DdzNNQzR4TURRZ1F6RTBNaTR6TXpFc056QXVOak0zSURFME15NHlORFVzTnpFdU1EQTFJREUwTkM0eU56WXNOekV1TURBMUlFTXhORFV1TlRrNExEY3hMakF3TlNBeE5EY3VNRE1zTnpBdU5EWTNJREUwT0M0MU16SXNOamt1TmlCRE1UVXpMamcwTWl3Mk5pNDFNelFnTVRVNExqRTJNeXcxT1M0d016TWdNVFU0TGpFMk15dzFNaTQ1TXprZ1F6RTFPQzR4TmpNc05URXVNRE14SURFMU55NDNNamtzTkRrdU16ZzFJREUxTmk0NU1EY3NORGd1TWpJeklFTXhOVFl1TVRNekxEUTNMalk1TVNBeE5UVXVNakU1TERRM0xqUXdPU0F4TlRRdU1UZzVMRFEzTGpRd09TQkRNVFV5TGpnMk55dzBOeTQwTURrZ01UVXhMalF6TlN3ME55NDRORElnTVRRNUxqa3pNeXcwT0M0M01Ea2dRekUwTkM0Mk1qTXNOVEV1TnpjMUlERTBNQzR6TURJc05Ua3VNamN6SURFME1DNHpNRElzTmpVdU16WTJJRU14TkRBdU16QXlMRFkzTGpJM05pQXhOREF1TnpNMkxEWTRMamswTWlBeE5ERXVOVFU0TERjd0xqRXdOQ0JNTVRReExqVTFPQ3czTUM0eE1EUWdXaUlnYVdROUlrWnBiR3d0TXpVaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UVXdMamN5TERZMUxqTTJNU0JNTVRVd0xqTTFOeXcyTlM0d05qWWdRekUxTVM0eE5EY3NOalF1TURreUlERTFNUzQ0Tmprc05qTXVNRFFnTVRVeUxqVXdOU3cyTVM0NU16Z2dRekUxTXk0ek1UTXNOakF1TlRNNUlERTFNeTQ1Tnpnc05Ua3VNRFkzSURFMU5DNDBPRElzTlRjdU5UWXpJRXd4TlRRdU9USTFMRFUzTGpjeE1pQkRNVFUwTGpReE1pdzFPUzR5TkRVZ01UVXpMamN6TXl3Mk1DNDNORFVnTVRVeUxqa3hMRFl5TGpFM01pQkRNVFV5TGpJMk1pdzJNeTR5T1RVZ01UVXhMalV5TlN3Mk5DNHpOamdnTVRVd0xqY3lMRFkxTGpNMk1TSWdhV1E5SWtacGJHd3RNellpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMUxqa3hOeXc0TkM0MU1UUWdUREV4TlM0MU5UUXNPRFF1TWpJZ1F6RXhOaTR6TkRRc09ETXVNalExSURFeE55NHdOallzT0RJdU1UazBJREV4Tnk0M01ESXNPREV1TURreUlFTXhNVGd1TlRFc056a3VOamt5SURFeE9TNHhOelVzTnpndU1qSWdNVEU1TGpZM09DdzNOaTQzTVRjZ1RERXlNQzR4TWpFc056WXVPRFkxSUVNeE1Ua3VOakE0TERjNExqTTVPQ0F4TVRndU9UTXNOemt1T0RrNUlERXhPQzR4TURZc09ERXVNekkySUVNeE1UY3VORFU0TERneUxqUTBPQ0F4TVRZdU56SXlMRGd6TGpVeU1TQXhNVFV1T1RFM0xEZzBMalV4TkNJZ2FXUTlJa1pwYkd3dE16Y2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEUwTERFek1DNDBOellnVERFeE5Dd3hNekF1TURBNElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc056VXVOVGcwSUV3eE1UUXNOell1TURVeUlFd3hNVFFzTVRNd0xqQXdPQ0JNTVRFMExERXpNQzQwTnpZaUlHbGtQU0pHYVd4c0xUTTRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOEwyYytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa2lJSFJ5WVc1elptOXliVDBpZEhKaGJuTnNZWFJsS0RZeUxqQXdNREF3TUN3Z01DNHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRrdU9ESXlMRE0zTGpRM05DQkRNVGt1T0RNNUxETTNMak16T1NBeE9TNDNORGNzTXpjdU1UazBJREU1TGpVMU5Td3pOeTR3T0RJZ1F6RTVMakl5T0N3ek5pNDRPVFFnTVRndU56STVMRE0yTGpnM01pQXhPQzQwTkRZc016Y3VNRE0zSUV3eE1pNDBNelFzTkRBdU5UQTRJRU14TWk0ek1ETXNOREF1TlRnMElERXlMakkwTERRd0xqWTROaUF4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkRVc05EQXVPVEkxSURFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXhMak0zTVNCTU1USXVNalExTERReExqUXhOQ0JNTVRJdU1qTTRMRFF4TGpVME1pQkRPQzR4TkRnc05ETXVPRGczSURVdU5qUTNMRFExTGpNeU1TQTFMalkwTnl3ME5TNHpNakVnUXpVdU5qUTJMRFExTGpNeU1TQXpMalUzTERRMkxqTTJOeUF5TGpnMkxEVXdMalV4TXlCRE1pNDROaXcxTUM0MU1UTWdNUzQ1TkRnc05UY3VORGMwSURFdU9UWXlMRGN3TGpJMU9DQkRNUzQ1Tnpjc09ESXVPREk0SURJdU5UWTRMRGczTGpNeU9DQXpMakV5T1N3NU1TNDJNRGtnUXpNdU16UTVMRGt6TGpJNU15QTJMakV6TERrekxqY3pOQ0EyTGpFekxEa3pMamN6TkNCRE5pNDBOakVzT1RNdU56YzBJRFl1T0RJNExEa3pMamN3TnlBM0xqSXhMRGt6TGpRNE5pQk1PREl1TkRnekxEUTVMamt6TlNCRE9EUXVNamt4TERRNExqZzJOaUE0TlM0eE5TdzBOaTR5TVRZZ09EVXVOVE01TERRekxqWTFNU0JET0RZdU56VXlMRE0xTGpZMk1TQTROeTR5TVRRc01UQXVOamN6SURnMUxqSTJOQ3d6TGpjM015QkRPRFV1TURZNExETXVNRGdnT0RRdU56VTBMREl1TmprZ09EUXVNemsyTERJdU5Ea3hJRXc0TWk0ek1Td3hMamN3TVNCRE9ERXVOVGd6TERFdU56STVJRGd3TGpnNU5Dd3lMakUyT0NBNE1DNDNOellzTWk0eU16WWdRemd3TGpZek5pd3lMak14TnlBME1TNDRNRGNzTWpRdU5UZzFJREl3TGpBek1pd3pOeTR3TnpJZ1RERTVMamd5TWl3ek55NDBOelFpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9ESXVNekV4TERFdU56QXhJRXc0TkM0ek9UWXNNaTQwT1RFZ1F6ZzBMamMxTkN3eUxqWTVJRGcxTGpBMk9Dd3pMakE0SURnMUxqSTJOQ3d6TGpjM015QkRPRGN1TWpFekxERXdMalkzTXlBNE5pNDNOVEVzTXpVdU5qWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EVXVNVFE1TERRMkxqSXhOaUE0TkM0eU9TdzBPQzQ0TmpZZ09ESXVORGd6TERRNUxqa3pOU0JNTnk0eU1TdzVNeTQwT0RZZ1F6WXVPRGszTERrekxqWTJOeUEyTGpVNU5TdzVNeTQzTkRRZ05pNHpNVFFzT1RNdU56UTBJRXcyTGpFek1TdzVNeTQzTXpNZ1F6WXVNVE14TERrekxqY3pOQ0F6TGpNME9TdzVNeTR5T1RNZ015NHhNamdzT1RFdU5qQTVJRU15TGpVMk9DdzROeTR6TWpjZ01TNDVOemNzT0RJdU9ESTRJREV1T1RZekxEY3dMakkxT0NCRE1TNDVORGdzTlRjdU5EYzBJREl1T0RZc05UQXVOVEV6SURJdU9EWXNOVEF1TlRFeklFTXpMalUzTERRMkxqTTJOeUExTGpZME55dzBOUzR6TWpFZ05TNDJORGNzTkRVdU16SXhJRU0xTGpZME55dzBOUzR6TWpFZ09DNHhORGdzTkRNdU9EZzNJREV5TGpJek9DdzBNUzQxTkRJZ1RERXlMakkwTlN3ME1TNDBNVFFnVERFeUxqSTBOU3cwTVM0ek56RWdRekV5TGpJME5TdzBNUzR5TlRRZ01USXVNalExTERRd0xqa3lOU0F4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkN3ME1DNDJPRFlnTVRJdU16QXlMRFF3TGpVNE15QXhNaTQwTXpRc05EQXVOVEE0SUV3eE9DNDBORFlzTXpjdU1ETTJJRU14T0M0MU56UXNNell1T1RZeUlERTRMamMwTml3ek5pNDVNallnTVRndU9USTNMRE0yTGpreU5pQkRNVGt1TVRRMUxETTJMamt5TmlBeE9TNHpOellzTXpZdU9UYzVJREU1TGpVMU5Dd3pOeTR3T0RJZ1F6RTVMamMwTnl3ek55NHhPVFFnTVRrdU9ETTVMRE0zTGpNMElERTVMamd5TWl3ek55NDBOelFnVERJd0xqQXpNeXd6Tnk0d056SWdRelF4TGpnd05pd3lOQzQxT0RVZ09EQXVOak0yTERJdU16RTRJRGd3TGpjM055d3lMakl6TmlCRE9EQXVPRGswTERJdU1UWTRJRGd4TGpVNE15d3hMamN5T1NBNE1pNHpNVEVzTVM0M01ERWdUVGd5TGpNeE1Td3dMamN3TkNCTU9ESXVNamN5TERBdU56QTFJRU00TVM0Mk5UUXNNQzQzTWpnZ09EQXVPVGc1TERBdU9UUTVJRGd3TGpJNU9Dd3hMak0yTVNCTU9EQXVNamMzTERFdU16Y3pJRU00TUM0eE1qa3NNUzQwTlRnZ05Ua3VOelk0TERFekxqRXpOU0F4T1M0M05UZ3NNell1TURjNUlFTXhPUzQxTERNMUxqazRNU0F4T1M0eU1UUXNNelV1T1RJNUlERTRMamt5Tnl3ek5TNDVNamtnUXpFNExqVTJNaXd6TlM0NU1qa2dNVGd1TWpJekxETTJMakF4TXlBeE55NDVORGNzTXpZdU1UY3pJRXd4TVM0NU16VXNNemt1TmpRMElFTXhNUzQwT1RNc016a3VPRGs1SURFeExqSXpOaXcwTUM0ek16UWdNVEV1TWpRMkxEUXdMamd4SUV3eE1TNHlORGNzTkRBdU9UWWdURFV1TVRZM0xEUTBMalEwTnlCRE5DNDNPVFFzTkRRdU5qUTJJREl1TmpJMUxEUTFMamszT0NBeExqZzNOeXcxTUM0ek5EVWdUREV1T0RjeExEVXdMak00TkNCRE1TNDROaklzTlRBdU5EVTBJREF1T1RVeExEVTNMalUxTnlBd0xqazJOU3czTUM0eU5Ua2dRekF1T1RjNUxEZ3lMamczT1NBeExqVTJPQ3c0Tnk0ek56VWdNaTR4TXpjc09URXVOekkwSUV3eUxqRXpPU3c1TVM0M016a2dRekl1TkRRM0xEazBMakE1TkNBMUxqWXhOQ3c1TkM0Mk5qSWdOUzQ1TnpVc09UUXVOekU1SUV3MkxqQXdPU3c1TkM0M01qTWdRell1TVRFc09UUXVOek0ySURZdU1qRXpMRGswTGpjME1pQTJMak14TkN3NU5DNDNORElnUXpZdU56a3NPVFF1TnpReUlEY3VNallzT1RRdU5qRWdOeTQzTVN3NU5DNHpOU0JNT0RJdU9UZ3pMRFV3TGpjNU9DQkRPRFF1TnprMExEUTVMamN5TnlBNE5TNDVPRElzTkRjdU16YzFJRGcyTGpVeU5TdzBNeTQ0TURFZ1F6ZzNMamN4TVN3ek5TNDVPRGNnT0RndU1qVTVMREV3TGpjd05TQTROaTR5TWpRc015NDFNRElnUXpnMUxqazNNU3d5TGpZd09TQTROUzQxTWl3eExqazNOU0E0TkM0NE9ERXNNUzQyTWlCTU9EUXVOelE1TERFdU5UVTRJRXc0TWk0Mk5qUXNNQzQzTmprZ1F6Z3lMalUxTVN3d0xqY3lOU0E0TWk0ME16RXNNQzQzTURRZ09ESXVNekV4TERBdU56QTBJaUJwWkQwaVJtbHNiQzB5SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZMkxqSTJOeXd4TVM0MU5qVWdURFkzTGpjMk1pd3hNUzQ1T1RrZ1RERXhMalF5TXl3ME5DNHpNalVpSUdsa1BTSkdhV3hzTFRNaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1USXVNakF5TERrd0xqVTBOU0JETVRJdU1ESTVMRGt3TGpVME5TQXhNUzQ0TmpJc09UQXVORFUxSURFeExqYzJPU3c1TUM0eU9UVWdRekV4TGpZek1pdzVNQzR3TlRjZ01URXVOekV6TERnNUxqYzFNaUF4TVM0NU5USXNPRGt1TmpFMElFd3pNQzR6T0Rrc056Z3VPVFk1SUVNek1DNDJNamdzTnpndU9ETXhJRE13TGprek15dzNPQzQ1TVRNZ016RXVNRGN4TERjNUxqRTFNaUJETXpFdU1qQTRMRGM1TGpNNUlETXhMakV5Tnl3M09TNDJPVFlnTXpBdU9EZzRMRGM1TGpnek15Qk1NVEl1TkRVeExEa3dMalEzT0NCTU1USXVNakF5TERrd0xqVTBOU0lnYVdROUlrWnBiR3d0TkNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE15NDNOalFzTkRJdU5qVTBJRXd4TXk0Mk5UWXNOREl1TlRreUlFd3hNeTQzTURJc05ESXVOREl4SUV3eE9DNDRNemNzTXprdU5EVTNJRXd4T1M0d01EY3NNemt1TlRBeUlFd3hPQzQ1TmpJc016a3VOamN6SUV3eE15NDRNamNzTkRJdU5qTTNJRXd4TXk0M05qUXNOREl1TmpVMElpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGd1TlRJc09UQXVNemMxSUV3NExqVXlMRFEyTGpReU1TQk1PQzQxT0RNc05EWXVNemcxSUV3M05TNDROQ3czTGpVMU5DQk1OelV1T0RRc05URXVOVEE0SUV3M05TNDNOemdzTlRFdU5UUTBJRXc0TGpVeUxEa3dMak0zTlNCTU9DNDFNaXc1TUM0ek56VWdXaUJOT0M0M055dzBOaTQxTmpRZ1REZ3VOemNzT0RrdU9UUTBJRXczTlM0MU9URXNOVEV1TXpZMUlFdzNOUzQxT1RFc055NDVPRFVnVERndU56Y3NORFl1TlRZMElFdzRMamMzTERRMkxqVTJOQ0JhSWlCcFpEMGlSbWxzYkMwMklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUSTBMams0Tml3NE15NHhPRElnUXpJMExqYzFOaXc0TXk0ek16RWdNalF1TXpjMExEZ3pMalUyTmlBeU5DNHhNemNzT0RNdU56QTFJRXd4TWk0Mk16SXNPVEF1TkRBMklFTXhNaTR6T1RVc09UQXVOVFExSURFeUxqUXlOaXc1TUM0Mk5UZ2dNVEl1Tnl3NU1DNDJOVGdnVERFekxqSTJOU3c1TUM0Mk5UZ2dRekV6TGpVMExEa3dMalkxT0NBeE15NDVOVGdzT1RBdU5UUTFJREUwTGpFNU5TdzVNQzQwTURZZ1RESTFMamNzT0RNdU56QTFJRU15TlM0NU16Y3NPRE11TlRZMklESTJMakV5T0N3NE15NDBOVElnTWpZdU1USTFMRGd6TGpRME9TQkRNall1TVRJeUxEZ3pMalEwTnlBeU5pNHhNVGtzT0RNdU1qSWdNall1TVRFNUxEZ3lMamswTmlCRE1qWXVNVEU1TERneUxqWTNNaUF5TlM0NU16RXNPREl1TlRZNUlESTFMamN3TVN3NE1pNDNNVGtnVERJMExqazROaXc0TXk0eE9ESWlJR2xrUFNKR2FXeHNMVGNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRNdU1qWTJMRGt3TGpjNE1pQk1NVEl1Tnl3NU1DNDNPRElnUXpFeUxqVXNPVEF1TnpneUlERXlMak00TkN3NU1DNDNNallnTVRJdU16VTBMRGt3TGpZeE5pQkRNVEl1TXpJMExEa3dMalV3TmlBeE1pNHpPVGNzT1RBdU16azVJREV5TGpVMk9TdzVNQzR5T1RrZ1RESTBMakEzTkN3NE15NDFPVGNnUXpJMExqTXhMRGd6TGpRMU9TQXlOQzQyT0Rrc09ETXVNakkySURJMExqa3hPQ3c0TXk0d056Z2dUREkxTGpZek15dzRNaTQyTVRRZ1F6STFMamN5TXl3NE1pNDFOVFVnTWpVdU9ERXpMRGd5TGpVeU5TQXlOUzQ0T1Rrc09ESXVOVEkxSUVNeU5pNHdOekVzT0RJdU5USTFJREkyTGpJME5DdzRNaTQyTlRVZ01qWXVNalEwTERneUxqazBOaUJETWpZdU1qUTBMRGd6TGpFMklESTJMakkwTlN3NE15NHpNRGtnTWpZdU1qUTNMRGd6TGpNNE15Qk1Nall1TWpVekxEZ3pMak00TnlCTU1qWXVNalE1TERnekxqUTFOaUJETWpZdU1qUTJMRGd6TGpVek1TQXlOaTR5TkRZc09ETXVOVE14SURJMUxqYzJNeXc0TXk0NE1USWdUREUwTGpJMU9DdzVNQzQxTVRRZ1F6RTBMRGt3TGpZMk5TQXhNeTQxTmpRc09UQXVOemd5SURFekxqSTJOaXc1TUM0M09ESWdUREV6TGpJMk5pdzVNQzQzT0RJZ1dpQk5NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOeXc1TUM0MU16TWdUREV6TGpJMk5pdzVNQzQxTXpNZ1F6RXpMalV4T0N3NU1DNDFNek1nTVRNdU9URTFMRGt3TGpReU5TQXhOQzR4TXpJc09UQXVNams1SUV3eU5TNDJNemNzT0RNdU5UazNJRU15TlM0NE1EVXNPRE11TkRrNUlESTFMamt6TVN3NE15NDBNalFnTWpVdU9UazRMRGd6TGpNNE15QkRNalV1T1RrMExEZ3pMakk1T1NBeU5TNDVPVFFzT0RNdU1UWTFJREkxTGprNU5DdzRNaTQ1TkRZZ1RESTFMamc1T1N3NE1pNDNOelVnVERJMUxqYzJPQ3c0TWk0NE1qUWdUREkxTGpBMU5DdzRNeTR5T0RjZ1F6STBMamd5TWl3NE15NDBNemNnTWpRdU5ETTRMRGd6TGpZM015QXlOQzR5TERnekxqZ3hNaUJNTVRJdU5qazFMRGt3TGpVeE5DQk1NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOalkyTERrd0xqVXpNaUJhSWlCcFpEMGlSbWxzYkMwNElpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXpMakkyTml3NE9TNDROekVnVERFeUxqY3NPRGt1T0RjeElFTXhNaTQxTERnNUxqZzNNU0F4TWk0ek9EUXNPRGt1T0RFMUlERXlMak0xTkN3NE9TNDNNRFVnUXpFeUxqTXlOQ3c0T1M0MU9UVWdNVEl1TXprM0xEZzVMalE0T0NBeE1pNDFOamtzT0RrdU16ZzRJRXd5TkM0d056UXNPREl1TmpnMklFTXlOQzR6TXpJc09ESXVOVE0xSURJMExqYzJPQ3c0TWk0ME1UZ2dNalV1TURZM0xEZ3lMalF4T0NCTU1qVXVOak15TERneUxqUXhPQ0JETWpVdU9ETXlMRGd5TGpReE9DQXlOUzQ1TkRnc09ESXVORGMwSURJMUxqazNPQ3c0TWk0MU9EUWdRekkyTGpBd09DdzRNaTQyT1RRZ01qVXVPVE0xTERneUxqZ3dNU0F5TlM0M05qTXNPREl1T1RBeElFd3hOQzR5TlRnc09Ea3VOakF6SUVNeE5DdzRPUzQzTlRRZ01UTXVOVFkwTERnNUxqZzNNU0F4TXk0eU5qWXNPRGt1T0RjeElFd3hNeTR5TmpZc09Ea3VPRGN4SUZvZ1RURXlMalkyTml3NE9TNDJNakVnVERFeUxqY3NPRGt1TmpJeUlFd3hNeTR5TmpZc09Ea3VOakl5SUVNeE15NDFNVGdzT0RrdU5qSXlJREV6TGpreE5TdzRPUzQxTVRVZ01UUXVNVE15TERnNUxqTTRPQ0JNTWpVdU5qTTNMRGd5TGpZNE5pQk1NalV1TmpZM0xEZ3lMalkyT0NCTU1qVXVOak15TERneUxqWTJOeUJNTWpVdU1EWTNMRGd5TGpZMk55QkRNalF1T0RFMUxEZ3lMalkyTnlBeU5DNDBNVGdzT0RJdU56YzFJREkwTGpJc09ESXVPVEF4SUV3eE1pNDJPVFVzT0RrdU5qQXpJRXd4TWk0Mk5qWXNPRGt1TmpJeElFd3hNaTQyTmpZc09Ea3VOakl4SUZvaUlHbGtQU0pHYVd4c0xUa2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TXpjc09UQXVPREF4SUV3eE1pNHpOeXc0T1M0MU5UUWdUREV5TGpNM0xEa3dMamd3TVNJZ2FXUTlJa1pwYkd3dE1UQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OaTR4TXl3NU15NDVNREVnUXpVdU16YzVMRGt6TGpnd09DQTBMamd4Tml3NU15NHhOalFnTkM0Mk9URXNPVEl1TlRJMUlFTXpMamcyTERnNExqSTROeUF6TGpVMExEZ3pMamMwTXlBekxqVXlOaXczTVM0eE56TWdRek11TlRFeExEVTRMak00T1NBMExqUXlNeXcxTVM0ME1qZ2dOQzQwTWpNc05URXVOREk0SUVNMUxqRXpOQ3cwTnk0eU9ESWdOeTR5TVN3ME5pNHlNellnTnk0eU1TdzBOaTR5TXpZZ1F6Y3VNakVzTkRZdU1qTTJJRGd4TGpZMk55d3pMakkxSURneUxqQTJPU3d6TGpBeE55QkRPREl1TWpreUxESXVPRGc0SURnMExqVTFOaXd4TGpRek15QTROUzR5TmpRc015NDVOQ0JET0RjdU1qRTBMREV3TGpnMElEZzJMamMxTWl3ek5TNDRNamNnT0RVdU5UTTVMRFF6TGpneE9DQkRPRFV1TVRVc05EWXVNemd6SURnMExqSTVNU3cwT1M0d016TWdPREl1TkRnekxEVXdMakV3TVNCTU55NHlNU3c1TXk0Mk5UTWdRell1T0RJNExEa3pMamczTkNBMkxqUTJNU3c1TXk0NU5ERWdOaTR4TXl3NU15NDVNREVnUXpZdU1UTXNPVE11T1RBeElETXVNelE1TERrekxqUTJJRE11TVRJNUxEa3hMamMzTmlCRE1pNDFOamdzT0RjdU5EazFJREV1T1RjM0xEZ3lMams1TlNBeExqazJNaXczTUM0ME1qVWdRekV1T1RRNExEVTNMalkwTVNBeUxqZzJMRFV3TGpZNElESXVPRFlzTlRBdU5qZ2dRek11TlRjc05EWXVOVE0wSURVdU5qUTNMRFExTGpRNE9TQTFMalkwTnl3ME5TNDBPRGtnUXpVdU5qUTJMRFExTGpRNE9TQTRMakEyTlN3ME5DNHdPVElnTVRJdU1qUTFMRFF4TGpZM09TQk1NVE11TVRFMkxEUXhMalUySUV3eE9TNDNNVFVzTXpjdU56TWdUREU1TGpjMk1Td3pOeTR5TmprZ1REWXVNVE1zT1RNdU9UQXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswMkxqTXhOeXc1TkM0eE5qRWdURFl1TVRBeUxEazBMakUwT0NCTU5pNHhNREVzT1RRdU1UUTRJRXcxTGpnMU55dzVOQzR4TURFZ1F6VXVNVE00TERrekxqazBOU0F6TGpBNE5TdzVNeTR6TmpVZ01pNDRPREVzT1RFdU9EQTVJRU15TGpNeE15dzROeTQwTmprZ01TNDNNamNzT0RJdU9UazJJREV1TnpFekxEY3dMalF5TlNCRE1TNDJPVGtzTlRjdU56Y3hJREl1TmpBMExEVXdMamN4T0NBeUxqWXhNeXcxTUM0Mk5EZ2dRek11TXpNNExEUTJMalF4TnlBMUxqUTBOU3cwTlM0ek1TQTFMalV6TlN3ME5TNHlOallnVERFeUxqRTJNeXcwTVM0ME16a2dUREV6TGpBek15dzBNUzR6TWlCTU1Ua3VORGM1TERNM0xqVTNPQ0JNTVRrdU5URXpMRE0zTGpJME5DQkRNVGt1TlRJMkxETTNMakV3TnlBeE9TNDJORGNzTXpjdU1EQTRJREU1TGpjNE5pd3pOeTR3TWpFZ1F6RTVMamt5TWl3ek55NHdNelFnTWpBdU1ESXpMRE0zTGpFMU5pQXlNQzR3TURrc016Y3VNamt6SUV3eE9TNDVOU3d6Tnk0NE9ESWdUREV6TGpFNU9DdzBNUzQ0TURFZ1RERXlMak15T0N3ME1TNDVNVGtnVERVdU56Y3lMRFExTGpjd05DQkROUzQzTkRFc05EVXVOeklnTXk0M09ESXNORFl1TnpjeUlETXVNVEEyTERVd0xqY3lNaUJETXk0d09Ua3NOVEF1TnpneUlESXVNVGs0TERVM0xqZ3dPQ0F5TGpJeE1pdzNNQzQwTWpRZ1F6SXVNakkyTERneUxqazJNeUF5TGpnd09TdzROeTQwTWlBekxqTTNNeXc1TVM0M01qa2dRek11TkRZMExEa3lMalF5SURRdU1EWXlMRGt5TGpnNE15QTBMalk0TWl3NU15NHhPREVnUXpRdU5UWTJMRGt5TGprNE5DQTBMalE0Tml3NU1pNDNOellnTkM0ME5EWXNPVEl1TlRjeUlFTXpMalkyTlN3NE9DNDFPRGdnTXk0eU9URXNPRFF1TXpjZ015NHlOellzTnpFdU1UY3pJRU16TGpJMk1pdzFPQzQxTWlBMExqRTJOeXcxTVM0ME5qWWdOQzR4TnpZc05URXVNemsySUVNMExqa3dNU3cwTnk0eE5qVWdOeTR3TURnc05EWXVNRFU1SURjdU1EazRMRFEyTGpBeE5DQkROeTR3T1RRc05EWXVNREUxSURneExqVTBNaXd6TGpBek5DQTRNUzQ1TkRRc01pNDRNRElnVERneExqazNNaXd5TGpjNE5TQkRPREl1T0RjMkxESXVNalEzSURnekxqWTVNaXd5TGpBNU55QTROQzR6TXpJc01pNHpOVElnUXpnMExqZzROeXd5TGpVM015QTROUzR5T0RFc015NHdPRFVnT0RVdU5UQTBMRE11T0RjeUlFTTROeTQxTVRnc01URWdPRFl1T1RZMExETTJMakE1TVNBNE5TNDNPRFVzTkRNdU9EVTFJRU00TlM0eU56Z3NORGN1TVRrMklEZzBMakl4TERRNUxqTTNJRGd5TGpZeExEVXdMak14TnlCTU55NHpNelVzT1RNdU9EWTVJRU0yTGprNU9TdzVOQzR3TmpNZ05pNDJOVGdzT1RRdU1UWXhJRFl1TXpFM0xEazBMakUyTVNCTU5pNHpNVGNzT1RRdU1UWXhJRm9nVFRZdU1UY3NPVE11TmpVMElFTTJMalEyTXl3NU15NDJPU0EyTGpjM05DdzVNeTQyTVRjZ055NHdPRFVzT1RNdU5ETTNJRXc0TWk0ek5UZ3NORGt1T0RnMklFTTROQzR4T0RFc05EZ3VPREE0SURnMExqazJMRFExTGprM01TQTROUzR5T1RJc05ETXVOemdnUXpnMkxqUTJOaXd6Tmk0d05Ea2dPRGN1TURJekxERXhMakE0TlNBNE5TNHdNalFzTkM0d01EZ2dRemcwTGpnME5pd3pMak0zTnlBNE5DNDFOVEVzTWk0NU56WWdPRFF1TVRRNExESXVPREUySUVNNE15NDJOalFzTWk0Mk1qTWdPREl1T1RneUxESXVOelkwSURneUxqSXlOeXd6TGpJeE15Qk1PREl1TVRrekxETXVNak0wSUVNNE1TNDNPVEVzTXk0ME5qWWdOeTR6TXpVc05EWXVORFV5SURjdU16TTFMRFEyTGpRMU1pQkROeTR6TURRc05EWXVORFk1SURVdU16UTJMRFEzTGpVeU1TQTBMalkyT1N3MU1TNDBOekVnUXpRdU5qWXlMRFV4TGpVeklETXVOell4TERVNExqVTFOaUF6TGpjM05TdzNNUzR4TnpNZ1F6TXVOemtzT0RRdU16STRJRFF1TVRZeExEZzRMalV5TkNBMExqa3pOaXc1TWk0ME56WWdRelV1TURJMkxEa3lMamt6TnlBMUxqUXhNaXc1TXk0ME5Ua2dOUzQ1TnpNc09UTXVOakUxSUVNMkxqQTROeXc1TXk0Mk5DQTJMakUxT0N3NU15NDJOVElnTmk0eE5qa3NPVE11TmpVMElFdzJMakUzTERrekxqWTFOQ0JNTmk0eE55dzVNeTQyTlRRZ1dpSWdhV1E5SWtacGJHd3RNVElpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0ek1UY3NOamd1T1RneUlFTTNMamd3Tml3Mk9DNDNNREVnT0M0eU1ESXNOamd1T1RJMklEZ3VNakF5TERZNUxqUTROeUJET0M0eU1ESXNOekF1TURRM0lEY3VPREEyTERjd0xqY3pJRGN1TXpFM0xEY3hMakF4TWlCRE5pNDRNamtzTnpFdU1qazBJRFl1TkRNekxEY3hMakEyT1NBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SWlCcFpEMGlSbWxzYkMweE15SWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMamt5TERjeExqRXpNeUJETmk0Mk16RXNOekV1TVRNeklEWXVORE16TERjd0xqa3dOU0EyTGpRek15dzNNQzQxTURnZ1F6WXVORE16TERZNUxqazBPQ0EyTGpneU9TdzJPUzR5TmpVZ055NHpNVGNzTmpndU9UZ3lJRU0zTGpRMkxEWTRMamtnTnk0MU9UVXNOamd1T0RZeElEY3VOekUwTERZNExqZzJNU0JET0M0d01ETXNOamd1T0RZeElEZ3VNakF5TERZNUxqQTVJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROeTR4TnpRc056RXVNRGswSURjdU1ETTVMRGN4TGpFek15QTJMamt5TERjeExqRXpNeUJOTnk0M01UUXNOamd1TmpjMElFTTNMalUxTnl3Mk9DNDJOelFnTnk0ek9USXNOamd1TnpJeklEY3VNakkwTERZNExqZ3lNU0JETmk0Mk56WXNOamt1TVRNNElEWXVNalEyTERZNUxqZzNPU0EyTGpJME5pdzNNQzQxTURnZ1F6WXVNalEyTERjd0xqazVOQ0EyTGpVeE55dzNNUzR6TWlBMkxqa3lMRGN4TGpNeUlFTTNMakEzT0N3M01TNHpNaUEzTGpJME15dzNNUzR5TnpFZ055NDBNVEVzTnpFdU1UYzBJRU0zTGprMU9TdzNNQzQ0TlRjZ09DNHpPRGtzTnpBdU1URTNJRGd1TXpnNUxEWTVMalE0TnlCRE9DNHpPRGtzTmprdU1EQXhJRGd1TVRFM0xEWTRMalkzTkNBM0xqY3hOQ3cyT0M0Mk56UWlJR2xrUFNKR2FXeHNMVEUwSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZdU9USXNOekF1T1RRM0lFTTJMalkwT1N3M01DNDVORGNnTmk0Mk1qRXNOekF1TmpRZ05pNDJNakVzTnpBdU5UQTRJRU0yTGpZeU1TdzNNQzR3TVRjZ05pNDVPRElzTmprdU16a3lJRGN1TkRFeExEWTVMakUwTlNCRE55NDFNakVzTmprdU1EZ3lJRGN1TmpJMUxEWTVMakEwT1NBM0xqY3hOQ3cyT1M0d05Ea2dRemN1T1RnMkxEWTVMakEwT1NBNExqQXhOU3cyT1M0ek5UVWdPQzR3TVRVc05qa3VORGczSUVNNExqQXhOU3cyT1M0NU56Z2dOeTQyTlRJc056QXVOakF6SURjdU1qSTBMRGN3TGpnMU1TQkROeTR4TVRVc056QXVPVEUwSURjdU1ERXNOekF1T1RRM0lEWXVPVElzTnpBdU9UUTNJRTAzTGpjeE5DdzJPQzQ0TmpFZ1F6Y3VOVGsxTERZNExqZzJNU0EzTGpRMkxEWTRMamtnTnk0ek1UY3NOamd1T1RneUlFTTJMamd5T1N3Mk9TNHlOalVnTmk0ME16TXNOamt1T1RRNElEWXVORE16TERjd0xqVXdPQ0JETmk0ME16TXNOekF1T1RBMUlEWXVOak14TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCRE55NHdNemtzTnpFdU1UTXpJRGN1TVRjMExEY3hMakE1TkNBM0xqTXhOeXczTVM0d01USWdRemN1T0RBMkxEY3dMamN6SURndU1qQXlMRGN3TGpBME55QTRMakl3TWl3Mk9TNDBPRGNnUXpndU1qQXlMRFk1TGpBNUlEZ3VNREF6TERZNExqZzJNU0EzTGpjeE5DdzJPQzQ0TmpFaUlHbGtQU0pHYVd4c0xURTFJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGN1TkRRMExEZzFMak0xSUVNM0xqY3dPQ3c0TlM0eE9UZ2dOeTQ1TWpFc09EVXVNekU1SURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVPVEkxSURjdU56QTRMRGcyTGpJNU1pQTNMalEwTkN3NE5pNDBORFFnUXpjdU1UZ3hMRGcyTGpVNU55QTJMamsyTnl3NE5pNDBOelVnTmk0NU5qY3NPRFl1TVRjeklFTTJMamsyTnl3NE5TNDROekVnTnk0eE9ERXNPRFV1TlRBeUlEY3VORFEwTERnMUxqTTFJaUJwWkQwaVJtbHNiQzB4TmlJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswM0xqSXpMRGcyTGpVeElFTTNMakEzTkN3NE5pNDFNU0EyTGprMk55dzROaTR6T0RjZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSUVNM0xqVXlNU3c0TlM0ek1EVWdOeTQxT1RRc09EVXVNamcwSURjdU5qVTRMRGcxTGpJNE5DQkROeTQ0TVRRc09EVXVNamcwSURjdU9USXhMRGcxTGpRd09DQTNMamt5TVN3NE5TNDJNaklnUXpjdU9USXhMRGcxTGpreU5TQTNMamN3T0N3NE5pNHlPVElnTnk0ME5EUXNPRFl1TkRRMElFTTNMak0yTnl3NE5pNDBPRGtnTnk0eU9UUXNPRFl1TlRFZ055NHlNeXc0Tmk0MU1TQk5OeTQyTlRnc09EVXVNRGs0SUVNM0xqVTFPQ3c0TlM0d09UZ2dOeTQwTlRVc09EVXVNVEkzSURjdU16VXhMRGcxTGpFNE9DQkROeTR3TXpFc09EVXVNemN6SURZdU56Z3hMRGcxTGpnd05pQTJMamM0TVN3NE5pNHhOek1nUXpZdU56Z3hMRGcyTGpRNE1pQTJMamsyTml3NE5pNDJPVGNnTnk0eU15dzROaTQyT1RjZ1F6Y3VNek1zT0RZdU5qazNJRGN1TkRNekxEZzJMalkyTmlBM0xqVXpPQ3c0Tmk0Mk1EY2dRemN1T0RVNExEZzJMalF5TWlBNExqRXdPQ3c0TlM0NU9Ea2dPQzR4TURnc09EVXVOakl5SUVNNExqRXdPQ3c0TlM0ek1UTWdOeTQ1TWpNc09EVXVNRGs0SURjdU5qVTRMRGcxTGpBNU9DSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU00TURrM1FUSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0eU15dzROaTR6TWpJZ1REY3VNVFUwTERnMkxqRTNNeUJETnk0eE5UUXNPRFV1T1RNNElEY3VNek16TERnMUxqWXlPU0EzTGpVek9DdzROUzQxTVRJZ1REY3VOalU0TERnMUxqUTNNU0JNTnk0M016UXNPRFV1TmpJeUlFTTNMamN6TkN3NE5TNDROVFlnTnk0MU5UVXNPRFl1TVRZMElEY3VNelV4TERnMkxqSTRNaUJNTnk0eU15dzROaTR6TWpJZ1RUY3VOalU0TERnMUxqSTROQ0JETnk0MU9UUXNPRFV1TWpnMElEY3VOVEl4TERnMUxqTXdOU0EzTGpRME5DdzROUzR6TlNCRE55NHhPREVzT0RVdU5UQXlJRFl1T1RZM0xEZzFMamczTVNBMkxqazJOeXc0Tmk0eE56TWdRell1T1RZM0xEZzJMak00TnlBM0xqQTNOQ3c0Tmk0MU1TQTNMakl6TERnMkxqVXhJRU0zTGpJNU5DdzROaTQxTVNBM0xqTTJOeXc0Tmk0ME9Ea2dOeTQwTkRRc09EWXVORFEwSUVNM0xqY3dPQ3c0Tmk0eU9USWdOeTQ1TWpFc09EVXVPVEkxSURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVOREE0SURjdU9ERTBMRGcxTGpJNE5DQTNMalkxT0N3NE5TNHlPRFFpSUdsa1BTSkdhV3hzTFRFNElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUYzNMakkzT0N3M0xqYzJPU0JNTnpjdU1qYzRMRFV4TGpRek5pQk1NVEF1TWpBNExEa3dMakUySUV3eE1DNHlNRGdzTkRZdU5Ea3pJRXczTnk0eU56Z3NOeTQzTmpraUlHbGtQU0pHYVd4c0xURTVJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV3TGpBNE15dzVNQzR6TnpVZ1RERXdMakE0TXl3ME5pNDBNakVnVERFd0xqRTBOaXcwTmk0ek9EVWdURGMzTGpRd015dzNMalUxTkNCTU56Y3VOREF6TERVeExqVXdPQ0JNTnpjdU16UXhMRFV4TGpVME5DQk1NVEF1TURnekxEa3dMak0zTlNCTU1UQXVNRGd6TERrd0xqTTNOU0JhSUUweE1DNHpNek1zTkRZdU5UWTBJRXd4TUM0ek16TXNPRGt1T1RRMElFdzNOeTR4TlRRc05URXVNelkxSUV3M055NHhOVFFzTnk0NU9EVWdUREV3TGpNek15dzBOaTQxTmpRZ1RERXdMak16TXl3ME5pNDFOalFnV2lJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNalV1TnpNM0xEZzRMalkwTnlCTU1URTRMakE1T0N3NU1TNDVPREVnVERFeE9DNHdPVGdzT0RRZ1RERXdOaTQyTXprc09EZ3VOekV6SUV3eE1EWXVOak01TERrMkxqazRNaUJNT1Rrc01UQXdMak14TlNCTU1URXlMak0yT1N3eE1ETXVPVFl4SUV3eE1qVXVOek0zTERnNExqWTBOeUlnYVdROUlrbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVElpSUdacGJHdzlJaU0wTlRWQk5qUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxTm9ZWEJsUjNKdmRYQWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5blBnb2dJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lEd3ZaejRLUEM5emRtYysnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUm90YXRlSW5zdHJ1Y3Rpb25zO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFNlbnNvclNhbXBsZSA9IHJlcXVpcmUoJy4vc2Vuc29yLXNhbXBsZS5qcycpO1xudmFyIE1hdGhVdGlsID0gcmVxdWlyZSgnLi4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwuanMnKTtcblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBhIHNpbXBsZSBjb21wbGVtZW50YXJ5IGZpbHRlciwgd2hpY2ggZnVzZXMgZ3lyb3Njb3BlIGFuZFxuICogYWNjZWxlcm9tZXRlciBkYXRhIGZyb20gdGhlICdkZXZpY2Vtb3Rpb24nIGV2ZW50LlxuICpcbiAqIEFjY2VsZXJvbWV0ZXIgZGF0YSBpcyB2ZXJ5IG5vaXN5LCBidXQgc3RhYmxlIG92ZXIgdGhlIGxvbmcgdGVybS5cbiAqIEd5cm9zY29wZSBkYXRhIGlzIHNtb290aCwgYnV0IHRlbmRzIHRvIGRyaWZ0IG92ZXIgdGhlIGxvbmcgdGVybS5cbiAqXG4gKiBUaGlzIGZ1c2lvbiBpcyByZWxhdGl2ZWx5IHNpbXBsZTpcbiAqIDEuIEdldCBvcmllbnRhdGlvbiBlc3RpbWF0ZXMgZnJvbSBhY2NlbGVyb21ldGVyIGJ5IGFwcGx5aW5nIGEgbG93LXBhc3MgZmlsdGVyXG4gKiAgICBvbiB0aGF0IGRhdGEuXG4gKiAyLiBHZXQgb3JpZW50YXRpb24gZXN0aW1hdGVzIGZyb20gZ3lyb3Njb3BlIGJ5IGludGVncmF0aW5nIG92ZXIgdGltZS5cbiAqIDMuIENvbWJpbmUgdGhlIHR3byBlc3RpbWF0ZXMsIHdlaWdoaW5nICgxKSBpbiB0aGUgbG9uZyB0ZXJtLCBidXQgKDIpIGZvciB0aGVcbiAqICAgIHNob3J0IHRlcm0uXG4gKi9cbmZ1bmN0aW9uIENvbXBsZW1lbnRhcnlGaWx0ZXIoa0ZpbHRlcikge1xuICB0aGlzLmtGaWx0ZXIgPSBrRmlsdGVyO1xuXG4gIC8vIFJhdyBzZW5zb3IgbWVhc3VyZW1lbnRzLlxuICB0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50ID0gbmV3IFNlbnNvclNhbXBsZSgpO1xuICB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG4gIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG5cbiAgLy8gU2V0IGRlZmF1bHQgbG9vayBkaXJlY3Rpb24gdG8gYmUgaW4gdGhlIGNvcnJlY3QgZGlyZWN0aW9uLlxuICBpZiAoVXRpbC5pc0lPUygpKSB7XG4gICAgdGhpcy5maWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oLTEsIDAsIDAsIDEpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuZmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKDEsIDAsIDAsIDEpO1xuICB9XG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xuXG4gIC8vIE9yaWVudGF0aW9uIGJhc2VkIG9uIHRoZSBhY2NlbGVyb21ldGVyLlxuICB0aGlzLmFjY2VsUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBvcmllbnRhdGlvbiBoYXMgYmVlbiBpbml0aWFsaXplZC5cbiAgdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgLy8gUnVubmluZyBlc3RpbWF0ZSBvZiBncmF2aXR5IGJhc2VkIG9uIHRoZSBjdXJyZW50IG9yaWVudGF0aW9uLlxuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICAvLyBNZWFzdXJlZCBncmF2aXR5IGJhc2VkIG9uIGFjY2VsZXJvbWV0ZXIuXG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcblxuICAvLyBEZWJ1ZyBvbmx5IHF1YXRlcm5pb24gb2YgZ3lyby1iYXNlZCBvcmllbnRhdGlvbi5cbiAgdGhpcy5neXJvSW50ZWdyYWxRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWRkQWNjZWxNZWFzdXJlbWVudCA9IGZ1bmN0aW9uKHZlY3RvciwgdGltZXN0YW1wUykge1xuICB0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNldCh2ZWN0b3IsIHRpbWVzdGFtcFMpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWRkR3lyb01lYXN1cmVtZW50ID0gZnVuY3Rpb24odmVjdG9yLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC5zZXQodmVjdG9yLCB0aW1lc3RhbXBTKTtcblxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUztcbiAgaWYgKFV0aWwuaXNUaW1lc3RhbXBEZWx0YVZhbGlkKGRlbHRhVCkpIHtcbiAgICB0aGlzLnJ1bl8oKTtcbiAgfVxuXG4gIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQuY29weSh0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQpO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUucnVuXyA9IGZ1bmN0aW9uKCkge1xuXG4gIGlmICghdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQpIHtcbiAgICB0aGlzLmFjY2VsUSA9IHRoaXMuYWNjZWxUb1F1YXRlcm5pb25fKHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2FtcGxlKTtcbiAgICB0aGlzLnByZXZpb3VzRmlsdGVyUS5jb3B5KHRoaXMuYWNjZWxRKTtcbiAgICB0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGRlbHRhVCA9IHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTIC1cbiAgICAgIHRoaXMucHJldmlvdXNHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUztcblxuICAvLyBDb252ZXJ0IGd5cm8gcm90YXRpb24gdmVjdG9yIHRvIGEgcXVhdGVybmlvbiBkZWx0YS5cbiAgdmFyIGd5cm9EZWx0YVEgPSB0aGlzLmd5cm9Ub1F1YXRlcm5pb25EZWx0YV8odGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnNhbXBsZSwgZGVsdGFUKTtcbiAgdGhpcy5neXJvSW50ZWdyYWxRLm11bHRpcGx5KGd5cm9EZWx0YVEpO1xuXG4gIC8vIGZpbHRlcl8xID0gSyAqIChmaWx0ZXJfMCArIGd5cm8gKiBkVCkgKyAoMSAtIEspICogYWNjZWwuXG4gIHRoaXMuZmlsdGVyUS5jb3B5KHRoaXMucHJldmlvdXNGaWx0ZXJRKTtcbiAgdGhpcy5maWx0ZXJRLm11bHRpcGx5KGd5cm9EZWx0YVEpO1xuXG4gIC8vIENhbGN1bGF0ZSB0aGUgZGVsdGEgYmV0d2VlbiB0aGUgY3VycmVudCBlc3RpbWF0ZWQgZ3Jhdml0eSBhbmQgdGhlIHJlYWxcbiAgLy8gZ3Jhdml0eSB2ZWN0b3IgZnJvbSBhY2NlbGVyb21ldGVyLlxuICB2YXIgaW52RmlsdGVyUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIGludkZpbHRlclEuY29weSh0aGlzLmZpbHRlclEpO1xuICBpbnZGaWx0ZXJRLmludmVyc2UoKTtcblxuICB0aGlzLmVzdGltYXRlZEdyYXZpdHkuc2V0KDAsIDAsIC0xKTtcbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5LmFwcGx5UXVhdGVybmlvbihpbnZGaWx0ZXJRKTtcbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5Lm5vcm1hbGl6ZSgpO1xuXG4gIHRoaXMubWVhc3VyZWRHcmF2aXR5LmNvcHkodGhpcy5jdXJyZW50QWNjZWxNZWFzdXJlbWVudC5zYW1wbGUpO1xuICB0aGlzLm1lYXN1cmVkR3Jhdml0eS5ub3JtYWxpemUoKTtcblxuICAvLyBDb21wYXJlIGVzdGltYXRlZCBncmF2aXR5IHdpdGggbWVhc3VyZWQgZ3Jhdml0eSwgZ2V0IHRoZSBkZWx0YSBxdWF0ZXJuaW9uXG4gIC8vIGJldHdlZW4gdGhlIHR3by5cbiAgdmFyIGRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIGRlbHRhUS5zZXRGcm9tVW5pdFZlY3RvcnModGhpcy5lc3RpbWF0ZWRHcmF2aXR5LCB0aGlzLm1lYXN1cmVkR3Jhdml0eSk7XG4gIGRlbHRhUS5pbnZlcnNlKCk7XG5cbiAgaWYgKFV0aWwuaXNEZWJ1ZygpKSB7XG4gICAgY29uc29sZS5sb2coJ0RlbHRhOiAlZCBkZWcsIEdfZXN0OiAoJXMsICVzLCAlcyksIEdfbWVhczogKCVzLCAlcywgJXMpJyxcbiAgICAgICAgICAgICAgICBNYXRoVXRpbC5yYWRUb0RlZyAqIFV0aWwuZ2V0UXVhdGVybmlvbkFuZ2xlKGRlbHRhUSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS54KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueSkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnopLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LngpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LnkpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMubWVhc3VyZWRHcmF2aXR5LnopLnRvRml4ZWQoMSkpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIHRoZSBTTEVSUCB0YXJnZXQ6IGN1cnJlbnQgb3JpZW50YXRpb24gcGx1cyB0aGUgbWVhc3VyZWQtZXN0aW1hdGVkXG4gIC8vIHF1YXRlcm5pb24gZGVsdGEuXG4gIHZhciB0YXJnZXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdGFyZ2V0US5jb3B5KHRoaXMuZmlsdGVyUSk7XG4gIHRhcmdldFEubXVsdGlwbHkoZGVsdGFRKTtcblxuICAvLyBTTEVSUCBmYWN0b3I6IDAgaXMgcHVyZSBneXJvLCAxIGlzIHB1cmUgYWNjZWwuXG4gIHRoaXMuZmlsdGVyUS5zbGVycCh0YXJnZXRRLCAxIC0gdGhpcy5rRmlsdGVyKTtcblxuICB0aGlzLnByZXZpb3VzRmlsdGVyUS5jb3B5KHRoaXMuZmlsdGVyUSk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5maWx0ZXJRO1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuYWNjZWxUb1F1YXRlcm5pb25fID0gZnVuY3Rpb24oYWNjZWwpIHtcbiAgdmFyIG5vcm1BY2NlbCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG4gIG5vcm1BY2NlbC5jb3B5KGFjY2VsKTtcbiAgbm9ybUFjY2VsLm5vcm1hbGl6ZSgpO1xuICB2YXIgcXVhdCA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHF1YXQuc2V0RnJvbVVuaXRWZWN0b3JzKG5ldyBNYXRoVXRpbC5WZWN0b3IzKDAsIDAsIC0xKSwgbm9ybUFjY2VsKTtcbiAgcXVhdC5pbnZlcnNlKCk7XG4gIHJldHVybiBxdWF0O1xufTtcblxuQ29tcGxlbWVudGFyeUZpbHRlci5wcm90b3R5cGUuZ3lyb1RvUXVhdGVybmlvbkRlbHRhXyA9IGZ1bmN0aW9uKGd5cm8sIGR0KSB7XG4gIC8vIEV4dHJhY3QgYXhpcyBhbmQgYW5nbGUgZnJvbSB0aGUgZ3lyb3Njb3BlIGRhdGEuXG4gIHZhciBxdWF0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgdmFyIGF4aXMgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuICBheGlzLmNvcHkoZ3lybyk7XG4gIGF4aXMubm9ybWFsaXplKCk7XG4gIHF1YXQuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBneXJvLmxlbmd0aCgpICogZHQpO1xuICByZXR1cm4gcXVhdDtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb21wbGVtZW50YXJ5RmlsdGVyO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBDb21wbGVtZW50YXJ5RmlsdGVyID0gcmVxdWlyZSgnLi9jb21wbGVtZW50YXJ5LWZpbHRlci5qcycpO1xudmFyIFBvc2VQcmVkaWN0b3IgPSByZXF1aXJlKCcuL3Bvc2UtcHJlZGljdG9yLmpzJyk7XG52YXIgVG91Y2hQYW5uZXIgPSByZXF1aXJlKCcuLi90b3VjaC1wYW5uZXIuanMnKTtcbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8qKlxuICogVGhlIHBvc2Ugc2Vuc29yLCBpbXBsZW1lbnRlZCB1c2luZyBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gRnVzaW9uUG9zZVNlbnNvcigpIHtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICdWUiBQb3NpdGlvbiBEZXZpY2UgKHdlYnZyLXBvbHlmaWxsOmZ1c2VkKSc7XG5cbiAgdGhpcy5hY2NlbGVyb21ldGVyID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgdGhpcy5neXJvc2NvcGUgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMygpO1xuXG4gIHRoaXMuc3RhcnQoKTtcblxuICB0aGlzLmZpbHRlciA9IG5ldyBDb21wbGVtZW50YXJ5RmlsdGVyKFdlYlZSQ29uZmlnLktfRklMVEVSKTtcbiAgdGhpcy5wb3NlUHJlZGljdG9yID0gbmV3IFBvc2VQcmVkaWN0b3IoV2ViVlJDb25maWcuUFJFRElDVElPTl9USU1FX1MpO1xuICB0aGlzLnRvdWNoUGFubmVyID0gbmV3IFRvdWNoUGFubmVyKCk7XG5cbiAgdGhpcy5maWx0ZXJUb1dvcmxkUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG5cbiAgLy8gU2V0IHRoZSBmaWx0ZXIgdG8gd29ybGQgdHJhbnNmb3JtLCBkZXBlbmRpbmcgb24gT1MuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMSwgMCwgMCksIE1hdGguUEkgLyAyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMSwgMCwgMCksIC1NYXRoLlBJIC8gMik7XG4gIH1cblxuICB0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMud29ybGRUb1NjcmVlblEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICB0aGlzLm9yaWdpbmFsUG9zZUFkanVzdFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtd2luZG93Lm9yaWVudGF0aW9uICogTWF0aC5QSSAvIDE4MCk7XG5cbiAgdGhpcy5zZXRTY3JlZW5UcmFuc2Zvcm1fKCk7XG4gIC8vIEFkanVzdCB0aGlzIGZpbHRlciBmb3IgYmVpbmcgaW4gbGFuZHNjYXBlIG1vZGUuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpKSB7XG4gICAgdGhpcy5maWx0ZXJUb1dvcmxkUS5tdWx0aXBseSh0aGlzLmludmVyc2VXb3JsZFRvU2NyZWVuUSk7XG4gIH1cblxuICAvLyBLZWVwIHRyYWNrIG9mIGEgcmVzZXQgdHJhbnNmb3JtIGZvciByZXNldFNlbnNvci5cbiAgdGhpcy5yZXNldFEgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuXG4gIHRoaXMuaXNGaXJlZm94QW5kcm9pZCA9IFV0aWwuaXNGaXJlZm94QW5kcm9pZCgpO1xuICB0aGlzLmlzSU9TID0gVXRpbC5pc0lPUygpO1xuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfID0gbmV3IEZsb2F0MzJBcnJheSg0KTtcbn1cblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gVGhpcyBQb3NlU2Vuc29yIGRvZXNuJ3Qgc3VwcG9ydCBwb3NpdGlvblxuICByZXR1cm4gbnVsbDtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8vIENvbnZlcnQgZnJvbSBmaWx0ZXIgc3BhY2UgdG8gdGhlIHRoZSBzYW1lIHN5c3RlbSB1c2VkIGJ5IHRoZVxuICAvLyBkZXZpY2VvcmllbnRhdGlvbiBldmVudC5cbiAgdmFyIG9yaWVudGF0aW9uID0gdGhpcy5maWx0ZXIuZ2V0T3JpZW50YXRpb24oKTtcblxuICAvLyBQcmVkaWN0IG9yaWVudGF0aW9uLlxuICB0aGlzLnByZWRpY3RlZFEgPSB0aGlzLnBvc2VQcmVkaWN0b3IuZ2V0UHJlZGljdGlvbihvcmllbnRhdGlvbiwgdGhpcy5neXJvc2NvcGUsIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTKTtcblxuICAvLyBDb252ZXJ0IHRvIFRIUkVFIGNvb3JkaW5hdGUgc3lzdGVtOiAtWiBmb3J3YXJkLCBZIHVwLCBYIHJpZ2h0LlxuICB2YXIgb3V0ID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbiAgb3V0LmNvcHkodGhpcy5maWx0ZXJUb1dvcmxkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLnJlc2V0USk7XG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgb3V0Lm11bHRpcGx5KHRoaXMudG91Y2hQYW5uZXIuZ2V0T3JpZW50YXRpb24oKSk7XG4gIH1cbiAgb3V0Lm11bHRpcGx5KHRoaXMucHJlZGljdGVkUSk7XG4gIG91dC5tdWx0aXBseSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcblxuICAvLyBIYW5kbGUgdGhlIHlhdy1vbmx5IGNhc2UuXG4gIGlmIChXZWJWUkNvbmZpZy5ZQVdfT05MWSkge1xuICAgIC8vIE1ha2UgYSBxdWF0ZXJuaW9uIHRoYXQgb25seSB0dXJucyBhcm91bmQgdGhlIFktYXhpcy5cbiAgICBvdXQueCA9IDA7XG4gICAgb3V0LnogPSAwO1xuICAgIG91dC5ub3JtYWxpemUoKTtcbiAgfVxuXG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzBdID0gb3V0Lng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gb3V0Lnk7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzJdID0gb3V0Lno7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzNdID0gb3V0Lnc7XG4gIHJldHVybiB0aGlzLm9yaWVudGF0aW9uT3V0Xztcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnJlc2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBSZWR1Y2UgdG8gaW52ZXJ0ZWQgeWF3LW9ubHkuXG4gIHRoaXMucmVzZXRRLmNvcHkodGhpcy5maWx0ZXIuZ2V0T3JpZW50YXRpb24oKSk7XG4gIHRoaXMucmVzZXRRLnggPSAwO1xuICB0aGlzLnJlc2V0US55ID0gMDtcbiAgdGhpcy5yZXNldFEueiAqPSAtMTtcbiAgdGhpcy5yZXNldFEubm9ybWFsaXplKCk7XG5cbiAgLy8gVGFrZSBpbnRvIGFjY291bnQgZXh0cmEgdHJhbnNmb3JtYXRpb25zIGluIGxhbmRzY2FwZSBtb2RlLlxuICBpZiAoVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSkge1xuICAgIHRoaXMucmVzZXRRLm11bHRpcGx5KHRoaXMuaW52ZXJzZVdvcmxkVG9TY3JlZW5RKTtcbiAgfVxuXG4gIC8vIFRha2UgaW50byBhY2NvdW50IG9yaWdpbmFsIHBvc2UuXG4gIHRoaXMucmVzZXRRLm11bHRpcGx5KHRoaXMub3JpZ2luYWxQb3NlQWRqdXN0USk7XG5cbiAgaWYgKCFXZWJWUkNvbmZpZy5UT1VDSF9QQU5ORVJfRElTQUJMRUQpIHtcbiAgICB0aGlzLnRvdWNoUGFubmVyLnJlc2V0U2Vuc29yKCk7XG4gIH1cbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLm9uRGV2aWNlTW90aW9uQ2hhbmdlXyA9IGZ1bmN0aW9uKGRldmljZU1vdGlvbikge1xuICB2YXIgYWNjR3Jhdml0eSA9IGRldmljZU1vdGlvbi5hY2NlbGVyYXRpb25JbmNsdWRpbmdHcmF2aXR5O1xuICB2YXIgcm90UmF0ZSA9IGRldmljZU1vdGlvbi5yb3RhdGlvblJhdGU7XG4gIHZhciB0aW1lc3RhbXBTID0gZGV2aWNlTW90aW9uLnRpbWVTdGFtcCAvIDEwMDA7XG5cbiAgLy8gRmlyZWZveCBBbmRyb2lkIHRpbWVTdGFtcCByZXR1cm5zIG9uZSB0aG91c2FuZHRoIG9mIGEgbWlsbGlzZWNvbmQuXG4gIGlmICh0aGlzLmlzRmlyZWZveEFuZHJvaWQpIHtcbiAgICB0aW1lc3RhbXBTIC89IDEwMDA7XG4gIH1cblxuICB2YXIgZGVsdGFTID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICBpZiAoZGVsdGFTIDw9IFV0aWwuTUlOX1RJTUVTVEVQIHx8IGRlbHRhUyA+IFV0aWwuTUFYX1RJTUVTVEVQKSB7XG4gICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHRpbWVzdGFtcHMgZGV0ZWN0ZWQuIFRpbWUgc3RlcCBiZXR3ZWVuIHN1Y2Nlc3NpdmUgJyArXG4gICAgICAgICAgICAgICAgICdneXJvc2NvcGUgc2Vuc29yIHNhbXBsZXMgaXMgdmVyeSBzbWFsbCBvciBub3QgbW9ub3RvbmljJyk7XG4gICAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmFjY2VsZXJvbWV0ZXIuc2V0KC1hY2NHcmF2aXR5LngsIC1hY2NHcmF2aXR5LnksIC1hY2NHcmF2aXR5LnopO1xuICB0aGlzLmd5cm9zY29wZS5zZXQocm90UmF0ZS5hbHBoYSwgcm90UmF0ZS5iZXRhLCByb3RSYXRlLmdhbW1hKTtcblxuICAvLyBXaXRoIGlPUyBhbmQgRmlyZWZveCBBbmRyb2lkLCByb3RhdGlvblJhdGUgaXMgcmVwb3J0ZWQgaW4gZGVncmVlcyxcbiAgLy8gc28gd2UgZmlyc3QgY29udmVydCB0byByYWRpYW5zLlxuICBpZiAodGhpcy5pc0lPUyB8fCB0aGlzLmlzRmlyZWZveEFuZHJvaWQpIHtcbiAgICB0aGlzLmd5cm9zY29wZS5tdWx0aXBseVNjYWxhcihNYXRoLlBJIC8gMTgwKTtcbiAgfVxuXG4gIHRoaXMuZmlsdGVyLmFkZEFjY2VsTWVhc3VyZW1lbnQodGhpcy5hY2NlbGVyb21ldGVyLCB0aW1lc3RhbXBTKTtcbiAgdGhpcy5maWx0ZXIuYWRkR3lyb01lYXN1cmVtZW50KHRoaXMuZ3lyb3Njb3BlLCB0aW1lc3RhbXBTKTtcblxuICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vblNjcmVlbk9yaWVudGF0aW9uQ2hhbmdlXyA9XG4gICAgZnVuY3Rpb24oc2NyZWVuT3JpZW50YXRpb24pIHtcbiAgdGhpcy5zZXRTY3JlZW5UcmFuc2Zvcm1fKCk7XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5zZXRTY3JlZW5UcmFuc2Zvcm1fID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMud29ybGRUb1NjcmVlblEuc2V0KDAsIDAsIDAsIDEpO1xuICBzd2l0Y2ggKHdpbmRvdy5vcmllbnRhdGlvbikge1xuICAgIGNhc2UgMDpcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgOTA6XG4gICAgICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldEZyb21BeGlzQW5nbGUobmV3IE1hdGhVdGlsLlZlY3RvcjMoMCwgMCwgMSksIC1NYXRoLlBJIC8gMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIC05MDpcbiAgICAgIHRoaXMud29ybGRUb1NjcmVlblEuc2V0RnJvbUF4aXNBbmdsZShuZXcgTWF0aFV0aWwuVmVjdG9yMygwLCAwLCAxKSwgTWF0aC5QSSAvIDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxODA6XG4gICAgICAvLyBUT0RPLlxuICAgICAgYnJlYWs7XG4gIH1cbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuY29weSh0aGlzLndvcmxkVG9TY3JlZW5RKTtcbiAgdGhpcy5pbnZlcnNlV29ybGRUb1NjcmVlblEuaW52ZXJzZSgpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vbkRldmljZU1vdGlvbkNhbGxiYWNrXyA9IHRoaXMub25EZXZpY2VNb3Rpb25DaGFuZ2VfLmJpbmQodGhpcyk7XG4gIHRoaXMub25TY3JlZW5PcmllbnRhdGlvbkNhbGxiYWNrXyA9IHRoaXMub25TY3JlZW5PcmllbnRhdGlvbkNoYW5nZV8uYmluZCh0aGlzKTtcbiAgXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uQ2FsbGJhY2tfKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vblNjcmVlbk9yaWVudGF0aW9uQ2FsbGJhY2tfKTtcbn07XG5cbkZ1c2lvblBvc2VTZW5zb3IucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2RldmljZW1vdGlvbicsIHRoaXMub25EZXZpY2VNb3Rpb25DYWxsYmFja18pO1xuICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignb3JpZW50YXRpb25jaGFuZ2UnLCB0aGlzLm9uU2NyZWVuT3JpZW50YXRpb25DYWxsYmFja18pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdXNpb25Qb3NlU2Vuc29yO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbCcpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbi8qKlxuICogR2l2ZW4gYW4gb3JpZW50YXRpb24gYW5kIHRoZSBneXJvc2NvcGUgZGF0YSwgcHJlZGljdHMgdGhlIGZ1dHVyZSBvcmllbnRhdGlvblxuICogb2YgdGhlIGhlYWQuIFRoaXMgbWFrZXMgcmVuZGVyaW5nIGFwcGVhciBmYXN0ZXIuXG4gKlxuICogQWxzbyBzZWU6IGh0dHA6Ly9tc2wuY3MudWl1Yy5lZHUvfmxhdmFsbGUvcGFwZXJzL0xhdlllckthdEFudDE0LnBkZlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVkaWN0aW9uVGltZVMgdGltZSBmcm9tIGhlYWQgbW92ZW1lbnQgdG8gdGhlIGFwcGVhcmFuY2Ugb2ZcbiAqIHRoZSBjb3JyZXNwb25kaW5nIGltYWdlLlxuICovXG5mdW5jdGlvbiBQb3NlUHJlZGljdG9yKHByZWRpY3Rpb25UaW1lUykge1xuICB0aGlzLnByZWRpY3Rpb25UaW1lUyA9IHByZWRpY3Rpb25UaW1lUztcblxuICAvLyBUaGUgcXVhdGVybmlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgdGhpcy5wcmV2aW91c1EgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBQcmV2aW91cyB0aW1lIGEgcHJlZGljdGlvbiBvY2N1cnJlZC5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSBudWxsO1xuXG4gIC8vIFRoZSBkZWx0YSBxdWF0ZXJuaW9uIHRoYXQgYWRqdXN0cyB0aGUgY3VycmVudCBwb3NlLlxuICB0aGlzLmRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFRoZSBvdXRwdXQgcXVhdGVybmlvbi5cbiAgdGhpcy5vdXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuUG9zZVByZWRpY3Rvci5wcm90b3R5cGUuZ2V0UHJlZGljdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRRLCBneXJvLCB0aW1lc3RhbXBTKSB7XG4gIGlmICghdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpIHtcbiAgICB0aGlzLnByZXZpb3VzUS5jb3B5KGN1cnJlbnRRKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuIGN1cnJlbnRRO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGF4aXMgYW5kIGFuZ2xlIGJhc2VkIG9uIGd5cm9zY29wZSByb3RhdGlvbiByYXRlIGRhdGEuXG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuXG4gIHZhciBhbmd1bGFyU3BlZWQgPSBneXJvLmxlbmd0aCgpO1xuXG4gIC8vIElmIHdlJ3JlIHJvdGF0aW5nIHNsb3dseSwgZG9uJ3QgZG8gcHJlZGljdGlvbi5cbiAgaWYgKGFuZ3VsYXJTcGVlZCA8IE1hdGhVdGlsLmRlZ1RvUmFkICogMjApIHtcbiAgICBpZiAoVXRpbC5pc0RlYnVnKCkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNb3Zpbmcgc2xvd2x5LCBhdCAlcyBkZWcvczogbm8gcHJlZGljdGlvbicsXG4gICAgICAgICAgICAgICAgICAoTWF0aFV0aWwucmFkVG9EZWcgKiBhbmd1bGFyU3BlZWQpLnRvRml4ZWQoMSkpO1xuICAgIH1cbiAgICB0aGlzLm91dFEuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgcmV0dXJuIHRoaXMub3V0UTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgcHJlZGljdGVkIGFuZ2xlIGJhc2VkIG9uIHRoZSB0aW1lIGRlbHRhIGFuZCBsYXRlbmN5LlxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICB2YXIgcHJlZGljdEFuZ2xlID0gYW5ndWxhclNwZWVkICogdGhpcy5wcmVkaWN0aW9uVGltZVM7XG5cbiAgdGhpcy5kZWx0YVEuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBwcmVkaWN0QW5nbGUpO1xuICB0aGlzLm91dFEuY29weSh0aGlzLnByZXZpb3VzUSk7XG4gIHRoaXMub3V0US5tdWx0aXBseSh0aGlzLmRlbHRhUSk7XG5cbiAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcblxuICByZXR1cm4gdGhpcy5vdXRRO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2VQcmVkaWN0b3I7XG4iLCJmdW5jdGlvbiBTZW5zb3JTYW1wbGUoc2FtcGxlLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuc2V0KHNhbXBsZSwgdGltZXN0YW1wUyk7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNhbXBsZSA9IHNhbXBsZTtcbiAgdGhpcy50aW1lc3RhbXBTID0gdGltZXN0YW1wUztcbn07XG5cblNlbnNvclNhbXBsZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKHNlbnNvclNhbXBsZSkge1xuICB0aGlzLnNldChzZW5zb3JTYW1wbGUuc2FtcGxlLCBzZW5zb3JTYW1wbGUudGltZXN0YW1wUyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbnNvclNhbXBsZTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgTWF0aFV0aWwgPSByZXF1aXJlKCcuL21hdGgtdXRpbC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIFJPVEFURV9TUEVFRCA9IDAuNTtcbi8qKlxuICogUHJvdmlkZXMgYSBxdWF0ZXJuaW9uIHJlc3BvbnNpYmxlIGZvciBwcmUtcGFubmluZyB0aGUgc2NlbmUgYmVmb3JlIGZ1cnRoZXJcbiAqIHRyYW5zZm9ybWF0aW9ucyBkdWUgdG8gZGV2aWNlIHNlbnNvcnMuXG4gKi9cbmZ1bmN0aW9uIFRvdWNoUGFubmVyKCkge1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0Xy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmVfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmRfLmJpbmQodGhpcykpO1xuXG4gIHRoaXMuaXNUb3VjaGluZyA9IGZhbHNlO1xuICB0aGlzLnJvdGF0ZVN0YXJ0ID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVFbmQgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZURlbHRhID0gbmV3IE1hdGhVdGlsLlZlY3RvcjIoKTtcblxuICB0aGlzLnRoZXRhID0gMDtcbiAgdGhpcy5vcmllbnRhdGlvbiA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG59XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5nZXRPcmllbnRhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm9yaWVudGF0aW9uLnNldEZyb21FdWxlclhZWigwLCAwLCB0aGlzLnRoZXRhKTtcbiAgcmV0dXJuIHRoaXMub3JpZW50YXRpb247XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUucmVzZXRTZW5zb3IgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy50aGV0YSA9IDA7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaFN0YXJ0XyA9IGZ1bmN0aW9uKGUpIHtcbiAgLy8gT25seSByZXNwb25kIGlmIHRoZXJlIGlzIGV4YWN0bHkgb25lIHRvdWNoLlxuICBpZiAoZS50b3VjaGVzLmxlbmd0aCAhPSAxKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucm90YXRlU3RhcnQuc2V0KGUudG91Y2hlc1swXS5wYWdlWCwgZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgdGhpcy5pc1RvdWNoaW5nID0gdHJ1ZTtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoTW92ZV8gPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5pc1RvdWNoaW5nKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMucm90YXRlRW5kLnNldChlLnRvdWNoZXNbMF0ucGFnZVgsIGUudG91Y2hlc1swXS5wYWdlWSk7XG4gIHRoaXMucm90YXRlRGVsdGEuc3ViVmVjdG9ycyh0aGlzLnJvdGF0ZUVuZCwgdGhpcy5yb3RhdGVTdGFydCk7XG4gIHRoaXMucm90YXRlU3RhcnQuY29weSh0aGlzLnJvdGF0ZUVuZCk7XG5cbiAgLy8gT24gaU9TLCBkaXJlY3Rpb24gaXMgaW52ZXJ0ZWQuXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB0aGlzLnJvdGF0ZURlbHRhLnggKj0gLTE7XG4gIH1cblxuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG4gIHRoaXMudGhldGEgKz0gMiAqIE1hdGguUEkgKiB0aGlzLnJvdGF0ZURlbHRhLnggLyBlbGVtZW50LmNsaWVudFdpZHRoICogUk9UQVRFX1NQRUVEO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hFbmRfID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLmlzVG91Y2hpbmcgPSBmYWxzZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVG91Y2hQYW5uZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgVXRpbCA9IHdpbmRvdy5VdGlsIHx8IHt9O1xuXG5VdGlsLk1JTl9USU1FU1RFUCA9IDAuMDAxO1xuVXRpbC5NQVhfVElNRVNURVAgPSAxO1xuXG5VdGlsLmJhc2U2NCA9IGZ1bmN0aW9uKG1pbWVUeXBlLCBiYXNlNjQpIHtcbiAgcmV0dXJuICdkYXRhOicgKyBtaW1lVHlwZSArICc7YmFzZTY0LCcgKyBiYXNlNjQ7XG59O1xuXG5VdGlsLmNsYW1wID0gZnVuY3Rpb24odmFsdWUsIG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChtaW4sIHZhbHVlKSwgbWF4KTtcbn07XG5cblV0aWwubGVycCA9IGZ1bmN0aW9uKGEsIGIsIHQpIHtcbiAgcmV0dXJuIGEgKyAoKGIgLSBhKSAqIHQpO1xufTtcblxuVXRpbC5pc0lPUyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzSU9TID0gL2lQYWR8aVBob25lfGlQb2QvLnRlc3QobmF2aWdhdG9yLnBsYXRmb3JtKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc0lPUztcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNTYWZhcmkgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc1NhZmFyaSA9IC9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNTYWZhcmk7XG4gIH07XG59KSgpO1xuXG5VdGlsLmlzRmlyZWZveEFuZHJvaWQgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBpc0ZpcmVmb3hBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94JykgIT09IC0xICYmXG4gICAgICBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPT0gLTE7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gaXNGaXJlZm94QW5kcm9pZDtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNMYW5kc2NhcGVNb2RlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAod2luZG93Lm9yaWVudGF0aW9uID09IDkwIHx8IHdpbmRvdy5vcmllbnRhdGlvbiA9PSAtOTApO1xufTtcblxuLy8gSGVscGVyIG1ldGhvZCB0byB2YWxpZGF0ZSB0aGUgdGltZSBzdGVwcyBvZiBzZW5zb3IgdGltZXN0YW1wcy5cblV0aWwuaXNUaW1lc3RhbXBEZWx0YVZhbGlkID0gZnVuY3Rpb24odGltZXN0YW1wRGVsdGFTKSB7XG4gIGlmIChpc05hTih0aW1lc3RhbXBEZWx0YVMpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0aW1lc3RhbXBEZWx0YVMgPD0gVXRpbC5NSU5fVElNRVNURVApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRpbWVzdGFtcERlbHRhUyA+IFV0aWwuTUFYX1RJTUVTVEVQKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5nZXRTY3JlZW5XaWR0aCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5tYXgod2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxuVXRpbC5nZXRTY3JlZW5IZWlnaHQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIE1hdGgubWluKHdpbmRvdy5zY3JlZW4ud2lkdGgsIHdpbmRvdy5zY3JlZW4uaGVpZ2h0KSAqXG4gICAgICB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbn07XG5cblV0aWwucmVxdWVzdEZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIGlmIChlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKSB7XG4gICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbikge1xuICAgIGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50Lm1zUmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblV0aWwuZXhpdEZ1bGxzY3JlZW4gPSBmdW5jdGlvbigpIHtcbiAgaWYgKGRvY3VtZW50LmV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC53ZWJraXRFeGl0RnVsbHNjcmVlbikge1xuICAgIGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbikge1xuICAgIGRvY3VtZW50Lm1vekNhbmNlbEZ1bGxTY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQubXNFeGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5nZXRGdWxsc2NyZWVuRWxlbWVudCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50LndlYmtpdEZ1bGxzY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQubXNGdWxsc2NyZWVuRWxlbWVudDtcbn07XG5cblV0aWwubGlua1Byb2dyYW0gPSBmdW5jdGlvbihnbCwgdmVydGV4U291cmNlLCBmcmFnbWVudFNvdXJjZSwgYXR0cmliTG9jYXRpb25NYXApIHtcbiAgLy8gTm8gZXJyb3IgY2hlY2tpbmcgZm9yIGJyZXZpdHkuXG4gIHZhciB2ZXJ0ZXhTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuVkVSVEVYX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZSh2ZXJ0ZXhTaGFkZXIsIHZlcnRleFNvdXJjZSk7XG4gIGdsLmNvbXBpbGVTaGFkZXIodmVydGV4U2hhZGVyKTtcblxuICB2YXIgZnJhZ21lbnRTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKGZyYWdtZW50U2hhZGVyLCBmcmFnbWVudFNvdXJjZSk7XG4gIGdsLmNvbXBpbGVTaGFkZXIoZnJhZ21lbnRTaGFkZXIpO1xuXG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdmVydGV4U2hhZGVyKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZyYWdtZW50U2hhZGVyKTtcblxuICBmb3IgKHZhciBhdHRyaWJOYW1lIGluIGF0dHJpYkxvY2F0aW9uTWFwKVxuICAgIGdsLmJpbmRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBhdHRyaWJMb2NhdGlvbk1hcFthdHRyaWJOYW1lXSwgYXR0cmliTmFtZSk7XG5cbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG5cbiAgZ2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcik7XG4gIGdsLmRlbGV0ZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgcmV0dXJuIHByb2dyYW07XG59O1xuXG5VdGlsLmdldFByb2dyYW1Vbmlmb3JtcyA9IGZ1bmN0aW9uKGdsLCBwcm9ncmFtKSB7XG4gIHZhciB1bmlmb3JtcyA9IHt9O1xuICB2YXIgdW5pZm9ybUNvdW50ID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpO1xuICB2YXIgdW5pZm9ybU5hbWUgPSAnJztcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB1bmlmb3JtQ291bnQ7IGkrKykge1xuICAgIHZhciB1bmlmb3JtSW5mbyA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaSk7XG4gICAgdW5pZm9ybU5hbWUgPSB1bmlmb3JtSW5mby5uYW1lLnJlcGxhY2UoJ1swXScsICcnKTtcbiAgICB1bmlmb3Jtc1t1bmlmb3JtTmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdW5pZm9ybU5hbWUpO1xuICB9XG4gIHJldHVybiB1bmlmb3Jtcztcbn07XG5cblV0aWwub3J0aG9NYXRyaXggPSBmdW5jdGlvbiAob3V0LCBsZWZ0LCByaWdodCwgYm90dG9tLCB0b3AsIG5lYXIsIGZhcikge1xuICB2YXIgbHIgPSAxIC8gKGxlZnQgLSByaWdodCksXG4gICAgICBidCA9IDEgLyAoYm90dG9tIC0gdG9wKSxcbiAgICAgIG5mID0gMSAvIChuZWFyIC0gZmFyKTtcbiAgb3V0WzBdID0gLTIgKiBscjtcbiAgb3V0WzFdID0gMDtcbiAgb3V0WzJdID0gMDtcbiAgb3V0WzNdID0gMDtcbiAgb3V0WzRdID0gMDtcbiAgb3V0WzVdID0gLTIgKiBidDtcbiAgb3V0WzZdID0gMDtcbiAgb3V0WzddID0gMDtcbiAgb3V0WzhdID0gMDtcbiAgb3V0WzldID0gMDtcbiAgb3V0WzEwXSA9IDIgKiBuZjtcbiAgb3V0WzExXSA9IDA7XG4gIG91dFsxMl0gPSAobGVmdCArIHJpZ2h0KSAqIGxyO1xuICBvdXRbMTNdID0gKHRvcCArIGJvdHRvbSkgKiBidDtcbiAgb3V0WzE0XSA9IChmYXIgKyBuZWFyKSAqIG5mO1xuICBvdXRbMTVdID0gMTtcbiAgcmV0dXJuIG91dDtcbn07XG5cblV0aWwuaXNNb2JpbGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNoZWNrID0gZmFsc2U7XG4gIChmdW5jdGlvbihhKXtpZigvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXJpc3xraW5kbGV8bGdlIHxtYWVtb3xtaWRwfG1tcHxtb2JpbGUuK2ZpcmVmb3h8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgY2V8eGRhfHhpaW5vL2kudGVzdChhKXx8LzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdChhLnN1YnN0cigwLDQpKSljaGVjayA9IHRydWV9KShuYXZpZ2F0b3IudXNlckFnZW50fHxuYXZpZ2F0b3IudmVuZG9yfHx3aW5kb3cub3BlcmEpO1xuICByZXR1cm4gY2hlY2s7XG59O1xuXG5VdGlsLmV4dGVuZCA9IG9iamVjdEFzc2lnbjtcblxuVXRpbC5zYWZhcmlDc3NTaXplV29ya2Fyb3VuZCA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICAvLyBUT0RPKHNtdXMpOiBSZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gU2FmYXJpIGZvciBpT1MgaXMgZml4ZWQuXG4gIC8vIGlPUyBvbmx5IHdvcmthcm91bmQgKGZvciBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTUyNTU2KS5cbiAgLy9cbiAgLy8gXCJUbyB0aGUgbGFzdCBJIGdyYXBwbGUgd2l0aCB0aGVlO1xuICAvLyAgZnJvbSBoZWxsJ3MgaGVhcnQgSSBzdGFiIGF0IHRoZWU7XG4gIC8vICBmb3IgaGF0ZSdzIHNha2UgSSBzcGl0IG15IGxhc3QgYnJlYXRoIGF0IHRoZWUuXCJcbiAgLy8gLS0gTW9ieSBEaWNrLCBieSBIZXJtYW4gTWVsdmlsbGVcbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHZhciB3aWR0aCA9IGNhbnZhcy5zdHlsZS53aWR0aDtcbiAgICB2YXIgaGVpZ2h0ID0gY2FudmFzLnN0eWxlLmhlaWdodDtcbiAgICBjYW52YXMuc3R5bGUud2lkdGggPSAocGFyc2VJbnQod2lkdGgpICsgMSkgKyAncHgnO1xuICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSAocGFyc2VJbnQoaGVpZ2h0KSkgKyAncHgnO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aDtcbiAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIC8vIERlYnVnIG9ubHkuXG4gIHdpbmRvdy5VdGlsID0gVXRpbDtcbiAgd2luZG93LmNhbnZhcyA9IGNhbnZhcztcbn07XG5cblV0aWwuaXNEZWJ1ZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gVXRpbC5nZXRRdWVyeVBhcmFtZXRlcignZGVidWcnKTtcbn07XG5cblV0aWwuZ2V0UXVlcnlQYXJhbWV0ZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiW1xcXFw/Jl1cIiArIG5hbWUgKyBcIj0oW14mI10qKVwiKSxcbiAgICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gIHJldHVybiByZXN1bHRzID09PSBudWxsID8gXCJcIiA6IGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzFdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xufTtcblxuVXRpbC5mcmFtZURhdGFGcm9tUG9zZSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHBpT3ZlcjE4MCA9IE1hdGguUEkgLyAxODAuMDtcbiAgdmFyIHJhZDQ1ID0gTWF0aC5QSSAqIDAuMjU7XG5cbiAgLy8gQm9ycm93ZWQgZnJvbSBnbE1hdHJpeC5cbiAgZnVuY3Rpb24gbWF0NF9wZXJzcGVjdGl2ZUZyb21GaWVsZE9mVmlldyhvdXQsIGZvdiwgbmVhciwgZmFyKSB7XG4gICAgdmFyIHVwVGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi51cERlZ3JlZXMgKiBwaU92ZXIxODApIDogcmFkNDUpLFxuICAgIGRvd25UYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LmRvd25EZWdyZWVzICogcGlPdmVyMTgwKSA6IHJhZDQ1KSxcbiAgICBsZWZ0VGFuID0gTWF0aC50YW4oZm92ID8gKGZvdi5sZWZ0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgcmlnaHRUYW4gPSBNYXRoLnRhbihmb3YgPyAoZm92LnJpZ2h0RGVncmVlcyAqIHBpT3ZlcjE4MCkgOiByYWQ0NSksXG4gICAgeFNjYWxlID0gMi4wIC8gKGxlZnRUYW4gKyByaWdodFRhbiksXG4gICAgeVNjYWxlID0gMi4wIC8gKHVwVGFuICsgZG93blRhbik7XG5cbiAgICBvdXRbMF0gPSB4U2NhbGU7XG4gICAgb3V0WzFdID0gMC4wO1xuICAgIG91dFsyXSA9IDAuMDtcbiAgICBvdXRbM10gPSAwLjA7XG4gICAgb3V0WzRdID0gMC4wO1xuICAgIG91dFs1XSA9IHlTY2FsZTtcbiAgICBvdXRbNl0gPSAwLjA7XG4gICAgb3V0WzddID0gMC4wO1xuICAgIG91dFs4XSA9IC0oKGxlZnRUYW4gLSByaWdodFRhbikgKiB4U2NhbGUgKiAwLjUpO1xuICAgIG91dFs5XSA9ICgodXBUYW4gLSBkb3duVGFuKSAqIHlTY2FsZSAqIDAuNSk7XG4gICAgb3V0WzEwXSA9IGZhciAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTFdID0gLTEuMDtcbiAgICBvdXRbMTJdID0gMC4wO1xuICAgIG91dFsxM10gPSAwLjA7XG4gICAgb3V0WzE0XSA9IChmYXIgKiBuZWFyKSAvIChuZWFyIC0gZmFyKTtcbiAgICBvdXRbMTVdID0gMC4wO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBtYXQ0X2Zyb21Sb3RhdGlvblRyYW5zbGF0aW9uKG91dCwgcSwgdikge1xuICAgIC8vIFF1YXRlcm5pb24gbWF0aFxuICAgIHZhciB4ID0gcVswXSwgeSA9IHFbMV0sIHogPSBxWzJdLCB3ID0gcVszXSxcbiAgICAgICAgeDIgPSB4ICsgeCxcbiAgICAgICAgeTIgPSB5ICsgeSxcbiAgICAgICAgejIgPSB6ICsgeixcblxuICAgICAgICB4eCA9IHggKiB4MixcbiAgICAgICAgeHkgPSB4ICogeTIsXG4gICAgICAgIHh6ID0geCAqIHoyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgeXogPSB5ICogejIsXG4gICAgICAgIHp6ID0geiAqIHoyLFxuICAgICAgICB3eCA9IHcgKiB4MixcbiAgICAgICAgd3kgPSB3ICogeTIsXG4gICAgICAgIHd6ID0gdyAqIHoyO1xuXG4gICAgb3V0WzBdID0gMSAtICh5eSArIHp6KTtcbiAgICBvdXRbMV0gPSB4eSArIHd6O1xuICAgIG91dFsyXSA9IHh6IC0gd3k7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSB4eSAtIHd6O1xuICAgIG91dFs1XSA9IDEgLSAoeHggKyB6eik7XG4gICAgb3V0WzZdID0geXogKyB3eDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IHh6ICsgd3k7XG4gICAgb3V0WzldID0geXogLSB3eDtcbiAgICBvdXRbMTBdID0gMSAtICh4eCArIHl5KTtcbiAgICBvdXRbMTFdID0gMDtcbiAgICBvdXRbMTJdID0gdlswXTtcbiAgICBvdXRbMTNdID0gdlsxXTtcbiAgICBvdXRbMTRdID0gdlsyXTtcbiAgICBvdXRbMTVdID0gMTtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgZnVuY3Rpb24gbWF0NF90cmFuc2xhdGUob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXSwgeiA9IHZbMl0sXG4gICAgICAgIGEwMCwgYTAxLCBhMDIsIGEwMyxcbiAgICAgICAgYTEwLCBhMTEsIGExMiwgYTEzLFxuICAgICAgICBhMjAsIGEyMSwgYTIyLCBhMjM7XG5cbiAgICBpZiAoYSA9PT0gb3V0KSB7XG4gICAgICBvdXRbMTJdID0gYVswXSAqIHggKyBhWzRdICogeSArIGFbOF0gKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYVsxXSAqIHggKyBhWzVdICogeSArIGFbOV0gKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYVsyXSAqIHggKyBhWzZdICogeSArIGFbMTBdICogeiArIGFbMTRdO1xuICAgICAgb3V0WzE1XSA9IGFbM10gKiB4ICsgYVs3XSAqIHkgKyBhWzExXSAqIHogKyBhWzE1XTtcbiAgICB9IGVsc2Uge1xuICAgICAgYTAwID0gYVswXTsgYTAxID0gYVsxXTsgYTAyID0gYVsyXTsgYTAzID0gYVszXTtcbiAgICAgIGExMCA9IGFbNF07IGExMSA9IGFbNV07IGExMiA9IGFbNl07IGExMyA9IGFbN107XG4gICAgICBhMjAgPSBhWzhdOyBhMjEgPSBhWzldOyBhMjIgPSBhWzEwXTsgYTIzID0gYVsxMV07XG5cbiAgICAgIG91dFswXSA9IGEwMDsgb3V0WzFdID0gYTAxOyBvdXRbMl0gPSBhMDI7IG91dFszXSA9IGEwMztcbiAgICAgIG91dFs0XSA9IGExMDsgb3V0WzVdID0gYTExOyBvdXRbNl0gPSBhMTI7IG91dFs3XSA9IGExMztcbiAgICAgIG91dFs4XSA9IGEyMDsgb3V0WzldID0gYTIxOyBvdXRbMTBdID0gYTIyOyBvdXRbMTFdID0gYTIzO1xuXG4gICAgICBvdXRbMTJdID0gYTAwICogeCArIGExMCAqIHkgKyBhMjAgKiB6ICsgYVsxMl07XG4gICAgICBvdXRbMTNdID0gYTAxICogeCArIGExMSAqIHkgKyBhMjEgKiB6ICsgYVsxM107XG4gICAgICBvdXRbMTRdID0gYTAyICogeCArIGExMiAqIHkgKyBhMjIgKiB6ICsgYVsxNF07XG4gICAgICBvdXRbMTVdID0gYTAzICogeCArIGExMyAqIHkgKyBhMjMgKiB6ICsgYVsxNV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfTtcblxuICBmdW5jdGlvbiBtYXQ0X2ludmVydChvdXQsIGEpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICAgICAgYTEwID0gYVs0XSwgYTExID0gYVs1XSwgYTEyID0gYVs2XSwgYTEzID0gYVs3XSxcbiAgICAgICAgYTIwID0gYVs4XSwgYTIxID0gYVs5XSwgYTIyID0gYVsxMF0sIGEyMyA9IGFbMTFdLFxuICAgICAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgICAgICBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsXG4gICAgICAgIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCxcbiAgICAgICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgICAgICBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsXG4gICAgICAgIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSxcbiAgICAgICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgICAgICBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsXG4gICAgICAgIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCxcbiAgICAgICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgICAgICBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsXG4gICAgICAgIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSxcbiAgICAgICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZGV0ZXJtaW5hbnRcbiAgICAgICAgZGV0ID0gYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2O1xuXG4gICAgaWYgKCFkZXQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRbOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIG91dFsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgdmFyIGRlZmF1bHRPcmllbnRhdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDAsIDFdKTtcbiAgdmFyIGRlZmF1bHRQb3NpdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDAsIDBdKTtcblxuICBmdW5jdGlvbiB1cGRhdGVFeWVNYXRyaWNlcyhwcm9qZWN0aW9uLCB2aWV3LCBwb3NlLCBwYXJhbWV0ZXJzLCB2ckRpc3BsYXkpIHtcbiAgICBtYXQ0X3BlcnNwZWN0aXZlRnJvbUZpZWxkT2ZWaWV3KHByb2plY3Rpb24sIHBhcmFtZXRlcnMgPyBwYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3IDogbnVsbCwgdnJEaXNwbGF5LmRlcHRoTmVhciwgdnJEaXNwbGF5LmRlcHRoRmFyKTtcblxuICAgIHZhciBvcmllbnRhdGlvbiA9IHBvc2Uub3JpZW50YXRpb24gfHwgZGVmYXVsdE9yaWVudGF0aW9uO1xuICAgIHZhciBwb3NpdGlvbiA9IHBvc2UucG9zaXRpb24gfHwgZGVmYXVsdFBvc2l0aW9uO1xuXG4gICAgbWF0NF9mcm9tUm90YXRpb25UcmFuc2xhdGlvbih2aWV3LCBvcmllbnRhdGlvbiwgcG9zaXRpb24pO1xuICAgIGlmIChwYXJhbWV0ZXJzKVxuICAgICAgbWF0NF90cmFuc2xhdGUodmlldywgdmlldywgcGFyYW1ldGVycy5vZmZzZXQpO1xuICAgIG1hdDRfaW52ZXJ0KHZpZXcsIHZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZyYW1lRGF0YSwgcG9zZSwgdnJEaXNwbGF5KSB7XG4gICAgaWYgKCFmcmFtZURhdGEgfHwgIXBvc2UpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBmcmFtZURhdGEucG9zZSA9IHBvc2U7XG4gICAgZnJhbWVEYXRhLnRpbWVzdGFtcCA9IHBvc2UudGltZXN0YW1wO1xuXG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5sZWZ0UHJvamVjdGlvbk1hdHJpeCwgZnJhbWVEYXRhLmxlZnRWaWV3TWF0cml4LFxuICAgICAgICBwb3NlLCB2ckRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyhcImxlZnRcIiksIHZyRGlzcGxheSk7XG4gICAgdXBkYXRlRXllTWF0cmljZXMoXG4gICAgICAgIGZyYW1lRGF0YS5yaWdodFByb2plY3Rpb25NYXRyaXgsIGZyYW1lRGF0YS5yaWdodFZpZXdNYXRyaXgsXG4gICAgICAgIHBvc2UsIHZyRGlzcGxheS5nZXRFeWVQYXJhbWV0ZXJzKFwicmlnaHRcIiksIHZyRGlzcGxheSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBEZXZpY2VJbmZvID0gcmVxdWlyZSgnLi9kZXZpY2UtaW5mby5qcycpO1xudmFyIEV2ZW50RW1pdHRlcjMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG52YXIgREVGQVVMVF9WSUVXRVIgPSAnQ2FyZGJvYXJkVjEnO1xudmFyIFZJRVdFUl9LRVkgPSAnV0VCVlJfQ0FSREJPQVJEX1ZJRVdFUic7XG52YXIgQ0xBU1NfTkFNRSA9ICd3ZWJ2ci1wb2x5ZmlsbC12aWV3ZXItc2VsZWN0b3InO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB2aWV3ZXIgc2VsZWN0b3Igd2l0aCB0aGUgb3B0aW9ucyBzcGVjaWZpZWQuIFN1cHBvcnRzIGJlaW5nIHNob3duXG4gKiBhbmQgaGlkZGVuLiBHZW5lcmF0ZXMgZXZlbnRzIHdoZW4gdmlld2VyIHBhcmFtZXRlcnMgY2hhbmdlLiBBbHNvIHN1cHBvcnRzXG4gKiBzYXZpbmcgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpbmRleCBpbiBsb2NhbFN0b3JhZ2UuXG4gKi9cbmZ1bmN0aW9uIFZpZXdlclNlbGVjdG9yKCkge1xuICAvLyBUcnkgdG8gbG9hZCB0aGUgc2VsZWN0ZWQga2V5IGZyb20gbG9jYWwgc3RvcmFnZS4gSWYgbm9uZSBleGlzdHMsIHVzZSB0aGVcbiAgLy8gZGVmYXVsdCBrZXkuXG4gIHRyeSB7XG4gICAgdGhpcy5zZWxlY3RlZEtleSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFZJRVdFUl9LRVkpIHx8IERFRkFVTFRfVklFV0VSO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuICB0aGlzLmRpYWxvZyA9IHRoaXMuY3JlYXRlRGlhbG9nXyhEZXZpY2VJbmZvLlZpZXdlcnMpO1xuICB0aGlzLnJvb3QgPSBudWxsO1xufVxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcjMoKTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihyb290KSB7XG4gIHRoaXMucm9vdCA9IHJvb3Q7XG5cbiAgcm9vdC5hcHBlbmRDaGlsZCh0aGlzLmRpYWxvZyk7XG5cbiAgLy8gRW5zdXJlIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBpcyBjaGVja2VkLlxuICB2YXIgc2VsZWN0ZWQgPSB0aGlzLmRpYWxvZy5xdWVyeVNlbGVjdG9yKCcjJyArIHRoaXMuc2VsZWN0ZWRLZXkpO1xuICBzZWxlY3RlZC5jaGVja2VkID0gdHJ1ZTtcblxuICAvLyBTaG93IHRoZSBVSS5cbiAgdGhpcy5kaWFsb2cuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5yb290ICYmIHRoaXMucm9vdC5jb250YWlucyh0aGlzLmRpYWxvZykpIHtcbiAgICB0aGlzLnJvb3QucmVtb3ZlQ2hpbGQodGhpcy5kaWFsb2cpO1xuICB9XG4gIHRoaXMuZGlhbG9nLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuZ2V0Q3VycmVudFZpZXdlciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gRGV2aWNlSW5mby5WaWV3ZXJzW3RoaXMuc2VsZWN0ZWRLZXldO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldFNlbGVjdGVkS2V5XyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaW5wdXQgPSB0aGlzLmRpYWxvZy5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPWZpZWxkXTpjaGVja2VkJyk7XG4gIGlmIChpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5pZDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5vblNhdmVfID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2VsZWN0ZWRLZXkgPSB0aGlzLmdldFNlbGVjdGVkS2V5XygpO1xuICBpZiAoIXRoaXMuc2VsZWN0ZWRLZXkgfHwgIURldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1ZpZXdlclNlbGVjdG9yLm9uU2F2ZV86IHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVtaXQoJ2NoYW5nZScsIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XSk7XG5cbiAgLy8gQXR0ZW1wdCB0byBzYXZlIHRoZSB2aWV3ZXIgcHJvZmlsZSwgYnV0IGZhaWxzIGluIHByaXZhdGUgbW9kZS5cbiAgdHJ5IHtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShWSUVXRVJfS0VZLCB0aGlzLnNlbGVjdGVkS2V5KTtcbiAgfSBjYXRjaChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuICB0aGlzLmhpZGUoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgZGlhbG9nLlxuICovXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlRGlhbG9nXyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuY2xhc3NMaXN0LmFkZChDTEFTU19OQU1FKTtcbiAgY29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIC8vIENyZWF0ZSBhbiBvdmVybGF5IHRoYXQgZGltcyB0aGUgYmFja2dyb3VuZCwgYW5kIHdoaWNoIGdvZXMgYXdheSB3aGVuIHlvdVxuICAvLyB0YXAgaXQuXG4gIHZhciBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gb3ZlcmxheS5zdHlsZTtcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMubGVmdCA9IDA7XG4gIHMudG9wID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnMTAwJSc7XG4gIHMuYmFja2dyb3VuZCA9ICdyZ2JhKDAsIDAsIDAsIDAuMyknO1xuICBvdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5oaWRlLmJpbmQodGhpcykpO1xuXG4gIHZhciB3aWR0aCA9IDI4MDtcbiAgdmFyIGRpYWxvZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IGRpYWxvZy5zdHlsZTtcbiAgcy5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9ICcyNHB4JztcbiAgcy5sZWZ0ID0gJzUwJSc7XG4gIHMubWFyZ2luTGVmdCA9ICgtd2lkdGgvMikgKyAncHgnO1xuICBzLndpZHRoID0gd2lkdGggKyAncHgnO1xuICBzLnBhZGRpbmcgPSAnMjRweCc7XG4gIHMub3ZlcmZsb3cgPSAnaGlkZGVuJztcbiAgcy5iYWNrZ3JvdW5kID0gJyNmYWZhZmEnO1xuICBzLmZvbnRGYW1pbHkgPSBcIidSb2JvdG8nLCBzYW5zLXNlcmlmXCI7XG4gIHMuYm94U2hhZG93ID0gJzBweCA1cHggMjBweCAjNjY2JztcblxuICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVIMV8oJ1NlbGVjdCB5b3VyIHZpZXdlcicpKTtcbiAgZm9yICh2YXIgaWQgaW4gb3B0aW9ucykge1xuICAgIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUNob2ljZV8oaWQsIG9wdGlvbnNbaWRdLmxhYmVsKSk7XG4gIH1cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQnV0dG9uXygnU2F2ZScsIHRoaXMub25TYXZlXy5iaW5kKHRoaXMpKSk7XG5cbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZGlhbG9nKTtcblxuICByZXR1cm4gY29udGFpbmVyO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUgxXyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIGgxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDEnKTtcbiAgdmFyIHMgPSBoMS5zdHlsZTtcbiAgcy5jb2xvciA9ICdibGFjayc7XG4gIHMuZm9udFNpemUgPSAnMjBweCc7XG4gIHMuZm9udFdlaWdodCA9ICdib2xkJztcbiAgcy5tYXJnaW5Ub3AgPSAwO1xuICBzLm1hcmdpbkJvdHRvbSA9ICcyNHB4JztcbiAgaDEuaW5uZXJIVE1MID0gbmFtZTtcbiAgcmV0dXJuIGgxO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZUNob2ljZV8gPSBmdW5jdGlvbihpZCwgbmFtZSkge1xuICAvKlxuICA8ZGl2IGNsYXNzPVwiY2hvaWNlXCI+XG4gIDxpbnB1dCBpZD1cInYxXCIgdHlwZT1cInJhZGlvXCIgbmFtZT1cImZpZWxkXCIgdmFsdWU9XCJ2MVwiPlxuICA8bGFiZWwgZm9yPVwidjFcIj5DYXJkYm9hcmQgVjE8L2xhYmVsPlxuICA8L2Rpdj5cbiAgKi9cbiAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBkaXYuc3R5bGUubWFyZ2luVG9wID0gJzhweCc7XG4gIGRpdi5zdHlsZS5jb2xvciA9ICdibGFjayc7XG5cbiAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgaW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMzBweCc7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgnaWQnLCBpZCk7XG4gIGlucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdyYWRpbycpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAnZmllbGQnKTtcblxuICB2YXIgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICBsYWJlbC5zdHlsZS5tYXJnaW5MZWZ0ID0gJzRweCc7XG4gIGxhYmVsLnNldEF0dHJpYnV0ZSgnZm9yJywgaWQpO1xuICBsYWJlbC5pbm5lckhUTUwgPSBuYW1lO1xuXG4gIGRpdi5hcHBlbmRDaGlsZChpbnB1dCk7XG4gIGRpdi5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgcmV0dXJuIGRpdjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVCdXR0b25fID0gZnVuY3Rpb24obGFiZWwsIG9uY2xpY2spIHtcbiAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICBidXR0b24uaW5uZXJIVE1MID0gbGFiZWw7XG4gIHZhciBzID0gYnV0dG9uLnN0eWxlO1xuICBzLmZsb2F0ID0gJ3JpZ2h0JztcbiAgcy50ZXh0VHJhbnNmb3JtID0gJ3VwcGVyY2FzZSc7XG4gIHMuY29sb3IgPSAnIzEwOTRmNyc7XG4gIHMuZm9udFNpemUgPSAnMTRweCc7XG4gIHMubGV0dGVyU3BhY2luZyA9IDA7XG4gIHMuYm9yZGVyID0gMDtcbiAgcy5iYWNrZ3JvdW5kID0gJ25vbmUnO1xuICBzLm1hcmdpblRvcCA9ICcxNnB4JztcblxuICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvbmNsaWNrKTtcblxuICByZXR1cm4gYnV0dG9uO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJTZWxlY3RvcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8qKlxuICogQW5kcm9pZCBhbmQgaU9TIGNvbXBhdGlibGUgd2FrZWxvY2sgaW1wbGVtZW50YXRpb24uXG4gKlxuICogUmVmYWN0b3JlZCB0aGFua3MgdG8gZGtvdmFsZXZALlxuICovXG5mdW5jdGlvbiBBbmRyb2lkV2FrZUxvY2soKSB7XG4gIHZhciB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG5cbiAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wbGF5KCk7XG4gIH0pO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh2aWRlby5wYXVzZWQpIHtcbiAgICAgIC8vIEJhc2U2NCB2ZXJzaW9uIG9mIHZpZGVvc19zcmMvbm8tc2xlZXAtMTIwcy5tcDQuXG4gICAgICB2aWRlby5zcmMgPSBVdGlsLmJhc2U2NCgndmlkZW8vbXA0JywgJ0FBQUFHR1owZVhCcGMyOXRBQUFBQUcxd05ERmhkbU14QUFBSUEyMXZiM1lBQUFCc2JYWm9aQUFBQUFEU2E5djYwbXZiK2dBQlg1QUFsdy9nQUFFQUFBRUFBQUFBQUFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUlBQUFka2RISmhhd0FBQUZ4MGEyaGtBQUFBQWRKcjIvclNhOXY2QUFBQUFRQUFBQUFBbHcvZ0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBUUFBQUFIQUFBQUFBQUpHVmtkSE1BQUFBY1pXeHpkQUFBQUFBQUFBQUJBSmNQNEFBQUFBQUFBUUFBQUFBRzNHMWthV0VBQUFBZ2JXUm9aQUFBQUFEU2E5djYwbXZiK2dBUFFrQUdqbmVBRmNjQUFBQUFBQzFvWkd4eUFBQUFBQUFBQUFCMmFXUmxBQUFBQUFBQUFBQUFBQUFBVm1sa1pXOUlZVzVrYkdWeUFBQUFCb2R0YVc1bUFBQUFGSFp0YUdRQUFBQUJBQUFBQUFBQUFBQUFBQUFrWkdsdVpnQUFBQnhrY21WbUFBQUFBQUFBQUFFQUFBQU1kWEpzSUFBQUFBRUFBQVpIYzNSaWJBQUFBSmR6ZEhOa0FBQUFBQUFBQUFFQUFBQ0hZWFpqTVFBQUFBQUFBQUFCQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFNQUJ3QVNBQUFBRWdBQUFBQUFBQUFBUUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFCai8vd0FBQURGaGRtTkRBV1FBQy8vaEFCbG5aQUFMck5sZmxsdzRRQUFBQXdCQUFBQURBS1BGQ21XQUFRQUZhT3Zzc2l3QUFBQVljM1IwY3dBQUFBQUFBQUFCQUFBQWJnQVBRa0FBQUFBVWMzUnpjd0FBQUFBQUFBQUJBQUFBQVFBQUE0QmpkSFJ6QUFBQUFBQUFBRzRBQUFBQkFEMEpBQUFBQUFFQWVoSUFBQUFBQVFBOUNRQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQUxjYkFBQUFBSEhOMGMyTUFBQUFBQUFBQUFRQUFBQUVBQUFCdUFBQUFBUUFBQWN4emRITjZBQUFBQUFBQUFBQUFBQUJ1QUFBRENRQUFBQmdBQUFBT0FBQUFEZ0FBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQk1BQUFBVWMzUmpid0FBQUFBQUFBQUJBQUFJS3dBQUFDdDFaSFJoQUFBQUk2bGxibU1BRndBQWRteGpJREl1TWk0eElITjBjbVZoYlNCdmRYUndkWFFBQUFBSWQybGtaUUFBQ1JSdFpHRjBBQUFDcmdYLy82dmNSZW05NXRsSXQ1WXMyQ0RaSSs3dmVESTJOQ0F0SUdOdmNtVWdNVFF5SUMwZ1NDNHlOalF2VFZCRlJ5MDBJRUZXUXlCamIyUmxZeUF0SUVOdmNIbHNaV1owSURJd01ETXRNakF4TkNBdElHaDBkSEE2THk5M2QzY3VkbWxrWlc5c1lXNHViM0puTDNneU5qUXVhSFJ0YkNBdElHOXdkR2x2Ym5NNklHTmhZbUZqUFRFZ2NtVm1QVE1nWkdWaWJHOWphejB4T2pBNk1DQmhibUZzZVhObFBUQjRNem93ZURFeklHMWxQV2hsZUNCemRXSnRaVDAzSUhCemVUMHhJSEJ6ZVY5eVpEMHhMakF3T2pBdU1EQWdiV2w0WldSZmNtVm1QVEVnYldWZmNtRnVaMlU5TVRZZ1kyaHliMjFoWDIxbFBURWdkSEpsYkd4cGN6MHhJRGg0T0dSamREMHhJR054YlQwd0lHUmxZV1I2YjI1bFBUSXhMREV4SUdaaGMzUmZjSE5yYVhBOU1TQmphSEp2YldGZmNYQmZiMlptYzJWMFBTMHlJSFJvY21WaFpITTlNVElnYkc5dmEyRm9aV0ZrWDNSb2NtVmhaSE05TVNCemJHbGpaV1JmZEdoeVpXRmtjejB3SUc1eVBUQWdaR1ZqYVcxaGRHVTlNU0JwYm5SbGNteGhZMlZrUFRBZ1lteDFjbUY1WDJOdmJYQmhkRDB3SUdOdmJuTjBjbUZwYm1Wa1gybHVkSEpoUFRBZ1ltWnlZVzFsY3oweklHSmZjSGx5WVcxcFpEMHlJR0pmWVdSaGNIUTlNU0JpWDJKcFlYTTlNQ0JrYVhKbFkzUTlNU0IzWldsbmFIUmlQVEVnYjNCbGJsOW5iM0E5TUNCM1pXbG5hSFJ3UFRJZ2EyVjVhVzUwUFRJMU1DQnJaWGxwYm5SZmJXbHVQVEVnYzJObGJtVmpkWFE5TkRBZ2FXNTBjbUZmY21WbWNtVnphRDB3SUhKalgyeHZiMnRoYUdWaFpEMDBNQ0J5WXoxaFluSWdiV0owY21WbFBURWdZbWwwY21GMFpUMHhNREFnY21GMFpYUnZiRDB4TGpBZ2NXTnZiWEE5TUM0Mk1DQnhjRzFwYmoweE1DQnhjRzFoZUQwMU1TQnhjSE4wWlhBOU5DQnBjRjl5WVhScGJ6MHhMalF3SUdGeFBURTZNUzR3TUFDQUFBQUFVMldJaEFBUS84bHRsT2UrY1RadUdrS2crYVJ0dWl2Y0RaMHBCc2ZzRWk5cC9pMXlVOUR4UzJscTRkWFRpblZpRjFVUkJLWGduektCZC9VaDFia2hIdE1yd3JSY09Kc2xEMDFVQitmeWFMNmVmK0RCQUFBQUZFR2FKR3hCRDVCK3YrYSs0UXFGM01nQlh6OU1BQUFBQ2tHZVFuaUgvKzk0cjZFQUFBQUtBWjVoZEVOLzhReXR3QUFBQUFnQm5tTnFRMy9FZ1FBQUFBNUJtbWhKcUVGb21Vd0lJZi8rNFFBQUFBcEJub1pGRVN3Ly83NkJBQUFBQ0FHZXBYUkRmOFNCQUFBQUNBR2VwMnBEZjhTQUFBQUFEa0dhckVtb1FXeVpUQWdoLy83Z0FBQUFDa0dleWtVVkxELy92b0VBQUFBSUFaN3BkRU4veElBQUFBQUlBWjdyYWtOL3hJQUFBQUFPUVpyd1NhaEJiSmxNQ0NILy91RUFBQUFLUVo4T1JSVXNQLysrZ1FBQUFBZ0JueTEwUTMvRWdRQUFBQWdCbnk5cVEzL0VnQUFBQUE1Qm16UkpxRUZzbVV3SUlmLys0QUFBQUFwQm4xSkZGU3cvLzc2QkFBQUFDQUdmY1hSRGY4U0FBQUFBQ0FHZmMycERmOFNBQUFBQURrR2JlRW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2Zsa1VWTEQvL3ZvQUFBQUFJQVorMWRFTi94SUVBQUFBSUFaKzNha04veElFQUFBQU9RWnU4U2FoQmJKbE1DQ0gvL3VBQUFBQUtRWi9hUlJVc1AvKytnUUFBQUFnQm4vbDBRMy9FZ0FBQUFBZ0JuL3RxUTMvRWdRQUFBQTVCbStCSnFFRnNtVXdJSWYvKzRRQUFBQXBCbmg1RkZTdy8vNzZBQUFBQUNBR2VQWFJEZjhTQUFBQUFDQUdlUDJwRGY4U0JBQUFBRGtHYUpFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZVFrVVZMRC8vdm9FQUFBQUlBWjVoZEVOL3hJQUFBQUFJQVo1amFrTi94SUVBQUFBT1FacG9TYWhCYkpsTUNDSC8vdUVBQUFBS1FaNkdSUlVzUC8rK2dRQUFBQWdCbnFWMFEzL0VnUUFBQUFnQm5xZHFRMy9FZ0FBQUFBNUJtcXhKcUVGc21Vd0lJZi8rNEFBQUFBcEJuc3BGRlN3Ly83NkJBQUFBQ0FHZTZYUkRmOFNBQUFBQUNBR2U2MnBEZjhTQUFBQUFEa0dhOEVtb1FXeVpUQWdoLy83aEFBQUFDa0dmRGtVVkxELy92b0VBQUFBSUFaOHRkRU4veElFQUFBQUlBWjh2YWtOL3hJQUFBQUFPUVpzMFNhaEJiSmxNQ0NILy91QUFBQUFLUVo5U1JSVXNQLysrZ1FBQUFBZ0JuM0YwUTMvRWdBQUFBQWdCbjNOcVEzL0VnQUFBQUE1Qm0zaEpxRUZzbVV3SUlmLys0UUFBQUFwQm41WkZGU3cvLzc2QUFBQUFDQUdmdFhSRGY4U0JBQUFBQ0FHZnQycERmOFNCQUFBQURrR2J2RW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2Yya1VWTEQvL3ZvRUFBQUFJQVovNWRFTi94SUFBQUFBSUFaLzdha04veElFQUFBQU9RWnZnU2FoQmJKbE1DQ0gvL3VFQUFBQUtRWjRlUlJVc1AvKytnQUFBQUFnQm5qMTBRMy9FZ0FBQUFBZ0JuajlxUTMvRWdRQUFBQTVCbWlSSnFFRnNtVXdJSWYvKzRBQUFBQXBCbmtKRkZTdy8vNzZCQUFBQUNBR2VZWFJEZjhTQUFBQUFDQUdlWTJwRGY4U0JBQUFBRGtHYWFFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZWhrVVZMRC8vdm9FQUFBQUlBWjZsZEVOL3hJRUFBQUFJQVo2bmFrTi94SUFBQUFBT1FacXNTYWhCYkpsTUNDSC8vdUFBQUFBS1FaN0tSUlVzUC8rK2dRQUFBQWdCbnVsMFEzL0VnQUFBQUFnQm51dHFRMy9FZ0FBQUFBNUJtdkJKcUVGc21Vd0lJZi8rNFFBQUFBcEJudzVGRlN3Ly83NkJBQUFBQ0FHZkxYUkRmOFNCQUFBQUNBR2ZMMnBEZjhTQUFBQUFEa0diTkVtb1FXeVpUQWdoLy83Z0FBQUFDa0dmVWtVVkxELy92b0VBQUFBSUFaOXhkRU4veElBQUFBQUlBWjl6YWtOL3hJQUFBQUFPUVp0NFNhaEJiSmxNQ0NILy91RUFBQUFLUVorV1JSVXNQLysrZ0FBQUFBZ0JuN1YwUTMvRWdRQUFBQWdCbjdkcVEzL0VnUUFBQUE1Qm03eEpxRUZzbVV3SUlmLys0QUFBQUFwQm45cEZGU3cvLzc2QkFBQUFDQUdmK1hSRGY4U0FBQUFBQ0FHZisycERmOFNCQUFBQURrR2I0RW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2VIa1VWTEQvL3ZvQUFBQUFJQVo0OWRFTi94SUFBQUFBSUFaNC9ha04veElFQUFBQU9RWm9rU2FoQmJKbE1DQ0gvL3VBQUFBQUtRWjVDUlJVc1AvKytnUUFBQUFnQm5tRjBRMy9FZ0FBQUFBZ0JubU5xUTMvRWdRQUFBQTVCbW1oSnFFRnNtVXdJSWYvKzRRQUFBQXBCbm9aRkZTdy8vNzZCQUFBQUNBR2VwWFJEZjhTQkFBQUFDQUdlcDJwRGY4U0FBQUFBRGtHYXJFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZXlrVVZMRC8vdm9FQUFBQUlBWjdwZEVOL3hJQUFBQUFJQVo3cmFrTi94SUFBQUFBUFFacnVTYWhCYkpsTUZFdzMvLzdCJyk7XG4gICAgICB2aWRlby5wbGF5KCk7XG4gICAgfVxuICB9O1xuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZpZGVvLnBhdXNlKCk7XG4gICAgdmlkZW8uc3JjID0gJyc7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlPU1dha2VMb2NrKCkge1xuICB2YXIgdGltZXIgPSBudWxsO1xuXG4gIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGltZXIpIHtcbiAgICAgIHRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgc2V0VGltZW91dCh3aW5kb3cuc3RvcCwgMCk7XG4gICAgICB9LCAzMDAwMCk7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5yZWxlYXNlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRpbWVyKSB7XG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgIHRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBnZXRXYWtlTG9jaygpIHtcbiAgdmFyIHVzZXJBZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQgfHwgbmF2aWdhdG9yLnZlbmRvciB8fCB3aW5kb3cub3BlcmE7XG4gIGlmICh1c2VyQWdlbnQubWF0Y2goL2lQaG9uZS9pKSB8fCB1c2VyQWdlbnQubWF0Y2goL2lQb2QvaSkpIHtcbiAgICByZXR1cm4gaU9TV2FrZUxvY2s7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEFuZHJvaWRXYWtlTG9jaztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFdha2VMb2NrKCk7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBDYXJkYm9hcmRWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC12ci1kaXNwbGF5LmpzJyk7XG52YXIgTW91c2VLZXlib2FyZFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vbW91c2Uta2V5Ym9hcmQtdnItZGlzcGxheS5qcycpO1xuLy8gVW5jb21tZW50IHRvIGFkZCBwb3NpdGlvbmFsIHRyYWNraW5nIHZpYSB3ZWJjYW0uXG4vL3ZhciBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gcmVxdWlyZSgnLi93ZWJjYW0tcG9zaXRpb24tc2Vuc29yLXZyLWRldmljZS5qcycpO1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBWUkZyYW1lRGF0YSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRnJhbWVEYXRhO1xudmFyIEhNRFZSRGV2aWNlID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuSE1EVlJEZXZpY2U7XG52YXIgUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG52YXIgVlJEaXNwbGF5SE1ERGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5SE1ERGV2aWNlO1xudmFyIFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gcmVxdWlyZSgnLi9kaXNwbGF5LXdyYXBwZXJzLmpzJykuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG5cbmZ1bmN0aW9uIFdlYlZSUG9seWZpbGwoKSB7XG4gIHRoaXMuZGlzcGxheXMgPSBbXTtcbiAgdGhpcy5kZXZpY2VzID0gW107IC8vIEZvciBkZXByZWNhdGVkIG9iamVjdHNcbiAgdGhpcy5kZXZpY2VzUG9wdWxhdGVkID0gZmFsc2U7XG4gIHRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzV2ViVlJBdmFpbGFibGUoKTtcbiAgdGhpcy5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSA9IHRoaXMuaXNEZXByZWNhdGVkV2ViVlJBdmFpbGFibGUoKTtcblxuICBpZiAoIXRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUpIHtcbiAgICBpZiAoIXRoaXMubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICAgIHRoaXMuZW5hYmxlUG9seWZpbGwoKTtcbiAgICB9XG4gICAgaWYgKFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAgICAgdGhpcy5lbmFibGVEZXByZWNhdGVkUG9seWZpbGwoKTtcbiAgICB9XG4gIH1cblxuICAvLyBQdXQgYSBzaGltIGluIHBsYWNlIHRvIHVwZGF0ZSB0aGUgQVBJIHRvIDEuMSBpZiBuZWVkZWQuXG4gIEluc3RhbGxXZWJWUlNwZWNTaGltKCk7XG59XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzV2ViVlJBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICgnZ2V0VlJEaXNwbGF5cycgaW4gbmF2aWdhdG9yKTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzRGVwcmVjYXRlZFdlYlZSQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoJ2dldFZSRGV2aWNlcycgaW4gbmF2aWdhdG9yKSB8fCAoJ21vekdldFZSRGV2aWNlcycgaW4gbmF2aWdhdG9yKTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLnBvcHVsYXRlRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSW5pdGlhbGl6ZSBvdXIgdmlydHVhbCBWUiBkZXZpY2VzLlxuICB2YXIgdnJEaXNwbGF5ID0gbnVsbDtcblxuICAvLyBBZGQgYSBDYXJkYm9hcmQgVlJEaXNwbGF5IG9uIGNvbXBhdGlibGUgbW9iaWxlIGRldmljZXNcbiAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRpYmxlKCkpIHtcbiAgICB2ckRpc3BsYXkgPSBuZXcgQ2FyZGJvYXJkVlJEaXNwbGF5KCk7XG4gICAgdGhpcy5kaXNwbGF5cy5wdXNoKHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBhIE1vdXNlIGFuZCBLZXlib2FyZCBkcml2ZW4gVlJEaXNwbGF5IGZvciBkZXNrdG9wcy9sYXB0b3BzXG4gIGlmICghdGhpcy5pc01vYmlsZSgpICYmICFXZWJWUkNvbmZpZy5NT1VTRV9LRVlCT0FSRF9DT05UUk9MU19ESVNBQkxFRCkge1xuICAgIHZyRGlzcGxheSA9IG5ldyBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCk7XG4gICAgdGhpcy5kaXNwbGF5cy5wdXNoKHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVuY29tbWVudCB0byBhZGQgcG9zaXRpb25hbCB0cmFja2luZyB2aWEgd2ViY2FtLlxuICAvL2lmICghdGhpcy5pc01vYmlsZSgpICYmIFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAvLyAgcG9zaXRpb25EZXZpY2UgPSBuZXcgV2ViY2FtUG9zaXRpb25TZW5zb3JWUkRldmljZSgpO1xuICAvLyAgdGhpcy5kZXZpY2VzLnB1c2gocG9zaXRpb25EZXZpY2UpO1xuICAvL31cblxuICB0aGlzLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZW5hYmxlUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgLy8gUHJvdmlkZSBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cy5cbiAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMgPSB0aGlzLmdldFZSRGlzcGxheXMuYmluZCh0aGlzKTtcblxuICAvLyBQcm92aWRlIHRoZSBWUkRpc3BsYXkgb2JqZWN0LlxuICB3aW5kb3cuVlJEaXNwbGF5ID0gVlJEaXNwbGF5O1xuXG4gIC8vIFByb3ZpZGUgbmF2aWdhdG9yLnZyRW5hYmxlZC5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkobmF2aWdhdG9yLCAndnJFbmFibGVkJywge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHNlbGYuaXNDYXJkYm9hcmRDb21wYXRpYmxlKCkgJiZcbiAgICAgICAgICAoc2VsZi5pc0Z1bGxTY3JlZW5BdmFpbGFibGUoKSB8fCBVdGlsLmlzSU9TKCkpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgVlJGcmFtZURhdGEgb2JqZWN0LlxuICB3aW5kb3cuVlJGcmFtZURhdGEgPSBWUkZyYW1lRGF0YTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmVuYWJsZURlcHJlY2F0ZWRQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAvLyBQcm92aWRlIG5hdmlnYXRvci5nZXRWUkRldmljZXMuXG4gIG5hdmlnYXRvci5nZXRWUkRldmljZXMgPSB0aGlzLmdldFZSRGV2aWNlcy5iaW5kKHRoaXMpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIENhcmRib2FyZEhNRFZSRGV2aWNlIGFuZCBQb3NpdGlvblNlbnNvclZSRGV2aWNlIG9iamVjdHMuXG4gIHdpbmRvdy5ITURWUkRldmljZSA9IEhNRFZSRGV2aWNlO1xuICB3aW5kb3cuUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IFBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRpc3BsYXlzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucG9wdWxhdGVEZXZpY2VzKCk7XG4gIHZhciBkaXNwbGF5cyA9IHRoaXMuZGlzcGxheXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgcmVzb2x2ZShkaXNwbGF5cyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5nZXRWUkRldmljZXMgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS53YXJuKCdnZXRWUkRldmljZXMgaXMgZGVwcmVjYXRlZC4gUGxlYXNlIHVwZGF0ZSB5b3VyIGNvZGUgdG8gdXNlIGdldFZSRGlzcGxheXMgaW5zdGVhZC4nKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghc2VsZi5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIG5hdmlnYXRvci5nZXRWUkRpc3BsYXlzKGZ1bmN0aW9uKGRpc3BsYXlzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpc3BsYXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKG5ldyBWUkRpc3BsYXlITUREZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKGRpc3BsYXlzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZi5uYXRpdmVMZWdhY3lXZWJWUkF2YWlsYWJsZSkge1xuICAgICAgICAgIHJldHVybiAobmF2aWdhdG9yLmdldFZSRERldmljZXMgfHwgbmF2aWdhdG9yLm1vekdldFZSRGV2aWNlcykoZnVuY3Rpb24oZGV2aWNlcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXZpY2VzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgSE1EVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoZGV2aWNlc1tpXSBpbnN0YW5jZW9mIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChkZXZpY2VzW2ldKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5kZXZpY2VzUG9wdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYucG9wdWxhdGVEZXZpY2VzKCk7XG4gICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGUpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIGRldmljZSBpcyBtb2JpbGUuXG4gKi9cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzTW9iaWxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHxcbiAgICAgIC9pUGhvbmV8aVBhZHxpUG9kL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzQ2FyZGJvYXJkQ29tcGF0aWJsZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBGb3Igbm93LCBzdXBwb3J0IGFsbCBpT1MgYW5kIEFuZHJvaWQgZGV2aWNlcy5cbiAgLy8gQWxzbyBlbmFibGUgdGhlIFdlYlZSQ29uZmlnLkZPUkNFX1ZSIGZsYWcgZm9yIGRlYnVnZ2luZy5cbiAgcmV0dXJuIHRoaXMuaXNNb2JpbGUoKSB8fCBXZWJWUkNvbmZpZy5GT1JDRV9FTkFCTEVfVlI7XG59O1xuXG5XZWJWUlBvbHlmaWxsLnByb3RvdHlwZS5pc0Z1bGxTY3JlZW5BdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIChkb2N1bWVudC5mdWxsc2NyZWVuRW5hYmxlZCB8fFxuICAgICAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbmFibGVkIHx8XG4gICAgICAgICAgZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVuYWJsZWQgfHxcbiAgICAgICAgICBmYWxzZSk7XG59O1xuXG4vLyBJbnN0YWxscyBhIHNoaW0gdGhhdCB1cGRhdGVzIGEgV2ViVlIgMS4wIHNwZWMgaW1wbGVtZW50YXRpb24gdG8gV2ViVlIgMS4xXG5mdW5jdGlvbiBJbnN0YWxsV2ViVlJTcGVjU2hpbSgpIHtcbiAgaWYgKCdWUkRpc3BsYXknIGluIHdpbmRvdyAmJiAhKCdWUkZyYW1lRGF0YScgaW4gd2luZG93KSkge1xuICAgIC8vIFByb3ZpZGUgdGhlIFZSRnJhbWVEYXRhIG9iamVjdC5cbiAgICB3aW5kb3cuVlJGcmFtZURhdGEgPSBWUkZyYW1lRGF0YTtcblxuICAgIC8vIEEgbG90IG9mIENocm9tZSBidWlsZHMgZG9uJ3QgaGF2ZSBkZXB0aE5lYXIgYW5kIGRlcHRoRmFyLCBldmVuXG4gICAgLy8gdGhvdWdoIHRoZXkncmUgaW4gdGhlIFdlYlZSIDEuMCBzcGVjLiBQYXRjaCB0aGVtIGluIGlmIHRoZXkncmUgbm90IHByZXNlbnQuXG4gICAgaWYoISgnZGVwdGhOZWFyJyBpbiB3aW5kb3cuVlJEaXNwbGF5LnByb3RvdHlwZSkpIHtcbiAgICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmRlcHRoTmVhciA9IDAuMDE7XG4gICAgfVxuXG4gICAgaWYoISgnZGVwdGhGYXInIGluIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlKSkge1xuICAgICAgd2luZG93LlZSRGlzcGxheS5wcm90b3R5cGUuZGVwdGhGYXIgPSAxMDAwMC4wO1xuICAgIH1cblxuICAgIHdpbmRvdy5WUkRpc3BsYXkucHJvdG90eXBlLmdldEZyYW1lRGF0YSA9IGZ1bmN0aW9uKGZyYW1lRGF0YSkge1xuICAgICAgcmV0dXJuIFV0aWwuZnJhbWVEYXRhRnJvbVBvc2UoZnJhbWVEYXRhLCB0aGlzLmdldFBvc2UoKSwgdGhpcyk7XG4gICAgfVxuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5XZWJWUlBvbHlmaWxsID0gV2ViVlJQb2x5ZmlsbDtcbiJdfQ==
