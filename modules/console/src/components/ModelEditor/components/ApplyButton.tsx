import * as React from 'react';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import RaisedButton from 'material-ui/lib/raised-button';
import Messages from '../../../constants/Messages';

interface ApplyButtonProps {
  onTouchTap: () => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class ApplyButton extends React.Component<ApplyButtonProps, void> {
  render() {
    return (
      <RaisedButton
        label={this.props.intl.formatMessage(Messages.apply)}
        primary={true}
        style={{
          position: 'absolute',
          right: 15,
          top: 15,
        }}
        onTouchTap={this.props.onTouchTap}
      />
    );
  }
}

export default ApplyButton
