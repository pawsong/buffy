const objectAssign = require('object-assign');

/**
 * Immutable update
 */
function update<T extends V, V>(value: T, spec: V): T {
  return objectAssign({}, value, spec);
}

export default update;
