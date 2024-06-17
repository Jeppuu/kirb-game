import {
  AreaComp,
  BodyComp,
  DoubleJumpComp,
  GameObj,
  HealthComp,
  KaboomCtx,
  OpacityComp,
  PosComp,
  ScaleComp,
  SpriteComp,
} from "kaboom";
import { scale } from "./constants";
import { globalGameState } from "./state";

// Create player game object specific for the kirb player
type PlayerGameObj = GameObj<
  SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & {
      speed: number;
      direction: string;
      isInhaling: boolean;
      isFull: boolean;
    }
>;

// Create the player
export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
  const player = k.make([
    k.sprite("assets", { anim: "kirbIdle" }),
    k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }),
    k.body(),
    k.pos(posX * scale, posY * scale),
    k.scale(scale),
    k.doubleJump(10),
    k.health(3),
    k.opacity(1),
    {
      speed: 300,
      direction: "right",
      isInhaling: false,
      isFull: false,
    },
    "player",
  ]);

  // Logic for inhaling enemies
  player.onCollide("enemy", async (enemy: GameObj) => {
    if (player.isInhaling && enemy.isInhalable) {
      player.isInhaling = false;
      k.destroy(enemy);
      player.isFull = true;
      return;
    }

    // Respawn kirb (there's no dying in Kirb land)
    if (player.hp() === 0) {
      k.destroy(player);
      k.go(globalGameState.currentScene);
      return;
    }

    // If not inhaling, kirb is hurt
    player.hurt();
    // Cool effect to make the player flash when hurt
    await k.tween(
      player.opacity,
      0,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );
    // Doing it twice for a better effect
    await k.tween(
      player.opacity,
      1,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );
  });

  // Move to the next scene when entering exit door
  player.onCollide("exit", () => {
    k.go(globalGameState.nextScene);
  });

  // Create effect for inhaling
  const inhaleEffect = k.add([
    k.sprite("assets", { anim: "kirbInhaleEffect" }),
    k.pos(),
    k.scale(scale),
    k.opacity(0),
    "inhaleEffect",
  ]);

  // Create the inhale zone
  const inhaleZone = player.add([
    k.area({ shape: new k.Rect(k.vec2(0), 20, 4) }),
    k.pos(),
    "inhaleZone",
  ]);

  // Make sure inhale zone follows player's direction
  inhaleZone.onUpdate(() => {
    if (player.direction === "left") {
      inhaleZone.pos = k.vec2(-14, 8);
      inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
      inhaleEffect.flipX = true;
    } else {
      inhaleZone.pos = k.vec2(14, 8);
      inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);
      inhaleEffect.flipX = false;
    }
  });

  // If kirb falls off screen, destroy it to prevent lag
  // Then respawn
  player.onUpdate(() => {
    if (player.pos.y > 2000) {
      k.destroy(player);
      k.go(globalGameState.currentScene);
    }
  });

  return player;
}

// Set up controls for the game
export function setControls(k: KaboomCtx, player: PlayerGameObj) {
  const inhaleEffectRef = k.get("inhaleEffect")[0];

  k.onKeyDown((key) => {
    switch (key) {
      case "left":
        player.direction = "left";
        player.flipX = true;
        player.move(-player.speed, 0);
        break;
      case "right":
        player.direction = "right";
        player.flipX = false;
        player.move(player.speed, 0);
        break;
      case "z":
        if (player.isFull) {
          player.play("kirbFull");
          inhaleEffectRef.opacity = 0;
          break;
        }
        player.isInhaling = true;
        player.play("kirbInhaling");
        inhaleEffectRef.opacity = 1;
        break;

      default:
        break;
    }
  });

  k.onKeyPress("x", () => {
    player.doubleJump();
  });

  // Create a shooting star after inhaling enemy
  k.onKeyRelease("z", () => {
    if (player.isFull) {
      player.play("kirbInhaling"); // same animation works for swallowing and shooting as well
      const shootingStar = k.add([
        k.sprite("assets", {
          anim: "shootingStar",
          flipX: player.direction === "right",
        }),
        k.area({ shape: new k.Rect(k.vec2(5, 4), 6, 6) }),
        k.pos(
          player.direction === "left" ? player.pos.x - 80 : player.pos.x + 80,
          player.pos.y + 5
        ),
        k.scale(scale),
        player.direction === "left"
          ? k.move(k.LEFT, 800)
          : k.move(k.RIGHT, 800),
        "shootingStar",
      ]);
      shootingStar.onCollide("platform", () => k.destroy(shootingStar));

      // After shooting the shooting star
      player.isFull = false;
      k.wait(1, () => player.play("kirbIdle"));
    } else {
      inhaleEffectRef.opacity = 0;
      player.isInhaling = false;
      player.play("kirbIdle");
    }
  });
}

// Logic for making enemies inhalable
export function makeInhalable(k: KaboomCtx, enemy: GameObj) {
  enemy.onCollide("inhaleZone", () => {
    enemy.isInhalable = true;
  });

  enemy.onCollideEnd("inhaleZone", () => {
    enemy.isInhalable = false;
  });

  enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
    k.destroy(enemy);
    k.destroy(shootingStar);
  });

  // Make animation for when enemy is inhaled
  const playerRef = k.get("player")[0];
  enemy.onUpdate(() => {
    if (playerRef.isInhaling && enemy.isInhalable) {
      if (playerRef.direction === "right") {
        enemy.move(-800, 0);
        return;
      }
      enemy.move(800, 0);
    }
  });
}

// Create the flame enemies
export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
  const flame = k.add([
    k.sprite("assets", { anim: "flame" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"], // We don't care if enemies collide with each other
    }),
    k.body(),
    k.state("idle", ["idle", "jump"]),
    { isInhalable: false },
    "enemy",
  ]);

  // Kirb can inhale this enemy
  makeInhalable(k, flame);

  // Create animation logic for the flame enemies
  // Basically it waits one sec, jumps, then waits one sec again and jumps again...
  flame.onStateEnter("idle", async () => {
    await k.wait(1);
    flame.enterState("jump");
  });

  flame.onStateEnter("jump", async () => {
    flame.jump(1000);
  });
  flame.onStateUpdate("jump", async () => {
    if (flame.isGrounded()) {
      flame.enterState("idle");
    }
  });

  // if flame enemy falls off screen
  // destroy it to prevent lag
  flame.onUpdate(() => {
    if (flame.pos.y > 2000) {
      k.destroy(flame);
    }
  });

  return flame;
}

// Create the guy enemies
export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
  const guy = k.add([
    k.sprite("assets", { anim: "guyWalk" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(2, 3.9), 12, 12),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "left", "right", "jump"]),
    { isInhalable: false, speed: 100 },
    "enemy",
  ]);

  // Kirb can inhale guy enemies
  makeInhalable(k, guy);

  // Create animation logic for the guy enemies
  // Basically walk to the left for 2 secs, jump, walk to the right for 2 secs, repeat
  guy.onStateEnter("idle", async () => {
    await k.wait(1);
    guy.enterState("left");
  });

  guy.onStateEnter("left", async () => {
    guy.flipX = false;
    await k.wait(2);
    guy.enterState("jump");
  });

  guy.onStateUpdate("left", () => {
    guy.move(-guy.speed, 0);
  });

  guy.onStateEnter("right", async () => {
    guy.flipX = true;
    await k.wait(2);
    guy.enterState("jump");
  });

  guy.onStateUpdate("right", () => {
    guy.move(guy.speed, 0);
  });

  guy.onStateEnter("jump", () => {
    guy.jump(500);
    guy.flipX ? guy.enterState("left") : guy.enterState("right");
  });

  // If guy enemy falls off screen
  // destroy it to prevent lag
  guy.onUpdate(() => {
    if (guy.pos.y > 2000) {
      k.destroy(guy);
    }
  });

  return guy;
}

// Create the bird enemies
export function makeBirdEnemy(
  k: KaboomCtx,
  posX: number,
  posY: number,
  speed: number
) {
  const bird = k.add([
    k.sprite("assets", { anim: "bird" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body({ isStatic: true }), // Birds won't be affected by gravity
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 400 }), // Destroy birds when they're off screen
    "enemy",
  ]);

  // Kirb can inhale birds
  makeInhalable(k, bird);

  return bird;
}
