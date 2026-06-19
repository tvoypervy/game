import { Sprite, Texture } from "pixi.js";
import { Controls } from "../systems/Controls";

export class Player extends Sprite {
  // Базова швидкість бігу гравця
  private baseSpeed = 6.0;

  constructor(texture: Texture) {
    super(texture);

    // Встановлюємо якір по центру текстури, щоб гравець коректно обертався та позиціонувався
    this.anchor.set(0.5);
  }

  /**
   * Метод оновлення стану гравця, який викликається кожен фрейм у Ticker.
   * @param deltaTime коефіцієнт часу PixiJS
   * @param controls екземпляр нашого класу керування
   */
  public update(deltaTime: number, controls: Controls) {
    // 1. Визначаємо поточну швидкість (якщо затиснуто лівий або правий Shift — вмикаємо прискорення)
    let currentSpeed = this.baseSpeed;
    if (controls.isPressed("ShiftLeft") || controls.isPressed("ShiftRight")) {
      currentSpeed = this.baseSpeed * 1.5;
    }

    // 2. Отримуємо нормалізований вектор руху { x, y } з Controls
    const move = controls.movement;

    // 3. Змінюємо координати гравця
    this.x += move.x * currentSpeed * deltaTime;
    this.y += move.y * currentSpeed * deltaTime;
  }

  /**
   * Геттер для отримання поточної швидкості.
   * Він знадобиться м'ячу (`Ball.ts`), щоб додавати імпульс руху гравця до сили удару!
   */
  public getCurrentSpeed(controls: Controls): number {
    if (controls.isPressed("ShiftLeft") || controls.isPressed("ShiftRight")) {
      return this.baseSpeed * 1.5;
    }
    return this.baseSpeed;
  }
}
