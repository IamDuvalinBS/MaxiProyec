import { enviarJuego } from "../motores/juegos-html.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#0b0710;color:#fff1e0;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #ff9a3d;border-radius:28px;background:radial-gradient(circle at 50% 0,#3a1d0c,#0b0710);box-shadow:0 0 24px #ff9a3d33}
small{display:block;font-size:10px;letter-spacing:3px;color:#ffb36b}
h1{margin:4px 0 6px;font-size:32px;line-height:1.05;color:#ffd08a;text-shadow:0 0 12px #ff9a3d66}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#c9a27a;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#ffb36b}
.o{display:grid;gap:8px}.o.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.o.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.ch{height:46px;border-radius:12px;border:2px solid #4a2d18;background:#150c08;color:#ffe6c8;font:bold 12px Roboto,Arial,sans-serif;padding:0 2px;overflow:hidden}
.ch.on{border-color:#ffd08a;box-shadow:0 0 10px #ffd08a55;background:#2a170c}
.go,.bt{display:block;width:100%;height:52px;margin-top:12px;border-radius:14px;border:2px solid #ff9a3d;background:#2a170c;color:#ffd08a;font:bold 15px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#ff7a2f,#ffd08a);color:#2a1004}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#0b0710f2;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ffd08a}#ov span{font-size:14px;color:#e8c9a4;margin-bottom:6px;line-height:1.6;white-space:pre-line}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
#sbv{display:none;position:absolute;inset:0;overflow:auto;background:#0b0710f5;border-radius:16px;padding:10px}
.tb{display:grid;gap:2px;font-size:9px;margin-bottom:3px}.tb i{font-style:normal;text-align:center;color:#ffb36b;background:#150c08;border-radius:4px;padding:2px 0}
.tb .fc{display:flex;flex-direction:column;text-align:center;border:1px solid #4a2d18;border-radius:4px;background:#150c08;line-height:1.3;min-width:0;overflow:hidden}.tb .fc span{font-size:8px;color:#ffb36b;height:11px;white-space:nowrap}.tb .fc b{font-size:10px}
.tb .nm{display:flex;align-items:center;justify-content:center;font-size:15px;background:#2a170c;border-radius:4px}.tb .tt{display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;color:#ffd08a;background:#2a170c;border-radius:4px}
.pp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.pp span{display:block;font-size:9px;letter-spacing:1px;color:#c9a27a;margin-bottom:3px}
.pb{position:relative;height:22px;border-radius:11px;background:#150c08;overflow:hidden;border:1px solid #4a2d18}.pb div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#ffd08a,#ff7a2f,#ff3d3d)}
.pb.ef div{position:absolute;top:0;width:10px;height:100%;left:45%;transform:none;background:#ffd08a;border-radius:5px}
.lb{font-size:9px;letter-spacing:2px;color:#c9a27a;margin:10px 0 4px}
.an{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.an .bt{margin:0;height:44px;font-size:15px;padding:0}
.hint{text-align:center;font-size:12px;color:#c9a27a;margin:10px 0 0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#a9825c}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #ff9a3d;background:#2a170c;font-size:16px;line-height:1;padding:0;color:#fff}
body{--ac:#ffb36b;--cd:#150c08;--mu:#c9a27a}
body.hwon{--ac:#ff9a1f;--cd:#2a0f3d;--mu:#d2a8e8;background:#0a0414}
.m{position:relative;overflow:hidden}.m>*:not(.hwfx){position:relative;z-index:1}
body.hwon .m{border-color:#ff7a1a;background:radial-gradient(circle at 50% 0,#4a1a5e,#0a0414 70%);box-shadow:0 0 30px #ff7a1a55}
body.hwon h1{color:#ff9a1f;text-shadow:3px 3px 0 #5b1f8a,0 0 14px #ff7a1a88}
body.hwon small,body.hwon h3{color:#ff9a1f}
body.hwon .ch{border-color:#4a2670;background:#1a0b2c}
body.hwon .ch.on{border-color:#ff9a1f;box-shadow:0 0 12px #ff9a1f66;background:#2e1250}
body.hwon .go{background:linear-gradient(90deg,#ff7a1a,#ffb04a)}
body.hwon .bt{border-color:#ff7a1a;background:#2a1046;color:#ffb04a}
body.hwon #ov,body.hwon #sbv{background:#0a0414f2}

.hwfx{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;display:none}
body.hwon .hwfx{display:block}
.hwfx i{position:absolute;font-style:normal;line-height:1}
@keyframes hfy{0%{transform:translate3d(-16vw,0,0)}50%{transform:translate3d(48vw,-14px,0)}100%{transform:translate3d(116vw,6px,0)}}
@keyframes hfl{0%,100%{transform:translate3d(0,0,0) rotate(-5deg)}50%{transform:translate3d(0,-11px,0) rotate(5deg)}}
@keyframes hsw{0%,100%{transform:rotate(-13deg)}50%{transform:rotate(13deg)}}
.hfy{animation:hfy linear infinite}.hfl{animation:hfl ease-in-out infinite}.hsw{animation:hsw ease-in-out infinite;transform-origin:50% -40px}
.hth::before{content:"";position:absolute;left:50%;bottom:100%;width:1px;height:90px;background:rgba(255,255,255,.5)}
body.hwlo .hwfx i:nth-of-type(n+6){display:none}
@media (prefers-reduced-motion:reduce){.hwfx i{animation:none!important}}

.mptabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:16px 0 6px}
.mptabs button{height:34px;border-radius:10px;border:2px solid var(--ac);background:var(--cd);color:var(--ac);font:900 11px Roboto,Arial,sans-serif;letter-spacing:.4px;padding:0 2px}
.mptabs button.on{background:var(--ac);color:#111}
.mpt{font-size:11px;font-weight:900;letter-spacing:2px;margin:8px 0 6px;color:var(--ac)}
.mpl{list-style:none;margin:0;padding:0;display:grid;gap:5px}
.mpl li{display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:10px;background:var(--cd);font-size:12px;font-weight:700}
.mpl li>i{font-style:normal;width:22px;color:var(--ac);font-weight:900;flex:none;text-align:center}
.mpl li>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpl li>b{color:var(--ac)}
.mpl .mpn,.mpn2{justify-content:center;color:var(--mu);font-weight:400;text-align:center;font-size:12px;padding:8px 0}
.mpkl li{align-items:flex-start}.mpkl li>div{flex:1;min-width:0}
.mpkl span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpkl p{margin:3px 0 0;font-size:10px;font-weight:400;color:var(--mu);display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.mpkl u{text-decoration:none;background:rgba(127,127,127,.22);border-radius:6px;padding:1px 6px}
.mpkl u b{color:var(--ac)}.mpkl em{font-style:normal;opacity:.75}
.mpkl li.me{outline:2px solid var(--ac)}
.mpr{display:block;width:100%;text-align:center;padding:9px 6px;margin-top:6px;border-radius:12px;background:var(--ac);color:#111;font-weight:900;font-size:clamp(10px,4vw,13px);text-decoration:none;font-family:inherit;box-sizing:border-box}
.mpok,.mpwait{text-align:center;padding:7px 6px;margin-top:6px;border-radius:12px;background:var(--cd);color:var(--ac);font-weight:800;font-size:clamp(10px,4vw,13px);box-sizing:border-box;width:100%}
.mpwait{color:var(--mu);font-weight:600;font-size:clamp(9px,3.4vw,11px);background:none;padding:4px 2px}
.mpcmd{margin-top:2px;font-size:10px;color:var(--mu);text-align:center;width:100%}
.mpcmd summary{cursor:pointer;padding:3px}
.mpcmd code{display:block;margin-top:3px;padding:6px;border-radius:8px;background:rgba(0,0,0,.4);color:#fff;word-break:break-all;-webkit-user-select:text;user-select:text;font-family:monospace;font-size:9px;text-align:left}

html,body{width:100%;max-width:100%;overflow-x:hidden}
body{padding:0!important}
.card,.m,.panel{max-width:none!important;width:100%!important;margin:0!important;box-sizing:border-box}
.card,.m{padding-left:10px!important;padding-right:10px!important}
h1{font-size:clamp(15px,8.4vw,26px)!important;letter-spacing:0!important;overflow-wrap:anywhere}
.ttl{font-size:clamp(15px,7vw,22px)!important}
.brand,small,.sr small{font-size:clamp(7px,2.9vw,10px)!important;letter-spacing:1.2px!important}
.ch,.opt{font-size:clamp(8.5px,3.6vw,12px)!important;height:auto!important;min-height:38px;padding:3px 1px!important;line-height:1.08!important;white-space:normal!important;overflow:hidden!important;text-overflow:clip!important;overflow-wrap:anywhere;text-align:center}
.hud{gap:4px!important}
.hud div,div.h>div,.hud>div{font-size:clamp(6px,2.7vw,9px)!important;letter-spacing:.2px!important;padding:4px 0!important;overflow:hidden;white-space:nowrap;text-overflow:clip;min-width:0}
.hud b,div.h b,.hud>div b{font-size:clamp(11px,5.6vw,20px)!important;letter-spacing:0!important;white-space:nowrap;overflow:hidden;text-overflow:clip}
.big{font-size:clamp(20px,11vw,42px)!important}
.go,.bt{font-size:clamp(11px,4.6vw,15px)!important}
.mptabs button{font-size:clamp(8px,3.3vw,11px);letter-spacing:0;line-height:1.05;white-space:normal;padding:2px 1px;height:auto;min-height:34px}
.mpl li{font-size:clamp(10px,3.8vw,12px)}

#gm{position:relative}
#ov,#rs{z-index:40!important;background:rgba(6,2,14,.86)!important;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);overflow-y:auto;justify-content:flex-start!important;padding:10px 8px!important;border-radius:14px;box-sizing:border-box}
#ov>:first-child,#rs>:first-child{margin-top:auto}
#ov>:last-child,#rs>:last-child{margin-bottom:auto}
#ov b,#rs b{font-size:clamp(16px,8vw,26px)!important;overflow-wrap:anywhere}
#ov span,#rs span{font-size:clamp(11px,4.2vw,14px)!important}
.overlay{background:rgba(10,4,22,.86)!important;-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}
.modal{max-width:100%!important;padding:14px 10px!important}
.ov{-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);overflow-y:auto}
</style></head><body><div class="m"><div class="hwfx" id="hwfx"></div><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1 id="tt">🎳 BOLOS</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Tú tiras en primera persona; los bots juegan y tú los ves</div>
<h3>👥 JUGADORES</h3><div class="o c3" id="o1"></div>
<h3>🔢 CUADROS</h3><div class="o c2" id="o2"></div>
<h3>🤖 NIVEL DE LOS BOTS</h3><div class="o c3" id="o3"></div>
<h3>🏟️ PISTA</h3><div class="o c2" id="o0"></div>
<h3>🎳 COLOR DE BOLA</h3><div class="o c3" id="o4"></div>
<h3>⚖️ PESO DE LA BOLA</h3><div class="o c3" id="o5"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button><div id="mpr"></div></div>
<div id="gm" style="display:none">
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="sbv"></div><div id="ov"><b>🏁 FIN</b><span id="ot"></span><div id="rk"></div><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<button class="bt" id="sbb" style="height:40px;margin-top:8px;font-size:13px">📋 VER PUNTUACIÓN COMPLETA</button>
<div class="pp"><div><span>FUERZA</span><div class="pb" id="pw"><div id="pwf"></div></div></div><div><span>EFECTO ↶ ↷</span><div class="pb ef" id="ef"><div id="efk"></div></div></div></div>
<div class="lb">POSICIÓN DE LA BOLA</div><div class="an" id="an1"><button class="bt" data-a="-12">◀◀</button><button class="bt" data-a="-3">◀</button><button class="bt" data-a="c">🎯</button><button class="bt" data-a="3">▶</button><button class="bt" data-a="12">▶▶</button></div>
<div class="lb">DIRECCIÓN</div><div class="an" id="an2"><button class="bt" data-a="-.012">↖↖</button><button class="bt" data-a="-.003">↖</button><button class="bt" data-a="z">⬆</button><button class="bt" data-a=".003">↗</button><button class="bt" data-a=".012">↗↗</button></div>
<button class="go" id="kb">🎳 LANZAR</button>
<div class="hint">Arrastra la bola a los lados y desliza hacia arriba para lanzar, o usa los botones y pulsa LANZAR. Cuando juegan los bots, tú miras.</div>
<button class="bt" id="mb">⚙ AJUSTES</button></div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
var GD=__DATA__,HW=!!GD.hw,LO=!!((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)),T0=Date.now();
document.body.className=(HW?"hwon":"hwoff")+(LO?" hwlo":"");
var MP=(function(){
var G={};
function esc(s){return String(s).replace(/[&<>]/g,function(c){return c==="&"?"&amp;":c==="<"?"&lt;":"&gt;"})}
function V(id){return (G.v&&G.v[id])||G}
function top(id){var a=V(id).top||[],h="",i;for(i=0;i<a.length;i++)h+="<li><i>"+(i+1)+"</i><span>"+esc(a[i][0])+"</span><b>"+a[i][1]+"</b></li>";return h||"<li class=mpn>Sé el primero del ranking</li>"}
function better(id,s){var v=V(id),r=v.rec||0;return !r||(v.menor?s<r:s>r)}
function qs(b){return "j="+encodeURIComponent(b.j)+"&p="+b.p+"&s="+b.s+"&f="+encodeURIComponent(b.f)+"&n="+encodeURIComponent(b.n)}
function send(b){return new Promise(function(res){
 var n=0,done=0,last=null,api=G.api,T=4;
 function fin(r){if(!done){done=1;res(r)}}
 function ok(j){fin({ok:1,j:j||{}})}
 function no(j){n++;if(j&&j.texto)last=j;if(n>=T)fin({ok:0,j:last})}
 setTimeout(function(){fin({ok:0,j:last})},9000);
 try{fetch(api+"/juegos/record",{method:"POST",body:JSON.stringify(b),mode:"cors"}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok)ok(j);else no(j)},function(){no()})}catch(e){no()}
 try{var x=new XMLHttpRequest();x.open("POST",api+"/juegos/record");x.onload=function(){try{var j=JSON.parse(x.responseText);if(j.ok)ok(j);else no(j)}catch(e){no()}};x.onerror=function(){no()};x.send(JSON.stringify(b))}catch(e){no()}
 try{var im=new Image();im.onload=function(){ok({nuevo:1})};im.onerror=function(){no()};im.src=api+"/juegos/r?"+qs(b)}catch(e){no()}
 try{var cb="mpcb"+Math.floor(Math.random()*1e9),s=document.createElement("script");window[cb]=function(j){if(j&&j.ok)ok(j);else no(j)};s.onerror=function(){no()};s.src=api+"/juegos/j?cb="+cb+"&"+qs(b);document.head.appendChild(s)}catch(e){no()}
})}
function pend(b,add){try{var k="mp_pend",a=JSON.parse(localStorage.getItem(k)||"[]"),i;a=a.filter(function(o){return !(o.j===b.j&&o.f===b.f)});if(add)a.push(b);localStorage.setItem(k,JSON.stringify(a.slice(-6)))}catch(e){}}
function flush(){if(!G.api)return;try{var a=JSON.parse(localStorage.getItem("mp_pend")||"[]");a.slice(0,3).forEach(function(b){send(b).then(function(r){if(r.ok||(r.j&&r.j.texto&&/venci|pase/i.test(r.j.texto)))pend(b,0)})})}catch(e){}}
function save(id,score,secs,box){
 var v=V(id),b,cmd;box.innerHTML="";
 if(!score||!v||!v.f||!better(id,score))return;
 b={j:id,p:score,s:secs,f:v.f,n:G.n||""};
 cmd=G.cmd+" "+id+" "+score+" "+secs+" "+v.f;
 function manual(msg){pend(b,1);box.innerHTML='<a class=mpr href="https://wa.me/'+G.bot+'?text='+encodeURIComponent(cmd)+'">📨 Guardar récord en el bot</a><div class=mpwait>'+esc(msg||"No se pudo guardar solo. Toca el botón y envía el mensaje.")+'</div><details class=mpcmd><summary>Ver comando</summary><code>'+esc(cmd)+'</code></details>'}
 function done(j){pend(b,0);v.rec=score;box.innerHTML='<div class=mpok>✅ '+(j&&j.nuevo===false?"Ya tenías un récord mejor":"¡Récord guardado!")+'</div>'}
 if(!G.api){manual();return}
 box.innerHTML="<div class=mpwait>💾 Guardando récord…</div>";
 send(b).then(function(r){if(r.ok)done(r.j);else manual(r.j&&r.j.texto?String(r.j.texto).replace(/[*_]/g,""):"")})
}
function rankHtml(o){var R=G.rk||[],h="",i,k,r,c,ids=o.ids||[G.j],med=["🥇","🥈","🥉"];
 if(!R.length)return "<div class=mpn2>Aún no hay jugadores en el ranking. ¡Sé el primero!</div>";
 for(i=0;i<R.length;i++){r=R[i];c="";
  for(k=0;k<ids.length;k++)if(r.s[ids[k]]!==undefined)c+="<u>"+(o.lab&&o.lab[ids[k]]?esc(o.lab[ids[k]])+" ":"")+"<b>"+r.s[ids[k]]+"</b></u>";
  h+='<li class="'+(r.m?"me":"")+'"><i>'+(med[i]||(i+1))+'</i><div><span>'+esc(r.n)+(r.m?" (tú)":"")+'</span><p>'+c+'<em>récord '+(r.d?"hace "+r.d+" d":"de hoy")+'</em></p></div></li>'}
 return '<ol class="mpl mpkl">'+h+'</ol>'}
function panel(o){
 var host=document.getElementById("mpr");if(!host)return;
 host.innerHTML='<div class=mptabs><button type=button class=on>🏆 TOP 5</button><button type=button>👑 MEJORES JUGADORES</button></div><div class=mpt id=tth>'+(o.title||"🏆 TOP DEL BOT")+'</div><ol class=mpl id=tp></ol><div id=mpk style="display:none"></div>';
 var bs=host.getElementsByTagName("button"),tt=document.getElementById("tth"),tp=document.getElementById("tp"),pk=document.getElementById("mpk");
 function show(n){bs[0].className=n?"":"on";bs[1].className=n?"on":"";tt.style.display=tp.style.display=n?"none":"";pk.style.display=n?"block":"none";if(n)pk.innerHTML=rankHtml(o)}
 bs[0].addEventListener("click",function(){show(0)});bs[1].addEventListener("click",function(){show(1)});
}
return{init:function(g){G=g;setTimeout(flush,1500)},V:V,top:top,save:save,panel:panel,esc:esc}
})();
MP.init(GD);
function hV(id){return MP.V(id)}
function hTop(id){return MP.top(id)}
function hRec(id,score,secs,box){MP.save(id,score,secs,box)}
function hDeco(list){var f=document.getElementById("hwfx"),h="",i,a;if(!f)return;for(i=0;i<list.length;i++){a=list[i];h+='<i class="'+a[1]+'" style="left:'+a[2]+'%;'+a[3]+';font-size:'+a[6]+'px;animation-duration:'+a[4]+'s;animation-delay:-'+a[5]+'s">'+a[0]+'</i>'}f.insertAdjacentHTML("beforeend",h)}
MP.panel({ids:["bolos10","bolos5"],lab:{"bolos10":"10c","bolos5":"5c"}});
(function(){var o=document.getElementById("ov")||document.getElementById("rs"),g=document.getElementById("gm");if(o&&g&&o.parentNode!==g)g.appendChild(o)})();
var snd=2,AC=null,MG=null,MB=null,NB=null,TL={},vc=0,mid=0,mpat=null,mNext=0,mStep=0,MSP=.25,MCUR=null,ACUR=null,ANS=null;
try{var sv0=localStorage.getItem("mp_snd2");if(sv0!==null)snd=Math.max(0,Math.min(2,parseInt(sv0)||0))}catch(e){}
function au(){if(!AC){try{var C=window.AudioContext||window.webkitAudioContext;AC=new C();MG=AC.createGain();MG.gain.value=1;var cp=AC.createDynamicsCompressor();cp.threshold.value=-16;cp.ratio.value=8;cp.attack.value=.003;cp.release.value=.15;MG.connect(cp);cp.connect(AC.destination);MB=AC.createGain();MB.gain.value=.55;MB.connect(MG);
 var b=AC.createBuffer(1,AC.sampleRate*.5|0,AC.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;NB=b}catch(e){snd=0;AC=null;return null}}
 if(AC.state==="suspended")AC.resume();return AC}
function hz(n){return 440*Math.pow(2,(n-69)/12)}
function fx(k,g,f,d,t,v,f2,cr){if(snd<1||document.hidden)return;var n=Date.now();if(n-(TL[k]||0)<g)return;if(vc>14&&!cr)return;TL[k]=n;var c=au();if(!c)return;var o=c.createOscillator(),a=c.createGain(),s=c.currentTime,w=(v||.05)*7;vc++;o.onended=function(){vc--};o.type=t||"square";o.frequency.setValueAtTime(f,s);if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);a.gain.setValueAtTime(0,s);a.gain.linearRampToValueAtTime(w,s+.006);a.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(a);a.connect(MG);o.start(s);o.stop(s+d+.03)}
function nz(k,g,d,fr,v,q){if(snd<1||document.hidden)return;var n=Date.now();if(n-(TL[k]||0)<g)return;if(vc>14)return;TL[k]=n;var c=au();if(!c)return;var o=c.createBufferSource(),a=c.createGain(),f=c.createBiquadFilter(),s=c.currentTime;vc++;o.onended=function(){vc--};o.buffer=NB;f.type="bandpass";f.frequency.value=fr;f.Q.value=q||1;a.gain.setValueAtTime(v*4,s);a.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(f);f.connect(a);a.connect(MG);o.start(s);o.stop(s+d+.02)}
function hurt(){if(snd<1||document.hidden)return;var n=Date.now();if(n-(TL.hu||0)<250)return;TL.hu=n;var c=au();if(!c)return;var s=c.currentTime,o=c.createOscillator(),a=c.createGain(),f=c.createBiquadFilter();vc++;o.onended=function(){vc--};o.type="sawtooth";o.frequency.setValueAtTime(330,s);o.frequency.exponentialRampToValueAtTime(96,s+.18);f.type="lowpass";f.frequency.value=1000;a.gain.setValueAtTime(0,s);a.gain.linearRampToValueAtTime(.7,s+.008);a.gain.exponentialRampToValueAtTime(.0001,s+.22);o.connect(f);f.connect(a);a.connect(MG);o.start(s);o.stop(s+.24);nz("hn",0,.08,700,.12,.8)}
function arp(a,d,ty,v){for(var i=0;i<a.length;i++)setTimeout(fx.bind(null,"ar"+i,0,a[i],d,ty,v,0,1),i*110)}
function nt(f,t,d,ty,v){var c=AC,o=c.createOscillator(),a=c.createGain();o.type=ty;o.frequency.value=f;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(v,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(MB);o.start(t);o.stop(t+d+.02)}
function msch(){if(snd<2||document.hidden||!AC||AC.state!=="running"||!mpat)return;var now=AC.currentTime;if(mNext<now)mNext=now+.05;while(mNext<now+.5){mpat(mStep++,mNext);mNext+=MSP}}
function mhalt(){if(mid){clearInterval(mid);mid=0}mpat=null}
function mrun(){mhalt();if(snd<2||!MCUR||!au())return;mpat=MCUR[0];MSP=MCUR[1];mStep=0;mNext=AC.currentTime+.08;mid=setInterval(msch,150)}
function mus(p,sp){MCUR=[p,sp];mrun()}
function mend(){mhalt();MCUR=null}
function ane0(){if(ANS){try{ANS.stop()}catch(e){}ANS=null}}
function arun(){ane0();if(snd<1||!ACUR||!au())return;var o=AC.createBufferSource(),f=AC.createBiquadFilter(),a=AC.createGain();o.buffer=NB;o.loop=true;f.type="lowpass";f.frequency.value=ACUR[0];a.gain.value=ACUR[1];o.connect(f);f.connect(a);a.connect(MG);o.start();ANS=o}
function ans(fr,v){ACUR=[fr,v];arun()}
function ane(){ane0();ACUR=null}
(function(){var b=document.getElementById("sd");function ic(){b.textContent=snd===2?"🔊":snd===1?"🔉":"🔇"}ic();b.addEventListener("click",function(){snd=(snd+2)%3;try{localStorage.setItem("mp_snd2",String(snd))}catch(x){}ic();if(snd<2)mhalt();if(snd<1)ane0();if(snd>0){au();if(snd===2)mrun();arun();fx("t",0,660,.08,"sine",.09,990,1)}})})();
document.addEventListener("click",function(e){var t=e.target;if(t&&t.tagName==="BUTTON"&&t.id!=="sd")fx("ui",50,560,.04,"square",.05)},true);
function mBol(i,t){var s=[60,64,67,69,67,64,62,65][i%8];nt(hz(s),t,.28,"triangle",.3);if(i%2===0)nt(hz(s-24),t,.4,"sine",.45);if(i%4===3)nt(hz(s+12),t+.12,.15,"square",.1)}
var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_bolos_best",CK="mp_bolos_cfg2";
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
function rn(a,b){return a+Math.random()*(b-a)}
var THL=HW?[["🪦","Cementerio"],["🕸️","Telaraña"],["🧪","Pantano"],["🌕","Luna roja"]]:[["🪵","Clásica"],["🌌","Neón"],["🕹️","Retro"],["🪐","Espacial"]],PLC=[["👥","2 jugadores",2],["👥","4 jugadores",4],["👥","6 jugadores",6]],FRC=[["⚡","5 cuadros",5],["🎯","10 cuadros",10]];
var BDF=[["🟢","Fáciles",.03],["🔵","Normales",.017],["🔴","Expertos",.009]],BCL=[["🔵","Azul","#3da5ff"],["🔴","Rojo","#ff4d5e"],["🟢","Verde","#39ff7a"],["🟣","Morado","#b06cff"],["🟠","Naranja","#ff9a3d"],["⚫","Negra","#3a3a4a"]],WGT=[["🪶","Ligera",7],["⚖️","Media",12],["🏋️","Pesada",16]];
var LS=[THL,PLC,FRC,BDF,BCL,WGT],S=[0,0,0,1,0,1];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===6&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var k0=0;k0<6;k0++)chips(k0);
function hTopUp(){var n=FRC[S[2]][2];$("tth").textContent="🏆 TOP DEL BOT · "+n+" CUADROS";$("tp").innerHTML=hTop(n===5?"bolos5":"bolos10")}
hTopUp();$("o2").addEventListener("click",hTopUp);
var cv=$("c"),x=cv.getContext("2d");x.scale(K,K);
var F=700,HY=150,CH=60,ZH=900,LW=50,PR=5.75,BR=10.2,Z0=-60,CZ0=-260,PJ=[0,0,0];
var AVE=HW?["🙂","🧛","🧟","🧙","🎃","💀"]:["🙂","🤖","👾","🐱","🦊","🐸"],AVN=HW?["Tú","Drácula","Zombi","Bruja","Calabaza","Esqueleto"]:["Tú","Rex","Zed","Kira","Neo","Luna"],AVC=["#2d7bff","#e0364a","#e0364a","#e0364a","#e0364a","#e0364a"];
var THC=[{wall:"#2a1a10",lane:"#d9a95f",far:"#8f6c38",ln:"rgba(90,50,10,.30)",gut:"#1d130a",arr:"#8a2424",app:"#b88a4a",bg:"#120a05",gold:"#c9a24a",gold2:"#a8832f",tri:"#3a74b5",rail:"#8fb4d8"},
{wall:"#080a2a",lane:"#0d1238",far:"#05071c",ln:"rgba(34,245,255,.35)",gut:"#05061a",arr:"#ff3df2",app:"#141a4a",bg:"#03040f",gold:"#0b1040",gold2:"rgba(34,245,255,.4)",tri:"#2a0f6a",rail:"#22f5ff"},
{wall:"#1a0636",lane:"#3a2580",far:"#1c1040",ln:"rgba(255,207,77,.3)",gut:"#0a0414",arr:"#ffcf4d",app:"#2b1b5e",bg:"#0a0414",gold:"#2a0a4a",gold2:"rgba(255,207,77,.4)",tri:"#ff3d7a",rail:"#ffcf4d"},
{wall:"#050c26",lane:"#142a6a",far:"#0a1640",ln:"rgba(160,200,255,.28)",gut:"#02040e",arr:"#9fd0ff",app:"#0e1c4a",bg:"#02040c",gold:"#0a1a50",gold2:"rgba(159,208,255,.35)",tri:"#2a4a9a",rail:"#9fd0ff"}];
if(HW)THC=[{wall:"#1a0f26",lane:"#3d2b4f",far:"#241638",ln:"rgba(255,154,31,.25)",gut:"#0c0614",arr:"#ff9a1f",app:"#4a3560",bg:"#0a0512",gold:"#6a3a8a",gold2:"#ff7a1a",tri:"#ff7a1a",rail:"#9a6aca"},
{wall:"#101018",lane:"#2a2a3a",far:"#15151f",ln:"rgba(255,255,255,.22)",gut:"#06060c",arr:"#e8e2c8",app:"#33334a",bg:"#06060b",gold:"#44445a",gold2:"rgba(255,255,255,.4)",tri:"#8a8aa8",rail:"#d8d8e8"},
{wall:"#0a1a0c",lane:"#1f4a28",far:"#0f2a14",ln:"rgba(160,255,90,.28)",gut:"#050f07",arr:"#9dff3f",app:"#2a5a32",bg:"#040a05",gold:"#2f7a3a",gold2:"rgba(160,255,90,.4)",tri:"#7a2fb0",rail:"#9dff3f"},
{wall:"#2a0508",lane:"#5a1a24",far:"#340a10",ln:"rgba(255,200,160,.28)",gut:"#120204",arr:"#ffd9b0",app:"#6a2230",bg:"#0e0204",gold:"#8a2a3a",gold2:"rgba(255,200,160,.4)",tri:"#ff4a2a",rail:"#ffb08a"}];
var st=0,TC,NP=2,NF=5,PL=[],cur=0,fi=0,pins=[],ball=null,left=10,wasFull=true,sx=0,ang=0,pw=.7,hk=0,BM=12,tmr=0,settle=0,gutS=0,toast="",tt=0,tts=1,last=0,gid=0,cz=CZ0,tcz=CZ0,bt=0,bpl=null,bxx=0,msg="",best5=Math.max(ld(KEY+"5"),hV("bolos5").rec||0),best10=Math.max(ld(KEY+"10"),hV("bolos10").rec||0),tm=0,BG=null,LG=null,PSP=null,BSP=null,AV=[],sw=null,sbOpen=false,BDv=.017;
function mkPins(){var a=[],R=[[0],[-14.5,14.5],[-29,0,29],[-43.5,-14.5,14.5,43.5]],r,i;for(r=0;r<4;r++)for(i=0;i<R[r].length;i++)a.push({x:R[r][i],z:ZH+r*25,vx:0,vz:0,r:PR,d:0,o:0,a:rn(0,6.28)});return a}
function calc(Fr){var fl=[],sa=[],i,j,tot=[],run=0,k,s,n;
 for(i=0;i<Fr.length;i++){sa.push(fl.length);for(j=0;j<Fr[i].length;j++)fl.push(Fr[i][j])}
 for(i=0;i<NF;i++){if(i>=Fr.length||!Fr[i].length){tot.push(null);continue}k=sa[i];n=Fr[i].length;
  if(i<NF-1){if(fl[k]===10){if(fl.length<=k+2){tot.push(null);continue}s=10+fl[k+1]+fl[k+2]}else{if(n<2){tot.push(null);continue}if(fl[k]+fl[k+1]===10){if(fl.length<=k+2){tot.push(null);continue}s=10+fl[k+2]}else s=fl[k]+fl[k+1]}}
  else{if(n<2){tot.push(null);continue}if((fl[k]===10||fl[k]+fl[k+1]===10)&&n<3){tot.push(null);continue}s=0;for(j=0;j<n;j++)s+=fl[k+j]}
  run+=s;tot.push(run)}
 return tot}
function marks(f,i){var o=[],a,j,p=0;for(j=0;j<f.length;j++){a=f[j];
  if(a===10&&(j===0||(i===NF-1&&p===0)))o.push("X");else if(j>0&&p+a===10)o.push("/");else o.push(a===0?"-":String(a));
  if(i===NF-1){p=(a===10||p+a===10)?0:p+a}else p=a}
 return o.join(" ")}
function fstate(fr,f){var n=fr.length,a=fr[0],b=fr[1];
 if(f<NF-1){if(a===10)return[1,1];if(n===2)return[1,1];return[0,0]}
 if(n===1)return a===10?[0,1]:[0,0];
 if(n===2){if(a===10)return[0,b===10?1:0];if(a+b===10)return[0,1];return[1,1]}
 return[1,1]}
function lastTot(Fr){var t=calc(Fr),v=0;for(var i=0;i<NF;i++)if(t[i]!==null&&t[i]!==undefined)v=t[i];return v}
function pj(X,Z,Y){var zc=Z-cz;if(zc<30)zc=30;if(zc>350)zc=350+(zc-350)*.55;var s=F/zc;PJ[0]=150+X*s;PJ[1]=HY+(CH-Y)*s;PJ[2]=s;return PJ}
function bakeBG(t){var a=cvs(W,H),q=a[1],c=THC[t],g,i;q.fillStyle=c.bg;q.fillRect(0,0,W,H);
 g=q.createLinearGradient(0,0,0,HY);g.addColorStop(0,"#020202");g.addColorStop(1,c.wall);q.fillStyle=g;q.fillRect(0,0,W,HY);
 q.fillStyle=c.gold;q.fillRect(18,56,264,HY-60);
 q.save();q.beginPath();q.rect(18,56,264,HY-60);q.clip();q.strokeStyle=c.gold2;q.lineWidth=1.4;q.beginPath();for(i=-6;i<28;i++){q.moveTo(18+i*11,56);q.lineTo(18+i*11+30,HY-4);q.moveTo(18+i*11+30,56);q.lineTo(18+i*11,HY-4)}q.stroke();q.restore();
 q.strokeStyle=c.rail;q.lineWidth=3;q.strokeRect(18,56,264,HY-60);
 q.fillStyle=c.tri;q.beginPath();q.moveTo(88,64);q.lineTo(212,64);q.lineTo(150,HY-10);q.closePath();q.fill();q.strokeStyle="rgba(255,255,255,.55)";q.lineWidth=2;q.stroke();
 for(i=0;i<3;i++){q.fillStyle="#fff";q.beginPath();q.ellipse(126+i*24,84,6.5,15,0,0,6.3);q.fill();q.fillStyle="#e43b3b";q.fillRect(121+i*24,76,10,3)}
 q.fillStyle="#e43b3b";q.beginPath();q.arc(150,112,12,0,6.3);q.fill();q.fillStyle="rgba(255,255,255,.55)";q.beginPath();q.ellipse(146,107,4,2.6,0,0,6.3);q.fill();
 g=q.createRadialGradient(150,0,5,150,0,120);g.addColorStop(0,"rgba(255,255,255,.25)");g.addColorStop(1,"rgba(255,255,255,0)");q.fillStyle=g;q.fillRect(0,0,W,HY);
 return a[0]}
function ballSpr(c){var a=cvs(56,56),q=a[1],g=q.createRadialGradient(20,18,2,28,28,27);g.addColorStop(0,"rgba(255,255,255,.9)");g.addColorStop(.14,c);g.addColorStop(.8,c);g.addColorStop(1,"#000");q.fillStyle=g;q.beginPath();q.arc(28,28,26,0,6.3);q.fill();
 g=q.createRadialGradient(28,28,12,28,28,27);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.55)");q.fillStyle=g;q.beginPath();q.arc(28,28,26,0,6.3);q.fill();
 q.fillStyle="rgba(255,255,255,.75)";q.beginPath();q.ellipse(19,15,8,4.5,-.6,0,6.3);q.fill();return a[0]}
function pinSpr(){var a=cvs(32,80),q=a[1],g=q.createLinearGradient(0,0,32,0);g.addColorStop(0,"#b5b5b5");g.addColorStop(.35,"#ffffff");g.addColorStop(.7,"#f2f2f2");g.addColorStop(1,"#a9a9a9");q.fillStyle=g;
 q.beginPath();q.moveTo(16,2);q.bezierCurveTo(24,2,25,12,22,20);q.bezierCurveTo(20,27,29,44,29,59);q.bezierCurveTo(29,75,24,78,16,78);q.bezierCurveTo(8,78,3,75,3,59);q.bezierCurveTo(3,44,12,27,10,20);q.bezierCurveTo(7,12,8,2,16,2);q.closePath();q.fill();q.strokeStyle="rgba(0,0,0,.25)";q.lineWidth=1;q.stroke();
 q.fillStyle=HW?"#ff7a1a":"#d8232a";q.fillRect(9.5,22,13,4);q.fillRect(9,29,14,3.2);q.fillStyle="rgba(255,255,255,.65)";q.fillRect(11,34,3,34);if(HW){q.fillStyle="#1a0a22";q.beginPath();q.arc(12.5,11,2,0,6.3);q.arc(19.5,11,2,0,6.3);q.fill();q.beginPath();q.arc(16,17,2.2,0,3.14);q.fill()}return a[0]}
function mkVig(){var a=cvs(W,H),q=a[1],g=q.createRadialGradient(150,200,90,150,200,260);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.5)");q.fillStyle=g;q.fillRect(0,0,W,H);return a[0]}
function avSpr(i){var a=cvs(30,30),q=a[1];q.fillStyle=AVC[i];q.beginPath();q.arc(15,15,14,0,6.3);q.fill();q.fillStyle="#fff";q.beginPath();q.arc(15,15,11,0,6.3);q.fill();q.font="15px serif";q.textAlign="center";q.textBaseline="middle";q.fillText(AVE[i],15,16);return a[0]}
var E1=null;
var cardM=[],VIG=null,BT=[],FD=[],CF2=[],shk=0;
function refresh(){for(var i=0;i<NP;i++)PL[i].t=lastTot(PL[i].F);var fr=PL[cur]&&PL[cur].F[fi]||[];cardM=fr.length?marks(fr,fi).split(" "):[];sbRefresh()}
function setPw(){$("pwf").style.transform="scaleX("+pw+")"}
function setEf(){$("efk").style.left=((hk+1)/2*90)+"%"}
function newTurn(){left=10;pins=mkPins();wasFull=true;ball=null;ang=0;sx=0;toast="";if(PL[cur].h){st=1;msg="Tu turno"}else{st=4;bt=0;bpl=botPlan();bxx=0;msg="Turno de "+PL[cur].n}tcz=CZ0;refresh()}
function start(){T0=Date.now();gid++;TC=THC[S[0]];NP=PLC[S[1]][2];NF=FRC[S[2]][2];BDv=BDF[S[3]][2];BM=WGT[S[5]][2];sv(CK,S.join(","));BG=bakeBG(S[0]);LG=x.createLinearGradient(0,HY,0,330);LG.addColorStop(0,TC.far);LG.addColorStop(1,TC.lane);BSP=ballSpr(BCL[S[4]][2]);PSP=pinSpr();VIG=VIG||mkVig();BT=[];for(var bi=0;bi<13;bi++){var al=.03+((bi*7)%5)*.025;BT.push(bi%2?"rgba(255,235,190,"+al+")":"rgba(30,15,0,"+al+")")}FD=[];CF2=[];shk=0;AV=[];PL=[];
 for(var i=0;i<NP;i++){AV.push(avSpr(i));PL.push({n:AVN[i],e:AVE[i],h:i===0,F:[],t:0})}
 cur=0;fi=0;cz=CZ0;tcz=CZ0;pw=.7;hk=0;tt=0;sbOpen=false;$("sbv").style.display="none";
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";setPw();setEf();fx("s",0,520,.1,"sine",.08,780);mus(mBol,.3);newTurn()}
function toCfg(){gid++;st=0;mend();ane();$("gm").style.display="none";$("cfg").style.display="block"}
function endGame(){st=5;mend();ane();var r=[],i,b=NF===5?best5:best10;for(i=0;i<NP;i++)r.push({p:PL[i],t:lastTot(PL[i].F)});r.sort(function(a,c){return c.t-a.t});
 var me=r.filter(function(o){return o.p.h})[0],win=r[0].t===me.t,pos=r.indexOf(me)+1,med=["🥇","🥈","🥉"],txt="";
 for(i=0;i<r.length;i++)txt+=(med[i]||(i+1)+".")+" "+r[i].p.e+" "+r[i].p.n+" — "+r[i].t+"\n";
 if(me.t>b){if(NF===5){best5=me.t;sv(KEY+"5",me.t)}else{best10=me.t;sv(KEY+"10",me.t)}}
 hRec(NF===5?"bolos5":"bolos10",me.t,Math.round((Date.now()-T0)/1000),$("rk"));
 $("ot").textContent=(win?"🏆 ¡Ganaste!":"Terminaste en el lugar "+pos)+"\n"+txt+"Tu récord ("+NF+" cuadros): "+(NF===5?best5:best10);$("ov").style.display="flex";
 arp(win?[523,659,784,1047]:[392,349,311],.2,win?"triangle":"sawtooth",.1);sbRefresh()}
function shout(m,s){toast=m;tt=s||1.5;tts=1}
function throwBall(x0,a,p,h){var v=5+8*p;ball={x:x0,z:Z0,vx:Math.sin(a)*v,vz:Math.cos(a)*v,r:BR,m:BM,al:true,g:0,rot:0,hk:h};st=2;tmr=0;settle=0;gutS=0;nz("rl",0,.3,350,.3,.8);ans(170,.2)}
function launch(){if(st!==1||!PL[cur].h)return;throwBall(sx,ang,pw,hk)}
function hit(a,b,ma,mb,e){var dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz,rr=a.r+b.r;if(d2>=rr*rr||d2<1e-6)return 0;var d=Math.sqrt(d2),nx=dx/d,nz2=dz/d,ov=rr-d,s=ma+mb;
 a.x-=nx*ov*mb/s;a.z-=nz2*ov*mb/s;b.x+=nx*ov*ma/s;b.z+=nz2*ov*ma/s;var rv=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz2;if(rv>=0)return .01;var j=-(1+e)*rv/(1/ma+1/mb);a.vx-=j*nx/ma;a.vz-=j*nz2/ma;b.vx+=j*nx/mb;b.vz+=j*nz2/mb;return -rv}
function knock(p){if(!p.d){p.d=1;p.t0=tmr;p.s=p.vx>=0?1:-1}}
function confetti(n){for(var i=0;i<n;i++)CF2.push({x:rn(20,280),y:rn(-40,30),vx:rn(-.6,.6),vy:rn(.6,1.8),c:["#ff4d5e","#ffd08a","#3da5ff","#39ff7a","#ff3df2"][i%5],r:rn(0,6)})}
function crash(v){if(v>2.2)shk=Math.max(shk,4);fx("pk",55,650+Math.random()*700,.05,"square",Math.min(.16,.04+v*.03));nz("ph",55,.09,1500+Math.random()*1500,Math.min(.4,.12+v*.05))}
function phys(k){var sp=ball&&ball.al?Math.sqrt(ball.vx*ball.vx+ball.vz*ball.vz):0,mx=0,i,j,p,q,imp,n,dt,s;
 for(i=0;i<pins.length;i++){p=pins[i];if(!p.o){var v2=p.vx*p.vx+p.vz*p.vz;if(v2>mx)mx=v2}}
 n=Math.max(1,Math.min(6,Math.ceil(Math.max(sp,Math.sqrt(mx))*k/5)));dt=k/n;
 for(s=0;s<n;s++){
  if(ball&&ball.al){
   if(!ball.g&&ball.z>250){var ha=ball.hk*.003*dt,cs=Math.cos(ha),sn=Math.sin(ha),nvx=ball.vx*cs+ball.vz*sn;ball.vz=-ball.vx*sn+ball.vz*cs;ball.vx=nvx}
   ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;ball.rot+=sp*dt*.06;
   if(!ball.g&&Math.abs(ball.x)>LW+3){ball.g=1;gutS=1;ball.vx=0;fx("gt",0,300,.3,"sawtooth",.08,120,1)}
   if(ball.g)ball.x=ball.x>0?56:-56;
   if(ball.z>1030){ball.al=false;ane();nz("pt",0,.25,500,.3)}
   else if(!ball.g)for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;imp=hit(ball,p,ball.m,3.5,.9);if(imp){if(imp>.7)knock(p);if(imp>.4)crash(imp)}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;if(p.vx||p.vz){p.x+=p.vx*dt;p.z+=p.vz*dt;
   if(p.z>1012){p.d=1;p.o=1;continue}
   if(p.x<-68){p.x=-68;p.vx=Math.abs(p.vx)*.5}else if(p.x>68){p.x=68;p.vx=-Math.abs(p.vx)*.5}
   if(p.z<ZH-60){p.z=ZH-60;p.vz=Math.abs(p.vz)*.5}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;for(j=i+1;j<pins.length;j++){q=pins[j];if(q.o)continue;
   if(Math.abs(p.x-q.x)>12||Math.abs(p.z-q.z)>12)continue;if(!(p.vx||p.vz||q.vx||q.vz))continue;imp=hit(p,q,3.5,3.5,.88);if(imp>.3){if(imp>.8){knock(p);knock(q)}if(imp>.8)crash(imp*.6)}}}}
 var f=Math.pow(.9,k),f2=Math.pow(.992,k);
 for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;var ff=p.d?f2:f;p.vx*=ff;p.vz*=ff;if(p.vx*p.vx+p.vz*p.vz<.003){p.vx=0;p.vz=0}}
 tmr+=k;var moving=false;for(i=0;i<pins.length;i++)if(!pins[i].o&&(pins[i].vx||pins[i].vz))moving=true;
 if((!ball.al&&!moving)||tmr>420){settle+=k;if(settle>40||tmr>420)endRoll()}else settle=0}
function endRoll(){ane();var n=0,i,np=[],pl=PL[cur];for(i=0;i<pins.length;i++){if(pins[i].d){n++;if(!pins[i].o)FD.push({p:pins[i],a:1})}else np.push(pins[i])}
 var fr=pl.F[fi]||(pl.F[fi]=[]),full=wasFull,gut=gutS&&n===0,m;fr.push(n);var s=fstate(fr,fi),who=pl.h?"":pl.n+": ";
 if(n===10&&full){m=who+(HW?"¡STRIKE! 💀":"¡STRIKE!");confetti(40);arp([523,659,784,1047,1319],.16,"triangle",.11);nz("sk",0,.9,1600,.3)}
 else if(n===left&&n>0){m=who+(HW?"¡SPARE! 🎃":"¡SPARE!");confetti(20);arp([523,659,784],.16,"triangle",.1);nz("sk",0,.5,1500,.2)}
 else if(gut){m=who+(HW?"¡La tumba se lo tragó!":"¡Canaleta!");arp([300,250,200],.22,"sawtooth",.07)}
 else if(n===0){m=who+(HW?"Los fantasmas se escaparon":"Ningún pino");fx("m0",0,200,.3,"sine",.1,120)}
 else{m=who+n+(HW?(n===1?" fantasma":" fantasmas"):(n===1?" pino":" pinos"));fx("rr",0,420+n*40,.15,"triangle",.1,700+n*40)}
 shout(m,1.6);left-=n;wasFull=false;
 if(s[1]){left=10;pins=mkPins();wasFull=true}else pins=np;
 ball=null;st=3;var g=gid;refresh();
 setTimeout(function(){if(g!==gid)return;if(s[0]){cur++;if(cur>=NP){cur=0;fi++}if(fi>=NF){endGame();return}}else{ang=0;sx=0}nextAim()},1700)}
function nextAim(){var keep=pins;if(wasFull)pins=mkPins();else pins=keep;ball=null;ang=0;sx=0;toast="";tcz=CZ0;
 if(PL[cur].h){st=1;msg="Tu turno"}else{st=4;bt=0;bpl=botPlan();bxx=0;msg="Turno de "+PL[cur].n}refresh()}
function botPlan(){var sd=[],i,mxs=0,c=0,tx,x0=rn(-22,22),a,p,h=rn(-.08,.08);
 for(i=0;i<pins.length;i++)if(!pins[i].d&&!pins[i].o){mxs+=pins[i].x;c++}
 tx=(wasFull||c===0)?(Math.random()<.5?-1:1)*rn(4,9):mxs/c;
 a=Math.atan2(tx-x0,ZH+60)+rn(-1,1)*BDv;p=rn(.62,.92);return{x0:x0,a:a,p:p,h:h}}
function nextTurnAfter(){}
function drawPoly(a,b,c,d,col){x.fillStyle=col;x.beginPath();x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.lineTo(c[0],c[1]);x.lineTo(d[0],d[1]);x.closePath();x.fill()}
function P4(X,Z){var p=pj(X,Z,0);return[p[0],p[1]]}
function drawLane(){var i,zn2=Math.max(cz+55,0),n1=P4(-LW,zn2),n2=P4(LW,zn2),f1=P4(-LW,1070),f2=P4(LW,1070);
 x.fillStyle=TC.bg;x.fillRect(0,HY,W,H-HY);
 if(cz<-45){var fy=pj(0,0,0)[1];x.fillStyle=TC.app;x.fillRect(0,fy,W,H-fy);x.fillStyle="rgba(255,255,255,.08)";x.fillRect(0,fy,W,3)}
 drawPoly(P4(-76,zn2),P4(-62,zn2),P4(-62,1070),P4(-76,1070),TC.rail);drawPoly(P4(62,zn2),P4(76,zn2),P4(76,1070),P4(62,1070),TC.rail);
 drawPoly(P4(-62,zn2),n1,f1,P4(-62,1070),TC.gut);drawPoly(n2,P4(62,zn2),P4(62,1070),f2,TC.gut);
 drawPoly(n1,n2,f2,f1,LG);
 for(i=0;i<13;i++){var xa=-LW+i*7.6923,xb=xa+7.6923;drawPoly(P4(xa,zn2),P4(xb,zn2),P4(xb,1010),P4(xa,1010),BT[i])}
 x.strokeStyle=TC.ln;x.lineWidth=1;x.beginPath();for(i=-6;i<=6;i++){var u=P4(i*LW/6.5,zn2),v=P4(i*LW/6.5,1010);x.moveTo(u[0],u[1]);x.lineTo(v[0],v[1])}x.stroke();
 drawPoly(P4(-16,zn2),P4(16,zn2),P4(16,1010),P4(-16,1010),"rgba(255,255,255,.07)");
 x.strokeStyle="rgba(255,255,255,.5)";x.lineWidth=1.5;x.beginPath();var e1=P4(-62,zn2),e2=P4(-62,1060),e3=P4(62,zn2),e4=P4(62,1060);x.moveTo(e1[0],e1[1]);x.lineTo(e2[0],e2[1]);x.moveTo(e3[0],e3[1]);x.lineTo(e4[0],e4[1]);x.stroke();
 x.fillStyle=TC.arr;for(i=0;i<7;i++){var az=215+(3-Math.abs(i-3))*20;if(az-cz>45){var ap=pj((i-3)*13,az,0),aw=3.4*ap[2],ah=8*ap[2];x.beginPath();x.moveTo(ap[0],ap[1]-ah);x.lineTo(ap[0]-aw,ap[1]+ah*.3);x.lineTo(ap[0]+aw,ap[1]+ah*.3);x.closePath();x.fill()}}
 if(cz<-20){var l1=P4(-LW,0),l2=P4(LW,0);x.strokeStyle="rgba(255,255,255,.8)";x.lineWidth=2.2;x.beginPath();x.moveTo(l1[0],l1[1]);x.lineTo(l2[0],l2[1]);x.stroke()}
 drawPoly(P4(-76,1012),P4(76,1012),P4(76,1090),P4(-76,1090),"#000")}
function drawPin(p,al){var q=pj(p.x,p.z,0),s=q[2],sxx=q[0],syy=q[1];if(p.z-cz<45)return;var w=13.5*s,h=40*s,a0=al===undefined?1:al;
 if(!p.d){x.globalAlpha=.16*a0;x.save();x.translate(sxx,syy);x.scale(1,-.45);x.drawImage(PSP,-w/2,-h,w,h);x.restore();x.globalAlpha=a0;x.drawImage(PSP,sxx-w/2,syy-h,w,h)}
 else{var u=Math.min(1,(tmr-(p.t0||0))/10);x.globalAlpha=(p.z>1000?.3:1)*a0;x.save();x.translate(sxx,syy);x.rotate((p.s||1)*u*1.45);x.scale(1,1-u*.25);x.drawImage(PSP,-w/2,-h,w,h);x.restore()}x.globalAlpha=1}
function drawBall(bx,bz,rot){var q=pj(bx,bz,0),s=q[2],r=BR*s,cy=HY+(CH-BR)*s,i,an;if(bz-cz<40)return;
 x.fillStyle="rgba(0,0,0,.4)";x.beginPath();x.ellipse(q[0],q[1],r*.95,r*.3,0,0,6.3);x.fill();
 x.drawImage(BSP,q[0]-r*1.12,cy-r*1.12,r*2.24,r*2.24);x.fillStyle="rgba(0,0,0,.78)";
 for(i=0;i<3;i++){an=rot+i*2.1;x.beginPath();x.arc(q[0]+Math.cos(an)*r*.36,cy-r*.12+Math.sin(an)*r*.28,r*.13,0,6.3);x.fill()}}
function pill(cx,cy,w,h,col,txt){x.fillStyle=col;x.beginPath();x.moveTo(cx-w/2+h/2,cy-h/2);x.lineTo(cx+w/2-h/2,cy-h/2);x.arc(cx+w/2-h/2,cy,h/2,-1.5708,1.5708);x.lineTo(cx-w/2+h/2,cy+h/2);x.arc(cx-w/2+h/2,cy,h/2,1.5708,4.7124);x.closePath();x.fill();x.fillStyle="#fff";x.font="bold 9px Roboto,Arial,sans-serif";x.fillText(txt,cx,cy+3.2)}
function drawHUD(){var i,sp=W/NP,pl,cx,cy=24;x.textAlign="center";
 for(i=0;i<NP;i++){pl=PL[i];cx=sp*(i+.5)-8;x.drawImage(AV[i],cx-15,cy-15,30,30);
  if(i===cur&&st!==5){x.strokeStyle=i===0?"#3da5ff":"#ffd08a";x.lineWidth=3;x.beginPath();x.arc(cx,cy,16.5,0,6.3);x.stroke()}
  x.fillStyle=i===0?"#2d7bff":"#e0364a";x.beginPath();x.arc(cx+17,cy-4,9,0,6.3);x.fill();x.fillStyle="#fff";x.font="bold 10px Roboto,Arial,sans-serif";x.fillText(String(pl.t||0),cx+17,cy-.5);
  x.font="9px Roboto,Arial,sans-serif";x.fillStyle="#fff";x.fillText(pl.n,cx,cy+26);
  if(i===cur&&st!==5)pill(cx,cy+39,58,13,i===0?"#2d7bff":"#c98a1e",i===0?"Tu turno":"Jugando")}
 x.textAlign="right";x.font="bold 10px Roboto,Arial,sans-serif";x.fillStyle="rgba(255,255,255,.9)";x.fillText("CUADRO "+Math.min(NF,fi+1)+"/"+NF,W-6,H-8);
 var fr=PL[cur]&&PL[cur].F[fi]||[],bx0=6,by0=H-40,j,bw=14;x.fillStyle="#ffcf4d";x.fillRect(bx0,by0,bw*3,10);x.fillStyle="#2a1004";x.textAlign="center";x.font="bold 8px Roboto,Arial,sans-serif";x.fillText(String(Math.min(NF,fi+1)),bx0+bw*1.5,by0+8);
 x.fillStyle="#fff7d6";x.fillRect(bx0,by0+10,bw*3,16);x.strokeStyle="#c9a24a";x.lineWidth=1;x.strokeRect(bx0+.5,by0+10.5,bw*3-1,15);x.fillStyle="#2a1004";x.font="bold 10px Roboto,Arial,sans-serif";
 for(j=0;j<cardM.length;j++)x.fillText(cardM[j],bx0+bw*(j+.5),by0+22);x.textAlign="left"}
function draw(){var i,o,c,sh=shk>.2?shk:0;x.setTransform(K,0,0,K,(sh?rn(-sh,sh):0)*K,(sh?rn(-sh,sh):0)*K);x.drawImage(BG,-4,-4,W+8,H+8);drawLane();
 for(i=0;i<FD.length;i++)drawPin(FD[i].p,FD[i].a);
 var ord=pins.slice().sort(function(a,b){return b.z-a.z});for(i=0;i<ord.length;i++)if(!ord[i].o)drawPin(ord[i]);
 if(ball&&ball.al)drawBall(ball.x,ball.z,ball.rot);
 else if(st===1)drawBall(sx,Z0,0);else if(st===4)drawBall(bxx,Z0,0);
 if(st===1){var gx=sx,gz=Z0,vx=Math.sin(ang),vz=Math.cos(ang),ha=hk*.003*(60/(5+8*pw));x.fillStyle="#fff";
  for(i=0;i<14;i++){gx+=vx*60;gz+=vz*60;if(gz>250){var cs=Math.cos(ha),sn=Math.sin(ha),nv=vx*cs+vz*sn;vz=-vx*sn+vz*cs;vx=nv}if(gz>ZH-30)break;var g=pj(gx,gz,0);x.globalAlpha=.85-i*.05;x.beginPath();x.arc(g[0],g[1],2.4*Math.max(.8,g[2]*.8),0,6.3);x.fill()}x.globalAlpha=1}
 x.setTransform(K,0,0,K,0,0);
 for(i=0;i<CF2.length;i++){c=CF2[i];x.fillStyle=c.c;x.fillRect(c.x,c.y,4,2.4+Math.abs(Math.sin(c.r))*2.4)}
 x.drawImage(VIG,0,0,W,H);drawHUD();
 if(tt>0){x.textAlign="center";x.font="bold "+(26*tts|0)+"px Roboto,Arial,sans-serif";x.lineWidth=5;x.strokeStyle="rgba(0,0,0,.8)";x.strokeText(toast,150,225);x.fillStyle="#ffd08a";x.fillText(toast,150,225);x.textAlign="left"}}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
 if(!document.hidden&&st>0){var k=dt*60,i,c;tm+=dt;if(tt>0){tt-=dt;tts+=(1-tts)*.2}
  if(st===2){var kk=(ball&&ball.al&&ball.z>ZH-90&&ball.z<ZH+40)?k*.5:k;phys(kk);tcz=ball&&ball.al?Math.min(ball.z-200,560):tcz}
  else if(st===4){bt+=dt;bxx+=(bpl.x0-bxx)*Math.min(1,.08*k);if(bt>1.3){throwBall(bpl.x0,bpl.a,bpl.p,bpl.h)}}
  cz+=(tcz-cz)*Math.min(1,(st===2?.35:.12)*k);shk*=Math.pow(.85,k);
  for(i=FD.length-1;i>=0;i--){FD[i].a-=dt*1.6;if(FD[i].a<=0)FD.splice(i,1)}
  for(i=CF2.length-1;i>=0;i--){c=CF2[i];c.x+=c.vx*k;c.y+=c.vy*k;c.vy+=.02*k;c.r+=.2*k;if(c.y>H)CF2.splice(i,1)}
  draw()}requestAnimationFrame(loop)}
var dragS=null;
function xAt(e){var r=cv.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height;return[mx,my]}
cv.addEventListener("pointerdown",function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(z){}if(st!==1)return;var p=xAt(e);dragS={x:p[0],y:p[1],t:Date.now(),m:false};if(p[1]>250){var s=F/(Z0-cz);sx=Math.max(-40,Math.min(40,(p[0]-150)/s))}});
cv.addEventListener("pointermove",function(e){e.preventDefault();if(!dragS||st!==1)return;var p=xAt(e),dx=p[0]-dragS.x,dy=p[1]-dragS.y;
 if(dy<-34){var ms=Math.max(30,Date.now()-dragS.t),v=Math.sqrt(dx*dx+dy*dy)/ms,a=Math.max(-.06,Math.min(.06,Math.atan2(dx,-dy)*.12));pw=Math.max(.4,Math.min(1,.4+(v-.25)*.9));setPw();ang=a;dragS=null;launch()}
 else if(Math.abs(dx)>Math.abs(dy)&&p[1]>250){var s=F/(Z0-cz);sx=Math.max(-40,Math.min(40,(p[0]-150)/s))}});
cv.addEventListener("pointerup",function(){dragS=null});cv.addEventListener("pointercancel",function(){dragS=null});
$("an1").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;sx=a==="c"?0:Math.max(-40,Math.min(40,sx+Number(a)*.8))});
$("an2").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;ang=a==="z"?0:Math.max(-.07,Math.min(.07,ang+Number(a)))});
function barAt(id,e){var r=$(id).getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))}
$("pw").addEventListener("pointerdown",function(e){e.preventDefault();pw=Math.max(.1,barAt("pw",e));setPw()});$("pw").addEventListener("pointermove",function(e){if(e.buttons){pw=Math.max(.1,barAt("pw",e));setPw()}});
$("ef").addEventListener("pointerdown",function(e){e.preventDefault();hk=Math.round((barAt("ef",e)*2-1)*10)/10;setEf()});$("ef").addEventListener("pointermove",function(e){if(e.buttons){hk=Math.round((barAt("ef",e)*2-1)*10)/10;setEf()}});
function sbRefresh(){if(!sbOpen)return;var h="",i,j,t,pl,cols="34px repeat("+NF+",minmax(0,1fr)) 36px";
 h='<div class="tb" style="grid-template-columns:'+cols+'"><i></i>';for(j=1;j<=NF;j++)h+="<i>"+j+"</i>";h+="<i>TOT</i></div>";
 for(i=0;i<NP;i++){pl=PL[i];t=calc(pl.F);h+='<div class="tb" style="grid-template-columns:'+cols+'"><div class="nm">'+pl.e+"</div>";
  for(j=0;j<NF;j++)h+='<div class="fc"><span>'+(pl.F[j]?marks(pl.F[j],j):"")+"</span><b>"+(t[j]===null||t[j]===undefined?"":t[j])+"</b></div>";h+='<div class="tt">'+lastTot(pl.F)+"</div></div>"}
 $("sbv").innerHTML=h}
$("sbb").addEventListener("click",function(){sbOpen=!sbOpen;$("sbv").style.display=sbOpen?"block":"none";$("sbb").textContent=sbOpen?"✖ CERRAR PUNTUACIÓN":"📋 VER PUNTUACIÓN COMPLETA";sbRefresh()});
$("kb").addEventListener("click",launch);$("go").addEventListener("click",start);$("ag").addEventListener("click",start);$("ch").addEventListener("click",toCfg);$("mb").addEventListener("click",toCfg);
LG=null;
(function(){var g=x.createLinearGradient(0,HY,0,H);g.addColorStop(0,"rgba(0,0,0,0)");LG="#888"})();
hDeco(HW?[["🕷️","hsw hth",46,"top:30px",3.4,0,22],["🕷️","hsw hth",72,"top:56px",4,1.5,18],["🦇","hfy",0,"top:38%",11,0,20],["🎃","hfl",3,"bottom:2%",4,1,28],["👻","hfl",88,"top:52%",5,0,26],["🦇","hfy",0,"top:72%",14,6,16],["🎃","hfl",90,"bottom:2%",5,2,24],["🕸️","",0,"top:0",1,0,44],["🕸️","",88,"top:0",1,0,44],["🌕","hfl",78,"bottom:9%",12,0,34]]:[]);if(HW)$("tt").textContent="🎃 BOLOS EMBRUJADOS";
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".bolos", ".boliche"],
  desc: "Bolos en primera persona: 2, 4 o 6 jugadores con bots, strikes, spares y puntuación",
  category: "Juegos",
  usage: ".bolos",
  handler: async ({ sock, from, msg, sender }) => {
    try {
      await enviarJuego({ sock, from, msg, sender, juego: "bolos10", variantes: ["bolos10","bolos5"], html: GAME_HTML });
    } catch (e) {
      console.log("[BOLOS] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
