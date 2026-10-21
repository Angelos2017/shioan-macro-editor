/* v2.0 private test: guided macro generator. No game connection or automation. */
(()=>{'use strict';
const $=id=>document.getElementById(id),Q=$('wzQuestions');
const available=Array.isArray(window.SHIOAN_EMOTES)?window.SHIOAN_EMOTES:[];
const state={type:'greeting',channel:'p',greeting:'よろしくお願いします！',gwait:'',messages:['みなさん こんばんは！','それではイベントを始めましょう！'],seqwait:'3',etype:'text',emotion:'苦笑い',etarget:'target',etext:'苦笑いをした',efixed:'薫',esearch:'',ecmd:'/bow',emotiononly:false,ewait:''};
const channelOptions=[['s','近くの人（Say）'],['p','パーティのみんな'],['fc','FCのみんな'],['y','少し広い範囲（Yell）'],['sh','広い範囲（Shout）'],['echo','自分だけ（Echo）']];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const oneLine=s=>String(s||'').replace(/[\r\n]+/g,' ').trim();
function options(list,val){return list.map(([v,label])=>`<option value="${escape(v)}" ${v===val?'selected':''}>${escape(label)}</option>`).join('')}
const waitField=(id,val)=>`<div class="wz-inline"><label for="${id}">待機時間</label><input id="${id}" type="number" inputmode="numeric" min="1" max="60" step="1" value="${escape(val)}" placeholder="なし"><span class="muted">秒　空欄なら待機なし</span></div>`;
function waitValue(raw){const v=String(raw).trim();return v===''?'':(/^[0-9]+$/.test(v)&&Number(v)>=1&&Number(v)<=60)?String(Number(v)):null}
const labels={greeting:'あいさつする',chatseq:'セリフを順番に流す',emote:'エモートで遊ぶ',craft:'クラフトする'};
function selectType(type){state.type=type;document.querySelectorAll('[data-wz-type]').forEach(b=>{b.classList.toggle('selected',b.dataset.wzType===type);b.setAttribute('aria-pressed',String(b.dataset.wzType===type))});questions()}
function selectedEmotes(){const q=state.esearch.toLowerCase().trim();const tokens=q.replace(/笑う|笑い|わらう/g,'笑').replace(/微笑む|ほほえむ/g,'笑').split(/\s+/).filter(Boolean);return available.filter(e=>{
 const doc=[e.name,e.command,(e.aliases||[]).join(' '),e.description].join(' ').toLowerCase();const normalized=doc.replace(/笑う|笑い|わらう/g,'笑').replace(/微笑む|ほほえむ/g,'笑');return !tokens.length||tokens.every(t=>normalized.includes(t));
 }).slice(0,70)}
function questions(){let html='';
if(state.type==='greeting')html=`<h3>💬 誰に何を伝えたい？</h3><label for="wzChannel">誰に話す？</label><select id="wzChannel">${options(channelOptions,state.channel)}</select><label for="wzGreeting">何と言う？</label><textarea id="wzGreeting" rows="2" placeholder="あいさつを入力">${escape(state.greeting)}</textarea>${waitField('wzGwait',state.gwait)}<div class="wz-hint">コマンドを知らなくても大丈夫　選んだ相手に合わせて自動で作るよ</div>`;
if(state.type==='chatseq')html=`<h3>📣 どんな順番で話す？</h3><label for="wzChannel">誰に話す？</label><select id="wzChannel">${options(channelOptions,state.channel)}</select><label>セリフを上から順番に表示するよ</label><div id="wzMessages" class="wz-messages">${state.messages.map((m,i)=>`<div class="wz-message"><span>${i+1}.</span><input data-msg="${i}" value="${escape(m)}" aria-label="${i+1}番目のセリフ"><button type="button" class="secondary small" data-remove="${i}" ${state.messages.length===1?'disabled':''}>削除</button></div>`).join('')}</div><button type="button" class="secondary small" id="wzAddMessage" ${state.messages.length>=15?'disabled':''}>＋ セリフを追加</button>${waitField('wzSeqwait',state.seqwait)}<div class="wz-hint">最後のセリフ以外に待機時間を付けるよ　2秒・3秒のテンポは動作プレビューで確認できるよ</div>`;
if(state.type==='emote'){
 const candidates=selectedEmotes().filter(e=>e.command.startsWith('/')&&!['/emote','/emotelog'].includes(e.command));
 const selected=candidates.find(e=>e.command===state.ecmd)||candidates[0];
 if(selected&&!candidates.some(e=>e.command===state.ecmd))state.ecmd=selected.command;
 html=`<h3>🎭 どう表現する？</h3><label for="wzEtype">作りたいもの</label><select id="wzEtype">${options([['action','動作だけ（キャラクターを動かす）'],['text','文章だけ（オリジナルのエモート）'],['both','動作と文章の両方']],state.etype)}</select>`;
 if(state.etype!=='text')html+=`<label for="wzEsearch">どんな動作？（日本語で探せるよ）</label><input id="wzEsearch" type="search" value="${escape(state.esearch)}" placeholder="例：笑う　手を振る　拍手"><label for="wzEcmd">候補から選ぶ</label><select id="wzEcmd">${options(candidates.map(e=>[e.command,`${e.name} ／ ${e.command}${e.test_status==='未検証'?'（動作未検証）':''}`]),state.ecmd)}</select><div class="wz-inline"><label for="wzMotion"><input id="wzMotion" type="checkbox" ${state.emotiononly?'checked':''}> 動作だけ表示して標準のエモートログを出さない（motion）</label></div>`;
 if(state.etype!=='action')html+=`<label for="wzEtarget">誰に向けた文章？</label><select id="wzEtarget">${options([['target','今ターゲットしている相手'],['none','相手を指定しない'],['fixed','名前を直接入力']],state.etarget)}</select>${state.etarget==='fixed'?`<label for="wzEfixed">相手の名前</label><input id="wzEfixed" value="${escape(state.efixed)}" placeholder="相手の名前">`:''}<label for="wzEtext">どんな文章にする？</label><input id="wzEtext" value="${escape(state.etext)}" placeholder="例：苦笑いをした"><div class="wz-hint">自分のキャラクター名はゲームが先頭に付けるよ<br>例：アンは薫に苦笑いをした → <code>/em は&lt;t&gt;に苦笑いをした</code><br>※ 自由エモートの文章は実際の動作アニメーションを伴わないよ</div>`;
 html+=waitField('wzEwait',state.ewait);
}
if(state.type==='craft')html=`<h3>🛠️ クラフトマクロを作ろう</h3><p>これまでのクラフト作成機能で、アクションを選んで順番に並べられるよ。</p><button type="button" id="wzGoCraft">クラフト作成へ進む →</button><p class="muted">CP・作業精度・品質はゲーム内で確認してね</p>`;
Q.innerHTML=html;wire();render()}
function updateEmoteOptions(){const sel=$('wzEcmd');if(!sel)return;const choices=selectedEmotes().filter(e=>e.command.startsWith('/')&&!['/emote','/emotelog'].includes(e.command));const prev=state.ecmd;sel.replaceChildren();for(const e of choices){const opt=document.createElement('option');opt.value=e.command;opt.textContent=`${e.name} ／ ${e.command}${e.test_status==='未検証'?'（動作未検証）':''}`;sel.append(opt)}if(choices.some(e=>e.command===prev))sel.value=prev;else state.ecmd=sel.value||'';render()}
function bind(id,key,event='input'){const el=$(id);if(el)el.addEventListener(event,()=>{state[key]=el.value;if(id==='wzEtype'||id==='wzEtarget')questions();else if(id==='wzEsearch')updateEmoteOptions();else render()})}
function wire(){for(const [id,key,event] of [['wzChannel','channel','change'],['wzGreeting','greeting'],['wzGwait','gwait'],['wzSeqwait','seqwait'],['wzEtype','etype','change'],['wzEsearch','esearch'],['wzEcmd','ecmd','change'],['wzEtarget','etarget','change'],['wzEfixed','efixed'],['wzEtext','etext'],['wzEwait','ewait']])bind(id,key,event);
 $('wzMotion')?.addEventListener('change',e=>{state.emotiononly=e.target.checked;render()});
 Q.querySelectorAll('[data-msg]').forEach(el=>el.addEventListener('input',()=>{state.messages[Number(el.dataset.msg)]=el.value;render()}));
 Q.querySelectorAll('[data-remove]').forEach(el=>el.addEventListener('click',()=>{state.messages.splice(Number(el.dataset.remove),1);questions()}));
 $('wzAddMessage')?.addEventListener('click',()=>{state.messages.push('');questions();Q.querySelector('[data-msg="'+(state.messages.length-1)+'"]')?.focus()});
 $('wzGoCraft')?.addEventListener('click',()=>show('craft'));
}
function build(){const errors=[],lines=[];const appendWait=(cmd,w)=>w?`${cmd} <wait.${w}>`:cmd;
 if(state.type==='greeting'){const text=oneLine(state.greeting),w=waitValue(state.gwait);if(!text)errors.push('あいさつを入力してね');if(w===null)errors.push('待機時間は1〜60の整数か空欄にしてね');if(text)lines.push(appendWait(`/${state.channel} ${text}`,w||''));}
 if(state.type==='chatseq'){const w=waitValue(state.seqwait);if(w===null)errors.push('待機時間は1〜60の整数か空欄にしてね');const messages=state.messages.map(oneLine).filter(Boolean);if(!messages.length)errors.push('セリフを1つ以上入力してね');messages.forEach((msg,i)=>lines.push(appendWait(`/${state.channel} ${msg}`,i<messages.length-1?(w||''):'')));}
 if(state.type==='emote'){
 const w=waitValue(state.ewait);if(w===null)errors.push('待機時間は1〜60の整数か空欄にしてね');
 if(state.etype!=='text'){
 const chosen=available.find(e=>e.command===state.ecmd);if(!chosen)errors.push('エモート動作を選んでね');else {let cmd=chosen.command;if(state.emotiononly&&chosen.motion)cmd+=' motion';lines.push(appendWait(cmd,w||''));if(state.emotiononly&&!chosen.motion)errors.push('このエモートには motion を付けられない可能性があるよ');}
 }
 if(state.etype!=='action'){
 const txt=oneLine(state.etext);if(!txt)errors.push('エモート文章を入力してね');let to='';if(state.etarget==='target')to='<t>';if(state.etarget==='fixed')to=oneLine(state.efixed);if(state.etarget==='fixed'&&!to)errors.push('相手の名前を入力してね');
 // /em displays character name followed by the authored text; natural join requires Japanese particles.
 const particle=to?`は${to}に`:'は';const tail=txt?`${particle}${txt}`:'';if(tail)lines.push(appendWait('/em '+tail,state.etype==='text'?(w||''):''));
 }
 }
 if(lines.length>15)errors.push('15行を超えているよ　セリフを減らしてね');
 if(lines.some(x=>x.length>180))errors.push('長い行があります　ゲーム内の文字数制限に注意してね');
 return {lines,errors};}
let output='';function render(){const {lines,errors}=build();output=errors.length?'':lines.join('\n');$('wzOutput').textContent=lines.length?lines.join('\n'):'質問に答えるとここにマクロが表示されるよ';$('wzCount').textContent=`${lines.length} / 15行`;$('wzWarning').innerHTML=errors.length?`<span class="wz-error">${errors.map(escape).join('<br>')}</span>`:'できあがったらコピーしてFF14内へ貼り付けてね';for(const id of ['wzCopy','wzImport','wzPreview'])$(id).disabled=!output;}
function transfer(go){if(!output)return;const source=$('source');source.value=output;source.dispatchEvent(new Event('input',{bubbles:true}));if(go==='preview')show('preview');else show('import');}
document.querySelectorAll('[data-wz-type]').forEach(b=>b.addEventListener('click',()=>selectType(b.dataset.wzType)));
$('wzCopy').onclick=()=>{if(output)copy(output)};$('wzImport').onclick=()=>transfer('import');$('wzPreview').onclick=()=>transfer('preview');
selectType('greeting');
})();
