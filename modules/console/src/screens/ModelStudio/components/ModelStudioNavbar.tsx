import * as React from 'react';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import Divider from 'material-ui/Divider';
import Paper from 'material-ui/Paper';

import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import ArrowDropDown from 'material-ui/svg-icons/navigation/arrow-drop-down';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import { ModelSupportFileType } from '../../../components/ModelEditor';
import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';
import ClickAwayListener from '../../../components/ClickAwayListener';

import { ModelFile } from '../types';
import { ModelFileType } from '../../../types';

const styles = require('../ModelStudio.css');

const messages = defineMessages({
  newFile: {
    id: 'modelstudio.navbar.new.file',
    description: 'New file',
    defaultMessage: 'New file',
  },
  export: {
    id: 'modelstudio.navbar.export',
    description: 'Export',
    defaultMessage: 'Export',
  },
  advanced: {
    id: 'modelstudio.navbar.advanced',
    description: 'Advanced',
    defaultMessage: 'Advanced',
  },
  trove: {
    id: 'modelstudio.navbar.trove',
    description: 'Trove',
    defaultMessage: 'Trove',
  },
  saveAll: {
    id: 'modelstudio.navbar.saveAll',
    description: 'Save All',
    defaultMessage: 'Save All',
  },
});

const inlineStyles = {
  button: {
    color: Colors.white,
    // marginLeft: 25,
    // marginRight: 25,
  },
};

interface ModelStudioNavbarProps extends React.Props<ModelStudioNavbar> {
  file: ModelFile;
  user: User;
  location: any;
  onGetLink: () => any;
  onNewFile: () => any;
  onRequestOpenFile: () => any;
  onSave: () => any;
  onSaveAll: () => any;
  onLogout: () => any;
  onDownload: (fileType: ModelSupportFileType) => any;
  onEditAsTroveFile: () => any;
  onInstallBlueprint: () => any;
  onDownloadBlueprint: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

enum SubmenuType {
  NONE,
  EXPORT,
  ADVANCED,
  TROVE,
}

interface ModelStudioState {
  submenuType: SubmenuType;
}

@injectIntl
class ModelStudioNavbar extends React.Component<ModelStudioNavbarProps, ModelStudioState> {
  static contextTypes = {
    isMac: React.PropTypes.bool.isRequired,
  };

  isMac: boolean;

  constructor(props, context) {
    super(props, context);
    this.state = {
      submenuType: SubmenuType.NONE,
    }
    this.isMac = context.isMac;
  }

  /* Export Menu */

  renderExportMenu() {
    if (this.state.submenuType !== SubmenuType.EXPORT) return null;

    return (
      <Paper className={styles.menuList}>
        <Menu desktop={true}>
          <MenuItem
            className={styles.menuItem}
            primaryText={'Get a Link (URL)'}
            onTouchTap={this.handleGetLink}
            disabled={!this.props.file}
          />
          <Divider />
          <MenuItem
            className={styles.menuItem}
            primaryText={'MagicaVoxel (.vox)'}
            onTouchTap={this.handleExportAsMagicaVoxelClick}
            disabled={!this.props.file}
          />
          <MenuItem
            className={styles.menuItem}
            primaryText={'Qubicle (.qb)'}
            onTouchTap={this.handleExportAsQubicleClick}
            disabled={!this.props.file}
          />
          <MenuItem
            className={styles.menuItem}
            primaryText={'Mesh (.msgpack)'}
            onTouchTap={this.handleExportAsMeshClick}
            disabled={!this.props.file}
          />
        </Menu>
      </Paper>
    );
  }

  closeExportMenu() {
    if (this.state.submenuType === SubmenuType.EXPORT) {
      this.setState({ submenuType: SubmenuType.NONE });
    }
  }

  handleExportMenuMouseEnter = () => {
    this.setState({ submenuType: SubmenuType.EXPORT });
  }

  handleExportMenuMouseLeave = () => this.closeExportMenu();

  handleGetLink = () => {
    this.props.onGetLink();
    this.closeExportMenu();
  }

  handleExportAsMagicaVoxelClick = () => {
    this.props.onDownload(ModelSupportFileType.MAGICA_VOXEL);
    this.closeExportMenu();
  }

  handleExportAsQubicleClick = () => {
    this.props.onDownload(ModelSupportFileType.QUBICLE);
    this.closeExportMenu();
  }

  handleExportAsMeshClick = () => {
    this.props.onDownload(ModelSupportFileType.MESH);
    this.closeExportMenu();
  }

  /* Advanced Menu */

  renderAdvancedMenu() {
    if (this.state.submenuType !== SubmenuType.ADVANCED) return null;

    return (
      <Paper className={styles.menuList}>
        <Menu desktop={true}>
          <MenuItem
            className={styles.menuItem}
            primaryText={'Edit as Trove File'}
            onTouchTap={this.handleEditAsTroveFileClick}
            disabled={!this.props.file || this.props.file.body.present.data.type === ModelFileType.TROVE}
          />
        </Menu>
      </Paper>
    );
  }

  closeAdvancedMenu() {
    if (this.state.submenuType === SubmenuType.ADVANCED) {
      this.setState({ submenuType: SubmenuType.NONE });
    }
  }

  handleAdvancedMenuMouseEnter = () => {
    this.setState({ submenuType: SubmenuType.ADVANCED });
  }

  handleAdvancedMenuMouseLeave = () => this.closeAdvancedMenu();

  handleEditAsTroveFileClick = () => {
    this.props.onEditAsTroveFile();
    this.closeAdvancedMenu();
  }

  /* Trove Menu */

  renderTroveMenu() {
    if (this.state.submenuType !== SubmenuType.TROVE) return null;

    const installBlueprintShortcut = this.isMac ? '⌘B' : 'Ctrl+B';

    return (
      <Paper className={styles.menuList}>
        <Menu desktop={true}>
          <MenuItem
            className={styles.menuItem}
            primaryText="Install Blueprint"
            secondaryText={installBlueprintShortcut}
            onTouchTap={this.handleInstallTroveBlueprint}
          />
          <MenuItem
            className={styles.menuItem}
            primaryText="Download Blueprint"
            onTouchTap={this.handleDownloadTroveBlueprint}
          />
        </Menu>
      </Paper>
    );
  }

  closeTroveMenu() {
    if (this.state.submenuType === SubmenuType.TROVE) this.setState({ submenuType: SubmenuType.NONE });
  }

  handleTroveMenuMouseEnter = () => {
    this.setState({ submenuType: SubmenuType.TROVE });
  }

  handleTroveMenuMouseLeave = () => this.closeTroveMenu();

  handleInstallTroveBlueprint = () => {
    this.props.onInstallBlueprint();
    this.closeTroveMenu();
  }

  handleDownloadTroveBlueprint = () => {
    this.props.onDownloadBlueprint();
    this.closeTroveMenu();
  }

  renderLeftToolbarGroup() {
    return (
      <div style={{ marginLeft: 25, marginTop: 10 }}>
        <div className={styles.menu}>
          <FlatButton
            label={this.props.intl.formatMessage(messages.newFile)}
            style={inlineStyles.button}
            onTouchTap={this.props.onNewFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div className={styles.menu}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.open)}
            style={inlineStyles.button}
            onTouchTap={this.props.onRequestOpenFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div className={styles.menu}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.save)}
            style={inlineStyles.button}
            onTouchTap={this.props.onSave}
            hoverColor={Colors.cyan700}
            disabled={!this.props.file || (!this.props.file.created && !this.props.file.modified)}
          />
        </div>
        <div className={styles.menu}>
          <FlatButton
            label={this.props.intl.formatMessage(messages.saveAll)}
            style={inlineStyles.button}
            onTouchTap={this.props.onSaveAll}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div
          className={styles.menu}
          onMouseEnter={this.handleExportMenuMouseEnter}
          onMouseLeave={this.handleExportMenuMouseLeave}
        >
          <FlatButton
            label={this.props.intl.formatMessage(messages.export)}
            labelPosition="before"
            icon={<ArrowDropDown />}
            style={inlineStyles.button}
            backgroundColor={this.state.submenuType === SubmenuType.EXPORT ? Colors.cyan700 : Colors.cyan500}
            hoverColor={Colors.cyan700}
          />
          {this.renderExportMenu()}
        </div>
        <div
          className={styles.menu}
          onMouseEnter={this.handleAdvancedMenuMouseEnter}
          onMouseLeave={this.handleAdvancedMenuMouseLeave}
        >
          <FlatButton
            label={this.props.intl.formatMessage(messages.advanced)}
            labelPosition="before"
            icon={<ArrowDropDown />}
            style={inlineStyles.button}
            backgroundColor={this.state.submenuType === SubmenuType.ADVANCED ? Colors.cyan700 : Colors.cyan500}
            hoverColor={Colors.cyan700}
          />
          {this.renderAdvancedMenu()}
        </div>
        {this.props.file && this.props.file.body.present.data.type === ModelFileType.TROVE && (
          <div
            className={styles.menu}
            onMouseEnter={this.handleTroveMenuMouseEnter}
            onMouseLeave={this.handleTroveMenuMouseLeave}
          >
            <FlatButton
              label={this.props.intl.formatMessage(messages.trove)}
              labelPosition="before"
              icon={<ArrowDropDown />}
              style={inlineStyles.button}
              backgroundColor={this.state.submenuType === SubmenuType.TROVE ? Colors.cyan700 : Colors.cyan500}
              hoverColor={Colors.cyan700}
            />
            {this.renderTroveMenu()}
          </div>
        )}
      </div>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar
        className={styles.navbar}
        location={this.props.location}
        fullWidth={true}
        leftToolbarGroup={this.renderLeftToolbarGroup()}
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar
        className={styles.navbar}
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
