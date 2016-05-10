import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Panel from '../../Panel';

const PANEL_ID = 'zone';
import { ZoneInstance, SourceFileDB } from '../../Studio/types';

interface ZonePanelProps extends React.Props<ZonePanel> {
  zones: ZoneInstance[];
}

class ZonePanel extends React.Component<ZonePanelProps, void> {
  static PANEL_ID: string;

  render() {
    const listItems = this.props.zones.map(zone => {
      return (
        <ListItem
          key={zone.id}
          primaryText={zone.name}
        />
      );
    });

    return (
      <Panel
        panelId={PANEL_ID}
        title={'Zones'}
      >
        <List>
          {listItems}
        </List>
      </Panel>
    );
  }
}

ZonePanel.PANEL_ID = PANEL_ID;

export default ZonePanel;
