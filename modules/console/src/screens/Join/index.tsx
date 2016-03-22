import * as React from 'react';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import { EnhancedTitle } from '../../hairdresser';
import Messages from '../../constants/Messages';
import JoinNavbar from './components/JoinNavbar';
import JoinForm from './components/JoinForm';
import Footer from '../../components/Footer';

const messages = defineMessages({
  title: {
    id: 'join.title',
    description: 'Title of join page',
    defaultMessage: 'Join {service}',
  },
});

interface JoinHandlerProps extends React.Props<JoinHandler> {
  intl?: InjectedIntlProps;
}

@injectIntl
class JoinHandler extends React.Component<JoinHandlerProps, {}> {
  render() {
    return (
      <div>
        <EnhancedTitle>
          {this.props.intl.formatMessage(messages.title, {
            service: this.props.intl.formatMessage(Messages.service),
          })}
        </EnhancedTitle>
        <JoinForm />
      </div>
    );
  }
}

export default JoinHandler;
