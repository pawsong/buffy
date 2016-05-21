import {
  Differ,
  SchemaType,
} from '../lib/diff';

import { expect } from 'chai';

describe('diff', () => {
  it('should detect difference of primitive properties in fixed size object', () => {
    const differ = new Differ({
      type: SchemaType.OBJECT,
      properties: {
        id: {
          type: SchemaType.STRING,
        },
        name: {
          type: SchemaType.STRING,
        },
      },
    });

    expect(differ.diff(
      { id: '123' },
      { id: '123', name: '321' }
    )).to.deep.equal({ name: '321' });
  });

  it('should detect difference of properties in dynamic map', () => {
    const differ = new Differ({
      type: SchemaType.MAP,
      items: {
        type: SchemaType.STRING,
      },
    });

    expect(differ.diff(
      { id: '123' },
      { id: '123', name: '321' }
    )).to.deep.equal({ name: '321' });
  });

  it('should detect change in nested objects', () => {
    const differ = new Differ({
      type: SchemaType.MAP,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
          },
          name: {
            type: SchemaType.STRING,
          },
        },
      },
    });

    // Add
    expect(differ.diff(
      {
      },
      {
        a: { id: '123', name: '321' },
      }
    )).to.deep.equal({ a: { id: '123', name: '321' } });

    // Update
    expect(differ.diff(
      {
        a: { id: '123', name: '322' },
      },
      {
        a: { id: '123', name: '321' },
      }
    )).to.deep.equal({ a: { name: '321' } });

    // Remove
    expect(differ.diff(
      {
        a: { id: '123', name: '322' },
      },
      {
      }
    )).to.deep.equal({ a: undefined });
  });
});
