// juegos/gatohtml.js
//
// GATO en HTML real (rich response de WhatsApp / "Meta AI"), como el .gato
// de tu amigo. El juego corre DENTRO del mensaje: el bot solo lo envia una
// vez, y todas las jugadas, el bot rival, el marcador y el sonido se hacen en
// el celular con JavaScript. Por eso es fluido (no manda mensajes por jugada).
//
// Es 100% aparte de gato.js / gatoreal.js: si falla, no afecta a los demas.
//
// Formato: botForwardedMessage > richResponseMessage > unifiedResponse con un
// primitive "FOAHtmlPrimitiveDemoDONOTUSE" (formato interno de WhatsApp, sin
// documentacion oficial: puede dejar de funcionar segun la version de la app).
import crypto from "crypto";
// Import dinamico a proposito: si el paquete no existe o no exporta algo, NO se cae el bot al cargar.
let generarMensaje = null;
for (const paquete of ["@fer2809fl/baileys", "@whiskeysockets/baileys", "baileys"]) {
  try {
    const B = await import(paquete);
    generarMensaje = B.generateWAMessageFromContent || B.default?.generateWAMessageFromContent || null;
    if (generarMensaje) break;
  } catch (e) {}
}

const HTML_GATO = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { width: 100%; margin: 0; overflow-x: hidden; }
  body { padding: 6px; min-height: 540px; background: #03030a; color: #cfe9ff;
         font-family: "Courier New", monospace; touch-action: manipulation; }
  .marco { width: 100%; margin: 0 auto; padding: 10px; border-radius: 22px;
           border: 2px solid #0e6e8c; background: #060818;
           box-shadow: 0 0 22px #0e6e8c55, inset 0 0 22px #0e6e8c33; }
  .cab { display: flex; align-items: center; gap: 6px; padding-bottom: 10px;
         border-bottom: 2px solid #0e6e8c; }
  .tit { flex: 1; }
  .tit small { display: block; font-size: 8px; letter-spacing: 2px; color: #4a6c86; }
  .tit b { font-size: 26px; color: #ffe14d; text-shadow: 0 0 10px #ffe14d99; letter-spacing: 3px; }
  .chip { border: 2px solid #22d3ee; color: #22d3ee; border-radius: 10px; padding: 6px 6px;
          font-size: 10px; letter-spacing: 1px; text-align: center; min-width: 0;
          background: #0a2a3a; transition: all .2s; }
  .chip.bot { border-color: #ff3dbd; color: #ff3dbd; background: #2a0a24; }
  .chip.fin { border-color: #ffe14d; color: #ffe14d; background: #2a250a; }
  #snd { width: 38px; height: 38px; border-radius: 10px; padding: 0; border: 2px solid #ffe14d;
         background: #060818; font-size: 16px; cursor: pointer; }
  .marc { display: flex; gap: 6px; margin: 10px 0; }
  .caja { flex: 1; border: 2px solid #0e6e8c; border-radius: 12px; padding: 6px 4px;
          text-align: center; background: #070b20; }
  .caja small { display: block; font-size: 9px; letter-spacing: 2px; color: #4a6c86; }
  .caja b { font-size: 20px; }
  #pj { color: #ff3dbd; } #pb { color: #22d3ee; }
  #dif { font-size: 12px; color: #39ff5a; line-height: 26px; }
  .msg { text-align: center; font-size: 10px; letter-spacing: 1px; color: #8aa4bd;
         margin: 10px 0; min-height: 16px; }
  .difs { display: flex; gap: 8px; margin: 8px 0 12px; }
  .dbtn { flex: 1 1 0; min-width: 0; height: 84px; border-radius: 14px; padding: 0; background: #060818;
          font-family: inherit; font-weight: bold; font-size: 11px; letter-spacing: 0;
          cursor: pointer; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 8px; }
  .dbtn span { font-size: 26px; }
  .dbtn:active { transform: scale(.94); }
  .f { border: 3px solid #39ff5a; color: #39ff5a; box-shadow: 0 0 12px #39ff5a66; }
  .m { border: 3px solid #ffe14d; color: #ffe14d; box-shadow: 0 0 12px #ffe14d66; }
  .d { border: 3px solid #ff3dbd; color: #ff3dbd; box-shadow: 0 0 12px #ff3dbd66; }
  #tab { display: none; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .c { aspect-ratio: 1; border-radius: 12px; border: 2px solid #0e6e8c; background: #050716;
       font-size: 34px; font-weight: bold; cursor: pointer; padding: 0; min-width: 0; font-family: inherit;
       display: flex; align-items: center; justify-content: center; }
  .c:active { transform: scale(.94); }
  .c.x { color: #ff3dbd; text-shadow: 0 0 12px #ff3dbd; }
  .c.o { color: #22d3ee; text-shadow: 0 0 12px #22d3ee; }
  .c.w { background: #1c1a06; border-color: #ffe14d; box-shadow: 0 0 16px #ffe14d99; animation: p .6s infinite alternate; }
  @keyframes p { to { transform: scale(1.06); } }
  .acc { display: none; gap: 8px; margin-top: 10px; }
  .acc button { flex: 1; min-width: 0; padding: 10px 2px; border-radius: 12px; border: 2px solid #22d3ee;
                background: #0a2a3a; color: #22d3ee; font-family: inherit; font-weight: bold;
                font-size: 10px; letter-spacing: 0; cursor: pointer; }
  .acc button:active { transform: scale(.95); }
</style>
</head>
<body>
<div class="marco">
  <div class="cab">
    <div class="tit"><small>RETRO ARCADE</small><b>GATO</b></div>
    <button id="snd" onclick="alt()">🔊</button>
    <div class="chip" id="turno">👤 TU TURNO</div>
  </div>
  <div class="marc">
    <div class="caja"><small>TÚ ✕</small><b id="pj">0</b></div>
    <div class="caja" style="flex:1.5"><small>DIFICULTAD</small><b id="dif">-</b></div>
    <div class="caja"><small>BOT ○</small><b id="pb">0</b></div>
  </div>
  <div class="msg" id="msg">ELIGE UNA DIFICULTAD</div>
  <div class="difs" id="difs">
    <button class="dbtn f" onclick="ini('FÁCIL')"><span>🙂</span>FÁCIL</button>
    <button class="dbtn m" onclick="ini('MEDIO')"><span>🧠</span>MEDIO</button>
    <button class="dbtn d" onclick="ini('DIFÍCIL')"><span>🔥</span>DIFÍCIL</button>
  </div>
  <div id="tab"></div>
  <div class="acc" id="acc">
    <button onclick="nueva()">↻ OTRA PARTIDA</button>
    <button onclick="menu()">⚙ DIFICULTAD</button>
  </div>
</div>
<script>
var L = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
var b = [], nivel = '', fin = true, sonido = true, pj = 0, pb = 0, ac = null;
var $ = function (id) { return document.getElementById(id); };

function beep(f, d, t) {
  if (!sonido) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = t || 'square'; o.frequency.value = f; g.gain.value = 0.05;
    o.connect(g); g.connect(ac.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
    o.stop(ac.currentTime + d);
  } catch (e) {}
}
function alt() { sonido = !sonido; $('snd').innerText = sonido ? '🔊' : '🔇'; beep(660, 0.1); }

function chip(txt, cls) { var t = $('turno'); t.innerText = txt; t.className = 'chip ' + (cls || ''); }
function pintar() {
  var h = '';
  for (var i = 0; i < 9; i++) {
    h += '<button class="c ' + (b[i] === 'X' ? 'x' : b[i] === 'O' ? 'o' : '') + '" id="c' + i +
         '" onclick="jugar(' + i + ')">' + (b[i] === 'X' ? '✕' : b[i] === 'O' ? '○' : '') + '</button>';
  }
  $('tab').innerHTML = h;
}
function menu() {
  fin = true; nivel = '';
  $('difs').style.display = 'flex'; $('tab').style.display = 'none'; $('acc').style.display = 'none';
  $('dif').innerText = '-'; $('msg').innerText = 'ELIGE UNA DIFICULTAD'; chip('👤 TU TURNO');
}
function ini(n) { nivel = n; $('dif').innerText = n; $('difs').style.display = 'none'; nueva(); beep(520, 0.1); }
function nueva() {
  b = ['', '', '', '', '', '', '', '', '']; fin = false;
  $('tab').style.display = 'grid'; $('acc').style.display = 'none';
  pintar(); $('msg').innerText = 'TOCA UNA CASILLA'; chip('👤 TU TURNO');
}

function ganador(t) {
  for (var i = 0; i < 8; i++) {
    var l = L[i];
    if (t[l[0]] && t[l[0]] === t[l[1]] && t[l[0]] === t[l[2]]) return { j: t[l[0]], l: l };
  }
  return t.every(function (x) { return x; }) ? { j: 'E', l: [] } : null;
}
function libres(t) { var r = []; for (var i = 0; i < 9; i++) if (!t[i]) r.push(i); return r; }
function mm(t, j) {
  var g = ganador(t);
  if (g) return g.j === 'O' ? 1 : g.j === 'X' ? -1 : 0;
  var mejor = j === 'O' ? -2 : 2;
  libres(t).forEach(function (i) {
    t[i] = j; var s = mm(t, j === 'O' ? 'X' : 'O'); t[i] = '';
    mejor = j === 'O' ? Math.max(mejor, s) : Math.min(mejor, s);
  });
  return mejor;
}
function perfecta() {
  var m = -2, r = [];
  libres(b).forEach(function (i) {
    b[i] = 'O'; var s = mm(b, 'X'); b[i] = '';
    if (s > m) { m = s; r = [i]; } else if (s === m) r.push(i);
  });
  return r[Math.floor(Math.random() * r.length)];
}
function atajo(j) {
  var l = libres(b);
  for (var k = 0; k < l.length; k++) {
    b[l[k]] = j; var g = ganador(b); b[l[k]] = '';
    if (g && g.j === j) return l[k];
  }
  return -1;
}
function alAzar() { var l = libres(b); return l[Math.floor(Math.random() * l.length)]; }
function elegir() {
  if (nivel === 'FÁCIL') return Math.random() < 0.2 ? perfecta() : alAzar();
  if (nivel === 'MEDIO') {
    var a = atajo('O'); if (a >= 0) return a;
    a = atajo('X'); if (a >= 0) return a;
    return Math.random() < 0.5 ? perfecta() : alAzar();
  }
  return perfecta();
}

function revisar() {
  var g = ganador(b);
  if (!g) return false;
  fin = true;
  g.l.forEach(function (i) { $('c' + i).className += ' w'; });
  if (g.j === 'X') { pj++; $('pj').innerText = pj; $('msg').innerText = '¡GANASTE!'; chip('🏆 GANASTE', 'fin'); beep(880, 0.4, 'triangle'); }
  else if (g.j === 'O') { pb++; $('pb').innerText = pb; $('msg').innerText = 'GANÓ EL BOT'; chip('🤖 GANÓ BOT', 'bot'); beep(180, 0.5, 'sawtooth'); }
  else { $('msg').innerText = 'EMPATE'; chip('🤝 EMPATE', 'fin'); beep(400, 0.3); }
  $('acc').style.display = 'flex';
  return true;
}
function jugar(i) {
  if (fin || b[i]) return;
  b[i] = 'X'; pintar(); beep(700, 0.08);
  if (revisar()) return;
  fin = true; chip('🤖 TURNO BOT', 'bot'); $('msg').innerText = 'EL BOT ESTÁ PENSANDO...';
  setTimeout(function () {
    b[elegir()] = 'O'; fin = false; pintar(); beep(440, 0.08);
    if (!revisar()) { $('msg').innerText = 'TOCA UNA CASILLA'; chip('👤 TU TURNO'); }
  }, 600);
}
</script>
</body>
</html>`;

async function enviarHTML(sock, from, html) {
  // Camino 1: fork con soporte nativo { html }
  // Camino 2: mensaje armado a mano (funciona con cualquier Baileys que tenga relayMessage)
  if (typeof generarMensaje !== "function") {
    await sock.sendMessage(from, { html });
    return;
  }
  const data = Buffer.from(
    JSON.stringify({
      __typename: "GenAIUnifiedResponse",
      response_id: crypto.randomUUID(),
      sections: [
        {
          __typename: "GenAIUnifiedResponseSection",
          view_model: {
            __typename: "GenAISingleLayoutViewModel",
            primitive: {
              __typename: "FOAHtmlPrimitiveDemoDONOTUSE",
              trusted_sources: [],
              payload: html,
            },
          },
        },
      ],
    })
  ).toString("base64");

  const contenido = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: { data },
          contextInfo: { isForwarded: true, forwardOrigin: 4 },
        },
      },
    },
  };

  const m = generarMensaje(from, contenido, {});
  await sock.relayMessage(from, m.message, { messageId: m.key.id });
}

export default {
  names: [".gatohtml"],
  desc: "Gato interactivo en HTML dentro del chat (rich response), con dificultades",
  category: "Juegos (prueba)",
  usage: ".gatohtml",
  handler: async ({ sock, from, msg }) => {
    // Camino principal: sock.sendHtml del fork (@fer2809fl/baileys), su formato exacto.
    // Si no existe, cae al envio manual de respaldo.
    try {
      if (typeof sock.sendHtml === "function") {
        const r = await sock.sendHtml(from, HTML_GATO, [], undefined, {});
        console.log("[GATOHTML] sendHtml enviado, id:", r?.messageId);
      } else {
        console.log("[GATOHTML] este Baileys no tiene sendHtml, uso envio manual");
        await enviarHTML(sock, from, HTML_GATO);
        console.log("[GATOHTML] envio manual enviado");
      }
    } catch (e) {
      console.log("[GATOHTML] ERROR: " + e.stack);
      await sock.sendMessage(
        from,
        { text: "❌ No se pudo enviar el HTML: " + e.message },
        { quoted: msg }
      );
    }
  },
};
