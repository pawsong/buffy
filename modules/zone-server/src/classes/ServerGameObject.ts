'use strict';

import { GameObject } from '@pasta/game-class';

const defaultViewables = {
  id: true,
  position: true,
  tween: 'dump',
};

class ServerGameObject extends GameObject {
  viewables: any;
  
  constructor(manager, options) {
    super(manager, options);
    this.viewables = Object.create(defaultViewables);
  }
  
  getSerializedObjectsInRange() {
    const viewables = [];
    for (let prop in this.viewables) {
      viewables.push(prop);
    }

    const objs = this.getNearObjects().concat([this]);
    return objs.map(obj => {
      return obj.serialize(viewables);
    });
  }
}

export default ServerGameObject;
