import { defineSync } from '../base';

export default defineSync(({
  stateLayer,
  interpreter,
}) => text => {
  const msg = text ? text.toString() : '';
  return interpreter.createPrimitive(alert(msg));
});
