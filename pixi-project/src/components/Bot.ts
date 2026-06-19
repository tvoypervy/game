import { Sprite, Texture } from "pixi.js";

// Визначаємо всі можливі ролі для ботів на полі
type BotRole =
  | "goalkeeper_left"
  | "goalkeeper_right"
  | "enemy_defender_high"
  | "enemy_defender_low"
  | "my_defender_1" // Твій майбутній захисник 1
  | "my_defender_2" // Твій майбутній захисник 2
  | "enemy_attacker"; // Нападник суперника

export class Bot extends Sprite {
  public role: BotRole;
  private speed: number;
  private homeX = 0;
  private homeY = 0;

  constructor(
    texture: Texture,
    role: BotRole,
    speed: number,
    tint: number,
    scale = 0.9,
  ) {
    super(texture);

    this.anchor.set(0.5);
    this.role = role;
    this.speed = speed;
    this.tint = tint;
    this.scale.set(scale);
  }

  /**
   * Встановлює початкові позиції на полі залежно від ролі.
   * Викликається при старті гри та після кожного голу.
   */
  public initPosition(w: number, h: number) {
    switch (this.role) {
      case "goalkeeper_right":
        this.x = w - 45;
        this.y = h / 2;
        break;
      case "goalkeeper_left":
        this.x = 45;
        this.y = h / 2;
        break;
      case "enemy_defender_high":
        this.x = w * 0.65;
        this.y = h * 0.3;
        break;
      case "enemy_defender_low":
        this.x = w * 0.82;
        this.y = h * 0.7;
        break;

      // Позиції для нових гравців, яких ми додамо згодом:
      case "my_defender_1":
        this.x = w * 0.35;
        this.y = h * 0.25;
        break;
      case "my_defender_2":
        this.x = w * 0.35;
        this.y = h * 0.75;
        break;
      case "enemy_attacker":
        this.x = w * 0.55;
        this.y = h / 2;
        break;
    }

    // Запам'ятовуємо рідну позицію (точку повернення)
    this.homeX = this.x;
    this.homeY = this.y;
  }

  /**
   * Головний ШІ ботів. Викликається кожен кадр.
   */
  public updateAI(
    deltaTime: number,
    ballX: number,
    ballY: number,
    w: number,
    h: number,
    goalTopY: number,
    goalBottomY: number,
  ) {
    const halfFieldX = w / 2;

    switch (this.role) {
      case "goalkeeper_right":
        if (ballX > halfFieldX) this.trackY(ballY, deltaTime); // Було 3 аргументи, стало 2
        this.clampY(goalTopY, goalBottomY);
        break;

      case "goalkeeper_left":
        if (ballX < halfFieldX) this.trackY(ballY, deltaTime); // Було 3 аргументи, стало 2
        this.clampY(goalTopY, goalBottomY);
        break;

      case "enemy_defender_high":
        // Біжить до м'яча, якщо той на його половині поля
        if (ballX > halfFieldX + 30) {
          this.moveTowards(ballX, ballY, deltaTime);
        } else {
          this.moveTowards(this.homeX, this.homeY, deltaTime);
        }
        // Обмеження: не забігати на чужу половину поля
        if (this.x < halfFieldX + 40) this.x = halfFieldX + 40;

        // Використовуємо 'h': не даємо вибігти за вертикальні межі поля (з урахуванням маргіну)
        if (this.y < 15) this.y = 15;
        if (this.y > h - 15) this.y = h - 15;
        break;

      case "enemy_defender_low":
        if (ballX > halfFieldX + 120) {
          this.moveTowards(ballX, ballY, deltaTime);
        } else {
          this.moveTowards(this.homeX, this.homeY, deltaTime);
        }
        if (this.x < halfFieldX + 40) this.x = halfFieldX + 40;

        // Використовуємо 'h' і тут для страховки
        if (this.y < 15) this.y = 15;
        if (this.y > h - 15) this.y = h - 15;
        break;

      // ТУТ буде логіка для нових гравців (поки що нехай просто тримають позиції)
      case "my_defender_1":
      case "my_defender_2":
        this.moveTowards(this.homeX, this.homeY, deltaTime);
        break;
      case "enemy_attacker":
        this.moveTowards(this.homeX, this.homeY, deltaTime);
        break;
    }
  }

  // Помічник: рух по осі Y (для воротарів)
  private trackY(targetY: number, deltaTime: number) {
    if (this.y < targetY - 10) this.y += this.speed * deltaTime;
    else if (this.y > targetY + 10) this.y -= this.speed * deltaTime;
  }

  // Помічник: рух у точку плавним вектором (для захисників/нападників)
  private moveTowards(targetX: number, targetY: number, deltaTime: number) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15) {
      const angle = Math.atan2(dy, dx);
      this.x += Math.cos(angle) * this.speed * deltaTime;
      this.y += Math.sin(angle) * this.speed * deltaTime;
    }
  }

  private clampY(minY: number, maxY: number) {
    if (this.y < minY) this.y = minY;
    if (this.y > maxY) this.y = maxY;
  }
}
