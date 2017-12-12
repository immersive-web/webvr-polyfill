# WebVR Polyfill

[![Build Status](http://img.shields.io/travis/googlevr/webvr-polyfill.svg?style=flat-square)](https://travis-ci.org/googlevr/webvr-polyfill)
[![Build Status](http://img.shields.io/npm/v/webvr-polyfill.svg?style=flat-square)](https://www.npmjs.org/package/webvr-polyfill)

A JavaScript implementation of the [WebVR spec][spec]. This project ensures
your WebVR content works on any platform, whether or not the browser/device has
native WebVR support, or when there are inconsistencies in implementation.

Take a look at [basic WebVR samples][samples] that use this polyfill.

## Installing

### Script

Download the build at [dist/webvr-polyfill.js] and include it as a script tag,
or use a CDN. You can also use the minified file in the same location as `webvr-polyfill.min.js`.

```html
  <script src='webvr-polyfill.js'></script>
  <!-- or use a link to a CDN -->
  <script src='https://cdn.jsdelivr.net/npm/webvr-polyfill@latest/build/webvr-polyfill.js'></script>
```

### npm

If you're using a build tool like [browserify] or [webpack], install it via [npm].

```
$ npm install --save webvr-polyfill
```

## Using

Instructions for using versions `>=0.10.0`. For `<=0.9.x` versions, see [0.9.40 tag](https://github.com/googlevr/webvr-polyfill/tree/v0.9.40).

The webvr-polyfill exposes a single constructor, `WebVRPolyfill` that takes an
object for configuration. See full configuration options at [src/config.js](src/config.js).

Be sure to instantiate the polyfill before calling any of your VR code! The
polyfill needs to patch the API if it does not exist so your content code can
assume that the WebVR API will just work.

If using script tags, a `WebVRPolyfill` global constructor will exist.

```js
var polyfill = new WebVRPolyfill();
```

In a modular ES6 world, import and instantiate the constructor similarly.

```js
import WebVRPolyfill from 'webvr-polyfill';
const polyfill = WebVRPolyfill();
```

## Goals

The polyfill's goal is to provide a library so that developers can create
content targeting the WebVR API without worrying about what browsers and devices
their users have in a world of growing, [but fragmented](caniuse) support.

The three main components of the polyfill are:

* Injects a [WebVR 1.1](spec) JavaScript implementation if one does not exist
* Patches browsers that have an incomplete or inconsistent implementation of the API
* Provide a synthesized [CardboardVRDisplay] on mobile when WebVR is not supported to provide a cardboard VR experience

## Performance

Performance is critical for VR. If you find your application is too sluggish,
consider tweaking some of the above parameters. In particular, keeping
`BUFFER_SCALE` at 0.5 (the default) will likely help a lot.

## Development

If you'd like to contribute to the `webvr-poyfill` library, check out
the repository and install
[Node](https://nodejs.org/en/download/package-manager/) and the dependencies:

```bash
git clone https://github.com/googlevr/webvr-polyfill
cd webvr-polyfill
npm install
```

### Development Commands

* `npm install`: installs the dependencies.
* `npm start`: auto-builds the module whenever any source changes and serves the example
content on `http://0.0.0.0:8080/`.
* `npm run build`: builds the module.

## License

This program is free software for both commercial and non-commercial use,
distributed under the [Apache 2.0 License](LICENSE).

[samples]: https://webvr.info/samples/
[npm]: https://www.npmjs.com
[browserify]: http://browserify.org/
[webpack]: https://webpack.github.io/
[caniuse]: https://caniuse.com/#search=webvr
[spec]: https://immersive-web.github.io/webxr/spec/1.1
[CardboardVRDisplay]: https://github.com/googlevr/cardboard-vr-display
