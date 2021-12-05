import Phaser from "phaser";

var platformGroup;
var player;
var cursors;
var enemySlime;
var randomCoordinate;
var coins;
var destinationFrame = 7;
var bolt;
var facingDirection;
var score = 0;
var scoreText;
var gameOver = false;
var triggered = false;

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }
  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("coin", "assets/coin.png");
    this.load.image("fireball", "assets/fireball.png");
    this.load.image("enemySlime", "assets/slime.png");
    this.load.spritesheet("player", "assets/wizard.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    this.add.image(400, 300, "sky");

    platformGroup = this.physics.add.staticGroup();

    platformGroup.create(400, 568, "ground").setScale(2).refreshBody();

    platformGroup.create(600, 400, "ground");
    platformGroup.create(50, 250, "ground");
    platformGroup.create(750, 220, "ground");

    player = this.physics.add.sprite(100, 450, "player");
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);

    cursors = this.input.keyboard.createCursorKeys();
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", { start: 20, end: 28 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 20, end: 28 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "attack",
      frames: this.anims.generateFrameNumbers("player", { start: 29, end: 38 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "death",
      frames: this.anims.generateFrameNumbers("player", { start: 39, end: 48 }),
      frameRate: 10,
    });

    this.physics.add.collider(player, platformGroup);

    enemySlime = this.physics.add.group({});

    this.physics.add.collider(enemySlime, platformGroup);
    this.physics.add.overlap(player, enemySlime, this.killPlayer, null, this);

    coins = this.physics.add.group({
      key: "coin",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    coins.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.1, 0.4));
    });

    this.physics.add.collider(coins, platformGroup);
    this.physics.add.overlap(player, coins, this.collectCoin, null, this);

    scoreText = this.add.text(16, 16, "score: 0", {
      fontSize: "32px",
      fill: "#000",
    });
  }

  update() {
    if (gameOver) {
      return;
    }
    if (cursors.space.isDown) {
      var currentFrame;

      player.anims.play("attack", 10, false);
      if (currentFrame != destinationFrame) {
        currentFrame = player.anims.currentFrame.index;
      }
      if (!triggered) {
        if (currentFrame == destinationFrame) {
          bolt = this.physics.add.sprite(player.x, player.y, "fireball");
          triggered = true;
          bolt.body.setAllowGravity(false);
          this.physics.add.overlap(
            bolt,
            enemySlime,
            this.enemyKilled,
            null,
            this
          );

          if (facingDirection === 0) {
            bolt.setVelocityX(-200);
            bolt.setFlipX(true);
          } else {
            bolt.setFlipX(false);
            bolt.setVelocityX(200);
          }
        }
      }
    }

    if (!cursors.space.isDown) {
      triggered = false;
    }

    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play("left", true);
      player.setFlipX(true);
      facingDirection = 0;
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play("right", true);
      facingDirection = 1;
      player.setFlipX(false);
    } else if (
      !cursors.left.isDown &&
      !cursors.right.isDown &&
      !cursors.space.isDown
    ) {
      player.setVelocityX(0);
      player.anims.play("turn");
    }

    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }

  generateEnemy() {
    randomCoordinate = Math.random() * 450;
    var slime = enemySlime.create(randomCoordinate, 10, "enemySlime");
    slime.setVelocityX(Phaser.Math.Between(-100, 100));
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);

    score += 1;
    scoreText.setText("Score: " + score);

    if (coins.countActive(true) === 0) {
      coins.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });
    }
    this.generateEnemy();
    this.generateEnemy();
  }

  enemyKilled(bolt, enemy) {
    enemy.disableBody(true, true);
    score += 2;
    scoreText.setText("Score: " + score);
  }

  killPlayer(player) {
    player.setVelocityX(0);
    player.anims.play("death", 10, false);
    gameOver = true;
    player.once("animationcomplete", () => {
      this.scene.start("GameOverScene");
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
  }
  create() {
    this.add.image(400, 300, "sky");
    this.add.text(300, 100, "GAME OVER", { align: "center", fontSize: 32 });
    this.add.text(280, 200, "Start again by clicking", { align: "center" });

    this.input.on(
      "pointerup",
      function (pointer) {
        gameOver = false;
        this.scene.start("GameScene");
      },
      this
    );
  }
}

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [GameScene, GameOverScene],
};

var game = new Phaser.Game(config);
