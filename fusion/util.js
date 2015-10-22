var Util = window.Util || {};

Util.getScreenAdjustedRotationRate = function(rotationRate) {
  if (Util.isIOS()) {
    // iOS: angular speed in deg/s.
    return Util.getScreenAdjustedRotationRateIOS_(rotationRate);
  } else {
    // Android: angular speed in rad/s, so need to convert.
    rotationRate.alpha = THREE.Math.radToDeg(rotationRate.alpha);
    rotationRate.beta = THREE.Math.radToDeg(rotationRate.beta);
    rotationRate.gamma = THREE.Math.radToDeg(rotationRate.gamma);
    return Util.getScreenAdjustedRotationRate_(rotationRate);
  }
};

Util.getScreenAdjustedRotationRate_ = function(rotationRate) {
  var screenRotationRate = {
    alpha: -rotationRate.alpha,
    beta: rotationRate.beta,
    gamma: rotationRate.gamma
  };
  switch (window.orientation) {
    case 90:
      screenRotationRate.beta  = - rotationRate.gamma;
      screenRotationRate.gamma =   rotationRate.beta;
      break;
    case 180:
      screenRotationRate.beta  = - rotationRate.beta;
      screenRotationRate.gamma = - rotationRate.gamma;
      break;
    case 270:
    case -90:
      screenRotationRate.beta  =   rotationRate.gamma;
      screenRotationRate.gamma = - rotationRate.beta;
      break;
    default: // SCREEN_ROTATION_0
      screenRotationRate.beta  =   rotationRate.beta;
      screenRotationRate.gamma =   rotationRate.gamma;
      break;
  }
  return screenRotationRate;
};

Util.getScreenAdjustedRotationRateIOS_ = function(rotationRate) {
  var screenRotationRate = {
    alpha: rotationRate.alpha,
    beta: rotationRate.beta,
    gamma: rotationRate.gamma
  };
  // Values empirically derived.
  switch (window.orientation) {
    case 90:
      screenRotationRate.beta  = -rotationRate.beta;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
    case 180:
      // You can't even do this on iOS.
      break;
    case 270:
    case -90:
      screenRotationRate.alpha = -rotationRate.alpha;
      screenRotationRate.beta  =  rotationRate.beta;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
    default: // SCREEN_ROTATION_0
      screenRotationRate.alpha =  rotationRate.beta;
      screenRotationRate.beta  =  rotationRate.alpha;
      screenRotationRate.gamma =  rotationRate.gamma;
      break;
  }
  return screenRotationRate;
};


Util.isIOS = function() {
  return /iPad|iPhone|iPod/.test(navigator.platform);
};

Util.getDominantAxis = function(axis) {
  var dominantAxis;
  var a = new THREE.Vector3();
  a.x = Math.abs(axis.x);
  a.y = Math.abs(axis.y);
  a.z = Math.abs(axis.z);
  if (a.x > a.y*20 && a.x > a.z*20) {
    dominantAxis = 'x';
  } else if (a.y > a.x*20 && a.y > a.z*20) {
    dominantAxis = 'y';
  } else if (a.z > a.x*20 && a.z > a.x*20) {
    dominantAxis = 'z';
  }
  return dominantAxis;
}

Util.scaleQuaternion = function(quat, amount) {
  var axis = Util.getQuaternionAxis(quat);
  var angle = Util.getQuaternionAngle(quat);
  quat.setFromAxisAngle(axis, angle * amount);
  return quat;
};

Util.getQuaternionAxis = function(quat) {
  // x = qx / sqrt(1-qw*qw)
  // y = qy / sqrt(1-qw*qw)
  // z = qz / sqrt(1-qw*qw)
  var d = Math.sqrt(1 - quat.w * quat.w);
  return new THREE.Vector3(quat.x / d, quat.y / d, quat.z / d);
};

Util.getQuaternionAngle = function(quat) {
  // angle = 2 * acos(qw)
  // If w is greater than 1 (THREE.js, how can this be?), arccos is not defined.
  if (quat.w > 1) {
    console.warn('getQuaternionAngle: w > 1');
    return 0;
  }
  var angle = 2 * Math.acos(quat.w);
  return angle;
};

/**
 * Assumes angle is within 2π outside of the range.
 */
Util.normalizeAngle = function(angle, opt_range) {
  var range = opt_range || [-Math.PI, Math.PI];
  if (angle < range[0]) {
    angle += 2*Math.PI;
  } else if (angle > range[1]) {
    angle -= 2*Math.PI;
  }
  return angle;
}

Util.normalizeAngleVector = function(vector, opt_range) {
  vector.x = Util.normalizeAngle(vector.x, opt_range);
  vector.y = Util.normalizeAngle(vector.y, opt_range);
  vector.z = Util.normalizeAngle(vector.z, opt_range);
};

/**
 * Return an equivalent angle that is as close to otherAngle as possible.
 * Assumption is that angle and otherAngle are within 2π of one another.
 */
Util.getClosestAngle = function(angle, otherAngle) {
  var diff = angle - otherAngle;
  if (diff > Math.PI) {
    return angle - Math.PI*2;
  } else if (diff < -Math.PI) {
    return angle + Math.PI*2;
  }
  return angle;
};

Util.quaternionAngle = function(q1, q2) {
  var v1 = new THREE.Vector3(0, 0, 1);
  var v2 = new THREE.Vector3(0, 0, 1);
  v1.applyQuaternion(q1);
  v2.applyQuaternion(q2);
  return v1.angleTo(v2);
};
