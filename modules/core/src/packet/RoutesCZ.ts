import * as Promise from 'bluebird';
import * as shortid from 'shortid';
import * as createError from 'http-errors';

import {
  Rpc,
  Methods,
  MoveParams,
  MoveMapParams,
  PlayEffectParams,
  RotateParams,
  UpdateMeshParams,
  UpdateTerrainParams,
  UpdateRobotParams,
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
  protected users: { [index: string]: UserGameObject };
  private destroyFuncs: DestroyFunc[];

  constructor(users: UserGameObject[]) {
    this.users = {};
    users.forEach(user => this.users[user.id] = user);
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

  protected getUser(id: string): UserGameObject {
    return this.users[id];
  }

  /* Route handlers */

  /**
   * move
   */
  async move(params: MoveParams): Promise<void> {
    const user = this.getUser(params.id);

    if (typeof params.id !== 'string') {
      this.throw(400, 'params.id must be string');
    }

    if (typeof params.x !== 'number') {
      this.throw(400, 'params.x must be number');
    }

    if (typeof params.z !== 'number') {
      this.throw(400, 'params.z must be number');
    }

    const dx = user.position.x - params.x;
    const dz = user.position.z - params.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    user.tween
      .to({ x: params.x, z: params.z }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    user.zone.broadcast.move({
      id: params.id,
      tween: user.tween.serialize(),
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
    const user = this.getUser(params.objectId);
    // TODO: Validate params.
    // TODO: Check permission.

    user.zone.broadcast.playEffect({
      objectId: user.id,
      x: params.x,
      z: params.z,
      duration: params.duration,
    });
  }

  /**
   * rotate
   */
  async rotate(params: RotateParams): Promise<void> {
    const user = this.getUser(params.id);

    // return async (params) => {
    if (params.direction.x === 0 && params.direction.y === 0 && params.direction.z === 0 ) {
      this.throw(400, 'Invalid vector');
    }

    if (user.tween.isPlaying()) user.tween.stop();
    user.zone.broadcast.stop({ id: params.id });

    user.direction.deserialize(params.direction).normalize();

    user.zone.broadcast.rotate({
      id: params.id,
      direction: user.direction.serialize(),
    });
  }

  /**
   * updateMesh
   */
  async updateMesh(params: UpdateMeshParams): Promise<void> {
    const user = this.getUser(params.objectId);
    // Upsert

    // TODO: Save values to DB.
    user.zone.broadcast.meshUpdated({
      designId: params.designId,
      mesh: params.mesh,
    });
  }

  /**
   * updateTerrain
   */
  async updateTerrain(params: UpdateTerrainParams): Promise<void> {
    const user = this.getUser(params.objectId);

    await this.updateTerrainInDB(user, params);

    const terrain = user.zone.updateTerrain({
      id: shortid.generate(),
      position: { x: params.x, z: params.z },
      color: params.color,
    });

    user.zone.broadcast.terrainUpdated({
      zoneId: user.zone.id,
      terrain: terrain.serialize(),
    });
  }

  protected abstract async updateTerrainInDB(user: UserGameObject, params: UpdateTerrainParams): Promise<void>;

  /**
   * updateRobot
   */
  async updateRobot(params: UpdateRobotParams): Promise<void> {
    const user = this.getUser(params.objectId);
    user.zone.broadcast.robotUpdated({
      robot: params.robot,
      design: params.design,
    });
  }
}

export default RoutesCZ;
