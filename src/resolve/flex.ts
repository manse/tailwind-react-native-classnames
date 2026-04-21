import type { TwTheme } from '../tw-config';
import type { ParseContext, StyleIR } from '../types';
import {
  getCompleteStyle,
  complete,
  parseStyleVal,
  unconfiggedStyle,
  isArbitraryValue,
} from '../helpers';

const LEADING_DASH = /^-/;
const SINGLE_NUMBER = /^\d+(\.\d+)?$/;
const TWO_INTEGERS = /^(\d+)\s+(\d+)$/;
const GROW_BASIS = /^(\d+)\s+([^ ]+)$/;
const THREE_VALUES = /^(\d+)\s+(\d+)\s+(.+)$/;
const GAP_DIR = /^-(x|y)-/;

export function flexGrowShrink(
  type: 'Grow' | 'Shrink',
  value: string,
  config?: TwTheme['flexGrow'] | TwTheme['flexShrink'],
): StyleIR | null {
  value = value.replace(LEADING_DASH, ``);
  if (isArbitraryValue(value)) {
    value = value.slice(1, -1);
  }
  const configKey = value || `DEFAULT`;
  const numericValue = Number(config?.[configKey] ?? value);
  if (!Number.isNaN(numericValue)) {
    return complete({ [`flex${type}`]: numericValue });
  }
  return null;
}

export function flex(value: string, config?: TwTheme['flex']): StyleIR | null {
  value = config?.[value] || value;
  if ([`min-content`, `revert`, `unset`].includes(value)) {
    // unsupported
    return null;
  }

  // @see https://developer.mozilla.org/en-US/docs/Web/CSS/flex
  // MDN: One value, unitless number: flex-grow flex-basis is then equal to 0.
  if (value.match(SINGLE_NUMBER)) {
    return complete({
      flexGrow: Number(value),
      flexBasis: `0%`,
    });
  }

  // MDN: Two values (both integers): flex-grow | flex-basis
  let match = value.match(TWO_INTEGERS);
  if (match) {
    return complete({
      flexGrow: Number(match[1]),
      flexShrink: Number(match[2]),
    });
  }

  // MDN: Two values: flex-grow | flex-basis
  match = value.match(GROW_BASIS);
  if (match) {
    const flexBasis = parseStyleVal(match[2] ?? ``);
    if (!flexBasis) {
      return null;
    }
    return complete({
      flexGrow: Number(match[1]),
      flexBasis,
    });
  }

  // MDN: Three values: flex-grow | flex-shrink | flex-basis
  match = value.match(THREE_VALUES);
  if (match) {
    const flexBasis = parseStyleVal(match[3] ?? ``);
    if (!flexBasis) {
      return null;
    }
    return complete({
      flexGrow: Number(match[1]),
      flexShrink: Number(match[2]),
      flexBasis,
    });
  }

  return null;
}

export function flexBasis(
  value: string,
  context: ParseContext = {},
  config?: TwTheme['flexBasis'],
): StyleIR | null {
  value = value.replace(LEADING_DASH, ``);
  const configValue = config?.[value];

  if (configValue !== undefined) {
    return getCompleteStyle(`flexBasis`, configValue, context);
  }

  return unconfiggedStyle(`flexBasis`, value, context);
}

export function gap(
  value: string,
  context: ParseContext = {},
  config?: TwTheme['gap'],
): StyleIR | null {
  let gapStyle = `gap`;

  value = value.replace(GAP_DIR, (_, dir) => {
    if (dir === `x`) {
      gapStyle = `columnGap`;
    }
    if (dir === `y`) {
      gapStyle = `rowGap`;
    }
    return ``;
  });

  if (value === `-x`) {
    gapStyle = `columnGap`;
    value = ``;
  } else if (value === `-y`) {
    gapStyle = `rowGap`;
    value = ``;
  }

  value = value.replace(LEADING_DASH, ``);

  const configKey = value || `DEFAULT`;
  const configValue = config?.[configKey];
  if (configValue !== undefined) {
    return getCompleteStyle(gapStyle, configValue, context);
  }
  return unconfiggedStyle(gapStyle, value, context);
}
