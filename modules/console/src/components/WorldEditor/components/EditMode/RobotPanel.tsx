import * as React from 'react';
import Avatar from 'material-ui/Avatar';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import AddCircleIcon from 'material-ui/svg-icons/content/add-circle';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import * as Colors from 'material-ui/styles/colors';
import RaisedButton from 'material-ui/RaisedButton';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import * as classNames from 'classnames';

const styles = require('./EditMode.css');

import { connectSource } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import { Robot } from '../../types';

import { receiveThumbnails, ReceiveThumbnailsProps } from '../../../../canvas/ModelManager';

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

interface RobotPanelProps extends React.Props<RobotPanel>, ReceiveThumbnailsProps {
  robots: { [index: string]: Robot };
  files: SourceFileDB;
  playerId: string;
  onPlayerChange: (robotId: string) => any;
  onRobotRemove: (robotId: string) => any;
  onAddRobotButtonClick: () => any;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.robot,
  title: messages.title,
})
@receiveThumbnails()
class RobotPanel extends React.Component<RobotPanelProps, void> {
  static PANEL_ID: string;

  render() {
    const listItems = Object.keys(this.props.robots).map(id => this.props.robots[id]).map(robot => {
      const recipe = this.props.files[robot.recipe];
      const thumbnail = this.props.modelThumbnails.get(recipe.state.design);

      const rightIconMenu = (
        <IconMenu iconButtonElement={iconButtonElement}>
          <MenuItem onTouchTap={() => this.props.onRobotRemove(robot.id)}>Delete</MenuItem>
        </IconMenu>
      );

      return (
        <ListItem
          key={robot.id}
          leftAvatar={<Avatar src={thumbnail} />}
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
      <div>
        <List>{listItems}</List>
        <RaisedButton
          onTouchTap={this.props.onAddRobotButtonClick}
          label="Add robot"
          fullWidth={true}
          secondary={true}
          icon={<AddCircleIcon />}
        />
      </div>
    );
  }
}

export default RobotPanel;
