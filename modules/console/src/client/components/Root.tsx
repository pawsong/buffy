import * as React from 'react';
import { connect } from 'react-redux';

import theme from '../theme';

interface RootProps extends React.Props<Root> {}

class Root extends React.Component<RootProps, {}> {
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };

  getChildContext() {
    return {
      muiTheme: theme,
    };
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}

export default Root;
