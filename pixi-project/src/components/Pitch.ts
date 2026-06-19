import { Graphics, Application } from "pixi.js";

export class Pitch {
  private lines: Graphics;
  private goals: Graphics;

  // Константи розмітки
  public margin = 15;
  public goalTopY = 0;
  public goalBottomY = 0;

  constructor(app: Application) {
    this.lines = new Graphics();
    this.goals = new Graphics();

    app.stage.addChild(this.lines);
    app.stage.addChild(this.goals);

    // Перше малювання при створенні поля
    this.updateDimensions(app.screen.width, app.screen.height);
  }

  public updateDimensions(w: number, h: number) {
    const strokeStyle = { color: 0xffffff, width: 3, alpha: 0.6 };
    const goalWidth = 15;
    const goalHeight = 180;

    // Розраховуємо верхню та нижню межу воріт по осі Y
    this.goalTopY = (h - goalHeight) / 2;
    this.goalBottomY = this.goalTopY + goalHeight;

    // --- 1. МАЛЮВАННЯ РОЗМІТКИ ПОЛЯ ---
    this.lines.clear();

    // Зовнішні межі поля
    this.lines.rect(
      this.margin,
      this.margin,
      w - this.margin * 2,
      h - this.margin * 2,
    );

    // Центральна лінія
    this.lines
      .moveTo(w / 2, this.margin)
      .lineTo(w / 2, h - this.margin)
      .stroke(strokeStyle);

    // Центральне коло
    this.lines.circle(w / 2, h / 2, 80).stroke(strokeStyle);

    // Штрафні майданчики
    const boxW = 140;
    const boxH = 300;
    this.lines.rect(w - this.margin - boxW, (h - boxH) / 2, boxW, boxH);
    this.lines.rect(this.margin, (h - boxH) / 2, boxW, boxH);
    this.lines.stroke(strokeStyle);

    // --- 2. МАЛЮВАННЯ СІТКИ / ШТАНГ ВОРІТ ---
    this.goals.clear();
    // Ліві ворота
    this.goals.rect(
      this.margin - goalWidth,
      this.goalTopY,
      goalWidth,
      goalHeight,
    );
    // Праві ворота
    this.goals.rect(w - this.margin, this.goalTopY, goalWidth, goalHeight);

    // Заливка воріт легким білим кольором для об'єму
    this.goals
      .fill({ color: 0xffffff, alpha: 0.2 })
      .stroke({ color: 0xffffff, width: 4 });
  }
}
