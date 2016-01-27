import ctx from './context';

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function loop(handler) {
  return handler().then(() => {
    return loop(handler);
  }).catch(err => {
    ctx.log(err.stack);
  });
}

export default {
  sleep,
  loop,
}
