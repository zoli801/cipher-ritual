import './style.css';
import { Ritual, CANDLE_COUNT, durations, RICKROLL_URL, randomNumber, segmentDistance } from './ritual.js';
import { Soundscape } from './audio.js';

const $ = (selector) => document.querySelector(selector);
const app=$('#app'),ritual=new Ritual(),audio=new Soundscape();
const roman=['I','II','III','IV','V','VI','VII','VIII'];
const candleButtons=[],marks=[];
let chamber,held=false,pointer=null,previousPointer=null,last=performance.now(),elapsed=0,stageTime=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,resultValue=null,rollTick=-1,captionKey='',pageTick=-1;
let raf=0,stopped=false,dealSoundPlayed=false;

for(let i=0;i<CANDLE_COUNT;i++){
  const b=document.createElement('button');b.className='candle-target';b.dataset.roman=roman[i];b.dataset.lit='false';b.setAttribute('aria-label',`Light candle ${i+1}`);b.setAttribute('aria-disabled','true');
  b.addEventListener('click',()=>{if(held)light(i);});
  $('#candle-targets').append(b);candleButtons.push(b);
  const mark=document.createElement('i');$('#progress-marks').append(mark);marks.push(mark);
}

const chapters={ritual:['01','THE SUMMONING'],awakening:['02','THE JOURNAL'],journal:['02','THE JOURNAL'],summoning:['03','THE OTHER SIDE'],offer:['04','THE BARGAIN'],handshake:['04','THE BARGAIN'],collapse:['05','WEIRDMAGEDDON'],weirdmageddon:['05','WEIRDMAGEDDON'],blackout:['06','THE CONSEQUENCE'],result:['06','THE CONSEQUENCE']};
const announcements={ritual:'Pick up the lighter, then light all eight candles. You can drag over the candles, tap them, or focus each candle and press Enter.',awakening:'All eight candles are lit. The journal is rising and opening.',journal:'The journal is open. Touch the journal to summon Bill Cipher.',summoning:'A blue portal opens. An eye watches from the other side. Bill Cipher appears.',offer:'Bill Cipher offers his hand. Make a deal, or decide yourself.',handshake:'You shake Bill’s hand. The deal is sealed.',collapse:'The ceiling collapses. You rise through the chamber into the sky.',weirdmageddon:'Reality tears open. Bill laughs and transforms into a gigantic red triangular prism.',blackout:'Everything goes dark.',result:'The universe has chosen your number.'};

function updateSound(){const b=$('#sound-toggle');b.setAttribute('aria-pressed',String(audio.enabled));b.setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound');$('#sound-label').textContent=audio.enabled?'SOUND ON':'SOUND OFF';}
function updateMotion(){app.classList.toggle('reduced-motion',reduced);$('#motion-toggle').setAttribute('aria-pressed',String(reduced));$('#motion-toggle').setAttribute('aria-label',reduced?'Enable full animation':'Reduce animation');chamber?.setReduced(reduced);}
updateSound();updateMotion();
$('#sound-toggle').addEventListener('click',()=>{audio.setEnabled(!audio.enabled);updateSound();});
$('#motion-toggle').addEventListener('click',()=>{reduced=!reduced;updateMotion();});

function caption(text){if(captionKey===text)return;captionKey=text;$('#cinematic-caption').textContent=text;}
function setHeld(value,event){
  held=value;app.classList.toggle('holding',value);$('#held-lighter').hidden=!value;
  if(chamber)chamber.lighter.visible=!value;
  candleButtons.forEach((b,i)=>b.setAttribute('aria-disabled',String(!value||ritual.lit.has(i))));
  $('#guide-title').textContent=value?'Eight flames. One invitation.':'A little fire. A very bad idea.';
  $('#guide-detail').textContent=value?'Bring the flame to each wick. Press Esc to put it down.':'Pick up the lighter. Pass its flame over all eight candles.';
  $('#lighter-target').setAttribute('aria-label',value?'Put down the lighter':'Pick up the lighter');
  if(value){audio.unlock().then(()=>{audio.lighter();updateSound();});const p=event?.clientX?{x:event.clientX,y:event.clientY}:chamber.project(chamber.lighterScreenPoint);moveLighter(p);$('#sr-status').textContent='Lighter picked up. Pass the flame over each wick, or press Tab to select candles and Enter to light them.';}
  previousPointer=null;
}
function moveLighter(p){pointer=p;$('#held-lighter').style.left=`${p.x}px`;$('#held-lighter').style.top=`${p.y}px`;}
$('#lighter-target').addEventListener('click',e=>{if(ritual.stage==='ritual')setHeld(!held,e);});

function light(i){
  if(!held||!ritual.light(i))return;
  chamber.light(i,elapsed);audio.candle(i);candleButtons[i].dataset.lit='true';candleButtons[i].setAttribute('aria-label',`Candle ${i+1}, lit`);candleButtons[i].setAttribute('aria-disabled','true');marks[i].classList.add('lit');
  $('#candle-count').textContent=ritual.lit.size;$('#sr-status').textContent=`${ritual.lit.size} of 8 candles lit.`;
  if(ritual.complete){setHeld(false);changeStage('awakening');}
}
window.addEventListener('pointermove',e=>{
  const p={x:e.clientX,y:e.clientY};
  if(chamber)chamber.pointer={x:(e.clientX/innerWidth-.5)*2,y:-(e.clientY/innerHeight-.5)*2};
  if(!held||ritual.stage!=='ritual')return;
  moveLighter(p);
  const screens=chamber.candleScreens();
  screens.forEach((s,i)=>{if(s.visible&&segmentDistance(s,previousPointer||p,p)<(e.pointerType==='touch'?35:28))light(i);});
  previousPointer=p;
},{passive:true});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&held)setHeld(false);});
$('#world').addEventListener('pointerdown',e=>{
  if(held&&ritual.stage==='ritual'){
    const p={x:e.clientX,y:e.clientY};moveLighter(p);chamber.candleScreens().forEach((s,i)=>{if(Math.hypot(s.x-p.x,s.y-p.y)<42)light(i);});
  }
});

function changeStage(next){
  if(!ritual.transition(next))return;
  stageTime=0;caption('');pageTick=-1;app.dataset.stage=next;
  $('#intro').setAttribute('aria-hidden',String(next!=='ritual'));$('#ritual-guide').setAttribute('aria-hidden',String(next!=='ritual'));
  $('#journal-copy').hidden=next!=='journal';$('#book-target').hidden=next!=='journal';$('#offer').hidden=next!=='offer';$('#result').hidden=next!=='result';
  if(chapters[next]){const [n,title]=chapters[next];$('#chapter-number').textContent=n;$('#chapter-title').textContent=title;}
  $('#sr-status').textContent=announcements[next]||'';
  if(next==='ritual'){
    chamber.reset();chamber.billLight.color.set(0xffd369);setHeld(false);$('#candle-count').textContent='0';
    candleButtons.forEach((b,i)=>{b.dataset.lit='false';b.setAttribute('aria-label',`Light candle ${i+1}`);b.setAttribute('aria-disabled','true');marks[i].classList.remove('lit');});
  }
  if(next==='awakening'){audio.tone(165,4,.2,'sine');$('#lighter-target').blur();}
  if(next==='journal'){$('#summon-button').focus({preventScroll:true});}
  if(next==='summoning')audio.portal();
  if(next==='offer')$('#accept').focus({preventScroll:true});
  if(next==='handshake'){dealSoundPlayed=false;audio.noise(.65,.15,1700);}
  if(next==='collapse')audio.collapse();
  if(next==='weirdmageddon'){audio.laugh();audio.tone(90,7,.35,'sawtooth',27);}
  if(next==='blackout'){audio.tone(130,.8,.3,'triangle',22);}
  if(next==='result'){
    resultValue=randomNumber();rollTick=-1;$('#number').setAttribute('aria-busy','true');$('#range-marker').style.left=`${resultValue}%`;
    $('#result-remark').textContent=resultValue===0?'Nothing. Somehow, that feels ominous.':resultValue===100?'Everything. He always did love excess.':resultValue===13?'Of course. He has a sense of humor.':resultValue===66?'A suspiciously familiar number.':resultValue===42?'An answer. Perhaps even the answer.':'A small number. An enormous consequence.';
    $('#copied').textContent='';audio.reveal();$('#again').focus({preventScroll:true});
  }
}

$('#book-target').addEventListener('click',()=>changeStage('summoning'));
$('#summon-button').addEventListener('click',()=>changeStage('summoning'));
$('#accept').addEventListener('click',()=>{audio.unlock();changeStage('handshake');});
$('#decline').addEventListener('click',()=>{
  if(!ritual.transition('declined'))return;
  app.dataset.stage='declined';$('#offer').hidden=true;caption('Your choice. His sense of humor.');
  // An ordinary website cannot close a tab it did not open. Replacing the current
  // document leaves the ritual and sends the visitor straight to the requested video.
  window.location.replace(RICKROLL_URL);
});
$('#again').addEventListener('click',()=>changeStage('blackout'));
$('#restart').addEventListener('click',()=>changeStage('ritual'));
$('#copy-number').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(String(resultValue));$('#copied').textContent='Copied to this reality.';}catch{$('#copied').textContent=`Your number: ${resultValue}`;}});
$('#fallback-random').addEventListener('click',()=>$('#fallback-number').textContent=randomNumber());

function fallback(){
  if(stopped)return;stopped=true;cancelAnimationFrame(raf);app.dataset.stage='fallback';$('#loading').hidden=true;$('#fallback').hidden=false;$('#world').hidden=true;
  $('#journal-copy').hidden=true;$('#offer').hidden=true;$('#result').hidden=true;$('#book-target').hidden=true;$('#motion-toggle').hidden=true;
  $('#sr-status').textContent='The 3D scene could not start. A simple random number generator is available.';
}

function updateObjects(){
  if(ritual.stage!=='ritual')return;
  const screens=chamber.candleScreens();
  screens.forEach((p,i)=>{const b=candleButtons[i];b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.hidden=!p.visible;});
  const lp=chamber.project(chamber.lighterScreenPoint);$('#lighter-target').style.left=`${lp.x}px`;$('#lighter-target').style.top=`${lp.y}px`;$('#lighter-target').hidden=held||!lp.visible;
}

function frame(now){
  if(stopped)return;raf=requestAnimationFrame(frame);
  const dt=Math.min((now-last)/1000,.06);last=now;if(document.hidden)return;
  elapsed+=dt;stageTime+=dt*(reduced?1.85:1);
  let s=ritual.stage;
  if(durations[s]&&stageTime>=durations[s]){
    const next={awakening:'journal',summoning:'offer',handshake:'collapse',collapse:'weirdmageddon',weirdmageddon:'blackout',blackout:'result'}[s];
    if(next)changeStage(next);
    s=ritual.stage;
  }
  if(s==='awakening'){
    const tick=Math.floor((stageTime-1.6)/.48);if(tick>=0&&tick<7&&tick!==pageTick){pageTick=tick;audio.page();}
    caption(stageTime>1.5?'The journal remembers.':'');
  }
  if(s==='summoning')caption(stageTime<3.7?'Something is looking back.':stageTime<6.5?'“Well, well, well…”':'');
  if(s==='handshake'){caption(stageTime>1.5?'“It’s a deal!”':'');if(stageTime>=1.5&&!dealSoundPlayed){dealSoundPlayed=true;audio.deal();}}
  if(s==='collapse')caption(stageTime<3.5?'The fine print was the end of the world.':'');
  if(s==='weirdmageddon')caption(stageTime<2.8?'“Reality is an illusion!”':stageTime<5.8?'“The universe is a hologram!”':stageTime<7.8?'“AHAHAHAHA!”':'');
  if(s==='result'){
    if(stageTime<.7&&!reduced){const tick=Math.floor(stageTime*16);if(tick!==rollTick){rollTick=tick;$('#number').textContent=randomNumber();}}
    else if($('#number').getAttribute('aria-busy')==='true'){$('#number').textContent=resultValue;$('#number').setAttribute('aria-busy','false');$('#sr-status').textContent=`Your random number is ${resultValue}, between 0 and 100.`;}
  }
  chamber.update(ritual.stage,stageTime,dt,elapsed);updateObjects();
}

async function start(){
  try{
    await Promise.all([document.fonts.load('500 28px Cormorant'),document.fonts.load('italic 28px Cormorant'),document.fonts.load('500 12px Manrope')]);
    $('#loading-note').textContent='Opening a door that should stay closed…';
    const {Chamber}=await import('./scene.js');chamber=new Chamber($('#world'),fallback);chamber.setReduced(reduced);
    await chamber.renderer.compileAsync(chamber.scene,chamber.camera);
    changeStage('ritual');$('#loading').classList.add('finished');setTimeout(()=>$('#loading').hidden=true,1100);
    last=performance.now();raf=requestAnimationFrame(frame);
  }catch(error){console.error('The chamber could not take shape:',error);fallback();}
}
window.addEventListener('resize',()=>{if(chamber&&!stopped)chamber.resize();});
document.addEventListener('visibilitychange',()=>{last=performance.now();if(audio.ctx){if(document.hidden)audio.ctx.suspend();else if(audio.enabled)audio.ctx.resume();}});
window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(raf);audio.ctx?.suspend();});
start();
