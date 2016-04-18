import * as React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Colors from 'material-ui/lib/styles/colors';

import Messages from '../../constants/Messages';

import { State } from '../../reducers';
import { SnackbarRequest } from '../../reducers/snackbar';
const Snackbar = require('material-ui/lib/snackbar');
import { saga, SagaProps, ImmutableTask } from '../../saga';
import rootSaga from './sagas';

import { EnhancedTitle, Meta } from '../../hairdresser';

import {
  pushSnackbar, PushSnackbarQuery,
  closeSnackbar,
} from '../../actions/snackbar';

import UserInfoDialog from './containers/UserInfoDialog';

const styles = {
  root: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  content: {
    position: 'relative',
    height: '100%',
    overflow: 'auto',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  loadingBackground: {
    width: '100%',
    height: '100%',
    overflow: 'scroll',
    backgroundColor: Colors.black,
    opacity: 0.2,
  },
  loadingIndicator: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    margin: 'auto',
  },
};

interface RootProps extends React.Props<RootHandler>, SagaProps {
  snackbarOpen?: boolean;
  snackbar?: SnackbarRequest;
  loading?: boolean;
  pushSnackbar?: (query: PushSnackbarQuery) => any;
  closeSnackbar?: () => any;
  init?: ImmutableTask<any>;
  intl?: InjectedIntlProps;
}

@injectIntl
@saga({
  init: rootSaga,
})
@connect((state: State) => ({
  snackbarOpen: state.snackbar.open,
  snackbar: state.snackbar.current,
  loading: state.loading,
}), {
  pushSnackbar,
  closeSnackbar,
})
class RootHandler extends React.Component<RootProps, {}> {
  componentWillMount() {
    this.props.runSaga(this.props.init);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.init);
  }

  render() {
    const title = this.props.intl.formatMessage(Messages.service);

    const loadingOverlay = this.props.loading ? (
      <div style={styles.loadingOverlay}>
        <div style={styles.loadingBackground} />
        <div style={styles.loadingIndicator}>
          <div className="sk-folding-cube">
            <div className="sk-cube1 sk-cube"></div>
            <div className="sk-cube2 sk-cube"></div>
            <div className="sk-cube4 sk-cube"></div>
            <div className="sk-cube3 sk-cube"></div>
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div style={styles.root}>
        <EnhancedTitle>{title}</EnhancedTitle>
        {loadingOverlay}
        <div style={styles.content}>
          {this.props.children}
        </div>
        <Snackbar
          open={this.props.snackbarOpen}
          message={this.props.snackbar.message}
          onRequestClose={() => this.props.closeSnackbar()}
        />
        <UserInfoDialog />
      </div>
    );
  }
}

export default RootHandler;
