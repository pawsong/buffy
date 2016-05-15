import * as React from 'react';
import Avatar from 'material-ui/lib/avatar';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import IconButton from 'material-ui/lib/icon-button';
import MoreVertIcon from 'material-ui/lib/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Colors from 'material-ui/lib/styles/colors';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import * as classNames from 'classnames';

const styles = require('./EditMode.css');

import { connectSource } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import { Robot } from '../../types';

const messages = defineMessages({
  title: {
    id: 'worldeditor.panels.robot.title',
    description: 'World editor robot panel title',
    defaultMessage: 'Robots',
  },
});

const iconButtonElement = (
  <IconButton touch={true}>
    <MoreVertIcon color={Colors.grey400} />
  </IconButton>
);

const markForModifiedClass = classNames('material-icons', styles.markForModified);

interface RobotPanelProps extends React.Props<RobotPanel> {
  robots: { [index: string]: Robot };
  files: SourceFileDB;
  playerId: string;
  onPlayerChange: (robotId: string) => any;
  onRobotRemove: (robotId: string) => any;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.robot,
  title: messages.title,
})
class RobotPanel extends React.Component<RobotPanelProps, void> {
  static PANEL_ID: string;

  handleRobotRemove(robotId: string) {
    console.log(robotId);
  }

  render() {
    const listItems = Object.keys(this.props.robots).map(id => this.props.robots[id]).map(robot => {
      const recipe = this.props.files[robot.recipe];
      const design = this.props.files[recipe.state.design];

      const rightIconMenu = (
        <IconMenu iconButtonElement={iconButtonElement}>
          <MenuItem onTouchTap={() => this.props.onRobotRemove(robot.id)}>Delete</MenuItem>
        </IconMenu>
      );

      return (
        <ListItem
          key={robot.id}
          leftAvatar={<Avatar src={design.state.image.url} />}
          rightIconButton={rightIconMenu}
          primaryText={
            <span>
              {this.props.playerId === robot.id ? <i className={markForModifiedClass}>fiber_manual_record</i> : null}
              {robot.name || '(Untitled)'}
            </span>
          }
          secondaryText={recipe.name}
          onTouchTap={() => this.props.onPlayerChange(robot.id)}
        />
      );
    });

    return (
      <List>{listItems}</List>
    );
  }
}

export default RobotPanel;
