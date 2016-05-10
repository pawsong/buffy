import * as React from 'react';
import Panel from '../../Panel';

const PANEL_ID = 'tools';

class ToolsPanel extends React.Component<{}, void> {
  static PANEL_ID: string;

  render() {
    return (
      <Panel
        panelId={PANEL_ID}
        title={'Tools'}
      >
        <div>Tools</div>
      </Panel>
    );
  }
}

ToolsPanel.PANEL_ID = PANEL_ID;

export default ToolsPanel;
