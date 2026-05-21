import { IdentifierNode } from '../../ast/identifier-node';
import { PostgresAdapter } from '../postgres/postgres-adapter';
import type { PostgresDialectOptions } from '../postgres/postgres-dialect';

export type PostgresJSAdapterOptions = Pick<
  PostgresDialectOptions,
  'dateParser' | 'numericParser'
>;

export class PostgresJSAdapter extends PostgresAdapter {
  constructor(options?: PostgresJSAdapterOptions) {
    super(options);

    // Postgres.js leaves these unregistered PostgreSQL types as strings by default.
    this.scalars.circle = new IdentifierNode('string');
    this.scalars.interval = new IdentifierNode('string');
    this.scalars.point = new IdentifierNode('string');
  }
}
