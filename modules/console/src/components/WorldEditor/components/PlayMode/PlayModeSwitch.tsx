import * as React from 'react';

const styles = require('./PlayMode.css');
const classNames = require('classnames');

import { WorldEditorState, PlayModeState, CameraMode } from '../../types';

interface PlayModeSwitchProps {
  canvasElement: HTMLElement;
  onChange: (state: WorldEditorState) => any;
}

function requestPointerLock(element: HTMLElement) {
  const api = element.requestPointerLock || element['mozRequestPointerLock'] || element['webkitRequestPointerLock'];
  api.apply(element);
}

function handlePerspectiveModeRequest(props: PlayModeSwitchProps) {
  requestPointerLock(props.canvasElement);

  props.onChange({
    cameraMode: CameraMode.FIRST_PERSON,
    playMode: PlayModeState.PLAY,
  });
}

const leftPaneClass = classNames(styles.pane, styles.leftPane);
const rightPaneClass = classNames(styles.pane, styles.rightPane);

const PlayModeSwitch: React.StatelessComponent<PlayModeSwitchProps> = props => (
  <div>
    <div
      className={leftPaneClass}
      onMouseEnter={() => props.onChange({
        cameraMode: CameraMode.BIRDS_EYE,
      })}
      onClick={() => props.onChange({
        cameraMode: CameraMode.BIRDS_EYE,
        playMode: PlayModeState.PLAY,
      })}
    >
      <div>Bird's eye view</div>
    </div>
    <div
      className={rightPaneClass}
      onMouseEnter={() => props.onChange({
        cameraMode: CameraMode.FIRST_PERSON,
      })}
      onClick={() => handlePerspectiveModeRequest(props)}
    >
      <div>Third person view</div>
    </div>
  </div>
)

export default PlayModeSwitch;
