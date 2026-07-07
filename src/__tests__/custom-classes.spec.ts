import { describe, test, expect } from '@jest/globals';
import { create } from '../';

describe(`custom classes`, () => {
  test(`tw\`btn\` evaluates exactly as tw\`px-4 py-2\``, () => {
    const tw = create({}, undefined, { customClasses: { btn: `px-4 py-2` } });
    expect(tw`btn`).toEqual({
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 8,
      paddingBottom: 8,
    });
    // equivalent to writing the underlying utilities directly
    expect(tw`btn`).toEqual(tw`px-4 py-2`);
  });

  test(`the documented example: text -> font-noto text-lg`, () => {
    const tw = create(
      { theme: { extend: { fontFamily: { noto: `Noto Sans` } } } },
      undefined,
      { customClasses: { text: `font-noto text-lg` } },
    );
    expect(tw`text`).toMatchObject({ fontFamily: `Noto Sans`, fontSize: 18 });
  });

  test(`a custom class can override a built-in utility`, () => {
    const tw = create({}, undefined, { customClasses: { text: `pt-1` } });
    // bare `text` would normally resolve to a text color; the custom class wins
    expect(tw`text`).toEqual({ paddingTop: 4 });
  });

  test(`custom classes combine with, and can be overridden by, other utilities`, () => {
    const tw = create({}, undefined, { customClasses: { btn: `pt-1` } });
    expect(tw`btn bg-black`).toEqual({ paddingTop: 4, backgroundColor: `#000` });
    // a later utility overrides one produced by the expansion
    expect(tw`btn pt-2`).toEqual({ paddingTop: 8 });
    // ...and vice-versa
    expect(tw`pt-2 btn`).toEqual({ paddingTop: 4 });
  });

  test(`custom classes work through tw.style() inputs`, () => {
    const tw = create({}, undefined, { customClasses: { btn: `pt-1` } });
    expect(tw.style(`btn`)).toEqual({ paddingTop: 4 });
    expect(tw.style([`btn`, `mt-1`])).toEqual({ paddingTop: 4, marginTop: 4 });
    expect(tw.style({ btn: true })).toEqual({ paddingTop: 4 });
    expect(tw.style({ btn: false })).toEqual({});
    // user rn-style objects still merge on top
    expect(tw.style(`btn`, { opacity: 0.5 })).toEqual({ paddingTop: 4, opacity: 0.5 });
  });

  test(`custom class results are cached (identical reference)`, () => {
    const tw = create({}, undefined, { customClasses: { btn: `px-4 py-2` } });
    expect(tw`btn`).toBe(tw`btn`);
  });

  test(`without custom classes, normal parsing is untouched`, () => {
    const tw = create();
    expect(tw`pt-1`).toEqual({ paddingTop: 4 });
    expect(tw`text-lg`).toMatchObject({ fontSize: 18 });
  });
});
