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
var HMDVRDevice = require('./base.js').HMDVRDevice;

// Constants from vrtoolkit: https://github.com/googlesamples/cardboard-java.
var DEFAULT_INTERPUPILLARY_DISTANCE = 0.06;
var DEFAULT_FIELD_OF_VIEW = 40;

/**
 * The HMD itself, providing rendering parameters.
 */
function CardboardHMDVRDevice() {
  // From com/google/vrtoolkit/cardboard/FieldOfView.java.
  this.setFieldOfView(DEFAULT_FIELD_OF_VIEW);
  // Set display constants.
  this.setInterpupillaryDistance(DEFAULT_INTERPUPILLARY_DISTANCE);
}
CardboardHMDVRDevice.prototype = new HMDVRDevice();

CardboardHMDVRDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeTranslation;
  if (whichEye == 'left') {
    eyeTranslation = this.eyeTranslationLeft;
  } else if (whichEye == 'right') {
    eyeTranslation = this.eyeTranslationRight;
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }
  return {
    recommendedFieldOfView: this.fov,
    eyeTranslation: eyeTranslation
  };
};

/**
 * Sets the IPD (in m) of this device. Useful for initialization and for
 * changing viewer parameters dynamically.
 */
CardboardHMDVRDevice.prototype.setInterpupillaryDistance = function(ipd) {
  this.eyeTranslationLeft = {
    x: ipd * -0.5,
    y: 0,
    z: 0
  };
  this.eyeTranslationRight = {
    x: ipd * 0.5,
    y: 0,
    z: 0
  };
};

/**
 * Sets the FOV (in degrees) of this viewer. Useful for initialization and
 * changing viewer parameters dynamically.
 */
CardboardHMDVRDevice.prototype.setFieldOfView = function(angle) {
  this.fov = {
    upDegrees: angle,
    downDegrees: angle,
    leftDegrees: angle,
    rightDegrees: angle
  };
};

module.exports = CardboardHMDVRDevice;
