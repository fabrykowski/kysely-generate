import { PostgresJSIntrospectorDialect } from '../../../introspector/dialects/postgres-js/postgres-js-dialect';
import type { GeneratorDialect } from '../../dialect';
import type { PostgresDialectOptions } from '../postgres/postgres-dialect';
import { PostgresJSAdapter } from './postgres-js-adapter';

export type PostgresJSDialectOptions = PostgresDialectOptions;

export class PostgresJSDialect
  extends PostgresJSIntrospectorDialect
  implements GeneratorDialect
{
  readonly adapter: PostgresJSAdapter;

  constructor(options?: PostgresJSDialectOptions) {
    super({
      dateParser: options?.dateParser,
      defaultSchemas: options?.defaultSchemas,
      domains: options?.domains,
      numericParser: options?.numericParser,
      partitions: options?.partitions,
    });

    this.adapter = new PostgresJSAdapter({
      dateParser: this.options.dateParser,
      numericParser: this.options.numericParser,
    });
  }
}
