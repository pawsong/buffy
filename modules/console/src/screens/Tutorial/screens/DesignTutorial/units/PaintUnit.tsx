import React from 'react';
import Immutable from 'immutable';
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit';
import Brush from 'material-ui/svg-icons/image/brush';
import update from 'react-addons-update';
import ndarray from 'ndarray';
import createModelWithDefault from '../../../../../components/ModelEditor/utils/createModelWithDefault';
import rgbToHex from '../../../../../components/ModelEditor/utils/rgbToHex';
import ndFill from '../../../../../components/ModelEditor/ndops/fill';
import ndCount from '../../../../../components/ModelEditor/ndops/count';
import InstructionList, { InstructionItem } from '../components/InstructionList';

import {
  CHANGE_PALETTE_COLOR,
  CHANGE_COLOR_PICKER,
  VOXEL_ADD_LIST_3D,
  VOXEL_PAINT_3D, VoxelAddList3dAction,
  CHANGE_TOOL,
} from '../../../../../components/ModelEditor/actions';

import Unit from './DesignTutorialUnit';

import ModelEditor, {
  ModelEditorState,
  ModelFileState,
  ToolType,
  ToolFilter,
} from '../../../../../components/ModelEditor';

import {
  SLUG_PAINT,
} from '../slugs';

interface PaintUnitState {
  count: number;
}

const MAX_PAINT_COUNT = 15;

const styles = require('../DesignTutorial.css');

const paintTool = <span><b>Paint tool</b> {<Brush />}</span>;

class PaintUnit extends Unit<PaintUnitState> {
  getSlug() { return SLUG_PAINT; }

  getLabel() { return 'Change color of cubes'; }

  getToolFilter() {
    return Immutable.Set<ToolType>([
      ToolType.COLOR_PICKER,
      ToolType.PAINT,
      ToolType.PENCIL,
    ]);
  }

  getInitialState() {
    return {
      count: 0,
    };
  }

  getInitialEditorState(model: ModelEditorState) {
    if (!model) {
      return {
        common: ModelEditor.createCommonState({ tool: ToolType.PAINT }),
        file: this.makeInitialVoxelData(),
      };
    } else {
      const matrix = model.file.present.data.maps[model.file.present.data.activeMap];
      return {
        common: Object.assign({}, model.common, { tool: ToolType.PAINT }),
        file: ndCount(matrix) > MAX_PAINT_COUNT * 2 ? createModelWithDefault(matrix) : this.makeInitialVoxelData(),
      };
    }
  }

  getFinishMessage() {
    return 'Good job! You have successfully changed cube colors.';
  }

  isFinished() {
    return this.isPaintDone();
  }

  isPaintDone() {
    return this.state.count >= MAX_PAINT_COUNT;
  }

  makeInitialVoxelData(): ModelFileState {
    const matrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
    const c = rgbToHex({ r: 0x88, g: 0x88, b: 0x88 });
    ndFill(matrix, [4, 4, 4, 12, 12, 12], c);
    return createModelWithDefault(matrix);
  }

  onAction(action) {
    switch(action.alias) {
      case VOXEL_PAINT_3D: {
        const { positions } = action as VoxelAddList3dAction;
        this.setState({
          count: Math.min(MAX_PAINT_COUNT, this.state.count + positions.length),
        });
        return action;
      }
    }

    switch(action.type) {
      case CHANGE_TOOL:
      case CHANGE_COLOR_PICKER:
      case CHANGE_PALETTE_COLOR:
      case VOXEL_ADD_LIST_3D:
      {
        return action;
      }
    }

    return null;
  }

  renderContent() {
    return (
      <div>
        <div className={styles.p}>
          {paintTool} is a basic tool for changing color of the existing cubes.
        </div>
        <div className={styles.p}>
          To change color of a cube using {paintTool}, click a cube to change the color.
          Click and drag to change multiple cube colors.
        </div>
        <InstructionList>
          <InstructionItem done={this.isPaintDone()}>
            Paint {MAX_PAINT_COUNT} cubes. ({this.state.count} / {MAX_PAINT_COUNT})
          </InstructionItem>
        </InstructionList>
      </div>
    );
  }
}

export default PaintUnit;
