import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#05030f;color:#e6e2ff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #9b5cff;border-radius:28px;background:radial-gradient(circle at 50% 0,#1d0f45,#06030f);box-shadow:0 0 24px #9b5cff44}
small{display:block;font-size:10px;letter-spacing:3px;color:#b99bff}
h1{margin:4px 0 6px;font-size:30px;line-height:1.05;color:#22f5ff;text-shadow:0 0 12px #22f5ff88}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#9f96c8;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#22f5ff}
.o{display:grid;gap:8px}.o.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.o.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.ch{height:46px;border-radius:12px;border:2px solid #2d2554;background:#0b0720;color:#d8d2ff;font:bold 12px Roboto,Arial,sans-serif;padding:0 2px;overflow:hidden}
.ch.on{border-color:#22f5ff;box-shadow:0 0 10px #22f5ff55;background:#12103a}
.go,.bt{display:block;width:100%;height:52px;margin-top:14px;border-radius:14px;border:2px solid #9b5cff;background:#140c34;color:#c9b3ff;font:bold 15px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#22f5ff,#9b5cff,#ff3df2);color:#fff}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.hud{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0}
.hud div{text-align:center;border:2px solid #4a3a8a;border-radius:14px;padding:6px 1px;font-size:9px;letter-spacing:1px;color:#9f96c8;background:#0b0720;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:20px;color:#22f5ff}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#05030ff0;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ff3df2}#ov span{font-size:14px;color:#c9c0ff;margin-bottom:6px;line-height:1.5}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
.ct{display:grid;grid-template-columns:1fr 2fr 1fr;gap:8px;margin-top:10px}.ct .bt{margin:0;height:58px;font-size:22px;padding:0}.ct .bt.on{background:#22f5ff;color:#05030f}
.hint{text-align:center;font-size:12px;color:#9f96c8;margin:10px 0 0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#8a82b8}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small,.sr .brand{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #9b5cff;background:#140c34;font-size:16px;line-height:1;padding:0;color:#fff}
</style></head><body><div class="m"><div class="sr"><small>MAXIPROYEC · ARCADE</small><button class="sd" id="sd">🔊</button></div><h1>🐛 GUSANOS<br>NEÓN</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Come puntos, crece y haz que los demás choquen contigo</div>
<h3>🐍 COLOR DE GUSANO</h3><div class="o c4" id="o0"></div>
<h3>🔥 DIFICULTAD</h3><div class="o c2" id="o1"></div>
<h3>🗺️ TAMAÑO DEL MAPA</h3><div class="o c2" id="o2"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm" style="display:none"><div class="hud"><div>LONGITUD<b id="h0">100</b></div><div>RÉCORD<b id="h1">0</b></div><div>BAJAS<b id="h2">0</b></div></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="ov"><b>💥 FIN DEL JUEGO</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<div class="ct"><button class="bt" id="bl">◀</button><button class="bt" id="bb">⚡ ACELERAR</button><button class="bt" id="br">▶</button></div>
<div class="hint" id="er" style="display:none;color:#ff8a7a"></div>
<div class="hint">Toca o arrastra en el campo hacia donde quieres ir · ◀ ▶ para girar · mantén ⚡ para acelerar (gastas largo)</div>
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

var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_gusanos_best",CK="mp_gusanos_cfg",MAXS=200,GAP=6.5;
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
function rnd(a,b){return a+Math.random()*(b-a)}
var SKL=[["🟢","Verde"],["🔵","Azul"],["🟣","Morado"],["🔴","Rojo"],["🟡","Amarillo"],["💗","Rosa"],["🌈","Arcoíris"],["⚪","Blanco"]];
var COLS=["#39ff7a","#3da5ff","#b06cff","#ff4d5e","#ffe14d","#ff7ac8","","#f2f2f8"],RBC=["#ff4d5e","#ff9a3d","#ffe14d","#39ff7a","#3da5ff","#b06cff","#ff7ac8"];
var PCL=["#39ff7a","#3da5ff","#b06cff","#ff4d5e","#ffe14d","#ff7ac8","#f2f2f8"];
var DFL=[["🟢","Fácil",7,.05,0],["🔵","Normal",10,.065,.3],["🟣","Difícil",13,.078,.6],["🔴","Extremo",16,.09,.9]];
var MPL=[["🔹","Pequeño",1800],["🔷","Normal",2600],["🔶","Grande",3400]];
var LS=[SKL,DFL,MPL],S0=[0,1,1],NM=["Neo","Zed","Kira","Rex","Luna","Mako","Nova","Drako","Bruno","Pixel","Zorro","Hiro","Vega","Orion","Tito","Maya"];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===3&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S0=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S0[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S0[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var k0=0;k0<3;k0++)chips(k0);
var SPC={};
function rgba(h,a){var n=parseInt(h.slice(1),16);return"rgba("+(n>>16)+","+((n>>8)&255)+","+(n&255)+","+a+")"}
function segSpr(h,light){var a=cvs(32,32),q=a[1],g;
 g=q.createRadialGradient(16,16,4,16,16,16);g.addColorStop(0,rgba(h,.6));g.addColorStop(1,rgba(h,0));q.fillStyle=g;q.beginPath();q.arc(16,16,16,0,6.3);q.fill();
 q.fillStyle=h;q.beginPath();q.arc(16,16,10,0,6.3);q.fill();
 g=q.createRadialGradient(12,11,1,16,16,10);g.addColorStop(0,light?"rgba(255,255,255,.95)":"rgba(255,255,255,.55)");g.addColorStop(1,"rgba(255,255,255,0)");q.fillStyle=g;q.beginPath();q.arc(16,16,10,0,6.3);q.fill();
 q.strokeStyle="rgba(0,0,0,.35)";q.lineWidth=1.2;q.beginPath();q.arc(16,16,10,0,6.3);q.stroke();return a[0]}
function sp(h,l){var k=h+l;return SPC[k]||(SPC[k]=segSpr(h,l))}
var PSP=[];
function pelSpr(h){var a=cvs(16,16),q=a[1],g=q.createRadialGradient(8,8,0,8,8,8);g.addColorStop(0,"#fff");g.addColorStop(.35,h);g.addColorStop(1,rgba(h,0));q.fillStyle=g;q.beginPath();q.arc(8,8,8,0,6.3);q.fill();return a[0]}
var tile=document.createElement("canvas");tile.width=tile.height=80;
(function(){var q=tile.getContext("2d");q.fillStyle="#080b1e";q.fillRect(0,0,80,80);q.strokeStyle="rgba(70,90,200,.18)";q.lineWidth=1;q.beginPath();q.moveTo(.5,0);q.lineTo(.5,80);q.moveTo(0,.5);q.lineTo(80,.5);q.stroke();q.fillStyle="rgba(120,150,255,.35)";q.fillRect(0,0,2,2)})();
var cv=$("c"),x=cv.getContext("2d"),PAT=x.createPattern(tile,"repeat");
var WW=2600,PTG=0,MAXP=0,px=null,py=null,pc=null,pv=null,pn=0,SN=[],P=null,DF=null,st=0,cx=0,cy=0,zs=1,fr=0,tm=0,kills=0,toast="",toastT=0,pdead=0,last=0,bo=false,turn=0,lb=[],hc=["","",""],best=ld(KEY),why="",born=0;
var E=[$("h0"),$("h1"),$("h2")];
function put(i,t){if(hc[i]!==t){hc[i]=t;E[i].textContent=t}}
function hud(){put(0,String(Math.floor(P.m*10)));put(1,String(best));put(2,String(kills))}
function thick(s){return 7+Math.min(8,s.m/70)}
function segs(m){return Math.min(MAXS,8+Math.floor(m*.9))}
function addP(x0,y0,c,v){if(pn>=MAXP)return;px[pn]=x0;py[pn]=y0;pc[pn]=c;pv[pn]=v;pn++}
function rmP(i){pn--;px[i]=px[pn];py[i]=py[pn];pc[i]=pc[pn];pv[i]=pv[pn]}
function pcOf(s){return s.col===6?Math.random()*7|0:s.col===7?6:s.col}
function mkS(x0,y0,a,m,col,name,bot,id){var s={xs:new Float32Array(MAXS),ys:new Float32Array(MAXS),n:0,x:x0,y:y0,a:a,ta:a,m:m,col:col,name:name,bot:bot,id:id,alive:true,boost:false,bt:0,sd:Math.random()<.5?1:-1,dl:0,inv:0};
 var n=segs(m);for(var i=0;i<n;i++){s.xs[i]=x0-Math.cos(a)*GAP*i;s.ys[i]=y0-Math.sin(a)*GAP*i}s.n=n;return s}
function botNew(i){var bx,by,t=0;do{bx=rnd(220,WW-220);by=rnd(220,WW-220);t++}while(P&&t<30&&(bx-P.x)*(bx-P.x)+(by-P.y)*(by-P.y)<122500);
 var s=mkS(bx,by,rnd(0,6.28),rnd(10,22+i*2),Math.random()*8|0,NM[i%NM.length],true,i);s.inv=60;return s}
function start(){fx("s",0,520,.1,"sine",.08,780);DF=DFL[S0[1]];WW=MPL[S0[2]][2];sv(CK,S0.join(","));PTG=Math.floor(WW*WW/11000);MAXP=PTG+500;
 px=new Float32Array(MAXP);py=new Float32Array(MAXP);pc=new Uint8Array(MAXP);pv=new Float32Array(MAXP);pn=0;
 var i;for(i=0;i<7;i++)PSP[i]=pelSpr(PCL[i]);for(i=0;i<8;i++)if(COLS[i]){sp(COLS[i],0);sp(COLS[i],1)}for(i=0;i<7;i++){sp(RBC[i],0);sp(RBC[i],1)}
 for(i=0;i<PTG;i++)addP(rnd(30,WW-30),rnd(30,WW-30),Math.random()*7|0,Math.random()<.06?3:1);
 P=mkS(WW/2,WW/2,rnd(0,6.28),10,S0[0],"Tú",false,0);P.inv=100;SN=[P];for(i=0;i<DF[2];i++)SN.push(botNew(i+1));
 cx=P.x;cy=P.y;zs=1;kills=0;toastT=0;pdead=0;turn=0;bo=false;fr=0;lb=[];hc=["","",""];born=tm;st=1;
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";$("bb").className="bt";hud();mus(mGus,.19)}
function toCfg(){st=0;mend();$("gm").style.display="none";$("cfg").style.display="block"}
function over(){st=4;mend();var sc=Math.floor(P.m*10);if(sc>best){best=sc;sv(KEY,best)}hud();$("ot").textContent=why+"\nLongitud "+sc+" · bajas "+kills+" · "+Math.floor(tm-born)+" s\nRécord "+best;$("ov").style.display="flex"}
function die(s,k,r){if(!s.alive||s.inv>0)return;s.alive=false;
 var tot=Math.max(4,s.m*.7),cnt=Math.max(1,s.n>>1),v=Math.max(1,Math.min(6,tot/cnt)),i,pcc=s.col;
 for(i=0;i<s.n;i+=2)addP(s.xs[i]+rnd(-5,5),s.ys[i]+rnd(-5,5),pcOf(s),v);
 if(k&&k===P){arp([523,784,1047],.14,"triangle",.1);kills++;toast="💀 Eliminaste a "+s.name;toastT=1.6}
 if(s===P){mend();hurt();setTimeout(function(){fx("d",0,300,.6,"sawtooth",.1,40,1)},180);pdead=.9;st=3;why=k?"Chocaste con "+k.name:r}else{s.dl=2+Math.random()*2;if(P.alive&&(s.x-P.x)*(s.x-P.x)+(s.y-P.y)*(s.y-P.y)<250000)nz('bd',120,.25,600,.22)}}
function move(s,k){var d=s.ta-s.a;while(d>3.1416)d-=6.2832;while(d<-3.1416)d+=6.2832;var tr=(s.bot?DF[3]:.095)*k;s.a+=d<-tr?-tr:d>tr?tr:d;
 var bs=s.boost&&s.m>12,v=(bs?3.5:1.9)*k;s.x+=Math.cos(s.a)*v;s.y+=Math.sin(s.a)*v;
 var xs=s.xs,ys=s.ys,n=segs(s.m),i,dx,dy,dd;
 while(s.n<n){xs[s.n]=xs[s.n-1];ys[s.n]=ys[s.n-1];s.n++}s.n=n;
 xs[0]=s.x;ys[0]=s.y;for(i=1;i<n;i++){dx=xs[i]-xs[i-1];dy=ys[i]-ys[i-1];dd=dx*dx+dy*dy;if(dd>GAP*GAP){dd=GAP/Math.sqrt(dd);xs[i]=xs[i-1]+dx*dd;ys[i]=ys[i-1]+dy*dd}}
 if(bs){s.bt+=k;if(s.bt>=9){s.bt=0;s.m-=.5;addP(xs[n-1],ys[n-1],pcOf(s),1);if(s===P)fx("bs",0,140,.05,"sawtooth",.05,90)}}else s.boost=false}
function eat(s){var r=thick(s)+8,r2=r*r,i,dx,dy;for(i=pn-1;i>=0;i--){dx=px[i]-s.x;dy=py[i]-s.y;if(dx*dx+dy*dy<r2){s.m+=pv[i];rmP(i);if(s===P)fx("e",70,650+Math.random()*450,.06,"sine",.12,1300)}}}
function danger(s){var lx=s.x+Math.cos(s.a)*50,ly=s.y+Math.sin(s.a)*50,j,i,B,dx,dy,lim,tb;
 for(j=0;j<SN.length;j++){B=SN[j];if(B===s||!B.alive)continue;dx=lx-B.x;dy=ly-B.y;lim=B.n*GAP+90;if(dx*dx+dy*dy>lim*lim)continue;tb=thick(B)+12;tb*=tb;
  for(i=0;i<B.n;i+=2){dx=B.xs[i]-lx;dy=B.ys[i]-ly;if(dx*dx+dy*dy<tb)return true}}return false}
function think(s){var m=170,x0=s.x,y0=s.y,i,dx,dy,d,bd=67600,bi=-1;
 if(x0<m||y0<m||x0>WW-m||y0>WW-m){s.ta=Math.atan2(WW/2-y0,WW/2-x0);s.boost=false;return}
 if(danger(s)){s.ta=s.a+s.sd*1.4;s.boost=s.m>25&&Math.random()<.5;return}
 s.boost=false;
 if(DF[4]>0&&P.alive&&s.m>14&&Math.random()<DF[4]*.5){dx=P.x-x0;dy=P.y-y0;d=dx*dx+dy*dy;if(d<130000){s.ta=Math.atan2(P.y+Math.sin(P.a)*70-y0,P.x+Math.cos(P.a)*70-x0);s.boost=s.m>30&&d<40000&&Math.random()<.6;return}}
 for(i=0;i<pn;i++){dx=px[i]-x0;dy=py[i]-y0;d=dx*dx+dy*dy;if(d<bd){bd=d;bi=i}}
 if(bi>=0)s.ta=Math.atan2(py[bi]-y0,px[bi]-x0);else if(Math.random()<.05)s.ta=s.a+rnd(-.8,.8)}
function collide(){var i,j,A,B,dx,dy,lim,rb,ii,ex,ey,th;
 for(i=0;i<SN.length;i++){A=SN[i];if(!A.alive||A.inv>0)continue;
  if(A.x<8||A.y<8||A.x>WW-8||A.y>WW-8){die(A,null,"Chocaste con el borde");continue}
  for(j=0;j<SN.length;j++){B=SN[j];if(B===A||!B.alive)continue;dx=A.x-B.x;dy=A.y-B.y;lim=B.n*GAP+60;if(dx*dx+dy*dy>lim*lim)continue;
   th=thick(A)+thick(B);if(dx*dx+dy*dy<th*th*.3&&A.m<=B.m){die(A,B);break}
   rb=thick(B)*.9+thick(A)*.7;rb*=rb;
   for(ii=1;ii<B.n;ii++){ex=B.xs[ii]-A.x;ey=B.ys[ii]-A.y;if(ex*ex+ey*ey<rb){die(A,B);break}}
   if(!A.alive)break}}}
function upd(dt,k){var i,s;fr++;tm+=dt;
 if(st===1){if(turn)P.ta=P.a+turn;P.boost=bo&&P.m>12;if(P.inv>0)P.inv-=k}
 for(i=0;i<SN.length;i++){s=SN[i];
  if(!s.alive){if(s.bot){s.dl-=dt;if(s.dl<=0)SN[i]=botNew(s.id)}continue}
  if(s.bot){if((fr+i)%4===0)think(s);if(s.inv>0)s.inv-=k}
  if(s!==P||st===1){move(s,k);eat(s)}}
 collide();
 var a=0;while(pn<PTG&&a<4){addP(rnd(30,WW-30),rnd(30,WW-30),Math.random()*7|0,Math.random()<.06?3:1);a++}
 var tz=Math.max(.62,1-(P.n-17)*.0016);zs+=(tz-zs)*Math.min(1,.03*k);cx+=(P.x-cx)*Math.min(1,.3*k);cy+=(P.y-cy)*Math.min(1,.3*k);
 if(toastT>0)toastT-=dt;
 if(fr%20===0){var arr=[];for(i=0;i<SN.length;i++)if(SN[i].alive)arr.push(SN[i]);arr.sort(function(p,q){return q.m-p.m});lb=[];for(i=0;i<5&&i<arr.length;i++)lb.push([arr[i].name,Math.floor(arr[i].m*10),arr[i]===P])}
 if(st===1)hud();
 else if(st===3){pdead-=dt;if(pdead<=0)over()}}
function eyes(s,th){var ca=Math.cos(s.a),sa=Math.sin(s.a),ox=-sa*th*.5,oy=ca*th*.5,fx=ca*t
