const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{overflow-x:hidden;background:#070a1f}
body{--bg1:#0a0e2c;--bg2:#05071a;--panel:rgba(16,22,62,.78);--panel2:rgba(10,14,44,.9);--line:#3b4bb0;--line2:#6d7df0;--acc:#8b7cf6;--acc2:#6ea8ff;--txt:#e8ebff;--mut:#8f9ad8;--L:#f4c24e;--E:#a56bff;--R:#4aa3ff;--C:#8a94b8;--tab:#5a4de0;--glow:rgba(110,125,255,.35);--tit1:#cfc6ff;--tit2:#8b7cf6;
background:radial-gradient(120% 60% at 50% 0,#17205a 0,transparent 60%),linear-gradient(180deg,var(--bg1),var(--bg2));color:var(--txt);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;padding:12px 12px 18px;overflow-x:hidden;overscroll-behavior:none;min-height:100vh}
body.h{--bg1:#16051f;--bg2:#070209;--panel:rgba(34,11,44,.82);--panel2:rgba(22,6,30,.92);--line:#ff7a1a;--line2:#ffa24d;--acc:#ff7a1a;--acc2:#8dff3f;--txt:#ffeedd;--mut:#cba0dd;--L:#ffb020;--E:#b45cff;--R:#35e0a1;--C:#9a8aa8;--tab:#ff7a1a;--glow:rgba(255,122,26,.4);--tit1:#ffd9a8;--tit2:#ff7a1a;
background:radial-gradient(120% 60% at 50% 0,#4a1250 0,transparent 62%),linear-gradient(180deg,var(--bg1),var(--bg2))}
button{font:inherit;cursor:pointer;border:0;color:inherit;background:none}
.wrap{max-width:520px;margin:0 auto;position:relative}
.ban{position:relative;height:158px;border-radius:20px;overflow:hidden;border:1.5px solid var(--line2);box-shadow:0 0 22px var(--glow);margin-bottom:12px}
.ban svg.sc{position:absolute;inset:0;width:100%;height:100%}
.bt{position:absolute;left:0;right:0;bottom:22px;text-align:center;padding:0 16px}
.bt h1{font-family:Georgia,"Times New Roman",serif;font-size:27px;font-weight:700;line-height:1.1;background:linear-gradient(180deg,var(--tit1),var(--tit2));-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 8px var(--glow));overflow-wrap:anywhere}
.bt p{font-family:Georgia,serif;font-size:14px;color:var(--tit1);margin-top:4px;letter-spacing:.5px}
.bt p:before,.bt p:after{content:"✦";color:var(--acc);margin:0 8px;font-size:10px}
.bat{position:absolute;font-size:17px;left:-30px;animation:vuela 8s linear infinite;filter:drop-shadow(0 0 4px rgba(0,0,0,.6))}
@keyframes vuela{0%{transform:translate(0,0) scale(.8)}50%{transform:translate(52vw,-6px) scale(1.15)}100%{transform:translate(112vw,12px) scale(.8)}}
.ara{position:absolute;top:0;left:34px;transform-origin:top center;animation:cuelga 3.2s ease-in-out infinite;z-index:2}
@keyframes cuelga{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
.stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:9px;border-radius:18px;background:var(--panel);border:1.5px solid var(--line);margin-bottom:12px}
.st{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 2px 7px;border-radius:13px;border:1.5px solid rgba(255,255,255,.1);background:var(--panel2);text-align:center;min-width:0}
.st.L{border-color:var(--L);box-shadow:inset 0 0 12px rgba(244,194,78,.15)}
.st.E{border-color:var(--E)}
.st.R{border-color:var(--R)}
.st i{font-style:normal;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:1.5px solid var(--line2);background:rgba(255,255,255,.05)}
.st span{font-size:10px;color:var(--tit1);line-height:1.15;font-family:Georgia,serif;min-height:23px;display:flex;align-items:center}
.st b{font-family:Georgia,serif;font-size:21px;line-height:1;color:var(--txt)}
.st.L b{color:var(--L)}.st.E b{color:var(--E)}.st.R b{color:var(--R)}
.tabs{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding:2px 1px 10px}
.tabs::-webkit-scrollbar{display:none}
.tb{flex:none;display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:15px;border:1.5px solid var(--line);background:var(--panel);font-family:Georgia,serif;font-size:13px;color:var(--tit1);white-space:nowrap}
.tb em{font-style:normal;font-size:11px;opacity:.7}
.tb.on{background:linear-gradient(180deg,var(--tab),var(--acc));border-color:var(--line2);color:#fff;box-shadow:0 0 14px var(--glow)}
body.h .tb.on{color:#1a0826}
.panel{position:relative;padding:12px 10px;border-radius:20px;background:var(--panel);border:1.5px solid var(--line);overflow:hidden}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.cd{position:relative;min-width:0;border-radius:13px;border:2px solid var(--rc);background:#0b0e26;overflow:hidden;box-shadow:0 0 12px var(--rg);cursor:pointer}
body.h .cd{background:#12061a}
.cd.sel{outline:2px solid #fff;outline-offset:1px}
.cd.e{visibility:hidden}
.ar{position:relative;aspect-ratio:3/4;background:linear-gradient(160deg,#242b66,#0d1132)}
body.h .ar{background:linear-gradient(160deg,#4b1656,#150620)}
.ar img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ar .sin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px;color:rgba(255,255,255,.4)}
.ar:after{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(0deg,rgba(6,8,26,.95),transparent)}
body.h .ar:after{background:linear-gradient(0deg,rgba(14,3,20,.95),transparent)}
.or{position:absolute;top:3px;left:4px;font-size:12px;color:var(--rc);z-index:2;text-shadow:0 0 6px var(--rc)}
.or.d{left:auto;right:4px}
.rb{position:absolute;left:50%;bottom:4px;transform:translateX(-50%);z-index:2;display:flex;align-items:center;gap:4px;padding:2px 9px 2px 6px;border-radius:12px;border:1.5px solid var(--rc);background:rgba(8,10,34,.92);color:var(--rc);font-family:Georgia,serif;font-size:10px;font-weight:700;white-space:nowrap}
body.h .rb{background:rgba(18,4,26,.94)}
.nm{padding:6px 3px 2px;text-align:center;font-family:Georgia,serif;font-size:13.5px;font-weight:700;line-height:1.15;min-height:2.4em;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
.es{text-align:center;padding:0 0 6px;font-size:11px;letter-spacing:3px;color:var(--rc)}
.es s{text-decoration:none;opacity:.28}
.inf{margin-top:11px;padding:9px 11px;border-radius:12px;background:var(--panel2);border:1px dashed var(--line);font-size:12px;line-height:1.5;color:var(--mut);min-height:40px}
.inf b{color:var(--txt)}
.pag{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:12px}
.pg1{width:44px;height:30px;border-radius:11px;border:1.5px solid var(--line);background:var(--panel2);color:var(--tit1);font-size:16px}
.pg1:disabled{opacity:.25}
.pg2{min-width:128px;height:30px;border-radius:15px;border:1.5px solid var(--line);background:var(--panel2);font-family:Georgia,serif;font-size:13px;color:var(--tit1);display:flex;align-items:center;justify-content:center}
.ms{padding:9px 10px;border-radius:14px;border:1.5px solid var(--line);background:var(--panel2);margin-bottom:8px}.ms.ok{border-color:#8dff3f}.mt{font-weight:800;font-size:13px}.md{font-size:11.5px;opacity:.8;margin:2px 0 6px}.mb{height:7px;border-radius:5px;background:rgba(255,255,255,.12);overflow:hidden}.mb i{display:block;height:100%;background:var(--tit1)}.mr{font-size:11px;margin-top:5px;opacity:.9}
.sec{font-family:Georgia,serif;font-size:14px;color:var(--tit1);margin:2px 0 9px;display:flex;align-items:center;gap:8px}
.sec:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.sec small{font-size:11px;color:var(--mut)}
.bgs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:14px}
.bg{position:relative;text-align:center;padding:9px 4px 8px;border-radius:14px;border:1.5px solid var(--line);background:var(--panel2);cursor:pointer;min-width:0}
.bg.sel{outline:2px solid #fff;outline-offset:1px}
.bg .em{width:68px;height:68px;margin:0 auto 5px;position:relative;filter:drop-shadow(0 0 7px var(--glow))}
.bg .em svg{width:100%;height:100%;display:block}
.bg .bn{font-family:Georgia,serif;font-size:11.5px;font-weight:700;line-height:1.15;min-height:2.3em;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
.bg .bd{font-size:10px;color:var(--mut);margin-top:2px}
.bg.lk .em{filter:grayscale(1) brightness(.42)}
.bg.lk .em:after{content:"🔒";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;filter:none}
.bg.lk{opacity:.85}
.bg.ok{border-color:var(--L);box-shadow:0 0 14px rgba(244,194,78,.28)}
body.h .bg.ok{box-shadow:0 0 16px rgba(255,122,26,.45)}
.ch{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.cp{padding:5px 10px;border-radius:12px;border:1.5px solid var(--line);background:var(--panel2);font-size:11.5px;cursor:pointer}
.cp.lk{opacity:.4}
.cp.ok{border-color:var(--L)}
.cp.sel{outline:2px solid #fff}
.pie{margin-top:14px;text-align:center;font-family:Georgia,serif;font-size:12px;color:var(--mut);display:flex;align-items:center;justify-content:center;gap:10px}
.pie:before,.pie:after{content:"";width:60px;height:1px;background:linear-gradient(90deg,transparent,var(--line))}
.pie:after{transform:scaleX(-1)}
.wb{position:absolute;width:92px;height:92px;pointer-events:none;opacity:.5}
.wb.a{top:0;left:0}.wb.b{top:0;right:0;transform:scaleX(-1)}
.wb svg{width:100%;height:100%}
</style></head><body class="__TEMA__">
<svg width="0" height="0" style="position:absolute" id="defs"></svg>
<div class="wrap">
<div class="ban" id="ban"></div>
<div class="stats" id="stats"></div>
<div class="tabs" id="tabs"></div>
<div class="panel" id="panel"><div id="cuerpo"></div></div>
<div class="pie">__FIRMA__</div>
</div>
<script>
(function(){
var D=__DATA__;
var H=!!D.halloween;
var TIER={L:'Legendario',E:'Épico',R:'Raro',C:'Común'};
var ICO=H?{L:'🎃',E:'🦇',R:'🕷️',C:'🕸️'}:{L:'♛',E:'✦',R:'◆',C:'●'};
var RG={L:'rgba(244,194,78,.32)',E:'rgba(165,107,255,.3)',R:'rgba(74,163,255,.28)',C:'rgba(138,148,184,.15)'};
if(H)RG={L:'rgba(255,176,32,.4)',E:'rgba(180,92,255,.36)',R:'rgba(53,224,161,.3)',C:'rgba(154,138,168,.15)'};
var RANK={L:4,E:3,R:2,C:1};
var tab=D.tabInicial||'todos',pag=0,PER=6,sel=null;
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function P(cx,cy,r,deg){var t=deg*Math.PI/180;return (cx+r*Math.cos(t)).toFixed(1)+' '+(cy+r*Math.sin(t)).toFixed(1)}
function web(cx,cy,R,n,anillos,sw){
var s='',i,j,k,q,m;
for(i=0;i<n;i++)s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+P(cx,cy,R,i*360/n).split(' ')[0]+'" y2="'+P(cx,cy,R,i*360/n).split(' ')[1]+'"/>';
for(j=1;j<=anillos;j++){k=R*j/anillos;s+='<path fill="none" d="M'+P(cx,cy,k,0);
for(i=1;i<=n;i++){q=P(cx,cy,k,i*360/n);m=P(cx,cy,k*.82,(i-.5)*360/n);s+=' Q'+m+' '+q}
s+='"/>'}
return '<g stroke-width="'+(sw||1)+'" stroke-linecap="round">'+s+'</g>'}
function cuarto(){
var a=[0,22.5,45,67.5,90],R=[26,50,76,100],s='',i,j,p,q,m,r;
function pt(g,r){var t=g*Math.PI/180;return [(r*Math.cos(t)).toFixed(1),(r*Math.sin(t)).toFixed(1)]}
for(i=0;i<a.length;i++){p=pt(a[i],100);s+='<line x1="0" y1="0" x2="'+p[0]+'" y2="'+p[1]+'"/>'}
for(j=0;j<R.length;j++){r=R[j];p=pt(a[0],r);s+='<path d="M'+p[0]+' '+p[1];
for(i=1;i<a.length;i++){q=pt(a[i],r);m=pt((a[i]+a[i-1])/2,r*.8);s+=' Q'+m[0]+' '+m[1]+' '+q[0]+' '+q[1]}
s+='" fill="none"/>'}
return '<svg viewBox="0 0 100 100" stroke="#efe8fb" stroke-width="1.1" stroke-linecap="round">'+s+'</svg>'}
function estrella(x,y,r,f){return '<path d="M'+x+' '+(y-r)+' Q'+x+' '+y+' '+(x+r)+' '+y+' Q'+x+' '+y+' '+x+' '+(y+r)+' Q'+x+' '+y+' '+(x-r)+' '+y+' Q'+x+' '+y+' '+x+' '+(y-r)+'Z" fill="'+f+'"/>'}
function escena(){
var s,i,d;
if(H){
s='<defs><linearGradient id="cie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0526"/><stop offset=".6" stop-color="#4d1140"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient><radialGradient id="lun" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fff0b8"/><stop offset=".6" stop-color="#ffb020"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient><radialGradient id="hal" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(255,150,40,.55)"/><stop offset="1" stop-color="rgba(255,150,40,0)"/></radialGradient></defs>'+
'<rect width="400" height="158" fill="url(#cie)"/><circle cx="318" cy="52" r="70" fill="url(#hal)"/><circle cx="318" cy="52" r="34" fill="url(#lun)"/>'+
'<g fill="#3a0f3a" opacity=".55"><circle cx="308" cy="44" r="6"/><circle cx="326" cy="62" r="4.5"/><circle cx="322" cy="38" r="3"/></g>';
for(i=0;i<16;i++)s+=estrella(12+((i*53)%380),8+((i*37)%70),1.6+(i%3)*.6,'rgba(255,230,190,.8)');
s+='<path d="M0 158 L0 128 Q40 118 80 126 T170 124 T260 128 T340 122 T400 126 L400 158Z" fill="#12041a"/>';
s+='<g fill="#0a0210"><path d="M30 158 L30 134 Q30 124 40 124 Q50 124 50 134 L50 158Z"/><path d="M360 158 L360 138 Q360 130 368 130 Q376 130 376 138 L376 158Z"/><path d="M290 158 L290 142 L296 138 L302 142 L302 158Z"/></g>';
s+='<path transform="translate(215 0)" d="M120 158 L122 120 L116 106 M122 120 L132 108 M122 126 L112 116" stroke="#0a0210" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
s+='<g stroke="#e9e1f7" fill="none">'+web(0,0,90,7,4,1)+'</g><g transform="translate(400 0) scale(-1 1)" stroke="#e9e1f7" fill="none">'+web(0,0,90,7,4,1)+'</g>';
s+='<g transform="translate(64 142)"><ellipse cx="0" cy="6" rx="10" ry="3" fill="rgba(255,150,40,.35)"/><path d="M0 -12 C-9 -12 -12 -5 -12 2 C-12 8 -6 11 0 11 C6 11 12 8 12 2 C12 -5 9 -12 0 -12Z" fill="#ff8a1f"/><path d="M-3 -12 Q0 -17 3 -12" stroke="#4a8a2a" stroke-width="2.4" fill="none"/><path d="M-6 -2 L-2 -2 L-4 3Z M2 -2 L6 -2 L4 3Z M-5 5 L-2 7 L0 5 L2 7 L5 5 L5 8 Q0 11 -5 8Z" fill="#2a0f00"/></g>';
return s}
s='<defs><linearGradient id="cie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1038"/><stop offset=".65" stop-color="#1a1f6b"/><stop offset="1" stop-color="#3a2d9a"/></linearGradient><radialGradient id="neb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="rgba(139,124,246,.5)"/><stop offset="1" stop-color="rgba(139,124,246,0)"/></radialGradient><radialGradient id="lun" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9b3ff"/></radialGradient><mask id="cre"><rect width="400" height="158" fill="#fff"/><circle cx="104" cy="58" r="44" fill="#000"/></mask></defs>'+
'<rect width="400" height="158" fill="url(#cie)"/><ellipse cx="80" cy="70" rx="150" ry="70" fill="url(#neb)"/><ellipse cx="330" cy="40" rx="110" ry="50" fill="url(#neb)"/>'+
'<circle cx="82" cy="62" r="44" fill="url(#lun)" mask="url(#cre)"/><circle cx="82" cy="62" r="52" fill="none" stroke="rgba(185,179,255,.25)" stroke-width="1" mask="url(#cre)"/>';
for(i=0;i<26;i++){d=1.4+(i%4)*.9;s+=estrella(8+((i*61)%392),6+((i*43)%110),d+1.6,'rgba(220,226,255,'+(0.5+(i%3)*.2)+')')}
s+='<g fill="none" stroke="rgba(150,165,255,.55)" stroke-width="1.2"><path d="M4 22 Q4 4 22 4"/><path d="M396 22 Q396 4 378 4"/><path d="M4 136 Q4 154 22 154"/><path d="M396 136 Q396 154 378 154"/></g>';
s+='<g fill="rgba(160,150,255,.35)"><path d="M0 158 Q60 128 130 144 T270 140 T400 146 L400 158Z"/></g>';
return s}
function araCol(){return '<svg width="30" height="78" viewBox="0 0 30 78"><line x1="15" y1="0" x2="15" y2="48" stroke="#efe8fb" stroke-width="1"/><g stroke="#120618" stroke-width="2" fill="none" stroke-linecap="round"><path d="M10 56 L2 50 L0 60"/><path d="M10 60 L1 64 L3 74"/><path d="M11 64 L6 70 L9 77"/><path d="M11 52 L5 44 L1 46"/><path d="M20 56 L28 50 L30 60"/><path d="M20 60 L29 64 L27 74"/><path d="M19 64 L24 70 L21 77"/><path d="M19 52 L25 44 L29 46"/></g><ellipse cx="15" cy="60" rx="7.5" ry="9" fill="#120618"/><circle cx="15" cy="51" r="5" fill="#120618"/><circle cx="13" cy="50" r="1.2" fill="#ff3b3b"/><circle cx="17" cy="50" r="1.2" fill="#ff3b3b"/><path d="M13 59 L15 63 L17 59Z" fill="#ff7a1a"/></svg>'}
function banner(){
var h='<svg class="sc" viewBox="0 0 400 158" preserveAspectRatio="xMidYMid slice">'+escena()+'</svg>';
if(H){h+='<span class="bat" style="top:14px;animation-delay:0s">🦇</span><span class="bat" style="top:34px;animation-delay:3s">🦇</span><span class="bat" style="top:8px;animation-delay:5.5s">🦇</span><div class="ara">'+araCol()+'</div>'}
h+='<div class="bt"><h1>'+esc(D.titulo)+'</h1><p>'+esc(D.subtitulo)+'</p></div>';
$('ban').innerHTML=h}
var SI=H?['🧟','🕸️','🎃','🔮','💀']:['👤','🎫','👑','✦','💎'];
function resumen(){
var s=D.stats,x=[['Personajes totales',s.total,''],['Gachas',s.gachas,''],['Legendarios',s.legendarios,'L'],['Épicos',s.epicos,'E'],['Raros',s.raros,'R']],h='',i;
for(i=0;i<5;i++)h+='<div class="st '+x[i][2]+'"><i>'+SI[i]+'</i><span>'+x[i][0]+'</span><b>'+x[i][1]+'</b></div>';
$('stats').innerHTML=h}
function pestanas(){
var h='<button class="tb'+(tab==='todos'?' on':'')+'" data-t="todos">'+(H?'🎃':'✦')+' Todos</button>',i,c;
for(i=0;i<D.cats.length;i++){c=D.cats[i];h+='<button class="tb'+(tab===c.k?' on':'')+'" data-t="'+c.k+'">'+c.emoji+' '+esc(c.nombre)+' <em>'+c.n+'</em></button>'}
h+='<button class="tb'+(tab==='ins'?' on':'')+'" data-t="ins">'+(H?'🕷️':'🏅')+' Insignias <em>'+D.ins.total+'</em></button>';
$('tabs').innerHTML=h}
function lista(){
var L=D.items.filter(function(it){return tab==='todos'||it.k===tab});
if(tab==='todos')L=L.slice().sort(function(a,b){return RANK[b.t]-RANK[a.t]||b.v-a.v});
return L}
function carta(it){
var s='',i,e=Math.min(5,it.es||0);
for(i=0;i<5;i++)s+=i<e?'★':'<s>★</s>';
return '<div class="cd'+(sel===it.id?' sel':'')+'" data-id="'+it.id+'" style="--rc:var(--'+it.t+');--rg:'+RG[it.t]+'"><div class="ar">'+(it.img?'<img src="'+it.img+'" alt="">':'<div class="sin">?</div>')+'<span class="or">'+(H?'🕸️':'✦')+'</span><span class="or d">'+(H?'':'✦')+'</span><div class="rb"><span>'+ICO[it.t]+'</span>'+TIER[it.t]+'</div></div><div class="nm">'+esc(it.nombre)+'</div><div class="es">'+s+'</div></div>'}
function vacia(){return '<div class="cd e"><div class="ar"></div><div class="nm"></div><div class="es">.</div></div>'}
function vistaCartas(){
var L=lista(),n=Math.max(1,Math.ceil(L.length/PER)),h='',vis,i,it,txt;
if(pag>=n)pag=n-1;
vis=L.slice(pag*PER,pag*PER+PER);
if(!L.length){$('cuerpo').innerHTML='<div class="inf">Todavía no tienes personajes aquí. Usa los comandos de gacha para conseguir algunos.</div>';return}
for(i=0;i<vis.length;i++)h+=carta(vis[i]);
for(;i<PER;i++)h+=vacia();
it=null;for(i=0;i<L.length;i++)if(L[i].id===sel)it=L[i];
txt=it?'<b>'+esc(it.nombre)+'</b> · '+esc(it.cat)+' · '+TIER[it.t]+' ('+esc(it.rareza)+')<br>Nivel '+it.nivel+'/'+it.max+' · ID #'+it.id:(H?'Toca una carta para ver su alma. 🕯️':'Toca una carta para ver sus datos.');
$('cuerpo').innerHTML='<div class="grid">'+h+'</div><div class="inf" id="inf">'+txt+'</div><div class="pag"><button class="pg1" id="ant"'+(pag<=0?' disabled':'')+'>‹</button><div class="pg2">'+(H?'🦇 ':'')+'Pág. '+(pag+1)+' / '+n+'</div><button class="pg1" id="sig"'+(pag>=n-1?' disabled':'')+'>›</button></div>'}
var BP={hw_telarana:['#5a4aa8','#120d2e','#cfc6ff'],hw_arana:['#9a46b8','#240a30','#ff4d6d'],hw_zombie:['#4a9a50','#0a1d0e','#8dff3f'],hw_frankenstein:['#34a09a','#07191c','#6ee7d0'],hw_bruja:['#8a46d8','#170626','#c58bff'],hw_hechizo:['#2070b0','#061426','#5ad1ff'],hw_calabaza:['#c45a0a','#2a0f00','#ffb020'],hw_fantasma:['#5472cc','#0c1230','#dcebff'],hw_supremo:['#b02020','#2a0404','#ffd34d']};
function defs(){
var h='',k,c;
for(k in BP){c=BP[k];h+='<radialGradient id="g_'+k+'" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="'+c[0]+'"/><stop offset="1" stop-color="'+c[1]+'"/></radialGradient>'}
$('defs').innerHTML='<defs>'+h+'</defs>'}
function glifo(id){
var s='',i,a;
if(id==='hw_telarana'){s='<g stroke="#e9e3ff" fill="none">'+web(32,32,23,8,3,1.1)+'</g><g fill="#0c0820"><circle cx="45" cy="22" r="3"/><circle cx="43" cy="20" r="1.6"/></g><path d="M44 24 L50 30 M42 25 L46 33 M46 22 L53 26" stroke="#0c0820" stroke-width="1" fill="none"/>'}
else if(id==='hw_arana'){s='<g stroke="#ff9db0" stroke-width=".8" fill="none" opacity=".7">'+web(32,32,26,8,3,.8)+'</g><g stroke="#0e0414" stroke-width="2.3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M27 33 L15 24 L10 32"/><path d="M26 37 L12 36 L8 46"/><path d="M27 41 L15 47 L14 56"/><path d="M29 44 L21 52 L22 58"/><path d="M37 33 L49 24 L54 32"/><path d="M38 37 L52 36 L56 46"/><path d="M37 41 L49 47 L50 56"/><path d="M35 44 L43 52 L42 58"/></g><ellipse cx="32" cy="40" rx="8.5" ry="11" fill="#0e0414"/><circle cx="32" cy="26" r="6" fill="#0e0414"/><circle cx="29.5" cy="24.5" r="1.7" fill="#ff3b5c"/><circle cx="34.5" cy="24.5" r="1.7" fill="#ff3b5c"/><path d="M29.5 36 L34.5 36 L32 40 L34.5 44 L29.5 44 L32 40Z" fill="#ff3b3b"/>'}
else if(id==='hw_zombie'){s='<path d="M14 58 Q14 46 32 46 Q50 46 50 58Z" fill="#3a2a4a"/><rect x="19" y="13" width="26" height="33" rx="10" fill="#a6d484"/><path d="M19 22 Q24 12 32 14 Q42 11 45 22 Q38 18 32 22 Q26 17 19 22Z" fill="#5f8f4a"/><path d="M36 14 L40 22" stroke="#3b1020" stroke-width="1.6"/><circle cx="26.5" cy="29" r="5.6" fill="#fff"/><circle cx="27.5" cy="30" r="2.2" fill="#111"/><circle cx="38" cy="28" r="3.6" fill="#fff"/><circle cx="38.4" cy="28.4" r="1.5" fill="#111"/><path d="M22 23 L30 25 M35 24 L42 22" stroke="#4a6b36" stroke-width="2" stroke-linecap="round"/><path d="M29 33 L27 38 L31 38Z" fill="#7da568"/><path d="M24 40 Q32 46 41 39" fill="#2a0a14" stroke="#2a0a14" stroke-width="1.5"/><path d="M27 41 L27 44 M31 42.4 L31 45 M35 42 L35 44.6" stroke="#e8e4c8" stroke-width="1.8"/><path d="M38 33 L45 40 M41 33 L44 37" stroke="#3b1020" stroke-width="1.2"/>'}
else if(id==='hw_frankenstein'){s='<path d="M32 4 L24 18 L31 17 L27 28 L39 14 L32 15Z" fill="#ffe14a" opacity=".9"/><path d="M12 58 Q12 47 32 47 Q52 47 52 58Z" fill="#26343a"/><rect x="19" y="15" width="26" height="31" rx="4" fill="#98c98e"/><path d="M19 15 L45 15 L45 24 L41 21 L37 25 L33 21 L28 25 L23 21 L19 24Z" fill="#121212"/><rect x="12" y="29" width="7" height="6" rx="1.5" fill="#b9c4cc"/><rect x="45" y="29" width="7" height="6" rx="1.5" fill="#b9c4cc"/><path d="M12 32 L8 32 M52 32 L56 32" stroke="#b9c4cc" stroke-width="2"/><path d="M22 28 L30 30 M42 28 L34 30" stroke="#1a2a1a" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="26.5" cy="33" rx="3.4" ry="2.2" fill="#e9f0c8"/><ellipse cx="37.5" cy="33" rx="3.4" ry="2.2" fill="#e9f0c8"/><circle cx="27" cy="33.4" r="1.2" fill="#111"/><circle cx="37" cy="33.4" r="1.2" fill="#111"/><path d="M31 33 L30 38 L34 38Z" fill="#78a870"/><path d="M25 41 L39 41" stroke="#222" stroke-width="2"/><path d="M27 39 L27 43 M30 39 L30 43 M33 39 L33 43 M36 39 L36 43" stroke="#222" stroke-width="1.1"/><path d="M33 17 L36 23 M31 19 L38 20" stroke="#4a6b44" stroke-width="1.3"/>'}
else if(id==='hw_bruja'){s='<circle cx="43" cy="21" r="10" fill="#ffe9a8"/><circle cx="46" cy="18" r="10" fill="#8a46d8" opacity="0"/><path d="M9 46 Q32 54 55 46 Q32 40 9 46Z" fill="#2c1050" stroke="#c58bff" stroke-width="1"/><path d="M19 44 Q27 36 31 8 Q35 26 45 44 Q32 49 19 44Z" fill="#4a1f86" stroke="#c58bff" stroke-width="1"/><path d="M21 40 Q32 45 44 40 L45 44.5 Q32 49.5 19.5 44.5Z" fill="#ff9a1f"/><rect x="29" y="40.5" width="6" height="5" rx="1" fill="none" stroke="#ffe27a" stroke-width="1.4"/>'+estrella(14,16,3.2,'#fff')+estrella(52,40,2.4,'#fff')+estrella(18,30,2,'#e6d4ff')}
else if(id==='hw_hechizo'){s='<g fill="none" stroke="#7df0ff" stroke-linecap="round"><circle cx="32" cy="32" r="24" stroke-width="1.8"/><circle cx="32" cy="32" r="19" stroke-width="1"/>';
for(i=0;i<16;i++){a=i*22.5;s+='<path d="M'+P(32,32,19.5,a)+' L'+P(32,32,23.5,a)+'" stroke-width="'+(i%2?1:1.6)+'"/>'}
var q=[];for(i=0;i<5;i++)q.push(P(32,32,18,-90+i*72));
s+='<path d="M'+q[0]+' L'+q[2]+' L'+q[4]+' L'+q[1]+' L'+q[3]+' Z" stroke-width="1.8" stroke-linejoin="round"/></g><circle cx="32" cy="32" r="4.5" fill="#bffaff"/><circle cx="32" cy="32" r="9" fill="rgba(125,240,255,.25)"/>'}
else if(id==='hw_calabaza'){s='<path d="M30 15 Q29 8 35 6 Q34 11 36 15Z" fill="#5aa03a"/><path d="M33 8 Q38 4 41 8" stroke="#5aa03a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="36" rx="23" ry="19" fill="#ff8a1f"/><ellipse cx="21" cy="36" rx="10.5" ry="18" fill="#ff9d3a" stroke="#c45a0a" stroke-width="1.2"/><ellipse cx="43" cy="36" rx="10.5" ry="18" fill="#ff9d3a" stroke="#c45a0a" stroke-width="1.2"/><ellipse cx="32" cy="36" rx="8.5" ry="19" fill="#ffae4a" stroke="#c45a0a" stroke-width="1.2"/><path d="M20 30 L27 30 L23.5 37Z M37 30 L44 30 L40.5 37Z" fill="#2a0f00"/><path d="M19 43 L24 40 L28 45 L32 40 L36 45 L40 40 L45 43 Q32 56 19 43Z" fill="#2a0f00"/><path d="M26 47 L26 44 L29 46Z M35 46 L38 44 L38 47Z" fill="#ffd34d"/>'}
else if(id==='hw_fantasma'){s='<circle cx="32" cy="30" r="22" fill="rgba(220,235,255,.18)"/><path d="M17 52 L17 29 Q17 10 32 10 Q47 10 47 29 L47 52 Q43 47 39.5 52 Q36 47 32 52 Q28 47 24.5 52 Q21 47 17 52Z" fill="#f3f7ff" stroke="#b8cbff" stroke-width="1.2"/><ellipse cx="26" cy="28" rx="3.2" ry="5" fill="#16204a"/><ellipse cx="38" cy="28" rx="3.2" ry="5" fill="#16204a"/><ellipse cx="32" cy="39" rx="3.4" ry="4.6" fill="#16204a"/><ellipse cx="22" cy="35" rx="3" ry="1.8" fill="#ffb3c8" opacity=".7"/><ellipse cx="42" cy="35" rx="3" ry="1.8" fill="#ffb3c8" opacity=".7"/><path d="M17 36 Q10 38 11 44 M47 36 Q54 38 53 44" stroke="#b8cbff" stroke-width="2.2" fill="none" stroke-linecap="round"/>'}
else if(id==='hw_supremo'){s='<text x="3" y="19" font-size="11">🦇</text><text x="50" y="19" font-size="11">🦇</text><circle cx="32" cy="34" r="15" fill="#f4efe0"/><rect x="24" y="41" width="16" height="12" rx="3.5" fill="#f4efe0"/><ellipse cx="26" cy="34" rx="4.3" ry="5.4" fill="#18080a"/><ellipse cx="38" cy="34" rx="4.3" ry="5.4" fill="#18080a"/><circle cx="26" cy="35" r="1.5" fill="#ff7a1a"/><circle cx="38" cy="35" r="1.5" fill="#ff7a1a"/><path d="M32 39 L29.6 44 L34.4 44Z" fill="#18080a"/><path d="M27.5 47 L27.5 53 M32 47 L32 53 M36.5 47 L36.5 53" stroke="#18080a" stroke-width="1.2"/><path d="M19 22 L21 9 L27 16 L32 6 L37 16 L43 9 L45 22Z" fill="#ffd34d" stroke="#b8860b" stroke-width="1"/><circle cx="32" cy="17" r="2" fill="#e0344f"/><circle cx="24" cy="18" r="1.4" fill="#35e0a1"/><circle cx="40" cy="18" r="1.4" fill="#4aa3ff"/>'}
return s}
function emblema(b){
var c=BP[b.id]||['#444','#111','#ccc'];
return '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="url(#g_'+b.id+')" stroke="'+c[2]+'" stroke-width="2.4"/><circle cx="32" cy="32" r="27" fill="none" stroke="'+c[2]+'" stroke-opacity=".35" stroke-width=".8"/>'+glifo(b.id)+'</svg>'}
function vistaInsignias(){
var I=D.ins,h='',i,b,x,txt,m;
if(D.hw&&D.hw.length){h+='<div class="sec">🕯️ Misiones de Halloween <small>exclusivas</small></div>';for(i=0;i<D.hw.length;i++){m=D.hw[i];h+='<div class="ms'+(m.hecha?' ok':'')+'"><div class="mt">'+m.emoji+' '+esc(m.nombre)+(m.hecha?' ✔':'')+'</div><div class="md">'+esc(m.desc)+'</div><div class="mb"><i style="width:'+Math.round(m.avance/m.meta*100)+'%"></i></div><div class="mr">'+m.avance+' / '+m.meta+' · 🎁 '+esc(m.premio)+'</div></div>'}}
h+='<div class="sec">'+(H?'🎃':'🍂')+' Temporada '+esc(I.temporada.nombre)+' <small>'+I.temporada.tiene+'/'+I.temporada.lista.length+'</small></div><div class="bgs">';
for(i=0;i<I.temporada.lista.length;i++){b=I.temporada.lista[i];h+='<div class="bg'+(b.tiene?' ok':' lk')+(sel===b.id?' sel':'')+'" data-b="'+b.id+'"><div class="em">'+emblema(b)+'</div><div class="bn">'+esc(b.nombre)+'</div><div class="bd">'+(b.tiene?'✔ Obtenida':'Bloqueada')+'</div></div>'}
h+='</div>';
if(I.exclusivas.length){h+='<div class="sec">💠 Exclusivas <small>'+I.exclusivas.length+'</small></div><div class="ch">';
for(i=0;i<I.exclusivas.length;i++){x=I.exclusivas[i];h+='<span class="cp ok'+(sel==='x'+i?' sel':'')+'" data-b="x'+i+'">'+esc(x.emoji)+' '+esc(x.nombre)+'</span>'}
h+='</div>'}
h+='<div class="sec">🏆 Automáticas <small>'+I.autoTiene+'/'+I.auto.length+'</small></div><div class="ch">';
for(i=0;i<I.auto.length;i++){x=I.auto[i];h+='<span class="cp '+(x.tiene?'ok':'lk')+(sel==='a'+i?' sel':'')+'" data-b="a'+i+'">'+(x.tiene?esc(x.emoji):'🔒')+' '+esc(x.nombre)+'</span>'}
h+='</div>';
txt=H?'Toca una insignia para leer su historia. 🕯️':'Toca una insignia para ver cómo se consigue.';
if(sel){b=infoIns(sel);if(b)txt='<b>'+esc(b.nombre)+'</b><br>'+esc(b.desc)+(b.tiene===false?'<br><b>Estado:</b> bloqueada':'')}
h+='<div class="inf" id="inf">'+txt+'</div>';
$('cuerpo').innerHTML=h}
function infoIns(id){
var I=D.ins,i,m;
for(i=0;i<I.temporada.lista.length;i++)if(I.temporada.lista[i].id===id)return I.temporada.lista[i];
m=/^([xa])(\d+)$/.exec(String(id));
if(m)return m[1]==='x'?I.exclusivas[+m[2]]:I.auto[+m[2]];
return null}
function pintar(){
$('panel').className='panel';
pestanas();
if(tab==='ins')vistaInsignias();else vistaCartas()}
$('tabs').addEventListener('click',function(e){var t=e.target;
while(t&&t!==this&&!(t.getAttribute&&t.getAttribute('data-t')))t=t.parentNode;
if(!t||t===this)return;tab=t.getAttribute('data-t');pag=0;sel=null;pintar()});
$('cuerpo').addEventListener('click',function(e){var t=e.target,id,v;
while(t&&t!==this&&!(t.getAttribute&&(t.getAttribute('data-id')||t.getAttribute('data-b')||t.id==='ant'||t.id==='sig')))t=t.parentNode;
if(!t||t===this)return;
if(t.id==='ant'){if(pag>0){pag--;pintar()}return}
if(t.id==='sig'){pag++;pintar();return}
id=t.getAttribute('data-id');
if(id){sel=+id;pintar();return}
v=t.getAttribute('data-b');if(v){sel=v;pintar()}});
function adornos(){
if(!H)return;
var p=$('panel'),a=document.createElement('div'),b=document.createElement('div');
a.className='wb a';b.className='wb b';a.innerHTML=cuarto();b.innerHTML=cuarto();p.appendChild(a);p.appendChild(b)}
defs();banner();resumen();pintar();adornos();
})();
</script>
</body></html>`;

export function htmlPerfilGacha(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return PLANTILLA
    .replace("__TEMA__", datos.halloween ? "h" : "n")
    .replace("__FIRMA__", () => datos.firma)
    .replace("__DATA__", () => json);
}
