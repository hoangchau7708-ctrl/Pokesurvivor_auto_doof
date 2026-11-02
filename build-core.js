/* Target builds from source; resource/card policy authored for this tool. */
const HAB=(()=>{
 'use strict';
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const clean=s=>norm(s).replace(/\b(?:lv|lvl|level|nv|nivel)\s*\d+\b/g,'').replace(/\b(?:new|nuevo|moi|upgrade|learn|nang cap)\b/g,'').trim();
 const mons=new Map(HAB_DATA.mons.map(m=>[m.dex,m])),names=new Map(HAB_DATA.mons.flatMap(m=>m.aliases.map(n=>[norm(n),m.dex]))),moves=Object.values(HAB_DATA.moves);
 const moveName=id=>HAB_DATA.moves[id]?.name||id;
 const monLabel=m=>m.nationalDex?m.name+' #'+m.nationalDex+' · ID '+m.dex:m.name+' #'+m.dex;
 function effectiveDex(configured,observed){const mon=mons.get(Number(observed));return configured&&mon?.baseOf!==Number(configured)?Number(configured):Number(observed)||Number(configured)||0}
 function identify(texts){const ids=new Set((texts||[]).map(t=>names.get(clean(t))).filter(Boolean));return ids.size===1?[...ids][0]:0}
 function target(dex,style='best',goal='survival',ctx={}){
  const mon=mons.get(Number(dex));if(!mon)return null;const owned=new Set(ctx.availableTms||[]),allowed=ctx.movesVerified===true&&Number(ctx.movesDex)===Number(dex)&&Array.isArray(ctx.allowedMoves)&&ctx.allowedMoves.length?new Set(ctx.allowedMoves):null;
  const custom=ctx.customBuilds?.[String(dex)];if(Array.isArray(custom)&&custom.length===4&&new Set(custom).size===4&&custom.every(id=>HAB_DATA.moves[id]))return{dex:mon.dex,name:mon.name,style,goal,types:mon.types||[],moves:[...custom],referenceMoves:[...custom],unavailableMoves:allowed?custom.filter(id=>!allowed.has(id)):[],availability:allowed?'verified':'unverified',start:[],tms:[],variant:'custom',tmReason:'Core đã lưu riêng cho Pokémon này',knownTms:[...owned],item:ctx.item||null};
  return null;
 }
 function matchMove(title){const parts=String(title||'').split(/→|->/).map(clean);return moves.find(m=>m.aliases.concat(m.evolves).some(a=>parts.includes(norm(a))))||null}
 function owned(texts){return [...new Set((texts||[]).map(t=>matchMove(String(t).replace(/\s*\+\d+$/,''))?.id).filter(Boolean))]}
 const passiveAliases={magnet:['Magnet','Imán'],learning:['Learning','Aprendizaje'],power:['Power','Potencia'],reflexes:['Reflexes','Reflejos'],sprint:['Sprint','Carrera'],armor:['Armor','Coraza'],synthesis:['Synthesis','Síntesis'],vigor:['Vigor'],heal:['Sitrus Berry','Baya Zidra']};
 const passive=title=>Object.keys(passiveAliases).find(k=>passiveAliases[k].some(a=>norm(a)===clean(title)))||null;
 function choose(cards,build,seen=[],priority='balanced',ctx={}){
  const lvFor=(c,m)=>c.level||ctx.levels?.[m.id]||1;
  const known=new Set(seen),levels=ctx.levels||{},taken=ctx.passives||{},hp=Number.isFinite(ctx.hp)?ctx.hp:null;
  const goal=ctx.goal||'survival',resources=goal!=='survival',early=(ctx.level||1)<10,ranked=[];
  for(let index=0;index<cards.length;index++){
   const c=cards[index],move=matchMove(c.title),stat=passive(c.title),newMove=c.type==='new'||/\b(new|nuevo)\b/.test(norm(c.tag||'')),inBuild=move&&build?.moves.includes(move.id);
   let score=-Infinity,why='Không nhận diện chắc chắn';
   if(c.special&&ctx.autoSpecialCards!==false){
    if(c.special==='zmove'){score=ctx.autoZMove===false?-20:170;why='Z-Move: đòn diện rộng để đánh boss hoặc phá vây'}
    else if(c.special==='revive'){score=hp!==null&&hp<.45?175:142;why='Tích trữ một lần hồi sinh'}
    else if(c.special==='form'){score=165;why='Biến hình độc nhất: tăng sức mạnh cho Pokémon hiện tại'}
    else if(c.special==='plate'){const type=c.plateType,attacks=(build?.moves||[]).filter(id=>HAB_DATA.moves[id]?.kind!=='buff'),fit=(build?.types||[]).includes(type)||attacks.some(id=>HAB_DATA.moves[id]?.type===type);score=fit?146:52;why=fit?'Plate cùng hệ với Pokémon hoặc chiêu trong build':'Plate ngoài hệ build: chỉ dùng dự phòng'}
   }else if(c.type==='evo'&&move){score=180;why='Tiến hóa chiêu đang có'}
   else if(stat){
    const count=taken[stat]||0;
    const base={power:65,reflexes:63,sprint:30,armor:44,synthesis:46,vigor:38,magnet:25,learning:30,heal:hp===null?5:hp<.5?190:hp<.72?100:hp<.9?28:-40};
    score=base[stat];why='Tăng '+stat;
    if(resources&&['magnet','learning'].includes(stat)){score=(early?90:50)-count*18;why='Farm: '+(stat==='magnet'?'tăng tầm nhặt XP':'lên cấp nhanh')+' · đã chọn '+count+' lần'}
    if(goal==='tickets'&&known.size<2&&['magnet','learning'].includes(stat)){score=Math.min(score,48);why='Cần chiêu gây sát thương trước khi farm boss'}
    if(goal==='survival'&&hp!==null&&hp<.75&&['armor','synthesis','vigor'].includes(stat)){score+=20;why='Sinh tồn: củng cố hồi phục/phòng thủ'}
    if(resources&&stat==='sprint'){score=count<2?66:22;why='Farm: di chuyển giữa tài nguyên/sự kiện'}
    if(goal==='tickets'&&['power','reflexes'].includes(stat)){score+=18;why='Tăng tốc hạ boss để lấy phần thưởng'}
    if(hp!==null&&hp<.45&&['vigor','synthesis','armor'].includes(stat)){score+=stat==='vigor'?95:40;why='HP thấp: ưu tiên sống sót'}
    const required=build?.moves.some(id=>known.has(id)&&HAB_DATA.moves[id].cards.some(a=>norm(a)===clean(c.title)));
    const immediate=/evol(?:ves|uciona|ution|ucion)/i.test(c.tag||'');
    if(immediate){score=160;why='Mở điều kiện tiến hóa ngay'}else if(required&&count===0){score=Math.max(score,72);why='Chuẩn bị tiến hóa chiêu trong build'}
    if(stat==='heal'&&hp!==null&&hp>=.98){score=-40;why='HP đầy: hồi máu không có lợi'}
   }else if(move){
    const lv=c.level||levels[move.id]||1;
    if(inBuild){score=newMove?88:96+Math.min(lv,5)*3;why=newMove?'Học chiêu mục tiêu':'Dồn cấp cho chiêu mục tiêu';if(move.kind==='buff'&&newMove&&known.size<2){score-=40;why='Cần chiêu gây sát thương trước buff'}}
    else if(!newMove&&(known.has(move.id)||c.type==='up')){score=58+Math.min(lv,5)*2;why='Nâng chiêu đang có để không mất nhịp farm'}
    else if(!build&&newMove){score=move.kind==='buff'?20:48;why='Chưa có build: ưu tiên chiêu gây sát thương'}
    else{score=-15;why='Chiêu mới ngoài bộ mục tiêu'}
   }else if(!newMove){const fallback=HAF.score(c.text,priority);if(fallback>0){score=fallback;why='Nâng cấp dự phòng theo '+priority}}
   if(stat&&stat!=='heal'&&score>0){const mult={rare:1.25,epic:1.5,legendary:2}[c.rarity]||1;score*=mult;if(mult>1)why+=' · '+c.rarity+' ×'+mult}
   const late=(ctx.level||0)>=20||ctx.metaBondComplete===true;
   if(late&&move&&!c.special){
    if(c.type==='evo'){score=Math.max(score,255);why='Hoàn tất tiến hóa chiêu đang có'}
    else if(!newMove&&(known.has(move.id)||c.type==='up')){score=Math.max(score,215+Math.min(10,lvFor(c,move))*4);why='Cuối trận: nâng tối đa chiêu đang có để thu gọn bảng nâng cấp'}
    else if(newMove&&inBuild){score=Math.max(score,265);why='Học chiêu core còn thiếu để hoàn thành Bond chính'}
   }
   if(build?.variant==='custom'&&inBuild){score=c.type==='evo'?480:newMove?450:460+Math.min(10,lvFor(c,move));why=c.type==='evo'?'Ưu tiên tiến hóa chiêu core':newMove?'Ưu tiên học chiêu core đã lưu':'Ưu tiên nâng cấp chiêu core đã lưu'}
   if(goal==='survival'&&c.special==='revive'&&ctx.autoSpecialCards!==false){score=Math.max(score,485);why='Sinh tồn: dự phòng hồi sinh'}
   if(goal==='survival'&&['armor','synthesis','vigor'].includes(stat)&&hp!==null&&hp<.55){score=Math.max(score,490+(stat==='vigor'?5:0));why='Sinh tồn: củng cố phòng thủ khi HP thấp'}
   if(stat==='heal'&&hp!==null&&hp<.5){score=Math.max(score,goal==='survival'?600:330);why='Hồi máu khẩn cấp trước khi nâng tối đa chiêu'}
   ranked.push({index,score,why,name:c.title||'Thẻ '+c.key,moveId:move?.id||null,passive:stat,type:c.type,level:c.level||null});
  }
  ranked.sort((a,b)=>b.score-a.score);const best=ranked[0];
  if(!best||!Number.isFinite(best.score)||best.score<0)return {index:-1,why:'Chờ lựa chọn phù hợp hoặc đổi thẻ',ranked};
  return {...best,ranked};
 }
 function chooseBond(cards,build,goal,ctx={}){
  const meta=[...new Set(ctx.metaMoves||build?.moves||[])],text=' '+norm(ctx.subtitle)+' ';
  const linked=moves.filter(m=>m.aliases.some(a=>text.includes(' '+norm(a)+' '))).map(m=>m.id);
  const complete=meta.length===4&&(ctx.groups||[]).some(g=>g.length===4&&meta.every(id=>g.includes(id)));
  const cleanGroup=linked.every(id=>meta.includes(id)),wantMeta=!complete&&cleanGroup;
  const options=cards.map((c,index)=>({index,name:c.title,move:matchMove(c.title)}));
  let eligible=options.filter(o=>o.move&&!linked.includes(o.move.id)&&(wantMeta?meta.includes(o.move.id):!meta.includes(o.move.id)));
  let why=wantMeta?'Ghép chiêu core vào Bond chính':'Bond phụ: ghép ngẫu nhiên các chiêu dư';
  if(!eligible.length){eligible=options.filter(o=>o.move&&!linked.includes(o.move.id)&&!meta.includes(o.move.id));why='Game không đưa chiêu core phù hợp; ghép chiêu dư để tiếp tục'}
  if(!eligible.length){eligible=options;why='Không có lựa chọn Bond phù hợp kế hoạch; chọn thẻ game cho phép để tránh kẹt'}
  if(!meta.length&&linked.length&&linked.every(id=>HAB_DATA.moves[id]?.kind==='buff')&&eligible.some(o=>o.move?.kind!=='buff')){eligible=eligible.filter(o=>o.move&&o.move.kind!=='buff');why='Chưa có build: ghép chiêu sát thương vào nhóm buff'}
  eligible.sort((a,b)=>Number(a.move?.kind==='buff')-Number(b.move?.kind==='buff')||meta.indexOf(a.move?.id)-meta.indexOf(b.move?.id));if(wantMeta&&eligible[0]?.move?.kind!=='buff')why='Ghép chiêu sát thương core trước buff';
  const selected=wantMeta&&eligible.some(o=>meta.includes(o.move?.id))?eligible[0]:eligible[Math.min(eligible.length-1,Math.floor(Math.random()*eligible.length))];
  if(!selected)return{index:-1};
  return{index:selected.index,name:selected.name,why,bondResult:selected.move?[...new Set([...linked,selected.move.id])]:[]};
 }
 function chooseReward(cards,build,seen,priority,ctx={}){
  const ranked=cards.map((c,index)=>{const title=c.title.replace(/^(?:Upgrade|Mejora)\s*:\s*/i,''),t=norm(title);let score,why;
   if(/^(tickets|boletos|tiquets)$/.test(t)){score=ctx.remainingGoals?.tickets>0?205:ctx.goal==='tickets'?180:ctx.goal==='coins'?100:45;why='Lấy vé gacha theo mục tiêu phiên'}
   else if(/^(rare candy|caramelo raro)$/.test(t)){score=ctx.goal==='survival'?110:65;why='Rare Candy: mở thêm nâng cấp'}
   else{const selected=choose([{...c,title}],build,seen,priority,ctx);score=selected.index>=0?selected.score:-20;why=selected.why}
   return{index,name:c.title,score,why};
  }).sort((a,b)=>b.score-a.score||a.index-b.index);return ranked[0]||{index:-1};
 }
 function chooseBand(cards,build){const ranked=cards.map((c,index)=>{const title=norm(c.title),linked=moves.filter(m=>m.aliases.some(a=>(' '+title+' ').includes(' '+norm(a)+' '))),attack=linked.filter(m=>m.kind!=='buff'),fit=attack.filter(m=>build?.moves.includes(m.id)),level=Number(c.tag?.match(/(?:Lv|Nv)\.?\s*(\d+)/i)?.[1])||c.level||1;return{index,name:c.title,score:fit.length*100+attack.length*25+Math.min(level,10)*3,why:fit.length?'Khóa ô chiêu sát thương trong build':'Khóa ô có chiêu sát thương và cấp đang có'}}).sort((a,b)=>b.score-a.score||a.index-b.index);return ranked[0]||{index:-1}}
 const items=[
  ['amulet coin','moneda amuleto',95,42],['lucky egg','huevo suerte',82,55],['quick claw','garra rapida',78,83],['leftovers','restos',65,100],['assault vest','chaleco asalto',63,95],['shell bell','cascabel concha',62,90],['focus sash','banda focus',55,88],['choice scarf','panuelo eleccion',60,45],['life orb','vidasfera',42,15],['rocky helmet','casco dentado',30,40],['choice band','cinta eleccion',-20,-20]
 ];
 function chooseItem(cards,goal,hp,ctx={}){if(typeof HAI!=='undefined')return HAI.chooseItem(cards,goal,hp,ctx);const ranked=cards.map((c,index)=>{const t=norm(c.title),row=items.find(r=>t.includes(r[0])||t.includes(r[1]));return {index,score:row?(hp!==null&&hp<.5?row[3]:goal==='survival'?(row[2]+row[3])/2:goal==='tickets'?(row[0]==='amulet coin'?45:row[0]==='quick claw'?100:(row[2]+row[3])/2):row[2]):0,why:row?'Trang bị theo mục tiêu '+goal:'Giữ trang bị hiện tại khi không nhận diện',name:c.title}}).sort((a,b)=>b.score-a.score||a.index-b.index);return ranked[0]||{index:-1}}
 function createSkillManager(){
  let decision='Chờ dữ liệu chiêu',lastSwitch=-Infinity,pending=null,proposed=null,failures=0,layout='';const verifiedLevels=new Map();
  const reset=()=>{verifiedLevels.clear();lastSwitch=-Infinity;pending=null;proposed=null;failures=0;layout=''};
  function tick(frame,nav,build,config,now){
   decision='Đánh giá chiêu theo tầm và tình huống';if(!config.swapSkills||!frame||!nav?.me||!Number.isFinite(now)){decision='Chưa bật đổi chiêu hoặc thiếu dữ liệu người chơi';return null;}
   const raw=Array.isArray(frame.skillSlots)?frame.skillSlots:[];
   const rows=raw.map(s=>{if(!s||s.complete||![2,3,4].includes(s.count)||!Array.isArray(s.ids)||!s.ids.length)return s;const groups=(config.bondGroups||[]).filter(g=>g.length===s.count&&s.ids.every(id=>g.includes(id)));return groups.length===1?{...s,ids:groups[0],complete:true}:s});
   const slots=rows.filter(s=>s&&Number.isInteger(s.slot)&&s.slot>=0&&s.slot<4&&Array.isArray(s.ids)&&s.ids.length>0&&s.ids.length<=4&&new Set(s.ids).size===s.ids.length&&s.ids.every(id=>Object.hasOwn(HAB_DATA.moves,id))&&s.complete===true&&typeof s.active==='boolean');
   if(new Set(rows.map(s=>s?.slot)).size!==rows.length||slots.filter(s=>s.active).length!==1){decision='Chưa nhận diện chắc chắn ô đang dùng';proposed=null;return null}
   for(const s of slots)if(s.ids.length===1&&s.levelVerified===true&&Number.isInteger(s.level)&&s.level>=1&&s.level<=10)verifiedLevels.set(s.ids[0],s.level);
   const knownLevel=s=>s.ids.length===1?(verifiedLevels.get(s.ids[0])||Number(config.skillLevels?.[s.ids[0]])||0):0;
   const current=slots.find(s=>s.active),signature=slots.map(s=>s.slot+':'+s.ids.join(',')+':'+knownLevel(s)+':'+(s.evolved===true)).join('|');
   if(signature!==layout){layout=signature;pending=null;proposed=null;failures=0}
   if(pending){if(current.slot===pending.slot){pending=null;failures=0}else if(now-pending.at>1800){pending=null;failures++;lastSwitch=now}else return null}
   const meta=config.bondPlan||build?.moves||[],main=meta.length===4?slots.find(s=>s.ids.length===4&&meta.every(id=>s.ids.includes(id))):null;
   const isCore=s=>meta.length>0&&s.ids.length>1&&s.ids.every(id=>meta.includes(id))&&s.ids.some(id=>HAB_DATA.moves[id].kind!=='buff');
   if(isCore(current)&&!slots.some(s=>isCore(s)&&s.ids.length>current.ids.length)){decision='Giữ Bond core · chờ địch vào tầm';proposed=null;return null}
   if(main&&current.slot===main.slot){decision='Giữ Bond chính đủ 4 core';proposed=null;return null}
   const coreCandidate=slots.filter(isCore).filter(s=>!s.ids.some(id=>HAB_DATA.moves[id].kind==='dash')).sort((a,b)=>b.ids.length-a.ids.length||a.slot-b.slot)[0];
   if(coreCandidate&&coreCandidate.slot!==current.slot&&!['waiting','blocked','rift-enter'].includes(nav.phase)&&!['choiceband','choice-band'].includes(frame.item)&&failures<2&&now-lastSwitch>=1800){
    const key='core:'+coreCandidate.slot+':'+coreCandidate.ids.join(',');
    if(proposed?.key!==key){proposed={key,at:now};decision='Xác nhận ô Bond core';return null}
    if(now-proposed.at<180)return null;
    pending={slot:coreCandidate.slot,at:now};lastSwitch=now;proposed=null;decision='Chuyển sang Bond core đã xác nhận';return{key:String(coreCandidate.slot+1),why:decision+' · '+coreCandidate.ids.map(id=>moveName(id)+' Lv.'+(verifiedLevels.get(id)||Number(config.skillLevels?.[id])||1)).join(' + ')};
   }
   const sameUpgrade=slot=>slot.ids.length===1&&current.ids.length===1&&HAB_DATA.moves[slot.ids[0]].kind===HAB_DATA.moves[current.ids[0]].kind&&HAB_DATA.moves[slot.ids[0]].kind!=='dash'&&knownLevel(current)>0&&(knownLevel(slot)>knownLevel(current)||knownLevel(slot)===knownLevel(current)&&slot.evolved===true&&current.evolved!==true);
   const blocked=['waiting','evade','retreat','heal','unstuck','rift','rift-enter','chest-hold','event-hold','escort-wait','blocked'];
   if(failures>=2&&now-lastSwitch>=15000)failures=0;
   const constrained=blocked.includes(nav.phase)||nav.danger?.imminent||Number.isFinite(frame.hp)&&frame.hp<.4;

   if(failures>=2||['choiceband','choice-band'].includes(frame.item)||['waiting','blocked','rift-enter'].includes(nav.phase)||now-lastSwitch<Math.max(4500,config.skillMs||6500)){proposed=null;return null}
   const me=nav.me,enemies=(frame.objects||[]).filter(o=>o!==me&&['obelisk','pokemon','boss','elite','thief'].includes(o.kind)&&Number.isFinite(o.x)&&Number.isFinite(o.y)&&Math.hypot(o.x-me.x,o.y-me.y)>Math.max(8,(me.r||8)*.8));
   if(!enemies.length){decision='Chưa thấy địch để chọn tầm đánh';proposed=null;return null}
   const near=Math.min(...enemies.map(o=>Math.hypot(o.x-me.x,o.y-me.y)));
   if(near>320){proposed=null;return null}
   const close=enemies.filter(o=>Math.hypot(o.x-me.x,o.y-me.y)<105).length;
   const ranged=new Set(['meteor','projectile','boomerang','homing','bounce','beam','chain','turret','charge']);
   const short=new Set(['melee','spin','cone','aura','nova','quake','orbit','vortex','stun','shove']);
   const levelOf=(slot,m)=>slot.ids.length===1&&slot.levelVerified===true&&Number.isInteger(slot.level)&&slot.level>=1&&slot.level<=10?slot.level:Math.max(1,Math.min(10,Number(config.skillLevels?.[m.id])||verifiedLevels.get(m.id)||1));
   const reachOf=m=>m.kind==='orbit'?160:m.kind==='cone'?Math.max(105,Math.min(250,m.coneReach||105)):105;
   const score=slot=>{
    const safeBond=slot.ids.length>1&&slot.ids.some(id=>{const k=HAB_DATA.moves[id].kind;return ranged.has(k)&&(k!=='charge'||near>=140&&close<3&&nav.phase!=='breakout')||short.has(k)&&near<=reachOf(HAB_DATA.moves[id])});
    if(constrained&&!slot.active&&!sameUpgrade(slot)&&!safeBond)return -Infinity;
    const attacks=slot.ids.map(id=>HAB_DATA.moves[id]).filter(m=>m.kind!=='buff');
    // Do not activate movement/charge skills without a validated landing/cast model.
    if(!attacks.length||attacks.some(m=>m.kind==='dash'))return -Infinity;
    let best=-Infinity,useful=0;
    for(const m of attacks){const sameChargeUpgrade=current.ids.length===1&&slot.ids.length===1&&HAB_DATA.moves[current.ids[0]]?.kind==='charge'&&sameUpgrade(slot);
     if(m.kind==='charge'&&(near<140||close>=3||nav.phase==='breakout')&&!slot.active&&!sameChargeUpgrade)continue;if(ranged.has(m.kind)||short.has(m.kind)&&near<=reachOf(m))useful++;let v=0;if(ranged.has(m.kind))v=near>=85?65:35;else if(short.has(m.kind))v=near<=reachOf(m)?50+Math.min(close,4)*5:-25;else continue;
     v+=(levelOf(slot,m)-1)*30;
     if(slot.ids.length===1&&slot.evolved===true)v+=45;
     const edition=typeof HAS!=='undefined'?HAS.id:'original',facts=typeof HAB_COMBAT!=='undefined'?HAB_COMBAT[edition]?.[m.id]:null,stats=facts?.[Math.min(facts.length-1,levelOf(slot,m)-1)];
     if(stats?.dmg&&stats?.cd){const hits=m.kind==='cone'?Math.min(stats.count||1,1+close*.8):Math.min(stats.count||1,3);const estimate=stats.dmg*hits/Math.max(.15,stats.cd+(stats.charge||0));v+=Math.min(45,Math.log2(1+estimate)*6);}
     if(stats?.stun&&close>0)v+=Math.min(22,stats.stun*12);if(stats?.knock&&close>=2)v+=Math.min(18,stats.knock/30);if(['draining-kiss','giga-drain','drain-punch'].includes(m.id)&&frame.hp!==null&&frame.hp<.6)v+=18;
     if(close>=3&&['nova','aura','spin','orbit','shove','vortex','stun','cone','chain'].includes(m.kind))v+=Math.min(70,close*12);if(m.kind==='shove'&&close>=3)v+=25;
     if(m.kind==='charge')v+=near>=180?22:-15;
     if(build?.moves.includes(m.id))v+=20;
     if(m.kind==='orbit'&&slot.active&&near<160)v+=70;
     best=Math.max(best,v);
    }
    if(!useful)return -Infinity;
    const support=slot.ids.map(id=>HAB_DATA.moves[id]).filter(m=>m.kind==='buff'&&(['harden','agility','aqua-ring','dragon-dance'].includes(m.id)||m.id==='nasty-plot'&&attacks.some(a=>a.category==='special')||m.id==='swords-dance'&&attacks.some(a=>a.category==='physical'))).length;
    // Bond is preferred only for damage that can reach the current enemies.
    const bondBonus=Math.min(180,Math.max(0,useful-1)*75)+Math.min(55,support*45);
    return best+bondBonus+(slot.active?15:0);
   };
   const ranked=slots.map(slot=>({slot,score:score(slot)+(main&&slot.slot===main.slot?1000:0)})).sort((a,b)=>b.score-a.score||a.slot.slot-b.slot.slot);
   const usefulBonds=ranked.filter(v=>Number.isFinite(v.score)&&v.score>=30&&v.slot.ids.length>1);
   const coreBonds=usefulBonds.filter(v=>v.slot.ids.every(id=>meta.includes(id)));
   const lockedCore=coreBonds.find(v=>v.slot.slot===current.slot);
   if(lockedCore&&!coreBonds.some(v=>v.slot.ids.length>current.ids.length)){decision='Giữ Bond core · không đổi về chiêu đơn';proposed=null;return null}
   const preferBond=coreBonds.length>0||!meta.length&&usefulBonds.length>0;
   const best=coreBonds.length?coreBonds.sort((a,b)=>b.slot.ids.length-a.slot.ids.length||b.score-a.score)[0]:preferBond?usefulBonds[0]:ranked.filter(v=>v.slot.ids.length===1||!meta.length)[0],currentScore=score(current);decision=best&&Number.isFinite(best.score)?(best.slot.slot===current.slot?'Giữ ô ':'Ưu tiên ô ')+(best.slot.slot+1)+(best.slot.ids.length>1?' · Bond có thể đánh tới địch':' · chiêu đơn phù hợp tầm'):'Chưa có ô nhận diện đủ và đánh tới địch';
   const sameKindHigher=best&&best.slot.ids.length===1&&current.ids.length===1&&knownLevel(current)>0&&(knownLevel(best.slot)>knownLevel(current)||knownLevel(best.slot)===knownLevel(current)&&best.slot.evolved===true&&current.evolved!==true)&&HAB_DATA.moves[best.slot.ids[0]].kind===HAB_DATA.moves[current.ids[0]].kind;
   if(!best||!Number.isFinite(best.score)||best.score<30||best.slot.slot===current.slot||!main&&!preferBond&&best.score<currentScore+(sameKindHigher?0:25)){proposed=null;return null}
   const key=best.slot.slot+':'+best.slot.ids.join(',');if(proposed?.key!==key){proposed={key,at:now};return null}if(now-proposed.at<180)return null;
   pending={slot:best.slot.slot,at:now};lastSwitch=now;proposed=null;
   return{key:String(best.slot.slot+1),why:(main?'Khóa Bond chính đủ 4 chiêu core · ':'')+(best.slot.ids.length>1?'Ưu tiên ô Bond phù hợp tầm đánh · ':'')+(near>=85?'Giữ cự ly bằng chiêu tầm xa':'Chọn chiêu phù hợp quái gần')+' · '+best.slot.ids.map(id=>moveName(id)+' Lv.'+levelOf(best.slot,HAB_DATA.moves[id])+(best.slot.evolved===true?' · tiến hóa':'')).join(' + ')};
  }
  return{tick,reset,status:()=>decision};
 }

 return Object.freeze({createSkillManager,monLabel,effectiveDex,norm,identify,target,matchMove,owned,choose,chooseItem,chooseBond,chooseReward,chooseBand,passive,moveName});
})();

