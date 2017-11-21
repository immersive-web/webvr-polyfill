import WebVRPolyfill from '../';
import { setupWindow, setIOSUA, setAndroidUA, addNative } from './utils';
import chai from 'chai';
const { expect } = chai;

const DEFAULT = {
  DPDB_URL: null,
};

describe('WebVRPolyfill', function() {
  beforeEach(() => setupWindow(global));
  afterEach(() => delete global.window);

  it('populates globals if enabled', () => {
    new WebVRPolyfill(DEFAULT);
    expect(global.navigator.getVRDisplays).to.exist;
    expect(global.window.VRDisplay).to.exist;
    expect(global.window.VRFrameData).to.exist;
  });

  it('should be enabled if API does not exist', () => {
    expect(global.window.getVRDisplays).to.not.exist;
    const polyfill = new WebVRPolyfill(DEFAULT);
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.true;
  });

  it('should be disabled if API exists', () => {
    addNative(global.window, '1.1');
    expect(global.navigator.getVRDisplays).to.exist;
    const polyfill = new WebVRPolyfill(DEFAULT);
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.false;
  });

  it('should be enabled if API exists and ALWAYS_APPEND_POLYFILL_DISPLAY', () => {
    addNative(global.window, '1.1');
    expect(global.navigator.getVRDisplays).to.exist;
    const polyfill = new WebVRPolyfill(Object.assign({
      ALWAYS_APPEND_POLYFILL_DISPLAY: true,
    }, DEFAULT));
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.true;
  });

  describe('getNativeSupport()', () => {
    it('returns null when no native support found', () => {
      const polyfill = new WebVRPolyfill(DEFAULT);
      expect(polyfill.getNativeSupport()).to.be.null;
    });

    it('returns "1.1" when 1.1 native support found', () => {
      addNative(global.window, '1.1');
      const polyfill = new WebVRPolyfill(DEFAULT);
      expect(polyfill.getNativeSupport()).to.be.equal('1.1');
    });
  });

  describe('displays', () => {
    it('provides CardboardVRDisplay on mobile (Android)', () => {
      setAndroidUA(global);
      const polyfill = new WebVRPolyfill(DEFAULT);
      return global.navigator.getVRDisplays().then(displays => {
        expect(displays.length).to.be.equal(1);
        expect(displays[0].displayName).to.have.string('Cardboard');
      });
    });

    it('provides CardboardVRDisplay on mobile (iOS)', () => {
      setIOSUA(global);
      const polyfill = new WebVRPolyfill(DEFAULT);
      return global.navigator.getVRDisplays().then(displays => {
        expect(displays.length).to.be.equal(1);
        expect(displays[0].displayName).to.have.string('Cardboard');
      });
    });

    it('provides MouseKeyboardVRDisplay on desktop', () => {
      const polyfill = new WebVRPolyfill(DEFAULT);
      return global.navigator.getVRDisplays().then(displays => {
        expect(displays.length).to.be.equal(1);
        expect(displays[0].displayName).to.have.string('Mouse');
      });
    });

    it('does not provide MouseKeyboardVRDisplay on desktop if MOUSE_KEYBOARD_CONTROLS_DISABLED', () => {
      const polyfill = new WebVRPolyfill(Object.assign({
        MOUSE_KEYBOARD_CONTROLS_DISABLED: true,
      }, DEFAULT));
      return global.navigator.getVRDisplays().then(displays => {
        expect(displays.length).to.be.equal(0);
      });
    });
    
    it('provides CardboardVRDisplay on desktop when FORCE_ENABLE_VR', () => {
      const polyfill = new WebVRPolyfill(Object.assign({
        FORCE_ENABLE_VR: true,
      }, DEFAULT));
      return global.navigator.getVRDisplays().then(displays => {
        expect(displays.length).to.be.equal(2);
        expect(displays[0].displayName).to.have.string('Cardboard');
        expect(displays[1].displayName).to.have.string('Mouse');
      });
    });
  });
});
