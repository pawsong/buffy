import React from 'react';
import Immutable from 'immutable';
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit';
import update from 'react-addons-update';
import ndarray from 'ndarray';
import createModelWithDefault from '../../../../../components/ModelEditor/utils/createModelWithDefault';
import rgbToHex from '../../../../../components/ModelEditor/utils/rgbToHex';
import ndFill from '../../../../../components/ModelEditor/ndops/fill';
import ndCount from '../../../../../components/ModelEditor/ndops/count';
import Eraser from '../../../../../components/icons/Eraser';
import InstructionList, { InstructionItem } from '../components/InstructionList';

import {
  VOXEL_REMOVE_LIST_3D, VoxelRemoveList3dAction,
  CHANGE_TOOL,
  CHANGE_PALETTE_COLOR,
  CHANGE_COLOR_PICKER,
  VOXEL_ADD_LIST_3D,
} from '../../../../../components/ModelEditor/actions';

import Unit from './DesignTutorialUnit';

import ModelEditor, {
  ModelEditorState,
  ModelFileState,
  ToolType,
  ToolFilter,
} from '../../../../../components/ModelEditor';

import {
  SLUG_ERASER,
} from '../slugs';

const styles = require('../DesignTutorial.css');

interface EraserUnitProps {
  eraseCount: number;
}

const MAX_ERASE_COUNT = 10;

const eraserTool = <span><b>Eraser tool</b> {<Eraser />}</span>;

class EraserUnit extends Unit<EraserUnitProps> {
  getSlug() { return SLUG_ERASER; }

  getLabel() { return 'Erase cubes'; }

  getToolFilter() {
    return Immutable.Set<ToolType>([
      ToolType.COLOR_PICKER,
      ToolType.ERASE,
      ToolType.PAINT,
      ToolType.PENCIL,
    ]);
  }

  getInitialState() {
    return {
      eraseCount: 0,
    };
  }

  getInitialEditorState(model: ModelEditorState) {
    if (!model) {
      return {
        common: ModelEditor.createCommonState({ tool: ToolType.ERASE }),
        file: this.makeInitialVoxelData(),
      };
    } else {
      const matrix = model.file.present.data.maps[model.file.present.data.activeMap];
      return {
        common: Object.assign({}, model.common, { tool: ToolType.ERASE }),
        file: ndCount(matrix) > MAX_ERASE_COUNT * 2 ? createModelWithDefault(matrix) : this.makeInitialVoxelData(),
      };
    }
  }

  getFinishMessage() {
    return 'Well done! You have successfully erased cubes.';
  }

  isFinished() {
    return this.isEraseDone();
  }

  isEraseDone() {
    return this.state.eraseCount >= MAX_ERASE_COUNT;
  }

  makeInitialVoxelData(): ModelFileState {
    const matrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
    const c = rgbToHex({ r: 0x88, g: 0x88, b: 0x88 });
    ndFill(matrix, [4, 4, 4, 12, 12, 12], c);
    return createModelWithDefault(matrix);
  }

  onAction(action) {
    switch(action.type) {
      case VOXEL_REMOVE_LIST_3D: {
        const { positions } = action as VoxelRemoveList3dAction;
        this.setState({
          eraseCount: Math.min(MAX_ERASE_COUNT, this.state.eraseCount + positions.length),
        });
        return action;
      }
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
          <span>{eraserTool} is a basic tool for erasing existing cubes.</span>
        </div>
        <div className={styles.p}>
          To erase a cube using {eraserTool}, click a cube to erase.
          Click and drag to erase multiple cubes.
        </div>
        <InstructionList>
          <InstructionItem done={this.isEraseDone()}>
            Erase {MAX_ERASE_COUNT} cubes. ({this.state.eraseCount} / {MAX_ERASE_COUNT})
          </InstructionItem>
        </InstructionList>
      </div>
    );
  }
}

export default EraserUnit;
