import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ColorPicker from 'react-color';
import {
  RaisedButton,
} from 'material-ui';

import * as ColorActions from '../actions/color';

const styles = {
  root: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  color: {
    width: '36px',
    height: '14px',
    borderRadius: '2px',
  },
  swatch: {
    padding: '5px',
    background: '#fff',
    borderRadius: '1px',
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    display: 'inline-block',
    cursor: 'pointer',
  },
};

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = { displayColorPicker: false };
  }

  _submit() {
    const { submit, voxel } = this.props;
    submit(voxel.toArray());
  }

  _handleColorPickerOpen() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  }

  _handleColorPickerClose() {
    this.setState({ displayColorPicker: false });
  }

  _handleColorPickerChange(color) {
    this.props.actions.setColor(color.rgb);
  }

  render() {
    const { color } = this.props;
    return <div style={styles.root}>
      <RaisedButton label="Submit" primary={true} onClick={this._submit.bind(this)}/>
      <div>
        <div style={styles.swatch} onClick={ this._handleColorPickerOpen.bind(this) }>
          <div style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
            ...styles.color
          }} />
        </div>
        <ColorPicker
          color={ this.props.color }
          position="left"
          display={ this.state.displayColorPicker }
          onChange={ this._handleColorPickerChange.bind(this) }
          onClose={ this._handleColorPickerClose.bind(this) }
          type="sketch" />
      </div>
    </div>;
  }
}

export default connect(state => ({
  voxel: state.voxel,
  color: state.color,
}), dispatch => ({
  actions: bindActionCreators(ColorActions, dispatch),
}))(Controls);
