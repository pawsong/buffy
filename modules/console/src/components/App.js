import React from 'react';
import { connect } from 'react-redux';
import { HdTitle, HdMeta, HdLink } from '../hairdresser';
import { Styles } from 'material-ui';
import _ from 'lodash';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

const TITLE = 'TIAT Console Page';

const CustomRawTheme = _.cloneDeep(LightRawTheme);

class App extends React.Component {

  getChildContext() {
    return {
      muiTheme: ThemeManager.getMuiTheme(CustomRawTheme),
    };
  }

  render() {
    return (
      <div>
        <HdTitle>{TITLE}</HdTitle>
        <HdMeta selector={{
          name: 'twitter:title', property: 'og:title'
        }} attrs={{
          content: TITLE,
        }}/>
        <HdLink selector={{ rel: 'canonical' }} attrs={{
          href: 'http://localhost:9000',
        }}/>
        {this.props.children}
      </div>
    );
  }
}

App.childContextTypes = {
  muiTheme: React.PropTypes.object,
}

export default App;
