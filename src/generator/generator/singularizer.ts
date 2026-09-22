import { toPascalCase } from '../utils/case-converter';

const REGEXP_KEY = /^\/(.*)\/(.*)$/;

export type Singularizer = (word: string) => string;

export const normalizeTableIdentifier = (
  identifier: string,
  singularize: Singularizer,
) => {
  const singularIdentifier = toPascalCase(singularize(identifier));

  if (!singularIdentifier) {
    return identifier;
  }

  return /^\d/.test(singularIdentifier)
    ? `_${singularIdentifier}`
    : singularIdentifier;
};

const addSingularizationRules = (
  pluralize: typeof import('pluralize'),
  rules: Record<string, string> | [string, string][],
) => {
  const entries = Array.isArray(rules) ? rules : Object.entries(rules);

  for (const [key, replacement] of entries) {
    const regExpMatch = key.match(REGEXP_KEY);
    const rule = regExpMatch
      ? new RegExp(regExpMatch[1]!, regExpMatch[2])
      : key;
    pluralize.addSingularRule(rule, replacement);
  }
};

const importPluralize = () => {
  delete require.cache[require.resolve('pluralize')];

  return require('pluralize') as typeof import('pluralize');
};

export const createSingularizer = (
  rules?: Record<string, string> | [string, string][] | boolean,
) => {
  const pluralize = importPluralize();

  if (typeof rules === 'object') {
    addSingularizationRules(pluralize, rules);
  }

  return pluralize.singular;
};
