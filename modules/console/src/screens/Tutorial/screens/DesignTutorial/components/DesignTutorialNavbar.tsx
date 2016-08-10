import React from 'react';
import { Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
const update = require('react-addons-update');
import {pink500, white} from 'material-ui/styles/colors';
import { MuiTheme } from 'material-ui/styles';

import {
  Step,
  Stepper,
  StepButton,
  StepLabel,
} from 'material-ui/Stepper';

import { User } from '../../../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../../constants/Messages';

import LoggedInNavbar from '../../../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../../../components/AnonymousNavbar';
import WhiteCheckCircle from '../../../../../components/icons/WhiteCheckCircle';

import {
  SLUG_MAKE_YOUR_FIRST_MODEL,
} from '../slugs';

const styles = require('./DesignTutorialNavbar.css');

const NAVBAR_HEIGHT = 56;

interface DesignTutorialNavbarProps extends React.Props<DesignTutorialNavbar> {
  step: string;
  user: User;
  location: any;
  onLogout: () => any;
  intl?: InjectedIntlProps;
}

const stepsData = {
  [SLUG_MAKE_YOUR_FIRST_MODEL]: {
    label: 'Make your first model',
  },
};

const stepList = [
  SLUG_MAKE_YOUR_FIRST_MODEL,
];

@injectIntl
@withStyles(styles)
class DesignTutorialNavbar extends React.Component<DesignTutorialNavbarProps, void> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  };

  // the key passed through context must be called "muiTheme"
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  muiTheme: MuiTheme;

  constructor(props, context) {
    super(props, context);
    this.muiTheme = update(this.context['muiTheme'], {
      stepper: { iconColor: { $set: pink500 } },
    });
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  renderLeftToolbarGroup() {
    return null;
  }

  renderSteps() {
    return stepList.map(slug => {
      const { label } = stepsData[slug];

      const completed = false;
      const buttonProps = completed ? { icon: (<WhiteCheckCircle color={pink500} />) } : null;

      return (
        <Step key={slug} completed={completed} active={this.props.step === slug}>
          <StepButton
            {...buttonProps}
            containerElement={<Link to={`/tutorial/designer/${slug}`} />}
          >
            <StepLabel style={{color: white}}>{label}</StepLabel>
          </StepButton>
        </Step>
      );
    });
  }

  renderCenterToolbarGroup() {
    return (
      <ToolbarGroup className={styles.progress}>
        <div>
          <Stepper linear={false} style={{ height: NAVBAR_HEIGHT }}>
            {this.renderSteps()}
          </Stepper>
        </div>
      </ToolbarGroup>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar
        className={styles.navbar}
        location={this.props.location}
        fullWidth={true}
        leftToolbarGroup={this.renderLeftToolbarGroup()}
      >
        {this.renderCenterToolbarGroup()}
      </AnonymousNavbar>
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
      >
        {this.renderCenterToolbarGroup()}
      </LoggedInNavbar>
    );
  }

  render() {
    return this.props.user ? this.renderLoggedInNavbar() : this.renderAnonymousNavbar();
  }
}

export default DesignTutorialNavbar;
