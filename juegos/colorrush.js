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
</style>
</head>
<body>
<div id="root">
<div class="panel">
<div class="brand">MAXIPROYEC · REFLEX LAB</div>
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
  if(s!==lastS){lastS=s;tEl.textContent=s;tEl.style.color=t<2?'#ff3355':'';}
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
  if(v===answer){
    score+=10+streak*2+(level-1)*2;streak++;correct++;
    var newLevel=1+Math.floor(correct/LEVEL_EVERY);
    if(newLevel>level){level=newLevel;mEl.textContent='🔥 ¡Nivel '+level+'! El tiempo corre más rápido';}
    else mEl.textContent='⚡ ¡Correcto!';
    time=Math.min(maxTime(),time+bonus());
  }else{
    streak=0;time=Math.max(0,time-penalty());
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
  running=false;gen++;
  if(timer){clearTimeout(timer);timer=null;}
  if(score>best){best=score;sv(best);bEl.textContent=best;}
  renderTime();
  $('modalTitle').textContent='🏁 FIN';
  $('modalText').innerHTML='Puntos: '+score+'<br>Nivel alcanzado: '+level+'<br>Aciertos: '+correct+'<br>Mejor: '+best;
  overlay.classList.add('show');
}
function reset(){
  if(timer){clearTimeout(timer);timer=null;}
  gen++;score=0;streak=0;correct=0;level=1;time=START_TIME;running=true;lastT=Date.now();
  sEl.textContent='0';rEl.textContent='0';lEl.textContent='1';
  mEl.textContent='Cada 5 aciertos subes de nivel y el tiempo corre más rápido.';
  overlay.classList.remove('show');
  renderTime();round();tick(gen);
}
grid.addEventListener('pointerdown',function(e){e.preventDefault();var t=e.target;if(t&&t._n)pick(t._n);});
$('playAgain').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();reset();});
bEl.textContent=best;
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
