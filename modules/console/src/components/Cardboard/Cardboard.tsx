import * as React from 'react';
const update = require('react-addons-update');
import { findDOMNode } from 'react-dom';
import { Styles } from 'material-ui';
import RaisedButton from 'material-ui/lib/raised-button';
import IconButton from 'material-ui/lib/icon-button';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Scripts } from '@pasta/core/lib/types';

import Colors from 'material-ui/lib/styles/colors';

import VrCanvas from '../../canvas/VrCanvas';
import { Sandbox } from '../../sandbox';

let screenfull;
if (__CLIENT__) {
  screenfull = require('screenfull');
}

const styles = {
  readyContainer: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyContent: {
    position: 'relative',
    textAlign: 'center',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  buttonLabel: {
    fontSize: 48,
  },
  fullscreenButton: {
    backgroundColor: Colors.black,
    float: 'right',
  },
  fullscreenButtonTooltip: {
    left: '50%',
    transform: 'translate(-50%, 0)',
    fontSize: 16,
    marginTop: 32,
  },
};

const messages = defineMessages({
  start: {
    id: 'vr.start',
    description: 'VR Start button label',
    defaultMessage: 'Start',
  },
});

interface CardboardProps extends React.Props<Cardboard> {
  stateLayer: StateLayer;
  scripts: Scripts;
  onStart: () => any;
  intl?: InjectedIntlProps;
}

interface CardboardState {
  showFullscreenButton?: boolean;
  started?: boolean;
}

@injectIntl
class Cardboard extends React.Component<CardboardProps, CardboardState> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  // the key passed through context must be called "muiTheme"
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  muiTheme: Styles.MuiTheme;

  canvas: VrCanvas;
  sandbox: Sandbox;

  listenFullscreenEvent: Function;

  constructor(props, context) {
    super(props, context);

    this.muiTheme = update(context.muiTheme, {
      button: { height: { $set: 64 } },
      rawTheme: { spacing: { iconSize: { $set: 48 } } },
    });

    this.state = { started: false, showFullscreenButton: false };
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  componentDidMount() {
    this.listenFullscreenEvent = () => this.setState({ showFullscreenButton: !screenfull.isFullscreen });
    document.addEventListener(screenfull.raw.fullscreenchange, this.listenFullscreenEvent as any);
  }

  componentWillUnmount() {
    document.removeEventListener(screenfull.raw.fullscreenchange, this.listenFullscreenEvent as any);

    if (this.sandbox) this.sandbox.destroy();
    if (this.canvas) this.canvas.destroy();
  }

  handleStartButtonClick() {
    if (this.state.started) return;

    if (screenfull.enabled) screenfull.request();
    this.setState({ started: true });

    this.props.onStart();

    this.canvas = new VrCanvas({
      stateLayer: this.props.stateLayer,
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
    });

    // Initialize code
    this.sandbox = new Sandbox(this.props.stateLayer);
    this.sandbox.exec(this.props.scripts);
    this.sandbox.emit('when_run');
  }

  handleFullscreenButtonClick() {
    if (screenfull.enabled) screenfull.request();
  }

  renderReadyMode() {
    return (
      <div style={styles.readyContainer}>
        <div style={styles.readyContent}>
          <RaisedButton label={this.props.intl.formatMessage(messages.start)}
                        labelStyle={styles.buttonLabel}
                        disabled={!this.props.scripts}
                        primary={true}
                        onTouchTap={() => this.handleStartButtonClick()}
          />
        </div>
      </div>
    );
  }

  renderPlayMode() {
    const fullscreenButtonStyle = update(styles.fullscreenButton, {
      display: { $set: screenfull.enabled && this.state.showFullscreenButton ? 'block' : 'none' },
    });

    return (
      <div>
        <IconButton style={fullscreenButtonStyle}
                    iconStyle={{ color: Colors.white }}
                    tooltipStyles={styles.fullscreenButtonTooltip}
                    onTouchTap={() => this.handleFullscreenButtonClick()}
                    iconClassName="material-icons"
                    tooltipPosition="bottom-center"
                    tooltip="Fullscreen"
        >
          fullscreen
        </IconButton>
      </div>
    );
  }

  render() {
    const body = this.state.started ? this.renderPlayMode() : this.renderReadyMode();

    return (
      <div>
        <div ref="canvas" style={styles.canvas}></div>
        {body}
      </div>
    );
  }
}

export default Cardboard;
