import * as React from 'react';

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

const CONTACT_EMAIL_ADDRESS = 'contact@buffy.run';

class ContactHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div className={rootClass}>
        <h1>Email us</h1>
        <div>Contact email: <a href={`mailto:${CONTACT_EMAIL_ADDRESS}`}>{CONTACT_EMAIL_ADDRESS}</a></div>
      </div>
    );
  }
}

export default ContactHandler;
