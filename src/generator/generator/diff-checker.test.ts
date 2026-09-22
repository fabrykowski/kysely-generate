import { strictEqual } from 'node:assert';
import { DiffChecker } from './diff-checker';
import { test } from 'vitest';

test(DiffChecker.name, () => {
  strictEqual(
    new DiffChecker().diff('Foo\nBar\nBaz', 'Foo\nBar\nBaz'),
    undefined,
  );
  strictEqual(
    new DiffChecker().diff('Foo\nBar\nBaz', 'Foo\nQux\nBaz'),
    ' Foo\n-Bar\n+Qux\n Baz\n',
  );
});

test('DiffChecker prefixes every line, including blank context lines', () => {
  strictEqual(
    new DiffChecker().diff(
      'Foo\n\nBar\nBaz\nEnd',
      'Foo\n\nQux\nQuux\nEnd',
    ),
    ' Foo\n \n-Bar\n-Baz\n+Qux\n+Quux\n End\n',
  );
});

test('DiffChecker preserves internal line endings and trims file boundaries', () => {
  const diffChecker = new DiffChecker();

  strictEqual(
    diffChecker.diff('\n  Foo\r\nBar  \r\n', 'Foo\r\nBar'),
    undefined,
  );
  strictEqual(
    diffChecker.diff('Foo\r\nBar\r\nBaz', 'Foo\r\nQux\r\nBaz'),
    ' Foo\r\n-Bar\r\n+Qux\r\n Baz\n',
  );
});
