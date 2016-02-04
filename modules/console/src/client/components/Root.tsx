import * as React from 'react';
import { connect } from 'react-redux';

const cloneDeep = require('lodash.clonedeep');
const ThemeManager = require('material-ui/lib/styles/theme-manager');
const LightRawTheme = require('material-ui/lib/styles/raw-themes/light-raw-theme');

const TITLE = 'TIAT Console Page';

const CustomRawTheme = cloneDeep(LightRawTheme);

interface RootProps extends React.Props<Root> {}

class Root extends React.Component<RootProps, {}> {
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  };

  getChildContext() {
    return {
      muiTheme: ThemeManager.getMuiTheme(CustomRawTheme),
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
