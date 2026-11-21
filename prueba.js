import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { randomBytes } from "node:crypto";
import { downloadContentFromMessage } from "baileysx";
import type { Command } from "../../core/types.js";

const SIGNATURE_B64 = "TklYRUwuTWVzc2FnZUJ1aWxkZXJWNC44LVZlcmlmaWNhdGlvblNpZ25hdHVyZS5NZXRhZGF0YXcJdgmzQZeb4w==";
const CERT_CHAIN_B64 = [
  "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",
];
const SIGNATURE = Buffer.from(SIGNATURE_B64, "base64");
const CERT_CHAIN = CERT_CHAIN_B64.map((item) => Buffer.from(item, "base64"));


const CACHE = path.resolve(process.cwd(), "data/mario2_cache");
const ENGINE_URLS = ["https://unpkg.com/jsnes@1.2.1/dist/jsnes.min.js", "https://cdn.jsdelivr.net/npm/jsnes@1.2.1/dist/jsnes.min.js"];

function validRom(b: Buffer) {
  return b.length > 4096 && b[0] === 0x4e && b[1] === 0x45 && b[2] === 0x53 && b[3] === 0x1a;
}
function unzipRom(zip: Buffer): Buffer | null {
  const min = Math.max(0, zip.length - 65557);
  for (let p = zip.length - 22; p >= min; p--) {
    if (zip.readUInt32LE(p) !== 0x06054b50) continue;
    const count = zip.readUInt16LE(p + 10);
    let at = zip.readUInt32LE(p + 16);
    for (let i = 0; i < count && at + 46 <= zip.length; i++) {
      if (zip.readUInt32LE(at) !== 0x02014b50) break;
      const method = zip.readUInt16LE(at + 10), size = zip.readUInt32LE(at + 20);
      const nl = zip.readUInt16LE(at + 28), el = zip.readUInt16LE(at + 30), cl = zip.readUInt16LE(at + 32);
      const off = zip.readUInt32LE(at + 42), name = zip.toString("utf8", at + 46, at + 46 + nl);
      at += 46 + nl + el + cl;
      if (!name.toLowerCase().endsWith(".nes") || off + 30 > zip.length || zip.readUInt32LE(off) !== 0x04034b50) continue;
      const start = off + 30 + zip.readUInt16LE(off + 26) + zip.readUInt16LE(off + 28);
      const part = zip.subarray(start, start + size);
      try {
        const rom = method === 0 ? Buffer.from(part) : method === 8 ? zlib.inflateRawSync(part) : null;
        if (rom && validRom(rom)) return rom;
      } catch {}
    }
    break;
  }
  return null;
}
async function engineB64() {
  for (const url of ENGINE_URLS) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!r.ok) continue;
      const js = await r.text();
      if (js.includes("jsnes")) return zlib.gzipSync(Buffer.from(js), { level: 9 }).toString("base64");
    } catch {}
  }
  throw new Error("No se pudo descargar el motor JSNES.");
}

function html(engine: string, rom: string, title: string) {
  return `<style>
*{box-sizing:border-box;margin:0;padding:0;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none}
html,body{background:#24231f;color:#292821;font-family:"Courier New",monospace;overflow:hidden}
#case{width:min(98vw,720px);margin:auto;background:#c9c5b8;border:5px solid #777367;border-radius:5px;overflow:hidden;box-shadow:inset 0 0 0 3px #e7e3d6,0 8px 0 #45433c,0 15px 28px #0009}
#banner{text-align:center;padding:10px 9px;background:#393831;border-bottom:4px solid #777367;font-family:"Courier New",monospace;font-weight:900;letter-spacing:2px;color:#f0d98b;text-shadow:2px 2px #171713}
#banner #top{display:flex;justify-content:center;gap:22px;margin-bottom:10px}
#banner #top button{padding:6px 15px;font-size:10px}
#screen-wrap{padding:14px;background:#a9a597;border-bottom:3px solid #777367;display:flex;align-items:center;flex-direction:column}
#title{font-size:11px;font-weight:900;color:#34332d;margin-bottom:9px;letter-spacing:1.5px;text-shadow:1px 1px #e6e1d2}
#screen{position:relative;width:96%;aspect-ratio:256/240;background:#080d08;border:9px solid #4b4a42;border-radius:3px;overflow:hidden;box-shadow:inset 0 0 0 3px #151811,0 0 0 2px #e1dccd}
canvas{width:100%;height:100%;display:block;image-rendering:pixelated}
#status{position:absolute;left:8px;top:8px;font-size:8px;font-weight:900;color:#9acb77;text-shadow:1px 1px #000}
#err{display:none;padding:9px;background:#6a3029;color:#fff0d0;font-size:11px;width:100%}

#system-controls{display:flex;justify-content:center;align-items:center;gap:22px;padding:18px 12px 12px;background:#c9c5b8}
#system-controls button{min-width:88px;padding:11px 18px;font-size:10px;letter-spacing:1.5px;border-radius:22px;background:linear-gradient(145deg,#59636e,#303944);border:1px solid #151b22;box-shadow:inset 1px 1px 3px #ffffff44,0 4px 0 #151b22}
#system-controls button:active{transform:translateY(2px);box-shadow:0 1px 0 #151b22}

#pad{padding:17px 13px 22px;background:#c9c5b8;border-top:4px solid #eee9dc}
#top{display:flex;justify-content:center;gap:42px;margin-bottom:22px}
button{font-family:"Courier New",monospace;font-weight:900;color:#f5f0df;border:2px solid #38372f;background:#55534a;border-radius:2px;padding:10px 18px;box-shadow:0 4px 0 #302f29;text-shadow:1px 1px #222}
#main{display:flex;align-items:center;justify-content:space-between;gap:10px}
#dpad{display:grid;grid-template-columns:repeat(3,minmax(36px,56px));grid-template-rows:repeat(3,minmax(36px,56px));gap:3px;padding:9px;border-radius:3px;background:#aaa698;border:2px solid #777367;box-shadow:inset 1px 1px 3px #777367}
#dpad button{padding:0;font-size:20px;background:#49483f;border-color:#292821;border-radius:2px;box-shadow:0 3px 0 #292821}
#actions{display:flex;gap:9px;padding:11px;border-radius:4px;background:#aaa698;border:2px solid #777367}
#actions button{width:52px;height:52px;border-radius:50%;padding:0;font-size:20px;background:#a83d35;color:#fff4dd;border:2px solid #6d2824;box-shadow:0 4px 0 #65251f}
#actions #b{background:#b98b3d;color:#29251c;border-color:#765a2b;box-shadow:0 4px 0 #6c5128}
#reset{display:block;margin:19px auto 0;background:#55534a;border-color:#302f29;color:#f0d98b}
.pressed,button:active{filter:brightness(1.18);transform:translateY(2px);box-shadow:0 1px 0 #302f29}
@media(max-width:360px){#dpad{grid-template-columns:repeat(3,34px);grid-template-rows:repeat(3,34px);padding:7px}#actions{padding:7px;gap:5px}#actions button{width:43px;height:43px}}

</style>
<div id="case"><div id="banner">★ ASTA POCKET ★<small style="display:block;font-size:9px;margin-top:4px;letter-spacing:2px">PORTABLE VIDEO GAME SYSTEM</small></div>
<div id="screen-wrap"><div id="title">${title}</div><div id="screen"><div id="status">CARGANDO...</div><canvas id="nes" width="256" height="240"></canvas></div><div id="err"></div></div>
<div id="system-controls"><button data-k="select">SELECT</button><button data-k="start">START</button></div>
<div id="pad"><div id="main"><div id="dpad"><i></i><button data-k="up">▲</button><i></i><button data-k="left">◀</button><i></i><button data-k="right">▶</button><i></i><button data-k="down">▼</button><i></i></div>
<div id="actions"><button id="b" data-k="b">B</button><button data-k="a">A</button></div></div><button id="reset">REINICIAR</button></div></div>
<script>(function(){
const E="${engine}",R="${rom}",status=document.getElementById("status"),err=document.getElementById("err"),cv=document.getElementById("nes"),ctx=cv.getContext("2d",{alpha:false}),img=ctx.createImageData(256,240),px=new Uint32Array(img.data.buffer);
let nes=null,rom="",audio=null,rd=0,wr=0;const L=new Float32Array(8192),Q=new Float32Array(8192),mask=8191;
function unlock(){try{if(!audio){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio=new AC();const p=audio.createScriptProcessor(2048,0,2);p.onaudioprocess=e=>{const l=e.outputBuffer.getChannelData(0),r=e.outputBuffer.getChannelData(1);for(let i=0;i<l.length;i++){if(rd!==wr){l[i]=L[rd];r[i]=Q[rd];rd=(rd+1)&mask}else l[i]=r[i]=0}};p.connect(audio.destination)}if(audio.state==="suspended")audio.resume()}catch{}}
async function dec(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer())}
function bin(u){let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return s}
function bind(el,n){const d=e=>{e.preventDefault();unlock();el.classList.add("pressed");if(nes)nes.buttonDown(1,n)},u=e=>{e.preventDefault();el.classList.remove("pressed");if(nes)nes.buttonUp(1,n)};el.addEventListener("touchstart",d,{passive:false});el.addEventListener("touchend",u,{passive:false});el.addEventListener("touchcancel",u,{passive:false});el.addEventListener("mousedown",d);el.addEventListener("mouseup",u);el.addEventListener("mouseleave",u)}
(async()=>{try{const [eb,rb]=await Promise.all([dec(E),dec(R)]),script=document.createElement("script");script.text=new TextDecoder().decode(eb);document.head.appendChild(script);if(!window.jsnes)throw Error("Motor JSNES no disponible");nes=new window.jsnes.NES({onFrame:f=>{for(let i=0;i<61440;i++)px[i]=0xff000000|f[i];ctx.putImageData(img,0,0)},onAudioSample:(l,r)=>{const n=(wr+1)&mask;if(n!==rd){L[wr]=l*.65;Q[wr]=r*.65;wr=n}}});rom=bin(rb);nes.loadROM(rom);const C=window.jsnes.Controller,map={up:C.BUTTON_UP,down:C.BUTTON_DOWN,left:C.BUTTON_LEFT,right:C.BUTTON_RIGHT,a:C.BUTTON_A,b:C.BUTTON_B,start:C.BUTTON_START,select:C.BUTTON_SELECT};document.querySelectorAll("[data-k]").forEach(el=>bind(el,map[el.dataset.k]));const keys={ArrowUp:C.BUTTON_UP,KeyW:C.BUTTON_UP,ArrowDown:C.BUTTON_DOWN,KeyS:C.BUTTON_DOWN,ArrowLeft:C.BUTTON_LEFT,KeyA:C.BUTTON_LEFT,ArrowRight:C.BUTTON_RIGHT,KeyD:C.BUTTON_RIGHT,Space:C.BUTTON_A,KeyZ:C.BUTTON_A,KeyK:C.BUTTON_A,KeyX:C.BUTTON_B,KeyJ:C.BUTTON_B,ShiftLeft:C.BUTTON_B,Enter:C.BUTTON_START,Tab:C.BUTTON_SELECT};window.addEventListener("keydown",e=>{if(keys[e.code]!==undefined){e.preventDefault();unlock();nes.buttonDown(1,keys[e.code])}});window.addEventListener("keyup",e=>{if(keys[e.code]!==undefined){e.preventDefault();nes.buttonUp(1,keys[e.code])}});document.getElementById("reset").onclick=()=>{unlock();nes.reset();nes.loadROM(rom)};status.textContent="● ACTIVO";let last=0;function frame(t){requestAnimationFrame(frame);if(t-last>16){last=t;try{nes.frame()}catch{}}}requestAnimationFrame(frame)}catch(e){status.textContent="ERROR";err.style.display="block";err.textContent=e.message||String(e)}})();
})();</script>`;
}

async function quotedDocument(msg: any): Promise<{ buffer: Buffer; name: string } | null> {
  const q = msg?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const doc = q?.documentMessage || q?.documentWithCaptionMessage?.message?.documentMessage || msg?.message?.documentMessage;
  if (!doc) return null;
  const stream = await downloadContentFromMessage(doc, "document");
  const chunks: Buffer[] = [];
  for await (const c of stream) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
  return { buffer: Buffer.concat(chunks), name: String(doc.fileName || "game.nes") };
}

const command: Command = {
  name: "mario2",
  aliases: ["mario", "sm2", "supermario2"],
  description: "🎮 Juega Super Mario Bros. 3 en una consola retro interactiva.",
  category: "Desarrollo",
  ownerOnly: true,
  globalOwnerOnly: true,
  execute: async (ctx) => {
    if (!ctx.isOwner) return ctx.reply("🔒 Este comando solo puede usarlo el owner.");
    try {
      fs.mkdirSync(CACHE, { recursive: true });
      const args = (ctx.args || []).map(String);
      const sub = String(args[0] || "").toLowerCase();

      // Mismo flujo que Contra: primero guarda la ROM y después abre el juego.
      if (sub === "save" || sub === "guardar" || sub === "instalar") {
        const doc = await quotedDocument(ctx.msg);
        if (!doc) return ctx.reply("📎 Responde al documento de Mario (.nes o .zip) con .mario2 save.");
        const rom = validRom(doc.buffer) ? doc.buffer : unzipRom(doc.buffer);
        if (!rom) throw new Error("El archivo no contiene una ROM válida de NES. Acepto .nes o .zip con un .nes dentro.");
        fs.writeFileSync(path.join(CACHE, "Super Mario Bros. 3.nes"), rom);
        return ctx.reply("✅ ROM de Super Mario Bros. 3 guardada. Ahora escribe .mario2 para abrir el juego.");
      }

      const romPath = path.join(CACHE, "Super Mario Bros. 3.nes");
      if (!fs.existsSync(romPath)) {
        return ctx.reply("🍄 No está instalada la ROM de Mario. Envía el archivo .nes o .zip como documento y responde con .mario2 save para instalarla.");
      }
      const rom = fs.readFileSync(romPath);
      if (!validRom(rom)) throw new Error("La ROM guardada está dañada. Vuelve a enviarla con .mario2 save.");
      const htmlPayload = html(
        await engineB64(),
        zlib.gzipSync(rom, { level: 9 }).toString("base64"),
        "SUPER MARIO BROS. 3"
      );
      const responseId = "AstaMario_" + Date.now();
      const data = {
        response_id: responseId,
        sections: [{
          __typename: "GenAIUnifiedResponseSection",
          view_model: {
            __typename: "GenAISingleLayoutViewModel",
            primitive: {
              __typename: "GenAIBotProgressStatusPrimitive",
              title: "🍄 SUPER MARIO BROS. 3",
              is_in_progress: true
            }
          }
        }],
        embedded_screens: [{
          title: "🍄 SUPER MARIO BROS. 3",
          content: [{
            __typename: "FOAIDNixelButtonSheets",
            tabs: [{
              id: "tab_0",
              tab_header: "ASTA MARIO",
              sections: [{
                __typename: "GenAIUnifiedResponseSection",
                view_model: {
                  __typename: "GenAISingleLayoutViewModel",
                  primitive: {
                    __typename: "GenAIaeacdsnwHtmlPrimitive",
                    payload: htmlPayload,
                    url: "https://astabot.hidenplay.net",
                    trusted_sources: ["astabot.hidenplay.net", "unpkg.com", "cdn.jsdelivr"]
                  }
                }
              }],
              step_entries: []
            }]
          }]
        }]
      };
      const messageId =
        typeof (ctx.sock as any).generateMessageTag === "function"
          ? await (ctx.sock as any).generateMessageTag()
          : randomBytes(8).toString("hex").toUpperCase();

      await (ctx.sock as any).relayMessage(
        ctx.chatId,
        {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2,
            botMetadata: {
              messageDisclaimerText: ""
              botResponseId: responseId,
              verificationMetadata: {
                proofs: [{
                  version: 1,
                  useCase: 1,
                  signature: SIGNATURE,
                  certificateChain CERT_CHAIN
                }]
              }
            }
          },
          botForwardedMessage: {
            message: {
              richResponseMessage: {
                messageType: 1,
                unifiedResponse: { data: Buffer.from(JSON.stringify(data)) },
                contextInfo: {
                  forwardingScore: 1,
                  isForwarded: true,
                  forwardedAiBotMessageInfo: { botJid: "867051314767696@bot" },
                  forwardOrigin: 4
                }
              }
            }
          }
        },
        { messageId }
      );
    } catch (e) {
      await ctx.reply("❌ Mario 2: " + (e instanceof Error ? e.message : String
    }
  },
};
export default command;
