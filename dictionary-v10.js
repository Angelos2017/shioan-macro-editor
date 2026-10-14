(()=>{'use strict';
const $=id=>document.getElementById(id);
const items=Array.isArray(window.SHIOAN_COMMANDS)?window.SHIOAN_COMMANDS:[];
const placeholderItems=Array.isArray(window.SHIOAN_PLACEHOLDERS)?window.SHIOAN_PLACEHOLDERS:[];
const issues='https://github.com/Angelos2017/shioan-macro-editor/issues/new';
let offset=0,chunk=48,filtered=[];
// Japanese task-oriented keywords for frequently requested commands.
const searchHints={
'/targetenemy':'近い敵 一番近い敵 敵を選ぶ',
'/targetpc':'近い人 近いプレイヤー 近いPC',
'/targetnpc':'近いNPC 近いキャラクター オブジェクト',
'/battletarget':'自分を攻撃 近い敵 ヘイト 敵視',
'/nexttarget':'次の敵 右へ 切り替え',
'/previoustarget':'前の敵 左へ 切り替え',
'/focustarget':'フォーカス 注目',
'/macroicon':'マクロ アイコン マクロアイコン',
'/action':'技 魔法 スキル 攻撃 回復 アクション',
'/readycheck':'準備確認 レディチェック',
'/countdown':'カウントダウン 戦闘開始'
};
const categories=[...new Set(items.map(x=>x.category))].sort((a,b)=>a.localeCompare(b,'ja'));
for(const cat of categories){const option=document.createElement('option');option.value=cat;option.textContent=cat;$('cmdCategory').append(option)}
function elm(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function sanitized(input){const text=input.value.trim().replace(/[\r\n]+/g,' ');if(!/^\/[a-z][a-z0-9]*(?:\s.*)?$/i.test(text)){alert('「/コマンド名」の形式で入力してね');return null}return text}
function appendImport(cmd){const prev=lines();if(prev.length>=15&&!confirm('15行を超えるけれど追加する？ FF14ではマクロを分けてね'))return;
 const current=$('source').value.trimEnd();setSource(current?current+'\n'+cmd:cmd);$('source').dispatchEvent(new Event('input',{bubbles:true}));}
function reportText(item,cmd){return `【しお✦あん コマンド確認】\n日本語の説明：${item.name}\nコマンド：${cmd}\n分類：${item.category}\n困ったこと・修正案：\n使用パッチ：`}
function makeCard(item){const card=elm('article',undefined,'emote-card');const title=elm('h3',item.name);const label=elm('span',item.category,'pill');card.append(title,label);
const syntax=elm('p',`構文：${item.syntax}`,'muted');card.append(syntax);
if(item.description){const d=document.createElement('details');const summary=elm('summary','詳しい説明・サブコマンド');const p=elm('p',item.description,'detail-text');d.append(summary,p);card.append(d)}
const alias=elm('p',item.aliases.length?'別名：'+item.aliases.join('、'):'別名なし','muted emote-note');card.append(alias);
const status=elm('p',`使用頻度：${item.frequency||'未評価'} ／ ゲーム内：${item.verification||'未検証'}${item.duplicate?' ／ 同名定義あり':''}`,'muted emote-note');card.append(status);
const input=document.createElement('input');input.value=item.command;input.spellcheck=false;input.setAttribute('aria-label',item.name+'のコマンド（引数を編集できます）');
const wrapper=elm('div',undefined,'emote-command');wrapper.append(input);card.append(wrapper);
if(item.params&&item.params!=='不要／要確認'){card.append(elm('p','必要な指定：'+item.params,'muted emote-note'))}
const buttonRow=elm('div',undefined,'row');
const append=elm('button','取り込みに追加','small');append.type='button';append.onclick=()=>{const cmd=sanitized(input);if(cmd)appendImport(cmd)};
const builder=elm('button','かんたん作成で使う','small secondary');builder.type='button';builder.onclick=()=>{const cmd=sanitized(input);if(cmd&&window.shioanChooseCommand)window.shioanChooseCommand(cmd)};
const cp=elm('button','コマンドをコピー','small secondary');cp.type='button';cp.onclick=async()=>{const cmd=sanitized(input);if(cmd&&await copy(cmd))cp.textContent='✓ コピー済み'};
const report=elm('button','報告文をコピー','small secondary');report.type='button';report.onclick=async()=>{const cmd=sanitized(input);if(cmd)await copy(reportText(item,cmd))};buttonRow.append(append,builder,cp,report);card.append(buttonRow);
const link=elm('a','GitHubで報告 ↗','muted');link.href=issues+'?'+new URLSearchParams({title:'コマンド確認：'+item.command,body:reportText(item,item.command)});link.rel='noopener noreferrer';link.target='_blank';card.append(link);return card;}
function render(){const q=$('cmdSearch').value.trim().toLowerCase(),cat=$('cmdCategory').value,view=$('cmdView').value;
filtered=items.filter(x=>(!cat||x.category===cat)&&(view==='all'||view==='reviewed'&&x.recommendation==='おすすめ')&&[x.name,x.command,x.aliases.join(' '),x.syntax,x.description,searchHints[x.command]||''].join(' ').toLowerCase().includes(q));
$('cmdCounter').textContent=`${filtered.length}件 / 総合辞書${items.length}定義（基本コマンド${new Set(items.map(x=>x.command)).size}種類）`;
const area=$('cmdEntries');area.replaceChildren();for(const item of filtered.slice(0,offset+chunk))area.append(makeCard(item));$('cmdMore').classList.toggle('hidden',filtered.length<=offset+chunk);
if(!filtered.length){area.append(elm('p',view==='reviewed'?'おすすめの評価はまだありません。「すべて」に切り替えて探してね':'該当コマンドが見つからなかったよ','muted'))}}
for(const id of ['cmdSearch','cmdCategory','cmdView'])$(id).addEventListener(id==='cmdSearch'?'input':'change',()=>{offset=0;render()});$('cmdMore').onclick=()=>{offset+=chunk;render()};render();
let phShown=45;const phCat=[...new Set(placeholderItems.map(x=>x.category))];for(const cat of phCat){const o=document.createElement('option');o.value=cat;o.textContent=cat;$('phCategory').append(o)}
function selectedTarget(){let target=document.activeElement;if(!(target instanceof HTMLInputElement)&&!(target instanceof HTMLTextAreaElement))target=$('phScratch');if(!['source','makeCustom','makeText','phScratch'].includes(target.id))target=$('phScratch');return target}
let targetSaved=$('phScratch');for(const id of ['source','makeCustom','makeText','phScratch'])$(id)?.addEventListener('focus',e=>{targetSaved=e.target});
function insertToken(token){const target=targetSaved?.isConnected?targetSaved:$('phScratch');target.focus();const start=target.selectionStart??target.value.length,end=target.selectionEnd??target.value.length;target.setRangeText(token,start,end,'end');target.dispatchEvent(new Event('input',{bubbles:true}));}
function phRender(){const q=$('phSearch').value.trim().toLowerCase(),cat=$('phCategory').value;const found=placeholderItems.filter(x=>(!cat||x.category===cat)&&[x.token,x.aliases,x.description,x.example,x.note].join(' ').toLowerCase().includes(q));$('phCounter').textContent=`${found.length}項目表示 / ${placeholderItems.length}項目（範囲表記はグループ化）`;
const area=$('phEntries');area.replaceChildren();for(const p of found){const div=elm('article',undefined,'emote-card');div.append(elm('h3',p.token));div.append(elm('p',p.description));if(p.aliases)div.append(elm('p','別名：'+p.aliases,'muted'));if(p.note)div.append(elm('p',p.note,'muted'));const row=elm('div',undefined,'row');const b=elm('button','挿入','small');b.onclick=()=>{if(p.token.includes('～')||p.token.includes('秒数')){const value=prompt('使用する代名詞を入力してね（例：<2>、<se.1>、<wait.3>）',p.example.match(/<[^>]+>/)?.[0]||'');if(value&&!/[\r\n]/.test(value))insertToken(value.trim())}else insertToken(p.token)};const c=elm('button','コピー','small secondary');c.onclick=()=>copy(p.token);row.append(b,c);div.append(row);area.append(div)}
if(!found.length)area.append(elm('p','一致する代名詞はありません','muted'))}
$('phSearch').addEventListener('input',phRender);$('phCategory').addEventListener('change',phRender);phRender();
})();
