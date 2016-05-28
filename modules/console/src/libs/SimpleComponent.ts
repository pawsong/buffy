import { Differ, Schema } from '@pasta/helper/lib/diff';
const shallowEqual = require('fbjs/lib/shallowEqual');

class SimpleComponent<P /* Props */, S /* State*/, T /* Tree */> {
  props: P;
  state: S;

  protected tree: T;

  private diff: (prev: T, next: T) => T;
  private updatingProps: boolean;

  constructor() {
    this.updatingProps = false;

    const schema = this.getTreeSchema();
    if (schema) {
      const differ = new Differ<T>(schema);
      this.diff = differ.diff.bind(differ);
    } else {
      this.diff = () => null;
    }
  }

  getTreeSchema(): Schema { return null; }

  /*
   * Lifecycle methods
   */
  componentWillReceiveProps(nextProps: P) {}
  componentDidUpdate(prevProps: P, prevState: S) {}

  /*
   * Change handlers
   */
  updateProps(nextProps: P): void {
    const prevProps = this.props;
    const prevState = this.state;

    // Component will receive props
    this.updatingProps = true;
    this.componentWillReceiveProps(nextProps);
    this.updatingProps = false;

    this.props = nextProps;

    // Assume component is pure.
    if (shallowEqual(prevProps, this.props) && shallowEqual(prevState, this.state)) {
      return;
    }

    this.processRendering();
    this.componentDidUpdate(prevProps, prevState);
  }

  setState(state: S) {
    const prevState = this.state;

    this.state = Object.assign({}, this.state, state);
    if (this.updatingProps) return;

    this.processRendering();
    this.componentDidUpdate(this.props, prevState);
  }

  /*
   * Methods for rendering
   */
  protected render(): T { return null; }
  protected patch(diff: T) {}

  private processRendering() {
    const prevTree = this.tree;
    this.tree = this.render();

    const diff = this.diff(prevTree, this.tree);
    if (diff) this.patch(diff);
  }

  /*
   * Mount-like things
   */
  start(props: P) {
    this.props = props;
    this.onStart();

    this.tree = this.render();
    this.patch(this.tree);
  }

  onStart() {}

  stop() {
    this.onStop();
  }

  onStop() {}
}

export default SimpleComponent;
