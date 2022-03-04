import UAParser from 'ua-parser-js';
import type { DeviceType, SessionInfo } from '$shared/types';

declare global {
  interface NavigatorUABrandVersion {
    brand?: string;
    version?: string;
  }

  interface UADataValues {
    architecture?: string;
    bitness?: string;
    brands?: NavigatorUABrandVersion[];
    mobile?: boolean;
    model?: string;
    platform?: string;
    platformVersion?: string;
    uaFullVersion?: string;
  }

  interface UALowEntropyJSON {
    brands?: NavigatorUABrandVersion[];
    mobile?: boolean;
    platform?: string;
  }

  interface NavigatorUA {
    readonly userAgentData?: NavigatorUAData;
  }

  interface NavigatorUAData {
    readonly brands: ReadonlyArray<NavigatorUABrandVersion>;
    readonly mobile: boolean;
    readonly platform: string;
    getHighEntropyValues(hints: string[]): Promise<UADataValues>;
    toJSON(): UALowEntropyJSON;
  }

  const NavigatorUAData: {
    prototype: NavigatorUAData;
    new (): NavigatorUAData;
  };

  interface Navigator extends NavigatorUA {
    standalone?: boolean;
  }
}

function _useSessionInfo() {
  const standalone = useMediaQuery('(display-mode:standalone)');
  const deviceName = ref('');
  const devicePlatform = ref('Unknown Platform');
  const deviceType = ref<DeviceType>('unknown');
  const sessionInfo = computed(
    (): SessionInfo => ({
      client:
        standalone.value || navigator.standalone
          ? 'Streamist PWA'
          : 'Streamist Web App',
      platform: devicePlatform.value,
      name: deviceName.value,
      type: deviceType.value,
    })
  );

  if (navigator.userAgent) {
    const ua = new UAParser(navigator.userAgent).getResult();
    deviceType.value = !ua.device.type
      ? 'unknown'
      : ua.device.type === 'console'
      ? 'desktop'
      : 'mobile';
    devicePlatform.value = ua.os.name || devicePlatform.value;
    deviceName.value = ua.device.model || ua.device.vendor || '';
  }

  if (navigator.userAgentData) {
    deviceType.value = navigator.userAgentData.mobile ? 'mobile' : 'desktop';
    devicePlatform.value =
      navigator.userAgentData.platform || devicePlatform.value;
    navigator.userAgentData
      .getHighEntropyValues(['model', 'brand'])
      .then((data): void => {
        if (data.model) {
          deviceName.value = data.model;
        }
      });
  }

  return {
    sessionInfo,
  };
}

export const useSessionInfo = createSharedComposable(_useSessionInfo);
