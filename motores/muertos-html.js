const PLANTILLA = String.raw`<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html{background:#12061f;overflow-x:hidden}
body{--bg:#1a0a2e;--card:#2a1146;--card2:#1e0b34;--line:#6b2d8f;--mar:#ffa21f;--mar2:#ffd36b;--mag:#e0338c;--tea:#2fe0c8;--txt:#fff4e0;--mut:#d2b6e8;--ok:#ffd36b;
background:radial-gradient(120% 40% at 50% 0,#4a1a6e,transparent 62%),linear-gradient(180deg,var(--bg),#0b0414);color:var(--txt);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.35;min-height:100vh;padding:12px 12px 22px;overflow-x:hidden;overscroll-behavior:none}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none;text-align:inherit}
.w{width:100%;position:relative;z-index:1;transition:filter .25s}.w.bl{filter:blur(5px)}
h1,h2,b,small,span,p,div{overflow-wrap:anywhere;word-break:normal}
.pt{position:fixed;top:-24px;z-index:0;pointer-events:none;width:11px;height:15px;border-radius:70% 0 70% 0;background:#ffa21f;opacity:.8;animation:fall linear infinite}
@keyframes fall{to{transform:translate(var(--dx),110vh) rotate(540deg)}}
.pk{display:block;width:100%;height:62px}
.pk .f{transform-box:fill-box;transform-origin:50% 0;animation:sway 3.4s ease-in-out infinite}
@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.hero{text-align:center;padding:4px 4px 0}
.hero h1{font-size:32px;line-height:1.05;letter-spacing:.5px;color:var(--mar2);text-shadow:0 0 18px rgba(255,162,31,.55),0 2px 0 #7a2c00}
.hero h1 span{display:block;font-size:12px;letter-spacing:4px;color:var(--mag);text-shadow:none;font-weight:800;margin-bottom:4px}
.hero h1 em{font-style:normal;font-size:22px;vertical-align:middle;margin:0 4px}
.hero p{color:var(--mut);margin-top:6px;font-size:12.5px}
.altar{display:block;width:100%;height:auto;margin:10px 0 6px;border-radius:22px;border:2px solid var(--mar);box-shadow:0 0 0 3px #12061f,0 0 0 4.5px var(--line),0 0 30px rgba(255,140,0,.22)}
.fl{animation:flame 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.fl.b{animation-delay:.45s}
@keyframes flame{0%,100%{transform:scale(1,1);opacity:1}35%{transform:scale(.88,1.12);opacity:.88}70%{transform:scale(1.06,.94);opacity:1}}
.wg{transform-box:fill-box;transform-origin:100% 50%;animation:flap .55s ease-in-out infinite}
@keyframes flap{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.3)}}
.tx{text-align:center;color:var(--mut);font-size:12.5px;line-height:1.5;padding:2px 6px 12px}
.tx b{color:var(--mar2)}
.dv{display:flex;align-items:center;gap:8px;margin:2px 0 12px;font-size:15px;justify-content:center}
.dv i{flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,var(--mar),transparent)}
.ev{background:var(--card);border:2px solid var(--mar);border-radius:26px;padding:20px 13px 16px;position:relative;box-shadow:0 0 24px rgba(255,162,31,.2)}
.ev:before{content:"";position:absolute;left:22px;right:22px;top:6px;height:7px;background:linear-gradient(135deg,var(--mag) 25%,transparent 25%) -7px 0/14px 14px,linear-gradient(225deg,var(--mag) 25%,transparent 25%) -7px 0/14px 14px;opacity:.85}
.cr{position:absolute;font-size:24px;line-height:1}.cr.a{top:-13px;left:14px}.cr.b{top:-13px;right:14px}.cr.c{bottom:-13px;left:14px}.cr.d{bottom:-13px;right:14px}
.evh{display:flex;gap:10px;align-items:center;margin:4px 0 10px}
.evh .i{flex:none;width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--card2);border:2px solid var(--mar)}
.evh .tt{flex:1;min-width:0}
.evh h2{font-size:17px;line-height:1.15;color:var(--mar2)}
.evh p{color:var(--mut);font-size:12px;margin-top:2px}
.q{flex:none;width:38px;height:38px;border-radius:50%;background:var(--mar);color:#2a1040;font-size:20px;font-weight:900;text-align:center;line-height:38px;box-shadow:0 0 14px rgba(255,162,31,.55)}
.big{display:flex;align-items:baseline;justify-content:center;gap:6px;margin:4px 0 2px}
.big b{font-size:36px;color:var(--mar2);text-shadow:0 0 14px rgba(255,162,31,.45)}
.big small{color:var(--mut);font-size:15px;font-weight:700}
.pc{text-align:center;color:var(--mut);font-size:12px;margin-bottom:12px}
.barw{padding:0 6px;margin-bottom:4px}
.bar{height:28px;border-radius:15px;background:var(--card2);border:2px solid var(--mar);overflow:hidden}
.bar i{display:block;height:100%;width:0;border-radius:13px;background:repeating-linear-gradient(115deg,#ff8a00 0 10px,#ffc14d 10px 20px);background-size:200% 100%;animation:flow 3.5s linear infinite;box-shadow:0 0 14px rgba(255,162,31,.7);transition:width .9s ease}
@keyframes flow{to{background-position:-40px 0}}
.mk{position:relative;height:44px;margin:3px 6px 0}
.mk div{position:absolute;top:0;transform:translateX(-50%);text-align:center;width:40px}
.mk div.z{transform:translateX(-100%)}
.mk .e{display:block;font-size:19px;line-height:1;filter:grayscale(1);opacity:.5}
.mk .on .e{filter:none;opacity:1}
.mk .t{display:block;font-size:10px;color:var(--mut);margin-top:2px;font-weight:700}
.mk .on .t{color:var(--ok)}
.chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0 12px}
.chip{padding:4px 10px;border-radius:20px;background:var(--card2);border:1px solid var(--line);font-size:12px}
.me{border:1.5px dashed var(--mag);border-radius:16px;padding:10px 11px;margin-bottom:12px;background:rgba(224,51,140,.08)}
.me .r{display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:13.5px}
.me .r em{font-style:normal;color:var(--ok);white-space:nowrap}
.me .s{height:8px;border-radius:5px;background:rgba(255,255,255,.12);margin:7px 0 6px;overflow:hidden}
.me .s i{display:block;height:100%;background:var(--mag);border-radius:5px}
.me.ok{border-color:var(--ok);background:rgba(255,211,107,.08)}.me.ok .s i{background:var(--ok)}
.me p{font-size:12px;color:var(--mut);line-height:1.4}
.sub{font-weight:800;font-size:14px;margin:12px 2px 8px;color:var(--mar2)}.sub small{display:block;color:var(--mut);font-weight:600;font-size:11.5px;margin-top:1px}
.ph{border-radius:16px;background:var(--card2);border:1.5px solid var(--line);margin-bottom:8px;overflow:hidden}
.ph.un{border-color:var(--mar)}.ph.rc{border-color:var(--ok);box-shadow:0 0 14px rgba(255,211,107,.2)}
.hd{display:flex;gap:10px;align-items:center;width:100%;padding:10px}
.m{flex:none;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:21px;background:var(--card);border:2px solid var(--mar)}
.ph.lk .m{border-color:var(--line);filter:grayscale(1);opacity:.6}
.in{flex:1;min-width:0}
.in b{display:block;font-size:14px;line-height:1.2}
.in small{display:block;font-size:11.5px;color:var(--mut);margin-top:2px}
.st{font-weight:800;color:var(--mut)}.ph.un .st{color:var(--mar2)}.ph.rc .st{color:var(--ok)}
.ch{flex:none;font-size:14px;color:var(--mar);transition:transform .2s}.ph.op .ch{transform:rotate(180deg)}
.bo{display:none;padding:0 12px 12px 12px;font-size:12.5px;color:var(--mut);line-height:1.45}.ph.op .bo{display:block}
.bo p{margin-bottom:6px}
.pr{color:var(--txt);background:rgba(255,162,31,.1);border:1px solid rgba(255,162,31,.3);border-radius:12px;padding:8px 10px;line-height:1.55}
.ob{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.ob button{position:relative;text-align:center;padding:8px 1px 6px;border-radius:14px;background:var(--card2);border:1.5px solid var(--mar)}
.ob button.lk{border-color:var(--line)}.ob button.lk b{filter:grayscale(1);opacity:.4}
.ob b{display:block;font-size:24px;line-height:1.1}
.ob small{display:block;font-size:10px;color:var(--mut);margin-top:3px}
.ob u{position:absolute;top:-7px;right:-3px;text-decoration:none;font-size:9.5px;font-weight:900;background:var(--mag);color:#fff;border-radius:9px;padding:1px 5px}
.bd{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
.bd button{display:flex;gap:7px;align-items:center;padding:9px;border-radius:14px;background:var(--card2);border:1.5px solid var(--mar);font-size:12px;font-weight:800;line-height:1.2}
.bd button.lk{border-color:var(--line);color:var(--mut)}.bd button.lk i{opacity:.5;filter:grayscale(1)}
.bd i{font-style:normal;font-size:20px;flex:none}
.pie{margin-top:14px;text-align:center;color:var(--mut);font-size:12px}.pie span{display:block;font-size:16px;margin-bottom:3px;letter-spacing:4px}
#md{position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(10,3,20,.5);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}
#md.on{display:flex}
.mc{position:relative;width:100%;max-width:420px;max-height:88vh;overflow-y:auto;background:var(--card);border:2px solid var(--mar);border-radius:24px;padding:22px 16px 16px;box-shadow:0 0 34px rgba(255,162,31,.35);animation:pop .22s ease}
@keyframes pop{from{transform:scale(.9);opacity:0}}
.mc .x{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;background:var(--card2);border:1.5px solid var(--line);text-align:center;line-height:29px;font-size:15px}
.mc h3{font-size:18px;color:var(--mar2);text-align:center;margin:0 28px 4px}
.mc .bg2{font-size:44px;text-align:center;line-height:1.1;margin-bottom:4px}
.mc .tg{text-align:center;font-size:12px;font-weight:800;color:var(--mut);margin-bottom:10px}.mc .tg.ok{color:var(--ok)}
.mc p{font-size:13px;color:var(--mut);line-height:1.5;margin-bottom:8px}.mc p b{color:var(--mar2)}
.mc .fx{background:rgba(224,51,140,.1);border:1.5px dashed var(--mag);border-radius:14px;padding:9px 11px;color:var(--txt)}
.mc ol{list-style:none;counter-reset:s}
.mc li{counter-increment:s;position:relative;padding:0 0 10px 34px;font-size:13px;color:var(--mut);line-height:1.45}
.mc li:before{content:counter(s);position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:var(--mar);color:#2a1040;font-weight:900;font-size:12px;text-align:center;line-height:24px}
.mc li b{color:var(--mar2)}
@media (prefers-reduced-motion:reduce){.pk .f,.fl,.bar i,.wg,.pt{animation:none}}
</style></head><body><div class="w" id="w">
<svg class="pk" id="pk" viewBox="0 0 360 62" preserveAspectRatio="none" aria-hidden="true"></svg>
<div class="hero"><h1><span>🌼 1 Y 2 DE NOVIEMBRE 🌼</span>Día de Muertos</h1><p>Tradición viva de México: recordar y celebrar a quienes ya partieron</p></div>
<svg class="altar" viewBox="0 0 360 300" role="img" aria-label="Altar de muertos con catrina, calaveras, velas y flores de cempasúchil">
<defs>
<linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1560"/><stop offset="1" stop-color="#150726"/></linearGradient>
<radialGradient id="gl" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#ffb347" stop-opacity=".5"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<g id="fz"><g fill="#ffa21f"><ellipse cy="-5.5" rx="3.4" ry="5"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(45)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(90)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(135)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(180)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(225)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(270)"/><ellipse cy="-5.5" rx="3.4" ry="5" transform="rotate(315)"/></g><circle r="3.2" fill="#e06a00"/><circle r="1.4" fill="#ffd36b"/></g>
<g id="vl"><rect x="-4" y="-22" width="8" height="22" rx="1.5" fill="#fff4e0"/><rect x="-4" y="-22" width="8" height="3" fill="#e9d3b8"/><rect x="-.6" y="-27" width="1.2" height="5" fill="#3a2a1a"/><path class="fl" d="M0 -39C-4 -33 -4 -29 0 -26C4 -29 4 -33 0 -39Z" fill="#ffb020"/><path class="fl b" d="M0 -35C-2 -32 -2 -30 0 -28C2 -30 2 -32 0 -35Z" fill="#fff2a8"/></g>
<g id="sk"><ellipse cy="-1" rx="12" ry="14" fill="#fff4e0" stroke="#e0338c" stroke-width="1.3"/><circle cx="-5" cy="-3" r="4" fill="#1a0a2e" stroke="#2fe0c8" stroke-width="1.4"/><circle cx="5" cy="-3" r="4" fill="#1a0a2e" stroke="#ffa21f" stroke-width="1.4"/><path d="M0 2L-1.7 6H1.7Z" fill="#1a0a2e"/><path d="M-6 9Q0 12 6 9" fill="none" stroke="#1a0a2e" stroke-width="1"/><path d="M-3.5 9.6V12M0 10.4V12.6M3.5 9.6V12" stroke="#1a0a2e" stroke-width=".9"/><circle cx="-9" cy="3" r="1.6" fill="#e0338c"/><circle cx="9" cy="3" r="1.6" fill="#2fe0c8"/><path d="M-3 -11Q0 -14 3 -11" fill="none" stroke="#ffa21f" stroke-width="1.2"/></g>
<g id="pn"><ellipse cy="-6" rx="14" ry="8" fill="#e8a45c"/><path d="M-10 -9C-4 -13 4 -13 10 -9" fill="none" stroke="#fff4e0" stroke-width="2.2" stroke-linecap="round"/><circle cy="-13.5" r="2.6" fill="#fff4e0"/></g>
<g id="mo"><g transform="scale(-1,1)"><g class="wg"><path d="M0 0C-4-9-13-10-15-3C-16 3-9 5 0 1Z" fill="#ff8a00" stroke="#1a0a2e" stroke-width=".8"/><path d="M0 1C-7 4-11 10-6 12C-2 12 0 7 0 1Z" fill="#ffb347" stroke="#1a0a2e" stroke-width=".7"/><circle cx="-9" cy="-3" r="1" fill="#fff4e0"/></g></g><g class="wg"><path d="M0 0C-4-9-13-10-15-3C-16 3-9 5 0 1Z" fill="#ff8a00" stroke="#1a0a2e" stroke-width=".8"/><path d="M0 1C-7 4-11 10-6 12C-2 12 0 7 0 1Z" fill="#ffb347" stroke="#1a0a2e" stroke-width=".7"/><circle cx="-9" cy="-3" r="1" fill="#fff4e0"/></g><rect x="-.8" y="-3" width="1.6" height="13" rx=".8" fill="#1a0a2e"/></g></defs>
<rect width="360" height="300" fill="url(#gA)"/>
<ellipse cx="180" cy="125" rx="175" ry="135" fill="url(#gl)"/>
<g id="ar"></g>
<g fill="#fff4e0" opacity=".85"><circle cx="38" cy="30" r="1.3"/><circle cx="318" cy="46" r="1.1"/><circle cx="60" cy="86" r="1"/><circle cx="300" cy="96" r="1.4"/><circle cx="24" cy="130" r="1"/></g>
<rect x="112" y="124" width="136" height="32" fill="#8e2bb5"/><rect x="112" y="124" width="136" height="4" fill="#b457d8"/>
<rect x="72" y="156" width="216" height="40" fill="#c0348f"/><rect x="72" y="156" width="216" height="4" fill="#e55cb2"/>
<rect x="32" y="196" width="296" height="50" fill="#e0652e"/><rect x="32" y="196" width="296" height="4" fill="#ff9159"/>
<path d="M32 242L40 232L48 242L56 232L64 242L72 232L80 242L88 232L96 242L104 232L112 242L120 232L128 242L136 232L144 242L152 232L160 242L168 232L176 242L184 232L192 242L200 232L208 242L216 232L224 242L232 232L240 242L248 232L256 242L264 232L272 242L280 232L288 242L296 232L304 242L312 232L320 242L328 232V246H32Z" fill="#ffd36b" opacity=".55"/>
<g><path d="M158 124V108Q180 100 202 108V124Z" fill="#e0338c"/><path d="M170 108Q180 114 190 108L186 100H174Z" fill="#ffa21f"/>
<ellipse cx="180" cy="74" rx="19" ry="23" fill="#fff4e0" stroke="#e0338c" stroke-width="1.4"/>
<circle cx="173" cy="72" r="5.4" fill="#1a0a2e" stroke="#2fe0c8" stroke-width="1.6"/><circle cx="187" cy="72" r="5.4" fill="#1a0a2e" stroke="#ffa21f" stroke-width="1.6"/>
<path d="M180 79L177.6 85H182.4Z" fill="#1a0a2e"/><path d="M172 92Q180 97 188 92" fill="none" stroke="#1a0a2e" stroke-width="1.2"/><path d="M175 92.6V97M180 94V98.4M185 92.6V97" stroke="#1a0a2e" stroke-width="1"/>
<circle cx="166" cy="82" r="2.2" fill="#e0338c"/><circle cx="194" cy="82" r="2.2" fill="#2fe0c8"/>
<ellipse cx="180" cy="55" rx="38" ry="8.5" fill="#2a1040" stroke="#ffd36b" stroke-width="1.2"/><path d="M164 55Q164 36 180 34Q196 36 196 55Z" fill="#2a1040" stroke="#ffd36b" stroke-width="1.2"/><rect x="164" y="47" width="32" height="5" fill="#e0338c"/>
<path d="M196 40Q214 26 220 38Q212 42 200 46Z" fill="#2fe0c8"/><path d="M198 42Q210 34 216 38" fill="none" stroke="#fff4e0" stroke-width="1"/>
<use href="#fz" x="160" y="52" transform="translate(160 52) scale(.62) translate(-160 -52)"/><use href="#fz" x="200" y="53" transform="translate(200 53) scale(.62) translate(-200 -53)"/></g>
<use href="#vl" x="136" y="124"/><use href="#vl" x="224" y="124"/>
<use href="#sk" x="92" y="153" transform="translate(92 153) scale(.82) translate(-92 -153)"/><use href="#sk" x="268" y="153" transform="translate(268 153) scale(.82) translate(-268 -153)"/>
<use href="#vl" x="122" y="156"/><use href="#vl" x="238" y="156"/>
<use href="#fz" x="152" y="150"/><use href="#fz" x="208" y="150"/>
<rect x="161" y="168" width="38" height="46" rx="3" fill="#ffd36b"/><rect x="165" y="172" width="30" height="38" fill="#2a1040"/><circle cx="180" cy="186" r="7" fill="#d2b6e8"/><path d="M168 210Q180 193 192 210Z" fill="#d2b6e8"/>
<use href="#pn" x="116" y="196"/><use href="#pn" x="244" y="196"/>
<use href="#fz" x="54" y="190"/><use href="#fz" x="82" y="192"/><use href="#fz" x="278" y="192"/><use href="#fz" x="306" y="190"/>
<use href="#vl" x="140" y="196"/><use href="#vl" x="220" y="196"/>
<g id="pt"></g><use href="#mo" transform="translate(48 64) rotate(-18) scale(1.05)"/><use href="#mo" transform="translate(312 70) rotate(16) scale(.9)"/><use href="#mo" transform="translate(300 150) rotate(10) scale(.75)"/><use href="#mo" transform="translate(58 140) rotate(-12) scale(.7)"/>
</svg>
<p class="tx">Cada año, el <b>1 y 2 de noviembre</b>, las familias mexicanas montan <b>altares</b> con cempasúchil, velas, pan de muerto, calaveritas de azúcar y fotos de sus seres queridos para recibirlos con cariño. La <b>Catrina</b>, nacida del grabado de José Guadalupe Posada, recuerda que la muerte también se celebra.</p>
<div class="dv"><i></i>🌼 💀 🌼<i></i></div>
<section class="ev" id="ev"></section>
<div class="pie"><span>🌼 💀 🕯️ 💀 🌼</span>__FIRMA__</div></div>
<div id="md"><div class="mc" id="mc"></div></div>
<script>
(function(){
var D=__DATA__,NS='http://www.w3.org/2000/svg',M={};
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return Number(n).toLocaleString('en-US')}
function fk(n){return n>=1000?(Math.round(n/100)/10)+'k':String(n)}
function pct(a,b){return b?Math.max(0,Math.min(100,a/b*100)):0}
function banderas(){
var cols=['#e0338c','#ffa21f','#2fe0c8','#a35bff','#ffd36b','#ff5d73'],h='<path d="M0 3Q180 14 360 3" stroke="#ffd36b" stroke-width="1.3" fill="none"/>',i,x,y,c,n=11,w=28;
for(i=0;i<n;i++){x=6+i*(348/(n-1))-w/2;y=3+Math.sin(i/(n-1)*Math.PI)*5.5;c=cols[i%cols.length];
h+='<g class="f" style="animation-delay:-'+(i*.37).toFixed(2)+'s"><g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+')"><path d="M0 0H'+w+'V42L'+(w*.83)+' 48L'+(w*.66)+' 42L'+(w*.5)+' 48L'+(w*.33)+' 42L'+(w*.16)+' 48L0 42Z" fill="'+c+'"/><circle cx="'+w/2+'" cy="14" r="5" fill="#1a0a2e" opacity=".8"/><path d="M'+(w/2)+' 21L'+(w/2+4)+' 26L'+(w/2)+' 31L'+(w/2-4)+' 26Z" fill="#1a0a2e" opacity=".8"/><circle cx="5" cy="6" r="1.8" fill="#1a0a2e" opacity=".8"/><circle cx="'+(w-5)+'" cy="6" r="1.8" fill="#1a0a2e" opacity=".8"/><circle cx="'+(w/2)+'" cy="38" r="1.6" fill="#1a0a2e" opacity=".8"/></g></g>'}
$('pk').innerHTML=h}
function arco(){
var g=$('ar'),i,n=17,a,x,y,u;
for(i=0;i<n;i++){a=Math.PI*(1-i/(n-1));x=180+Math.cos(a)*158;y=232-Math.sin(a)*205;
u=document.createElementNS(NS,'use');u.setAttribute('href','#fz');u.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+(1.15+(i%3)*.12).toFixed(2)+')');g.appendChild(u)}
var p=$('pt'),k,r;
for(k=0;k<26;k++){r=document.createElementNS(NS,'ellipse');r.setAttribute('cx',(36+k*11.4).toFixed(1));r.setAttribute('cy',(256+Math.sin(k*1.7)*7+(k%2)*5).toFixed(1));r.setAttribute('rx','4.5');r.setAttribute('ry','2.4');r.setAttribute('fill',k%3?'#ffa21f':'#ffd36b');r.setAttribute('opacity','.9');r.setAttribute('transform','rotate('+((k*37)%60-30)+' '+(36+k*11.4).toFixed(1)+' 258)');p.appendChild(r)}}
function petalos(){
var i,s,cs=['#ffa21f','#ffc14d','#ff8a00','#ffd36b'];
for(i=0;i<12;i++){s=document.createElement('span');s.className='pt';
s.style.left=(4+i*8.2)+'%';s.style.background=cs[i%4];s.style.animationDuration=(9+(i*7)%7)+'s';s.style.animationDelay='-'+((i*3)%9)+'s';s.style.setProperty('--dx',((i%2?1:-1)*(20+(i*13)%50))+'px');document.body.appendChild(s)}}
function restante(){
var ms=D.fin-Date.now();if(ms<=0)return 'Evento finalizado';
var d=Math.floor(ms/86400000),h=Math.floor(ms%86400000/3600000);
return d>0?'Termina en '+d+' d '+h+' h':'Termina en '+h+' h '+Math.floor(ms%3600000/60000)+' min'}
function premios(f){return f.premio.map(function(x){return x.i+' '+esc(x.t)}).join(', ')}
function evento(){
var i,f,h,tot=Math.min(D.total,D.meta),p=pct(tot,D.meta),falta=Math.max(0,D.minimo-D.n),ab=-1;
h='<i class="cr a">🌼</i><i class="cr b">🌼</i><i class="cr c">💀</i><i class="cr d">💀</i>';
h+='<div class="evh"><div class="i">🌼</div><div class="tt"><h2>Ofrenda de la Comunidad</h2><p>'+fmt(D.meta)+' comandos de economía entre todos</p></div><button class="q" data-m="how" aria-label="Cómo participar">?</button></div>';
h+='<div class="big"><b>'+fmt(tot)+'</b><small>/ '+fmt(D.meta)+'</small></div><div class="pc">'+Math.floor(p)+'% completado'+(D.total>=D.meta?' · ¡Meta lograda!':'')+'</div>';
h+='<div class="barw"><div class="bar"><i id="fl"></i></div></div><div class="mk">';
for(i=0;i<D.fases.length;i++){f=D.fases[i];var q=pct(f.umbral,D.meta);
h+='<div class="'+(f.desbloqueada?'on':'')+(q>90?' z':'')+'" style="left:'+q.toFixed(2)+'%"><span class="e">'+f.emoji+'</span><span class="t">'+fk(f.umbral)+'</span></div>'}
h+='</div><div class="chips"><span class="chip">👥 '+fmt(D.participantes)+' participantes</span><span class="chip">🕯️ '+fmt(D.calificados)+' ya califican</span><span class="chip">⏳ '+restante()+'</span></div>';
h+='<div class="me'+(D.califica?' ok':'')+'"><div class="r"><span>🕯️ Tus comandos de economía</span><em>'+fmt(Math.min(D.n,D.minimo))+' / '+fmt(D.minimo)+(D.califica?' ✔':'')+'</em></div><div class="s"><i style="width:'+pct(D.n,D.minimo)+'%"></i></div><p>'+(D.califica?'Ya calificas, '+esc(D.nombre)+'. Recibes los premios de cada fase que la comunidad desbloquee.':'Te faltan <b>'+fmt(falta)+'</b> comandos de economía para recibir los premios de las fases desbloqueadas.')+'</p></div>';
h+='<div class="dv"><i></i>🎁<i></i></div><div class="sub">Premios por fase<small>Toca una fase para ver sus premios</small></div>';
for(i=0;i<D.fases.length;i++){if(ab<0&&!D.fases[i].desbloqueada)ab=i}
for(i=0;i<D.fases.length;i++){f=D.fases[i];
var cl=f.entregada?'rc':f.desbloqueada?'un':'lk',et=f.entregada?'✔ Recibida':f.desbloqueada?(D.califica?'🎁 Se entrega al usar un comando':'🔓 Desbloqueada'):'🔒 Bloqueada';
h+='<div class="ph '+cl+(i===ab?' op':'')+'"><button class="hd" data-p="1"><span class="m">'+f.emoji+'</span><span class="in"><b>Fase '+f.id+' · '+esc(f.nombre)+'</b><small><span class="st">'+et+'</span> · '+fk(f.umbral)+' comandos</small></span><span class="ch">▼</span></button><div class="bo"><p>'+esc(f.desc)+(f.desbloqueada?'':' <b>Faltan '+fmt(f.umbral-D.total)+' comandos.</b>')+'</p><div class="pr">'+premios(f)+'</div></div></div>'}
h+='<div class="dv"><i></i>🏺<i></i></div><div class="sub">Objetos exclusivos<small>Solo existen en este evento · toca uno para ver qué hace'+(D.bono>0?' · Bono al daily activo: +'+D.bono+'%':'')+'</small></div><div class="ob">';
D.objetos.forEach(function(o,k){h+='<button class="'+(o.tiene?'':'lk')+'" data-m="o'+k+'">'+(o.bono?'<u>+'+o.bono+'%</u>':'')+'<b>'+o.emoji+'</b><small>'+esc(o.nombre.split(' ')[0])+'</small></button>'});
h+='</div><div class="bd">';
D.insignias.forEach(function(b,k){h+='<button class="'+(b.tiene?'':'lk')+'" data-m="i'+k+'"><i>'+(b.tiene?b.emoji:'🔒')+'</i><span>'+esc(b.nombre)+'</span></button>'});
h+='</div>';
$('ev').innerHTML=h;
setTimeout(function(){var b=$('fl');if(b)b.style.width=p+'%'},80)}
function modales(){
var h='<ol><li>Usa <b>comandos de economía</b>: cada uno de cualquier usuario suma 1 a la barra (máximo 1 por persona cada '+D.esperaSeg+' segundos).</li><li>Cuando la barra llega a la meta de una fase, <b>se desbloquea para toda la comunidad</b>.</li><li>Para recibir los premios necesitas al menos <b>'+fmt(D.minimo)+' comandos propios</b>, sean usuarios nuevos o antiguos.</li><li>Los premios llegan solos al usar un comando de economía o con <b>.muertos</b>.</li><li>Las fases 3, 4 y 5 entregan una <b>waifu de Halloween exclusiva</b> del evento y la fase 5 trae la mejor recompensa.</li><li>La <b>Vela de Ofrenda</b> y la <b>Catrina Eterna</b> dan un bono extra a tu <b>.daily</b>.</li></ol>';
M.how={t:'Cómo se participa',e:'🕯️',h:h};
D.objetos.forEach(function(o,k){
M['o'+k]={t:o.nombre,e:o.emoji,g:o.tiene?'✔ Ya lo tienes':'🔒 Aún no lo tienes',ok:o.tiene,h:'<p><b>Cómo se consigue:</b> '+esc(o.como)+'</p><p class="fx"><b>Efecto:</b> '+esc(o.efecto)+'</p>'}});
D.insignias.forEach(function(b,k){
M['i'+k]={t:b.nombre,e:b.emoji,g:b.tiene?'✔ Insignia conseguida':'🔒 Aún no la tienes',ok:b.tiene,h:'<p>'+esc(b.desc)+'</p><p>Es una insignia exclusiva del evento y se muestra en tu perfil.</p>'}})}
function abrir(k){
var m=M[k];if(!m)return;
$('mc').innerHTML='<button class="x" data-c="1" aria-label="Cerrar">✕</button><div class="bg2">'+m.e+'</div><h3>'+esc(m.t)+'</h3>'+(m.g?'<div class="tg'+(m.ok?' ok':'')+'">'+m.g+'</div>':'<div class="tg">Ofrenda de Día de Muertos 2026</div>')+m.h;
$('md').className='on';$('w').className='w bl'}
function cerrar(){$('md').className='';$('w').className='w'}
document.addEventListener('click',function(e){
var t=e.target,b;
if(t.id==='md'){cerrar();return}
b=t.closest?t.closest('[data-c],[data-m],[data-p]'):null;if(!b)return;
if(b.hasAttribute('data-c'))cerrar();
else if(b.hasAttribute('data-m'))abrir(b.getAttribute('data-m'));
else b.parentNode.classList.toggle('op')});
banderas();arco();petalos();evento();modales();
})();
</script></body></html>
`;

export function htmlMuertos(datos) {
  const json = JSON.stringify(datos).replace(/</g, "\\u003c");
  return PLANTILLA
    .replace("__FIRMA__", () => datos.firma)
    .replace("__DATA__", () => json);
}
