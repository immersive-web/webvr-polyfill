var AXES = ['x', 'y', 'z'];
var HISTORY_SIZE = 100;
var axis_index = 0;
var co = new ComplementaryOrientation();

var gyroHistory = new CBuffer(HISTORY_SIZE);
var accelHistory = new CBuffer(HISTORY_SIZE);
var filterHistory = new CBuffer(HISTORY_SIZE);
var predictHistory = new CBuffer(HISTORY_SIZE);

function loop() {
  // Accelerometer is GREEN.
  var lastAccel = new THREE.Vector3();
  lastAccel.copy(co.filter.measuredGravity);
  accelHistory.push(lastAccel);

  // Gyro is BLUE.
  var lastGyro = new THREE.Vector3(0, 0, -1);
  var invGyroOnly = new THREE.Quaternion();
  invGyroOnly.copy(co.filter.gyroIntegralQ);
  invGyroOnly.inverse();
  lastGyro.applyQuaternion(invGyroOnly);
  lastGyro.normalize();
  gyroHistory.push(lastGyro);

  // Filter is ORANGE.
  var lastFilter = new THREE.Vector3();
  lastFilter.copy(co.filter.estimatedGravity);
  filterHistory.push(lastFilter);

  co.getOrientation();
  // Predicted is RED.
  var predict = new THREE.Vector3(0, 0, -1);
  var invPredicted = new THREE.Quaternion();
  invPredicted.copy(co.predictedQ);
  invPredicted.inverse();
  predict.applyQuaternion(invPredicted);
  predict.normalize();
  predictHistory.push(predict);


  requestAnimationFrame(loop);
}
loop();

window.addEventListener('touchend', function() {
  axis_index = (axis_index + 1) % AXES.length;
  console.log('New axis: %s', AXES[axis_index]);
});

mathbox = mathBox({
  plugins: ['core', 'cursor'],
  camera: {
    fov: 30,
  },
});
three = mathbox.three;

three.camera.position.set(0, 0, 10);
three.renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0);

time = 0
three.on('update', function () {
  time = three.Time.now
});

view = mathbox.set('focus', 6).cartesian({
  range: [[-3, 3], [-Math.PI, Math.PI], [-1, 1]],
  scale: [1.5, 2, 1],
});

// Plot accelerometer.
view.interval({
  length: HISTORY_SIZE,
  expr: function (emit, x, i, t) {
    var accel = accelHistory.get(i);
    if (accel) {
      emit(x, accel[AXES[axis_index]]);
    }
  },
  items: 1,
  channels: 2,
});

view.line({
  color: 0x30DD30,
  width: 4,
  size: 1,
  start: false,
  end: false,
});


// Plot gyroscope.
view.interval({
  length: HISTORY_SIZE,
  expr: function (emit, x, i, t) {
    var gyro = gyroHistory.get(i);
    if (gyro) {
      emit(x, gyro[AXES[axis_index]]);
    }
  },
  items: 1,
  channels: 2,
});

view.line({
  color: 0x3090FF,
  width: 4,
  size: 1,
  start: false,
  end: false,
});

// Plot complementary filter output.
view.interval({
  length: HISTORY_SIZE,
  expr: function (emit, x, i, t) {
    var filter = filterHistory.get(i);
    if (filter) {
      emit(x, filter[AXES[axis_index]]);
    }
  },
  items: 1,
  channels: 2,
});

view.line({
  color: 0xFF9030,
  width: 7,
  size: 1,
  start: false,
  end: false,
});

// Plot predict out.
view.interval({
  length: HISTORY_SIZE,
  expr: function (emit, x, i, t) {
    var predict = predictHistory.get(i);
    if (predict) {
      emit(x, predict[AXES[axis_index]]);
    }
  },
  items: 1,
  channels: 2,
});

view.line({
  color: 'red',
  width: 4,
  size: 1,
  start: false,
  end: false,
});
