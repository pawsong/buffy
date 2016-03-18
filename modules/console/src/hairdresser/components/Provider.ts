import { Component, Props, PropTypes, Children } from 'react';

interface ProviderProps extends Props<Provider> {
  hairdresser: Object;
}

class Provider extends Component<ProviderProps, {}> {

  static propTypes = {
    children: PropTypes.element,
    hairdresser: PropTypes.object.isRequired,
  };

  static childContextTypes = {
    hairdresser: PropTypes.object,
  };

  getChildContext() {
    return {
      hairdresser: this.props.hairdresser,
    };
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}

export default Provider;
