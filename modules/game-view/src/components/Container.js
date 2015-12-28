import React from 'react';
import Main from './Main';

const Container = React.createClass({
  render() {
    return <Main gameStore={this.props.gameStore} api={this.props.api}/>;
  },
});

export default Container;
