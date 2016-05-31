const SHIFT = 16;

class Keyboard {
  pressed: { [index: string]: boolean; }
  constructor() {
    this.pressed = {};
    document.addEventListener('keydown', this.handleKeyDown, false);
    document.addEventListener('keyup', this.handleKeyUp, false);
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
  }
}

export default Keyboard;
