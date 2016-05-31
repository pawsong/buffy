import * as React from 'react';
import FlatButton from 'material-ui/lib/flat-button';
import Colors from 'material-ui/lib/styles/colors';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import Paper from 'material-ui/lib/paper';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import ClickAwayListener from '../../../components/ClickAwayListener';
import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';

import { getFileTypeAvatar } from '../../../components/Studio/utils';
import { FileType } from '../../../components/Studio/types';

import CodeEditor, { CodeEditorState } from '../../../components/CodeEditor';
import ModelEditor, { ModelEditorState } from '../../../components/ModelEditor';
import RecipeEditor, { RecipeEditorState } from '../../../components/RecipeEditor';

import generateObjectId from '../../../utils/generateObjectId';

const messages = defineMessages({
  newFile: {
    id: 'new.file',
    description: 'New file',
    defaultMessage: 'New file',
  },
});

const styles = {
  button: {
    color: Colors.white,
    // marginLeft: 25,
    // marginRight: 25,
  },
};

import { NewFileSpec } from '../types';

interface ProjectStudioNavbarProps extends React.Props<ProjectStudioNavbar> {
  vrModeAvaiable: boolean;
  user: User;
  location: any;
  onLogout: () => any;
  onNewFile: (specs: NewFileSpec[]) => any;
  onCreateNewRobotFile: () => any;
  onSave: () => any;
  onVrModeRequest: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

interface ProjectStudioNavbarState {
  newFileMenuOpen?: boolean;
}

@injectIntl
class ProjectStudioNavbar extends React.Component<ProjectStudioNavbarProps, ProjectStudioNavbarState> {
  constructor(props) {
    super(props);
    this.state = {
      newFileMenuOpen: false,
    };
  }

  handleNewFileButtonClick() {
    this.setState({ newFileMenuOpen: !this.state.newFileMenuOpen });
  }

  handleClickAway() {
    this.setState({ newFileMenuOpen: false });
  }

  handleNewFileMenuItemClick(type: FileType) {
    this.setState({ newFileMenuOpen: false });

    if (type === FileType.ROBOT) {
      this.props.onCreateNewRobotFile();
      return;
    }

    const fileId = generateObjectId();

    let data;
    let extraData;
    switch(type) {
      case FileType.CODE: {
        data = CodeEditor.createState();
        break;
      }
      case FileType.MODEL: {
        const modelData = ModelEditor.createFileState();
        data = modelData;
        extraData = ModelEditor.createExtraData(modelData.present.data.size);
        break;
      }
      default: {
        return;
      }
    }

    this.props.onNewFile([{
      id: fileId,
      type: type,
      modified: false,
      data,
      extraData,
    }]);
  }

  renderNewFileMenu() {
    if (!this.state.newFileMenuOpen) return null;

    const items = [FileType.MODEL, FileType.CODE, FileType.ROBOT].map(type => {
      return (
        <ListItem
          key={type}
          primaryText={FileType[type]}
          leftAvatar={getFileTypeAvatar(type)}
          onTouchTap={() => this.handleNewFileMenuItemClick(type)}
        />
      );
    });

    return (
      <Paper zDepth={3} style={{ position: 'absolute' }}>
        <List>
          {items}
        </List>
      </Paper>
    );
  }

  renderLeftToolbarGroup() {
    const newFileMenu = this.renderNewFileMenu();

    return (
      <ToolbarGroup float="left" style={{ marginLeft: 25, marginTop: 10 }}>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <ClickAwayListener onClickAway={() => this.handleClickAway()}>
            <FlatButton
              label={this.props.intl.formatMessage(messages.newFile)}
              style={styles.button}
              onTouchTap={() => this.handleNewFileButtonClick()}
              backgroundColor={this.state.newFileMenuOpen ? Colors.cyan700 : Colors.cyan500}
              hoverColor={Colors.cyan700}
            />
            {newFileMenu}
          </ClickAwayListener>
        </div>
        <div style={{ display: 'inline-block' }}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.save)}
            style={styles.button}
            onTouchTap={() => this.props.onSave()}
            hoverColor={Colors.cyan700}
          />
        </div>
        {this.props.vrModeAvaiable ? <FlatButton label={this.props.intl.formatMessage(Messages.vrMode)}
                    style={styles.button}
                    onTouchTap={() => this.props.onVrModeRequest()}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        /> : null}
      </ToolbarGroup>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar location={this.props.location} width="100%"
                       leftToolbarGroup={this.renderLeftToolbarGroup()}
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar location={this.props.location} width="100%"
                      leftToolbarGroup={this.renderLeftToolbarGroup()}
                      user={this.props.user}
                      onLogout={this.props.onLogout}
      />
    );
  }

  render() {
    return this.props.user ? this.renderLoggedInNavbar() : this.renderAnonymousNavbar();
  }
}

export default ProjectStudioNavbar;
