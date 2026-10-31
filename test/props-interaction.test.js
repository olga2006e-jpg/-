import test from 'node:test';
import assert from 'node:assert/strict';
import { pickupProp, placeProp, getMovedProps, movedProps, generateChunk } from '../server/world.js';

test('Prop pickup and placement synchronization', () => {
  const propId = 'pumpkin_hub_1';
  
  // 1. Initial state
  assert.equal(movedProps.has(propId), false);

  // 2. Pick up prop
  pickupProp(propId, 'Alice');
  assert.equal(movedProps.get(propId).isHeld, true);
  assert.equal(movedProps.get(propId).heldBy, 'Alice');

  // 3. Place prop at new location
  const newX = 1.25;
  const newY = 0.5;
  const newZ = 3.75;
  const newRotY = 1.57;
  placeProp(propId, newX, newY, newZ, newRotY, 'Alice');

  const placed = movedProps.get(propId);
  assert.equal(placed.isHeld, false);
  assert.equal(placed.x, newX);
  assert.equal(placed.y, newY);
  assert.equal(placed.z, newZ);
  assert.equal(placed.rotY, newRotY);

  // 4. Verify generateChunk applies moved prop coordinates
  const chunk = generateChunk(0, 0);
  assert.ok(chunk);
  const chunkProp = chunk.objects.find(o => o.id === propId);
  assert.ok(chunkProp, 'Moved prop must exist in chunk objects');
  assert.equal(chunkProp.x, newX);
  assert.equal(chunkProp.y, newY);
  assert.equal(chunkProp.z, newZ);
  assert.equal(chunkProp.rotY, newRotY);

  // 5. getMovedProps returns active list
  const allMoved = getMovedProps();
  assert.ok(allMoved.some(p => p.id === propId && p.x === newX));
});
