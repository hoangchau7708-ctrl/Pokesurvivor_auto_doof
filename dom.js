/* DOM reads only; wait for each edition's choice lock before clicking. */
const HAD=(()=>{
 const visible=el=>{if(!el?.isConnected||el.closest('.hidden,[hidden]'))return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>2&&r.height>2};
 function cards(root){if(!root)return [];return [...root.querySelectorAll('.card,button.ps-card')].filter(visible).map((el,index)=>{
  const nm=el.querySelector('.nm');let title='';if(nm){const copy=nm.cloneNode(true);for(const badge of copy.querySelectorAll('.tag-chip,.badge,kbd'))badge.remove();title=copy.textContent.trim()}else title=(el.querySelector('.title,h3,h4,strong')?.textContent||'').trim();
  const tag=[...el.querySelectorAll('.tag-chip')].map(e=>e.textContent.trim()).join(' '),text=el.textContent.trim(),key=(el.querySelector('.key .kb-only,.key')?.textContent||String(index+1)).trim();
  const newMove=/\b(new|nuevo)\b/i.test(tag),lv=tag.match(/(?:Lv|Nv)\.?\s*(\d+)/i),type=el.classList.contains('evo')||title.includes('→')?'evo':newMove?'new':lv?'up':'stat';return{...HAE.card(el,title,tag,text),el,title,tag,text,key,type,level:lv?Number(lv[1]):null};
 }).filter(c=>/^[1-9]$/.test(c.key||''))}
 function dialog(){
  if(HAS.doofcraft){
   const boxes=[...document.querySelectorAll('.ps-choice .ps-box,[data-testid="choice"] .ps-box,.ps-box')].filter(e=>!e.closest('#ha-pilot')&&visible(e));
   const box=boxes.find(e=>e.querySelector('.ps-cards')||cards(e).length);if(!box)return null;
   const root=box.closest('.ps-choice,[data-testid="choice"]')||box,heading=box.querySelector('h2')?.textContent.trim()||'',cardBox=box.querySelector('.ps-cards')||box,options=cards(cardBox);
   const kind=/^(?:chest|cofre)$/i.test(heading)?'reward':/^(?:choice band|cinta elecci[oó]n)$/i.test(heading)?'band':box.querySelector('.bond-title')?'bond':/^(?:an item|un objeto|um item)/i.test(heading)||options.some(c=>/^(?:keep|switch to|conservar|cambiar)/i.test(c.title))?'item':/^(?:level|cleared|nivel|round|ronda)/i.test(heading)||box.querySelector('[data-testid="reroll"]')?'level':'other';
   return{kind,root,box:cardBox,cards:options,subtitle:[...box.querySelectorAll('.sub')].map(e=>e.textContent).join(' · '),level:kind==='level'?heading.match(/^(?:level|nivel)\s+(\d+)/i)?.[1]||'':'',roundClear:/^(?:round|ronda|cleared)/i.test(heading),ready:box.classList.contains('armed')&&!box.classList.contains('locked'),reroll:box.querySelector('[data-testid="reroll"]')};
  }
  for(const [id,kind,box]of[['scr-levelup','level','cards'],['scr-bond','bond','bond-cards'],['scr-item','item','item-cards']]){const e=document.getElementById(id);if(visible(e))return{kind,root:e,box:document.getElementById(box),cards:cards(document.getElementById(box)),subtitle:e.querySelector('#bond-sub')?.textContent||'',level:document.getElementById('lvl-num')?.textContent||''}}return null;
 }
 return{visible,cards,dialog};
})();
