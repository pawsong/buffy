import React from 'react';
import Immutable from 'immutable';
import RaisedButton from 'material-ui/RaisedButton';
import Unit from './DesignTutorialUnit';
import InstructionList, { InstructionItem } from '../components/InstructionList';

import {
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  VOXEL_ADD_LIST_3D, VoxelAddList3dAction,
  CHANGE_COLOR_PICKER,
  CHANGE_TOOL,
} from '../../../../../components/ModelEditor/actions';

import ModelEditor, {
  ModelEditorState,
  ToolType,
  ToolFilter,
} from '../../../../../components/ModelEditor';

import {
  ColorPickerType,
} from '../../../../../components/ModelEditor/types';

import {
  MaterialMapType,
} from '../../../../../types';

const styles = require('../DesignTutorial.css');

import {
  SLUG_COLOR_PICKER,
} from '../slugs';

const inlineStyles = {
  color: {
    width: 38,
    height: 16,
    borderRadius: 1,
  },
};

interface ColorPickerUnitState {
  simpleDone?: boolean;
  advancedDone?: boolean;
  addCubeDone?: boolean;
}

class ColorPickerUnit extends Unit<ColorPickerUnitState> {
  getSlug() { return SLUG_COLOR_PICKER; }

  getLabel() { return 'Change palette color'; }

  getToolFilter() {
    return Immutable.Set<ToolType>([
      ToolType.COLOR_PICKER,
      ToolType.PENCIL,
    ]);
  }

  getInitialState() {
    return {
      simpleDone: false,
      advancedDone: false,
      addCubeDone: false,
    };
  }

  getInitialEditorState(model: ModelEditorState) {
    if (model) return model;

    return {
      common: ModelEditor.createCommonState(),
      file: ModelEditor.createFileState(),
    };
  }

  getFinishMessage() {
    return 'Well done! Now you know how to change the palette color.';
  }

  isFinished() {
    return this.state.simpleDone && this.state.advancedDone && this.state.addCubeDone;
  }

  onAction(action) {
    switch (action.type) {
      case CHANGE_PALETTE_COLOR: {
        this.handleChangeColorAction();
        return action;
      }
      case VOXEL_ADD_LIST_3D: {
        this.handleVoxelAddAction();
        return action;
      }
      case CHANGE_TOOL:
      case CHANGE_COLOR_PICKER:
      {
        return action;
      }
    }

    return null;
  }

  handleChangeColorAction() {
    switch(this.props.editorState.common.colorPicker) {
      case ColorPickerType.SIMPLE: {
        this.setState({ simpleDone: true });
        break;
      }
      case ColorPickerType.ADVANCED: {
        this.setState({ advancedDone: true });
        break;
      }
    }
  }

  handleVoxelAddAction() {
    if (this.state.advancedDone || this.state.simpleDone) {
      this.setState({ addCubeDone: true })
    }
  }

  renderIcon() {
    const paletteColor = this.props.editorState.common.paletteColors[MaterialMapType.DEFAULT];
    return (
      <div className={styles.swatch}>
        <div style={Object.assign({
          backgroundColor: `rgb(${paletteColor.r}, ${paletteColor.g}, ${paletteColor.b})`,
        }, inlineStyles.color)} />
      </div>
    );
  }

  renderContent() {
    const icon = this.renderIcon();

    return (
      <div>
        <div className={styles.p}>
          <b>Color picker </b> {icon} is a basic tool for changing the palette color.
          Click {icon} icon to open the color picker panel.
        </div>
        <div className={styles.p}>
          There are two types of color picker: <b>Simple picker</b> and <b>Advanced picker</b>. <b>Simple picker</b> provides
          a set of carefully selected colors, while <b>Advanced picker</b> allows you to choose the exact color you want.
        </div>
        <div className={styles.p}>
          You can change color picker type using <b>SIMPLE</b> and <b>ADVANCED</b> buttons under the color picker panel.
        </div>
        <InstructionList>
          <InstructionItem done={this.state.simpleDone}>
            Change palette color using <b>Simple picker</b>.
          </InstructionItem>
          <InstructionItem done={this.state.advancedDone}>
            Change palette color using <b>Advanced picker</b>.
          </InstructionItem>
          <InstructionItem done={this.state.addCubeDone}>
            Add cubes using the color you have selected.
          </InstructionItem>
        </InstructionList>
      </div>
    );
  }
}

export default ColorPickerUnit;
