import * as TWEEN from '@pasta/tween.js';
import { EventEmitter, EventSubscription } from 'fbemitter';
import Mesh from './Mesh';
import { SerializedMesh } from './Mesh';
import Vector3 from './Vector3';
import { SerializedVector3 } from './Vector3';

const EPS = 0.000001;

export interface SerializedGameObject {
  id: string;
  position: SerializedVector3;
  mesh: SerializedMesh;
  tween?: Object;
  direction: SerializedVector3;
}

export const Events = {
  MOVE: 'move',
  STOP: 'stop',
}

class GameObject {
  id: string;
  position: Vector3;
  tween: TWEEN.Tween;
  mesh: Mesh;
  direction: Vector3;
  emitter: EventEmitter;

  constructor(data: SerializedGameObject) {
    this.id = data.id;

    this.position = new Vector3(data.position);

    this.tween = new TWEEN.Tween(this.position);
    if (data.tween) {
      this.tween.deserialize(data.tween);
    }

    if (data.mesh) {
      this.mesh = new Mesh(data.mesh);
    }

    this.direction = new Vector3(data.direction);

    this.emitter = new EventEmitter();
  }

  serialize(): SerializedGameObject {
    return {
      id: this.id,
      position: this.position.serialize(),
      mesh: this.mesh ? this.mesh.serialize() : null,
      tween: this.tween.serialize(),
      direction: this.direction.serialize(),
    };
  }

  update(dt: number) {
    if (this.tween.isPlaying()) {
      const positionFrom = {
        x: this.position.x,
        z: this.position.z
      };

      // const directionFrom = {
      //   x: this.direction.x,
      //   y: this.direction.y,
      //   z: this.direction.z,
      // };

      const ended = this.tween.update2(dt) === false;

      const dx = this.position.x - positionFrom.x;
      const dz = this.position.z - positionFrom.z;

      const len = Math.sqrt(dx * dx + dz * dz);
      if (len >= EPS) {
        this.direction
          .set(dx, 0, dz)
          .multiplyScalar(1 / len); // Normalize
      }

      this.emitter.emit(Events.MOVE);

      if (ended) {
        this.tween.stop();
        this.emitter.emit(Events.STOP);
      }
    }
  }

  onMove(listener) {
    return this.emitter.addListener(Events.MOVE, listener);
  }

  onStop(listener) {
    return this.emitter.addListener(Events.STOP, listener);
  }

  removeAllListeners() {
    this.emitter.removeAllListeners();
  }
}

export default GameObject;
