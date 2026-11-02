const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let handler;const notifications=[];const mem={ha_studio_v2:{untouched:true}};
const chrome={notifications:{create:async(id,data)=>{notifications.push({id,data})}},storage:{local:{get:async keys=>Object.fromEntries(keys.map(k=>[k,mem[k]])),set:async x=>Object.assign(mem,x),setAccessLevel:async()=>{}}},runtime:{getURL:x=>'chrome-extension://test/'+x,onMessage:{addListener:f=>handler=f}}};
const ctx=vm.createContext({chrome,console,URL,Date,Promise,importScripts:(...files)=>files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx))});vm.runInContext(fs.readFileSync(path.join(root,'background.js'),'utf8'),ctx);
const send=(type,payload,url='chrome-extension://test/popup.html')=>new Promise(resolve=>handler({type,payload},{url},resolve));
(async()=>{
 let r=await send('AUTO_GET');assert(r.ok);assert.equal(r.data.config.autoBuild,true);
 r=await send('AUTO_SAVE',{pokemon:798,buildStyle:'ranged',autoBuild:true,priority:'resources'});assert(r.ok);assert.equal(r.data.config.pokemon,798);
 r=await send('AUTO_SAVE',{},'https://pokesurvivor.com/');assert(!r.ok);
 r=await send('AUTO_GET',{},'https://evil.example/');assert(!r.ok);
 r=await send('AUTO_REPORT',{state:'running',build:'Kartana',decision:'Meteor Mash',runs:999},'https://pokesurvivor.com/');assert(r.ok);
 r=await send('AUTO_GET');assert.equal(r.data.report.runs,999);assert.equal(r.data.report.decision,'Meteor Mash');assert.equal(mem.ha_studio_v2.untouched,true);
 const writes=await Promise.all([send('AUTO_SAVE',{pokemon:150}),send('AUTO_SAVE',{pokemon:798})]);assert(writes.every(r=>r.ok));r=await send('AUTO_GET');assert.equal(r.data.config.pokemon,798);
 r=await send('AUTO_CONFIG',{farmGoal:'tickets',bossHp:999,tags:{'12x12:abc':'ticket','bad':'rift','14x14:def':'evil'}},'https://pokesurvivor.com/');assert(r.ok);assert.equal(r.data.config.bossHp,100);assert.deepEqual(Object.keys(r.data.config.tags),['12x12:abc']);
 r=await send('AUTO_CONFIG',{},'https://evil.example/');assert(!r.ok);
 r=await send('AUTO_GET',{},'https://pokesurvivor.doofcraft.com/#menu');assert(r.ok);r=await send('AUTO_CONFIG',{farmGoal:'tickets'},'https://pokesurvivor.doofcraft.com/#menu');assert(r.ok);r=await send('AUTO_GET',{},'https://pokesurvivor.doofcraft.com.evil.example/');assert(!r.ok);
 const G=vm.runInContext('HAG',ctx);let session=G.begin(G.create({coins:100,tickets:2}));session=G.settle(session,{confirmed:true,coins:100,tickets:2},session.pendingRun,300).state;r=await send('AUTO_SESSION_SAVE',session,'https://pokesurvivor.doofcraft.com/');assert(r.ok);r=await send('AUTO_SESSION_GET',{},'https://pokesurvivor.com/');assert.equal(r.data.session,null);await send('AUTO_COMPLETE',{},'https://pokesurvivor.doofcraft.com/');await send('AUTO_COMPLETE',{},'https://pokesurvivor.doofcraft.com/');assert.equal(notifications.length,1);assert(notifications[0].data.message.includes('100'));r=await send('AUTO_SESSION_GET',{},'https://pokesurvivor.doofcraft.com/');assert(r.data.session.notified);r=await send('AUTO_SESSION_SAVE',session,'https://evil.example/');assert(!r.ok);
 console.log('PASS farm service worker: settings, access boundaries, reports, serialization, preserve Studio data');
})().catch(e=>{console.error(e);process.exitCode=1});
