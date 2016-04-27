import * as Promise from 'bluebird';
import * as shortid from 'shortid';
import * as createError from 'http-errors';
import Mesh from '../classes/Mesh';

import {
  Rpc,
  Methods,
  MoveParams,
  MoveMapParams,
  PlayEffectParams,
  RotateParams,
  UpdateMeshParams,
  UpdateTerrainParams,
} from './CZ';

import UserGameObject from './UserGameObject';

const SPEED = 0.005;

export interface DestroyFunc {
  (): any;
}

export interface Ack {
  // When OK, status is omitted and treated as implicit 200.
  result?: any;

  status?: number;
  error?: string;
}

export interface AckFn {
  (ack: Ack): any;
}

export interface Listener {
  (params: Object, fn: AckFn): any;
}

export abstract class RoutesCZ implements Rpc {
  protected user: UserGameObject;
  private destroyFuncs: DestroyFunc[];

  constructor(user: UserGameObject) {
    this.user = user;
  }

  protected init() {
    this.destroyFuncs = Methods.map(method => this.addListener(method, (params, fn: AckFn) => {
      this[method](params)
        .then(result => fn({ result }))
        .catch(error => {
          const status = error.status || 500;
          fn({ status, error: error.message });

          if (status >= 500) console.error(error.stack || error);
        });
    }));
  }

  destroy() {
    this.destroyFuncs.forEach(func => func());
    this.destroyFuncs = [];
  }

  protected throw(status, message) {
    // Use http error for convenience.
    throw createError.apply(null, arguments);
  }

  protected abstract addListener(event: string, handler: Listener): DestroyFunc;

  /* Route handlers */

  /**
   * move
   */
  async move(params: MoveParams): Promise<void> {
    if (typeof params.id !== 'string') {
      this.throw(400, 'params.id must be string');
    }

    if (typeof params.x !== 'number') {
      this.throw(400, 'params.x must be number');
    }

    if (typeof params.z !== 'number') {
      this.throw(400, 'params.z must be number');
    }

    const dx = this.user.position.x - params.x;
    const dz = this.user.position.z - params.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    this.user.tween
      .to({ x: params.x, z: params.z }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    this.user.map.broadcast.move({
      id: params.id,
      tween: this.user.tween.serialize(),
    });
  }

  /**
   * moveMap
   */
  abstract moveMap(params: MoveMapParams): Promise<void>;

  /**
   * playEffect
   */
  async playEffect(params: PlayEffectParams): Promise<void> {
    // TODO: Validate params.
    // TODO: Check permission.

    this.user.map.broadcast.playEffect({
      x: params.x,
      z: params.z,
      duration: params.duration,
    });
  }

  /**
   * rotate
   */
  async rotate(params: RotateParams): Promise<void> {
    // return async (params) => {
    if (params.direction.x === 0 && params.direction.y === 0 && params.direction.z === 0 ) {
      this.throw(400, 'Invalid vector');
    }

    if (this.user.tween.isPlaying()) this.user.tween.stop();
    this.user.map.broadcast.stop({ id: params.id });

    this.user.direction.deserialize(params.direction).normalize();

    this.user.map.broadcast.rotate({
      id: params.id,
      direction: this.user.direction.serialize(),
    });
  }

  /**
   * updateMesh
   */
  async updateMesh(params: UpdateMeshParams): Promise<void> {
    await this.updateMeshInDB(params);

    // Upsert
    if (this.user.mesh) {
      this.user.mesh.deserialize({
        id: this.user.mesh.id,
        vertices: params.vertices,
        faces: params.faces,
      });
    } else {
      this.user.mesh = new Mesh({
        id: 'my-mesh',
        vertices: params.vertices,
        faces: params.faces,
      });
    }

    // TODO: Save values to DB.
    this.user.map.broadcast.meshUpdated({
      id: this.user.id,
      mesh: this.user.mesh.serialize(),
    });
  }

  protected abstract async updateMeshInDB(params: UpdateMeshParams): Promise<void>;

  /**
   * updateTerrain
   */
  async updateTerrain(params: UpdateTerrainParams): Promise<void> {
    await this.updateTerrainInDB(params);

    const terrain = this.user.map.updateTerrain({
      id: shortid.generate(),
      position: { x: params.x, z: params.z },
      color: params.color,
    });

    this.user.map.broadcast.terrainUpdated({
      terrain: terrain.serialize(),
    });
  }

  protected abstract async updateTerrainInDB(params: UpdateTerrainParams): Promise<void>;

}

export default RoutesCZ;
