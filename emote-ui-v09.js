(()=>{'use strict';
const $=id=>document.getElementById(id),items=Array.isArray(window.SHIOAN_EMOTES)?window.SHIOAN_EMOTES:[];
const sourceUrl='https://jp.finalfantasyxiv.com/lodestone/playguide/db/text_command/?category2=9';
const ghIssues='https://github.com/Angelos2017/shioan-macro-editor/issues/new';
let shown=70,lastFiltered=[];
const cats=[...new Set(items.map(x=>x.category))];for(const category of cats){const o=document.createElement('option');o.value=category;o.textContent=category;$('emoteDictCategory').append(o)}
function commandFrom(input,motion){const text=input.value.trim().replace(/[\r\n]+/g,' ');if(!/^\/[A-Za-z][A-Za-z0-9]*(?: [^\r\n]*)?$/.test(text)){alert('コマンドは / から始まる形式で入力してね');return null;}return text+(motion?.checked&&!/\smotion$/i.test(text)?' motion':'')}
async function copyText(value){try{const ok=await copy(value);return ok}catch(e){return false}}
function makeCard(item){
const card=document.createElement('article');card.className='emote-card';
const title=document.createElement('h3');title.textContent=item.name;const badge=document.createElement('span');badge.className='pill';badge.textContent=item.category;
const p=document.createElement('p');p.textContent=item.description||item.name;const alias=document.createElement('p');alias.className='muted emote-note';alias.textContent=item.aliases.length?'別名：'+item.aliases.join('、'):'別名なし';
const status=document.createElement('p');status.className='muted emote-note';status.textContent='照合：'+item.verification+' ／ ゲーム内：未検証';
const wrapper=document.createElement('div');wrapper.className='emote-command';const input=document.createElement('input');input.value=item.command;input.type='text';input.setAttribute('aria-label',item.name+'のコマンド（編集可）');input.spellcheck=false;
const motionLabel=document.createElement('label');motionLabel.className='motion-label';const motion=document.createElement('input');motion.type='checkbox';motion.disabled=!item.motion;const motionText=document.createElement('span');motionText.textContent='motion（ログなし）';motionLabel.append(motion,motionText);if(!item.motion)motionLabel.title='motion 非対応／未確認';
wrapper.append(input,motionLabel);
const buttonRow=document.createElement('div');buttonRow.className='row';
const append=document.createElement('button');append.type='button';append.className='small';append.textContent='取り込みへ追加';append.onclick=()=>{
 const cmd=commandFrom(input,motion);if(!cmd)return;const before=lines();if(before.length>=15&&!confirm('15行を超えるけれど追加する？ FF14では別のマクロに分けてね'))return;
 const next=$('source').value.trimEnd();setSource(next?next+'\n'+cmd:cmd);$('source').dispatchEvent(new Event('input',{bubbles:true}));
};
const toBuilder=document.createElement('button');toBuilder.type='button';toBuilder.className='small secondary';toBuilder.textContent='かんたん作成で選ぶ';toBuilder.onclick=()=>{if(input.value.trim()!==item.command){alert('編集したコマンドは「取り込みへ追加」を使ってね。かんたん作成では辞書の正式コマンドを選択します。');return;}window.shioanChooseEmote?.(item.command,motion.checked)};
const report=document.createElement('button');report.type='button';report.className='small secondary';report.textContent='報告文をコピー';report.onclick=async()=>{
 const cmd=commandFrom(input,motion);if(!cmd)return;const body=`【しお✦あん エモート動作報告】\n日本語名：${item.name}\nコマンド：${cmd}\n不具合・気づいたこと：\n使用したFF14パッチ：\n習得済みか：\n補足：`;if(await copyText(body)){report.textContent='✓ コピー済み';setTimeout(()=>{report.textContent='報告文をコピー'},1800)}
};
buttonRow.append(append,toBuilder,report);
const link=document.createElement('a');link.target='_blank';link.rel='noopener noreferrer';link.href=ghIssues+'?'+new URLSearchParams({title:'エモート確認：'+item.name,body:`コマンド：${item.command}\nゲーム内での状況：\nFF14パッチ：`}).toString();link.textContent='GitHubで報告 ↗';link.className='muted';
card.append(title,badge,p,alias,status,wrapper,buttonRow,link);return card;
}
function render(){const q=$('emoteDictSearch').value.toLowerCase().trim(),cat=$('emoteDictCategory').value;lastFiltered=items.filter(x=>(!cat||x.category===cat)&&[x.name,x.command,x.aliases.join(' '),x.description].join(' ').toLowerCase().includes(q));
 $('emoteCounter').textContent=`${lastFiltered.length}件表示 / 全${items.length}件`;
 const area=$('emoteEntries');area.replaceChildren();for(const x of lastFiltered.slice(0,shown))area.append(makeCard(x));
 const more=$('emoteMore');more.classList.toggle('hidden',lastFiltered.length<=shown);
 if(!lastFiltered.length){const p=document.createElement('p');p.className='muted';p.textContent='該当するエモートは見つからなかったよ';area.append(p)}
}
$('emoteDictSearch').addEventListener('input',()=>{shown=70;render()});$('emoteDictCategory').addEventListener('change',()=>{shown=70;render()});$('emoteMore').onclick=()=>{shown+=70;render()};render();
})();
