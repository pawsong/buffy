import * as TWEEN from '@pasta/tween.js';
import Mesh from './Mesh';
import { SerializedMesh } from './Mesh';
import Vector3 from './Vector3';
import { SerializedVector3 } from './Vector3';

export interface SerializedGameObject {
  id: string;
  position: SerializedVector3;
  mesh: SerializedMesh;
  tween?: Object;
  direction: SerializedVector3;
}

class GameObject {
  id: string;
  position: Vector3;
  tween: TWEEN.Tween;
  mesh: Mesh;
  direction: Vector3;

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
      const oldPos = {
        x: this.position.x,
        z: this.position.z
      };

      const ended = this.tween.update2(dt) === false;

      this.direction
        .set(this.position.x - oldPos.x, 0, this.position.z - oldPos.z)
        .normalize();

      if (ended) { this.tween.stop(); }
    }
  }
}

export default GameObject;
