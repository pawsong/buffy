import * as React from 'react';
import Wrapper from '../../components/Wrapper';

class NotFoundHandler extends React.Component<{}, {}> {
  render() {
    return (
      <Wrapper>
        <div>Not found</div>
      </Wrapper>
    );
  }
}

export default NotFoundHandler;
