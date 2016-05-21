import { Differ, Schema } from '@pasta/helper/lib/diff';
const shallowEqual = require('fbjs/lib/shallowEqual');

class SimpleComponent<T /* UpdateParams */, U /* Props */> {
  protected differ: Differ<U>;
  props: U;

  constructor() {
    const schema = this.getPropsSchema();
    if (schema) this.differ = new Differ<U>(schema);
  }

  getPropsSchema(): Schema { return null; }

  updateProps(updateParams: T): void {
    const prevProps = this.props;
    this.props = this.mapProps(updateParams);

    if (this.differ) {
      const diff = this.differ.diff(prevProps, this.props);
      if (diff) {
        this.render(diff);
        this.componentDidUpdate(prevProps);
      }
    } else {
      if (!shallowEqual(prevProps, this.props)) {
        this.componentDidUpdate(prevProps);
      }
    }
  }

  mapProps(updateParams: T): U { return null; }

  render(diff: U) {}

  componentDidUpdate(prevProps: U) {}

  start(updateParams: T) {
    this.props = this.mapProps(updateParams);
    this.onStart();
    this.render(this.props);
  }

  onStart() {}

  stop() {
    this.onStop();
  }

  onStop() {}
}

export default SimpleComponent;
