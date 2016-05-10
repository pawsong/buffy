import * as React from 'react';
import Avatar from 'material-ui/lib/avatar';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import Panel from '../../Panel';
import { RobotInstance, SourceFileDB } from '../../Studio/types';

const PANEL_ID = 'robot';

interface RobotPanelProps extends React.Props<RobotPanel> {
  robots: RobotInstance[];
  files: SourceFileDB;
  onPlayerChange: (robotId: string) => any;
}

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
      <Panel
        panelId={PANEL_ID}
        title={'Robots'}
      >
        <List>{listItems}</List>
      </Panel>
    );
  }
}

RobotPanel.PANEL_ID = PANEL_ID;

export default RobotPanel;
