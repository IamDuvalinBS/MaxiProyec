import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
html,body{margin:0;padding:0;background:#0a0f1e;color:#fff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}
#root{max-width:520px;margin:0 auto;padding:12px;position:relative}
.hd{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.logo{width:46px;height:46px;border-radius:14px;background:#111a30;border:1px solid #243155;display:flex;align-items:center;justify-content:center;font-size:26px}
.hdt{flex:1;min-width:0}
.brand{font-size:9px;letter-spacing:3px;color:#ff4fa3;text-transform:uppercase}
.ttl{font-size:20px;font-weight:900;letter-spacing:1px;line-height:1.1}
.sub{font-size:11px;color:#8b97b5}
.sbtn{padding:9px 13px;border-radius:12px;border:1px solid #2a3860;background:#111a30;color:#b9c4e0;font-size:11px;font-weight:700;letter-spacing:1px;font-family:inherit;cursor:pointer}
.sbtn:active{background:#1a2748}
.card{background:linear-gradient(160deg,#111a30,#0b1224);border:1px solid #243155;border-radius:22px;padding:16px}
.hero{text-align:center;font-size:54px;line-height:1;margin:6px 0 8px}
.h1{text-align:center;font-size:27px;font-weight:900}
.h2{text-align:center;font-size:14px;color:#8b97b5;margin:6px 0 16px}
.lab{font-size:11px;letter-spacing:2px;color:#8b97b5;font-weight:700;margin:6px 2px 10px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opt{background:linear-gradient(160deg,#16213d,#0f1830);border:1px solid #243155;border-radius:18px;padding:14px;cursor:pointer;font-family:inherit;color:#fff;text-align:left}
.opt:active{transform:scale(.97)}
.opt .ic{font-size:30px}
.opt .nm{font-size:17px;font-weight:900;margin-top:6px}
.opt .ds{font-size:12px;color:#8b97b5;margin-top:3px}
.opt .st{font-size:10px;color:#ffe66d;margin-top:6px}
.side{text-align:center;padding:22px 8px}
.side .ic{font-size:44px}
.side .nm{font-size:17px;font-weight:900;margin-top:10px;letter-spacing:1px}
.side .ds{font-size:12px;margin-top:4px;opacity:.65}
.sw{background:linear-gradient(160deg,#f4f6fb,#c9d0e2);color:#111a30}
.sb{background:linear-gradient(160deg,#243155,#16213d)}
.wide{display:block;width:100%;margin-top:10px;padding:14px;border-radius:14px;border:1px solid #243155;background:#111c38;color:#dbe3f7;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;text-align:center}
.wide:active{background:#1a2748}
.pl{display:flex;align-items:stretch;gap:8px;margin-bottom:8px}
.pc{flex:1;min-width:0;border:1px solid #243155;border-radius:14px;padding:8px 10px;background:#0f1830}
.pc.on{border-color:#60a5fa;box-shadow:0 0 0 1px #60a5fa inset}
.pc small{display:block;font-size:9px;letter-spacing:2px;color:#8b97b5}
.pc b{display:block;font-size:15px;margin-top:2px}
.pc i{display:block;font-style:normal;font-size:13px;min-height:16px;color:#9fb0d0;letter-spacing:-1px;white-space:nowrap;overflow:hidden}
.chip{align-self:center;padding:7px 10px;border-radius:12px;background:#16264a;color:#9cc3ff;font-size:11px;font-weight:900;letter-spacing:1px;text-align:center;white-space:nowrap}
.chip.th{animation:pul 1s infinite}
@keyframes pul{50%{opacity:.45}}
.bw{border-radius:16px;padding:6px;background:#0f1830;border:2px solid #1d2b50}
#board{display:grid;grid-template-columns:repeat(8,1fr);width:100%;aspect-ratio:1/1;border-radius:10px;overflow:hidden;touch-action:manipulation}
.s{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer}
.lt{background:#f0d9b5}.dk{background:#b58863}
.s.lm{background-image:linear-gradient(rgba(255,214,10,.42),rgba(255,214,10,.42))}
.s.sel{background-image:linear-gradient(rgba(80,170,255,.75),rgba(80,170,255,.75))}
.s.ck{background-image:radial-gradient(circle,rgba(255,40,40,.95) 0,rgba(255,40,40,.5) 55%,rgba(255,40,40,0) 80%)}
.s.mv:after{content:"";position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(20,30,50,.38)}
.s.cp:after{content:"";position:absolute;inset:4%;border-radius:50%;border:4px solid rgba(20,30,50,.38)}
.p{font-style:normal;font-weight:400;line-height:1;position:relative;z-index:2;pointer-events:none;font-family:"Segoe UI Symbol","Noto Sans Symbols2","Noto Sans Symbols","DejaVu Sans",Arial,sans-serif}
.p.w{color:#fff;text-shadow:0 0 1px #000,0 0 1px #000,0 0 2px #000,0 1px 2px rgba(0,0,0,.6)}
.p.b{color:#1b1b1b;text-shadow:0 0 1px rgba(255,255,255,.55),0 1px 1px rgba(255,255,255,.25)}
.dst .p{animation:pop .16s ease-out}
@keyframes pop{0%{transform:scale(.7)}100%{transform:scale(1)}}
.lb,.lf{position:absolute;font-size:9px;font-weight:700;text-decoration:none;z-index:1;pointer-events:none;line-height:1}
.lb{left:3px;top:3px}.lf{right:3px;bottom:2px}
.lt .lb,.lt .lf{color:#b58863}.dk .lb,.dk .lf{color:#f0d9b5}
.info{text-align:center;font-size:12px;color:#8b97b5;margin:10px 0;min-height:15px}
.tr{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.tr div{text-align:center;border:1px solid #243155;border-radius:14px;padding:9px 4px;background:#0f1830;font-size:9px;letter-spacing:1.5px;color:#8b97b5}
.tr b{display:block;font-size:16px;color:#fff;margin-top:3px;letter-spacing:0}
.hist{margin-top:10px;border:1px solid #243155;border-radius:16px;padding:10px 12px;background:#0f1830}
.hist small{font-size:10px;letter-spacing:2px;color:#8b97b5}
#hl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:92px;overflow-y:auto;-webkit-overflow-scrolling:touch}
#hl span{padding:5px 9px;border-radius:9px;background:#16264a;color:#bcd2ff;font-size:12px}
.acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.acts .wide{margin-top:0;padding:12px;font-size:13px}
.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 0 2px;font-size:11px;color:#7d89a8}
.ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(6,9,18,.9);z-index:50}
.ov.show{display:flex}
.md{width:100%;max-width:330px;text-align:center;background:#111a30;border:2px solid #ff4fa3;border-radius:20px;padding:22px;box-shadow:0 0 35px rgba(255,79,163,.25)}
.mt{font-size:22px;font-weight:900;color:#ff4fa3}
.mx{font-size:13px;color:rgba(255,255,255,.72);margin:8px 0 14px;line-height:1.6}
.mb{width:100%;padding:12px;margin-top:7px;border-radius:12px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit}
.mb:active{background:rgba(255,79,163,.22)}
.pr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}
.pr button{height:64px;border-radius:14px;border:1px solid #2a3860;background:#16213d;font-size:38px;line-height:1;padding:0;cursor:pointer;font-family:"Segoe UI Symbol","Noto Sans Symbols2","DejaVu Sans",Arial,sans-serif}
.pr button.w{color:#fff;text-shadow:0 0 2px #000}.pr button.b{color:#222;background:#cfd6e6}
.hide{display:none!important}
</style>
</head>
<body>
<div id="root">
<div class="hd"><div class="logo">♞&#xFE0E;</div><div class="hdt"><div class="brand">MAXIPROYEC · CHESS LAB</div><div class="ttl">AJEDREZ</div><div class="sub">Motor de ajedrez · Powered by __FIRMA__</div></div><button id="bMenu" class="sbtn hide">MENÚ</button></div>

<div id="scMenu" class="card">
<div class="hero">♚&#xFE0E;</div>
<div class="h1">Ajedrez</div>
<div class="h2">Selecciona el nivel de la inteligencia artificial</div>
<div class="lab">NIVEL DE JUEGO</div>
<div id="lvls" class="g2"></div>
</div>

<div id="scColor" class="card hide">
<div class="hero">♚&#xFE0E;♛&#xFE0E;</div>
<div class="h1">Elige tus piezas</div>
<div id="lvTxt" class="h2">Nivel: Fácil</div>
<div class="g2">
<button id="cW" class="opt side sw"><div class="ic">♚&#xFE0E;</div><div class="nm">BLANCAS</div><div class="ds">Tú comienzas</div></button>
<button id="cB" class="opt side sb"><div class="ic">♚&#xFE0E;</div><div class="nm">NEGRAS</div><div class="ds">La IA comienza</div></button>
</div>
<button id="cR" class="wide">🎲 Aleatorio</button>
<button id="cBack" class="wide">← Cambiar dificultad</button>
</div>

<div id="scGame" class="hide">
<div class="pl">
<div class="pc" id="pcAi"><small>OPONENTE</small><b id="aiNm">IA</b><i id="aiCap"></i></div>
<div id="chip" class="chip">TU TURNO</div>
<div class="pc" id="pcMe"><small>JUGADOR</small><b>♚&#xFE0E; TÚ</b><i id="meCap"></i></div>
</div>
<div class="bw"><div id="board"></div></div>
<div id="info" class="info"></div>
<div class="tr"><div>NIVEL<b id="sLv">Fácil</b></div><div>TURNO<b id="sTn">BLANCAS</b></div><div>MOVIMIENTOS<b id="sMv">0</b></div></div>
<div class="hist"><small>HISTORIAL</small><div id="hl"></div></div>
<div class="acts"><button id="bUndo" class="wide">↩ Deshacer</button><button id="bReset" class="wide">⚔️ Reiniciar partida</button></div>
</div>

<div class="foot"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.7"/><path d="M8 7v4.2M8 4.7v.1" stroke-linecap="round"/></svg>Powered by __FIRMA__</div>

<div id="ovEnd" class="ov"><div class="md"><div id="mT" class="mt">FIN</div><div id="mX" class="mx"></div><button id="mAgain" class="mb">▶ JUGAR DE NUEVO</button><button id="mMenu" class="mb">☰ CAMBIAR NIVEL</button></div></div>
<div id="ovPromo" class="ov"><div class="md"><div class="mt">Coronación</div><div class="mx">Elige la pieza</div><div id="prRow" class="pr"></div></div></div>
</div>
<script>
function ChessEngine(){
var B=new Int8Array(64),turn=1,castle=15,ep=-1,half=0,kw=60,kb=4,h=0,sp=0;
var INF=32000,MATE=30000;
var VAL=[0,100,320,330,500,900,0];
var PST=[null,
[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]];
var KEND=[-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,-30,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50];
var PP=[0,10,20,35,55,80,120];
var CM=new Int8Array(64).fill(15);CM[60]=12;CM[63]=14;CM[56]=13;CM[4]=3;CM[7]=11;CM[0]=7;
var DR=[-1,1,0,0,-1,-1,1,1],DC=[0,0,1,-1,1,-1,1,-1];
var KN=[],KG=[],RAY=[],sq,r,c,d,k,rr,cc,a;
var NR=[-2,-2,-1,-1,1,1,2,2],NC=[-1,1,-2,2,-2,2,-1,1];
for(sq=0;sq<64;sq++){r=sq>>3;c=sq&7;KN[sq]=[];KG[sq]=[];RAY[sq]=[];
 for(k=0;k<8;k++){rr=r+NR[k];cc=c+NC[k];if(rr>=0&&rr<8&&cc>=0&&cc<8)KN[sq].push(rr*8+cc);
  rr=r+DR[k];cc=c+DC[k];if(rr>=0&&rr<8&&cc>=0&&cc<8)KG[sq].push(rr*8+cc);
  a=[];rr=r+DR[k];cc=c+DC[k];while(rr>=0&&rr<8&&cc>=0&&cc<8){a.push(rr*8+cc);rr+=DR[k];cc+=DC[k]}RAY[sq].push(a)}}
var seed=123456789;function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed|0}
var ZP=new Int32Array(13*64),ZC=new Int32Array(16),ZE=new Int32Array(9),ZT=rnd();
for(a=0;a<13*64;a++)ZP[a]=rnd();for(a=0;a<16;a++)ZC[a]=rnd();for(a=1;a<9;a++)ZE[a]=rnd();
var uMove=new Int32Array(1024),uCap=new Int8Array(1024),uCast=new Int8Array(1024),uEp=new Int8Array(1024),uHalf=new Int16Array(1024),uHash=new Int32Array(1024);
var MV=[],MS=[];for(a=0;a<170;a++){MV.push(new Int32Array(256));MS.push(new Int32Array(256))}
var TTN=1<<18,TTM=TTN-1,ttKey=new Int32Array(TTN),ttMove=new Int32Array(TTN),ttScore=new Int16Array(TTN),ttDepth=new Int8Array(TTN),ttFlag=new Int8Array(TTN);
var killer=new Int32Array(170*2),hist=new Int32Array(4096);
var nodes=0,stop=false,deadline=0;

function computeHash(){var x=0,i,p;for(i=0;i<64;i++){p=B[i];if(p)x^=ZP[(p+6)*64+i]}x^=ZC[castle]^ZE[ep<0?0:1+(ep&7)];if(turn===-1)x^=ZT;return x}
function reset(){var i,s=[-4,-2,-3,-5,-6,-3,-2,-4];for(i=0;i<64;i++)B[i]=0;
 for(i=0;i<8;i++){B[i]=s[i];B[8+i]=-1;B[48+i]=1;B[56+i]=-s[i]}
 turn=1;castle=15;ep=-1;half=0;kw=60;kb=4;sp=0;h=computeHash()}
function setFen(f){var p=f.split(' '),rows=p[0].split('/'),i,j,ch,q=0,m={p:1,n:2,b:3,r:4,q:5,k:6};
 for(i=0;i<64;i++)B[i]=0;
 for(i=0;i<8;i++){q=0;for(j=0;j<rows[i].length;j++){ch=rows[i][j];if(ch>='1'&&ch<='8')q+=+ch;else{var lo=ch.toLowerCase(),v=m[lo]*(ch===lo?-1:1);B[i*8+q]=v;if(lo==='k'){if(v>0)kw=i*8+q;else kb=i*8+q}q++}}}
 turn=p[1]==='b'?-1:1;castle=0;if(p[2].indexOf('K')>=0)castle|=1;if(p[2].indexOf('Q')>=0)castle|=2;if(p[2].indexOf('k')>=0)castle|=4;if(p[2].indexOf('q')>=0)castle|=8;
 ep=(p[3]&&p[3]!=='-')?(8-(+p[3][1]))*8+(p[3].charCodeAt(0)-97):-1;half=+p[4]||0;sp=0;h=computeHash()}

function isAtt(s,by){var r=s>>3,c=s&7,i,j,ray,p,t,kn=KN[s],kg=KG[s];
 if(by===1){if(c>0&&B[s+7]===1)return true;if(c<7&&B[s+9]===1)return true}
 else{if(c>0&&B[s-9]===-1)return true;if(c<7&&B[s-7]===-1)return true}
 var n2=by*2,k6=by*6;
 for(i=0;i<kn.length;i++)if(B[kn[i]]===n2)return true;
 for(i=0;i<kg.length;i++)if(B[kg[i]]===k6)return true;
 var r4=by*4,b3=by*3,q5=by*5;
 for(i=0;i<8;i++){ray=RAY[s][i];for(j=0;j<ray.length;j++){p=B[ray[j]];if(p){if(p===q5||(i<4?p===r4:p===b3))return true;break}}}
 return false}
function inCheck(){return isAtt(turn===1?kw:kb,-turn)}
function illegal(){return isAtt(turn===-1?kw:kb,turn)}

function gen(pl,caps){var L=MV[pl],n=0,us=turn,sq,p,ap,t,tp,r,c,i,j,ray,kn,kg,fw,start,pr7,t2,dc,cc2;
 for(sq=0;sq<64;sq++){p=B[sq];ap=p*us;if(ap<=0)continue;
  if(ap===1){r=sq>>3;c=sq&7;fw=us===1?-8:8;start=us===1?6:1;pr7=us===1?1:6;t=sq+fw;
   if(B[t]===0){if(r===pr7){L[n++]=sq|t<<6|5<<12;if(!caps){L[n++]=sq|t<<6|4<<12;L[n++]=sq|t<<6|3<<12;L[n++]=sq|t<<6|2<<12}}
    else if(!caps){L[n++]=sq|t<<6;if(r===start&&B[t+fw]===0)L[n++]=sq|(t+fw)<<6|8<<16}}
   for(dc=-1;dc<=1;dc+=2){cc2=c+dc;if(cc2<0||cc2>7)continue;t2=t+dc;tp=B[t2];
    if(tp*us<0){if(r===pr7){L[n++]=sq|t2<<6|5<<12|1<<16;if(!caps){L[n++]=sq|t2<<6|4<<12|1<<16;L[n++]=sq|t2<<6|3<<12|1<<16;L[n++]=sq|t2<<6|2<<12|1<<16}}else L[n++]=sq|t2<<6|1<<16}
    else if(t2===ep&&tp===0)L[n++]=sq|t2<<6|3<<16}}
  else if(ap===2){kn=KN[sq];for(i=0;i<kn.length;i++){t=kn[i];tp=B[t];if(tp*us>0)continue;if(tp!==0)L[n++]=sq|t<<6|1<<16;else if(!caps)L[n++]=sq|t<<6}}
  else if(ap===6){kg=KG[sq];for(i=0;i<kg.length;i++){t=kg[i];tp=B[t];if(tp*us>0)continue;if(tp!==0)L[n++]=sq|t<<6|1<<16;else if(!caps)L[n++]=sq|t<<6}
   if(!caps){
    if(us===1&&sq===60){
     if((castle&1)&&B[61]===0&&B[62]===0&&B[63]===4&&!isAtt(60,-1)&&!isAtt(61,-1)&&!isAtt(62,-1))L[n++]=60|62<<6|4<<16;
     if((castle&2)&&B[59]===0&&B[58]===0&&B[57]===0&&B[56]===4&&!isAtt(60,-1)&&!isAtt(59,-1)&&!isAtt(58,-1))L[n++]=60|58<<6|4<<16}
    else if(us===-1&&sq===4){
     if((castle&4)&&B[5]===0&&B[6]===0&&B[7]===-4&&!isAtt(4,1)&&!isAtt(5,1)&&!isAtt(6,1))L[n++]=4|6<<6|4<<16;
     if((castle&8)&&B[3]===0&&B[2]===0&&B[1]===0&&B[0]===-4&&!isAtt(4,1)&&!isAtt(3,1)&&!isAtt(2,1))L[n++]=4|2<<6|4<<16}}}
  else{var d0=ap===3?4:0,d1=ap===4?4:8;
   for(i=d0;i<d1;i++){ray=RAY[sq][i];for(j=0;j<ray.length;j++){t=ray[j];tp=B[t];if(tp===0){if(!caps)L[n++]=sq|t<<6}else{if(tp*us<0)L[n++]=sq|t<<6|1<<16;break}}}}}
 return n}

function make(m){var f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=m>>16,p=B[f],cp=B[t],ap=p<0?-p:p,hh=h,rf,rt,rk,cs;
 uMove[sp]=m;uCast[sp]=castle;uEp[sp]=ep;uHalf[sp]=half;uHash[sp]=h;
 hh^=ZP[(p+6)*64+f];
 if(fl&2){cs=turn===1?t+8:t-8;cp=B[cs];B[cs]=0;hh^=ZP[(cp+6)*64+cs]}else if(cp)hh^=ZP[(cp+6)*64+t];
 uCap[sp]=cp;B[f]=0;
 var np=pr?turn*pr:p;B[t]=np;hh^=ZP[(np+6)*64+t];
 if(fl&4){if(t===62){rf=63;rt=61}else if(t===58){rf=56;rt=59}else if(t===6){rf=7;rt=5}else{rf=0;rt=3}
  rk=B[rf];B[rf]=0;B[rt]=rk;hh^=ZP[(rk+6)*64+rf]^ZP[(rk+6)*64+rt]}
 if(ap===6){if(turn===1)kw=t;else kb=t}
 hh^=ZC[castle];castle&=CM[f]&CM[t];hh^=ZC[castle];
 hh^=ZE[ep<0?0:1+(ep&7)];ep=(fl&8)?((f+t)>>1):-1;hh^=ZE[ep<0?0:1+(ep&7)];
 half=(ap===1||cp)?0:half+1;turn=-turn;h=hh^ZT;sp++}
function unmake(){sp--;var m=uMove[sp],f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=m>>16,rf,rt,rk;
 turn=-turn;var p=pr?turn:B[t],cp=uCap[sp];B[f]=p;
 if(fl&2){B[t]=0;B[turn===1?t+8:t-8]=cp}else B[t]=cp;
 if(fl&4){if(t===62){rf=63;rt=61}else if(t===58){rf=56;rt=59}else if(t===6){rf=7;rt=5}else{rf=0;rt=3}
  rk=B[rt];B[rt]=0;B[rf]=rk}
 if((p<0?-p:p)===6){if(turn===1)kw=f;else kb=f}
 castle=uCast[sp];ep=uEp[sp];half=uHalf[sp];h=uHash[sp]}

var pwS=new Int8Array(8),bwS=new Int8Array(8),wC=new Int8Array(8),bC=new Int8Array(8),wMax=new Int8Array(8),bMin=new Int8Array(8);
function evaluate(){var s=0,i,p,ap,np=0,wb=0,bb=0,np2=0,nw=0,nb=0,f,r;
 for(i=0;i<8;i++){wC[i]=0;bC[i]=0;wMax[i]=-1;bMin[i]=9}
 for(i=0;i<64;i++){p=B[i];if(!p)continue;
  if(p>0){if(p===6)continue;s+=VAL[p]+PST[p][i];if(p===1){f=i&7;r=i>>3;wC[f]++;if(r>wMax[f])wMax[f]=r;pwS[nw++]=i}else{np+=VAL[p];if(p===3)wb++}}
  else{if(p===-6)continue;ap=-p;s-=VAL[ap]+PST[ap][i^56];if(ap===1){f=i&7;r=i>>3;bC[f]++;if(r<bMin[f])bMin[f]=r;bwS[nb++]=i}else{np+=VAL[ap];if(ap===3)bb++}}}
 s+=(np<=2600)?(KEND[kw]-KEND[kb^56]):(PST[6][kw]-PST[6][kb^56]);
 if(wb>1)s+=35;if(bb>1)s-=35;
 var j,lo,hi,pass;
 for(i=0;i<nw;i++){f=pwS[i]&7;r=pwS[i]>>3;pass=true;lo=f>0?f-1:0;hi=f<7?f+1:7;for(j=lo;j<=hi;j++)if(bMin[j]<r){pass=false;break}if(pass)s+=PP[6-r]}
 for(i=0;i<nb;i++){f=bwS[i]&7;r=bwS[i]>>3;pass=true;lo=f>0?f-1:0;hi=f<7?f+1:7;for(j=lo;j<=hi;j++)if(wMax[j]>r){pass=false;break}if(pass)s-=PP[r-1]}
 for(i=0;i<8;i++){if(wC[i]>1)s-=12*(wC[i]-1);if(bC[i]>1)s+=12*(bC[i]-1)}
 return turn===1?s:-s}

function scoreMoves(pl,n,ttm){var L=MV[pl],S=MS[pl],i,m,t,fl,v,k0=killer[pl*2],k1=killer[pl*2+1];
 for(i=0;i<n;i++){m=L[i];fl=m>>16;
  if(m===ttm)v=2000000;
  else if(fl&1){t=(m>>6)&63;v=100000+(fl&2?100:VAL[B[t]<0?-B[t]:B[t]])*16-VAL[B[m&63]<0?-B[m&63]:B[m&63]]/10|0;if((m>>12)&7)v+=5000}
  else if((m>>12)&7)v=90000+((m>>12)&7);
  else if(m===k0)v=80000;else if(m===k1)v=79000;
  else v=hist[m&4095];
  S[i]=v}}
function pick(pl,i,n){var L=MV[pl],S=MS[pl],b=i,j,t;for(j=i+1;j<n;j++)if(S[j]>S[b])b=j;
 if(b!==i){t=L[i];L[i]=L[b];L[b]=t;t=S[i];S[i]=S[b];S[b]=t}return L[i]}

function qs(alpha,beta,pl){
 if((++nodes&2047)===0&&Date.now()>deadline)stop=true;
 if(stop)return 0;
 var sc=evaluate();if(pl>=150)return sc;
 if(sc>=beta)return sc;if(sc>alpha)alpha=sc;
 var n=gen(pl,true),i,m,v,best=sc,L=MV[pl];
 scoreMoves(pl,n,0);
 for(i=0;i<n;i++){m=pick(pl,i,n);
  if(!((m>>12)&7)){var vc=(m>>16)&2?100:VAL[B[(m>>6)&63]<0?-B[(m>>6)&63]:B[(m>>6)&63]];if(sc+vc+200<alpha)continue}
  make(m);if(illegal()){unmake();continue}
  v=-qs(-beta,-alpha,pl+1);unmake();if(stop)return 0;
  if(v>best){best=v;if(v>alpha){alpha=v;if(alpha>=beta)break}}}
 return best}

function negamax(d,alpha,beta,pl){
 if((++nodes&2047)===0&&Date.now()>deadline)stop=true;
 if(stop)return 0;
 var chk=inCheck(),i,m,v,n,L,alpha0=alpha;
 if(pl>0){if(half>=100)return 0;
  var lim=sp-half;if(lim<0)lim=0;for(i=sp-2;i>=lim;i-=2)if(uHash[i]===h)return 0}
 if(chk&&pl<60)d++;
 if(d<=0)return qs(alpha,beta,pl);
 if(pl>=150)return evaluate();
 var idx=h&TTM,ttm=0,e;
 if(ttFlag[idx]&&ttKey[idx]===h){ttm=ttMove[idx];
  if(ttDepth[idx]>=d&&pl>0){e=ttScore[idx];if(e>MATE-200)e-=pl;else if(e<-MATE+200)e+=pl;
   var fg=ttFlag[idx];if(fg===1)return e;if(fg===2&&e>=beta)return e;if(fg===3&&e<=alpha)return e}}
 n=gen(pl,false);L=MV[pl];scoreMoves(pl,n,ttm);
 var best=-INF,bm=0,legal=0,quiet,red;
 for(i=0;i<n;i++){m=pick(pl,i,n);make(m);if(illegal()){unmake();continue}
  legal++;quiet=!((m>>16)&1)&&!((m>>12)&7);
  if(legal===1)v=-negamax(d-1,-beta,-alpha,pl+1);
  else{red=0;if(d>=3&&legal>4&&quiet&&!chk)red=(legal>10&&d>=5)?2:1;
   v=-negamax(d-1-red,-alpha-1,-alpha,pl+1);
   if(v>alpha&&red)v=-negamax(d-1,-alpha-1,-alpha,pl+1);
   if(v>alpha&&v<beta)v=-negamax(d-1,-beta,-alpha,pl+1)}
  unmake();if(stop)return 0;
  if(v>best){best=v;bm=m;if(v>alpha){alpha=v;if(alpha>=beta){
   if(quiet){if(killer[pl*2]!==m){killer[pl*2+1]=killer[pl*2];killer[pl*2]=m}hist[m&4095]+=d*d;if(hist[m&4095]>60000)for(var z=0;z<4096;z++)hist[z]>>=1}
   break}}}}
 if(!legal)return chk?-MATE+pl:0;
 var sv=best;if(sv>MATE-200)sv+=pl;else if(sv<-MATE+200)sv-=pl;
 ttKey[idx]=h;ttMove[idx]=bm;ttScore[idx]=sv;ttDepth[idx]=d;ttFlag[idx]=best<=alpha0?3:(best>=beta?2:1);
 return best}

function legal(){var n=gen(169,false),L=MV[169],out=[],i;for(i=0;i<n;i++){make(L[i]);if(!illegal())out.push(L[i]);unmake()}return out}
function search(o){var rm=legal(),i,j,m,v,depth,best,t0=Date.now();
 if(!rm.length)return null;
 if(o.rand&&Math.random()<o.rand)return{move:rm[Math.floor(Math.random()*rm.length)],score:0,depth:0,nodes:0};
 if(rm.length===1&&!o.noise)return{move:rm[0],score:0,depth:0,nodes:0};
 nodes=0;stop=false;deadline=t0+o.time;for(i=0;i<killer.length;i++)killer[i]=0;for(i=0;i<4096;i++)hist[i]>>=2;
 var rs=new Array(rm.length),exact=o.noise>0,bm=rm[0],bs=0,fs=new Array(rm.length);
 for(i=0;i<rm.length;i++)rs[i]=0;
 for(depth=1;depth<=o.depth;depth++){
  var alpha=-INF,ib=0,is=-INF,done=0,ord=[];
  for(i=0;i<rm.length;i++)ord.push(i);
  ord.sort(function(a,b){return(rm[b]===bm?1e9:rs[b])-(rm[a]===bm?1e9:rs[a])});
  for(j=0;j<ord.length;j++){i=ord[j];m=rm[i];make(m);
   if(exact||j===0)v=-negamax(depth-1,-INF,exact?INF:-alpha,1);
   else{v=-negamax(depth-1,-alpha-1,-alpha,1);if(v>alpha&&!stop)v=-negamax(depth-1,-INF,-alpha,1)}
   unmake();if(stop)break;
   rs[i]=v;fs[i]=v;done++;
   if(v>is){is=v;ib=m;if(!exact&&v>alpha)alpha=v}}
  if(done>0&&(!stop||done>0)){if(!stop||ib){bm=ib||bm;bs=is}}
  if(stop)break;
  if(is>MATE-100||is<-MATE+100)break;
  if(Date.now()-t0>o.time*0.55)break}
 if(exact){var bv=-INF,cand=bm;for(i=0;i<rm.length;i++){if(fs[i]===undefined)continue;v=fs[i]+(Math.random()*2-1)*o.noise;if(v>bv){bv=v;cand=rm[i]}}bm=cand}
 return{move:bm,score:bs,depth:depth,nodes:nodes}}

var SQN=function(s){return'abcdefgh'[s&7]+(8-(s>>3))};
function san(m){var f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=m>>16,p=B[f],ap=p<0?-p:p,s='',i,lg,x;
 if(fl&4)s=t>f?'O-O':'O-O-O';
 else{if(ap!==1){s='  NBRQK'[ap];lg=legal();var sf=false,sr=false,amb=false;
   for(i=0;i<lg.length;i++){x=lg[i];if(x!==m&&(x>>6&63)===t&&B[x&63]===p){amb=true;if((x&7)===(f&7))sf=true;if((x&63)>>3===f>>3)sr=true}}
   if(amb){if(!sf)s+='abcdefgh'[f&7];else if(!sr)s+=8-(f>>3);else s+=SQN(f)}}
  else if(fl&1)s+='abcdefgh'[f&7];
  if(fl&1)s+='x';s+=SQN(t);if(pr)s+='='+'  NBRQ'[pr]}
 make(m);if(inCheck())s+=legal().length?'+':'#';unmake();return s}
function insufficient(){var i,p,c=0,m=0;for(i=0;i<64;i++){p=B[i]<0?-B[i]:B[i];if(p===0||p===6)continue;if(p===1||p===4||p===5)return false;c++}return c<=1}
function status(){var lg=legal();
 if(!lg.length)return inCheck()?'mate':'stalemate';
 if(half>=100)return'fifty';
 var cnt=0,i,lim=sp-half;if(lim<0)lim=0;for(i=sp-2;i>=lim;i-=2)if(uHash[i]===h)cnt++;if(cnt>=2)return'rep';
 if(insufficient())return'insuf';return''}
function perft(d){if(d===0)return 1;var n=gen(d,false),L=MV[d],t=0,i,mv=[];for(i=0;i<n;i++)mv.push(L[i]);
 for(i=0;i<mv.length;i++){make(mv[i]);if(!illegal())t+=perft(d-1);unmake()}return t}
return{reset:reset,setFen:setFen,legal:legal,make:make,unmake:unmake,search:search,san:san,status:status,inCheck:inCheck,perft:perft,
 board:B,turn:function(){return turn},ply:function(){return sp},hash:function(){return h},recompute:computeHash,eval:evaluate,
 clearTT:function(){ttFlag.fill(0)}}}


(function(){
"use strict";
var E=ChessEngine(),B=E.board;
var LV=[
{n:'Fácil',ic:'🌱',d:'Movimientos sencillos',c:'#4ade80',o:{depth:1,time:300,noise:300,rand:0.2}},
{n:'Medio',ic:'⚔️',d:'Busca buenas jugadas',c:'#60a5fa',o:{depth:3,time:600,noise:80,rand:0}},
{n:'Difícil',ic:'🧠',d:'Analiza varias posiciones',c:'#c084fc',o:{depth:6,time:1200,noise:0,rand:0}},
{n:'Extremo',ic:'👑',d:'Máxima profundidad',c:'#f87171',o:{depth:14,time:3000,noise:0,rand:0}}];
var PC=['','♟\uFE0E','♞\uFE0E','♝\uFE0E','♜\uFE0E','♛\uFE0E','♚\uFE0E'];
var KEY='mp_chess_stats',mem=null;
function ldS(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s&&s.w&&s.l&&s.d)return s}catch(e){}return mem||{w:[0,0,0,0],l:[0,0,0,0],d:[0,0,0,0]}}
function svS(s){mem=s;try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
var stats=ldS();
var $=function(i){return document.getElementById(i)};
var lvl=1,side=1,flip=false,sel=-1,targets={},last=[-1,-1],moves=[],sans=[],lg=[],thinking=false,over=false,wId=0,W=null,wTimer=0,promoMoves=null,tStart=0,cells=[],cache=[];
var boardEl=$('board');
for(var i=0;i<64;i++){var c=document.createElement('div');c.className='s';c.setAttribute('data-d',i);c.innerHTML='<i class="p"></i><u class="lb"></u><u class="lf"></u>';boardEl.appendChild(c);cells.push(c);cache.push({c:'',p:99})}
try{
 var src='var E=('+ChessEngine.toString()+')();onmessage=function(e){var d=e.data,r=null;try{E.reset();for(var i=0;i<d.moves.length;i++)E.make(d.moves[i]);r=E.search(d.o)}catch(x){}postMessage({id:d.id,move:r?r.move:0})}';
 W=new Worker(URL.createObjectURL(new Blob([src],{type:'application/javascript'})));
 W.onmessage=function(e){apply(e.data.id,e.data.move)};
 W.onerror=function(){killW()};
}catch(err){W=null}
function killW(){try{if(W)W.terminate()}catch(e){}W=null}
function show(s){$('scMenu').className='card'+(s==='m'?'':' hide');$('scColor').className='card'+(s==='c'?'':' hide');$('scGame').className=s==='g'?'':'hide';$('bMenu').className='sbtn'+(s==='g'?'':' hide');if(s==='g')fit()}
function fit(){var w=boardEl.clientWidth;if(w)boardEl.style.fontSize=(w/8*0.84)+'px'}
window.addEventListener('resize',fit);
function menu(){wId++;thinking=false;clearTimeout(wTimer);$('ovEnd').className='ov';stats=ldS();var h='';
 for(var i=0;i<4;i++){var L=LV[i];h+='<button class="opt" data-l="'+i+'"><div class="ic">'+L.ic+'</div><div class="nm" style="color:'+L.c+'">'+L.n+'</div><div class="ds">'+L.d+'</div><div class="st">🏆 '+stats.w[i]+' · 🤝 '+stats.d[i]+' · 💀 '+stats.l[i]+'</div></button>'}
 $('lvls').innerHTML=h;show('m')}
$('lvls').addEventListener('click',function(e){var b=e.target;while(b&&b!==this&&!b.getAttribute('data-l'))b=b.parentNode;if(!b||b===this)return;lvl=+b.getAttribute('data-l');$('lvTxt').textContent='Nivel: '+LV[lvl].n;show('c')});
$('cW').addEventListener('click',function(){side=1;start()});
$('cB').addEventListener('click',function(){side=-1;start()});
$('cR').addEventListener('click',function(){side=Math.random()<.5?1:-1;start()});
$('cBack').addEventListener('click',menu);
$('bMenu').addEventListener('click',menu);
$('mMenu').addEventListener('click',menu);
$('mAgain').addEventListener('click',start);
$('bReset').addEventListener('click',start);
function labels(){for(var d=0;d<64;d++){var sq=flip?63-d:d,k=cells[d].childNodes;k[1].textContent=(d&7)===0?(8-(sq>>3)):'';k[2].textContent=d>=56?'abcdefgh'[sq&7]:''}}
function start(){wId++;clearTimeout(wTimer);E.reset();moves=[];sans=[];last=[-1,-1];sel=-1;targets={};over=false;thinking=false;promoMoves=null;flip=side===-1;
 $('ovEnd').className='ov';$('ovPromo').className='ov';$('hl').innerHTML='';
 for(var i=0;i<64;i++)cache[i].c='';
 show('g');labels();lg=E.legal();render();info('');upd();if(side===-1)botMove()}
function render(){var chk=-1,q,d,sq,p,cl,ch,pe;
 if(E.inCheck()){var t=E.turn()*6;for(q=0;q<64;q++)if(B[q]===t){chk=q;break}}
 for(d=0;d<64;d++){sq=flip?63-d:d;p=B[sq];cl='s '+((((sq>>3)+(sq&7))&1)?'dk':'lt');
  if(sq===sel)cl+=' sel';if(sq===last[0])cl+=' lm';if(sq===last[1])cl+=' lm dst';
  if(targets[sq])cl+=p?' cp':' mv';if(sq===chk)cl+=' ck';
  ch=cache[d];if(ch.c!==cl){ch.c=cl;cells[d].className=cl}
  if(ch.p!==p){ch.p=p;pe=cells[d].firstChild;pe.textContent=p?PC[p<0?-p:p]:'';pe.className='p '+(p>0?'w':'b')}}}
function info(t){$('info').textContent=t}
var NAMES=['','Peón','Caballo','Alfil','Torre','Dama','Rey'];
function caps(){var cnt=[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],i,p,t,init=[0,8,2,2,2,1],V=[0,1,3,3,5,9],lw='',lb='',vw=0,vb=0,n,k;
 for(i=0;i<64;i++){p=B[i];if(p){t=p<0?-p:p;if(t!==6)cnt[p>0?0:1][t]++}}
 for(t=5;t>=1;t--){n=init[t]-cnt[0][t];if(n<0)n=0;for(k=0;k<n;k++)lw+=PC[t];vw+=n*V[t];n=init[t]-cnt[1][t];if(n<0)n=0;for(k=0;k<n;k++)lb+=PC[t];vb+=n*V[t]}
 return{lw:lw,lb:lb,adv:vb-vw}}
function upd(){var cp=caps(),mine=side===1?cp.lb:cp.lw,theirs=side===1?cp.lw:cp.lb,ad=side===1?cp.adv:-cp.adv;
 $('meCap').textContent=mine+(ad>0?' +'+ad:'');$('aiCap').textContent=theirs+(ad<0?' +'+(-ad):'');
 $('aiNm').textContent='♚\uFE0E IA · '+LV[lvl].n;
 var mt=!over&&!thinking&&E.turn()===side;
 $('pcMe').className='pc'+(mt?' on':'');$('pcAi').className='pc'+(!over&&thinking?' on':'');
 var ch=$('chip');ch.textContent=over?'FIN':(thinking?'PENSANDO…':(mt?'TU TURNO':'TURNO IA'));ch.className='chip'+(thinking?' th':'');
 $('sLv').textContent=LV[lvl].n;$('sTn').textContent=E.turn()===1?'BLANCAS':'NEGRAS';$('sMv').textContent=moves.length}
function hist(){var h='',i;for(i=0;i<sans.length;i++)h+='<span>'+(i%2===0?(i/2+1)+'. ':(i>>1)+1+'... ')+sans[i]+'</span>';var el=$('hl');el.innerHTML=h;el.scrollTop=el.scrollHeight}
function histAdd(){var el=$('hl'),i=sans.length-1,s=document.createElement('span');s.textContent=(i%2===0?(i/2+1)+'. ':((i>>1)+1)+'... ')+sans[i];el.appendChild(s);el.scrollTop=el.scrollHeight}
function doMove(m){var s=E.san(m);E.make(m);moves.push(m);sans.push(s);last=[m&63,(m>>6)&63];sel=-1;targets={};
 var st=E.status();lg=st==='mate'||st==='stalemate'?[]:E.legal();
 render();histAdd();
 if(st){endGame(st);return}
 info(E.inCheck()?'¡Jaque!':'');upd();
 if(E.turn()!==side)botMove()}
function endGame(st){over=true;thinking=false;info('');upd();
 var t,x,k;stats=ldS();
 if(st==='mate'){if(E.turn()===side){t='💀 JAQUE MATE';x='La IA ('+LV[lvl].n+') te ganó esta vez.';stats.l[lvl]++}else{t='🏆 ¡JAQUE MATE!';x='¡Ganaste contra la IA en nivel '+LV[lvl].n+'!';stats.w[lvl]++}}
 else{t='🤝 TABLAS';x=st==='stalemate'?'Rey ahogado: no hay jugadas legales.':st==='fifty'?'Regla de los 50 movimientos.':st==='rep'?'Triple repetición de posición.':'Material insuficiente para dar mate.';stats.d[lvl]++}
 svS(stats);$('mT').textContent=t;$('mX').textContent=x+'  ('+moves.length+' jugadas)';
 setTimeout(function(){if(over)$('ovEnd').className='ov show'},650)}
function botMove(){if(over)return;thinking=true;upd();var id=++wId,o=LV[lvl].o;tStart=Date.now();
 setTimeout(function(){if(id!==wId)return;
  if(W){try{W.postMessage({id:id,moves:moves.slice(),o:o});wTimer=setTimeout(function(){if(id===wId&&thinking){killW();sync(id,o)}},o.time+6000);return}catch(e){killW()}}
  sync(id,o)},40)}
function sync(id,o){setTimeout(function(){if(id!==wId)return;var r=null;try{r=E.search(o)}catch(e){}apply(id,r?r.move:0)},20)}
function apply(id,m){if(id!==wId||!thinking)return;clearTimeout(wTimer);
 var wait=350-(Date.now()-tStart);
 if(wait>0){setTimeout(function(){apply2(id,m)},wait)}else apply2(id,m)}
function apply2(id,m){if(id!==wId||!thinking)return;thinking=false;var l=E.legal(),ok=false,i;
 for(i=0;i<l.length;i++)if(l[i]===m){ok=true;break}
 if(!ok){if(!l.length)return;m=l[Math.floor(Math.random()*l.length)]}
 doMove(m)}
boardEl.addEventListener('pointerdown',function(e){e.preventDefault();var t=e.target;while(t&&t!==boardEl&&!t.getAttribute('data-d'))t=t.parentNode;if(!t||t===boardEl)return;var d=+t.getAttribute('data-d');tap(flip?63-d:d)});
function tap(sq){if(thinking||over||E.turn()!==side||promoMoves)return;var p=B[sq],i,m;
 if(sel>=0&&targets[sq]){var ms=targets[sq];if(ms.length>1){promoMoves=ms;askPromo();return}doMove(ms[0]);return}
 if(p*side>0&&sq!==sel){sel=sq;targets={};var n=0;for(i=0;i<lg.length;i++){m=lg[i];if((m&63)===sq){var t=(m>>6)&63;(targets[t]=targets[t]||[]).push(m);n++}}
  info(NAMES[p<0?-p:p]+' seleccionado • '+(Object.keys(targets).length)+' movimientos');render();return}
 if(sel>=0){sel=-1;targets={};info('');render()}}
function askPromo(){var h='',L=[5,4,3,2],i;for(i=0;i<4;i++)h+='<button class="'+(side===1?'w':'b')+'" data-p="'+L[i]+'">'+PC[L[i]]+'</button>';$('prRow').innerHTML=h;$('ovPromo').className='ov show'}
$('prRow').addEventListener('click',function(e){var b=e.target;if(!b.getAttribute('data-p'))return;var p=+b.getAttribute('data-p'),i;
 for(i=0;i<promoMoves.length;i++)if(((promoMoves[i]>>12)&7)===p){var m=promoMoves[i];promoMoves=null;$('ovPromo').className='ov';doMove(m);return}});
$('ovPromo').addEventListener('click',function(e){if(e.target===this){promoMoves=null;this.className='ov'}});
$('bUndo').addEventListener('click',function(){
 var mineTurn=E.turn()===side&&!thinking,n;
 if(mineTurn)n=2;else if(thinking)n=1;else n=2;
 if(over)n=(E.turn()===side)?2:1;
 var minLen=side===1?0:1;
 if(moves.length-n<minLen){n=moves.length-minLen;if(n<=0)return}
 wId++;thinking=false;clearTimeout(wTimer);over=false;$('ovEnd').className='ov';
 while(n-->0){E.unmake();moves.pop();sans.pop()}
 var lm=moves.length?moves[moves.length-1]:-1;last=lm>=0?[lm&63,(lm>>6)&63]:[-1,-1];sel=-1;targets={};lg=E.legal();
 render();hist();info('');upd();
 if(E.turn()!==side)botMove()});
menu();
})();
</script>
</body>
</html>
`;

export default {
  names: [".ajedrez", ".chess"],
  desc: "Ajedrez contra la IA con 4 niveles de dificultad y elección de color",
  category: "Juegos",
  usage: ".ajedrez",
  handler: async ({ sock, from, msg }) => {
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("este Baileys no tiene sendHtml");
      const html = GAME_HTML.replaceAll("__FIRMA__", config.botNameShort || "MaxiProyec");
      await sock.sendHtml(from, html, [], undefined, {});
    } catch (e) {
      console.log("[AJEDREZ] ERROR: " + e.stack);
      await sock.sendMessage(from, { text: "❌ No se pudo enviar el juego: " + e.message }, { quoted: msg });
    }
  },
};
