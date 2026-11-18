import { describe, test, expect } from '@jest/globals';
import type { Style } from '../types';
import { create } from '../';

describe(`curve-* utilities`, () => {
  test(`set borderCurve explicitly`, () => {
    const tw = create();
    expect(tw`curve-continuous`).toEqual({ borderCurve: `continuous` });
    expect(tw`curve-circular`).toEqual({ borderCurve: `circular` });
    expect(tw`rounded-lg curve-continuous`).toEqual({
      borderRadius: 8,
      borderCurve: `continuous`,
    });
  });

  test(`rounded-* output is unchanged without autoBorderCurve`, () => {
    const tw = create();
    expect(tw`rounded-lg`).toEqual({ borderRadius: 8 });
    expect(tw`rounded-full`).toEqual({ borderRadius: 9999 });
  });
});

describe(`autoBorderCurve`, () => {
  const tw = create({}, undefined, { autoBorderCurve: true });

  const cases: Array<[string, Style]> = [
    [`rounded`, { borderRadius: 4, borderCurve: `continuous` }],
    [`rounded-lg`, { borderRadius: 8, borderCurve: `continuous` }],
    [`rounded-[30px]`, { borderRadius: 30, borderCurve: `continuous` }],
    [
      `rounded-t-lg`,
      { borderTopLeftRadius: 8, borderTopRightRadius: 8, borderCurve: `continuous` },
    ],
    [`rounded-full`, { borderRadius: 9999, borderCurve: `circular` }],
    [`rounded-[9999px]`, { borderRadius: 9999, borderCurve: `circular` }],
    [`rounded-tl-full`, { borderTopLeftRadius: 9999, borderCurve: `circular` }],

    // nothing to curve
    [`rounded-none`, { borderRadius: 0 }],
    [`bg-black`, { backgroundColor: `#000` }],

    // mixed corners: one `full` corner makes the whole view circular, in any order
    [
      `rounded-t-lg rounded-b-full`,
      {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 9999,
        borderBottomRightRadius: 9999,
        borderCurve: `circular`,
      },
    ],
    [
      `rounded-b-full rounded-t-lg`,
      {
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 9999,
        borderBottomRightRadius: 9999,
        borderCurve: `circular`,
      },
    ],

    // decided by the final radii, not by which classes appear
    [
      `rounded-full rounded-t-lg`,
      {
        borderRadius: 9999,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderCurve: `circular`,
      },
    ],
    [`rounded-lg rounded-full`, { borderRadius: 9999, borderCurve: `circular` }],
    [`rounded-full rounded-lg`, { borderRadius: 8, borderCurve: `continuous` }],

    // an explicit curve-* always wins, in any order
    [`rounded-full curve-continuous`, { borderRadius: 9999, borderCurve: `continuous` }],
    [`curve-continuous rounded-full`, { borderRadius: 9999, borderCurve: `continuous` }],
    [`rounded-lg curve-circular`, { borderRadius: 8, borderCurve: `circular` }],
  ];

  test.each(cases)(`tw\`%s\` -> %s`, (utility, expected) => {
    expect(tw.style(utility)).toEqual(expected);
  });

  test(`a borderCurve in a raw style object overrides the automatic one`, () => {
    expect(tw.style(`rounded-full`, { borderCurve: `continuous` })).toEqual({
      borderRadius: 9999,
      borderCurve: `continuous`,
    });
  });

  test(`prefixed utilities are taken into account`, () => {
    const options = { autoBorderCurve: true };
    const wide = create({}, { windowDimensions: { width: 800, height: 600 } }, options);
    const narrow = create({}, { windowDimensions: { width: 400, height: 600 } }, options);
    expect(wide`rounded-lg md:rounded-full`).toEqual({
      borderRadius: 9999,
      borderCurve: `circular`,
    });
    expect(narrow`rounded-lg md:rounded-full`).toEqual({
      borderRadius: 8,
      borderCurve: `continuous`,
    });

    const dark = create({}, { colorScheme: `dark` }, options);
    expect(dark`rounded-lg dark:curve-circular`).toEqual({
      borderRadius: 8,
      borderCurve: `circular`,
    });
  });

  test(`the full threshold follows a customized theme borderRadius.full`, () => {
    const custom = create(
      { theme: { extend: { borderRadius: { full: `1000px` } } } },
      undefined,
      { autoBorderCurve: true },
    );
    expect(custom`rounded-full`).toEqual({ borderRadius: 1000, borderCurve: `circular` });
    expect(custom`rounded-[999px]`).toEqual({
      borderRadius: 999,
      borderCurve: `continuous`,
    });
  });
});
