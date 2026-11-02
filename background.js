/* Auto-farm-only service worker. Existing Studio data remains untouched. */
importScripts('autofarm-core.js','goals-core.js');
const sites=new Set(['https://pokesurvivor.com','https://www.pokesurvivor.com','https://pokesurvivor.doofcraft.com']);
let queue=Promise.resolve();
const leaseKey='ha_wake_leases';
async function protectFarmTab(tabId,state){if(!chrome.tabs?.get||!chrome.tabs?.update)return;const store=chrome.storage.session||chrome.storage.local,key='ha_tab_protection',data=await store.get([key]),leases=data[key]||{},now=Date.now();for(const [id,v]of Object.entries(leases))if(now-v.at>120000||Number(id)===tabId&&state!=='running'){try{await chrome.tabs.update(Number(id),{autoDiscardable:v.original})}catch{}delete leases[id]}if(Number.isInteger(tabId)&&state==='running'){if(!leases[tabId]){try{const tab=await chrome.tabs.get(tabId);leases[tabId]={original:tab.autoDiscardable!==false,at:now};await chrome.tabs.update(tabId,{autoDiscardable:false})}catch{delete leases[tabId]}}else leases[tabId].at=now}await store.set({[key]:leases})}

async function wakeUpdate(tabId,state){if(!chrome.power)return;const data=await chrome.storage.local.get([leaseKey,HAF.KEY]);const leases=data[leaseKey]||{},now=Date.now();for(const [id,at]of Object.entries(leases))if(now-at>120000)delete leases[id];if(Number.isInteger(tabId)){if(state==='running'&&HAF.sanitize(data[HAF.KEY]).keepAwake)leases[tabId]=now;else delete leases[tabId]}if(!HAF.sanitize(data[HAF.KEY]).keepAwake)for(const id of Object.keys(leases))delete leases[id];await chrome.storage.local.set({[leaseKey]:leases});if(Object.keys(leases).length)chrome.power.requestKeepAwake('display');else chrome.power.releaseKeepAwake()}
chrome.alarms?.create('ha-wake-cleanup',{periodInMinutes:1});
chrome.alarms?.onAlarm.addListener(a=>{if(a.name==='ha-wake-cleanup')queue=queue.catch(()=>{}).then(async()=>{await wakeUpdate();await protectFarmTab()})});
chrome.tabs?.onRemoved.addListener(id=>{queue=queue.catch(()=>{}).then(async()=>{await wakeUpdate(id,'idle');await protectFarmTab(id,'idle')})});
const short=(s,n)=>String(s||'').slice(0,n);
chrome.runtime.onMessage.addListener((msg,sender,respond)=>{
 if(!['AUTO_WINDOW','AUTO_GET','AUTO_SAVE','AUTO_CONFIG','AUTO_REPORT','AUTO_SESSION_GET','AUTO_SESSION_SAVE','AUTO_COMPLETE'].includes(msg?.type))return;
 const extension=sender.url?.startsWith(chrome.runtime.getURL(''));
 let site=false;try{site=sites.has(new URL(sender.url).origin)}catch{}
 if((!extension&&!site)||(msg.type==='AUTO_SAVE'&&!extension)||(['AUTO_WINDOW','AUTO_REPORT','AUTO_SESSION_GET','AUTO_SESSION_SAVE','AUTO_COMPLETE'].includes(msg.type)&&!site)){
  respond({ok:false,error:'Nguồn không được phép thực hiện thao tác này'});return;
 }
 queue=queue.catch(()=>{}).then(async()=>{
  if(msg.type==='AUTO_WINDOW'){if(!Number.isInteger(sender.tab?.id)||!chrome.windows?.create)throw Error('Chỉ có trên tiện ích máy tính');await chrome.windows.create({tabId:sender.tab.id,type:'normal',width:960,height:760,focused:false});return{opened:true}}
  if(msg.type==='AUTO_SESSION_GET'||msg.type==='AUTO_SESSION_SAVE'||msg.type==='AUTO_COMPLETE'){
   const origin=new URL(sender.url).origin,key='ha_session_v1_'+origin,stored=await chrome.storage.local.get([key]);let session=HAG.sanitize(stored[key]);
   if(msg.type==='AUTO_SESSION_SAVE'){session=HAG.sanitize(msg.payload);if(!session)throw Error('Phiên farm không hợp lệ');await chrome.storage.local.set({[key]:session});return{session}}
   if(msg.type==='AUTO_COMPLETE'&&session&&HAG.reached(session)&&session.completedAt&&!session.notified){session={...session,notified:true};await chrome.storage.local.set({[key]:session});try{await chrome.notifications?.create('ha-complete-'+new URL(origin).hostname+'-'+session.id,{type:'basic',iconUrl:chrome.runtime.getURL('icons/icon128.png'),title:'hoanganh Auto Farm · Hoàn thành',message:HAG.summary(session),priority:1})}catch{}return{session}}
   return{session};
  }
  if(msg.type==='AUTO_SAVE'||msg.type==='AUTO_CONFIG'){
   const config=HAF.sanitize(msg.payload);await chrome.storage.local.set({[HAF.KEY]:config});await wakeUpdate();return {config};
  }
  if(msg.type==='AUTO_REPORT'){
   const p=msg.payload||{};
   const number=(x,max)=>Math.max(0,Math.min(max,Math.floor(Number(x)||0)));
   const report={state:['running','paused','idle','complete'].includes(p.state)?p.state:'idle',reason:short(p.reason,180),build:short(p.build,300),decision:short(p.decision,250),progress:short(p.progress,400),runs:number(p.runs,10000),steps:number(p.steps,999999),startedAt:number(p.startedAt,Date.now()),reportedAt:Date.now()};
   await chrome.storage.local.set({[HAF.REPORT_KEY]:report});await wakeUpdate(sender.tab?.id,report.state);await protectFarmTab(sender.tab?.id,report.state);return {saved:true};
  }
  const data=await chrome.storage.local.get([HAF.KEY,HAF.REPORT_KEY]);return {config:HAF.sanitize(data[HAF.KEY]),report:data[HAF.REPORT_KEY]||null};
 });
 queue.then(data=>respond({ok:true,data}),e=>respond({ok:false,error:short(e.message,160)}));return true;
});
chrome.storage.local.setAccessLevel?.({accessLevel:'TRUSTED_CONTEXTS'}).catch(()=>{});
