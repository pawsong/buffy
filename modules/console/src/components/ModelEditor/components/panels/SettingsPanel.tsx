import React, {PropTypes} from 'react';

import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import Subheader from 'material-ui/Subheader';
import Toggle from 'material-ui/Toggle';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { connectSource } from '../../../Panel';

import {
  PanelTypes,
  Panels,
} from '../../panel';

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.settings.title',
    description: 'Voxel editor settings panel title',
    defaultMessage: 'Settings',
  },
});

/*
 * Container
 */

interface SettingsPanelProps extends React.Props<SettingsPanel> {
  showWireframe: boolean;
  onChangeShowWireframe: (enabled: boolean) => any;
  perspective: boolean;
  onSetPerspective: (enabled: boolean) => any;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.settings,
  title: messages.title,
})
class SettingsPanel extends React.Component<SettingsPanelProps, {}> {
  handleToggleShowWireframe = (e: any, value) => this.props.onChangeShowWireframe(value);

  handleTogglePerspective = (e: any, value) => this.props.onSetPerspective(value);

  render() {
    return (
      <div>
        <List>
          <Subheader>General</Subheader>
          <ListItem primaryText="Show wireframe" rightToggle={
            <Toggle
              toggled={this.props.showWireframe}
              onToggle={this.handleToggleShowWireframe}
            />
          } />
        </List>
        <List>
          <Subheader>Camera</Subheader>
          <ListItem primaryText="Perspective" rightToggle={
            <Toggle
              toggled={this.props.perspective}
              onToggle={this.handleTogglePerspective}
            />
          } />
        </List>
      </div>
    );
  };
};

export default SettingsPanel;
