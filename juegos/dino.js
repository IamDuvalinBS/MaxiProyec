// juegos/dino.js - Dino Runner en HTML dentro del chat (se envia con sock.sendHtml, como .gatohtml)
const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#03030a;color:#cfe9ff;font-family:"Courier New",monospace;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:12px;border:2px solid #0e6e8c;border-radius:20px;background:#060818;box-shadow:0 0 20px #0e6e8c55}
small{font-size:9px;letter-spacing:2px;color:#4a6c86}h1{margin:2px 0 8px;font-size:24px;color:#ffe14d;letter-spacing:3px}
.h{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;color:#22d3ee}
canvas{width:100%;display:block;border:2px solid #0e6e8c;border-radius:12px;background:#050716;touch-action:none}
.b{display:flex;gap:8px;margin-top:10px}.b button{flex:1;height:56px;border-radius:12px;border:2px solid #39ff5a;background:#0a2a1a;color:#39ff5a;font:bold 13px inherit;font-family:inherit;cursor:pointer}
.b button:active{transform:scale(.94)}#d{border-color:#ff3dbd;color:#ff3dbd;background:#2a0a24}
.t{text-align:center;font-size:10px;color:#8aa4bd;margin-top:8px;min-height:14px}
</style></head><body><div class="m"><small>MAXIPROYEC · RETRO ARCADE</small><h1>🦖 DINO RUN</h1>
<div class="h"><span>PUNTOS <b id="s">0</b></span><span>RÉCORD <b id="r">0</b></span></div>
<canvas id="c" width="340" height="180"></canvas>
<div class="b"><button id="j">⬆ SALTAR</button><button id="d">⬇ AGACHAR</button></div>
<div class="t" id="t">Toca SALTAR para empezar. Salta cactus, agáchate ante las aves.</div></div>
<script>
(function(){"use strict";
var $=function(i){return document.getElementById(i)},cv=$("c"),x=cv.getContext("2d"),G=150;
var py,vy,duck,obs,sp,sc,over,run,nx,hi=0,fr,last=0;
function reset(){py=0;vy=0;duck=false;obs=[];sp=5;sc=0;over=false;run=true;nx=90;fr=0;$("t").textContent="¡Corre!"}
function jump(){if(!run||over){reset();return}if(py===0)vy=11.5}
function rect(a,b,c,d,col){x.fillStyle=col;x.fillRect(a,b,c,d)}
function loop(ts){var k=Math.min(2,(ts-last)/16.67||1);last=ts;
 if(run&&!over){fr+=k;sc+=sp*k*.06;sp=Math.min(12,5+sc/120);
  py+=vy*k;vy-=.65*k;if(py<=0){py=0;vy=0}
  nx-=sp*k;if(nx<=0){var bird=sc>150&&Math.random()<.3;
   obs.push(bird?{x:350,w:26,h:14,y:26,b:1}:{x:350,w:14+Math.random()*10,h:24+Math.random()*12,y:0});
   nx=170+Math.random()*150+sp*8}
  var dh=duck&&py===0?14:30;
  for(var i=obs.length-1;i>=0;i--){var o=obs[i];o.x-=sp*k;if(o.x<-40){obs.splice(i,1);continue}
   if(30+3<o.x+o.w&&30+22-3>o.x&&py+3<o.y+o.h&&py+dh-3>o.y){over=true;hi=Math.max(hi,Math.floor(sc));
    $("r").textContent=hi;$("t").textContent="💥 Chocaste. Toca SALTAR para reintentar."}}
  $("s").textContent=Math.floor(sc)}
 x.clearRect(0,0,340,180);rect(0,G,340,2,"#0e6e8c");
 for(var j=0;j<6;j++)rect(((j*70-fr*sp*.5)%340+340)%340,G+8,18,2,"#123");
 var dh2=duck&&py===0?14:30,dy=G-py-dh2;x.shadowColor="#39ff5a";x.shadowBlur=8;
 rect(30,dy,22,dh2,"#39ff5a");rect(44,dy+4,4,4,"#03030a");
 if(py===0&&!over&&Math.floor(fr/5)%2)rect(32,G-4,6,4,"#03030a");
 obs.forEach(function(o){x.shadowColor=o.b?"#ff3dbd":"#ffe14d";rect(o.x,G-o.y-o.h,o.w,o.h,o.b?"#ff3dbd":"#ffe14d")});
 x.shadowBlur=0;requestAnimationFrame(loop)}
cv.addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("j").addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("d").addEventListener("pointerdown",function(e){e.preventDefault();duck=true});
["pointerup","pointerleave","pointercancel"].forEach(function(n){$("d").addEventListener(n,function(){duck=false})});
document.addEventListener("keydown",function(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}if(e.code==="ArrowDown")duck=true});
document.addEventListener("keyup",function(e){if(e.code==="ArrowDown")duck=false});
reset();run=false;requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".dino", ".dinosaurio"],
  desc: "Dino Runner (como el de Google) en HTML dentro del chat",
  category: "Juegos",
  usage: ".dino",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const r = await sock.sendHtml(from, GAME_HTML, [], undefined, {});
      console.log("[DINO] sendHtml enviado, id:", r?.messageId);
    } catch (e) {
      console.log("[DINO] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
