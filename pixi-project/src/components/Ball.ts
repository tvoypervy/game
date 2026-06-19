import { Graphics, Sprite, Texture } from "pixi.js";
import { Controls } from "../systems/Controls";

export class Ball extends Sprite {
  // Фізичні властивості польоту м'яча
  public velocityX = 0;
  public velocityY = 0;
  public rotationSpeed = 0;

  private friction = 0.95; // Коефіцієнт тертя (затухання швидкості)
  public magnetRadius = 45; // Радіус, у якому м'яч реагує на гравця

  constructor(texture: Texture) {
    super();

    // 2. Автоматично вираховуємо радіус великої картинки
    const radius = texture.width / 2;

    // 3. Створюємо біле коло-підкладку (Шар 1 - нижній)
    const bg = new Graphics();
    bg.circle(0, 0, radius);
    bg.fill({ color: 0xffffff });
    this.addChild(bg);

    // 4. Створюємо окремий спрайт для самої картинки контуру (Шар 2 - верхній)
    const ballSprite = new Sprite(texture);
    ballSprite.anchor.set(0.5); // Центруємо картинку відносно кола
    this.addChild(ballSprite);

    // 5. Твій робочий масштаб для всього м'яча разом із підкладкою
    this.scale.set(0.02);
  }

  /**
   * Метод для розрахунку фізики вільного польоту (коли м'яч не у гравця)
   */
  public updatePhysics(deltaTime: number) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.rotation += this.rotationSpeed * deltaTime;
  }

  /**
   * Застосування сили тертя для поступової зупинки м'яча
   */
  public applyFriction() {
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    this.rotationSpeed *= this.friction;
  }

  /**
   * Головний метод взаємодії гравця з м'ячем.
   * УДАР НА ХОДУ: Перевірка кнопок винесена на самий початок,
   * щоб рух гравця не перебивав політ м'яча.
   */
  public handlePlayerInteraction(
    playerX: number,
    playerY: number,
    controls: Controls,
    playerCurrentSpeed: number,
  ): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Перевіряємо, чи знаходиться м'яч у зоні контролю гравця
    if (dist < this.magnetRadius) {
      const move = controls.movement;
      let angle = Math.atan2(dy, dx);

      // Якщо гравець рухається, удар спрямовується за вектором його руху
      if (move.x !== 0 || move.y !== 0) {
        angle = Math.atan2(move.y, move.x);
      }

      // --- ПРІОРИТЕТ 1: ПЕРЕВІРКА УДАРІВ ---

      // 1. ПОТУЖНИЙ УДАР (Space) НА ХОДУ
      if (controls.isPressed("Space")) {
        // Розраховуємо імпульс
        this.velocityX =
          Math.cos(angle) * 28 + move.x * playerCurrentSpeed * 0.5;
        this.velocityY =
          Math.sin(angle) * 28 + move.y * playerCurrentSpeed * 0.5;
        this.rotationSpeed = 0.5;

        // МІКРО-ВІДШТОВХУВАННЯ: виштовхуємо м'яч з-під ніг гравця вперед
        this.x += Math.cos(angle) * 20;
        this.y += Math.sin(angle) * 20;

        controls.resetKey("Space");
        return true;
      }

      // 2. ТЕХНІЧНИЙ УДАР (Enter) НА ХОДУ
      if (controls.isPressed("Enter")) {
        this.velocityX =
          Math.cos(angle) * 18 + move.x * playerCurrentSpeed * 0.3;
        this.velocityY =
          Math.sin(angle) * 18 + move.y * playerCurrentSpeed * 0.3;
        this.rotationSpeed = 0.8;

        // Виштовхуємо вперед і при технічному ударі
        this.x += Math.cos(angle) * 20;
        this.y += Math.sin(angle) * 20;

        controls.resetKey("Enter");
        return true;
      }

      // --- ПРІОРИТЕТ 2: МАГНІТНИЙ ДРИБЛІНГ (якщо удари не натиснуті) ---
      this.x = playerX + Math.cos(angle) * 25;
      this.y = playerY + Math.sin(angle) * 25;

      this.velocityX = 0;
      this.velocityY = 0;
      this.rotationSpeed = (move.x + move.y) * 0.1;

      return false; // М'яч під контролем
    }

    return true; // М'яч за межами досяжності
  }
}
