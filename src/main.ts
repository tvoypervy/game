import { Application, Assets, Text, TextStyle } from "pixi.js";
import { Controls } from "./systems/Controls";
import { Pitch } from "./components/Pitch";
import { Ball } from "./components/Ball";
import { Bot } from "./components/Bot";
import { Player } from "./components/Player";

(async () => {
  // 1. Ініціалізація PixiJS Додатка
  const app = new Application();
  await app.init({ background: "#2e7d32", resizeTo: window });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // 2. Завантаження текстури
  const playerTexture = await Assets.load("/assets/bunny.png");
  const ballTexture = await Assets.load("/assets/ball.png");

  // 3. Створення систем та інфраструктури
  const controls = new Controls();
  const pitch = new Pitch(app);

  // 4. Створення головного гравця
  const player = new Player(playerTexture);
  player.anchor.set(0.5);
  player.tint = 0x2196f3;
  app.stage.addChild(player);

  // 5. Створення автономного м'яча
  const ball = new Ball(ballTexture);
  ball.alpha = 1.0;
  app.stage.addChild(ball);

  // 6. Створення ШІ-ботів (Воротарі та Захисники)
  const gkSpeed = 3.5;
  const defSpeed = 2.4;

  const enemyGoalkeeper = new Bot(
    playerTexture,
    "goalkeeper_right",
    gkSpeed,
    0xff5555,
  );
  const myGoalkeeper = new Bot(
    playerTexture,
    "goalkeeper_left",
    gkSpeed,
    0x5555ff,
  );
  const enemyDefender = new Bot(
    playerTexture,
    "enemy_defender_high",
    defSpeed,
    0xaa2222,
    0.9,
  );
  const enemyDefender2 = new Bot(
    playerTexture,
    "enemy_defender_low",
    defSpeed,
    0x881111,
    0.95,
  );

  const bots = [enemyGoalkeeper, myGoalkeeper, enemyDefender, enemyDefender2];
  bots.forEach((bot) => app.stage.addChild(bot));

  // 7. Стан гри та Інтерфейс (Табло)
  let playerScore = 0;
  let enemyScore = 0;
  let gameTime = 90;
  let isGameOver = false;
  let timeTicker = 0;

  const scoreText = new Text({
    text: "0 : 0",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 42,
      fontWeight: "bold",
      fill: "#ffffff",
    }),
  });
  scoreText.anchor.set(0.5, 0);
  app.stage.addChild(scoreText);

  const timerText = new Text({
    text: `TIME: ${gameTime}s`,
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fontWeight: "bold",
      fill: "#ffeb3b",
    }),
  });
  timerText.anchor.set(0.5, 0);
  app.stage.addChild(timerText);

  const hintText = new Text({
    text: "УДАР В РУСІ: Space (Сила) / Enter (Техніка) | ФІНТ: Shift | ПАС: Клавіша Q",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 14,
      fill: "#ffffff",
    }),
  });
  hintText.anchor.set(0.5, 1);
  hintText.alpha = 0.8;
  app.stage.addChild(hintText);

  // Функція для розстановки об'єктів на полі
  function layoutGameObjects() {
    const w = app.screen.width;
    const h = app.screen.height;

    // Центр інтерфейсу
    scoreText.x = w / 2;
    scoreText.y = 15;
    timerText.x = w / 2;
    timerText.y = 65;
    hintText.x = w / 2;
    hintText.y = h - 10;

    // Початкові позиції м'яча та гравця
    player.x = w / 4;
    player.y = h / 2;
    ball.x = w / 2;
    ball.y = h / 2;

    bots.forEach((bot) => bot.initPosition(w, h));
  }

  // Первинна розстановка
  layoutGameObjects();

  // Функція перезапуску після голу
  function resetToCenter() {
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.rotationSpeed = 0;
    ball.rotation = 0;
    layoutGameObjects();
  }

  // Обробка зміни розміру екрану
  window.addEventListener("resize", () => {
    pitch.updateDimensions(app.screen.width, app.screen.height);
    layoutGameObjects();
  });

  // --- 8. ГОЛОВНИЙ ІГРОВИЙ ЦИКЛ ---
  app.ticker.add((time) => {
    if (isGameOver) return;

    const w = app.screen.width;
    const h = app.screen.height;

    // А) Логіка оновлення таймера
    timeTicker += app.ticker.elapsedMS / 1000;
    if (timeTicker >= 1) {
      gameTime--;
      timeTicker = 0;
      timerText.text = `TIME: ${gameTime}s`;
      if (gameTime <= 0) {
        isGameOver = true;
        timerText.text = "МАТЧ ЗАВЕРШЕНО!";
        hintText.text = `Фінальний рахунок: ${playerScore} : ${enemyScore}.`;
        return;
      }
    }

    // Б) Оновлення позиції гравця (викликаємо його внутрішній метод)
    const currentSpeed = player.getCurrentSpeed(controls);
    player.update(time.deltaTime, controls);

    // В) Логіка пасу
    if (controls.isPressed("KeyQ")) {
      const move = controls.movement;
      const targetX = player.x + move.x * 60;
      const targetY = player.y + move.y * 60;
      const angle = Math.atan2(targetY - ball.y, targetX - ball.x);

      ball.velocityX = Math.cos(angle) * 18;
      ball.velocityY = Math.sin(angle) * 18;
      ball.rotationSpeed = 0.2;
      controls.resetKey("KeyQ");
    }

    // Г) Оновлення ШІ
    bots.forEach((bot) =>
      bot.updateAI(
        time.deltaTime,
        ball.x,
        ball.y,
        w,
        h,
        pitch.goalTopY,
        pitch.goalBottomY,
      ),
    );

    // Ґ) Взаємодія гравця з м'ячем
    let isBallFree = ball.handlePlayerInteraction(
      player.x,
      player.y,
      controls,
      currentSpeed,
    );

    // Д) Колізії захисників із м'ячем
    [enemyDefender, enemyDefender2].forEach((def) => {
      const dx = ball.x - def.x;
      const dy = ball.y - def.y;
      const distToDef = Math.sqrt(dx * dx + dy * dy);

      // Якщо захисник підібрався до м'яча ближче ніж на 42 пікселі
      if (distToDef < 42) {
        // Напрямок вибивання: в бік твоїх воріт (ліворуч) або просто вперед від себе
        const angleKick = Math.atan2(
          h / 2 - ball.y,
          pitch.margin + 50 - ball.x,
        );

        // Даємо м'ячу потужний імпульс (вибиваємо вперед)
        ball.velocityX = Math.cos(angleKick) * 22;
        ball.velocityY = Math.sin(angleKick) * 22;
        ball.rotationSpeed = -0.4;

        isBallFree = true;
      }
    });

    // Е) Колізії Воротарів із м'ячем (Виправлено)
    const gkRadius = 40;

    // Перевірка для правого воротаря
    const dxEnemyGk = ball.x - enemyGoalkeeper.x;
    const dyEnemyGk = ball.y - enemyGoalkeeper.y;
    const distEnemyGk = Math.sqrt(
      dxEnemyGk * dxEnemyGk + dyEnemyGk * dyEnemyGk,
    );

    if (distEnemyGk < gkRadius) {
      const angle = Math.atan2(dyEnemyGk, dxEnemyGk);
      ball.velocityX = Math.cos(angle) * 16;
      ball.velocityY = Math.sin(angle) * 16;
      ball.rotationSpeed = -0.2;
    }

    // Перевірка для лівого воротаря
    const dxMyGk = ball.x - myGoalkeeper.x;
    const dyMyGk = ball.y - myGoalkeeper.y;
    const distMyGk = Math.sqrt(dxMyGk * dxMyGk + dyMyGk * dyMyGk);

    if (distMyGk < gkRadius) {
      const angle = Math.atan2(dyMyGk, dxMyGk);
      ball.velocityX = Math.cos(angle) * 16;
      ball.velocityY = Math.sin(angle) * 16;
      ball.rotationSpeed = 0.2;
    }

    // Є) Фізика вільного польоту м'яча та тертя
    if (isBallFree) {
      ball.updatePhysics(time.deltaTime);
      ball.applyFriction();
    }

    // Ж) Перевірка меж поля, аутів та голів
    const pLeft = pitch.margin;
    const pRight = w - pitch.margin;
    const pTop = pitch.margin;
    const pBottom = h - pitch.margin;

    if (ball.x > pRight) {
      if (ball.y >= pitch.goalTopY && ball.y <= pitch.goalBottomY) {
        playerScore++;
        scoreText.text = `${playerScore} : ${enemyScore}`;
      }
      resetToCenter();
    } else if (ball.x < pLeft) {
      if (ball.y >= pitch.goalTopY && ball.y <= pitch.goalBottomY) {
        enemyScore++;
        scoreText.text = `${playerScore} : ${enemyScore}`;
      }
      resetToCenter();
    } else if (ball.y < pTop || ball.y > pBottom) {
      resetToCenter();
    }

    // З) Обмеження пересування
    if (player.x < pLeft) player.x = pLeft;
    if (player.x > pRight) player.x = pRight;
    if (player.y < pTop) player.y = pTop;
    if (player.y > pBottom) player.y = pBottom;
    bots.forEach((bot) => {
      if (bot.y < pTop) bot.y = pTop;
      if (bot.y > pBottom) bot.y = pBottom;
    });

    if (player.x < pLeft) player.x = pLeft;
    if (player.x > pRight) player.x = pRight;
    if (player.y < pTop) player.y = pTop;
    if (player.y > pBottom) player.y = pBottom;
    bots.forEach((bot) => {
      if (bot.y < pTop) bot.y = pTop;
      if (bot.y > pBottom) bot.y = pBottom;
    });

    // И) Фізика колізій між гравцями
    const playerRadius = 22;
    const botRadius = 22;
    const minDist = playerRadius + botRadius;

    // 1. Зіткнення твого головного гравця з усіма ботами
    bots.forEach((bot) => {
      const dx = player.x - bot.x;
      const dy = player.y - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDist - dist;

        // БАЛАНС ВАГИ:
        player.x += Math.cos(angle) * (overlap * 0.9);
        player.y += Math.sin(angle) * (overlap * 0.9);

        bot.x -= Math.cos(angle) * (overlap * 0.1);
        bot.y -= Math.sin(angle) * (overlap * 0.1);
      }
    });

    // 2. Зіткнення ботів між собою
    for (let i = 0; i < bots.length; i++) {
      for (let j = i + 1; j < bots.length; j++) {
        const botA = bots[i];
        const botB = bots[j];

        const dx = botA.x - botB.x;
        const dy = botA.y - botB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const overlap = minDist - dist;

          botA.x += Math.cos(angle) * (overlap / 2);
          botA.y += Math.sin(angle) * (overlap / 2);

          botB.x -= Math.cos(angle) * (overlap / 2);
          botB.y -= Math.sin(angle) * (overlap / 2);
        }
      }
    }
  });
})();
