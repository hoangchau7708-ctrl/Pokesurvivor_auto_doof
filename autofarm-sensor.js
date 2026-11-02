/* Observe only rendering. No game state writes or network interception. */
(()=>{
 'use strict';if(window.__haVision24)return;window.__haVision24=true;
 const P=window.CanvasRenderingContext2D?.prototype;if(!P)return;
 const data=HAS.doofcraft?HADC_DATA:HAV_DATA,sigs=data.signatures,cache=new WeakMap(),paths=new WeakMap();
 let canvas=null,objects=[],texts=[],hudIcons=[],signals=[],hudBoxes=[],cooldowns=[],skills=new Set(),skillIcons=[],skillDots=[],hudStates=[],zIcons=[],lastSent=0,seq=0;
 const original={};
 const game=c=>HAS.isCanvas(c.canvas);
 const matrix=c=>{const m=c.getTransform();return {a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}};
 const point=(m,x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
 const scale=m=>Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))||1;
 function hook(name,observe){original[name]=P[name];if(!original[name])return;P[name]=function(...args){const result=original[name].apply(this,args);try{if(game(this)){canvas=this.canvas;observe(this,args)}}catch{}return result}}
 function fingerprint(img){
  if(cache.has(img))return cache.get(img);
  let sig=null;try{if(img.getContext&&img.width>0&&img.height>0&&img.width<=128&&img.height<=128){const data=img.getContext('2d').getImageData(0,0,img.width,img.height).data;let h=2166136261;for(const b of data)h=Math.imul(h^b,16777619);sig=img.width+'x'+img.height+':'+(h>>>0).toString(16)}}catch{}
  cache.set(img,sig);return sig;
 }
 function push(c,o){if(objects.length<2400){const entry={...o,m:matrix(c)};objects.push(entry);return entry}}
 hook('drawImage',(c,[img,...a])=>{
  if(c.globalAlpha<0.1)return;
  const src=String(img.currentSrc||img.src||''),pm=HAS.doofcraft?src.match(/\/sprites\/([\w-]+)\/(s\/)?([^/?]+)\.png/i):src.match(/\/assets\/pokemon\/(\d+)\/(s\/)?([^/]+)\.png/i);
  const [x,y,w,h]=a.length===8?a.slice(4):a.length===4?a:[a[0],a[1],img.naturalWidth||img.width,img.naturalHeight||img.height];
  if(![x,y,w,h].every(Number.isFinite))return;
  const m=matrix(c),s=scale(m);const crystal=HAS.doofcraft&&src.match(/\/items\/([a-z]+-z)\.png(?:[?#]|$)/);if(crystal&&typeof HAZ_DATA!=='undefined'&&HAZ_DATA.some(z=>z.id===crystal[1])&&w>=8&&w<=64&&h>=8&&h<=64){zIcons.push({...point(m,x+w/2,y+h/2),m,id:crystal[1],alpha:c.globalAlpha});return}const terrain=HAS.doofcraft?HAT.read(c,img,x,y,w,h):null;if(terrain){for(const o of terrain)push(c,o);return}const sig=pm?null:fingerprint(img),label=sig?sigs[sig]:null;
  if(HAS.doofcraft&&['26x58:90a6f656','26x58:67bf3fcd'].includes(sig)&&a.length!==8&&Math.abs(w/img.width-2)<.05&&Math.abs(h/img.height-2)<.05){push(c,{...point(m,x+w/2,y+h-6),kind:'obelisk',r:20*s,sig,confirmed:true});return}
  if(label&&!['ignore','skill'].includes(label.kind))signals.push({...point(m,x+w/2,y+h/2),m,kind:label.kind,id:label.id||label.label});
  if(label&&['orb','item'].includes(label.kind))hudIcons.push({...point(m,x+w/2,y+h/2),m,id:label.id||label.label,kind:label.kind});
  if(label?.kind==='skill'){
   const p=point(m,x+w/2,y+h/2);if(skillIcons.length<64)skillIcons.push({...p,m,ids:label.moveIds,pixelSize:img.width,size:Math.abs(w)*s});if(p.y>canvas.height*.55&&label.moveIds.length===1)skills.add(label.moveIds[0]);return;
  }
  if(!label&&[16,22].some(n=>Math.abs(Math.abs(w)-n)<.1)&&skillIcons.length<64)skillIcons.push({...point(m,x+w/2,y+h/2),m,ids:[],size:Math.abs(w)*s});
  if(pm){
   if(/Faint|Sleep/i.test(pm[3]))return;
   const meta=data.anchors[pm[1]],anchor=(pm[2]&&meta?.sa?.[pm[3]])||meta?.a?.[pm[3]];
   if(!anchor)return;
   const px=x+anchor[2]*w/anchor[0],py=y+anchor[3]*h/anchor[1];
   const r=Math.max(5,Math.min(26,(meta?.a?.Idle?.[0]||anchor[0])*.22))*Math.abs(w/anchor[0]);
   push(c,{...point(m,px,py),kind:'pokemon',anim:pm[3],dex:meta.dex||Number(pm[1]),r:r*s});return;
  }
  if(label?.kind==='ignore'||label?.active===false)return;
  if(!label&&(!sig||Math.abs(w)>160||Math.abs(h)>180))return;
  let px=x+w/2,py=y+h/2;
  if(label?.anchor==='foot')py=y+h-(label.offset||2)-(label.kind==='rift'?10:0);
  else if(label?.anchor==='pickup')py+=7;
  push(c,{...point(m,px,py),kind:label?.kind||'unknown',progressPoint:label?.kind==='chest'?point(m,x+w/2,y+h/2-2):label?.kind==='lantern'?point(m,x+w/2,y+12):label?.kind==='cage'?point(m,x+w/2,y+h-28):undefined,sig,r:(label?.r||Math.min(Math.abs(w),Math.abs(h))*.3)*s,label:label?.label||sig});
 });
 hook('fillText',(c,[text,x,y])=>{if(texts.length>=800)texts.shift();{const m=matrix(c);texts.push({...point(m,x,y),localX:x,localY:y,color:String(c.fillStyle),text:String(text).slice(0,180),m})}});
 hook('beginPath',c=>paths.set(c,{points:[],primitive:null}));
 for(const name of ['moveTo','lineTo'])hook(name,(c,[x,y])=>{const p=paths.get(c);if(p&&p.points.length<48)p.points.push(point(matrix(c),x,y))});
 for(const name of ['arc','ellipse'])hook(name,(c,args)=>{
  const [x,y,rx]=args,ry=name==='arc'?rx:args[3],rotation=name==='arc'?0:args[4],start=name==='arc'?args[3]:args[5],end=name==='arc'?args[4]:args[6];
  const p=paths.get(c);if(!p)return;const m=matrix(c);p.primitive={x,y,rx,ry,start,end};
  for(let i=0;i<=16&&p.points.length<48;i++){const angle=start+(end-start)*i/16,dx=rx*Math.cos(angle),dy=ry*Math.sin(angle);p.points.push(point(m,x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y+dx*Math.sin(rotation)+dy*Math.cos(rotation)))}
 });
 hook('rect',(c,[x,y,w,h])=>{const p=paths.get(c);if(p)for(const [dx,dy] of [[0,0],[w,0],[w,h],[0,h]])p.points.push(point(matrix(c),x+dx,y+dy))});
 const color=style=>{const hex=String(style).match(/^#([0-9a-f]{6})$/i),rgb=String(style).match(/^rgba?\(([^)]+)\)$/);if(hex)return [parseInt(hex[1].slice(0,2),16),parseInt(hex[1].slice(2,4),16),parseInt(hex[1].slice(4),16),1];if(rgb){const a=rgb[1].split(',').map(Number);return [a[0],a[1],a[2],a[3]??1]}return [0,0,0,0]};
 const red=style=>{const [r,g,b]=color(style);return r>190&&g<160&&r>g*1.35&&b<210};
 function shape(c,stroke=false){
  const p=paths.get(c);if(!p||p.points.length<2)return;const style=String(stroke?c.strokeStyle:c.fillStyle).toLowerCase(),m=matrix(c),s=scale(m),q=p.primitive;
  if(stroke&&q&&style==='#7dffb0'&&c.lineWidth===2&&c.getLineDash().join(',')==='6,5'&&Math.abs(q.rx-56)<1&&Math.abs(q.ry-40)<1){push(c,{...point(m,q.x,q.y),kind:'escortGoal',r:0});return}
  if(!stroke&&q&&style==='#7dffb0'&&Math.abs(c.globalAlpha-.3)<.02&&q.rx>10&&q.ry/q.rx<.5){push(c,{...point(m,q.x,q.y),kind:'friendlymark',r:0});return}
  if(stroke&&q&&c.globalAlpha>.95&&['#ffb347','#ffd25a','#7dffb0'].includes(style)&&Math.abs(q.rx-26)<.1&&Math.abs(q.ry-26)<.1&&Math.abs(c.lineWidth-3)<.1){push(c,{...point(m,q.x,q.y),kind:'interactionmark',eventKind:style==='#ffb347'?'door':style==='#ffd25a'?'lantern':'cage',r:0,progress:Math.max(0,Math.min(1,(q.end-q.start)/(Math.PI*2)))});return}
  if(stroke&&q&&style==='#ffd23f'&&Math.abs(q.rx-26)<.1&&Math.abs(q.ry-26)<.1&&Math.abs(c.lineWidth-3)<.1){push(c,{...point(m,q.x,q.y),kind:'chestmark',r:0,progress:Math.max(0,Math.min(1,(q.end-q.start)/(Math.PI*2)))});return}
  if(stroke&&q&&Math.abs(q.ry/q.rx-.75)<.025&&c.lineWidth===2&&c.getLineDash().join(',')==='4,4'){
   const at=point(m,q.x,q.y),outer=objects.findLast(o=>o.shape==='zone'&&Math.hypot(o.x-at.x,o.y-at.y)<2);
   if(outer)outer.confirmed=true;else push(c,{...at,kind:'hazard',shape:'zone',r:q.rx*s,progress:0,worldShape:true,confirmed:true});return;
  }
  if(HAS.doofcraft&&!q&&p.points.length>=4){const xs=p.points.map(v=>v.x),ys=p.points.map(v=>v.y),w=(Math.max(...xs)-Math.min(...xs))/s,h=(Math.max(...ys)-Math.min(...ys))/s;if(Math.abs(w-54)<.5&&Math.abs(h-54)<.5&&c.globalAlpha>.95){const center={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,m,s};if(stroke&&style==='#ffd23f')hudStates.push({...center,kind:'evolved'});if(!stroke){const rgb=color(style);if(rgb[0]===30&&rgb[1]===24&&rgb[2]===10&&Math.abs(rgb[3]-.92)<.02)hudStates.push({...center,kind:'zready'});else if(rgb[0]===10&&rgb[1]===16&&rgb[2]===28&&Math.abs(rgb[3]-.8)<.02)hudStates.push({...center,kind:'zwait'})}}}
  const rgba=color(style),alpha=c.globalAlpha*rgba[3];
  // Doofcraft draws solid red warnings, using .15 outer and .22/.36 inner fills.
  if(HAS.doofcraft&&style==='#ff2445'){
   const outer=Math.abs(alpha-.15)<.004||Math.abs(alpha-.1275)<.004,inner=[.22,.36,.187,.306].some(v=>Math.abs(alpha-v)<.004);
   if(q&&Math.abs(q.ry/q.rx-.75)<.025){const at=point(m,q.x,q.y),existing=objects.findLast(o=>o.shape==='zone'&&Math.hypot(o.x-at.x,o.y-at.y)<2);if(!stroke&&outer)push(c,{...at,kind:'hazard',shape:'zone',r:q.rx*s,progress:0,worldShape:true,confirmed:true});else if(!stroke&&inner&&existing)existing.progress=Math.min(1,q.rx*s/existing.r);return}
   if(!q&&p.points.length===4){const at={x:p.points.reduce((n,v)=>n+v.x,0)/4,y:p.points.reduce((n,v)=>n+v.y,0)/4},short=Math.min(...p.points.map((v,i)=>Math.hypot(v.x-p.points[(i+1)%4].x,v.y-p.points[(i+1)%4].y))),existing=objects.findLast(o=>o.shape==='beam'&&Math.hypot(o.x-at.x,o.y-at.y)<2);if(!stroke&&outer)push(c,{...at,kind:'hazard',shape:'beam',r:Math.max(...p.points.map(v=>Math.hypot(v.x-at.x,v.y-at.y))),poly:p.points.slice(),beamWidth:short,progress:0,worldShape:true,confirmed:true});else if(!stroke&&inner&&existing)existing.progress=Math.min(1,short/existing.beamWidth);return}
  }
  if(HAS.doofcraft&&style==='#ff2445'&&!stroke&&[.15,.1275].some(v=>Math.abs(alpha-v)<.004)){const xs=p.points.map(v=>v.x),ys=p.points.map(v=>v.y);push(c,{x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2,kind:'hazard',r:Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))/2,poly:p.points.slice(0,40),confirmed:true,worldShape:true});return}
  // Hostile projectiles have a dedicated red ground marker, including tiny bullets.
  if(!stroke&&q&&rgba[0]===255&&rgba[1]===60&&rgba[2]===80&&Math.abs(alpha-.35)<.02&&q.rx>2&&q.rx<90&&Math.abs(q.ry/q.rx-.4)<.03){push(c,{...point(m,q.x,q.y),kind:'projectile',r:q.rx/1.5*s,worldShape:true});return}
  // Boss zone warnings are ellipses on the ground, with an inner fill showing charge.
  if(!stroke&&q&&q.rx>1&&Math.abs(q.ry/q.rx-.75)<.025&&(Math.abs(alpha-.16)<.005||Math.abs(alpha-.32)<.005)){
   const at=point(m,q.x,q.y);
   if(Math.abs(alpha-.16)<.005)push(c,{...at,kind:'hazard',shape:'zone',r:q.rx*s,progress:0,worldShape:true});
   else{const outer=objects.findLast(o=>o.shape==='zone'&&Math.hypot(o.x-at.x,o.y-at.y)<2&&o.r>=q.rx*s);if(outer)outer.progress=Math.min(1,q.rx*s/outer.r)}return;
  }
  if(!stroke&&q&&c.globalAlpha>=.95&&style==='#ffd23f'&&Math.abs(q.ry-5.5)<.15){push(c,{...point(m,q.x,q.y+7),kind:'coin',r:5.5*s});return}
  if(!stroke&&['#7fe0ff','#ffd95e'].includes(style)&&c.globalAlpha>=.95&&!q&&p.points.length===4){
   const xs=p.points.map(o=>o.x),ys=p.points.map(o=>o.y),w=(Math.max(...xs)-Math.min(...xs))/s;
   if(w>=5&&w<=12)push(c,{x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2+7*s,kind:'xp',r:4*s});return;
  }
  if(!stroke&&q&&c.globalAlpha<.5&&['#ffd23f','#ffd95e','#ff4a4a','#9ae6ff','#c9a6ff'].includes(style)&&q.rx>12&&q.ry<q.rx*.5){push(c,{...point(m,q.x,q.y),kind:style==='#ffd23f'?'goldmark':'bossmark',fury:style==='#ff4a4a',r:q.rx*s});return}
  if(stroke&&p.points.length>=4){const xs=p.points.map(p=>p.x),ys=p.points.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);if(Math.abs(w/s-40)<.5&&Math.abs(h/s-40)<.5)hudBoxes.push({x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2,s,m})}

  if(!HAS.doofcraft&&red(style)&&alpha>.08&&alpha<.8){
   const xs=p.points.map(o=>o.x),ys=p.points.map(o=>o.y),width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
   if(Math.max(width,height)/s>18&&Math.max(width,height)/s<1100)push(c,{x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2,kind:'hazard',r:Math.max(width,height)/2,poly:p.points.slice(0,40),stroke:stroke?c.lineWidth*s:0});
  }
 }
 hook('arcTo',(c,a)=>{const p=paths.get(c);if(p)p.points.push(point(matrix(c),a[0],a[1]))});
 hook('quadraticCurveTo',(c,a)=>{const p=paths.get(c);if(p)p.points.push(point(matrix(c),a[2],a[3]))});
 function beamRect(c,x,y,w,h,outline=false){
  const m=matrix(c),alpha=c.globalAlpha*color(c.fillStyle)[3];
  if(outline){if(c.lineWidth!==2||c.getLineDash().join(',')!=='6,4')return false}
  else if(Math.abs(alpha-.14)>.005&&Math.abs(alpha-.34)>.005)return false;
  if(w<20||w>1100||h<0||h>220)return false;
  const center=point(m,x+w/2,y+h/2),existing=objects.findLast(o=>o.shape==='beam'&&Math.hypot(o.x-center.x,o.y-center.y)<2);
  if(!outline&&Math.abs(alpha-.34)<.005){if(existing&&existing.beamWidth)existing.progress=Math.min(1,h/existing.beamWidth);return true}
  if(outline&&existing)existing.confirmed=true;
  if(!existing)push(c,{...center,kind:'hazard',shape:'beam',r:Math.max(w,h)*scale(m)/2,poly:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([px,py])=>point(m,px,py)),beamWidth:h,progress:0,confirmed:outline,worldShape:true});return true;
 }
 hook('fillRect',(c,[x,y,w,h])=>{
  if(Math.abs(w-4)<.1&&Math.abs(h-3)<.1&&skillDots.length<100){const m=matrix(c);skillDots.push({...point(m,x,y),m,filled:color(c.fillStyle)[3]*c.globalAlpha>.65})}
  if(beamRect(c,x,y,w,h))return;
  if(Math.abs(w-40)<.1&&h>0&&h<=40&&/rgba\(0,\s*0,\s*0,\s*0\.55\)/.test(String(c.fillStyle)))cooldowns.push({...point(matrix(c),x,y),w:40*scale(matrix(c)),h:h*scale(matrix(c)),m:matrix(c)})
 });
 hook('strokeRect',(c,[x,y,w,h])=>beamRect(c,x,y,w,h,true));
 hook('fill',c=>shape(c));hook('stroke',c=>shape(c,true));
 function flush(now){
  if(canvas&&now-lastSent>=60){
   const pokes=objects.filter(o=>o.kind==='pokemon'&&o.x>canvas.width*.15&&o.y>canvas.height*.15);
   const counts=new Map();for(const p of pokes){const m=p.m,k=[m.a,m.b,m.c,m.d,m.e,m.f].map(x=>Math.round(x*100)/100).join(',');const v=counts.get(k)||{n:0,m};v.n++;counts.set(k,v)}
   const cam=[...counts.values()].sort((a,b)=>b.n-a.n)[0]?.m;
   const same=m=>cam&&Math.abs(m.a-cam.a)<.005&&Math.abs(m.d-cam.d)<.005&&Math.abs(m.e-cam.e)<3&&Math.abs(m.f-cam.f)<3;
   const inverse=p=>{const d=cam.a*cam.d-cam.b*cam.c,x=p.x-cam.e,y=p.y-cam.f;return {x:(cam.d*x-cam.c*y)/d,y:(-cam.b*x+cam.a*y)/d}};
   const world=cam?objects.filter(o=>(!o.shape||o.confirmed)&&(same(o.m)||o.worldShape&&Math.abs(scale(o.m)-scale(cam))<.01)).map(o=>({...o,...inverse(o),r:o.r/scale(cam),poly:o.poly?.map(inverse),progressPoint:o.progressPoint?inverse(o.progressPoint):undefined,stroke:(o.stroke||0)/scale(cam),m:undefined})):[];
   for(const chest of world.filter(o=>o.kind==='chest')){const marker=world.find(o=>o.kind==='chestmark'&&chest.progressPoint&&Math.hypot(o.x-chest.progressPoint.x,o.y-chest.progressPoint.y)<8);if(marker)chest.progress=marker.progress}
   const marks=world.filter(o=>['goldmark','bossmark'].includes(o.kind));
   for(const p of world.filter(o=>o.kind==='pokemon')){const marker=marks.find(m=>Math.hypot(m.x-p.x,m.y-p.y)<12);if(marker){p.kind=marker.kind==='bossmark'?'boss':([52,1000].includes(p.dex)?'thief':'elite');p.fury=!!marker.fury}}
   const hud=texts.filter(t=>!same(t.m)),top=hud.filter(t=>t.x<canvas.width*.46&&t.y<canvas.height*.24);
   const hp=top.map(t=>t.text.match(/^(\d+)\s*\/\s*(\d+)$/)).find(Boolean);
   const clock=hud.filter(t=>t.x>canvas.width*.35&&t.x<canvas.width*.65&&t.y<canvas.height*.2).map(t=>t.text.match(/^(\d+):([0-5]\d)$/)).find(Boolean);
   const level=top.map(t=>t.text.match(/^(?:Lv|Nv|Level)\.?\s*(\d+)/i)).find(Boolean);
   const arena=hud.some(t=>/^(RIFT|GRIETA)\s*[·:]\s*\d+:[0-5]\d$/i.test(t.text));
   if(cam){
    const center=inverse({x:canvas.width/2,y:canvas.height/2});
    for(const t of hud){
     const portal=t.text.match(/^(?:RIFT|GRIETA)\s*[·•:]\s*(\d+)\s*m\s*[·•:]\s*(\d+)\s*s/i);
     const near=t.text.match(/^(?:RIFT|GRIETA)\s*[·•:]\s*(\d+)\s*s\s*$/i);
     const thief=/^(Meowth|Gholdengo)$/i.test(t.text)&&t.color.toLowerCase()==='#ffd23f'&&Math.abs(t.m.e)+Math.abs(t.m.f)>10;
     if(!portal&&!near&&!thief)continue;
     const kind=portal||near?'rift':'thief',ttl=portal?Number(portal[2]):near?Number(near[1]):null;
     let exact=world.find(o=>o.kind===kind&&!o.approximate);
     if(portal&&exact&&Math.abs(Math.hypot(exact.x-center.x,exact.y-center.y)-Number(portal[1])*32)>110){
      // HUD distance contradicts this sprite: do not navigate into a false portal.
      for(let i=world.length-1;i>=0;i--)if(world[i].kind==='rift')world.splice(i,1);
      exact=null;
     }
     if(exact){if(ttl!==null)exact.ttl=ttl;continue}
     if(world.some(o=>o.kind===kind))continue;
     if(near){
      // Visible portal: label is above the bouncing arrow, ~76–86 px above its interaction point.
      const p=inverse({x:t.m.e,y:t.m.f+81});
      world.push({kind,...p,r:14,approximate:true,ttl,label:'Cổng dưới chỉ báo trên màn hình'});continue;
     }
     const dx=-t.localX/(portal?34:26),dy=(4-t.localY)/(portal?30:24),len=Math.hypot(dx,dy);
     if(len<.8||len>1.2)continue;
     const origin=inverse({x:t.m.e,y:t.m.f});
     const v=inverse({x:t.m.e+dx/len,y:t.m.f+dy/len});
     const vl=Math.hypot(v.x-origin.x,v.y-origin.y),ux=(v.x-origin.x)/vl,uy=(v.y-origin.y)/vl;
     const distance=portal?Math.min(3000,Number(portal[1])*32):650;
     // The arrow points from the screen edge, not from the player. Intersect
     // that ray with the HUD distance circle to recover the portal direction.
     const ox=origin.x-center.x,oy=origin.y-center.y,dot=ox*ux+oy*uy;
     const ray=Math.max(0,-dot+Math.sqrt(Math.max(0,dot*dot+distance*distance-ox*ox-oy*oy)));
     world.push({kind,x:origin.x+ux*ray,y:origin.y+uy*ray,r:portal?14:18,approximate:true,ttl,label:portal?'Cổng theo mũi tên + khoảng cách':'Kho báu theo mũi tên'});
    }
   }
   const events=cam?HAE.annotate(world,hud,texts,cam,canvas.width,canvas.height,signals.filter(t=>!same(t.m))):[];
   const inventoryIcons=hudIcons.filter(t=>!same(t.m)),boxes=hudBoxes.filter(t=>!same(t.m));
   const bagIcons=inventoryIcons.filter(t=>t.kind==='orb'),item=inventoryIcons.find(t=>t.kind==='item')?.id||null;
   let orbs=[],orbBuffs={};
   for(const icon of bagIcons){
    const seconds=hud.find(t=>Math.abs(t.x-icon.x)<5&&Math.abs(t.y-icon.y-23*scale(icon.m))<5&&/^\d+s$/.test(t.text));
    if(seconds){orbBuffs[icon.id]=parseInt(seconds.text);continue}
    // All four slot boxes are drawn even when empty, preserving keys 5–8.
    for(const first of boxes){const row=[0,1,2,3].map(i=>boxes.find(b=>Math.abs(b.x-first.x-i*46*first.s)<2&&Math.abs(b.y-first.y)<2));
     if(row.some(b=>!b))continue;
     const slot=row.findIndex(b=>Math.hypot(icon.x-b.x,icon.y-b.y)<3);if(slot<0)continue;
     const box=row[slot],countText=hud.find(t=>/^×[1-3]$/.test(t.text)&&Math.abs(t.x-(box.x+17*box.s))<3&&Math.abs(t.y-(box.y+16*box.s))<3);
     const ready=!cooldowns.some(c=>!same(c.m)&&Math.abs(c.x-(box.x-20*box.s))<2&&Math.abs(c.y-(box.y-20*box.s))<2);
     orbs.push({id:icon.id,slot,count:countText?Number(countText.text.slice(1)):1,ready});break;
    }
   }
   // Slot numbers and icons must share the observed HUD transform and geometry.
   const skillSlots=[];
   for(const key of hud.filter(t=>/^[1-4]$/.test(t.text))){
    const z=scale(key.m),x=key.x-3*z,y=key.y-10*z;
    const icons=skillIcons.filter(t=>Math.abs(t.m.a-key.m.a)<.001&&Math.abs(t.m.d-key.m.d)<.001&&Math.abs(t.m.e-key.m.e)<.01&&Math.abs(t.m.f-key.m.f)<.01&&t.x>x&&t.x<x+54*z&&t.y>y&&t.y<y+54*z);
    if(!icons.length)continue;
    const title=hud.find(t=>Math.abs(t.x-(x+27*z))<2*z&&Math.abs(t.y-(y-7*z))<2*z&&!/^[0-9×]/.test(t.text));
    const ids=[...new Set(icons.flatMap(t=>t.ids.length===1?t.ids:[]))];
    const iconSize=(icon,n)=>Math.abs(icon.size-n*z)<z||HAS.doofcraft&&icon.pixelSize>0&&Math.abs(icon.size-icon.pixelSize*Math.max(1,Math.round(n*z/icon.pixelSize)))<1;
    const bond=title?.text.match(/\+(\d+)$/),single=icons.length===1&&iconSize(icons[0],32);
    const grid=icons.length>=2&&icons.length<=4&&icons.every(t=>[16,22].some(n=>iconSize(t,n))&&[14.333333,39.666667].some(dx=>Math.abs(t.x-(x+dx*z))<z)&&[14.333333,39.666667].some(dy=>Math.abs(t.y-(y+dy*z))<z));
    const complete=icons.every(t=>t.ids.length===1)&&new Set(ids).size===icons.length&&(single||grid&&(!bond||icons.length===Number(bond[1])+1));
    const dots=skillDots.filter(t=>Math.abs(t.m.a-key.m.a)<.001&&Math.abs(t.m.d-key.m.d)<.001&&Math.abs(t.m.e-key.m.e)<.01&&Math.abs(t.m.f-key.m.f)<.01&&Math.abs(t.y-(y+45*z))<z&&t.x>x&&t.x<x+54*z).sort((a,b)=>a.x-b.x);
    const dotGrid=single&&dots.length>=1&&dots.length<=10&&dots.every((d,i)=>!i||Math.abs(d.x-dots[i-1].x-6*z)<z),level=dotGrid?dots.filter(d=>d.filled).length:null;
    const evolved=single&&hudStates.some(b=>b.kind==='evolved'&&Math.hypot(b.x-x-27*z,b.y-y-27*z)<z);
    skillSlots.push({evolved,level:level>0?level:null,levelVerified:dotGrid&&level>0,slot:Number(key.text)-1,count:icons.length,ids,active:!!title,complete,title:title?.text||''});
   }
   const zCandidates=zIcons.filter(i=>!same(i.m)).map(i=>{const b=hudStates.find(b=>['zready','zwait'].includes(b.kind)&&Math.hypot(b.x-i.x,b.y-i.y)<2*scale(i.m)&&Math.abs(b.m.a-i.m.a)<.001&&Math.abs(b.m.d-i.m.d)<.001);return b?{id:i.id,verified:true,ready:b.kind==='zready'&&i.alpha>.95}:null}).filter(Boolean);const zMove=zCandidates.length===1?zCandidates[0]:null;
   const golden=hud.some(t=>/^(GOLDEN HOUR|HORA DORADA)/i.test(t.text));
   window.postMessage({type:'HA_VISION',frame:{seq:++seq,width:canvas.width,height:canvas.height,camera:cam||null,events,objects:world.filter(o=>!['goldmark','bossmark','chestmark','friendlymark','interactionmark'].includes(o.kind)).sort((a,b)=>{const rank=o=>['hazard','projectile'].includes(o.kind)?0:['obelisk','pokemon','boss','friendly','escortNpc','escortGoal','rift','door','cage','lantern'].includes(o.kind)?1:['ticket','ticket10','ticket25','gem','candy','chest','reward','item'].includes(o.kind)?2:o.kind==='wall'?3:o.kind==='unknown'?5:4;return rank(a)-rank(b)}).slice(0,1200),texts:hud.map(t=>t.text).slice(-220),names:top.map(t=>t.text),skills:[...skills],skillSlots,zMove,hp:hp&&Number(hp[2])>0?Number(hp[1])/Number(hp[2]):null,clock:clock?Number(clock[1])*60+Number(clock[2]):null,level:level?Number(level[1]):null,item,orbs,orbBuffs,arena,golden}},location.origin);
   lastSent=now;
  }
  objects=[];texts=[];hudIcons=[];signals=[];hudBoxes=[];cooldowns=[];skills=new Set();skillIcons=[];skillDots=[];hudStates=[];zIcons=[];requestAnimationFrame(flush);
 }
 requestAnimationFrame(flush);
})();
