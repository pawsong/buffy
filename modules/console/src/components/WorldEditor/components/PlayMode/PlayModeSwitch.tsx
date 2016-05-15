import * as React from 'react';

const styles = require('./PlayMode.css');
const classNames = require('classnames');

import {
  WorldEditorState,
  PlayModeState,
  CameraMode,
  ViewMode,
  PlayState,
} from '../../types';

interface PlayModeSwitchProps {
  canvasElement: HTMLElement;
  onViewModeChange: (viewMode: ViewMode) => any;
  onPlayStart: () => any;
}

function requestPointerLock(element: HTMLElement) {
  const api = element.requestPointerLock || element['mozRequestPointerLock'] || element['webkitRequestPointerLock'];
  api.apply(element);
}

const leftPaneClass = classNames(styles.pane, styles.leftPane);
const rightPaneClass = classNames(styles.pane, styles.rightPane);

const PlayModeSwitch: React.StatelessComponent<PlayModeSwitchProps> = props => (
  <div>
    <div
      className={leftPaneClass}
      onMouseEnter={() => props.onViewModeChange(ViewMode.BIRDS_EYE)}
      onClick={props.onPlayStart}
    >
      <div>Bird's eye view</div>
    </div>
    <div
      className={rightPaneClass}
      onMouseEnter={() => props.onViewModeChange(ViewMode.FIRST_PERSON)}
      onClick={() => {
        requestPointerLock(props.canvasElement);
        props.onPlayStart();
      }}
    >
      <div>Third person view</div>
    </div>
  </div>
)

export default PlayModeSwitch;
