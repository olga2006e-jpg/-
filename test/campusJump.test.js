import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WalkController} from '../walkthrough/src/controller.js';
test('jump rises, lands, prevents mid-air repeats and resets on teleport',()=>{
  const handlers={};globalThis.window={addEventListener:(key,fn)=>{handlers[key]=fn;}};globalThis.document={addEventListener(){}};
  const camera=new THREE.PerspectiveCamera(),canvas={addEventListener(){}},world={regions:[{x1:-5,x2:5,z1:-5,z2:5,height:0}],obstacles:[]};
  const c=new WalkController(camera,canvas,world);c.teleport(0,0);c.enabled=true;
  const space={code:'Space',repeat:false,target:{matches:()=>false},preventDefault(){}};
  handlers.keydown(space);for(let i=0;i<20;i++)c.update(1/60);assert(c.airHeight>.9);
  const velocity=c.jumpVelocity;handlers.keydown(space);assert.equal(c.jumpVelocity,velocity);
  for(let i=0;i<100;i++)c.update(1/60);assert.equal(c.grounded,true);assert.equal(c.airHeight,0);
  handlers.keydown(space);c.update(1/60);c.teleport(1,1);assert.equal(c.airHeight,0);assert.equal(c.grounded,true);
});
