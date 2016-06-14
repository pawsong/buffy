import * as React from 'react';
import { Link } from 'react-router';
import Paper from 'material-ui/Paper';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import BuffyIcon from '../BuffyIcon';

const styles = require('./FullscreenForm.css');

const rowClass = [
  styles.root,
  'row',
  'center-xs',
].join(' ');

const columnClass = [
  'col-xs-12',
  'col-sm-8',
  'col-md-4',
  'col-lg-3',
].join(' ');

const inlineStyles = {
  logoContainer: {
    textDecoration: 'none',
    textAlign: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 40,
    height: 40,
  },
  paper: {
    position: 'relative',
    padding: 20,
  },
};

interface FullscreenFormProps extends React.Props<any> {
}

@withStyles(styles)
class FullscreenForm extends React.Component<FullscreenFormProps, void> {
  render() {
    return (
      <div className={rowClass}>
        <div className={columnClass}>
          <div style={inlineStyles.logoContainer}>
            <Link to="/"><BuffyIcon style={inlineStyles.logo} /></Link>
          </div>
          <Paper style={inlineStyles.paper}>
            {this.props.children}
          </Paper>
        </div>
      </div>
    );
  }
}

export default FullscreenForm;
