import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#03060f;color:#d6f6ff;font-family:"Courier New",monospace;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:14px;border:2px solid #0e6e8c;border-radius:24px;background:#050a1c;box-shadow:0 0 22px #0e6e8c55}
.hd{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:12px;border-bottom:2px solid #0e6e8c}
small{display:block;font-size:9px;letter-spacing:2px;color:#4f8aa3}h1{margin:4px 0 0;font-size:25px;letter-spacing:3px;color:#22e5ff;text-shadow:0 0 10px #22e5ff}
.ib{display:none;gap:8px}.ib button{width:46px;height:46px;border-radius:12px;border:2px solid #0e6e8c;background:#07162b;font-size:18px;padding:0}
h2{text-align:center;font-size:20px;margin:14px 0 2px}.sub{text-align:center;font-size:11px;color:#6f9bb0;margin-bottom:6px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#22e5ff}
.o{display:grid;gap:8px}.o.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.o.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.ch{height:46px;border-radius:12px;border:2px solid #20324d;background:#060d1e;color:#cfe8f5;font:12px "Courier New",monospace;padding:0 2px;overflow:hidden}
.ch.on{border-color:#22e5ff;box-shadow:0 0 10px #22e5ff66}
.go{width:100%;height:52px;margin-top:16px;border-radius:14px;border:0;background:linear-gradient(90deg,#00d8ff,#a03cff,#ff2fd2);color:#fff;font:bold 14px "Courier New",monospace;letter-spacing:3px}
.go:active,.ch:active,.dp button:active{transform:scale(.96)}
#gm{display:none}
.h{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:12px 0}.h div{text-align:center;border:2px solid #0e6e8c;border-radius:12px;padding:6px 2px;font-size:9px;letter-spacing:1px;color:#6f9bb0}
.h b{display:block;font-size:19px;color:#22e5ff;margin-top:2px}
.w{position:relative}canvas{width:100%;display:block;border:2px solid #0e6e8c;border-radius:16px;background:#030814;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px;background:#030814e6;border-radius:16px}
#ov b{font-size:24px;color:#ff2fd2}#ov span{font-size:13px;margin-bottom:6px}#ov .go{margin:0;height:46px;font-size:12px}
.tip{text-align:center;font-size:9px;letter-spacing:2px;color:#4f8aa3;margin:10px 0}
.dp{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.dp button{height:58px;border-radius:14px;border:2px solid #0e6e8c;background:#07162b;color:#22e5ff;font-size:22px;padding:0}
.dp i{display:block}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0 14px;font-size:11px;color:#7d8197;letter-spacing:.3px}
</style></head><body><div class="m">
<div class="hd"><div><small>RETRO ARCADE · MAXIPROYEC</small><h1>🐍 SNAKE<br>FRUITS</h1></div><div class="ib" id="ib"><button id="sd">🔊</button><button id="ps">⏸</button></div></div>
<div id="cfg"><h2>Configura tu partida</h2><div class="sub">Elige cómo quieres jugar</div>
<h3>🎮 ¿CÓMO VAS A JUGAR?</h3><div class="o c2" id="o0"></div>
<h3>🔥 DIFICULTAD</h3><div class="o c2" id="o1"></div>
<h3>🐍 COLOR DE SERPIENTE</h3><div class="o c4" id="o2"></div>
<h3>🍎 FRUTAS SIMULTÁNEAS</h3><div class="o c4" id="o3"></div>
<h3>🍉 TIPO DE FRUTAS</h3><div class="o c2" id="o4"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm"><div class="h"><div>PUNTOS<b id="s">0</b></div><div>RÉCORD<b id="r">0</b></div><div id="xb">NIVEL<b id="l">1</b></div></div>
<div class="w"><canvas id="c" width="324" height="324"></canvas><div id="ov"><b>💥 GAME OVER</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="go" id="ch" style="background:#07162b;border:2px solid #22e5ff">⚙ AJUSTES</button></div></div>
<div class="tip">COME FRUTAS · CRECE · NO CHOQUES</div>
<div class="dp" id="dp"><i></i><button data-d="u">▲</button><i></i><button data-d="l">◀</button><button data-d="d">▼</button><button data-d="r">▶</button></div></div>
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


var $=function(i){return document.getElementById(i)},N=12,C=27,KEY="mp_snake_best_";
function ld(m){try{return parseInt(localStorage.getItem(KEY+m))||0}catch(e){return 0}}
function sv(m,v){try{localStorage.setItem(KEY+m,String(v))}catch(e){}}
var LISTS=[[["🐍","Clásico"],["🍓","Festival"],["💀","Caos"],["⚡","Supervivencia"]],[["🟢","Fácil",320],["🔵","Normal",250],["🟣","Difícil",190],["🔴","Extremo",140]],
[["🟢","Verde","#39ff7a"],["🔵","Azul","#3da5ff"],["🟣","Morado","#a66cff"],["🔴","Rojo","#ff4d5e"],["🟡","Amarillo","#ffe14d"],["💗","Rosa","#ff7ac8"],["🌈","Arcoíris",""],["⚪","Blanco","#f2f2f8"]],
[["🍎","1"],["🍎","2"],["🍎","3"],["🍎","5"]],[["🌈","Todas"],["🍎","Clásicas"],["💎","Especiales"],["🎲","Aleatorias"]]];
var NS=[1,2,3,5],S=[0,0,0,0,0];
function chips(k){var el=$("o"+k),L=LISTS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var q0=0;q0<5;q0++)chips(q0);
var cv=$("c"),x=cv.getContext("2d"),NN=N*N;
function emo(e){var c=document.createElement("canvas");c.width=c.height=C;var q=c.getContext("2d");q.font=(C*.8|0)+"px serif";q.textAlign="center";q.textBaseline="middle";q.fillText(e,C/2,C/2+1);return c}
var SPR={};function spr(e){return SPR[e]||(SPR[e]=emo(e))}
var CL=[["🍎",10],["🍊",10],["🍓",10],["🍉",10]],ES=[["💎",50],["⭐",30],["🍒",25]],AL=["🍇","🍌","🥝","🍑","🍍","🥭","🍋","🫐"];
var BG=document.createElement("canvas");BG.width=BG.height=N*C;(function(){var q=BG.getContext("2d");q.fillStyle="#030814";q.fillRect(0,0,N*C,N*C);q.strokeStyle="#0e6e8c33";q.lineWidth=1;
 for(var i=0;i<=N;i++){q.beginPath();q.moveTo(i*C+.5,0);q.lineTo(i*C+.5,N*C);q.moveTo(0,i*C+.5);q.lineTo(N*C,i*C+.5);q.stroke()}})();
var RB=[];for(var h0=0;h0<60;h0++)RB.push("hsl("+h0*6+",95%,60%)");
var sn=[],g=new Uint8Array(NN),fr=[],ob=[],q=[],head=0,dx=1,dy=0,score=0,eaten=0,lv=1,left=12,run=false,paused=false,acc=0,last=0,MODE=0,NF=1,cc=["","","",""],off=0;
var E=[$("s"),$("r"),$("l")];
function put(i,t){if(cc[i]!==t){cc[i]=t;E[i].textContent=t}}
function iv(){return Math.max(95,LISTS[1][S[1]][2]-(lv-1)*5)}
function pickFruit(){var t=S[4],l;if(t===0)l=CL.concat(ES);else if(t===1)l=CL;else if(t===2)l=ES;else return{e:AL[Math.random()*AL.length|0],p:5+(Math.random()*36|0)};
 var f=l[Math.random()*l.length|0];return{e:f[0],p:f[1]}}
function fruitAt(i){for(var k=0;k<fr.length;k++)if(fr[k].i===i)return k;return -1}
function freeCell(far){for(var t=0;t<150;t++){var i=Math.random()*NN|0;if(g[i]||fruitAt(i)>=0)continue;if(far&&Math.abs(i%N-head%N)+Math.abs((i/N|0)-(head/N|0))<5)continue;return i}return -1}
function topUp(){while(fr.length<NF){var c=freeCell(false);if(c<0)break;var f=pickFruit();fr.push({i:c,e:f.e,p:f.p})}}
function show(cfg){$("cfg").style.display=cfg?"block":"none";$("gm").style.display=cfg?"none":"block";$("ib").style.display=cfg?"none":"flex"}
function start(){g.fill(0);sn=[];var m=N/2|0;for(var i=0;i<3;i++){sn.push(m*N+m-2+i);g[m*N+m-2+i]=1}head=sn[2];dx=1;dy=0;q=[];fr=[];ob=[];score=0;eaten=0;lv=1;left=12;
 MODE=S[0];NF=NS[S[3]];acc=0;paused=false;run=true;cc=["","","",""];$("ps").textContent="⏸";$("ov").style.display="none";
 if(MODE===3)$("xb").innerHTML='TIEMPO<b id="l">12</b>';else $("xb").innerHTML='NIVEL<b id="l">1</b>';E[2]=$("l");
 topUp();put(0,"0");put(1,String(ld(MODE)));put(2,MODE===3?"12":"1");show(false);draw();fx("s",0,520,.1,"square",.08,780);mus(mSnk,.2)}
function die(){run=false;var b=ld(MODE);if(score>b){b=score;sv(MODE,b)}put(1,String(b));$("ot").textContent=score+" puntos · récord "+b;$("ov").style.display="flex";mend();hurt();setTimeout(function(){fx("o",0,260,.5,"sawtooth",.09,45,1)},200)}
function step(){
 if(q.length){var d=q.shift();dx=d[0];dy=d[1]}
 var hx=head%N,hy=head/N|0,nx=hx+dx,ny=hy+dy;
 if(nx<0||ny<0||nx>=N||ny>=N){die();return false}
 var ni=ny*N+nx,k=fruitAt(ni);
 if(k<0){g[sn.shift()]=0}
 if(g[ni]){die();return false}
 sn.push(ni);g[ni]=1;head=ni;
 if(k>=0){var f=fr[k];fr.splice(k,1);eaten++;score+=f.p*(MODE===1?2:1);var ol=lv;lv=1+Math.floor(eaten/5);if(lv>ol)arp([523,659,784],.12,"triangle",.1);fx("e",0,700+Math.min(500,eaten*15),.1,"triangle",.12,1000+Math.min(600,eaten*20));
  if(MODE===2&&eaten%3===0&&ob.length<9){var c=freeCell(true);if(c>=0){g[c]=2;ob.push(c)}}
  if(MODE===3)left=Math.min(15,left+3);
  topUp();put(0,String(score));if(MODE!==3)put(2,String(lv))}
 return true}
function draw(){x.drawImage(BG,0,0);var i,k;
 x.fillStyle="#ff2fd2";for(i=0;i<ob.length;i++)x.fillRect(ob[i]%N*C+3,(ob[i]/N|0)*C+3,C-6,C-6);
 for(i=0;i<fr.length;i++)x.drawImage(spr(fr[i].e),fr[i].i%N*C,(fr[i].i/N|0)*C);
 var col=LISTS[2][S[2]][2],len=sn.length;off=(off+1)%60;
 for(k=0;k<len;k++){i=sn[k];x.fillStyle=col||RB[(k*3+off)%60];x.fillRect(i%N*C+1,(i/N|0)*C+1,C-2,C-2)}
 var hx=head%N*C+C/2,hy=(head/N|0)*C+C/2;x.fillStyle="#ffffffcc";x.fillRect(hx-C/2+1,hy-C/2+1,C-2,C-2);
 x.fillStyle="#050a1c";var ex=dx*6,ey=dy*6;if(dx!==0){x.fillRect(hx+ex-2,hy-8,4,4);x.fillRect(hx+ex-2,hy+4,4,4)}else{x.fillRect(hx-8,hy+ey-2,4,4);x.fillRect(hx+4,hy+ey-2,4,4)}
 if(paused){x.fillStyle="#030814cc";x.fillRect(0,0,N*C,N*C);x.fillStyle="#22e5ff";x.font="bold 26px Courier New";x.textAlign="center";x.fillText("PAUSA",N*C/2,N*C/2)}}
function dir(a,b){var l=q.length?q[q.length-1]:[dx,dy];if((a===-l[0]&&b===-l[1])||(a===l[0]&&b===l[1]))return;if(q.length<2){q.push([a,b]);fx("tn",40,300,.04,"square",.06)}}
function loop(ts){var dt=Math.min(100,ts-last||16);last=ts;
 if(run&&!paused&&!document.hidden){acc+=dt;var mv=false,t=iv();
  while(acc>=t&&run){acc-=t;if(!step())break;mv=true;t=iv()}
  if(MODE===3&&run){left-=dt/1000;put(2,String(Math.max(0,Math.ceil(left))));if(left<=0)die()}
  if(mv)draw()}
 requestAnimationFrame(loop)}
var DM={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
$("dp").addEventListener("pointerdown",function(e){var d=e.target.getAttribute&&e.target.getAttribute("data-d");if(d){e.preventDefault();dir(DM[d][0],DM[d][1])}});
var sx=0,sy=0;
cv.addEventListener("pointerdown",function(e){e.preventDefault();sx=e.clientX;sy=e.clientY});
cv.addEventListener("pointermove",function(e){e.preventDefault();var a=e.clientX-sx,b=e.clientY-sy;if(Math.abs(a)>16||Math.abs(b)>16){if(Math.abs(a)>Math.abs(b))dir(a>0?1:-1,0);else dir(0,b>0?1:-1);sx=e.clientX;sy=e.clientY}});
document.addEventListener("keydown",function(e){var c=e.code;if(c==="ArrowUp"||c==="KeyW")dir(0,-1);else if(c==="ArrowDown"||c==="KeyS")dir(0,1);else if(c==="ArrowLeft"||c==="KeyA")dir(-1,0);else if(c==="ArrowRight"||c==="KeyD")dir(1,0)});
$("go").addEventListener("click",start);$("ag").addEventListener("click",start);
$("ch").addEventListener("click",function(){run=false;mend();show(true)});
$("ps").addEventListener("click",function(){if(!run)return;paused=!paused;this.textContent=paused?"▶":"⏸";if(paused)mhalt();else mrun();draw()});
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".snakefruits", ".serpiente"],
  desc: "Snake Fruits: modos, dificultades, colores y frutas; guarda tu récord por modo",
  category: "Juegos",
  usage: ".snakefruits",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[SNAKEFRUITS] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
