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
        <h2>If you have any issues</h2>
        <div>
          <p>
            Please submit your issue <a target="_blank" href="https://github.com/buffylab/buffy-issues">here</a>.
            Type of issues can be one of the followings:
          </p>

          <ul>
            <li>Bug report</li>
            <li>Feature request</li>
            <li>Question</li>
            <li>Etc.</li>
          </ul>

          <p>
            We will respond to you within 24 hours!
          </p>
        </div>

        <h2>Email us</h2>
        <div>
          Still need help or suggestion? Please email us! <a href={`mailto:${CONTACT_EMAIL_ADDRESS}`}>{CONTACT_EMAIL_ADDRESS}</a>
        </div>
      </div>
    );
  }
}

export default ContactHandler;
