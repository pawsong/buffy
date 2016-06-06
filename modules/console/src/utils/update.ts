/**
 * Immutable update
 */
function update<T extends V, V>(value: T, spec: V): T {
  return Object.assign({}, value, spec);
}

export default update;
