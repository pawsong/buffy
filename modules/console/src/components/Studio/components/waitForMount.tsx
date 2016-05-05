import * as React from 'react';
const hoistStatics = require('hoist-non-react-statics');

function waitForMount(WrappedComponent) {
  class Container extends React.Component<{}, { mount: boolean }> {
    constructor(props) {
      super(props);
      this.state = { mount: false };
    }

    componentDidMount() {
      this.setState({ mount: true });
    }

    componentWillUnmount() {
      this.setState({ mount: false });
    }

    render() {
      if (!this.state.mount) return null;

      return (
        <WrappedComponent {...this.props} />
      );
    }
  }

  return hoistStatics(Container, WrappedComponent)
}

export default waitForMount;
