import * as React from 'react';
import StateLayer from '@pasta/core/lib/StateLayer';

export interface ProviderProps extends React.Props<Provider> {
  stateLayer: any;
}

export class Provider extends React.Component<ProviderProps, {}> {
  stateLayer: StateLayer;

  static childContextTypes = {
    stateLayer: React.PropTypes.object.isRequired,
  }

  getChildContext() {
    return { stateLayer: this.stateLayer };
  }

  constructor(props, context) {
    super(props, context);
    this.stateLayer = props.stateLayer;
  }

  render() {
    const { children } = this.props;
    return React.Children.only(children);
  }
}

export default Provider;
