import * as React from 'react';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import {Link} from 'react-router';
// import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';
import spacing from 'material-ui/styles/spacing';
import transitions from 'material-ui/styles/transitions';
import typography from 'material-ui/styles/typography';
import {grey200} from 'material-ui/styles/colors';
import Paper from 'material-ui/Paper';

const styles = require('../../ModelStudio.css');

const SIZE = 300;

const inlineStyles = {
  root: {
    width: SIZE,
    margin: 2,
  },
  label: {
    backgroundColor: 'rgb(238, 238, 238)',
    lineHeight: '64px',
    margin: 0,
    fontSize: 20,
    fontWeight: 500,
    textAlign: 'center',
  },
  img: {
    height: SIZE,
  },
};

interface LargeImageButtonProps {
  label: FormattedMessage.MessageDescriptor;
  onTouchTap: () => any;
  backgroundColor: string;
  intl?: InjectedIntlProps;
  // icon: string;
}

interface LargeImageButtonState {
  zDepth: number;
}

@injectIntl
class LargeImageButton extends React.Component<LargeImageButtonProps, LargeImageButtonState> {
  constructor(props) {
    super(props);
    this.state = { zDepth: 0 };
  }

  handleMouseEnter = () => this.setState({ zDepth: 4 });

  handleMouseLeave = () => this.setState({ zDepth: 0 });

  render() {
    const imgStyle = Object.assign({}, inlineStyles.img, {
      backgroundColor: this.props.backgroundColor,
    });

    return (
      <Paper
        style={inlineStyles.root}
        onTouchTap={this.props.onTouchTap}
        zDepth={this.state.zDepth}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <h3 style={inlineStyles.label}>{this.props.intl.formatMessage(this.props.label)}</h3>
        <div style={imgStyle} className={styles.guideWhenNoFileOpenedButtonImg}>
          {this.props.children}
        </div>
      </Paper>
    );
  };
}

export default LargeImageButton;
