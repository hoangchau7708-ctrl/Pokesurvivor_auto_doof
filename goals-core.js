/* Confirmed end-of-run rewards, deduplicated by a durable run token. */
const HAG=(()=>{
 const fields=['coins','tickets','gems','candy'],labels={coins:'Vàng',tickets:'Lượt gacha',gems:'Đá quý',candy:'Kẹo sự kiện'},zero=()=>Object.fromEntries(fields.map(k=>[k,0])),valid=s=>s&&typeof s==='object'&&!Array.isArray(s),id=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
 const numbers=v=>Object.fromEntries(fields.map(k=>[k,HAF.amount(v?.[k])??0]));
 function create(goals,now=Date.now()){return{id:id(),startedAt:now,goals:numbers(goals),totals:zero(),bestSurvivalSeconds:0,runs:0,pendingRun:null,settled:[],completedAt:0,notified:false}}
 function sanitize(s){if(!valid(s)||typeof s.id!=='string'||!/^[a-z0-9-]{1,80}$/i.test(s.id))return null;return{bestSurvivalSeconds:Math.min(604800,Math.max(0,Math.floor(Number(s.bestSurvivalSeconds)||0))),id:s.id,startedAt:Number(s.startedAt)||0,goals:numbers(s.goals),totals:numbers(s.totals),runs:Math.min(10000,Math.max(0,Math.floor(Number(s.runs)||0))),pendingRun:typeof s.pendingRun==='string'?s.pendingRun.slice(0,100):null,settled:Array.isArray(s.settled)?s.settled.filter(x=>typeof x==='string').slice(-10000):[],completedAt:Number(s.completedAt)||0,notified:s.notified===true}}
 function begin(s){if(s.pendingRun)return s;return{...s,pendingRun:id()}}
 function enabled(goals){return fields.filter(k=>(goals?.[k]||0)>0)}
 function reached(s){const active=enabled(s?.goals);return active.length>0&&active.every(k=>s.totals[k]>=s.goals[k])}
 function settle(s,reward,token=s?.pendingRun,now=Date.now()){if(!s||!token||s.settled.includes(token)||reward?.confirmed!==true)return{state:s,added:false};const gain=numbers(reward),next={...s,totals:Object.fromEntries(fields.map(k=>[k,Math.min(1e12,s.totals[k]+gain[k])])),runs:s.runs+1,pendingRun:null,settled:[...s.settled,token].slice(-10000)};if(reached(next))next.completedAt=now;return{state:next,added:true}}
 function summary(s){if(!s)return'Chưa bắt đầu phiên';const active=enabled(s.goals),ks=active.length?active:['coins','tickets'];return ks.map(k=>labels[k]+': '+s.totals[k].toLocaleString('vi-VN')+(s.goals[k]?' / '+s.goals[k].toLocaleString('vi-VN'):'')).join(' · ')}
 function rewards(text){let sum=0,matched=false;for(const m of String(text).matchAll(/\+\s*(\d[\d,\.]*)\s*(?:[×x]\s*(10|25))?/g)){const n=HAF.amount(m[1]);if(n!==null){matched=true;sum+=n*(Number(m[2])||1)}}return matched?sum:null}
 return Object.freeze({fields,labels,zero,create,sanitize,begin,enabled,reached,settle,summary,rewards});
})();
