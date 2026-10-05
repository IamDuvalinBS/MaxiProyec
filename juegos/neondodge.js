import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#07040f;color:#e8e4ff;font-family:"Courier New",monospace;touch-action:manipulation}
.m{max-width:400px;margin:0 auto;padding:14px;border:2px solid #7a2cff;border-radius:22px;background:linear-gradient(160deg,#150a2e,#07040f);box-shadow:0 0 22px #7a2cff44}
small{font-size:9px;letter-spacing:3px;color:#9b7cff}h1{margin:2px 0 10px;font-size:26px;letter-spacing:4px;color:#22f5ff;text-shadow:0 0 12px #22f5ff}
.h{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-bottom:8px}.h div{text-align:center;background:#ffffff0d;border-radius:10px;padding:6px 2px;font-size:9px;letter-spacing:1px;color:#9b9bb8}
.h b{display:block;font-size:17px;color:#ffe14d;margin-top:2px}#v{color:#ff3df2!important;letter-spacing:2px}
canvas{width:100%;display:block;border:2px solid #7a2cff;border-radius:14px;background:#0a0618;touch-action:none;transform:translateZ(0)}
.pad{display:flex;gap:10px;margin-top:10px}.pad button{flex:1;width:auto;margin:0;height:58px;font-size:24px;border-color:#7a2cff;background:#1a0a3a;color:#e8e4ff;letter-spacing:0}
.t{text-align:center;font-size:10px;color:#9b9bb8;margin-top:8px;min-height:13px}
button{width:100%;margin-top:8px;height:48px;border-radius:12px;border:2px solid #22f5ff;background:#0b2a3a;color:#22f5ff;font:bold 13px "Courier New",monospace;letter-spacing:2px}
button:active{transform:scale(.96)}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0 14px;font-size:11px;color:#7d8197;letter-spacing:.3px}
.m{position:relative}.sd{position:absolute;top:10px;right:12px;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #7a2cff;background:#1a0a3a;font-size:16px;line-height:1;padding:0;z-index:6;color:#fff}
</style></head><body><div class="m"><button class="sd" id="sd">🔊</button><small>MAXIPROYEC · ARCADE</small><h1>NEON DODGE</h1>
<div class="h"><div>PUNTOS<b id="s">0</b></div><div>NIVEL<b id="l">1</b></div><div>VIDAS<b id="v">♥♥♥</b></div><div>MEJOR<b id="r">0</b></div></div>
<canvas id="c" width="320" height="440"></canvas>
<div class="pad"><button id="bl">◀</button><button id="br">▶</button></div>
<button id="b">▶ JUGAR</button>
<div class="t">Arrastra el dedo o usa los botones · esquiva y toma los orbes</div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
var snd=true,AC=null,SL={};
try{snd=localStorage.getItem("mp_snd")!=="0"}catch(e){}
function au(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){snd=false;return null}}if(AC.state==="suspended")AC.resume();return AC}
function fx(k,g,f,d,t,v,f2){if(!snd||document.hidden)return;var n=Date.now();if(n-(SL[k]||0)<g)return;SL[k]=n;var c=au();if(!c)return;var o=c.createOscillator(),a=c.createGain(),s=c.currentTime;o.type=t||"square";o.frequency.setValueAtTime(f,s);if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);a.gain.setValueAtTime(v||.05,s);a.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(a);a.connect(c.destination);o.start(s);o.stop(s+d+.03)}
(function(){var b=document.getElementById("sd");b.textContent=snd?"🔊":"🔇";b.addEventListener("click",function(){snd=!snd;try{localStorage.setItem("mp_snd",snd?"1":"0")}catch(e){}b.textContent=snd?"🔊":"🔇";if(snd){au();fx("t",0,660,.08,"sine",.06,990)}})})();


var KEY="mp_neondodge_best",mem=0,$=function(i){return document.getElementById(i)};
function ld(){try{return parseInt(localStorage.getItem(KEY))||0}catch(e){return mem}}
function sv(v){mem=v;try{localStorage.setItem(KEY,String(v))}catch(e){}}
var cv=$("c"),x=cv.getContext("2d"),W=320,H=440,SY=H-62;
function glow(w,h,col,fn){var c=document.createElement("canvas");c.width=w+24;c.height=h+24;var q=c.getContext("2d");q.translate(12+w/2,12+h/2);q.shadowColor=col;q.shadowBlur=10;q.strokeStyle=q.fillStyle=col;q.lineWidth=2.5;fn(q);return c}
var SHIP=glow(30,34,"#39ff9c",function(q){q.beginPath();q.moveTo(0,-16);q.lineTo(14,16);q.lineTo(0,9);q.lineTo(-14,16);q.closePath();q.stroke();q.globalAlpha=.3;q.fill()});
var ROCK=glow(40,40,"#ff3df2",function(q){q.beginPath();for(var i=0;i<6;i++){var a=i*1.0472,r=i%2?15:19;q.lineTo(Math.cos(a)*r,Math.sin(a)*r)}q.closePath();q.stroke()});
var DART=glow(10,34,"#ffe14d",function(q){q.beginPath();q.moveTo(0,16);q.lineTo(5,-16);q.lineTo(-5,-16);q.closePath();q.fill()});
var ORB=glow(18,18,"#22f5ff",function(q){q.beginPath();q.arc(0,0,7,0,6.3);q.fill()});
var BG=document.createElement("canvas");BG.width=W;BG.height=H+40;(function(){var q=BG.getContext("2d"),g=q.createLinearGradient(0,0,0,H);g.addColorStop(0,"#0a0618");g.addColorStop(1,"#1a0a3a");q.fillStyle=g;q.fillRect(0,0,W,H+40);q.strokeStyle="#7a2cff22";q.lineWidth=1;
 for(var y=0;y<H+40;y+=40){q.beginPath();q.moveTo(0,y);q.lineTo(W,y);q.stroke()}for(var u=0;u<=W;u+=40){q.beginPath();q.moveTo(u,0);q.lineTo(u,H+40);q.stroke()}})();
var stars=[];for(var si=0;si<26;si++)stars.push([Math.random()*W,Math.random()*H,.4+Math.random()*1.2]);
var px=W/2,tx=W/2,obs=[],orbs=[],sc=0,lv=1,lives=3,inv=0,st=0,spT=0,orT=0,off=0,last=0,best=ld(),c0=["","","",""],rc=null,ht=0;
var E=[$("s"),$("l"),$("v"),$("r")];
function put(i,t){if(c0[i]!==t){c0[i]=t;E[i].textContent=t}}
function hud(){put(0,String(Math.floor(sc)));put(1,String(lv));put(2,"♥♥♥".slice(0,lives)||"–");put(3,String(best))}
function start(){fx("s",0,520,.08,"sine",.05,780);obs=[];orbs=[];sc=0;lv=1;lives=3;inv=0;spT=30;orT=150;st=1;px=tx=W/2;$("b").style.display="none";hud()}
function end(){st=2;fx("e",0,300,.5,"sawtooth",.06,45);var s=Math.floor(sc);if(s>best){best=s;sv(best)}hud();$("b").textContent="↻ JUGAR DE NUEVO";$("b").style.display="block"}
function mv(e){if(!rc||!rc.width)rc=cv.getBoundingClientRect();tx=Math.max(16,Math.min(W-16,(e.clientX-rc.left)*W/rc.width))}
function stp(d){var i=Math.round((tx-20)/40)+d;tx=20+40*Math.max(0,Math.min(7,i))}
function hold(id,d){var b=$(id);b.addEventListener("pointerdown",function(e){e.preventDefault();stp(d);clearTimeout(ht);ht=setTimeout(function rep(){stp(d);ht=setTimeout(rep,110)},260)});
 ["pointerup","pointerleave","pointercancel"].forEach(function(n){b.addEventListener(n,function(){clearTimeout(ht)})})}
hold("bl",-1);hold("br",1);
cv.addEventListener("pointerdown",function(e){e.preventDefault();rc=cv.getBoundingClientRect();mv(e)});
cv.addEventListener("pointermove",function(e){e.preventDefault();mv(e)});
document.addEventListener("keydown",function(e){if(e.code==="ArrowLeft")stp(-1);if(e.code==="ArrowRight")stp(1)});
$("b").addEventListener("click",function(e){e.preventDefault();start()});
function loop(ts){
 if(document.hidden){last=ts;requestAnimationFrame(loop);return}
 var k=Math.min(2.5,(ts-last)/16.67||1),i,o,dx,dy,base=Math.min(7.5,2.4+lv*.3);last=ts;
 if(st===1){sc+=.16*k;var nl=1+Math.floor(sc/250);if(nl>lv)fx("l",0,520,.2,"triangle",.05,1040);lv=nl;px+=(tx-px)*Math.min(1,.3*k);if(inv>0)inv-=k;
  spT-=k;if(spT<=0){
   if(lv>1&&Math.random()<.2)obs.push({x:12+Math.random()*(W-24),y:-20,v:base*1.9,t:1,r:0,a:0,w:0});
   else{var r=9+Math.random()*10;obs.push({x:r+Math.random()*(W-2*r),y:-r*2,v:base+Math.random()*1.2,t:0,r:r,a:Math.random()*6,w:(Math.random()-.5)*.08})}
   spT=Math.max(14,46-lv*3)}
  orT-=k;if(orT<=0){orbs.push({x:20+Math.random()*(W-40),y:-12,v:base});orT=170+Math.random()*120}
  for(i=obs.length-1;i>=0;i--){o=obs[i];o.y+=o.v*k;if(o.t===0)o.a+=o.w*k;if(o.y>H+40){obs.splice(i,1);continue}
   dx=Math.abs(o.x-px);dy=Math.abs(o.y-SY);
   if(inv<=0&&(o.t?(dx<12&&dy<24):(dx*dx+dy*dy<(o.r*.8+9)*(o.r*.8+9)))){obs.splice(i,1);lives--;inv=100;fx("h",100,220,.25,"sawtooth",.06,70);if(lives<=0){end();break}}}
  for(i=orbs.length-1;i>=0;i--){o=orbs[i];o.y+=o.v*k;dx=o.x-px;dy=o.y-SY;
   if(dx*dx+dy*dy<400){sc+=30;orbs.splice(i,1);fx("o",50,900,.09,"sine",.05,1500)}else if(o.y>H+20)orbs.splice(i,1)}
  hud()}
 off=(off+base*.8*k)%40;x.drawImage(BG,0,off-40);
 x.fillStyle="#b9a8ff";for(i=0;i<26;i++){o=stars[i];o[1]+=o[2]*(st===1?base*.5:.4)*k;if(o[1]>H)o[1]=0;x.fillRect(o[0],o[1],o[2],o[2])}
 for(i=0;i<obs.length;i++){o=obs[i];if(o.t)x.drawImage(DART,o.x-17,o.y-17);else{var d=o.r*2.2;x.save();x.translate(o.x,o.y);x.rotate(o.a);x.drawImage(ROCK,-d/2,-d/2,d,d);x.restore()}}
 for(i=0;i<orbs.length;i++){o=orbs[i];x.drawImage(ORB,o.x-15,o.y-15)}
 if(st!==2&&(inv<=0||Math.floor(inv/6)%2))x.drawImage(SHIP,px-27,SY-29);
 if(st===2){x.fillStyle="#000a";x.fillRect(0,H/2-44,W,88);x.fillStyle="#ff3df2";x.font="bold 26px Courier New";x.textAlign="center";x.fillText("GAME OVER",W/2,H/2-6);x.fillStyle="#e8e4ff";x.font="14px Courier New";x.fillText(Math.floor(sc)+" puntos",W/2,H/2+22)}
 requestAnimationFrame(loop)}
E[3].textContent=best;requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".neondodge", ".avion"],
  desc: "Neon Dodge: esquiva obstáculos con tu nave; guarda tu mejor puntaje",
  category: "Juegos",
  usage: ".neondodge",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[NEONDODGE] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
