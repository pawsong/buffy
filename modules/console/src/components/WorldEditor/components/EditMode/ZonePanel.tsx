import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import { connectSource } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
const messages = defineMessages({
  title: {
    id: 'worldeditor.panels.zone.title',
    description: 'World editor zone panel title',
    defaultMessage: 'Zones',
  },
});

const PANEL_ID = 'zone';
import { ZoneInstance, SourceFileDB } from '../../../Studio/types';

interface ZonePanelProps extends React.Props<ZonePanel> {
  zones: ZoneInstance[];
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.zone,
  title: messages.title,
})
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
      <List>
        {listItems}
      </List>
    );
  }
}

ZonePanel.PANEL_ID = PANEL_ID;

export default ZonePanel;
