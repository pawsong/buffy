import React from 'react';
import {
  Action,
  ToolFilter,
} from '../../../../../components/ModelEditor/types';
import {
  ModelEditorState,
} from '../../../../../components/ModelEditor';

interface DesignTutorialUnitProps {
  editorState: ModelEditorState;
}

abstract class DesignTutorialUnit<T> {
  index: number;
  slug: string;
  label: string;
  toolFilter: ToolFilter;
  finishMessage: string;

  props: DesignTutorialUnitProps;
  state: T;

  constructor(public onUpdateState: (slug: string, state: T) => any) {
    this.slug = this.getSlug();
    this.label = this.getLabel();
    this.toolFilter = this.getToolFilter();
    this.state = this.getInitialState();
    this.finishMessage = this.getFinishMessage();
  }

  onStateUpdated(nextState: T) {
    this.state = nextState;
  }

  protected setState(state: T) {
    this.onUpdateState(this.slug, Object.assign({}, this.state, state));
  }

  abstract getSlug(): string;

  abstract getLabel(): string;

  abstract getToolFilter(): ToolFilter;

  abstract getInitialState(): T;

  abstract getFinishMessage(): string;

  abstract onAction(action: Action<any>): Action<any>;

  abstract getInitialEditorState(editorState: ModelEditorState): ModelEditorState;

  abstract isFinished(): boolean;

  abstract renderContent(): React.ReactNode;
}

export default DesignTutorialUnit;
