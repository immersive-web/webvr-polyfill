function QuaternionIntegrator() {
}

QuaternionIntegrator.prototype.integrate = function(currentQ, curr, prev, deltaT, nextQ) {
  this.eulerStateTransition_(currentQ, curr, prev, deltaT, nextQ);

  // Normalize the quaternion.
  nextQ.normalize();
  if (nextQ.w < 0) {
    nextQ.conjugate();
    nextQ.w *= -1;
  }
};

QuaternionIntegrator.prototype.eulerStateTransition_ =
    function(previousQ, curr, prev, stepSize, nextQ) {
  
  var K1 = new THREE.Quaternion();
  this.stateTimeDerivative_(0, stepSize, previousQ, curr, prev, K1);
  this.addQuaternions_(nextQ, previousQ, K1);
};

QuaternionIntegrator.prototype.addQuaternions_ = function(out, q1, q2) {
  out.set(q1.x + q2.x, q1.y + q2.y, q1.z + q2.z, q1.w + q2.w); 
};

/**
 * Creates an angular velocity tensor out of a vector of angular rotations.
 * https://en.wikipedia.org/wiki/Angular_velocity#Angular_velocity_tensor
 */
QuaternionIntegrator.prototype.omega_ = function(w) {
  var out = new THREE.Matrix4();
  /*
  0.,    w(2), -w(1), w(0),
  -w(2), 0.,    w(0), w(1),
  w(1), -w(0),  0.,   w(2),
  -w(0),-w(1), -w(2), 0.;
  */
  out.set(0,    w.z, -w.y, w.x,
         -w.z,  0,    w.x, w.y,
          w.y, -w.x,  0,   w.z,
         -w.x, -w.y, -w.z, 0);
  return out;        
};

QuaternionIntegrator.prototype.stateTimeDerivative_ =
    function(t, stepSize, quaternion, curr, prev, derivative) {
  var out = new THREE.Vector4();
  // Quaternion time derivative.

  /*state_derivative->block<4, 1>(0, 0) =
      0.5 * geometry_toolbox::Omega(gyro_measurements.block<3, 1>(0, 0) +
                                    (gyro_measurements.block<3, 1>(3, 0) -
                                     gyro_measurements.block<3, 1>(0, 0)) *
                                        t / step_size) *
      state.block<4, 1>(0, 0);
      */
  var omegaVec = new THREE.Vector3();
  //omegaVec.copy(curr);
  //omegaVec.sub(prev);
  //omegaVec.multiplyScalar(t / stepSize);
  // TODO: Figure out the above... t == 0 always, so why even do this?
  omegaVec.copy(prev);
  var omegaMatrix = this.omega_(omegaVec);
  omegaMatrix.multiplyScalar(0.5);
  out.copy(quaternion);
  out.applyMatrix4(omegaMatrix);

  // This is a scaling factor that applies to each step of Runge-Kutta. We
  // perform it here to save duplicating code in the Runge-Kutta function.
  out.multiplyScalar(stepSize);
  derivative.copy(out)
};
