/* Browser-facing integration for the two supported game editions. */
const HAS=(()=>{
 const doofcraft=globalThis.location?.hostname==='pokesurvivor.doofcraft.com';
 const canvas=()=>doofcraft?document.querySelector('canvas.ps-canvas'):document.getElementById('game');
 const isCanvas=c=>doofcraft?!!c?.classList?.contains('ps-canvas'):c?.id==='game';
 const over=()=>doofcraft?document.querySelector('.ps-results'):document.getElementById('scr-over');
 const replay=()=>doofcraft?document.querySelector('[data-testid="game-exit"]'):document.getElementById('btn-again');
 const blockers=()=>document.querySelectorAll(doofcraft?'.ps-choice:not(.hidden),.ps-screen,.dialog-overlay,[role="dialog"],dialog[open]':'.scr:not(.hidden),[role="dialog"],dialog[open]');
 return Object.freeze({id:doofcraft?'doofcraft':'original',label:doofcraft?'Doofcraft':'PokéSurvivor',doofcraft,orbs:!doofcraft,canvas,isCanvas,over,replay,blockers});
})();
