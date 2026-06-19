export class Controls {
  private keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.code] = false));
  }

  public isPressed(code: string): boolean {
    return !!this.keys[code];
  }

  public resetKey(code: string): void {
    this.keys[code] = false;
  }

  public get movement() {
    let moveX = 0;
    let moveY = 0;

    // Перевірка WASD та Стрілочок
    if (this.keys["ArrowUp"] || this.keys["KeyW"]) moveY -= 1;
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) moveY += 1;
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) moveX -= 1;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) moveX += 1;

    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707;
      moveY *= 0.707;
    }

    return { x: moveX, y: moveY };
  }
}
