import * as React from 'react';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import Panel from '../../Panel';
import { FileType, SourceFileDB } from '../../Studio/types';

const PANEL_ID = 'recipe';

interface RecipePanelProps extends React.Props<RecipePanel> {
  files: SourceFileDB;
}

class RecipePanel extends React.Component<RecipePanelProps, void> {
  static PANEL_ID: string;

  render() {
    const recipeFiles = Object.keys(this.props.files)
      .map(key => this.props.files[key])
      .filter(file => file.type === FileType.ROBOT)
      .map(file => {
        const designFile = this.props.files[file.state.design];

        return {
          id: file.id,
          name: file.name,
          thumbnailUrl: designFile.state.image.url,
        };
      })

    const listItems = recipeFiles.map(file => (
      <ListItem
        key={file.id}
        primaryText={
          <div>
            <img src={file.thumbnailUrl} />
            <span>{file.name}</span>
          </div>
        }
      />
    ));

    return (
      <Panel
        panelId={PANEL_ID}
        title={'Recipes'}
      >
        <List>
          {listItems}
        </List>
      </Panel>
    );
  }
}

RecipePanel.PANEL_ID = PANEL_ID;

export default RecipePanel;
