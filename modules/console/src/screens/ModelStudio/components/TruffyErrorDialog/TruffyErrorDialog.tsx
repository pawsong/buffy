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
  renderTruffyNotFound() {
    return (
      <div>
        <div>Cannot find running Truffy is not running :(</div>
        <div>Truffy is an application that helps Buffy install a model file into Trove.</div>
        <div>Have you installed Truffy?</div>
        <div>If not, please download it from here and make sure it is running.</div>
        <div>If you already have one, please start it.</div>
        <div>For more information, refer to this article</div>
      </div>
    );
  }

  renderTroveNotFound() {
    return (
      <div>
        <div>Truffy is working, but it cannot find installed Trove client :(</div>
        <div>Have you installed Trove?</div>
        <div>If so, please let Buffy client for Trove know the installation path.</div>
        <div>If not, please install Trove.</div>
      </div>
    );
  }

  renderUnexpectedError() {
    return (
      <div>
        <div>Unknown error occurred on Truffy :( Please blame the developer</div>
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
