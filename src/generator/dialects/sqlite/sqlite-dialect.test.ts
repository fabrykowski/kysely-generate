import { Kysely, sql } from 'kysely';
import { describe, expect, it } from 'vitest';
import { generate } from '../../generator/generate';
import { SqliteDialect } from './sqlite-dialect';

describe(SqliteDialect.name, () => {
  it('generates numeric types for SQLite numeric type aliases', async () => {
    const dialect = new SqliteDialect();
    const db = new Kysely<any>({
      dialect: await dialect.createKyselyDialect({
        connectionString: ':memory:',
      }),
    });

    try {
      const types = [
        'BIGINT',
        'BOOL',
        'DECIMAL',
        'DOUBLE',
        'DOUBLE PRECISION',
        'FLOAT',
        'INT',
        'INT2',
        'INT8',
        'MEDIUMINT',
        'SMALLINT',
        'TINYINT',
        'UNSIGNED BIG INT',
      ];
      let table = db.schema.createTable('numbers');
      const values: Record<string, number> = {};

      for (const [index, type] of types.entries()) {
        const column = `value${index}`;
        table = table.addColumn(column, sql.raw(type), (column) =>
          column.notNull(),
        );
        values[column] = 42;
      }

      await table.execute();
      await db.insertInto('numbers').values(values).execute();
      const row = await db
        .selectFrom('numbers')
        .selectAll()
        .executeTakeFirstOrThrow();
      expect(row).toEqual(values);

      const output = await generate({ db, dialect, outFile: null });

      for (const column of Object.keys(values)) {
        expect(output).toContain(`${column}: number;`);
      }
    } finally {
      await db.destroy();
    }
  });
});
