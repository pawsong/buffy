import shortid from 'shortid';
import objects from './ServerObjectManager';

const SPEED = 0.005;

export default function (io, socket) {
  const user = objects.create({ id: shortid.generate(), ...socket.user });

  socket.emit('init', {
    me: { id: user.id },
    objects: user.getSerializedObjectsInRange(),
  });

  // Emit move event to manager.
  user.tween.onStart(() => {
  });

  user.tween.onUpdate((value, newPos) => {
    console.log(value);
  });

  user.tween.onStop(() => {
  });

  socket.on('move', msg => {
    const dx = user.position.x - msg.x;
    const dy = user.position.y - msg.y;
    const dist = Math.sqrt(dx * dx + dy * dy)

    user.tween
      .to({ x: msg.x, y: msg.y }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    io.emit('move', { id: user.id, tween: user.tween });
  });

  socket.on('playEffect', msg => {
    io.emit('create', {
      id: shortid.generate(),
      type: 'effect',
      position: {
        x: msg.x,
        y: msg.y,
      },
      duration: msg.duration,
    });
  });

  socket.on('disconnect', function() {
    objects.destroy(user.id);
  });
};
