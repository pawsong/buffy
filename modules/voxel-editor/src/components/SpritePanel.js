import React from 'react';
import initSpriteView from '../views/sprite';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

const spriteElement = document.createElement('div');
initSpriteView(spriteElement);

const SpritePanel = React.createClass({
  _spriteRef(element) {
    if (!element) { return; }
    element.appendChild(spriteElement);
  },

  render() {
    const {
      left,
      top,
      zIndex,
      connectDragPreview,
      connectDragSource,
      isDragging,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;

    return connectDragPreview(<div style={{ ...PanelStyles.root, zIndex, left, top, opacity }}>
      {connectDragSource(<div style={PanelStyles.handle}>Sprite</div>)}
      <div ref={this._spriteRef} style={{ width: 200, height: 300 }}/>;
    </div>);
  },
});

export default wrapPanel(SpritePanel);
