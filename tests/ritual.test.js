import test from 'node:test';
import assert from 'node:assert/strict';
import { Ritual, randomNumber, segmentDistance, RICKROLL_URL } from '../src/ritual.js';

test('eight unique candles are needed before the journal can awaken',()=>{
  const r=new Ritual();assert.equal(r.light(0),false);assert.equal(r.transition('offer'),false);assert.equal(r.transition('ritual'),true);
  for(const value of [-1,8,1.2,NaN,'2'])assert.equal(r.light(value),false);
  for(let i=0;i<8;i++){assert.equal(r.light(i),true);assert.equal(r.light(i),false);assert.equal(r.complete,i===7);}
  assert.equal(r.lit.size,8);assert.equal(r.transition('awakening'),true);assert.equal(r.light(2),false);
});
test('the accept journey has explicit ordered stages and can be replayed',()=>{
  const r=new Ritual();
  assert.equal(r.transition('ritual'),true);assert.equal(r.transition('awakening'),false);for(let i=0;i<8;i++)r.light(i);
  for(const stage of ['awakening','journal','summoning','offer','handshake','collapse','weirdmageddon','blackout','result'])assert.equal(r.transition(stage),true,stage);
  assert.equal(r.transition('blackout'),true);assert.equal(r.transition('result'),true);assert.equal(r.transition('ritual'),true);assert.equal(r.lit.size,0);
});
test('declining is possible only at the offer and targets the requested video',()=>{
  const r=new Ritual();assert.equal(r.transition('declined'),false);
  assert.equal(r.transition('ritual'),true);for(let i=0;i<8;i++)r.light(i);
  for(const s of ['awakening','journal','summoning','offer','declined'])assert.equal(r.transition(s),true);
  assert.equal(r.transition('handshake'),false);assert.equal(new URL(RICKROLL_URL).searchParams.get('v'),'dQw4w9WgXcQ');
});
test('random selection includes both endpoints and rejects the biased uint32 tail',()=>{
  for(let expected=0;expected<=100;expected++){
    const source={getRandomValues(a){a[0]=expected;return a;}};assert.equal(randomNumber(source),expected);
  }
  let calls=0;const source={getRandomValues(a){a[0]=calls++===0?0xffffffff:100;return a;}};
  assert.equal(randomNumber(source),100);assert.equal(calls,2);
});
test('fast pointer segments still intersect candles and zero-length taps work',()=>{
  assert.equal(segmentDistance({x:5,y:3},{x:0,y:0},{x:10,y:0}),3);
  assert.equal(segmentDistance({x:1,y:0},{x:0,y:0},{x:0,y:0}),1);
  assert.equal(segmentDistance({x:15,y:0},{x:0,y:0},{x:10,y:0}),5);
});
