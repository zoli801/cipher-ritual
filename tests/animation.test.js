import test from 'node:test';
import assert from 'node:assert/strict';
import { pageStackAt, handshakeAt, transformationAt } from '../src/animation.js';

test('turning leaves conserve paper and visibly build the left stack',()=>{
  let left=0;
  for(let t=0;t<=7;t+=.1){const p=pageStackAt(t);assert.ok(Math.abs(p.left+p.right-.34)<1e-10);assert.ok(p.left>=left);assert.ok(p.right>0);left=p.left;}
  assert.equal(pageStackAt(0).left,0);assert.equal(pageStackAt(7).left,.17);assert.equal(pageStackAt(7).right,.17);assert.equal(pageStackAt(7).finished,6);
  assert.ok(pageStackAt(3).progress.some((p,i,a)=>i>0&&p!==a[i-1]));
});
test('hands ignite only at contact and extinguish before the collapse',()=>{
  for(const time of [0,.5,1,1.49,1.5])assert.equal(handshakeAt(time).ignition,0);
  assert.ok(handshakeAt(1.65).grip>.98);assert.ok(handshakeAt(2).ignition>.99);assert.equal(handshakeAt(4).ignition,0);
});
test('Bill folds his arms before growing, reddening, and gaining depth',()=>{
  const folded=transformationAt(2.2);assert.equal(folded.fold,1);assert.equal(folded.redness,0);assert.equal(folded.depth,1);
  let previous=transformationAt(0);
  for(let t=.1;t<9;t+=.1){const p=transformationAt(t);assert.ok(p.scale>=previous.scale);assert.ok(p.redness>=previous.redness);assert.ok(p.depth>=previous.depth);previous=p;}
  assert.equal(transformationAt(8.8).redness,1);assert.equal(transformationAt(8.8).depth,5);
});
