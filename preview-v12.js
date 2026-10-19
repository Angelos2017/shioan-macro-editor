(()=>{'use strict';
const $=id=>document.getElementById(id);
const input=$('source'), sample=$('previewStatus'), stage=$('previewStage'), checks=$('previewChecks');
const pretty=t=>Number(t.toFixed(2)).toString();
let timeline=[],issues=[],total=0,elapsed=0,running=false,frame=0,stamp=0,index=0;
const known=new Set();
const updateKnown=()=>{if(Array.isArray(window.SHIOAN_COMMANDS))for(const o of window.SHIOAN_COMMANDS){if(o.command)known.add(String(o.command).toLowerCase());for(const x of o.aliases||[])if(x)known.add(String(x).toLowerCase())}if(Array.isArray(window.SHIOAN_EMOTES))for(const o of window.SHIOAN_EMOTES){for(const k of ['command','textCommand','macro','slashCommand']){let v=o[k];if(typeof v==='string'&&v.startsWith('/'))known.add(v.split(/\s/)[0].toLowerCase())}}};
const chatCommands=new Set(['/s','/say','/p','/party','/sh','/shout','/y','/yell','/echo','/e','/fc','/freecompany','/a','/alliance','/l1','/l2','/l3','/l4','/l5','/l6','/l7','/l8','/cwls1','/cwls2','/cwls3','/cwls4','/cwls5','/cwls6','/cwls7','/cwls8']);
const addIssue=(line,level,msg)=>issues.push({line,level,msg});
function analyze(){updateKnown();timeline=[];issues=[];total=0;let time=0;
 const raw=input.value.replace(/\r\n?/g,'\n').split('\n');const active=raw.filter(l=>l.trim());
 if(active.length>15)addIssue(0,'error',`空行を除いて${active.length}行です。FF14のマクロは15行以内にしてください`);
 if(raw.length>15&&active.length<=15)addIssue(0,'warn',`改行を含むと${raw.length}行です。ゲーム内では空行も行数に含まれるため確認してください`);
 raw.forEach((line,i)=>{let n=i+1,s=line.trim();if(!s)return;
  if(!s.startsWith('/')){addIssue(n,'warn','行頭に / がありません。ゲーム内ではチャット入力として扱われる場合があります');timeline.push({line:n,text:s,kind:'other',at:time});return}
  const match=s.match(/^(\/[^\s<>]+)(?:\s+([\s\S]*))?$/);if(!match){addIssue(n,'error','コマンドの先頭を読み取れません');timeline.push({line:n,text:s,kind:'other',at:time});return}
  const cmd=match[1].toLowerCase(),args=(match[2]||'').trim();const inline=[...s.matchAll(/<wait(?:\.|\s+)([^>]+)>/gi)];
  const malformed=s.match(/<wait(?:\.|\s+)[^>]*$/i);if(malformed)addIssue(n,'error','<wait.N> の閉じ括弧がありません');
  const quotes=(s.match(/"/g)||[]).length;if(quotes%2)addIssue(n,'error','ダブルクォーテーションが閉じていません');
  const unknownTags=[...s.matchAll(/<([^<>]*)>/g)].map(m=>m[1]).filter(t=>!/^wait(?:\.|\s+)\d+$/i.test(t));
  for(const tag of unknownTags){if(/^wait/i.test(tag))addIssue(n,'error',`待機指定 <${tag}> の形式を確認してください`);else if(!/^(?:t|tt|me|mo|f|lt|ht|attack\d?|bind\d?|stop\d?|circle|cross|square|triangle|focus|se(?:\.\d+)?|\d+|pet|pos|flag|item|job|class)$/i.test(tag))addIssue(n,'info',`<${tag}> は自動判定できません。ゲーム内で確認してください`)}
  if(known.size&&!known.has(cmd)&&!chatCommands.has(cmd)&&!new Set(['/wait','/w','/ac','/action','/micon','/macroicon','/target','/targetenemy','/battletarget','/bow','/em','/emote']).has(cmd))addIssue(n,'info',`${cmd} は辞書との照合ができませんでした。スペルや最新仕様を確認してください`);
  let delay=0,kind='other',detail='コマンドの実行を試みる（実際の成功は未判定）';
  if(cmd==='/wait'||cmd==='/w'){
    kind='wait';detail='待機';if(!/^\d+(?:\.\d+)?$/.test(args)){addIssue(n,'error','/wait は秒数を数字で指定してください（例：/wait 2）')}else {delay=Number(args);if(delay<1||delay>60)addIssue(n,'warn','/wait は通常1〜60秒の範囲で指定します');if(!Number.isInteger(delay))addIssue(n,'info','小数秒はゲーム内で丸められる可能性があります。整数秒をおすすめします')}
    if(inline.length)addIssue(n,'warn','/wait と <wait.N> の併用は避けてください');
    const prev=timeline[timeline.length-1];
    if(prev&&prev.kind==='chat'&&delay>0&&delay<=2){const msg=prev.text.replace(/^\/\S+\s*/, '').length;addIssue(n,'info',msg>=30?'直前のチャットは長めの文章です。2秒と3秒を等速再生で比べてみてね（参考）':'チャットの間隔は2秒と3秒を等速再生で比べてみてね（参考）')}
  }else{
    if(chatCommands.has(cmd)){kind='chat';detail=`チャット出力を想定：${args||'（本文なし）'}`;if(!args)addIssue(n,'warn','チャットの本文がありません')}
    else if(cmd==='/ac'||cmd==='/action'){kind='action';detail=`アクションを試みる：${args.replace(/<wait(?:\.|\s+)[^>]*>/ig,'').trim()||'（名前未指定）'}`;if(!args.replace(/<wait(?:\.|\s+)[^>]*>/ig,'').trim())addIssue(n,'warn','アクション名が指定されていません')}
    else if(cmd==='/em'||cmd==='/emote'){kind='emote';detail=`エモート表現：${args||s}`}
    else if(cmd==='/micon'||cmd==='/macroicon'){kind='config';detail='マクロのアイコン指定（画面上の表示のみ）'}
    else if(cmd.startsWith('/')){kind='other';detail='コマンド実行を試みる（結果は未判定）'}
    if(inline.length>1)addIssue(n,'warn','待機指定が複数あります。意図した間隔か確認してください');
    for(const tag of inline){const v=tag[1];if(!/^\d+$/.test(v)){addIssue(n,'error',`待機時間「${v}」は整数秒で指定してください`);continue}delay+=Number(v);if(Number(v)<1||Number(v)>60)addIssue(n,'warn','<wait.N> は通常1〜60秒の範囲で指定します')}
  }
  const item={line:n,text:s,kind,detail,at:time,wait:delay};timeline.push(item);
  if(kind==='chat'&&delay>0&&delay<3)addIssue(n,'info','チャットの間隔は文章の長さに応じて2秒と3秒を比較してみてね（参考）');
  if(kind==='action'&&delay===0)addIssue(n,'info','アクション後の待機指定がありません。連続実行の際はゲーム内で間隔を確認してください');
  if(kind==='action'&&delay>0&&delay<3)addIssue(n,'info','アクション後の待機が短い場合があります。適切な秒数はゲーム内で確認してください');
  time+=Math.max(0,Math.min(delay,3600));
 });total=time;
 if(!timeline.length)addIssue(0,'info','マクロを入力すると、動作順序と待機時間を確認できます');
 const errors=issues.filter(x=>x.level==='error').length,warns=issues.filter(x=>x.level==='warn').length;
 $('previewSummary').textContent=`${timeline.length} 行の処理予定 ・ 待機合計 ${pretty(total)} 秒 ・ エラー ${errors}件 ・ 注意 ${warns}件`;
 checks.replaceChildren();if(!issues.length){const ok=document.createElement('p');ok.className='pv-good';ok.textContent='✓ 基本的な書式に問題は見つかりませんでした（ゲーム内での動作保証ではありません）';checks.append(ok)}
 for(const issue of issues){const e=document.createElement('div');e.className=`pv-issue pv-${issue.level}`;e.textContent=`${issue.level==='error'?'✕ エラー':issue.level==='warn'?'⚠ 注意':'ℹ 参考'}${issue.line?` · ${issue.line}行目`:''}：${issue.msg}`;checks.append(e)}
 elapsed=0;index=0;render(0)
}
function render(now){const speed=Number($('previewSpeed').value);const done=timeline.filter(it=>it.at<=now+0.001);$('previewClock').textContent=`${pretty(now)} / ${pretty(total)} 秒（ゲーム内想定）`;
 stage.replaceChildren();if(!timeline.length){stage.textContent='マクロの内容を読み取ると、ここに実行順序が表示されます';return}
 for(const item of timeline){const d=document.createElement('div');const active=done.includes(item);d.className=`pv-step ${active?'pv-seen':''}`;const at=document.createElement('span');at.className='pv-time';at.textContent=`${pretty(item.at)}秒`;const main=document.createElement('div');main.className='pv-content';const code=document.createElement('code');code.textContent=`${item.line}行目　${item.text}`;main.append(code);if(active){const extra=document.createElement('small');extra.textContent=(item.kind==='wait'?`ここから${pretty(item.wait)}秒待機`:item.detail)+(item.kind!=='wait'&&item.wait?` ・ 続いて ${pretty(item.wait)} 秒待機`:'');main.append(extra)}d.append(at,main);stage.append(d)}
 const next=timeline.find(it=>it.at>now+0.001);sample.textContent=running?`再生中 ×${speed}`:now>=total&&timeline.length?'確認位置：最後まで':'停止中';
 $('previewPlay').textContent=running?'⏸ 一時停止':elapsed>0?'▶ 続きから':'▶ 再生';
}
function stop(){running=false;cancelAnimationFrame(frame);render(elapsed)}
function tick(ts){if(!running)return;const dt=Math.min(0.25,(ts-stamp)/1000);stamp=ts;elapsed=Math.min(total,elapsed+Math.max(0,dt)*Number($('previewSpeed').value));render(elapsed);if(elapsed>=total){stop();return}frame=requestAnimationFrame(tick)}
$('previewPlay').addEventListener('click',()=>{if(running){stop();return}if(!timeline.length){analyze();return}if(elapsed>=total)elapsed=0;running=true;stamp=performance.now();render(elapsed);frame=requestAnimationFrame(tick)});
$('previewReset').addEventListener('click',()=>{stop();elapsed=0;render(0)});
$('previewSpeed').addEventListener('change',()=>render(elapsed));
$('previewAnalyze').addEventListener('click',()=>{stop();analyze();showToast('簡易チェックを更新しました')});
input.addEventListener('input',()=>{stop();analyze()});
// Arrivals from the builder/craft also dispatch input events; analyze current content on opening.
document.querySelector('[data-tab="preview"]').addEventListener('click',()=>{stop();analyze()});
analyze();
})();
