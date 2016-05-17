import * as React from 'react';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import Colors from 'material-ui/lib/styles/colors';
const { connect, PromiseState } = require('react-refetch');

import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';

import GridList from 'material-ui/lib/grid-list/grid-list';
const GridTile = require('material-ui/lib/grid-list/grid-tile');

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./AddRobotDialog.css');

import {
  FileType,
  SourceFileDB,
} from '../../../../Studio/types';
import {
  RecipeEditorState,
} from '../../../../RecipeEditor';
import {
  ModelEditorState,
} from '../../../../ModelEditor';

import { receiveThumbnails, ReceiveThumbnailsProps } from '../../../../../canvas/ModelManager';

interface AddRobotDialogProps extends React.Props<AddRobotDialog>, ReceiveThumbnailsProps {
  open: boolean;
  onRequestClose: () => any;
  onSubmit: (robotId: string) => any;
  files: SourceFileDB;
}

enum DataSource {
  PROJECT,
  MY_DRIVE,
  PUBLIC_REPO,
}

interface AddRobotDialogState {
  dataSource?: DataSource;
  robotId?: string;
}

@withStyles(styles)
@receiveThumbnails()
class AddRobotDialog extends React.Component<AddRobotDialogProps, AddRobotDialogState> {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: DataSource.PROJECT,
      robotId: '',
    };
  }

  componentWillReceiveProps(nextProps: AddRobotDialogProps) {
    if (!this.props.open && nextProps.open) {
      this.setState({
        dataSource: DataSource.PROJECT,
        robotId: '',
      });
    }
  }

  renderBody() {
    const tiles = Object.keys(this.props.files).map(key => this.props.files[key])
      .filter(file => file.type === FileType.ROBOT)
      .map(file => {
        const recipeFile = this.props.files[file.id];
        const recipe: RecipeEditorState = recipeFile.state;

        const thumbnail = this.props.modelThumbnails.get(recipe.design);

        const onTouchTap = () => this.setState({ robotId: file.id });

        let style: any = { cursor: 'pointer' };
        if (this.state.robotId === file.id) {
          style.border = `6px solid ${Colors.cyan500}`;
        } else {
          style.margin = '6px';
        }

        return (
          <GridTile
            key={file.id}
            title={file.name}
            style={style}
            onTouchTap={onTouchTap}
          >
            <img src={thumbnail} />
          </GridTile>
        )
      });

    return (
      <GridList
        cellHeight={150}
        cols={4}
        style={{ margin: 10 }}
        padding={10}
      >
        {tiles}
      </GridList>
    );
  }

  handleDateSourceChange(dataSource: DataSource) {
    this.setState({
      dataSource,
      robotId: '',
    })
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.props.onRequestClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        disabled={!this.state.robotId}
        onTouchTap={() => this.props.onSubmit(this.state.robotId)}
      />,
    ];

    const body = this.renderBody();

    return (
      <Dialog
        title={
          <div>
            <div className={styles.title}>Make a New Recipe</div>
            <Tabs
              tabItemContainerStyle={{ backgroundColor: 'white', marginTop: 24 }}
              value={this.state.dataSource}
              onChange={(v) => this.handleDateSourceChange(v)}
            >
              <Tab label="files in project" className={styles.tab}  value={DataSource.PROJECT}/>
              <Tab label="my design files" className={styles.tab}  value={DataSource.MY_DRIVE} />
              <Tab label="search" className={styles.tab}  value={DataSource.PUBLIC_REPO} />
            </Tabs>
          </div>
        }
        actions={actions}
        modal={false}
        onRequestClose={() => this.props.onRequestClose()}
        open={this.props.open}
        autoScrollBodyContent={true}
      >
        {body}
      </Dialog>
    );
  }
}

export default AddRobotDialog;
