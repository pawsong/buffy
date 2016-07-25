import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import io from 'socket.io-client';

import { call } from 'redux-saga/effects';
import { ModelFile } from '../../types';

import { saga, SagaProps, ImmutableTask, isRunning, isDone, request } from '../../../../saga';

import {
  REASON_TRUFFY_NOT_FOUND,
  REASON_TROVE_NOT_FOUND,
  REASON_UNEXPECTED_ERROR,
  TruffyError,
} from '../../truffy';

interface InstallBlueprintDialogProps extends SagaProps {
  error: TruffyError;
  onRequestClose: () => any
  onRetry: (file: ModelFile, action: string) => any;
}

class InstallBlueprintDialog extends React.Component<InstallBlueprintDialogProps, void> {
  static contextTypes = {
    isMac: React.PropTypes.bool.isRequired,
  };

  isMac: boolean;

  constructor(props, context) {
    super(props, context);
    this.isMac = context.isMac;
  }

  renderTruffyNotFound() {
    return (
      <div>
        <p style={{fontWeight: 500, fontSize: '18px'}}>
          Cannot find running Truffy
        </p>
        <p>
          Truffy is a small desktop app that enables Buffy's special features for Trove.
        </p>
        <p>
          Please make sure Truffy is running.
          If you have not yet installed Truffy, you can get it <a href="/truffy" target="_blank">here</a>!
        </p>
        <p>
          For more information, refer to <a href="/blog/trove-creation-made-easy" target="_blank">this blog post</a>.
        </p>
      </div>
    );
  }

  renderTroveNotFound() {
    return (
      <div>
        <p style={{fontWeight: 500, fontSize: '18px'}}>
          Truffy is running, but it cannot find installed Trove
        </p>
        <p>
          Please make sure that Trove is installed on your {this.isMac ? 'Mac' : 'PC'}.
        </p>
        <p>
          If you have already installed Trove, please enter the install folder on Truffy.
        </p>
      </div>
    );
  }

  renderUnexpectedError() {
    return (
      <div>
        <p style={{fontWeight: 500, fontSize: '18px'}}>
          Unknown error from Truffy :(
        </p>
        <p>
          Please blame <a href="mailto:giff@buffy.run" target="_blank">the developer</a> for this error.
        </p>
        <pre style={{ overflow: 'scroll' }}>{this.props.error.message}</pre>
      </div>
    );
  }

  renderBody() {
    if (!this.props.error) return null;

    switch (this.props.error.reason) {
      case REASON_TRUFFY_NOT_FOUND: {
        return this.renderTruffyNotFound();
      }
      case REASON_TROVE_NOT_FOUND: {
        return this.renderTroveNotFound();
      }
      case REASON_UNEXPECTED_ERROR: {
        return this.renderUnexpectedError();
      }
    }

    return null;
  }

  handleRetry = () => this.props.onRetry(this.props.error.file, this.props.error.action)

  render() {
    const actions = [
      <FlatButton
        label={'Cancel'}
        secondary={true}
        onTouchTap={this.props.onRequestClose}
      />,
      <FlatButton
        label={'Retry'}
        primary={true}
        onTouchTap={this.handleRetry}
      />
    ];

    return (
      <Dialog
        title={'Blueprint Action Failed'}
        open={!!this.props.error}
        onRequestClose={this.props.onRequestClose}
        actions={actions}
      >
        {this.renderBody()}
      </Dialog>
    );
  }
}

export default InstallBlueprintDialog;
