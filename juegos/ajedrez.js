import { config } from "../motores/db.js";

const GAME_HTML = String.raw`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}html,body{margin:0;padding:0;background:#0a0f1e;color:#fff;font-family:Roboto,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none}#root{max-width:520px;margin:0 auto;padding:10px;position:relative;overflow:hidden}.hd{display:flex;align-items:center;gap:8px;margin-bottom:10px}.logo{width:40px;height:40px;flex:0 0 auto;border-radius:12px;background:#111a30;border:1px solid #243155;display:flex;align-items:center;justify-content:center;font-size:22px}.hdt{flex:1;min-width:0}.brand{font-size:8px;letter-spacing:1.5px;color:#ff4fa3;text-transform:uppercase;line-height:1.3}.ttl{font-size:18px;font-weight:900;letter-spacing:1px;line-height:1.1}.sub{font-size:10px;color:#8b97b5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sbtn{flex:0 0 auto;padding:8px 10px;border-radius:11px;border:1px solid #2a3860;background:#111a30;color:#b9c4e0;font-size:10px;font-weight:700;letter-spacing:.5px;font-family:inherit;cursor:pointer}.sbtn:active{background:#1a2748}.sbtn.sq{padding:7px 8px;font-size:14px;line-height:1}.card{background:linear-gradient(160deg,#111a30,#0b1224);border:1px solid #243155;border-radius:20px;padding:14px 12px;overflow:hidden}.hero{text-align:center;font-size:42px;line-height:1;margin:6px 0 8px}.h1{text-align:center;font-size:22px;font-weight:900}.h2{text-align:center;font-size:12px;color:#8b97b5;margin:6px 0 14px}.lab{font-size:10px;letter-spacing:1.5px;color:#8b97b5;font-weight:700;margin:6px 2px 8px}.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.opt{min-width:0;width:100%;overflow:hidden;background:linear-gradient(160deg,#16213d,#0f1830);border:1px solid #243155;border-radius:16px;padding:12px 10px;cursor:pointer;font-family:inherit;color:#fff;text-align:center}.opt:active{transform:scale(.97)}.opt .ic{font-size:26px;line-height:1.1}.opt .nm{font-size:15px;font-weight:900;margin-top:5px}.opt .ds{font-size:11px;color:#8b97b5;margin-top:3px;line-height:1.25}.opt .st{font-size:10px;color:#ffe66d;margin-top:7px;white-space:nowrap}.side{text-align:center;padding:18px 6px}.side .ic{font-size:38px}.side .nm{font-size:14px;font-weight:900;margin-top:8px;letter-spacing:.5px}.side .ds{font-size:11px;margin-top:4px;opacity:.65}.sw{background:linear-gradient(160deg,#f4f6fb,#c9d0e2);color:#111a30}.sb{background:linear-gradient(160deg,#243155,#16213d)}.wide{display:block;width:100%;min-width:0;margin-top:8px;padding:12px 6px;border-radius:13px;border:1px solid #243155;background:#111c38;color:#dbe3f7;font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;text-align:center}.wide:active{background:#1a2748}.pl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:6px}.pc{min-width:0;overflow:hidden;border:2px solid #243155;border-radius:13px;padding:7px 8px;background:#0f1830}.pc.on{border-color:#60a5fa;box-shadow:0 0 0 1px #60a5fa inset}.pc small{display:block;font-size:8px;letter-spacing:1px;color:#8b97b5;white-space:nowrap}.pc b{display:block;font-size:13px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pc i{display:block;font-style:normal;font-size:12px;min-height:15px;color:#9fb0d0;letter-spacing:-1px;white-space:nowrap;overflow:hidden}.chip{display:block;margin:0 auto 6px;width:max-content;max-width:100%;padding:6px 14px;border-radius:12px;background:#16264a;color:#9cc3ff;font-size:11px;font-weight:900;letter-spacing:1px;text-align:center;white-space:nowrap}.chip.th{animation:pul 1s infinite}@keyframes pul{50%{opacity:.45}}.bw{border-radius:14px;padding:5px;background:#0f1830;border:2px solid #1d2b50}#board{contain:layout style;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));grid-auto-rows:auto;width:100%;border-radius:8px;overflow:hidden;touch-action:manipulation}.s{position:relative;min-width:0;overflow:hidden;cursor:pointer}.s:before{content:"";display:block;padding-top:100%}.lt{background:#f0d9b5}.dk{background:#b58863}.s.lm{background-image:linear-gradient(rgba(255,214,10,.42),rgba(255,214,10,.42))}.s.sel{background-image:linear-gradient(rgba(80,170,255,.75),rgba(80,170,255,.75))}.s.ck{background-image:radial-gradient(circle,rgba(255,40,40,.95) 0,rgba(255,40,40,.5) 55%,rgba(255,40,40,0) 80%)}.s.mv:after{content:"";position:absolute;left:37%;top:37%;width:26%;height:26%;border-radius:50%;background:rgba(20,30,50,.38)}.s.cp:after{content:"";position:absolute;left:4%;top:4%;right:4%;bottom:4%;border-radius:50%;border:3px solid rgba(20,30,50,.38)}.p{font-style:normal;font-weight:400;line-height:1;position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:2;pointer-events:none;font-family:"Segoe UI Symbol","Noto Sans Symbols2","Noto Sans Symbols","DejaVu Sans",Arial,sans-serif}.p.w{color:#fff;text-shadow:0 0 1px #000,0 0 1px #000,0 0 2px #000,0 1px 2px rgba(0,0,0,.6)}.p.b{color:#1b1b1b;text-shadow:0 0 1px rgba(255,255,255,.55),0 1px 1px rgba(255,255,255,.25)}.dst .p{animation:pop .16s ease-out}@keyframes pop{0%{transform:scale(.7)}100%{transform:scale(1)}}.lb,.lf{position:absolute;font-size:8px;font-weight:700;text-decoration:none;z-index:1;pointer-events:none;line-height:1}.lb{left:3px;top:3px}.lf{right:3px;bottom:2px}.lt .lb,.lt .lf{color:#b58863}.dk .lb,.dk .lf{color:#f0d9b5}.info{text-align:center;font-size:11px;color:#8b97b5;margin:10px 0;min-height:15px}.tr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.tr div{min-width:0;overflow:hidden;text-align:center;border:1px solid #243155;border-radius:12px;padding:8px 2px;background:#0f1830;font-size:8px;letter-spacing:.5px;color:#8b97b5;white-space:nowrap}.tr b{display:block;font-size:13px;color:#fff;margin-top:3px;letter-spacing:0;overflow:hidden;text-overflow:ellipsis}.hist{margin-top:8px;border:1px solid #243155;border-radius:14px;padding:9px 10px;background:#0f1830}.hist small{font-size:9px;letter-spacing:1.5px;color:#8b97b5}#hl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;max-height:92px;overflow-y:auto;-webkit-overflow-scrolling:touch}#hl span{padding:4px 8px;border-radius:8px;background:#16264a;color:#bcd2ff;font-size:11px}.acts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px}.acts .wide{margin-top:0;padding:11px 4px;font-size:12px}.foot{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 0 2px;font-size:10px;color:#7d89a8}.ov{position:absolute;left:0;top:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(6,9,18,.9);z-index:50}.ov.show{display:flex}.md{width:100%;max-width:330px;text-align:center;background:#111a30;border:2px solid #ff4fa3;border-radius:18px;padding:16px;box-shadow:0 0 35px rgba(255,79,163,.25)}.mt{font-size:22px;font-weight:900;color:#ff4fa3}.mx{font-size:13px;color:rgba(255,255,255,.72);margin:8px 0 14px;line-height:1.6}.mb{width:100%;padding:12px;margin-top:7px;border-radius:12px;border:1px solid #ff4fa3;background:rgba(255,79,163,.1);color:#ff4fa3;font-weight:900;font-size:13px;cursor:pointer;font-family:inherit}.mb:active{background:rgba(255,79,163,.22)}.pr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:6px}.pr button{height:54px;border-radius:12px;border:1px solid #2a3860;background:#16213d;font-size:30px;line-height:1;padding:0;cursor:pointer;font-family:"Segoe UI Symbol","Noto Sans Symbols2","DejaVu Sans",Arial,sans-serif}.pr button.w{color:#fff;text-shadow:0 0 2px #000}.pr button.b{color:#222;background:#cfd6e6}.hide{display:none!important}</style>
</head>
<body>
<div id="root">
<div class="hd"><div class="logo">♞&#xFE0E;</div><div class="hdt"><div class="brand">MAXIPROYEC · CHESS LAB</div><div class="ttl">AJEDREZ</div><div class="sub">Motor de ajedrez</div></div><button id="bSnd" class="sbtn sq">🔊</button><button id="bMenu" class="sbtn hide">MENÚ</button></div>
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
<div class="pc" id="pcMe"><small>JUGADOR</small><b>TÚ</b><i id="meCap"></i></div>
</div>
<div id="chip" class="chip">TU TURNO</div>
<div class="bw"><div id="board"></div></div>
<div id="info" class="info"></div>
<div class="tr"><div>NIVEL<b id="sLv">Fácil</b></div><div>TURNO<b id="sTn">BLANCAS</b></div><div>JUGADAS<b id="sMv">0</b></div></div>
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
var TTN=1<<18,TTM=TTN-1,ttKey=null,ttMove,ttScore,ttDepth,ttFlag;
function allocTT(){ttKey=new Int32Array(TTN);ttMove=new Int32Array(TTN);ttScore=new Int16Array(TTN);ttDepth=new Int8Array(TTN);ttFlag=new Int8Array(TTN)}
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
v=-qs(-beta,-
