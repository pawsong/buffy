import * as React from 'react';
import { Link } from 'react-router';
import BuffyIcon from '../BuffyIcon';
import * as Colors from 'material-ui/styles/colors';
import Wrapper from '../Wrapper';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Footer.css');

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

@withStyles(styles)
class Footer extends React.Component<{}, {}> {
  render() {
    return (
      <Wrapper>
        <div className={styles.root}>
          <ul className={styles.right}>
            <li className={styles.list}>
              <Link to="/contact"><FormattedMessage {...messages.contact}></FormattedMessage></Link>
            </li>
            <li className={styles.list}>
              <Link to="/about"><FormattedMessage {...messages.about}></FormattedMessage></Link>
            </li>
          </ul>
          <Link to="/"><BuffyIcon className={styles.logo} color={Colors.lightBlack} /></Link>
          <ul className={styles.left}><li>© 2016 Buffy, Inc.</li></ul>
        </div>
      </Wrapper>
    );
  }
}

export default Footer;
