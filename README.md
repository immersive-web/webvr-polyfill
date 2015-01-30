# WebVR Polyfill

The goal of this project is two fold:

1. Make it possible for developers to use WebVR today, without special
   browser builds.
2. Provide good fallbacks for users that don't have VR hardware.


## Implementation

`CardboardHMDVRDevice` provides default parameters for Cardboard's
interpupillary distance and headset.

`GyroPositionSensorVRDevice` uses the DeviceMotionEvents (which map
roughly to the gyroscope) to polyfill head-tracking on mobile devices.
This is used both in Cardboard, and for Spotlight Stories-style
experiences.

`MouseKeyboardPositionSensorVRDevice` uses mouse events to allow you to
do the equivalent of mouselook. It also uses keyboard arrows and WASD
keys to look around the scene with the keyboard.


## Open issues

- Provide a GUI to specify HMD parameters. Possibly a configuration UI
  for setting them for non-Cardboard devices.
- Provide new types of tracking, perhaps using the web camera for 3
  translational degrees of freedom, eg: <http://topheman.github.io/parallax/>
