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

var Util = require('./util.js');
var CardboardVRDisplay = require('cardboard-vr-display');
var MouseKeyboardVRDisplay = require('./mouse-keyboard-vr-display.js');
var VRDisplay = require('cardboard-vr-display/src/base.js').VRDisplay;
var VRFrameData = require('cardboard-vr-display/src/base.js').VRFrameData;
var version = require('../package.json').version;
var DefaultConfig = require('./config');

function WebVRPolyfill(config) {
  this.config = Util.extend(Util.extend({}, DefaultConfig), config);
  this.displays = [];
  this.enabled = false;

  // Must handle this in constructor before we
  // polyfill `navigator`
  this._native = {
    '1.1': 'getVRDisplays' in navigator,
  };

  this.nativeGetVRDisplaysFunc = this.getNativeSupport() ?
                                 navigator.getVRDisplays :
                                 null;

  if (!this.getNativeSupport() ||
      this.config.ALWAYS_APPEND_POLYFILL_DISPLAY) {
    this.enable();
  }
}

/**
 * Returns a string indicating rough WebVR versioning
 * support, i.e. returns "1.1" if WebVR 1.1 is supported.
 * Returns null if no native support provided. As standards
 * are ever-changing and incomplete browser implementations existing,
 * this string is used to indicate general versioning support and
 * how the polyfill is handling things.
 *
 * @return {string?}
 */
WebVRPolyfill.prototype.getNativeSupport = function() {
  return this._native['1.1'] ? '1.1' : null;
};

WebVRPolyfill.prototype.connectDisplay = function(vrDisplay) {
  vrDisplay.fireVRDisplayConnect_();
  this.displays.push(vrDisplay);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay({
      CARDBOARD_UI_DISABLED:        this.config.CARDBOARD_UI_DISABLED,
      K_FILTER:                     this.config.K_FILTER,
      PREDICTION_TIME_S:            this.config.PREDICTION_TIME_S,
      TOUCH_PANNER_DISABLED:        this.config.TOUCH_PANNER_DISABLED,
      ROTATE_INSTRUCTIONS_DISABLED: this.config.ROTATE_INSTRUCTIONS_DISABLED,
      YAW_ONLY:                     this.config.YAW_ONLY,
      BUFFER_SCALE:                 this.config.BUFFER_SCALE,
      DIRTY_SUBMIT_FRAME_BINDINGS:  this.config.DIRTY_SUBMIT_FRAME_BINDINGS,
    });

    this.connectDisplay(vrDisplay);
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!Util.isMobile() && !this.config.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.connectDisplay(vrDisplay);
  }

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enable = function() {
  this.enabled = true;

  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Polyfill native VRDisplay.getFrameData
  if (this.getNativeSupport() && window.VRFrameData) {
    var NativeVRFrameData = window.VRFrameData;
    var nativeFrameData = new window.VRFrameData();
    var nativeGetFrameData = window.VRDisplay.prototype.getFrameData;
    window.VRFrameData = VRFrameData;

    window.VRDisplay.prototype.getFrameData = function(frameData) {
      if (frameData instanceof NativeVRFrameData) {
        nativeGetFrameData.call(this, frameData);
        return;
      }

      /*
      Copy frame data from the native object into the polyfilled object.
      */

      nativeGetFrameData.call(this, nativeFrameData);
      frameData.pose = nativeFrameData.pose;
      Util.copyArray(nativeFrameData.leftProjectionMatrix, frameData.leftProjectionMatrix);
      Util.copyArray(nativeFrameData.rightProjectionMatrix, frameData.rightProjectionMatrix);
      Util.copyArray(nativeFrameData.leftViewMatrix, frameData.leftViewMatrix);
      Util.copyArray(nativeFrameData.rightViewMatrix, frameData.rightViewMatrix);
      //todo: copy
    };
  }

  // Provide the `VRDisplay` object.
  window.VRDisplay = VRDisplay;

  // Provide the `navigator.vrEnabled` property.
  if (navigator && typeof navigator.vrEnabled === 'undefined') {
    var self = this;
    Object.defineProperty(navigator, 'vrEnabled', {
      get: function () {
        return self.isCardboardCompatible() &&
            (Util.isFullScreenAvailable() || Util.isIOS());
      }
    });
  }

  if (!('VRFrameData' in window)) {
    // Provide the VRFrameData object.
    window.VRFrameData = VRFrameData;
  }
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var polyfillDisplays = this.displays;
  var config = this.config;

  if (!this.getNativeSupport()) {
    return Promise.resolve(polyfillDisplays);
  }

  // Set up a race condition if this browser has a bug where
  // `navigator.getVRDisplays()` never resolves.
  var timeoutId;
  var vrDisplaysNative = this.nativeGetVRDisplaysFunc.call(navigator);
  var timeoutPromise = new Promise(function(resolve) {
    timeoutId = setTimeout(function() {
      console.warn('Native WebVR implementation detected, but `getVRDisplays()` failed to resolve. Falling back to polyfill.');
      resolve([]);
    }, config.GET_VR_DISPLAYS_TIMEOUT);
  });

  return Util.race([
    vrDisplaysNative,
    timeoutPromise
  ]).then(function(nativeDisplays) {
    clearTimeout(timeoutId);
    if (config.ALWAYS_APPEND_POLYFILL_DISPLAY) {
      return nativeDisplays.concat(polyfillDisplays);
    } else {
      return nativeDisplays.length > 0 ? nativeDisplays : polyfillDisplays;
    }
  });
};

WebVRPolyfill.prototype.NativeVRFrameData = window.VRFrameData;

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the FORCE_VR flag for debugging.
  return Util.isMobile() || this.config.FORCE_ENABLE_VR;
};

WebVRPolyfill.version = version;

module.exports = WebVRPolyfill;
