export const RECIPES = [
 {id:0,name:'블루베리 롤',short:'롤',price:32,bake:7,color:'#8c82ab',desc:'보랏빛 베리가 돌돌'},
 {id:1,name:'레몬 파운드',short:'파운드',price:34,bake:8,color:'#d8b15f',desc:'한 입 가득 상큼함'},
 {id:2,name:'딸기 도넛',short:'도넛',price:26,bake:5,color:'#d68894',desc:'분홍빛 달콤한 동그라미'},
 {id:3,name:'버터 슈',short:'슈',price:28,bake:6,color:'#bd945c',desc:'바삭, 그리고 부드럽게'},
 {id:4,name:'초코 까눌레',short:'까눌레',price:38,bake:9,color:'#956c56',desc:'작은 틀에 담은 진한 행복'}
];
export const STATIONS = {prep:{x:500,y:287,label:'반죽대'},oven:{x:717,y:285,label:'오븐'},serve:{x:282,y:389,label:'판매대'},shelf:{x:220,y:290,label:'진열대'}};
export const OBSTACLES = [
 {x:128,y:207,w:183,h:54},{x:402,y:203,w:204,h:52},{x:678,y:199,w:103,h:49},{x:795,y:186,w:50,h:60},
 {x:128,y:333,w:157,h:40},{x:166,y:416,w:229,h:49},{x:648,y:374,w:139,h:42},{x:754,y:466,w:75,h:29}
];
export const walkable=(x,y)=>x>=120&&x<=837&&y>=213&&y<=508&&!OBSTACLES.some(o=>x>o.x-12&&x<o.x+o.w+12&&y>o.y-6&&y<o.y+o.h+6);
const NAMES=['몽실','버터','로지','모카','민트'];
export class Bakery {
 constructor(save){this.day=save?.day||1;this.bank=save?.bank||0;this.upgrades=save?.upgrades||0;this.best=save?.best||0;this.lifetime=save?.lifetime||0;this.reset();}
 reset(){this.phase='ready';this.time=180;this.revenue=0;this.served=0;this.missed=0;this.burned=0;this.combo=0;this.maxCombo=0;this.selected=2;this.stock=[0,0,0,0,0];this.dough=null;this.mixing=0;this.mixRecipe=null;this.ovens=Array.from({length:this.upgrades>=1?2:1},()=>null);this.orders=[];this.events=[];this.orderSeq=0;this.spawnTimer=9;this.player={x:510,y:375};this.seed=this.day*479;this.goal=120+this.day*40;}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 event(type,data={}){this.events.push({type,...data});}
 start(){if(this.phase!=='ready')return;this.phase='running';this.addOrder(2);this.event('notice',{text:'첫 손님이 왔어요! 딸기 도넛을 만들어 볼까요?'});}
 addOrder(recipe){if(this.orders.length>=3)return;const id=this.orderSeq++;const type=recipe??Math.floor(this.random()*5);const chef=id%5;const patience=78-Math.min(this.day-1,6)*4;this.orders.push({id,recipe:type,chef,name:NAMES[chef],left:patience,max:patience});this.event('arrive');}
 tick(dt){if(this.phase!=='running')return;this.time=Math.max(0,this.time-dt);
 if(this.mixing>0){this.mixing=Math.max(0,this.mixing-dt);if(this.mixing===0){this.dough=this.mixRecipe;this.event('mixed');}}
 this.ovens.forEach((o,i)=>{if(!o)return;o.elapsed+=dt;if(!o.ready&&o.elapsed>=o.duration){o.ready=true;this.event('baked');}if(o.elapsed>=o.duration+18){this.ovens[i]=null;this.burned++;this.combo=0;this.event('notice',{text:'앗, 빵이 탔어요. 다음 빵은 조금 일찍 꺼내 주세요.'});}});
 this.orders.forEach(o=>o.left-=dt);const late=this.orders.filter(o=>o.left<=0);if(late.length){this.orders=this.orders.filter(o=>o.left>0);this.missed+=late.length;this.combo=0;this.event('notice',{text:'손님이 다음에 다시 오겠대요. 남은 주문을 챙겨 볼까요?'});}
 this.spawnTimer-=dt;if(this.spawnTimer<=0&&this.time>15){if(this.orders.length<3){this.addOrder();this.spawnTimer=18+this.random()*9;}else this.spawnTimer=4;}
 if(this.time===0){this.phase='summary';this.bank+=this.revenue;this.lifetime+=this.served;this.best=Math.max(this.best,this.revenue);this.event('close');}}
 select(id){if(RECIPES[id])this.selected=id;}
 action(station){if(this.phase!=='running')return {ok:false,text:'가게 문을 먼저 열어 주세요.'};
 if(station==='prep'){
 if(this.mixing)return {ok:false,text:'조금만요, 반죽하는 중이에요.'};
 if(this.dough!==null)return {ok:false,text:'손에 든 반죽을 먼저 오븐에 넣어 주세요.'};
 this.mixing=this.upgrades>=2?0.8:1.5;this.mixRecipe=this.selected;this.event('mix');return {ok:true,text:RECIPES[this.selected].name+' 반죽 중…'};
 }
 if(station==='oven'){
 const ready=this.ovens.findIndex(o=>o?.ready);if(ready>=0){const o=this.ovens[ready];this.stock[o.recipe]++;this.ovens[ready]=null;this.event('collect',{recipe:o.recipe});return {ok:true,text:'갓 구운 '+RECIPES[o.recipe].name+'을 꺼냈어요!'};}
 if(this.dough!==null){const empty=this.ovens.findIndex(o=>!o);if(empty<0)return {ok:false,text:'오븐에서 빵이 익고 있어요. 잠깐 기다려 주세요.'};const id=this.dough;this.ovens[empty]={recipe:id,elapsed:0,duration:RECIPES[id].bake*(this.upgrades>=2?0.75:1),ready:false};this.dough=null;this.event('bake');return {ok:true,text:'오븐에 넣었어요. 다 익으면 다시 눌러 꺼내 주세요.'};}
 if(this.ovens.some(Boolean))return {ok:false,text:'노릇노릇 굽는 중! 초록 불이 켜지면 꺼내 주세요.'};return {ok:false,text:'반죽대에서 먼저 반죽을 만들어 주세요.'};
 }
 if(station==='serve'){
 const o=this.orders.find(o=>this.stock[o.recipe]>0);if(!o)return {ok:false,text:'주문에 맞는 빵을 구운 뒤 오븐에서 꺼내 주세요.'};this.stock[o.recipe]--;this.orders=this.orders.filter(x=>x.id!==o.id);this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);const tip=(o.left/o.max>.65?4:0)+Math.min(this.combo-1,5)*2;const amount=RECIPES[o.recipe].price+tip;this.revenue+=amount;this.served++;this.event('sold',{amount,tip,recipe:o.recipe,chef:o.chef});return {ok:true,text:o.name+'에게 전달 완료! +'+amount+' G'+(tip?' (팁 '+tip+' G)':'')};
 }
 if(station==='shelf')return {ok:true,text:this.stock.reduce((a,b)=>a+b,0)?'완성된 빵은 판매대에서 손님에게 건네 주세요.':'아직 진열할 빵이 없어요. 첫 빵을 구워 볼까요?'};
 return {ok:false,text:''};}
 pause(){if(this.phase==='running')this.phase='paused';else if(this.phase==='paused')this.phase='running';}
 nextDay(){if(this.phase!=='summary')return;this.day++;this.reset();}
 buyUpgrade(){if(this.upgrades>=2)return false;const cost=this.upgrades===0?90:170;if(this.bank<cost)return false;this.bank-=cost;this.upgrades++;return true;}
 save(){return {v:1,day:this.phase==='summary'?this.day+1:this.day,bank:this.bank,upgrades:this.upgrades,best:this.best,lifetime:this.lifetime};}
}
// Grid search is shared by pointer movement and keyboard collision rules.
export function findPath(from,to){const step=12;const key=(x,y)=>x+','+y;const nodes=[];for(let y=216;y<=504;y+=step)for(let x=120;x<=836;x+=step)if(walkable(x,y))nodes.push({x,y});
 const nearest=p=>nodes.reduce((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?b:a,nodes[0]);const s=nearest(from),g=nearest(to),allowed=new Map(nodes.map(n=>[key(n.x,n.y),n]));const queue=[s],seen=new Map([[key(s.x,s.y),null]]);let found=false;
 for(let i=0;i<queue.length;i++){const n=queue[i];if(n.x===g.x&&n.y===g.y){found=true;break;}for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const k=key(n.x+dx,n.y+dy);if(allowed.has(k)&&!seen.has(k)){seen.set(k,n);queue.push(allowed.get(k));}}}
 if(!found)return [];const path=[];let cur=g;while(cur){path.push(cur);cur=seen.get(key(cur.x,cur.y));}return path.reverse();}
