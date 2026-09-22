import { exec, execFile } from 'node:child_process';
import {
  copyFile,
  cp,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, it } from 'vitest';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const TEST_TIMEOUT = 60_000;

describe('package', () => {
  beforeAll(async () => {
    await promisify(exec)('npm run build');
  }, TEST_TIMEOUT);

  it(
    'exposes the generated DB declaration to ESM and CommonJS consumers',
    async () => {
      const directory = await mkdtemp(join(ROOT, '.package-test-'));

      try {
        const consumerDirectory = join(directory, 'packages', 'app');
        const packageDirectory = join(
          directory,
          'node_modules',
          'kysely-generate',
        );
        await mkdir(packageDirectory, { recursive: true });
        await mkdir(consumerDirectory, { recursive: true });
        await copyFile(
          join(ROOT, 'package.json'),
          join(packageDirectory, 'package.json'),
        );
        await cp(join(ROOT, 'dist'), join(packageDirectory, 'dist'), {
          recursive: true,
        });
        await writeFile(
          join(consumerDirectory, 'package.json'),
          JSON.stringify({
            name: 'kysely-generate-consumer',
            private: true,
            type: 'module',
          }),
        );
        await execFileAsync(
          process.execPath,
          [
            '--input-type=module',
            '--eval',
            [
              "import { generate } from 'kysely-generate';",
              'await generate({',
              '  db: {},',
              '  dialect: { introspector: { introspect: async () => ({ tables: [] }) } },',
              '  serializer: {',
              "    serializeFile: () => 'import type { IPostgresInterval } from \\\"postgres-interval\\\";\\nexport interface DB { interval: IPostgresInterval; users: { id: number } }\\n',",
              '  },',
              '});',
            ].join('\n'),
          ],
          { cwd: consumerDirectory },
        );
        await writeFile(
          join(consumerDirectory, 'consumer.mts'),
          [
            "import { generate, type DB } from 'kysely-generate';",
            "const table: keyof DB = 'users';",
            'void generate;',
          ].join('\n'),
        );
        await writeFile(
          join(consumerDirectory, 'consumer.cts'),
          [
            "import { generate, type DB } from 'kysely-generate';",
            "const table: keyof DB = 'users';",
            'void generate;',
          ].join('\n'),
        );
        for (const extension of ['cts', 'mts']) {
          await writeFile(
            join(consumerDirectory, `db-consumer.${extension}`),
            [
              "import type { DB } from 'kysely-generate/db';",
              'const interval: DB[\'interval\'] | undefined = undefined;',
              'void interval;',
            ].join('\n'),
          );
        }
        await writeFile(
          join(consumerDirectory, 'tsconfig.json'),
          JSON.stringify({
            compilerOptions: {
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              noEmit: true,
              skipLibCheck: true,
              strict: true,
              target: 'ES2022',
            },
            include: ['consumer.mts', 'consumer.cts'],
          }),
        );
        await writeFile(
          join(consumerDirectory, 'tsconfig-db.json'),
          JSON.stringify({
            compilerOptions: {
              module: 'NodeNext',
              moduleResolution: 'NodeNext',
              noEmit: true,
              strict: true,
              target: 'ES2022',
              types: [],
            },
            include: ['db-consumer.mts', 'db-consumer.cts'],
          }),
        );

        for (const project of ['tsconfig.json', 'tsconfig-db.json']) {
          await execFileAsync(process.execPath, [
            join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'),
            '--project',
            join(consumerDirectory, project),
          ]);
        }
        await execFileAsync(
          process.execPath,
          ['--input-type=module', '--eval', "await import('kysely-generate')"],
          { cwd: consumerDirectory },
        );
        await execFileAsync(
          process.execPath,
          ['--eval', "require('kysely-generate')"],
          {
            cwd: consumerDirectory,
          },
        );
      } finally {
        await rm(directory, { force: true, recursive: true });
      }
    },
    TEST_TIMEOUT,
  );
});
