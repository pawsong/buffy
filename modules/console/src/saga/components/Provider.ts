import * as React from 'react';

interface ProviderProps extends React.Props<Provider> {
  middleware: any;
}

export default class Provider extends React.Component<ProviderProps, {}> {
  middleware: any;

  static childContextTypes = {
    middleware: React.PropTypes.func.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.middleware = props.middleware;
  }

  getChildContext() {
    return { middleware: this.middleware };
  }

  render() {
    const { children } = this.props;
    return React.Children.only(children);
  }
}
