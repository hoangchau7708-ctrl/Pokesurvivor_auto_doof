const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({});for(const f of ['build-data.js','autofarm-core.js','inventory-core.js','build-core.js','planner.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const H=vm.runInContext('HAF',c),B=vm.runInContext('HAB',c),P=vm.runInContext('HAP',c),cfg=H.sanitize({farmGoal:'coins',riftMode:'balanced'});
const card=(title,type='stat',tag='Upgrade',text=title)=>({title,type,tag,text,key:'1'}),build=B.target(798);
assert.equal(B.choose([card('Dragon Breath','new','New Dragon'),card('Magnet'),card('Hex','new','New Ghost')],build,[],'resources',{goal:'coins',level:4}).index,1);
assert.equal(B.choose([card('Learning'),card('Sitrus Berry'),card('Power')],build,[],'balanced',{goal:'coins',hp:.25,level:4}).index,1);
assert.equal(B.choose([card('Sitrus Berry'),card('Power')],build,[],'balanced',{goal:'coins',hp:1}).index,1);
assert.equal(B.choose([card('Meteor Mash → Magnet Bomb','evo','EVOLUTION'),card('Magnet')],build).index,0);
assert.equal(B.choose([card('Magnet'),card('Power')],build,[],'balanced',{goal:'coins',level:25,passives:{magnet:3}}).index,1);
assert.equal(B.choose([card('Learning'),card('Meteor Mash','up','Lv.4 > 5')],build,['meteor-mash'],'balanced',{goal:'tickets'}).index,1);
assert.equal(B.choose([card('Body Slam','new','New')],build).index,0,'without saved core use a useful fallback');
assert.equal(B.chooseItem([card('Keep Choice Band'),card('Switch to Amulet Coin')],'coins',.9).index,1);
const me={kind:'pokemon',dex:798,x:400,y:300,r:14};
const frame=(objects=[],extra={})=>({seq:1,width:800,height:600,camera:{a:1,b:0,c:0,d:1,e:0,f:0},objects:[me,...objects],hp:.9,clock:null,level:15,arena:false,...extra});
let p=P.create(),n=p.tick(frame([{kind:'coin',x:550,y:300,r:5}]),cfg,1000,798);assert(n.keys.includes('d'));assert.equal(n.target.kind,'coin');
p=P.create();n=p.tick(frame([{kind:'coin',x:550,y:300,r:5},{kind:'heal',x:250,y:300,r:6}],{hp:.2}),cfg,1000,798);assert.equal(n.target.kind,'heal');assert(n.keys.includes('a'));
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14}],{hp:.4}),cfg,1000,798);assert(!n.target);
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14}]),cfg,1000,798);assert.equal(n.target.kind,'rift');
p=P.create();n=p.tick(frame([{kind:'chest',x:438,y:300,r:14}]),cfg,1000,798);assert.equal(n.phase,'chest');assert.deepEqual([...n.keys],[]);
p=P.create();n=p.tick(frame([{kind:'ticket10',x:550,y:300,r:8},{kind:'hazard',x:440,y:300,r:50}]),cfg,1000,798);assert(!n.keys.includes('d'));
p=P.create();n=p.tick(frame([{kind:'coin',x:600,y:300,r:5},{kind:'wall',x:440,y:300,r:18}]),cfg,1000,798);assert(!n.keys.includes('d'));
p=P.create();p.tick(frame([],{clock:3}),cfg,1000,798);n=p.tick(frame([],{clock:3,seq:2}),cfg,3100,798);assert.equal(n.phase,'waiting');
assert.equal(P.validate({objects:[]}),null);assert.equal(P.player(frame([{...me,x:402}]),798),null);
assert(P.shapeDistance({x:5,y:5},{poly:[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]})<0);
p=P.create();let recovering=false;for(let i=0;i<22;i++){n=p.tick(frame([{kind:'coin',x:650,y:300,r:5}],{seq:i+1}),cfg,1000+i*140,798);if(n.phase==='unstuck')recovering=true}assert(recovering);
console.log('PASS 2.4: screenshot card, HP/evolution/resource stages, items, goals, chest hold, portal gates, hazard/wall avoidance, stuck recovery, paused clock');

// Portal regression: do not abandon an entrance as its timer drops below six seconds.
p=P.create();n=p.tick(frame([{kind:'rift',x:450,y:300,r:14,ttl:8}]),cfg,1000,798);assert.equal(n.target.kind,'rift');
n=p.tick(frame([{kind:'rift',x:450,y:300,r:14,ttl:2},{kind:'ticket10',x:365,y:300,r:8}],{seq:2,hp:.73}),cfg,1140,798);assert.equal(n.target.kind,'rift');assert(n.keys.includes('d'));
n=p.tick(frame([{kind:'ticket10',x:365,y:300,r:8}],{seq:3,hp:.73}),cfg,1280,798);assert.equal(n.target.kind,'rift');
p=P.create();n=p.tick(frame([{kind:'rift',x:438,y:300,r:14,ttl:2},{kind:'ticket10',x:360,y:300,r:8}]),cfg,1000,798);assert.equal(n.target.kind,'rift');assert(n.keys.includes('d'));
p=P.create();n=p.tick(frame([{kind:'rift',x:415,y:300,r:14,ttl:2}]),cfg,1000,798);assert.equal(n.phase,'rift-enter');assert.equal(n.keys.length,0);
p=P.create();n=p.tick(frame([{kind:'rift',x:1040,y:300,r:14,ttl:2,approximate:true}]),cfg,1000,798);assert.notEqual(n.target?.kind,'rift');assert(n.reason.includes('thời gian'));
p=P.create();n=p.tick(frame([{kind:'rift',x:450,y:300,r:14,ttl:8}]),cfg,1000,798);n=p.tick(frame([{kind:'rift',x:450,y:300,r:14,ttl:7}],{seq:2,hp:.2}),cfg,1140,798);assert.notEqual(n.target?.kind,'rift');
// Simulate successive short movements: the final approach must reach the entry circle.
p=P.create();let sim={...me};for(let i=0;i<30;i++){n=p.tick(frame([{kind:'rift',x:530,y:325,r:14,ttl:8-i*.14}],{seq:i+1,camera:{a:1,b:0,c:0,d:1,e:400-sim.x,f:300-sim.y},objects:[{...sim},{kind:'rift',x:530,y:325,r:14,ttl:8-i*.14}]}),cfg,1000+i*140,798);if(n.phase==='rift-enter')break;const dx=+n.keys.includes('d')-+n.keys.includes('a'),dy=+n.keys.includes('s')-+n.keys.includes('w'),len=Math.hypot(dx,dy)||1;sim.x+=dx/len*18;sim.y+=dy/len*18}assert.equal(n.phase,'rift-enter');
console.log('PASS portal: retain commitment, late close entry, no loot diversion, brief occlusion, short approach, low-HP escape, distant expiry');

// Goal priority: nearby ordinary loot must never steal an eligible Rift.
for(const goal of ['coins','tickets']){const settings=H.sanitize({farmGoal:goal});p=P.create();n=p.tick(frame([{kind:'rift',x:1000,y:300,r:14,ttl:20,approximate:true},{kind:'ticket10',x:420,y:300,r:5},{kind:'coin',x:410,y:300,r:5},{kind:'chest',x:440,y:310,r:14}]),settings,1000,798);assert.equal(n.target.kind,'rift',goal)}
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:20},{kind:'xp',x:430,y:300,r:5}]),H.sanitize({farmGoal:'survival'}),1000,798);assert.notEqual(n.target?.kind,'rift');
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:20},{kind:'coin',x:420,y:300,r:5}]),H.sanitize({farmGoal:'tickets',seekRifts:false}),1000,798);assert.notEqual(n.target?.kind,'rift');
const encounter=[{kind:'boss',dex:150,x:650,y:300,r:20},{kind:'ticket10',x:420,y:300,r:5},{kind:'coin',x:425,y:300,r:5}];p=P.create();n=p.tick(frame(encounter,{arena:true}),H.sanitize({farmGoal:'tickets'}),1000,798);assert.equal(n.target.kind,'boss');assert.equal(n.phase,'arena-combat');
n=p.tick(frame(encounter.filter(o=>o.kind!=='boss'),{arena:true,seq:2}),cfg,1200,798);assert.equal(n.target.kind,'boss');
n=p.tick(frame(encounter.filter(o=>o.kind!=='boss'),{arena:true,seq:3}),cfg,2400,798);assert.equal(n.phase,'arena-loot');assert.equal(n.target.kind,'ticket10');
n=p.tick(frame([{kind:'coin',x:450,y:300,r:5}],{arena:false,seq:4}),cfg,2500,798);assert.notEqual(n.phase,'arena-combat');assert.equal(n.target.kind,'coin');
p=P.create();n=p.tick(frame(encounter,{arena:true,hp:.2}),cfg,1000,798);assert.equal(n.phase,'retreat');assert.notEqual(n.target?.kind,'boss');
assert.equal(B.chooseBond([card('Body Slam','up'),card('Meteor Mash','up')],B.target(798,'best','tickets',{customBuilds:{798:['meteor-mash','razor-leaf','air-slash','swords-dance']}}),'tickets').index,1);
assert.equal(B.chooseBond([card('Harden','up'),card('Meteor Mash','up')],null,'tickets',{subtitle:'Which move joins Swords Dance?'}).index,1);
console.log('PASS goal policies: Rift outranks close loot, survival opt-out, arena combat -> loot -> map, emergency retreat and Bond pairing');

// Locked chest must release all movement continuously, not just prefer standing.
p=P.create();let box={kind:'chest',x:438,y:300,r:14,progress:.2};n=p.tick(frame([box]),cfg,1000,798);assert.equal(n.phase,'chest');assert.equal(n.keys.length,0);
for(let i=1;i<=26;i++){n=p.tick(frame([{...box,progress:Math.min(.99,.2+i*.03)},{kind:'ticket10',x:390,y:300,r:5},{kind:'pokemon',dex:10,x:445,y:300,r:14}],{seq:i+1}),cfg,1000+i*140,798);assert.equal(n.phase,'chest');assert.equal(n.keys.length,0);assert.equal(n.target.kind,'chest')}
n=p.tick(frame([{kind:'ticket10',x:390,y:300,r:5}],{seq:30}),cfg,6000,798);assert.equal(n.target.kind,'ticket10');
p=P.create();p.tick(frame([box]),cfg,1000,798);n=p.tick(frame([box,{kind:'rift',x:700,y:300,r:14,ttl:20}],{seq:2}),cfg,1200,798);assert.equal(n.target.kind,'rift');
p=P.create();p.tick(frame([box]),cfg,1000,798);n=p.tick(frame([box,{kind:'hazard',x:400,y:300,r:35}],{seq:2}),cfg,1200,798);assert.notEqual(n.phase,'chest');assert(n.keys.length>0);
p=P.create();n=p.tick(frame([{kind:'chest',x:465,y:300,r:14}]),cfg,1000,798);assert(n.keys.includes('d'));
p=P.create();p.tick(frame([box]),cfg,1000,798);n=p.tick(frame([box],{seq:2,hp:.2}),cfg,1200,798);assert.notEqual(n.phase,'chest');
console.log('PASS chest: continuous stationary hold through pressure/loot, progress, disappearance, short approach, Rift preemption and emergency escape');

// Boss evasion must outweigh attraction to the boss or loot.
const boss={kind:'boss',dex:150,x:650,y:300,r:20};
p=P.create();let warning={kind:'hazard',shape:'zone',x:400,y:300,r:75,progress:.8};n=p.tick(frame([boss,warning],{arena:true}),cfg,1000,798);assert.equal(n.phase,'evade');assert(n.keys.length>0);assert(P.shapeDistance(n.end,warning)>P.shapeDistance(me,warning)+50);
p=P.create();warning={kind:'hazard',shape:'beam',x:425,y:300,r:225,poly:[{x:200,y:285},{x:650,y:285},{x:650,y:315},{x:200,y:315}],progress:.85};n=p.tick(frame([boss,warning],{arena:true}),cfg,1000,798);assert(n.keys.includes('w')||n.keys.includes('s'));assert(P.shapeDistance(n.end,warning)>30);
p=P.create();p.tick(frame([boss,{kind:'projectile',x:250,y:300,r:7}],{arena:true}),cfg,1000,798);n=p.tick(frame([boss,{kind:'projectile',x:300,y:300,r:7}],{arena:true,seq:2}),cfg,1100,798);assert.equal(n.phase,'evade');assert(n.danger.projectiles);assert(n.keys.includes('w')||n.keys.includes('s'));
p=P.create();n=p.tick(frame([{...boss,anim:'Charge'}],{arena:true}),cfg,1000,798);assert(n.keys.includes('w')||n.keys.includes('s'));
console.log('PASS boss evasion: escape charged zones, step across beams, predict incoming projectiles, strafe during charge');

// Forced Rift mode overrides opportunity/HP/level/ETA gates, without faking availability.
const forced=H.sanitize({farmGoal:'tickets'});assert.equal(forced.riftMode,'force');
for(const hp of [.9,.2,null]){p=P.create();n=p.tick(frame([{kind:'rift',x:1100,y:300,r:14,ttl:2,approximate:true},{kind:'heal',x:390,y:300,r:5},{kind:'ticket10',x:405,y:300,r:5}],{hp,level:2}),forced,1000,798);assert.equal(n.target.kind,'rift');assert(n.reason.includes('Ưu tiên cổng boss'))}
p=P.create();p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:20}]),forced,1000,798);n=p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:19},{kind:'heal',x:390,y:300,r:5}],{hp:.1,seq:2,level:1}),forced,1140,798);assert.equal(n.target.kind,'rift');
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:0}]),forced,1000,798);assert.notEqual(n.target?.kind,'rift');
p=P.create();n=p.tick(frame([{kind:'rift',x:600,y:300,r:14,ttl:20}],{hp:.2,level:1}),H.sanitize({...forced,riftMode:'balanced'}),1000,798);assert.notEqual(n.target?.kind,'rift');
console.log('PASS forced Rift: default enabled, low/unknown HP, early level, short expiry, sustained commitment, expired exclusion and balanced opt-out');
