import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Avatar from 'material-ui/lib/avatar';
import AndroidIcon from 'material-ui/lib/svg-icons/action/android';
import LayersIcon from 'material-ui/lib/svg-icons/maps/layers';
import ActionInfo from 'material-ui/lib/svg-icons/action/info';
import Colors from 'material-ui/lib/styles/colors';
const update = require('react-addons-update');
import { WorldEditorState } from '../../WorldEditor';
import { Tabs, Tab } from '../../Tabs';

enum InstanceTab {
  ROBOT,
  ZONE,
};

import { RobotInstance, ZoneInstance } from '../types';

function getInstanceTabLabel(tabType: InstanceTab) {
  switch(tabType) {
    case InstanceTab.ROBOT: {
      return 'Robot';
    }
    case InstanceTab.ZONE: {
      return 'Zone';
    }
  }
}

function renderZoneInstanceList(zoneInstances: ZoneInstance[]) {
  return zoneInstances.map(inst => {
    return (
      <ListItem
        key={inst.id}
        leftAvatar={<Avatar icon={<LayersIcon />} backgroundColor={Colors.amber500} />}
        rightIcon={<ActionInfo />}
        primaryText={inst.name}
        secondaryText={`Size: ${inst.width} x ${inst.depth}`}
      />
    );
  });
}

interface InstanceBrowserProps extends React.Props<any> {
  gameState: WorldEditorState;
  selectPlayer: (objectId: string) => any;
  robotInstances: RobotInstance[];
  zoneInstances: ZoneInstance[];
}

interface InstanceBrowserState {
  tabs?: InstanceTab[];
  activeTab?: InstanceTab;
}

class InstanceBrowser extends React.Component<InstanceBrowserProps, InstanceBrowserState> {
  constructor(props) {
    super(props);
    this.state = {
      tabs: [
        InstanceTab.ROBOT,
        InstanceTab.ZONE,
      ],
      activeTab: InstanceTab.ROBOT,
    };
  }

  renderRobotInstanceList(robotInstances: RobotInstance[]) {
    return robotInstances.map(inst => {
      const rightIcon = inst.id === this.props.gameState.playerId
        ? <ActionInfo /> : null;

      return (
        <ListItem
          key={inst.id}
          onTouchTap={() => this.props.selectPlayer(inst.id)}
          leftAvatar={<Avatar icon={<AndroidIcon />} backgroundColor={Colors.blue500} />}
          rightIcon={rightIcon}
          primaryText={inst.name}
          secondaryText={`Map: ${inst.mapName}`}
        />
      );
    });
  }

  render() {
    const tabs = (
      <Tabs
        activeValue={this.state.activeTab}
        onTabClick={activeTab => this.setState({ activeTab })}
        onTabOrderChange={(dragIndex: number, hoverIndex: number) => {
          const dragId = this.state.tabs[dragIndex];
          this.setState(update(this.state, {
            tabs: {
              $splice: [
                [dragIndex, 1],
                [hoverIndex, 0, dragId],
              ],
            }
          }));
        }}
        closable={false}
      >
        {
          this.state.tabs.map(tabType => {
            return (
              <Tab
                key={tabType}
                value={tabType}
                label={getInstanceTabLabel(tabType)}
              />
            );
          })
        }
      </Tabs>
    );

    let listItems = null;
    switch(this.state.activeTab) {
      case InstanceTab.ROBOT: {
        listItems = this.renderRobotInstanceList(this.props.robotInstances);
        break;
      }
      case InstanceTab.ZONE: {
        listItems = renderZoneInstanceList(this.props.zoneInstances);
        break;
      }
    }

    return (
      <div>
        {tabs}
        <List>{listItems}</List>
      </div>
    );
  }
}

export default InstanceBrowser;
