import * as React from 'react';
import { connect } from 'react-redux';
import { Styles } from 'material-ui';
import * as _ from 'lodash';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

const TITLE = 'TIAT Console Page';

const CustomRawTheme = _.cloneDeep(LightRawTheme);

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
