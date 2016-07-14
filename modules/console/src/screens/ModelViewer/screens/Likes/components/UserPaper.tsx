import React from 'react';
import Paper from 'material-ui/Paper';

const styles = require('../ModelViewerLikesHandler.css');

interface UserPaperProps {
  title: string;
  picture: string;
}

interface UserPaperState {
  zDepth?: number;
}

class UserPaper extends React.Component<UserPaperProps, UserPaperState> {
  constructor(props) {
    super(props);
    this.state = { zDepth: 1 };
  }

  handleMouseEnter = () => this.setState({ zDepth: 3 });

  handleMouseLeave = () => this.setState({ zDepth: 1 });

  render() {
    return (
      <Paper
        className={styles.item}
        zDepth={this.state.zDepth}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <img src={this.props.picture} />
        <h3>{this.props.title}</h3>
      </Paper>
    );
  }
}

export default UserPaper;
