import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#0b0b12;color:#fff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.card{max-width:420px;margin:0 auto;background:#15151f;border:2px solid #2a2a3d;border-radius:26px;overflow:hidden}
.top{padding:14px 20px 16px;border-bottom:2px solid #2a2a3d}
.top small{display:block;font-size:10px;letter-spacing:2px;color:#8b8fa6;margin-bottom:10px}
.row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.row h1{margin:0;font-size:30px;line-height:1.05}
.sc{text-align:right}.sc b{display:block;font-size:30px;letter-spacing:1px;text-shadow:0 0 8px #fff8}.sc span{font-size:11px;color:#8b8fa6;letter-spacing:1px}
.g{padding:14px 14px 6px}
canvas{width:100%;display:block;background:#0d0d14;border:2px solid #2a2a3d;border-radius:20px;image-rendering:pixelated;touch-action:none;transform:translateZ(0)}
.v{text-align:center;color:#9a9eb5;font-size:15px;margin:12px 0 4px}
.b{display:flex;gap:8px;padding:6px 14px 4px}.b button{flex:1;height:52px;border-radius:14px;border:2px solid #34344d;background:#1d1d2b;color:#d8dbf0;font:bold 13px Roboto,Arial,sans-serif;letter-spacing:1px}
.b button:active{background:#2b2b40;transform:scale(.96)}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 0 14px;font-size:11px;color:#7d8197;letter-spacing:.3px}
.sr{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.sr small,.sr .brand{margin:0;min-width:0}.sd{flex:none;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #34344d;background:#1d1d2b;font-size:16px;line-height:1;padding:0;color:#fff}
</style></head><body><div class="card">
<div class="top"><div class="sr"><small>MAXIPROYEC</small><button class="sd" id="sd">🔊</button></div><div class="row"><h1>Dino<br>Runner</h1><div class="sc"><b id="s">00000</b><span>MEJOR</span><br><span id="r">00000</span></div></div></div>
<div class="g"><canvas id="c" width="340" height="120"></canvas><div class="v" id="v">Toca para empezar</div></div>
<div class="b"><button id="j">▲ SALTAR</button><button id="d">▼ AGACHAR</button></div>
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
var lm=0,air=0;


var KEY="mp_dino_best",mem=0,$=function(i){return document.getElementById(i)};
function ld(){try{return parseInt(localStorage.getItem(KEY))||0}catch(e){return mem}}
function sv(v){mem=v;try{localStorage.setItem(KEY,String(v))}catch(e){}}
var cv=$("c"),x=cv.getContext("2d"),W=340,H=120,G=98;x.imageSmoothingEnabled=false;
function spr(rows,col,s){var c=document.createElement("canvas");c.width=rows[0].length*s;c.height=rows.length*s;var q=c.getContext("2d");q.fillStyle=col;
 for(var j=0;j<rows.length;j++)for(var i=0;i<rows[j].length;i++)if(rows[j].charAt(i)==="X")q.fillRect(i*s,j*s,s,s);return c}
var T=["..........XXXX.",".........XXXXXX",".........XX.XXX",".........XXXXXX",".........XXX...","X.......XXXXXX.","X.....XXXXXXX..","XX..XXXXXXXXX..",".XXXXXXXXXXX...","..XXXXXXXXX....","...XXXXXXX.....","....XX..XX....."];
var DA=spr(T.concat(["....XX.........."]),"#f4f4f8",2),DB=spr(T.concat([".........XX...."]),"#f4f4f8",2);
var CA=["..XX..","X.XX..","X.XX.X","XXXX.X","..XXXX","..XX..","..XX..","..XX.."];
var C2=spr(CA,"#ff6b6b",2),C3=spr(CA,"#ff6b6b",3),BI=spr(["......X.....","....XXXX....","XXXXXXXXXXX.","..XXXXXX....","....XX......"],"#8ab4ff",2);
var py=0,vy=0,duck=false,obs=[],sp=4,sc=0,st=0,nx=100,fr=0,best=ld(),last=0,lh=0,cl=[],ls="",lv="",SX=[],SY=[];
for(var i=0;i<5;i++)cl.push([Math.random()*W,10+Math.random()*40,16+Math.random()*14]);
for(var j=0;j<14;j++){SX.push((j*47+7)%W);SY.push((j*29)%70+6)}
var sEl=$("s"),rEl=$("r"),vEl=$("v");
function f5(n){return("00000"+Math.floor(n)).slice(-5)}
function hud(){var a=f5(sc),b=(sp/4).toFixed(1),mm=(sc/100)|0;if(mm>lm){lm=mm;if(st===1)arp([880,1175],.09,"square",.05)}if(a!==ls){ls=a;sEl.textContent=a}if(b!==lv){lv=b;vEl.textContent="Velocidad "+b+"x"}}
rEl.textContent=f5(best);
function reset(){py=0;vy=0;duck=false;obs=[];sp=4;sc=0;st=1;nx=100;fr=0;lv="";lm=0;air=0;hud();mus(mDino,.18)}
function jump(){if(st!==1){reset();return}if(py===0){vy=7.4;air=1;fx("j",60,420,.11,"square",.07,900)}}
function over(){st=2;mend();hurt();setTimeout(function(){fx("o",0,260,.5,"sawtooth",.09,45,1)},200);var s=Math.floor(sc);if(s>best){best=s;sv(best);rEl.textContent=f5(best)}hud();vEl.textContent="Game over · toca para reintentar";lv=""}
function spawn(){
 if(sc>300&&Math.random()<.28)obs.push({x:W+10,w:24,h:10,y:16,i:BI,n:1});
 else{var i=Math.random()<.4?C3:C2,n=Math.random()<.3?2:1;obs.push({x:W+10,w:i.width*n,h:i.height,y:0,i:i,n:n})}
 nx=150+Math.random()*120+sp*14}
function loop(ts){
 if(document.hidden){last=ts;requestAnimationFrame(loop);return}
 var k=Math.min(2.5,(ts-last)/16.67||1),i,o,n;last=ts;
 if(st===1){sc+=sp*k*.08;sp=Math.min(12,4+sc/200);py+=vy*k;vy-=.55*k;if(py<=0){if(air){air=0;nz("ld",60,.06,300,.3)}py=0;vy=0}
  fr+=sp*k;nx-=sp*k;if(nx<=0)spawn();
  var dh=duck&&py===0?14:26;
  for(i=obs.length-1;i>=0;i--){o=obs[i];o.x-=sp*k;if(o.x<-60){obs.splice(i,1);continue}
   if(13<o.x+o.w-3&&36>o.x+3&&py+3<o.y+o.h&&py+dh-3>o.y){over();break}}
  if(ts-lh>90){lh=ts;hud()}}
 x.clearRect(0,0,W,H);x.fillStyle="#2c2c40";
 for(i=0;i<5;i++){o=cl[i];if(st===1)o[0]-=.3*k;if(o[0]<-30)o[0]=W+10;x.fillRect(o[0],o[1],o[2],3)}
 x.fillStyle="#5a5a78";for(i=0;i<14;i++)x.fillRect(SX[i],SY[i],1.5,1.5);
 x.strokeStyle="#6b6e8a";x.lineWidth=1.5;x.setLineDash([5,5]);x.lineDashOffset=fr%10;x.beginPath();x.moveTo(0,G+.5);x.lineTo(W,G+.5);x.stroke();
 var dy=G-py;if(duck&&py===0)x.drawImage(DA,10,dy-14,30,14);else x.drawImage(py>0||st!==1||Math.floor(fr/14)%2?DA:DB,10,dy-26);
 for(i=0;i<obs.length;i++){o=obs[i];for(n=0;n<o.n;n++)x.drawImage(o.i,o.x+n*o.i.width,G-o.y-o.h)}
 requestAnimationFrame(loop)}
cv.addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("j").addEventListener("pointerdown",function(e){e.preventDefault();jump()});
$("d").addEventListener("pointerdown",function(e){e.preventDefault();duck=true;fx("du",100,220,.07,"triangle",.1,150)});
["pointerup","pointerleave","pointercancel"].forEach(function(n){$("d").addEventListener(n,function(){duck=false})});
document.addEventListener("keydown",function(e){if(e.code==="Space"||e.code==="ArrowUp"){e.preventDefault();jump()}if(e.code==="ArrowDown")duck=true});
document.addEventListener("keyup",function(e){if(e.code==="ArrowDown")duck=false});
hud();requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".dino", ".dinosaurio"],
  desc: "Dino Runner (como el de Google); guarda tu mejor puntaje",
  category: "Juegos",
  usage: ".dino",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[DINO] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
