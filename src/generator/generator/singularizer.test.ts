import { describe, expect, test } from 'vitest';
import { createSingularizer } from './singularizer';

describe(createSingularizer.name, () => {
  test('isolates custom rules when package metadata is cached', () => {
    const original = createSingularizer();
    require('pluralize/package.json');

    const custom = createSingularizer({ users: 'person' });
    const defaults = createSingularizer();

    expect(custom('users')).toBe('person');
    expect(defaults('users')).toBe('user');
    expect(original('users')).toBe('user');
  });

  test('rules array', () => {
    const singularize = createSingularizer([
      ['/^(.*?)s?$/', '$1_model'],
      ['/(bacch)(?:us|i)$/i', '$1us'],
      ['beeves', 'beef'],
    ]);

    expect(singularize('bacchus')).toStrictEqual('bacchus');
    expect(singularize('bacchi')).toStrictEqual('bacchus');
    expect(singularize('beef')).toStrictEqual('beef_model');
    expect(singularize('beeves')).toStrictEqual('beef');
    expect(singularize('users')).toStrictEqual('user_model');
  });

  test('rules object', () => {
    const singularize = createSingularizer({
      '/^(.*?)s?$/': '$1_model',
      '/(bacch)(?:us|i)$/i': '$1us',
      beeves: 'beef',
    });

    expect(singularize('bacchus')).toStrictEqual('bacchus');
    expect(singularize('bacchi')).toStrictEqual('bacchus');
    expect(singularize('beef')).toStrictEqual('beef_model');
    expect(singularize('beeves')).toStrictEqual('beef');
    expect(singularize('users')).toStrictEqual('user_model');
  });
});
