import { EventEmitter } from 'fbemitter';
import { AckFn } from '@pasta/core/lib/packet/RoutesCZ';

interface ParamsFromClientToServer {
  params: Object;
  ackFn: AckFn;
}

interface EventFromClientListener {
  (params: ParamsFromClientToServer): any;
}

class LocalSocket {
  // Sockets
  csEmitter: EventEmitter; // Client -> Area server
  scEmitter: EventEmitter; // Area server -> Client

  constructor() {
    this.csEmitter = new EventEmitter();
    this.scEmitter = new EventEmitter();
  }

  // API for client
  emit(event: string, params: Object, ackFn: AckFn) {
    this.csEmitter.emit(event, <ParamsFromClientToServer>{ params, ackFn });
  }

  addListener(event: string, fn: Function) {
    return this.scEmitter.addListener(event, fn);
  }

  // API for server
  emitFromServerToClient(event: string, params: Object) {
    this.scEmitter.emit(event, params);
  }

  addEventFromClientListener(event: string, fn: EventFromClientListener) {
    return this.csEmitter.addListener(event, (params: ParamsFromClientToServer) => fn(params));
  }
}

export default LocalSocket;
