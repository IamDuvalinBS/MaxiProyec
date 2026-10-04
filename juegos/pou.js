import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#06120a;color:#e9ffee;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #5bd36a;border-radius:28px;background:radial-gradient(circle at 50% 0,#12401f,#07150c);box-shadow:0 0 24px #5bd36a33}
small{display:block;font-size:10px;letter-spacing:3px;color:#5bd36a}
h1{margin:4px 0 6px;font-size:30px;line-height:1.05}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#8bc99b;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#7dff98}
.o{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ch{height:48px;border-radius:12px;border:2px solid #25472f;background:#0a1d12;color:#d3f5dc;font:bold 13px Roboto,Arial,sans-serif;padding:0 4px;overflow:hidden}
.ch.on{border-color:#7dff98;box-shadow:0 0 10px #7dff9855;background:#12301c}
#pv{display:block;width:64px;height:64px;margin:0 auto 8px}
.go,.bt{display:block;width:100%;height:52px;margin-top:14px;border-radius:14px;border:2px solid #5bd36a;background:#0d2c18;color:#7dff98;font:bold 15px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#4be36a,#d6ff5a);color:#06240f}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.hud{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:10px 0}
.hud div{text-align:center;border:2px solid #2f9a4d;border-radius:14px;padding:6px 1px;font-size:9px;letter-spacing:1px;color:#8bc99b;background:#0b2415;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:19px;color:#c9ff6a}#h3{font-size:14px;letter-spacing:-1px;line-height:1.35}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#041009ee;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ff6a6a}#ov span{font-size:14px;color:#a6e8b6;margin-bottom:6px}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
.hint{text-align:center;font-size:12px;color:#a6e8b6;margin:10px 0 0}
.pb{height:22px;margin:12px 0 0;border-radius:11px;background:#0b2415;overflow:hidden}.pb div{height:100%;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(90deg,#72ff8a,#ffe14d,#ff5a5a)}
.an{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:10px}.an .bt{margin:0;height:50px;font-size:15px;padding:0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#7fae8c}
</style></head><body><div class="m"><small>MAXIPROYEC · ARCADE</small><h1>⚽ POU<br>PENALES</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Elige cómo quieres jugar</div>
<h3>🌤️ AMBIENTE</h3><div class="o" id="o0"></div>
<h3>⚽ PELOTA</h3><canvas id="pv" width="96" height="96"></canvas><div class="o" id="o1"></div>
<h3>✨ ESTILO</h3><div class="o" id="o2"></div>
<h3>🔥 DIFICULTAD</h3><div class="o" id="o3"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm" style="display:none"><div class="hud"><div>PUNTOS<b id="h0">0</b></div><div>RÉCORD<b id="h1">0</b></div><div>NIVEL<b id="h2">1</b></div><div>VIDAS<b id="h3">♥♥♥</b></div></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="ov"><b>🏁 FIN DEL JUEGO</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<div class="pb" id="pb"><div id="pf"></div></div>
<div class="an" id="an"><button class="bt" data-a="-.12">◀◀</button><button class="bt" data-a="-.04">◀</button><button class="bt" data-a="t">🎯</button><button class="bt" data-a=".04">▶</button><button class="bt" data-a=".12">▶▶</button></div>
<button class="go" id="kb">⚽ PATEAR</button>
<div class="hint">Apunta con ◀ ▶, elige la fuerza en la barra y pulsa PATEAR · o desliza hacia arriba sobre el campo</div>
<button class="bt" id="mb">⚙ AJUSTES</button></div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_pou_best",CK="mp_pou_cfg";
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
var AM=[["🌤️","Día"],["🌙","Noche"],["🌧️","Lluvia"],["☀️","Soleado"],["🌓","Media luna"],["🌕","Luna llena · terror"]];
var BL=[["⚽","Fútbol"],["🏀","Basket"],["🏐","Voley"],["🎾","Tenis"]],SL=[["⚪","Normal"],["💠","Neón"],["🔥","Fuego"],["🌈","Arcoíris"]];
var DF=[["🟢","Fácil",{n:70,sp:130,rt:.32,d:.3}],["🔵","Normal",{n:48,sp:180,rt:.24,d:.45}],["🟣","Difícil",{n:28,sp:230,rt:.17,d:.65}],["🔴","Pesadilla",{n:10,sp:300,rt:.1,d:.85}]];
var LS=[AM,BL,SL,DF],S=[0,0,0,1];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===4&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S=c0}catch(e){}
function pent(q,cx,cy,r){q.beginPath();for(var i=0;i<5;i++){var a=i*1.2566-1.5708;q.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}q.closePath();q.fill()}
var BS={};
function ballSpr(t,s){var key=t*4+s;if(BS[key])return BS[key];var a=cvs(40,40),q=a[1],i,an;q.translate(20,20);
 if(s===1){q.shadowColor="#22f5ff";q.shadowBlur=9}else if(s===2){q.shadowColor="#ff7a1a";q.shadowBlur=9}
 q.beginPath();q.arc(0,0,14,0,6.3);q.fillStyle=t===1?"#ea7a2f":t===3?"#d9f23c":"#f7f7f7";q.fill();q.shadowBlur=0;q.strokeStyle="#9a9a9a";q.lineWidth=1;q.stroke();
 q.save();q.clip();q.strokeStyle=q.fillStyle="#222";q.lineWidth=1.6;
 if(t===0){pent(q,0,0,5.5);for(i=0;i<5;i++){an=i*1.2566-1.5708;pent(q,Math.cos(an)*14,Math.sin(an)*14,5.5);q.beginPath();q.moveTo(Math.cos(an)*5.5,Math.sin(an)*5.5);q.lineTo(Math.cos(an)*9,Math.sin(an)*9);q.stroke()}}
 else if(t===1){q.beginPath();q.moveTo(-14,0);q.lineTo(14,0);q.moveTo(0,-14);q.lineTo(0,14);q.stroke();q.beginPath();q.arc(-15,0,10,-1.2,1.2);q.stroke();q.beginPath();q.arc(15,0,10,Math.PI-1.2,Math.PI+1.2);q.stroke()}
 else if(t===2){q.lineWidth=5;q.strokeStyle="#2d6fd6";q.beginPath();q.moveTo(-14,-6);q.lineTo(14,-14);q.stroke();q.strokeStyle="#ffd23f";q.beginPath();q.moveTo(-14,4);q.lineTo(14,-4);q.stroke();q.strokeStyle="#2d6fd6";q.beginPath();q.moveTo(-14,14);q.lineTo(14,6);q.stroke()}
 else{q.strokeStyle="#fff";q.lineWidth=2.2;q.beginPath();q.arc(-13,0,11,-1.1,1.1);q.stroke();q.beginPath();q.arc(13,0,11,Math.PI-1.1,Math.PI+1.1);q.stroke()}
 q.restore();
 if(s>0){q.globalCompositeOperation="source-atop";q.globalAlpha=.32;if(s===3){var g=q.createLinearGradient(-14,-14,14,14);g.addColorStop(0,"#ff3d6e");g.addColorStop(.35,"#ffe14d");g.addColorStop(.65,"#3dff9c");g.addColorStop(1,"#3d8bff");q.fillStyle=g}else q.fillStyle=s===1?"#22f5ff":"#ff5a1f";q.fillRect(-20,-20,40,40)}
 BS[key]=a[0];return a[0]}
function pouSpr(f,red){var a=cvs(60,56),q=a[1],i,ex;
 q.fillStyle="#b07f3f";q.strokeStyle="#7d5626";q.lineWidth=2;q.beginPath();q.moveTo(30,3);q.bezierCurveTo(36,3,40,12,46,22);q.bezierCurveTo(54,32,58,40,52,47);q.bezierCurveTo(46,54,14,54,8,47);q.bezierCurveTo(2,40,6,32,14,22);q.bezierCurveTo(20,12,24,3,30,3);q.closePath();q.fill();q.stroke();
 q.fillStyle="rgba(255,255,255,.2)";q.beginPath();q.ellipse(21,34,7,9,.5,0,6.3);q.fill();
 for(i=0;i<2;i++){ex=22+i*16;q.fillStyle="#fff";q.strokeStyle="#7d5626";q.lineWidth=1.2;q.beginPath();q.arc(ex,29,7,0,6.3);q.fill();q.stroke();q.fillStyle=red?"#ff2a2a":"#111";q.beginPath();q.arc(ex+(f===1?0:1),29+(f===2?2:(f===1?-2:0)),2.8,0,6.3);q.fill()}
 q.strokeStyle="#4a2e0f";q.lineWidth=1.8;q.beginPath();
 if(f===1){q.fillStyle="#5a2a12";q.ellipse(30,41,5,4,0,0,6.3);q.fill()}else if(f===2){q.arc(30,46,5,3.6,5.8);q.stroke()}else{q.arc(30,38,5,.3,2.84);q.stroke()}
 return a[0]}
function pine(q,x,y,h,c){q.fillStyle=c;for(var j=0;j<3;j++){var w=h*.38*(1-j*.22),yy=y-h*.33*j;q.beginPath();q.moveTo(x-w,yy);q.lineTo(x,yy-h*.5);q.lineTo(x+w,yy);q.fill()}q.fillRect(x-2,y,4,5)}
var SKY=[["#4aa8ff","#c9ecff"],["#040a22","#1a2a66"],["#56606b","#a3adb7"],["#1b9bff","#a8e6ff"],["#0a1030","#2a3a86"],["#0b0006","#5a1220"]];
var GRS=[["#2fb24a","#37c255"],["#0f4d2a","#126030"],["#2c6b4a","#347a54"],["#4cc23a","#58d046"],["#0f3f2a","#14512f"],["#16301a","#1a3a1e"]];
var TRC=["#1f9a3a","#0a2a1c","#2a5a3c","#26a63a","#0b2a2a"];
function bake(a){var b=cvs(W,H),q=b[1],i,g,y;
 g=q.createLinearGradient(0,0,0,200);g.addColorStop(0,SKY[a][0]);g.addColorStop(1,SKY[a][1]);q.fillStyle=g;q.fillRect(0,0,W,200);
 if(a===1||a===4||a===5){q.fillStyle="#fff";for(i=0;i<60;i++){q.globalAlpha=.35+Math.random()*.65;q.fillRect(Math.random()*W,Math.random()*140,1.3,1.3)}q.globalAlpha=1}
 if(a===3){g=q.createRadialGradient(235,50,4,235,50,90);g.addColorStop(0,"#fffbd0");g.addColorStop(.25,"#fff0a0cc");g.addColorStop(1,"#ffe06000");q.fillStyle=g;q.fillRect(0,0,W,200);q.fillStyle="#fff8c0";q.beginPath();q.arc(235,50,22,0,6.3);q.fill()}
 if(a===1){q.fillStyle="#f4f1d6";q.beginPath();q.arc(235,48,13,0,6.3);q.fill();q.fillStyle="#d8d4b0";q.beginPath();q.arc(231,45,3,0,6.3);q.fill();q.beginPath();q.arc(240,52,2.2,0,6.3);q.fill()}
 if(a===4){g=q.createRadialGradient(225,62,10,225,62,80);g.addColorStop(0,"#fff2b844");g.addColorStop(1,"#fff2b800");q.fillStyle=g;q.fillRect(140,0,160,160);var m=cvs(80,80);m[1].fillStyle="#fff2b8";m[1].beginPath();m[1].arc(40,40,30,0,6.3);m[1].fill();m[1].globalCompositeOperation="destination-out";m[1].beginPath();m[1].arc(53,34,26,0,6.3);m[1].fill();q.drawImage(m[0],185,22,80,80)}
 if(a===5){g=q.createRadialGradient(150,88,30,150,88,125);g.addColorStop(0,"#ff4a2acc");g.addColorStop(1,"#ff4a2a00");q.fillStyle=g;q.fillRect(0,0,W,200);g=q.createRadialGradient(145,82,6,150,88,46);g.addColorStop(0,"#ffe6c0");g.addColorStop(1,"#ff9a62");q.fillStyle=g;q.beginPath();q.arc(150,88,46,0,6.3);q.fill();q.fillStyle="rgba(120,40,20,.28)";q.beginPath();q.arc(132,74,9,0,6.3);q.fill();q.beginPath();q.arc(165,100,12,0,6.3);q.fill();q.beginPath();q.arc(158,68,5,0,6.3);q.fill()}
 for(y=190,i=0;y<H;y+=22,i++){q.fillStyle=GRS[a][i%2];q.fillRect(0,y,W,22)}
 if(a===5){q.strokeStyle="#050205";q.lineCap="round";for(i=-1;i<9;i++){var tx=i*38+((i*37)%13),th=60+((i*53)%25);q.lineWidth=4;q.beginPath();q.moveTo(tx,198);q.lineTo(tx+3,198-th);q.stroke();q.lineWidth=2;q.beginPath();q.moveTo(tx+2,198-th*.45);q.lineTo(tx-16,198-th*.7);q.moveTo(tx+2,198-th*.62);q.lineTo(tx+17,198-th*.9);q.moveTo(tx+3,198-th);q.lineTo(tx-8,198-th-14);q.moveTo(tx+3,198-th);q.lineTo(tx+10,198-th-12);q.stroke()}}
 else for(i=-1;i<12;i++)pine(q,i*28+((i*37)%11),196,36+((i*53)%17),TRC[a]);
 q.fillStyle="rgba(0,0,0,.14)";q.fillRect(41,209,218,76);q.strokeStyle="rgba(255,255,255,.4)";q.lineWidth=.8;q.beginPath();
 for(i=41;i<=259;i+=9){q.moveTo(i,209);q.lineTo(i,285)}for(i=209;i<=285;i+=9){q.moveTo(41,i);q.lineTo(259,i)}q.stroke();
 q.strokeStyle="#fff";q.lineWidth=7;q.lineCap="round";q.lineJoin="round";q.beginPath();q.moveTo(37.5,287);q.lineTo(37.5,205);q.lineTo(262.5,205);q.lineTo(262.5,287);q.stroke();
 if(a===3){q.fillStyle="rgba(255,214,120,.1)";q.fillRect(0,0,W,H)}
 if(a===2){q.fillStyle="rgba(24,38,56,.3)";q.fillRect(0,0,W,H)}
 if(a===5){g=q.createRadialGradient(150,200,90,150,200,260);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.65)");q.fillStyle=g;q.fillRect(0,0,W,H)}
 return b[0]}
function cloudSpr(){var a=cvs(70,28),q=a[1];q.fillStyle="rgba(255,255,255,.92)";q.beginPath();q.ellipse(35,18,30,8,0,0,6.3);q.ellipse(24,13,14,10,0,0,6.3);q.ellipse(42,11,16,11,0,0,6.3);q.fill();return a[0]}
function fogSpr(){var a=cvs(W,60),q=a[1],i,g,xs=[30,110,190,270];for(i=0;i<8;i++){var cx=xs[i%4]+(i>3?-W:0)+(i%2?20:0);g=q.createRadialGradient(cx,30,2,cx,30,70);g.addColorStop(0,"rgba(200,190,210,.3)");g.addColorStop(1,"rgba(200,190,210,0)");q.fillStyle=g;q.fillRect(cx-70,0,140,60)}return a[0]}
var cv=$("c"),x=cv.getContext("2d",{alpha:false,desynchronized:true});x.scale(K,K);
var bg,PS=[],CL,FG,rain=[],clouds=[],bats=[],tw=[],trail=[],fl=null,st=0,amb=0,score=0,best=ld(KEY),lives=3,lvl=1,pox=150,face=0,ptx=150,pspd=0,pouGo=0,rt=0,msg="",mcol="#fff",mt=0,fx=0,last=0,tm=0,drag=null,gdx=0,gdy=0,spr,tcol,hc=["","","",""],BL_=0,fog=0;
var aimA=0,pw=.55,BP=[0,0,0];
function put(i,t){if(hc[i]!==t){hc[i]=t;$("h"+i).textContent=t}}
function hud(){put(0,String(score));put(1,String(best));put(2,String(lvl));put(3,"♥♥♥".slice(0,lives)||"–")}
function prev(){var p=$("pv").getContext("2d");p.clearRect(0,0,96,96);p.drawImage(ballSpr(S[1],S[2]),0,0,96,96)}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"");if(k===1||k===2)prev()})}
for(var k0=0;k0<4;k0++)chips(k0);prev();
function start(){amb=S[0];sv(CK,S.join(","));bg=bake(amb);var red=amb===5;PS=[pouSpr(0,red),pouSpr(1,red),pouSpr(2,red)];spr=ballSpr(S[1],S[2]);CL=cloudSpr();FG=amb===5?fogSpr():null;
 var i;rain=[];if(amb===2)for(i=0;i<55;i++)rain.push({x:Math.random()*W,y:Math.random()*H,v:380+Math.random()*160});
 clouds=[];if(amb===0||amb===3)for(i=0;i<3;i++)clouds.push({x:Math.random()*W,y:18+i*26,v:5+i*3});
 bats=[];if(amb===5)for(i=0;i<5;i++)bats.push({x:Math.random()*W,y:30+Math.random()*90,v:(Math.random()<.5?-1:1)*(25+Math.random()*25),p:Math.random()*6});
 tw=[];if(amb===1||amb===4||amb===5)for(i=0;i<16;i++)tw.push([Math.random()*W,Math.random()*150,Math.random()*6]);
 aimA=0;pw=.55;$("pf").style.transform="scaleX(.55)";score=0;lives=3;lvl=1;pox=150;face=0;fl=null;trail=[];msg="";mt=0;st=1;fog=0;hc=["","","",""];$("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";hud()}
function toCfg(){st=0;$("gm").style.display="none";$("cfg").style.display="block"}
function over(){st=4;if(score>best){best=score;sv(KEY,best)}hud();$("ot").textContent=score+" puntos · récord "+best;$("ov").style.display="flex"}
function tgt(){var h=pw*1.1;return[150+Math.tan(aimA)*190,276-h*70,h]}
function launch(gx,gy,h){var D=DF[S[3]][2];
 fl={t:0,T:.62-.22*Math.min(1.2,h),gx:gx,gy:gy,h:h,dive:Math.random()<D.d,res:"",stick:false};
 ptx=Math.max(60,Math.min(240,gx+(Math.random()*2-1)*Math.max(6,D.n*(1-.04*(lvl-1)))));pspd=D.sp*(1+.05*(lvl-1));pouGo=D.rt;trail=[];st=2;drag=null}
function shoot(dx,dy,ms){var a=Math.max(-.75,Math.min(.75,Math.atan2(dx,-dy))),v=Math.sqrt(dx*dx+dy*dy)/Math.max(25,ms),h=Math.max(0,(v-.25)/.9);launch(150+Math.tan(a)*190,276-Math.min(1.3,h)*70,h)}
function kick(){if(st===1){var t=tgt();launch(t[0],t[1],t[2])}}
function resolve(){var gx=fl.gx,gy=fl.gy,dir=gx>pox?1:-1,px2=pox+(fl.dive?dir*Math.min(22,Math.abs(gx-pox)):0),r;
 if(gx<30||gx>270)r="fuera";else if(gy<202)r="encima";else if(Math.min(Math.abs(gx-37.5),Math.abs(gx-262.5))<8)r="poste";else if(gy<209)r="larguero";
 else if(Math.abs(px2-gx)<24&&(gy>=236||(fl.dive&&gy>=214)))r="atajada";else r="gol";
 fl.res=r;st=3;rt=1.1;mt=1.1;
 if(r==="gol"){var p=(Math.abs(gx-150)>85&&gy<238)?2:1;score+=p;lvl=1+Math.floor(score/5);msg=p===2?"⭐ ¡GOLAZO! +2":"¡GOOOL!";mcol="#c9ff6a";face=2;if(score>best){best=score;sv(KEY,best)}}
 else{lives--;face=r==="atajada"?1:0;fl.stick=r==="atajada";mcol=r==="atajada"?"#ffffff":"#ff9a8a";msg=r==="atajada"?"¡ATAJADA!":r==="poste"?"¡POSTE!":r==="larguero"?"¡LARGUERO!":r==="encima"?"¡POR ENCIMA!":"¡AFUERA!"}
 hud()}
function upd(dt){var i,o;tm+=dt;
 for(i=0;i<rain.length;i++){o=rain[i];o.y+=o.v*dt;o.x-=o.v*.18*dt;if(o.y>H){o.y=-10;o.x=Math.random()*(W+40)}}
 for(i=0;i<clouds.length;i++){o=clouds[i];o.x+=o.v*dt;if(o.x>W+10)o.x=-80}
 for(i=0;i<bats.length;i++){o=bats[i];o.x+=o.v*dt;o.p+=dt*14;if(o.x>W+20)o.x=-20;else if(o.x<-20)o.x=W+20}
 if(FG)fog=(fog+dt*6)%W;
 if(st===1)pox=150+Math.sin(tm*1.4)*16;
 else if(st===2){if(pouGo>0)pouGo-=dt;else{var dd=ptx-pox;pox+=(dd<0?-1:1)*Math.min(Math.abs(dd),pspd*dt)}
  fl.t+=dt/fl.T;if(trail.length>7||fl.t>1.05)trail.shift();else trail.push([fl.t,0]);
  if(fl.t>=1)resolve()}
 else if(st===3){rt-=dt;if(fl&&fl.res!=="gol"&&fl.res!=="atajada")fl.t+=dt/fl.T;if(mt>0)mt-=dt;if(rt<=0){if(lives<=0)over();else{st=1;fl=null;face=0;trail=[]}}}}
function ballPos(){var t=Math.min(fl.t,1.4),p=Math.min(t,1);if(fl.res==="gol")t=1;
 if(fl.stick){BP[0]=pox+(fl.dive?Math.sign(fl.gx-pox)*Math.min(22,Math.abs(fl.gx-pox)):0);BP[1]=262;BP[2]=8;return BP}
 BP[0]=150+(fl.gx-150)*t;BP[1]=350+(fl.gy-350)*t-Math.sin(Math.PI*p)*(8+34*fl.h);BP[2]=Math.max(3,14-7.5*t);return BP}
function draw(){var i,o;x.drawImage(bg,0,0,W,H);
 for(i=0;i<clouds.length;i++)x.drawImage(CL,clouds[i].x,clouds[i].y,70,28);
 for(i=0;i<tw.length;i++){o=tw[i];x.globalAlpha=.4+.6*Math.abs(Math.sin(tm*1.6+o[2]));x.fillStyle="#fff";x.fillRect(o[0],o[1],1.8,1.8)}x.globalAlpha=1;
 var u=0,dir=0,lg=0,rot=0,jp=0;
 if(fl&&fl.dive){u=st===2?Math.max(0,Math.min(1,(fl.t-.7)/.3)):1;dir=fl.gx>pox?1:-1;lg=dir*Math.min(22,Math.abs(fl.gx-pox))*u;rot=dir*.6*u;if(fl.gy<236)jp=22*u}
 x.save();x.translate(pox+lg,285-jp);x.rotate(rot);x.drawImage(PS[face],-30,-52,60,56);x.restore();
 if(fl){var bp=ballPos(),fadeA=fl.res&&fl.res!=="gol"&&fl.res!=="atajada"?Math.max(0,1-(fl.t-1)*2.5):1;
  if(S[2]>0&&!fl.stick)for(i=0;i<trail.length;i++){x.globalAlpha=.1+i*.06;x.fillStyle=S[2]===1?"#22f5ff":S[2]===2?(i%2?"#ff7a1a":"#ffd23f"):"hsl("+((i*50+tm*200)%360|0)+",90%,60%)";x.beginPath();x.arc(bp[0]-(fl.gx-150)*.04*(7-i),bp[1]+(7-i)*(350-fl.gy)*.012,bp[2]*(.35+i*.08),0,6.3);x.fill()}
  x.globalAlpha=fadeA;var s2=bp[2]*2*(40/28);x.drawImage(spr,bp[0]-s2/2,bp[1]-s2/2,s2,s2);x.globalAlpha=1}
 else{var rb=14*(40/28)*2;x.drawImage(spr,150-rb/2,350-rb/2,rb,rb);
  if(drag&&gdy<-8){var n=Math.min(8,Math.floor(Math.sqrt(gdx*gdx+gdy*gdy)/14)),dl=Math.sqrt(gdx*gdx+gdy*gdy);x.fillStyle="#fff";for(i=1;i<=n;i++){x.globalAlpha=1-i/(n+2);x.beginPath();x.arc(150+gdx/dl*i*14,350+gdy/dl*i*14,2.2,0,6.3);x.fill()}x.globalAlpha=1}
  if(st===1&&!(drag&&gdy<-8)){var tg=tgt(),okk=tg[0]>41&&tg[0]<259&&tg[1]>=209,n2=Math.floor(Math.sqrt((tg[0]-150)*(tg[0]-150)+(tg[1]-350)*(tg[1]-350))/18),tc=okk?"#c9ff6a":"#ff8a7a";
   x.fillStyle=tc;for(i=1;i<n2;i++){x.globalAlpha=.6-i/n2*.35;x.beginPath();x.arc(150+(tg[0]-150)*i/n2,350+(tg[1]-350)*i/n2,1.8,0,6.3);x.fill()}
   x.globalAlpha=.9;x.strokeStyle=tc;x.lineWidth=2;x.beginPath();x.arc(tg[0],tg[1],8,0,6.3);x.moveTo(tg[0]-12,tg[1]);x.lineTo(tg[0]-4,tg[1]);x.moveTo(tg[0]+4,tg[1]);x.lineTo(tg[0]+12,tg[1]);x.moveTo(tg[0],tg[1]-12);x.lineTo(tg[0],tg[1]-4);x.moveTo(tg[0],tg[1]+4);x.lineTo(tg[0],tg[1]+12);x.stroke();x.globalAlpha=1}}
 if(FG){x.globalAlpha=.9;x.drawImage(FG,fog,172,W,60);x.drawImage(FG,fog-W,172,W,60);x.globalAlpha=1;
  x.strokeStyle="#000";x.lineWidth=2;x.beginPath();for(i=0;i<bats.length;i++){o=bats[i];var f=Math.sin(o.p)*5;x.moveTo(o.x-9,o.y-f);x.quadraticCurveTo(o.x-4,o.y-3,o.x,o.y);x.quadraticCurveTo(o.x+4,o.y-3,o.x+9,o.y-f)}x.stroke()}
 if(rain.length){x.strokeStyle="rgba(210,230,255,.65)";x.lineWidth=1.2;x.beginPath();for(i=0;i<rain.length;i++){o=rain[i];x.moveTo(o.x,o.y);x.lineTo(o.x-2,o.y+9)}x.stroke()}
 if(mt>0){var sc=1+Math.min(.3,mt*.4);x.save();x.translate(150,120);x.scale(sc,
