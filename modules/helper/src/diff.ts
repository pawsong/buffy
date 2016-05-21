// const invariant = require('fbjs/lib/invariant');
const invariant = (...args) => {}; //require('fbjs/lib/invariant');

// Diff immutable data
// Assume two input data has same schema

export enum SchemaType {
  ANY,
  NUMBER,
  STRING,
  BOOLEAN,
  OBJECT,
  MAP,
  ARRAY,
}

export interface SchemaTemplate<T> {
  type: SchemaType;
  items?: T;
  properties?: {
    [index: string]: T;
  }
  objectHash?: (item: Object) => string;
}

export interface Schema extends SchemaTemplate<Schema> {
}

export interface CompiledSchema extends SchemaTemplate<CompiledSchema> {
  propertiesList?: string[];
}

function compileSchema(schema: Schema): CompiledSchema {
  const ret: CompiledSchema = <CompiledSchema>{
    type: schema.type,
  };

  switch(schema.type) {
    case SchemaType.ARRAY: {
      invariant(schema.items, 'array requires items');
      ret.items = compileSchema(schema.items);

      if (schema.items.type === SchemaType.OBJECT) {
        invariant(schema.objectHash, 'array that contains object items requires objectHash');
        ret.objectHash = schema.objectHash;
      }
      break;
    }
    case SchemaType.MAP: {
      invariant(schema.items, 'map requires items');
      ret.items = compileSchema(schema.items);
      break;
    }
    case SchemaType.OBJECT: {
      invariant(schema.properties, 'object requires properties');
      ret.properties = {};
      ret.propertiesList = Object.keys(schema.properties);
      ret.propertiesList.forEach(prop => {
        ret.properties[prop] = compileSchema(schema.properties[prop]);
      });
      break;
    }
  }

  return ret;
}

function diff(schema: CompiledSchema, lhs, rhs): any {
  if (lhs === rhs) return;

  switch(schema.type) {
    case SchemaType.OBJECT: {
      return diffObject(schema, lhs, rhs);
    }
    case SchemaType.MAP: {
      return diffMap(schema, lhs, rhs);
    }
    case SchemaType.ARRAY: {
      return diffArray(schema, lhs, rhs);
    }
  }

  return rhs;
}

function diffObject(schema: CompiledSchema, lhs, rhs): any {
  const result = {};
  schema.propertiesList.forEach(item => {
    const ret = diff(schema.properties[item], lhs[item], rhs[item]);
    if (ret !== undefined) result[item] = ret;
  });

  if (Object.keys(result).length === 0) return;
  return result;
}

function diffMap(schema: CompiledSchema, lhs, rhs) {
  const result = {};

  Object.keys(lhs).forEach(lkey => {
    const lval = lhs[lkey];
    const rval = rhs[lkey];

    if (lval === rval) return;

    if (typeof rval === 'undefined') {
      result[lkey] = rval;
    } else {
      result[lkey] = diff(schema.items, lval, rval);
    }
  });

  Object.keys(rhs).forEach(rkey => {
    if (typeof lhs[rkey] === 'undefined') {
      result[rkey] = rhs[rkey];
    }
  });

  if (Object.keys(result).length === 0) return;
  return result;
}

function diffArray(schema: CompiledSchema, lhs, rhs) {
  return rhs;
}

class Differ<T> {
  schema: CompiledSchema;

  constructor(schema: Schema) {
    this.schema = compileSchema(schema);
  }

  diff(lhs: T, rhs: T): T {
    return diff(this.schema, lhs, rhs);
  }
}

export { Differ };
