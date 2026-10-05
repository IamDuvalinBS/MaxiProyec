import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
body{margin:0;padding:10px;background:#05030f;color:#e6e2ff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation}
.m{max-width:420px;margin:0 auto;padding:16px;border:3px solid #9b5cff;border-radius:28px;background:radial-gradient(circle at 50% 0,#1d0f45,#06030f);box-shadow:0 0 24px #9b5cff44}
small{display:block;font-size:10px;letter-spacing:3px;color:#b99bff}
h1{margin:4px 0 6px;font-size:30px;line-height:1.05;color:#22f5ff;text-shadow:0 0 12px #22f5ff88}
.d{text-align:center;font-size:19px;font-weight:bold;margin:10px 0 2px}.sub{text-align:center;font-size:12px;color:#9f96c8;margin-bottom:4px}
h3{margin:14px 0 8px;font-size:12px;letter-spacing:2px;color:#22f5ff}
.o{display:grid;gap:8px}.o.c2{grid-template-columns:repeat(2,minmax(0,1fr))}.o.c4{grid-template-columns:repeat(4,minmax(0,1fr))}
.ch{height:46px;border-radius:12px;border:2px solid #2d2554;background:#0b0720;color:#d8d2ff;font:bold 12px Roboto,Arial,sans-serif;padding:0 2px;overflow:hidden}
.ch.on{border-color:#22f5ff;box-shadow:0 0 10px #22f5ff55;background:#12103a}
.go,.bt{display:block;width:100%;height:52px;margin-top:14px;border-radius:14px;border:2px solid #9b5cff;background:#140c34;color:#c9b3ff;font:bold 15px Roboto,Arial,sans-serif}
.go{border:0;background:linear-gradient(90deg,#22f5ff,#9b5cff,#ff3df2);color:#fff}.go:active,.bt:active,.ch:active{transform:scale(.97)}
.hud{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0}
.hud div{text-align:center;border:2px solid #4a3a8a;border-radius:14px;padding:6px 1px;font-size:9px;letter-spacing:1px;color:#9f96c8;background:#0b0720;min-width:0;overflow:hidden;white-space:nowrap}
.hud b{display:block;font-size:20px;color:#22f5ff}
.w{position:relative}canvas#c{width:100%;display:block;border-radius:16px;touch-action:none;transform:translateZ(0)}
#ov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:18px;background:#05030ff0;border-radius:16px;text-align:center}
#ov b{font-size:26px;color:#ff3df2}#ov span{font-size:14px;color:#c9c0ff;margin-bottom:6px;line-height:1.5}#ov .go,#ov .bt{margin:4px 0 0;height:46px;font-size:13px}
.ct{display:grid;grid-template-columns:1fr 2fr 1fr;gap:8px;margin-top:10px}.ct .bt{margin:0;height:58px;font-size:22px;padding:0}.ct .bt.on{background:#22f5ff;color:#05030f}
.hint{text-align:center;font-size:12px;color:#9f96c8;margin:10px 0 0}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 0;font-size:11px;color:#8a82b8}
.m{position:relative}.sd{position:absolute;top:10px;right:12px;width:36px;height:36px;margin:0;border-radius:11px;border:2px solid #9b5cff;background:#140c34;font-size:16px;line-height:1;padding:0;z-index:6;color:#fff}
</style></head><body><div class="m"><button class="sd" id="sd">🔊</button><small>MAXIPROYEC · ARCADE</small><h1>🐛 GUSANOS<br>NEÓN</h1>
<div id="cfg"><div class="d">Configura tu partida</div><div class="sub">Come puntos, crece y haz que los demás choquen contigo</div>
<h3>🐍 COLOR DE GUSANO</h3><div class="o c4" id="o0"></div>
<h3>🔥 DIFICULTAD</h3><div class="o c2" id="o1"></div>
<h3>🗺️ TAMAÑO DEL MAPA</h3><div class="o c2" id="o2"></div>
<button class="go" id="go">▶ INICIAR PARTIDA</button></div>
<div id="gm" style="display:none"><div class="hud"><div>LONGITUD<b id="h0">100</b></div><div>RÉCORD<b id="h1">0</b></div><div>BAJAS<b id="h2">0</b></div></div>
<div class="w"><canvas id="c" width="450" height="600"></canvas><div id="ov"><b>💥 FIN DEL JUEGO</b><span id="ot"></span><button class="go" id="ag">↻ JUGAR DE NUEVO</button><button class="bt" id="ch">⚙ AJUSTES</button></div></div>
<div class="ct"><button class="bt" id="bl">◀</button><button class="bt" id="bb">⚡ ACELERAR</button><button class="bt" id="br">▶</button></div>
<div class="hint" id="er" style="display:none;color:#ff8a7a"></div>
<div class="hint">Toca o arrastra en el campo hacia donde quieres ir · ◀ ▶ para girar · mantén ⚡ para acelerar (gastas largo)</div>
<button class="bt" id="mb">⚙ AJUSTES</button></div>
<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>
</div>
<script>
(function(){"use strict";
var snd=true,AC=null,SL={};
try{snd=localStorage.getItem("mp_snd")!=="0"}catch(e){}
function au(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){snd=false;return null}}if(AC.state==="suspended")AC.resume();return AC}
function fx(k,g,f,d,t,v,f2){if(!snd||document.hidden)return;var n=Date.now();if(n-(SL[k]||0)<g)return;SL[k]=n;var c=au();if(!c)return;var o=c.createOscillator(),a=c.createGain(),s=c.currentTime;o.type=t||"square";o.frequency.setValueAtTime(f,s);if(f2)o.frequency.exponentialRampToValueAtTime(f2,s+d);a.gain.setValueAtTime(v||.05,s);a.gain.exponentialRampToValueAtTime(.0001,s+d);o.connect(a);a.connect(c.destination);o.start(s);o.stop(s+d+.03)}
(function(){var b=document.getElementById("sd");b.textContent=snd?"🔊":"🔇";b.addEventListener("click",function(){snd=!snd;try{localStorage.setItem("mp_snd",snd?"1":"0")}catch(e){}b.textContent=snd?"🔊":"🔇";if(snd){au();fx("t",0,660,.08,"sine",.06,990)}})})();

var $=function(i){return document.getElementById(i)},W=300,H=400,K=1.5,KEY="mp_gusanos_best",CK="mp_gusanos_cfg",MAXS=200,GAP=6.5;
function ld(k){try{return parseInt(localStorage.getItem(k))||0}catch(e){return 0}}
function sv(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function cvs(w,h){var c=document.createElement("canvas");c.width=w*K|0;c.height=h*K|0;var q=c.getContext("2d");q.scale(K,K);return[c,q]}
function rnd(a,b){return a+Math.random()*(b-a)}
var SKL=[["🟢","Verde"],["🔵","Azul"],["🟣","Morado"],["🔴","Rojo"],["🟡","Amarillo"],["💗","Rosa"],["🌈","Arcoíris"],["⚪","Blanco"]];
var COLS=["#39ff7a","#3da5ff","#b06cff","#ff4d5e","#ffe14d","#ff7ac8","","#f2f2f8"],RBC=["#ff4d5e","#ff9a3d","#ffe14d","#39ff7a","#3da5ff","#b06cff","#ff7ac8"];
var PCL=["#39ff7a","#3da5ff","#b06cff","#ff4d5e","#ffe14d","#ff7ac8","#f2f2f8"];
var DFL=[["🟢","Fácil",7,.05,0],["🔵","Normal",10,.065,.3],["🟣","Difícil",13,.078,.6],["🔴","Extremo",16,.09,.9]];
var MPL=[["🔹","Pequeño",1800],["🔷","Normal",2600],["🔶","Grande",3400]];
var LS=[SKL,DFL,MPL],S0=[0,1,1],NM=["Neo","Zed","Kira","Rex","Luna","Mako","Nova","Drako","Bruno","Pixel","Zorro","Hiro","Vega","Orion","Tito","Maya"];
try{var c0=(localStorage.getItem(CK)||"").split(",").map(Number);if(c0.length===3&&c0.every(function(v,i){return v>=0&&v<LS[i].length}))S0=c0}catch(e){}
function chips(k){var el=$("o"+k),L=LS[k];for(var i=0;i<L.length;i++){var b=document.createElement("button");b.className="ch"+(S0[k]===i?" on":"");b.textContent=L[i][0]+" "+L[i][1];b._i=i;el.appendChild(b)}
 el.addEventListener("click",function(e){var t=e.target;if(t._i===undefined)return;S0[k]=t._i;for(var j=0;j<el.children.length;j++)el.children[j].className="ch"+(j===t._i?" on":"")})}
for(var k0=0;k0<3;k0++)chips(k0);
var SPC={};
function rgba(h,a){var n=parseInt(h.slice(1),16);return"rgba("+(n>>16)+","+((n>>8)&255)+","+(n&255)+","+a+")"}
function segSpr(h,light){var a=cvs(32,32),q=a[1],g;
 g=q.createRadialGradient(16,16,4,16,16,16);g.addColorStop(0,rgba(h,.6));g.addColorStop(1,rgba(h,0));q.fillStyle=g;q.beginPath();q.arc(16,16,16,0,6.3);q.fill();
 q.fillStyle=h;q.beginPath();q.arc(16,16,10,0,6.3);q.fill();
 g=q.createRadialGradient(12,11,1,16,16,10);g.addColorStop(0,light?"rgba(255,255,255,.95)":"rgba(255,255,255,.55)");g.addColorStop(1,"rgba(255,255,255,0)");q.fillStyle=g;q.beginPath();q.arc(16,16,10,0,6.3);q.fill();
 q.strokeStyle="rgba(0,0,0,.35)";q.lineWidth=1.2;q.beginPath();q.arc(16,16,10,0,6.3);q.stroke();return a[0]}
function sp(h,l){var k=h+l;return SPC[k]||(SPC[k]=segSpr(h,l))}
var PSP=[];
function pelSpr(h){var a=cvs(16,16),q=a[1],g=q.createRadialGradient(8,8,0,8,8,8);g.addColorStop(0,"#fff");g.addColorStop(.35,h);g.addColorStop(1,rgba(h,0));q.fillStyle=g;q.beginPath();q.arc(8,8,8,0,6.3);q.fill();return a[0]}
var tile=document.createElement("canvas");tile.width=tile.height=80;
(function(){var q=tile.getContext("2d");q.fillStyle="#080b1e";q.fillRect(0,0,80,80);q.strokeStyle="rgba(70,90,200,.18)";q.lineWidth=1;q.beginPath();q.moveTo(.5,0);q.lineTo(.5,80);q.moveTo(0,.5);q.lineTo(80,.5);q.stroke();q.fillStyle="rgba(120,150,255,.35)";q.fillRect(0,0,2,2)})();
var cv=$("c"),x=cv.getContext("2d"),PAT=x.createPattern(tile,"repeat");
var WW=2600,PTG=0,MAXP=0,px=null,py=null,pc=null,pv=null,pn=0,SN=[],P=null,DF=null,st=0,cx=0,cy=0,zs=1,fr=0,tm=0,kills=0,toast="",toastT=0,pdead=0,last=0,bo=false,turn=0,lb=[],hc=["","",""],best=ld(KEY),why="",born=0;
var E=[$("h0"),$("h1"),$("h2")];
function put(i,t){if(hc[i]!==t){hc[i]=t;E[i].textContent=t}}
function hud(){put(0,String(Math.floor(P.m*10)));put(1,String(best));put(2,String(kills))}
function thick(s){return 7+Math.min(8,s.m/70)}
function segs(m){return Math.min(MAXS,8+Math.floor(m*.9))}
function addP(x0,y0,c,v){if(pn>=MAXP)return;px[pn]=x0;py[pn]=y0;pc[pn]=c;pv[pn]=v;pn++}
function rmP(i){pn--;px[i]=px[pn];py[i]=py[pn];pc[i]=pc[pn];pv[i]=pv[pn]}
function pcOf(s){return s.col===6?Math.random()*7|0:s.col===7?6:s.col}
function mkS(x0,y0,a,m,col,name,bot,id){var s={xs:new Float32Array(MAXS),ys:new Float32Array(MAXS),n:0,x:x0,y:y0,a:a,ta:a,m:m,col:col,name:name,bot:bot,id:id,alive:true,boost:false,bt:0,sd:Math.random()<.5?1:-1,dl:0,inv:0};
 var n=segs(m);for(var i=0;i<n;i++){s.xs[i]=x0-Math.cos(a)*GAP*i;s.ys[i]=y0-Math.sin(a)*GAP*i}s.n=n;return s}
function botNew(i){var bx,by,t=0;do{bx=rnd(220,WW-220);by=rnd(220,WW-220);t++}while(P&&t<30&&(bx-P.x)*(bx-P.x)+(by-P.y)*(by-P.y)<122500);
 var s=mkS(bx,by,rnd(0,6.28),rnd(10,22+i*2),Math.random()*8|0,NM[i%NM.length],true,i);s.inv=60;return s}
function start(){fx("s",0,520,.08,"sine",.05,780);DF=DFL[S0[1]];WW=MPL[S0[2]][2];sv(CK,S0.join(","));PTG=Math.floor(WW*WW/11000);MAXP=PTG+500;
 px=new Float32Array(MAXP);py=new Float32Array(MAXP);pc=new Uint8Array(MAXP);pv=new Float32Array(MAXP);pn=0;
 var i;for(i=0;i<7;i++)PSP[i]=pelSpr(PCL[i]);for(i=0;i<8;i++)if(COLS[i]){sp(COLS[i],0);sp(COLS[i],1)}for(i=0;i<7;i++){sp(RBC[i],0);sp(RBC[i],1)}
 for(i=0;i<PTG;i++)addP(rnd(30,WW-30),rnd(30,WW-30),Math.random()*7|0,Math.random()<.06?3:1);
 P=mkS(WW/2,WW/2,rnd(0,6.28),10,S0[0],"Tú",false,0);P.inv=100;SN=[P];for(i=0;i<DF[2];i++)SN.push(botNew(i+1));
 cx=P.x;cy=P.y;zs=1;kills=0;toastT=0;pdead=0;turn=0;bo=false;fr=0;lb=[];hc=["","",""];born=tm;st=1;
 $("ov").style.display="none";$("cfg").style.display="none";$("gm").style.display="block";$("bb").className="bt";hud()}
function toCfg(){st=0;$("gm").style.display="none";$("cfg").style.display="block"}
function over(){st=4;var sc=Math.floor(P.m*10);if(sc>best){best=sc;sv(KEY,best)}hud();$("ot").textContent=why+"\nLongitud "+sc+" · bajas "+kills+" · "+Math.floor(tm-born)+" s\nRécord "+best;$("ov").style.display="flex"}
function die(s,k,r){if(!s.alive||s.inv>0)return;s.alive=false;
 var tot=Math.max(4,s.m*.7),cnt=Math.max(1,s.n>>1),v=Math.max(1,Math.min(6,tot/cnt)),i,pcc=s.col;
 for(i=0;i<s.n;i+=2)addP(s.xs[i]+rnd(-5,5),s.ys[i]+rnd(-5,5),pcOf(s),v);
 if(k&&k===P){fx("k",0,520,.18,"triangle",.07,1040);kills++;toast="💀 Eliminaste a "+s.name;toastT=1.6}
 if(s===P){fx("d",0,320,.5,"sawtooth",.07,40);pdead=.9;st=3;why=k?"Chocaste con "+k.name:r}else s.dl=2+Math.random()*2}
function move(s,k){var d=s.ta-s.a;while(d>3.1416)d-=6.2832;while(d<-3.1416)d+=6.2832;var tr=(s.bot?DF[3]:.095)*k;s.a+=d<-tr?-tr:d>tr?tr:d;
 var bs=s.boost&&s.m>12,v=(bs?3.5:1.9)*k;s.x+=Math.cos(s.a)*v;s.y+=Math.sin(s.a)*v;
 var xs=s.xs,ys=s.ys,n=segs(s.m),i,dx,dy,dd;
 while(s.n<n){xs[s.n]=xs[s.n-1];ys[s.n]=ys[s.n-1];s.n++}s.n=n;
 xs[0]=s.x;ys[0]=s.y;for(i=1;i<n;i++){dx=xs[i]-xs[i-1];dy=ys[i]-ys[i-1];dd=dx*dx+dy*dy;if(dd>GAP*GAP){dd=GAP/Math.sqrt(dd);xs[i]=xs[i-1]+dx*dd;ys[i]=ys[i-1]+dy*dd}}
 if(bs){s.bt+=k;if(s.bt>=9){s.bt=0;s.m-=.5;addP(xs[n-1],ys[n-1],pcOf(s),1)}}else s.boost=false}
function eat(s){var r=thick(s)+8,r2=r*r,i,dx,dy;for(i=pn-1;i>=0;i--){dx=px[i]-s.x;dy=py[i]-s.y;if(dx*dx+dy*dy<r2){s.m+=pv[i];rmP(i);if(s===P)fx("e",70,820,.05,"sine",.04,1250)}}}
function danger(s){var lx=s.x+Math.cos(s.a)*50,ly=s.y+Math.sin(s.a)*50,j,i,B,dx,dy,lim,tb;
 for(j=0;j<SN.length;j++){B=SN[j];if(B===s||!B.alive)continue;dx=lx-B.x;dy=ly-B.y;lim=B.n*GAP+90;if(dx*dx+dy*dy>lim*lim)continue;tb=thick(B)+12;tb*=tb;
  for(i=0;i<B.n;i+=2){dx=B.xs[i]-lx;dy=B.ys[i]-ly;if(dx*dx+dy*dy<tb)return true}}return false}
function think(s){var m=170,x0=s.x,y0=s.y,i,dx,dy,d,bd=67600,bi=-1;
 if(x0<m||y0<m||x0>WW-m||y0>WW-m){s.ta=Math.atan2(WW/2-y0,WW/2-x0);s.boost=false;return}
 if(danger(s)){s.ta=s.a+s.sd*1.4;s.boost=s.m>25&&Math.random()<.5;return}
 s.boost=false;
 if(DF[4]>0&&P.alive&&s.m>14&&Math.random()<DF[4]*.5){dx=P.x-x0;dy=P.y-y0;d=dx*dx+dy*dy;if(d<130000){s.ta=Math.atan2(P.y+Math.sin(P.a)*70-y0,P.x+Math.cos(P.a)*70-x0);s.boost=s.m>30&&d<40000&&Math.random()<.6;return}}
 for(i=0;i<pn;i++){dx=px[i]-x0;dy=py[i]-y0;d=dx*dx+dy*dy;if(d<bd){bd=d;bi=i}}
 if(bi>=0)s.ta=Math.atan2(py[bi]-y0,px[bi]-x0);else if(Math.random()<.05)s.ta=s.a+rnd(-.8,.8)}
function collide(){var i,j,A,B,dx,dy,lim,rb,ii,ex,ey,th;
 for(i=0;i<SN.length;i++){A=SN[i];if(!A.alive||A.inv>0)continue;
  if(A.x<8||A.y<8||A.x>WW-8||A.y>WW-8){die(A,null,"Chocaste con el borde");continue}
  for(j=0;j<SN.length;j++){B=SN[j];if(B===A||!B.alive)continue;dx=A.x-B.x;dy=A.y-B.y;lim=B.n*GAP+60;if(dx*dx+dy*dy>lim*lim)continue;
   th=thick(A)+thick(B);if(dx*dx+dy*dy<th*th*.3&&A.m<=B.m){die(A,B);break}
   rb=thick(B)*.9+thick(A)*.7;rb*=rb;
   for(ii=1;ii<B.n;ii++){ex=B.xs[ii]-A.x;ey=B.ys[ii]-A.y;if(ex*ex+ey*ey<rb){die(A,B);break}}
   if(!A.alive)break}}}
function upd(dt,k){var i,s;fr++;tm+=dt;
 if(st===1){if(turn)P.ta=P.a+turn;P.boost=bo&&P.m>12;if(P.inv>0)P.inv-=k}
 for(i=0;i<SN.length;i++){s=SN[i];
  if(!s.alive){if(s.bot){s.dl-=dt;if(s.dl<=0)SN[i]=botNew(s.id)}continue}
  if(s.bot){if((fr+i)%4===0)think(s);if(s.inv>0)s.inv-=k}
  if(s!==P||st===1){move(s,k);eat(s)}}
 collide();
 var a=0;while(pn<PTG&&a<4){addP(rnd(30,WW-30),rnd(30,WW-30),Math.random()*7|0,Math.random()<.06?3:1);a++}
 var tz=Math.max(.62,1-(P.n-17)*.0016);zs+=(tz-zs)*Math.min(1,.03*k);cx+=(P.x-cx)*Math.min(1,.3*k);cy+=(P.y-cy)*Math.min(1,.3*k);
 if(toastT>0)toastT-=dt;
 if(fr%20===0){var arr=[];for(i=0;i<SN.length;i++)if(SN[i].alive)arr.push(SN[i]);arr.sort(function(p,q){return q.m-p.m});lb=[];for(i=0;i<5&&i<arr.length;i++)lb.push([arr[i].name,Math.floor(arr[i].m*10),arr[i]===P])}
 if(st===1)hud();
 else if(st===3){pdead-=dt;if(pdead<=0)over()}}
function eyes(s,th){var ca=Math.cos(s.a),sa=Math.sin(s.a),ox=-sa*th*.5,oy=ca*th*.5,fx=ca*th*.35,fy=sa*th*.35,r=th*.32;x.fillStyle="#fff";
 x.beginPath();x.arc(s.x+fx+ox,s.y+fy+oy,r,0,6.3);x.fill();x.beginPath();x.arc(s.x+fx-ox,s.y+fy-oy,r,0,6.3);x.fill();x.fillStyle="#111";
 x.beginPath();x.arc(s.x+fx*1.5+ox,s.y+fy*1.5+oy,r*.5,0,6.3);x.fill();x.beginPath();x.arc(s.x+fx*1.5-ox,s.y+fy*1.5-oy,r*.5,0,6.3);x.fill()}
function drawS(s,hw,hh){var th=thick(s),sz=th*3.2,hs=sz/2,i,h0,l0,xs=s.xs,ys=s.ys,rb=s.col===6,c=rb?"":COLS[s.col];
 if(s.inv>0&&((s.inv/6)|0)%2)x.globalAlpha=.45;
 for(i=s.n-1;i>=0;i--){if(xs[i]-cx>hw||cx-xs[i]>hw||ys[i]-cy>hh||cy-ys[i]>hh)continue;
  x.drawImage(sp(rb?RBC[i%7]:c,i%3===0?1:0),xs[i]-hs,ys[i]-hs,sz,sz)}
 x.globalAlpha=1;eyes(s,th)}
function draw(){var sc=zs,hw=W/2/sc+40,hh=H/2/sc+40,i,j,s,sz;
 x.setTransform(K,0,0,K,0,0);x.fillStyle="#1a0510";x.fillRect(0,0,W,H);
 x.setTransform(K*sc,0,0,K*sc,K*(W/2-cx*sc),K*(H/2-cy*sc));
 x.fillStyle=PAT;x.fillRect(0,0,WW,WW);x.strokeStyle="rgba(255,61,110,.85)";x.lineWidth=14;x.strokeRect(-7,-7,WW+14,WW+14);
 for(i=0;i<pn;i++){if(px[i]-cx>hw||cx-px[i]>hw||py[i]-cy>hh||cy-py[i]>hh)continue;sz=(pv[i]>=3?17:11)*(1+.12*Math.sin(tm*5+i));x.drawImage(PSP[pc[i]],px[i]-sz/2,py[i]-sz/2,sz,sz)}
 for(j=SN.length-1;j>=0;j--){s=SN[j];if(!s.alive||s===P)continue;drawS(s,hw,hh)}
 if(P.alive)drawS(P,hw,hh);
 x.font="bold 10px Roboto,Arial,sans-serif";x.textAlign="center";x.fillStyle="#ffffffcc";
 for(j=1;j<SN.length;j++){s=SN[j];if(s.alive&&s.x-cx<hw&&cx-s.x<hw&&s.y-cy<hh&&cy-s.y<hh)x.fillText(s.name,s.x,s.y-thick(s)-6)}
 x.setTransform(K,0,0,K,0,0);
 x.fillStyle="rgba(5,3,15,.5)";x.fillRect(W-104,4,100,64);x.font="bold 9px Roboto,Arial,sans-serif";x.textAlign="left";
 for(i=0;i<lb.length;i++){x.fillStyle=lb[i][2]?"#ffe14d":"#d6d0ff";x.fillText((i+1)+". "+lb[i][0],W-100,16+i*11);x.textAlign="right";x.fillText(lb[i][1],W-8,16+i*11);x.textAlign="left"}
 x.fillStyle="rgba(5,3,15,.5)";x.fillRect(6,H-60,54,54);x.strokeStyle="#4a3a8a";x.lineWidth=1;x.strokeRect(6.5,H-59.5,53,53);
 x.fillStyle="#ff6a8a";for(i=1;i<SN.length;i++){s=SN[i];if(s.alive)x.fillRect(6+s.x/WW*54-1,H-60+s.y/WW*54-1,2,2)}
 x.fillStyle="#fff";x.fillRect(6+P.x/WW*54-2,H-60+P.y/WW*54-2,4,4);
 if(toastT>0){x.font="bold 14px Roboto,Arial,sans-serif";x.textAlign="center";x.fillStyle="#ffe14d";x.fillText(toast,W/2,34)}}
var ERR=false;function er(e){if(ERR)return;ERR=true;var d=$("er");d.textContent="⚠ "+(e&&e.message||e);d.style.display="block"}
function loop(ts){if(ts-last<14){requestAnimationFrame(loop);return}
 var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;if(!document.hidden&&st>0){try{upd(dt,dt*60);draw()}catch(e){er(e)}}requestAnimationFrame(loop)}
function steer(e){if(st!==1)return;var r=cv.getBoundingClientRect(),dx=(e.clientX-r.left)*W/r.width-W/2,dy=(e.clientY-r.top)*H/r.height-H/2;if(dx*dx+dy*dy>64){P.ta=Math.atan2(dy,dx);turn=0}}
cv.addEventListener("pointerdown",function(e){e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(z){}steer(e)});
cv.addEventListener("pointermove",function(e){e.preventDefault();steer(e)});
function hold(id,on,off){var b=$(id);b.addEventListener("pointerdown",function(e){e.preventDefault();on();b.className="bt on"});["pointerup","pointerleave","pointercancel"].forEach(function(n){b.addEventListener(n,function(){off();b.className="bt"})})}
hold("bl",function(){turn=-1},function(){if(turn===-1)turn=0});hold("br",function(){turn=1},function(){if(turn===1)turn=0});hold("bb",function(){bo=true;fx("b",200,160,.12,"sawtooth",.03,320)},function(){bo=false});
$("go").addEventListener("click",start);$("ag").addEventListener("click",start);$("ch").addEventListener("click",toCfg);$("mb").addEventListener("click",toCfg);
requestAnimationFrame(loop);
})();
</script></body></html>`;

export default {
  names: [".snakefrutis2", ".serpientes2"],
  desc: "Gusanos estilo io: come puntos, crece, acelera y haz chocar a los bots; elige color, dificultad y mapa",
  category: "Juegos",
  usage: ".snakefrutis2",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[SNAKEFRUTIS2] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
