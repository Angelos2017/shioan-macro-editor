(()=>{'use strict';
const $=id=>document.getElementById(id);
const available=(Array.isArray(window.SHIOAN_EMOTES)?window.SHIOAN_EMOTES:[]);
let state=[],past=[],future=[];const clone=x=>JSON.parse(JSON.stringify(x));
function save(){try{localStorage.setItem('shioan-builder-v03',JSON.stringify(state))}catch(e){}}
try{const v=JSON.parse(localStorage.getItem('shioan-builder-v03')||'[]');if(Array.isArray(v))state=v.filter(x=>x&&typeof x.cmd==='string').slice(0,15)}catch(e){}
function commit(next){if(next.length>15){alert('FF14のマクロは15行までです');return;}past.push(clone(state));if(past.length>60)past.shift();future=[];state=next;save();render()}
function result(){return state.map((x,i)=>x.cmd+(i<state.length-1&&x.wait?` <wait.${x.wait}>`:'' )).join('\n')}
function render(){
 $('makePreview').value=result();$('makeCount').textContent=`${state.length} / 15行`;
 $('makeUndo').disabled=!past.length;$('makeRedo').disabled=!future.length;$('makeAdd').disabled=state.length>=15;
 const area=$('makeRows');area.replaceChildren();state.forEach((x,i)=>{
 const row=document.createElement('div');row.className='line';const n=document.createElement('span');n.className='num';n.textContent=i+1;const c=document.createElement('code');c.textContent=x.cmd+(i<state.length-1&&x.wait?` <wait.${x.wait}>`:'');row.append(n,c);
 const btn=(label,fn,disabled)=>{const b=document.createElement('button');b.type='button';b.className='small secondary';b.textContent=label;b.disabled=!!disabled;b.onclick=fn;row.append(b)};
 btn('編集',()=>{const edited=prompt('この行を編集',x.cmd);if(edited===null)return;const cmd=edited.trim().replace(/[\r\n]+/g,' ');if(!cmd)return;const next=clone(state);next[i].cmd=cmd;commit(next)});
 btn('↑',()=>{const next=clone(state);[next[i-1],next[i]]=[next[i],next[i-1]];commit(next)},i===0);
 btn('↓',()=>{const next=clone(state);[next[i+1],next[i]]=[next[i],next[i+1]];commit(next)},i===state.length-1);
 btn('×',()=>commit(state.filter((_,j)=>i!==j)));area.append(row)});
}
function updateType(){$('makeChat').classList.toggle('hidden',$('makeType').value!=='chat');$('makeEmote').classList.toggle('hidden',$('makeType').value!=='emote');$('makeCommand').classList.toggle('hidden',$('makeType').value!=='command')}
function updateWait(){$('makeWaitRow').classList.toggle('hidden',!['y','sh'].includes($('channel').value))}
function getSelected(){return available.find(x=>x.command===$('makeEmoteSelect').value)}
function updateMotion(){const chosen=getSelected();$('makeMotion').disabled=!(chosen&&chosen.motion);if(!(chosen&&chosen.motion))$('makeMotion').checked=false;
 $('makeEmoteHint').textContent=chosen?chosen.motion?'motion にチェックを入れると「/コマンド motion」になるよ':'このコマンドには motion を追加しません':'エモートを選んでね';}
function updateEmotes(){const q=$('emoteSearch').value.toLowerCase().trim();const sel=$('makeEmoteSelect'),previous=sel.value;sel.replaceChildren();
 available.filter(x=>[x.name,x.command,(x.aliases||[]).join(' '),x.description].join(' ').toLowerCase().includes(q)).forEach(x=>{const o=document.createElement('option');o.value=x.command;o.textContent=`${x.name}　／　${x.command}`;sel.append(o)});
 if([...sel.options].some(o=>o.value===previous))sel.value=previous;updateMotion();}
$('makeType').onchange=updateType;$('channel').onchange=updateWait;$('emoteSearch').oninput=updateEmotes;$('makeEmoteSelect').onchange=updateMotion;
$('makeAdd').onclick=()=>{if(state.length>=15)return;let cmd='',wait='';if($('makeType').value==='chat'){
 const text=$('makeText').value.trim().replace(/[\r\n]+/g,' ');if(!text){alert('セリフを入力してね');return;}const ch=$('channel').value;cmd=`/${ch} ${text}`;if(['y','sh'].includes(ch))wait=$('makeWait').value;
 }else if($('makeType').value==='command'){cmd=$('makeCustom').value.trim().replace(/[\r\n]+/g,' ');if(!/^\/[a-z][a-z0-9]*(?:\s.*)?$/i.test(cmd)){alert('「/コマンド名」の形式で入力してね');return;}}else{const chosen=getSelected();if(!chosen){alert('エモートを選んでね');return;}cmd=chosen.command;if(chosen.command==='/emote'){
 const txt=prompt('自由エモートの文章を入力してね（例：は手を振った）','');if(txt===null||!txt.trim())return;cmd+=' '+txt.trim().replace(/[\r\n]+/g,' ');
 }else if(chosen.command==='/emotelog'){
 const choice=prompt('エモートログの設定：on または off を入力','on');if(choice===null)return;if(!['on','off'].includes(choice.trim())){alert('on または off を入力してね');return;}cmd+=' '+choice.trim();
 }else if($('makeMotion').checked&&chosen.motion)cmd+=' motion';}
 commit([...state,{cmd,wait}]);if($('makeType').value==='chat'){$('makeText').value='';$('makeText').focus();}}
$('makeUndo').onclick=()=>{if(!past.length)return;future.push(clone(state));state=past.pop();save();render()};
$('makeRedo').onclick=()=>{if(!future.length)return;past.push(clone(state));state=future.pop();save();render()};
$('makeClear').onclick=()=>{if(state.length&&confirm('作成中のマクロをすべて消去する？'))commit([])};
$('makeImport').onclick=()=>{if(!state.length){alert('まず1行追加してね');return;}setSource(result())};
$('makeCopy').onclick=()=>{if(!state.length)return;copy(result())};
window.shioanChooseCommand=cmd=>{$('makeType').value='command';updateType();$('makeCustom').value=cmd;show('make');$('makeCustom').focus();};
window.shioanChooseEmote=(cmd,motion)=>{
 $('makeType').value='emote';updateType();$('emoteSearch').value=cmd;updateEmotes();$('makeEmoteSelect').value=cmd;updateMotion();$('makeMotion').checked=!!motion&&!$('makeMotion').disabled;show('make');$('makeEmoteSelect').focus();
};
updateType();updateWait();updateEmotes();render();
})();
