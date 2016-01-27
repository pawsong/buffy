import GameUser from './classes/GameUser';

const sessions: {
  [index: string]: SocketIO.Socket,
} = {};

export function login(userId: string, socket: SocketIO.Socket) {
  const oldSocket = sessions[userId];
  if (oldSocket) {
    oldSocket.disconnect();
  }
  sessions[userId] = socket;
}

export function logout(userId: string) {
  delete sessions[userId];
}
