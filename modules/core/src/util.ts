import Ctx from './Context';
const { log } = Ctx;

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
