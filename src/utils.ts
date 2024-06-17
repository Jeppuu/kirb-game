import { KaboomCtx } from "kaboom";
import { scale } from "./constants";

// Create the maps for each level
export async function makeMap(k: KaboomCtx, name: string) {
  // Fetch the json data from json files
  const mapData = await fetchMapData(name);

  // Create a sprite of the map
  const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)]);

  // Handle spawnpoints
  const spawnPoints = handleSpawnPoints(mapData);
  // Create colliders
  createColliders(k, map, mapData);

  return { map, spawnPoints };
}

// Function to fetch map data from level json files
async function fetchMapData(name: string) {
  const response = await fetch(`./${name}.json`);
  return response.json();
}

// Function to create colliders
// This deals with platforms to walk on and exits to pass through
function createColliders(k: KaboomCtx, map: any, mapData: any) {
  for (const layer of mapData.layers) {
    if (layer.name === "colliders") {
      for (const collider of layer.objects) {
        map.add([
          k.area({
            shape: new k.Rect(k.vec2(0), collider.width, collider.height),
            collisionIgnore: ["platform", "exit"],
          }),
          collider.name !== "exit" ? k.body({ isStatic: true }) : null,
          k.pos(collider.x, collider.y),
          collider.name !== "exit" ? "platform" : "exit",
        ]);
      }
    }
  }
}

// Function to handle spawnpoints on each map
function handleSpawnPoints(mapData: any) {
  const spawnPoints: { [key: string]: { x: number; y: number }[] } = {};
  for (const layer of mapData.layers) {
    if (layer.name === "spawnpoints") {
      for (const spawnPoint of layer.objects) {
        if (spawnPoints[spawnPoint.name]) {
          spawnPoints[spawnPoint.name].push({
            x: spawnPoint.x,
            y: spawnPoint.y,
          });
        } else {
          spawnPoints[spawnPoint.name] = [{ x: spawnPoint.x, y: spawnPoint.y }];
        }
      }
    }
  }
  return spawnPoints;
}
