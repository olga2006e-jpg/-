import test from 'node:test';
import assert from 'node:assert/strict';
import {isHostAdmin} from '../server/adminAccess.js';
const req=(peer,headers={})=>({socket:{remoteAddress:peer},headers});
test('admin belongs only to the server computer, including proxy and browser origin checks',()=>{
  assert.equal(isHostAdmin(req('127.0.0.1')),true);
  assert.equal(isHostAdmin(req('::1',{origin:'http://localhost:3001'})),true);
  assert.equal(isHostAdmin(req('::ffff:127.0.0.1',{'x-forwarded-for':'::1',origin:'http://localhost:5173'})),true);
  assert.equal(isHostAdmin(req('192.168.1.5',{'x-forwarded-for':'127.0.0.1',host:'localhost:3001'})),false);
  assert.equal(isHostAdmin(req('127.0.0.1',{'x-forwarded-for':'127.0.0.1, 192.168.1.5'})),false);
  assert.equal(isHostAdmin(req('127.0.0.1',{origin:'https://example.com'})),false);
  assert.equal(isHostAdmin(req('127.0.0.1',{origin:'null'})),false);
});
