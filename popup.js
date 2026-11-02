(()=>{
 'use strict';const $=id=>document.getElementById(id);let config=HAF.sanitize(),ready=false,lastReport=null;
 const notify=(text,error=false)=>{$('message').textContent=text;$('message').classList.toggle('error',error)};
 const request=async(type,payload)=>{const r=await chrome.runtime.sendMessage({type,payload});if(!r?.ok)throw Error(r?.error||'Không kết nối được tiện ích');return r.data};
 const monByDex=new Map(HAB_DATA.mons.map(m=>[m.dex,m]));
 const label=m=>m.name+' #'+m.dex;
 for(const m of HAB_DATA.mons){const o=document.createElement('option');o.value=label(m);$('pokemonList').append(o)}
 function selected(){const q=$('pokemon').value.trim();if(!q)return 0;const mon=HAB_DATA.mons.find(m=>HAB.norm(label(m))===HAB.norm(q)||HAB.norm(m.name)===HAB.norm(q)||String(m.dex)===q.replace(/^#/,''));return mon?.dex??-1}
 const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e};
 function preview(){
  const box=$('buildPreview');box.replaceChildren();const dex=selected();$('pokemon').setCustomValidity(dex<0?'Chọn tên Pokémon hoặc số Dex hợp lệ':'');
  const b=HAB.target(dex,'best',$('farmGoal').value,config);
  box.append(text('strong',b?b.name+' · Core đã lưu':'Chưa lưu core cho Pokémon này'));
  if(b)box.append(text('p',b.moves.map(HAB.moveName).join(' / ')));
  box.append(text('p','Mở tab Build trong bảng tool ở trang game để chọn và lưu 4 chiêu.'));

 }
 function showReport(){const r=lastReport;const stale=!r||Date.now()-r.reportedAt>10000;
  $('farmStatus').textContent=!r?'Chưa có báo cáo':stale?'Báo cáo gần nhất':r.state==='running'?'Đang farm · lượt '+r.runs:r.state==='paused'?'Đã tạm dừng':r.state==='complete'?'Hoàn thành mục tiêu':'Đã dừng';
  $('farmReason').textContent=(r?.reason||'Bật farm tại trang game để bắt đầu.')+(r?.progress?' · '+r.progress:'');
  $('lastDecision').textContent=r?.decision?'Chọn gần nhất: '+r.decision:'';
 }
 $('dataDate').textContent='Core được lưu riêng cho từng Pokémon trên thiết bị.';
 for(const id of ['pokemon','farmGoal'])$(id).addEventListener('input',preview);
 $('farmForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!ready)return;preview();if(!$('farmForm').reportValidity())return;
  $('autoSave').disabled=true;
  try{const data=await request('AUTO_SAVE',{...config,farmGoal:$('farmGoal').value,autoBuild:true,pokemon:Math.max(0,selected()),buildStyle:'best',pattern:$('autoPattern').value,priority:$('autoPriority').value,maxMinutes:Number($('autoMinutes').value),maxRuns:Number($('autoRuns').value),moveMs:Number($('moveMs').value),skillMs:Number($('skillMs').value),autoPick:$('autoPick').checked,swapSkills:$('autoSkills').checked,autoReplay:$('autoReplay').checked});config=data.config;notify('Đã lưu. Cấu hình áp dụng khi bắt đầu farm lần tới.')}
  catch(e){notify(e.message,true)}finally{$('autoSave').disabled=false}
 });
 $('autoSave').disabled=true;
 request('AUTO_GET').then(data=>{
  config=HAF.sanitize(data.config);lastReport=data.report;
  for(const [id,key] of Object.entries({farmGoal:'farmGoal',autoPattern:'pattern',autoPriority:'priority',autoMinutes:'maxMinutes',autoRuns:'maxRuns',skillMs:'skillMs',moveMs:'moveMs'}))$(id).value=config[key];
  for(const [id,key] of Object.entries({autoPick:'autoPick',autoSkills:'swapSkills',autoReplay:'autoReplay'}))$(id).checked=config[key];
  $('pokemon').value=monByDex.has(config.pokemon)?label(monByDex.get(config.pokemon)):'';
  ready=true;$('autoSave').disabled=false;preview();showReport();notify('Cấu hình được lưu trên thiết bị.');
 }).catch(e=>notify(e.message,true));
 chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[HAF.REPORT_KEY]){lastReport=changes[HAF.REPORT_KEY].newValue;showReport()}});
 setInterval(showReport,3000);
})();
