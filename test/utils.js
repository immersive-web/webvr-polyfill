import WebVRPolyfill from '../build/webvr-polyfill';
import localStorage from 'localStorage';
import jsdom from 'jsdom';

export const setupWindow = global => {
  global.window = new jsdom.JSDOM().window;
  global.document = global.window.document;
  global.navigator = global.window.navigator;
  global.localStorage = global.window.localStorage = localStorage;
  global.localStorage.clear();
  setDesktopUA(global);
};

export const setUA = (global, ua) => {
  Object.defineProperty(global.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
};

export const setDesktopUA = global => {
  setUA(global, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36');
};

export const setIOSUA = global => {
  setUA(global, 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A356 Safari/604.1');
};

export const setAndroidUA = global => {
  setUA(global, 'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19');
};

export const addNativeNoDisplay = (win, api) => {
  if (api !== '1.1') {
    throw new Error('only 1.1 supported now');
  }

  win.navigator.getVRDisplays = () => Promise.resolve([]);
  win.VRDisplay = WebVRPolyfill.VRDisplay;
  win.VRFrameData = WebVRPolyfill.VRFrameData;
};

export const addNativeWithDisplay = (win, api) => {
  addNativeNoDisplay(win, api);
  const display = new WebVRPolyfill.VRDisplay();
  display.displayName = '1.1 test device';
  win.navigator.getVRDisplays = () => new Promise(res => res([display]));
};
