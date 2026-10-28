import { enviarJuego } from "../motores/juegos-html.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#06120a;color:#e9ffee;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #5bd36a;border-radius:28px;background:radial-gradient(circle at 50% 0,#12401f,#07150c);box-shadow:0 0 24px #5bd36a33}
small{display:block;font-size:10px;letter-spacing:3px;color:#5bd36a}
h1{margin:4px 0 6px;font-size:30px;line-height:1.05}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#8bc99b;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#7dff98}
.o{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ch{height:48px;border-radius:12px;border:2px solid #25472f;background:#0a1d12;color:#d3f5dc;font:bold 13px Roboto,Arial,sans-serif;padding:0 4px;overflow:hidden}
.ch.on{border-color:#7dff98;box-shadow:0 0 10px #7dff9855;background:#12301c}
#pv{display:block;width:64px;height:64px;margin:0 auto 8px}
.go,.bt{display:block;width:100%;height:52px;margin-top:14px;border-radius:14px;border:2px solid #5bd36a;background:#0d2c18;color:#7dff98;font:bold 15px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#4be36a,#d6ff5a);color:#06240f}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:10px 0}
.hud div{text-align:center;border:2px solid #2f9a4d;border-radius:14px;padding:6px 1px;font-size:9px;letter-spacing:1px;color:#8bc99b;background:#0b2415;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:19px;color:#c9ff6a}#h3{font-size:14px;letter-spacing:-1px;line-height:1.35}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#041009ee;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ff6a6a}#ov span{font-size:14px;color:#a6e8b6;margin-bottom:6px}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
.hint{text-align:center;font-size:12px;color:#a6e8b6;margin:10px 0 0}
.pb{height:22px;margin:12px 0 0;border-radius:11px;background:#0b2415;overflow:hidden}.pb div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#72ff8a,#ffe14d,#ff5a5a)}
.an{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:10px}.an .bt{margin:0;height:50px;font-size:15px;padding:0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#7fae8c}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small,.sr .brand{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #5bd36a;background:#0d2c18;font-size:16px;line-height:1;padding:0;color:#fff}
body{--ac:#7dff98;--cd:#0a1d12;--mu:#8bc99b}
body.hwon{--ac:#ff9a1f;--cd:#2a1450;--mu:#d2a8e8;background:#07030f}
.m{padding:12px;position:relative;overflow:hidden}.m>*:not(.hwfx){position:relative;z-index:1}
h1{font-size:22px;margin:2px 0 4px}
.d{margin:6px 0 0;font-size:15px}.sub{font-size:11px;margin-bottom:0}
h3{margin:9px 0 5px;font-size:11px}
.hp{display:flex;align-items:center;justify-content:space-between}
#pv{width:34px;height:34px;margin:0}
.o{gap:6px}#o0{grid-template-columns:repeat(3,minmax(0,1fr))}#o1,#o2,#o3{grid-template-columns:repeat(4,minmax(0,1fr))}
.ch{height:40px;font-size:11px;line-height:1.08;padding:0 2px;border-radius:10px;white-space:normal}
.go,.bt{height:46px;margin-top:10px;font-size:14px}
.hud{margin:6px 0;gap:5px}.hud div{padding:3px 1px}.hud b{font-size:16px}#h3{font-size:12px}
.pb{height:15px;margin:8px 0 0}
.an{margin-top:6px;gap:5px}.an .bt{height:38px;font-size:14px;margin:0}
.kr{display:flex;gap:6px;margin-top:6px}.kr .go{margin:0;flex:1;height:46px}.kr .bt{margin:0;width:92px;height:46px;font-size:11px;flex:none;padding:0}
.hint{font-size:10.5px;margin:6px 0 0}.foot{padding:8px 0 0}
.hwfx{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;display:none}
body.hwon .hwfx{display:block}.hwfx i{position:absolute;font-style:normal;line-height:1}
@keyframes hfy{0%{transform:translate3d(-16vw,0,0)}50%{transform:translate3d(48vw,-14px,0)}100%{transform:translate3d(116vw,6px,0)}}
@keyframes hfl{0%,100%{transform:translate3d(0,0,0) rotate(-5deg)}50%{transform:translate3d(0,-11px,0) rotate(5deg)}}
@keyframes hsw{0%,100%{transform:rotate(-13deg)}50%{transform:rotate(13deg)}}
.hfy{animation:hfy linear infinite}.hfl{animation:hfl ease-in-out infinite}.hsw{animation:hsw ease-in-out infinite;transform-origin:50% -40px}
.hth::before{content:"";position:absolute;left:50%;bottom:100%;width:1px;height:90px;background:rgba(255,255,255,.5)}
body.hwlo .hwfx i:nth-of-type(n+6){display:none}
@media (prefers-reduced-motion:reduce){.hwfx i{animation:none!important}}
body.hwon .m{border-color:#ff7a1a;background:radial-gradient(circle at 50% 0,#4a1a5e,#0a0414 70%);box-shadow:0 0 26px #ff7a1a44}
body.hwon small,body.hwon h3{color:#ff9a1f}
body.hwon .ch{border-color:#4a2670;background:#1a0b2c;color:#f3e3ff}
body.hwon .ch.on{border-color:#ff9a1f;box-shadow:0 0 10px #ff9a1f66;background:#2e1250}
body.hwon .go{background:linear-gradient(90deg,#ff7a1a,#ffb04a);color:#1a0a22}
body.hwon .bt{border-color:#ff7a1a;background:#2a1046;color:#ffb04a}
body.hwon .hud div{border-color:#7a3ff0;background:#14082a;color:#c9a0dd}body.hwon .hud b{color:#ff9a1f}
body.hwon .pb{background:#14082a}body.hwon #ov{background:#0a0414ee}body.hwon .sd{border-color:#ff7a1a;background:#2a1046}
body.hwon .hint,body.hwon .sub{color:#c9a0dd}

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
</style></head><body><div class="m"><div class="hwfx" id="hwfx"></div><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1 id="tt">⚽ POU PENALES</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Elige cómo quieres jugar</div>
<h3>🌤️ AMBIENTE</h3><div class="o" id="o0"></div>
<h3 class="hp">⚽ PELOTA<canvas id="pv" width="96" height="96"></canvas></h3><div class="o" id="o1"></div>
<h3>✨ ESTILO</h3><div class="o" id="o2"></div>
<h3>🔥 DIFICULTAD</h3><div class="o" id="o3"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button><div id="mpr"></div></div>
<div id="gm" style="display:none"><div class="hud"><div>PUNTOS<b id="h0">0</b></div><div>RÉCORD<b id="h1">0</b></div><div>NIVEL<b id="h2">1</b></div><div>VIDAS<b id="h3">♥♥♥</b></div></div>
<div class="w"><canvas id="c" width="450" height="525"></canvas><div id="ov"><b>🏁 FIN DEL JUEGO</b><span id="ot"></span><div id="rk"></div><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<div class="pb" id="pb"><div id="pf"></div></div>
<div class="an" id="an"><button class="bt" data-a="-.12">◀◀</button><button class="bt" data-a="-.04">◀</button><button class="bt" data-a="t">🎯</button><button class="bt" data-a=".04">▶</button><button class="bt" data-a=".12">▶▶</button></div>
<div class="kr"><button class="go" id="kb">⚽ PATEAR</button><button class="bt" id="mb">⚙ AJUSTES</button></div>
<div class="hint" id="er" style="display:none;color:#ff8a7a"></div>
<div class="hint">Apunta con ◀ ▶, elige la fuerza en la barra y pulsa PATEAR · o desliza hacia arriba sobre el campo</div></div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
var GD=__DATA__,HW=!!GD.hw,LO=!!((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)),T0=Date.now(),PH=HW?16:0;
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
function hDeco(list){var f=document.getElementById("hwfx"),h="",i,a;if(!f)return;for(i=0;i<list.length;i++){a=list[i];h+='<i class="'+a[1]+'" style="left:'+a[2]+'%;'+a[3]+';font-size:'+a[6]+'px;animation-duration:'+a[4]+'s;animation-delay:-'+a[5]+'s">'+a[0]+'</i>'}f.insertAdjacentHTML("beforeend",h)}
MP.panel({ids:["pou"],lab:{},title:"🏆 TOP DEL BOT · MEJOR PUNTAJE"});document.getElementById("tp").innerHTML=MP.top("pou");
(function(){var o=document.getElementById("ov")||document.getElementById("rs"),g=document.getElementById("gm");if(o&&g&&o.parentNode!==g)g.appendChild(o)})();
var howT=0,howN=0;
function howl(){if(snd<1||document.hidden)return;var c=au();if(!c)return;var n=Date.now();if(n-(TL.hw||0)<6000)return;TL.hw=n;
 var s=c.currentTime,o=c.createOscillator(),o2=c.createOscillator(),lf=c.createOscillator(),lg=c.createGain(),a=c.createGain(),f=c.createBiquadFilter(),F=[[0,250],[.9,560],[2.1,540],[3.2,290]],i;
 o.type="sawtooth";o2.type="triangle";o.frequency.setValueAtTime(F[0][1],s);o2.frequency.setValueAtTime(F[0][1]*1.004,s);
 for(i=1;i<F.length;i++){o.frequency.exponentialRampToValueAtTime(F[i][1],s+F[i][0]);o2.frequency.exponentialRampToValueAtTime(F[i][1]*1.004,s+F[i][0])}
 lf.frequency.value=5.4;lg.gain.value=9;lf.connect(lg);lg.connect(o.frequency);lg.connect(o2.frequency);
 f.type="lowpass";f.frequency.value=1200;f.Q.value=3;
 a.gain.setValueAtTime(0,s);a.gain.linearRampToValueAtTime(.2,s+.55);a.gain.setValueAtTime(.2,s+2.2);a.gain.exponentialRampToValueAtTime(.0001,s+3.3);
 o.connect(f);o2.connect(f);f.connect(a);a.connect(MG);o.start(s);o2.start(s);lf.start(s);o.stop(s+3.4);o2.stop(s+3.4);lf.stop(s+3.4)}
function wolfPh(){var e=(Date.now()-howT)/1000;if(e<0)return 0;if(howN!==howT){howN=howT;if(st===1||st===3)howl()}
 if(e<.9)return e/.9;if(e<2.3)return 1;if(e<3.3)return 3.3-e;howT=Date.now()+(11+Math.random()*5)*1000;return 0}
function wolfDraw(){var ph=wolfPh(),X=x,i;X.save();X.translate(228,134);X.fillStyle="#060309";X.strokeStyle="rgba(255,130,90,.5)";X.lineWidth=.8;
 X.beginPath();X.moveTo(-26,2);X.lineTo(-18,-6);X.lineTo(2,-9);X.lineTo(20,-5);X.lineTo(28,2);X.closePath();X.fill();X.stroke();
 X.beginPath();X.moveTo(14,-8);X.quadraticCurveTo(28,-8,26,-20);X.quadraticCurveTo(20,-12,12,-12);X.closePath();X.fill();X.stroke();
 X.beginPath();X.ellipse(7,-13,9,8,0,0,6.3);X.fill();X.stroke();
 X.beginPath();X.moveTo(0,-20);X.lineTo(-9,-22);X.lineTo(-13,-12);X.lineTo(-9,-4);X.lineTo(3,-4);X.closePath();X.fill();X.stroke();X.fillRect(-12,-12,3.2,10);
 X.translate(-8,-19);X.rotate(ph*1.1);
 X.beginPath();X.moveTo(2,4);X.lineTo(5,-6);X.lineTo(-7,-9);X.lineTo(-9,2);X.closePath();X.fill();X.stroke();
 X.beginPath();X.ellipse(-8,-8,6,4.6,0,0,6.3);X.fill();X.stroke();
 X.beginPath();X.moveTo(-12,-11);X.lineTo(-25,-9);X.lineTo(-25,-7);X.lineTo(-12,-5);X.closePath();X.fill();X.stroke();
 X.beginPath();X.moveTo(-12,-5);X.lineTo(-24,-6+ph*5);X.lineTo(-23,-3+ph*5);X.lineTo(-11,-3);X.closePath();X.fill();
 X.beginPath();X.moveTo(-9,-12);X.lineTo(-7,-19);X.lineTo(-4,-12);X.closePath();X.fill();X.stroke();
 if(ph>.35){X.strokeStyle="rgba(255,235,200,"+(.55*ph)+")";X.lineWidth=1.2;for(i=0;i<3;i++){X.beginPath();X.arc(-26,-8,5+i*5+ph*3,2.5,3.8);X.stroke()}}
 X.restore()}
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
function mDino(i,t){var b=[45,45,52,45,47,47,54,47][i%8],m=[69,72,76,72,71,74,77,74][(i>>1)%8];nt(hz(b),t,.16,"triangle",.5);if(i%2===0)nt(hz(m),t,.14,"square",.22);if(i%4===3)nt(hz(m+7),t+.09,.08,"square",.14)}
function mNeon(i,t){var b=[36,36,39,36,34,34,38,34][(i>>1)%8];nt(hz(b),t,.2,"sawtooth",.34);if(i%2===1)nt(hz([60,63,67,70][(i>>1)%4]),t,.12,"square",.16);if(i%8===0)nt(hz(72),t,.5,"triangle",.2)}
function mCR(i,t){var s=[60,62,64,67,69,72,69,67][i%8];if(i%2===0)nt(hz(s-12),t,.14,"triangle",.4);nt(hz(s+12*((i>>3)%2)),t,.1,"square",.17)}
function mGolf(i,t){var s=[60,64,67,72,67,64,62,65,69,74,69,65][i%12];nt(hz(s),t,.5,"triangle",.3);if(i%4===0)nt(hz(s-24),t,.9,"sine",.4)}
function mPou(a){var sc=a===5?[48,49,54,55,60,61]:a===1||a===4?[57,60,64,67,69]:a===2?[57,60,62,65,69]:[60,64,67,72,76];
 return function(i,t){var n=sc[(i*3+(i>>2))%sc.length],ty=a===5?"sine":a===3?"square":"triangle";
  if(a===5){if(i%8===0){nt(hz(36),t,2.4,"sine",.5);nt(hz(42),t,2.4,"sine",.35)}if(i%5===0)nt(hz(n+12),t,1.2,"sine",.2)}
  else{nt(hz(n),t,a===1||a===4?.8:.3,ty,a===3?.22:.3);if(i%4===0)nt(hz(sc[0]-12),t,.6,"sine",.4)}}}
function mGus(i,t){if(i%2===0)nt(55,t,.14,"sine",.7);nt(hz([43,43,46,43,41,41,44,41][i%8]+12),t,.1,"square",.16);if(i%4===2)nt(hz(67+(i%16>8?5:0)),t,.07,"sawtooth",.12)}
function mSnk(i,t){var s=[60,62,64,67,64,62,67,69][i%8];nt(hz(s),t,.12,"square",.2);if(i%4===0)nt(hz(s-12),t,.2,"triangle",.4)}

var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_pou_best",CK="mp_pou_cfg";
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
var AM=[["🌤️","Día"],["🌙","Noche"],["🌧️","Lluvia"],["☀️","Soleado"],["🌓","Media luna"],["🌕","Luna llena · terror"]];
var BL=[["⚽","Fútbol"],["🏀","Basket"],["🏐","Voley"],["🎾","Tenis"]],SL=[["⚪","Normal"],["💠","Neón"],["🔥","Fuego"],["🌈","Arcoíris"]];
var DF=[["🟢","Fácil",{n:70,sp:130,rt:.32,d:.3}],["🔵","Normal",{n:48,sp:180,rt:.24,d:.45}],["🟣","Difícil",{n:28,sp:230,rt:.17,d:.65}],["🔴","Pesadilla",{n:10,sp:300,rt:.1,d:.85}]];
var LS=[AM,BL,SL,DF],S=[0,0,0,1];
try{if(HW&&!localStorage.getItem(CK))S[0]=5}catch(e){}
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===4&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S=c0}catch(e){}
function pent(q,cx,cy,r){q.beginPath();for(var i=0;i<5;i++){var a=i*1.2566-1.5708;q.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}q.closePath();q.fill()}
var BS={};
function ballSpr(t,s){var key=t*4+s;if(BS[key])return BS[key];var a=cvs(40,40),q=a[1],i,an;q.translate(20,20);
 if(s===1){q.shadowColor="#22f5ff";q.shadowBlur=9}else if(s===2){q.shadowColor="#ff7a1a";q.shadowBlur=9}
 q.beginPath();q.arc(0,0,14,0,6.3);q.fillStyle=t===1?"#ea7a2f":t===3?"#d9f23c":HW?"#ff9a2a":"#f7f7f7";q.fill();q.shadowBlur=0;q.strokeStyle="#9a9a9a";q.lineWidth=1;q.stroke();
 q.save();q.clip();q.strokeStyle=q.fillStyle="#222";q.lineWidth=1.6;
 if(t===0){pent(q,0,0,5.5);for(i=0;i<5;i++){an=i*1.2566-1.5708;pent(q,Math.cos(an)*14,Math.sin(an)*14,5.5);q.beginPath();q.moveTo(Math.cos(an)*5.5,Math.sin(an)*5.5);q.lineTo(Math.cos(an)*9,Math.sin(an)*9);q.stroke()}}
 else if(t===1){q.beginPath();q.moveTo(-14,0);q.lineTo(14,0);q.moveTo(0,-14);q.lineTo(0,14);q.stroke();q.beginPath();q.arc(-15,0,10,-1.2,1.2);q.stroke();q.beginPath();q.arc(15,0,10,Math.PI-1.2,Math.PI+1.2);q.stroke()}
 else if(t===2){q.lineWidth=5;q.strokeStyle="#2d6fd6";q.beginPath();q.moveTo(-14,-6);q.lineTo(14,-14);q.stroke();q.strokeStyle="#ffd23f";q.beginPath();q.moveTo(-14,4);q.lineTo(14,-4);q.stroke();q.strokeStyle="#2d6fd6";q.beginPath();q.moveTo(-14,14);q.lineTo(14,6);q.stroke()}
 else{q.strokeStyle="#fff";q.lineWidth=2.2;q.beginPath();q.arc(-13,0,11,-1.1,1.1);q.stroke();q.beginPath();q.arc(13,0,11,Math.PI-1.1,Math.PI+1.1);q.stroke()}
 q.restore();
 if(s>0){q.globalCompositeOperation="source-atop";q.globalAlpha=.32;if(s===3){var g=q.createLinearGradient(-14,-14,14,14);g.addColorStop(0,"#ff3d6e");g.addColorStop(.35,"#ffe14d");g.addColorStop(.65,"#3dff9c");g.addColorStop(1,"#3d8bff");q.fillStyle=g}else q.fillStyle=s===1?"#22f5ff":"#ff5a1f";q.fillRect(-20,-20,40,40)}
 BS[key]=a[0];return a[0]}
function pouSpr(f,red){var a=cvs(60,56+PH),q=a[1],i,ex,g;q.translate(0,PH);
 g=q.createRadialGradient(22,20,3,30,32,34);g.addColorStop(0,"#cf9a58");g.addColorStop(.6,"#a8692b");g.addColorStop(1,"#7e4a1d");
 q.fillStyle=g;q.strokeStyle="#5e3612";q.lineWidth=2;q.lineJoin="round";q.beginPath();q.moveTo(30,4);
 q.bezierCurveTo(42,3,53,11,55,24);q.bezierCurveTo(58,37,55,49,43,53);q.bezierCurveTo(37,55,23,55,17,53);q.bezierCurveTo(5,49,2,37,5,24);q.bezierCurveTo(7,11,18,3,30,4);q.closePath();q.fill();q.stroke();
 q.fillStyle="rgba(70,38,12,.38)";[[13,41,2.6,1.7,.4],[46,17,2.4,1.6,-.5],[41,45,2.8,1.8,.2],[11,26,2.2,1.5,-.3],[34,9,2.4,1.5,0],[48,34,2,1.4,.6]].forEach(function(p){q.beginPath();q.ellipse(p[0],p[1],p[2],p[3],p[4],0,6.3);q.fill()});
 q.fillStyle="rgba(255,255,255,.2)";q.beginPath();q.ellipse(19,14,6,3.2,-.6,0,6.3);q.fill();
 q.fillStyle="rgba(255,120,110,.22)";q.beginPath();q.ellipse(13,37,4.2,2.8,0,0,6.3);q.ellipse(47,37,4.2,2.8,0,0,6.3);q.fill();
 for(i=0;i<2;i++){ex=21+i*18;q.fillStyle="#fff";q.strokeStyle="#5e3612";q.lineWidth=1.3;q.beginPath();q.arc(ex,27,7.6,0,6.3);q.fill();q.stroke();
  q.fillStyle=red?"#ff2a2a":"#111";q.beginPath();q.arc(ex+(f===1?0:1.2),27+(f===2?2.4:(f===1?-2.4:.4)),3.4,0,6.3);q.fill();q.fillStyle="#fff";q.beginPath();q.arc(ex+(f===1?-1:0),25.4+(f===2?2:(f===1?-2:0)),1,0,6.3);q.fill()}
 q.strokeStyle="#4a2a0c";q.lineWidth=1.9;q.lineCap="round";q.beginPath();
 if(f===2){q.moveTo(15,17);q.lineTo(26,19.5);q.moveTo(45,17);q.lineTo(34,19.5)}else if(f===1){q.moveTo(15,15.5);q.quadraticCurveTo(21,12,27,15);q.moveTo(33,15);q.quadraticCurveTo(39,12,45,15.5)}else{q.moveTo(15,18);q.quadraticCurveTo(21,15,27,17.5);q.moveTo(33,17.5);q.quadraticCurveTo(39,15,45,18)}
 q.stroke();
 q.strokeStyle="#4a2a0c";q.lineWidth=1.9;q.beginPath();
 if(f===1){q.fillStyle="#5a2a12";q.ellipse(30,41,6,4.6,0,0,6.3);q.fill();q.fillStyle="#e8707a";q.beginPath();q.ellipse(30,43.4,3.4,1.7,0,0,6.3);q.fill()}else if(f===2){q.arc(30,47,6,3.6,5.8);q.stroke()}else{q.arc(30,38,6,.3,2.84);q.stroke()}
 if(HW){ // sombrero de bruja
  q.fillStyle="#241042";q.strokeStyle="#0e041c";q.lineWidth=1.2;q.beginPath();q.moveTo(17,9);q.quadraticCurveTo(26,6,28,-8);q.quadraticCurveTo(34,-17,39,-14);q.quadraticCurveTo(36,-8,40,9);q.closePath();q.fill();q.stroke();
  q.beginPath();q.ellipse(30,9,20,4.6,-.05,0,6.3);q.fill();q.stroke();
  q.fillStyle="#ff7a1a";q.beginPath();q.moveTo(19,4);q.lineTo(39,4.5);q.lineTo(39.5,8);q.lineTo(18.5,7.6);q.closePath();q.fill();q.fillStyle="#ffe14d";q.fillRect(26.5,3.6,6,4.6);q.fillStyle="#241042";q.fillRect(28,5,3,1.8)}
 return a[0]}
function pine(q,x,y,h,c){q.fillStyle=c;for(var j=0;j<3;j++){var w=h*.38*(1-j*.22),yy=y-h*.33*j;q.beginPath();q.moveTo(x-w,yy);q.lineTo(x,yy-h*.5);q.lineTo(x+w,yy);q.fill()}q.fillRect(x-2,y,4,5)}
var SKY=HW?[["#5a2a8a","#ffb27a"],["#080214","#2a0e48"],["#2a2a3a","#6a5a7a"],["#7a2a7a","#ffc27a"],["#0a0420","#3a1a5a"],["#0b0006","#5a1220"]]:[["#4aa8ff","#c9ecff"],["#040a22","#1a2a66"],["#56606b","#a3adb7"],["#1b9bff","#a8e6ff"],["#0a1030","#2a3a86"],["#0b0006","#5a1220"]];
var GRS=HW?[["#274a2c","#2e5a34"],["#142a30","#183640"],["#22383c","#2a4448"],["#2f5a2e","#386a36"],["#142633","#193044"],["#16301a","#1a3a1e"]]:[["#2fb24a","#37c255"],["#0f4d2a","#126030"],["#2c6b4a","#347a54"],["#4cc23a","#58d046"],["#0f3f2a","#14512f"],["#16301a","#1a3a1e"]];
var TRC=["#1f9a3a","#0a2a1c","#2a5a3c","#26a63a","#0b2a2a"];
function bake(a){var b=cvs(W,H),q=b[1],i,g,y;
 g=q.createLinearGradient(0,0,0,200);g.addColorStop(0,SKY[a][0]);g.addColorStop(1,SKY[a][1]);q.fillStyle=g;q.fillRect(0,0,W,200);
 if(a===1||a===4||a===5){q.fillStyle="#fff";for(i=0;i<60;i++){q.globalAlpha=.35+Math.random()*.65;q.fillRect(Math.random()*W,Math.random()*140,1.3,1.3)}q.globalAlpha=1}
 if(a===3){g=q.createRadialGradient(235,50,4,235,50,90);g.addColorStop(0,"#fffbd0");g.addColorStop(.25,"rgba(255,240,160,.8)");g.addColorStop(1,"rgba(255,224,96,0)");q.fillStyle=g;q.fillRect(0,0,W,200);q.fillStyle="#fff8c0";q.beginPath();q.arc(235,50,22,0,6.3);q.fill()}
 if(a===1){q.fillStyle="#f4f1d6";q.beginPath();q.arc(235,48,13,0,6.3);q.fill();q.fillStyle="#d8d4b0";q.beginPath();q.arc(231,45,3,0,6.3);q.fill();q.beginPath();q.arc(240,52,2.2,0,6.3);q.fill()}
 if(a===4){g=q.createRadialGradient(225,62,10,225,62,80);g.addColorStop(0,"rgba(255,242,184,.27)");g.addColorStop(1,"rgba(255,242,184,0)");q.fillStyle=g;q.fillRect(140,0,160,160);var m=cvs(80,80);m[1].fillStyle="#fff2b8";m[1].beginPath();m[1].arc(40,40,30,0,6.3);m[1].fill();m[1].globalCompositeOperation="destination-out";m[1].beginPath();m[1].arc(53,34,26,0,6.3);m[1].fill();q.drawImage(m[0],185,22,80,80)}
 if(a===5){g=q.createRadialGradient(150,88,30,150,88,125);g.addColorStop(0,"rgba(255,74,42,.8)");g.addColorStop(1,"rgba(255,74,42,0)");q.fillStyle=g;q.fillRect(0,0,W,200);g=q.createRadialGradient(145,82,6,150,88,46);g.addColorStop(0,"#ffe6c0");g.addColorStop(1,"#ff9a62");q.fillStyle=g;q.beginPath();q.arc(150,88,46,0,6.3);q.fill();q.fillStyle="rgba(120,40,20,.28)";q.beginPath();q.arc(132,74,9,0,6.3);q.fill();q.beginPath();q.arc(165,100,12,0,6.3);q.fill();q.beginPath();q.arc(158,68,5,0,6.3);q.fill()}
 for(y=190,i=0;y<H;y+=22,i++){q.fillStyle=GRS[a][i%2];q.fillRect(0,y,W,22)}
 if(a===5||HW){q.strokeStyle="#050205";q.lineCap="round";for(i=-1;i<9;i++){var tx=i*38+((i*37)%13),th=60+((i*53)%25);q.lineWidth=4;q.beginPath();q.moveTo(tx,198);q.lineTo(tx+3,198-th);q.stroke();q.lineWidth=2;q.beginPath();q.moveTo(tx+2,198-th*.45);q.lineTo(tx-16,198-th*.7);q.moveTo(tx+2,198-th*.62);q.lineTo(tx+17,198-th*.9);q.moveTo(tx+3,198-th);q.lineTo(tx-8,198-th-14);q.moveTo(tx+3,198-th);q.lineTo(tx+10,198-th-12);q.stroke()}}
 else for(i=-1;i<12;i++)pine(q,i*28+((i*37)%11),196,36+((i*53)%17),TRC[a]);
 q.fillStyle="rgba(0,0,0,.14)";q.fillRect(41,209,218,76);q.strokeStyle="rgba(255,255,255,.4)";q.lineWidth=.8;q.beginPath();
 for(i=41;i<=259;i+=9){q.moveTo(i,209);q.lineTo(i,285)}for(i=209;i<=285;i+=9){q.moveTo(41,i);q.lineTo(259,i)}q.stroke();
 if(HW){q.strokeStyle="rgba(255,255,255,.42)";q.lineWidth=.8;q.beginPath();q.moveTo(41,209);q.lineTo(130,285);q.moveTo(41,209);q.lineTo(210,285);q.moveTo(259,209);q.lineTo(170,285);q.moveTo(259,209);q.lineTo(90,285);for(i=1;i<5;i++){q.moveTo(41+i*22,209);q.arc(41,209,i*22,0,1.57);q.moveTo(259,209+i*22);q.arc(259,209,i*22,1.57,3.14)}q.stroke()}
 q.strokeStyle=HW?"#ff9a1f":"#fff";q.lineWidth=7;q.lineCap="round";q.lineJoin="round";q.beginPath();q.moveTo(37.5,287);q.lineTo(37.5,205);q.lineTo(262.5,205);q.lineTo(262.5,287);q.stroke();
 if(a===3){q.fillStyle="rgba(255,214,120,.1)";q.fillRect(0,0,W,H)}
 if(a===2){q.fillStyle="rgba(24,38,56,.3)";q.fillRect(0,0,W,H)}
 if(a===5){g=q.createRadialGradient(150,200,90,150,200,260);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.65)");q.fillStyle=g;q.fillRect(0,0,W,H)}
 return b[0]}
function cloudSpr(){var a=cvs(70,28),q=a[1];q.fillStyle=HW?"rgba(90,60,130,.85)":"rgba(255,255,255,.92)";q.beginPath();q.ellipse(35,18,30,8,0,0,6.3);q.ellipse(24,13,14,10,0,0,6.3);q.ellipse(42,11,16,11,0,0,6.3);q.fill();return a[0]}
function fogSpr(){var a=cvs(W,60),q=a[1],i,g,xs=[30,110,190,270];for(i=0;i<8;i++){var cx=xs[i%4]+(i>3?-W:0)+(i%2?20:0);g=q.createRadialGradient(cx,30,2,cx,30,70);g.addColorStop(0,"rgba(200,190,210,.3)");g.addColorStop(1,"rgba(200,190,210,0)");q.fillStyle=g;q.fillRect(cx-70,0,140,60)}return a[0]}
var cv=$("c"),x=cv.getContext("2d");x.scale(K,K);x.translate(0,-34);
var bg,PS=[],CL,FG,rain=[],clouds=[],bats=[],tw=[],trail=[],fl=null,st=0,amb=0,score=0,best=Math.max(ld(KEY),MP.V("pou").rec||0),lives=3,lvl=1,pox=150,face=0,ptx=150,pspd=0,pouGo=0,rt=0,msg="",mcol="#fff",mt=0,last=0,tm=0,drag=null,gdx=0,gdy=0,spr,tcol,hc=["","","",""],BL_=0,fog=0;
var aimA=0,pw=.55,BP=[0,0,0];
function put(i,t){if(hc[i]!==t){hc[i]=t;$("h"+i).textContent=t}}
function hud(){put(0,String(score));put(1,String(best));put(2,String(lvl));put(3,"♥♥♥".slice(0,lives)||"–")}
function prev(){var p=$("pv").getContext("2d");p.clearRect(0,0,96,96);p.drawImage(ballSpr(S[1],S[2]),0,0,96,96)}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"");if(k===1||k===2)prev()})}
for(var k0=0;k0<4;k0++)chips(k0);prev();
function start(){T0=Date.now();howT=Date.now()+2500;howN=0;$("rk").innerHTML="";fx("s",0,520,.1,"sine",.08,780);amb=S[0];sv(CK,S.join(","));bg=bake(amb);var red=amb===5;PS=[pouSpr(0,red),pouSpr(1,red),pouSpr(2,red)];spr=ballSpr(S[1],S[2]);CL=cloudSpr();FG=amb===5||HW?fogSpr():null;
 var i;rain=[];if(amb===2)for(i=0;i<55;i++)rain.push({x:Math.random()*W,y:Math.random()*H,v:380+Math.random()*160});
 clouds=[];if(amb===0||amb===3)for(i=0;i<3;i++)clouds.push({x:Math.random()*W,y:18+i*26,v:5+i*3});
 bats=[];if(amb===5||HW)for(i=0;i<(amb===5?5:4);i++)bats.push({x:Math.random()*W,y:30+Math.random()*90,v:(Math.random()<.5?-1:1)*(25+Math.random()*25),p:Math.random()*6});
 tw=[];if(amb===1||amb===4||amb===5)for(i=0;i<16;i++)tw.push([Math.random()*W,Math.random()*150,Math.random()*6]);
 aimA=0;pw=.55;$("pf").style.transform="scaleX(.55)";score=0;lives=3;lvl=1;pox=150;face=0;fl=null;trail=[];msg="";mt=0;st=1;fog=0;hc=["","","",""];$("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";hud();mus(mPou(amb),[.3,.55,.5,.22,.6,.5][amb]);if(amb===2)ans(2200,.16);else if(amb===5)ans(260,.2);else ane()}
function toCfg(){st=0;mend();ane();$("gm").style.display="none";$("cfg").style.display="block"}
function over(){st=4;mend();ane();arp([392,370,349,311],.28,"sawtooth",.08);if(score>best){best=score;sv(KEY,best)}hud();$("ot").textContent=score+" puntos · récord "+best;MP.save("pou",score,Math.round((Date.now()-T0)/1000),$("rk"));$("ov").style.display="flex"}
function tgt(){var h=pw*1.1;return[150+Math.tan(aimA)*190,276-h*70,h]}
function launch(gx,gy,h){var D=DF[S[3]][2];fx("k",0,220,.12,"triangle",.1,520);nz("kk",0,.07,500,.3);
 fl={t:0,T:.62-.22*Math.min(1.2,h),gx:gx,gy:gy,h:h,dive:Math.random()<D.d,res:"",stick:false};
 ptx=Math.max(60,Math.min(240,gx+(Math.random()*2-1)*Math.max(6,D.n*(1-.04*(lvl-1)))));pspd=D.sp*(1+.05*(lvl-1));pouGo=D.rt;trail=[];st=2;drag=null}
function shoot(dx,dy,ms){var a=Math.max(-.75,Math.min(.75,Math.atan2(dx,-dy))),v=Math.sqrt(dx*dx+dy*dy)/Math.max(25,ms),h=Math.max(0,(v-.25)/.9);launch(150+Math.tan(a)*190,276-Math.min(1.3,h)*70,h)}
function kick(){if(st===1){var t=tgt();launch(t[0],t[1],t[2])}}
function resolve(){var gx=fl.gx,gy=fl.gy,dir=gx>pox?1:-1,px2=pox+(fl.dive?dir*Math.min(22,Math.abs(gx-pox)):0),r;
 if(gx<30||gx>270)r="fuera";else if(gy<202)r="encima";else if(Math.min(Math.abs(gx-37.5),Math.abs(gx-262.5))<8)r="poste";else if(gy<209)r="larguero";
 else if(Math.abs(px2-gx)<24&&(gy>=236||(fl.dive&&gy>=214)))r="atajada";else r="gol";
 fl.res=r;st=3;rt=1.1;mt=1.1;if(r==="gol"){nz("cr",0,.9,1400,.16,.6);arp([523,659,784,1047],.2,"triangle",.1)}
 else if(r==="atajada"){nz("sv",0,.12,500,.4);fx("r",0,260,.2,"sawtooth",.08,120,1);hurt()}
 else if(r==="poste"||r==="larguero"){fx("pg",0,1600,.5,"sine",.14,1500,1);fx("pg2",0,2400,.35,"sine",.06,2300,1);hurt()}
 else{fx("r",0,420,.5,"triangle",.1,170,1);hurt()}
 if(r==="gol"){var p=(Math.abs(gx-150)>85&&gy<238)?2:1;score+=p;var nl2=1+Math.floor(score/5);if(nl2>lvl)setTimeout(function(){arp([659,784,988],.15,"square",.08)},700);lvl=nl2;msg=p===2?(HW?"🎃 ¡GOLAZO! +2":"⭐ ¡GOLAZO! +2"):(HW?"¡GOOOL! 🎃":"¡GOOOL!");mcol="#c9ff6a";face=2;if(score>best){best=score;sv(KEY,best)}}
 else{lives--;face=r==="atajada"?1:0;fl.stick=r==="atajada";mcol=r==="atajada"?"#ffffff":"#ff9a8a";msg=r==="atajada"?(HW?"¡ATRAPADO! 👻":"¡ATAJADA!"):r==="poste"?"¡POSTE!":r==="larguero"?"¡LARGUERO!":r==="encima"?"¡POR ENCIMA!":"¡AFUERA!"}
 hud()}
function upd(dt){var i,o;tm+=dt;
 for(i=0;i<rain.length;i++){o=rain[i];o.y+=o.v*dt;o.x-=o.v*.18*dt;if(o.y>H){o.y=-10;o.x=Math.random()*(W+40)}}
 for(i=0;i<clouds.length;i++){o=clouds[i];o.x+=o.v*dt;if(o.x>W+10)o.x=-80}
 for(i=0;i<bats.length;i++){o=bats[i];o.x+=o.v*dt;o.p+=dt*14;if(o.x>W+20)o.x=-20;else if(o.x<-20)o.x=W+20}
 if(FG)fog=(fog+dt*6)%W;
 if(st===1)pox=150+Math.sin(tm*1.4)*16;
 else if(st===2){if(pouGo>0)pouGo-=dt;else{var dd=ptx-pox;pox+=(dd<0?-1:1)*Math.min(Math.abs(dd),pspd*dt)}
  fl.t+=dt/fl.T;if(trail.length>7||fl.t>1.05)trail.shift();else trail.push([fl.t,0]);
  if(fl.t>=1)resolve()}
 else if(st===3){rt-=dt;if(fl&&fl.res!=="gol"&&fl.res!=="atajada")fl.t+=dt/fl.T;if(mt>0)mt-=dt;if(rt<=0){if(lives<=0)over();else{st=1;fl=null;face=0;trail=[]}}}}
function ballPos(){var t=Math.min(fl.t,1.4),p=Math.min(t,1);if(fl.res==="gol")t=1;
 if(fl.stick){BP[0]=pox+(fl.dive?Math.sign(fl.gx-pox)*Math.min(22,Math.abs(fl.gx-pox)):0);BP[1]=262;BP[2]=8;return BP}
 BP[0]=150+(fl.gx-150)*t;BP[1]=350+(fl.gy-350)*t-Math.sin(Math.PI*p)*(8+34*fl.h);BP[2]=Math.max(3,14-7.5*t);return BP}
function draw(){var i,o;x.drawImage(bg,0,0,W,H);if(amb===5)wolfDraw();
 for(i=0;i<clouds.length;i++)x.drawImage(CL,clouds[i].x,clouds[i].y,70,28);
 for(i=0;i<tw.length;i++){o=tw[i];x.globalAlpha=.4+.6*Math.abs(Math.sin(tm*1.6+o[2]));x.fillStyle="#fff";x.fillRect(o[0],o[1],1.8,1.8)}x.globalAlpha=1;
 var u=0,dir=0,lg=0,rot=0,jp=0;
 if(fl&&fl.dive){u=st===2?Math.max(0,Math.min(1,(fl.t-.7)/.3)):1;dir=fl.gx>pox?1:-1;lg=dir*Math.min(22,Math.abs(fl.gx-pox))*u;rot=dir*.6*u;if(fl.gy<236)jp=22*u}
 x.save();x.translate(pox+lg,285-jp);x.rotate(rot);x.drawImage(PS[face],-30,-52-PH,60,56+PH);x.restore();
 if(fl){var bp=ballPos(),fadeA=fl.res&&fl.res!=="gol"&&fl.res!=="atajada"?Math.max(0,1-(fl.t-1)*2.5):1;
  if(S[2]>0&&!fl.stick)for(i=0;i<trail.length;i++){x.globalAlpha=.1+i*.06;x.fillStyle=S[2]===1?"#22f5ff":S[2]===2?(i%2?"#ff7a1a":"#ffd23f"):"hsl("+((i*50+tm*200)%360|0)+",90%,60%)";x.beginPath();x.arc(bp[0]-(fl.gx-150)*.04*(7-i),bp[1]+(7-i)*(350-fl.gy)*.012,bp[2]*(.35+i*.08),0,6.3);x.fill()}
  x.globalAlpha=fadeA;var s2=bp[2]*2*(40/28);x.drawImage(spr,bp[0]-s2/2,bp[1]-s2/2,s2,s2);x.globalAlpha=1}
 else{var rb=14*(40/28)*2;x.drawImage(spr,150-rb/2,350-rb/2,rb,rb);
  if(drag&&gdy<-8){var n=Math.min(8,Math.floor(Math.sqrt(gdx*gdx+gdy*gdy)/14)),dl=Math.sqrt(gdx*gdx+gdy*gdy);x.fillStyle="#fff";for(i=1;i<=n;i++){x.globalAlpha=1-i/(n+2);x.beginPath();x.arc(150+gdx/dl*i*14,350+gdy/dl*i*14,2.2,0,6.3);x.fill()}x.globalAlpha=1}
  if(st===1&&!(drag&&gdy<-8)){var tg=tgt(),okk=tg[0]>41&&tg[0]<259&&tg[1]>=209,n2=Math.floor(Math.sqrt((tg[0]-150)*(tg[0]-150)+(tg[1]-350)*(tg[1]-350))/18),tc=okk?"#c9ff6a":"#ff8a7a";
   x.fillStyle=tc;for(i=1;i<n2;i++){x.globalAlpha=.6-i/n2*.35;x.beginPath();x.arc(150+(tg[0]-150)*i/n2,350+(tg[1]-350)*i/n2,1.8,0,6.3);x.fill()}
   x.globalAlpha=.9;x.strokeStyle=tc;x.lineWidth=2;x.beginPath();x.arc(tg[0],tg[1],8,0,6.3);x.moveTo(tg[0]-12,tg[1]);x.lineTo(tg[0]-4,tg[1]);x.moveTo(tg[0]+4,tg[1]);x.lineTo(tg[0]+12,tg[1]);x.moveTo(tg[0],tg[1]-12);x.lineTo(tg[0],tg[1]-4);x.moveTo(tg[0],tg[1]+4);x.lineTo(tg[0],tg[1]+12);x.stroke();x.globalAlpha=1}}
 if(FG){x.globalAlpha=.9;x.drawImage(FG,fog,172,W,60);x.drawImage(FG,fog-W,172,W,60);x.globalAlpha=1;
  x.strokeStyle="#000";x.lineWidth=2;x.beginPath();for(i=0;i<bats.length;i++){o=bats[i];var f=Math.sin(o.p)*5;x.moveTo(o.x-9,o.y-f);x.quadraticCurveTo(o.x-4,o.y-3,o.x,o.y);x.quadraticCurveTo(o.x+4,o.y-3,o.x+9,o.y-f)}x.stroke()}
 if(rain.length){x.strokeStyle="rgba(210,230,255,.65)";x.lineWidth=1.2;x.beginPath();for(i=0;i<rain.length;i++){o=rain[i];x.moveTo(o.x,o.y);x.lineTo(o.x-2,o.y+9)}x.stroke()}
 if(mt>0){var sc=1+Math.min(.3,mt*.4);x.save();x.translate(150,120);x.scale(sc,sc);x.font="bold 30px Roboto,Arial,sans-serif";x.textAlign="center";x.lineWidth=5;x.strokeStyle="#000a";x.strokeText(msg,0,0);x.fillStyle=mcol;x.fillText(msg,0,0);x.restore()}}
var ERR=false;function er(e){if(ERR)return;ERR=true;var d=$("er");d.textContent="⚠ "+(e&&e.message||e);d.style.display="block"}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;if(!document.hidden&&st>0){try{upd(dt);draw()}catch(e){er(e)}}requestAnimationFrame(loop)}
function pt(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*350/r.height+34]}
cv.addEventListener("pointerdown",function(e){e.preventDefault();if(st!==1)return;try{cv.setPointerCapture(e.pointerId)}catch(z){}var p=pt(e);drag={x:p[0],y:p[1],t:Date.now()};gdx=0;gdy=0});
cv.addEventListener("pointermove",function(e){e.preventDefault();if(!drag)return;var p=pt(e);gdx=p[0]-drag.x;gdy=p[1]-drag.y;
 if(gdy<-34){var ms=Date.now()-drag.t,dx=gdx,dy=gdy;drag=null;gdx=gdy=0;if(st===1)shoot(dx,dy,ms)}});
function up(e){e.preventDefault();if(!drag)return;var dx=gdx,dy=gdy,ms=Date.now()-drag.t;drag=null;gdx=gdy=0;if(st===1&&dy<-14&&ms<900)shoot(dx,dy,ms)}
cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
$("kb").addEventListener("click",kick);
$("an").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;aimA=a==="t"?0:Math.max(-.75,Math.min(.75,aimA+Number(a)))});
function pwAt(e){var r=$("pb").getBoundingClientRect();pw=Math.max(.08,Math.min(1,(e.clientX-r.left)/r.width));$("pf").style.transform="scaleX("+pw+")"}
$("pb").addEventListener("pointerdown",function(e){e.preventDefault();pwAt(e)});$("pb").addEventListener("pointermove",function(e){if(e.buttons)pwAt(e)});
$("go").addEventListener("click",start);$("ag").addEventListener("click",start);$("ch").addEventListener("click",toCfg);$("mb").addEventListener("click",toCfg);
hDeco(HW?[["🕷️","hsw hth",44,"top:30px",3.4,0,22],["🕷️","hsw hth",72,"top:56px",4,1.5,18],["🦇","hfy",0,"top:30%",11,0,20],["🎃","hfl",3,"bottom:1%",4,1,26],["👻","hfl",90,"top:48%",5,0,24],["🦇","hfy",0,"top:66%",14,6,16],["🎃","hfl",90,"bottom:1%",5,2,22],["🕸️","",0,"top:0",1,0,44],["🕸️","",88,"top:0",1,0,44]]:[]);if(HW)$("tt").textContent="🎃 POU PENALES";
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".pou", ".penales"],
  desc: "Penales: patea la pelota y Pou intenta atajarla; elige ambiente, pelota y estilo",
  category: "Juegos",
  usage: ".pou",
  handler: async ({ sock, from, msg, sender }) => {
    try {
      await enviarJuego({ sock, from, msg, sender, juego: "pou", html: GAME_HTML });
    } catch (e) {
      console.log("[POU] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
