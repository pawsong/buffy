import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';

export interface ProviderProps extends React.Props<Provider> {
  stateLayer: StateLayer;
}

export class Provider extends React.Component<ProviderProps, {}> {
  stateLayer: StateLayer;

  static childContextTypes = {
    stateLayer: React.PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.stateLayer = props.stateLayer;
  }

  getChildContext() {
    return { stateLayer: this.stateLayer };
  }

  render() {
    const { children } = this.props;
    return React.Children.only(children);
  }
}

export default Provider;
