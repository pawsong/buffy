import * as React from 'react';
import { connect } from 'react-redux';
import { HdTitle, HdMeta, HdLink } from '../hairdresser';
import { Styles } from 'material-ui';
import * as _ from 'lodash';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

const TITLE = 'TIAT Console Page';

const CustomRawTheme = _.cloneDeep(LightRawTheme);

interface AppProps extends React.Props<App> {}

class App extends React.Component<AppProps, {}> {
  static childContextTypes: any;

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
