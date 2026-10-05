import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;background:#16060d;color:#fff;font-family:Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}
#root{max-width:520px;margin:0 auto;padding:14px;position:relative}
.panel{padding:18px;background:linear-gradient(135deg,#2b0a22,#0d0717);border:2px solid #ff4fa3;border-radius:20px;box-shadow:0 0 30px rgba(255,79,163,.2)}
.brand{font-size:9px;letter-spacing:3px;color:#ff4fa3;text-transform:uppercase}
.title{font-size:29px;font-weight:900;margin-top:4px}
.hud{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:12px 0}
.hud>div{text-align:center;background:rgba(255,255,255,.07);border-radius:9px;padding:7px 2px;font-size:8px;letter-spacing:.5px;color:rgba(255,255,255,.6);text-transform:uppercase;overflow:hidden}
.hud b{display:block;font-size:16px;color:#ffe66d;margin-top:3px;font-weight:900}
.bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-bottom:4px}
.bar>div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#ff4fa3,#ffe66d)}
.target{text-align:center;font-size:13px;margin:14px 0 6px;color:rgba(255,255,255,.75);letter-spacing:1px}
.big{font-size:42px;font-weight:900;margin-top:6px;white-space:nowrap;overflow:hidden;text-shadow:0 0 14px currentColor}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px}
.c{height:88px;border:0;border-radius:15px;font-size:14px;font-weight:900;color:#fff;cursor:pointer;touch-action:manipulation;padding:0;font-family:inherit}
.c:active{transform:scale(.94)}
.msg{text-align:center;margin-top:12px;color:#ffb9da;font-size:11px;min-height:14px}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 2px;font-size:11px;color:#b98aa6}
.overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:25px;background:rgba(22,6,13,.94);z-index:50}
.overlay.show{display:flex}
.modal{width:100%;max-width:320px;text-align:center;background:#2b0a22;border:2px solid #ff4fa3;border-radius:18px;padding:22px;box-shadow:0 0 35px rgba(255,79,163,.3)}
.modalTitle{font-size:24px;font-weight:900;color:#ff4fa3}
.modalText{font-size:12px;color:rgba(255,255,255,.7);margin:8px 0 16px;line-height:1.6}
.modalBtn{width:100%;padding:12px;margin-top:7px;border-radius:11px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-weight:900;font-size:12px;cursor:pointer;font-family:inherit}
.modalBtn:active{background:rgba(255,79,163,.2)}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small,.sr .brand{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #ff4fa3;background:#2b0a22;font-size:16px;line-height:1;padding:0;color:#fff}
</style>
</head>
<body>
<div id="root">
<div class="panel">
<div class="sr"><div class="brand">MAXIPROYEC · REFLEX LAB</div><button class="sd" id="sd">🔊</button></div>
<div class="title">🎨 COLOR RUSH</div>
<div class="hud">
<div>Puntos<b id="s">0</b></div>
<div>Racha<b id="r">0</b></div>
<div>Nivel<b id="l">1</b></div>
<div>Tiempo<b id="t">6.0</b></div>
<div>Mejor<b id="b">0</b></div>
</div>
<div class="bar"><div id="bar"></div></div>
<div class="target">Toca el color:<div id="target" class="big">ROJO</div></div>
<div id="grid" class="grid"></div>
<div id="m" class="msg">Cada 5 aciertos subes de nivel y el tiempo corre más rápido.</div>
</div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
<div id="overlay" class="overlay">
<div class="modal">
<div id="modalTitle" class="modalTitle">🏁 FIN</div>
<div id="modalText" class="modalText">Puntos: 0</div>
<button id="playAgain" class="modalBtn">▶ JUGAR DE NUEVO</button>
</div>
</div>
</div>
<script>
(function(){
"use strict";
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


var names=[['ROJO','#ff3355'],['AZUL','#3388ff'],['VERDE','#28d17c'],['AMARILLO','#ffd633'],['MORADO','#a66cff'],['CIAN','#20e0d0']];
var START_TIME=6,LEVEL_EVERY=5;
function maxTime(){return Math.max(3.5,6.5-(level-1)*0.35);}
function bonus(){return Math.max(0.3,0.9-(level-1)*0.08);}
function penalty(){return Math.min(3.5,2+(level-1)*0.25);}
function drain(){return Math.min(2,1+(level-1)*0.1);}
var KEY="mp_colorrush_best",mem=0;
function ld(){try{return parseInt(localStorage.getItem(KEY))||0}catch(e){return mem}}
function sv(v){mem=v;try{localStorage.setItem(KEY,String(v))}catch(e){}}
var best=ld(),score=0,streak=0,correct=0,level=1,time=START_TIME,answer='ROJO',running=true,timer=null,gen=0,lastT=Date.now(),lastS="",fitC={},btns=[];
var $=function(i){return document.getElementById(i)};
var sEl=$('s'),rEl=$('r'),lEl=$('l'),tEl=$('t'),bEl=$('b'),barEl=$('bar'),targetEl=$('target'),grid=$('grid'),mEl=$('m'),overlay=$('overlay');
for(var i=0;i<4;i++){var bt=document.createElement('button');bt.className='c';grid.appendChild(bt);btns.push(bt)}
function renderTime(){
  var t=Math.max(0,time),s=t.toFixed(1);
  if(s!==lastS){lastS=s;tEl.textContent=s;tEl.style.color=t<2?'#ff3355':'';if(t<2&&t>0&&running&&(t*10|0)%5===0)fx('tk',250,980,.05,'square',.07)}
  barEl.style.transform='scaleX('+Math.min(1,t/maxTime())+')';
}
function fit(){
  var s=fitC[answer];
  if(!s){s=42;targetEl.style.fontSize=s+'px';
    while(targetEl.scrollWidth>targetEl.clientWidth&&s>16){s-=2;targetEl.style.fontSize=s+'px';}
    fitC[answer]=s;}
  targetEl.style.fontSize=s+'px';
}
function round(){
  var arr=names.slice(),i,j,t;
  for(i=0;i<4;i++){j=i+Math.floor(Math.random()*(arr.length-i));t=arr[i];arr[i]=arr[j];arr[j]=t;}
  arr=arr.slice(0,4);
  var pick4=arr[Math.floor(Math.random()*4)];
  answer=pick4[0];
  targetEl.textContent=answer;
  targetEl.style.color=pick4[1];
  fit();
  for(i=0;i<4;i++){btns[i].style.background=arr[i][1];btns[i].textContent=arr[i][0];btns[i]._n=arr[i][0];}
}
function pick(v){
  if(!running)return;
  if(v===answer){fx("c",30,600+Math.min(12,streak)*55,.09,"triangle",.1,1000+Math.min(12,streak)*55);
    score+=10+streak*2+(level-1)*2;streak++;correct++;
    var newLevel=1+Math.floor(correct/LEVEL_EVERY);
    if(newLevel>level){arp([523,784,1047],.13,"triangle",.09);level=newLevel;mEl.textContent='🔥 ¡Nivel '+level+'! El tiempo corre más rápido';}
    else mEl.textContent='⚡ ¡Correcto!';
    time=Math.min(maxTime(),time+bonus());
  }else{
    hurt();streak=0;time=Math.max(0,time-penalty());
    mEl.textContent='❌ Fallaste (-'+penalty().toFixed(1)+'s)';
  }
  sEl.textContent=score;rEl.textContent=streak;lEl.textContent=level;
  renderTime();
  if(time<=0){endGame();return;}
  round();
}
function tick(g){
  if(!running||g!==gen)return;
  var n=Date.now(),dt=Math.min(.5,(n-lastT)/1000);lastT=n;
  time-=dt*drain();
  renderTime();
  if(time<=0){endGame();return;}
  timer=setTimeout(function(){tick(g);},100);
}
function endGame(){
  mend();setTimeout(function(){fx("e",0,300,.5,"sawtooth",.1,50,1)},200);running=false;gen++;
  if(timer){clearTimeout(timer);timer=null;}
  if(score>best){best=score;sv(best);bEl.textContent=best;}
  
  renderTime();
  $('modalTitle').textContent='🏁 FIN';
  $('modalText').innerHTML='Puntos: '+score+'<br>Nivel alcanzado: '+level+'<br>Aciertos: '+correct+'<br>Mejor: '+best;
  overlay.classList.add('show');
}
function reset(){
  if(timer){clearTimeout(timer);timer=null;}
  fx("s",0,520,.1,"sine",.08,780);mus(mCR,.17);gen++;score=0;streak=0;correct=0;level=1;time=START_TIME;running=true;lastT=Date.now();
  sEl.textContent='0';rEl.textContent='0';lEl.textContent='1';
  mEl.textContent='Cada 5 aciertos subes de nivel y el tiempo corre más rápido.';
  overlay.classList.remove('show');
  
  renderTime();round();tick(gen);
}
grid.addEventListener('pointerdown',function(e){e.preventDefault();var t=e.target;if(t&&t._n)pick(t._n);});
$('playAgain').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();reset();});
bEl.textContent=best;
mus(mCR,.17);
renderTime();round();tick(gen);
})();
</script>
</body>
</html>`;

export default {
  names: [".colorrush", ".colores"],
  desc: "Color Rush: reflejos por colores; guarda tu mejor puntaje",
  category: "Juegos",
  usage: ".colorrush",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[COLORRUSH] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
