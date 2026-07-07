import resolveConfig from 'tailwindcss/resolveConfig';
import { Platform } from 'react-native';
import type {
  ClassInput,
  DependentStyle,
  Style,
  TailwindFn,
  OrderedStyle,
  StyleIR,
  DeviceContext,
} from './types';
import { PREFIX_COLOR_PROP_MAP, type TwConfig } from './tw-config';
import Cache from './cache';
import UtilityParser from './UtilityParser';
import { configColor, removeOpacityHelpers } from './resolve/color';
import { parseInputs, parseStringInputs } from './parse-inputs';
import { complete, warn } from './helpers';

const WHITESPACE_TEST = /\s+/;
const COLOR_PREFIX = /^(bg-|text-|border-)/;
const WHITESPACE_SPLIT = /\s+/g;
const COLOR_PREFIX_BARE = /^(bg|text|border)-/;

export function create(
  customConfig: TwConfig = {},
  device: DeviceContext = {
    platform: Platform.OS,
  },
  { customClasses = {} }: {
    customClasses?: Record<string, string>
  } = {},
): TailwindFn {
  const config = resolveConfig(withContent(customConfig) as any) as TwConfig;
  const customStyleUtils = getCustomFontUtils(customConfig, config);

  function deriveCacheGroup(): string {
    return (
      [
        device.colorScheme === `dark` ? `dark` : false,
        device.windowDimensions ? `w${device.windowDimensions.width}` : false,
        device.windowDimensions ? `h${device.windowDimensions.height}` : false,
        device.fontScale ? `fs${device.fontScale}` : false,
        device.pixelDensity === 2 ? `retina` : false,
      ]
        .filter(Boolean)
        .join(`--`) || `default`
    );
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const tailwindFn = (strings: TemplateStringsArray, ...values: (string | number)[]) => {
    let str = ``;
    strings.forEach((string, i) => {
      str += string + (values[i] ?? ``);
    });
    return style(str);
  };

  const contextCaches: Record<string, Cache> = {};
  let cache = new Cache();
  configureCache();

  function configureCache(): void {
    const cacheGroup = deriveCacheGroup();
    const existing = contextCaches[cacheGroup];
    if (existing) {
      cache = existing;
      return;
    }
    const newCache = new Cache(customStyleUtils);
    contextCaches[cacheGroup] = newCache;
    cache = newCache;
  }

  const expandCustomClasses = Object.keys(customClasses).length > 0 ? (parsedUtilities: string[]): string[] => {
    return parsedUtilities.flatMap((utility) => {
      const customClass = customClasses[utility];
      if (customClass) {
        return parseStringInputs([customClass]);
      } else {
        return [utility];
      }
    })
  } : (parsedUtilities: string[]): string[] => parsedUtilities;

  function style(...inputs: ClassInput[]): Style {
    let resolved: Style = {};
    const dependents: DependentStyle[] = [];
    const ordered: OrderedStyle[] = [];
    const [parsedUtilities, userStyle] = parseInputs(inputs);
    const utilities = expandCustomClasses(parsedUtilities);

    // check if we've seen this full set of classes before
    // if we have a cached copy, we can skip examining each utility
    const joined = utilities.join(` `);
    const cached = cache.getStyle(joined);
    if (cached) {
      return userStyle ? { ...cached, ...userStyle } : cached;
    }

    for (const utility of utilities) {
      let styleIr = cache.getIr(utility);
      if (!styleIr) {
        const parser = new UtilityParser(utility, config, cache, device);
        styleIr = parser.parse();
      }

      switch (styleIr.kind) {
        case `complete`:
          resolved = { ...resolved, ...styleIr.style };
          cache.setIr(utility, styleIr);
          break;
        case `dependent`:
          dependents.push(styleIr);
          break;
        case `ordered`:
          ordered.push(styleIr);
          break;
        case `null`:
          cache.setIr(utility, styleIr);
          break;
      }
    }

    if (ordered.length > 0) {
      ordered.sort((a, b) => a.order - b.order);
      for (const orderedStyle of ordered) {
        switch (orderedStyle.styleIr.kind) {
          case `complete`:
            resolved = { ...resolved, ...orderedStyle.styleIr.style };
            break;
          case `dependent`:
            dependents.push(orderedStyle.styleIr);
            break;
        }
      }
    }

    if (dependents.length > 0) {
      for (const dependent of dependents) {
        const error = dependent.complete(resolved);
        if (error) {
          warn(error);
        }
      }
      removeOpacityHelpers(resolved);
    }

    // cache the full set of classes for future re-renders
    // it's important we cache BEFORE merging in userStyle below
    if (joined !== ``) {
      cache.setStyle(joined, resolved);
    }

    if (userStyle) {
      resolved = { ...resolved, ...userStyle };
    }

    return resolved;
  }

  function color(utils: string): string {
    // Prefer prefix-specific colors within the theme config.
    // Only support theme objects which do not require a plugin. See:
    // https://v2.tailwindcss.com/docs/theme#configuration-reference
    // https://v3.tailwindcss.com/docs/theme#configuration-reference

    if (config.theme) {
      let color: string | null;

      // Iterate supported theme objects and try to find a match
      for (const key of Object.keys(PREFIX_COLOR_PROP_MAP)) {
        const prefix = key as keyof typeof PREFIX_COLOR_PROP_MAP;
        const themePropertyName = PREFIX_COLOR_PROP_MAP[prefix];
        const themeColors = config.theme[themePropertyName];

        if (utils.startsWith(prefix) && themeColors) {
          const suffix = utils.slice(prefix.length);
          if (suffix) {
            color = configColor(suffix, themeColors);
            if (color) {
              return color;
            }
          }
        }

        // bare prefix without `-` (e.g. `bg`, `text`) resolves to DEFAULT
        const barePrefix = prefix.slice(0, -1); // remove trailing `-`
        if (utils === barePrefix && themeColors) {
          color = configColor(`DEFAULT`, themeColors);
          if (color) {
            return color;
          }
        }
      }

      // Check `colors` if `utils` is not a computed value (e.g. `secondary opacity-50` or `white/25`)
      if (!WHITESPACE_TEST.test(utils) && !utils.includes(`/`) && config.theme.colors) {
        color = configColor(utils, config.theme.colors);

        if (color) {
          return color;
        }
      }
    }

    // Fall back to attempting style parsing
    let toStyle = utils;

    if (!COLOR_PREFIX.test(utils)) {
      toStyle = utils
        .split(WHITESPACE_SPLIT)
        .map((util) => util.replace(COLOR_PREFIX_BARE, ``))
        .map((util) => `bg-${util}`)
        .join(` `);
    }

    const styleObj = style(toStyle);

    const foundColorKey = [
      `backgroundColor`,
      `borderColor`,
      `borderLeftColor`,
      `borderRightColor`,
      `borderTopColor`,
      `borderBottomColor`,
      `color`,
    ].find((key) => typeof styleObj?.[key] === `string`);

    if (foundColorKey) {
      return styleObj?.[foundColorKey] as string;
    }

    return `#808080`;
  }

  tailwindFn.style = style;
  tailwindFn.color = color;

  return tailwindFn;
}

export default create;

function withContent(config: TwConfig): TwConfig & { content: string[] } {
  return {
    ...config,
    // prevent warnings from tailwind about not having a `content` prop
    // we don't need one because we have our own jit parser which
    // does not rely on knowing content paths to search
    content: [`_no_warnings_please`],
  };
}

// Allow override default font-<name> style
// @TODO: long-term, i'd like to think of a more generic way to allow
// custom configurations not to get masked by default utilities...
function getCustomFontUtils(
  customConfig: TwConfig,
  config: TwConfig,
): Array<[string, StyleIR]> {
  const customStyleUtils: Array<[string, StyleIR]> = [];

  if (customConfig.theme?.fontWeight || customConfig.theme?.extend?.fontWeight) {
    [
      ...Object.entries(customConfig.theme?.fontWeight ?? {}),
      ...Object.entries(customConfig.theme?.extend?.fontWeight ?? {}),
    ].forEach(([name, value]) => {
      customStyleUtils.push([`font-${name}`, complete({ fontWeight: String(value) })]);
    });
  }
  if (`object` === typeof config.theme?.fontFamily) {
    [
      ...Object.entries(customConfig.theme?.fontFamily ?? {}),
      ...Object.entries(customConfig.theme?.extend?.fontFamily ?? {}),
    ].forEach(([name, value]) => {
      // weight-map object: { normal: 'Font-Regular', bold: 'Font-Bold', ... }
      if (isPlainObject(value)) {
        const weightMap = value as Record<string, string>;
        customStyleUtils.push([
          `font-${name}`,
          {
            kind: `dependent`,
            complete(style) {
              const weight = normalizeFontWeight(style.fontWeight as string | undefined);
              const fontFamily = weightMap[weight] ?? weightMap[`normal`];
              if (fontFamily) {
                style.fontFamily = fontFamily;
                delete style.fontWeight;
              }
            },
          },
        ]);
        return;
      }
      const fontFamily = Array.isArray(value) ? value[0] : value;
      if (fontFamily) {
        customStyleUtils.push([`font-${name}`, complete({ fontFamily })]);
      }
    });
  }
  return customStyleUtils;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === `object` && value !== null && !Array.isArray(value);
}

const FONT_WEIGHT_ALIASES: Record<string, string> = {
  100: `thin`,
  200: `extralight`,
  300: `light`,
  400: `normal`,
  500: `medium`,
  600: `semibold`,
  700: `bold`,
  800: `extrabold`,
  900: `black`,
};

function normalizeFontWeight(weight: string | undefined): string {
  if (!weight) return `400`;
  return FONT_WEIGHT_ALIASES[weight] ?? weight;
}
