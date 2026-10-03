import { lanzarJuegoHTML } from "../motores/juegos-records.js";
// juegos/neondodge.js - Neon Dodge (avioncito que esquiva obstaculos) en HTML dentro del chat
const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#03030a;color:#cfe9ff;font-family:"Courier New",monospace;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:12px;border:2px solid #0e6e8c;border-radius:20px;background:#060818;box-shadow:0 0 20px #0e6e8c55}
small{font-size:9px;letter-spacing:2px;color:#4a6c86}h1{margin:2px 0 8px;font-size:24px;color:#22d3ee;letter-spacing:3px;text-shadow:0 0 10px #22d3ee}
.h{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;color:#ffe14d}
canvas{width:100%;display:block;border:2px solid #0e6e8c;border-radius:12px;background:#03030a;touch-action:none}
.t{text-align:center;font-size:10px;color:#8aa4bd;margin-top:8px;min-height:14px}
button{width:100%;margin-top:8px;height:48px;border-radius:12px;border:2px solid #22d3ee;background:#0a2a3a;color:#22d3ee;font:bold 13px inherit;font-family:inherit;cursor:pointer}
button:active{transform:scale(.96)}
#claim{display:none;margin-top:10px;padding:10px;border:2px solid #ffe14d;border-radius:12px;font-size:11px;text-align:center;color:#ffe14d;background:#2a250a}
#claim a{display:block;margin:8px 0;padding:10px;border-radius:10px;background:#ffe14d;color:#000;font-weight:bold;text-decoration:none}
#claim code{font-size:10px;color:#fff;word-break:break-all;-webkit-user-select:text;user-select:text}
</style></head><body><div class="m"><small>MAXIPROYEC · RETRO ARCADE</small><h1>🚀 NEON DODGE</h1>
<div class="h"><span>PUNTOS <b id="s">0</b></span><span>RÉCORD <b id="r">0</b></span></div>
<canvas id="c" width="340" height="440"></canvas>
<button id="b">▶ JUGAR</button>
<div class="t" id="t">Arrastra el dedo para mover la nave. Esquiva rocas, toma los orbes cian.</div></div>
<div id="claim"></div>
<script>
(function(){"use strict";
var SID="__SID__",BOT="__BOT__";
function claim(p){var c=document.getElementById("claim");if(!c)return;if(p<1){c.style.display="none";return}var m=".puntaje "+SID+" "+p;
c.style.display="block";c.innerHTML='🏆 ¿Récord? Reclama tu premio:<a href="https://wa.me/'+BOT+'?text='+encodeURIComponent(m)+'">ENVIAR PUNTAJE AL BOT</a><code>'+m+'</code>'}

var $=function(i){return document.getElementById(i)},cv=$("c"),x=cv.getContext("2d"),W=340,H=440;
var px,tx,obs,orbs,sc,sp,sp_t,or_t,run=false,hi=0,last=0,stars=[];
for(var i=0;i<40;i++)stars.push([Math.random()*W,Math.random()*H,Math.random()*1.5+.5]);
function start(){px=tx=W/2;obs=[];orbs=[];sc=0;sp=3;sp_t=30;or_t=200;run=true;$("b").style.display="none";$("t").textContent="¡Esquiva!";claim(0)}
function end(){run=false;hi=Math.max(hi,Math.floor(sc));$("r").textContent=hi;$("b").textContent="↻ REINTENTAR";$("b").style.display="block";$("t").textContent="💥 Te estrellaste con "+Math.floor(sc)+" puntos.";claim(Math.floor(sc))}
function mv(e){var r=cv.getBoundingClientRect();tx=Math.max(14,Math.min(W-14,(e.clientX-r.left)*W/r.width))}
cv.addEventListener("pointerdown",function(e){e.preventDefault();mv(e)});
cv.addEventListener("pointermove",function(e){e.preventDefault();mv(e)});
$("b").addEventListener("click",function(e){e.preventDefault();start()});
function loop(ts){var k=Math.min(2,(ts-last)/16.67||1);last=ts;
 x.fillStyle="#03030a";x.fillRect(0,0,W,H);
 stars.forEach(function(s){s[1]=(s[1]+s[2]*(run?sp*.4:.5)*k)%H;x.fillStyle="#4a6c86";x.fillRect(s[0],s[1],s[2],s[2])});
 if(run){sc+=.1*k*sp;sp=Math.min(9,3+sc/150);px+=(tx-px)*.25*k;
  sp_t-=k;if(sp_t<=0){var r=10+Math.random()*14;obs.push({x:r+Math.random()*(W-2*r),y:-r,r:r,v:sp+Math.random()*2});sp_t=Math.max(14,45-sc/20)}
  or_t-=k;if(or_t<=0){orbs.push({x:20+Math.random()*(W-40),y:-10,v:sp});or_t=180+Math.random()*120}
  var i,o,dx,dy;
  for(i=obs.length-1;i>=0;i--){o=obs[i];o.y+=o.v*k;if(o.y>H+30){obs.splice(i,1);continue}
   dx=o.x-px;dy=o.y-(H-50);if(dx*dx+dy*dy<Math.pow(o.r+9,2)){end();break}}
  for(i=orbs.length-1;i>=0;i--){o=orbs[i];o.y+=o.v*k;dx=o.x-px;dy=o.y-(H-50);
   if(dx*dx+dy*dy<400){sc+=25;orbs.splice(i,1)}else if(o.y>H+20)orbs.splice(i,1)}
  $("s").textContent=Math.floor(sc)}
 x.shadowBlur=12;
 obs.forEach(function(o){x.shadowColor="#ff3dbd";x.strokeStyle="#ff3dbd";x.lineWidth=3;x.beginPath();x.arc(o.x,o.y,o.r,0,6.3);x.stroke()});
 orbs.forEach(function(o){x.shadowColor="#22d3ee";x.fillStyle="#22d3ee";x.beginPath();x.arc(o.x,o.y,7,0,6.3);x.fill()});
 if(px!==undefined){x.shadowColor="#39ff5a";x.fillStyle="#39ff5a";x.beginPath();x.moveTo(px,H-68);x.lineTo(px+13,H-34);x.lineTo(px,H-42);x.lineTo(px-13,H-34);x.closePath();x.fill()}
 x.shadowBlur=0;requestAnimationFrame(loop)}
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".neondodge", ".avion"],
  desc: "Neon Dodge: esquiva obstáculos con tu nave. Superar tu récord te da ¥enes",
  category: "Juegos",
  usage: ".neondodge",
  handler: async ({ sock, from, sender, msg, reply }) =>
    lanzarJuegoHTML({ sock, from, sender, msg, reply, juego: "neondodge", html: GAME_HTML }),
};
