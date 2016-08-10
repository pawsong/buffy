import React from 'react';
import Immutable from 'immutable';
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit';
import Unit from './DesignTutorialUnit';
import InstructionList, { InstructionItem } from '../components/InstructionList';

import {
  CHANGE_TOOL,
  VOXEL_ADD_LIST_3D, VoxelAddList3dAction,
} from '../../../../../components/ModelEditor/actions';

import ModelEditor, {
  ModelEditorState,
  ToolType,
  ToolFilter,
} from '../../../../../components/ModelEditor';

import {
  SLUG_PENCIL,
} from '../slugs';

const styles = require('../DesignTutorial.css');

const MAX_ADD_CUBE_COUNT = 30;

const pencilTool = <span><b>Pencil tool</b> {<ModeEdit />}</span>;

interface PencilUnitProps {
  addCount?: number;
}

class PencilUnit extends Unit<PencilUnitProps> {
  getSlug() { return SLUG_PENCIL; }

  getLabel() { return 'Add new cubes'; }

  getToolFilter() {
    return Immutable.Set<ToolType>([
      ToolType.PENCIL,
    ]);
  }

  getInitialState() {
    return {
      addCount: 0,
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
    return 'Great job! You have added new cubes.';
  }

  isFinished() {
    return this.addTaskIsFinished();
  }

  addTaskIsFinished() {
    return this.state.addCount >= MAX_ADD_CUBE_COUNT;
  }

  onAction(action) {
    switch(action.type) {
      case VOXEL_ADD_LIST_3D: {
        const { positions } = action as VoxelAddList3dAction;
        this.setState({ addCount: Math.min(MAX_ADD_CUBE_COUNT, this.state.addCount + positions.length) });
        return action;
      }
      case CHANGE_TOOL:
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
          {pencilTool} is a basic tool for adding new cubes.
        </div>
        <div className={styles.p}>
          To add a cube using {pencilTool}, click on a side of cube to add a neighbor cube to that side.
          Click and drag to add multiple cubes.
        </div>
        <InstructionList>
          <InstructionItem done={this.addTaskIsFinished()}>
            Add {MAX_ADD_CUBE_COUNT} cubes. ({this.state.addCount} / {MAX_ADD_CUBE_COUNT})
          </InstructionItem>
        </InstructionList>
      </div>
    );
  }
}

export default PencilUnit;
