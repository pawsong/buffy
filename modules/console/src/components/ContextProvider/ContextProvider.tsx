import * as React from 'react';
const withContext = require('recompose/withContext').default;

interface ContextProviderProps {
  hairdresser: any;
  insertCss: any;
}

class ContextProvider extends React.Component<ContextProviderProps, void> {
  static childContextTypes = {
    hairdresser: React.PropTypes.object.isRequired,
    insertCss: React.PropTypes.func.isRequired,
  };

  getChildContext() {
    return {
      hairdresser: this.props.hairdresser,
      insertCss: this.props.insertCss,
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

export default ContextProvider;
