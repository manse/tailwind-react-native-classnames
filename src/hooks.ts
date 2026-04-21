import { useMemo, useRef, useState } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';
import type { TailwindFn, RnColorScheme } from './types';
import type { TwConfig } from './tw-config';
import type { Platform } from './types';
import rawCreate from './create';

type AppOptions = {
  observeDeviceColorSchemeChanges: false;
  initialColorScheme: 'device' | 'light' | 'dark';
};

export function useDeviceContext(
  twConfig: TwConfig,
  platform: Platform,
  appOptions?: AppOptions,
): TailwindFn {
  const deviceColorScheme = useColorScheme();
  const window = useWindowDimensions();

  const [appColorScheme, setAppColorScheme] = useState<RnColorScheme>(() => {
    if (appOptions) {
      const initial = appOptions.initialColorScheme;
      if (`withDeviceColorScheme` in appOptions) {
        console.error(MIGRATION_ERR); // eslint-disable-line no-console
      }
      return initial === `device` ? deviceColorScheme : initial;
    }
    return undefined;
  });

  const colorScheme = appOptions ? appColorScheme : deviceColorScheme;

  const tw = useMemo(
    () =>
      rawCreate(twConfig, {
        platform,
        windowDimensions: window,
        fontScale: window.fontScale,
        pixelDensity: window.scale === 1 ? 1 : 2,
        colorScheme,
      }),
    [twConfig, platform, window, colorScheme],
  );

  // store setAppColorScheme and current colorScheme on tw for useAppColorScheme
  const ref = useRef({ setAppColorScheme, colorScheme });
  ref.current = { setAppColorScheme, colorScheme };
  (tw as any).__colorSchemeRef = ref;

  return tw;
}

export function useAppColorScheme(
  tw: TailwindFn,
): [
  colorScheme: RnColorScheme,
  toggleColorScheme: () => void,
  setColorScheme: (colorScheme: RnColorScheme) => void,
] {
  const ref = (tw as any).__colorSchemeRef as React.MutableRefObject<{
    setAppColorScheme: (cs: RnColorScheme) => void;
    colorScheme: RnColorScheme;
  }>;
  return [
    ref.current.colorScheme,
    () => {
      const next = ref.current.colorScheme === `dark` ? `light` : `dark`;
      ref.current.setAppColorScheme(next);
    },
    (newColorScheme) => {
      ref.current.setAppColorScheme(newColorScheme);
    },
  ];
}

const MIGRATION_ERR = `\`withDeviceColorScheme\` has been changed to \`observeDeviceColorSchemeChanges\` in twrnc@4.0.0 -- see migration-guide.md for more details`;
