import { describe, test, expect, jest } from '@jest/globals';
import { create } from '../';
import * as helpers from '../helpers';

describe(`background-size utilities`, () => {
  test(`bg-cover -> backgroundSize: cover`, () => {
    const tw = create();
    expect(tw.style(`bg-cover`)).toEqual({ backgroundSize: `cover` });
  });

  test(`bg-contain -> backgroundSize: contain`, () => {
    const tw = create();
    expect(tw.style(`bg-contain`)).toEqual({ backgroundSize: `contain` });
  });

  test(`bg-cover does not emit "unknown or invalid utility" warning`, () => {
    const warnSpy = jest.spyOn(helpers, `warn`);
    const tw = create();
    tw`bg-cover`;
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test(`bg-contain does not emit "unknown or invalid utility" warning`, () => {
    const warnSpy = jest.spyOn(helpers, `warn`);
    const tw = create();
    tw`bg-contain`;
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
