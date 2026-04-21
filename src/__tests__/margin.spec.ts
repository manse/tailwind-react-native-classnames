import { describe, test, expect } from '@jest/globals';
import { create } from '../';

describe(`margin`, () => {
  let tw = create({}, { windowDimensions: { width: 800, height: 600 } });
  beforeEach(() => {
    tw = create({}, { windowDimensions: { width: 800, height: 600 } });
  });

  const cases: Array<[string, Record<string, string | number>]> = [
    [
      `m-auto`,
      {
        marginTop: `auto`,
        marginBottom: `auto`,
        marginLeft: `auto`,
        marginRight: `auto`,
      },
    ],
    [`mt-1`, { marginTop: 4 }],
    [`mt-0.5`, { marginTop: 2 }],
    [`mt-0.25`, { marginTop: 1 }],
    [`mt-1.25`, { marginTop: 5 }],
    [`ml-0.5`, { marginLeft: 2 }],
    [`ml-0.25`, { marginLeft: 1 }],
    [`ml-1.25`, { marginLeft: 5 }],
    [`mt-auto`, { marginTop: `auto` }],
    [`mb-auto`, { marginBottom: `auto` }],
    [`ml-auto`, { marginLeft: `auto` }],
    [`mr-auto`, { marginRight: `auto` }],
    [`mx-auto`, { marginRight: `auto`, marginLeft: `auto` }],
    [`my-auto`, { marginTop: `auto`, marginBottom: `auto` }],
    [`mt-px`, { marginTop: 1 }],
    [`ml-[333px]`, { marginLeft: 333 }],
    [`-ml-1`, { marginLeft: -4 }],
    [`mb-[100vh]`, { marginBottom: 600 }],
    [`ml-[100vw]`, { marginLeft: 800 }],
    [`mr-[1vw]`, { marginRight: 8 }],
  ];

  test.each(cases)(`tw\`%s\` -> %s`, (utility, expected) => {
    expect(tw.style(utility)).toEqual(expected);
  });

  test(`margin w/extended theme`, () => {
    tw = create({
      theme: {
        extend: {
          spacing: {
            custom: `1000rem`,
          },
        },
      },
    });

    expect(tw`m-custom`).toEqual({
      marginTop: 16000,
      marginBottom: 16000,
      marginLeft: 16000,
      marginRight: 16000,
    });

    expect(tw`m-1`).toEqual({
      marginTop: 4,
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
    });

    expect(tw`m-0.5`).toEqual({
      marginTop: 2,
      marginBottom: 2,
      marginLeft: 2,
      marginRight: 2,
    });
  });

  test(`spacing DEFAULT value`, () => {
    tw = create({
      theme: {
        extend: {
          spacing: {
            DEFAULT: `1px`,
          },
        },
      },
    });

    // bare `p` should resolve to padding with DEFAULT value
    const expectedP = {
      paddingTop: 1,
      paddingRight: 1,
      paddingBottom: 1,
      paddingLeft: 1,
    };
    expect(tw`p`).toEqual(expectedP);
    expect(tw.style(`p`)).toEqual(expectedP);

    // bare `m` should resolve to margin with DEFAULT value
    const expectedM = {
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginRight: 1,
    };
    expect(tw`m`).toEqual(expectedM);
    expect(tw.style(`m`)).toEqual(expectedM);

    // directional variants should also work
    expect(tw`pt`).toEqual({ paddingTop: 1 });
    expect(tw`pb`).toEqual({ paddingBottom: 1 });
    expect(tw`pl`).toEqual({ paddingLeft: 1 });
    expect(tw`pr`).toEqual({ paddingRight: 1 });
    expect(tw`px`).toEqual({ paddingLeft: 1, paddingRight: 1 });
    expect(tw`py`).toEqual({ paddingTop: 1, paddingBottom: 1 });
    expect(tw`mt`).toEqual({ marginTop: 1 });
    expect(tw`mb`).toEqual({ marginBottom: 1 });
    expect(tw`ml`).toEqual({ marginLeft: 1 });
    expect(tw`mr`).toEqual({ marginRight: 1 });
    expect(tw`mx`).toEqual({ marginLeft: 1, marginRight: 1 });
    expect(tw`my`).toEqual({ marginTop: 1, marginBottom: 1 });

    // explicit values should still work
    expect(tw`m-1`).toEqual({
      marginTop: 4,
      marginBottom: 4,
      marginLeft: 4,
      marginRight: 4,
    });

    // multiple bare DEFAULT utilities in a single class string
    expect(tw`m p`).toEqual({
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginRight: 1,
      paddingTop: 1,
      paddingRight: 1,
      paddingBottom: 1,
      paddingLeft: 1,
    });

    expect(tw`mt mb pt pb`).toEqual({
      marginTop: 1,
      marginBottom: 1,
      paddingTop: 1,
      paddingBottom: 1,
    });

    expect(tw`mx py`).toEqual({
      marginLeft: 1,
      marginRight: 1,
      paddingTop: 1,
      paddingBottom: 1,
    });

    // mixed bare DEFAULT and explicit values
    expect(tw`p m-2`).toEqual({
      paddingTop: 1,
      paddingRight: 1,
      paddingBottom: 1,
      paddingLeft: 1,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
    });

    expect(tw`mt ml-4 pb pr-2`).toEqual({
      marginTop: 1,
      marginLeft: 16,
      paddingBottom: 1,
      paddingRight: 8,
    });
  });

  test(`spacing DEFAULT value does not match without config`, () => {
    tw = create();
    // bare `p` without DEFAULT in config should return empty
    expect(tw`p`).toEqual({});
    expect(tw`m`).toEqual({});
    expect(tw`pt`).toEqual({});
  });
});
