import * as React from 'react';
import Avatar from 'material-ui/lib/avatar';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import * as classNames from 'classnames';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./RobotPanel.css');

import { connectSource } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { RobotInstance, SourceFileDB } from '../../../Studio/types';

const messages = defineMessages({
  title: {
    id: 'worldeditor.panels.robot.title',
    description: 'World editor robot panel title',
    defaultMessage: 'Robots',
  },
});

const markForModifiedClass = classNames('material-icons', styles.markForModified);

interface RobotPanelProps extends React.Props<RobotPanel> {
  robots: RobotInstance[];
  files: SourceFileDB;
  playerId: string;
  onPlayerChange: (robotId: string) => any;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.robot,
  title: messages.title,
})
@withStyles(styles)
class RobotPanel extends React.Component<RobotPanelProps, void> {
  static PANEL_ID: string;

  render() {
    const listItems = this.props.robots.map(robot => {
      const recipe = this.props.files[robot.templateId];
      const design = this.props.files[recipe.state.design];

      return (
        <ListItem
          key={robot.id}
          leftAvatar={<Avatar src={design.state.image.url} />}
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
