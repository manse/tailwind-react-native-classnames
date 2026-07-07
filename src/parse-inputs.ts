import type { ClassInput, Style } from './types';

export function parseInputs(
  inputs: ClassInput[],
): [classNames: string[], rnStyles: Style | null] {
  const classNames: string[] = [];
  let styles: Style | null = null;

  inputs.forEach((input) => {
    if (typeof input === `string`) {
      classNames.push(...split(input));
    } else if (Array.isArray(input)) {
      classNames.push(...input.flatMap(split));
    } else if (typeof input === `object` && input !== null) {
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === `boolean`) {
          classNames.push(...(value ? split(key) : []));
        } else if (styles) {
          styles[key] = value;
        } else {
          styles = { [key]: value };
        }
      }
    }
  });

  return [classNames.filter(Boolean).filter(unique), styles];
}
export function parseStringInputs(inputs: string[]): string[] {
  return inputs
    .flatMap((input) => split(input))
    .filter(Boolean)
    .filter(unique);
}

const WHITESPACE = /\s+/;

function split(str: string): string[] {
  return str.trim().split(WHITESPACE);
}

function unique(className: string, index: number, classes: string[]): boolean {
  return classes.lastIndexOf(className) === index;
}
