import { describe, test, expect, jest } from '@jest/globals';
import type { Style } from '../types';
import { create } from '../';
import * as helpers from '../helpers';

describe(`resize-mode utilities`, () => {
  const tw = create();

  const cases: Array<[string, Style]> = [
    [`resize-mode-cover`, { resizeMode: `cover` }],
    [`resize-mode-contain`, { resizeMode: `contain` }],
    [`resize-mode-stretch`, { resizeMode: `stretch` }],
    [`resize-mode-repeat`, { resizeMode: `repeat` }],
    [`resize-mode-center`, { resizeMode: `center` }],
  ];

  test.each(cases)(`utility %s -> %s`, (utility, style) => {
    expect(tw.style(utility)).toEqual(style);
  });

  test.each(cases.map(([utility]) => [utility]))(
    `%s does not emit "unknown or invalid utility" warning`,
    (utility) => {
      const warnSpy = jest.spyOn(helpers, `warn`);
      const fresh = create();
      fresh.style(utility);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    },
  );
});
