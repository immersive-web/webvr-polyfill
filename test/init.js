import jsdom from 'jsdom';

// `window` must exist before including
// the polyfill, which gets reset between tests,
// and also before calling CustomEvent
global.window = new jsdom.JSDOM().window;
global.document = global.window.document;
global.navigator = global.window.navigator;
global.screen = {};

// cardboard-vr-display uses CustomEvent globals; shim
// so this runs in node
// Logic similar to https://github.com/webmodules/custom-event
// but can't rely on it's feature detection due to timing
// of including the shim and populating window/document
global.CustomEvent = function CustomEvent(type, params) {
  const e = global.document.createEvent('CustomEvent');
  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, undefined);
  }
  return e;
}
