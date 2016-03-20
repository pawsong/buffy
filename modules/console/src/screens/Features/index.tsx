import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { State } from '../../reducers';

import Wrapper from '../../components/Wrapper';

interface FeaturesHandlerProps extends RouteComponentProps<{}, {}> {
}

class FeaturesHandler extends React.Component<FeaturesHandlerProps, {}> {
  render() {
    return (
      <Wrapper>
        <h1>Features</h1>
        <p>Why you need this?</p>

        <h2>1. Reasonable price</h2>
        <p>Using physical devices cost $20 per student on average. Price of our service is much more competitive.</p>

        <h2>2. Daily effortless updates with new features</h2>
        <p>You can access to new features without any effort.</p>
        <p>But if you use physical devices, to add a new feature to your devices,
        you should buy sensors and wait for it to be shipped to you.</p>

        <h2>3. Simulation helps students concentrate on what is worth, the logic</h2>
        <p>Without annoying physical bugs and fragile devices, which is a big threat in a public sector</p>

        <h2>4. Powerful online support (WIP)</h2>
        <p>Because of its very nature, remote support for physical computing education is limited.</p>
        <p>But if you use simulation, when a problem occurs, you can send all the data related to the problem
           with a one click, which gives you ability to control over the situation.</p>

        <hr />

        <h2>Want to learn more?</h2>
        <p>Feel free to contact us.</p>

        <p>--- CONTACT FORM HERE ---</p>
      </Wrapper>
    );
  }
}

export default FeaturesHandler;
