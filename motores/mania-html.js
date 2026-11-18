import { svgMascota } from "./mascotas-arte.js";
import { ESPECIES } from "./mascotas-datos.js";
import { etapaDe, nivelDe } from "./mascotas-logica.js";

const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wrap = (g) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;

const PAGE = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>🐾 Pet Mania</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:8px;background:#0f1424;color:#eef1ff;font-family:system-ui,sans-serif}
.app{max-width:440px;margin:0 auto}
.hd{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 8px}
.ti{font-weight:900;font-size:17px;letter-spacing:2px}
.arco{background:linear-gradient(90deg,#ff3df2,#22f5ff,#ffe14d,#7dff7a,#ff3df2);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:m 3s linear infinite}
@keyframes m{to{background-position:300% 0}}
.res{font-size:12px;font-weight:800;background:#1c2340;border-radius:14px;padding:4px 10px;white-space:nowrap}
.tabs{display:flex;gap:6px;margin-bottom:8px}
.tabs button{flex:1;border:0;border-radius:12px;padding:9px 2px;font:800 12px system-ui;color:#aab3d6;background:#1c2340}
.tabs button.on{color:#fff;background:linear-gradient(180deg,#7c5cff,#5436d6);box-shadow:0 3px 0 #2f1f8f}
.hid{display:none!important}
.escena{position:relative;aspect-ratio:4/5;border-radius:16px;overflow:hidden;border:2px solid #2a3560}
.bg{position:absolute;inset:0;width:100%;height:100%}
.nube{animation:nb 40s linear infinite}
.nube2{animation:nb 62s linear infinite}
@keyframes nb{from{transform:translateX(-80px)}to{transform:translateX(380px)}}
.pt{position:absolute;width:30%;transition:left 4s ease-in-out,bottom 4s ease-in-out;cursor:pointer}
.pt .ar{animation:hop 2.4s ease-in-out infinite}
.pt:nth-child(2n) .ar{animation-delay:.8s}.pt:nth-child(3n) .ar{animation-delay:1.4s}
@keyframes hop{50%{transform:translateY(-6%)}}
.ar svg,.un svg{width:100%;display:block;overflow:visible}
.nm{text-align:center;font:800 9px system-ui;color:#fff;text-shadow:0 1px 2px #000;margin-top:-4px;white-space:nowrap}
.bb{display:none;position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#fff7d6;color:#9a5b00;border:2px solid #ffc933;border-radius:14px;padding:1px 7px;font:900 11px system-ui;white-space:nowrap;animation:bob 1.1s ease-in-out infinite;z-index:3}
.bb.on{display:block}
@keyframes bob{50%{margin-top:-5px}}
.fl{position:absolute;pointer-events:none;font:900 15px system-ui;color:#fff;text-shadow:0 2px 3px #000,0 0 6px #000;animation:up 1s ease-out forwards;z-index:9;white-space:nowrap}
@keyframes up{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-38px)}}
.hint{text-align:center;font-size:11px;color:#8a94be;margin:8px 0 2px}
.card{background:#1a2142;border:2px solid #2a3560;border-radius:16px;padding:14px;text-align:center}
.card h3{margin:0 0 6px;font-size:16px}
.card p{margin:4px 0;font-size:12px;color:#aab3d6}
.big{border:0;border-radius:14px;padding:12px 22px;margin-top:10px;font:900 14px system-ui;color:#fff;background:linear-gradient(180deg,#ff7a3d,#e0401a);box-shadow:0 4px 0 #8f2a10;letter-spacing:1px}
.big:active,.ac:active,.up:active{transform:translateY(2px);box-shadow:none}
.wv{display:flex;justify-content:space-between;font:800 12px system-ui;margin-bottom:6px}
.arena{position:relative;aspect-ratio:16/11;border-radius:16px;overflow:hidden;border:2px solid #3a2455}
.side{position:absolute;bottom:4%;width:38%}
.side.L{left:3%}.side.R{right:3%}
.tag{background:#000a;border-radius:10px;padding:3px 6px;margin-bottom:2px;font:800 9px system-ui}
.hp{height:7px;background:#2b1d3c;border-radius:5px;overflow:hidden;margin-top:2px}
.hp i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#5fe36a,#c9f04d);transition:width .3s}
.hp i.mid{background:linear-gradient(90deg,#ffd23d,#ffb02e)}.hp i.low{background:linear-gradient(90deg,#ff5b5b,#e02a4a)}
.atkL{animation:lL .3s}.atkR{animation:lR .3s}
@keyframes lL{50%{transform:translateX(55%)}}@keyframes lR{50%{transform:translateX(-55%)}}
.hurt{animation:hu .35s}
@keyframes hu{25%{transform:translateX(-5px);filter:brightness(2.2) saturate(2)}60%{transform:translateX(5px)}}
.ember{position:absolute;bottom:0;width:4px;height:4px;border-radius:50%;background:#ffb347;opacity:.8;animation:em 4s linear infinite}
@keyframes em{from{transform:translateY(0);opacity:.9}to{transform:translateY(-120px);opacity:0}}
.log{min-height:30px;text-align:center;font:700 12px system-ui;color:#ffe9a8;padding:7px 4px}
.acts{display:flex;gap:6px}
.ac{flex:1;border:0;border-radius:12px;padding:11px 2px;font:900 12px system-ui;color:#fff;background:linear-gradient(180deg,#5b8cff,#3a5fd6);box-shadow:0 3px 0 #213a96}
.ac.h{background:linear-gradient(180deg,#c35bff,#8a2fd6);box-shadow:0 3px 0 #561c8f}
.ac.d{background:linear-gradient(180deg,#3fc9a0,#1f9a78);box-shadow:0 3px 0 #11634d}
.ac:disabled{filter:grayscale(1) brightness(.6)}
.en2{display:flex;justify-content:center;gap:6px;margin:8px 0}
.en2 b{width:22px;height:8px;border-radius:5px;background:#2a3560}.en2 b.on{background:linear-gradient(90deg,#c35bff,#ff3df2);box-shadow:0 0 8px #ff3df2}
.team{display:flex;gap:6px;justify-content:center}
.th{width:48px;border-radius:12px;background:#1c2340;border:2px solid #2a3560;padding:3px 2px;text-align:center;font-size:18px}
.th.cur{border-color:#ffd23d}.th.ko{opacity:.35}
.th .hp{margin:2px 3px 0}
.row{display:flex;align-items:center;justify-content:space-between;gap:6px;background:#1a2142;border:2px solid #2a3560;border-radius:14px;padding:8px 10px;margin-bottom:6px}
.row b{font-size:13px}.row small{display:block;color:#9aa4cc;font-size:10px;margin-top:2px}
.up{border:0;border-radius:11px;padding:9px 11px;font:900 11px system-ui;color:#3a2600;background:linear-gradient(180deg,#ffd84d,#f5a623);box-shadow:0 3px 0 #a56a0a;white-space:nowrap}
.up:disabled{filter:grayscale(1) brightness(.6)}
.pie{text-align:center;font-size:10px;color:#6b749b;padding:12px 0 2px}
</style></head><body><div class="app">
<div class="hd"><span class="ti"><span class="arco">PET MANIA</span></span><span class="res"><span id="oro">0</span>💰 <span id="gem">0</span>💎</span></div>
<div class="tabs"><button class="on" data-t="isla">🏝️ Isla</button><button data-t="lucha">⚔️ Batalla</button><button data-t="mejora">⬆️ Entrenar</button></div>

<section id="isla"><div class="escena">
<svg class="bg" viewBox="0 0 320 400" preserveAspectRatio="none"><defs>
<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa9f5"/><stop offset=".6" stop-color="#bfe8ff"/></linearGradient>
<linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd36a"/><stop offset="1" stop-color="#3a9a47"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc8e8"/><stop offset="1" stop-color="#2c7fc0"/></linearGradient>
<radialGradient id="sol"><stop offset="0" stop-color="#fff6b0"/><stop offset="1" stop-color="#ffd23d" stop-opacity="0"/></radialGradient></defs>
<rect width="320" height="400" fill="url(#sk)"/>
<circle cx="250" cy="70" r="60" fill="url(#sol)"/><circle cx="250" cy="70" r="22" fill="#fff3a0"/>
<g class="nube" fill="#fff" opacity=".9"><ellipse cx="60" cy="60" rx="30" ry="10"/><ellipse cx="82" cy="52" rx="20" ry="9"/></g>
<g class="nube2" fill="#fff" opacity=".8"><ellipse cx="140" cy="105" rx="26" ry="8"/><ellipse cx="158" cy="98" rx="16" ry="7"/></g>
<path d="M0 205L45 150 85 195 140 135 200 200 255 160 320 205V250H0Z" fill="#7f9cc4"/>
<path d="M0 235L60 205 140 235 220 200 320 232V270H0Z" fill="#5faa5b"/>
<rect y="215" width="320" height="26" fill="url(#sea)" opacity=".9"/>
<path d="M0 262Q80 238 170 258T320 250V400H0Z" fill="url(#g1)"/>
<path d="M0 330Q110 305 220 330T320 322V400H0Z" fill="#3f9f4a"/>
<g fill="#ff8fb3"><circle cx="40" cy="350" r="3"/><circle cx="270" cy="372" r="3"/><circle cx="150" cy="385" r="3"/></g>
<g fill="#fff6a0"><circle cx="90" cy="340" r="2.5"/><circle cx="210" cy="360" r="2.5"/></g>
<g><rect x="262" y="262" width="6" height="40" fill="#8a5a2b"/><path d="M265 262q-30-6-40 10q20-8 40 0Zq30-8 44 8q-24-6-44-8Zq-6-26 6-34q8 18-6 34Z" fill="#2e9a4a"/></g>
</svg>
<div id="pets"></div></div>
<div class="hint">Toca a tus mascotas para recoger 💰 · entrena y lucha para ser el mejor</div></section>

<section id="lucha" class="hid">
<div id="intro" class="card"><h3>⚔️ Arena de Mascotas</h3>
<p>Pelea por oleadas con tu equipo. Cada especie tiene un elemento: <b>🔥 fuego › ❄️ hielo › 🌪️ viento › 🌍 tierra › 💧 agua › 🔥</b> y <b>⚡ rayo</b> vence a agua y viento (pero la tierra lo vence).</p>
<p>Cada 5 oleadas aparece un jefe con 💎.</p><p id="best"></p>
<button class="big" id="go">⚔️ ¡A LA BATALLA!</button></div>
<div id="bt" class="hid"><div class="wv"><span id="wv"></span><span id="wg"></span></div>
<div class="arena" id="ar">
<svg class="bg" viewBox="0 0 320 220" preserveAspectRatio="none"><defs>
<linearGradient id="ds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1157"/><stop offset=".7" stop-color="#d4506b"/><stop offset="1" stop-color="#ffb347"/></linearGradient>
<linearGradient id="lv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23d"/><stop offset="1" stop-color="#ff4a1c"/></linearGradient></defs>
<rect width="320" height="220" fill="url(#ds)"/><circle cx="70" cy="48" r="20" fill="#ffe9c2" opacity=".9"/>
<g fill="#fff" opacity=".8"><circle cx="200" cy="30" r="1.2"/><circle cx="260" cy="55" r="1.4"/><circle cx="130" cy="22" r="1"/><circle cx="300" cy="20" r="1.2"/></g>
<path d="M120 150L165 70 205 150Z" fill="#2c1630"/><path d="M158 82L165 70 172 82Q165 92 158 82Z" fill="url(#lv)"/><path d="M165 92Q163 120 158 150" stroke="url(#lv)" stroke-width="3" fill="none"/>
<path d="M0 150L50 120 100 150 220 140 280 112 320 145V220H0Z" fill="#3b1d3e"/>
<path d="M0 168Q90 158 170 170T320 164V220H0Z" fill="#2a1630"/>
<path d="M20 190q40-6 70 2t90-4 120 4" stroke="url(#lv)" stroke-width="2" fill="none" opacity=".9"/></svg>
<span class="ember" style="left:12%;animation-delay:0s"></span><span class="ember" style="left:38%;animation-delay:1.3s"></span><span class="ember" style="left:63%;animation-delay:2.4s"></span><span class="ember" style="left:86%;animation-delay:.7s"></span>
<div class="side L"><div class="tag"><span id="pn"></span><div class="hp"><i id="ph"></i></div></div><div class="un" id="pl"></div></div>
<div class="side R"><div class="tag"><span id="en"></span><div class="hp"><i id="eh"></i></div></div><div class="un" id="ee"></div></div></div>
<div class="log" id="lg"></div>
<div class="acts"><button class="ac" id="bA">⚔️ Atacar</button><button class="ac h" id="bH">✨ Habilidad</button><button class="ac d" id="bD">🛡️ Defender</button></div>
<div class="en2" id="eg"><b></b><b></b><b></b></div>
<div class="team" id="tm"></div></div>
<div id="fin" class="card hid"></div></section>

<section id="mejora" class="hid"><div id="lst"></div><div class="hint">Sube el nivel de tus mascotas con 💰 para que peleen y generen más.</div></section>
<div class="pie">Powered by __FIRMA__</div></div>
<script>
(function(){
var D=__DATA__;
var $=function(i){return document.getElementById(i)};
var KEY="pet_mania_v1",mem=null;
var EL={tierra:"🌍",viento:"🌪️",fuego:"🔥",hielo:"❄️",agua:"💧",rayo:"⚡"};
var ADV={fuego:["hielo"],hielo:["viento"],viento:["tierra"],tierra:["agua","rayo"],agua:["fuego"],rayo:["agua","viento"]};
var B={perro:[100,14,8,"tierra"],gato:[80,17,6,"viento"],zorro:[85,16,7,"fuego"],pinguino:[110,12,10,"hielo"],ajolote:[95,13,9,"agua"],dragon:[90,18,8,"rayo"]};
var RM={comun:1,poco_comun:1.08,raro:1.18,epico:1.32,legendario:1.5},EM={cria:.7,joven:.85,adulto:1};
function ld(){try{var s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return mem}
var S=ld()||{};S.oro=S.oro||0;S.gem=S.gem||0;S.best=S.best||0;S.bono=S.bono||{};S.t0=S.t0||{};
function sv(){mem=S;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function hud(){$("oro").textContent=Math.floor(S.oro);$("gem").textContent=S.gem}
function lvl(p){return p.lv+(S.bono[p.id]||0)}
function st(p){var b=B[p.e],m=(1+.12*(lvl(p)-1))*(RM[p.r]||1)*(EM[p.et]||1);return{hp:Math.round(b[0]*m),atk:Math.round(b[1]*m),def:Math.round(b[2]*m),el:b[3]}}
function emult(a,d){if(ADV[a]&&ADV[a].indexOf(d)>-1)return 1.5;if(ADV[d]&&ADV[d].indexOf(a)>-1)return .7;return 1}
function dmg(atk,def,a,d,k){return Math.max(1,Math.round((atk*k-def*.4)*emult(a,d)*(.9+Math.random()*.2)))}
function rate(p){return(3+lvl(p)*1.6)*(RM[p.r]||1)}
function acc(p){var t=S.t0[p.id];if(!t){t=S.t0[p.id]=Date.now()}return Math.floor(Math.min(480,(Date.now()-t)/60000)*rate(p))}
function fl(par,txt,x,y,col){var s=document.createElement("span");s.className="fl";s.textContent=txt;s.style.left=x;s.style.top=y;if(col)s.style.color=col;par.appendChild(s);setTimeout(function(){if(s.parentNode)s.parentNode.removeChild(s)},1000)}
function mark(id,cls){var e=$(id);e.classList.remove(cls);void e.offsetWidth;e.classList.add(cls);setTimeout(function(){e.classList.remove(cls)},400)}
if(!D.pets.length){document.querySelector(".app").innerHTML='<div class="card" style="margin-top:20px"><h3>🥚 Aún no tienes mascotas</h3><p>Compra un huevo, ponlo en la incubadora y vuelve cuando nazca.</p><p>Usa .pettienda para ver los precios.</p></div>';return}

/* ISLA */
function buildIsla(){var h="";D.pets.forEach(function(p,i){h+='<div class="pt" id="pt'+i+'" style="left:'+(6+i*16)+'%;bottom:'+(4+(i%3)*10)+'%"><div class="bb" id="bb'+i+'"></div><div class="ar">'+p.a+'</div><div class="nm">'+p.n+' · Nv '+lvl(p)+'</div></div>'});$("pets").innerHTML=h;
D.pets.forEach(function(p,i){$("pt"+i).onclick=function(){var a=acc(p),el=$("pt"+i);if(a<1){fl($("pets"),"💛",(el.offsetLeft+el.offsetWidth/3)+"px",(el.offsetTop)+"px");return}S.oro+=a;S.t0[p.id]=Date.now();sv();hud();fl($("pets"),"+"+a+" 💰",el.offsetLeft+"px",el.offsetTop+"px","#ffe14d");bub()}})}
function bub(){D.pets.forEach(function(p,i){var a=acc(p),b=$("bb"+i);if(!b)return;b.textContent="💰"+a;b.classList.toggle("on",a>=15)})}
function wander(){D.pets.forEach(function(p,i){var e=$("pt"+i);if(!e)return;e.style.left=(3+Math.random()*64)+"%";e.style.bottom=(3+Math.random()*30)+"%"})}

/* BATALLA */
var W=null;
function log(t){$("lg").textContent=t}
function hpc(el,v,m){var r=Math.max(0,v/m);el.style.width=(r*100)+"%";el.className=r<.25?"low":r<.55?"mid":""}
function spawn(){var ks=Object.keys(B),e=ks[Math.floor(Math.random()*ks.length)],b=B[e],n=W.wave,m=1+.14*(n-1),boss=n%5===0;
W.en={e:e,el:b[3],boss:boss,max:Math.round(b[0]*m*(boss?1.8:1)*1.1),atk:Math.round(b[1]*m*(boss?1.25:1)),def:Math.round(b[2]*m)};W.en.hp=W.en.max;
$("ee").innerHTML=D.en[e];log(boss?"👑 ¡Jefe! Un "+D.sp[e].n+" gigante te bloquea el paso":"¡Aparece un "+D.sp[e].n+" salvaje!")}
function build(){var p=D.pets[W.cur];$("pl").innerHTML=p.b;upd()}
function upd(){var p=D.pets[W.cur],s=st(p),e=W.en;
$("pn").textContent=EL[s.el]+" "+p.n+" Nv"+lvl(p)+" · "+Math.round(W.hp[p.id])+"/"+s.hp;hpc($("ph"),W.hp[p.id],s.hp);
$("en").textContent=EL[e.el]+" "+D.sp[e.e].n+(e.boss?" 👑":"")+" · "+Math.round(e.hp)+"/"+e.max;hpc($("eh"),e.hp,e.max);
$("wv").textContent="🌊 Oleada "+W.wave;$("wg").textContent="Botín: +"+W.gold+" 💰";
var bs=$("eg").children;for(var i=0;i<3;i++)bs[i].className=i<W.energy?"on":"";
$("bA").disabled=$("bH").disabled=$("bD").disabled=W.busy;if(W.energy<3)$("bH").disabled=true;
var h="";D.pets.forEach(function(q,i){var m=st(q).hp,v=W.hp[q.id];h+='<div class="th'+(i===W.cur?" cur":"")+(v<=0?" ko":"")+'" data-i="'+i+'">'+D.sp[q.e].em+'<div class="hp"><i class="'+(v/m<.25?"low":v/m<.55?"mid":"")+'" style="width:'+Math.max(0,v/m*100)+'%"></i></div></div>'});$("tm").innerHTML=h;
Array.prototype.forEach.call($("tm").children,function(t){t.onclick=function(){swap(+t.getAttribute("data-i"))}})}
function startRun(){W={wave:1,cur:0,hp:{},energy:0,guard:false,busy:false,gold:0};D.pets.forEach(function(p){W.hp[p.id]=st(p).hp});
$("intro").classList.add("hid");$("fin").classList.add("hid");$("bt").classList.remove("hid");spawn();build()}
function hit(side,d,mu){var ar=$("ar"),x=side==="pl"?"20%":"62%";mark(side==="pl"?"pl":"ee","hurt");fl(ar,"-"+d+(mu>1?" ¡Súper!":mu<1?" débil":""),x,"28%",mu>1?"#ffd23d":mu<1?"#9fb0ff":"#fff")}
function act(k){if(!W||W.busy)return;var p=D.pets[W.cur],s=st(p),e=W.en;if(k==="hab"&&W.energy<3)return;W.busy=true;
if(k==="def"){W.guard=true;W.energy=Math.min(3,W.energy+1);log("🛡️ "+p.n+" se cubre del golpe");upd();setTimeout(enemyTurn,700);return}
var mult=k==="hab"?2.2:1;if(k==="hab")W.energy=0;else W.energy=Math.min(3,W.energy+1);
var d=dmg(s.atk,e.def,s.el,e.el,mult),mu=emult(s.el,e.el);mark("pl","atkL");log((k==="hab"?"✨ ":"⚔️ ")+p.n+(k==="hab"?" usa su poder "+EL[s.el]:" ataca"));upd();
setTimeout(function(){e.hp=Math.max(0,e.hp-d);hit("en",d,mu);upd();if(e.hp<=0){setTimeout(win,500);return}setTimeout(enemyTurn,750)},280)}
function enemyTurn(){if(!W)return;var p=D.pets[W.cur],s=st(p),e=W.en,k=W.guard?.35:1;W.guard=false;
var d=Math.max(1,Math.round(dmg(e.atk,s.def,e.el,s.el,1)*k)),mu=emult(e.el,s.el);mark("ee","atkR");log("💢 "+D.sp[e.e].n+" contraataca");
setTimeout(function(){W.hp[p.id]=Math.max(0,W.hp[p.id]-d);hit("pl",d,mu);
if(W.hp[p.id]<=0){var nx=-1;for(var i=0;i<D.pets.length;i++)if(W.hp[D.pets[i].id]>0){nx=i;break}
if(nx<0){upd();setTimeout(lose,700);return}W.cur=nx;log("💀 "+p.n+" cayó. Entra "+D.pets[nx].n);build()}else upd();W.busy=false;upd()},280)}
function swap(i){if(!W||W.busy||i===W.cur||W.hp[D.pets[i].id]<=0)return;W.busy=true;W.cur=i;log("🔄 Entra "+D.pets[i].n);build();setTimeout(enemyTurn,700)}
function win(){var e=W.en,g=Math.round((12+W.wave*9)*(e.boss?3:1));S.oro+=g;W.gold+=g;var tx="🏆 ¡Ganaste! +"+g+" 💰";if(e.boss){var gm=1+Math.floor(W.wave/10);S.gem+=gm;tx+=" +"+gm+" 💎"}
if(W.wave>S.best)S.best=W.wave;D.pets.forEach(function(p){if(W.hp[p.id]>0)W.hp[p.id]=Math.min(st(p).hp,W.hp[p.id]+st(p).hp*.25)});
W.wave++;W.en.hp=0;sv();hud();log(tx);upd();setTimeout(function(){if(!W)return;spawn();W.busy=false;upd()},1200)}
function lose(){var w=W.wave,g=W.gold;W=null;sv();$("bt").classList.add("hid");var f=$("fin");f.classList.remove("hid");
f.innerHTML='<h3>💀 Tu equipo cayó</h3><p>Llegaste a la oleada <b>'+w+'</b></p><p>Botín ganado: <b>+'+g+' 💰</b></p><p>Récord: oleada '+S.best+'</p><button class="big" id="re">↻ Otra vez</button>';$("re").onclick=startRun;showBest()}
function showBest(){$("best").textContent=S.best?"🏅 Tu récord: oleada "+S.best:""}
$("go").onclick=startRun;$("bA").onclick=function(){act("atk")};$("bH").onclick=function(){act("hab")};$("bD").onclick=function(){act("def")};

/* ENTRENAR */
function cost(p){return Math.round(60*Math.pow(lvl(p),1.35))}
function buildMejora(){var h="";D.pets.forEach(function(p,i){var s=st(p),c=cost(p);h+='<div class="row"><div><b>'+D.sp[p.e].em+" "+p.n+" · Nv "+lvl(p)+'</b><small>'+EL[s.el]+" ❤️"+s.hp+" ⚔️"+s.atk+" 🛡️"+s.def+" · 💰"+rate(p).toFixed(1)+"/min</small></div><button class=\"up\" data-i=\""+i+"\""+(S.oro<c?" disabled":"")+">⬆️ "+c+" 💰</button></div>"});
$("lst").innerHTML=h;Array.prototype.forEach.call(document.querySelectorAll(".up"),function(b){b.onclick=function(){var p=D.pets[+b.getAttribute("data-i")],c=cost(p);if(S.oro<c)return;S.oro-=c;S.bono[p.id]=(S.bono[p.id]||0)+1;sv();hud();buildMejora();buildIsla();bub()}})}

/* TABS */
Array.prototype.forEach.call(document.querySelectorAll(".tabs button"),function(b){b.onclick=function(){var t=b.getAttribute("data-t");
Array.prototype.forEach.call(document.querySelectorAll(".tabs button"),function(x){x.classList.toggle("on",x===b)});
["isla","lucha","mejora"].forEach(function(s){$(s).classList.toggle("hid",s!==t)});
if(t==="mejora")buildMejora();if(t==="lucha"&&!W)showBest()}});
hud();buildIsla();bub();showBest();setInterval(bub,4000);setInterval(wander,4500);setTimeout(wander,300);
})();
</script></body></html>`;

export function htmlMania({ nombre, est, firma }) {
  const vivas = est.mascotas.filter((m) => !m.perdida).slice(0, 5);
  const pets = vivas.map((m, i) => {
    const etapa = etapaDe(m.crec).id;
    const base = { especie: m.especie, etapa, equipo: m.equipo || {}, x: 100, y: 178, k: 1 };
    return {
      id: m.id,
      n: esc(m.nombre),
      e: m.especie,
      r: m.rareza,
      lv: nivelDe(m),
      et: etapa,
      a: wrap(svgMascota({ ...base, uid: "i" + i })),
      b: wrap(svgMascota({ ...base, uid: "b" + i }))
    };
  });
  const en = {};
  const sp = {};
  for (const [id, e] of Object.entries(ESPECIES)) {
    en[id] = wrap(svgMascota({ especie: id, etapa: "adulto", uid: "e" + id, x: 100, y: 178, k: 1 }));
    sp[id] = { n: e.nombre, em: e.emoji };
  }
  const datos = JSON.stringify({ pets, en, sp }).replace(/</g, "\\u003c");
  return PAGE.replace("__FIRMA__", () => esc(firma)).replace("__DATA__", () => datos);
}
