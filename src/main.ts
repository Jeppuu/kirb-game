import {
  makeBirdEnemy,
  makeFlameEnemy,
  makeGuyEnemy,
  makePlayer,
  setControls,
} from "./entities";
import { k } from "./kaboomCtx";
import { makeMap } from "./utils";
import { globalGameState } from "./state";

// Set up the game
async function gameSetup() {
  // Load all sprites
  k.loadSprite("assets", "./kirby-like.png", {
    sliceX: 9,
    sliceY: 10,
    anims: {
      kirbIdle: 0,
      kirbInhaling: 1,
      kirbFull: 2,
      kirbInhaleEffect: { from: 3, to: 8, speed: 15, loop: true },
      shootingStar: 9,
      flame: { from: 36, to: 37, speed: 4, loop: true },
      guyIdle: 18,
      guyWalk: { from: 18, to: 19, speed: 4, loop: true },
      bird: { from: 27, to: 28, speed: 4, loop: true },
    },
  });

  // Load level sprites
  k.loadSprite("level-1", "./level-1.png");
  k.loadSprite("level-2", "./level-2.png");

  // Create background color (it's not included in the sprites)
  // This displays outside of the actual levels
  k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0), k.fixed()]);

  // Create Level 1 map
  const { map: level1Layout, spawnPoints: level1SpawnPoints } = await makeMap(
    k,
    "level-1"
  );

  // Create Level 2 map
  const { map: level2Layout, spawnPoints: level2SpawnPoints } = await makeMap(
    k,
    "level-2"
  );

  // Create the Start scene
  k.scene("start", () => {
    // Create background color
    k.add([
      k.rect(k.width(), k.height()),
      k.color(k.Color.fromHex("#f7d7db")),
      k.fixed(),
    ]);
    // Create text
    k.add([
      k.text("Press enter to start!"),
      k.pos(k.width() - 800, k.height() / 2),
    ]);
    k.onKeyPress("enter", () => {
      k.go("level-1");
    });
  });

  // Game logic for Level 1
  k.scene("level-1", async () => {
    globalGameState.setCurrentScene("level-1");
    globalGameState.setNextScene("level-2");
    k.setGravity(2100);
    k.add([
      k.rect(k.width(), k.height()),
      k.color(k.Color.fromHex("#f7d7db")),
      k.fixed(),
    ]);

    k.add(level1Layout);

    // Add Kirb to the level
    const kirb = makePlayer(
      k,
      level1SpawnPoints.player[0].x,
      level1SpawnPoints.player[0].y
    );

    // Set controls for Kirb and spawn it
    setControls(k, kirb);
    k.add(kirb);

    // Set up camera logic
    k.camScale(k.vec2(0.7));
    k.onUpdate(() => {
      if (kirb.pos.x < level1Layout.pos.x + 432) {
        k.camPos(kirb.pos.x + 500, 870);
      }
    });

    // Spawn flame enemies
    for (const flame of level1SpawnPoints.flame) {
      makeFlameEnemy(k, flame.x, flame.y);
    }

    // Spawn guy enemies
    for (const guy of level1SpawnPoints.guy) {
      makeGuyEnemy(k, guy.x, guy.y);
    }

    // Spawn bird enemies
    for (const bird of level1SpawnPoints.bird) {
      const possibleSpeeds = [100, 200, 300];
      k.loop(10, () => {
        makeBirdEnemy(
          k,
          bird.x,
          bird.y,
          possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
        );
      });
    }
  });

  // Game logic for Level 2
  k.scene("level-2", () => {
    globalGameState.setCurrentScene("level-2");
    globalGameState.setNextScene("level-1");
    k.setGravity(2100);
    k.add([
      k.rect(k.width(), k.height()),
      k.color(k.Color.fromHex("#f7d7db")),
      k.fixed(),
    ]);

    k.add(level2Layout);

    // Add Kirb to level
    const kirb = makePlayer(
      k,
      level2SpawnPoints.player[0].x,
      level2SpawnPoints.player[0].y
    );

    // Set controls for Kirb and spawn it
    setControls(k, kirb);
    k.add(kirb);

    // Set up camera logic
    k.camScale(k.vec2(0.7));
    k.onUpdate(() => {
      if (kirb.pos.x < level2Layout.pos.x + 2100)
        k.camPos(kirb.pos.x + 500, 800);
    });

    // Spawn flame enemies
    for (const flame of level2SpawnPoints.flame) {
      makeFlameEnemy(k, flame.x, flame.y);
    }

    // Spawn guy enemies
    for (const guy of level2SpawnPoints.guy) {
      makeGuyEnemy(k, guy.x, guy.y);
    }

    // Spawn bird enemies
    for (const bird of level2SpawnPoints.bird) {
      const possibleSpeeds = [100, 200, 300];
      k.loop(10, () => {
        makeBirdEnemy(
          k,
          bird.x,
          bird.y,
          possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
        );
      });
    }
  });

  // Create end scene for future improvements
  k.scene("end", () => {});

  // Start the game from Level 1
  k.go("start");
}

// Run the game!
gameSetup();
