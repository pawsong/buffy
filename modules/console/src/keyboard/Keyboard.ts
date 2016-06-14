let visibilityChange;
if (__CLIENT__) {
  if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
    visibilityChange = 'visibilitychange';
  } else if (typeof document['mozHidden'] !== 'undefined') {
    visibilityChange = 'mozvisibilitychange';
  } else if (typeof document['msHidden'] !== 'undefined') {
    visibilityChange = 'msvisibilitychange';
  } else if (typeof document['webkitHidden'] !== 'undefined') {
    visibilityChange = 'webkitvisibilitychange';
  }
}

const SHIFT = 16;

class Keyboard {
  pressed: { [index: string]: boolean; }
  constructor() {
    this.pressed = {};
    document.addEventListener('keydown', this.handleKeyDown, false);
    document.addEventListener('keyup', this.handleKeyUp, false);
    document.addEventListener(visibilityChange, this.handleVisibilityChanage, false);
  }

  private handleVisibilityChanage = () => {
    this.pressed = {};
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.pressed[e.keyCode] = true;
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.pressed[e.keyCode] = false;
  }

  isShiftPressed() {
    return this.pressed[SHIFT] === true;
  }

  dispose() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
    document.removeEventListener('keyup', this.handleKeyUp, false);
    document.removeEventListener(visibilityChange, this.handleVisibilityChanage, false);
  }
}

export default Keyboard;
