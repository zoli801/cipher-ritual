import * as THREE from 'three';
import { stoneTexture, floorTexture, glowTexture, coverTexture, journalTexture, archiveTexture, pageEdgesTexture, runeTexture, seeded } from './textures.js';
import { clamp, smooth, easeOut, durations } from './ritual.js';
import { pageStackAt, handshakeAt, transformationAt } from './animation.js';
export { preloadJournalArt } from './journal-art.js';

const UP = new THREE.Vector3(0, 1, 0);
const GOLD = 0xd3b16e;
const rand = seeded(618);
const mix = THREE.MathUtils.lerp;

function mesh(geometry, material, parent, position = [0,0,0], rotation) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...position);
  if (rotation) m.rotation.set(...rotation);
  parent.add(m); return m;
}
function standard(color, extras = {}) { return new THREE.MeshStandardMaterial({ color, roughness:.82, ...extras }); }
function line(points, material, parent) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),material);parent.add(l);return l; }
function tube(points, radius, material, parent) {
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(new THREE.TubeGeometry(curve,24,radius,6,false),material,parent);
}

const portalVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const portalFragment = `
varying vec2 vUv;uniform float uTime;uniform float uOpacity;
float noise(vec2 p){return sin(p.x*13.+sin(p.y*7.))*cos(p.y*11.+sin(p.x*5.));}
void main(){vec2 p=vUv*2.-1.;float r=length(p);float a=atan(p.y,p.x);float t=uTime;
float edge=.78+sin(a*13.+t*2.)*.019+sin(a*23.-t*3.)*.012;
float ring=exp(-abs(r-edge)*65.);float halo=exp(-abs(r-edge)*14.);float inner=smoothstep(edge+.01,edge-.09,r);
float swirl=.5+.5*sin(a*5.+r*22.-t*3.+noise(p*2.+t*.2)*1.5);
vec3 color=vec3(.01,.055,.13)*inner+vec3(.015,.21,.42)*swirl*inner*.7+vec3(.24,.84,1.)*ring+vec3(.04,.28,.8)*halo;
float alpha=(inner*.96+halo*.25+ring*.45)*uOpacity;gl_FragColor=vec4(color,clamp(alpha,0.,1.));}`;
const skyFragment=`varying vec2 vUv;uniform float uTime;uniform float uProgress;
void main(){vec2 p=vUv;float clouds=sin(p.x*34.+sin(p.y*17.+uTime*.06)*3.)*.5+.5;clouds*=sin(p.y*37.-p.x*12.+uTime*.05)*.5+.5;
vec3 dark=mix(vec3(.14,.08,.12),vec3(.64,.2,.12),uProgress);vec3 col=mix(dark,vec3(.07,.09,.15),p.y);col+=vec3(.38,.16,.08)*clouds*.35;gl_FragColor=vec4(col,1.);}`;

export class Chamber {
  constructor(canvas, onLost) {
    this.canvas=canvas;this.mobile=innerWidth<761;this.reduced=false;this.lastStage='loading';this.elapsed=0;
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));this.renderer.setSize(innerWidth,innerHeight);
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x111914);this.scene.fog=new THREE.FogExp2(0x111914,.033);
    this.camera=new THREE.PerspectiveCamera(41,innerWidth/innerHeight,.1,180);
    this.raycaster=new THREE.Raycaster();this.v=new THREE.Vector3();this.look=new THREE.Vector3();this.pointer={x:0,y:0};
    this.room=new THREE.Group();this.scene.add(this.room);this.createEnvironment();this.createBook();this.createCandles();this.createLighter();this.createDust();this.createPortal();this.createBill();this.createHand();this.createApocalypse();
    this.resize();
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();onLost?.();});
  }
  createEnvironment(){
    const stone=stoneTexture(), floor=floorTexture();
    const stoneMat=standard(0xa3a58a,{map:stone});this.stoneMat=stoneMat;
    const floorMat=standard(0x9d9c80,{map:floor});
    mesh(new THREE.PlaneGeometry(44,44),floorMat,this.room,[0,-.05,0],[-Math.PI/2,0,0]).receiveShadow=true;
    const blocks=[];const dummy=new THREE.Object3D();
    for(let row=0;row<8;row++)for(let col=-9;col<=9;col++){
      const x=col*1.11+(row%2)*.55,y=row*.78+.39;
      if(Math.abs(x)<1.7&&y<3.25)continue;
      if(x*x+(y-3.05)*(y-3.05)<2.7&&y>=3.05)continue;
      blocks.push([x,y,-6.5,1.08,.75,.68]);
    }
    for(const s of [-1,1])for(let row=0;row<8;row++)for(let col=-5;col<9;col++)blocks.push([s*9.4,row*.78+.39,col*1.12-1,.7,.75,1.09]);
    const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),stoneMat,blocks.length);
    blocks.forEach((b,i)=>{dummy.position.set(...b.slice(0,3));dummy.scale.set(...b.slice(3));dummy.rotation.set((rand()-.5)*.012,(rand()-.5)*.015,(rand()-.5)*.01);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);inst.setColorAt(i,new THREE.Color().setScalar(.66+rand()*.34));});
    inst.receiveShadow=true;inst.castShadow=true;this.room.add(inst);
    const archMat=standard(0x82846a,{map:stone});
    for(let i=0;i<13;i++){
      const a=i/12*Math.PI,m=mesh(new THREE.BoxGeometry(.48,.62,.93),archMat,this.room,[Math.cos(a)*1.8,3.1+Math.sin(a)*1.8,-6.05]);m.rotation.z=a-Math.PI/2;m.castShadow=true;
    }
    for(const x of [-1.8,1.8])mesh(new THREE.BoxGeometry(.5,3.2,.9),archMat,this.room,[x,1.6,-6.05]);
    mesh(new THREE.PlaneGeometry(3.2,5.3),new THREE.MeshBasicMaterial({color:0x020603}),this.room,[0,2.6,-7.0]);
    mesh(new THREE.PlaneGeometry(2.1,3.7),new THREE.MeshBasicMaterial({color:0x080f0a}),this.room,[0,1.85,-6.99]);
    for(const x of [-6,6])for(const z of [-4.7,3.2]){
      const p=new THREE.Group();p.position.set(x,0,z);this.room.add(p);
      mesh(new THREE.BoxGeometry(1.2,.3,1.2),stoneMat,p,[0,.15,0]);
      mesh(new THREE.BoxGeometry(.95,.3,.95),stoneMat,p,[0,.45,0]);
      mesh(new THREE.CylinderGeometry(.36,.48,6.0,8),stoneMat,p,[0,3.5,0]).castShadow=true;
      for(const y of [1.1,5.8,6.3])mesh(new THREE.CylinderGeometry(.56,.56,.19,8),stoneMat,p,[0,y,0]);
      mesh(new THREE.BoxGeometry(1.1,.35,1.1),stoneMat,p,[0,6.65,0]);
    }
    this.ceiling=new THREE.Group();this.room.add(this.ceiling);
    this.ceiling.visible=false;
    for(let z=-6;z<8;z+=2.6)mesh(new THREE.BoxGeometry(19,.45,.45),stoneMat,this.ceiling,[0,7.2,z]);
    const metal=standard(0x24271e,{metalness:.6,roughness:.55});
    for(const x of [-4.1,4.1]){
      mesh(new THREE.BoxGeometry(.23,.6,.3),metal,this.room,[x,2.8,-6.0]);
      const bowl=mesh(new THREE.ConeGeometry(.23,.27,8),metal,this.room,[x,2.86,-5.76]);bowl.rotation.z=Math.PI;
      const l=new THREE.PointLight(0xffaf55,19,8,2);l.position.set(x,3.15,-5.55);this.room.add(l);
      const fire=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0xffb363,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));fire.position.copy(l.position);fire.scale.set(.42,.75,1);this.room.add(fire);
    }
    this.hemi=new THREE.HemisphereLight(0xb1bfad,0x313526,1.25);this.scene.add(this.hemi);
    this.key=new THREE.SpotLight(0xffd7a0,155,35,Math.PI*.24,.75,1.6);this.key.position.set(2,8.5,3);this.key.target.position.set(1,0,0);this.key.castShadow=true;this.key.shadow.mapSize.set(1024,1024);this.key.shadow.bias=-.0006;this.key.shadow.normalBias=.04;this.scene.add(this.key,this.key.target);
    this.rim=new THREE.DirectionalLight(0x839d8b,1.5);this.rim.position.set(-5,6,-3);this.scene.add(this.rim);
    const shaftMat=new THREE.MeshBasicMaterial({color:0xb4bb8c,transparent:true,opacity:.018,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    for(let i=0;i<3;i++){const beam=mesh(new THREE.CylinderGeometry(.12,1.25,9,16,1,true),shaftMat,this.room,[-4.8+i*.65,4,-3+i*.2]);beam.rotation.z=-.32;beam.rotation.x=.18;}
    // Scattered chips, bones, and floor debris give the room scale.
    const chips=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),stoneMat,95);
    for(let i=0;i<95;i++){const a=rand()*Math.PI*2,r=3.6+rand()*6;dummy.position.set(Math.cos(a)*r,.03,Math.sin(a)*r);dummy.scale.set(.03+rand()*.15,.03+rand()*.05,.04+rand()*.13);dummy.rotation.set(rand()*2,rand()*4,rand()*2);dummy.updateMatrix();chips.setMatrixAt(i,dummy.matrix);}chips.receiveShadow=true;this.room.add(chips);
  }
  createBook(){
    this.book=new THREE.Group();this.book.position.set(1.25,.15,0);this.book.rotation.y=-.13;this.room.add(this.book);
    this.bookOrigin=this.book.position.clone();
    const leather=standard(0x3b2020,{roughness:.78}),edge=standard(0xe1ca8c,{map:pageEdgesTexture(),roughness:.95});
    this.paperLeft=new THREE.MeshBasicMaterial({map:journalTexture('left'),toneMapped:false});this.paperRight=new THREE.MeshBasicMaterial({map:journalTexture('right'),toneMapped:false});
    const gold=standard(0xab854b,{metalness:.64,roughness:.43});
    mesh(new THREE.BoxGeometry(2.42,.12,3.2),leather,this.book,[0,.02,0]).castShadow=true;
    mesh(new THREE.BoxGeometry(.18,.38,3.2),leather,this.book,[-1.18,.2,0]);
    this.rightPages=mesh(new THREE.BoxGeometry(2.23,1,2.99),edge,this.book,[0,.25,0]);this.rightPages.scale.y=.34;this.rightPages.castShadow=true;
    this.leftPages=mesh(new THREE.BoxGeometry(2.23,1,2.99),edge,this.book,[-2.37,.09,0]);this.leftPages.visible=false;
    const surface=(left)=>{const g=new THREE.PlaneGeometry(2.23,2.99,32,8),p=g.attributes.position;for(let i=0;i<p.count;i++){const u=(p.getX(i)+1.115)/2.23;p.setZ(i,.055*Math.pow(left?u:1-u,3)+Math.sin(u*Math.PI)*.025);}g.computeVertexNormals();return g;};
    this.rightSurface=mesh(surface(false),this.paperRight,this.book,[0,.423,0],[-Math.PI/2,0,0]);
    this.leftSurface=mesh(surface(true),this.paperLeft,this.book,[-2.37,.093,0],[-Math.PI/2,0,0]);this.leftSurface.visible=false;
    this.hinge=new THREE.Group();this.hinge.position.set(-1.19,.47,0);this.book.add(this.hinge);
    this.cover=mesh(new THREE.BoxGeometry(2.42,.12,3.2),[leather,leather,standard(0xffffff,{map:coverTexture(),roughness:.66}),standard(0xb99b65,{roughness:1}),leather,leather],this.hinge,[1.19,.02,0]);this.cover.castShadow=true;
    for(const x of [.11,2.26])for(const z of [-1.43,1.43]){
      mesh(new THREE.BoxGeometry(.23,.017,.055),gold,this.hinge,[x,.09,z]);mesh(new THREE.BoxGeometry(.055,.017,.23),gold,this.hinge,[x,.09,z]);
      mesh(new THREE.SphereGeometry(.025,6,5),gold,this.hinge,[x,.105,z]);
    }
    for(const z of [-1.15,-.8,.8,1.15])mesh(new THREE.BoxGeometry(.21,.4,.055),gold,this.book,[-1.2,.19,z]);
    const ribbon=mesh(new THREE.BoxGeometry(.13,.015,1.1),standard(0x6d2020),this.book,[.8,.08,1.5]);ribbon.rotation.y=.15;
    this.leaves=[];this.archiveRight=[];this.archiveLeft=[];
    for(let i=0;i<8;i++){
      this.archiveRight.push(i===7?this.paperRight:new THREE.MeshBasicMaterial({map:archiveTexture(i,'right'),toneMapped:false}));
      this.archiveLeft.push(i===7?this.paperLeft:new THREE.MeshBasicMaterial({map:archiveTexture(i,'left'),toneMapped:false}));
    }
    for(let i=0;i<7;i++){
      const frontMap=this.archiveRight[i].map,leftMap=this.archiveLeft[i+1].map,backMap=leftMap.clone();backMap.repeat.x=-leftMap.repeat.x;backMap.offset.x=leftMap.offset.x+leftMap.repeat.x;backMap.needsUpdate=true;
      const pivot=new THREE.Group();pivot.position.set(-1.12,.43,0);this.book.add(pivot);
      const geometry=new THREE.PlaneGeometry(2.2,2.98,24,8);
      const leaf=mesh(geometry,new THREE.MeshBasicMaterial({map:frontMap,side:THREE.FrontSide,toneMapped:false}),pivot,[1.1,.002,0],[-Math.PI/2,0,0]);
      mesh(geometry,new THREE.MeshBasicMaterial({map:backMap,side:THREE.BackSide,toneMapped:false}),pivot,[1.1,-.002,0],[-Math.PI/2,0,0]);
      pivot.visible=false;this.leaves.push({pivot,leaf,geometry});
    }
    const rune=mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({map:runeTexture(),transparent:true,opacity:.5,depthWrite:false}),this.room,[1.25,.012,0],[-Math.PI/2,0,0]);this.rune=rune;
  }
  createCandles(){
    this.candles=[];const wax=standard(0xcfbf91,{roughness:.93}),burnt=standard(0x18140f),brass=standard(0x5e5034,{metalness:.65,roughness:.5});const glow=glowTexture();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+.15;const group=new THREE.Group();group.position.set(1.25+Math.sin(a)*2.72,0,Math.cos(a)*2.48);this.room.add(group);
      const h=.38+rand()*.38,r=.12+rand()*.025;
      mesh(new THREE.CylinderGeometry(.29,.23,.035,24),brass,group,[0,.025,0]).receiveShadow=true;
      mesh(new THREE.TorusGeometry(.265,.019,6,24),brass,group,[0,.045,0],[Math.PI/2,0,0]);
      const body=mesh(new THREE.CylinderGeometry(r,r*1.05,h,18,1),wax,group,[0,h/2+.05,0]);body.castShadow=true;body.receiveShadow=true;
      mesh(new THREE.CylinderGeometry(r*.92,r,.025,18),standard(0xe0cfa0),group,[0,h+.05,0]);
      mesh(new THREE.CylinderGeometry(.016,.02,.09,6),burnt,group,[0,h+.09,0]);
      for(let j=0;j<5;j++){const aa=rand()*7,hh=.05+rand()*h*.5;mesh(new THREE.CapsuleGeometry(.017,hh,3,5),wax,group,[Math.cos(aa)*r,h+.02-hh*.5,Math.sin(aa)*r]);}
      const flame=new THREE.Group();flame.position.set(0,h+.18,0);group.add(flame);flame.visible=false;
      const f=mesh(new THREE.SphereGeometry(1,10,10),new THREE.MeshBasicMaterial({color:0xffd18c}),flame,[0,.012,0]);f.scale.set(.042,.105,.042);
      const core=mesh(new THREE.SphereGeometry(1,8,8),new THREE.MeshBasicMaterial({color:0xffffd9}),flame,[0,-.025,.004]);core.scale.set(.023,.065,.025);
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0xffb650,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));sprite.scale.set(.85,1.1,1);flame.add(sprite);
      const light=new THREE.PointLight(0xffb14f,0,5.5,2);light.position.set(0,h+.29,0);group.add(light);
      this.candles.push({group,flame,light,height:h,lit:false,litAt:0,position:new THREE.Vector3(group.position.x,h+.16,group.position.z)});
    }
  }
  createLighter(){
    this.lighter=new THREE.Group();this.lighter.position.set(4.67,.12,1.8);this.lighter.rotation.set(-Math.PI/2,0,.4);this.room.add(this.lighter);
    const brass=standard(0xb89962,{metalness:.78,roughness:.34}),steel=standard(0x8a8b7d,{metalness:.8,roughness:.4});
    mesh(new THREE.BoxGeometry(.33,.48,.15),brass,this.lighter,[0,.05,0]).castShadow=true;
    mesh(new THREE.BoxGeometry(.34,.14,.16),brass,this.lighter,[-.02,.41,-.01],[0,0,-.45]);
    mesh(new THREE.BoxGeometry(.13,.17,.12),steel,this.lighter,[-.06,.355,0]);
    mesh(new THREE.CylinderGeometry(.065,.065,.15,12),steel,this.lighter,[.095,.32,0],[Math.PI/2,0,0]);
    for(let i=0;i<4;i++)mesh(new THREE.BoxGeometry(.006,.32,.005),standard(0x6b5336,{metalness:.5}),this.lighter,[-.1+i*.04,.04,.078]);
    this.lighterScreenPoint=new THREE.Vector3(4.67,.18,1.8);
  }
  createDust(){
    const count=this.mobile?160:320,pos=new Float32Array(count*3);this.dustBase=[];
    for(let i=0;i<count;i++){const p=[(rand()-.5)*16,rand()*7,(rand()-.5)*14];this.dustBase.push(p);pos.set(p,i*3);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    this.dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0xd9c898,size:.018,transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending}));this.room.add(this.dust);
  }
  eye(parent, scale=1, color=0xf4eccb){
    const group=new THREE.Group();group.scale.setScalar(scale);parent.add(group);
    const shape=new THREE.Shape();shape.moveTo(-.57,0);shape.quadraticCurveTo(0,.64,.57,0);shape.quadraticCurveTo(0,-.59,-.57,0);
    mesh(new THREE.ShapeGeometry(shape,32),new THREE.MeshBasicMaterial({color:0x1b201a}),group,[0,0,0]);
    const white=mesh(new THREE.ShapeGeometry(shape,32),new THREE.MeshBasicMaterial({color}),group,[0,0,.012]);white.scale.set(.92,.86,1);
    const pupil=mesh(new THREE.SphereGeometry(1,18,16),new THREE.MeshBasicMaterial({color:0x151b17}),group,[0,0,.04]);pupil.scale.set(.07,.32,.04);
    mesh(new THREE.SphereGeometry(.037,10,8),new THREE.MeshBasicMaterial({color:0xffffff}),group,[-.025,.11,.08]);
    const lashMat=new THREE.LineBasicMaterial({color:0x141b16});
    for(let i=-2;i<=2;i++){
      const x=i*.18,y=.22-Math.abs(i)*.05;
      line([[x,y,0],[x*1.23,y+.19,0]],lashMat,group);
      line([[x,-y*.9,0],[x*1.22,-y-.14,0]],lashMat,group);
    }
    return {group,pupil};
  }
  createPortal(){
    this.portal=new THREE.Group();this.portal.position.set(1.3,2.55,-2.3);this.scene.add(this.portal);this.portal.visible=false;
    this.portalMat=new THREE.ShaderMaterial({vertexShader:portalVertex,fragmentShader:portalFragment,uniforms:{uTime:{value:0},uOpacity:{value:1}},transparent:true,side:THREE.DoubleSide,depthWrite:false});
    mesh(new THREE.PlaneGeometry(7.8,7.8),this.portalMat,this.portal);
    this.portalEye=this.eye(this.portal,2.4,0xd5f8ff);this.portalEye.group.position.z=.06;
    this.portalLight=new THREE.PointLight(0x2dc8ff,0,18,2);this.portalLight.position.set(1.3,2.6,-1.2);this.scene.add(this.portalLight);
    this.portalLines=new THREE.Group();this.portal.add(this.portalLines);
    const blue=new THREE.LineBasicMaterial({color:0x80e8ff,transparent:true,opacity:.55});
    for(let j=0;j<12;j++){
      const a=j/12*Math.PI*2,points=[];
      for(let k=0;k<7;k++){const aa=a+k*.012,r=3.0+(rand()-.5)*.18;points.push([Math.cos(aa)*r,Math.sin(aa)*r,.07]);}
      line(points,blue,this.portalLines);
    }
  }
  createBill(){
    this.bill=new THREE.Group();this.bill.position.set(2.2,2.7,-.4);this.scene.add(this.bill);this.bill.visible=false;
    const shape=new THREE.Shape();shape.moveTo(0,1.7);shape.lineTo(-1.32,-.8);shape.lineTo(1.32,-.8);shape.closePath();
    this.billGold=standard(0xf1c847,{metalness:.2,roughness:.62,emissive:0xc68b11,emissiveIntensity:.2});
    this.billDark=standard(0x111912,{metalness:.1,roughness:.58});this.billInk=new THREE.LineBasicMaterial({color:0x96732d,transparent:true,opacity:.65});
    this.billBody=mesh(new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:2}),this.billGold,this.bill,[0,0,-.12]);this.billBody.castShadow=true;
    this.billBody.geometry.computeBoundingBox();this.billFrontZ=this.billBody.geometry.boundingBox.max.z;
    this.bricks=new THREE.Group();this.bill.add(this.bricks);
    for(let i=0;i<7;i++){
      const y=-.68+i*.33,w=(1.7-y)/2.5*1.32;
      line([[-w,y,.17],[w,y,.17]],this.billInk,this.bricks);
      for(let j=-2;j<3;j++){const x=j*.65+(i%2)*.33;if(Math.abs(x)<w-.15)line([[x,y,.171],[x,y+.33,.171]],this.billInk,this.bricks);}
    }
    this.billEye=this.eye(this.bill,1.04);this.billEye.group.position.set(0,.38,.21);
    mesh(new THREE.CylinderGeometry(.25,.28,.9,10),this.billDark,this.bill,[0,2.13,-.01]);
    mesh(new THREE.CylinderGeometry(.53,.53,.075,16),this.billDark,this.bill,[0,1.71,-.01]);
    this.bow=new THREE.Group();this.bill.add(this.bow);this.bow.position.set(0,-.43,.19);
    for(const side of [-1,1]){
      const wing=new THREE.Shape();wing.moveTo(side*.045,0);wing.lineTo(side*.29,.145);wing.lineTo(side*.29,-.145);wing.closePath();
      mesh(new THREE.ExtrudeGeometry(wing,{depth:.035,bevelEnabled:false}),this.billDark,this.bow);
    }
    mesh(new THREE.SphereGeometry(.075,12,10),this.billDark,this.bow,[0,0,.025]).scale.set(.9,1.1,.55);
    for(const side of [-1,1]){
      tube([[side*.43,-.8,0],[side*.5,-1.23,.03],[side*.48,-1.51,.16],[side*.79,-1.52,.18]],.038,this.billDark,this.bill);
      const shoe=mesh(new THREE.SphereGeometry(1,12,10),this.billDark,this.bill,[side*.68,-1.52,.17]);shoe.scale.set(.22,.075,.11);
    }
    this.billArm=new THREE.Group();this.billArm.position.set(-.96,-.12,0);this.bill.add(this.billArm);
    this.leftArmTube=tube([[0,0,0],[-.55,-.05,.05],[-.95,.22,.2],[-1.19,.27,.45]],.038,this.billDark,this.billArm);
    this.billPalm=new THREE.Group();this.billPalm.position.set(-1.26,.27,.47);this.billPalm.rotation.z=-.6;this.billArm.add(this.billPalm);
    const glove=standard(0x111912,{roughness:.7,emissive:0x136b85,emissiveIntensity:0});this.gloveMaterial=glove;
    const palm=mesh(new THREE.SphereGeometry(1,16,12),glove,this.billPalm);palm.scale.set(.17,.2,.09);
    for(let i=0;i<4;i++){
      const f=mesh(new THREE.CapsuleGeometry(.041,.18,4,8),glove,this.billPalm,[-.105+i*.069,.18+Math.sin(i)*.025,0]);f.rotation.z=(1.5-i)*.12;
    }
    const thumb=mesh(new THREE.CapsuleGeometry(.05,.13,4,8),glove,this.billPalm,[.18,-.005,0]);thumb.rotation.z=-.8;
    this.dealFlames=new THREE.Group();this.billPalm.add(this.dealFlames);this.dealFlames.visible=false;
    this.dealFlame=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0x16bfff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));this.dealFlame.scale.set(1.2,1.6,1);this.dealFlame.position.set(0,.2,0);this.dealFlames.add(this.dealFlame);
    this.flameTips=[];
    for(let i=0;i<8;i++){const f=mesh(new THREE.SphereGeometry(1,8,8),new THREE.MeshBasicMaterial({color:i%2?0x68e6ff:0x1282ff,transparent:true,opacity:.74,depthWrite:false,blending:THREE.AdditiveBlending}),this.dealFlames,[Math.cos(i*.83)*.18,.18+Math.sin(i)*.07,.08]);f.scale.set(.035,.19+rand()*.14,.03);this.flameTips.push(f);}
    this.dealLight=new THREE.PointLight(0x45cfff,0,5,2);this.scene.add(this.dealLight);
    this.otherArm=new THREE.Group();this.otherArm.position.set(.98,-.1,0);this.bill.add(this.otherArm);
    this.rightArmTube=tube([[0,0,0],[.52,.23,.02],[.78,.74,.1]],.038,this.billDark,this.otherArm);
    this.otherHand=new THREE.Group();this.otherHand.position.set(.80,.81,.1);this.otherArm.add(this.otherHand);
    mesh(new THREE.SphereGeometry(.13,12,8),this.billDark,this.otherHand).scale.y=1.3;
    for(let i=0;i<3;i++)tube([[-.03+i*.065,-.01,0],[-.02+i*.09,.24-i*.045,0]],.031,this.billDark,this.otherHand);
    this.foldAmount=-1;
    this.billLight=new THREE.PointLight(0xffd369,0,13,2);this.billLight.position.set(2.2,3.0,1);this.scene.add(this.billLight);
  }
  createHand(){
    this.hand=new THREE.Group();this.camera.add(this.hand);this.scene.add(this.camera);this.hand.visible=false;
    const sleeve=standard(0x323d43,{roughness:.95}),cuff=standard(0x667270),skin=standard(0xc99c75,{roughness:.78,emissive:0x2191b7,emissiveIntensity:0});this.skinMaterial=skin;
    mesh(new THREE.CylinderGeometry(.13,.24,3.5,16),sleeve,this.hand,[0,-2.12,-.025]);
    mesh(new THREE.CylinderGeometry(.135,.14,.14,16),cuff,this.hand,[0,-.40,-.02]);
    mesh(new THREE.CylinderGeometry(.105,.12,.22,14),skin,this.hand,[0,-.28,-.02]);
    const shape=new THREE.Shape();shape.moveTo(-.11,-.24);shape.quadraticCurveTo(-.19,-.08,-.18,.15);shape.quadraticCurveTo(0,.24,.17,.14);shape.quadraticCurveTo(.2,-.10,.11,-.24);shape.closePath();
    mesh(new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:3}),skin,this.hand,[0,0,-.06]);
    this.fingers=[];
    const nail=standard(0xd5b79c,{roughness:.48});
    for(let i=0;i<4;i++){
      const lengths=[.32,.39,.36,.28],length=lengths[i],r=[.041,.044,.041,.034][i];
      const base=new THREE.Group();base.position.set(-.134+i*.087,.15+Math.sin(i*.9)*.026,-.005);base.rotation.z=(1.5-i)*.035;this.hand.add(base);
      const second=new THREE.Group(),third=new THREE.Group();
      const a=length*.46,b=length*.32,d=length*.22;
      mesh(new THREE.CapsuleGeometry(r,a-r,6,10),skin,base,[0,a/2,0]);mesh(new THREE.SphereGeometry(r*1.03,10,8),skin,base,[0,a,0]);
      second.position.y=a;base.add(second);mesh(new THREE.CapsuleGeometry(r*.93,b-r*.7,6,10),skin,second,[0,b/2,0]);
      third.position.y=b;second.add(third);mesh(new THREE.CapsuleGeometry(r*.86,d-r*.5,6,10),skin,third,[0,d/2,0]);
      const n=mesh(new THREE.SphereGeometry(1,10,8),nail,third,[0,d*.5,r*.75]);n.scale.set(r*.66,d*.38,.009);
      this.fingers.push({base,second,third});
    }
    this.thumb=new THREE.Group();this.thumb.position.set(-.16,-.085,-.005);this.thumb.rotation.z=.8;this.hand.add(this.thumb);
    mesh(new THREE.CapsuleGeometry(.055,.13,6,10),skin,this.thumb,[0,.08,0]);
    this.thumbTip=new THREE.Group();this.thumbTip.position.set(0,.17,0);this.thumb.add(this.thumbTip);
    mesh(new THREE.CapsuleGeometry(.046,.11,6,10),skin,this.thumbTip,[0,.06,0]);
    this.handGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0x20bdff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));this.handGlow.position.set(0,.04,.1);this.handGlow.scale.set(1.2,1.5,1);this.hand.add(this.handGlow);this.handGlow.visible=false;
    this.handFill=new THREE.PointLight(0x65daff,0,3,2);this.handFill.position.set(0,.15,.6);this.hand.add(this.handFill);
    this.hand.scale.setScalar(.72);
  }
  poseArms(fold=0){
    if(Math.abs(fold-this.foldAmount)<.001)return;this.foldAmount=fold;
    const leftOpen=[[0,0,0],[-.55,-.05,.05],[-.95,.22,.2],[-1.19,.27,.45]],leftFold=[[0,0,.12],[-.15,-.38,.4],[.55,-.42,.49],[1.45,-.22,.5]];
    const rightOpen=[[0,0,0],[.52,.23,.02],[.7,.55,.08],[.78,.74,.1]],rightFold=[[0,0,.14],[.13,-.4,.45],[-.5,-.55,.64],[-1.45,-.3,.67]];
    for(const [tubeMesh,a,b] of [[this.leftArmTube,leftOpen,leftFold],[this.rightArmTube,rightOpen,rightFold]]){
      const points=a.map((p,i)=>new THREE.Vector3(...p).lerp(new THREE.Vector3(...b[i]),fold));
      tubeMesh.geometry.dispose();tubeMesh.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.038,8,false);
    }
    this.billPalm.position.set(mix(-1.26,1.45,fold),mix(.27,-.22,fold),mix(.47,.51,fold));this.billPalm.rotation.z=mix(-.6,-1.45,fold);
    this.otherHand.position.set(mix(.8,-1.45,fold),mix(.81,-.3,fold),mix(.1,.68,fold));this.otherHand.rotation.z=mix(0,1.45,fold);
  }
  createApocalypse(){
    this.sky=new THREE.Group();this.scene.add(this.sky);this.sky.visible=false;
    this.skyMat=new THREE.ShaderMaterial({vertexShader:portalVertex,fragmentShader:skyFragment,uniforms:{uTime:{value:0},uProgress:{value:0}},side:THREE.BackSide,depthWrite:false});
    mesh(new THREE.SphereGeometry(75,48,24),this.skyMat,this.sky,[0,15,0]);
    this.cracks=new THREE.Group();this.cracks.position.set(0,23,-22);this.sky.add(this.cracks);
    const crackMat=new THREE.MeshBasicMaterial({color:0xffe3ad}),crackGlow=new THREE.LineBasicMaterial({color:0xff5840,transparent:true,opacity:.75});
    // Branches are drawn as thin 3D tubes so the tear has real width at every resolution.
    const paths=[[[0,-13,0],[.4,-9,0],[-.5,-6,0],[.3,-3,0],[0,0,0],[1.4,4,0],[.8,8,0],[2,14,0]],[[.2,-3,0],[-3,-1,0],[-4.6,1,0],[-8,1.5,0],[-10,5,0]],[[.8,7,0],[-2,9,0],[-2.5,13,0],[-5,15,0]],[[.2,-5,0],[3,-3,0],[5,-4,0],[8,-2.5,0],[12,-2,0]],[[.3,1,0],[4,3,0],[6,6,0],[9,7,0]]];
    for(const p of paths){tube(p,.035,crackMat,this.cracks);line(p.map(v=>[v[0]+.11,v[1],v[2]-.02]),crackGlow,this.cracks);}
    const tear=new THREE.Shape();tear.moveTo(0,-12);tear.lineTo(-.3,-7);tear.lineTo(.45,-4);tear.lineTo(-.7,0);tear.lineTo(.5,4);tear.lineTo(.4,12);tear.lineTo(1.25,4);tear.lineTo(.8,0);tear.lineTo(1,-4);tear.lineTo(.2,-8);tear.closePath();
    this.tear=mesh(new THREE.ShapeGeometry(tear),new THREE.MeshBasicMaterial({color:0xf4cc89}),this.cracks,[0,0,-.03]);
    const mountainMat=standard(0x241d23,{roughness:1});
    for(let i=0;i<15;i++){
      const m=mesh(new THREE.ConeGeometry(4+rand()*5,8+rand()*8,4),mountainMat,this.sky,[-45+i*6,6,-35-rand()*12]);m.rotation.y=rand()*3;
    }
    const voidMat=standard(0x2e2429,{roughness:1});this.floating=[];
    for(let i=0;i<20;i++){const m=mesh(new THREE.DodecahedronGeometry(.2+rand()*.6,0),voidMat,this.sky,[(rand()-.5)*24,12+rand()*17,-8-rand()*20]);m.rotation.set(rand()*4,rand()*4,rand()*4);this.floating.push(m);}
    this.skyLight=new THREE.HemisphereLight(0xffa08b,0x272637,0);this.scene.add(this.skyLight);
    this.debris=[];const debrisMat=this.stoneMat;
    for(let i=0;i<(this.mobile?35:65);i++){
      const m=mesh(new THREE.DodecahedronGeometry(.12+rand()*.32,0),debrisMat,this.scene,[(rand()-.5)*12,6+rand()*5,(rand()-.5)*8]);m.visible=false;m.scale.set(1,.5+rand(),1);this.debris.push({mesh:m,base:m.position.clone(),speed:1+rand()*3,spin:[rand(),rand(),rand()]});
    }
    // These rings belong to Bill himself; the finale never swaps in a second model.
    const ringMat=new THREE.MeshBasicMaterial({color:0xff8763,transparent:true,opacity:.42});this.orbitRings=[];
    for(let i=0;i<3;i++){const r=mesh(new THREE.TorusGeometry(2.25+i*.35,.008,5,100),ringMat,this.bill,[0,.1,0],[Math.PI*.28+i*.7,.45+i*.4,0]);r.visible=false;this.orbitRings.push(r);}
  }
  resize(){
    this.mobile=innerWidth<761;this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
    this.homePosition=new THREE.Vector3(...(this.mobile?[1.25,12.7,17.9]:[.1,8.6,12.8]));
    this.homeTarget=new THREE.Vector3(...(this.mobile?[1.25,0,0]:[0,.7,0]));
    if(this.mobile){const factor=Math.max(1,.63/this.camera.aspect);this.homePosition.sub(this.homeTarget).multiplyScalar(factor).add(this.homeTarget);}
    this.camera.position.copy(this.homePosition);this.look.copy(this.homeTarget);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.5:1.65));
  }
  light(index,time){const c=this.candles[index];if(!c)return;c.lit=true;c.litAt=time;c.flame.visible=true;}
  reset(){
    for(const c of this.candles){c.lit=false;c.flame.visible=false;c.light.intensity=0;}
    this.book.visible=true;this.book.position.copy(this.bookOrigin);this.book.rotation.set(0,-.13,0);this.book.scale.setScalar(1);this.hinge.rotation.z=0;this.hinge.position.y=.47;this.leftPages.visible=false;this.leftSurface.visible=false;
    this.rightPages.scale.y=.34;this.rightPages.position.y=.25;this.rightSurface.material=this.archiveRight[0];this.rightSurface.position.y=.423;
    this.leaves.forEach(l=>l.pivot.visible=false);this.lighter.visible=true;this.room.visible=true;this.ceiling.visible=false;
    this.portal.visible=false;this.portalLight.intensity=0;this.bill.visible=false;this.billLight.intensity=0;this.dealLight.intensity=0;this.hand.visible=false;
    this.sky.visible=false;this.skyLight.intensity=0;this.scene.fog.density=.033;this.scene.fog.color.set(0x111914);this.scene.background.set(0x111914);this.hemi.intensity=1.25;this.key.intensity=155;this.rim.intensity=1.5;
    this.billGold.color.set(0xf1c847);this.billGold.emissive.set(0xc68b11);this.billGold.emissiveIntensity=.2;this.billBody.scale.z=1;this.billEye.group.position.z=.21;this.bricks.position.z=0;this.bow.position.z=.19;this.billArm.position.z=0;this.otherArm.position.z=0;
    this.bill.rotation.set(0,0,0);this.billArm.rotation.set(0,0,0);this.poseArms(0);this.billLight.position.set(2.2,3,1);this.dealFlames.visible=false;this.handGlow.visible=false;this.handFill.intensity=0;this.gloveMaterial.emissiveIntensity=0;this.skinMaterial.emissiveIntensity=0;this.orbitRings.forEach(r=>r.visible=false);
    this.debris.forEach(d=>d.mesh.visible=false);this.camera.position.copy(this.homePosition);this.look.copy(this.homeTarget);
    this.renderer.toneMappingExposure=1.15;
  }
  project(position){const v=position.clone().project(this.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z<1&&v.z>-1};}
  candleScreens(){return this.candles.map(c=>this.project(c.position));}
  setReduced(value){this.reduced=value;}
  update(stage,stageTime,dt,time){
    this.elapsed=time;const mobile=this.mobile;let position=this.homePosition.clone(),target=this.homeTarget.clone();
    const journalPos=new THREE.Vector3(...(mobile?[0,9.0,6.0]:[.15,8.0,5.4]));
    const journalTarget=new THREE.Vector3(0,2.25,0);
    if(mobile){const f=Math.max(1,.68/this.camera.aspect);journalPos.sub(journalTarget).multiplyScalar(f).add(journalTarget);}
    const offerPos=new THREE.Vector3(...(mobile?[0,3.5,13.3]:[0,3.7,11.7]));
    const offerTarget=new THREE.Vector3(...(mobile?[0,2.8,0]:[0,2.3,0]));
    const open=stage==='awakening'?smooth((stageTime-.4)/3.6):['journal','summoning','offer','handshake','collapse','weirdmageddon','blackout','result'].includes(stage)?1:0;
    if(stage==='ritual'||stage==='loading'){
      if(!this.reduced){position.x+=this.pointer.x*.08;position.y+=this.pointer.y*.04;}
    }
    if(stage==='awakening'||stage==='journal'){
      const p=stage==='journal'?1:smooth(stageTime/5.5);
      position.lerp(journalPos,p);target.lerp(journalTarget,p);
      this.book.position.set(mix(1.25,1.19,p),mix(.15,2.2,easeOut(p)),0);
      this.book.rotation.set(mix(0,.12,p),mix(-.13,0,p),!this.reduced?Math.sin(time*1.0)*.012*p:0);
      this.hinge.rotation.z=open*(Math.PI-.015);this.hinge.position.y=mix(.47,.01,open);this.leftPages.visible=open>.65;this.leftSurface.visible=this.leftPages.visible;
      this.key.intensity=mix(155,95,p);this.hemi.intensity=mix(1.25,.9,p);
      const flipTime=stage==='journal'?10:stageTime;
      const stack=pageStackAt(flipTime),finished=stack.finished;
      this.leaves.forEach(({pivot,geometry},i)=>{
        const progress=stack.progress[i];
        pivot.visible=stage==='awakening'&&progress>0&&progress<1;
        pivot.position.y=.42-.17*(i/7);pivot.rotation.z=progress*Math.PI;
        if(pivot.visible){const attr=geometry.attributes.position;for(let j=0;j<attr.count;j++){const x=attr.getX(j),y=attr.getY(j);attr.setZ(j,Math.sin((x+1.1)/2.2*Math.PI)*Math.sin(progress*Math.PI)*(.18+Math.cos(y*1.4)*.03));}attr.needsUpdate=true;geometry.computeVertexNormals();}
      });
      const leftThickness=stack.left,rightThickness=stack.right;
      this.rightPages.scale.y=rightThickness;this.rightPages.position.y=.08+rightThickness/2;
      this.leftPages.scale.y=Math.max(.002,leftThickness);this.leftPages.position.y=.09+leftThickness/2;
      this.leftSurface.position.y=.093+leftThickness;this.rightSurface.position.y=.083+rightThickness;
      const leftEntry=Math.min(7,Math.max(0,finished+1)),underEntry=Math.min(7,stack.progress.findLastIndex(p=>p>0)+1);
      this.leftSurface.material=this.archiveLeft[leftEntry];
      this.rightSurface.material=this.archiveRight[underEntry];
    }
    if(stage==='summoning'){
      const p=smooth(stageTime/3.0);position.copy(journalPos).lerp(offerPos,p);target.copy(journalTarget).lerp(offerTarget,p);
      const fly=easeOut(stageTime/2.6);this.book.position.set(1.19-fly*8,2.2+fly*3.6,-fly*9);this.book.scale.setScalar(1-fly*.8);this.book.rotation.set(.12+fly*2,fly*3,-fly*2);this.book.visible=fly<.98;
      this.portal.visible=true;this.portal.position.set(mobile?0:1.75,mobile?4.2:2.9,-2.7);
      const appear=easeOut((stageTime-.65)/2);this.portal.scale.setScalar(appear*(mobile?.8:1));this.portalMat.uniforms.uOpacity.value=1-smooth((stageTime-5.5)/2.1)*.85;
      this.portalEye.group.visible=stageTime<4.7;this.portalEye.group.scale.y=2.4*(1-smooth((stageTime-3.7)/.8));
      this.portalLight.intensity=65*appear*(1-smooth((stageTime-5.7)/1.7));
      if(stageTime>3.7){this.bill.visible=true;const b=easeOut((stageTime-3.7)/2.2);this.bill.scale.setScalar(b*(mobile?.88:1.12));this.bill.position.set(mobile?0:2.0,mobile?4.05:2.9,mix(-2.2,0,b));this.billLight.intensity=22*b;this.dealLight.intensity=0;}
    }
    if(stage==='offer'||stage==='handshake'){
      position.copy(offerPos);target.copy(offerTarget);this.bill.visible=true;this.portal.visible=stage==='offer'&&stageTime<2;
      this.portalMat.uniforms.uOpacity.value=stage==='offer'?.15*(1-smooth(stageTime/2)):0;
      this.bill.position.set(mobile?0:2.0,(mobile?4.05:2.9)+(this.reduced?0:Math.sin(time*1.5)*.09),0);
      this.bill.scale.setScalar(mobile?.88:1.12);this.bill.rotation.y=this.reduced?0:Math.sin(time*.5)*.08;
      this.billLight.intensity=24;this.dealLight.intensity=0;this.key.intensity=95;this.hemi.intensity=.85;this.poseArms(0);
      this.billEye.pupil.position.x=clamp(this.pointer.x,-1,1)*.1;
      this.billEye.pupil.position.y=clamp(this.pointer.y,-1,1)*.055;
      const blink=Math.sin(time*.85)> .998? .15:1;this.billEye.group.scale.y=1.04*blink;
      if(stage==='handshake'){
        const shake=stageTime>1.6&&stageTime<3.2?Math.sin((stageTime-1.6)*13)*.035:0;
        this.hand.visible=true;this.hand.rotation.set(.12,-.55,.35);this.billArm.rotation.set(0,0,shake*.6);
        const {grip,ignition}=handshakeAt(stageTime);
        this.fingers.forEach(({base,second,third},i)=>{base.rotation.x=-grip*(.42+i*.035);second.rotation.x=-grip*1.03;third.rotation.x=-grip*.58;});
        this.thumb.rotation.z=mix(.8,.18,grip);this.thumbTip.rotation.x=-grip*.65;
        this.dealFlames.visible=ignition>.005;this.dealFlames.scale.setScalar(ignition);this.gloveMaterial.emissiveIntensity=ignition*.55;
        this.skinMaterial.emissiveIntensity=ignition*.16;this.handGlow.visible=ignition>.005;this.handGlow.material.opacity=ignition*.65;this.handFill.intensity=ignition*2.2;
        this.dealLight.intensity=ignition*(18+Math.sin(time*13)*3);this.handshakeShake=shake;
        if(stageTime>3.2)position.z-=smooth((stageTime-3.2)/1)*.8;
      }else {this.hand.visible=false;this.billArm.rotation.set(0,0,Math.sin(time*1.3)*.025);this.dealFlames.visible=false;this.gloveMaterial.emissiveIntensity=0;}
    }
    if(stage==='collapse'){
      const p=smooth(stageTime/durations.collapse);this.hand.visible=false;this.portal.visible=false;this.ceiling.visible=p<.45;this.sky.visible=true;this.dealFlames.visible=false;this.dealLight.intensity=0;this.gloveMaterial.emissiveIntensity=0;this.billArm.rotation.set(0,0,0);
      position.copy(offerPos).lerp(new THREE.Vector3(0,17,8.5),p);target.copy(offerTarget).lerp(new THREE.Vector3(0,20,-14),p);
      if(!this.reduced){position.x+=Math.sin(time*31)*.07*(1-p);position.y+=Math.sin(time*24)*.11*(1-p);}
      this.debris.forEach((d,i)=>{d.mesh.visible=true;const fall=Math.max(0,stageTime-i*.018);d.mesh.position.copy(d.base);d.mesh.position.y-=fall*fall*d.speed*.6;d.mesh.position.z+=fall*.4;d.mesh.rotation.set(time*d.spin[0],time*d.spin[1],time*d.spin[2]);});
      this.bill.position.y=mix(mobile?4.05:2.9,19,p);this.bill.position.x=mix(mobile?0:2,0,p);this.bill.position.z=mix(0,-10,p);
      this.scene.fog.density=mix(.033,.008,p);this.scene.fog.color.set(0x33202a);this.skyLight.intensity=p*1.8;this.billLight.position.copy(this.bill.position).add(new THREE.Vector3(0,0,3));
      this.cracks.scale.setScalar(.1+p*.5);this.skyMat.uniforms.uProgress.value=p*.2;
    }
    if(stage==='weirdmageddon'){
      const p=clamp(stageTime/durations.weirdmageddon),rise=smooth(stageTime/3);this.room.visible=false;this.debris.forEach(d=>d.mesh.visible=false);this.sky.visible=true;
      position.set(Math.sin(time*.3)*(this.reduced?0:.15),17.5,8.5-p*3.2);target.set(0,19.3,-12);
      this.cracks.scale.set(1+rise*1.2,1+rise*.3,1);this.tear.scale.x=.2+rise*5;this.skyMat.uniforms.uProgress.value=.2+rise*.8;this.skyLight.intensity=2.4;this.hemi.intensity=.3;this.scene.fog.density=.004;
      const transformation=transformationAt(stageTime),fold=transformation.fold,transform=transformation.redness;
      this.bill.visible=true;this.bill.position.set(0,19,-10);this.bill.scale.setScalar(transformation.scale);
      this.bill.rotation.set(0,-.18+(this.reduced?0:Math.sin(stageTime*.5)*.06),0);this.billArm.rotation.set(0,0,0);this.poseArms(fold);
      this.billGold.color.lerpColors(new THREE.Color(0xf1c847),new THREE.Color(0xd31e2b),transform);this.billGold.emissive.lerpColors(new THREE.Color(0xc68b11),new THREE.Color(0x74091a),transform);this.billGold.emissiveIntensity=.2+transform*.24;
      const depth=transformation.depth;this.billBody.scale.z=depth;const front=this.billFrontZ*(depth-1);
      this.billEye.group.position.z=.21+front;this.bricks.position.z=front;this.bow.position.z=.19+front;this.billArm.position.z=front;this.otherArm.position.z=front;
      this.billLight.color.set(0xff443d);this.billLight.position.set(0,20,-3);this.billLight.intensity=25+45*transform;
      this.orbitRings.forEach((r,i)=>{r.visible=transform>.35;r.rotation.z=time*(.15+i*.08);});
      this.floating.forEach((m,i)=>{m.rotation.x+=dt*.15;m.rotation.y+=dt*.2;m.position.y+=Math.sin(time+i)*dt*.2;});
      this.renderer.toneMappingExposure=1.15+Math.sin(stageTime*1.8)*.07;
    }
    if(stage==='blackout'||stage==='result'){this.bill.visible=false;this.hand.visible=false;this.sky.visible=false;this.room.visible=false;this.scene.background.set(0x080a09);}
    this.camera.position.copy(position);this.look.copy(target);this.camera.lookAt(this.look);
    this.camera.updateMatrixWorld();
    if(stage==='handshake'){
      this.bill.updateMatrixWorld(true);
      const contact=this.billPalm.getWorldPosition(new THREE.Vector3());this.dealLight.position.copy(contact).add(new THREE.Vector3(0,.12,.35));
      const local=this.camera.worldToLocal(contact.clone()),depth=4.5,k=depth/Math.max(.1,-local.z);
      const destination=new THREE.Vector3(local.x*k,local.y*k-.03,-depth);
      const reach=easeOut(stageTime/1.5),withdraw=smooth((stageTime-3.15)/1.0);
      this.hand.position.set(destination.x+(1-reach)*1.1,destination.y-(1-reach)*3.8+this.handshakeShake-withdraw*3.8,destination.z);
    }
    this.candles.forEach((c,i)=>{if(c.lit){const flicker=1+Math.sin(time*9+i*12)*.12+Math.sin(time*17+i)*.05;c.light.intensity=5.5*easeOut((time-c.litAt)*2)*flicker;c.flame.scale.set(1,flicker,1);c.flame.rotation.z=this.reduced?0:Math.sin(time*8+i)*.06;}});
    const attr=this.dust.geometry.attributes.position;
    for(let i=0;i<this.dustBase.length;i++){const b=this.dustBase[i];attr.setXYZ(i,b[0]+Math.sin(time*.08+i)*.3,(b[1]+time*.025)%7,b[2]+Math.cos(time*.07+i)*.2);}attr.needsUpdate=true;
    this.portalMat.uniforms.uTime.value=time;this.skyMat.uniforms.uTime.value=time;this.portalLines.rotation.z=-time*.07;
    if(this.dealFlame)this.dealFlame.scale.set(.9+Math.sin(time*6)*.05,1.2+Math.sin(time*9)*.07,1);
    this.flameTips.forEach((f,i)=>{f.scale.y=.2+Math.sin(time*11+i*2)*.07;f.rotation.z=Math.sin(time*7+i)*.23;});
    this.renderer.render(this.scene,this.camera);
  }
}
