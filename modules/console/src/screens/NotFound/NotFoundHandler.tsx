import * as React from 'react';
import Wrapper from '../../components/Wrapper';

class NotFoundHandler extends React.Component<{}, {}> {
  render() {
    return (
      <Wrapper>
        <h1>Sorry</h1>
        <div>This page is not what you are looking for.</div>
      </Wrapper>
    );
  }
}

export default NotFoundHandler;
