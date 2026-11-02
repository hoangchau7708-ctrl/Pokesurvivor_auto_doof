/* Item and consumable policy based on observed HUD, not internal game state. */
const HAI=(()=>{
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const items={amuletcoin:['Amulet Coin','Moneda Amuleto'],luckyegg:['Lucky Egg','Huevo Suerte'],quickclaw:['Quick Claw','Garra Rápida'],leftovers:['Leftovers','Restos'],assaultvest:['Assault Vest','Chaleco Asalto'],shellbell:['Shell Bell','Cascabel Concha'],focussash:['Focus Sash','Banda Focus'],choicescarf:['Choice Scarf','Pañuelo Elección'],lifeorb:['Life Orb','Vidasfera'],rockyhelmet:['Rocky Helmet','Casco Dentado'],choiceband:['Choice Band','Cinta Elección']};
 const itemId=t=>Object.entries(items).find(([id,aliases])=>norm(t)===id||aliases.some(a=>(' '+norm(t)+' ').includes(' '+norm(a)+' ')))?.[0]||null;
 function itemScore(id,goal,hp,level=1,ctx={}){
  const s={amuletcoin:goal==='coins'?110:goal==='tickets'?48:38,luckyegg:level<12?86:38,quickclaw:goal==='tickets'?105:80,leftovers:76,shellbell:73,assaultvest:63,focussash:57,choicescarf:goal==='survival'?58:70,lifeorb:hp!==null&&hp>.8?58:12,rockyhelmet:35,choiceband:15};
  if(goal==='survival')for(const k of ['leftovers','shellbell','assaultvest','focussash'])s[k]+=18;
  if(hp!==null&&hp<.45){s.leftovers+=70;s.shellbell+=62;s.assaultvest+=60;s.focussash+=65;s.lifeorb=-50}
  const build=ctx.build;if(build){const melee=build.style==='melee',attacks=(build.moves||[]).filter(id=>typeof HAB_DATA!=='undefined'&&HAB_DATA.moves[id]?.kind!=='buff').length;if(melee){s.shellbell+=14;s.assaultvest+=8;s.rockyhelmet+=12}else{s.choicescarf+=8;s.rockyhelmet-=12}if(attacks>=3)s.quickclaw+=12;if(['poison-heal','regenerator','rain-dish','ice-body'].includes(build.ability)&&hp!==null&&hp>.8)s.lifeorb+=18;if((build.moves||[]).length>1)s.choiceband-=35}
  return s[id]??null;
 }
 function chooseItem(cards,goal,hp,ctx={}){
  const ranked=cards.map((c,index)=>{const id=itemId(c.title)||(index===0?itemId(ctx.item):null);return {index,id,name:c.title,score:itemScore(id,goal,hp,ctx.level,ctx)}});
  const preferred=ranked.find(c=>ctx.preferredItem&&c.id===ctx.preferredItem);
  if(preferred)return {...preferred,why:'Item ưu tiên do bạn chọn: '+preferred.name,ranked};
  const cur=ranked[0],best=ranked.filter(c=>c.score!==null).sort((a,b)=>b.score-a.score||a.index-b.index)[0];
  const chosen=cur&&cur.id&&best&&best.score>=cur.score+8?best:cur;
  return {...chosen,index:chosen?.index??-1,why:chosen?.index>0?'Đổi: '+chosen.id+' phù hợp '+goal+' / Pokémon / bộ chiêu / HP hơn '+(cur?.id||'item hiện tại'):'Giữ item: chưa có lợi ích rõ ràng hoặc chưa nhận diện đủ',ranked};
 }
 const orbIds=['slumber','slow','blowback','focus','luminous','quick'];
 function orbs(frame){return (Array.isArray(frame?.orbs)?frame.orbs:[]).filter(o=>orbIds.includes(o?.id)&&Number.isInteger(o.slot)&&o.slot>=0&&o.slot<4&&Number.isFinite(o.count)&&o.count>0&&o.count<=3).slice(0,4)}
 function chooseOrb(f,nav,config,active={}){
  if(!config.autoOrbs||!nav?.me||['waiting','blocked','rift-enter'].includes(nav.phase))return null;
  const me=nav.me,d=o=>Math.hypot(o.x-me.x,o.y-me.y),enemies=(f.objects||[]).filter(o=>['pokemon','boss','elite','thief'].includes(o.kind)&&o!==me&&!(o.dex===me.dex&&d(o)<1));
  const near=enemies.filter(o=>d(o)<160).length,contact=enemies.filter(o=>d(o)<85).length,crowd=enemies.filter(o=>d(o)<300).length,boss=enemies.some(o=>(o.kind==='boss'||f.arena)&&d(o)<420),hp=Number.isFinite(f.hp)?f.hp:null,low=hp!==null&&hp<config.retreatHp/100,travel=nav.target&&d(nav.target)>240;
  const imminent=!!nav.danger?.imminent;
  const ranked=[];for(const o of orbs(f)){if(o.ready===false||active[o.id]>0||Number(f.orbBuffs?.[o.id])>0)continue;let score=0,why='';
   if(o.id==='blowback'&&(contact>=3||low&&contact>=1)){score=120+contact;why='Đẩy quái sát người để thoát vây'}
   if(o.id==='slumber'&&(near>=5||low&&near>=1)){score=110+near;why='Khống chế quái quanh người khi nguy hiểm'}
   if(o.id==='slow'&&(near>=5||low&&near>=2||boss&&near>=2)){score=90+near;why='Làm chậm địch để giảm áp lực'}
   if(o.id==='focus'&&!low&&!imminent&&(boss||crowd>=8)){score=boss?75:55;why=boss?'Tăng chí mạng khi đánh boss':'Tăng sát thương khi đông quái'}
   if(o.id==='quick'&&(low&&near||travel&&['rift','collect','explore'].includes(nav.phase))){score=low?85:40;why=low?'Tăng tốc rút lui':'Tăng tốc tiếp cận mục tiêu xa'}
   if(o.id==='luminous'&&!low&&travel&&['rift','collect','explore'].includes(nav.phase)){score=25;why='Mở rộng tầm nhìn khi tìm tài nguyên/cổng'}
   if(imminent&&o.id==='quick'){score=145;why='Tăng tốc thoát vùng báo chiêu / đường đạn'}
   if(imminent&&boss&&o.id==='slumber'){score=Math.max(score,120);why='Khống chế boss để giảm áp lực khi né đòn'}
   if(imminent&&boss&&o.id==='slow'){score=Math.max(score,110);why='Làm chậm boss hỗ trợ giữ cự ly'}
   if(score)ranked.push({...o,score,why});
  }return ranked.sort((a,b)=>b.score-a.score||a.slot-b.slot)[0]||null;
 }
 function createOrbManager(){let pending=null,last=0,effects={},blocked={},attempts={};
  function reset(){pending=null;last=0;effects={};blocked={};attempts={}}
  function tick(f,nav,config,now){
   if(pending){const seen=orbs(f).find(o=>o.slot===pending.slot&&o.id===pending.id);
    if(!seen&&pending.missingSeq!==f.seq){pending.missingSeq=f.seq;pending.missing=(pending.missing||0)+1}else if(seen)pending.missing=0;
    if(seen&&seen.count<pending.count||!seen&&pending.missing>=2||Number(f.orbBuffs?.[pending.id])>0){effects[pending.id]=now+({slumber:4000,slow:8000,blowback:1200,focus:15000,luminous:15000,quick:10000}[pending.id]);attempts[pending.id]=0;pending=null}
    else if(now-pending.at<1600)return null;
    else{attempts[pending.id]=(attempts[pending.id]||0)+1;blocked[pending.id]=now+(attempts[pending.id]>=2?8000:1000);pending=null}
   }
   if(now-last<1250)return null;
   const active=Object.fromEntries(Object.entries(effects).map(([id,end])=>[id,Math.max(0,end-now)]));for(const [id,end]of Object.entries(blocked))if(end>now)active[id]=end-now;
   const choice=chooseOrb(f,nav,config,active);if(!choice)return null;pending={...choice,at:now};last=now;return {...choice,key:String(choice.slot+5)};
  }return {tick,reset};
 }
 function createZMoveManager(){let pending=null,last=-Infinity,failures=0,id=null;
  const reset=()=>{pending=null;last=-Infinity;failures=0;id=null};
  function tick(f,nav,config,now){
   if(!config.autoZMove||typeof HAS==='undefined'||!HAS.doofcraft||!nav?.me||!Number.isFinite(now))return null;
   const z=f?.zMove;if(!z||z.verified!==true||typeof HAZ_DATA==='undefined'||!HAZ_DATA.some(v=>v.id===z.id))return null;
   if(z.id!==id){reset();id=z.id}
   if(z.ready===false){pending=null;failures=0;return null}if(z.ready!==true)return null;
   if(pending){if(now-pending<2200)return null;pending=null;failures++}
   if(now-last<(failures>=2?15000:3000)||['waiting','blocked','rift-enter'].includes(nav.phase))return null;
   const me=nav.me,dist=o=>Math.hypot(o.x-me.x,o.y-me.y),foes=(f.objects||[]).filter(o=>o!==me&&['pokemon','boss','elite','thief'].includes(o.kind)&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&dist(o)>Math.max(8,(me.r||8)*.8));
   const near=foes.filter(o=>dist(o)<120).length,crowd=foes.filter(o=>dist(o)<350).length,boss=foes.some(o=>o.kind==='boss'&&dist(o)<350),emergency=near>=2&&(Number.isFinite(f.hp)&&f.hp<.4||nav.phase==='breakout'||nav.danger?.imminent);
   if(!boss&&crowd<8&&near<5&&!emergency)return null;
   last=now;pending=now;return{key:'f',id:z.id,why:boss?'Z-Move đánh boss trong tầm':emergency||near>=5?'Z-Move phá vây khẩn cấp':'Z-Move dọn cụm quái đông'};
  }return{tick,reset};
 }
 function createReviveManager(){let last=-Infinity,attempts=0,absentAt=null;return{reset(){last=-Infinity;attempts=0;absentAt=null},tick(f,nav,config,now){
  const texts=f?.texts||[],ask=texts.some(t=>/^Use your Revive\?\s*\d+s$/i.test(t.trim())),hint=texts.some(t=>/No:.*Rift throws you out.*keep your Revive/i.test(t)),buttons=texts.some(t=>/^Yes$/i.test(t.trim()))&&texts.some(t=>/^No$/i.test(t.trim()));
  if(!ask||!hint||!buttons){absentAt??=now;if(now-absentAt>500)attempts=0;return null}absentAt=null;
  if(attempts>=2||now-last<1100)return{waiting:true,why:'Chờ game xác nhận lựa chọn Revive'};
  const near=nav?.me&&(f.objects||[]).some(o=>o.kind==='boss'&&Math.hypot(o.x-nav.me.x,o.y-nav.me.y)<180),risk=near||nav?.danger?.imminent===true;
  const decline=config.farmGoal!=='survival'&&risk;attempts++;last=now;return{key:decline?'n':'v',why:decline?'Farm: rời Rift, giữ Revive vì boss/nguy hiểm ở gần':'Dùng Revive để tiếp tục sinh tồn'};
 }}}
 return {createReviveManager,createZMoveManager,items,itemId,itemScore,chooseItem,chooseOrb,orbs,createOrbManager};
})();
