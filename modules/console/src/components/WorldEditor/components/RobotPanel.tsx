import * as React from 'react';
import Avatar from 'material-ui/lib/avatar';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { connectSource } from '../../Panel';
import { PanelTypes, Panels } from '../panel';

import { RobotInstance, SourceFileDB } from '../../Studio/types';

const messages = defineMessages({
  title: {
    id: 'worldeditor.panels.robot.title',
    description: 'World editor robot panel title',
    defaultMessage: 'Robots',
  },
});

interface RobotPanelProps extends React.Props<RobotPanel> {
  robots: RobotInstance[];
  files: SourceFileDB;
  onPlayerChange: (robotId: string) => any;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.robot,
  title: messages.title,
})
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
          primaryText={robot.name}
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
