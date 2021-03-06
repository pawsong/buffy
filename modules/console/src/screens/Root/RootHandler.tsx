import * as React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import * as Colors from 'material-ui/styles/colors';

import Messages from '../../constants/Messages';

import { State } from '../../reducers';
import { SnackbarRequest } from '../../reducers/snackbar';
import Snackbar from 'material-ui/Snackbar';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import rootSaga from './sagas';

import {
  EnhancedTitle,
  Meta,
  MetaDescription,
} from '../../hairdresser';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./RootHandler.css');

import {
  closeSnackbar,
} from '../../actions/snackbar';

import UserInfoDialog from './containers/UserInfoDialog';

interface RootProps extends React.Props<RootHandler>, SagaProps {
  snackbarOpen?: boolean;
  snackbar?: SnackbarRequest;
  loading?: boolean;
  closeSnackbar?: () => any;
  init?: ImmutableTask<any>;
  intl?: InjectedIntlProps;
}

@injectIntl
@saga({
  init: rootSaga,
})
@(connect((state: State) => ({
  snackbarOpen: state.snackbar.open,
  snackbar: state.snackbar.current,
  loading: state.loading,
}), {
  closeSnackbar,
}) as any)
@withStyles(styles)
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
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingBackground} />
        <div className={styles.loadingIndicator}>
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
      <div className={styles.root}>
        <EnhancedTitle>{title}</EnhancedTitle>
        <Meta
          attrs={{ property: 'fb:app_id' }}
          values={{ content: CONFIG_FACEBOOK_APP_ID }}
        />
        <MetaDescription>
          Buffy is a fun and simple 3D voxel editor where you can build and share 3D models with blocks.
        </MetaDescription>
        {loadingOverlay}
        <div className={styles.content}>{this.props.children}</div>
        <Snackbar
          open={this.props.snackbarOpen}
          message={this.props.snackbar.message}
          bodyStyle={this.props.snackbar.bodyStyle}
          onRequestClose={this.props.closeSnackbar}
        />
        <UserInfoDialog />
      </div>
    );
  }
}

export default RootHandler;
