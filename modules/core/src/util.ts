import Context from './Context';
const { log } = Context;

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function loop(handler) {
  return handler().then(() => {
    return loop(handler);
  }).catch(err => {
    log(err.stack);
  });
}

export default {
  sleep,
  loop,
}
