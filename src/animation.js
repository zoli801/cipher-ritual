import { clamp, smooth } from './ritual.js';

export function pageStackAt(time) {
  const progress=Array.from({length:7},(_,i)=>clamp((time-1.6-i*.48)/1.05));
  const left=.17*progress.reduce((sum,p)=>sum+smooth(p),0)/7;
  return {progress,left,right:.34-left,finished:progress.filter(p=>p===1).length-1};
}

export function handshakeAt(time) {
  return {
    grip:smooth((time-1.15)/.5),
    ignition:smooth((time-1.5)/.22)*(1-smooth((time-3.15)/.65)),
  };
}

export function transformationAt(time) {
  const fold=smooth((time-.35)/1.8),redness=smooth((time-2.4)/4.3);
  return {fold,redness,scale:1.12+redness*1.9+smooth((time-6.9)/1.9)*1.2,depth:1+redness*4};
}
