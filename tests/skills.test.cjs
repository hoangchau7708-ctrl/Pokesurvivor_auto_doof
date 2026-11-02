const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path'),root=path.resolve(__dirname,'..'),c={};for(const f of ['build-data.js','autofarm-core.js','build-core.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),c);const B=vm.runInNewContext('HAB',c);
const config={swapSkills:true,skillMs:1000},nav={me:{x:0,y:0,r:10},phase:'combat'},build={moves:['electro-ball','thunder-shock','nasty-plot','tackle']};
const slot=(n,ids,active=false)=>({slot:n,ids,active,complete:true});
const base=()=>({hp:.9,objects:[{kind:'pokemon',x:0,y:0},{kind:'boss',x:180,y:0}],skillSlots:[slot(0,['tackle'],true),slot(1,['electro-ball']),slot(2,['swords-dance'])]});
const action=(f,n=nav,b=build)=>{const m=B.createSkillManager();assert.equal(m.tick(f,n,b,config,10000),null);return m.tick(f,n,b,config,10300)};
assert.equal(action(base()).key,'2');
for(const phase of ['evade','rift-enter','event-hold','chest-hold','unstuck','waiting','rift'])assert.equal(action(base(),{...nav,phase}),null,phase);
assert.equal(action({...base(),hp:.2}),null);assert.equal(action({...base(),item:'choiceband'}),null);assert.equal(action({...base(),objects:[]}),null);
assert.equal(action({...base(),skillSlots:[slot(0,['thunder-shock'],true)]}),null,'one skill never cycle');
assert.equal(action({...base(),skillSlots:[slot(0,['electro-ball'],true),slot(1,['swords-dance'])]}),null,'do not rotate into buff-only slot');
assert.equal(action({...base(),skillSlots:[slot(0,['tackle'],true),{...slot(1,['electro-ball']),complete:false}]}),null,'ambiguous candidate');
assert.equal(action({...base(),skillSlots:[{...slot(0,['tackle'],true),complete:false},slot(1,['electro-ball'])]}),null,'unknown active');
assert.equal(action({...base(),skillSlots:[slot(0,['tackle'],true),slot(1,['electro-ball'],true)]}),null,'two active markers');
assert.equal(action({...base(),skillSlots:[slot(0,['swords-dance'],true),slot(1,['electro-ball','nasty-plot'])]}).key,'2','Bond attack plus buff is usable');
const m=B.createSkillManager(),f=base();m.tick(f,nav,build,config,10000);assert(m.tick(f,nav,build,config,10300));assert.equal(m.tick(f,nav,build,config,11000),null);m.tick(f,nav,build,config,12500);m.tick(f,nav,build,config,17500);assert(m.tick(f,nav,build,config,17800));m.tick(f,nav,build,config,20000);assert.equal(m.tick(f,nav,build,config,40000),null);assert.equal(m.tick(f,nav,build,config,41000)?.key,'2','retry after a 15-second backoff, not a permanent lock');
console.log('PASS situational skill selection: no cycling, single skill, enemy distance, no empty/buff-only choice, Bond, danger/HP/interactions/Choice Band, ambiguity, confirmation and retry limit');


const bondFrame={...base(),skillSlots:[slot(0,['thunder-shock'],true),slot(1,['thunder-shock','electro-ball'])]};
assert.equal(action(bondFrame).key,'2','prefer two useful ranged attacks over active single attack');
assert.equal(action({...bondFrame,skillSlots:[slot(0,['thunder-shock','electro-ball'],true),slot(1,['thunder-shock'])]}),null,'hold active Bond');
assert.equal(action({...bondFrame,skillSlots:[slot(0,['thunder-shock'],true),slot(1,['thunder-shock','nasty-plot'])]}).key,'2','prefer useful attack plus matching buff');
assert.equal(action({...bondFrame,skillSlots:[slot(0,['thunder-shock'],true),slot(1,['tackle','body-slam'])]}),null,'do not select melee Bond for distant boss');
assert.equal(action({...bondFrame,skillSlots:[slot(0,['thunder-shock'],true),{...slot(1,['thunder-shock','electro-ball']),complete:false}]}),null,'incomplete Bond stays unselected');
assert.equal(action({...bondFrame,skillSlots:[slot(0,['thunder-shock'],true),slot(1,['electro-ball','electro-ball'])]}),null,'duplicate ID must not inflate Bond');
for(const phase of ['evade','rift-enter','event-hold'])assert.equal(action(bondFrame,{...nav,phase})?.key,phase==='rift-enter'?undefined:'2','safe ranged Bond remains usable during travel/evasion');
console.log('PASS Bond priority: two attacks, compatible buff, retain active Bond, melee out of range, incomplete and duplicated icons, safety gates');

const upgraded={hp:.9,objects:[{kind:'boss',x:140,y:0}],skillSlots:[{...slot(0,['ember'],true),level:1,levelVerified:true},{...slot(1,['flamethrower']),level:5,levelVerified:true}]};
assert.equal(action(upgraded,nav,{moves:['ember','flamethrower']}).key,'2','Flamethrower Lv5 beats Ember Lv1 within cone reach');
assert.equal(action({...upgraded,objects:[{kind:'boss',x:240,y:0}]},nav,{moves:['ember','flamethrower']}),null,'higher level does not override insufficient range');
assert.equal(action({...upgraded,hp:.2},nav,{moves:['ember','flamethrower']}),null,'danger safeguard');
console.log('PASS level-aware selection: Ember Lv1 vs Flamethrower Lv5 at 140px; range and HP gates retained');
