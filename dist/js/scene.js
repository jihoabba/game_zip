import {RECIPES,STATIONS,walkable,findPath} from './model.js';
const P=window.Phaser;
export const imageURLs={};
function cut(scene,key,source,rect){const [sx,sy,sw,sh]=rect;const raw=document.createElement('canvas');raw.width=sw;raw.height=sh;const c=raw.getContext('2d',{willReadFrequently:true});c.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);const im=c.getImageData(0,0,sw,sh);let minx=sw,miny=sh,maxx=0,maxy=0;for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=(y*sw+x)*4;const r=im.data[i],g=im.data[i+1],b=im.data[i+2];if(r>150&&b>140&&g<130&&r>g*1.45&&b>g*1.45){im.data[i+3]=0;}else if(im.data[i+3]>0){minx=Math.min(minx,x);miny=Math.min(miny,y);maxx=Math.max(maxx,x);maxy=Math.max(maxy,y);}}c.putImageData(im,0,0);const out=document.createElement('canvas');out.width=maxx-minx+3;out.height=maxy-miny+3;out.getContext('2d').drawImage(raw,minx,miny,maxx-minx+1,maxy-miny+1,1,1,maxx-minx+1,maxy-miny+1);scene.textures.addCanvas(key,out);imageURLs[key]=out.toDataURL();}
export function makeScene(model,callbacks){return class BakeryScene extends P.Scene{
 constructor(){super('bakery');this.path=[];this.targetStation=null;this.people=new Map();this.puffs=[];this.elapsed=0;this.ready=false;}
 preload(){this.load.image('furniture-sheet','./assets/furniture.png');this.load.image('chef-sheet','./assets/chefs.png');this.load.image('prop-sheet','./assets/props.png');this.load.on('loaderror',file=>callbacks.error('그림을 불러오지 못했어요. 새로고침해 주세요. ('+file.key+')'));}
 create(){
 const f=this.textures.get('furniture-sheet').getSourceImage();[[40,65,480,255],[565,65,510,250],[1150,30,330,295],[35,380,515,250],[660,330,230,335],[960,375,555,260],[120,650,310,335],[610,735,320,230],[1050,670,430,310]].forEach((r,i)=>cut(this,'f'+i,f,r));
 const chefs=this.textures.get('chef-sheet').getSourceImage();for(let r=0;r<3;r++)for(let c=0;c<5;c++)cut(this,'c'+(r*5+c),chefs,[35+c*310,[20,330,632][r],300,[308,300,320][r]]);
 const props=this.textures.get('prop-sheet').getSourceImage();const xs=[0,340,650,980,1270,1619],ys=[0,330,615,971];for(let r=0;r<3;r++)for(let c=0;c<5;c++)cut(this,'p'+(r*5+c),props,[xs[c],ys[r],xs[c+1]-xs[c],ys[r+1]-ys[r]]);
 this.drawWorld();this.objects=[];
 this.furniture('f0',220,262,185,'shelf');this.furniture('f1',505,253,200,'prep');this.furniture('f2',730,245,110,'oven');this.furniture('f4',819,241,58);
 this.furniture('f3',205,373,155,'shelf');this.furniture('f5',280,465,225,'serve');this.furniture('f8',713,416,135);this.furniture('f7',790,495,75);
 this.label(505,176,'반죽대','01');this.label(729,136,'오븐','02');this.label(282,391,'판매대','03');
 this.playerShadow=this.add.ellipse(model.player.x,model.player.y-3,37,11,0x705d3e,.16).setDepth(250);
 this.player=this.add.image(model.player.x,model.player.y,'c0').setOrigin(.5,1);this.player.setDisplaySize(this.player.width*(67/this.player.height),67);
 this.carry=this.add.image(0,0,'p6').setDisplaySize(30,24).setVisible(false).setDepth(1000);
 this.ring=this.add.graphics().setDepth(199);this.dest=this.add.graphics().setDepth(198);this.bakeUI=this.add.graphics().setDepth(800);
 this.bakeText=this.add.text(730,156,'',{fontFamily:'sans-serif',fontSize:'11px',color:'#5d4a35',backgroundColor:'#fff6de',padding:{x:6,y:3}}).setOrigin(.5).setDepth(801);
 this.cursors=this.input.keyboard.createCursorKeys();this.keys=this.input.keyboard.addKeys('W,A,S,D,E,ONE,TWO,THREE,ESC,SPACE');
 this.input.keyboard.on('keydown-E',()=>this.interactNearest());this.input.keyboard.on('keydown-ONE',()=>this.travelStation('prep'));this.input.keyboard.on('keydown-TWO',()=>this.travelStation('oven'));this.input.keyboard.on('keydown-THREE',()=>this.travelStation('serve'));this.input.keyboard.on('keydown-ESC',()=>callbacks.pause());
 this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
 this.input.on('pointerdown',(p,objects)=>{if(objects.length||model.phase!=='running')return;if(p.x>=115&&p.x<=850&&p.y>=210&&p.y<=515)this.travel({x:p.x,y:p.y});});
 this.ready=true;callbacks.ready(this);}
 drawWorld(){const g=this.add.graphics();const rect=(x,y,w,h,c)=>{g.fillStyle(c);g.fillRect(x,y,w,h);};
 rect(0,0,960,600,0xaebf91);rect(0,520,960,80,0xb7c798);
 // Quiet, clustered grass texture.
 for(let i=0;i<260;i++){const x=(i*157+13)%960,y=(i*83+29)%600;if(x>98&&x<863&&y>36&&y<531)continue;rect(x,y,3,5,i%3===0?0x94a87c:0xc4d1a4);if(i%3===0)rect(x+4,y-2,2,5,0x96ac7c);}
 rect(452,510,112,90,0xd8c6a2);for(let y=514;y<600;y+=23){rect(453,y,110,2,0xc5b38e);for(let x=452+(y%2)*25;x<564;x+=37)rect(x,y,2,21,0xcbb993);}
 // Building silhouette and wood foundation.
 rect(95,47,774,487,0x7f7151);rect(104,39,752,490,0xbda275);rect(111,53,739,465,0xf3e6c8);rect(111,179,739,339,0xd3bd96);
 for(let y=185;y<514;y+=32)for(let x=115;x<848;x+=32){rect(x,y,31,31,((x-115)/32+(y-185)/32)%2===0?0xf1e5c9:0xe9d9b7);rect(x,y+30,31,1,0xd7c4a1);}
 // Wall paper, dado and sunny windows.
 rect(111,58,739,122,0xf6e9cc);for(let x=120;x<850;x+=29)rect(x,62,1,109,0xe8dbbe);
 rect(111,173,739,8,0xbf9770);rect(111,182,739,5,0x967350);rect(111,169,739,4,0xe1c29c);
 this.window(g,157,78,128,84);this.window(g,638,78,105,64);
 rect(360,80,229,65,0xab8258);rect(364,77,221,64,0xd3ac77);rect(369,82,211,53,0xffefcf);
 this.add.text(474,98,'NEMO BAKERY',{fontFamily:'Georgia',fontStyle:'bold',fontSize:'21px',color:'#946b48',letterSpacing:1}).setOrigin(.5).setDepth(10);
 this.add.text(474,122,'a little happiness, freshly baked',{fontFamily:'Georgia',fontStyle:'italic',fontSize:'9px',color:'#bc9a71'}).setOrigin(.5).setDepth(10);
 // Wood roof trim and striped valance.
 rect(98,38,764,13,0x8e6847);rect(102,39,756,7,0xcca778);rect(110,51,740,11,0xd69f98);for(let x=110;x<850;x+=32)rect(x,51,16,11,0xf4dfbe);
 rect(104,54,8,463,0xc8a574);rect(848,54,8,463,0xb89668);rect(110,511,337,9,0x99714c);rect(569,511,280,9,0x99714c);rect(110,508,337,4,0xd6b080);rect(569,508,280,4,0xd6b080);
 // Entry mat.
 rect(457,469,105,37,0xc69788);rect(461,473,97,29,0xd7b19a);for(let x=466;x<555;x+=12){rect(x,477,3,2,0xe7c5ac);rect(x,498,3,2,0xe7c5ac);}this.add.text(510,487,'welcome',{fontFamily:'Georgia',fontStyle:'italic',fontSize:'12px',color:'#9b705c'}).setOrigin(.5).setDepth(11);
 // Small garden and picket fence, straight-on RPG perspective.
 for(let x=30;x<440;x+=25){rect(x,550,9,35,0xe4dab9);rect(x+2,546,5,4,0xe4dab9);}rect(25,558,410,6,0xd6c69f);for(let x=585;x<930;x+=25){rect(x,550,9,35,0xe4dab9);rect(x+2,546,5,4,0xe4dab9);}rect(582,558,348,6,0xd6c69f);
 this.tree(g,46,115,1.1);this.tree(g,911,150,1.25);this.tree(g,44,393,.9);this.tree(g,909,445,.92);
 for(const [x,y]of [[59,238],[902,288],[79,496],[614,546],[398,543],[891,54]])this.flower(g,x,y);
 this.pot(g,129,188);this.pot(g,836,380);this.pot(g,126,485);
 // Warm hanging lamps and corner shelf details.
 for(const x of [333,606]){rect(x,62,2,39,0xb69b73);rect(x-10,100,22,5,0xc0a264);rect(x-15,105,32,8,0xe0bf78);rect(x-11,113,24,3,0xf9e9b2);}
 g.fillStyle(0xfff6ca,.12);g.fillTriangle(157,160,280,160,360,324);g.setDepth(0);
 }
 window(g,x,y,w,h){g.fillStyle(0xb38c61);g.fillRect(x-5,y-5,w+10,h+10);g.fillStyle(0xfbf2d9);g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle(0xbfd5cf);g.fillRect(x,y,w,h);g.fillStyle(0xdce6d5);g.fillRect(x+3,y+3,w-6,h*.35);g.fillStyle(0xa8c3a3);g.fillRect(x+2,y+h*.7,w-4,h*.3-2);g.fillStyle(0xe8d8b5);g.fillRect(x+w/2-2,y,5,h);g.fillRect(x,y+h/2-2,w,4);g.fillStyle(0xd6ae85);g.fillRect(x-10,y+h+4,w+20,6);g.fillStyle(0xf7eccd,.38);g.fillTriangle(x+8,y+4,x+33,y+4,x+8,y+34);}
 tree(g,x,y,s){const r=(a,b,w,h,c)=>{g.fillStyle(c);g.fillRect(x+a*s,y+b*s,w*s,h*s);};r(-5,8,11,34,0x8d7954);r(-23,-25,47,55,0x7a9266);r(-34,-13,68,32,0x7a9266);r(-24,-30,48,42,0x91a873);r(-31,-15,63,22,0x99b17e);r(-17,-32,30,12,0xa9bd88);r(-28,7,50,8,0x8ca272);r(-10,-18,9,7,0xadc08b);r(12,-4,9,5,0xafc18c);}
 flower(g,x,y){for(let i=0;i<4;i++){const xx=x+i*9,yy=y+(i%2)*5;g.fillStyle(0x748f61);g.fillRect(xx,yy,2,8);g.fillStyle(i%2?0xe6be92:0xe2a7a0);g.fillRect(xx-3,yy-4,8,5);g.fillRect(xx-1,yy-6,4,9);g.fillStyle(0xf8e5b4);g.fillRect(xx,yy-3,2,2);}}
 pot(g,x,y){g.fillStyle(0xb98970);g.fillRect(x-10,y-15,20,15);g.fillStyle(0xd9ac8b);g.fillRect(x-12,y-18,24,5);g.fillStyle(0x829c6f);g.fillRect(x-10,y-37,20,19);g.fillRect(x-15,y-30,30,9);g.fillStyle(0xa4b585);g.fillRect(x-8,y-40,14,13);}
 furniture(key,x,y,w,station){this.add.ellipse(x,y-5,w*.86,14,0x97754e,.12).setDepth(y-1);const sprite=this.add.image(x,y,key).setOrigin(.5,1).setDepth(y);sprite.setDisplaySize(w,sprite.height*w/sprite.width);if(station){sprite.setInteractive({useHandCursor:true});sprite.on('pointerdown',(p,lx,ly,event)=>{event.stopPropagation();this.travelStation(station);});sprite.on('pointerover',()=>sprite.setTint(0xfff0da));sprite.on('pointerout',()=>sprite.clearTint());}this.objects?.push(sprite);return sprite;}
 label(x,y,word,n){this.add.text(x,y,n+'  '+word,{fontFamily:'sans-serif',fontSize:'10px',color:'#8c7556',backgroundColor:'#f6e7c8',padding:{x:7,y:3}}).setOrigin(.5).setDepth(750);}
 travel(to,station=null){if(model.phase!=='running')return;this.path=findPath(model.player,to);this.targetStation=station;this.dest.clear();if(this.path.length){const p=this.path.at(-1);this.dest.lineStyle(2,0x9ea87b,.8);this.dest.strokeEllipse(p.x,p.y,21,8);}}
 travelStation(key){if(!this.ready||model.phase!=='running')return;const s=STATIONS[key];this.travel(s,key);callbacks.onTravel?.(key);}
 interactNearest(){if(model.phase!=='running')return;const nearest=Object.entries(STATIONS).sort((a,b)=>Math.hypot(a[1].x-model.player.x,a[1].y-model.player.y)-Math.hypot(b[1].x-model.player.x,b[1].y-model.player.y))[0];if(Math.hypot(nearest[1].x-model.player.x,nearest[1].y-model.player.y)<65){this.path=[];this.targetStation=null;callbacks.action(nearest[0]);}else callbacks.notice('가구 가까이 가서 E를 누르거나, 아래 작업 버튼을 눌러 주세요.');}
 resetPlayer(){this.path=[];this.targetStation=null;this.dest.clear();this.player.setPosition(model.player.x,model.player.y).setTexture('c0');this.playerShadow.setPosition(model.player.x,model.player.y-3);this.carry.setVisible(false);this.bakeUI.clear();this.bakeText.setVisible(false);for(const p of this.people.values())p.destroy();this.people.clear();}
 pop(text,x,y,color='#92774b'){const t=this.add.text(x,y,text,{fontFamily:'sans-serif',fontStyle:'bold',fontSize:'18px',color,stroke:'#fff6e3',strokeThickness:4}).setOrigin(.5).setDepth(1200);this.tweens.add({targets:t,y:y-48,alpha:0,duration:1500,ease:'Cubic.easeOut',onComplete:()=>t.destroy()});}
 update(t,delta){if(!this.ready)return;const dt=Math.min(delta/1000,.05);if(model.phase==='running'){model.tick(dt);this.elapsed+=dt;let dx=(this.cursors.right.isDown||this.keys.D.isDown?1:0)-(this.cursors.left.isDown||this.keys.A.isDown?1:0),dy=(this.cursors.down.isDown||this.keys.S.isDown?1:0)-(this.cursors.up.isDown||this.keys.W.isDown?1:0);let moving=false;
 if(dx||dy){this.path=[];this.targetStation=null;this.dest.clear();const norm=Math.hypot(dx,dy);dx=dx/norm*145*dt;dy=dy/norm*145*dt;const p=model.player;if(walkable(p.x+dx,p.y))p.x+=dx;if(walkable(p.x,p.y+dy))p.y+=dy;moving=true;this.player.setFlipX(dx<0);}
 else if(this.path.length){const p=model.player,n=this.path[0],d=Math.hypot(n.x-p.x,n.y-p.y),speed=155*dt;if(d<=speed){p.x=n.x;p.y=n.y;this.path.shift();}else{p.x+=(n.x-p.x)/d*speed;p.y+=(n.y-p.y)/d*speed;}moving=true;this.player.setFlipX(n.x<p.x);if(!this.path.length){this.dest.clear();if(this.targetStation){const key=this.targetStation;this.targetStation=null;callbacks.action(key);}}}
 const isMix=model.mixing>0;this.player.setTexture(isMix?'c5':'c0');this.player.setDisplaySize(this.player.width*67/this.player.height,67);const bob=moving?Math.sin(this.elapsed*18)*2:isMix?Math.sin(this.elapsed*14)*1.5:Math.sin(this.elapsed*2)*.7;this.player.setPosition(model.player.x,model.player.y+bob).setDepth(model.player.y);this.playerShadow.setPosition(model.player.x,model.player.y-3).setDepth(model.player.y-1);this.carry.setVisible(model.dough!==null).setPosition(model.player.x+19,model.player.y-22+bob).setDepth(model.player.y+1);
 this.updateCustomers();this.drawBaking();}
 callbacks.frame(dt);}
 updateCustomers(){const ids=new Set(model.orders.map(o=>o.id));for(const [id,c]of this.people){if(!ids.has(id)){this.people.delete(id);this.tweens.add({targets:c,x:510,y:544,alpha:0,duration:850,onComplete:()=>c.destroy()});}}
 model.orders.forEach((o,i)=>{const targetX=202+i*72,targetY=503;if(!this.people.has(o.id)){const shadow=this.add.ellipse(0,-3,30,8,0x927249,.13);const char=this.add.image(0,0,'c'+o.chef).setOrigin(.5,1);char.setDisplaySize(char.width*55/char.height,55);const bubble=this.add.graphics();bubble.fillStyle(0xfffbef);bubble.fillRoundedRect(-19,-100,38,32,6);bubble.fillTriangle(-3,-68,3,-68,0,-62);bubble.lineStyle(1,0xcbba9b);bubble.strokeRoundedRect(-19,-100,38,32,6);const food=this.add.image(0,-84,'p'+o.recipe);food.setDisplaySize(25,food.height*25/food.width);const cont=this.add.container(510,543,[shadow,char,bubble,food]).setDepth(510);this.people.set(o.id,cont);this.tweens.add({targets:cont,x:targetX,y:targetY,duration:1300,ease:'Sine.easeInOut'});}else{const c=this.people.get(o.id);if(!this.tweens.isTweening(c))c.x+=(targetX-c.x)*.1;}});}
 drawBaking(){this.bakeUI.clear();const occupied=model.ovens.filter(Boolean);this.bakeText.setVisible(occupied.length>0);if(!occupied.length)return;const ready=occupied.some(o=>o.ready),o=occupied.find(o=>o.ready)||occupied[0];this.bakeText.setText(ready?'갓 구웠어요! 꺼내기':'굽는 중 · '+Math.ceil(Math.max(0,o.duration-o.elapsed))+'초');this.bakeText.setColor(ready?'#608049':'#956f43');this.bakeUI.fillStyle(0xb59c72);this.bakeUI.fillRoundedRect(691,251,78,6,2);this.bakeUI.fillStyle(ready?0x91b36b:0xe0ae5f);this.bakeUI.fillRoundedRect(692,252,76*Math.min(o.elapsed/o.duration,1),4,1);if(ready){this.bakeUI.fillStyle(0xc2db8c,.3+Math.sin(this.elapsed*5)*.15);this.bakeUI.fillCircle(777,175,8);}else{const k=Math.floor(this.elapsed*3)%3;for(let i=0;i<3;i++){this.bakeUI.fillStyle(0xfff8dc,.45);this.bakeUI.fillRect(713+i*14,153-((k+i)%3)*7,4,6);}}}
};}
