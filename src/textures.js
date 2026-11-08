import * as THREE from 'three';
import { illustratedPage } from './journal-art.js';

export function seeded(seed = 618) {
  return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function canvas(size, height = size) {
  const el = document.createElement('canvas'); el.width = size; el.height = height;
  return [el, el.getContext('2d')];
}
function texture(el) { const t = new THREE.CanvasTexture(el); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

export function stoneTexture() {
  const [el, c] = canvas(512), rand = seeded(91);
  c.fillStyle = '#5c5b4c'; c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 44000; i++) {
    const v = Math.floor(65 + rand() * 70);
    c.fillStyle = `rgba(${v + 3},${v + 2},${v - 10},${rand() * .3})`;
    const s = rand() * 5; c.fillRect(rand() * 512, rand() * 512, s, s);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const x = rand() * 512, y = rand() * 512;
    c.strokeStyle = '#201f1933'; c.beginPath(); c.moveTo(x, y);
    for (let j = 0; j < 5; j++) c.lineTo(x + j * 9 + rand() * 10, y + rand() * 17);
    c.stroke();
  }
  return texture(el);
}

export function floorTexture() {
  const [el, c] = canvas(1024), rand = seeded(32);
  c.fillStyle = '#262b23'; c.fillRect(0, 0, 1024, 1024);
  const s = 170.666;
  for (let y = 0; y < 6; y++) for (let x = -1; x < 7; x++) {
    const ox = x * s + (y % 2) * s / 2, oy = y * s;
    const v = 48 + rand() * 16; c.fillStyle = `rgb(${v + 3},${v + 4},${v - 4})`;
    c.fillRect(ox + 3, oy + 3, s - 6, s - 6);
    c.strokeStyle = '#84816b25'; c.strokeRect(ox + 4, oy + 4, s - 8, s - 8);
    c.strokeStyle = '#0c100c55'; c.beginPath(); c.moveTo(ox + 6, oy + s - 4); c.lineTo(ox + s - 4, oy + s - 4); c.lineTo(ox + s - 4, oy + 6); c.stroke();
  }
  for (let i = 0; i < 75000; i++) { c.fillStyle = rand() > .5 ? '#b4ae7a09' : '#10161018'; const r = rand() * 3; c.fillRect(rand() * 1024, rand() * 1024, r, r); }
  const t = texture(el); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); return t;
}

export function glowTexture() {
  const [el,c] = canvas(128); const g = c.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'#fff5cf');g.addColorStop(.08,'#ffdba6');g.addColorStop(.2,'#ffbb6655');g.addColorStop(.55,'#f49c3320');g.addColorStop(1,'#f49c3300');
  c.fillStyle=g;c.fillRect(0,0,128,128);return texture(el);
}

function line(c, points, color = '#403527', width = 2) {
  c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function circle(c,x,y,r,color='#614d30',width=1.5){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();}

export function coverTexture() {
  const [el,c]=canvas(768,1024),rand=seeded(8);
  c.fillStyle='#492423';c.fillRect(0,0,768,1024);
  const g=c.createRadialGradient(340,350,50,384,512,730);g.addColorStop(0,'#79403977');g.addColorStop(1,'#130b0bcc');c.fillStyle=g;c.fillRect(0,0,768,1024);
  for(let i=0;i<45000;i++){c.fillStyle=rand()>.5?'#f7c68b09':'#09050425';c.fillRect(rand()*768,rand()*1024,rand()*3,rand()*5);}
  c.strokeStyle='#c89b574a';c.lineWidth=2;c.strokeRect(37,37,694,950);c.strokeRect(48,48,672,928);
  for(const [x,y,sx,sy] of [[55,55,1,1],[713,55,-1,1],[55,969,1,-1],[713,969,-1,-1]]){c.save();c.translate(x,y);c.scale(sx,sy);line(c,[[0,75],[0,0],[75,0]],'#b0874f',7);line(c,[[10,48],[10,10],[48,10]],'#66462a',2);c.restore();}
  c.save();c.translate(384,480);c.scale(1.3,1.3);
  const hand=[[-73,119],[-126,58],[-153,9],[-158,-5],[-148,-19],[-132,-18],[-93,23],[-99,-78],[-95,-119],[-83,-126],[-70,-118],[-59,-32],[-54,-162],[-46,-176],[-32,-176],[-22,-163],[-18,-41],[-1,-186],[10,-196],[24,-192],[30,-175],[24,-42],[49,-160],[60,-171],[74,-167],[80,-152],[68,-26],[91,-110],[103,-118],[115,-112],[117,-94],[100,34],[82,93],[53,119],[-73,119]];
  c.fillStyle='#b68d4e';c.strokeStyle='#d4b56e';c.lineWidth=3;c.beginPath();hand.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();c.stroke();
  c.fillStyle='#4e3022';c.textAlign='center';c.font='600 112px Cormorant, Georgia';c.fillText('4',-12,57);c.restore();
  c.textAlign='center';c.font='500 18px Manrope, sans-serif';c.fillStyle='#b18e6066';c.fillText('PROPERTY OF NO ONE',384,867);
  return texture(el);
}

function paperBase(seed) {
  const [el,c]=canvas(1024,1400),rand=seeded(seed);
  c.fillStyle='#c8af76';c.fillRect(0,0,1024,1400);
  const g=c.createRadialGradient(500,650,140,500,650,880);g.addColorStop(0,'#f1dfaa');g.addColorStop(.6,'#d9c28c');g.addColorStop(1,'#846537');c.fillStyle=g;c.fillRect(0,0,1024,1400);
  for(let i=0;i<70000;i++){c.fillStyle=rand()>.55?'#fff8cc13':'#4e2e0f12';c.fillRect(rand()*1024,rand()*1400,rand()*2+1,rand()*3+1);}
  for(let i=0;i<65;i++){c.beginPath();c.fillStyle=`rgba(91,57,13,${rand()*.06})`;c.ellipse(rand()*1024,rand()*1400,rand()*65,rand()*90,rand()*3,0,7);c.fill();}
  for(let i=0;i<10;i++){const x=rand()*1024;line(c,[[x,0],[x+rand()*15,35+rand()*30]],'#78552b55',1);}
  c.strokeStyle='#88653755';c.lineWidth=2;c.strokeRect(40,45,944,1308);
  return [el,c];
}

function words(c,text,x,y,maxWidth,lineHeight,font='italic 31px Cormorant, Georgia',color='#4b3824') {
  c.font=font;c.fillStyle=color;let lineText='';let yy=y;
  for(const word of text.split(' ')){const test=lineText+word+' ';if(c.measureText(test).width>maxWidth&&lineText){c.fillText(lineText.trim(),x,yy);lineText=word+' ';yy+=lineHeight;}else lineText=test;}
  if(lineText)c.fillText(lineText.trim(),x,yy);return yy;
}

function sketchBill(c,x,y,scale=1) {
  c.save();c.translate(x,y);c.scale(scale,scale);
  c.fillStyle='#bd913e55';c.beginPath();c.moveTo(0,-240);c.lineTo(-175,125);c.lineTo(175,125);c.closePath();c.fill();
  line(c,[[0,-240],[-175,125],[175,125],[0,-240]],'#372b22',4);
  for(let i=0;i<7;i++){const yy=-169+i*42,w=(yy+240)/365*175;line(c,[[-w,yy],[w,yy]],'#5a442d88',2);for(let j=-1;j<2;j++){const xx=j*85+(i%2)*40;if(Math.abs(xx)<w)line(c,[[xx,yy],[xx,yy+40]],'#5a442d88',1.5);}}
  c.fillStyle='#ead6a0';c.beginPath();c.moveTo(-65,-70);c.quadraticCurveTo(0,-133,65,-70);c.quadraticCurveTo(0,-5,-65,-70);c.fill();c.strokeStyle='#352a22';c.lineWidth=4;c.stroke();
  c.fillStyle='#28271f';c.beginPath();c.ellipse(0,-70,8,45,0,0,7);c.fill();
  for(let i=-2;i<3;i++){line(c,[[i*22,-97-Math.cos(i*.5)*12],[i*27,-127-Math.cos(i*.5)*15]],'#352a22',3);line(c,[[i*23,-42+Math.cos(i*.5)*4],[i*26,-20+Math.cos(i*.5)*9]],'#352a22',3);}
  c.fillStyle='#322c22';c.fillRect(-27,-342,54,111);c.fillRect(-50,-242,100,13);
  c.beginPath();c.moveTo(-40,53);c.lineTo(0,70);c.lineTo(40,53);c.lineTo(40,88);c.lineTo(0,70);c.lineTo(-40,88);c.closePath();c.fill();
  line(c,[[-110,2],[-204,18],[-234,-43]],'#352c21',6);line(c,[[110,4],[201,48],[243,20]],'#352c21',6);
  line(c,[[-68,125],[-77,190],[-111,193]],'#352c21',7);line(c,[[68,125],[80,187],[109,189]],'#352c21',7);
  c.restore();
}

export function journalTexture(side) {
  const illustrated=illustratedPage(7,side);if(illustrated)return illustrated;
  const [el,c]=paperBase(side==='left'?400:401);
  c.textBaseline='alphabetic';c.textAlign='left';
  if(side==='left') {
    c.font='500 17px Manrope, sans-serif';c.fillStyle='#7a3c2a';c.fillText('CATEGORY: DREAM DEMON',84,100);
    c.font='600 88px Cormorant, Georgia';c.fillStyle='#392c21';c.fillText('BILL CIPHER',79,203);
    line(c,[[84,225],[923,225]],'#5f4528',2);
    words(c,'A being from the space between spaces. A single eye. A thousand terrible intentions.',85,283,840,41,'italic 37px Cormorant, Georgia');
    c.save();c.translate(103,436);c.rotate(-.022);c.font='500 40px Cormorant, Georgia';c.fillStyle='#413321';c.fillText('What I know:',0,0);c.restore();
    let yy=503;
    for(const t of ['He enters through the mind.','He cannot be trusted.','Every promise has a price.']){c.font='400 32px Cormorant, Georgia';c.fillStyle='#493a28';c.fillText('—  '+t,91,yy);yy+=55;}
    c.save();c.translate(494,858);c.rotate(-.12);circle(c,0,0,139);circle(c,0,0,122);circle(c,0,0,158,'#755638',1);for(let i=0;i<8;i++){const a=i*Math.PI/4;circle(c,Math.cos(a)*158,Math.sin(a)*158,12,'#66472b',2);line(c,[[Math.cos(a)*139,Math.sin(a)*139],[Math.cos(a+.78)*139,Math.sin(a+.78)*139]],'#68492e88',1);}line(c,[[0,-83],[-77,61],[77,61],[0,-83]],'#4b3726',3);c.beginPath();c.ellipse(0,7,29,15,0,0,7);c.stroke();line(c,[[0,-5],[0,20]],'#4b3726',3);c.restore();
    words(c,'Eight flames. An open book. An invitation he will not refuse.',123,1083,780,39,'italic 36px Cormorant, Georgia');
    c.save();c.translate(106,1240);c.rotate(-.035);c.font='600 46px Cormorant, Georgia';c.fillStyle='#8b3021';c.fillText('DO NOT MAKE A DEAL.',0,0);line(c,[[-7,12],[757,12]],'#8b3021',3);c.restore();
  } else {
    c.font='italic 34px Cormorant, Georgia';c.fillStyle='#62452b';c.fillText('He is always watching.',236,115);
    sketchBill(c,502,618,1.25);
    c.save();c.translate(100,380);c.rotate(-.14);words(c,'One eye. No mercy.',0,0,180,30,'italic 29px Cormorant, Georgia');c.restore();
    line(c,[[207,395],[300,425],[392,470]],'#8f3c25',2);
    c.save();c.translate(743,695);c.rotate(.08);words(c,'An offer is not a gift.',0,0,185,31,'italic 30px Cormorant, Georgia');c.restore();
    line(c,[[802,642],[770,578],[702,573]],'#8f3c25',2);
    c.font='italic 33px Cormorant, Georgia';c.fillStyle='#8b3323';c.fillText('Never shake his hand.',214,1015);
    line(c,[[206,1027],[821,1020]],'#8b3323',2);
    words(c,'The barrier is thinner than you think. If the sky begins to split, you are already too late.',103,1115,820,40,'italic 34px Cormorant, Georgia');
    c.save();c.translate(858,1260);c.rotate(.2);circle(c,0,0,51,'#8b332388',3);c.font='600 34px Cormorant, Georgia';c.fillStyle='#8b3323';c.textAlign='center';c.fillText('4',0,11);c.restore();
  }
  c.textAlign='center';c.font='400 20px Cormorant, Georgia';c.fillStyle='#7d5d33';c.fillText(side==='left'?'—  136  —':'—  137  —',512,1327);
  const shade=c.createLinearGradient(side==='left'?1024:0,0,side==='left'?810:214,0);shade.addColorStop(0,'#4c2c0c80');shade.addColorStop(.35,'#65431325');shade.addColorStop(1,'#65431300');c.fillStyle=shade;c.fillRect(0,0,1024,1400);
  return texture(el);
}

/** Distinct archive leaves, seen only while the journal searches for Bill's entry. */
export function archiveTexture(index, side='right') {
  const illustrated=illustratedPage(index,side);if(illustrated)return illustrated;
  const subjects=[
    ['GNOMES','Small. Organized. Exceptionally bad at disguises.'],
    ['THE HIDE-BEHIND','Never seen directly. Look over your other shoulder.'],
    ['FLOATING EYES','They watch the roads when the forest is asleep.'],
    ['THE SHAPESHIFTER','A familiar face is not proof of a familiar mind.'],
    ['THE GREMBLOB','Do not feed it. Do not let it feed you.'],
    ['DREAMSCAPES','The mind is a door. Some things have a key.'],
    ['THE WATCHER','A triangle keeps appearing in the margins.'],
  ];
  const [title,note]=subjects[index%subjects.length], [el,c]=paperBase(1100+index*2+(side==='left'?1:0));
  c.font='500 18px Manrope, sans-serif';c.fillStyle='#754830';c.fillText(`FIELD NOTES  /  SPECIMEN ${String(index+1).padStart(2,'0')}`,85,104);
  c.font=`600 ${title.length>16?65:80}px Cormorant, Georgia`;c.fillStyle='#33271c';c.fillText(title,80,211);
  line(c,[[82,240],[940,240]],'#65502f',2);
  words(c,note,89,312,820,44,'italic 38px Cormorant, Georgia','#3d2b1b');
  const x=side==='left'?465:535,y=720;c.save();c.translate(x,y);if(side==='left')c.rotate(-.09);
  if(index===0){
    // Pointed cap, eyes, bulbous nose, and a beard.
    line(c,[[-110,-60],[0,-280],[110,-60],[-110,-60]],'#44301e',4);circle(c,0,15,110,'#44301e',4);circle(c,-36,0,12);circle(c,36,0,12);circle(c,0,34,25);line(c,[[-90,70],[0,250],[90,70]],'#44301e',4);
    for(let i=0;i<8;i++)line(c,[[-65+i*18,87],[-10+i*3,212]],'#61442c77',2);
  }else if(index===1){
    line(c,[[0,-240],[-50,-155],[-120,-180],[-60,-95],[-90,-30],[-43,40],[-54,157],[-100,240]],'#3b3124',8);
    line(c,[[0,-240],[60,-150],[115,-183],[70,-84],[95,-18],[48,50],[64,170],[115,243]],'#3b3124',8);
    circle(c,-19,-135,7);circle(c,24,-135,7);line(c,[[-40,50],[-150,5],[-183,-60]],'#3b3124',7);
  }else if(index===2){
    for(let i=0;i<3;i++){const xx=(i-1)*170,yy=i===1?-70:90;circle(c,xx,yy,85,'#453222',3);circle(c,xx,yy,42,'#453222',3);circle(c,xx,yy,16,'#453222',5);for(let j=0;j<6;j++){const a=j*Math.PI/3;line(c,[[xx+Math.cos(a)*87,yy+Math.sin(a)*87],[xx+Math.cos(a)*115,yy+Math.sin(a)*115]],'#453222',2);}}
  }else if(index===3){
    line(c,[[0,-220],[-75,-170],[-115,-75],[-175,20],[-130,120],[-165,225],[0,160],[165,225],[140,80],[180,-5],[90,-125],[0,-220]],'#453222',4);
    for(let i=-1;i<=1;i++){circle(c,i*50,-90,19);line(c,[[i*20,40],[i*65,115]],'#453222',3);}
    line(c,[[-90,-20],[-50,10],[-20,-10],[10,18],[50,-5],[90,13]],'#453222',4);
  }else if(index===4){
    c.beginPath();c.ellipse(0,20,180,165,0,0,7);c.strokeStyle='#453222';c.lineWidth=4;c.stroke();circle(c,-60,-10,28);circle(c,55,4,32);line(c,[[-90,80],[-40,104],[20,79],[90,92]],'#453222',4);
    for(let i=-2;i<3;i++)line(c,[[i*60,-115],[i*70,-183]],'#453222',3);
  }else if(index===5){
    for(let i=0;i<5;i++){circle(c,0,0,40+i*45,'#60442b',2);line(c,[[Math.cos(i)*210,Math.sin(i)*210],[Math.cos(i+2)*210,Math.sin(i+2)*210]],'#60442b',2);}
    c.font='italic 50px Cormorant, Georgia';c.fillStyle='#803a27';c.fillText('Wake up?',-85,20);
  }else sketchBill(c,0,50,.9);
  c.restore();
  words(c,side==='left'?'Observed after midnight. The patterns repeat, but the creatures do not. More study required.':'Sketch from memory. Keep a safe distance. Record every anomaly. Trust your own eyes.',91,1130,815,41,'italic 34px Cormorant, Georgia','#49311d');
  c.font='italic 32px Cormorant, Georgia';c.fillStyle='#8b3021';c.fillText(side==='left'?'Something is wrong with this forest.':'Further observations on the reverse →',100,1275);
  c.textAlign='center';c.font='22px Cormorant, Georgia';c.fillStyle='#755331';c.fillText(`—  ${121+index*2+(side==='right'?1:0)}  —`,512,1330);
  return texture(el);
}

export function pageEdgesTexture() {
  const [el,c]=canvas(128,512),rand=seeded(98);c.fillStyle='#c6af7a';c.fillRect(0,0,128,512);
  for(let y=0;y<512;y+=4+rand()*7){c.strokeStyle=rand()>.5?'#57432260':'#f6dfac77';c.lineWidth=rand()+.5;c.beginPath();c.moveTo(0,y);c.lineTo(128,y+rand()*2);c.stroke();}
  return texture(el);
}

export function runeTexture() {
  const [el,c]=canvas(1024),gold='#b19a6266';c.translate(512,512);
  circle(c,0,0,410,gold,2);circle(c,0,0,390,gold,1);circle(c,0,0,320,'#b19a6233',1);
  for(let i=0;i<24;i++){const a=i*Math.PI/12;c.save();c.rotate(a);line(c,[[0,-400],[0,-410]],gold,2);c.font='18px Georgia';c.fillStyle='#b19a6299';c.textAlign='center';c.fillText(['⟁','⊙','⋈','⟡','⊥','∴','Ψ','⌁'][i%8],0,-355);c.restore();}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,[[Math.cos(a)*320,Math.sin(a)*320],[Math.cos(a+Math.PI*.75)*320,Math.sin(a+Math.PI*.75)*320]],'#b19a6216',1);}
  return texture(el);
}
