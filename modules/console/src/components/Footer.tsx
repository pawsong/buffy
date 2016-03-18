import * as React from 'react';
import Wrapper from './Wrapper';

import Colors from 'material-ui/lib/styles/colors';

const styles = {
  root: {
    borderTop: `1px solid ${Colors.faintBlack}`,
    marginTop: 40,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    width: 100,
    marginRight: 'auto',
    marginLeft: 'auto',
  },
};

class Footer extends React.Component<{}, {}> {
  render() {
    return (
      <Wrapper>
        <div style={styles.root}>
          <div style={styles.logo}>Pasta</div>
        </div>
      </Wrapper>
    );
  }
}

export default Footer;
