# WebVR Polyfill

This project provides a JavaScript implementation of the [WebVR
spec][spec].

The goal of this project is two fold:

1. Use WebVR today, without requiring a special browser build.
2. View (mono) content without a virtual reality headset.

[spec]: https://mozvr.github.io/webvr-spec/

## Implementation

The polyfill decides which VRDisplays to provide, depending on the configuration
of your browser. Mobile devices provide the CardboardVRDisplay. Desktop devices
use the MouseKeyboardVRDisplay.

`CardboardVRDisplay` provides default parameters for Cardboard's interpupillary
distance and headset, uses uses DeviceMotionEvents, and implements a
complementary filter which does sensor fusion. This device also implements pose
prediction, which greatly improves head tracking performance.

`MouseKeyboardVRDisplay` uses mouse events to allow you to do the equivalent of
mouselook. It also uses keyboard arrows and WASD keys to look around the scene
with the keyboard.

**Experimental**: `WebcamPositionSensorVRDevice` uses your laptop's webcam in
order to introduce translational degrees of freedom.

[ss]: https://play.google.com/store/apps/details?id=com.motorola.avatar

## Configuration

The polyfill can be configured and debugged with various options. The following
are supported:

    WebVRConfig = {
      // Forces availability of VR mode.
      //FORCE_ENABLE_VR: true, // Default: false.
      // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
      //K_FILTER: 0.98, // Default: 0.98.
      // How far into the future to predict during fast motion.
      //PREDICTION_TIME_S: 0.050, // Default: 0.050s.
      // Flag to disable touch panner. In case you have your own touch controls
      //TOUCH_PANNER_DISABLED: true, // Default: false.
      // Enable yaw panning only, disabling roll and pitch. This can be useful
      // for panoramas with nothing interesting above or below.
      //YAW_ONLY: true, // Default: false.
      // To disable keyboard and mouse controls. If you implement your own.
      //MOUSE_KEYBOARD_CONTROLS_DISABLED: true, // Default: false
      // Prevent the polyfill from initializing immediately. Requiures the app
      // to call InitializeWebVRPolyfill() before it can be used.
      //DEFER_INITIALIZATION: true, // default: false
      // Enable the deprecated version of the API (navigator.getVRDevices)
      //ENABLE_DEPRECATED_API: true, // default: false
      // Scales the recommended buffer size reported by WebVR, which can improve
      // performance.
      //BUFFER_SCALE: 0.5, // default: 1.0
      // Allow VRDisplay.submitFrame to change gl bindings, which is more
      // efficient if the application code will re-bind it's resources on the
      // next frame anyway.
      // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
      // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
      // and gl.TEXTURE_BINDING_2D for texture unit 0
      //DIRTY_SUBMIT_FRAME_BINDINGS: true // default: false
    }
