import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import { List, ListItem, MakeSelectable } from 'material-ui/List';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./SettingsHandler.css');

const emptyFunction = require('fbjs/lib/emptyFunction');

const rootClass = [
  'row',
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

const SelectableList = MakeSelectable(List);

interface HandlerProps extends RouteComponentProps<{}, {}> {
}

@injectIntl
@withStyles(styles)
class SettingsHandler extends React.Component<HandlerProps, void> {
  render() {
    return (
      <div className={rootClass} style={{ marginTop: 15 }}>
        <div className="col-md-3">
          <SelectableList
            value={this.props.location.pathname}
            onChange={emptyFunction}
          >
            <ListItem
              containerElement={<Link to="/settings/profile" />}
              value={'/settings/profile'}
              primaryText="Profile"

            />
            <ListItem
              containerElement={<Link to="/settings/account" />}
              value={'/settings/account'}
              primaryText="Account"
            />
          </SelectableList>
        </div>
        <div className="col-md-9" style={{ marginTop: 10 }}>{this.props.children}</div>
      </div>
    );
  }
}

export default SettingsHandler;
