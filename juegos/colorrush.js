// juegos/colorrush.js
//
// COLOR RUSH en HTML real (mismo sistema que .gatohtml). El juego corre DENTRO
// del mensaje: el bot solo lo envia una vez y todo (puntos, racha, niveles,
// tiempo) pasa en el celular con JavaScript, asi que no manda mensajes por jugada.
//
// Es 100% aparte de los demas juegos: si falla, no afecta a nada mas.
// Copialo en la carpeta juegos/ (el cargador de comandos ya la escanea).

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;background:#16060d;color:#fff;font-family:Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}
#root{max-width:520px;margin:0 auto;padding:14px}
.panel{padding:18px;background:linear-gradient(135deg,#2b0a22,#0d0717);border:2px solid #ff4fa3;border-radius:20px;box-shadow:0 0 30px rgba(255,79,163,.2)}
.brand{font-size:9px;letter-spacing:3px;color:#ff4fa3;text-transform:uppercase}
.title{font-size:29px;font-weight:900;margin-top:4px}
.hud{display:flex;gap:6px;margin:12px 0}
.hud>div{flex:1;text-align:center;background:rgba(255,255,255,.07);border-radius:9px;padding:8px 4px;font-size:9px;letter-spacing:1px;color:rgba(255,255,255,.6);text-transform:uppercase}
.hud b{display:block;font-size:18px;color:#ffe66d;margin-top:3px;font-weight:900}
.bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-bottom:4px}
.bar>div{height:100%;width:100%;background:linear-gradient(90deg,#ff4fa3,#ffe66d);transition:width .1s linear}
.target{text-align:center;font-size:13px;margin:14px 0 6px;color:rgba(255,255,255,.75);letter-spacing:1px}
.big{font-size:42px;font-weight:900;margin-top:6px;text-shadow:0 0 14px currentColor}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:8px}
.c{height:88px;border:0;border-radius:15px;font-size:14px;font-weight:900;color:#fff;cursor:pointer;touch-action:manipulation;padding:0;font-family:inherit}
.c:active{transform:scale(.94)}
.msg{text-align:center;margin-top:12px;color:#ffb9da;font-size:11px;min-height:14px}
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
<div id="root" style="position:relative">
<div class="panel">
<div class="brand">MAXIPROYEC · REFLEX LAB</div>
<div class="title">🎨 COLOR RUSH</div>
<div class="hud">
<div>Puntos<b id="s">0</b></div>
<div>Racha<b id="r">0</b></div>
<div>Nivel<b id="l">1</b></div>
<div>Tiempo<b id="t">6.0</b></div>
</div>
<div class="bar"><div id="bar"></div></div>
<div class="target">Toca el color:<div id="target" class="big">ROJO</div></div>
<div id="grid" class="grid"></div>
<div id="m" class="msg">Cada 5 aciertos subes de nivel y el tiempo corre más rápido.</div>
</div>
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

/* ===== DIFICULTAD ===== */
var START_TIME=6;        // tiempo inicial
var LEVEL_EVERY=5;       // aciertos necesarios para subir de nivel
function maxTime(){return Math.max(3.5,6.5-(level-1)*0.35);}   // tope de tiempo baja por nivel
function bonus(){return Math.max(0.3,0.9-(level-1)*0.08);}     // segundos que ganas por acierto
function penalty(){return Math.min(3.5,2+(level-1)*0.25);}     // segundos que pierdes por fallo
function drain(){return Math.min(2,1+(level-1)*0.1);}          // velocidad a la que corre el reloj
/* ====================== */

var score=0,streak=0,correct=0,level=1,time=START_TIME,answer='ROJO',running=true,timer=null;
var sEl=document.getElementById('s'),rEl=document.getElementById('r'),lEl=document.getElementById('l'),tEl=document.getElementById('t');
var barEl=document.getElementById('bar');
var targetEl=document.getElementById('target'),grid=document.getElementById('grid'),mEl=document.getElementById('m');
var overlay=document.getElementById('overlay'),modalTitle=document.getElementById('modalTitle'),modalText=document.getElementById('modalText');
var playAgain=document.getElementById('playAgain');

function renderTime(){
  var t=Math.max(0,time);
  tEl.textContent=t.toFixed(1);
  tEl.style.color=t<2?'#ff3355':'';
  barEl.style.width=Math.min(100,(t/maxTime())*100)+'%';
}

function round(){
  var arr=names.slice().sort(function(){return Math.random()-.5}).slice(0,4);
  answer=arr[Math.floor(Math.random()*arr.length)][0];
  targetEl.textContent=answer;
  targetEl.style.color=arr.find(function(n){return n[0]===answer;})[1];
  grid.innerHTML='';
  arr.forEach(function(n){
    var b=document.createElement('button');
    b.className='c';
    b.style.background=n[1];
    b.textContent=n[0];
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();pick(n[0]);});
    grid.appendChild(b);
  });
}

function pick(v){
  if(!running)return;
  if(v===answer){
    score+=10+streak*2+(level-1)*2;
    streak++;
    correct++;
    var newLevel=1+Math.floor(correct/LEVEL_EVERY);
    if(newLevel>level){
      level=newLevel;
      mEl.textContent='🔥 ¡Nivel '+level+'! El tiempo corre más rápido';
    }else{
      mEl.textContent='⚡ ¡Correcto!';
    }
    time=Math.min(maxTime(),time+bonus());
  }else{
    streak=0;
    time=Math.max(0,time-penalty());
    mEl.textContent='❌ Fallaste (-'+penalty().toFixed(1)+'s)';
  }
  sEl.textContent=score;rEl.textContent=streak;lEl.textContent=level;
  renderTime();
  if(time<=0){endGame();return;}
  if(running)round();
}

function tick(){
  if(!running)return;
  time-=0.1*drain();
  renderTime();
  if(time<=0){endGame();return;}
  timer=setTimeout(tick,100);
}

function endGame(){
  running=false;
  if(timer){clearTimeout(timer);timer=null;}
  renderTime();
  modalTitle.textContent='🏁 FIN';
  modalText.innerHTML='Puntos: '+score+'<br>Nivel alcanzado: '+level+'<br>Aciertos: '+correct;
  overlay.classList.add('show');
}

function reset(){
  if(timer){clearTimeout(timer);timer=null;}
  score=0;streak=0;correct=0;level=1;time=START_TIME;running=true;
  sEl.textContent='0';rEl.textContent='0';lEl.textContent='1';
  mEl.textContent='Cada 5 aciertos subes de nivel y el tiempo corre más rápido.';
  overlay.classList.remove('show');
  renderTime();
  round();
  tick();
}

playAgain.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();reset();});
renderTime();
round();
tick();
})();
</script>
</body>
</html>`;

export default {
  names: [".colorrush", ".colores"],
  desc: "Color Rush: juego de reflejos en HTML dentro del chat (sube de nivel cada 5 aciertos)",
  category: "Juegos",
  usage: ".colorrush",
  handler: async ({ sock, from, msg }) => {
    try {
      // Mismo envio que .gatohtml: sock.sendHtml del fork de Baileys
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const r = await sock.sendHtml(from, GAME_HTML, [], undefined, {});
      console.log("[COLORRUSH] sendHtml enviado, id:", r?.messageId);
    } catch (e) {
      console.log("[COLORRUSH] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
