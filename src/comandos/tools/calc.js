import { config } from "../../../motores/db.js";
import { tarjetaUso, tarjetaAviso } from "../../descargas/tarjetas.js";

function makeEngine() {
  const state = { deg: true, ans: 0n };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const isBig = (v) => typeof v === 'bigint';
  const N = (v) => (isBig(v) ? Number(v) : v);
  const fail = (m) => { throw new Error(m); };
  const isD = (c) => c !== undefined && c >= '0' && c <= '9';
  const tidy = (r) => parseFloat(r.toPrecision(14));
  const z = (r) => (Math.abs(r) < 1e-14 ? 0 : r);
  const ang = (v) => (state.deg ? (N(v) * Math.PI) / 180 : N(v));
  const back = (r) => (state.deg ? (r * 180) / Math.PI : r);
  const intOut = (r) => (Number.isInteger(r) && Math.abs(r) < 9007199254740992 ? BigInt(r) : r);
  const toInt = (v, nm) => {
    if (isBig(v)) return v;
    if (!Number.isInteger(v)) fail(nm + ' solo acepta números enteros');
    return BigInt(v);
  };

  const add = (a, b) => (isBig(a) && isBig(b) ? a + b : N(a) + N(b));
  const sub = (a, b) => (isBig(a) && isBig(b) ? a - b : N(a) - N(b));
  const mul = (a, b) => (isBig(a) && isBig(b) ? a * b : N(a) * N(b));
  const neg = (a) => (isBig(a) ? -a : -a);
  const div = (a, b) => {
    if (N(b) === 0) fail('No se puede dividir entre cero');
    if (isBig(a) && isBig(b) && a % b === 0n) return a / b;
    return N(a) / N(b);
  };
  const mod = (a, b) => {
    if (N(b) === 0) fail('No se puede dividir entre cero');
    if (isBig(a) && isBig(b)) {
      const r = a % b;
      return r < 0n ? r + (b < 0n ? -b : b) : r;
    }
    const r = N(a) % N(b);
    return r < 0 ? r + Math.abs(N(b)) : r;
  };
  const pow = (a, b) => {
    if (isBig(a) && isBig(b) && b >= 0n) {
      const d = Number(b) * Math.log10(Math.abs(Number(a)) || 1);
      if (d < 3000) return a ** b;
      return Math.pow(Number(a), Number(b));
    }
    const x = N(a);
    const y = N(b);
    if (x === 0 && y < 0) fail('No se puede dividir entre cero');
    const r = Math.pow(x, y);
    if (Number.isNaN(r)) fail('El resultado no es un número real');
    return r;
  };
  const fact = (v) => {
    const n = N(v);
    if (!Number.isInteger(n) || n < 0) fail('El factorial solo existe para enteros mayores o iguales a 0');
    if (n > 3000) fail('Ese factorial es demasiado grande');
    let r = 1n;
    for (let i = 2n; i <= BigInt(n); i++) r *= i;
    return r;
  };
  const gcdB = (a, b) => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) { const t = b; b = a % b; a = t; }
    return a;
  };
  const ncr = (n, k) => {
    if (n > 100000n) fail('El número es demasiado grande');
    if (k < 0n || k > n) return 0n;
    if (k > n - k) k = n - k;
    let r = 1n;
    for (let i = 1n; i <= k; i++) r = (r * (n - k + i)) / i;
    return r;
  };
  const npr = (n, k) => {
    if (n > 100000n) fail('El número es demasiado grande');
    if (k < 0n || k > n) return 0n;
    let r = 1n;
    for (let i = 0n; i < k; i++) r *= n - i;
    return r;
  };
  const needPos = (v) => {
    const n = N(v);
    if (!(n > 0)) fail('El logaritmo solo existe para números positivos');
    return n;
  };
  const tr0 = (c, msg) => { if (Math.abs(c) < 1e-14) fail(msg); };

  const FN = {
    sqrt: (v) => {
      const n = N(v);
      if (n < 0) fail('No existe la raíz cuadrada real de un número negativo');
      const r = Math.sqrt(n);
      const q = Math.round(r);
      if (isBig(v) && Number.isSafeInteger(q) && BigInt(q) ** 2n === v) return BigInt(q);
      return r;
    },
    cbrt: (v) => {
      const r = Math.cbrt(N(v));
      const q = Math.round(r);
      if (isBig(v) && Number.isSafeInteger(q) && BigInt(q) ** 3n === v) return BigInt(q);
      return r;
    },
    root: (n, v) => {
      const k = N(n);
      const x = N(v);
      if (k === 0) fail('El índice de la raíz no puede ser 0');
      if (x < 0) {
        if (Number.isInteger(k) && Math.abs(k) % 2 === 1) return -Math.pow(-x, 1 / k);
        fail('No existe la raíz real de índice par de un número negativo');
      }
      return tidy(Math.pow(x, 1 / k));
    },
    abs: (v) => (isBig(v) ? (v < 0n ? -v : v) : Math.abs(v)),
    sin: (v) => z(Math.sin(ang(v))),
    cos: (v) => z(Math.cos(ang(v))),
    tan: (v) => {
      const a = ang(v);
      tr0(Math.cos(a), 'La tangente no está definida en ese ángulo');
      return z(Math.tan(a));
    },
    sec: (v) => {
      const c = Math.cos(ang(v));
      tr0(c, 'La secante no está definida en ese ángulo');
      return 1 / c;
    },
    csc: (v) => {
      const s = Math.sin(ang(v));
      tr0(s, 'La cosecante no está definida en ese ángulo');
      return 1 / s;
    },
    cot: (v) => {
      const a = ang(v);
      const s = Math.sin(a);
      tr0(s, 'La cotangente no está definida en ese ángulo');
      return z(Math.cos(a) / s);
    },
    asin: (v) => {
      const n = N(v);
      if (Math.abs(n) > 1) fail('asin solo acepta valores entre -1 y 1');
      return z(tidy(back(Math.asin(n))));
    },
    acos: (v) => {
      const n = N(v);
      if (Math.abs(n) > 1) fail('acos solo acepta valores entre -1 y 1');
      return z(tidy(back(Math.acos(n))));
    },
    atan: (v) => z(tidy(back(Math.atan(N(v))))),
    atan2: (y, x) => z(tidy(back(Math.atan2(N(y), N(x))))),
    sinh: (v) => Math.sinh(N(v)),
    cosh: (v) => Math.cosh(N(v)),
    tanh: (v) => Math.tanh(N(v)),
    ln: (v) => tidy(Math.log(needPos(v))),
    log: (v, b) => {
      const n = needPos(v);
      if (b === undefined) return tidy(Math.log10(n));
      const bb = N(b);
      if (!(bb > 0) || bb === 1) fail('La base del logaritmo no es válida');
      return tidy(Math.log(n) / Math.log(bb));
    },
    log2: (v) => tidy(Math.log2(needPos(v))),
    exp: (v) => Math.exp(N(v)),
    floor: (v) => intOut(Math.floor(N(v))),
    ceil: (v) => intOut(Math.ceil(N(v))),
    trunc: (v) => intOut(Math.trunc(N(v))),
    round: (v, d) => {
      const f = Math.pow(10, d === undefined ? 0 : N(d));
      const n = N(v) * f;
      const r = (n < 0 ? -Math.round(-n) : Math.round(n)) / f;
      return intOut(r);
    },
    sign: (v) => BigInt(Math.sign(N(v))),
    fact: (v) => fact(v),
    gcd: (a, b) => gcdB(toInt(a, 'mcd'), toInt(b, 'mcd')),
    lcm: (a, b) => {
      const x = toInt(a, 'mcm');
      const y = toInt(b, 'mcm');
      if (x === 0n || y === 0n) return 0n;
      const r = (x * y) / gcdB(x, y);
      return r < 0n ? -r : r;
    },
    ncr: (n, k) => ncr(toInt(n, 'nCr'), toInt(k, 'nCr')),
    npr: (n, k) => npr(toInt(n, 'nPr'), toInt(k, 'nPr')),
    min: (...a) => a.reduce((m, v) => (N(v) < N(m) ? v : m)),
    max: (...a) => a.reduce((m, v) => (N(v) > N(m) ? v : m)),
    sum: (...a) => a.reduce((s, v) => add(s, v), 0n),
    mean: (...a) => div(a.reduce((s, v) => add(s, v), 0n), BigInt(a.length)),
    hypot: (...a) => Math.hypot(...a.map(N)),
    rad: (v) => (N(v) * Math.PI) / 180,
    deg: (v) => (N(v) * 180) / Math.PI,
    mod: (a, b) => mod(a, b),
    pow: (a, b) => pow(a, b),
    bin: (v) => '0b' + toInt(v, 'bin').toString(2),
    oct: (v) => '0o' + toInt(v, 'oct').toString(8),
    hex: (v) => '0x' + toInt(v, 'hex').toString(16).toUpperCase(),
  };
  const ALIAS = {
    'π': 'pi', raiz: 'sqrt', sen: 'sin', tg: 'tan', arcsin: 'asin', arcsen: 'asin', arccos: 'acos',
    arctan: 'atan', arctg: 'atan', lg: 'log', log10: 'log', factorial: 'fact', promedio: 'mean',
    media: 'mean', avg: 'mean', suma: 'sum', mcd: 'gcd', mcm: 'lcm', piso: 'floor', techo: 'ceil',
    redondear: 'round', comb: 'ncr', perm: 'npr', binario: 'bin', hexa: 'hex', octal: 'oct',
  };
  const CONST = {
    pi: () => Math.PI,
    e: () => Math.E,
    phi: () => (1 + Math.sqrt(5)) / 2,
    tau: () => 2 * Math.PI,
    ans: () => state.ans,
  };
  const canon = (n) => (has(ALIAS, n) ? ALIAS[n] : n);
  const known = (n) => has(FN, n) || has(CONST, n) || has(ALIAS, n) || n === 'x' || n === 'mod';
  const segment = (n) => {
    if (known(n)) return [n];
    for (let l = n.length - 1; l >= 1; l--) {
      const h = n.slice(0, l);
      if (known(h)) {
        const r = segment(n.slice(l));
        if (r) return [h].concat(r);
      }
    }
    return null;
  };

  function prep(raw) {
    let s = String(raw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/[¿?¡]/g, ' ');
    s = s.replace(/\b(cuanto|cuantos)\s+(es|son|da|dan|vale|valen|seria|serian|sale)\b/g, ' ');
    s = s.replace(/\b(calcula|calcular|calculame|resuelve|resolver|resuelveme|dime|dame|cual es|cuales son|el resultado de|resultado de|el valor de|valor de|que es)\b/g, ' ');
    s = s.replace(/que porcentaje (?:es|son|representa) ([\d.,]+) de ([\d.,]+)/g, '($1/$2)*100');
    s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:%|por ciento)\s*de\s+/g, '($1%)*');
    s = s.replace(/\bpor ciento\b/g, '%');
    s = s.replace(/\b(el|la|los|las)\s+(?=[\d(])/g, '');
    const R = [
      [/multiplicado\s+por|multiplicar\s+por|\bveces\b/g, '*'],
      [/dividido\s+(?:entre|por|en)|dividir\s+(?:entre|por)|\bentre\b|\bsobre\b/g, '/'],
      [/\bmas\b/g, '+'],
      [/\bmenos\b/g, '-'],
      [/\bpor\b/g, '*'],
      [/elevado\s+a\s+la\s+potencia\s+de|elevado\s+a\s+la|elevado\s+al|elevado\s+a|a\s+la\s+potencia\s+de/g, '^'],
      [/al\s+cuadrado/g, '^2'],
      [/al\s+cubo/g, '^3'],
      [/raiz\s+cubica\s+de|raiz\s+cubica/g, 'cbrt '],
      [/raiz\s+cuadrada\s+de|raiz\s+cuadrada|raiz\s+de/g, 'sqrt '],
      [/factorial\s+de\s+(\d+)/g, '($1)!'],
      [/logaritmo\s+natural\s+de|logaritmo\s+natural/g, 'ln '],
      [/logaritmo\s+(?:en\s+)?base\s+10\s+de|logaritmo\s+de|logaritmo/g, 'log '],
      [/seno\s+de|seno/g, 'sin '],
      [/coseno\s+de|coseno/g, 'cos '],
      [/tangente\s+de|tangente/g, 'tan '],
      [/valor\s+absoluto\s+de|valor\s+absoluto/g, 'abs '],
      [/\b(modulo|resto)\b/g, ' mod '],
    ];
    R.forEach((r) => { s = s.replace(r[0], r[1]); });
    if (s.indexOf('=') < 0) s = s.replace(/(\d)\s*x\s*(?=[\d(])/g, '$1*');
    return s.replace(/\s+/g, ' ').trim();
  }

  function tokenize(s) {
    const t = [];
    const st = [];
    const push = (k, v) => t.push({ k, v });
    const map = { '×': '*', '·': '*', '÷': '/', '−': '-', '–': '-' };
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
      if (isD(c) || (c === '.' && isD(s[i + 1]))) {
        const rest = s.slice(i);
        let m = /^0x[0-9a-f]+/.exec(rest);
        if (m) { push('n', BigInt(m[0])); i += m[0].length; continue; }
        m = /^0b[01]+/.exec(rest);
        if (m) { push('n', BigInt(m[0])); i += m[0].length; continue; }
        let j = i;
        while (isD(s[j])) j++;
        let flo = false;
        if ((s[j] === '.' || (s[j] === ',' && st[st.length - 1] !== 'f')) && isD(s[j + 1])) {
          flo = true;
          j++;
          while (isD(s[j])) j++;
        } else if (s[j] === '.') {
          flo = true;
          j++;
        }
        let txt = s.slice(i, j);
        const em = /^e[+-]?[0-9]+/.exec(s.slice(j));
        if (em) { txt += em[0]; j += em[0].length; flo = true; }
        push('n', flo ? Number(txt.replace(',', '.')) : BigInt(txt));
        i = j;
        continue;
      }
      if (/[a-zπ_]/.test(c)) {
        let name = /^[a-zπ_]+/.exec(s.slice(i))[0];
        const dm = /^[0-9]+/.exec(s.slice(i + name.length));
        if (dm && (has(FN, name + dm[0]) || has(ALIAS, name + dm[0]))) name += dm[0];
        const parts = segment(name);
        if (!parts) fail('No entiendo "' + name + '"');
        parts.forEach((p) => push('i', p));
        i += name.length;
        continue;
      }
      if (c === '√') { push('i', 'sqrt'); i++; continue; }
      if (c === '²') { push('o', '^'); push('n', 2n); i++; continue; }
      if (c === '³') { push('o', '^'); push('n', 3n); i++; continue; }
      if (c === '*' && s[i + 1] === '*') { push('o', '^'); i += 2; continue; }
      const ch = has(map, c) ? map[c] : c;
      if ('+-*/^!%'.indexOf(ch) >= 0) { push('o', ch); i++; continue; }
      if (ch === '(') {
        const prev = t[t.length - 1];
        const isF = !!prev && prev.k === 'i' && has(FN, canon(prev.v));
        st.push(isF ? 'f' : 'g');
        push('o', '(');
        i++;
        continue;
      }
      if (ch === ')') { st.pop(); push('o', ')'); i++; continue; }
      if (ch === ',' || ch === ';') { push('o', ','); i++; continue; }
      fail('Carácter no válido: "' + c + '"');
    }
    while (st.length) { st.pop(); push('o', ')'); }
    return t;
  }

  function evaluate(tokens, vars) {
    let p = 0;
    let pct = null;
    const isO = (v) => { const t = tokens[p]; return !!t && t.k === 'o' && t.v === v; };
    const starts = (t) => !!t && (t.k === 'n' || (t.k === 'i' && t.v !== 'mod') || (t.k === 'o' && t.v === '('));

    function expr() {
      let l = term();
      while (isO('+') || isO('-')) {
        const op = tokens[p++].v;
        const ts = p;
        let r = term();
        if (pct && pct.s === ts && pct.e === p) r = mul(l, r);
        l = op === '+' ? add(l, r) : sub(l, r);
      }
      return l;
    }
    function term() {
      let l = unary();
      for (;;) {
        const t = tokens[p];
        if (!t) break;
        if (t.k === 'o' && (t.v === '*' || t.v === '/')) {
          p++;
          const r = unary();
          l = t.v === '*' ? mul(l, r) : div(l, r);
        } else if (t.k === 'i' && t.v === 'mod') {
          p++;
          l = mod(l, unary());
        } else if (t.k === 'o' && t.v === '%' && starts(tokens[p + 1])) {
          p++;
          l = mod(l, unary());
        } else if (starts(t)) {
          l = mul(l, unary());
        } else break;
      }
      return l;
    }
    function unary() {
      if (isO('-')) { p++; return neg(unary()); }
      if (isO('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (isO('^')) { p++; return pow(b, unary()); }
      return b;
    }
    function postfix() {
      const s0 = p;
      let v = primary();
      for (;;) {
        if (isO('!')) { p++; v = fact(v); }
        else if (isO('%') && !starts(tokens[p + 1])) { p++; v = div(v, 100n); pct = { s: s0, e: p }; }
        else break;
      }
      return v;
    }
    function primary() {
      const t = tokens[p++];
      if (!t) fail('La operación está incompleta');
      if (t.k === 'n') return t.v;
      if (t.k === 'o' && t.v === '(') {
        if (isO(')')) fail('Hay paréntesis vacíos');
        const v = expr();
        if (!isO(')')) fail('Falta cerrar un paréntesis');
        p++;
        return v;
      }
      if (t.k === 'i') {
        const nm = canon(t.v);
        if (has(FN, nm)) {
          let args = [];
          if (isO('(')) {
            p++;
            if (!isO(')')) {
              args.push(expr());
              while (isO(',')) { p++; args.push(expr()); }
            }
            if (!isO(')')) fail('Falta cerrar un paréntesis');
            p++;
          } else {
            args = [unary()];
          }
          const r = FN[nm].apply(null, args);
          if (typeof r === 'number' && Number.isNaN(r)) fail('Resultado no válido');
          return r;
        }
        if (has(CONST, nm)) return CONST[nm]();
        if (nm === 'x') {
          if (vars && vars.x !== undefined) return vars.x;
          fail('La x no tiene valor: escribe una ecuación con = para resolverla');
        }
        fail('No entiendo "' + t.v + '"');
      }
      fail('Símbolo inesperado: ' + t.v);
    }

    if (!tokens.length) fail('Escribe una operación');
    const r = expr();
    if (p < tokens.length) {
      if (tokens[p].v === ')') fail('Hay un paréntesis de más');
      fail('No entendí "' + tokens[p].v + '" en la operación');
    }
    return r;
  }

  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  function fmt(v) {
    if (typeof v === 'string') return v;
    if (isBig(v)) {
      const ng = v < 0n;
      const s = (ng ? -v : v).toString();
      if (s.length > 24) {
        const m = (s[0] + '.' + s.slice(1, 10)).replace(/\.?0+$/, '');
        return (ng ? '-' : '') + m + '×10^' + (s.length - 1) + ' (' + s.length + ' dígitos)';
      }
      return (ng ? '-' : '') + (s.length >= 5 ? group(s) : s);
    }
    if (Number.isNaN(v)) fail('Resultado no válido');
    if (!Number.isFinite(v)) fail('El resultado es infinito o indefinido');
    const r = parseFloat(v.toPrecision(12));
    if (r === 0) return '0';
    const a = Math.abs(r);
    if (a >= 1e15 || a < 1e-6) {
      const parts = r.toExponential(9).split('e');
      return parts[0].replace(/\.?0+$/, '') + '×10^' + parseInt(parts[1], 10);
    }
    const str = String(r);
    const ip = str.split('.');
    const sign = ip[0].charAt(0) === '-' ? '-' : '';
    const ii = ip[0].replace('-', '');
    return sign + (ii.length >= 5 ? group(ii) : ii) + (ip[1] ? '.' + ip[1] : '');
  }
  function plainOf(v) {
    if (typeof v === 'string') return v;
    if (isBig(v)) return v.toString();
    return String(parseFloat(v.toPrecision(12)));
  }
  function frac(x) {
    if (!Number.isFinite(x) || Number.isInteger(x) || Math.abs(x) > 1e9) return null;
    const ax = Math.abs(x);
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, b = ax;
    for (let i = 0; i < 24; i++) {
      const a = Math.floor(b);
      const h2 = a * h1 + h0;
      const k2 = a * k1 + k0;
      h0 = h1; h1 = h2; k0 = k1; k1 = k2;
      if (k1 > 10000) return null;
      if (Math.abs(ax - h1 / k1) < 1e-11 * Math.max(1, ax)) return (x < 0 ? '-' : '') + h1 + '/' + k1;
      const fr = b - a;
      if (fr < 1e-12) break;
      b = 1 / fr;
    }
    return null;
  }
  const pretty = (s) => s
    .replace(/\*/g, ' × ')
    .replace(/\//g, ' ÷ ')
    .replace(/\+/g, ' + ')
    .replace(/([\w)%!])\s*-\s*/g, '$1 − ')
    .replace(/sqrt\s?/g, '√')
    .replace(/\s+/g, ' ')
    .trim();

  function equation(L, R) {
    const tl = tokenize(L);
    const tr = tokenize(R);
    const hasX = (tk) => tk.some((t) => t.k === 'i' && t.v === 'x');
    if (!hasX(tl) && !hasX(tr)) {
      const a = evaluate(tl);
      const b = evaluate(tr);
      const ok = Math.abs(N(a) - N(b)) <= 1e-9 * Math.max(1, Math.abs(N(a)), Math.abs(N(b)));
      return { kind: 'bool', result: ok ? 'Verdadero' : 'Falso', lines: [fmt(a) + (ok ? ' = ' : ' ≠ ') + fmt(b)] };
    }
    const g = (x) => {
      try { return N(evaluate(tl, { x })) - N(evaluate(tr, { x })); } catch (e) { return NaN; }
    };
    const c = g(0);
    const A = (g(1) + g(-1)) / 2 - c;
    const B = (g(1) - g(-1)) / 2;
    const isPoly = [2, -3, 5, 0.5].every((t) => {
      const v = g(t);
      return Number.isFinite(v) && Math.abs(v - (A * t * t + B * t + c)) <= 1e-9 * (1 + Math.abs(v));
    }) && Number.isFinite(c) && Number.isFinite(A) && Number.isFinite(B);
    if (isPoly) {
      const sc = 1 + Math.abs(A) + Math.abs(B) + Math.abs(c);
      const tiny = (v) => Math.abs(v) < 1e-10 * sc;
      if (tiny(A) && tiny(B)) {
        const idn = tiny(c);
        return { kind: 'eq', result: idn ? 'Infinitas soluciones' : 'Sin solución', lines: [idn ? 'Es una identidad: se cumple para cualquier x' : 'No existe ningún x que la cumpla'] };
      }
      if (tiny(A)) {
        const x = -c / B;
        const lines = ['Ecuación lineal: ' + fmt(B) + 'x ' + (c < 0 ? '− ' + fmt(-c) : '+ ' + fmt(c)) + ' = 0', 'x = ' + fmt(x)];
        return { kind: 'eq', result: 'x = ' + fmt(x), lines, fraction: frac(x) };
      }
      const disc = B * B - 4 * A * c;
      const head = 'Ecuación cuadrática: a = ' + fmt(A) + ', b = ' + fmt(B) + ', c = ' + fmt(c);
      const dl = 'Discriminante Δ = ' + fmt(disc);
      if (Math.abs(disc) < 1e-10 * (B * B + Math.abs(4 * A * c) + 1e-300)) {
        const x = -B / (2 * A);
        return { kind: 'eq', result: 'x = ' + fmt(x), lines: [head, dl, 'Raíz doble: x = ' + fmt(x)] };
      }
      if (disc > 0) {
        const sq = Math.sqrt(disc);
        const r = [(-B - sq) / (2 * A), (-B + sq) / (2 * A)].sort((p, q) => p - q);
        return { kind: 'eq', result: 'x₁ = ' + fmt(r[0]) + ',  x₂ = ' + fmt(r[1]), lines: [head, dl, 'x₁ = ' + fmt(r[0]), 'x₂ = ' + fmt(r[1])] };
      }
      const re = -B / (2 * A);
      const im = Math.sqrt(-disc) / (2 * Math.abs(A));
      return { kind: 'eq', result: 'Sin soluciones reales', lines: [head, dl, 'No tiene soluciones reales', 'Soluciones complejas: x = ' + fmt(re) + ' ± ' + fmt(im) + 'i'] };
    }
    const roots = [];
    const addRoot = (r, tol) => {
      if (Math.abs(r) < 1e-9) r = 0;
      const t = tol === undefined ? 1e-6 * Math.max(1, Math.abs(r)) : tol;
      if (!roots.some((q) => Math.abs(q - r) <= t)) roots.push(r);
    };
    const bis = (lo, hi) => {
      let a = lo, b = hi, fa = g(a);
      for (let i = 0; i < 100; i++) {
        const m = (a + b) / 2;
        const fm = g(m);
        if (fm === 0) return m;
        if (fa * fm < 0) b = m; else { a = m; fa = fm; }
      }
      return (a + b) / 2;
    };
    const scan = (lo, hi, n, wide) => {
      const step = (hi - lo) / n;
      const tolW = wide ? 2 * step : undefined;
      const ys = new Float64Array(n + 1);
      for (let i = 0; i <= n; i++) ys[i] = g(lo + i * step);
      for (let i = 1; i <= n; i++) {
        const a = ys[i - 1], b = ys[i];
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        if (i === 1 && a === 0) addRoot(lo, tolW);
        if (b === 0) addRoot(lo + i * step, tolW);
        else if (a * b < 0) {
          const r = bis(lo + (i - 1) * step, lo + i * step);
          if (Math.abs(g(r)) <= Math.min(Math.abs(a), Math.abs(b))) addRoot(r, tolW);
        }
      }
      for (let i = 1; i < n; i++) {
        const a = ys[i - 1], b = ys[i], d = ys[i + 1];
        if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(d)) continue;
        if (a * b > 0 && b * d > 0 && Math.abs(b) <= Math.abs(a) && Math.abs(b) <= Math.abs(d)) {
          let x0 = lo + (i - 1) * step, x1 = lo + (i + 1) * step;
          for (let k = 0; k < 90; k++) {
            const m1 = x0 + (x1 - x0) / 3, m2 = x1 - (x1 - x0) / 3;
            if (Math.abs(g(m1)) < Math.abs(g(m2))) x1 = m2; else x0 = m1;
          }
          const m = (x0 + x1) / 2;
          if (Math.abs(g(m)) < 1e-8 * Math.max(Math.abs(a), Math.abs(d)) && !roots.some((q) => Math.abs(q - m) <= 2 * step)) addRoot(m, tolW);
        }
      }
    };
    scan(-1000, 1000, 20000, false);
    scan(-100000, 100000, 20000, true);
    roots.sort((p, q) => p - q);
    if (!roots.length) return { kind: 'eq', result: 'Sin soluciones reales', lines: ['No encontré soluciones reales entre -100,000 y 100,000'] };
    let shown = roots;
    if (roots.length > 10) shown = roots.slice().sort((p, q) => Math.abs(p) - Math.abs(q)).slice(0, 8).sort((p, q) => p - q);
    const lines = shown.map((r, i) => (shown.length > 1 ? 'x' + '₁₂₃₄₅₆₇₈₉'.charAt(i) + ' = ' : 'x = ') + fmt(r));
    const result = lines.join(',  ');
    if (shown.length < roots.length) lines.push('Hay más soluciones (la función se repite). Muestro las 8 más cercanas a 0');
    return { kind: 'eq', result, lines };
  }

  function calc(input, commit) {
    try {
      const raw = String(input === undefined || input === null ? '' : input).trim();
      if (!raw) fail('Escribe una operación');
      const s = prep(raw).replace(/=+\s*$/, '').trim();
      if (!s) fail('Escribe una operación');
      const show = pretty(s);
      if (s.indexOf('=') >= 0) {
        const parts = s.split('=');
        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) fail('La ecuación debe tener la forma: lado izquierdo = lado derecho');
        return Object.assign({ ok: true, show }, equation(parts[0], parts[1]));
      }
      const v = evaluate(tokenize(s));
      const result = fmt(v);
      if (commit && typeof v !== 'string') state.ans = v;
      const fraction = typeof v === 'number' ? frac(v) : null;
      return { ok: true, kind: 'num', show, result, plain: plainOf(v), fraction };
    } catch (e) {
      if (e instanceof RangeError) return { ok: false, error: 'El número es demasiado grande' };
      return { ok: false, error: e.message };
    }
  }

  return { calc, state };
}

function construirHtml(inicial) {
  const ini = JSON.stringify(inicial || '').replace(/</g, '\\u003c');
  const motor = makeEngine.toString();
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Calculadora</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:#202124;color:#e8eaed;font-family:Roboto,system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh}
.app{max-width:440px;margin:0 auto;padding:14px 14px 22px}
.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.brand{font-size:15px;font-weight:600;letter-spacing:.3px;color:#bdc1c6}
.ib{background:#2d2f33;border:0;color:#e8eaed;width:38px;height:38px;border-radius:50%;font-size:17px;cursor:pointer}
.screen{position:relative;border:1px solid #5f6368;border-radius:18px;padding:12px 16px 14px;min-height:150px;display:flex;flex-direction:column;justify-content:space-between;text-align:right;background:#25272b}
.expr{min-height:26px;color:#9aa0a6;font-size:17px;word-break:break-all;padding-left:44px}
.res{font-size:3.2rem;line-height:1.15;word-break:break-all;cursor:pointer;margin-top:6px}
.res .ln{font-size:1.45rem;line-height:1.5}
.res .ln:first-child{font-size:1.1rem;color:#9aa0a6}
.res sup{font-size:.55em}
.res.err{color:#f28b82;font-size:1.1rem!important;line-height:1.35}
.res.pre{color:#e8eaed}
.sub{min-height:20px;color:#8ab4f8;font-size:14px;margin-top:2px}
#bs{position:absolute;left:10px;top:10px;background:transparent;border:0;color:#9aa0a6;font-size:20px;width:38px;height:38px;border-radius:50%;cursor:pointer}
#bs:active{background:#3c4043}
.hist{margin-top:10px;border:1px solid #3c4043;border-radius:14px;max-height:220px;overflow:auto;background:#25272b}
.hist[hidden],.pad[hidden]{display:none}
.hi{padding:10px 14px;border-bottom:1px solid #303134;text-align:right;cursor:pointer}
.hi small{display:block;color:#9aa0a6;font-size:13px}
.hi b{font-size:18px;font-weight:500}
.hi.empty{color:#9aa0a6;text-align:center;cursor:default}
.hclr{width:100%;padding:10px;background:transparent;border:0;color:#f28b82;font-size:13px;cursor:pointer}
.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.pad button{height:56px;border:0;border-radius:999px;font-size:21px;color:#e8eaed;background:#35363a;cursor:pointer;transition:transform .05s}
.pad button:active{transform:scale(.95);filter:brightness(1.25)}
.pad .o{background:#2b3550;color:#a8c7fa}
.pad .ac{background:#2b3550;color:#f28b82}
.pad .eq{background:#3b78e7;color:#fff}
.pad .f{height:46px;font-size:16px;background:#2d2f33;border-radius:14px}
.pad .on{background:#3b78e7;color:#fff}
.seg{display:flex;margin:12px auto 0;width:200px;border:1px solid #5f6368;border-radius:999px;overflow:hidden}
.seg button{flex:1;padding:11px 0;border:0;background:transparent;color:#e8eaed;font-size:16px;cursor:pointer}
.seg .on{background:#2b3550;color:#a8c7fa}
.foot{text-align:center;color:#6f7378;font-size:12px;margin-top:16px}
</style></head><body>
<div class="app">
<div class="top"><div class="brand">🧮 Calculadora</div><button class="ib" id="hb" title="Historial">🕘</button></div>
<div class="screen"><button id="bs" title="Borrar">⌫</button><div class="expr" id="ex"></div><div><div class="res" id="rs">0</div><div class="sub" id="sb"></div></div></div>
<div class="hist" id="hs" hidden></div>
<div class="pad" id="fx" hidden></div>
<div class="pad" id="bp"></div>
<div class="seg"><button id="t1" class="on">123</button><button id="t2">Fx</button></div>
<div class="foot">ⓘ Powered by MaxiProyec</div>
</div>
<script>
const E = (${motor})();
const INI = ${ini};
const $ = (id) => document.getElementById(id);
let expr = '', done = false, last = null, inv = false, hist = [];
try { hist = JSON.parse(localStorage.getItem('mp_calc_hist') || '[]'); } catch (e) { hist = []; }
const saveH = () => { try { localStorage.setItem('mp_calc_hist', JSON.stringify(hist.slice(0, 30))); } catch (e) {} };
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sup = (t) => esc(t).replace(/\\^(-?\\d+)/g, '<sup>$1</sup>');
const BASIC = [['(', ')', '%', 'AC'], ['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['0', '.', '=', '+']];
const FX = [['DEG', 'sin', 'cos', 'tan'], ['INV', 'ln', 'log', '√'], ['π', 'e', '^', '!'], ['x', 'x=', 'ans', ','], ['abs', 'x²', 'mod', 'nCr']];
const INS = { 'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(', 'asin': 'asin(', 'acos': 'acos(', 'atan': 'atan(', 'ln': 'ln(', 'log': 'log(', 'eˣ': 'exp(', '10ˣ': '10^(', '√': '√(', 'x²': '^2', 'x=': '=', 'abs': 'abs(', 'mod': ' mod ', 'nCr': 'ncr(' };
const INVL = { 'sin': 'asin', 'cos': 'acos', 'tan': 'atan', 'ln': 'eˣ', 'log': '10ˣ' };
function build(id, rows, fx) {
  const box = $(id);
  rows.forEach((r) => r.forEach((k) => {
    const b = document.createElement('button');
    b.textContent = k;
    b.dataset.k = k;
    if (fx) b.className = 'f';
    else if ('÷×−+'.indexOf(k) >= 0 || k === '%' || k === '(' || k === ')') b.className = 'o';
    if (k === 'AC') b.className = 'ac';
    if (k === '=') b.className = 'eq';
    b.onclick = () => press(b.dataset.k);
    box.appendChild(b);
  }));
}
build('bp', BASIC, false);
build('fx', FX, true);
function labels() {
  document.querySelectorAll('#fx button').forEach((b) => {
    const k = b.dataset.k;
    if (INVL[k]) b.textContent = inv ? INVL[k] : k;
    if (k === 'INV') b.className = 'f' + (inv ? ' on' : '');
    if (k === 'DEG') { b.textContent = E.state.deg ? 'DEG' : 'RAD'; }
  });
}
function back() {
  expr = expr.replace(/(?:asin\\(|acos\\(|atan\\(|sin\\(|cos\\(|tan\\(|ln\\(|log\\(|exp\\(|ncr\\(|abs\\(|√\\(| mod |ans|.)$/u, '');
}
function press(k) {
  if (k === 'AC') { expr = ''; done = false; last = null; return render(); }
  if (k === '=') return equals();
  if (k === 'DEG') { E.state.deg = !E.state.deg; labels(); return render(); }
  if (k === 'INV') { inv = !inv; labels(); return; }
  let t = k;
  if (INVL[k] && inv) t = INS[INVL[k]]; else if (INS[k]) t = INS[k];
  const isOp = /^[+\\-×÷−^!%]$/.test(t) || t === ' mod ' || t === '^2';
  if (done) {
    if (isOp) expr = 'ans'; else expr = '';
    done = false;
  }
  expr += t;
  render();
}
function equals() {
  if (!expr.trim()) return;
  const r = E.calc(expr, true);
  last = r;
  done = true;
  if (r.ok) {
    hist.unshift({ e: expr, r: r.lines && r.kind !== 'num' ? r.result : r.result });
    saveH();
  }
  render();
}
function render() {
  const ex = $('ex'), rs = $('rs'), sb = $('sb');
  rs.className = 'res';
  sb.textContent = '';
  if (done && last) {
    if (!last.ok) {
      ex.textContent = expr;
      rs.className = 'res err';
      rs.textContent = '⚠ ' + last.error;
      return;
    }
    ex.textContent = last.show + ' =';
    if (last.kind === 'num') {
      rs.innerHTML = sup(last.result);
      rs.style.fontSize = Math.max(1.5, 3.2 - Math.max(0, last.result.length - 9) * 0.1) + 'rem';
      if (last.fraction) sb.textContent = 'Fracción: ' + last.fraction;
    } else {
      rs.style.fontSize = '';
      rs.innerHTML = last.lines.map((l) => '<div class="ln">' + sup(l) + '</div>').join('');
    }
    return;
  }
  rs.style.fontSize = Math.max(1.6, 3.2 - Math.max(0, expr.length - 8) * 0.11) + 'rem';
  rs.textContent = expr || '0';
  ex.textContent = '';
  if (expr && !/=/.test(expr)) {
    const p = E.calc(expr, false);
    if (p.ok && p.kind === 'num' && p.result !== expr.trim()) ex.textContent = '= ' + p.result.replace(/\\^/g, '^');
  }
}
function drawHist() {
  const h = $('hs');
  if (!hist.length) { h.innerHTML = '<div class="hi empty">Sin historial todavía</div>'; return; }
  h.innerHTML = hist.map((x, i) => '<div class="hi" data-i="' + i + '"><small>' + esc(x.e) + '</small><b>' + sup(x.r) + '</b></div>').join('') + '<button class="hclr" id="hc">Borrar historial</button>';
  h.querySelectorAll('.hi[data-i]').forEach((d) => { d.onclick = () => { expr = hist[+d.dataset.i].e; done = false; render(); h.hidden = true; }; });
  const c = $('hc');
  if (c) c.onclick = () => { hist = []; saveH(); drawHist(); };
}
$('hb').onclick = () => { const h = $('hs'); h.hidden = !h.hidden; if (!h.hidden) drawHist(); };
$('bs').onclick = () => { if (done) { done = false; } else back(); render(); };
$('t1').onclick = () => { $('fx').hidden = true; $('t1').className = 'on'; $('t2').className = ''; };
$('t2').onclick = () => { $('fx').hidden = false; $('t2').className = 'on'; $('t1').className = ''; labels(); };
$('rs').onclick = () => {
  if (done && last && last.ok && last.kind === 'num') {
    try { navigator.clipboard.writeText(last.plain); $('sb').textContent = 'Copiado ✓'; } catch (e) {}
  }
};
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'Enter') { e.preventDefault(); return equals(); }
  if (k === 'Backspace') { if (done) done = false; else back(); return render(); }
  if (k === 'Escape') return press('AC');
  if (k.length !== 1 || k === ' ') return;
  const m = { '*': '×', '/': '÷', '-': '−' };
  if (!/[0-9a-zA-Z.,()+\\-*\\/^!%=]/.test(k)) return;
  e.preventDefault();
  press(m[k] || k.toLowerCase());
});
labels();
if (INI) { expr = INI; equals(); } else render();
</script></body></html>`;
}

export default {
  names: [".calc", ".calculadora", ".calcular"],
  desc: "Calculadora digital como la de Google pero mejor: operaciones, porcentajes, funciones, factoriales gigantes y ecuaciones con x",
  category: "Tools",
  usage: ".calc <operación>",
  handler: async ({ sock, from, msg, cleanText, reply }) => {
    const entrada = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const firma = config.botNameShort || "MaxiProyec";
    let texto = "";
    if (entrada) {
      const r = makeEngine().calc(entrada, true);
      if (!r.ok) {
        return reply({
          text: tarjetaAviso("CALCULADORA", r.error + "\n\nEjemplos: .calc 397 por 5  |  .calc 20% de 350  |  .calc sin(30)+2^10  |  .calc 100!  |  .calc x^2-5x+6=0")
        });
      }
      const cuerpo = r.kind === "num" ? "*" + r.result + "*" + (r.fraction ? "\n≈ fracción " + r.fraction : "") : r.lines.join("\n");
      texto = "🧮 *CALCULADORA*\n\n" + r.show + " =\n" + cuerpo + "\n\n> ⓘ Powered by " + firma;
    }
    try {
      if (typeof sock.sendHtml !== "function") throw new Error("sin sendHtml");
      await sock.sendHtml(from, construirHtml(entrada), [], msg, {});
      if (texto) await sock.sendMessage(from, { text: texto }, { quoted: msg });
    } catch (e) {
      console.log("[CALC] HTML falló: " + e.message);
      if (!texto) {
        return reply({
          text: tarjetaUso({
            comando: ".calc <operación>",
            ejemplo: ".calc 397 por 5   |   .calc 20% de 350   |   .calc x^2-5x+6=0",
            nota: "Resuelve operaciones, porcentajes, funciones, factoriales y ecuaciones con x."
          })
        });
      }
      await sock.sendMessage(from, { text: texto }, { quoted: msg });
    }
  }
};
