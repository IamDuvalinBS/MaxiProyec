import { enviarJuego } from "../motores/juegos-html.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
html,body{margin:0}button{font-family:inherit;cursor:pointer}
body{padding:0;background:#07050d;color:#f3e9ff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none;--ac:#ff4a3a;--cd:#1d0f1c;--mu:#b99ab4}
body.hwon{background:#07030f;--ac:#ff9a1f;--cd:#2a1450;--mu:#d2a8e8}
.card{position:relative;overflow:hidden;max-width:none;margin:0;padding:10px;border:3px solid #7a1f2b;border-radius:20px;box-sizing:border-box;background:linear-gradient(170deg,#241020,#0b0610 70%);box-shadow:0 0 26px #ff2a2a22}
body.hwon .card{border-color:#ff7a1a;background:linear-gradient(170deg,#3a1260,#0a0414 70%);box-shadow:0 0 30px #ff7a1a33}
.card>*:not(.hwfx){position:relative;z-index:1}
.hwfx{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;display:none}
body.hwon .hwfx{display:block}.hwfx i{position:absolute;font-style:normal;line-height:1}
@keyframes hfy{0%{transform:translate3d(-16vw,0,0)}50%{transform:translate3d(48vw,-14px,0)}100%{transform:translate3d(116vw,6px,0)}}
@keyframes hfl{0%,100%{transform:translate3d(0,0,0) rotate(-5deg)}50%{transform:translate3d(0,-11px,0) rotate(5deg)}}
@keyframes hsw{0%,100%{transform:rotate(-13deg)}50%{transform:rotate(13deg)}}
.hfy{animation:hfy linear infinite}.hfl{animation:hfl ease-in-out infinite}.hsw{animation:hsw ease-in-out infinite;transform-origin:50% -40px}
.hth::before{content:"";position:absolute;left:50%;bottom:100%;width:1px;height:90px;background:rgba(255,255,255,.5)}
body.hwlo .hwfx i:nth-of-type(n+6){display:none}
@media (prefers-reduced-motion:reduce){.hwfx i{animation:none!important}}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px}
small{font-size:10px;letter-spacing:3px;color:var(--ac);font-weight:900}
.sd{flex:none;width:36px;height:36px;border-radius:11px;border:2px solid var(--ac);background:var(--cd);font-size:16px;line-height:1;padding:0;color:#fff}
h1{margin:4px 0 8px;font-size:clamp(15px,8.2vw,26px);line-height:1.05;letter-spacing:0;overflow-wrap:anywhere;text-shadow:0 0 14px var(--ac)}
.hud{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
.hud div{text-align:center;border:2px solid var(--ac);border-radius:13px;padding:5px 0;font-size:clamp(6px,2.7vw,9px);letter-spacing:.2px;color:var(--mu);background:var(--cd);font-weight:900;overflow:hidden;white-space:nowrap;min-width:0}
.hud b{display:block;font-size:clamp(11px,5.6vw,19px);color:#fff;letter-spacing:0;margin-top:1px;white-space:nowrap;overflow:hidden}
.g{margin-top:10px}
canvas#c{width:100%;display:block;border:2px solid var(--ac);border-radius:18px;touch-action:none;transform:translateZ(0);background:#100810}
.v{text-align:center;color:var(--mu);font-size:clamp(10px,3.8vw,13px);margin:6px 0 2px;font-weight:700;min-height:16px}
.b{display:flex;gap:8px;margin-top:6px}.b button{flex:1;min-width:0;height:48px;border-radius:15px;border:2px solid var(--ac);background:var(--cd);color:#fff;font:900 clamp(10px,4.2vw,14px) Roboto,Arial,sans-serif;letter-spacing:.3px;padding:0 2px}
.b button:active{transform:scale(.96);background:var(--ac);color:#111}
 #gm{position:relative}
#ov{position:absolute;left:0;top:0;right:0;bottom:0;z-index:40;display:none;flex-direction:column;align-items:center;gap:6px;padding:10px 8px;background:rgba(6,2,14,.88);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);border-radius:16px;text-align:center;overflow-y:auto;box-sizing:border-box}
#ov>:first-child{margin-top:auto}#ov>:last-child{margin-bottom:auto}
#ov b{font-size:clamp(16px,8vw,26px);color:var(--ac);text-shadow:0 0 12px var(--ac);overflow-wrap:anywhere}
#ov span{font-size:clamp(11px,4.2vw,14px);color:#fff}
.again{width:100%;height:44px;border-radius:14px;border:0;background:var(--ac);color:#111;font:900 clamp(11px,4.4vw,14px) Roboto,Arial,sans-serif;flex:none}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:var(--mu)}

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
</style></head><body><div class="card"><div class="hwfx" id="hwfx"></div>
<div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div>
<h1 id="tt">🦖 DINO RUNNER</h1>
<div id="gm">
<div class="hud"><div>PUNTOS<b id="s">00000</b></div><div>MEJOR<b id="r">00000</b></div><div>VELOCIDAD<b id="sp">1.0x</b></div></div>
<div class="g"><canvas id="c"></canvas><div class="v" id="v">Toca para empezar</div></div>
<div class="b"><button id="j">▲ SALTAR</button><button id="d">▼ AGACHAR</button></div>
<div id="ov"><b id="ot">GAME OVER</b><span id="ox"></span><div id="rk"></div><button class="again" id="ag">↻ JUGAR DE NUEVO</button></div>
</div>
<div id="mpr"></div>
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
function hDeco(list){var f=document.getElementById("hwfx"),h="",i,a;if(!f)return;for(i=0;i<list.length;i++){a=list[i];h+='<i class="'+a[1]+'" style="left:'+a[2]+'%;'+a[3]+';font-size:'+a[6]+'px;animation-duration:'+a[4]+'s;animation-delay:-'+a[5]+'s">'+a[0]+'</i>'}f.insertAdjacentHTML("beforeend",h)}
MP.panel({ids:["dino"],lab:{},title:"🏆 TOP DEL BOT · MEJOR PUNTAJE"});document.getElementById("tp").innerHTML=MP.top("dino");
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
var lm=0,air=0;
var KEY="mp_dino_best",mem=0,$=function(i){return document.getElementById(i)};
function ld(){try{return parseInt(localStorage.getItem(KEY))||0}catch(e){return mem}}
function sv(v){mem=v;try{localStorage.setItem(KEY,String(v))}catch(e){}}
var cv=$("c"),x=cv.getContext("2d"),W=260,H=170,G=142,K=2;
cv.width=W*K;cv.height=H*K;x.imageSmoothingEnabled=true;
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K;c.height=h*K;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
// ── paleta: normal = bestia oscura de ojos rojos · Halloween = esqueleto con ojos naranja ──
var C=HW?{b:"#e9e4cf",s:"#c2bba0",d:"#241d12",e:"#ff8a1a",sp:"#d6cfb2"}:{b:"#46604a",s:"#74946f",d:"#0c140e",e:"#ff2a2a",sp:"#1a261c"};
function pl(q,p,fill,st){q.fillStyle=fill;q.beginPath();q.moveTo(p[0],p[1]);for(var i=2;i<p.length;i+=2)q.lineTo(p[i],p[i+1]);q.closePath();q.fill();if(st!==false){q.strokeStyle=C.d;q.lineWidth=1;q.lineJoin="round";q.stroke()}}
function eye(q,ex,ey,dead){
 if(dead){q.strokeStyle=C.e;q.lineWidth=1.7;q.beginPath();q.moveTo(ex-2.4,ey-2.4);q.lineTo(ex+2.4,ey+2.4);q.moveTo(ex+2.4,ey-2.4);q.lineTo(ex-2.4,ey+2.4);q.stroke();return}
 if(HW){q.fillStyle="#0a0604";q.beginPath();q.arc(ex,ey,3.4,0,6.3);q.fill()}
 q.save();q.shadowColor=C.e;q.shadowBlur=8;q.fillStyle=C.e;q.beginPath();q.arc(ex,ey,HW?1.9:2.5,0,6.3);q.fill();q.restore();
 if(!HW){q.fillStyle="#200000";q.fillRect(ex-.5,ey-2.2,1,4.4)}}
function teeth(q,x0,y0,n,dir,sz,gap){q.fillStyle="#fffdf0";for(var i=0;i<n;i++){q.beginPath();q.moveTo(x0+i*gap,y0);q.lineTo(x0+i*gap+gap/2,y0+dir*sz);q.lineTo(x0+i*gap+gap,y0);q.closePath();q.fill()}}
function spikes(q,x0,y0,dx,dy,n,sz){for(var i=0;i<n;i++)pl(q,[x0+i*dx,y0+i*dy,x0+i*dx+sz*.6,y0+i*dy-sz,x0+i*dx+sz*1.3,y0+i*dy+1],C.sp,false)}
function legs(q,f,y0,short){
 // f 0/1 = carrera A/B · 2 = salto
 var L=[[30,44,38,44,37,52,42,56,29,56,31,51],[19,44,27,44,26,49,22,50,16,47,17,45]],M=[[19,44,27,44,26,52,31,56,18,56,20,51],[30,44,38,44,36,49,40,50,45,47,43,45]];
 var A=f===1?M:L,i;if(f===2)A=[[28,44,36,44,40,50,44,49,45,52,36,53],[16,44,24,44,22,50,15,53,12,51,16,47]];
 for(i=0;i<2;i++)pl(q,A[i],i===0?C.b:C.s);
 q.strokeStyle="#fffdf0";q.lineWidth=1;for(i=0;i<2;i++){var p=A[i];q.beginPath();q.moveTo(p[6],p[7]);q.lineTo(p[6]+2.5,p[7]+1.6);q.moveTo(p[6]-3,p[7]+.2);q.lineTo(p[6]-1,p[7]+2);q.stroke()}}
function dinoSpr(f){var duck=f===3||f===4,a=cvs(64,duck?32:56),q=a[1],i,dead=f===5;
 if(!duck){
  pl(q,[0,40,10,31,22,26,24,42,10,44],C.b);
  legs(q,dead?0:f,0);
  pl(q,[20,26,32,16,42,14,46,24,42,38,34,46,22,46,14,40],C.b);
  pl(q,[27,36,40,31,39,42,31,46,25,44],C.s,false);
  if(HW){q.strokeStyle=C.d;q.lineWidth=1.2;for(i=0;i<4;i++){q.beginPath();q.moveTo(27+i*4,27+i*.6);q.quadraticCurveTo(32+i*4,33,28+i*4,41);q.stroke()}}
  spikes(q,12,32,5.2,-2.8,6,5);
  pl(q,[38,18,44,8,52,6,52,18,46,24],C.b);
  q.fillStyle="#3a0a0a";q.beginPath();q.moveTo(46,14);q.lineTo(62,12);q.lineTo(60,17);q.lineTo(48,18);q.closePath();q.fill();
  pl(q,[46,16,62,13,60,20,48,23],C.s);
  pl(q,[42,6,52,2,62,5,63,11,52,14,44,14],C.b);
  teeth(q,48,13.5,5,1,4,3);teeth(q,50,17,4,-1,3,3);
  q.strokeStyle=C.d;q.lineWidth=2;q.beginPath();q.moveTo(47,4.2);q.lineTo(56,7.4);q.stroke();
  eye(q,52,7.2,dead);
  q.strokeStyle=C.b;q.lineWidth=3;q.lineCap="round";q.beginPath();q.moveTo(42,27);q.lineTo(48,31);q.stroke();q.strokeStyle="#fffdf0";q.lineWidth=1;q.beginPath();q.moveTo(48,31);q.lineTo(50.5,31.5);q.moveTo(47,32);q.lineTo(49,34);q.stroke();
 }else{
  pl(q,[0,26,8,20,16,22,14,30,2,30],C.b);
  var d1=f===3?[20,28,28,28,28,32,18,32]:[24,28,32,28,32,32,22,32],d2=f===3?[32,28,38,28,40,32,30,32]:[28,28,34,28,36,29,27,29];
  pl(q,d2,C.s);
  pl(q,[6,24,18,15,36,13,46,18,42,28,20,30],C.b);
  pl(q,[22,24,38,22,40,27,22,29],C.s,false);
  if(HW){q.strokeStyle=C.d;q.lineWidth=1.1;for(i=0;i<4;i++){q.beginPath();q.moveTo(22+i*5,18+i*.4);q.quadraticCurveTo(26+i*5,23,23+i*5,28);q.stroke()}}
  spikes(q,8,22,5,-2.2,6,4.5);
  pl(q,d1,C.b);
  q.fillStyle="#3a0a0a";q.beginPath();q.moveTo(42,19);q.lineTo(62,18);q.lineTo(60,22);q.lineTo(44,23);q.closePath();q.fill();
  pl(q,[42,22,60,21,57,28,44,29],C.s);
  pl(q,[38,12,50,10,62,14,63,19,50,20,40,20],C.b);
  teeth(q,46,19.5,5,1,4,3);teeth(q,47,22.5,4,-1,3,3);
  q.strokeStyle=C.d;q.lineWidth=2;q.beginPath();q.moveTo(45,11);q.lineTo(54,14);q.stroke();
  eye(q,51,14.2,false);
 }
 return a[0]}
var DS=[dinoSpr(0),dinoSpr(1),dinoSpr(2),dinoSpr(3),dinoSpr(4),dinoSpr(5)];
// ── obstáculos ──
function cactus(h){var w=Math.round(h*.62),a=cvs(w,h),q=a[1],cx=w/2,g=q.createLinearGradient(0,0,w,0);g.addColorStop(0,"#1f4128");g.addColorStop(.5,"#2f6a3c");g.addColorStop(1,"#1a3822");q.fillStyle=g;q.strokeStyle="#0a1a0e";q.lineWidth=1;
 function rr(x0,y0,ww,hh){var r=ww/2;q.beginPath();q.moveTo(x0,y0+hh);q.lineTo(x0,y0+r);q.arc(x0+r,y0+r,r,3.14,0);q.lineTo(x0+ww,y0+hh);q.closePath();q.fill();q.stroke()}
 rr(cx-4,1,8,h-1);rr(1,h*.34,5,h*.3);q.fillRect(1,h*.58,cx-3,4);rr(w-6,h*.22,5,h*.36);q.fillRect(cx+3,h*.5,w-cx-4,4);
 q.strokeStyle="#d9e8d6";q.lineWidth=.8;q.beginPath();for(var i=0;i<h;i+=5){q.moveTo(cx-4,i+3);q.lineTo(cx-7,i+1);q.moveTo(cx+4,i+5);q.lineTo(cx+7,i+3)}q.stroke();return a[0]}
function tomb(h){var w=Math.round(h*.72),a=cvs(w,h),q=a[1],r=w/2;q.fillStyle="#7d8392";q.strokeStyle="#1a1d26";q.lineWidth=1.3;q.beginPath();q.moveTo(1,h);q.lineTo(1,r);q.arc(r,r,r-1,3.14,0);q.lineTo(w-1,h);q.closePath();q.fill();q.stroke();
 q.fillStyle="rgba(255,255,255,.14)";q.fillRect(3,r,3,h-r-2);q.strokeStyle="#2b2f3b";q.lineWidth=2;q.beginPath();q.moveTo(r,r*.55);q.lineTo(r,r*1.75);q.moveTo(r-4,r*.95);q.lineTo(r+4,r*.95);q.stroke();
 q.fillStyle="#4d7a3a";q.fillRect(1,h-3,w-2,3);return a[0]}
function pump(){var a=cvs(22,20),q=a[1];q.fillStyle="#ff7a1a";q.strokeStyle="#7a2f00";q.lineWidth=1.2;q.beginPath();q.ellipse(11,11.5,10,8.5,0,0,6.3);q.fill();q.stroke();q.strokeStyle="#d85a00";q.beginPath();q.ellipse(11,11.5,4.5,8.5,0,0,6.3);q.stroke();
 q.fillStyle="#3a7a1a";q.fillRect(9.5,1.5,3,4);q.fillStyle="#ffe14d";q.beginPath();q.moveTo(5,9);q.lineTo(9,9);q.lineTo(7,12.5);q.closePath();q.moveTo(13,9);q.lineTo(17,9);q.lineTo(15,12.5);q.closePath();q.fill();q.beginPath();q.moveTo(6,15);q.lineTo(8.5,13.5);q.lineTo(11,15);q.lineTo(13.5,13.5);q.lineTo(16,15);q.lineTo(14,17);q.lineTo(8,17);q.closePath();q.fill();return a[0]}
function bird(f){var a=cvs(52,34),q=a[1],up=f===0;
 if(HW){ // murciélago grande
  q.fillStyle="#1d1030";q.strokeStyle="#0a0412";q.lineWidth=1;
  var wy=up?2:26;q.beginPath();q.moveTo(26,18);q.quadraticCurveTo(14,wy,1,wy+(up?10:-2));q.lineTo(8,up?15:22);q.lineTo(12,up?20:24);q.lineTo(17,up?15:21);q.closePath();q.fill();q.stroke();
  q.beginPath();q.moveTo(26,18);q.quadraticCurveTo(38,wy,51,wy+(up?10:-2));q.lineTo(44,up?15:22);q.lineTo(40,up?20:24);q.lineTo(35,up?15:21);q.closePath();q.fill();q.stroke();
  q.fillStyle="#2a1745";q.beginPath();q.ellipse(26,19,7,9,0,0,6.3);q.fill();q.stroke();
  pl(q,[20,11,22,5,25,10],"#2a1745");pl(q,[32,11,30,5,27,10],"#2a1745");
  q.save();q.shadowColor="#ff3a2a";q.shadowBlur=6;q.fillStyle="#ff3a2a";q.beginPath();q.arc(23.5,17,1.7,0,6.3);q.arc(28.5,17,1.7,0,6.3);q.fill();q.restore();
  q.fillStyle="#fff";q.beginPath();q.moveTo(24,22);q.lineTo(25,25);q.lineTo(26,22);q.moveTo(26,22);q.lineTo(27,25);q.lineTo(28,22);q.fill();
 }else{ // pterodáctilo
  q.fillStyle="#5a1020";q.strokeStyle="#1a0308";q.lineWidth=1;
  var tip=up?1:30;q.beginPath();q.moveTo(22,17);q.lineTo(8,tip);q.lineTo(15,up?14:20);q.lineTo(2,up?13:23);q.lineTo(20,21);q.closePath();q.fill();q.stroke();
  q.fillStyle="#7a1a2c";q.beginPath();q.ellipse(27,19,11,5.5,-.15,0,6.3);q.fill();q.stroke();
  pl(q,[35,17,50,19,36,21],"#b8a070");
  pl(q,[16,15,8,10,18,18],"#7a1a2c");
  q.fillStyle="#7a1a2c";q.beginPath();q.moveTo(26,16);q.lineTo(40,tip+(up?2:-2));q.lineTo(34,up?14:20);q.lineTo(30,21);q.closePath();q.fill();q.stroke();
  q.save();q.shadowColor="#ffe14d";q.shadowBlur=6;q.fillStyle="#ffe14d";q.beginPath();q.arc(37,17,1.8,0,6.3);q.fill();q.restore();
  teeth(q,38,20.5,4,1,2.5,2.6);
 }return a[0]}
var CAC=[cactus(26),cactus(34)],TMB=[tomb(24),tomb(30)],PMP=pump(),BR=[bird(0),bird(1)];
// ── fondo (se hornea una sola vez) ──
function rnd(i){var s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s)}
var BG=(function(){var a=cvs(W,H),q=a[1],g=q.createLinearGradient(0,0,0,G),i;
 if(HW){g.addColorStop(0,"#0a0418");g.addColorStop(.55,"#2a0e48");g.addColorStop(1,"#6a2a3a")}else{g.addColorStop(0,"#0b0614");g.addColorStop(.5,"#3a0f26");g.addColorStop(1,"#8a2c22")}
 q.fillStyle=g;q.fillRect(0,0,W,H);q.fillStyle="#fff";for(i=0;i<28;i++){q.globalAlpha=.25+rnd(i)*.6;q.fillRect(rnd(i+9)*W,rnd(i+3)*80,1.4,1.4)}q.globalAlpha=1;
 var mg=q.createRadialGradient(W-46,36,4,W-46,36,60);mg.addColorStop(0,HW?"rgba(255,160,40,.55)":"rgba(255,60,40,.5)");mg.addColorStop(1,"rgba(255,80,20,0)");q.fillStyle=mg;q.fillRect(W-120,0,120,100);
 q.fillStyle=HW?"#ffb347":"#d8402e";q.beginPath();q.arc(W-46,36,HW?22:16,0,6.3);q.fill();q.fillStyle=HW?"rgba(150,70,10,.35)":"rgba(80,10,10,.4)";q.beginPath();q.arc(W-53,32,4,0,6.3);q.arc(W-40,42,3,0,6.3);q.fill();
 return a[0]})();
var FAR=(function(){var a=cvs(W,H),q=a[1],i,x0;q.fillStyle=HW?"#12061f":"#1a0a14";
 if(HW){ // castillo + árboles muertos
  q.fillRect(30,G-52,60,52);q.fillRect(24,G-70,12,70);q.fillRect(84,G-66,12,66);q.beginPath();q.moveTo(24,G-70);q.lineTo(30,G-84);q.lineTo(36,G-70);q.moveTo(84,G-66);q.lineTo(90,G-80);q.lineTo(96,G-66);q.fill();q.fillStyle="#ffb347";q.fillRect(52,G-38,5,8);q.fillRect(66,G-30,5,8);q.fillStyle="#12061f";
  for(i=0;i<3;i++){x0=118+i*44+rnd(i)*10;q.fillRect(x0,G-30-rnd(i+4)*14,3,40);q.strokeStyle="#12061f";q.lineWidth=2;q.beginPath();q.moveTo(x0+1,G-24);q.lineTo(x0-9,G-38);q.moveTo(x0+1,G-34);q.lineTo(x0+11,G-48);q.stroke()}
 }else{q.beginPath();q.moveTo(0,G);for(i=0;i<=13;i++)q.lineTo(i*20,G-22-rnd(i)*34);q.lineTo(W,G);q.closePath();q.fill();
  q.fillStyle="rgba(255,70,30,.35)";q.beginPath();q.moveTo(150,G-52);q.lineTo(166,G-70);q.lineTo(182,G-52);q.closePath();q.fill()}
 return a[0]})();
var GRD=(function(){var a=cvs(W,H),q=a[1],i,g=q.createLinearGradient(0,G,0,H);g.addColorStop(0,HW?"#2a1840":"#2a1218");g.addColorStop(1,HW?"#0e0618":"#0c0508");q.fillStyle=g;q.fillRect(0,G,W,H-G);
 q.strokeStyle=HW?"#7a5ab0":"#8a4a4a";q.lineWidth=1.6;q.beginPath();q.moveTo(0,G+.5);q.lineTo(W,G+.5);q.stroke();
 for(i=0;i<18;i++){var px=rnd(i+20)*W,py=G+5+rnd(i+30)*(H-G-9);
  if(HW&&i%5===0){q.fillStyle="#d8d2b8";q.fillRect(px,py,7,2);q.beginPath();q.arc(px,py+1,1.8,0,6.3);q.arc(px+7,py+1,1.8,0,6.3);q.fill()}
  else{q.fillStyle=HW?"#4a3070":"#5a3030";q.fillRect(px,py,2+rnd(i)*4,1.4)}}return a[0]})();
var FOG=(function(){var a=cvs(W,40),q=a[1],i,g;for(i=0;i<4;i++){g=q.createRadialGradient(40+i*90,20,2,40+i*90,20,60);g.addColorStop(0,HW?"rgba(210,190,255,.22)":"rgba(255,140,120,.16)");g.addColorStop(1,"rgba(0,0,0,0)");q.fillStyle=g;q.fillRect(i*90-20,0,120,40)}return a[0]})();
// ── estado ──
var py=0,vy=0,duck=false,obs=[],sp=4.2,sc=0,st=0,nx=100,fr=0,best=Math.max(ld(),(MP.V("dino").rec||0)),last=0,lh=0,ls="",lv="",shake=0,flash=0,fcx=0,bx=0,bf=0,sEl=$("s"),rEl=$("r"),pEl=$("sp"),vEl=$("v");
function f5(n){return("00000"+Math.floor(n)).slice(-5)}
function hud(){var a=f5(sc),b=(sp/4).toFixed(1),mm=(sc/100)|0;if(mm>lm){lm=mm;if(st===1)arp([880,1175],.09,"square",.05)}if(a!==ls){ls=a;sEl.textContent=a}if(b!==lv){lv=b;pEl.textContent=b+"x"}}
rEl.textContent=f5(best);
function reset(){py=0;vy=0;duck=false;obs=[];sp=4.2;sc=0;st=1;nx=110;fr=0;$("ov").style.display="none";lv="";lm=0;air=0;shake=0;flash=0;T0=Date.now();$("rk").innerHTML="";vEl.textContent=HW?"Corre... ¡no dejes que te alcancen!":"Esquiva: salta cactus · agáchate ante los pájaros";hud();mus(mDino,.18)}
function jump(){if(st!==1){reset();return}if(py===0&&!duck){vy=7.9;air=1;fx("j",60,420,.11,"square",.07,900)}}
function over(){st=2;mend();hurt();shake=14;flash=1;setTimeout(function(){fx("o",0,260,.5,"sawtooth",.09,45,1)},200);var s=Math.floor(sc);if(s>best){best=s;sv(best);rEl.textContent=f5(best)}hud();vEl.textContent="";lv="";$("ot").textContent=HW?"💀 TE ALCANZARON":"GAME OVER";$("ox").textContent="Puntos: "+s+" · Récord: "+best;$("ov").style.display="flex";MP.save("dino",s,Math.round((Date.now()-T0)/1000),$("rk"))}
var lastB=0;
function spawn(){
 var r=Math.random();
 if(sc>35&&lastB>=2&&r<.34){obs.push({x:W+10,w:34,y:28,h:30,k:0,b:1});lastB=0}
 else if(HW&&r<.5){obs.push({x:W+10,w:22,y:0,h:20,k:2,n:1});lastB++}
 else{var big=Math.random()<.45,n=(!big&&Math.random()<.3)?2:1,sp0=HW?TMB:CAC,im=sp0[big?1:0];obs.push({x:W+10,w:im.width/K*n-2,y:0,h:im.height/K,k:1,im:im,n:n});lastB++}
 nx=135+Math.random()*95+sp*13}
function loop(ts){
 if(document.hidden){last=ts;requestAnimationFrame(loop);return}
 var k=Math.min(2.5,(ts-last)/16.67||1),i,o,n;last=ts;
 if(st===1){sc+=sp*k*.08;sp=Math.min(8.6,4.2+sc/260);py+=vy*k;vy-=.6*k;if(py<=0){if(air){air=0;nz("ld",60,.06,300,.3)}py=0;vy=0}
  fr+=sp*k;nx-=sp*k;if(nx<=0)spawn();bf+=k*.16;
  var dh=duck&&py===0?22:46,x1=duck&&py===0?22:26,x2=duck&&py===0?54:48;
  for(i=obs.length-1;i>=0;i--){o=obs[i];o.x-=sp*k;if(o.x<-60){obs.splice(i,1);continue}
   if(o.x+3<x2&&o.x+o.w-3>x1&&py+3<o.y+o.h&&py+dh-2>o.y){over();break}}
  if(ts-lh>90){lh=ts;hud()}}
 x.setTransform(K,0,0,K,0,0);
 if(shake>0){x.translate((Math.random()-.5)*shake*.6,(Math.random()-.5)*shake*.6);shake-=k}
 x.drawImage(BG,0,0,W,H);
 if(st===1)fcx=(fcx+sp*k*.25)%W;x.drawImage(FAR,-fcx,0,W,H);x.drawImage(FAR,W-fcx,0,W,H);
 if(!LO||st===1){var fg=(ts*.012)%W;x.globalAlpha=.9;x.drawImage(FOG,-fg,G-34,W,40);x.drawImage(FOG,W-fg,G-34,W,40);x.globalAlpha=1}
 x.drawImage(GRD,0,0,W,H);
 var gx=-(fr%W);x.drawImage(GRD,gx,0,W,H);x.drawImage(GRD,gx+W,0,W,H);
 for(i=0;i<obs.length;i++){o=obs[i];
  if(o.b){x.drawImage(BR[(bf|0)%2],o.x-9,G-o.y-o.h-2,52,34)}
  else if(o.k===2)x.drawImage(PMP,o.x-1,G-20,22,20);
  else for(n=0;n<o.n;n++)x.drawImage(o.im,o.x+n*(o.im.width/K),G-o.h,o.im.width/K,o.h)}
 var spr_=st===2?DS[5]:duck&&py===0?DS[3+(Math.floor(fr/12)%2)]:py>0?DS[2]:DS[Math.floor(fr/14)%2];
 x.drawImage(spr_,6,G-py-(duck&&py===0?32:56),64,duck&&py===0?32:56);
 if(HW&&st===1&&!LO){x.fillStyle="rgba(255,150,40,.06)";x.fillRect(0,0,W,H)}
 if(flash>0){x.fillStyle="rgba(255,40,40,"+(flash*.35)+")";x.fillRect(0,0,W,H);flash=Math.max(0,flash-.06*k)}
 if(st===0){x.fillStyle="rgba(0,0,0,.45)";x.fillRect(0,0,W,H);x.textAlign="center";x.font="900 24px Roboto,Arial,sans-serif";x.lineWidth=5;x.strokeStyle="#000";x.fillStyle=HW?"#ff9a1f":"#ff4a3a";var t1=HW?"🎃 DINO ESQUELETO":"DINO RUNNER";x.strokeText(t1,W/2,H/2-4);x.fillText(t1,W/2,H/2-4);x.font="700 12px Roboto,Arial,sans-serif";x.fillStyle="#fff";x.fillText("Toca para empezar",W/2,H/2+18)}else if(st===2){x.fillStyle="rgba(0,0,0,.35)";x.fillRect(0,0,W,H)}
 requestAnimationFrame(loop)}
cv.addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("ag").addEventListener("click",function(){reset()});
$("j").addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("d").addEventListener("pointerdown",function(e){e.preventDefault();duck=true;fx("du",100,220,.07,"triangle",.1,150)});
["pointerup","pointerleave","pointercancel"].forEach(function(n){$("d").addEventListener(n,function(){duck=false})});
document.addEventListener("keydown",function(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}if(e.code==="ArrowDown")duck=true});
document.addEventListener("keyup",function(e){if(e.code==="ArrowDown")duck=false});
hDeco(HW?[["🕷️","hsw hth",44,"top:30px",3.4,0,22],["🕷️","hsw hth",72,"top:56px",4,1.5,18],["🦇","hfy",0,"top:38%",11,0,20],["🎃","hfl",3,"bottom:2%",4,1,28],["👻","hfl",88,"top:52%",5,0,26],["🦇","hfy",0,"top:72%",14,6,16],["🎃","hfl",90,"bottom:2%",5,2,24],["🕸️","",0,"top:0",1,0,44],["🕸️","",88,"top:0",1,0,44]]:[]);
if(HW)$("tt").textContent="🎃 DINO ESQUELETO";
hud();requestAnimationFrame(loop);

})();
</script></body></html>`;

export default {
  names: [".dino", ".dinosaurio"],
  desc: "Dino Runner (salta cactus y agáchate ante los pájaros); guarda tu mejor puntaje",
  category: "Juegos",
  usage: ".dino",
  handler: async ({ sock, from, msg, sender }) => {
    try {
      await enviarJuego({ sock, from, msg, sender, juego: "dino", html: GAME_HTML });
    } catch (e) {
      console.log("[DINO] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
