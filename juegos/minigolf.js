import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#06120a;color:#e9ffee;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #55e676;border-radius:28px;background:radial-gradient(circle at 50% 0,#10381d,#07150c);box-shadow:0 0 24px #55e67633}
small{display:block;font-size:11px;letter-spacing:3px;color:#55e676}
h1{margin:4px 0 8px;font-size:34px;line-height:1.05}
.d{text-align:center;color:#b6f5c4;font-size:19px;line-height:1.4;margin:12px 0}
.bt{display:block;width:100%;height:54px;margin-top:12px;border-radius:16px;border:2px solid #55e676;background:#0d2c18;color:#7dff98;font:bold 16px Roboto,Arial,sans-serif}
.bt.p{background:#72ff8a;color:#063015}.bt:active{transform:scale(.97)}
.g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.g4 .bt{margin:0;height:52px;font-size:18px}
.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:10px 0}
.hud div{text-align:center;border:2px solid #2f9a4d;border-radius:14px;padding:6px 2px;font-size:10px;letter-spacing:2px;color:#8bc99b;background:#0b2415}
.hud b{display:block;font-size:24px;color:#72ff8a}
.hn{text-align:center;letter-spacing:3px;font-size:13px;color:#7dff98;margin-bottom:8px;text-transform:uppercase}
.w{position:relative}canvas{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#rs{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;background:#041009ec;border-radius:16px;text-align:center}
#rs b{font-size:24px}#rs span{font-size:14px;color:#a6e8b6}#rs .bt{margin:4px 0 0;height:46px;font-size:14px}
.pb{height:22px;margin:12px 0;border-radius:11px;background:#0b2415;overflow:hidden}
.pb div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#72ff8a,#ffe14d,#ff5a5a)}
.an{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.an .bt{margin:0;height:54px;font-size:15px;padding:0}
.hint{text-align:center;font-size:14px;color:#a6e8b6;margin:10px 0 2px;min-height:34px}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#7fae8c}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small,.sr .brand{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #55e676;background:#0d2c18;font-size:16px;line-height:1;padding:0;color:#fff}
</style></head><body><div class="m"><div class="sr"><small>MAXIPROYEC · GREEN COURSE</small><button class="sd" id="sd">🔊</button></div><h1>⛳ MINI GOLF</h1>
<div id="mn"><div class="d">Elige cómo quieres jugar los 18 hoyos.</div>
<button class="bt p" id="m1">🎯 ELEGIR HOYO</button><button class="bt" id="m2">🎲 HOYO ALEATORIO</button><button class="bt" id="m3">🏆 CIRCUITO COMPLETO</button><div class="hint" id="bs"></div></div>
<div id="sl" style="display:none"><div class="d" style="font-weight:bold;letter-spacing:2px;font-size:16px">SELECCIONA UN HOYO</div><div class="g4" id="gh"></div><button class="bt" id="vb">↩ VOLVER</button></div>
<div id="gm" style="display:none"><div class="hud"><div>HOYO<b id="h0">1/18</b></div><div>PAR<b id="h1">2</b></div><div>GOLPES<b id="h2">0</b></div><div>TOTAL<b id="h3">0</b></div></div>
<div class="hn" id="hn"></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="rs"><b id="rt"></b><span id="rx"></span>
<button class="bt p" id="r1"></button><button class="bt" id="r2"></button></div></div>
<div class="pb" id="pb"><div id="pf"></div></div>
<div class="an" id="an"><button class="bt" data-a="-5">↺ 5°</button><button class="bt" data-a="-1">↺ 1°</button><button class="bt" data-a="t">🎯</button><button class="bt" data-a="1">1° ↻</button><button class="bt" data-a="5">5° ↻</button></div>
<button class="bt p" id="gp">🏌️ GOLPEAR</button>
<div class="hint" id="hi">Toca el campo para apuntar y luego pulsa GOLPEAR</div>
<button class="bt" id="mb">☰ VOLVER AL MENÚ</button></div>
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
function bnc(){fx("b",70,200,.05,"square",.09,120)}

var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,R=6,L=14,T=14,RT=286,B=386,KEY="mp_minigolf_best";
function ld(){try{return parseInt(localStorage.getItem(KEY))||0}catch(e){return 0}}
function sv(v){try{localStorage.setItem(KEY,String(v))}catch(e){}}
var cv=$("c"),x=cv.getContext("2d"),ST=document.createElement("canvas");ST.width=W*K;ST.height=H*K;x.scale(K,K);
var HL=[
["Calentamiento",2,[150,350],[150,70],[]],
["Pared central",3,[150,350],[150,70],[["w",95,200,110,14]]],
["Esquinas",3,[45,350],[255,65],[["w",14,250,150,12],["w",136,150,150,12]]],
["Arenero",3,[150,350],[150,70],[["s",50,160,200,90]]],
["Laguna",3,[60,350],[240,70],[["a",14,190,170,60]]],
["Molino",3,[150,350],[150,70],[["m",150,200,140,.03]]],
["Túnel",4,[60,350],[240,65],[["w",96,260,190,12],["w",14,150,190,12]]],
["Bumpers",3,[150,350],[150,70],[["b",90,210,17],["b",210,210,17],["b",150,150,17]]],
["Hielo",3,[150,350],[150,70],[["i",14,110,272,210],["w",100,210,100,12]]],
["Puente",4,[150,350],[150,70],[["a",14,170,100,70],["a",186,170,100,70]]],
["Molino doble",4,[50,350],[245,60],[["w",14,200,110,12],["w",176,200,110,12],["m",150,130,140,.035],["m",150,285,130,-.03]]],
["Pared móvil",3,[150,350],[150,65],[["v",105,200,90,12,0,90,.03]]],
["Zigzag",4,[150,350],[150,60],[["w",14,290,200,12],["w",86,215,200,12],["w",14,140,200,12]]],
["Islas",4,[150,350],[150,60],[["s",14,110,95,65],["s",191,110,95,65],["s",14,250,95,65],["s",191,250,95,65],["b",150,200,18]]],
["Triple molino",4,[150,350],[225,60],[["m",85,270,95,.04],["m",215,205,95,-.04],["m",100,140,95,.05]]],
["Laberinto",5,[50,350],[150,60],[["w",95,14,12,230],["w",195,150,12,236]]],
["Pinball",4,[150,350],[150,60],[["b",80,230,14],["b",220,230,14],["b",150,180,14],["b",95,120,14],["b",205,120,14]]],
["Gran final",5,[150,355],[150,55],[["m",150,175,150,.035],["a",14,250,100,50],["a",186,250,100,50],["s",100,105,100,40],["v",105,320,70,10,0,90,.03]]]
];
var CPAR=0;for(var q0=0;q0<18;q0++)CPAR+=HL[q0][1];
function mk(a){return{n:a[0],p:a[1],s:a[2],h:a[3],o:a[4]}}
function rn(a,b){return a+Math.random()*(b-a)}
function gen(){var Y=[125,185,245,305],i,j,t,y,f,g,gx,c;for(i=3;i>0;i--){j=Math.random()*(i+1)|0;t=Y[i];Y[i]=Y[j];Y[j]=t}
 var k=2+(Math.random()*3|0),o=[],nm=[];
 for(i=0;i<k;i++){y=Y[i];f=Math.random()*7|0;
  if(f===0){g=rn(70,100);gx=rn(L+8,RT-8-g);if(gx-L>6)o.push(["w",L,y-6,gx-L,12]);if(RT-gx-g>6)o.push(["w",gx+g,y-6,RT-gx-g,12]);nm.push("Pared")}
  else if(f===1){o.push(["m",rn(120,180),y,rn(100,130),(Math.random()<.5?-1:1)*rn(.025,.05)]);nm.push("Molino")}
  else if(f===2){g=rn(100,170);o.push(["s",rn(L,RT-g),y-25,g,50]);nm.push("Arenero")}
  else if(f===3){g=rn(120,165);o.push(["a",Math.random()<.5?L:RT-g,y-20,g,40]);nm.push("Laguna")}
  else if(f===4){c=2+(Math.random()*2|0);for(j=0;j<c;j++)o.push(["b",L+30+(j+rn(.1,.7))*(RT-L-60)/c,y+rn(-8,8),14]);nm.push("Bumpers")}
  else if(f===5){o.push(["v",L+(RT-L-80)/2,y-6,80,12,0,rn(60,88),rn(.02,.035)]);nm.push("Móvil")}
  else{o.push(["i",L,y-30,RT-L,60]);nm.push("Hielo")}}
 return{n:"Aleatorio · "+nm.slice(0,2).join(" + "),p:Math.min(5,k+1),s:[rn(50,250),350],h:[rn(50,250),68],o:o}}
var hd,ob=[],bx,by,vx=0,vy=0,px,py,ang=0,pw=.6,strokes=0,total=0,st=0,sink=0,hx,hy,mode="",hi=0,scr=0,dirty=true,dyn=false,last=0,ph=0,c0=["","","",""],best=ld();
function put(i,t){if(c0[i]!==t){c0[i]=t;$("h"+i).textContent=t}}
function hud(){put(0,mode==="r"?"🎲":(hi+1)+"/18");put(1,String(hd.p));put(2,String(strokes));put(3,String(total))}
function setPw(){$("pf").style.transform="scaleX("+pw+")";dirty=true}
function aimHole(){ang=Math.atan2(hy-by,hx-bx);dirty=true}
function hint(t,ms){$("hi").textContent=t;clearTimeout(ph);if(ms)ph=setTimeout(function(){$("hi").textContent="Toca el campo para apuntar y luego pulsa GOLPEAR"},ms)}
function bake(){var q=ST.getContext("2d"),i,j,o,z;q.setTransform(K,0,0,K,0,0);q.fillStyle="#5b3a1c";q.fillRect(0,0,W,H);q.fillStyle="#7a4f27";q.fillRect(4,4,W-8,H-8);
 for(i=0;T+i*25<B;i++){q.fillStyle=i%2?"#2f9e4f":"#37ac58";q.fillRect(L,T+i*25,RT-L,Math.min(25,B-T-i*25))}
 for(i=0;i<ob.length;i++){o=ob[i];z=o.t;
  if(z==="s"){q.fillStyle="#e3c67c";q.fillRect(o.x,o.y,o.w,o.h);q.fillStyle="#cfae60";for(j=0;j<o.w*o.h/90;j++)q.fillRect(o.x+Math.random()*o.w,o.y+Math.random()*o.h,1.5,1.5)}
  else if(z==="a"){q.fillStyle="#2f84e8";q.fillRect(o.x,o.y,o.w,o.h);q.strokeStyle="#9ccaff88";q.lineWidth=1.5;for(j=o.y+8;j<o.y+o.h;j+=14){q.beginPath();q.moveTo(o.x+4,j);q.lineTo(o.x+o.w-4,j);q.stroke()}}
  else if(z==="i"){q.fillStyle="#c6efff";q.fillRect(o.x,o.y,o.w,o.h);q.strokeStyle="#ffffff99";q.lineWidth=1.5;for(j=o.x+10;j<o.x+o.w;j+=26){q.beginPath();q.moveTo(j,o.y);q.lineTo(j-10,o.y+o.h);q.stroke()}}
  else if(z==="w"){q.fillStyle="#a8713c";q.fillRect(o.x,o.y,o.w,o.h);q.fillStyle="#c98f55";q.fillRect(o.x,o.y,o.w,3);q.strokeStyle="#6b4423";q.lineWidth=1.5;q.strokeRect(o.x,o.y,o.w,o.h)}
  else if(z==="b"){q.fillStyle="#ff3d6e";q.beginPath();q.arc(o.x,o.y,o.r,0,6.3);q.fill();q.strokeStyle="#fff";q.lineWidth=2.5;q.beginPath();q.arc(o.x,o.y,o.r-4,0,6.3);q.stroke()}}
 q.strokeStyle="#1f6e36";q.lineWidth=2;q.strokeRect(L,T,RT-L,B-T);
 q.fillStyle="#0a0a0a";q.beginPath();q.arc(hx,hy,9,0,6.3);q.fill();q.strokeStyle="#000";q.lineWidth=2;q.stroke();
 q.strokeStyle="#fff";q.lineWidth=2;q.beginPath();q.moveTo(hx,hy);q.lineTo(hx,hy-30);q.stroke();q.fillStyle="#ff4d5e";q.beginPath();q.moveTo(hx,hy-30);q.lineTo(hx+15,hy-25);q.lineTo(hx,hy-20);q.fill()}
function loadHole(d){hd=d;hx=d.h[0];hy=d.h[1];bx=px=d.s[0];by=py=d.s[1];vx=vy=0;strokes=0;ob=[];dyn=false;
 for(var i=0;i<d.o.length;i++){var a=d.o[i],t=a[0],o={t:t};
  if(t==="m"){o.x=a[1];o.y=a[2];o.l=a[3];o.s=a[4];o.a=Math.random()*3;dyn=true}
  else if(t==="b"){o.x=a[1];o.y=a[2];o.r=a[3]}
  else if(t==="v"){o.x0=a[1];o.y0=a[2];o.w=a[3];o.h=a[4];o.ax=a[5];o.amp=a[6];o.sp=a[7];o.ph=Math.random()*6;o.x=o.x0;o.y=o.y0;dyn=true}
  else{o.x=a[1];o.y=a[2];o.w=a[3];o.h=a[4]}
  ob.push(o)}
 fx("lh",0,440,.1,"sine",.08,660);bake();aimHole();st=1;sink=0;$("rs").style.display="none";$("hn").textContent=(mode==="r"?"HOYO ALEATORIO":"HOYO "+(hi+1))+" · "+d.n;hint("Toca el campo para apuntar y luego pulsa GOLPEAR");hud();setPw()}
function anim(k){for(var i=0;i<ob.length;i++){var o=ob[i];if(o.t==="m")o.a+=o.s*k;else if(o.t==="v"){o.ph+=o.sp*k;var d=Math.sin(o.ph)*o.amp;o.x=o.x0+(o.ax?0:d);o.y=o.y0+(o.ax?d:0)}}}
function colRect(rx,ry,rw,rh,mx,my){var cx=Math.max(rx,Math.min(bx,rx+rw)),cy=Math.max(ry,Math.min(by,ry+rh)),dx=bx-cx,dy=by-cy,d2=dx*dx+dy*dy,nx,ny;
 if(d2>=R*R)return;
 if(d2>1e-6){var d=Math.sqrt(d2);nx=dx/d;ny=dy/d;bx=cx+nx*R;by=cy+ny*R}
 else{var l=bx-rx,r2=rx+rw-bx,t=by-ry,b2=ry+rh-by,m=Math.min(l,r2,t,b2);if(m===l){nx=-1;ny=0;bx=rx-R}else if(m===r2){nx=1;ny=0;bx=rx+rw+R}else if(m===t){nx=0;ny=-1;by=ry-R}else{nx=0;ny=1;by=ry+rh+R}}
 var rel=(vx-mx)*nx+(vy-my)*ny;if(rel<0){vx-=1.85*rel*nx;vy-=1.85*rel*ny;bnc()}}
function colMill(o){var c=Math.cos(o.a)*o.l/2,s=Math.sin(o.a)*o.l/2,ax=o.x-c,ay=o.y-s,ex=2*c,ey=2*s,t=Math.max(0,Math.min(1,((bx-ax)*ex+(by-ay)*ey)/(ex*ex+ey*ey))),qx=ax+ex*t,qy=ay+ey*t,dx=bx-qx,dy=by-qy,d=Math.sqrt(dx*dx+dy*dy),rr=R+4;
 if(d>=rr||d<1e-6)return;var nx=dx/d,ny=dy/d;bx=qx+nx*rr;by=qy+ny*rr;
 var mx=-o.s*(qy-o.y),my=o.s*(qx-o.x),rel=(vx-mx)*nx+(vy-my)*ny;if(rel<0){vx-=1.9*rel*nx;vy-=1.9*rel*ny;bnc()}}
function colB(o){var dx=bx-o.x,dy=by-o.y,d=Math.sqrt(dx*dx+dy*dy),rr=R+o.r;if(d>=rr||d<1e-6)return;var nx=dx/d,ny=dy/d;bx=o.x+nx*rr;by=o.y+ny*rr;var rel=vx*nx+vy*ny;
 if(rel<0){vx-=2*rel*nx;vy-=2*rel*ny;fx("bm",60,260,.14,"sine",.16,900);var s=Math.sqrt(vx*vx+vy*vy);if(s<4.5){vx=nx*4.5;vy=ny*4.5}else{vx*=1.06;vy*=1.06}}}
function inside(o){return bx>o.x&&bx<o.x+o.w&&by>o.y&&by<o.y+o.h}
function phys(k){var i,o,q,sp=Math.sqrt(vx*vx+vy*vy),n=Math.max(1,Math.min(10,Math.ceil(sp*k/2.2))),dt=k/n,fz=.976;
 for(i=0;i<ob.length;i++){o=ob[i];if(o.t==="s"&&inside(o))fz=.9;else if(o.t==="i"&&inside(o))fz=.995}
 for(q=0;q<n;q++){bx+=vx*dt;by+=vy*dt;
  if(bx<L+R){bx=L+R;vx=Math.abs(vx)*.9;bnc()}else if(bx>RT-R){bx=RT-R;vx=-Math.abs(vx)*.9;bnc()}
  if(by<T+R){by=T+R;vy=Math.abs(vy)*.9;bnc()}else if(by>B-R){by=B-R;vy=-Math.abs(vy)*.9;bnc()}
  for(i=0;i<ob.length;i++){o=ob[i];
   if(o.t==="w")colRect(o.x,o.y,o.w,o.h,0,0);
   else if(o.t==="v"){var vm=Math.cos(o.ph)*o.amp*o.sp;colRect(o.x,o.y,o.w,o.h,o.ax?0:vm,o.ax?vm:0)}
   else if(o.t==="m")colMill(o);else if(o.t==="b")colB(o);
   else if(o.t==="a"&&inside(o)){nz("sp",0,.35,700,.3,.6);fx("w",0,330,.3,"sine",.1,110,1);strokes++;bx=px;by=py;vx=vy=0;st=1;aimHole();hud();hint("💦 ¡Al agua! +1 golpe",1800);if(strokes>=10)finish(true);return}}
  var ddx=hx-bx,ddy=hy-by,d=Math.sqrt(ddx*ddx+ddy*ddy);
  if(d<9&&Math.sqrt(vx*vx+vy*vy)<9){st=3;sink=0;vx=vy=0;fx("g",0,560,.2,"sine",.1,380,1);fx("g2",0,840,.28,"sine",.08,1100,1);return}
  if(d<22){vx+=ddx*.012*dt;vy+=ddy*.012*dt}}
 var f=Math.pow(fz,k);vx*=f;vy*=f;
 if(Math.sqrt(vx*vx+vy*vy)<.12){vx=vy=0;px=bx;py=by;st=1;aimHole();hud();if(strokes>=10)finish(true)}}
function ov(t,tx,b1,b2){$("rt").textContent=t;$("rx").textContent=tx;$("r1").textContent=b1[0];$("r1").onclick=b1[1];$("r2").textContent=b2[0];$("r2").onclick=b2[1];$("rs").style.display="flex"}
function scr_(n){scr=n;$("mn").style.display=n===0?"block":"none";$("sl").style.display=n===1?"block":"none";$("gm").style.display=n===2?"block":"none";dirty=true}
function toMenu(){st=0;mend();$("rs").style.display="none";$("bs").textContent=best?"🏆 Mejor circuito: "+best+" golpes":"";scr_(0)}
function startS(i){mode="s";hi=i;total=0;loadHole(mk(HL[i]));scr_(2);mus(mGolf,.4)}
function startR(){mode="r";hi=0;total=0;loadHole(gen());scr_(2);mus(mGolf,.4)}
function startC(){mode="c";hi=0;total=0;loadHole(mk(HL[0]));scr_(2);mus(mGolf,.4)}
function fin(){if(!best||total<best){best=total;sv(best)}ov("🏆 CIRCUITO COMPLETO",total+" golpes · par "+CPAR+" · mejor "+best,["↻ OTRO CIRCUITO",startC],["☰ MENÚ",toMenu])}
function finish(pick){var d0=strokes-hd.p;if(pick){fx("f",0,220,.4,"sawtooth",.09,100,1);hurt()}else if(strokes===1)arp([523,659,784,1047,1319],.16,"triangle",.1);else if(d0<=-1)arp([523,784,1047],.16,"triangle",.1);else if(d0===0)arp([523,659],.2,"sine",.1);else arp([330,262],.25,"sawtooth",.07);st=4;total+=strokes;hud();var p=hd.p,d=strokes-p,t;
 if(pick)t="🙈 RECOGIDA";else if(strokes===1)t="🎯 ¡HOYO EN UNO!";else if(d<=-2)t="🦅 EAGLE";else if(d===-1)t="🐦 BIRDIE";else if(d===0)t="✅ PAR";else if(d===1)t="😬 BOGEY";else t="🥴 +"+d;
 var tx=strokes+" golpes · par "+p,b1,b2=["☰ MENÚ",toMenu];
 if(mode==="c")b1=hi<17?["SIGUIENTE HOYO ▶",function(){hi++;loadHole(mk(HL[hi]))}]:["VER RESULTADO 🏆",fin];
 else if(mode==="r")b1=["🎲 OTRO ALEATORIO",function(){loadHole(gen())}];
 else b1=["↻ REPETIR",function(){loadHole(mk(HL[hi]))}];
 ov(t,tx,b1,b2)}
function hit(){if(st!==1)return;fx("k",0,300,.1,"triangle",.12,130);nz("hk",0,.05,1800,.3);var v=3+10.5*pw;vx=Math.cos(ang)*v;vy=Math.sin(ang)*v;strokes++;px=bx;py=by;st=2;hud();dirty=true}
function aimAt(e){if(st!==1)return;var r=cv.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height,dx=mx-bx,dy=my-by,d=Math.sqrt(dx*dx+dy*dy);if(d<4)return;ang=Math.atan2(dy,dx);pw=Math.max(.12,Math.min(1,d/150));setPw()}
function paint(){x.drawImage(ST,0,0,W,H);var i,o,c,s;
 for(i=0;i<ob.length;i++){o=ob[i];
  if(o.t==="v"){x.fillStyle="#b87c44";x.fillRect(o.x,o.y,o.w,o.h);x.fillStyle="#d79a5c";x.fillRect(o.x,o.y,o.w,3)}
  else if(o.t==="m"){c=Math.cos(o.a)*o.l/2;s=Math.sin(o.a)*o.l/2;x.lineCap="round";x.strokeStyle="#fff";x.lineWidth=8;x.beginPath();x.moveTo(o.x-c,o.y-s);x.lineTo(o.x+c,o.y+s);x.stroke();
   x.fillStyle="#ff3d5a";x.beginPath();x.arc(o.x+c,o.y+s,5,0,6.3);x.fill();x.fillStyle="#222";x.beginPath();x.arc(o.x,o.y,6,0,6.3);x.fill()}}
 if(st===1){var len=30+pw*130,n=Math.floor(len/11),ca=Math.cos(ang),sa=Math.sin(ang);x.fillStyle="#fff";
  for(i=1;i<=n;i++){x.globalAlpha=1-i/(n+3)*.65;x.beginPath();x.arc(bx+ca*(10+i*11),by+sa*(10+i*11),2.2,0,6.3);x.fill()}
  x.globalAlpha=1;var ex=bx+ca*(14+n*11),ey=by+sa*(14+n*11);x.beginPath();x.moveTo(ex+ca*7,ey+sa*7);x.lineTo(ex-sa*5,ey+ca*5);x.lineTo(ex+sa*5,ey-ca*5);x.fill()}
 var br=R*(st===3?1-sink/20:1);x.fillStyle="#0006";x.beginPath();x.arc(bx+1.5,by+2,br,0,6.3);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(bx,by,br,0,6.3);x.fill();x.strokeStyle="#c9d6cc";x.lineWidth=1;x.stroke()}
function loop(ts){var k=Math.min(2.5,(ts-last)/16.67||1);last=ts;
 if(!document.hidden&&scr===2&&st>0){anim(k);if(st===2)phys(k);else if(st===3){sink++;bx+=(hx-bx)*.25;by+=(hy-by)*.25;if(sink>=18)finish(false)}
  if(dirty||dyn||st!==1){paint();dirty=false}}
 requestAnimationFrame(loop)}
var gh=$("gh");for(var i0=0;i0<18;i0++){var b0=document.createElement("button");b0.className="bt";b0.textContent=String(i0+1);b0._i=i0;gh.appendChild(b0)}
gh.addEventListener("click",function(e){if(e.target._i!==undefined)startS(e.target._i)});
$("m1").addEventListener("click",function(){scr_(1)});$("m2").addEventListener("click",startR);$("m3").addEventListener("click",startC);
$("vb").addEventListener("click",toMenu);$("mb").addEventListener("click",toMenu);$("gp").addEventListener("click",hit);
$("an").addEventListener("click",function(e){var a=e.target.getAttribute&&e.target.getAttribute("data-a");if(a===null||a===undefined||st!==1)return;
 if(a==="t"){aimHole();pw=Math.max(.12,Math.min(1,Math.sqrt((hx-bx)*(hx-bx)+(hy-by)*(hy-by))/150));setPw()}else{ang+=Number(a)*Math.PI/180;dirty=true}});
function pwAt(e){var r=$("pb").getBoundingClientRect();pw=Math.max(.08,Math.min(1,(e.clientX-r.left)/r.width));setPw()}
$("pb").addEventListener("pointerdown",function(e){e.preventDefault();pwAt(e)});$("pb").addEventListener("pointermove",function(e){if(e.buttons)pwAt(e)});
cv.addEventListener("pointerdown",function(e){e.preventDefault();aimAt(e)});cv.addEventListener("pointermove",function(e){e.preventDefault();aimAt(e)});
hd=mk(HL[0]);hx=hd.h[0];hy=hd.h[1];bx=hd.s[0];by=hd.s[1];toMenu();requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".minigolf", ".golf"],
  desc: "Mini Golf de 18 hoyos, hoyos aleatorios y circuito completo; guarda tu mejor circuito",
  category: "Juegos",
  usage: ".minigolf",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[MINIGOLF] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
