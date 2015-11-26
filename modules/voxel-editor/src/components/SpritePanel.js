import React from 'react';
import initSpriteView from '../views/sprite';

const spriteElement = document.createElement('div');
initSpriteView(spriteElement);

const SpritePanel = React.createClass({
  _spriteRef(element) {
    if (!element) { return; }
    element.appendChild(spriteElement);
  },

  render() {
    return <div ref={this._spriteRef} style={{ width: 200, height: 300 }}></div>;
  },
});

export default SpritePanel;
