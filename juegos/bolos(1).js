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
</style></head><body><div class="m"><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1>🎳 BOLOS</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Tú tiras en primera persona; los bots juegan y tú los ves</div>
<h3>👥 JUGADORES</h3><div class="o c3" id="o1"></div>
<h3>🔢 CUADROS</h3><div class="o c2" id="o2"></div>
<h3>🤖 NIVEL DE LOS BOTS</h3><div class="o c3" id="o3"></div>
<h3>🏟️ PISTA</h3><div class="o c2" id="o0"></div>
<h3>🎳 COLOR DE BOLA</h3><div class="o c3" id="o4"></div>
<h3>⚖️ PESO DE LA BOLA</h3><div class="o c3" id="o5"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm" style="display:none">
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="sbv"></div><div id="ov"><b>🏁 FIN</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
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
var THL=[["🪵","Clásica"],["🌌","Neón"],["🕹️","Retro"],["🪐","Espacial"]],PLC=[["👥","2 jugadores",2],["👥","4 jugadores",4],["👥","6 jugadores",6]],FRC=[["⚡","5 cuadros",5],["🎯","10 cuadros",10]];
var BDF=[["🟢","Fáciles",.03],["🔵","Normales",.017],["🔴","Expertos",.009]],BCL=[["🔵","Azul","#3da5ff"],["🔴","Rojo","#ff4d5e"],["🟢","Verde","#39ff7a"],["🟣","Morado","#b06cff"],["🟠","Naranja","#ff9a3d"],["⚫","Negra","#3a3a4a"]],WGT=[["🪶","Ligera",7],["⚖️","Media",12],["🏋️","Pesada",16]];
var LS=[THL,PLC,FRC,BDF,BCL,WGT],S=[0,0,0,1,0,1];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===6&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var k0=0;k0<6;k0++)chips(k0);
var cv=$("c"),x=cv.getContext("2d");x.scale(K,K);
var F=520,HY=130,CH=90,ZH=900,LW=50,PR=5.75,BR=10.2,Z0=-60,CZ0=-260,PJ=[0,0,0];
var AVE=["🙂","🤖","👾","🐱","🦊","🐸"],AVN=["Tú","Rex","Zed","Kira","Neo","Luna"],AVC=["#2d7bff","#e0364a","#e0364a","#e0364a","#e0364a","#e0364a"];
var THC=[{wall:"#2a1a10",lane:"#d9a95f",far:"#8f6c38",ln:"rgba(90,50,10,.28)",gut:"#26180d",arr:"#7a2020",app:"#b88a4a",bg:"#120a05"},{wall:"#080a2a",lane:"#0d1238",far:"#05071c",ln:"rgba(34,245,255,.35)",gut:"#05061a",arr:"#ff3df2",app:"#141a4a",bg:"#03040f"},{wall:"#1a0636",lane:"#3a2580",far:"#1c1040",ln:"rgba(255,207,77,.3)",gut:"#0a0414",arr:"#ffcf4d",app:"#2b1b5e",bg:"#0a0414"},{wall:"#050c26",lane:"#142a6a",far:"#0a1640",ln:"rgba(160,200,255,.28)",gut:"#02040e",arr:"#9fd0ff",app:"#0e1c4a",bg:"#02040c"}];
var st=0,TC,NP=2,NF=5,PL=[],cur=0,fi=0,pins=[],ball=null,left=10,wasFull=true,sx=0,ang=0,pw=.7,hk=0,BM=12,tmr=0,settle=0,gutS=0,toast="",tt=0,tts=1,last=0,gid=0,cz=CZ0,tcz=CZ0,bt=0,bpl=null,bxx=0,msg="",best5=ld(KEY+"5"),best10=ld(KEY+"10"),tm=0,BG=null,LG=null,PSP=null,BSP=null,AV=[],sw=null,sbOpen=false,BDv=.017;
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
function pj(X,Z,Y){var zc=Z-cz;if(zc<30)zc=30;var s=F/zc;PJ[0]=150+X*s;PJ[1]=HY+(CH-Y)*s;PJ[2]=s;return PJ}
function bakeBG(t){var a=cvs(W,H),q=a[1],c=THC[t],g,i;q.fillStyle=c.bg;q.fillRect(0,0,W,H);
 g=q.createLinearGradient(0,0,0,HY);g.addColorStop(0,"#000");g.addColorStop(1,c.wall);q.fillStyle=g;q.fillRect(0,0,W,HY);
 q.fillStyle="#c9a24a";q.fillRect(80,52,140,70);q.fillStyle=t===1?"#13206a":"#3a74b5";q.beginPath();q.moveTo(92,58);q.lineTo(208,58);q.lineTo(150,114);q.closePath();q.fill();
 q.fillStyle="#fff";for(i=0;i<3;i++){q.beginPath();q.ellipse(128+i*22,78,6,13,0,0,6.3);q.fill()}q.fillStyle="#e43b3b";q.beginPath();q.arc(150,98,10,0,6.3);q.fill();
 q.fillStyle="rgba(255,255,255,.12)";for(i=0;i<8;i++)q.fillRect(20+i*36,20,18,4);
 return a[0]}
function ballSpr(c){var a=cvs(40,40),q=a[1],g=q.createRadialGradient(15,14,2,20,20,19);g.addColorStop(0,"#fff");g.addColorStop(.22,c);g.addColorStop(1,"#000");q.fillStyle=g;q.beginPath();q.arc(20,20,18,0,6.3);q.fill();return a[0]}
function pinSpr(){var a=cvs(24,60),q=a[1],g=q.createLinearGradient(0,0,24,0);g.addColorStop(0,"#bdbdbd");g.addColorStop(.4,"#fff");g.addColorStop(1,"#c4c4c4");q.fillStyle=g;
 q.beginPath();q.moveTo(12,2);q.bezierCurveTo(18,2,19,10,17,16);q.bezierCurveTo(16,22,22,34,22,44);q.bezierCurveTo(22,56,18,58,12,58);q.bezierCurveTo(6,58,2,56,2,44);q.bezierCurveTo(2,34,8,22,7,16);q.bezierCurveTo(5,10,6,2,12,2);q.closePath();q.fill();
 q.fillStyle="#e43b3b";q.fillRect(7,15,10,3);q.fillRect(7,20,11,3);return a[0]}
function avSpr(i){var a=cvs(30,30),q=a[1];q.fillStyle=AVC[i];q.beginPath();q.arc(15,15,14,0,6.3);q.fill();q.fillStyle="#fff";q.beginPath();q.arc(15,15,11,0,6.3);q.fill();q.font="15px serif";q.textAlign="center";q.textBaseline="middle";q.fillText(AVE[i],15,16);return a[0]}
var E1=null;
var cardM=[];
function refresh(){for(var i=0;i<NP;i++)PL[i].t=lastTot(PL[i].F);var fr=PL[cur]&&PL[cur].F[fi]||[];cardM=fr.length?marks(fr,fi).split(" "):[];sbRefresh()}
function setPw(){$("pwf").style.transform="scaleX("+pw+")"}
function setEf(){$("efk").style.left=((hk+1)/2*90)+"%"}
function newTurn(){left=10;pins=mkPins();wasFull=true;ball=null;ang=0;sx=0;toast="";if(PL[cur].h){st=1;msg="Tu turno"}else{st=4;bt=0;bpl=botPlan();bxx=0;msg="Turno de "+PL[cur].n}tcz=CZ0;refresh()}
function start(){gid++;TC=THC[S[0]];NP=PLC[S[1]][2];NF=FRC[S[2]][2];BDv=BDF[S[3]][2];BM=WGT[S[5]][2];sv(CK,S.join(","));BG=bakeBG(S[0]);LG=x.createLinearGradient(0,HY,0,310);LG.addColorStop(0,TC.far);LG.addColorStop(1,TC.lane);BSP=ballSpr(BCL[S[4]][2]);PSP=pinSpr();AV=[];PL=[];
 for(var i=0;i<NP;i++){AV.push(avSpr(i));PL.push({n:AVN[i],e:AVE[i],h:i===0,F:[],t:0})}
 cur=0;fi=0;cz=CZ0;tcz=CZ0;pw=.7;hk=0;tt=0;sbOpen=false;$("sbv").style.display="none";
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";setPw();setEf();fx("s",0,520,.1,"sine",.08,780);mus(mBol,.3);newTurn()}
function toCfg(){gid++;st=0;mend();ane();$("gm").style.display="none";$("cfg").style.display="block"}
function endGame(){st=5;mend();ane();var r=[],i,b=NF===5?best5:best10;for(i=0;i<NP;i++)r.push({p:PL[i],t:lastTot(PL[i].F)});r.sort(function(a,c){return c.t-a.t});
 var me=r.filter(function(o){return o.p.h})[0],win=r[0].t===me.t,pos=r.indexOf(me)+1,med=["🥇","🥈","🥉"],txt="";
 for(i=0;i<r.length;i++)txt+=(med[i]||(i+1)+".")+" "+r[i].p.e+" "+r[i].p.n+" — "+r[i].t+"\n";
 if(me.t>b){if(NF===5){best5=me.t;sv(KEY+"5",me.t)}else{best10=me.t;sv(KEY+"10",me.t)}}
 $("ot").textContent=(win?"🏆 ¡Ganaste!":"Terminaste en el lugar "+pos)+"\n"+txt+"Tu récord ("+NF+" cuadros): "+(NF===5?best5:best10);$("ov").style.display="flex";
 arp(win?[523,659,784,1047]:[392,349,311],.2,win?"triangle":"sawtooth",.1);sbRefresh()}
function shout(m,s){toast=m;tt=s||1.5;tts=1}
function throwBall(x0,a,p,h){var v=5+8*p;ball={x:x0,z:Z0,vx:Math.sin(a)*v,vz:Math.cos(a)*v,r:BR,m:BM,al:true,g:0,rot:0,hk:h};st=2;tmr=0;settle=0;gutS=0;nz("rl",0,.3,350,.3,.8);ans(170,.2)}
function launch(){if(st!==1||!PL[cur].h)return;throwBall(sx,ang,pw,hk)}
function hit(a,b,ma,mb,e){var dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz,rr=a.r+b.r;if(d2>=rr*rr||d2<1e-6)return 0;var d=Math.sqrt(d2),nx=dx/d,nz2=dz/d,ov=rr-d,s=ma+mb;
 a.x-=nx*ov*mb/s;a.z-=nz2*ov*mb/s;b.x+=nx*ov*ma/s;b.z+=nz2*ov*ma/s;var rv=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz2;if(rv>=0)return .01;var j=-(1+e)*rv/(1/ma+1/mb);a.vx-=j*nx/ma;a.vz-=j*nz2/ma;b.vx+=j*nx/mb;b.vz+=j*nz2/mb;return -rv}
function crash(v){fx("pk",55,650+Math.random()*700,.05,"square",Math.min(.16,.04+v*.03));nz("ph",55,.09,1500+Math.random()*1500,Math.min(.4,.12+v*.05))}
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
   else if(!ball.g)for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;imp=hit(ball,p,ball.m,3.5,.9);if(imp){if(imp>.7)p.d=1;if(imp>.4)crash(imp)}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;if(p.vx||p.vz){p.x+=p.vx*dt;p.z+=p.vz*dt;
   if(p.z>1012){p.d=1;p.o=1;continue}
   if(p.x<-68){p.x=-68;p.vx=Math.abs(p.vx)*.5}else if(p.x>68){p.x=68;p.vx=-Math.abs(p.vx)*.5}
   if(p.z<ZH-60){p.z=ZH-60;p.vz=Math.abs(p.vz)*.5}}}
  for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;for(j=i+1;j<pins.length;j++){q=pins[j];if(q.o)continue;
   if(Math.abs(p.x-q.x)>12||Math.abs(p.z-q.z)>12)continue;if(!(p.vx||p.vz||q.vx||q.vz))continue;imp=hit(p,q,3.5,3.5,.88);if(imp>.3){if(imp>.8){p.d=1;q.d=1}if(imp>.8)crash(imp*.6)}}}}
 var f=Math.pow(.9,k),f2=Math.pow(.992,k);
 for(i=0;i<pins.length;i++){p=pins[i];if(p.o)continue;var ff=p.d?f2:f;p.vx*=ff;p.vz*=ff;if(p.vx*p.vx+p.vz*p.vz<.003){p.vx=0;p.vz=0}}
 tmr+=k;var moving=false;for(i=0;i<pins.length;i++)if(!pins[i].o&&(pins[i].vx||pins[i].vz))moving=true;
 if((!ball.al&&!moving)||tmr>420){settle+=k;if(settle>40||tmr>420)endRoll()}else settle=0}
function endRoll(){ane();var n=0,i,np=[],pl=PL[cur];for(i=0;i<pins.length;i++){if(pins[i].d)n++;else np.push(pins[i])}
 var fr=pl.F[fi]||(pl.F[fi]=[]),full=wasFull,gut=gutS&&n===0,m;fr.push(n);var s=fstate(fr,fi),who=pl.h?"":pl.n+": ";
 if(n===10&&full){m=who+"¡STRIKE!";arp([523,659,784,1047,1319],.16,"triangle",.11);nz("sk",0,.9,1600,.3)}
 else if(n===left&&n>0){m=who+"¡SPARE!";arp([523,659,784],.16,"triangle",.1);nz("sk",0,.5,1500,.2)}
 else if(gut){m=who+"¡Canaleta!";arp([300,250,200],.22,"sawtooth",.07)}
 else if(n===0){m=who+"Ningún pino";fx("m0",0,200,.3,"sine",.1,120)}
 else{m=who+n+(n===1?" pino":" pinos");fx("rr",0,420+n*40,.15,"triangle",.1,700+n*40)}
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
function drawLane(){var i,zn2=Math.max(cz+55,0),n1,n2,f1,f2;
 x.fillStyle=TC.bg;x.fillRect(0,HY,W,H-HY);
 if(cz<-45){var fy=pj(0,0,0)[1];x.fillStyle=TC.app;x.fillRect(0,fy,W,H-fy)}
 n1=P4(-LW,zn2);n2=P4(LW,zn2);f1=P4(-LW,1070);f2=P4(LW,1070);
 drawPoly(P4(-62,zn2),n1,f1,P4(-62,1070),TC.gut);drawPoly(n2,P4(62,zn2),P4(62,1070),f2,TC.gut);
 drawPoly(n1,n2,f2,f1,LG);
 x.strokeStyle=TC.ln;x.lineWidth=1;x.beginPath();for(i=-4;i<=4;i++){var u=P4(i*LW/4.5,zn2),v=P4(i*LW/4.5,1010);x.moveTo(u[0],u[1]);x.lineTo(v[0],v[1])}x.stroke();
 x.fillStyle=TC.arr;for(i=0;i<7;i++){var az=215+(3-Math.abs(i-3))*20;if(az-cz>45){var ap=pj((i-3)*13,az,0),aw=3.2*ap[2],ah=7*ap[2];x.beginPath();x.moveTo(ap[0],ap[1]-ah);x.lineTo(ap[0]-aw,ap[1]+ah*.3);x.lineTo(ap[0]+aw,ap[1]+ah*.3);x.closePath();x.fill()}}
 if(cz<-20){var l1=P4(-LW,0),l2=P4(LW,0);x.strokeStyle="rgba(255,255,255,.75)";x.lineWidth=2;x.beginPath();x.moveTo(l1[0],l1[1]);x.lineTo(l2[0],l2[1]);x.stroke()}
 drawPoly(P4(-62,1012),P4(62,1012),P4(62,1090),P4(-62,1090),"#000")}
function GW(){return 62}
function drawPin(p){var q=pj(p.x,p.z,0),s=q[2],sxx=q[0],syy=q[1];if(p.z-cz<45)return;
 if(!p.d){x.drawImage(PSP,sxx-6.6*s,syy-39*s,13.2*s,39.6*s)}
 else{var dx=Math.cos(p.a),dz=Math.sin(p.a),e=pj(p.x+dx*34,p.z+dz*34,0);x.globalAlpha=p.z>1000?.3:1;x.lineCap="round";x.strokeStyle="#ececec";x.lineWidth=11*s;x.beginPath();x.moveTo(sxx,syy-4*s);x.lineTo(e[0],e[1]-4*s);x.stroke();x.strokeStyle="#e43b3b";x.lineWidth=11.5*s;x.beginPath();x.moveTo(sxx+(e[0]-sxx)*.78,syy-4*s+(e[1]-syy)*.78);x.lineTo(sxx+(e[0]-sxx)*.86,syy-4*s+(e[1]-syy)*.86);x.stroke();x.globalAlpha=1}}
function drawBall(bx,bz,rot){var q=pj(bx,bz,0),s=q[2],r=BR*s,cy=HY+(CH-BR)*s;if(bz-cz<40)return;
 x.fillStyle="rgba(0,0,0,.35)";x.beginPath();x.ellipse(q[0],q[1],r*.95,r*.3,0,0,6.3);x.fill();
 x.drawImage(BSP,q[0]-r*1.1,cy-r*1.1,r*2.2,r*2.2);x.fillStyle="rgba(0,0,0,.6)";
 for(var i=0;i<3;i++){var an=rot+i*2.1,hx=q[0]+Math.cos(an)*r*.38,hy=cy-r*.1+Math.sin(an)*r*.3;x.beginPath();x.arc(hx,hy,r*.11,0,6.3);x.fill()}}
function drawHUD(){var i,sp=W/NP,pl,cx,cy=24;x.textAlign="center";
 for(i=0;i<NP;i++){pl=PL[i];cx=sp*(i+.5)-8;x.drawImage(AV[i],cx-15,cy-15,30,30);
  if(i===cur&&st!==5){x.strokeStyle=i===0?"#3da5ff":"#ffd08a";x.lineWidth=3;x.beginPath();x.arc(cx,cy,16.5,0,6.3);x.stroke()}
  x.fillStyle=i===0?"#2d7bff":"#e0364a";x.beginPath();x.arc(cx+17,cy-4,9,0,6.3);x.fill();x.fillStyle="#fff";x.font="bold 10px Roboto,Arial,sans-serif";x.fillText(String(pl.t||0),cx+17,cy-.5);
  x.font="9px Roboto,Arial,sans-serif";x.fillStyle="#fff";x.fillText(pl.n,cx,cy+26)}
 if(msg){x.font="bold 12px Roboto,Arial,sans-serif";var w=x.measureText(msg).width+22;x.fillStyle="rgba(20,90,200,.85)";x.fillRect(150-w/2,60,w,18);x.fillStyle="#fff";x.fillText(msg,150,73)}
 x.textAlign="right";x.font="bold 10px Roboto,Arial,sans-serif";x.fillStyle="rgba(255,255,255,.9)";x.fillText("CUADRO "+Math.min(NF,fi+1)+"/"+NF,W-6,H-8);
 var fr=PL[cur]&&PL[cur].F[fi]||[],bx0=6,by0=H-40,j,bw=14;x.fillStyle="#ffcf4d";x.fillRect(bx0,by0,bw*3,10);x.fillStyle="#2a1004";x.textAlign="center";x.font="bold 8px Roboto,Arial,sans-serif";x.fillText(String(Math.min(NF,fi+1)),bx0+bw*1.5,by0+8);
 x.fillStyle="#fff7d6";x.fillRect(bx0,by0+10,bw*3,16);x.strokeStyle="#c9a24a";x.lineWidth=1;x.strokeRect(bx0+.5,by0+10.5,bw*3-1,15);x.fillStyle="#2a1004";x.font="bold 10px Roboto,Arial,sans-serif";
 for(j=0;j<cardM.length;j++)x.fillText(cardM[j],bx0+bw*(j+.5),by0+22);x.textAlign="left"}
function draw(){x.drawImage(BG,0,0,W,H);drawLane();
 var i,ord=pins.slice().sort(function(a,b){return b.z-a.z});for(i=0;i<ord.length;i++)if(!ord[i].o)drawPin(ord[i]);
 if(ball&&ball.al)drawBall(ball.x,ball.z,ball.rot);
 else if(st===1)drawBall(sx,Z0,0);else if(st===4)drawBall(bxx,Z0,0);
 if(st===1){var gx=sx,gz=Z0,vx=Math.sin(ang),vz=Math.cos(ang),ha=hk*.003*(60/(5+8*pw));x.fillStyle="#fff";
  for(i=0;i<14;i++){gx+=vx*60;gz+=vz*60;if(gz>250){var cs=Math.cos(ha),sn=Math.sin(ha),nv=vx*cs+vz*sn;vz=-vx*sn+vz*cs;vx=nv}if(gz>ZH-30)break;var g=pj(gx,gz,0);x.globalAlpha=.85-i*.05;x.beginPath();x.arc(g[0],g[1],2.2*Math.max(.8,g[2]*.9),0,6.3);x.fill()}x.globalAlpha=1}
 drawHUD();
 if(tt>0){x.textAlign="center";x.font="bold "+(24*tts|0)+"px Roboto,Arial,sans-serif";x.lineWidth=5;x.strokeStyle="rgba(0,0,0,.8)";x.strokeText(toast,150,215);x.fillStyle="#ffd08a";x.fillText(toast,150,215);x.textAlign="left"}}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
 if(!document.hidden&&st>0){var k=dt*60;tm+=dt;if(tt>0){tt-=dt;tts+=(1-tts)*.2}
  if(st===2){phys(k);tcz=ball&&ball.al?Math.min(ball.z-200,560):tcz}
  else if(st===4){bt+=dt;bxx+=(bpl.x0-bxx)*Math.min(1,.08*k);if(bt>1.3){throwBall(bpl.x0,bpl.a,bpl.p,bpl.h)}}
  cz+=(tcz-cz)*Math.min(1,(st===2?.35:.12)*k);draw()}requestAnimationFrame(loop)}
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
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".bolos", ".boliche"],
  desc: "Bolos en primera persona: 2, 4 o 6 jugadores con bots, strikes, spares y puntuación",
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
