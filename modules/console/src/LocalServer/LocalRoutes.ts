import { EventEmitter } from 'fbemitter';
import RoutesCZ, { Listener, DestroyFunc, UserGetter } from '@pasta/core/lib/packet/RoutesCZ';
import UserGameObject from '@pasta/core/lib/packet/UserGameObject';
import LocalSocket from './LocalSocket';

class LocalRoutes extends RoutesCZ {
  socket: LocalSocket;

  constructor(userGetter: UserGetter, socket: LocalSocket) {
    super(userGetter);
    this.socket = socket;

    this.init();
  }

  protected addListener(event: string, listener: Listener): DestroyFunc {
    const token = this.socket.addListener(event, ({ params, ackFn }) => {
      listener(params, ackFn);
    });
    return () => token.remove();
  }

  async moveMap() {}
  async updateTerrainInDB() {}

  destroy() {
    super.destroy();
    this.socket = null;
  }
}

export default LocalRoutes;
