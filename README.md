# WebVR Polyfill

This project provides a JavaScript implementation of the [WebVR
spec][spec].

The goal of this project is two fold:

1. Use WebVR today, without requiring a special browser build.
2. View (mono) content without a virtual reality headset.

[spec]: http://mozvr.github.io/webvr-spec/webvr.html

## Implementation

`CardboardHMDVRDevice` provides default parameters for Cardboard's
interpupillary distance and headset.

`GyroPositionSensorVRDevice` uses the DeviceMotionEvents (which map roughly to
the gyroscope) to polyfill head-tracking on mobile devices.  This is used both
in Cardboard, and for [Spotlight Stories][ss]-style experiences. This input
device also implements head tracking with prediction, which greatly improves
head tracking quality.

`MouseKeyboardPositionSensorVRDevice` uses mouse events to allow you to do the
equivalent of mouselook. It also uses keyboard arrows and WASD keys to look
around the scene with the keyboard.

Experimental `WebcamPositionSensorVRDevice` uses your laptop's webcam in order
to introduce translational degrees of freedom.

[ss]: https://play.google.com/store/apps/details?id=com.motorola.avatar

## Related work

- Nonlinear Complementary Filters on the Special Orthogonal Group:
    <https://hal-unice.archives-ouvertes.fr/hal-00488376/document>
- IMU Data Fusing: Complementary, Kalman, and Mahony Filter:
    <http://www.olliw.eu/2013/imu-data-fusing/#mahonycode>
- Indirect Kalman Filter for 3D Attitude Estimation
    <http://www-users.cs.umn.edu/~trawny/Publications/Quaternions_3D.pdf>
