import type { Dialect as KyselyDialect } from 'kysely';
import type { CreateKyselyDialectOptions } from '../../dialect';
import { PostgresIntrospectorDialect } from '../postgres/postgres-dialect';

type PostgresJSType = {
  from: number[];
  parse: (value: string) => unknown;
  serialize: (value: unknown) => string;
  to: number;
};

// Structural subset of Postgres.js used by kysely-postgres-js. Keeping it local
// avoids exposing optional peer dependency types through our public declarations.
type PostgresJSResult = unknown[] &
  Iterable<unknown> & {
    command: string;
    count: number;
  };

type PostgresJSReservedClient = {
  release: () => void;
  unsafe: (
    query: string,
    parameters?: unknown[],
    queryOptions?: unknown,
  ) => Promise<PostgresJSResult> & {
    cursor?: (rows?: number) => AsyncIterable<unknown[]>;
  };
};

type PostgresJSClient = {
  end: () => Promise<void>;
  reserve: () => Promise<PostgresJSReservedClient>;
};

type PostgresFactory = (
  connectionString: string,
  options: {
    ssl: boolean | object;
    types: Record<string, PostgresJSType>;
  },
) => PostgresJSClient;

const DATE_OID = 1082;
const NUMERIC_OID = 1700;

const isOptionalPeerDependencyError = (error: unknown, packageName: string) => {
  const code =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined;

  return (
    (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') &&
    error instanceof Error &&
    error.message.includes(packageName)
  );
};

// Postgres.js has ESM runtime exports but `export =` types, so support both
// module shapes and fail early if a future version changes the callable export.
const getPostgresFactory = (postgresModule: unknown): PostgresFactory => {
  const candidate =
    postgresModule &&
    typeof postgresModule === 'object' &&
    'default' in postgresModule
      ? (postgresModule as { default?: unknown }).default
      : postgresModule;

  if (typeof candidate !== 'function') {
    throw new TypeError(
      "The optional peer dependency 'postgres' did not expose a callable default export.",
    );
  }

  return candidate as PostgresFactory;
};

export class PostgresJSIntrospectorDialect extends PostgresIntrospectorDialect {
  override async createKyselyDialect(
    options: CreateKyselyDialectOptions,
  ): Promise<KyselyDialect> {
    let postgres: PostgresFactory;
    let KyselyPostgresJSDialect: typeof import('kysely-postgres-js').PostgresJSDialect;

    try {
      postgres = getPostgresFactory(await import('postgres'));
    } catch (error) {
      if (isOptionalPeerDependencyError(error, 'postgres')) {
        throw new Error(
          "Postgres.js support requires the optional peer dependency 'postgres'. Install it to use the 'postgres-js' dialect.",
          { cause: error },
        );
      }

      throw error;
    }

    try {
      KyselyPostgresJSDialect = (
        await import('kysely-postgres-js')
      ).PostgresJSDialect;
    } catch (error) {
      if (isOptionalPeerDependencyError(error, 'kysely-postgres-js')) {
        throw new Error(
          "Postgres.js support requires the optional peer dependency 'kysely-postgres-js'. Install it to use the 'postgres-js' dialect.",
          { cause: error },
        );
      }

      throw error;
    }

    const types: Record<string, PostgresJSType> = {};

    if (this.options.dateParser === 'string') {
      // Postgres.js' built-in date parser covers date, timestamp, and timestamptz.
      // Override only date so `dateParser` doesn't accidentally change timestamps.
      types.date = {
        from: [DATE_OID],
        parse: (value) => value,
        serialize: (value) => String(value),
        to: DATE_OID,
      };
    }

    if (this.options.numericParser === 'number') {
      types.numeric = {
        from: [NUMERIC_OID],
        parse: Number,
        serialize: (value) => String(value),
        to: NUMERIC_OID,
      };
    } else if (this.options.numericParser === 'number-or-string') {
      types.numeric = {
        from: [NUMERIC_OID],
        parse: (value) => {
          const number = Number(value);
          return number > Number.MAX_SAFE_INTEGER ||
            number < Number.MIN_SAFE_INTEGER
            ? value
            : number;
        },
        serialize: (value) => String(value),
        to: NUMERIC_OID,
      };
    }

    return new KyselyPostgresJSDialect({
      postgres: postgres(options.connectionString, {
        ssl: options.ssl ? { rejectUnauthorized: false } : false,
        types,
      }),
    });
  }
}
