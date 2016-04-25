import * as React from 'react';
import { Link } from 'react-router';
import BuffyIcon from './BuffyIcon';
import Colors from 'material-ui/lib/styles/colors';
import Wrapper from './Wrapper';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../constants/Messages';

const styles = {
  root: {
    borderTop: `1px solid ${Colors.faintBlack}`,
    marginTop: 40,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logo: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginTop: -4,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  left: {
    margin: 0,
    paddingLeft: 0,
    listStyle: 'none',
    fontSize: 14,
    color: Colors.lightBlack,
  },
  right: {
    float: 'right',
    margin: 0,
    listStyle: 'none',
    fontSize: 14,
    color: Colors.lightBlack,
  },
  list: {
    display: 'inline-block',
    marginLeft: 10,
  },
};

const messages = defineMessages({
  contact: {
    id: 'footer.contact',
    description: 'Contact link label',
    defaultMessage: 'Contact',
  },
  about: {
    id: 'footer.about',
    description: 'About link label',
    defaultMessage: 'About',
  },
});

class Footer extends React.Component<{}, {}> {
  render() {
    return (
      <Wrapper>
        <div style={styles.root}>
          <ul style={styles.right}>
            <li style={styles.list}>
              <Link to="/contact"><FormattedMessage {...messages.contact}></FormattedMessage></Link>
            </li>
            <li style={styles.list}>
              <Link to="/about"><FormattedMessage {...messages.about}></FormattedMessage></Link>
            </li>
          </ul>
          <Link to="/"><BuffyIcon style={styles.logo} color={Colors.lightBlack} /></Link>
          <ul style={styles.left}><li>© 2016 Buffy, Inc.</li></ul>
        </div>
      </Wrapper>
    );
  }
}

export default Footer;
