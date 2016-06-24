import * as React from 'react';

import PasswordForm from './containers/PasswordForm';

class SettingsAccountHandler extends React.Component<{}, void> {
  render() {
    return (
      <div>
        <PasswordForm />
      </div>
    );
  }
}

export default SettingsAccountHandler;
