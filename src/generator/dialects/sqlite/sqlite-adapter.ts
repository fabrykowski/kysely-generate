import { Adapter } from '../../adapter';
import { IdentifierNode } from '../../ast/identifier-node';

export class SqliteAdapter extends Adapter {
  override readonly defaultScalar = new IdentifierNode('string');
  override readonly scalars = {
    any: new IdentifierNode('unknown'),
    bigint: new IdentifierNode('number'),
    blob: new IdentifierNode('Buffer'),
    bool: new IdentifierNode('number'),
    boolean: new IdentifierNode('number'),
    decimal: new IdentifierNode('number'),
    double: new IdentifierNode('number'),
    'double precision': new IdentifierNode('number'),
    float: new IdentifierNode('number'),
    int: new IdentifierNode('number'),
    int2: new IdentifierNode('number'),
    int8: new IdentifierNode('number'),
    integer: new IdentifierNode('number'),
    mediumint: new IdentifierNode('number'),
    numeric: new IdentifierNode('number'),
    real: new IdentifierNode('number'),
    smallint: new IdentifierNode('number'),
    text: new IdentifierNode('string'),
    tinyint: new IdentifierNode('number'),
    'unsigned big int': new IdentifierNode('number'),
  };
}
