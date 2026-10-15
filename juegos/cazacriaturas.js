import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#06100f;color:#e6fff6;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #2ee6a8;border-radius:28px;background:radial-gradient(circle at 50% 0,#0f3d36,#06100f);box-shadow:0 0 24px #2ee6a833}
small{display:block;font-size:10px;letter-spacing:3px;color:#5ff2c4}
h1{margin:4px 0 6px;font-size:30px;line-height:1.05;color:#b9ffe9;text-shadow:0 0 12px #2ee6a866}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#8fc9b8;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#5ff2c4}
.o{display:grid;gap:8px}.o.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.o.c3{grid-template-columns:repeat(3,minmax(0,1fr))}
.ch{height:46px;border-radius:12px;border:2px solid #1f4d44;background:#07201c;color:#d6fff2;font:bold 12px Roboto,Arial,sans-serif;padding:0 2px;overflow:hidden}
.ch.on{border-color:#b9ffe9;box-shadow:0 0 10px #b9ffe955;background:#0e342d}.ch.off{opacity:.35}
.go,.bt{display:block;width:100%;height:50px;margin-top:12px;border-radius:14px;border:2px solid #2ee6a8;background:#0b2a25;color:#b9ffe9;font:bold 14px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#17c98f,#d6ff7a);color:#052019}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0}
.hud div{text-align:center;border:2px solid #1f6b5c;border-radius:14px;padding:5px 1px;font-size:9px;letter-spacing:1px;color:#8fc9b8;background:#07201c;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:18px;color:#b9ffe9}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;background:#06100ff2;border-radius:16px;text-align:center;overflow:auto}
#ov b.t{font-size:22px;color:#b9ffe9}#ov span.x{font-size:13px;color:#c8efe4;line-height:1.5;white-space:pre-line}#ov .go,#ov .bt{margin:4px 0 0;height:44px;font-size:13px}
.dx{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%;margin:6px 0}
.dx div{border:1px solid #1f6b5c;border-radius:10px;background:#07201c;padding:4px 1px;font-size:9px;line-height:1.3;min-width:0;overflow:hidden}.dx div.u{opacity:.4}.dx canvas{width:100%;display:block}
.row{display:grid;gap:6px;margin-top:8px}.row.r4{grid-template-columns:repeat(4,minmax(0,1fr))}.row.r3{grid-template-columns:repeat(3,minmax(0,1fr))}.row.r2{grid-template-columns:repeat(2,minmax(0,1fr))}
.row .bt{margin:0;height:46px;font-size:13px;padding:0}.row .bt.on{background:#17c98f;color:#052019}.row .bt.off{opacity:.35}
.hint{text-align:center;font-size:12px;color:#8fc9b8;margin:10px 0 0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#6ea697}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #2ee6a8;background:#0b2a25;font-size:16px;line-height:1;padding:0;color:#fff}
</style></head><body><div class="m"><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1>🌿 CAZA DE<br>CRIATURAS</h1>
<div id="cfg"><div class="d">Sal a cazar</div><div class="sub">Camina, encuentra criaturas y atrápalas lanzando pelotas</div>
<h3>🗺️ ZONA</h3><div class="o c2" id="o0"></div>
<h3>🎯 DIFICULTAD</h3><div class="o c3" id="o1"></div>
<button class="go" id="go">▶ SALIR A CAZAR</button><button class="bt" id="cb">📖 MI COLECCIÓN</button></div>
<div id="gm" style="display:none"><div class="hud"><div>NIVEL<b id="h0">1</b></div><div>ATRAPADAS<b id="h1">0</b></div><div>COLECCIÓN<b id="h2">0/16</b></div><div>PELOTAS<b id="h3">0</b></div></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="ov"></div></div>
<div id="mc"><div class="row r3"><button class="bt" id="m1">🔍 EXPLORAR</button><button class="bt" id="m2">🎒 MOCHILA</button><button class="bt" id="m3">📖 COLECCIÓN</button></div><button class="bt" id="mb" style="height:42px;margin-top:8px">⚙ AJUSTES</button><div class="hint">Toca una criatura o una parada 📦 para ir hacia ella. Toca el mapa para caminar.</div></div>
<div id="ec" style="display:none"><div class="row r4" id="ball"><button class="bt on" data-b="0">🔴</button><button class="bt" data-b="1">🔵</button><button class="bt" data-b="2">🟡</button><button class="bt" id="bry">🍓</button></div>
<div class="row r4" id="aim"><button class="bt" data-a="l">◀</button><button class="bt" data-a="u">▲</button><button class="bt" data-a="d">▼</button><button class="bt" data-a="r">▶</button></div>
<div class="row r2"><button class="bt" id="efx">🌀 EFECTO: NO</button><button class="go" id="thr" style="margin:0;height:46px">🎯 LANZAR</button></div>
<button class="bt" id="flee" style="height:42px;margin-top:8px">🏃 HUIR</button><div class="hint">Arrastra el dedo para apuntar y desliza hacia arriba para lanzar, o usa los botones. El círculo que se encoge da bonus.</div></div>
</div>
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
function mGoM(i,t){var s=[60,64,67,72,69,67,64,62][i%8];nt(hz(s),t,.3,"triangle",.28);if(i%4===0)nt(hz(s-24),t,.9,"sine",.4);if(i%2===1)nt(hz(s+12),t,.1,"square",.08)}
function mGoE(i,t){var s=[57,60,64,60,62,65,69,65][i%8];nt(hz(s),t,.14,"square",.16);if(i%2===0)nt(hz(s-24),t,.2,"sawtooth",.28)}
var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,CK="mp_cg",CFK="mp_cg_cfg";
function rn(a,b){return a+Math.random()*(b-a)}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
var ZNL=[["🌳","Parque"],["🏖️","Playa"],["🌃","Ciudad nocturna"],["🌋","Volcán"]],DFL=[["🟢","Fácil",1.25],["🔵","Normal",1],["🔴","Difícil",.8]],LS=[ZNL,DFL],S=[0,1];
try{var c0=(localStorage.getItem(CFK)||"").split(",").map(Number);if(c0.length===2&&c0[0]>=0&&c0[0]<4&&c0[1]>=0&&c0[1]<3)S=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
chips(0);chips(1);
var TYE=["🔥","💧","🌿","⚡","🪨","⭐","🌙","👻"],RARC=["#cfd8dc","#7dff98","#5ab0ff","#ffd34d"],RARN=["Común","Poco común","Rara","Legendaria"];
var CR=[["Flamito",0,"#ff8a3d","#ffe0a8","#ff3d2a",0,0,.5,300],["Brasazor",0,"#e8541f","#ffd08a","#ffcf4d",0,1,.3,800],["Gotín",1,"#4aa8ff","#d6efff","#1d6fd6",1,0,.5,300],["Mareón",1,"#2a7de0","#bfe4ff","#0f4aa0",1,1,.3,800],
["Hojín",2,"#5ed36a","#e5ffd0","#2f9a44",2,0,.5,300],["Raizón",2,"#3fae55","#d2f5b8","#1f6e33",2,1,.3,800],["Chispín",3,"#ffd93d","#fff3b0","#ff9a1d",3,0,.5,300],["Voltarro",3,"#f5b800","#fff0a0","#d97a00",3,1,.3,800],
["Roquito",4,"#b9824a","#e8cfa5","#6b4423",4,0,.5,300],["Terrón",4,"#8f5f30","#d6b58a","#4f3318",4,1,.3,800],["Pelucho",5,"#d9c9b0","#fff4e2","#8a6f4a",5,0,.55,250],["Bolita",5,"#c8b498","#ffeccc","#7a5f3a",5,1,.3,700],
["Lunita",6,"#c9b8ff","#f2edff","#8a6cff",6,2,.15,1400],["Sombrón",7,"#5a4a7a","#a090c8","#2a1a4a",7,2,.15,1400],["Aurorex",6,"#ffe9a0","#fffbe0","#ffb347",8,3,.06,2400],["Nocturno",7,"#2a2440","#6a5a9a","#c0305a",9,3,.06,2400]];
var ZB=[[1,1,4,1,2,3,1,.4],[1,4,1,1,1,3,1,.4],[1,1,1,4,1,2,2,2],[4,.5,.5,1,3,1,1,2]],RW=[60,28,9,3];
var SV={d:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],xp:0,lv:1,tot:0,b:[25,10,5,3]};
try{var o0=JSON.parse(localStorage.getItem(CK));if(o0&&o0.d&&o0.d.length===16&&o0.b&&o0.b.length===4)SV=o0}catch(e){}
function save(){try{localStorage.setItem(CK,JSON.stringify(SV))}catch(e){}}
function tri(q,a,b,c,d,e,f){q.beginPath();q.moveTo(a,b);q.lineTo(c,d);q.lineTo(e,f);q.closePath();q.fill()}
function star(q,cx,cy,r){q.beginPath();for(var i=0;i<10;i++){var a=i*.6283-1.5708,rr=i%2?r*.45:r;q.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}q.closePath();q.fill()}
function drawCr(q,i){var c=CR[i],b=c[2],bl=c[3],ac=c[4],sh=c[5],j;q.lineJoin="round";q.lineCap="round";
 q.fillStyle=ac;
 if(sh===0){q.beginPath();q.moveTo(68,70);q.quadraticCurveTo(92,64,88,36);q.quadraticCurveTo(80,50,74,46);q.quadraticCurveTo(80,32,70,22);q.quadraticCurveTo(66,48,60,58);q.closePath();q.fill();q.fillStyle="#ffe14d";q.beginPath();q.moveTo(72,64);q.quadraticCurveTo(84,56,82,44);q.quadraticCurveTo(76,54,70,54);q.closePath();q.fill()}
 else if(sh===3){q.beginPath();q.moveTo(70,70);q.lineTo(86,56);q.lineTo(80,52);q.lineTo(92,36);q.lineTo(72,48);q.lineTo(78,52);q.lineTo(66,60);q.closePath();q.fill()}
 else if(sh===5){q.fillStyle=b;q.beginPath();q.arc(78,66,10,0,6.3);q.fill()}
 else if(sh===8){q.beginPath();q.moveTo(26,58);q.lineTo(0,24);q.lineTo(12,68);q.closePath();q.fill();q.beginPath();q.moveTo(70,58);q.lineTo(96,24);q.lineTo(84,68);q.closePath();q.fill()}
 else if(sh===9){for(j=0;j<5;j++)tri(q,24+j*12,40,30+j*12,14+(j%2)*8,36+j*12,40);q.fillStyle="#ff4d5e";q.beginPath();q.moveTo(70,70);q.quadraticCurveTo(92,60,86,34);q.quadraticCurveTo(78,48,72,44);q.quadraticCurveTo(76,56,64,62);q.closePath();q.fill()}
 else if(sh===4){tri(q,28,46,34,30,42,44);tri(q,38,40,46,22,54,40);tri(q,52,44,60,30,68,46)}
 q.fillStyle=b;if(sh===7){q.beginPath();q.moveTo(21,56);q.bezierCurveTo(21,32,75,32,75,56);q.lineTo(75,80);q.quadraticCurveTo(68,90,62,80);q.quadraticCurveTo(55,90,48,80);q.quadraticCurveTo(41,90,34,80);q.quadraticCurveTo(28,90,21,80);q.closePath();q.fill()}
 else{q.beginPath();q.ellipse(48,58,27,24,0,0,6.3);q.fill()}
 q.strokeStyle="rgba(0,0,0,.25)";q.lineWidth=1.5;q.stroke();
 q.fillStyle=bl;q.beginPath();q.ellipse(48,sh===7?66:64,sh===7?15:17,sh===7?12:14,0,0,6.3);q.fill();
 q.fillStyle=ac;q.globalAlpha=.55;q.beginPath();q.arc(30,60,3.2,0,6.3);q.fill();q.beginPath();q.arc(66,60,3.2,0,6.3);q.fill();q.globalAlpha=1;
 q.fillStyle=b;
 if(sh===0||sh===3||sh===5||sh===9){tri(q,28,40,30,22,42,34);tri(q,68,40,66,22,54,34);if(sh===3){q.fillStyle=ac;tri(q,30,22,32,10,38,26);tri(q,66,22,64,10,58,26)}if(sh===5){q.fillStyle=b;q.beginPath();q.arc(31,32,10,0,6.3);q.arc(65,32,10,0,6.3);q.fill();q.fillStyle=bl;q.beginPath();q.arc(31,32,5.5,0,6.3);q.fill();q.beginPath();q.arc(65,32,5.5,0,6.3);q.fill()}}
 if(sh===1){q.fillStyle=ac;q.beginPath();q.moveTo(48,4);q.quadraticCurveTo(62,22,48,34);q.quadraticCurveTo(34,22,48,4);q.fill();q.beginPath();q.ellipse(20,62,7,12,-.5,0,6.3);q.ellipse(76,62,7,12,.5,0,6.3);q.fill()}
 if(sh===2){q.fillStyle=ac;q.beginPath();q.ellipse(38,26,12,5.5,-.6,0,6.3);q.ellipse(58,26,12,5.5,.6,0,6.3);q.fill();q.strokeStyle=ac;q.lineWidth=2.5;q.beginPath();q.moveTo(48,38);q.lineTo(48,28);q.stroke()}
 if(sh===4){q.fillStyle=ac;tri(q,44,38,48,22,52,38)}
 if(sh===6){q.strokeStyle=ac;q.lineWidth=6;q.beginPath();q.arc(34,36,16,3.6,5.3);q.stroke();q.beginPath();q.arc(62,36,16,4.1,5.8);q.stroke();q.fillStyle="#fff8c0";star(q,48,36,6)}
 if(sh===8){q.fillStyle="#fff2a8";star(q,48,18,10);q.fillStyle=ac;tri(q,30,34,34,16,42,32);tri(q,66,34,62,16,54,32)}
 var ec=sh===7?"#ffe14d":sh===9?"#ffcf4d":"#fff",pc=sh===7?"#222":sh===9?"#c0305a":"#111";
 for(j=0;j<2;j++){var ex=38+j*20,ey=sh===7?48:50;q.fillStyle=ec;q.beginPath();q.arc(ex,ey,sh===7?6.5:5.6,0,6.3);q.fill();q.fillStyle=pc;q.beginPath();q.arc(ex+1,ey+1,2.8,0,6.3);q.fill();q.fillStyle="#fff";q.beginPath();q.arc(ex+2,ey-.5,1,0,6.3);q.fill()}
 q.strokeStyle="#3a2210";q.lineWidth=1.8;q.beginPath();q.arc(48,sh===7?62:60,4.5,.25,2.9);q.stroke()}
var SPC={};function crSpr(i){if(!SPC[i]){var a=cvs(96,96);drawCr(a[1],i);SPC[i]=a[0]}return SPC[i]}
function ballSpr(t){var a=cvs(40,40),q=a[1],top=["#e8363a","#3a7de0","#f2c230"][t],g;q.fillStyle="#fff";q.beginPath();q.arc(20,20,17,0,6.3);q.fill();q.fillStyle=top;q.beginPath();q.arc(20,20,17,3.1416,6.2832);q.fill();
 q.fillStyle=t===2?"#222":"#1a1a1a";q.fillRect(3,18,34,4);q.fillStyle="#fff";q.beginPath();q.arc(20,20,5.5,0,6.3);q.fill();q.strokeStyle="#1a1a1a";q.lineWidth=2;q.stroke();
 g=q.createRadialGradient(14,13,1,20,20,19);g.addColorStop(0,"rgba(255,255,255,.55)");g.addColorStop(1,"rgba(0,0,0,.25)");q.fillStyle=g;q.beginPath();q.arc(20,20,17,0,6.3);q.fill();return a[0]}
var BSP=[],MAPT=null,PAT=null,BGE=null,VIG=null;
function mapTile(z){var c=document.createElement("canvas");c.width=c.height=120;var q=c.getContext("2d"),i;
 var base=["#7ccf6a","#f0dca0","#1b2038","#2a1410"][z];q.fillStyle=base;q.fillRect(0,0,120,120);
 if(z===0){q.fillStyle="#6fc25d";for(i=0;i<6;i++)q.fillRect((i*37)%100,(i*53)%100,22,16);q.fillStyle="#e8d9a8";q.fillRect(0,54,120,12);q.fillRect(54,0,12,120);q.fillStyle="#3f9a46";for(i=0;i<5;i++){q.beginPath();q.arc((i*43+12)%110,(i*61+8)%110,8,0,6.3);q.fill()}}
 else if(z===1){q.fillStyle="#3aa8e0";q.fillRect(0,60,120,60);q.strokeStyle="rgba(255,255,255,.6)";q.lineWidth=2;q.beginPath();for(i=0;i<3;i++){q.moveTo(8+i*40,78);q.quadraticCurveTo(18+i*40,70,28+i*40,78);q.moveTo(24+i*40,100);q.quadraticCurveTo(34+i*40,92,44+i*40,100)}q.stroke();q.fillStyle="#d9c280";for(i=0;i<5;i++)q.fillRect((i*29)%110,(i*41)%50,6,4)}
 else if(z===2){q.fillStyle="#2b3355";for(i=0;i<4;i++)q.fillRect((i%2)*60+6,(i>>1)*60+6,48,48);q.fillStyle="#ffd66b";for(i=0;i<18;i++)q.fillRect(10+(i*17)%100,10+(i*29)%100,3,3);q.fillStyle="#3a4170";q.fillRect(0,56,120,4);q.fillRect(56,0,4,120)}
 else{q.fillStyle="#ff6a1a";q.beginPath();q.moveTo(0,40);q.bezierCurveTo(30,20,60,70,120,44);q.lineTo(120,56);q.bezierCurveTo(60,84,30,34,0,54);q.closePath();q.fill();q.fillStyle="#ffcf4d";q.fillRect(30,46,10,3);q.fillStyle="#4a2a20";for(i=0;i<5;i++){q.beginPath();q.arc((i*43+10)%110,(i*57+70)%110,7,0,6.3);q.fill()}}
 return c}
function bakeEnc(z){var a=cvs(W,H),q=a[1],g,i,sk=[["#6cc4ff","#dff4ff"],["#7ad0ff","#e8fbff"],["#0a0c24","#3a2a6a"],["#3a0f0f","#ff7a2a"]][z];
 g=q.createLinearGradient(0,0,0,250);g.addColorStop(0,sk[0]);g.addColorStop(1,sk[1]);q.fillStyle=g;q.fillRect(0,0,W,250);
 if(z===2){q.fillStyle="#fff";for(i=0;i<40;i++){q.globalAlpha=.4+Math.random()*.6;q.fillRect(Math.random()*W,Math.random()*140,1.3,1.3)}q.globalAlpha=1;q.fillStyle="#0e1030";for(i=0;i<8;i++){var bh=40+((i*37)%50);q.fillRect(i*40-6,250-bh,34,bh)}q.fillStyle="#ffd66b";for(i=0;i<40;i++)q.fillRect((i*23)%300,170+(i*17)%70,3,4)}
 if(z===3){q.fillStyle="#2a1008";q.beginPath();q.moveTo(70,250);q.lineTo(150,100);q.lineTo(230,250);q.closePath();q.fill();g=q.createRadialGradient(150,100,4,150,100,70);g.addColorStop(0,"rgba(255,170,40,.9)");g.addColorStop(1,"rgba(255,80,0,0)");q.fillStyle=g;q.fillRect(60,30,180,150)}
 if(z===0||z===1){q.fillStyle="#fff";for(i=0;i<3;i++){q.globalAlpha=.8;q.beginPath();q.ellipse(50+i*100,50+(i%2)*30,34,10,0,0,6.3);q.fill()}q.globalAlpha=1}
 if(z===0){q.fillStyle="#58b85a";q.beginPath();q.ellipse(80,262,150,40,0,0,6.3);q.ellipse(240,266,150,44,0,0,6.3);q.fill();q.fillStyle="#2f8a3c";for(i=0;i<7;i++){var tx=i*46+10;tri(q,tx-14,250,tx,205,tx+14,250)}}
 if(z===1){q.fillStyle="#3aa8e0";q.fillRect(0,200,W,50);q.fillStyle="rgba(255,255,255,.5)";for(i=0;i<8;i++)q.fillRect(10+i*38,214+(i%3)*8,22,2)}
 var gr=[["#4cc24a","#2a8a30"],["#f2dc9a","#cfae62"],["#242a4a","#12162e"],["#3a1a12","#1c0a06"]][z];g=q.createLinearGradient(0,250,0,H);g.addColorStop(0,gr[0]);g.addColorStop(1,gr[1]);q.fillStyle=g;q.fillRect(0,250,W,H-250);
 q.fillStyle="rgba(0,0,0,.18)";q.beginPath();q.ellipse(150,262,86,16,0,0,6.3);q.fill();return a[0]}
function mkVig(){var a=cvs(W,H),q=a[1],g=q.createRadialGradient(150,200,100,150,200,260);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.45)");q.fillStyle=g;q.fillRect(0,0,W,H);return a[0]}
var cv=$("c"),x=cv.getContext("2d");x.scale(K,K);
var st=0,zone=0,dfm=1,av={x:0,y:0},cam={x:0,y:0},wt=null,MK=[],STP=[],en=null,ph="",fb=null,cs=null,PT=[],last=0,tm=0,ax=150,ay=190,bsel=0,fxOn=false,gid=0,hc=["","","",""],drag=null,tmo=0,lt=0;
var E=[$("h0"),$("h1"),$("h2"),$("h3")];
function put(i,t){if(hc[i]!==t){hc[i]=t;E[i].textContent=t}}
function dexN(){var n=0;for(var i=0;i<16;i++)if(SV.d[i])n++;return n}
function hud(){put(0,String(SV.lv));put(1,String(SV.tot));put(2,dexN()+"/16");put(3,String(SV.b[0]+SV.b[1]+SV.b[2]))}
function pickCr(){var w=[],tot=0,i,v,r;for(i=0;i<16;i++){v=ZB[zone][CR[i][1]]*RW[CR[i][6]];w.push(v);tot+=v}r=Math.random()*tot;for(i=0;i<16;i++){r-=w[i];if(r<=0)return i}return 0}
function spawn(){var a=rn(0,6.28),d=rn(70,190),ci=pickCr();MK.push({x:av.x+Math.cos(a)*d,y:av.y+Math.sin(a)*d,ci:ci,cp:Math.round(CR[ci][8]*rn(.6,1.4)*(1+(SV.lv-1)*.04)),l:rn(45,90),ph:rn(0,6)})}
function mkStops(){STP=[];for(var i=0;i<2;i++){var a=rn(0,6.28),d=rn(90,170);STP.push({x:av.x+Math.cos(a)*d,y:av.y+Math.sin(a)*d,cd:0})}}
function start(){gid++;zone=S[0];dfm=DFL[S[1]][2];saveCfg();PAT=null;MAPT=mapTile(zone);PAT=x.createPattern(MAPT,"repeat");BGE=bakeEnc(zone);VIG=VIG||mkVig();BSP=[ballSpr(0),ballSpr(1),ballSpr(2)];
 av={x:0,y:0};cam={x:0,y:0};wt=null;MK=[];PT=[];mkStops();for(var i=0;i<6;i++)spawn();en=null;ph="";
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";toMap();hud();fx("s",0,520,.1,"sine",.08,780)}
function saveCfg(){try{localStorage.setItem(CFK,S.join(","))}catch(e){}}
function toCfg(){gid++;st=0;mend();ane();$("gm").style.display="none";$("cfg").style.display="block"}
function toMap(){st=1;en=null;ph="";fb=null;cs=null;$("mc").style.display="block";$("ec").style.display="none";$("ov").style.display="none";mus(mGoM,.26);hud()}
function pop(h){$("ov").innerHTML=h;$("ov").style.display="flex"}
function closePop(){$("ov").style.display="none"}
function xpNeed(){return 300+150*(SV.lv-1)}
function addXp(n){SV.xp+=n;var up=0;while(SV.xp>=xpNeed()){SV.xp-=xpNeed();SV.lv++;up++;SV.b[0]+=10;SV.b[1]+=2;if(SV.lv%3===0)SV.b[2]+=1}if(up){arp([523,659,784,1047,1319],.16,"triangle",.1);return"\n⬆️ ¡Subiste al nivel "+SV.lv+"! +10 🔴 +2 🔵"}return""}
function startEnc(m){en={ci:m.ci,cp:m.cp,x:150,y:195,dod:0,dodT:0,berry:false,tries:0,rt:rn(0,6),sc:0,m:m,fled:false};ph="in";tmo=0;st=2;ax=150;ay=190;fxOn=false;$("efx").textContent="🌀 EFECTO: NO";$("efx").className="bt";
 $("mc").style.display="none";$("ec").style.display="block";selBall();mus(mGoE,.17);var c=CR[m.ci];fx("cry",0,260+m.ci*22,.3,"sawtooth",.08,160+m.ci*12,1);if(c[6]>=2)arp([784,988,1175],.14,"triangle",.09);encUi()}
function selBall(){var i;if(SV.b[bsel]<=0)for(i=0;i<3;i++)if(SV.b[i]>0){bsel=i;break}}
function encUi(){var bs=$("ball").children,i;for(i=0;i<3;i++){bs[i].textContent=["🔴","🔵","🟡"][i]+" "+SV.b[i];bs[i].className="bt"+(bsel===i?" on":"")+(SV.b[i]<=0?" off":"")}bs[3].textContent="🍓 "+SV.b[3];bs[3].className="bt"+(en&&en.berry?" on":"")+(SV.b[3]<=0&&!(en&&en.berry)?" off":"");hud()}
function useBerry(){if(!en||ph!=="aim"||en.berry||SV.b[3]<=0)return;SV.b[3]--;en.berry=true;save();fx("br",0,500,.12,"sine",.1,700,1);nz("nm",0,.2,900,.2);encUi()}
function ringF(){return .35+.65*(.5+.5*Math.sin(tm*1.7+en.rt))}
function throwBall(tx,ty){if(ph!=="aim"||SV.b[bsel]<=0)return;SV.b[bsel]--;save();en.tries++;fb={t:0,tx:tx,ty:ty,rf:ringF(),cv:fxOn,sd:Math.random()<.5?-1:1,dod:false,bt:bsel};ph="fly";nz("th",0,.25,900,.3,1.2);if(fxOn)fx("sp",0,500,.2,"sine",.06,900);encUi()}
function dist(a,b,c,d){var dx=a-c,dy=b-d;return Math.sqrt(dx*dx+dy*dy)}
function resolveHit(){var c=CR[en.ci],cxp=150+en.dod,cyp=195,dd=dist(fb.tx,fb.ty,cxp,cyp);
 if(fb.dodded||dd>54){ph="miss";tmo=0;fx("ms",0,360,.3,"triangle",.1,170,1);fb.ms=fb.dodded?"¡Esquivó!":"¡Fallaste!";return}
 var f=fb.rf,rb="",rm=1;if(dd<=f*60){if(f<.45){rb="¡Excelente!";rm=1.85}else if(f<.62){rb="¡Genial!";rm=1.5}else if(f<.8){rb="¡Bien!";rm=1.3}}
 var bm=[1,1.5,2][fb.bt],mult=bm*rm*(fb.cv?1.7:1)*(en.berry?1.5:1),pb=c[7]*dfm*.85*(1-Math.min(.6,en.cp/(3200+SV.lv*80))),p=1-Math.pow(1-Math.min(.95,pb),mult);
 var caught=Math.random()<p;cs={t:0,ph:0,caught:caught,shakes:caught?3:1+(Math.random()<.5?1:0),rb:rb,rm:rm,sk:0,sn:0,bx:fb.tx,by:fb.ty};ph="cap";
 if(rb){arp(rm>1.7?[784,1047,1319]:[659,880],.1,"triangle",.09)}nz("ht",0,.12,1200,.35);fx("ht2",0,300,.1,"square",.12,150,1)}
function endEnc(msg,xt){ph="end";var c=CR[en.ci];pop('<b class="t">'+msg+'</b><span class="x">'+xt+'</span><button class="go" data-act="map">🗺️ VOLVER AL MAPA</button>')}
function capRes(){var c=CR[en.ci],isNew=!SV.d[en.ci],xp=100+c[6]*150+(cs.rb?(cs.rm>1.7?100:cs.rm>1.4?50:20):0)+(fb.cv?50:0)+(isNew?300:0),up;
 if(en.cp>SV.d[en.ci])SV.d[en.ci]=en.cp;SV.tot++;up=addXp(xp);save();arp([523,659,784,1047,1319,1568],.14,"triangle",.11);nz("cr",0,.7,1600,.25);burst(150,260,40);
 var sp=document.createElement("canvas");
 pop('<b class="t">¡'+c[0]+' atrapado!</b><canvas id="pc" width="120" height="120" style="width:120px;height:120px"></canvas><span class="x">'+TYE[c[1]]+" PC "+en.cp+" · "+RARN[c[6]]+(isNew?"\n✨ ¡Nueva criatura en tu colección!":"")+"\n+"+xp+" XP"+up+'</span><button class="go" data-act="map">🗺️ VOLVER AL MAPA</button>');
 var pc=$("pc");if(pc&&pc.getContext){var q=pc.getContext("2d");q.drawImage(crSpr(en.ci),0,0,120,120)}
 var m=en.m,i=MK.indexOf(m);if(i>=0)MK.splice(i,1);ph="end"}
function breakOut(){var c=CR[en.ci];fx("bk",0,400,.3,"sawtooth",.1,120,1);nz("bo",0,.3,800,.4);burst(150,300,22);var fl=c[6]*.1+.12+en.tries*.04;
 if(Math.random()<fl){var m=en.m,i=MK.indexOf(m);if(i>=0)MK.splice(i,1);arp([400,330,260],.2,"sawtooth",.08);endEnc("¡"+c[0]+" huyó!","Se escapó de la pelota y salió corriendo.");return}
 ph="aim";cs=null;fb=null;if(SV.b[0]+SV.b[1]+SV.b[2]<=0){endEnc("Sin pelotas","Ya no te quedan pelotas. Visita una parada 📦 para conseguir más.");return}selBall();encUi()}
function burst(bx,by,n){for(var i=0;i<n;i++){var a=rn(0,6.28),v=rn(.8,3);PT.push({x:bx,y:by,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,l:1,c:["#ffe14d","#fff","#7dff98","#5ab0ff","#ff7ac8"][i%5]})}}
function aimThrow(){throwBall(ax,ay)}
function updMap(dt,k){var i,m,d;
 if(wt){var tx=wt.m?wt.m.x:wt.x,ty=wt.m?wt.m.y:wt.y,dx=tx-av.x,dy=ty-av.y;d=Math.sqrt(dx*dx+dy*dy);
  if(wt.m&&d<=95){var m2=wt.m;wt=null;if(m2.ci!==undefined)startEnc(m2);else collect(m2);return}
  if(d>3){var sp=75*dt/Math.max(1,d);av.x+=dx*sp*(wt.m?1:1);av.y+=dy*sp}else if(!wt.m)wt=null}
 cam.x+=(av.x-cam.x)*Math.min(1,.2*k);cam.y+=(av.y-cam.y)*Math.min(1,.2*k);
 for(i=MK.length-1;i>=0;i--){m=MK[i];m.l-=dt;if(m.l<=0||dist(m.x,m.y,av.x,av.y)>420)MK.splice(i,1)}
 lt+=dt;if(lt>1.2&&MK.length<7){lt=0;spawn();fx("rd",0,880,.05,"sine",.04,1100)}
 for(i=0;i<STP.length;i++){m=STP[i];if(m.cd>0)m.cd-=dt;if(dist(m.x,m.y,av.x,av.y)>420){var a=rn(0,6.28);m.x=av.x+Math.cos(a)*rn(110,200);m.y=av.y+Math.sin(a)*rn(110,200);m.cd=0}}}
function collect(s){if(s.cd>0){fx("no",0,200,.2,"square",.08,150);return}s.cd=50;var n=3+(Math.random()*4|0),sb=Math.random()<.4?1:0,br=Math.random()<.5?1:0;SV.b[0]+=n;SV.b[1]+=sb;SV.b[3]+=br;save();arp([523,659,784],.12,"triangle",.1);hud();
 pop('<b class="t">📦 ¡Parada!</b><span class="x">+'+n+" 🔴"+(sb?" +1 🔵":"")+(br?" +1 🍓":"")+'</span><button class="go" data-act="close">OK</button>')}
function updEnc(dt,k){var e=en;tmo+=dt;
 e.sc+=((ph==="cap"&&cs&&cs.ph>=1)?0:1)*0;
 if(ph==="in"){e.sc=Math.min(1,tmo/.7);if(tmo>.8){ph="aim";tmo=0}}
 if(ph==="aim"||ph==="fly"){e.dodT-=dt;var df=(e.berry?.3:1)*(.06+CR[e.ci][6]*.1);if(e.dodT<=0&&ph==="aim"&&Math.random()<df*dt*.5){e.dodT=1.2;e.dd=Math.random()<.5?-1:1}if(e.dodT>0){e.dod+=((e.dd||1)*55-e.dod)*Math.min(1,.2*k)}else e.dod+=(0-e.dod)*Math.min(1,.12*k)}
 if(ph==="fly"){fb.t+=dt/.6;if(!fb.dod&&fb.t>.5){fb.dod=true;var dp=(e.berry?.3:1)*(.05+CR[e.ci][6]*.12);if(Math.random()<dp){fb.dodded=true;e.dodT=1;e.dd=Math.random()<.5?-1:1;fx("dg",0,700,.15,"sine",.08,1200)}}if(fb.t>=1)resolveHit()}
 if(ph==="miss"&&tmo>.9){ph="aim";fb=null;if(SV.b[0]+SV.b[1]+SV.b[2]<=0){endEnc("Sin pelotas","Ya no te quedan pelotas. Visita una parada 📦 para conseguir más.")}else{selBall();encUi()}}
 if(ph==="cap"){cs.t+=dt;var c0=cs;
  if(c0.ph===0&&c0.t>.4){c0.ph=1;c0.t=0;fx("ab",0,900,.5,"sine",.1,200,1)}
  else if(c0.ph===1&&c0.t>.55){c0.ph=2;c0.t=0}
  else if(c0.ph===2&&c0.t>.55){c0.ph=3;c0.t=0;c0.sk=0;fx("st",0,250,.1,"triangle",.14,120,1)}
  else if(c0.ph===3){if(c0.t>.85){c0.t=0;c0.sk++;if(c0.sk>=c0.shakes){c0.ph=4;c0.t=0}else fx("sh"+c0.sk,0,300+c0.sk*60,.1,"square",.1,200,1)}else if(c0.t<.04&&c0.sk===0)fx("sh0",0,300,.1,"square",.1,200,1)}
  else if(c0.ph===4&&c0.t>.5){if(c0.caught)capRes();else{breakOut()}}}
 var i,p;for(i=PT.length-1;i>=0;i--){p=PT[i];p.x+=p.vx*k;p.y+=p.vy*k;p.vy+=.06*k;p.l-=dt*.9;if(p.l<=0)PT.splice(i,1)}}
function drawMap(){var i,m,sx,sy,sz;x.setTransform(K,0,0,K,0,0);x.fillStyle="#000";x.fillRect(0,0,W,H);
 x.setTransform(K,0,0,K,K*(150-cam.x),K*(200-cam.y));x.fillStyle=PAT;x.fillRect(cam.x-160,cam.y-210,320,420);
 x.fillStyle="rgba(46,230,168,.10)";x.beginPath();x.arc(av.x,av.y,95,0,6.3);x.fill();x.strokeStyle="rgba(46,230,168,.5)";x.lineWidth=1.5;x.stroke();
 for(i=0;i<STP.length;i++){m=STP[i];x.fillStyle=m.cd>0?"#7a6a9a":"#3da5ff";x.fillRect(m.x-8,m.y-8+Math.sin(tm*2+i)*2,16,16);x.fillStyle="rgba(255,255,255,.7)";x.fillRect(m.x-8,m.y-8+Math.sin(tm*2+i)*2,16,4);x.fillStyle="#fff";x.font="10px serif";x.textAlign="center";x.fillText("📦",m.x,m.y+4+Math.sin(tm*2+i)*2)}
 for(i=0;i<MK.length;i++){m=MK[i];var inr=dist(m.x,m.y,av.x,av.y)<=95;x.globalAlpha=m.l<6?m.l/6:1;
  x.fillStyle="rgba(0,0,0,.25)";x.beginPath();x.ellipse(m.x,m.y+16,13,4,0,0,6.3);x.fill();x.strokeStyle=RARC[CR[m.ci][6]];x.lineWidth=2.5;x.beginPath();x.arc(m.x,m.y+Math.sin(tm*3+m.ph)*2,19,0,6.3);x.stroke();
  x.drawImage(crSpr(m.ci),m.x-17,m.y-17+Math.sin(tm*3+m.ph)*2,34,34);if(!inr){x.fillStyle="rgba(0,0,0,.35)";x.beginPath();x.arc(m.x,m.y,19,0,6.3);x.fill()}x.globalAlpha=1}
 x.fillStyle="#2d7bff";x.beginPath();x.arc(av.x,av.y,8,0,6.3);x.fill();x.strokeStyle="#fff";x.lineWidth=2.5;x.stroke();x.fillStyle="#fff";x.beginPath();x.arc(av.x,av.y-2,3,0,6.3);x.fill();
 if(wt){var tx=wt.m?wt.m.x:wt.x,ty=wt.m?wt.m.y:wt.y;x.strokeStyle="rgba(255,255,255,.7)";x.lineWidth=1.5;x.beginPath();x.arc(tx,ty,6+Math.sin(tm*6)*2,0,6.3);x.stroke()}
 x.setTransform(K,0,0,K,0,0);x.drawImage(VIG,0,0,W,H);
 x.fillStyle="rgba(6,16,15,.7)";x.fillRect(6,6,98,18);x.fillStyle="#17c98f";x.fillRect(8,18,Math.max(2,94*SV.xp/xpNeed()),4);x.fillStyle="#fff";x.font="bold 10px Roboto,Arial,sans-serif";x.textAlign="left";x.fillText("Nv "+SV.lv+" · XP "+SV.xp+"/"+xpNeed(),10,15)}
function drawEnc(){var e=en,c=CR[e.ci],i,p;x.setTransform(K,0,0,K,0,0);x.drawImage(BGE,0,0,W,H);
 var bob=Math.sin(tm*2.2)*4,sc=ph==="in"?e.sc:1,cxp=150+e.dod,cyp=195+bob,sz=112*sc,rr=RARC[c[6]];
 if(cs&&cs.ph>=1&&cs.ph<=2){var u=cs.ph===1?Math.min(1,cs.t/.55):1;sz=112*(1-u)*sc;cxp+=(cs.bx-cxp)*u;cyp+=(cs.by-cyp)*u}
 else if(cs&&cs.ph>=3)sz=0;
 if(ph==="cap"&&cs.ph===4&&!cs.caught&&cs.t>.3){sz=112*Math.min(1,(cs.t-.3)/.2)}
 if(c[6]>=2&&sz>0){x.globalAlpha=.35+.15*Math.sin(tm*3);x.fillStyle=rr;x.beginPath();x.arc(cxp,cyp,sz*.62,0,6.3);x.fill();x.globalAlpha=1}
 if(sz>1)x.drawImage(crSpr(e.ci),cxp-sz/2,cyp-sz/2,sz,sz);
 if(ph==="aim"){var f=ringF(),col=f<.45?"#ff4d4d":f<.62?"#ff9a3d":f<.8?"#ffe14d":"#5cff7a";x.strokeStyle="rgba(255,255,255,.35)";x.lineWidth=2;x.beginPath();x.arc(cxp,cyp,60,0,6.3);x.stroke();x.strokeStyle=col;x.lineWidth=4;x.beginPath();x.arc(cxp,cyp,f*60,0,6.3);x.stroke();
  x.strokeStyle="#fff";x.lineWidth=1.5;x.beginPath();x.arc(ax,ay,9,0,6.3);x.moveTo(ax-14,ay);x.lineTo(ax-5,ay);x.moveTo(ax+5,ay);x.lineTo(ax+14,ay);x.moveTo(ax,ay-14);x.lineTo(ax,ay-5);x.moveTo(ax,ay+5);x.lineTo(ax,ay+14);x.stroke()}
 var bx=150,by=362,bs=1,bro=0;
 if(ph==="fly"){var t=Math.min(1,fb.t),ex=fb.cv?Math.sin(t*3.1416)*fb.sd*46*(1-t):0;bx=150+(fb.tx-150)*t+ex;by=362+(fb.ty-362)*t-Math.sin(t*3.1416)*70;bs=1-.5*t;bro=tm*14}
 else if(ph==="miss"){bx=fb.tx;by=Math.min(330,fb.ty+tmo*160);bs=.5;bro=0}
 else if(ph==="cap"){var o=cs;
  if(o.ph<=2){if(o.ph<2){bx=o.bx;by=o.by}else{var u2=Math.min(1,o.t/.55);bx=o.bx+(150-o.bx)*u2;by=o.by+(300-o.by)*u2+(Math.abs(Math.sin(u2*6))*(1-u2))*-30}bs=.62;if(o.ph===0&&o.t<.25){x.fillStyle="rgba(255,255,255,"+(.7-o.t*2.8)+")";x.beginPath();x.arc(bx,by,26,0,6.3);x.fill()}}
  else{bx=150;by=300;bs=.62;if(o.ph===3){var tt2=o.t;bro=(tt2<.5?Math.sin(tt2/.5*3.1416)*.4*(o.sk%2?-1:1):0)}else if(o.ph===4){if(o.caught){x.globalAlpha=.8*(1-Math.min(1,o.t/.5));x.fillStyle="#ffe14d";x.beginPath();x.arc(150,300,18+o.t*60,0,6.3);x.fill();x.globalAlpha=1}else{bs=.62*(1-Math.min(1,o.t/.25))}}}}
 if(ph!=="end"&&bs>.02){x.save();x.translate(bx,by);x.rotate(bro);x.drawImage(BSP[ph==="aim"||ph==="in"?bsel:(fb?fb.bt:bsel)],-20*bs*1.3,-20*bs*1.3,40*bs*1.3,40*bs*1.3);x.restore()}
 for(i=0;i<PT.length;i++){p=PT[i];x.globalAlpha=Math.max(0,p.l);x.fillStyle=p.c;x.fillRect(p.x,p.y,3.5,3.5)}x.globalAlpha=1;
 x.drawImage(VIG,0,0,W,H);
 x.fillStyle="rgba(6,16,15,.7)";x.fillRect(0,0,W,46);x.textAlign="center";x.fillStyle=rr;x.font="bold 11px Roboto,Arial,sans-serif";x.fillText(RARN[c[6]].toUpperCase(),150,13);x.fillStyle="#fff";x.font="bold 18px Roboto,Arial,sans-serif";x.fillText(c[0]+"  "+TYE[c[1]],150,32);x.font="bold 11px Roboto,Arial,sans-serif";x.fillStyle="#b9ffe9";x.fillText("PC "+e.cp,150,44);
 if(ph==="aim"&&e.berry){x.fillStyle="#ff7a9a";x.font="12px serif";x.fillText("🍓",270,30)}
 if(ph==="miss"||(ph==="cap"&&cs.rb&&cs.ph<2)){var tx=ph==="miss"?fb.ms:cs.rb;x.font="bold 22px Roboto,Arial,sans-serif";x.lineWidth=5;x.strokeStyle="rgba(0,0,0,.8)";x.strokeText(tx,150,110);x.fillStyle="#ffe14d";x.fillText(tx,150,110)}
 x.textAlign="left"}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
 if(!document.hidden&&st>0){var k=dt*60,i,p;tm+=dt;
  if(st===1){updMap(dt,k);for(i=PT.length-1;i>=0;i--){p=PT[i];p.x+=p.vx*k;p.y+=p.vy*k;p.l-=dt;if(p.l<=0)PT.splice(i,1)}drawMap()}
  else if(st===2&&en){updEnc(dt,k);if(en)drawEnc()}}
 requestAnimationFrame(loop)}
function pt(e){var r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]}
cv.addEventListener("pointerdown",function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(z){}var p=pt(e);
 if(st===1){var wx=cam.x+p[0]-150,wy=cam.y+p[1]-200,i,m,bd=26,bm=null;for(i=0;i<MK.length;i++){m=MK[i];var d=dist(m.x,m.y,wx,wy);if(d<bd){bd=d;bm=m}}for(i=0;i<STP.length;i++){m=STP[i];if(dist(m.x,m.y,wx,wy)<bd){bd=dist(m.x,m.y,wx,wy);bm=m}}
  if(bm){wt={m:bm};fx("ui2",0,660,.05,"sine",.06,880)}else{wt={x:wx,y:wy}}}
 else if(st===2&&ph==="aim"){drag={x:p[0],y:p[1],t:Date.now(),f:false};if(p[1]<300){ax=p[0];ay=p[1]}}});
cv.addEventListener("pointermove",function(e){e.preventDefault();if(!drag||st!==2||ph!=="aim")return;var p=pt(e),dx=p[0]-drag.x,dy=p[1]-drag.y;
 if(drag.y>300){if(dy<-34){var ms=Math.max(30,Date.now()-drag.t),v=Math.sqrt(dx*dx+dy*dy)/ms,tx=150+dx*3,ty=362-Math.max(80,Math.min(330,80+v*260));drag=null;throwBall(Math.max(20,Math.min(280,tx)),ty)}}
 else{ax=Math.max(20,Math.min(280,p[0]));ay=Math.max(60,Math.min(300,p[1]))}});
cv.addEventListener("pointerup",function(){drag=null});cv.addEventListener("pointercancel",function(){drag=null});
$("aim").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(!a||ph!=="aim")return;if(a==="l")ax=Math.max(20,ax-12);else if(a==="r")ax=Math.min(280,ax+12);else if(a==="u")ay=Math.max(60,ay-12);else ay=Math.min(300,ay+12)});
$("ball").addEventListener("click",function(e){var b=e.target.getAttribute&&e.target.getAttribute("data-b");if(b!==null&&b!==undefined&&ph==="aim"&&SV.b[+b]>0){bsel=+b;encUi()}});
$("bry").addEventListener("click",useBerry);
$("efx").addEventListener("click",function(){fxOn=!fxOn;this.textContent="🌀 EFECTO: "+(fxOn?"SÍ":"NO");this.className="bt"+(fxOn?" on":"")});
$("thr").addEventListener("click",aimThrow);
$("flee").addEventListener("click",function(){if(st!==2||!en||ph==="fly"||ph==="cap")return;var m=en.m;toMap();fx("fl",0,500,.2,"triangle",.08,250,1)});
function colHtml(){var h='<b class="t">📖 Colección '+dexN()+'/16</b><div class="dx">',i;for(i=0;i<16;i++)h+='<div class="'+(SV.d[i]?"":"u")+'"><canvas width="48" height="48" data-i="'+i+'"></canvas>'+(SV.d[i]?CR[i][0]+"<br>PC "+SV.d[i]:"???")+"</div>";return h+'</div><button class="go" data-act="close">CERRAR</button>'}
function showCol(){pop(colHtml());var cs2=$("ov").querySelectorAll?$("ov").querySelectorAll("canvas"):[];for(var i=0;i<cs2.length;i++){var ci=+cs2[i].getAttribute("data-i"),q=cs2[i].getContext("2d");if(SV.d[ci])q.drawImage(crSpr(ci),0,0,48,48);else{q.fillStyle="#1f4d44";q.beginPath();q.arc(24,24,14,0,6.3);q.fill()}}}
function showBag(){pop('<b class="t">🎒 Mochila</b><span class="x">🔴 Pelotas: '+SV.b[0]+"\n🔵 Súper pelotas: "+SV.b[1]+"\n🟡 Ultra pelotas: "+SV.b[2]+"\n🍓 Frambuesas: "+SV.b[3]+"\n\nNivel "+SV.lv+" · "+SV.tot+' atrapadas</span><button class="go" data-act="close">CERRAR</button>')}
$("ov").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-act");if(a==="close")closePop();else if(a==="map"){closePop();toMap()}});
$("m1").addEventListener("click",function(){var i;for(i=0;i<3;i++)spawn();fx("rd",0,880,.1,"sine",.08,1300);wt={x:av.x+rn(-80,80),y:av.y+rn(-80,80)}});
$("m2").addEventListener("click",showBag);$("m3").addEventListener("click",showCol);$("cb").addEventListener("click",function(){$("cfg").style.display="none";$("gm").style.display="block";st=0;$("mc").style.display="none";$("ec").style.display="none";showCol();$("ov").querySelector&&0});
$("go").addEventListener("click",start);$("mb").addEventListener("click",toCfg);
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".pokemongo", ".cazacriaturas"],
  desc: "Caza de criaturas estilo Pokémon GO: camina por el mapa, lanza pelotas y completa tu colección",
  category: "Juegos",
  usage: ".cazacriaturas",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[CAZACRIATURAS] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
