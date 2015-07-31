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

// How much to interpolate between the current orientation estimate and the
// previous estimate position. This is helpful for devices with low
// deviceorientation firing frequency (eg. on iOS, it is 20 Hz).  The larger
// this value (in [0, 1]), the smoother but more delayed the head tracking is.
var INTERPOLATION_SMOOTHING_FACTOR = 0.01;
var PREDICTION_SMOOTHING_FACTOR = 0.1;

// The smallest quaternion magnitude per frame. If less rotation than this value
// occurs, we don't do any prediction at all.
var PREDICTION_THRESHOLD_DEG = 0.001;

// How far into the future to predict.
var PREDICTION_TIME_MS = 50;

// Fastest possible angular speed that a human can reasonably produce.
var MAX_ANGULAR_SPEED_DEG_PER_MS = 1;

var Modes = {
  NONE: 0,
  INTERPOLATE: 1,
  PREDICT: 2
}

function PosePredictor() {
  this.lastQ = new THREE.Quaternion();
  this.lastTimestamp = null;

  this.outQ = new THREE.Quaternion();
  this.deltaQ = new THREE.Quaternion();

  this.mode = Modes.PREDICT;
}

PosePredictor.prototype.getPrediction = function(currentQ, timestamp) {
  // If there's no previous quaternion, output the current one and save for
  // later.
  if (!this.lastTimestamp) {
    this.lastQ.copy(currentQ);
    this.lastTimestamp = timestamp;
    return currentQ;
  }

  var elapsedMs = timestamp - this.lastTimestamp;

  switch (this.mode) {
    case Modes.INTERPOLATE:
      this.outQ.copy(currentQ);
      this.outQ.slerp(this.lastQ, INTERPOLATION_SMOOTHING_FACTOR);

      // Save the current quaternion for later.
      this.lastQ.copy(currentQ);
      break;
    case Modes.PREDICT:
      // Q_delta = Q_last^-1 * Q_curr
      this.deltaQ.copy(this.lastQ);
      this.deltaQ.inverse();
      this.deltaQ.multiply(currentQ);

      // Convert from delta quaternion to axis-angle.
      var axis = this.getAxis_(this.deltaQ);
      var angle = this.getAngle_(this.deltaQ);

      // If there wasn't much rotation over the last frame, don't do prediction.
      if (THREE.Math.radToDeg(angle) < PREDICTION_THRESHOLD_DEG) {
        this.outQ.copy(currentQ);
        break;
      }

      // It took `elapsed` ms to travel the angle amount over the axis. Now,
      // we make a new quaternion based how far in the future we want to
      // calculate.
      var angularSpeed = angle / elapsedMs;
      var predictAngle = PREDICTION_TIME_MS * angularSpeed;

      // Sanity check angular speed. If it is insane (eg. greater than 1 degree
      // per millisecond), treat as an outlier and don't predict.
      if (THREE.Math.radToDeg(angularSpeed) > MAX_ANGULAR_SPEED_DEG_PER_MS) {
        this.outQ.copy(currentQ);
        break;
      }

      // Calculate the prediction delta to apply to the original angle.
      this.deltaQ.setFromAxisAngle(axis, predictAngle);
      // As a sanity check, use the same axis and angle as before, which should
      // cause no prediction to happen.
      //this.deltaQ.setFromAxisAngle(axis, angle);

      this.outQ.copy(this.lastQ);
      this.outQ.multiply(this.deltaQ);

      // Interpolate between the current position and the predicted one for more
      // smoothness. This doesn't actually seem to help.
      this.outQ.slerp(currentQ, PREDICTION_SMOOTHING_FACTOR);

      // For debugging, report the abs. difference between actual and predicted
      // angles.
      var angleDelta = THREE.Math.radToDeg(predictAngle - angle);
      if (angleDelta > 5) {
        console.log('|Actual-Predicted| = %d deg', angleDelta);
      }

      // Save the current quaternion for later.
      this.lastQ.copy(currentQ);
      break;
    case Modes.NONE:
    default:
      this.outQ.copy(currentQ);
  }
  this.lastTimestamp = timestamp;

  return this.outQ;
};

PosePredictor.prototype.getAxis_ = function(quat) {
  // x = qx / sqrt(1-qw*qw)
  // y = qy / sqrt(1-qw*qw)
  // z = qz / sqrt(1-qw*qw)
  var d = Math.sqrt(1 - quat.w * quat.w);
  return new THREE.Vector3(quat.x / d, quat.y / d, quat.z / d);
};

PosePredictor.prototype.getAngle_ = function(quat) {
  // angle = 2 * acos(qw)
  // If w is greater than 1 (THREE.js, how can this be?), arccos is not defined.
  if (quat.w > 1) {
    return 0;
  }
  var angle = 2 * Math.acos(quat.w);
  // Normalize the angle to be in [-π, π].
  if (angle > Math.PI) {
    angle -= 2 * Math.PI;
  }
  return angle;
};

module.exports = PosePredictor;
