import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import Contacts from 'material-ui/svg-icons/communication/contacts';

const style = {
  backgroundColor: 'black',
  float: 'right',
};

interface ContactButtonProps extends React.Props<ContactButton> {
  onTouchTap: () => any;
}

class ContactButton extends React.Component<ContactButtonProps, {}> {
  render() {
    return <div>
      <IconButton style={style}
                  onTouchTap={() => this.props.onTouchTap()}
                  tooltipPosition="bottom-center"
                  tooltip={'Friends'}
      >
        <Contacts color="white"/>
      </IconButton>
    </div>
  }
}

export default ContactButton;
