import * as React from 'react';
import IconButton = require('material-ui/lib/icon-button');
const Contacts = require('material-ui/lib/svg-icons/communication/contacts');
import ContactsDialog from './dialogs/ContactsDialog';

const style = {
  backgroundColor: 'black',
  float: 'right',
};

interface ContactButtonState {
  open?: boolean;
}

class ContactButton extends React.Component<{}, ContactButtonState> {
  state = {
    open: false,
  }

  handleClick() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
  }

  render() {
    return <div>
      <IconButton style={style}
        onClick={this.handleClick.bind(this)} tooltipPosition="bottom-center"
        tooltip={'Friends'}
      >
        <Contacts color="white"/>
      </IconButton>
      <ContactsDialog open={this.state.open} onClose={this.handleClose.bind(this)}/>
    </div>
  }
}

export default ContactButton;
