import React from 'react';
import Dialog from 'material-ui/lib/dialog';
import Promise from 'bluebird';
import 'whatwg-fetch';

const FileBrowserDialog = React.createClass({
  getInitialState() {
    return {
      loading: false,
      error: null,
    };
  },

  _load(promise) {
    const lockPromise = Promise.try(() => {
      this.setState({ loading: true, error: null });
    }).disposer(() => {
      this.setState({ loading: false });
    });
    return Promise.using(promise, lockPromise, result => result);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.open === false && nextProps.open === true) {
      function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
          return response
        } else {
          var error = new Error(response.statusText)
          error.response = response
          throw error
        }
      }

      function parseJSON(response) {
        return response.json()
      }

      this._load(
        fetch('/files').then(checkStatus).then(parseJSON)
      ).then(response => {
        console.log(response);
      }).catch(error => {
        this.setState({ error });
      });
    }
  },

  _onDialogSubmit() {
    console.log(arguments);
  },

  render() {
    const {
      ...other,
    } = this.props;

    const actions = [
      { text: 'Cancel' },
      { text: 'Submit', onTouchTap: this._onDialogSubmit, ref: 'submit' },
    ];

    return <Dialog
      {...other}
      title="Open File"
      actions={actions}
      actionFocus="submit"
      >
      <div className="spinner" style={{display: this.state.loading ? null : 'none'}}></div>
      {this.state.error && this.state.error.message}
    </Dialog>;
  },
});

export default FileBrowserDialog;
