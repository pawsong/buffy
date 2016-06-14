import * as React from 'react';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import Paper from 'material-ui/Paper';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import { ModelSupportFileType } from '../../../components/ModelEditor';
import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';
import ClickAwayListener from '../../../components/ClickAwayListener';

const messages = defineMessages({
  newFile: {
    id: 'modelstudio.navbar.new.file',
    description: 'New file',
    defaultMessage: 'New file',
  },
  download: {
    id: 'modelstudio.navbar.download',
    description: 'Download',
    defaultMessage: 'Download',
  },
  saveAll: {
    id: 'modelstudio.navbar.saveAll',
    description: 'Save All',
    defaultMessage: 'Save All',
  },
});

const styles = {
  button: {
    color: Colors.white,
    // marginLeft: 25,
    // marginRight: 25,
  },
};

interface ModelStudioNavbarProps extends React.Props<ModelStudioNavbar> {
  user: User;
  location: any;
  onNewFile: () => any;
  onRequestOpenFile: () => any;
  onSave: () => any;
  onSaveAll: () => any;
  onLogout: () => any;
  onDownload: (fileType: ModelSupportFileType) => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

enum SubmenuType {
  NONE,
  DOWNLOAD,
}

interface ModelStudioState {
  submenuType: SubmenuType;
}

@injectIntl
class ModelStudioNavbar extends React.Component<ModelStudioNavbarProps, ModelStudioState> {
  constructor(props) {
    super(props);
    this.state = {
      submenuType: SubmenuType.NONE,
    }
  }

  handleDownloadAsMagicaVoxelClick = () => {
    this.props.onDownload(ModelSupportFileType.MAGICA_VOXEL);
    this.handleDownloadMenuClose();
  }

  renderDownloadFileMenu() {
    if (this.state.submenuType !== SubmenuType.DOWNLOAD) return null;

    return (
      <Paper zDepth={3} style={{ position: 'absolute' }}>
        <List>
          <ListItem
            innerDivStyle={{ whiteSpace: 'nowrap' }}
            primaryText={'MagicaVoxel (.vox)'}
            onTouchTap={this.handleDownloadAsMagicaVoxelClick}
          />
        </List>
      </Paper>
    );
  }

  handleDownloadMenuToggle = () => {
    if (this.state.submenuType === SubmenuType.DOWNLOAD) {
      this.setState({ submenuType: SubmenuType.NONE });
    } else {
      this.setState({ submenuType: SubmenuType.DOWNLOAD });
    }
  }

  handleDownloadMenuClose = () => {
    if (this.state.submenuType === SubmenuType.DOWNLOAD) {
      this.setState({ submenuType: SubmenuType.NONE });
    }
  }

  renderLeftToolbarGroup() {
    return (
      <div style={{ marginLeft: 25, marginTop: 10 }}>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(messages.newFile)}
            style={styles.button}
            onTouchTap={this.props.onNewFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.open)}
            style={styles.button}
            onTouchTap={this.props.onRequestOpenFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.save)}
            style={styles.button}
            onTouchTap={this.props.onSave}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(messages.saveAll)}
            style={styles.button}
            onTouchTap={this.props.onSaveAll}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <ClickAwayListener onClickAway={this.handleDownloadMenuClose}>
            <FlatButton
              label={this.props.intl.formatMessage(messages.download)}
              style={styles.button}
              onTouchTap={this.handleDownloadMenuToggle}
              backgroundColor={this.state.submenuType === SubmenuType.DOWNLOAD ? Colors.cyan700 : Colors.cyan500}
              hoverColor={Colors.cyan700}
            />
            {this.renderDownloadFileMenu()}
          </ClickAwayListener>
        </div>
      </div>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar
        location={this.props.location}
        fullWidth={true}
        leftToolbarGroup={this.renderLeftToolbarGroup()}
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar
        location={this.props.location}
        fullWidth={true}
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

export default ModelStudioNavbar;
