/* Resource goals and local route planning in world coordinates. */
const HAP=(()=>{
 'use strict';
 const kinds=new Set(['obelisk','pokemon','boss','elite','thief','coin','ticket','ticket10','xp','heal','healzone','magnet','bomb','orb','item','chest','breakable','rift','altar','wall','reward','door','cage','lantern','escortNpc','escortGoal','friendly','gem','candy','ticket25','pumpkin','hazard','projectile','unknown']);
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const dirs=[[],['w'],['w','d'],['d'],['s','d'],['s'],['s','a'],['a'],['w','a']];
 const vec=keys=>{const x=+keys.includes('d')-+keys.includes('a'),y=+keys.includes('s')-+keys.includes('w'),n=Math.hypot(x,y)||1;return {x:x/n,y:y/n}};
 function segment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return dist(p,{x:a.x+t*dx,y:a.y+t*dy})}
 function shapeDistance(p,h){
  if(!h.poly?.length)return dist(p,h)-h.r;
  let inside=false,d=Infinity;const a=h.poly;
  for(let i=0,j=a.length-1;i<a.length;j=i++){
   d=Math.min(d,segment(p,a[j],a[i]));
   if((a[i].y>p.y)!==(a[j].y>p.y)&&p.x<(a[j].x-a[i].x)*(p.y-a[i].y)/(a[j].y-a[i].y)+a[i].x)inside=!inside;
  }
  return h.stroke?d-h.stroke/2:inside?-d:d;
 }
 function validate(f){
  if(!f||!Number.isFinite(f.seq)||!f.camera||!Array.isArray(f.objects)||f.objects.length>1200)return null;
  const c=f.camera;if(!['a','b','c','d','e','f'].every(k=>Number.isFinite(c[k]))||Math.abs(c.a*c.d-c.b*c.c)<.01)return null;
  if(!Number.isFinite(f.width)||!Number.isFinite(f.height)||f.width<1||f.height<1)return null;
  const objects=f.objects.filter(o=>o&&kinds.has(o.kind)&&['x','y','r'].every(k=>Number.isFinite(o[k])&&Math.abs(o[k])<1e7)&&o.r>=0&&o.r<1200).map(o=>({...o,poly:Array.isArray(o.poly)?o.poly.slice(0,40).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)):undefined}));
  return {...f,objects,hp:Number.isFinite(f.hp)?Math.max(0,Math.min(1,f.hp)):null};
 }
 function player(f,dex=0){
  const c=f.camera,det=c.a*c.d-c.b*c.c,x=f.width/2-c.e,y=f.height/2-c.f,center={x:(c.d*x-c.c*y)/det,y:(-c.b*x+c.a*y)/det};
  const candidates=f.objects.filter(o=>['pokemon','elite'].includes(o.kind)&&(!dex||o.dex===dex)&&dist(o,center)<85).sort((a,b)=>dist(a,center)-dist(b,center));
  if(!candidates.length||candidates[1]&&dist(candidates[1],center)-dist(candidates[0],center)<12)return null;const me=candidates[0];me.bodyRadius=me.bodyRadius||Math.min(120,me.r);me.r=Math.min(18,me.r);return me;
 }
 const id=o=>o.kind+':'+(o.sig||o.dex||'')+':'+Math.round(o.x/18)+':'+Math.round(o.y/18);
 const labels={obelisk:'Cột hồi máu boss',door:'Trick-or-treat',cage:'Lồng cứu hộ',lantern:'Đèn nhiệm vụ',escortNpc:'Pokémon cần hộ tống',escortGoal:'Điểm đưa Pokémon về',gem:'Đá quý',candy:'Kẹo sự kiện',ticket25:'Vé ×25',pumpkin:'Bí ngô',friendly:'Đồng minh',reward:'Rương thưởng',wall:'Địa hình',coin:'Vàng',ticket:'Vé gacha',ticket10:'Vé gacha ×10',xp:'Kinh nghiệm',chest:'Rương khóa',rift:'Cổng boss',projectile:'Đạn địch',boss:'Boss',elite:'Quái đặc biệt',thief:'Quái mang kho báu',heal:'Quả hồi máu',healzone:'Suối hồi máu',magnet:'Nam châm',altar:'Trụ buff',item:'Trang bị',breakable:'Vật thể phá được'};
 const profiles={
  coins:{label:'Farm',description:'Ưu tiên tài nguyên còn thiếu, rương và boss/Rift; né nguy hiểm trước khi thu nhặt.',weights:{coin:110,ticket:150,ticket10:210,chest:120,rift:400,boss:90,thief:140,item:65,orb:60}},
  tickets:{label:'Vé gacha + boss',description:'Tập trung cổng boss, vé gacha, kho báu và item.',weights:{coin:28,ticket:190,ticket10:260,chest:160,rift:500,boss:145,thief:160,item:85,orb:70}},
  survival:{label:'Sinh tồn',description:'Sinh tồn: ưu tiên Rift để hoàn thiện Bond core khi đủ sức; mở rương an toàn, hồi máu và né nguy hiểm trước.',weights:{coin:10,ticket:25,ticket10:35,chest:20,rift:0,boss:10,thief:15,item:55,orb:60}}
 };
 // Bounded grid search around visible terrain walls; keep the real farming target.
 function terrainRoute(me,target,obstacles){
  const solid=obstacles.filter(o=>o.surface!=='liquid'&&['wall','chest','altar','breakable','cage','lantern','pumpkin'].includes(o.kind)&&!(o.kind===target.kind&&dist(o,target)<8));if(!solid.length||!target)return null;
  const radius=me.r+4,buckets=new Map();
  for(const o of solid){const xs=o.poly?.length?o.poly.map(p=>p.x):[o.x-o.r,o.x+o.r],ys=o.poly?.length?o.poly.map(p=>p.y):[o.y-o.r,o.y+o.r];for(let x=Math.floor((Math.min(...xs)-radius)/64);x<=Math.floor((Math.max(...xs)+radius)/64);x++)for(let y=Math.floor((Math.min(...ys)-radius)/64);y<=Math.floor((Math.max(...ys)+radius)/64);y++){const key=x+','+y;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o)}}
  const blocked=p=>(buckets.get(Math.floor(p.x/64)+','+Math.floor(p.y/64))||[]).some(o=>shapeDistance(p,o)<radius),length=dist(me,target);let crossing=false;
  for(let t=6;t<Math.min(1100,length);t+=6)if(blocked({x:me.x+(target.x-me.x)*t/length,y:me.y+(target.y-me.y)*t/length})){crossing=true;break}if(!crossing)return null;
  const size=24,edgeClear=(a,b)=>{const steps=Math.ceil(dist(a,b)/6);for(let i=1;i<=steps;i++)if(blocked({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false;return true},key=(x,y)=>x+','+y,center=(x,y)=>({x:(x+.5)*size,y:(y+.5)*size}),sx=Math.floor(me.x/size),sy=Math.floor(me.y/size),gx=Math.floor(target.x/size),gy=Math.floor(target.y/size),start=key(sx,sy),cells=new Map(),pass=(x,y)=>{const k=key(x,y);if(!cells.has(k))cells.set(k,!blocked(center(x,y)));return cells.get(k)},heuristic=(x,y)=>Math.hypot(x-gx,y-gy),nodes=new Map([[start,{x:sx,y:sy,g:0,h:heuristic(sx,sy),parent:null}]]),open=new Set([start]),closed=new Set();let finish=null,best=nodes.get(start);
  for(let n=0;n<1100&&open.size;n++){let chosen=null;for(const k of open){const v=nodes.get(k);if(!chosen||v.g+v.h<chosen.g+chosen.h)chosen=v}const ck=key(chosen.x,chosen.y);open.delete(ck);closed.add(ck);if(chosen.h<best.h)best=chosen;if(chosen.x===gx&&chosen.y===gy){finish=chosen;break}
   for(const [dx,dy]of[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]){const x=chosen.x+dx,y=chosen.y+dy,k=key(x,y);if(closed.has(k)||Math.abs(x-sx)>36||Math.abs(y-sy)>36||!pass(x,y)||!edgeClear(chosen.parent?center(chosen.x,chosen.y):me,center(x,y))||dx&&dy&&(!pass(chosen.x+dx,chosen.y)||!pass(chosen.x,chosen.y+dy)))continue;const at=center(x,y),clearance=Math.min(60,...(buckets.get(Math.floor(at.x/64)+','+Math.floor(at.y/64))||[]).map(o=>shapeDistance(at,o)-radius)),g=chosen.g+(dx&&dy?Math.SQRT2:1)+Math.max(0,20-clearance)/40,old=nodes.get(k);if(!old||g<old.g){nodes.set(k,{x,y,g,h:heuristic(x,y),parent:chosen});open.add(k)}}
  }
  finish||=best;if(finish.h>=heuristic(sx,sy)&&!finish.parent)return null;const points=[];for(let n=finish;n?.parent;n=n.parent)points.unshift(center(n.x,n.y));return points;
 }
 function create(){
  let opportunityRoutes=new Map(),teleportUntil=0,teleportSpot=null,recoveringHp=false,breakout=null,terrainMemory=new Map(),escape=null,progressAnchor=null,memory=new Map(),ignore=new Map(),visited=new Map(),target=null,held=[],history=[],walls=[],recoveries=[],dwell=null,lastMe=null,lastArena=false,lastSeq=-1,heading=0,clock=null,clockAt=0,enemyHistory=[],enemyAt=0,portalLock=null,arenaBoss=null,speed=160,meAt=0,bulletHistory=[],bulletAt=0,castHistory=new Map(),routeCache=null,eventLock=null,escort=null;
  function reset(){opportunityRoutes.clear();teleportUntil=0;teleportSpot=null;recoveringHp=false;breakout=null;terrainMemory.clear();escape=null;progressAnchor=null;memory.clear();ignore.clear();visited.clear();target=null;held=[];history=[];walls=[];recoveries=[];dwell=null;lastMe=null;lastSeq=-1;clock=null;clockAt=0;heading=0;enemyHistory=[];enemyAt=0;portalLock=null;arenaBoss=null;speed=160;meAt=0;bulletHistory=[];bulletAt=0;castHistory.clear();routeCache=null;eventLock=null;escort=null}
  function suspend(options={}){history=[];held=[];dwell=null;if(options.choice){recoveries=[];walls=[];escape=null;routeCache=null;lastSeq=-1;meAt=0}}
  function tick(raw,config,now,dex=0){
   const f=validate(raw);if(!f)return {keys:[],phase:'waiting',reason:'Chờ dữ liệu chiến trường hợp lệ'};
   const me=player(f,dex);if(!me)return {keys:[],phase:'waiting',reason:'Chưa xác định chắc chắn người chơi'};
   if((lastMe&&dist(me,lastMe)>600)||f.arena!==lastArena){reset();lastArena=f.arena}
   if(lastMe&&meAt&&held.length){const dt=(now-meAt)/1000,step=dist(me,lastMe);if(dt>.04&&dt<.8&&step>1&&step/dt<400)speed=speed*.8+Math.max(60,Math.min(260,step/dt))*.2}
   lastMe=me;meAt=now;
   if(f.clock!==null&&Number.isFinite(f.clock)){
    if(clock!==f.clock){clock=f.clock;clockAt=now}
    else if(now-clockAt>1900){suspend();return {keys:[],phase:'waiting',reason:'Đồng hồ game đang dừng',me}}
   }
   if(lastSeq===f.seq)return {keys:held,phase:'moving',reason:'Đang theo hướng đã chọn',me,target};lastSeq=f.seq;
   for(const [k,v] of ignore)if(v<now)ignore.delete(k);
   walls=walls.filter(w=>w.until>now);
   const all=f.objects.filter(o=>o!==me).map(o=>o.kind==='unknown'&&config.tags?.[o.sig]?{...o,kind:config.tags[o.sig]}:o);
   const enemies=all.filter(o=>['pokemon','boss','elite','thief'].includes(o.kind)).sort((a,b)=>dist(a,me)-dist(b,me)).slice(0,100);
   const dt=(now-enemyAt)/1000,motionWarnings=[];
   if(dt>.03&&dt<.7)for(const e of enemies){const boss=e.kind==='boss',matches=enemyHistory.filter(p=>p.dex===e.dex&&p.kind===e.kind&&dist(p,e)<(boss?550:80)).sort((a,b)=>dist(a,e)-dist(b,e));
    if(matches[0]&&(!matches[1]||dist(matches[1],e)-dist(matches[0],e)>20)){const old=matches[0],jump=dist(e,old),teleport=boss&&jump>Math.max(120,dt*1400);e.vx=teleport?0:Math.max(-1200,Math.min(1200,(e.x-old.x)/dt));e.vy=teleport?0:Math.max(boss?-1200:-240,Math.min(boss?1200:240,(e.y-old.y)/dt));if(teleport&&dist(e,me)<220){teleportUntil=now+600;teleportSpot={...e,kind:'hazard',r:e.r+85,motion:'teleport'};}
     if(boss&&!teleport&&Math.hypot(e.vx,e.vy)>300&&(me.x-e.x)*e.vx+(me.y-e.y)*e.vy>0){const t=Math.min(.4,220/Math.hypot(e.vx,e.vy)),end={x:e.x+e.vx*t,y:e.y+e.vy*t},len=dist(e,end),w=e.r+me.r+18,px=-(end.y-e.y)/len*w,py=(end.x-e.x)/len*w;motionWarnings.push({kind:'hazard',x:(e.x+end.x)/2,y:(e.y+end.y)/2,r:len/2+w,poly:[{x:e.x+px,y:e.y+py},{x:end.x+px,y:end.y+py},{x:end.x-px,y:end.y-py},{x:e.x-px,y:e.y-py}],motion:'dash'});}
    }
    if(boss&&e.anim==='Charge'&&dist(e,me)<260)motionWarnings.push({...e,kind:'hazard',r:e.r+75,motion:'charge'});
   }
   if(teleportSpot&&now<teleportUntil&&dist(me,teleportSpot)<260)motionWarnings.push(teleportSpot);
   enemyHistory=enemies.map(e=>({x:e.x,y:e.y,dex:e.dex,kind:e.kind}));enemyAt=now;
   const hazards=all.filter(o=>o.kind==='hazard').concat(motionWarnings).sort((a,b)=>dist(a,me)-dist(b,me)).slice(0,100);
   const wallKey=o=>Math.round(o.x/4)+':'+Math.round(o.y/4)+':'+Math.round(o.r/4);
   const liveWalls=all.filter(o=>o.kind==='wall'&&o.surface!=='liquid'),liveKeys=new Set(liveWalls.map(wallKey));
   for(const o of liveWalls)terrainMemory.set(wallKey(o),{...o,seen:now});
   for(const [key,o]of terrainMemory)if(now-o.seen>(o.surface==='wall'&&o.poly?.length?12000:2500)||dist(o,me)>1400)terrainMemory.delete(key);
   while(terrainMemory.size>512)terrainMemory.delete(terrainMemory.keys().next().value);
   if(!progressAnchor)progressAnchor={...me};else if(dist(me,progressAnchor)>35){recoveries=[];escape=null;progressAnchor={...me}}
   const remembered=[...terrainMemory.entries()].filter(([key])=>!liveKeys.has(key)).map(([,o])=>o);
   const obstacles=all.filter(o=>['wall','chest','altar','breakable','cage','lantern','pumpkin'].includes(o.kind)).concat(walls,remembered);
   const projectiles=all.filter(o=>o.kind==='projectile').sort((a,b)=>dist(a,me)-dist(b,me)).slice(0,220),bulletDt=(now-bulletAt)/1000,used=new Set();
   for(const q of projectiles){q.vx=0;q.vy=0;
    if(bulletDt>.02&&bulletDt<.5){const matches=bulletHistory.map((p,i)=>({p,i,error:dist(q,{x:p.x+(p.vx||0)*bulletDt,y:p.y+(p.vy||0)*bulletDt})})).filter(c=>!used.has(c.i)&&c.error<Math.min(180,Math.max(35,1600*bulletDt+12))).sort((a,b)=>a.error-b.error);
     if(matches[0]&&(!matches[1]||matches[1].error-matches[0].error>3)){const match=matches[0];used.add(match.i);q.vx=Math.max(-1600,Math.min(1600,(q.x-match.p.x)/bulletDt));q.vy=Math.max(-1600,Math.min(1600,(q.y-match.p.y)/bulletDt))}
    }
   }
   bulletHistory=projectiles.map(p=>({...p}));bulletAt=now;
   for(const h of hazards){const key=(h.shape||'generic')+':'+Math.round(h.x/8)+':'+Math.round(h.y/8)+':'+Math.round(h.r/8),old=castHistory.get(key);
    if(Number.isFinite(h.progress)){const dt=old?(now-old.at)/1000:0,rate=dt>.02?(h.progress-old.progress)/dt:0;h.eta=rate>.05&&rate<10?(1-h.progress)/rate:old?.rate?(1-h.progress)/old.rate:null;castHistory.set(key,{at:now,progress:h.progress,rate:rate>.05&&rate<10?rate:old?.rate})}
   }
   for(const [k,v]of castHistory)if(now-v.at>800)castHistory.delete(k);
   function bulletRisk(p,ahead=0){let n=0;for(const q of projectiles){const d=dist(p,{x:q.x+q.vx*ahead,y:q.y+q.vy*ahead}),margin=me.r+q.r+10;if(d<margin+24)n+=d<margin?180+(margin-d)*5:45*(1-(d-margin)/24)}return n}
   function risk(p,ahead=0){let n=bulletRisk(p,ahead);for(const e of enemies){const margin=e.r+me.r+40,d=dist(p,{x:e.x+(e.vx||0)*Math.min(ahead,.3),y:e.y+(e.vy||0)*Math.min(ahead,.3)});if(d<margin)n+=35*(1-d/margin)**2}for(const h of hazards){const d=shapeDistance(p,h)-me.r-8;if(d<32){const urgency=h.eta!==null&&Number.isFinite(h.eta)&&h.eta<.4?1.4:1;n+=(d<0?100+Math.min(500,-d*2.5):40*(1-d/32))*urgency}}return n}
   let tti=Infinity;for(const q of projectiles){const vx=q.vx,vy=q.vy,den=vx*vx+vy*vy;if(den<1){if(dist(me,q)<me.r+q.r+14)tti=0;continue}const t=Math.max(0,Math.min(.75,((me.x-q.x)*vx+(me.y-q.y)*vy)/den));if(dist(me,{x:q.x+vx*t,y:q.y+vy*t})<me.r+q.r+14)tti=Math.min(tti,t)}
   const zoneDanger=hazards.some(h=>shapeDistance(me,h)<me.r+16),danger={bossMotion:motionWarnings.map(w=>w.motion),imminent:zoneDanger||tti<.75,hazards:zoneDanger,projectiles:tti<.75,tti:Number.isFinite(tti)?tti:null};
   const currentRisk=risk(me),hp=f.hp,survival=config.farmGoal==='survival';
   const activeSlot=(f.skillSlots||[]).find(s=>s.active&&s.complete),activeMoves=(activeSlot?.ids||[]).map(id=>typeof HAB_DATA!=='undefined'?HAB_DATA.moves[id]:null).filter(m=>m&&m.kind!=='buff');
   const longKinds=new Set(['meteor','projectile','boomerang','homing','bounce','beam','chain','turret','charge']);
   const observedRanged=activeMoves.some(m=>longKinds.has(m.kind)),observedMelee=activeMoves.length>0&&!observedRanged;
   const moveReach=m=>{const edition=typeof HAS!=='undefined'?HAS.id:'original',facts=typeof HAB_COMBAT!=='undefined'?HAB_COMBAT[edition]?.[m.id]:null,level=activeSlot?.ids.length===1&&activeSlot.levelVerified?activeSlot.level:1,v=facts?.[Math.min((level||1)-1,(facts?.length||1)-1)];return v?.speed&&v?.life?v.speed*v.life:v?.radius||m.coneReach||m.radius||(longKinds.has(m.kind)?320:80)};
   const combatGap=observedMelee?Math.max(35,Math.min(105,...activeMoves.map(m=>moveReach(m)*.75))):activeMoves.length?Math.max(90,Math.min(240,...activeMoves.filter(m=>longKinds.has(m.kind)).map(m=>moveReach(m)*.65))):210;
   const bosses=enemies.filter(e=>e.kind==='boss');
   if(survival&&hp!==null){if(hp<Math.max(.55,config.retreatHp/100))recoveringHp=true;else if(hp>=.72)recoveringHp=false}else if(!survival)recoveringHp=false;
   const low=hp!==null&&(survival?recoveringHp:hp<config.retreatHp/100);
   const ring=enemies.filter(e=>dist(e,me)<Math.max(125,me.r+e.r+90)),sectors=new Set(ring.map(e=>Math.floor((Math.atan2(e.y-me.y,e.x-me.x)+Math.PI)*4/Math.PI)%8)),encircled=ring.length>=5&&sectors.size>=5;
   if(breakout&&(danger.imminent||now>breakout.until||dist(me,breakout.start)>180||!encircled&&now-breakout.at>500))breakout=null;
   if(encircled&&!danger.imminent&&!breakout){let candidate=null;for(const keys of dirs.slice(1)){const v=vec(keys),end={x:me.x+v.x*210,y:me.y+v.y*210};let blocked=false,score=risk(end,1)*5;for(let d=12;d<=210;d+=12){const q={x:me.x+v.x*d,y:me.y+v.y*d};if(obstacles.some(o=>shapeDistance(q,o)<me.r+4)){blocked=true;break}score+=risk(q,d/speed)*.25}if(!blocked&&(!candidate||score<candidate.score))candidate={score,end}}if(candidate)breakout={...candidate,at:now,until:now+1600,start:{...me}}}

   for(const o of all){if(['door','cage','lantern','gem','candy','ticket25','pumpkin','reward','chest','rift','coin','ticket','ticket10','heal','healzone','magnet','orb','altar','item','breakable'].includes(o.kind))memory.set(id(o),{...o,seen:now})}
   // Do not chase an object that disappeared while its last position is still on screen.
   const visibleIds=new Set(all.map(id));
   for(const [k,o] of memory){const sx=f.camera.a*o.x+f.camera.c*o.y+f.camera.e,sy=f.camera.b*o.x+f.camera.d*o.y+f.camera.f;
    if(now-o.seen>(o.kind==='rift'?2500:15000)||dist(o,me)>1500||(!visibleIds.has(k)&&sx>30&&sy>30&&sx<f.width-30&&sy<f.height-30&&now-o.seen>500))memory.delete(k);
   }
   // Maintain one portal objective through brief rendering gaps. A countdown is
   // an expiry estimate, not a blanket six-second rejection at its entrance.
   const forceRift=config.riftMode==='force'&&config.farmGoal!=='survival'&&config.seekRifts;
   const portals=all.filter(o=>o.kind==='rift');
   if(portalLock){
    const seen=portals.filter(o=>dist(o,portalLock)<180).sort((a,b)=>Number(!!a.approximate)-Number(!!b.approximate)||dist(a,portalLock)-dist(b,portalLock))[0];
    if(seen)portalLock={...portalLock,...seen,seen:now,expires:Number.isFinite(seen.ttl)?now+seen.ttl*1000:portalLock.expires};
    if(now-portalLock.seen>(forceRift?2500:1100)||now>=portalLock.expires||!config.seekRifts||!forceRift&&(low||hp===null))portalLock=null;
   }
   const potential=[...memory.values(),...all.filter(o=>['xp','boss','elite','thief','pokemon'].includes(o.kind))];
   const profile=profiles[config.farmGoal]||profiles.coins,resource=config.farmGoal!=='survival';
   const weights={door:155,cage:170,lantern:145,gem:config.remainingGoals?.gems>0?220:90,candy:config.remainingGoals?.candy>0?210:75,ticket25:300,pumpkin:config.remainingGoals?.candy>0?65:15,reward:config.farmGoal==='tickets'?160:120,coin:config.farmGoal==='coins'?90:55,ticket:120,ticket10:170,xp:(f.level||1)<8?80:22,chest:100,rift:90,boss:70,thief:110,elite:30,pokemon:8,heal:low?240:hp!==null&&hp<.85?75:0,healzone:low?220:hp!==null&&hp<.85?60:0,magnet:55,orb:60,altar:35,item:40,breakable:8};
   Object.assign(weights,profile.weights);
   if(f.golden&&resource){weights.elite=55;weights.coin+=20}

   if(!resource){Object.assign(weights,{coin:0,ticket:0,ticket10:0,ticket25:0,gem:0,candy:0,door:0,cage:0,lantern:0,pumpkin:0,chest:145,reward:160,rift:150,item:95,altar:80,thief:0,elite:0,xp:(f.level||1)<20?95:55,heal:hp!==null&&hp<.9?260:0,healzone:hp!==null&&hp<.9?240:0,boss:140});}
   else for(const k of ['coins','tickets','gems','candy'])if(config.remainingGoals?.[k]>0)for(const kind of ({coins:['coin'],tickets:['ticket','ticket10','ticket25'],gems:['gem'],candy:['candy']}[k]))weights[kind]*=1.7;
   // Use observed attack slots, not character level alone, to assess readiness.
   const core=[...new Set((config.coreMoves||[]).filter(id=>typeof id==='string'))];
   const attackSlots=(f.skillSlots||[]).filter(s=>s.complete===true&&Array.isArray(s.ids)&&s.ids.length&&s.ids.length<=4&&new Set(s.ids).size===s.ids.length&&s.ids.some(id=>typeof HAB_DATA!=='undefined'&&HAB_DATA.moves[id]&&HAB_DATA.moves[id].kind!=='buff'));
   const coreBondSize=Math.max(0,...attackSlots.filter(s=>core.length===4&&s.ids.every(id=>core.includes(id))).map(s=>s.ids.length));
   const needsBond=core.length===4?coreBondSize<4:!attackSlots.some(s=>s.ids.length>1);
   const strongAttack=attackSlots.some(s=>s.ids.length>1||s.levelVerified===true&&s.level>=3);
   const minRiftHp=Math.max(config.bossHp/100,strongAttack?.75:.9),minRiftLevel=Math.max(config.bossLevel,strongAttack?8:16);
   if(survival)weights.rift=needsBond?320:150;
   // Bound expensive route checks to nearby opportunities, cache only geometry;
   // threats and HP are reassessed every frame, including while committed.
   const opportunities=potential.filter(o=>['rift','chest','reward','item','altar','heal','healzone'].includes(o.kind)).sort((a,b)=>Number(b.kind==='rift')-Number(a.kind==='rift')||dist(me,a)-dist(me,b)).slice(0,12);
   const routeMemo=new Map();
   function opportunity(o){
    if(routeMemo.has(o))return routeMemo.get(o);
    const fail={safe:false,length:Infinity};
    if(!opportunities.some(candidate=>id(candidate)===id(o))&&o!==portalLock||dist(me,o)>950){routeMemo.set(o,fail);return fail}
    const solid=obstacles.filter(w=>w.surface!=='liquid'&&!(w.kind===o.kind&&dist(w,o)<8));
    const clear=(a,b)=>{const steps=Math.max(1,Math.ceil(dist(a,b)/8));for(let i=1;i<=steps;i++){const q={x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps};if(solid.some(w=>dist(q,w)<w.r+me.r+4&&shapeDistance(q,w)<me.r+4))return false}return true};
    let points=[o];
    if(!clear(me,o)){
     const key=id(o),signature=solid.map(w=>id(w)+':'+w.r).join('|'),old=opportunityRoutes.get(key);
     if(old&&now-old.at<500&&dist(old.start,me)<24&&old.signature===signature)points=old.points;
     else{points=terrainRoute(me,o,obstacles);opportunityRoutes.set(key,{at:now,start:{...me},signature,points})}
     // The route finder can return a partial path. Never treat it as arrival.
     if(!points?.length||!clear(me,points[0])||!clear(points[points.length-1],o)){routeMemo.set(o,fail);return fail}
     points=[...points,o];
    }
    let from=me,length=0,peak=0;
    for(const to of points){const d=dist(from,to),steps=Math.max(1,Math.ceil(d/24));for(let i=1;i<=steps;i++){const q={x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps};peak=Math.max(peak,risk(q,Math.min(.3,(length+d*i/steps)/speed)))}length+=d;from=to}
    const result={safe:peak<18,length};routeMemo.set(o,result);return result;
   }
   for(const [k,v]of opportunityRoutes)if(now-v.at>2000)opportunityRoutes.delete(k);
   let riftRejected='';
   const portalTTL=o=>Number.isFinite(o.ttl)?o.ttl-(now-(o.seen??now))/1000:Infinity;
   function eligible(o){
    if(ignore.has(id(o)))return false;
    if(o.kind==='rift'){
     const committed=portalLock&&dist(o,portalLock)<180;
     const time=portalTTL(o),near=dist(me,o)<110;
     if(!config.seekRifts){riftRejected='đã tắt theo cổng';return false}
     if(survival){
      if(f.arena||hp===null||low||!attackSlots.length||hp<(committed?Math.max(.72,minRiftHp-.03):minRiftHp)||(f.level||0)<minRiftLevel){riftRejected=hp===null?'chưa đọc được HP':!attackSlots.length?'chưa xác nhận chiêu sát thương':low||hp<minRiftHp?'cần hồi máu trước':'cần tăng cấp trước';return false}
      const route=opportunity(o);
      if(danger.imminent||encircled||currentRisk>10||!route.safe){riftRejected='đường tới cổng đang nguy hiểm hoặc chưa tìm được đường';return false}
      if(time<=route.length/speed+1){riftRejected='không đủ thời gian đi theo đường an toàn';return false}
     }
     if(resource&&!forceRift&&(hp===null||low||!committed&&(hp<config.bossHp/100||(f.level||0)<config.bossLevel))){riftRejected=hp===null?'chưa đọc được HP':low||hp<config.bossHp/100?'HP chưa đủ ngưỡng':'cấp chưa đủ ngưỡng';return false}
     if(forceRift?time<=0:time<=.15||!near&&time<Math.max(1.5,dist(me,o)/speed+1)){riftRejected='không còn đủ thời gian tiếp cận';return false}
     if(!forceRift&&!committed&&!near&&currentRisk>10){riftRejected='vùng tiếp cận đang nguy hiểm';return false}
    }
    if(['door','cage','lantern'].includes(o.kind)&&(!config.seekEvents||f.arena||f.events?.some(e=>e.kind===o.kind&&e.status!=='active')&&!f.events?.some(e=>e.kind===o.kind&&e.status==='active')))return false;
    if(o.kind==='boss'&&survival&&!f.arena&&(hp===null||hp<.65||(f.level||0)<12||!(f.skillSlots||[]).some(s=>s.complete&&s.ids?.length&&(s.ids.length>1||s.levelVerified&&s.level>=3))))return false;
    if(['boss','elite','thief'].includes(o.kind)&&!config.seekBosses)return false;
    if(['chest','reward'].includes(o.kind)&&(!config.seekChests||low))return false;
    if(survival&&['chest','reward','item','altar'].includes(o.kind)){
     if(hp===null||hp<.65||low||danger.imminent||encircled||currentRisk>10||!opportunity(o).safe)return false;
     // Opening requires standing still. Do not begin/continue beside enemies,
     // even if current contact damage is low; abort when they approach.
     if(o.kind==='chest'&&enemies.some(e=>dist(e,o)<e.r+me.r+(e.kind==='boss'?240:135)))return false;
    }
    if(['coin','ticket','ticket10','ticket25','gem','candy'].includes(o.kind)&&!config.collectLoot)return false;
    if(low&&!['heal','healzone','magnet'].includes(o.kind)&&!(forceRift&&o.kind==='rift'))return false;
    return weights[o.kind]>0;
   }
   const previousTarget=target;
   const scored=potential.filter(eligible).map(o=>{
    let danger=risk(o);for(const t of [.33,.66])danger+=risk({x:me.x+(o.x-me.x)*t,y:me.y+(o.y-me.y)*t})*.35;
    if(['boss','elite','thief','pokemon'].includes(o.kind))danger*=.25;
    return {o,score:weights[o.kind]/(1+dist(me,o)/180)-danger*.9+(target&&id(target)===id(o)?22:0)};
   }).sort((a,b)=>b.score-a.score);
   const locked=portalLock&&eligible(portalLock)?portalLock:null;
   // Rift is a separate decision tier: loose coins/XP cannot outscore it.
   const riftFirst=potential.filter(o=>o.kind==='rift'&&(!survival||needsBond)&&eligible(o)).sort((a,b)=>Number(!!a.approximate)-Number(!!b.approximate)||dist(a,me)-dist(b,me))[0];
   const arenaEnemies=enemies.filter(o=>o.kind==='boss');
   if(f.arena&&arenaEnemies.length)arenaBoss={...arenaEnemies.sort((a,b)=>dist(a,me)-dist(b,me))[0],seen:now};
   if(!f.arena)arenaBoss=null;
   const obelisk=all.filter(o=>o.kind==='obelisk'&&o.confirmed===true).sort((a,b)=>dist(a,me)+risk(a)*4-dist(b,me)-risk(b)*4)[0];
   const fight=obelisk|| (f.arena?(arenaBoss&&now-arenaBoss.seen<1000?arenaBoss:enemies[0]):null);
   const rewardKinds=['gem','candy','ticket25','reward','ticket10','ticket','item','orb','coin','heal','magnet'];
   const rewards=f.arena&&!fight?scored.filter(s=>rewardKinds.includes(s.o.kind)):[];
   const encounter=fight&&!low?fight:null;
   const readyBoss=survival&&!f.arena&&!low&&hp!==null&&hp>=.65&&(f.level||0)>=12&&(f.skillSlots||[]).some(s=>s.complete&&s.ids?.length&&(s.ids.length>1||s.levelVerified&&s.level>=3));
   const mapBoss=readyBoss&&config.seekBosses?enemies.find(o=>o.kind==='boss'&&dist(o,me)<650):null;
   const chestObserved=all.filter(o=>o.kind==='chest');
   if(dwell?.target){const observed=chestObserved.find(o=>dist(o,dwell.target)<20);if(observed){dwell.target=observed;dwell.seen=now}}
   const opening=dwell?.target&&now-dwell.seen<900&&eligible(dwell.target)?dwell.target:null;
   const entrance=potential.filter(o=>o.kind==='rift'&&!o.approximate&&dist(me,o)<110&&eligible(o)).sort((a,b)=>dist(a,me)-dist(b,me))[0];
   const eventProps=all.filter(o=>['door','cage','lantern'].includes(o.kind));
   if(eventLock){const seen=eventProps.find(o=>o.kind===eventLock.kind&&dist(o,eventLock)<42);if(seen)eventLock={...eventLock,...seen,seen:now};if(now-eventLock.seen>1000||!eligible(eventLock))eventLock=null}
   const eventsFirst=scored.filter(s=>['door','cage','lantern'].includes(s.o.kind)&&s.score>0).sort((a,b)=>b.score-a.score)[0]?.o;
   const npc=all.find(o=>o.kind==='escortNpc'),home=all.find(o=>o.kind==='escortGoal');
   if(resource&&config.seekEvents&&!f.arena&&(npc||home)){escort||={seen:now,following:false};escort.seen=now;if(npc){escort.npc={...npc,seen:now};if(npc.escortPhase==='wait')escort.following=false;else if(npc.escortPhase==='follow')escort.following=true}if(home){escort.home={...home,seen:now};if(home.following)escort.following=true}}
   if(escort&&(!resource||!config.seekEvents||f.arena||now-escort.seen>1600||f.events?.some(e=>e.kind==='escort'&&e.status!=='active')))escort=null;
   let escortTarget=null;if(escort&&!low){const fresh=escort.npc&&now-escort.npc.seen<1500?escort.npc:null;if(!escort.following)escortTarget=fresh;else if(fresh&&dist(me,fresh)>Math.max(100,(me.bodyRadius||me.r)+fresh.r+55))escortTarget={...fresh,regroup:true};else if(escort.home&&now-escort.home.seen<1500)escortTarget=escort.home}
   const forcedTarget=!f.arena&&forceRift?(locked||riftFirst||entrance):null;
   const safeHeal=survival&&hp!==null&&hp<.85?scored.find(s=>['heal','healzone'].includes(s.o.kind)&&s.score>0&&dist(me,s.o)<250&&opportunity(s.o).safe)?.o:null;
   // Complete a nearly-open safe chest before switching to a new Rift. A full
   // core removes the Rift priority tier; further Rifts compete by utility.
   const finishChest=survival&&opening&&opening.progress>=.65?opening:null;
   target=forcedTarget|| (low?(scored[0]?.score>0?scored[0].o:null):f.arena?(encounter||(rewards[0]?.score>0?rewards[0].o:null)):safeHeal||(!low?obelisk:null)||finishChest||locked||riftFirst||(!survival?entrance:null)||mapBoss||escortTarget||eventLock||opening||eventsFirst||(scored[0]?.score>0?scored[0].o:null));
   if(!low&&!danger.imminent&&previousTarget&&target&&['xp','coin','ticket','ticket10','gem','candy','item'].includes(target.kind)&&['xp','coin','ticket','ticket10','gem','candy','item'].includes(previousTarget.kind)){
    const old=scored.find(s=>id(s.o)===id(previousTarget)),best=scored.find(s=>id(s.o)===id(target));if(old&&best&&old.score>0&&best.score<old.score*1.2)target=old.o;
   }
   if(target?.kind==='rift'&&!portalLock)portalLock={...target,seen:now,expires:Number.isFinite(target.ttl)?now+portalTTL(target)*1000:Infinity};
   if(portalLock&&target?.kind!=='rift')portalLock=null;
   if(target&&['door','cage','lantern'].includes(target.kind)&&!eventLock)eventLock={...target,seen:now,at:now,lastProgress:target.progress||0,lastProgressAt:now};
   let phase=low?'retreat':target?'collect':'explore',reason=low?'Ưu tiên hồi máu và rút khỏi vùng nguy hiểm':target?'Tiếp cận '+(labels[target.kind]||target.kind):'Tìm tài nguyên trong vùng chưa đi';
   if(survival&&target?.kind==='rift')reason+=needsBond?' · Tăng sức mạnh / hoàn thiện Bond core':' · Cơ hội tăng sức mạnh an toàn';
   if(riftRejected&&target?.kind!=='rift')reason+=' · Cổng: '+riftRejected;
   const desiredRange=target&&['obelisk','boss','elite','thief','pokemon','breakable','pumpkin'].includes(target.kind)?(activeMoves.length?combatGap:(f.arena||survival?Math.max(config.combatStyle==='melee'||config.buildStyle==='melee'?120:210,config.combatRange):config.combatRange))+(target.anim==='Charge'?60:0)+target.r:target&&['door','cage','lantern'].includes(target.kind)?Math.min((target.kind==='door'?44:target.kind==='cage'?56:48)+me.r-12,me.r+target.r+10):target?.regroup?48:target?.kind==='chest'?me.r+target.r+12:target?.kind==='altar'?me.r+target.r+8:0;
   let holding=false;
   const chestRange=target?.kind==='chest'?Math.max(46,me.r+target.r+24):0;
   const chestHazard=danger.imminent||hazards.some(h=>shapeDistance(me,h)<me.r+6);
   if(target?.kind==='chest'&&dist(me,target)<chestRange-5&&!low&&!chestHazard&&!breakout&&currentRisk<32){
    if(!dwell||!dwell.target||dist(dwell.target,target)>20)dwell={id:id(target),target,seen:now,at:now,lastProgress:0,lastProgressAt:now};
    if(Number.isFinite(target.progress)&&target.progress>dwell.lastProgress+.005){dwell.lastProgress=target.progress;dwell.lastProgressAt=now}
    const estimate=Number.isFinite(target.progress)?target.progress:Math.min(.95,(now-dwell.at)/3500);
    const reason='Đứng yên mở rương khóa · '+Math.round(estimate*100)+'%'+(Number.isFinite(target.progress)?' từ vòng tiến độ':' ước tính · chờ rương biến mất');
    held=[];history=[];
    if(now-dwell.at>8000&&now-dwell.lastProgressAt>3000){ignore.set(id(target),now+15000);dwell=null;return {keys:[],phase:'chest-timeout',reason:'Chưa xác nhận rương mở sau thời gian chờ; kiểm tra phạm vi tương tác',target,me,end:me,risk:currentRisk}}
    return {keys:[],phase:'chest',reason,target,me,end:me,risk:currentRisk,dwell:now-dwell.at};
   }else{if(target?.kind==='chest'&&(low||chestHazard||currentRisk>=32))reason='Tạm ngừng mở rương để tránh nguy hiểm';dwell=null}
   if(target&&['door','cage','lantern'].includes(target.kind)&&!target.hintOnly&&!low&&!danger.imminent&&!breakout&&currentRisk<65){
    const seconds=target.kind==='cage'?6:target.kind==='lantern'?1.5:1,range=(target.kind==='cage'?56:target.kind==='lantern'?48:44)+me.r;
    if(dist(me,target)<range-7){const lock=eventLock;if(!lock.holdAt){lock.holdAt=now;lock.lastProgressAt=now}if(Number.isFinite(target.progress)&&target.progress>lock.lastProgress+.005){lock.lastProgress=target.progress;lock.lastProgressAt=now}if(now-lock.holdAt>Math.max(12000,seconds*3000)&&now-lock.lastProgressAt>4000){ignore.set(id(target),now+15000);eventLock=null;return{keys:[],phase:'event-timeout',reason:'Chưa xác nhận tương tác; tạm bỏ mục tiêu để tránh kẹt',target,me,end:me}}
     held=[];history=[];return{keys:[],phase:'event-hold',reason:'Giữ vị trí · '+labels[target.kind]+' · '+(Number.isFinite(target.progress)?Math.round(target.progress*100)+'%':'chờ game xác nhận'),target,me,end:me,risk:currentRisk,danger};
    }
   }
   if(target?.kind==='escortNpc')reason=target.regroup?'Quay lại chờ Pokémon theo kịp':'Tiếp cận Pokémon bị lạc để bắt đầu hộ tống';
   if(target?.kind==='escortGoal'){phase='escort';reason='Dẫn Pokémon về điểm xanh';const friend=escort?.npc&&now-escort.npc.seen<1500?escort.npc:null;if(!target.approximate&&friend){const home=escort.home;if(dist(friend,home)<42&&!danger.imminent&&!breakout&&!breakout&&currentRisk<40){held=[];history=[];return{keys:[],phase:'escort-wait',reason:'Pokémon được hộ tống đã ở trong vùng xanh; chờ game xác nhận',target,me,end:me,danger}}if(dist(friend,home)>=42){const length=dist(friend,home)||1;escort.lead ||= {x:(home.x-friend.x)/length,y:(home.y-friend.y)/length};const offset=(me.bodyRadius||me.r)+friend.r+28;target={...target,x:home.x+escort.lead.x*offset,y:home.y+escort.lead.y*offset,escortLead:true};reason='Đi vượt vòng xanh để Pokémon theo sau vào vùng cứu hộ'}}}

   if(target?.kind==='healzone'&&dist(me,target)<20&&hp!==null&&hp<.93&&currentRisk<8){holding=true;phase='heal';reason='Đứng trong suối để hồi máu'}
   if(target&&['boss','elite','thief','pokemon'].includes(target.kind)){phase='combat';reason='Giữ cự ly với '+(labels[target.kind]||'quái')}
   if(target?.kind==='rift'){phase='rift';reason=(forceRift?'Ưu tiên cổng boss':'Tiếp cận cổng boss')+' · '+(target.approximate?'đi theo chỉ báo HUD':'tiếp cận điểm vào')+' · '+(Number.isFinite(target.ttl)?Math.max(0,Math.ceil(portalTTL(target)))+'s còn lại':'đã đủ điều kiện')+(survival?(needsBond?' · Cần hoàn thiện Bond / tăng sức mạnh':' · Cơ hội tăng sức mạnh an toàn'):'')}
   if(f.arena&&!low){phase=fight?'arena-combat':'arena-loot';reason=fight?'Đấu trường Rift · giữ cự ly đánh boss, bỏ qua loot khi đang giao chiến':target?'Đấu trường Rift · thu phần thưởng quan sát được':'Đấu trường Rift · chờ nhận diện boss / phần thưởng'}
   if(f.arena&&low)reason='Đấu trường Rift · HP thấp, ưu tiên né đòn và hồi phục';
   // Inside the actual entry radius, stop and wait briefly for the teleport.
   // An approximate HUD location never counts as confirmed entry.
   if(target?.kind==='rift'&&!target.approximate&&dist(me,target)<23&&!danger.imminent){
    portalLock.entryAt=portalLock.entryAt||now;
    held=[];history=[];
    const reason=now-portalLock.entryAt<1800?'Đã ở vùng vào cổng · chờ chuyển đấu trường':'Chưa xác nhận chuyển đấu trường · cần kiểm tra vị trí nhận diện cổng';
    if(now-portalLock.entryAt>3500)return {keys:[],phase:'blocked',reason,stop:true,target,me,end:me,risk:currentRisk};
    return {keys:[],phase:'rift-enter',reason,target,me,end:me,risk:currentRisk};
   }
   if(target?.kind==='obelisk'){phase='combat';reason='Phá cột hồi máu trước khi đánh boss'}
   if(danger.imminent){phase='evade';reason=danger.bossMotion?.length?'Né boss lao tới / vừa đổi vị trí':danger.hazards?'Né vùng báo chiêu boss · ưu tiên ra khỏi vùng đánh':'Né đạn đang bay tới · ưu tiên đường tránh va chạm'}
   let escaping=false;
   if(held.length&&!holding){history.push({x:me.x,y:me.y,t:now});history=history.filter(p=>now-p.t<=2000);
    if(history.length>5&&now-history[0].t>1400&&dist(me,history[0])<5){
     const v=vec(held),learned={x:me.x+v.x*(me.r+24),y:me.y+v.y*(me.r+24),r:8,until:now+8000,kind:'wall',surface:'wall'};walls.push(learned);obstacles.push(learned);routeCache=null;escape={v,until:now+1000};
     if(target?.kind!=='rift'){if(target)ignore.set(id(target),now+12000);target=null}else{portalLock=null}dwell=null;history=[];heading=(heading+3)%8;escaping=true;
     recoveries=recoveries.filter(t=>now-t<30000).concat(now);
     if(recoveries.length>=6)return {keys:[],phase:'blocked',reason:'Không thoát được vật cản sau nhiều lần; hãy di chuyển tay',stop:true,me};
    }
   }else history=[];
   let steeringTarget=target;
   if(target&&!danger.imminent&&obstacles.some(o=>o.surface!=='liquid')){
    const obstacleKey=obstacles.map(o=>wallKey(o)).sort().join('|');
    if(!routeCache||routeCache.obstacleKey!==obstacleKey||now-routeCache.at>600||dist(routeCache.target,target)>48||dist(routeCache.me,me)>96)routeCache={obstacleKey,at:now,target:{...target},me:{...me},points:terrainRoute(me,target,obstacles)||[]};
    while(routeCache.points.length&&dist(me,routeCache.points[0])<20)routeCache.points.shift();
    for(let i=Math.min(8,routeCache.points.length-1);i>0;i--){const dest=routeCache.points[i],length=dist(me,dest),steps=Math.ceil(length/6);let clear=true;for(let j=1;j<=steps&&clear;j++){const q={x:me.x+(dest.x-me.x)*j/steps,y:me.y+(dest.y-me.y)*j/steps};if(obstacles.some(o=>o.surface!=='liquid'&&shapeDistance(q,o)<me.r+5))clear=false}if(clear){routeCache.points.splice(0,i);break}}
    if(routeCache.points.length){steeringTarget=routeCache.points[0];reason+=' · đi vòng vật cản'}
   }else routeCache=null;
   if(breakout&&!danger.imminent){steeringTarget=breakout.end;holding=false;phase='breakout';reason='Phá vòng vây · giữ hướng ra phía ít quái, tránh vật cản'}
   const cell=Math.round(me.x/80)+','+Math.round(me.y/80);visited.set(cell,now);for(const [k,t] of visited)if(now-t>60000)visited.delete(k);
   let horizon=breakout&&!danger.imminent?180:danger.imminent?Math.max(60,Math.min(110,speed*.55)):target?.kind==='rift'?Math.max(8,Math.min(70,dist(me,target)*.6)):target&&['chest','door','cage','lantern','escortNpc','escortGoal'].includes(target.kind)?Math.max(8,Math.min(70,(dist(me,target)-desiredRange)*.6)):70;if(steeringTarget&&steeringTarget!==target)horizon=Math.min(horizon,Math.max(16,dist(me,steeringTarget)));let best=[],bestCost=Infinity,bestEnd=me;
   for(let i=0;i<dirs.length;i++){
    const keys=dirs[i],v=vec(keys),end={x:me.x+v.x*horizon,y:me.y+v.y*horizon};let cost=0;
    for(const t of [.25,.5,.75,1]){
     const p={x:me.x+(end.x-me.x)*t,y:me.y+(end.y-me.y)*t};cost+=risk(p,t*horizon/speed)*(low?2.4:survival?1.7:1);

    }
    const checks=Math.max(1,Math.ceil(horizon/6));
    for(let j=1;j<=checks;j++){const p={x:me.x+(end.x-me.x)*j/checks,y:me.y+(end.y-me.y)*j/checks};for(const o of obstacles){if(dist(p,o)>o.r+me.r+5)continue;const gap=shapeDistance(p,o)-me.r-3;if(gap<0)cost+=(o.surface==='liquid'?8+Math.min(12,-gap*.2):120+Math.min(220,-gap*4))*4/checks}}
    // Reject paths entering solid collision space, even when threat pressure is high.
    if(keys.length&&obstacles.some(o=>o.surface!=='liquid'&&dist(me,o)<o.r+horizon+me.r+2&&Array.from({length:checks},(_,j)=>{const p={x:me.x+(end.x-me.x)*(j+1)/checks,y:me.y+(end.y-me.y)*(j+1)/checks};return shapeDistance(p,o)<me.r+2&&shapeDistance(p,o)<shapeDistance(me,o)-.5}).some(Boolean)))continue;
    // Reject motion across boss collision space, even while routing to another
    // target. If already overlapping, permit only steps that leave the body.
    if(keys.length&&bosses.some(b=>Array.from({length:checks},(_,j)=>({x:me.x+(end.x-me.x)*(j+1)/checks,y:me.y+(end.y-me.y)*(j+1)/checks})).some(p=>dist(p,b)<b.r+me.r+8&&dist(p,b)<dist(me,b)-.5)))continue;
    if(target?.kind==='obelisk'&&bosses.length){const bossDistance=Math.min(...bosses.map(b=>dist(end,b)));cost+=Math.max(0,dist(end,target)-bossDistance+30)*.4}
    if(observedRanged)for(const b of bosses){const safe=b.r+me.r+90;cost+=Math.max(0,safe-dist(end,b))*.9;if(dist(me,b)<safe&&dist(end,b)<dist(me,b))cost+=100}
    if(!danger.imminent&&!breakout&&currentRisk<10&&held.length&&keys.length){const old=vec(held);cost+=(1-old.x*v.x-old.y*v.y)*1.5}
    if(escape&&now<escape.until&&!danger.imminent&&!holding){cost+=(v.x*escape.v.x+v.y*escape.v.y+1)*22;if(!keys.length)cost+=12}
    if(breakout&&!danger.imminent){cost+=dist(end,breakout.end)*.7+risk(end,horizon/speed)*5;if(!keys.length)cost+=180}
    if(holding)cost+=keys.length?15:0;
    else if(target){const range=steeringTarget!==target?0:desiredRange;cost+=Math.abs(dist(end,steeringTarget)-range)/horizon*(danger.imminent?1:7);if(!range)cost+=segment(steeringTarget,me,end)/horizon*(danger.imminent?.3:3);}
    else{const explore=vec(dirs[heading+1]);cost-=4*(v.x*explore.x+v.y*explore.y);const last=visited.get(Math.round(end.x/80)+','+Math.round(end.y/80));if(last)cost+=4*Math.max(0,1-(now-last)/30000);if(!keys.length)cost+=5}
    if(target&&!holding&&!keys.length&&dist(me,target)>desiredRange+25)cost+=10;
    // Continuous relative-motion check catches bullets that cross between samples.
    for(const q of projectiles){const rx=q.x-me.x,ry=q.y-me.y,vx=q.vx-v.x*speed,vy=q.vy-v.y*speed,den=vx*vx+vy*vy,t=Math.max(0,Math.min(.65,-(rx*vx+ry*vy)/(den||1))),d=Math.hypot(rx+vx*t,ry+vy*t),margin=me.r+q.r+10;if(d<margin)cost+=450*(1-d/margin)+80}
    if((f.arena||survival)&&target&&['boss','pokemon','elite'].includes(target.kind)&&!danger.imminent){const d=dist(target,me)||1,alignment=Math.abs(v.x*(target.x-me.x)/d+v.y*(target.y-me.y)/d);if(target.anim==='Charge')cost+=alignment*4+(keys.length?0:3);if(keys.length){cost-=1;if(observedRanged&&dist(me,target)>=desiredRange-30){const dx=(target.x-me.x)/d,dy=(target.y-me.y)/d;cost-=(v.x*(-dy)+v.y*dx)*1.8}}}
    if(keys.join()===held.join())cost-=.35;
    if(cost<bestCost){bestCost=cost;best=keys;bestEnd=end}
   }
   if(!holding&&best.length===0&&currentRisk<3){heading=(heading+1)%8}
   if(escaping||escape&&now<escape.until&&!danger.imminent&&!holding){phase='unstuck';reason='Lùi / né vật cản đã ghi nhận để thoát kẹt'}
   held=best;
   return {keys:best,phase,reason,target,me,end:bestEnd,risk:currentRisk,seen:all.length,unknown:all.filter(o=>o.kind==='unknown').length,danger,profile:config.farmGoal,arenaStage:f.arena?(fight?'combat':'loot'):null,dwell:dwell?now-dwell.at:0};
  }
  return {tick,reset,suspend};
 }
 return Object.freeze({create,validate,player,shapeDistance,labels,profiles});
})();

