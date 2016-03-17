import * as React from 'react';
import JoinNavbar from './components/JoinNavbar';
import JoinForm from './components/JoinForm';
import Footer from '../../components/Footer';

class JoinHandler extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <JoinForm />
      </div>
    );
  }
}

export default JoinHandler;
