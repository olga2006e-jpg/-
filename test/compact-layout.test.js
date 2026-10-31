import test from 'node:test';
import assert from 'node:assert/strict';
import {getChunk,NPCS,COLLECTIBLE_ITEMS,TOTAL_WORLD_CHUNKS,worldToChunkCoord} from '../server/world.js';

test('all server sectors exist; all interior content stays on one floor',()=>{
 let count=0;
 for(let x=-5;x<=4;x++)for(let z=-5;z<=4;z++){
  const c=getChunk(x,z);assert(c);count++;
  assert.equal(c.floor,1);
  assert(c.objects.some(o=>o.type==='floor'&&o.y===0));
  assert(!c.objects.some(o=>['grand_stairs','elevator'].includes(o.type)));
 }
 assert.equal(count,TOTAL_WORLD_CHUNKS);
 assert.equal(getChunk(5,0),null);
 assert.equal(getChunk(.5,0),null);
});
test('every clue and NPC belongs to a reachable classroom or hub',()=>{
 const rooms=new Set(['0,0','-1,0','1,0','0,-1']);
 assert.equal(COLLECTIBLE_ITEMS.length,4);
 assert.equal(new Set(COLLECTIBLE_ITEMS.map(i=>i.id)).size,4);
 for(const item of [...COLLECTIBLE_ITEMS,...NPCS]){
  const coord=worldToChunkCoord(item.x,item.z);
  assert(rooms.has(`${coord.cx},${coord.cz}`));
  assert(item.chunkX===coord.cx);assert(item.chunkZ===coord.cz);
  assert.equal(item.y,.8);
 }
 assert.equal(NPCS.length,5);
});
