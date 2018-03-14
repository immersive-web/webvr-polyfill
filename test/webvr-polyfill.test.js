import WebVRPolyfill from '../build/webvr-polyfill';
import { setupWindow, setIOSUA, setAndroidUA, addNativeNoDisplay, addNativeWithDisplay } from './utils';
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

  it('should be disabled on desktop if API exists and PROVIDE_MOBILE_VRDISPLAY=false', () => {
    addNativeWithDisplay(global.window, '1.1');
    expect(global.navigator.getVRDisplays).to.exist;
    const polyfill = new WebVRPolyfill(Object.assign({
      PROVIDE_MOBILE_VRDISPLAY: false,
    }, DEFAULT));
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.false;
  });

  it('should be disabled on mobile if API exists and PROVIDE_MOBILE_VRDISPLAY=false', () => {
    setIOSUA(global);
    addNativeWithDisplay(global.window, '1.1');
    expect(global.navigator.getVRDisplays).to.exist;
    const polyfill = new WebVRPolyfill(Object.assign({
      PROVIDE_MOBILE_VRDISPLAY: false,
    }, DEFAULT));
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.false;
  });

  it('should be enabled on mobile if API exists and PROVIDE_MOBILE_VRDISPLAY=true', () => {
    setIOSUA(global);
    addNativeWithDisplay(global.window, '1.1');
    expect(global.navigator.getVRDisplays).to.exist;
    const polyfill = new WebVRPolyfill(Object.assign({
      PROVIDE_MOBILE_VRDISPLAY: true,
    }, DEFAULT));
    expect(global.navigator.getVRDisplays).to.exist;
    expect(polyfill.enabled).to.be.true;
  });

  describe('hasNative', () => {
    it('should be false when no native support found', () => {
      const polyfill = new WebVRPolyfill(DEFAULT);
      expect(polyfill.hasNative).to.be.equal(false);
    });

    it('should be true when 1.1 native support found', () => {
      addNativeWithDisplay(global.window, '1.1');
      const polyfill = new WebVRPolyfill(DEFAULT);
      expect(polyfill.hasNative).to.be.equal(true);
    });
  });

  describe('displays', () => {
    describe('desktop', () => {
      it('provides no displays on desktop when API does not exist', () => {
        const polyfill = new WebVRPolyfill(DEFAULT);
        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(0);
        });
      });

      it('provides no displays on desktop when API does exist', () => {
        addNativeNoDisplay(global.window, '1.1');
        const polyfill = new WebVRPolyfill(DEFAULT);
        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(0);
        });
      });

      it('provides only native displays on desktop when API does exist with display', () => {
        addNativeWithDisplay(global.window, '1.1');
        const polyfill = new WebVRPolyfill(DEFAULT);
        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(1);
          expect(displays[0].displayName).to.have.string('test device');
        });
      });
    });

    ['iOS', 'Android'].forEach(mobilePlatform => {
      describe(mobilePlatform, () => {
      it(`provides CardboardVRDisplay on mobile (${mobilePlatform}) by default when API does not exist`, () => {
        mobilePlatform === 'iOS' ? setIOSUA(global) : setAndroidUA(global);

        const polyfill = new WebVRPolyfill(DEFAULT);
        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(1);
          expect(displays[0].displayName).to.have.string('Cardboard');
        });
      });

      it(`provides CardboardVRDisplay on mobile (${mobilePlatform}) by default when API exists without displays`, () => {
        mobilePlatform === 'iOS' ? setIOSUA(global) : setAndroidUA(global);
        addNativeNoDisplay(global.window, '1.1');

        const polyfill = new WebVRPolyfill(DEFAULT);
        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(1);
          expect(displays[0].displayName).to.have.string('Cardboard');
        });
      });

      it(`provides no displays on mobile (${mobilePlatform}) when API exists without displays and PROVIDE_MOBILE_VRDISPLAY=false`, () => {
        mobilePlatform === 'iOS' ? setIOSUA(global) : setAndroidUA(global);
        addNativeNoDisplay(global.window, '1.1');

        const polyfill = new WebVRPolyfill(Object.assign({
          PROVIDE_MOBILE_VRDISPLAY: false,
        }, DEFAULT));

        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(0);
        });
      });

      it(`provides only native displays on mobile (${mobilePlatform}) when API exists with displays`, () => {
        mobilePlatform === 'iOS' ? setIOSUA(global) : setAndroidUA(global);
        addNativeWithDisplay(global.window, '1.1');

        const polyfill = new WebVRPolyfill(DEFAULT);

        return global.navigator.getVRDisplays().then(displays => {
          expect(displays.length).to.be.equal(1);
          expect(displays[0].displayName).to.have.string('test device');
        });
      });
    });
    });
  });
});
