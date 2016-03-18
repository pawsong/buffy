import * as React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';

import { State } from '../../reducers';
import { SnackbarRequest } from '../../reducers/snackbar';
const Snackbar = require('material-ui/lib/snackbar');
import { saga, SagaProps, ImmutableTask } from '../../saga';
import rootSaga from './sagas';

import { Title, Meta } from '../../hairdresser';
import { META_TITLE } from '../../constants/HeadSelectors';

import {
  pushSnackbar, PushSnackbarQuery,
  closeSnackbar,
} from '../../actions/snackbar';

import UserInfoDialog from './containers/UserInfoDialog';

interface RootProps extends React.Props<Root>, SagaProps {
  snackbarOpen?: boolean;
  snackbar?: SnackbarRequest;
  pushSnackbar: (query: PushSnackbarQuery) => any;
  closeSnackbar: () => any;
  init?: ImmutableTask<any>;
  intl?: InjectedIntlProps;
}

const messages = defineMessages({
    title: {
        id: 'app.home.greeting',
        description: 'Message to greet the user.',
        defaultMessage: 'Hello!',
    },
});

@injectIntl
@saga({
  init: rootSaga,
})
@connect((state: State) => ({
  snackbarOpen: state.snackbar.open,
  snackbar: state.snackbar.current,
}), {
  pushSnackbar,
  closeSnackbar,
})
class Root extends React.Component<RootProps, {}> {
  componentWillMount() {
    this.props.runSaga(this.props.init);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.init);
  }

  render() {
    const title = this.props.intl.formatMessage(messages.title);
    return (
      <div>
        <Title>{title}</Title>
        <Meta attrs={META_TITLE} values={{ content: title }}/>
        {this.props.children}
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

export default Root;
