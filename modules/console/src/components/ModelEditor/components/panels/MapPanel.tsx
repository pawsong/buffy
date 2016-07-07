import React, {PropTypes} from 'react';
import { findDOMNode } from 'react-dom';

import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import { Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle } from 'material-ui/Toolbar';

import Avatar from 'material-ui/Avatar';
import RaisedButton from 'material-ui/RaisedButton';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import {fade} from 'material-ui/utils/colorManipulator';

import { connectSource } from '../../../Panel';

import {
  activateMap,
} from '../../actions';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./MapPanel.css');

import {
  PanelTypes,
  Panels,
} from '../../panel';

import {
  FileState,
  DispatchAction,
} from '../../types';

import {
  MaterialMapType,
} from '../../../../types';

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.map.title',
    description: 'Voxel editor map panel title',
    defaultMessage: 'Map',
  },
});

/*
 * Container
 */

interface MapPanelProps extends React.Props<MapPanel> {
  activeMap: MaterialMapType;
  onActivateMap: (mapType: MaterialMapType) => any;
}

import IconButton from 'material-ui/IconButton';
import ActionHome from 'material-ui/svg-icons/action/home';

const inlineStyles = {
  smallIcon: {
    width: 18,
    height: 18,
  },
  mediumIcon: {
    width: 48,
    height: 48,
  },
  largeIcon: {
    width: 60,
    height: 60,
  },
  small: {
    width: 72,
    height: 72,
    padding: 16,
  },
  medium: {
    width: 96,
    height: 96,
    padding: 24,
  },
  large: {
    width: 120,
    height: 120,
    padding: 30,
  },
};

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.maps,
  title: messages.title,
})
@withStyles(styles)
class MapPanel extends React.Component<MapPanelProps, {}> {
  static contextTypes = {
    muiTheme: PropTypes.object.isRequired,
  };

  private hoverColor: string;

  constructor(props, context) {
    super(props, context);

    const {muiTheme} = context;
    const textColor = muiTheme.baseTheme.palette.textColor;
    this.hoverColor = fade(textColor, 0.1);
  }

  render() {
    return (
      <div>
        <div className={styles.toolbar}>
          <IconButton
            tooltip="Select None"
            iconClassName="material-icons"
            onTouchTap={() => this.props.onActivateMap(MaterialMapType.DEFAULT)}
          >
            layers_clear
          </IconButton>
          <IconButton
            tooltip="Select All"
            iconClassName="material-icons"
            onTouchTap={() => this.props.onActivateMap(MaterialMapType.ALL)}
          >
            layers
          </IconButton>
        </div>
        <List>
          <ListItem
            primaryText="Type Map"
            leftAvatar={
              <Avatar
              >
                T
              </Avatar>
            }
            onTouchTap={() => this.props.onActivateMap(MaterialMapType.TROVE_TYPE)}
            style={{
              backgroundColor: (
                   this.props.activeMap === MaterialMapType.ALL
                || this.props.activeMap === MaterialMapType.TROVE_TYPE
              ) ? this.hoverColor : null,
            }}
          />
          <ListItem
            primaryText="Alpha Map"
            leftAvatar={
              <Avatar
              >
                A
              </Avatar>
            }
            onTouchTap={() => this.props.onActivateMap(MaterialMapType.TROVE_ALPHA)}
            style={{
              backgroundColor: (
                   this.props.activeMap === MaterialMapType.ALL
                || this.props.activeMap === MaterialMapType.TROVE_ALPHA
              ) ? this.hoverColor : null,
            }}
          />
          <ListItem
            primaryText="Specular Map"
            leftAvatar={
              <Avatar
              >
                S
              </Avatar>
            }
            onTouchTap={() => this.props.onActivateMap(MaterialMapType.TROVE_SPECULAR)}
            style={{
              backgroundColor: (
                   this.props.activeMap === MaterialMapType.ALL
                || this.props.activeMap === MaterialMapType.TROVE_SPECULAR
              ) ? this.hoverColor : null,
            }}
          />
        </List>
      </div>
    );
  };
};

export default MapPanel;
