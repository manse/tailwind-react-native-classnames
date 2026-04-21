import { describe, test, expect } from '@jest/globals';
import { create } from '../';

jest.mock(`react-native`, () => ({
  Platform: {
    OS: `ios`,
    constants: {},
  },
}));

describe(`tw.prefixMatch()`, () => {
  let tw = create();
  beforeEach(() => (tw = create()));

  test(`unknown prefixes return false`, () => {
    expect(tw.prefixMatch(`foo`)).toBe(false);
    expect(tw.prefixMatch(`bar`)).toBe(false);
    expect(tw.prefixMatch(`baz`)).toBe(false);
  });

  test(`platform prefixes`, () => {
    tw = create({}, { platform: `ios` });
    expect(tw.prefixMatch(`ios`)).toBe(true);
    expect(tw.prefixMatch(`android`)).toBe(false);
    tw = create({}, { platform: `android` });
    expect(tw.prefixMatch(`ios`)).toBe(false);
    expect(tw.prefixMatch(`android`)).toBe(true);
    expect(tw`web:self-center`).toEqual({});
    expect(tw`not-valid-util`).toEqual({});
    tw = create({}, { platform: `web` });
    expect(tw.prefixMatch(`ios`)).toBe(false);
    expect(tw.prefixMatch(`android`)).toBe(false);
    expect(tw.prefixMatch(`web`)).toBe(true);
    expect(tw`web:self-center`).toEqual({ alignSelf: `center` });
  });

  test(`breakpoint prefixes`, () => {
    tw = create(
      { theme: { screens: { md: `600px`, lg: `800px`, xl: `1000px` } } },
      { windowDimensions: { width: 801, height: 600 } },
    );
    expect(tw.prefixMatch(`md`)).toBe(true);
    expect(tw.prefixMatch(`lg`)).toBe(true);
    expect(tw.prefixMatch(`xl`)).toBe(false);
    expect(tw.prefixMatch(`landscape`)).toBe(true);
    expect(tw.prefixMatch(`portrait`)).toBe(false);
  });

  test(`arbitrary breakpoint prefixes`, () => {
    tw = create({}, { windowDimensions: { width: 800, height: 600 } });
    expect(tw.prefixMatch(`min-h-[500px]`)).toBe(true);
    expect(tw.prefixMatch(`max-h-[500px]`)).toBe(false);
    expect(tw.prefixMatch(`min-w-[500px]`)).toBe(true);
    expect(tw.prefixMatch(`max-w-[500px]`)).toBe(false);
  });

  test(`multiple prefixes`, () => {
    tw = create({}, { platform: `ios`, windowDimensions: { width: 800, height: 600 } });
    expect(tw.prefixMatch(`min-w-[500px]`, `max-w-[600px]`)).toBe(false);
    expect(tw.prefixMatch(`min-w-[500px]`, `max-w-[900px]`)).toBe(true);
    expect(tw.prefixMatch(`min-w-[500px]`, `ios`)).toBe(true);
    expect(tw.prefixMatch(`min-w-[500px]`, `android`)).toBe(false);
  });

  test(`retina prefix`, () => {
    tw = create({}, { pixelDensity: 1 });
    expect(tw.prefixMatch(`retina`)).toBe(false);
    tw = create({}, { pixelDensity: 2 });
    expect(tw.prefixMatch(`retina`)).toBe(true);
  });
});
