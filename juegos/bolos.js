import { config } from "../motores/db.js";

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
.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0}
.hud div{text-align:center;border:2px solid #6a3d1c;border-radius:14px;padding:5px 1px;font-size:9px;letter-spacing:1px;color:#c9a27a;background:#150c08;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:19px;color:#ffd08a}
.sb{display:grid;grid-template-columns:24px repeat(10,minmax(0,1fr));gap:2px;margin-bottom:8px;font-size:9px}
.sb i{font-style:normal;text-align:center;background:#150c08;border-radius:5px;padding:2px 0;min-width:0;overflow:hidden;white-space:nowrap}
.sb .l{color:#ffb36b;font-weight:bold;display:flex;align-items:center;justify-content:center}
.sb .fc{display:flex;flex-direction:column;border:1px solid #4a2d18;border-radius:5px;background:#150c08;text-align:center;min-width:0;overflow:hidden;line-height:1.3}
.sb .fc.cu{border-color:#ffd08a;background:#2a170c}.sb .fc span{font-size:8px;color:#ffb36b;height:11px;white-space:nowrap}.sb .fc b{font-size:10px;color:#fff1e0}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#0b0710ee;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ffd08a}#ov span{font-size:14px;color:#e8c9a4;margin-bottom:6px;line-height:1.5}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
.pp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.pp span{display:block;font-size:9px;letter-spacing:1px;color:#c9a27a;margin-bottom:3px}
.pb{position:relative;height:22px;border-radius:11px;background:#150c08;overflow:hidden;border:1px solid #4a2d18}.pb div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#ffd08a,#ff7a2f,#ff3d3d)}
.pb.ef div{position:absolute;top:0;width:10px;height:100%;left:45%;transform:none;background:#ffd08a;border-radius:5px}
.lb{font-size:9px;letter-spacing:2px;color:#c9a27a;margin:10px 0 4px}
.an{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.an .bt{margin:0;height:44px;font-size:15px;padding:0}
.hint{text-align:center;font-size:12px;color:#c9a27a;margin:10px 0 0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#a9825c}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #ff9a3d;background:#2a170c;font-size:16px;line-height:1;padding:0;color:#fff}
</style></head><body><div class="m"><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1>🎳 BOLOS</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">10 frames · strikes y spares como en el boliche real</div>
<h3>🏟️ PISTA</h3><div class="o c2" id="o0"></div>
<h3>🎳 COLOR DE BOLA</h3><div class="o c3" id="o1"></div>
<h3>⚖️ PESO DE LA BOLA</h3><div class="o c3" id="o2"></div>
<h3>🆚 RIVAL</h3><div class="o c2" id="o3"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm" style="display:none"><div class="hud"><div>FRAME<b id="h0">1/10</b></div><div>TIRO<b id="h1">1</b></div><div>EN PIE<b id="h2">10</b></div><div>PUNTOS<b id="h3">0</b></div></div>
<div class="sb" id="sb"></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="ov"><b>🏁 FIN</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<div class="pp"><div><span>FUERZA</span><div class="pb" id="pw"><div id="pwf"></div></div></div><div><span>EFECTO ↶ ↷</span><div class="pb ef" id="ef"><div id="efk"></div></div></div></div>
<div class="lb">POSICIÓN DE LA BOLA</div><div class="an" id="an1"><button class="bt" data-a="-12">◀◀</button><button class="bt" data-a="-3">◀</button><button class="bt" data-a="c">🎯</button><button class="bt" data-a="3">▶</button><button class="bt" data-a="12">▶▶</button></div>
<div class="lb">DIRECCIÓN</div><div class="an" id="an2"><button class="bt" data-a="-.06">↖↖</button><button class="bt" data-a="-.015">↖</button><button class="bt" data-a="z">⬆</button><button class="bt" data-a=".015">↗</button><button class="bt" data-a=".06">↗↗</button></div>
<button class="go" id="kb">🎳 LANZAR</button>
<div class="hint">Toca la parte baja de la pista para mover la bola, o arriba para apuntar. Ajusta fuerza y efecto en las barras.</div>
<button class="bt" id="mb">⚙ AJUSTES</button></div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
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
var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_bolos_best",CK="mp_bolos_cfg";
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
var TH=[["🪵","Clásica"],["🌌","Neón"],["🕹️","Retro"],["🪐","Espacial"]],BC=[["🔵","Azul","#3da5ff"],["🔴","Rojo","#ff4d5e"],["🟢","Verde","#39ff7a"],["🟣","Morado","#b06cff"],["🟠","Naranja","#ff9a3d"],["⚫","Negra","#3a3a4a"]];
var WG=[["🪶","Ligera",9],["⚖️","Media",15],["🏋️","Pesada",24]],RV=[["🧍","Solo yo"],["🤖","CPU fácil"],["🤖","CPU normal"],["🤖","CPU difícil"]];
var LS=[TH,BC,WG,RV],S=[0,0,1,0];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===4&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var k0=0;k0<4;k0++)chips(k0);
var cv=$("c"),x=cv.getContext("2d");x.scale(K,K);
function bake(t){var a=cvs(W,H),q=a[1],g,i;
 q.fillStyle=["#1a0f08","#05061a","#12041f","#02030c"][t];q.fillRect(0,0,W,H);
 q.fillStyle=["#2b1c10","#0a0d33","#05050a","#06081a"][t];q.fillRect(60,36,180,364);
 if(t===0){for(i=0;i<14;i++){q.fillStyle=i%2?"#d9a95f":"#cf9f55";q.fillRect(80+i*10,36,10,364)}q.strokeStyle="rgba(90,50,10,.35)";q.lineWidth=1;q.beginPath();for(i=0;i<=14;i++){q.moveTo(80+i*10,36);q.lineTo(80+i*10,400)}q.stroke()}
 else if(t===1){q.fillStyle="#0b1034";q.fillRect(80,36,140,364);q.strokeStyle="rgba(34,245,255,.35)";q.lineWidth=1;q.beginPath();for(i=0;i<=7;i++){q.moveTo(80+i*20,36);q.lineTo(80+i*20,400)}for(i=60;i<400;i+=30){q.moveTo(80,i);q.lineTo(220,i)}q.stroke();q.strokeStyle="rgba(255,61,242,.8)";q.lineWidth=2;q.strokeRect(80,36,140,364)}
 else if(t===2){for(i=0;i<7;i++){q.fillStyle=i%2?"#2b1b5e":"#3a2580";q.fillRect(80+i*20,36,20,364)}q.fillStyle="#ffcf4d";q.fillRect(80,36,3,364);q.fillRect(217,36,3,364)}
 else{g=q.createLinearGradient(0,36,0,400);g.addColorStop(0,"#0a1740");g.addColorStop(1,"#13296a");q.fillStyle=g;q.fillRect(80,36,140,364);q.fillStyle="#cfe6ff";for(i=0;i<40;i++){q.globalAlpha=.3+Math.random()*.6;q.fillRect(80+Math.random()*140,36+Math.random()*364,1.2,1.2)}q.globalAlpha=1}
 q.fillStyle=["#6b4a2b","#22f5ff","#ffcf4d","#9fd0ff"][t];for(i=0;i<7;i++){var ax=88+i*20.6,ay=250+Math.abs(i-3)*7;q.beginPath();q.moveTo(ax,ay-5);q.lineTo(ax-3,ay+3);q.lineTo(ax+3,ay+3);q.closePath();q.fill()}
 q.fillStyle="rgba(255,255,255,.7)";q.fillRect(80,330,140,2);
 q.fillStyle="#000";q.fillRect(60,20,180,22);q.fillStyle="rgba(255,255,255,.08)";q.fillRect(60,40,180,4);
 q.fillStyle="rgba(0,0,0,.35)";q.fillRect(62,44,18,356);q.fillRect(220,44,18,356);
 return a[0]}
var BSP=null,PSP=null,LANE=null;
function ballSpr(c){var a=cvs(20,20),q=a[1],g=q.createRadialGradient(8,7,1,10,10,9);g.addColorStop(0,"#fff");g.addColorStop(.25,c);g.addColorStop(1,"#000");q.fillStyle=g;q.beginPath();q.arc(10,10,8,0,6.3);q.fill();q.fillStyle="rgba(0,0,0,.55)";q.beginPath();q.arc(8,7,1.3,0,6.3);q.fill();q.beginPath();q.arc(11.5,7,1.3,0,6.3);q.fill();q.beginPath();q.arc(10,10.5,1.3,0,6.3);q.fill();return a[0]}
function pinSpr(){var a=cvs(14,14),q=a[1];q.fillStyle="#f4f4f4";q.beginPath();q.arc(7,7,5.5,0,6.3);q.fill();q.strokeStyle="#c8c8c8";q.lineWidth=1;q.stroke();q.strokeStyle="#e43b3b";q.lineWidth=1.6;q.beginPath();q.arc(7,7,3.2,0,6.3);q.stroke();q.fillStyle="#fff";q.beginPath();q.arc(7,7,1.6,0,6.3);q.fill();return a[0]}
var st=0,theme=0,BM=15,rival=0,PF=[],CF=[],fi=0,turn=0,pins=[],ball=null,sx=150,ang=0,pw=.6,hk=0,left=10,tmr=0,toast="",tt=0,last=0,gid=0,wasFull=true,hc=["","","",""],best=ld(KEY),gutS=0,settle=0,tm=0;
var E=[$("h0"),$("h1"),$("h2"),$("h3")];
function put(i,t){if(hc[i]!==t){hc[i]=t;E[i].textContent=t}}
function mkPins(){var rows=[[-21,-7,7,21],[-14,0,14],[-7,7],[0]],a=[],r,i;for(r=0;r<4;r++)for(i=0;i<rows[r].length;i++)a.push({x:150+rows[r][i],y:70+r*12,vx:0,vy:0,r:5,d:0,o:0});return a}
function calc(F){var fl=[],sa=[],i,j,tot=[],run=0,k,s,n;
 for(i=0;i<F.length;i++){sa.push(fl.length);for(j=0;j<F[i].length;j++)fl.push(F[i][j])}
 for(i=0;i<10;i++){if(i>=F.length||!F[i].length){tot.push(null);continue}k=sa[i];n=F[i].length;
  if(i<9){if(fl[k]===10){if(fl.length<=k+2){tot.push(null);continue}s=10+fl[k+1]+fl[k+2]}else{if(n<2){tot.push(null);continue}if(fl[k]+fl[k+1]===10){if(fl.length<=k+2){tot.push(null);continue}s=10+fl[k+2]}else s=fl[k]+fl[k+1]}}
  else{if(n<2){tot.push(null);continue}if((fl[k]===10||fl[k]+fl[k+1]===10)&&n<3){tot.push(null);continue}s=0;for(j=0;j<n;j++)s+=fl[k+j]}
  run+=s;tot.push(run)}
 return tot}
function marks(f,i){var o=[],a,j,p=0;for(j=0;j<f.length;j++){a=f[j];
  if(a===10&&(j===0||i===9&&(f[j-1]===10||p===0)))o.push("X");
  else if(j>0&&p+a===10&&!(i===9&&f[j-1]===10&&false))o.push("/");
  else o.push(a===0?"-":String(a));
  if(i===9){p=(a===10||p+a===10)?0:p+a}else p=a}
 return o.join(" ")}
function fstate(fr,fi2){var n=fr.length,a=fr[0],b=fr[1];
 if(fi2<9){if(a===10)return[1,1];if(n===2)return[1,1];return[0,0]}
 if(n===1)return a===10?[0,1]:[0,0];
 if(n===2){if(a===10)return[0,b===10?1:0];if(a+b===10)return[0,1];return[1,1]}
 return[1,1]}
function sb(){var h='<i class="l"></i>',i,j,rows=rival>0?2:1,F,t,r;for(i=1;i<=10;i++)h+="<i>"+i+"</i>";
 for(r=0;r<rows;r++){F=r?CF:PF;t=calc(F);h+='<i class="l">'+(r?"🤖":"🙂")+"</i>";for(i=0;i<10;i++){h+='<div class="fc'+(i===fi&&turn===r&&st>0&&st<4?" cu":"")+'"><span>'+(F[i]?marks(F[i],i):"")+"</span><b>"+(t[i]===null||t[i]===undefined?"":t[i])+"</b></div>"}}
 $("sb").innerHTML=h}
function lastTot(F){var t=calc(F),v=0;for(var i=0;i<10;i++)if(t[i]!==null&&t[i]!==undefined)v=t[i];return v}
function hud(){var fr=PF[fi]||[];put(0,Math.min(10,fi+1)+"/10");put(1,String(fr.length+1));put(2,String(left));put(3,String(lastTot(PF)))}
function setPw(){$("pwf").style.transform="scaleX("+pw+")"}
function setEf(){$("efk").style.left=((hk+1)/2*90+0)+"%"}
function newFrame(){left=10;pins=mkPins();wasFull=true;ball=null;turn=0;st=1;ang=0;sb();hud()}
function start(){gid++;theme=S[0];BM=WG[S[2]][2];rival=S[3];sv(CK,S.join(","));LANE=bake(theme);BSP=ballSpr(BC[S[1]][2]);PSP=pinSpr();PF=[];CF=[];fi=0;turn=0;sx=150;ang=0;pw=.6;hk=0;toast="";tt=0;hc=["","","",""];
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";setPw();setEf();fx("s",0,520,.1,"sine",.08,780);mus(mBol,.3);newFrame()}
function toCfg(){gid++;st=0;mend();ane();$("gm").style.display="none";$("cfg").style.display="block"}
function endGame(){st=5;mend();ane();var a=lastTot(PF),b=lastTot(CF),t,w="";
 if(a>best){best=a;sv(KEY,best)}
 if(rival>0){w=a>b?"🏆 ¡Ganaste!":a<b?"😅 Ganó la CPU":"🤝 ¡Empate!";arp(a>=b?[523,659,784,1047]:[392,349,311],.2,a>=b?"triangle":"sawtooth",.1)}else arp([523,659,784,1047],.2,"triangle",.1);
 $("ot").textContent=(w?w+"\n":"")+"Tus puntos: "+a+(rival>0?" · CPU: "+b:"")+"\nTu récord: "+best;$("ov").style.display="flex";hud()}
function shout(m,ms){toast=m;tt=ms||1.4}
function launch(){if(st!==1||turn!==0)return;var v=2.4+3.8*pw;ball={x:sx,y:362,vx:Math.sin(ang)*v,vy:-Math.cos(ang)*v,r:8,m:BM,g:0,al:true};st=2;tmr=0;settle=0;gutS=0;nz("rl",0,.3,350,.3,.8);ans(170,.22)}
function hit(a,b,ma,mb,e){var dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,rr=a.r+b.r;if(d2>=rr*rr||d2<1e-6)return 0;var d=Math.sqrt(d2),nx=dx/d,ny=dy/d,ov=rr-d,s=ma+mb;
 a.x-=nx*ov*mb/s;a.y-=ny*ov*mb/s;b.x+=nx*ov*ma/s;b.y+=ny*ov*ma/s;var rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv>=0)return .01;var j=-(1+e)*rv/(1/ma+1/mb);a.vx-=j*nx/ma;a.vy-=j*ny/ma;b.vx+=j*nx/mb;b.vy+=j*ny/mb;return -rv}
function crash(v){fx("pk",55,650+Math.random()*700,.05,"square",Math.min(.16,.04+v*.03));nz("ph",55,.09,1500+Math.random()*1500,Math.min(.4,.12+v*.05))}
function phys(k){var sp=ball&&ball.al?Math.sqrt(ball.vx*ball.vx+ball.vy*ball.vy):0,mx=0,i,j,p,q,imp,n,dt,s;
 for(i=0;i<pins.length;i++){p=pins[i];if(!p.o){var v2=p.vx*p.vx+p.vy*p.vy;if(v2>mx)mx=v2}}
 n=Math.max(1,Math.min(5,Math.ceil(Math.max(sp,Math.sqrt(mx))*k/3)));dt=k/n;
 for(s=0;s<n;s++){
  if(ball&&ball.al){
   if(!ball.g&&ball.y<290){var ha=hk*.0055*dt,cs=Math.cos(ha),sn=Math.sin(ha),nvx=ball.vx*cs-ball.vy*sn;ball.vy=ball.vx*sn+ball.vy*cs;ball.vx=nvx}
   ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
   if(!ball.g&&Math.abs(ball.x-150)>73){ball.g=1;gutS=1;ball.vx=0;fx("gt",0,300,.3,"sawtooth",.08,120,1)}
   if(ball.g)ball.x=150+(ball.x>150?79:-79);
   if(ball.y<40){ball.al=false;ane();nz("pt",0,.25,500,.3)}
   else if(!ball.g)for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;imp=hit(ball,p,ball.m,3,.78);if(imp){if(imp>.8)p.d=1;if(imp>.3)crash(imp)}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;if(p.vx||p.vy){p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.y<44){p.d=1;p.o=1;continue}
   if(p.x<64){p.x=64;p.vx=Math.abs(p.vx)*.5}else if(p.x>236){p.x=236;p.vx=-Math.abs(p.vx)*.5}
   if(p.y>390){p.y=390;p.vy=-Math.abs(p.vy)*.5}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;for(j=i+1;j<pins.length;j++){q=pins[j];if(q.o)continue;
   if(Math.abs(p.x-q.x)>10||Math.abs(p.y-q.y)>10)continue;if(!(p.vx||p.vy||q.vx||q.vy))continue;imp=hit(p,q,3,3,.7);if(imp>.3){if(imp>1.3){p.d=1;q.d=1}if(imp>.7)crash(imp*.6)}}}}
 var f=Math.pow(.9,k),f2=Math.pow(.985,k);
 for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;var ff=p.d?f2:f;p.vx*=ff;p.vy*=ff;if(p.vx*p.vx+p.vy*p.vy<.003){p.vx=0;p.vy=0}}
 tmr+=k;var moving=false;for(i=0;i<pins.length;i++)if(!pins[i].o&&(pins[i].vx||pins[i].vy))moving=true;
 if((!ball.al&&!moving)||tmr>320){settle+=k;if(settle>28||tmr>320)endRoll()}else settle=0}
function endRoll(){ane();var n=0,i,np=[];for(i=0;i<pins.length;i++){if(pins[i].d)n++;else np.push(pins[i])}
 var F=PF,fr=F[fi]||(F[fi]=[]),full=wasFull,gut=gutS&&n===0;fr.push(n);var s=fstate(fr,fi),m;
 if(n===10&&full){m="¡STRIKE!";arp([523,659,784,1047,1319],.16,"triangle",.11);nz("sk",0,.8,1600,.3)}
 else if(n===left&&n>0){m="¡SPARE!";arp([523,659,784],.16,"triangle",.1)}
 else if(gut){m="¡Canaleta!";arp([300,250,200],.22,"sawtooth",.07)}
 else if(n===0){m="Ningún pino";fx("m0",0,200,.3,"sine",.1,120)}
 else{m=n+(n===1?" pino":" pinos");fx("rr",0,420+n*40,.15,"triangle",.1,700+n*40)}
 shout(m,1.5);left-=n;wasFull=false;
 if(s[1]){left=10;pins=mkPins();wasFull=true}else pins=np;
 ball=null;sx=Math.max(92,Math.min(208,sx));hud();sb();st=3;var g=gid;
 setTimeout(function(){if(g!==gid)return;if(s[0])frameDone();else{st=1;ang=0;hud();sb()}},1300)}
function cpuRoll(av,first,df){var p=[.12,.25,.42][df];if(first&&av===10&&Math.random()<p)return 10;
 var sp=[.38,.55,.7][df];if(!first&&Math.random()<sp)return av;var m=first?.74:.5,n=Math.round(av*(m+df*.05+(Math.random()-.5)*.55));return Math.max(0,Math.min(first&&av===10?9:(first?av:av-1),n))}
function cpuFrame(f){var df=rival-1,r=[],a=cpuRoll(10,true,df);r.push(a);
 if(f<9){if(a<10)r.push(cpuRoll(10-a,false,df));return r}
 var l=a===10?10:10-a,b=cpuRoll(l,a===10,df);r.push(b);
 if(a===10){var l2=b===10?10:10-b;r.push(cpuRoll(l2,l2===10,df))}else if(a+b===10)r.push(cpuRoll(10,true,df));
 return r}
function cpuPlay(){turn=1;st=4;var g=gid,R=cpuFrame(fi),i;CF[fi]=[];sb();
 for(i=0;i<R.length;i++)(function(i){setTimeout(function(){if(g!==gid)return;CF[fi].push(R[i]);var v=R[i],m=v===10?(i===0?"🤖 CPU: ¡STRIKE!":"🤖 CPU: 10 pinos"):"🤖 CPU: "+v+(v===1?" pino":" pinos");
  if(v===10)arp([523,659,784],.12,"triangle",.07);else nz("cp",0,.2,1400,.2);shout(m,1.1);sb()},900*(i+1))})(i);
 setTimeout(function(){if(g!==gid)return;turn=0;fi++;if(fi>9)endGame();else newFrame()},900*(R.length+1))}
function frameDone(){if(rival>0){cpuPlay();return}fi++;if(fi>9)endGame();else newFrame()}
function drawPins(){var i,p;for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;if(p.d){x.globalAlpha=.5;x.drawImage(PSP,p.x-5.5,p.y-5.5,11,11);x.globalAlpha=1}else x.drawImage(PSP,p.x-7,p.y-7,14,14)}}
function draw(){x.drawImage(LANE,0,0,W,H);drawPins();
 if(ball&&ball.al)x.drawImage(BSP,ball.x-10,ball.y-10,20,20);
 else if(st===1){x.drawImage(BSP,sx-10,362-10,20,20);
  var px=sx,py=360,vx=Math.sin(ang)*14,vy=-Math.cos(ang)*14,i,ha=hk*.0055*14/3.6;x.fillStyle="#fff";
  for(i=0;i<16;i++){if(py<290){var cs=Math.cos(ha*3),sn=Math.sin(ha*3),nx=vx*cs-vy*sn;vy=vx*sn+vy*cs;vx=nx}px+=vx;py+=vy;if(py<46)break;x.globalAlpha=.8-i*.04;x.beginPath();x.arc(px,py,1.8,0,6.3);x.fill()}x.globalAlpha=1}
 if(tt>0){x.font="bold 22px Roboto,Arial,sans-serif";x.textAlign="center";x.lineWidth=5;x.strokeStyle="rgba(0,0,0,.75)";x.strokeText(toast,150,200);x.fillStyle="#ffd08a";x.fillText(toast,150,200)}}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
 if(!document.hidden&&st>0){var k=dt*60;tm+=dt;if(tt>0)tt-=dt;if(st===2)phys(k);draw()}requestAnimationFrame(loop)}
cv.addEventListener("pointerdown",function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(z){}aimPt(e)});
cv.addEventListener("pointermove",function(e){e.preventDefault();if(e.buttons||e.pressure>0)aimPt(e)});
function aimPt(e){if(st!==1||turn!==0)return;var r=cv.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height;
 if(my>310)sx=Math.max(92,Math.min(208,mx));else ang=Math.max(-.3,Math.min(.3,Math.atan2(mx-sx,362-my)))}
$("an1").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;sx=a==="c"?150:Math.max(92,Math.min(208,sx+Number(a)))});
$("an2").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;ang=a==="z"?0:Math.max(-.3,Math.min(.3,ang+Number(a)))});
function barAt(id,e){var r=$(id).getBoundingClientRect();return Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))}
$("pw").addEventListener("pointerdown",function(e){e.preventDefault();pw=Math.max(.1,barAt("pw",e));setPw()});$("pw").addEventListener("pointermove",function(e){if(e.buttons){pw=Math.max(.1,barAt("pw",e));setPw()}});
$("ef").addEventListener("pointerdown",function(e){e.preventDefault();hk=Math.round((barAt("ef",e)*2-1)*10)/10;setEf()});$("ef").addEventListener("pointermove",function(e){if(e.buttons){hk=Math.round((barAt("ef",e)*2-1)*10)/10;setEf()}});
$("kb").addEventListener("click",launch);$("go").addEventListener("click",start);$("ag").addEventListener("click",start);$("ch").addEventListener("click",toCfg);$("mb").addEventListener("click",toCfg);
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".bolos", ".boliche"],
  desc: "Bolos: 10 frames con strikes y spares, efecto en la bola, pistas y rival CPU",
  category: "Juegos",
  usage: ".bolos",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[BOLOS] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
