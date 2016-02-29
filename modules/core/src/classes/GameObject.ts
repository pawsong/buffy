import * as TWEEN from '@pasta/tween.js';
import Mesh from './Mesh';
import { SerializedMesh } from './Mesh';
import Vector3 from './Vector3';
import { SerializedVector3 } from './Vector3';

export interface Position {
  x: number;
  z: number;
}

export interface SerializedGameObject {
  id: string;
  position: Position;
  mesh: SerializedMesh;
  tween?: Object;
  direction: SerializedVector3;
}

class GameObject {
  id: string;
  position: Position;
  tween: TWEEN.Tween;
  mesh: Mesh;
  direction: Vector3;

  constructor(data: SerializedGameObject) {
    this.id = data.id;
    this.position = {
      x: data.position.x,
      z: data.position.z,
    };
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
      position: {
        x: this.position.x,
        z: this.position.z,
      },
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
