/* pixelfx (MIT, github.com/patch-gg/pixelfx) bundled for Grimoire Clash by tools/bundle-pixelfx.py. See vendor/pixelfx/LICENSE + NOTICE.md */
(function () {
const __M = {}, __C = {};
function __req(p) { if (__C[p]) return __C[p]; const e = (__C[p] = {}); __M[p](e); return e; }
__M["fx/arcane/star-fall.js"] = function (__e) {
// The slanted streaks landing with a ring and a kick of bits follow Sprite Fusion's open-source rain
// (https://www.spritefusion.com/pixel-art-vfx/rain), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, PAL, fit, band, flare, sparkle, clamp, ease, TAU, WHITE} = __req("core/index.js");

const N = 11, SPREAD = 46, H = 124, SLANT = 0.38, TRAIL = 0.17;

const meta = {
  name: "Star fall",
  desc: "Stars streak down on long trails across an area, each landing with a white flash, a ring across the floor and a kick of sparks.",
  tags: ["arcane", "star", "meteor", "rain", "aoe", "magic", "ground", "one-shot"],
  size: [232, 172],
  origin: [124, 150],
  duration: 2.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, seed: 13 },
};

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]] }), lights = new Lights();
  // where they land: spread over the area in a shuffled order, a little in front of or behind the line
  const xs = Array.from({ length: N }, (_, i) => -SPREAD + ((i + R.range(0.2, 0.8)) * 2 * SPREAD) / N);
  for (let i = N - 1; i > 0; i--) {
    const j = R.int(0, i);
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  const stars = xs.map((x, i) => {
    const y = R.range(-3, 2), h = H * R.range(0.85, 1);
    return { x, y, sx: x - h * SLANT, sy: y - h, t0: 0.04 + i * 0.105 + R.range(0, 0.05), T: R.range(0.3, 0.4), landed: false, big: R.chance(0.35), ph: R.range(0, TAU) };
  });
  const hits = [];
  let t = 0;
  const at = (s, tt) => {
    const q = clamp((tt - s.t0) / s.T), e = q * (0.35 + 0.65 * q);
    return [s.sx + (s.x - s.sx) * e, s.sy + (s.y - s.sy) * e, q];
  };

  function star(p, s) {
    const [x, y, q] = at(s, t);
    // the trail: a long tapered streak back up its path, white at the head, thinning into violet
    const n = 20;
    for (let k = n; k >= 1; k--) {
      const [ax, ay] = at(s, t - (k * TRAIL) / n), [bx, by] = at(s, t - ((k - 1) * TRAIL) / n), u = k / n;
      if (t - (k * TRAIL) / n < s.t0) continue;
      const c = u < 0.15 ? WHITE : u < 0.4 ? C[6] : u < 0.7 ? C[5] : C[4];
      // a second line beside the first near the head gives it body; the tail thins to a dithered thread
      if (u < (s.big ? 0.55 : 0.35)) p.line(ax + 1, ay, bx + 1, by, u < 0.2 ? C[6] : C[5], 1.1 - u * 1.4);
      p.line(ax, ay, bx, by, c, 1.3 - u);
      if (k % 3 === 0) p.glow(ax, ay, 7 * (1 - u) + 2, C[5], 0.3 * (1 - u));
    }
    // the head: a twinkling four-point star
    if (s.big) flare(p, x, y, 7 + 1.5 * Math.sin(t * 40 + s.ph), 0.8, C);
    else sparkle(p, x, y, 3.5 + Math.sin(t * 40 + s.ph), C[6], C[5], 0.6);
    p.circle(x, y, s.big ? 1.6 : 1.1, WHITE);
    p.glow(x, y, s.big ? 18 : 13, C[5], 0.6);
    p.glow(x, y, 5, WHITE, 0.35);
    return q;
  }

  function hit(p, h, far) {
    const k = (t - h.t) / 0.45;
    if (k < 0 || k >= 1) return;
    band(p, h.x, h.y, 3 + (h.big ? 22 : 16) * ease.outCubic(k), 0.26, Math.max(1, 2.5 * (1 - k)), 1.15 - k, [C[3], C[5], C[6], WHITE], (g) => Math.sin(g) < 0 === far, k < 0.2);
  }

  return {
    update(dt) {
      t += dt;
      for (const s of stars) {
        if (t < s.t0 || s.landed) continue;
        const [x, y, q] = at(s, t);
        if (R.chance(0.55)) ps.spawn(P.STAR, x + R.range(-1.5, 1.5), y + R.range(-1.5, 1.5), R.range(-12, 12), R.range(-8, 4), R.range(0.35, 0.7), R.pick([WHITE, C[6], C[5]]), R.chance(0.7) ? R.range(0.4, 0.9) : R.range(1.2, 1.8));
        if (q >= 1) {
          s.landed = true;
          hits.push({ x: s.x, y: s.y, t, big: s.big });
          lights.add(s.x, s.y - 12, s.big ? 46 : 38, C[5], 0.9, 0.32);
          lights.add(s.x, s.y - 3, 16, WHITE, 0.8, 0.08);
          for (let i = 0; i < (s.big ? 14 : 9); i++) {
            const a = -Math.PI / 2 + R.range(-1.35, 1.35), sp = R.range(50, 150);
            ps.spawn(P.SPARK, s.x, Math.min(-1, s.y - 1), Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.5));
          }
          for (let i = 0; i < 4; i++) ps.spawn(P.STAR, s.x + R.range(-4, 4), s.y - R.range(2, 8), R.range(-15, 15), -R.range(10, 35), R.range(0.4, 0.8), R.pick([WHITE, C[6]]), R.range(0.8, 2));
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the area lit beneath while they fall
      const k = clamp(t / 0.3) * (1 - clamp((t - 1.7) / 0.7));
      if (k > 0) for (const x of [-36, 0, 36]) p.glow(x, -1, 40, C[4], 0.14 * k);
      for (const h of hits) hit(p, h, true);
      // a glowing mark where each landed, cooling away
      for (const h of hits) {
        const k2 = 1 - (t - h.t) / 0.7;
        if (k2 <= 0) continue;
        p.dot(h.x, h.y, k2 > 0.6 ? WHITE : C[6], k2 * 1.5);
        for (const dx of [-1, 1]) p.dot(h.x + dx, h.y, C[5], k2 * 1.2);
        p.glow(h.x, h.y - 1, 10, C[5], 0.35 * k2);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      for (const s of stars) if (t >= s.t0 && !s.landed) star(p, s);
      for (const h of hits) {
        hit(p, h, false);
        const k = (t - h.t) / 0.22;
        if (k < 0 || k >= 1) continue;
        if (k < 0.35) p.circle(h.x, h.y - 2, 5 * (1 - k / 0.35) + 1, WHITE);
        flare(p, h.x, h.y - 2, (h.big ? 16 : 12) * Math.pow(1 - k, 1.5) + 2, 1 - k, C);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["core/index.js"] = function (__e) {
// pixelfx core: everything an effect imports comes from here.

Object.assign(__e, __req("core/math.js"));
Object.assign(__e, __req("core/color.js"));
Object.assign(__e, __req("core/particles.js"));
Object.assign(__e, __req("core/shapes.js"));
{ const __t = __req("core/sim.js"); __e.Particles = __t.Particles; __e.Bits = __t.Bits; __e.Lights = __t.Lights; __e.Blazes = __t.Blazes; __e.P = __t.P; __e.PF = __t.PF; __e.B = __t.B; __e.GRAVITY = __t.GRAVITY; __e.FIRE_RAMP = __t.FIRE_RAMP; __e.SMOKE_RAMP = __t.SMOKE_RAMP; __e.sparkle = __t.sparkle; __e.flare = __t.flare; __e.band = __t.band; __e.crystal = __t.crystal; }
{ const __t = __req("core/painter.js"); __e.Painter = __t.Painter; }
{ const __t = __req("core/font.js"); __e.FONTS = __t.FONTS; __e.textWidth = __t.textWidth; }
{ const __t = __req("core/fx.js"); __e.createFrame = __t.createFrame; __e.clearFrame = __t.clearFrame; __e.createFx = __t.createFx; __e.composite = __t.composite; __e.painterFor = __t.painterFor; __e.resolveOptions = __t.resolveOptions; }
{ const __t = __req("core/actor.js"); __e.stockActor = __t.stockActor; __e.drawActor = __t.drawActor; __e.actorAlphaOf = __t.actorAlphaOf; __e.HERO = __t.HERO; __e.HERO2 = __t.HERO2; __e.HERO_PAL = __t.HERO_PAL; __e.DUMMY_PAL = __t.DUMMY_PAL; }
{ const __t = __req("core/scene.js"); __e.backdrop = __t.backdrop; __e.BACKDROPS = __t.BACKDROPS; }
{ const __t = __req("core/act.js"); __e.createAct = __t.createAct; __e.actBounds = __t.actBounds; __e.actSpan = __t.actSpan; __e.actTiming = __t.actTiming; __e.poseAt = __t.poseAt; __e.lerpPose = __t.lerpPose; __e.Target = __t.Target; __e.STAND = __t.STAND; __e.SKINS = __t.SKINS; __e.posed = __t.posed; }
{ const __t = __req("core/rig.js"); __e.skeleton = __t.skeleton; __e.posedParts = __t.posedParts; }
{ const __t = __req("core/poses.js"); __e.READY = __t.READY; }
{ const __t = __req("core/chain.js"); __e.chain = __t.chain; __e.shiftKeys = __t.shiftKeys; __e.shiftHits = __t.shiftHits; }


};

__M["core/chain.js"] = function (__e) {
// Moves: several effects played as one. A cue says which effect, when, where and for how long; a projectile is just an
// effect whose x is a function of time. It's an ordinary effect from the outside: it plays, recolors and exports.

const {createFx} = __req("core/fx.js");

/**
 * create(o) for a list of cues: { fx (an effect module), t (when it starts), until (cut it off here), x, y (numbers, or
 * functions of the move's time, local space), flip, ...any of that effect's options }.
 */
function chain(cues) {
  return (o) => {
    const list = cues.map(({ fx, t, until, x, y, flip, ...opts }, i) => ({ fx, t: t ?? 0, until: until ?? Infinity, x: x ?? 0, y: y ?? 0, flip: !!flip, opts: { ...opts, seed: (o.seed ?? 1) + i }, inst: null, over: false }));
    let t = 0;
    const at = (v) => (typeof v === "function" ? v(t) : v);
    const each = (p, layer) => {
      const { frame, tx, ty, fx: sign, cs, sn, fade, lightK } = p;
      for (const c of list) {
        if (!c.inst || c.over) continue;
        c.inst.options.x = tx + sign * at(c.x);
        c.inst.options.y = ty + at(c.y);
        c.inst.options.flip = sign < 0 !== c.flip;
        c.inst.draw(frame, layer);
      }
      // each one places the painter for itself: put it back for whoever draws next
      Object.assign(p, { tx, ty, fx: sign, cs, sn, fade, lightK });
    };
    return {
      update(dt) {
        t += dt;
        for (const c of list) {
          if (c.over || t < c.t) continue;
          if (!c.inst) c.inst = createFx(c.fx, c.opts);
          else c.inst.update(dt);
          if (t >= c.until || (c.inst.done() && !c.fx.meta?.loop)) c.over = true;
        }
      },
      drawBack: (p) => each(p, "back"),
      draw: (p) => each(p, "front"),
    };
  };
}

/** Reuse an act's keys in a longer move: later by dt, moved along by dx, with anything else laid over each pose. */
const shiftKeys = (keys, dt, { dx = 0, ...over } = {}) => keys.map(([t, pose, how]) => [t + dt, { ...pose, ...over, x: (pose.x ?? 0) + dx }, how]);
/** The same for hits. */
const shiftHits = (hits, dt) => hits.map((h) => ({ ...h, t: h.t + dt }));

__e.chain = chain; __e.shiftKeys = shiftKeys; __e.shiftHits = shiftHits;
};

__M["core/fx.js"] = function (__e) {
// Frames and live effect instances.

const {Painter} = __req("core/painter.js");
const {clamp} = __req("core/math.js");
const {stockActor} = __req("core/actor.js");
const {fit, toHex} = __req("core/color.js");

/**
 * A frame: w x h pixels whose top-left sits at (ox, oy) in world space. `color` holds opaque pixels,
 * `light` additive glow; composite() puts them together. Same shape as Sprite Fusion's VFX frames.
 */
function createFrame(w, h, ox = 0, oy = 0) {
  return { w, h, ox, oy, color: new Uint32Array(w * h), light: new Uint32Array(w * h) };
}
function clearFrame(f) {
  f.color.fill(0);
  f.light.fill(0);
  return f;
}

const painters = new WeakMap();
/** The painter for a frame (one per frame, reused). */
function painterFor(frame) {
  let p = painters.get(frame);
  if (!p) painters.set(frame, (p = new Painter(frame)));
  return p.reset();
}

const FADE = 0.3;

const isRamp = (v) => Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "number" || /^#[0-9a-f]{3,8}$/i.test(c));

/**
 * An effect's options: its defaults with the caller's on top. Any color ramp (palette, or another ramp option
 * like dust or smoke) of a different length than its default is resampled to the default's length, so effects
 * can index steps by number whatever a caller passes.
 */
function resolveOptions(meta, o = {}) {
  const opts = { ...(meta.options ?? {}), ...o };
  for (const [k, def] of Object.entries(meta.options ?? {}))
    if (isRamp(def) && isRamp(o[k]) && o[k].length !== def.length) opts[k] = fit(o[k], def.length).map(toHex);
  if (meta.actor && !opts.actor) opts.actor = stockActor(meta.actor === 2 ? 2 : 1);
  return opts;
}

/**
 * A live instance of an effect module: { update(dt), draw(frame, layer), stop(), done() }.
 * o: { x, y, flip, angle, seed, palette, light (glow strength), actor, ...the effect's own options }.
 * draw(frame, "back") draws what goes behind a character, "front" what goes in front, nothing both.
 */
function createFx(mod, o = {}) {
  const meta = mod.meta ?? {};
  const opts = resolveOptions(meta, o);
  const impl = mod.create ? mod.create(opts) : mod;
  const D = meta.duration ?? 1;
  let t = 0, stopAt = Infinity;
  return {
    meta,
    options: opts,
    get t() {
      return t;
    },
    update(dt) {
      t += dt;
      if (!impl.update) return;
      // simulations step at 120 Hz or finer whatever the caller's frame rate, so they look the same everywhere
      const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
      for (let i = 0; i < n; i++) impl.update(dt / n, opts);
    },
    draw(frame, layer) {
      const p = painterFor(frame);
      p.place(opts.x ?? 0, opts.y ?? 0, !!opts.flip, opts.angle ?? 0);
      p.fade = stopAt === Infinity ? 1 : clamp(1 - (t - stopAt) / FADE);
      p.lightK = opts.light ?? 1;
      const tt = meta.loop ? t % D : Math.min(t, D);
      if (layer !== "front" && impl.drawBack) {
        p.layer = "back";
        impl.drawBack(p, tt, opts);
      }
      if (layer !== "back") {
        p.layer = "front";
        impl.draw(p, tt, opts);
      }
    },
    /** Let it end: loops fade out, one-shots cut short. */
    stop() {
      if (stopAt === Infinity) stopAt = t;
    },
    done() {
      return t - stopAt >= FADE || (!meta.loop && t >= D);
    },
  };
}

/**
 * Color over a background, plus light, into RGBA bytes (a Uint8ClampedArray or Buffer, w * h * 4).
 * bg: null for transparent, a color number, or a Uint32Array of the frame's size. Over transparency, light
 * becomes color with alpha (its brightest channel), which reads as additive over dark backgrounds.
 */
function composite(f, out, bg = null, lightK = 1) {
  const n = f.w * f.h, C = f.color, L = f.light, flat = typeof bg === "number";
  for (let i = 0; i < n; i++) {
    const c = C[i], l = L[i] & 0xffffff;
    let r, g, b, a;
    const ca = c >>> 24;
    if (ca === 255) {
      r = c & 255; g = (c >>> 8) & 255; b = (c >>> 16) & 255; a = 255;
    } else if (bg === null) {
      // translucent color over nothing keeps its alpha
      r = c & 255; g = (c >>> 8) & 255; b = (c >>> 16) & 255; a = ca;
    } else {
      const k = flat ? bg : bg[i], f = ca / 255;
      r = (c & 255) * f + (k & 255) * (1 - f); g = ((c >>> 8) & 255) * f + ((k >>> 8) & 255) * (1 - f);
      b = ((c >>> 16) & 255) * f + ((k >>> 16) & 255) * (1 - f); a = 255;
    }
    if (l) {
      const lr = (l & 255) * lightK, lg = ((l >>> 8) & 255) * lightK, lb = ((l >>> 16) & 255) * lightK;
      if (a < 255) {
        // over transparency: premultiply what's there, add the light, divide by the new alpha
        const pa = a / 255, pr = r * pa + lr, pg = g * pa + lg, pb = b * pa + lb;
        const na = Math.min(1, Math.max(pa, Math.max(lr, lg, lb) / 255));
        if (na > 0) { r = Math.min(255, pr / na); g = Math.min(255, pg / na); b = Math.min(255, pb / na); a = na * 255; }
      } else {
        r = Math.min(255, r + lr); g = Math.min(255, g + lg); b = Math.min(255, b + lb);
      }
    }
    const j = i * 4;
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = a;
  }
  return out;
}

__e.createFrame = createFrame; __e.clearFrame = clearFrame; __e.painterFor = painterFor; __e.resolveOptions = resolveOptions; __e.createFx = createFx; __e.composite = composite;
};

__M["core/color.js"] = function (__e) {
// Colors are 32-bit integers laid out like ImageData bytes (R, G, B, A in memory),
// so a frame's color buffer can be shown with new ImageData(new Uint8ClampedArray(buf.buffer), w, h).

const {clamp} = __req("core/math.js");

const rgb = (r, g, b) => (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
const red = (c) => c & 255;
const green = (c) => (c >>> 8) & 255;
const blue = (c) => (c >>> 16) & 255;

/** "#rgb" or "#rrggbb" (or a color number, passed through) to a color number. */
function hex(h) {
  if (typeof h === "number") return h;
  let s = h.replace("#", "");
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const v = parseInt(s.slice(0, 6), 16);
  return rgb((v >> 16) & 255, (v >> 8) & 255, v & 255);
}
const toHex = (c) => "#" + [red(c), green(c), blue(c)].map((v) => v.toString(16).padStart(2, "0")).join("");

/** Linear mix of two colors. */
function mix(a, b, t) {
  t = clamp(t);
  return rgb(red(a) + (red(b) - red(a)) * t, green(a) + (green(b) - green(a)) * t, blue(a) + (blue(b) - blue(a)) * t);
}
/** Multiply a color's brightness by k. */
const scale = (c, k) => rgb(Math.min(255, red(c) * k), Math.min(255, green(c) * k), Math.min(255, blue(c) * k));
/** Perceived brightness 0..1. */
const luma = (c) => (0.299 * red(c) + 0.587 * green(c) + 0.114 * blue(c)) / 255;

/** A list of hex strings (dark to bright) to color numbers. */
const ramp = (list) => list.map(hex);
/**
 * Resample a ramp to exactly n steps, keeping its ends (the darkest and brightest stay put). Lets an effect
 * index steps by number (C[5]) whatever length of palette a caller passes.
 */
function fit(r, n) {
  r = r.map(hex);
  if (r.length === n) return r;
  return Array.from({ length: n }, (_, i) => r[Math.round((i * (r.length - 1)) / Math.max(1, n - 1))]);
}
/** The ramp step for t in 0..1, no blending: pixel art picks a color, it doesn't fade between two. */
const at = (r, t) => r[clamp(Math.floor(t * r.length), 0, r.length - 1)];
/** Blended color along a ramp (for light, where smooth is right). */
function blend(r, t) {
  const x = clamp(t) * (r.length - 1), i = Math.min(r.length - 2, Math.floor(x));
  return mix(r[i], r[i + 1], x - i);
}

// Hue-shifted ramps, dark to bright: shadows lean cool or deep, highlights lean warm or white.
// Effects take `palette` as an option, so any of these (or your own) can recolor them.
const PAL = {
  fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
  ember: ["#1a0a0e", "#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff8a2a", "#ffc46a"],
  lava: ["#14060a", "#380a10", "#6e1210", "#ac2410", "#e8501a", "#ff8c2a", "#ffd25a"],
  smoke: ["#0e0c12", "#1d1a22", "#2e2a35", "#433e4b", "#5c5664", "#7b7484", "#a39cab"],
  dust: ["#1c1610", "#33281c", "#4f3f2c", "#6e5a40", "#927a58", "#b89f78", "#dcc8a2"],
  ice: ["#0c1430", "#162c5c", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
  water: ["#081830", "#0e2e5a", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"],
  electric: ["#0a0f2e", "#172a78", "#2550d0", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"],
  volt: ["#24160a", "#5e3a0c", "#a8680f", "#e8a218", "#ffd23c", "#fff08a", "#ffffff"],
  poison: ["#0d1a0c", "#173a14", "#265e18", "#3f8a1e", "#6cb82a", "#a8e04a", "#e0ff8a"],
  holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
  heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
  arcane: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
  shadow: ["#050308", "#0f0a18", "#1c1230", "#2c1a4a", "#432468", "#5e3290", "#8048b8", "#a970e0"],
  blood: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"],
  earth: ["#140e0a", "#2a1e14", "#47321e", "#69492a", "#8e6638", "#b88a52", "#dcb47c"],
  stone: ["#0e0e12", "#1c1c24", "#2c2c38", "#42424f", "#5c5c6b", "#7d7d8c", "#a4a4b2", "#d0d0da"],
  gold: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
  leaf: ["#0c1a0e", "#163418", "#225224", "#357530", "#4f9a3a", "#7cc048", "#b4e070", "#e4ffb0"],
  wood: ["#160c06", "#2e1a0c", "#4a2c14", "#6a421e", "#8e5c2c", "#b47c40", "#d8a464"],
  metal: ["#0c0e14", "#1c2230", "#2e3648", "#4a5468", "#6e7a90", "#9aa6ba", "#d0d8e6", "#ffffff"],
  bone: ["#1a1814", "#3a352c", "#5e5648", "#8a806c", "#b8ad96", "#e4dcc8", "#fffaf0"],
  neon: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
  cyber: ["#041418", "#08303a", "#0c5260", "#108088", "#18b4b0", "#4ce8d8", "#b4fff0", "#ffffff"],
  matrix: ["#020a04", "#05200c", "#0a3c16", "#106624", "#1a9a34", "#3cd650", "#a4ffa8", "#e8ffe8"],
  candy: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"],
  night: ["#07060d", "#0c0a18", "#131026", "#1b1734", "#241f44", "#2f2956"],
};
/** The same ramps as color numbers. */
const RAMP = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, ramp(v)]));

const WHITE = hex("#ffffff");
const BLACK = hex("#000000");
const INK = hex("#0b0a10");
const PATCH = hex("#f53cd1");

__e.rgb = rgb; __e.red = red; __e.green = green; __e.blue = blue; __e.hex = hex; __e.toHex = toHex; __e.mix = mix; __e.scale = scale; __e.luma = luma; __e.ramp = ramp; __e.fit = fit; __e.at = at; __e.blend = blend; __e.PAL = PAL; __e.RAMP = RAMP; __e.WHITE = WHITE; __e.BLACK = BLACK; __e.INK = INK; __e.PATCH = PATCH;
};

__M["core/math.js"] = function (__e) {
// Numbers, easing, randomness and noise. Everything here is pure and deterministic,
// so an effect drawn at time t always looks the same.

const TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => (b === a ? 0 : (x - a) / (b - a));
const remap = (x, a0, a1, b0, b1) => lerp(b0, b1, invLerp(a0, a1, x));
const fract = (x) => x - Math.floor(x);
const wrap = (x, m) => ((x % m) + m) % m;
/** Progress 0..1 of t through the window [t0, t1]: 0 before it, 1 after it. */
const seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
/** Hermite smoothstep of x between e0 and e1. */
const smooth = (e0, e1, x) => {
  const t = seg(x, e0, e1);
  return t * t * (3 - 2 * t);
};
/** 0 → 1 → 0 over the window [t0, t1] (sine bump). */
const bump = (t, t0, t1) => (t <= t0 || t >= t1 ? 0 : Math.sin(Math.PI * seg(t, t0, t1)));
const pingpong = (x) => 1 - Math.abs(wrap(x, 2) - 1);
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
const angleTo = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);

/** Easing curves: input 0..1, output 0..1 (back and elastic overshoot). */
const ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  inBack: (t, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : (s + 1) * t * t * t - s * t * t),
  outBack: (t, s = 1.70158) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)),
  outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  outBounce: (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
};

/** 32-bit integer hash of any number of integers. */
function hash(...ns) {
  let h = 0x9e3779b9;
  for (const n of ns) {
    h = Math.imul(h ^ (n | 0), 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
  }
  return h >>> 0;
}
/** Deterministic random number in [0, 1) from integers (seed, particle index, which value...). */
const rand = (...ns) => hash(...ns) / 4294967296;

/** Seeded random generator (mulberry32). */
class Rng {
  constructor(seed = 1) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + (b - a) * this.next();
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  sign() {
    return this.next() < 0.5 ? -1 : 1;
  }
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }
  /** Roughly normal, mean 0, sd 1. */
  gauss() {
    return (this.next() + this.next() + this.next() + this.next() - 2) * 1.732;
  }
}
/** A generator for one particle: rng(seed, i) gives the same numbers every frame. */
const rng = (...ns) => new Rng(hash(...ns));

/** Smooth 1D value noise in [-1, 1]. */
function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rand(i, seed), rand(i + 1, seed), u) * 2 - 1;
}
/** Smooth 2D value noise in [-1, 1]. */
function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = rand(ix, iy, seed), b = rand(ix + 1, iy, seed), c = rand(ix, iy + 1, seed), d = rand(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
/** Fractal 2D noise in about [-1, 1]. */
function fbm(x, y, seed = 0, octaves = 3) {
  let s = 0, a = 0.5, n = 0;
  for (let o = 0; o < octaves; o++) {
    s += noise2(x, y, seed + o * 101) * a;
    n += a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / n;
}
/**
 * 2D value noise whose lattice repeats every px cells in x and py cells in y (0: no repeat). Scroll it by
 * exactly py cells over a loop and the loop has no seam: tileNoise(x, y + phase * py, 0, py).
 */
function tileNoise(x, y, px = 0, py = 0, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const x0 = px ? wrap(ix, px) : ix, x1 = px ? wrap(ix + 1, px) : ix + 1;
  const y0 = py ? wrap(iy, py) : iy, y1 = py ? wrap(iy + 1, py) : iy + 1;
  const a = rand(x0, y0, seed), b = rand(x1, y0, seed), c = rand(x0, y1, seed), d = rand(x1, y1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
}
/** Fractal tileNoise: every octave keeps the repeat, so scrolled fields still loop. */
function tileFbm(x, y, px = 0, py = 0, seed = 0, octaves = 3) {
  let s = 0, a = 0.5, n = 0, k = 1;
  for (let o = 0; o < octaves; o++) {
    s += tileNoise(x * k, y * k, px * k, py * k, seed + o * 101) * a;
    n += a;
    a *= 0.5;
    k *= 2;
  }
  return s / n;
}
/** Noise that loops: the same value at phase 0 and phase 1 (for seamless loops). */
function loopNoise(phase, radius = 1, seed = 0) {
  const a = phase * TAU;
  return noise2(Math.cos(a) * radius + 50, Math.sin(a) * radius + 50, seed);
}

__e.TAU = TAU; __e.clamp = clamp; __e.lerp = lerp; __e.invLerp = invLerp; __e.remap = remap; __e.fract = fract; __e.wrap = wrap; __e.seg = seg; __e.smooth = smooth; __e.bump = bump; __e.pingpong = pingpong; __e.dist = dist; __e.angleTo = angleTo; __e.ease = ease; __e.hash = hash; __e.rand = rand; __e.Rng = Rng; __e.rng = rng; __e.noise = noise; __e.noise2 = noise2; __e.fbm = fbm; __e.tileNoise = tileNoise; __e.tileFbm = tileFbm; __e.loopNoise = loopNoise;
};

__M["core/actor.js"] = function (__e) {
const {hex} = __req("core/color.js");
// A stock character to try effects on: status effects wrap its silhouette, hits land on it, auras sit
// behind it. Previews and the gallery draw it; effects only read its mask through o.actor.

const HERO = [
  "....kkkkk...",
  "..kkhhhhhk..",
  ".khhhhhhhhk.",
  ".khhhhhhhhhk",
  ".khhssssshhk",
  ".khsessesshk",
  ".khsessesshk",
  "..ksssssssk.",
  "...kkSSSkk..",
  "..kttttttk..",
  ".kttTttTttk.",
  ".ksttTTttsk.",
  ".kstttttttk.",
  "..kbbbbbbk..",
  "..kppkkppk..",
  "..kppk.kppk.",
  "..kppk.kppk.",
  "..koook.kook",
  "..kkkkk.kkkk",
];
const HERO_PAL = {
  k: "#17121f", h: "#7a4128", s: "#f3c49d", S: "#c98b6c", e: "#17121f",
  t: "#5f6f94", T: "#46536f", b: "#8a5a32", p: "#38334a", o: "#6a4030",
  // the 2x character's extra detail
  H: "#a35d34", w: "#ffffff", m: "#a3564a", g: "#e8c060", L: "#7f90b6", O: "#8f5a3f", P: "#4b4560",
  // the scarf
  c: "#f53cd1", C: "#ff8fe6", D: "#a31f8a",
};
// the dummy: a neutral shell that lets any effect's colors do the talking, near and far limbs, dark bands at the joints, a small mark
const DUMMY_PAL = {
  k: "#0e0c14", A: "#e4e6ec", B: "#b6b9c3", C: "#868995", D: "#5c5e6a", E: "#6e707c", F: "#4b4d58", G: "#34353f", J: "#2a2b33", m: "#f53cd1",
};
// The same character at twice the size (24 x 38), standing easy: the rest pose of src/core/rig.js, baked.
const HERO2 = [
  "...........kkk..........",
  "..........kAABk.........",
  ".........kAAABJk........",
  ".........kABBJJk........",
  ".........kBBBJCDk.......",
  ".........kBCJDDDk.......",
  ".........kkJJJDk........",
  ".......kkkkABBJCkk......",
  "......kAABCJBCCCkDk.....",
  "......kABBCJCCCmDkDk....",
  "......kBBCDDJCDDDkDk....",
  "......kABCDJDDDDDkk.....",
  ".....kAABDkDDDDJkk......",
  ".....kABCDkDDJJGkk......",
  ".....kABCkJJJGGGkk......",
  "....kJJCDkFFFGGGk.......",
  "....kAJJDkJJJGGGk.......",
  "....kJCJJkABBJGGk.......",
  ".....kJCCkBBCDJJJk......",
  ".....kCCCJBBCDJJDk......",
  ".....kCCCDJCCDkJDDk.....",
  "......kCDDJBCDkDDDk.....",
  ".......kDJJJCDkDDDkk....",
  ".......kJBCJCDkDDDkk....",
  ".......kBDJBCDkCDDkk....",
  "........kJJBCDkCDDk.....",
  "........kBBBCDkCCDDk....",
  "........kBBBCDkCCDDk....",
  ".........kBBCDkJDDDk....",
  "........kBJJJJkCJJJk....",
  "........kBBCCDkCCDDk....",
  "........kBBCDDkCDDk.....",
  "........kBBCDkCCDDk.....",
  "........kBCCDkCCDDk.....",
  "........kBCDDkCDDDk.....",
  ".......kJBCJkkkDJkkkk...",
  ".......kAJJAAAAkCCCCCk..",
  "........kkkkkkkkkkkkk...",
];


function maskOf(rows, k = 1) {
  const h = rows.length * k, w = rows[0].length * k, data = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === ".") return;
    for (let j = 0; j < k * k; j++) data[(y * k + ((j / k) | 0)) * w + x * k + (j % k)] = 1;
  }));
  return { w, h, data };
}

const MASKS = { 1: maskOf(HERO, 1), 2: maskOf(HERO2, 1) };
const SPRITES = { 1: HERO, 2: HERO2 };
// the character's own colors, row by row (0 where empty), for effects that recolor it: frozen, poisoned, stone
function pixelsOf(rows, pal) {
  const w = rows[0].length, data = new Uint32Array(w * rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => (data[y * w + x] = ch === "." ? 0 : hex(pal[ch]))));
  return data;
}
const PIXELS = { 1: pixelsOf(HERO, HERO_PAL), 2: pixelsOf(HERO2, DUMMY_PAL) };

/**
 * The stock actor at scale k (1: 12 x 19 px, 2: 24 x 38 px), in local space with its feet at (0, 0):
 * { mask, x, y (top-left of the mask), w, h, k, head: [x, y] (top of the head), chest: [x, y] }.
 */
function stockActor(k = 1) {
  k = k === 2 ? 2 : 1;
  const m = MASKS[k], x = -Math.floor(m.w / 2), y = -m.h;
  return { mask: m, pixels: PIXELS[k], x, y, w: m.w, h: m.h, k, head: [0, y], chest: [0, k === 2 ? -26 : y + 11], ...(k === 2 ? { eyes: [[13, 3], [15, 3]] } : {}) };
}

/** Draw the stock actor with its feet at the painter's origin, at alpha a (dithered). */
function drawActor(p, actor = stockActor(), a = 1) {
  if (a > 0) p.sprite(SPRITES[actor.k === 2 ? 2 : 1], actor.k === 2 ? DUMMY_PAL : HERO_PAL, actor.x, actor.y, { a });
}
/** How visible an effect wants the stand-in character at time t (effects may export actorAlpha). */
const actorAlphaOf = (mod, t, o) => (typeof mod.actorAlpha === "function" ? mod.actorAlpha(t, o) : 1);



__e.HERO = HERO; __e.HERO2 = HERO2; __e.HERO_PAL = HERO_PAL; __e.DUMMY_PAL = DUMMY_PAL; __e.stockActor = stockActor; __e.drawActor = drawActor; __e.actorAlphaOf = actorAlphaOf;
};

__M["core/painter.js"] = function (__e) {
// The painter draws into a frame's two buffers: `color` (opaque pixels, faded with ordered dither, never
// blended) and `light` (additive glow, composited on top). Effects draw in local coordinates around their
// origin; the painter places, mirrors and rotates them, so an effect never needs to know where it is.

const {clamp} = __req("core/math.js");
const {hex} = __req("core/color.js");
const {rasterText, textWidth, FONTS} = __req("core/font.js");

// 4x4 ordered (Bayer) thresholds: a pixel at alpha a is drawn when a is above its cell's threshold.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const OUT = { c: 0, a: 1, l: 0, k: 0 };
const sprites = new WeakMap();
const call = (v, ...args) => (typeof v === "function" ? v(...args) : v);

class Painter {
  constructor(frame) {
    this.frame = frame;
    this.reset();
  }

  /** Re-read the frame and clear placement, fade and light strength. */
  reset() {
    const f = this.frame;
    this.w = f.w; this.h = f.h; this.ox = f.ox | 0; this.oy = f.oy | 0; this.C = f.color; this.L = f.light;
    this.tx = 0; this.ty = 0; this.fx = 1; this.cs = 1; this.sn = 0;
    this.fade = 1; this.lightK = 1; this.layer = "front";
    return this;
  }

  /** Put the effect's origin at (x, y) in frame space, mirrored if flip, rotated by angle (radians). */
  place(x, y, flip = false, angle = 0) {
    this.tx = x; this.ty = y; this.fx = flip ? -1 : 1; this.cs = Math.cos(angle); this.sn = Math.sin(angle);
    return this;
  }

  // ---- transforms: local (effect) space <-> screen (frame) space
  toX(x, y) { return this.tx + x * this.fx * this.cs - y * this.sn; }
  toY(x, y) { return this.ty + x * this.fx * this.sn + y * this.cs; }
  fromX(sx, sy) { const dx = sx - this.tx, dy = sy - this.ty; return (dx * this.cs + dy * this.sn) * this.fx; }
  fromY(sx, sy) { const dx = sx - this.tx, dy = sy - this.ty; return -dx * this.sn + dy * this.cs; }
  // the screen pixel of the local pixel cell holding (x, y): mirrors and rotations land on whole cells
  cellX(x, y) { return Math.floor(this.toX(Math.floor(x) + 0.5, Math.floor(y) + 0.5)); }
  cellY(x, y) { return Math.floor(this.toY(Math.floor(x) + 0.5, Math.floor(y) + 0.5)); }

  // ---- raw writes, screen space, whole pixels. Color 0 means "nothing": it never erases what's there.
  put(sx, sy, c, a = 1) {
    if (!c) return;
    a *= this.fade;
    if (a < 1 && a <= BAYER[((sy & 3) << 2) | (sx & 3)]) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.C[y * this.w + x] = c;
  }
  add(sx, sy, c, k = 1) {
    k *= this.fade * this.lightK;
    if (k <= 0.004) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.L[i];
    const r = Math.min(255, (d & 255) + (c & 255) * k) | 0;
    const g = Math.min(255, ((d >>> 8) & 255) + ((c >>> 8) & 255) * k) | 0;
    const b = Math.min(255, ((d >>> 16) & 255) + ((c >>> 16) & 255) * k) | 0;
    this.L[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  /**
   * Blend a color over what's there at alpha a (0..1), keeping the result's own alpha: soft smoke, vapour and
   * mist. Use dithered dot() for hard pixel fades and blend() for translucent volumes.
   */
  blendPx(sx, sy, c, a) {
    a *= this.fade;
    if (!c || a <= 0.004) return;
    const x = sx - this.ox, y = sy - this.oy;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, d = this.C[i], da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa;
    const ch = (s) => ((((c >>> s) & 255) * k + ((d >>> s) & 255) * (1 - k)) & 255);
    this.C[i] = (((oa * 255) & 255) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }
  /** Translucent pixel at a local point. */
  blend(x, y, c, a) { this.blendPx(this.cellX(x, y), this.cellY(x, y), c, a); }
  /** A translucent disc: puffs of smoke, vapour, dust. c and a may be functions of (d: 0 center..1 rim, angle). */
  disc(cx, cy, r, c, a) {
    if (r < 0.5) return this.blend(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.each(cx - r, cy - r, cx + r, cy + r, (x, y, sx, sy) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      this.blendPx(sx, sy, call(c, d, ang), call(a, d, ang));
    });
  }
  /** Read back the color under a local point (0 if empty). */
  get(x, y) {
    const sx = this.cellX(x, y) - this.ox, sy = this.cellY(x, y) - this.oy;
    return sx < 0 || sy < 0 || sx >= this.w || sy >= this.h ? 0 : this.C[sy * this.w + sx];
  }

  // ---- pixels
  /** One opaque pixel. */
  px(x, y, c) { this.put(this.cellX(x, y), this.cellY(x, y), c, 1); }
  /** One pixel at alpha a (0..1), faded by ordered dither. */
  dot(x, y, c, a = 1) { if (a > 0) this.put(this.cellX(x, y), this.cellY(x, y), c, a); }
  /** Add light to one pixel. */
  light(x, y, c, k = 1) { this.add(this.cellX(x, y), this.cellY(x, y), c, k); }

  /**
   * Visit every screen pixel whose center falls in the local box [x0, x1] x [y0, y1], with that center in
   * local space: fn(lx, ly, sx, sy). The basis of every filled shape, so shapes mirror and rotate exactly.
   */
  each(x0, y0, x1, y1, fn) {
    let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
    for (let k = 0; k < 4; k++) {
      const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, sx = this.toX(x, y), sy = this.toY(x, y);
      if (sx < ax) ax = sx; if (sx > bx) bx = sx; if (sy < ay) ay = sy; if (sy > by) by = sy;
    }
    const sx0 = Math.max(Math.floor(ax), this.ox), sx1 = Math.min(Math.ceil(bx), this.ox + this.w - 1);
    const sy0 = Math.max(Math.floor(ay), this.oy), sy1 = Math.min(Math.ceil(by), this.oy + this.h - 1);
    for (let sy = sy0; sy <= sy1; sy++)
      for (let sx = sx0; sx <= sx1; sx++) {
        const cx = sx + 0.5, cy = sy + 0.5;
        fn(this.fromX(cx, cy), this.fromY(cx, cy), sx, sy);
      }
  }

  /**
   * A pixel shader over a local box. fn(x, y, out) returns a color, or sets out.c (color), out.a (alpha),
   * out.l (light color, defaults to out.c) and out.k (light amount). Return nothing to leave the pixel alone.
   */
  shade(x0, y0, x1, y1, fn) {
    const o = OUT;
    this.each(x0, y0, x1, y1, (lx, ly, sx, sy) => {
      o.c = 0; o.a = 1; o.l = 0; o.k = 0;
      const c = fn(lx, ly, o) || o.c;
      if (c) this.put(sx, sy, c, o.a);
      if (o.k > 0) this.add(sx, sy, o.l || c, o.k);
    });
  }

  // ---- shapes. Colors (c) and alphas (a) can be numbers or functions of the shape's own coordinates.
  /** 1 px line. c and a may be functions of u (0 at the start, 1 at the end). */
  line(x0, y0, x1, y1, c, a = 1) {
    let sx = this.cellX(x0, y0), sy = this.cellY(x0, y0);
    const ex = this.cellX(x1, y1), ey = this.cellY(x1, y1);
    const dx = Math.abs(ex - sx), dy = -Math.abs(ey - sy), stepx = sx < ex ? 1 : -1, stepy = sy < ey ? 1 : -1;
    const n = Math.max(dx, -dy) || 1, fc = typeof c === "function", fa = typeof a === "function";
    let err = dx + dy, i = 0;
    for (;;) {
      const u = i++ / n;
      this.put(sx, sy, fc ? c(u) : c, fa ? a(u) : a);
      if (sx === ex && sy === ey) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; sx += stepx; }
      if (e2 <= dx) { err += dx; sy += stepy; }
    }
  }
  /** Lines through a list of points [[x, y], ...]. */
  polyline(pts, c, a = 1) {
    for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, a);
  }
  /** Thick segment with round ends. c and a may be functions of (u along, v across: 0 center, 1 edge). */
  beam(x0, y0, x1, y1, width, c, a = 1) {
    const r = width / 2, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9;
    this.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y, o) => {
      const u = clamp(((x - x0) * dx + (y - y0) * dy) / L2), px = x0 + dx * u - x, py = y0 + dy * u - y;
      const d2 = px * px + py * py;
      if (d2 > r * r) return;
      const v = Math.sqrt(d2) / r;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /** Filled disc. c and a may be functions of (d: 0 center to 1 rim, angle). */
  circle(cx, cy, r, c, a = 1) {
    if (r < 0.6) return this.dot(cx, cy, call(c, 0, 0), call(a, 0, 0));
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;
      const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ellipse. c and a may be functions of (d: 0 center to 1 rim, angle). */
  ellipse(cx, cy, rx, ry, c, a = 1) {
    if (rx <= 0 || ry <= 0) return;
    this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
      const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy;
      if (d2 > 1) return;
      const d = Math.sqrt(d2), ang = Math.atan2(dy, dx);
      o.c = call(c, d, ang);
      o.a = call(a, d, ang);
    });
  }
  /** Ring from radius r - w to r. c and a may be functions of (v: 0 inner to 1 outer, angle). */
  ring(cx, cy, r, w, c, a = 1) {
    const r0 = Math.max(0, r - w);
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 > r * r || d2 < r0 * r0) return;
      const v = w > 0 ? (Math.sqrt(d2) - r0) / (r - r0 || 1) : 1, ang = Math.atan2(dy, dx);
      o.c = call(c, v, ang);
      o.a = call(a, v, ang);
    });
  }
  /**
   * Band of a ring from angle a0 to a1 (radians, a1 > a0), radius r - w to r: the slash and smear shape.
   * c and a may be functions of (u: 0 at a0 to 1 at a1, v: 0 inner to 1 outer). w can be a function of u
   * for a crescent that tapers at both ends.
   */
  arc(cx, cy, r, w, a0, a1, c, a = 1) {
    const span = a1 - a0, wf = typeof w === "function";
    this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
      const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) return;
      let ang = Math.atan2(dy, dx) - a0;
      ang -= Math.floor(ang / (Math.PI * 2)) * Math.PI * 2;
      if (ang > span) return;
      const u = ang / span, ww = wf ? w(u) : w;
      if (ww <= 0 || d < r - ww) return;
      const v = (d - (r - ww)) / ww;
      o.c = call(c, u, v);
      o.a = call(a, u, v);
    });
  }
  /** Filled rectangle. */
  rect(x, y, w, h, c, a = 1) {
    if (this.sn === 0) {
      const X0 = Math.round(x), Y0 = Math.round(y), X1 = Math.round(x + w), Y1 = Math.round(y + h);
      for (let yy = Y0; yy < Y1; yy++) for (let xx = X0; xx < X1; xx++) this.put(this.cellX(xx, yy), this.cellY(xx, yy), c, a);
      return;
    }
    this.shade(x, y, x + w, y + h, (lx, ly, o) => {
      if (lx < x || ly < y || lx >= x + w || ly >= y + h) return;
      o.c = c; o.a = a;
    });
  }
  /** Filled polygon from points [[x, y], ...] (even-odd rule). */
  poly(pts, c, a = 1) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const n = pts.length;
    this.shade(x0, y0, x1, y1, (x, y, o) => {
      let inside = false;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (!inside) return;
      o.c = call(c, x, y);
      o.a = call(a, x, y);
    });
  }
  tri(x0, y0, x1, y1, x2, y2, c, a = 1) { this.poly([[x0, y0], [x1, y1], [x2, y2]], c, a); }

  // ---- light
  /** Radial glow into the light buffer: k at the center, falling to 0 at radius r. */
  glow(x, y, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.toX(x, y), cy = this.toY(x, y);
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
    for (let sy = y0; sy <= y1; sy++) {
      const dy = (sy + 0.5 - cy) / r;
      for (let sx = x0; sx <= x1; sx++) {
        const dx = (sx + 0.5 - cx) / r, d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const f = 1 - Math.sqrt(d);
        this.add(sx, sy, c, f * f * k);
      }
    }
  }
  /** Glow around a segment (a soft beam of light). */
  glowLine(x0, y0, x1, y1, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const ax = this.toX(x0, y0), ay = this.toY(x0, y0), bx = this.toX(x1, y1), by = this.toY(x1, y1);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
    const X0 = Math.floor(Math.min(ax, bx) - r), X1 = Math.ceil(Math.max(ax, bx) + r);
    const Y0 = Math.floor(Math.min(ay, by) - r), Y1 = Math.ceil(Math.max(ay, by) + r);
    for (let sy = Y0; sy <= Y1; sy++)
      for (let sx = X0; sx <= X1; sx++) {
        const px = sx + 0.5, py = sy + 0.5, u = clamp(((px - ax) * dx + (py - ay) * dy) / L2);
        const ex = ax + dx * u - px, ey = ay + dy * u - py, d = Math.sqrt(ex * ex + ey * ey) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }
  /** Glow hugging a circle of radius R (a shockwave's light), falling off over width r. */
  glowRing(x, y, R, r, c, k = 0.5) {
    if (r < 1 || k <= 0.004) return;
    const cx = this.toX(x, y), cy = this.toY(x, y), E = R + r;
    for (let sy = Math.floor(cy - E); sy <= Math.ceil(cy + E); sy++)
      for (let sx = Math.floor(cx - E); sx <= Math.ceil(cx + E); sx++) {
        const d = Math.abs(Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy) - R) / r;
        if (d >= 1) continue;
        const f = 1 - d;
        this.add(sx, sy, c, f * f * k);
      }
  }

  // ---- sprites, text, masks
  /**
   * A little sprite from strings: rows like ["..##..", ".#oo#."], pal maps characters to colors
   * ({ "#": "#222034", o: 0xff... }); "." and " " are empty. Top-left at (x, y).
   * opts: { scale, a, flip (mirror left-right), flipY (upside down), tint (draw every pixel in one color) }.
   */
  sprite(rows, pal, x, y, opts = {}) {
    let s = sprites.get(rows);
    if (!s) sprites.set(rows, (s = rows.map((r) => [...r])));
    const k = opts.scale ?? 1, a = opts.a ?? 1, W = s[0]?.length ?? 0, cache = {};
    for (let r = 0; r < s.length; r++)
      for (let q = 0; q < s[r].length; q++) {
        const ch = s[r][q];
        if (ch === "." || ch === " ") continue;
        let c = opts.tint;
        if (c === undefined) {
          c = cache[ch];
          if (c === undefined) c = cache[ch] = pal[ch] === undefined ? 0 : hex(pal[ch]);
        }
        if (!c) continue;
        const col = opts.flip ? W - 1 - q : q, row = opts.flipY ? s.length - 1 - r : r;
        if (k === 1) this.dot(x + col, y + row, c, a);
        else this.rect(x + col * k, y + row * k, k, k, c, a);
      }
  }
  /**
   * Pixel text. opts: { font: "mini" (3x5) | "big" (5x7), scale, align: "left" | "center" | "right",
   * outline: color, shadow: color, a }. (x, y) is the top of the text, at the left, center or right.
   */
  text(str, x, y, c, opts = {}) {
    const font = opts.font ?? "mini", k = opts.scale ?? 1, a = opts.a ?? 1, w = textWidth(str, font) * k;
    const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x), top = Math.round(y);
    const ol = opts.outline, sh = opts.shadow;
    if (ol !== undefined) rasterText(str, font, (gx, gy) => this.rect(left + gx * k - 1, top + gy * k - 1, k + 2, k + 2, ol, a));
    if (sh !== undefined) rasterText(str, font, (gx, gy) => this.rect(left + gx * k + 1, top + gy * k + 1, k, k, sh, a));
    rasterText(str, font, (gx, gy) => this.rect(left + gx * k, top + gy * k, k, k, call(c, gx, gy), a));
  }
  /** Size of text in pixels: [w, h]. */
  measure(str, opts = {}) {
    const k = opts.scale ?? 1;
    return [textWidth(str, opts.font ?? "mini") * k, FONTS[opts.font ?? "mini"].h * k];
  }
  /** Fill a mask ({ w, h, data }) with its top-left at (x, y). c may be a function of (mx, my). */
  mask(m, x, y, c, a = 1) {
    for (let my = 0; my < m.h; my++)
      for (let mx = 0; mx < m.w; mx++) if (m.data[my * m.w + mx]) this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
  /** The 1 px outline just outside a mask. */
  outline(m, x, y, c, a = 1) {
    const at = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx];
    for (let my = -1; my <= m.h; my++)
      for (let mx = -1; mx <= m.w; mx++)
        if (!at(mx, my) && (at(mx - 1, my) || at(mx + 1, my) || at(mx, my - 1) || at(mx, my + 1)))
          this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
  }
}

__e.Painter = Painter;
};

__M["core/font.js"] = function (__e) {
// Two pixel fonts: "mini" (3x5) for small numbers and tags, "big" (5x7) for words like LEVEL UP.
// Glyphs are trimmed to their inked columns, so text sets proportionally (an I is narrower than an M).

const MINI = {
  A: ".#.|#.#|###|#.#|#.#", B: "##.|#.#|##.|#.#|##.", C: ".##|#..|#..|#..|.##", D: "##.|#.#|#.#|#.#|##.",
  E: "###|#..|##.|#..|###", F: "###|#..|##.|#..|#..", G: ".##|#..|#.#|#.#|.##", H: "#.#|#.#|###|#.#|#.#",
  I: "###|.#.|.#.|.#.|###", J: "..#|..#|..#|#.#|.#.", K: "#.#|#.#|##.|#.#|#.#", L: "#..|#..|#..|#..|###",
  M: "#.#|###|###|#.#|#.#", N: "##.|#.#|#.#|#.#|#.#", O: ".#.|#.#|#.#|#.#|.#.", P: "##.|#.#|##.|#..|#..",
  Q: ".#.|#.#|#.#|##.|.##", R: "##.|#.#|##.|#.#|#.#", S: ".##|#..|.#.|..#|##.", T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###", V: "#.#|#.#|#.#|#.#|.#.", W: "#.#|#.#|###|###|#.#", X: "#.#|#.#|.#.|#.#|#.#",
  Y: "#.#|#.#|.#.|.#.|.#.", Z: "###|..#|.#.|#..|###",
  0: "###|#.#|#.#|#.#|###", 1: ".#.|##.|.#.|.#.|###", 2: "##.|..#|.#.|#..|###", 3: "##.|..#|.#.|..#|##.",
  4: "#.#|#.#|###|..#|..#", 5: "###|#..|##.|..#|##.", 6: ".##|#..|###|#.#|###", 7: "###|..#|.#.|.#.|.#.",
  8: "###|#.#|###|#.#|###", 9: "###|#.#|###|..#|##.",
  "+": "...|.#.|###|.#.|...", "-": "...|...|###|...|...", "!": "#|#|#|.|#", "?": "##.|..#|.#.|...|.#.",
  ".": ".|.|.|.|#", ",": "..|..|..|.#|#.", ":": ".|#|.|#|.", "/": "..#|..#|.#.|#..|#..",
  "%": "#.#|..#|.#.|#..|#.#", x: "...|#.#|.#.|#.#|...", "*": "#.#|.#.|#.#|...|...", "'": "#|#|.|.|.",
  "(": ".#|#.|#.|#.|.#", ")": "#.|.#|.#|.#|#.", "<": "..#|.#.|#..|.#.|..#", ">": "#..|.#.|..#|.#.|#..",
  "=": "...|###|...|###|...", _: "...|...|...|...|###", "#": "#.#|###|#.#|###|#.#",
};

const BIG = {
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.",
  C: ".###.|#...#|#....|#....|#....|#...#|.###.", D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
  E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
  I: "###|.#.|.#.|.#.|.#.|.#.|###", J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
  K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
  O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.", P: "####.|#...#|#...#|####.|#....|#....|#....",
  Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
  U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.", V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
  W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: ".#.|##.|.#.|.#.|.#.|.#.|###",
  2: ".###.|#...#|....#|...#.|..#..|.#...|#####", 3: "#####|...#.|..#..|...#.|....#|#...#|.###.",
  4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
  6: "..##.|.#...|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
  8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.", 9: ".###.|#...#|#...#|.####|....#|...#.|.##..",
  "!": "#|#|#|#|#|.|#", "?": ".###.|#...#|....#|...#.|..#..|.....|..#..", "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
  "-": "....|....|....|####|....|....|....", ".": ".|.|.|.|.|.|#", ",": "..|..|..|..|..|.#|#.", ":": ".|.|#|.|.|#|.",
  "/": "....#|....#|...#.|..#..|.#...|#....|#....", "%": "##...|##..#|...#.|..#..|.#...|#..##|...##",
  x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#", "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....", "'": "#|#|.|.|.|.|.",
  "<": "...#|..#.|.#..|#...|.#..|..#.|...#", ">": "#...|.#..|..#.|...#|..#.|.#..|#...", "=": "....|....|####|....|####|....|....",
  "(": "..#|.#.|#..|#..|#..|.#.|..#", ")": "#..|.#.|..#|..#|..#|.#.|#..", "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",
};

function build(table, h) {
  const out = {};
  for (const [ch, src] of Object.entries(table)) {
    const rows = src.split("|");
    out[ch] = { w: rows[0].length, rows: rows.map((r) => [...r].map((c) => c === "#")) };
    if (rows.length !== h) throw new Error(`glyph ${ch} has ${rows.length} rows, expected ${h}`);
  }
  return out;
}

const FONTS = {
  mini: { h: 5, space: 2, gap: 1, glyphs: build(MINI, 5) },
  big: { h: 7, space: 3, gap: 1, glyphs: build(BIG, 7) },
};

/** Width in font pixels of a string (before scaling). */
function textWidth(str, font = "mini") {
  const F = FONTS[font];
  let w = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    w += (g ? g.w : F.space) + F.gap;
  }
  return Math.max(0, w - F.gap);
}

/** Calls plot(x, y) for every inked font pixel of str, with the top-left of the text at (0, 0). */
function rasterText(str, font, plot) {
  const F = FONTS[font];
  let x = 0;
  for (const ch of String(str)) {
    const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
    if (!g) {
      x += F.space + F.gap;
      continue;
    }
    for (let r = 0; r < F.h; r++) for (let c = 0; c < g.w; c++) if (g.rows[r][c]) plot(x + c, r);
    x += g.w + F.gap;
  }
}

__e.FONTS = FONTS; __e.textWidth = textWidth; __e.rasterText = rasterText;
};

__M["core/poses.js"] = function (__e) {
// The stance acts start from. A pose only says what differs from standing easy (STAND in rig.js), in screen terms, px from
// the feet, y negative up. Give the hands and feet; the skeleton works out the rest.
//   x, y       where the feet are, from the effect's origin
//   crouch     hips lowered; lean  the spine bent forward (+) or back (-); hx, hy  the head rolled, nodded
//   fx, fy, fz the near (right) hand; bx, by, bz  the far (left) hand; ffx, ffy  the near foot; fbx, fby  the far foot
//   turn       how far the chest faces us, in radians (it follows the hands if you leave it out); yaw  the whole body turned
//              about its feet (0 faces right, pi faces left, in between towards us; a spin is really a spin)
//   twist      extra chest turn; armsFront  the far hand comes round in front of the chest
//   weapon, sa what the near hand holds and its angle on screen (radians, 0 points forward); two  both hands on it
//   wl, wz     foreshorten the weapon towards (or, wz -1, away from) the viewer: wl is its length on screen, 1 is full
//   pull, nocked  a bow drawn to the far hand, an arrow on the string
//   offWeapon, sb  a weapon in the far hand and its angle
//   toeF, toeB up on the toes; ghost  leave after-images
//
// How the body works. He faces right, three-quarters towards us, so his near shoulder is on the LEFT of the chest on screen and
// his far shoulder on the right: for arms raised or open to us, the near hand goes left (fx < 0) and the far hand right (bx > 0). A hand
// driving forward closes the chest and brings its shoulder round; a hand drawn back opens him up. Bones have fixed lengths: an arm reaches
// about 15 px from its shoulder (shoulders are near y = -29), a leg 17 px. Arms don't stretch, so step the body in rather than ask too much.
//
// How to hold things. Keep a little bend in the elbow. The blade lags the hand on a swing, so the wrist breaks and it whips. Long weapons
// rest in one hand with the butt on the floor and take the second hand to swing. Everything is in depth, so a weapon can swing round the front
// of him: turn the body (yaw) and the weapon goes with it.

const READY = { crouch: 3, fx: 11, fy: -21, bx: 9, by: -21, ffx: 7, fbx: -7 };

__e.READY = READY;
};

__M["core/rig.js"] = function (__e) {
// The character who acts: a real skeleton in 3D, drawn down to pixels the way Dead Cells makes its sprites. Bones have
// fixed lengths and hang from each other, pelvis to spine to chest to shoulders, so the body can twist, bend and turn round,
// and depth decides what's in front. A pose only says where the hands and feet should be and how the body is carrying
// itself; the solver works out every joint, and the renderer shades it into a few flat tones with one clean ink line.
//
// Coordinates: x right, y up, z towards the viewer, in pixels, the feet at the origin. Poses are in screen terms (y negative
// is up), as effects are. The character faces +x with his right side towards the viewer, so the right hand is the near one.
//
// A rendered pose also knows, for each of its pixels, which pixel of the standing character it came from (`src`). That
// is what lets an effect drawn on the standing body (frost, poison, a scan line) follow the body wherever it goes.

const {hex} = __req("core/color.js");
const {DUMMY_PAL} = __req("core/actor.js");

const PAL = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [k, hex(v) >>> 0]));
const INK = PAL.k, SEAM = PAL.J, MARK = PAL.m;
// plates and joints: lit to dark
const SHELL = [PAL.A, PAL.B, PAL.C, PAL.D], CORE = [PAL.E, PAL.F, PAL.G, PAL.G];
const DEG = Math.PI / 180, W0 = 24, H0 = 38;

// ---- vectors and turns
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const unit = (a) => mul(a, 1 / (len(a) || 1e-6));
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotZ = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const mm = (A, B) => { const o = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return o; };
const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const tv = (M, v) => [M[0] * v[0] + M[3] * v[1] + M[6] * v[2], M[1] * v[0] + M[4] * v[1] + M[7] * v[2], M[2] * v[0] + M[5] * v[1] + M[8] * v[2]];
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---- the body's measurements, in pixels
const M = {
  pelvis: 19.7, spine1: 2.8, spine2: 4.6, shoulderUp: 2.5, shoulderOut: 5.9, neckUp: 4.0, headUp: 3.1,
  hipDown: 1.1, hipOut: 2.8, thigh: 8.6, shin: 8.3, upper: 7.6, fore: 7.4, turn: 36 * DEG,
};
/** Standing easy, in screen terms: hands and feet are where they should end up, y negative is up. */
const STAND = { lean: 0, crouch: 0, yaw: 0, fx: -3, fy: -15, bx: 5, by: -15, ffx: -2, ffy: -4, fbx: 3, fby: -4 };

// ---- solving a pose: from where the hands and feet should be, to every joint
function ik(a, target, L1, L2, pole) {
  let to = sub(target, a), d = len(to);
  const reach = L1 + L2 - 0.02;
  if (d > reach) { to = mul(to, reach / d); d = reach; }
  const u = unit(to), along = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  let v = sub(pole, mul(u, dot(pole, u)));
  v = len(v) < 1e-4 ? unit(cross(u, [0, 0, 1])) : unit(v);
  return { joint: add(a, add(mul(u, along), mul(v, h))), end: add(a, to), u, v };
}
function frame(t, R) {
  return { t, R };
}
// a frame along a bone: its local x runs down the bone
function boneFrame(a, b, pole) {
  const x = unit(sub(b, a));
  let y = sub(pole, mul(x, dot(pole, x)));
  y = len(y) < 1e-4 ? unit(cross(x, [0, 0, 1])) : unit(y);
  const z = cross(x, y);
  return frame(a, [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
}
const weaponOf = (name) => WEAPONS[name];

function solve(pose) {
  const q = { ...STAND, ...pose }, lean = q.lean, W = q.weapon && weaponOf(q.weapon), OW = q.offWeapon && weaponOf(q.offWeapon);
  const sa = q.sa ?? 0, wl = q.wl ?? 1, axisZ = Math.sqrt(Math.max(0, 1 - wl * wl)) * (q.wz ?? 1);
  const axis = [Math.cos(sa) * wl, -Math.sin(sa) * wl, axisZ], side = [-Math.sin(sa), -Math.cos(sa), 0];
  const two = !!(q.two && W), nearZ = q.fz ?? (two ? 3 : 4.5);
  // how the chest is turned follows the hands: a hand driving forward brings its shoulder round; one drawn back opens him up
  const fwd = (q.fx - STAND.fx) / 24, farFwd = two ? 0 : (q.bx - STAND.bx) / 22;
  let turn = M.turn + (fwd >= 0 ? -44 * DEG * Math.min(1, fwd) : 28 * DEG * Math.min(1, -fwd * 1.8));
  turn += (farFwd > 0 ? 34 * DEG * Math.min(1, farFwd) : 0) + (q.twist ?? 0) * 4 * DEG;
  if (q.turn !== undefined) turn = q.turn;
  const hipTurn = M.turn + (turn - M.turn) * 0.45, tilt = Math.atan2(lean, 13);
  const Rp = mm(rotZ(-tilt * 0.25), rotY(-hipTurn)), Rc = mm(rotZ(-tilt), rotY(-turn));
  // feet first: the pelvis sinks if that's what it takes for both legs to reach them
  const ankleN = [q.ffx, -q.ffy - 1.8, q.fzz ?? 2.4], ankleF = [q.fbx, -q.fby - 1.8, q.bzz ?? -2.4];
  let pelvis = [lean * 0.2, M.pelvis - q.crouch, 0];
  const hipAt = (s) => add(pelvis, mv(Rp, [0, -M.hipDown, s * M.hipOut]));
  const maxLeg = (M.thigh + M.shin) * 0.995;
  for (const [s, a] of [[1, ankleN], [-1, ankleF]]) {
    const h = hipAt(s), dx = h[0] - a[0], dz = h[2] - a[2], flat = dx * dx + dz * dz;
    if (flat < maxLeg * maxLeg) {
      const top = a[1] + Math.sqrt(maxLeg * maxLeg - flat);
      if (h[1] > top) pelvis = [pelvis[0], pelvis[1] - (h[1] - top), pelvis[2]];
    }
  }
  const waist = add(pelvis, [Math.sin(tilt * 0.45) * M.spine1, Math.cos(tilt * 0.45) * M.spine1, 0]);
  const chest = add(waist, [Math.sin(tilt) * M.spine2, Math.cos(tilt) * M.spine2, 0]);
  const neck = add(chest, mv(Rc, [0, M.neckUp, 0]));
  // the head keeps looking where he's going: it takes only part of the lean and part of the turn
  const headTurn = M.turn * 0.9 + (turn - M.turn) * 0.35, nod = tilt * 0.35 + (q.hy ?? 0) * 7 * DEG, roll = (q.hx ?? 0) * 7 * DEG;
  const Rh = mm(rotZ(-nod - roll), rotY(-headTurn));
  const head = add(neck, mv(Rh, [0.15, M.headUp, 0]));
  // the arms: shoulders reach a little towards a far hand
  const pick = (s, target) => {
    const base = add(chest, mv(Rc, [0, M.shoulderUp, s * M.shoulderOut])), to = sub(target, base), d = len(to);
    return add(base, mul(unit(to), Math.min(1.8, Math.max(0, d - 11) * 0.35)));
  };
  const nearT = [q.fx, -q.fy, nearZ];
  const farT = two ? [q.fx + axis[0] * W.two, -q.fy + axis[1] * W.two, nearZ + axis[2] * W.two] : [q.bx, -q.by, q.bz ?? (q.armsFront ? 5.5 : -4.5)];
  const sN = pick(1, nearT), sF = pick(-1, farT);
  const pole = (s, T, shoulder, hold) => {
    // elbows hang down and back; overhead they go out and forward
    const up = clamp01((T[1] - shoulder[1] + 2) / 10);
    const base = [-0.55 + up * 1.1, -1 + up * 0.9, s * (0.45 + up * 0.5)];
    if (!hold) return base;
    // holding something, the forearm wants to meet the handle side on: try round the circle, keep the best
    const u = unit(sub(T, shoulder));
    let best = base, score = Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, x = unit(cross(u, [0.3, 1, 0.2])), y = cross(u, x), v = add(mul(x, Math.cos(a)), mul(y, Math.sin(a)));
      const A = ik(shoulder, T, M.upper, M.fore, v), f = unit(sub(A.end, A.joint));
      const cost = Math.abs(dot(f, hold)) * 0.7 + (1 - dot(unit(base), v)) * 0.55;
      if (cost < score) { score = cost; best = v; }
    }
    return best;
  };
  const holdN = W ? (W.across ? side : axis) : null, holdF = two ? (W.across ? side : axis) : OW ? [Math.cos(q.sb ?? Math.PI), -Math.sin(q.sb ?? Math.PI), 0] : null;
  const armN = ik(sN, nearT, M.upper, M.fore, pole(1, nearT, sN, holdN)), armF = ik(sF, farT, M.upper, M.fore, pole(-1, farT, sF, holdF));
  // the legs: knees forward, a little out
  const kneePole = (s) => mv(Rp, [1, 0, s * 0.35]);
  const hipN = hipAt(1), hipF = hipAt(-1);
  const legN = ik(hipN, ankleN, M.thigh, M.shin, kneePole(1)), legF = ik(hipF, ankleF, M.thigh, M.shin, kneePole(-1));
  const footDir = (s) => { const t = hipTurn * 0.6 + s * 8 * DEG; return [Math.cos(t), 0, Math.sin(t)]; };
  const B = {
    pelvis: frame(pelvis, Rp), waist: frame(waist, mm(rotZ(-tilt * 0.6), rotY(-(turn + hipTurn) / 2))), chest: frame(chest, Rc), head: frame(head, Rh), neck: frame(neck, Rh),
    upperN: boneFrame(sN, armN.joint, armN.v), foreN: boneFrame(armN.joint, armN.end, armN.v), upperF: boneFrame(sF, armF.joint, armF.v), foreF: boneFrame(armF.joint, armF.end, armF.v),
    thighN: boneFrame(hipN, legN.joint, legN.v), shinN: boneFrame(legN.joint, legN.end, legN.v), thighF: boneFrame(hipF, legF.joint, legF.v), shinF: boneFrame(legF.joint, legF.end, legF.v),
  };
  B.footN = frame(legN.end, mm(rotY(-Math.atan2(footDir(1)[2], footDir(1)[0])), rotZ(q.toeF ? -55 * DEG : 0)));
  B.footF = frame(legF.end, mm(rotY(-Math.atan2(footDir(-1)[2], footDir(-1)[0])), rotZ(q.toeB ? -55 * DEG : 0)));
  return { B, W, OW, q, axis, side, armN, armF, legN, legF, sN, sF, hipN, hipF, turn };
}

// ---- drawing: every part goes through one depth buffer
const BW = 300, BH = 240, OX = 150, OY = 180; // the scratch grid, big enough for a raised scythe; feet at (OX, OY)
const Zb = new Float32Array(BW * BH), Tone = new Float32Array(BW * BH), Part = new Int8Array(BW * BH), Mat = new Int8Array(BW * BH), Fr = new Int8Array(BW * BH), LX = new Float32Array(BW * BH), LY = new Float32Array(BW * BH), Col = new Uint32Array(BW * BH);
const touched = [];
const LIGHT = unit([-0.55, 0.72, 0.5]);
let clipBody = false, clipWeapon = false, curFrameIndex = 0, curDim = 0, onlyPart = 0;
const FRAME_IDS = ["pelvis", "waist", "chest", "head", "neck", "upperN", "foreN", "upperF", "foreF", "thighN", "shinN", "thighF", "shinF", "footN", "footF"];
function plot(i, z, tone, part, mat, wx, wy, color) {
  if (onlyPart && part !== onlyPart) return;
  if (Part[i] === 0) touched.push(i);
  else if (z <= Zb[i]) return;
  Zb[i] = z;
  Tone[i] = tone;
  Part[i] = part;
  Mat[i] = mat;
  Fr[i] = curFrameIndex;
  LX[i] = wx;
  LY[i] = wy;
  Col[i] = color;
}
function sphere(c, r, part, mat) {
  const x0 = Math.floor(c[0] - r), x1 = Math.ceil(c[0] + r), y0 = Math.floor(c[1] - r), y1 = Math.ceil(c[1] + r);
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      const dx = wx - c[0], dy = wy - c[1], d2 = dx * dx + dy * dy;
      if (d2 > r * r || (clipBody && wy < 1.5)) continue;
      const dz = Math.sqrt(r * r - d2), n = [dx / r, dy / r, dz / r], i = (OY - wy) * BW + (OX + wx);
      plot(i, c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
function sweep(a, b, ra, rb, part, mat, bulge = 0) {
  const n = Math.max(2, Math.ceil(len(sub(b, a)) / 0.4));
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    sphere(add(a, mul(sub(b, a), u)), ra + (rb - ra) * u + bulge * Math.sin(u * Math.PI), part, mat);
  }
}
// an ellipsoid with radii r along the axes of frame R, seen along z
function ellipsoid(c, R, r, part, mat) {
  const big = Math.max(r[0], r[1], r[2]), x0 = Math.floor(c[0] - big), x1 = Math.ceil(c[0] + big), y0 = Math.floor(c[1] - big), y1 = Math.ceil(c[1] + big);
  const Rt = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]], D = [1 / (r[0] * r[0]), 1 / (r[1] * r[1]), 1 / (r[2] * r[2])];
  // A = R diag(D) R^T
  const A = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i * 3 + j] = R[i * 3] * D[0] * R[j * 3] + R[i * 3 + 1] * D[1] * R[j * 3 + 1] + R[i * 3 + 2] * D[2] * R[j * 3 + 2];
  void Rt;
  for (let wy = y0; wy <= y1; wy++)
    for (let wx = x0; wx <= x1; wx++) {
      if (clipBody && wy < 1.5) continue;
      const dx = wx - c[0], dy = wy - c[1];
      const qa = A[8], qb = 2 * (A[2] * dx + A[5] * dy), qc = A[0] * dx * dx + 2 * A[1] * dx * dy + A[4] * dy * dy - 1, disc = qb * qb - 4 * qa * qc;
      if (disc < 0) continue;
      const dz = (-qb + Math.sqrt(disc)) / (2 * qa);
      const n = unit([A[0] * dx + A[1] * dy + A[2] * dz, A[3] * dx + A[4] * dy + A[5] * dz, A[6] * dx + A[7] * dy + A[8] * dz]);
      plot((OY - wy) * BW + (OX + wx), c[2] + dz, dot(n, LIGHT), part, mat, wx, wy, 0);
    }
}
// parts: each has its own number, so edges between them can be seen
const PART = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22, weapon: 23, offWeapon: 24 };
const useFrame = (name) => { curFrameIndex = FRAME_IDS.indexOf(name); };

function drawBody(S) {
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF, turn } = S, F_ = (name) => B[name];
  useFrame("pelvis");
  ellipsoid(add(F_("pelvis").t, mv(F_("pelvis").R, [0, -0.2, 0])), F_("pelvis").R, [2.9, 2.6, 4.2], PART.pelvis, 0);
  useFrame("waist");
  sweep(F_("pelvis").t, F_("chest").t, 3, 3.3, PART.waist, 1);
  useFrame("chest");
  ellipsoid(add(F_("chest").t, mv(F_("chest").R, [0.2, 0.9, 0])), F_("chest").R, [3.4, 4.2, 5.5], PART.chest, 0);
  useFrame("neck");
  sweep(F_("neck").t, add(F_("neck").t, mv(F_("head").R, [0, 1.6, 0])), 1.25, 1.15, PART.neck, 1);
  useFrame("head");
  ellipsoid(F_("head").t, F_("head").R, [3, 3.3, 2.8], PART.head, 0);
  ellipsoid(add(F_("head").t, mv(F_("head").R, [0.85, -0.45, 0])), F_("head").R, [2.4, 2.7, 2.35], PART.face, 0);
  const arm = (far, A, sh, up, el, fo, ha, nameU, nameF) => {
    curDim = far ? 1 : 0;
    useFrame(nameU);
    sphere(sh, 2.5, up, 0);
    sweep(sh, A.joint, 2.1, 1.6, up, 0);
    sphere(A.joint, 1.45, el, 1);
    useFrame(nameF);
    sweep(A.joint, A.end, 1.6, 1.2, fo, 0, 0.15);
    sphere(A.end, 1.9, ha, 0);
    curDim = 0;
  };
  arm(false, armN, sN, PART.upperN, PART.elbowN, PART.foreN, PART.handN, "upperN", "foreN");
  arm(true, armF, sF, PART.upperF, PART.elbowF, PART.foreF, PART.handF, "upperF", "foreF");
  const leg = (far, L, hip, th, kn, sh, fo, nameT, nameS, nameFt) => {
    useFrame(nameT);
    sweep(hip, L.joint, 3.2, 2.2, th, 0);
    sphere(L.joint, 1.9, kn, 1);
    useFrame(nameS);
    sweep(L.joint, L.end, 2.15, 1.4, sh, 0, 0.4);
    useFrame(nameFt);
    const R = F_(nameFt).R, a = F_(nameFt).t;
    sweep(add(a, mv(R, [-1.5, -0.6, 0])), add(a, mv(R, [4.6, -1.1, 0])), 1.7, 1.25, fo, 0);
  };
  leg(false, legN, hipN, PART.thighN, PART.kneeN, PART.shinN, PART.footN, "thighN", "shinN", "footN");
  leg(true, legF, hipF, PART.thighF, PART.kneeF, PART.shinF, PART.footF, "thighF", "shinF", "footF");
  void turn;
}

// ---- what they hold: drawn along the handle from the fist, through the same depth buffer
function along(H, axis, side, part) {
  const n = cross(axis, side);
  const T = (i, k, c, lift = 0) => {
    const x = H[0] + axis[0] * i + side[0] * k + n[0] * lift, y = H[1] + axis[1] * i + side[1] * k + n[1] * lift, z = H[2] + axis[2] * i + side[2] * k + n[2] * lift;
    const wx = Math.round(x), wy = Math.round(y);
    if (clipWeapon && wy < 0) return;
    const idx = (OY - wy) * BW + (OX + wx);
    if (idx < 0 || idx >= BW * BH) return;
    curFrameIndex = -1;
    plot(idx, z + 0.05, 2, part, 2, wx, wy, c);
  };
  T.at = (i, k) => [H[0] + axis[0] * i + side[0] * k, H[1] + axis[1] * i + side[1] * k, H[2] + axis[2] * i + side[2] * k];
  return T;
}
const STEEL = Object.fromEntries(Object.entries({ hi: "#ffffff", a: "#e8edf6", b: "#a4afc6", d: "#68748f", gold: "#ffd84a", goldD: "#b8862a", grip: "#7a3a2a", gripD: "#4a2018", wood: "#8a5a32", woodD: "#5a3820", dark: "#3a3448", darkD: "#262033", olive: "#58663f", oliveA: "#7d8c58", oliveD: "#3a4529" }).map(([k, v]) => [k, hex(v) >>> 0]));
function blade(T, from, length, w) {
  for (let i = from; i <= from + length + 0.01; i += 0.4) {
    const r = i - from, wd = r > length - 5 ? Math.max(0, ((length - r) / 5) * w) : w;
    for (let k = -wd; k <= wd + 0.01; k += 0.4) T(i, k, k < -w * 0.4 ? STEEL.hi : k > w * 0.4 ? STEEL.d : STEEL.a);
  }
}
const haft = (T, from, to, a, d, r = 0.8) => {
  for (let i = from; i <= to; i += 0.4) for (let k = -r; k <= r + 0.01; k += 0.4) T(i, k, k > 0.1 ? d : a);
};
const WEAPONS = {
  // the fist is at i = 0; `two` is where the other hand goes; `across`: the handle lies across the weapon's length
  sword: { two: -4.4, draw(T, q) {
    const end = q.two ? -6.5 : -2.6;
    haft(T, end, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.4; k <= 1.4; k += 0.4) T(end - 0.4, k, STEEL.gold);
    for (let k = -4.6; k <= 4.6; k += 0.4) (T(2.6, k, Math.abs(k) > 3.8 ? STEEL.goldD : STEEL.gold), T(3, k, STEEL.goldD));
    blade(T, 3.2, 25, 2.2);
  } },
  greatsword: { two: -4.8, draw(T) {
    haft(T, -7.2, 2.2, STEEL.grip, STEEL.gripD);
    for (let k = -1.8; k <= 1.8; k += 0.4) T(-7.6, k, STEEL.gold);
    for (let k = -6.6; k <= 6.6; k += 0.4) (T(2.6, k, Math.abs(k) > 5.6 ? STEEL.goldD : STEEL.gold), T(3, k, STEEL.goldD));
    blade(T, 3.2, 31, 3);
    for (let i = 4; i <= 28; i += 0.4) T(i, 0, STEEL.b);
  } },
  dagger: { draw(T) {
    haft(T, -2.4, 1.8, STEEL.grip, STEEL.gripD);
    for (let k = -2.6; k <= 2.6; k += 0.4) T(2.2, k, STEEL.goldD);
    blade(T, 2.6, 10, 1.3);
  } },
  spear: { two: -12, draw(T) {
    haft(T, -18, 36, STEEL.wood, STEEL.woodD, 0.5);
    blade(T, 36, 11, 2);
    for (let k = -2.4; k <= 2.4; k += 0.4) T(36, k, STEEL.goldD);
  } },
  hammer: { two: -7, draw(T) {
    for (const lift of [-0.8, 0, 0.8]) for (let i = -10; i <= 18; i += 0.4) for (let k = -0.8; k <= 0.81; k += 0.4) T(i, k, k > 0.1 ? STEEL.woodD : STEEL.wood, lift);
    // the head is a block: its two faces, and the steel between them
    for (let i = 18; i <= 28; i += 0.4) for (let k = -9; k <= 9; k += 0.4) {
      const face = Math.abs(k) > 7.4 ? (k < 0 ? STEEL.a : STEEL.d) : i < 20 ? STEEL.hi : i > 26.4 ? STEEL.d : Math.abs(k) < 2 ? STEEL.gold : STEEL.b;
      T(i, k, face, 4.5);
      T(i, k, face, -4.5);
      if (i < 18.4 || i > 27.6 || Math.abs(k) > 8.6) for (let l = -4; l <= 4; l += 0.4) T(i, k, k < 0 ? STEEL.a : i > 27.6 ? STEEL.d : STEEL.b, l);
    }
  } },
  scythe: { two: -11, draw(T) {
    haft(T, -16, 31, STEEL.dark, STEEL.darkD, 0.5);
    for (let j = 0; j <= 28; j += 0.4) {
      const u = j / 28, w = 3.2 * (1 - u) + 0.3, b = 31.5 - u * u * 12;
      for (let k = -w; k <= w; k += 0.4) T(b + k, j + 0.8, k > w * 0.3 ? STEEL.hi : k < -w * 0.4 ? STEEL.d : STEEL.b);
    }
  } },
  claw: { draw(T) {
    for (const q0 of [-2.4, 0, 2.4])
      for (let i = 2; i <= 9.5; i += 0.4) {
        const u = (i - 2) / 7.5, k = q0 + u * u * 1.8;
        T(i, k, u > 0.55 ? STEEL.hi : STEEL.a);
        if (u < 0.6) T(i, k + 0.8, STEEL.d);
      }
  } },
  bow: { across: true, draw(T, q, off) {
    for (let u = -1; u <= 1.001; u += 0.025) {
      const k = u * 17, i = 6 * (1 - u * u) - 1;
      T(i, k, Math.abs(u) > 0.85 ? STEEL.goldD : STEEL.wood);
      T(i + 0.8, k, STEEL.woodD);
    }
    const tipA = T.at(-1, -17), tipB = T.at(-1, 17), mid = q.pull ? off : T.at(-1, 0);
    const line = (A, B, c) => {
      const n = Math.max(2, Math.ceil(len(sub(B, A)) / 0.4)), Z = STEEL.a;
      for (let k = 0; k <= n; k++) {
        const P = add(A, mul(sub(B, A), k / n)), wx = Math.round(P[0]), wy = Math.round(P[1]), idx = (OY - wy) * BW + (OX + wx);
        curFrameIndex = -1;
        plot(idx, P[2] + 0.05, 2, PART.weapon, 2, wx, wy, c ?? Z);
      }
    };
    line(tipA, mid);
    line(tipB, mid);
    if (q.nocked) {
      const nock = mid, tip = T.at(13, 0);
      line(nock, tip, STEEL.wood);
      for (let i = 9; i <= 13; i += 0.4) for (let k = -(13 - i) * 0.45; k <= (13 - i) * 0.45; k += 0.4) T(i, k, STEEL.hi);
    }
  } },
  pistol: { across: true, draw(T) {
    for (let i = -1; i <= 9.5; i += 0.4) for (let k = -4.2; k <= -2.4; k += 0.4) T(i, k, k < -3.6 ? STEEL.a : k > -2.9 ? STEEL.d : STEEL.b);
    for (let i = -1.2; i <= 1.2; i += 0.4) for (let k = -2.4; k <= 2.4; k += 0.4) T(i, k, STEEL.gripD);
    T(9, -4.6, STEEL.hi);
  } },
  launcher: { two: -9, draw(T) {
    for (let i = -14; i <= 22; i += 0.4) for (let k = -6; k <= -1; k += 0.4) T(i, k, k < -4.8 ? STEEL.oliveA : k > -2.2 ? STEEL.oliveD : Math.abs(i - 3) < 1.4 ? STEEL.gold : STEEL.olive);
    for (let k = -6.8; k <= -0.2; k += 0.4) (T(22.4, k, STEEL.b), T(-14.4, k, STEEL.d));
  } },
  handle: { draw(T) {
    haft(T, -2.6, 6, STEEL.grip, STEEL.gripD);
    for (let k = -1.6; k <= 1.6; k += 0.4) (T(-3, k, STEEL.gold), T(6.4, k, STEEL.gold));
  } },
};

// ---- flat tones, seams, and one clean ink line
function finish(S, restFrames) {
  const dim = (part) => part >= PART.upperF && part <= PART.handF ? 1 : part >= PART.thighF && part <= PART.footF ? 1 : 0;
  const toneOf = (v, part) => {
    let t = v > 0.8 ? 0 : v > 0.42 ? 1 : v > 0.08 ? 2 : 3;
    t = Math.min(3, t + dim(part));
    return t;
  };
  const tones = new Map();
  for (const i of touched) tones.set(i, toneOf(Tone[i], Part[i]));
  // a lone pixel of a tone, with no neighbour like it on the same part, takes its neighbours' tone
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    const t = tones.get(i), votes = [0, 0, 0, 0];
    let same = false;
    for (const d of [-1, 1, -BW, BW]) {
      const j = i + d;
      if (Part[j] !== Part[i] || !tones.has(j)) continue;
      const u = tones.get(j);
      votes[u]++;
      if (u === t) same = true;
    }
    if (!same && votes.some((v) => v > 0)) tones.set(i, votes.indexOf(Math.max(...votes)));
  }
  for (const i of touched) {
    if (Mat[i] === 2) continue;
    Col[i] = (Mat[i] === 1 ? CORE : SHELL)[tones.get(i)];
  }
  // where two parts meet: a soft seam if they touch, ink if one stands in front of the other
  const marks = new Map();
  for (const i of touched) {
    for (const d of [1, BW]) {
      const j = i + d;
      if (Part[j] === 0 || Part[j] === Part[i]) continue;
      const far = Zb[i] < Zb[j] ? i : j, dz = Math.abs(Zb[i] - Zb[j]), steel = Mat[i] === 2 || Mat[j] === 2;
      if (Mat[far] === 2 && dz < 1) continue;
      const ink = steel || dz > 2.2;
      if (ink) marks.set(far, INK);
      else if (!marks.has(far)) marks.set(far, SEAM);
    }
  }
  for (const [i, c] of marks) Col[i] = c;
  // the mark on his chest, when it's facing us
  const { B } = S, chestAt = add(B.chest.t, mv(B.chest.R, [3, 1.6, -1.8]));
  if (mv(B.chest.R, [1, 0, 0])[2] > 0.15) {
    const i = (OY - Math.round(chestAt[1])) * BW + (OX + Math.round(chestAt[0]));
    if (Part[i] === PART.chest) Col[i] = MARK;
  }
  // the outline, and everything into a small list of pixels
  const list = touched.slice(), ring = new Map();
  for (const i of list) for (const d of [-1, 1, -BW, BW]) { const j = i + d; if (Part[j] === 0 && !ring.has(j)) ring.set(j, i); }
  const n = list.length + ring.size, out = { n, xs: new Int16Array(n), ys: new Int16Array(n), color: new Uint32Array(n), src: new Int16Array(n), ink: new Uint8Array(n), x0: 0, y0: 0, x1: 0, y1: 0 };
  const srcFor = (i) => {
    const f = Fr[i];
    if (f < 0 || !restFrames) return -1;
    const name = FRAME_IDS[f], A = B[name], R0 = restFrames[name], wx = (i % BW) - OX, wy = OY - ((i / BW) | 0), P = [wx, wy, Zb[i]];
    const lp = tv(A.R, sub(P, A.t)), rp = add(R0.t, mv(R0.R, lp)), c = Math.round(rp[0]) + 12, r = 38 - Math.round(rp[1]);
    return c < 0 || r < 0 || c >= W0 || r >= H0 ? -1 : r * W0 + c;
  };
  let k = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const push = (i, c, s, isInk) => {
    const x = (i % BW) - OX, y = ((i / BW) | 0) - OY;
    out.xs[k] = x; out.ys[k] = y; out.color[k] = c; out.src[k] = s; out.ink[k] = isInk ? 1 : 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    k++;
  };
  for (const i of list) push(i, Col[i], srcFor(i), Col[i] === INK);
  for (const [j, i] of ring) push(j, INK, srcFor(i), true);
  let zs = 0;
  for (const i of list) zs += Zb[i];
  Object.assign(out, { x0, y0, x1, y1, z: list.length ? zs / list.length : 0 });
  for (const i of list) Part[i] = 0;
  touched.length = 0;
  return out;
}

const turnAll = (S, a) => {
  // the whole figure turned about the vertical through the feet
  const R = rotY(-a), P = (v) => mv(R, v);
  for (const f of Object.values(S.B)) { f.t = P(f.t); f.R = mm(R, f.R); }
  for (const A of [S.armN, S.armF, S.legN, S.legF]) { A.joint = P(A.joint); A.end = P(A.end); }
  S.sN = P(S.sN); S.sF = P(S.sF); S.hipN = P(S.hipN); S.hipF = P(S.hipF);
  S.axis = P(S.axis); S.side = P(S.side);
};
let REST_FRAMES = null;
function render(pose) {
  const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const air = (q.y ?? 0) < -0.5;
  clipBody = !air;
  clipWeapon = !air;
  drawBody(S);
  clipBody = false;
  if (S.W) S.W.draw(along(S.armN.end, S.axis, S.side, PART.weapon), q, S.armF.end);
  if (S.OW) {
    const sb = q.sb ?? Math.PI;
    let ax = [Math.cos(sb), -Math.sin(sb), 0], sd = [-Math.sin(sb), -Math.cos(sb), 0];
    if (whole) { const R = rotY(-whole); ax = mv(R, ax); sd = mv(R, sd); }
    S.OW.draw(along(S.armF.end, ax, sd, PART.offWeapon), q, S.armF.end);
  }
  clipWeapon = false;
  return finish(S, REST_FRAMES);
}
REST_FRAMES = solve({}).B;

const CACHE = new Map();
const keyOf = (p) => {
  let s = (p.y ?? 0) < -0.5 ? "air," : "";
  for (const k of Object.keys(p).sort()) {
    const v = p[k];
    if (v === undefined || k === "x" || k === "y" || k === "ghost") continue;
    s += k + (typeof v === "number" ? (k === "sa" || k === "sb" || k === "wl" || k === "yaw" || k === "turn" ? Math.round(v * 20) : Math.round(v)) : v) + ",";
  }
  return s;
};
/** How far short of where the pose wants them the hands fall, in px: arms don't stretch. */
function shortfall(pose) {
  const S = solve(pose), q = S.q, near = len(sub(S.armN.end, [q.fx, -q.fy, S.armN.end[2]])), far = q.two ? 0 : len(sub(S.armF.end, [q.bx, -q.by, S.armF.end[2]]));
  return Math.max(near, far);
}
/** The pixels of a pose: { n, xs, ys, color, src, ink, x0, y0, x1, y1 }, in local space with the feet at (0, 0). */
function posed(pose) {
  const key = keyOf(pose);
  let r = CACHE.get(key);
  if (!r) {
    if (CACHE.size > 6000) CACHE.clear();
    CACHE.set(key, (r = render(pose)));
  }
  return r;
}

/**
 * The skeleton of a pose, in the same local space as posed(): x right, y down, feet at (0, 0), z toward the viewer, whole
 * figure turned by its yaw. { joints: { name: [x, y, z] }, bones: [[from, to], ...], handles: [name, ...] }: the handles
 * are what a pose moves (hands and feet); everything else is solved from them.
 */
function skeleton(pose) {
  const S = solve(pose), q = S.q, whole = (q.yaw ?? 0) + (q.face === -1 ? Math.PI : 0);
  if (whole) turnAll(S, whole);
  const { B, armN, armF, legN, legF, sN, sF, hipN, hipF } = S, at = (f, v) => add(f.t, mv(f.R, v));
  const J = {
    pelvis: B.pelvis.t, waist: B.waist.t, chest: B.chest.t, neck: B.neck.t, head: B.head.t, crown: at(B.head, [0, 3.3, 0]),
    shoulderN: sN, elbowN: armN.joint, handN: armN.end, shoulderF: sF, elbowF: armF.joint, handF: armF.end,
    hipN, kneeN: legN.joint, ankleN: legN.end, toeN: at(B.footN, [4.6, -1.1, 0]), hipF, kneeF: legF.joint, ankleF: legF.end, toeF: at(B.footF, [4.6, -1.1, 0]),
  };
  const joints = Object.fromEntries(Object.entries(J).map(([k, v]) => [k, [v[0], -v[1], v[2]]]));
  const bones = [["pelvis", "waist"], ["waist", "chest"], ["chest", "neck"], ["neck", "head"], ["head", "crown"], ["chest", "shoulderN"], ["shoulderN", "elbowN"], ["elbowN", "handN"], ["chest", "shoulderF"], ["shoulderF", "elbowF"], ["elbowF", "handF"], ["pelvis", "hipN"], ["hipN", "kneeN"], ["kneeN", "ankleN"], ["ankleN", "toeN"], ["pelvis", "hipF"], ["hipF", "kneeF"], ["kneeF", "ankleF"], ["ankleF", "toeF"]];
  return { joints, bones, handles: ["handN", "handF", "ankleN", "ankleF"] };
}
/** The figure taken apart: each part drawn alone, with its own outline, and where its middle is. For exploded views. */
function posedParts(pose) {
  const out = [];
  for (const [name, part] of Object.entries(PART)) {
    onlyPart = part;
    const r = render(pose);
    onlyPart = 0;
    if (!r.n) continue;
    let cx = 0, cy = 0;
    for (let i = 0; i < r.n; i++) { cx += r.xs[i]; cy += r.ys[i]; }
    out.push({ name, part, n: r.n, xs: r.xs, ys: r.ys, color: r.color, cx: cx / r.n, cy: cy / r.n, z: r.z });
  }
  return out;
}

__e.STAND = STAND; __e.WEAPONS = WEAPONS; __e.shortfall = shortfall; __e.posed = posed; __e.skeleton = skeleton; __e.posedParts = posedParts;
};

__M["core/act.js"] = function (__e) {
// An act: an effect performed. The character winds up, lets go and recovers, a target takes the hit, and everything
// freezes for a moment on contact. Effects describe it as data (`export const act`), so a game with its own character
// can read the same timing. The freeze, the shake, the springy target and poses held on 12 fps steps are how Hollow Crown
// plays its skills (https://github.com/rehan-remade/hollow-crown), MIT License, Copyright (c) 2026 rehan-remade.

const {Rng, clamp} = __req("core/math.js");
const {hex, mix} = __req("core/color.js");
const {createFrame, clearFrame, createFx, painterFor} = __req("core/fx.js");
const {stockActor, drawActor, actorAlphaOf, HERO2, DUMMY_PAL} = __req("core/actor.js");
const {posed, STAND} = __req("core/rig.js");



// ---- poses over time
const lerp = (a, b, u) => a + (b - a) * u;
/** Between two poses: numbers move, everything else changes at the later key. */
function lerpPose(a, b, u) {
  const out = { ...STAND, ...a };
  const B = { ...STAND, ...b };
  for (const k of Object.keys(B)) {
    const v = B[k];
    if (typeof v === "number" && typeof out[k] === "number") out[k] = lerp(out[k], v, u);
    else if (out[k] === undefined && typeof v === "number") out[k] = v;
  }
  // what the later pose doesn't mention eases back to its default
  for (const k of ["hx", "hy", "lean", "crouch"]) if (B[k] === undefined && typeof out[k] === "number") out[k] = lerp(out[k], 0, u);
  if (B.wl === undefined && typeof out.wl === "number") out.wl = lerp(out.wl, 1, u);
  return out;
}
const eases = { out: (u) => 1 - (1 - u) * (1 - u), in: (u) => u * u, line: (u) => u };
/**
 * The pose at time t on a track of keys [t, pose, how]: `how` says how the pose arrives: smoothly by default, "out"
 * fast then settling, "in" slowly then fast, "snap" holding the last pose and jumping on the key. Limbs move in whole
 * 12 fps steps counted from each key, so they read as held drawings; the feet's position over the floor (x, y) stays smooth.
 */
function poseAt(track, t) {
  if (t <= track[0][0]) return track[0][1];
  for (let i = 0; i < track.length - 1; i++) {
    const [t0, a] = track[i], [t1, b, how] = track[i + 1];
    if (t >= t1) continue;
    if (how === "snap") return a;
    const e = eases[how] ?? ((u) => u * u * (3 - 2 * u));
    const stepped = t0 + Math.floor((t - t0) * 12 + 1e-6) / 12;
    const out = lerpPose(a, b, e((stepped - t0) / (t1 - t0)));
    const u = e((t - t0) / (t1 - t0));
    out.x = lerp(a.x ?? 0, b.x ?? 0, u);
    out.y = lerp(a.y ?? 0, b.y ?? 0, u);
    return out;
  }
  return track[track.length - 1][1];
}

/** Is the body between keys that hardly differ, or past the last? */
function isHeld(track, t) {
  if (t >= track[track.length - 1][0] || t < track[0][0]) return true;
  for (let i = 0; i < track.length - 1; i++) {
    if (t >= track[i + 1][0]) continue;
    const a = { ...STAND, ...track[i][1] }, b = { ...STAND, ...track[i + 1][1] };
    return track[i + 1][0] - track[i][0] > 0.4 && ["fx", "fy", "bx", "by", "crouch", "lean", "x", "y"].every((k) => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) < 1.5);
  }
  return true;
}

// ---- the target
const TW = 38, TH = 52;
const TP = Object.fromEntries(Object.entries({ ink: "#0b0a1a", wood: "#724c2e", woodL: "#a0703a", woodD: "#4e331f", straw: "#d2aa55", strawL: "#f0d98a", burlapD: "#86643a", burlap: "#b38b57", burlapL: "#c9a26c", red: "#9a2f3c", redL: "#c4434f", white: "#ffffff" }).map(([k, v]) => [k, hex(v)]));
const DUST = ["#efe7dc", "#c9bfb8", "#8f8693", "#5a5468"].map(hex);
const DUMMY = new Uint32Array(TW * TH);
(function buildDummy() {
  const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < TW && y < TH) DUMMY[y * TW + x] = c; };
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c); };
  // the post and the crossbar
  R(15, 38, 8, 14, TP.ink); R(16, 34, 6, 18, TP.wood); R(16, 34, 2, 18, TP.woodL); R(20, 34, 2, 18, TP.woodD);
  R(1, 18, 36, 1, TP.ink); R(1, 23, 36, 1, TP.ink); R(1, 19, 36, 4, TP.wood); R(1, 19, 36, 1, TP.woodL); R(1, 22, 36, 1, TP.woodD);
  // straw bursting out of the ends of the arms
  for (const [bx, s] of [[0, -1], [33, 1]]) {
    R(bx, 17, 5, 8, TP.straw);
    for (const [dx, dy, c] of [[2, 16, TP.straw], [3, 15, TP.strawL], [1, 17, TP.strawL], [2, 25, TP.straw], [1, 26, TP.strawL], [3, 25, TP.burlapD], [2, 19, TP.strawL], [3, 21, TP.strawL], [1, 22, TP.burlapD], [2, 23, TP.strawL]]) px(bx + dx, dy, c);
    px(s < 0 ? bx - 1 : bx + 5, 19, TP.straw); px(s < 0 ? bx - 1 : bx + 5, 22, TP.strawL);
  }
  const sack = (x, y, w, h) => {
    R(x + 1, y, w - 2, 1, TP.ink); R(x + 1, y + h - 1, w - 2, 1, TP.ink);
    R(x, y + 1, 1, h - 2, TP.ink); R(x + w - 1, y + 1, 1, h - 2, TP.ink);
    R(x + 1, y + 1, w - 2, h - 2, TP.burlap);
    R(x + w - 4, y + 1, 3, h - 2, TP.burlapD);
    R(x + 1, y + h - 3, w - 2, 2, TP.burlapD);
    R(x + 1, y + 1, 1, h - 4, TP.burlapL); R(x + 1, y + 1, w - 6, 1, TP.burlapL);
    // the weave
    for (let j = y + 2; j < y + h - 2; j += 3) for (let i = x + 3 + (j % 2); i < x + w - 4; i += 4) px(i, j, TP.burlapD);
  };
  sack(9, 17, 20, 24);
  // the rings on its chest
  for (let y = 19; y < 36; y++) for (let x = 11; x < 27; x++) { const d = Math.hypot(x - 18.5, y - 27); if ((d > 4 && d < 5.4) || d < 1.9) px(x, y, x + y < 45 ? TP.redL : TP.red); }
  // the rope belt, and straw coming out under it
  for (let x = 10; x < 28; x++) { px(x, 36, x & 1 ? TP.woodL : TP.straw); px(x, 37, x & 1 ? TP.woodD : TP.wood); }
  for (const [x, y, c] of [[11, 41, TP.straw], [12, 42, TP.strawL], [14, 41, TP.strawL], [15, 42, TP.straw], [23, 41, TP.straw], [24, 42, TP.strawL], [26, 41, TP.straw], [13, 43, TP.straw], [25, 43, TP.straw]]) px(x, y, c);
  sack(10, 1, 18, 16);
  // X for eyes and a stitched mouth
  for (const ex of [14, 23]) for (let d = -2; d <= 2; d++) { px(ex + d, 7 + d, TP.ink); px(ex - d, 7 + d, TP.ink); }
  for (let x = 14; x < 24; x++) px(x, 12, x & 1 ? TP.ink : TP.burlapD);
  for (const x of [15, 18, 21]) { px(x, 11, TP.ink); px(x, 13, TP.ink); }
  // the rope at its neck, and straw for hair
  for (let x = 12; x < 26; x++) { px(x, 16, x & 1 ? TP.woodL : TP.straw); px(x, 17, x & 1 ? TP.wood : TP.woodD); }
  for (const [x, y, c] of [[13, 0, TP.straw], [15, 0, TP.strawL], [18, 0, TP.straw], [21, 0, TP.strawL], [24, 0, TP.straw], [9, 4, TP.straw], [28, 6, TP.straw], [8, 7, TP.strawL], [29, 3, TP.strawL]]) px(x, y, c);
})();
/** What a hit can leave on the target: [color, how much of it]. */
const SKINS = { flash: [TP.white, 1], char: [hex("#1a0c0e"), 0.72], ice: [hex("#a8e8ff"), 0.72], shadow: [hex("#3a1a70"), 0.5], holy: [hex("#fff4c0"), 0.5], red: [hex("#ff2040"), 0.45], shock: [hex("#8fd6ff"), 0.6], poison: [hex("#58c43a"), 0.5] };
const STRAW = [TP.strawL, TP.straw, TP.straw, TP.burlapD, TP.burlapD];

/** A straw target on a spring: it sways, flashes, takes a skin, shivers and sheds straw. (x, y): the floor under it, local space. */
class Target {
  constructor(x, seed = 5) {
    Object.assign(this, { x, theta: 0, omega: 0, flashT: 0, skin: null, skinFade: 0, shiver: 0, clock: 0, R: new Rng(seed), straw: [] });
  }
  hit({ push = 1.2, straw = 8, flash = 0.05, skin, shiver = 0, y = -26 } = {}) {
    this.omega += push;
    this.flashT = Math.max(this.flashT, flash);
    if (skin !== undefined) this.skin = skin;
    if (shiver) this.shiver = shiver;
    const R = this.R;
    for (let k = 0; k < straw; k++) {
      const back = R.next() < 0.3;
      this.straw.push({ x: this.x + R.range(-3, 3), y: y + R.range(-3, 3), vx: back ? R.range(-60, -5) : R.range(10, 130), vy: R.range(-120, -5), age: 0, life: R.range(1.2, 2.2), big: R.next() < 0.5 });
    }
  }
  step(dt) {
    this.clock += dt;
    this.omega += (-60 * this.theta - 3.4 * this.omega) * dt;
    this.theta = clamp(this.theta + this.omega * dt, -0.4, 0.42);
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shiver > 0) this.shiver -= dt;
    for (const s of this.straw) {
      s.age += dt;
      s.vy += 210 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y >= 0) { s.y = 0; s.vx *= 0.2; s.vy = 0; }
    }
    this.straw = this.straw.filter((s) => s.age < s.life);
  }
  draw(C, W, H, X, Y, flip) {
    const tan = Math.tan(this.theta), sv = this.shiver > 0 ? (Math.floor(this.clock * 30) & 1 ? 1 : -1) : 0, name = this.flashT > 0 ? "flash" : this.skin, sk = name ? SKINS[name] : null;
    const base = X + (flip ? -this.x - 1 : this.x);
    for (let r = 0; r < TH; r++) {
      const o = Math.round((TH - 1 - r) * tan * 0.8) + sv;
      for (let x = 0; x < TW; x++) {
        const c = DUMMY[r * TW + x];
        if (!c) continue;
        const px = base + (flip ? -(x - 19 + o) - 1 : x - 19 + o), py = Y - TH + r;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = sk ? mix(c, sk[0], sk[1]) : c;
      }
    }
  }
  drawStraw(C, W, H, X, Y, flip) {
    for (const s of this.straw) {
      const c = STRAW[Math.min(4, Math.floor((s.age / s.life) * 5))], lx = Math.round(s.x), ly = Math.round(s.y) - 1;
      for (let i = 0; i < (s.big ? 2 : 1); i++) {
        const px = X + (flip ? -(lx + i) - 1 : lx + i), py = Y + ly;
        if (px >= 0 && py >= 0 && px < W && py < H) C[py * W + px] = c;
      }
    }
  }
}

// ---- the act itself
const GHOST_LIFE = 0.16;
const REST_MASK = new Uint8Array(24 * 38), REST_PX = new Uint32Array(24 * 38);
HERO2.forEach((row, r) => [...row].forEach((ch, c) => {
  if (ch !== ".") {
    REST_MASK[r * 24 + c] = 1;
    REST_PX[r * 24 + c] = hex(DUMMY_PAL[ch]);
  }
}));

// every cell of the standing sprite, mapped to the nearest cell that's on the body
const NEAREST = new Int16Array(24 * 38).fill(-1);
for (let r = 0; r < 38; r++)
  for (let c = 0; c < 24; c++) {
    let best = -1, bd = 1e9;
    for (let y = Math.max(0, r - 7); y < Math.min(38, r + 8); y++)
      for (let x = Math.max(0, c - 7); x < Math.min(24, c + 8); x++) {
        const d = (x - c) * (x - c) + (y - r) * (y - r);
        if (REST_MASK[y * 24 + x] && d < bd) { bd = d; best = y * 24 + x; }
      }
    NEAREST[r * 24 + c] = best;
  }
const lum = (c) => (0.3 * (c & 255) + 0.59 * ((c >>> 8) & 255) + 0.11 * ((c >>> 16) & 255)) / 255;
// an effect's color over the standing body, moved onto a pixel of the pose: its color, at this pixel's own light and shade
function carry(v, rest, own) {
  const lv = lum(v);
  if (lv > 0.9 || v >>> 24 < 255) return v;
  const k = Math.max(0.45, Math.min(1.5, lum(own) / Math.max(0.08, lum(rest))));
  const ch = (n) => Math.min(255, Math.round(((v >>> n) & 255) * k));
  return (255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** When an act's poses begin and end, in effect time (a loop ends when it's told to). */
function actSpan(mod) {
  const a = mod.act, D = mod.meta?.duration ?? 1, k = a?.poses;
  return { from: Math.min(0, k?.[0]?.[0] ?? 0), to: mod.meta?.loop ? Infinity : Math.max(D, k?.[k.length - 1]?.[0] ?? 0) };
}

/**
 * An effect performed: { fx, t, update(dt), draw(frame, { body, target }), shake, done() }. t runs from the first pose
 * (before the effect's own t = 0) to the last. update() holds everything still during a freeze; draw() paints the effect, the
 * character and the target together. o: the effect's options, with x, y placing the feet. Without an act, it just plays.
 */
function createAct(mod, o = {}) {
  const a = mod.act ?? {}, meta = mod.meta ?? {}, D = meta.duration ?? 1, flip = !!o.flip, seed = o.seed ?? meta.options?.seed ?? 1;
  const fx = createFx(mod, o), track = a.poses ?? [[0, { ...STAND }]], span = actSpan(mod);
  const X = o.x ?? 0, Y = o.y ?? 0;
  const targets = (a.targets ?? (a.target ? [a.target] : [])).map((g, i) => new Target(g.x ?? 66, seed + 4 + i));
  const hits = (a.hits ?? []).map((h) => ({ ...h })).sort((p, q) => p.t - q.t), dust = (a.dust ?? []).slice();
  const R = new Rng(seed + 9), specks = [];
  // after-images take the effect's own color unless the act names one
  const ramp = o.palette ?? meta.options?.palette, ghosts = [], gc = hex(a.ghost ?? ramp?.[Math.floor(ramp.length * 0.7)] ?? "#8fb4ff");
  let t = span.from, stop = 0, stopped = false, shakeT = 0, shake0 = 0, amp = 0, nh = 0, nd = 0, loopN = 0, gAcc = 0, last = null;
  const poseNow = () => {
    let tt = t;
    if (meta.loop && t >= D) tt = t % D;
    let q = poseAt(track, tt);
    // nothing is asked of him: he breathes
    if (!meta.loop && isHeld(track, tt)) {
      const up = Math.floor(tt * 3) & 1;
      q = { ...STAND, ...q, crouch: (q.crouch ?? 0) + up, fy: (q.fy ?? STAND.fy) + up, by: (q.by ?? STAND.by) + up };
    }
    last = q;
    return q;
  };
  let scratch = null;
  const scratchFor = (f) => {
    if (!scratch || scratch.a.w !== f.w || scratch.a.h !== f.h) scratch = { a: createFrame(f.w, f.h, f.ox, f.oy), b: createFrame(f.w, f.h, f.ox, f.oy) };
    return scratch;
  };
  const out = {
    fx, meta, act: a, targets,
    get t() { return t; },
    /** How far the whole picture is thrown right now, in px. */
    get shake() {
      if (shakeT <= 0) return [0, 0];
      const k = amp * (shakeT / shake0), f = Math.floor(shakeT * 60);
      return [Math.round(Math.sin(f * 2.4) * k), Math.round(Math.cos(f * 3.7) * k * 0.7)];
    },
    get frozen() { return stop > 0; },
    /** The pose he's in right now. */
    get pose() { return last; },
    update(dt) {
      if (shakeT > 0) shakeT -= dt;
      if (stop > 0) {
        stop -= dt;
        return;
      }
      const t0 = t;
      t += dt;
      if (t >= 0) fx.update(t0 < 0 ? t : dt);
      if (meta.loop && t >= D) {
        const n = Math.floor(t / D);
        if (n !== loopN) {
          loopN = n;
          nh = 0;
          nd = 0;
        }
      }
      const tt = meta.loop && t >= D ? t % D : t;
      for (; nh < hits.length && hits[nh].t <= tt; nh++) {
        const h = hits[nh];
        if (h.stop) stop = Math.max(stop, h.stop);
        if (h.shake) {
          shakeT = shake0 = h.shake;
          amp = h.amp ?? 2;
        }
        if (h.target !== false) targets.forEach((g, i) => (h.at === undefined || h.at === i) && g.hit(h));
        out.onHit?.(h);
      }
      for (; nd < dust.length && dust[nd].t <= tt; nd++) {
        const d = dust[nd], n = d.n ?? 6;
        for (let i = 0; i < n; i++) {
          const dir = d.dir ?? (R.next() < 0.5 ? -1 : 1);
          specks.push({ x: d.x + R.range(-3, 3), y: -1 - R.range(0, 2), vx: dir * R.range(22, 90), vy: R.range(-34, -6), age: 0, life: R.range(0.16, 0.4), big: R.next() < 0.45, c: d.c ? hex(d.c) : 0 });
        }
      }
      for (const k of specks) {
        k.age += dt;
        k.vx *= 1 - 5 * dt;
        k.vy += 110 * dt;
        k.x += k.vx * dt;
        k.y = Math.min(-1, k.y + k.vy * dt);
      }
      for (let i = specks.length - 1; i >= 0; i--) if (specks[i].age >= specks[i].life) specks.splice(i, 1);
      const q = poseNow();
      for (const g of targets) g.step(dt);
      // after-images while a key asks for them
      gAcc += dt;
      if (q.ghost && gAcc >= 1 / 30) {
        gAcc = 0;
        ghosts.push({ q, age: 0 });
        if (ghosts.length > 7) ghosts.shift();
      }
      for (const g of ghosts) g.age += dt;
      while (ghosts.length && ghosts[0].age > GHOST_LIFE) ghosts.shift();
    },
    /** Paint it. { body: false } leaves the character out, { target: false } the target. */
    draw(frame, { body = true, target: showTarget = true } = {}) {
      const W = frame.w, H = frame.h, q = last ?? poseNow(), active = t >= 0;
      const tgt = showTarget ? targets : [];
      const drawTargets = () => tgt.forEach((g) => g.draw(frame.color, W, H, FX, FY, flip));
      const drawStraw = () => tgt.forEach((g) => g.drawStraw(frame.color, W, H, FX, FY, flip));
      const drawDust = () => {
        for (const k of specks) {
          const c = k.c || DUST[Math.min(3, Math.floor((k.age / k.life) * 4))], lx = Math.round(k.x), py = FY + Math.round(k.y);
          for (let i = 0; i < (k.big ? 2 : 1); i++) {
            const px = flip ? FX - lx - i - 1 : FX + lx + i;
            if (px >= 0 && py >= 0 && px < W && py < H) frame.color[py * W + px] = c;
          }
        }
      };
      const FX = X - (frame.ox | 0), FY = Y - (frame.oy | 0);
      if (!body) {
        if (active) fx.draw(frame, "back");
        drawTargets();
        if (active) fx.draw(frame, "front");
        drawStraw();
        return;
      }
      const rx = Math.round(q.x ?? 0), ry = Math.round(q.y ?? 0), BX = FX + (flip ? -rx : rx), BY = FY + ry;
      const r = posed(q), mirror = flip;
      const paint = (i, color) => {
        const px = mirror ? BX - r.xs[i] - 1 : BX + r.xs[i], py = BY + r.ys[i];
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        frame.color[py * W + px] = color;
        // he stays crisp in front of his own after-images
        if (ghosts.length) frame.light[py * W + px] = 0;
      };
      const drawGhosts = () => {
        for (const g of ghosts) {
          // after-images are light, not paint: they brighten what's behind them and leave nothing muddy
          const gr = posed(g.q), gx = FX + (flip ? -Math.round(g.q.x ?? 0) : Math.round(g.q.x ?? 0)), gy = FY + Math.round(g.q.y ?? 0), k = 0.5 * (1 - g.age / GHOST_LIFE);
          const gm = flip, r0 = (gc & 255) * k, g0 = ((gc >>> 8) & 255) * k, b0 = ((gc >>> 16) & 255) * k;
          for (let i = 0; i < gr.n; i++) {
            const px = gm ? gx - gr.xs[i] - 1 : gx + gr.xs[i], py = gy + gr.ys[i];
            if (px < 0 || py < 0 || px >= W || py >= H) continue;
            const j = py * W + px, d = frame.light[j];
            frame.light[j] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + b0) << 16) | (Math.min(255, ((d >>> 8) & 255) + g0) << 8) | Math.min(255, (d & 255) + r0);
          }
        }
      };
      const shadow = () => {
        const sy = FY, cx = FX + (flip ? -rx : rx), hw = 10 + (Math.abs(q.ffx - q.fbx) >> 1) - Math.min(8, Math.abs(ry) >> 1);
        if (sy < 0 || sy >= H) return;
        for (let dy = 0; dy < 2; dy++)
          for (let x = -hw + dy * 2; x <= hw - dy * 2; x++) {
            const px = cx + x, i = (sy + dy) * W + px;
            if (px < 0 || px >= W || sy + dy >= H) continue;
            frame.color[i] = (frame.color[i] & 0xffffff) | (Math.max(frame.color[i] >>> 24, 110) << 24);
          }
      };
      if (!a.onBody) {
        // the effect doesn't care about the body: back, body, front
        if (active) fx.draw(frame, "back");
        drawTargets();
        shadow();
        drawGhosts();
        for (let i = 0; i < r.n; i++) paint(i, r.color[i]);
        if (active) fx.draw(frame, "front");
        drawStraw();
        drawDust();
        return;
      }
      // the effect paints the standing body: draw it there, then carry each body pixel to where the pose put it
      const { a: A, b: B } = scratchFor(frame);
      clearFrame(A);
      clearFrame(B);
      if (active) fx.draw(A, "back");
      B.color.set(A.color);
      B.light.set(A.light);
      const tt = meta.loop ? (t < 0 ? 0 : t % D) : clamp(t, 0, D), alpha = active ? actorAlphaOf(mod, tt, fx.options) : 1;
      drawActor(painterFor(B).place(FX, FY, flip), fx.options.actor ?? stockActor(2), alpha);
      if (active) fx.draw(B, "front");
      const follow = a.follow ?? 1, lean = (q.lean ?? 0) * follow, cr = (q.crouch ?? 0) * follow;
      // what's up on the body goes with it; what's on the floor stays on the floor
      const shiftOf = (ly) => {
        const k = clamp((-11 - ly) / 7, 0, 1), f = clamp((-1 - ly) / 6, 0, 1);
        return [Math.round(lean * k + rx * f), Math.round(cr * k + ry * f)];
      };
      const rest = (sx, sy) => {
        const c = (flip ? FX - sx - 1 : sx - FX) + 12, r0 = sy - FY + 38;
        return c >= 0 && r0 >= 0 && c < 24 && r0 < 38 && REST_MASK[r0 * 24 + c] === 1;
      };
      const C = frame.color, Ls = frame.light;
      const copy = (buf, sx, sy, s) => {
        const [dx, dy] = shiftOf(sy - FY), px = sx + (flip ? -dx : dx), py = sy + dy;
        if (px < 0 || py < 0 || px >= W || py >= H) return;
        const i = py * W + px;
        if (buf === Ls) {
          const d = Ls[i];
          Ls[i] = (255 << 24) | (Math.min(255, ((d >>> 16) & 255) + ((s >>> 16) & 255)) << 16) | (Math.min(255, ((d >>> 8) & 255) + ((s >>> 8) & 255)) << 8) | Math.min(255, (d & 255) + (s & 255));
        } else if (s >>> 24 === 255 || !C[i]) C[i] = s;
        else {
          const k = (s >>> 24) / 255, d = C[i];
          const ch = (n) => Math.round(((s >>> n) & 255) * k + ((d >>> n) & 255) * (1 - k));
          C[i] = (Math.max(s >>> 24, d >>> 24) << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0);
        }
      };
      drawTargets();
      shadow();
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const c = A.color[sy * W + sx];
          if (c) copy(C, sx, sy, c);
        }
      drawGhosts();
      const restIndex = (s) => {
        const c = s % 24, r0 = (s / 24) | 0, sx = flip ? FX - (c - 12) - 1 : FX + c - 12, sy = FY + r0 - 38;
        return sx >= 0 && sy >= 0 && sx < W && sy < H ? sy * W + sx : -1;
      };
      for (let i = 0; i < r.n; i++) {
        const s = r.src[i] >= 0 ? NEAREST[r.src[i]] : -1;
        if (s < 0) {
          if (alpha > 0.5) paint(i, r.color[i]);
          continue;
        }
        const j = restIndex(s), v = j >= 0 ? B.color[j] : REST_PX[s];
        if (!v) continue;
        // the effect left this bit of body alone, or changed it: carry the change, on top of this pixel's own shading
        paint(i, v === REST_PX[s] ? r.color[i] : carry(v, REST_PX[s], r.color[i]));
      }
      for (let sy = 0; sy < H; sy++)
        for (let sx = 0; sx < W; sx++) {
          const j = sy * W + sx;
          if (B.color[j] && B.color[j] !== A.color[j] && !rest(sx, sy)) copy(C, sx, sy, B.color[j]);
          if (B.light[j] & 0xffffff) copy(Ls, sx, sy, B.light[j]);
        }
      drawStraw();
      drawDust();
    },
    /** Let a loop end: it fades out and done() goes true. */
    stop() {
      fx.stop();
      stopped = true;
    },
    /** One-shots end when the last pose is over. */
    done() {
      return stopped ? fx.done() : t >= span.to && stop <= 0;
    },
  };
  poseNow();
  return out;
}

/**
 * An act as plain data, for a game with its own character: how long the wind-up and recovery are, when to freeze and shake,
 * what a target should do, and the poses themselves. Times are in the effect's own seconds: start the effect at 0.
 */
function actTiming(mod) {
  const a = mod.act;
  if (!a) return null;
  const { from, to } = actSpan(mod), D = mod.meta?.duration ?? 1;
  return {
    windup: -from,
    recovery: mod.meta?.loop ? 0 : Math.max(0, to - D),
    onBody: !!a.onBody,
    targets: (a.targets ?? (a.target ? [a.target] : [])).map((g) => g.x ?? 66),
    hits: (a.hits ?? []).map((h) => ({ t: h.t, freeze: h.stop ?? 0, shake: h.shake ?? 0, amp: h.amp ?? 0, push: h.target === false ? 0 : h.push ?? 1.2, skin: h.skin, at: h.at })),
    poses: (a.poses ?? []).map(([t, pose, how]) => ({ t, how: how ?? "smooth", pose })),
  };
}

/** The box an act needs in local space, so nothing gets cut off: { x0, y0, x1, y1 }, sampled over its poses. */
function actBounds(mod) {
  const a = mod.act, [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin;
  let x0 = -ox, y0 = -oy, x1 = w - ox, y1 = h - oy;
  const see = (p) => {
    const r = posed(p), X = Math.round(p.x ?? 0), Y = Math.round(p.y ?? 0), a = r.x0, b = r.x1;
    x0 = Math.min(x0, a + X - 1); x1 = Math.max(x1, b + X + 1); y0 = Math.min(y0, r.y0 + Y - 1); y1 = Math.max(y1, r.y1 + Y + 1);
  };
  const k = a?.poses;
  if (k) {
    for (let t = k[0][0]; t <= k[k.length - 1][0]; t += 1 / 12) see(poseAt(k, t));
    for (const key of k) see(key[1]);
  } else see(STAND);
  for (const g of a?.targets ?? (a?.target ? [a.target] : [])) {
    const tx = g.x ?? 66;
    x0 = Math.min(x0, tx - 30); x1 = Math.max(x1, tx + 36); y0 = Math.min(y0, -56);
  }
  return { x0, y0, x1, y1 };
}

__e.STAND = STAND; __e.posed = posed; __e.lerpPose = lerpPose; __e.poseAt = poseAt; __e.SKINS = SKINS; __e.Target = Target; __e.actSpan = actSpan; __e.createAct = createAct; __e.actTiming = actTiming; __e.actBounds = actBounds;
};

__M["core/scene.js"] = function (__e) {
// Preview backdrops: what the tools and the gallery draw behind an effect. Sprite sheets stay transparent.

const {hex, mix} = __req("core/color.js");
const {rand} = __req("core/math.js");

const SKY = hex("#15131d"), SKY_TOP = hex("#0d0b14"), SKY_LOW = hex("#221d33");
const FLOOR_EDGE = hex("#4a4263"), FLOOR = hex("#2b2639"), FLOOR_DARK = hex("#211d2d"), MORTAR = hex("#1a1724");
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const BACKDROPS = ["dark", "ground", "sky", "light", "black"];

/**
 * A backdrop as a Uint32Array of w x h colors. kind: "dark" | "ground" (a stone floor from groundY down)
 * | "sky" (night gradient with stars) | "light" | "black".
 */
function backdrop(kind, w, h, groundY = h) {
  const out = new Uint32Array(w * h);
  if (kind === "light") return out.fill(hex("#ebe8f0"));
  if (kind === "black") return out.fill(hex("#000000"));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let c = SKY;
      if (kind === "sky") {
        const t = y / Math.max(1, h - 1), step = (t * 5 + BAYER[((y & 3) << 2) | (x & 3)] / 16) | 0;
        c = mix(SKY_TOP, SKY_LOW, Math.min(1, step / 4));
        const r = rand(x, y, 77);
        if (r > 0.994) c = mix(c, hex("#cfc8ff"), 0.35 + (r - 0.994) * 90);
      }
      if (kind === "ground" && y >= groundY) {
        const gy = y - groundY;
        if (gy === 0) c = FLOOR_EDGE;
        else {
          const row = Math.floor((gy - 1) / 5), off = row % 2 ? 6 : 0;
          const mortar = (gy - 1) % 5 === 4 || (x + off) % 12 === 0;
          c = mortar ? MORTAR : gy < 3 ? FLOOR : FLOOR_DARK;
        }
      }
      out[y * w + x] = c;
    }
  return out;
}

__e.BACKDROPS = BACKDROPS; __e.backdrop = backdrop;
};

__M["core/sim.js"] = function (__e) {
// Simulated particles, debris and lights, for effects that want real physics: sparks that streak and bounce
// off the floor, shards that tumble and settle, vapour and smoke that swell and thin, lights that flare and die.
// Adapted from Sprite Fusion's open-source pixel art VFX (https://www.spritefusion.com/pixel-art-vfx),
// MIT License, Copyright (c) 2026 Hugo Duprez. Units here are art pixels and seconds; draw through a Painter,
// so effects stay in local space and mirror or rotate like any other.

const {Rng, clamp, TAU} = __req("core/math.js");
const {hex, scale, mix, rgb, WHITE} = __req("core/color.js");

const GRAVITY = 950; // px/s²
const CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const HOT = ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"].map(hex);
/** Fire from white-hot to smouldering, and smoke from fresh to thin: the ramps FIRE puffs and SMOKE walk down. */
const FIRE_RAMP = ["#ffffff", "#fff3a6", "#ffe26b", "#ffc23d", "#ff8a2a", "#f2561d", "#c9281f", "#8a1f17", "#4a1712"].map(hex);
const SMOKE_RAMP = ["#7b6f72", "#5d5660", "#433d48", "#2b2630", "#1a171e"].map(hex);
const rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];

/** Particle kinds. */
const P = { SPARK: 0, MOTE: 1, STREAK: 2, FLAKE: 3, VAPOUR: 4, DUST: 5, STAR: 6, EMBER: 7, SMOKE: 8, FIRE: 9, BRAND: 10, GRIT: 11 };
/** Particle flags: SMOKES (a FIRE puff leaves smoke when it dies), BIG (bigger, slower smoke), BACK (draw behind). */
const PF = { SMOKES: 1, BIG: 2, BACK: 4 };
const SOFT = new Set([P.VAPOUR, P.DUST, P.SMOKE]);

/**
 * A particle system. opts: { seed, ground: (x) => floor y (local px; sparks bounce on it), sparks: [head..tail]
 * colors for SPARK, haze: color vapour glows with }.
 * spawn(kind, x, y, vx, vy, life, color, size); update(dt); draw(p, layer): "back" draws the soft kinds
 * (vapour, dust, smoke), "front" the rest, nothing for both.
 */
class Particles {
  constructor(opts = {}) {
    this.R = opts.rng ?? new Rng(opts.seed ?? 1);
    this.list = [];
    this.t = 0;
    this.ground = opts.ground ?? (() => Infinity);
    this.sparks = (opts.sparks ?? HOT).map(hex);
    this.haze = opts.haze === undefined ? null : hex(opts.haze);
    this.onLand = opts.onLand ?? null; // (x, y) when a BRAND hits the floor
  }
  /** delay: seconds before it appears; flag: PF bits. col 0 lets FIRE and SMOKE use their own ramps. */
  spawn(k, x, y, vx, vy, life, col = WHITE, size = 1, delay = 0, flag = 0) {
    this.list.push({ k, x, y, vx, vy, life, max: life, col: col ? hex(col) : 0, size, seed: this.R.next() * 100, delay, flag });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    const R = this.R, t = this.t;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      if ((p.life -= dt) <= 0) {
        if (p.k === P.FIRE && p.flag & PF.SMOKES) {
          const big = p.flag & PF.BIG;
          this.spawn(P.SMOKE, p.x, p.y, p.vx * 0.6, p.vy * 0.6 - 6, big ? R.range(1.3, 2.3) : R.range(0.8, 1.4), 0, p.size * (big ? 0.85 : 0.7), 0, big ? PF.BIG : 0);
        }
        this.list.splice(i, 1);
        continue;
      }
      switch (p.k) {
        case P.FIRE:
          p.vy -= 95 * dt;
          p.vx += Math.sin(t * 17 + p.seed) * 30 * dt;
          p.vx -= p.vx * 5 * dt;
          p.vy -= p.vy * 3.2 * dt;
          break;
        case P.GRIT: {
          p.vy += GRAVITY * dt;
          p.vx -= p.vx * 0.8 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            p.y = g - 0.25;
            if (p.vy > 130 && R.chance(0.4)) (p.vy = -p.vy * 0.25), (p.vx = p.vx * 0.5 + R.range(-10, 10));
            else (p.vx = p.vy = 0), (p.life = Math.min(p.life, 0.5));
          } else p.y = ny;
          continue;
        }
        case P.BRAND: {
          // a burning chunk: arcs, trails flame, and starts a little fire where it lands
          p.vy += GRAVITY * 0.8 * dt;
          p.vx -= p.vx * 0.9 * dt;
          if (R.chance(0.9 * Math.min(1, dt * 60))) this.spawn(P.FIRE, p.x, p.y, p.vx * 0.1 + R.range(-7, 7), p.vy * 0.1 - 10, R.range(0.16, 0.32), 0, R.range(0.9, 1.7) * (0.5 + (p.life / p.max) * 0.6), 0, R.chance(0.4) ? PF.SMOKES : 0);
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) {
            this.onLand?.(p.x, g);
            this.list.splice(i, 1);
          } else p.y = ny;
          continue;
        }
        case P.SPARK: {
          p.vy += GRAVITY * 0.45 * dt;
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt;
          const g = this.ground(p.x), ny = p.y + p.vy * dt;
          p.x += p.vx * dt;
          if (p.vy > 0 && p.y <= g && ny >= g) (p.vy = -p.vy * 0.45), (p.vx *= 0.7), (p.y = g - 0.25);
          else p.y = ny;
          continue;
        }
        case P.STREAK: (p.vx += p.vx * 3 * dt), (p.vy += p.vy * 3 * dt); break;
        case P.FLAKE:
          p.vx -= p.vx * 2.2 * dt;
          p.vy -= p.vy * 2.2 * dt - 35 * dt;
          p.x += Math.sin(this.t * 2.5 + p.seed) * 7 * dt;
          break;
        case P.EMBER:
          p.vy += (-30 + Math.sin(t * 3 + p.seed) * 20) * dt;
          p.vx += Math.cos(t * 2.3 + p.seed) * 45 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.6 * dt;
          break;
        case P.SMOKE: {
          const big = p.flag & PF.BIG;
          p.vy -= (big ? 23 : 16) * dt;
          p.vx += Math.sin(t * 1.3 + p.seed) * 8 * dt;
          p.vx -= p.vx * 1.6 * dt;
          p.vy -= p.vy * 1.2 * dt;
          break;
        }
        case P.MOTE: p.vx -= p.vx * 0.6 * dt; p.vy -= p.vy * 0.6 * dt; break;
        default: {
          const drag = SOFT.has(p.k) ? 4 : 1.6;
          p.vx -= p.vx * drag * dt;
          p.vy -= p.vy * drag * dt + 5 * dt;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
  draw(p, layer) {
    for (const q of this.list) {
      if (q.delay > 0) continue;
      if (layer && (SOFT.has(q.k) || q.flag & PF.BACK ? "back" : "front") !== layer) continue;
      const k = q.life / q.max, x = q.x, y = q.y, sp = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / sp, uy = q.vy / sp;
      switch (q.k) {
        case P.SPARK: {
          const S = this.sparks, head = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2], len = Math.min(9, 1 + sp * 0.022);
          p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : S[S.length - 1]);
          p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
          p.glow(x, y, 3, head, 0.45 * k);
          break;
        }
        case P.MOTE: {
          const len = Math.min(16, 0.5 + sp * 0.026) * q.size, a = k < 0.35 ? k / 0.35 : 1;
          p.line(x - ux * len, y - uy * len, x - ux * len * 0.35, y - uy * len * 0.35, scale(q.col, 0.55), a);
          p.line(x - ux * len * 0.4, y - uy * len * 0.4, x, y, q.col, a);
          p.glow(x, y, 2.5 + q.size, q.col, 0.4 * k);
          break;
        }
        case P.STREAK: {
          const L = clamp(sp / 30, 1, 7);
          for (let d = L; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L * 0.5 ? q.col : scale(q.col, 0.6), d < L * 0.5 ? 1 : 1.2 - d / L);
          p.glow(x, y, 4, q.col, 0.4);
          break;
        }
        case P.FLAKE: {
          const a = Math.min(1, k * 3);
          p.dot(x, y, q.col, a);
          if (q.size > 1.3) for (const [dx, dy] of CROSS) p.dot(x + dx, y + dy, scale(q.col, 0.8), a * 0.8);
          break;
        }
        case P.VAPOUR: {
          const r = q.size * (0.6 + (1 - k) * 0.9);
          p.disc(x, y, r, q.col, Math.pow(k, 1.3) * 0.45);
          if (this.haze) p.glow(x, y, r * 1.8, this.haze, 0.16 * k);
          break;
        }
        case P.DUST: p.disc(x, y, q.size * (0.6 + (1 - k) * 0.9), q.col, Math.pow(k, 1.3) * 0.7); break;
        case P.SMOKE: {
          // three soft discs: a body, a denser core sitting low, a lit cap while it's young
          const age = 1 - k, big = q.flag & PF.BIG;
          const r = q.size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
          const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58);
          const c = q.col ? mix(q.col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
          p.disc(x, y, r, c, a * 0.45);
          p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
          if (age < 0.5) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
          break;
        }
        case P.FIRE: {
          // a ball of flame that cools down the ramp as it rises: a darker rim, a lit core, a tongue on top
          const age = 1 - k, heat = Math.min(0.999, Math.pow(age, 0.62) + (q.seed % 1) * 0.1), F = FIRE_RAMP, n = F.length;
          const idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
          const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = F[idx];
          if (idx >= n - 2) p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
          else {
            p.circle(x, y, r, F[Math.min(n - 1, idx + 2)]);
            p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
            if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
            if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, F[Math.max(0, idx - 1)]);
            if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
          }
          break;
        }
        case P.BRAND:
          p.circle(x, y, 1.6, HOT[3]);
          p.px(x, y, Math.sin(this.t * 40 + q.seed) > 0 ? HOT[0] : HOT[1]);
          p.px(x + 1, y, HOT[1]);
          p.glow(x, y, 7, HOT[2], 0.45);
          break;
        case P.GRIT:
          if (k > 0.25 || k * 4 > 0.5) {
            p.px(x, y, q.col);
            if (q.size >= 2) p.px(x + 1, y, q.col), p.px(x, y + 1, scale(q.col, 0.8)), p.px(x + 1, y + 1, scale(q.col, 0.7));
          }
          break;
        case P.EMBER: {
          const c = k > 0.6 ? this.sparks[0] : k > 0.3 ? this.sparks[1] : this.sparks[2];
          if (k < 0.25 && Math.sin(this.t * 40 + q.seed) < 0) break;
          p.px(x, y, c);
          if (q.size > 1.5) p.px(x, y + 1, this.sparks[this.sparks.length - 1]);
          p.glow(x, y, 3 + q.size, c, 0.35 * k);
          break;
        }
        default: {
          // STAR: a twinkling cross, arms set by size
          const tw = 0.6 + 0.4 * Math.sin(this.t * (8 + (q.seed % 5)) + q.seed);
          if (q.size < 1) {
            if (tw * k > 0.25) p.px(x, y, tw > 0.8 ? WHITE : q.col);
            p.glow(x, y, 3, q.col, 0.4 * k * tw);
            break;
          }
          sparkle(p, x, y, q.size * tw * Math.min(1, k * 3), q.col, scale(q.col, 0.75), 0.5 * k * tw);
        }
      }
    }
  }
}

/**
 * Little fires burning where something landed: add(x, y, life, power) feeds FIRE puffs (and the odd ember)
 * into a particle system, fading over its life. update(dt); drawBack(p) adds a hot pixel and a glow at its foot.
 */
class Blazes {
  constructor(ps) {
    this.ps = ps;
    this.list = [];
  }
  add(x, y, life, power) {
    this.list.push({ x, y, life, max: life, acc: this.ps.R.next(), power });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    const ps = this.ps, R = ps.R;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const k = b.life / b.max, intensity = b.power * (k > 0.7 ? 1 : 0.35 + (k / 0.7) * 0.65);
      for (b.acc += dt * (6 + 16 * intensity); b.acc > 1; b.acc--) {
        const s = R.range(1.2, 2.8) * intensity;
        ps.spawn(P.FIRE, b.x + R.range(-1.5, 1.5), b.y - s * 0.6, R.range(-6, 6), R.range(-30, -12), R.range(0.28, 0.6), 0, s, 0, PF.BACK | (R.chance(0.3) ? PF.SMOKES : 0));
        if (R.chance(0.06)) ps.spawn(P.EMBER, b.x, b.y - 1.5, R.range(-15, 15), R.range(-45, -15), R.range(0.6, 1.4), HOT[2], 1, 0, PF.BACK);
      }
    }
  }
  drawBack(p) {
    for (const b of this.list) {
      const k = b.life / b.max;
      p.px(b.x, b.y, k > 0.4 ? (Math.sin(b.life * 31 + b.x) > 0 ? HOT[1] : HOT[2]) : HOT[3]);
      p.glow(b.x, b.y, 6 + 5 * k * b.power, HOT[2], 0.3 * k * b.power);
    }
  }
}

/** Debris kinds. */
const B = { SHARD: 0, CHUNK: 1, DRIP: 2 };

/**
 * Rigid debris that tumbles, bounces and settles. add({ kind, x, y, vx, vy, a, va, s (size), c (color), ramp
 * (chunk shading, dark to bright), g (gravity scale), drag, bounce, life }); update(dt); draw(p).
 */
class Bits {
  constructor(opts = {}) {
    this.list = [];
    this.ground = opts.ground ?? (() => Infinity);
  }
  add(b) {
    const life = b.life ?? 1;
    this.list.push({ kind: B.SHARD, vx: 0, vy: 0, a: 0, va: 0, s: 1, c: WHITE, g: 1, drag: 0, bounce: 0, rest: false, ...b, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      if ((b.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      if (b.rest) continue;
      b.vy += GRAVITY * b.g * dt;
      b.vx -= b.vx * b.drag * dt;
      b.vy -= b.vy * b.drag * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.va * dt;
      const floor = this.ground(b.x), sp = b.vy;
      if (b.g <= 0 || b.y < floor || sp <= 0) continue;
      b.y = floor - 0.01;
      if (b.kind === B.DRIP) b.life = 0;
      else if (b.bounce > 0 && sp > 70) (b.vy = -sp * b.bounce), (b.vx *= 0.7), (b.va *= 0.6);
      else (b.rest = true), (b.vx = b.vy = 0);
    }
  }
  draw(p) {
    for (const b of this.list) {
      const a = Math.min(1, b.life / 0.4), ca = Math.cos(b.a), sa = Math.sin(b.a);
      if (b.kind === B.SHARD) {
        for (let d = -b.s / 2; d <= b.s / 2; d += 0.5) p.dot(b.x + ca * d, b.y + sa * d, d > b.s / 2 - 0.6 ? WHITE : hex(b.c), a);
      } else if (b.kind === B.DRIP) {
        p.dot(b.x, b.y, hex(b.c), a);
        p.dot(b.x, b.y - 1, hex(b.c), a * 0.5);
      } else {
        // a shaded chunk: lit top-left, dark bottom-right, a dark rim
        const R = (b.ramp ?? ["#1c2030", "#3a4a66", "#6e86a8", "#a8c0dc", "#e8f2ff"]).map(hex), n = R.length;
        const x = Math.round(b.x), y = Math.round(b.y), r = Math.ceil(b.s) + 1;
        for (let py = -r; py <= r; py++)
          for (let px = -r; px <= r; px++) {
            const u = (px + 0.5) * ca + (py + 0.5) * sa, v = -(px + 0.5) * sa + (py + 0.5) * ca;
            const d = Math.abs(u) / b.s + Math.abs(v) / (b.s * 0.62);
            if (d > 1.3) continue;
            p.dot(x + px, y + py, d > 1 ? R[0] : v < 0 ? (u < 0 ? R[n - 1] : R[n - 2]) : u < 0 ? R[n - 3] : R[Math.max(1, n - 4)], a);
          }
      }
    }
  }
}

/** Lights that flare and die: add(x, y, r, color, k, life); update(dt); draw(p). */
class Lights {
  constructor() {
    this.list = [];
  }
  add(x, y, r, color, k, life) {
    this.list.push({ x, y, r, color: hex(color), k, life, max: life });
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1);
  }
  draw(p) {
    for (const l of this.list) {
      const k = l.life / l.max;
      p.glow(l.x, l.y, l.r * (0.55 + 0.45 * k), l.color, l.k * k * k);
    }
  }
}

/** A star glint: arms of length arm in color c with tips in tip, a white heart, light. */
function sparkle(p, x, y, arm, c, tip = c, k = 0.6) {
  const n = Math.round(arm);
  if (n < 1) return;
  const X = Math.floor(x), Y = Math.floor(y);
  for (let d = 1; d <= n; d++) {
    const cc = d > n * 0.6 ? tip : c;
    for (const [dx, dy] of CROSS) p.px(X + dx * d, Y + dy * d, cc);
  }
  if (n >= 3) for (const [dx, dy] of DIAG) p.px(X + dx, Y + dy, c);
  if (n >= 6) for (const [dx, dy] of DIAG) p.px(X + dx * 2, Y + dy * 2, tip);
  p.px(X, Y, WHITE);
  p.glow(x, y, 4 + n * 2, c, k);
}

/** An 8-ray flare: long rays on the axes, shorter between, fading out along their length. ramp dark to bright. */
function flare(p, x, y, L, k, ramp) {
  if (L < 1) return;
  const R = ramp.map(hex), n = R.length;
  for (let i = 0; i < 8; i++) {
    const an = (i * Math.PI) / 4, len = i % 4 === 0 ? L : i % 2 === 0 ? L * 0.6 : L * 0.3, ca = Math.cos(an), sa = Math.sin(an);
    for (let d = 0; d <= len; d += 0.5) {
      const u = d / len;
      p.dot(x + ca * d, y + sa * d, u < 0.35 ? WHITE : u < 0.7 ? R[n - 2] : R[n - 3], u < 0.6 ? 1 : k * 1.5 * (1 - u) + 0.2);
    }
  }
}

/**
 * A ring on a tilted plane (sy squashes it: 0.16 lies on the floor, 1 stands up), thickness th inward, alpha k,
 * colored by depth through the band with ramp (dark to bright). keep(angle) picks which part to draw, so the
 * far half can go behind things and the near half in front: (g) => Math.sin(g) < 0 is the far half.
 */
function band(p, cx, cy, r, sy, th, k, ramp, keep = () => true, hot = false) {
  if (r <= 0 || k <= 0) return;
  const R = ramp.map(hex), n = R.length;
  for (let j = 0, m = Math.ceil(r * TAU * 1.2); j < m; j++) {
    const ang = (j / m) * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
    if (!keep(ang)) continue;
    for (let o = th; o >= 0; o -= 0.5) {
      const u = o / th, c = u < 0.15 ? (hot ? WHITE : R[n - 1]) : u < 0.4 ? R[n - 2] : u < 0.7 ? R[n - 3] : R[n - 4];
      p.dot(cx + ca * (r - o), cy + sa * (r - o) * sy, c, k * (u < 0.4 ? 1.2 : 1.15 - u));
    }
  }
}

/**
 * A faceted crystal spike standing on (x, base), height h, base width w, leaning lean px at the tip, shaded in
 * ramp (dark to bright, 6+ steps): a lit ridge, a bright left face, a darker right face, a dark rim.
 * opts: { a (alpha), white (flash it white), glint (0..1 height of a sweeping highlight, or -1) }.
 */
function crystal(p, x, base, h, w, lean, ramp, opts = {}) {
  if (h < 1.5) return;
  const R = ramp.map(hex), n = R.length, C = (i) => R[Math.max(0, n - 1 - i)];
  const a = opts.a ?? 1, top = base - h, ridge0 = x - w * 0.14, glint = opts.glint ?? -1;
  const inside = (px, py) => {
    const u = (base - (py + 0.5)) / h;
    return u >= 0 && u <= 1 && Math.abs(px + 0.5 - (x + lean * u)) <= (w / 2) * (1 - u) + 0.35;
  };
  for (let py = Math.floor(top) - 1; py < Math.ceil(base); py++)
    for (let px = Math.floor(x - w / 2 - Math.abs(lean) - 2); px <= Math.ceil(x + w / 2 + Math.abs(lean) + 2); px++) {
      if (!inside(px, py)) {
        if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py + 1) || (inside(px, py - 1) && py < base - 1)) p.dot(px, py, R[0], a);
        continue;
      }
      if (opts.white) {
        p.dot(px, py, WHITE, a);
        continue;
      }
      const u = (base - (py + 0.5)) / h, rx = ridge0 + (x + lean - ridge0) * u, c = x + lean * u, hw = (w / 2) * (1 - u) + 0.35, fx = px + 0.5;
      let col = u > 0.9 ? WHITE : Math.abs(fx - rx) < 0.55 ? C(1)
        : fx < rx ? (fx - (c - hw) < 1 ? C(1) : (fx - (c - hw)) / Math.max(1, rx - (c - hw)) > 0.55 ? C(2) : C(3))
        : c + hw - fx < 1.2 ? C(Math.min(n - 2, 6)) : (fx - rx) / Math.max(1, c + hw - rx) > 0.5 ? C(5) : C(4);
      if (glint >= 0 && fx <= rx + 0.6) {
        const g = Math.abs(u - glint);
        if (g < 0.05) col = WHITE;
        else if (g < 0.1) col = C(1);
      }
      p.dot(px, py, col, a);
    }
}

__e.GRAVITY = GRAVITY; __e.FIRE_RAMP = FIRE_RAMP; __e.SMOKE_RAMP = SMOKE_RAMP; __e.P = P; __e.PF = PF; __e.Particles = Particles; __e.Blazes = Blazes; __e.B = B; __e.Bits = Bits; __e.Lights = Lights; __e.sparkle = sparkle; __e.flare = flare; __e.band = band; __e.crystal = crystal;
};

__M["core/shapes.js"] = function (__e) {
// Point lists for shapes effects keep reaching for: lightning paths, stars, polygons, trails.

const {TAU} = __req("core/math.js");

/**
 * A jagged lightning path from (x0, y0) to (x1, y1) by midpoint displacement. jag is how far a midpoint
 * may move sideways, as a share of the segment's length. Returns [[x, y], ...].
 */
function bolt(r, x0, y0, x1, y1, { jag = 0.22, depth = 5 } = {}) {
  let pts = [[x0, y0], [x1, y1]];
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      const off = (r.next() * 2 - 1) * jag * L;
      next.push([(ax + bx) / 2 + (-dy / (L || 1)) * off, (ay + by) / 2 + (dx / (L || 1)) * off], pts[i]);
    }
    pts = next;
  }
  return pts;
}

/** Forks off a bolt path: count branches, each up to len px long. Returns a list of paths. */
function forks(r, path, { count = 3, len = 20, jag = 0.3, spread = 0.9 } = {}) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const i = 1 + Math.floor(r.next() * (path.length - 2)), [x, y] = path[i], [px, py] = path[i - 1];
    const a = Math.atan2(y - py, x - px) + (r.next() < 0.5 ? -1 : 1) * spread * (0.4 + 0.6 * r.next());
    const l = len * (0.4 + 0.6 * r.next());
    out.push(bolt(r, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, { jag, depth: 3 }));
  }
  return out;
}

/** A star: n points between radii r1 (tips) and r0 (inner corners). */
function star(cx, cy, r0, r1, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, r = i % 2 ? r0 : r1;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

/** A regular polygon with n sides. */
function ngon(cx, cy, r, n = 6, rot = 0) {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos(rot + (i * TAU) / n) * r, cy + Math.sin(rot + (i * TAU) / n) * r]);
}

/** Positions of pos(t - i * dt) for i = 0..n-1: a moving thing's trail, newest first. */
function trail(pos, t, n, dt) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(pos(Math.max(0, t - i * dt)));
  return out;
}

__e.bolt = bolt; __e.forks = forks; __e.star = star; __e.ngon = ngon; __e.trail = trail;
};

__M["core/particles.js"] = function (__e) {
// Particles without a simulation: each one's position is a closed-form function of its age, so an effect
// can be drawn at any time t, scrubbed, looped and rendered to a sprite sheet frame by frame.

const {rng, clamp} = __req("core/math.js");

/**
 * Where a particle is after t seconds, launched from (x, y) at (vx, vy) px/s, under gravity g (px/s²,
 * positive is down) and linear drag (1/s). Returns [x, y].
 */
function fly(x, y, vx, vy, t, g = 0, drag = 0) {
  if (drag <= 0) return [x + vx * t, y + vy * t + 0.5 * g * t * t];
  const f = (1 - Math.exp(-drag * t)) / drag, vt = g / drag;
  return [x + vx * f, y + vt * t + (vy - vt) * f];
}
/** Its velocity at t, for streaks that point along the motion. Returns [vx, vy]. */
function flyV(vx, vy, t, g = 0, drag = 0) {
  if (drag <= 0) return [vx, vy + g * t];
  const e = Math.exp(-drag * t), vt = g / drag;
  return [vx * e, vt + (vy - vt) * e];
}

/**
 * n one-shot particles: fn(r, i) with a repeatable rng per particle (the same numbers every frame).
 */
function burst(n, seed, fn) {
  for (let i = 0; i < n; i++) fn(rng(seed, i), i);
}

/**
 * Particles that repeat every `period` seconds, for loops with no seam. Particle i is born at its own
 * phase in the period and lives `life` seconds (a number, or a function of an rng). For every live copy,
 * fn(age, life, r, i) is called; r is a fresh rng for particle i, the same each period.
 */
function cycle(t, period, count, seed, life, fn) {
  for (let i = 0; i < count; i++) {
    const g = rng(seed, i, 911);
    const born = g.next() * period;
    const L = typeof life === "function" ? life(g) : life;
    let age = (((t - born) % period) + period) % period;
    for (; age < L; age += period) fn(age, L, rng(seed, i), i);
  }
}

/**
 * Particles born at a steady rate between t0 and t1 (an emitter that stops): fn(age, life, r, i) for every
 * particle alive at t. rate is particles per second.
 */
function stream(t, t0, t1, rate, seed, life, fn) {
  const n = Math.floor((Math.min(t, t1) - t0) * rate);
  for (let i = 0; i <= n; i++) {
    const born = t0 + i / rate, g = rng(seed, i, 911), L = typeof life === "function" ? life(g) : life;
    const age = t - born;
    if (age >= 0 && age < L) fn(age, L, rng(seed, i), i);
  }
}

/** A simple simulated particle list, for effects that export create() and keep state. */
class Particles {
  constructor() {
    this.list = [];
  }
  /** p: { x, y, vx, vy, life, g?, drag?, ground?, bounce? } plus anything you want to draw with. */
  add(p) {
    p.age = 0;
    p.g ??= 0;
    p.drag ??= 0;
    this.list.push(p);
    return p;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if ((p.age += dt) >= p.life) {
        this.list.splice(i, 1);
        continue;
      }
      p.vx -= p.vx * p.drag * dt;
      p.vy += p.g * dt - p.vy * p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.ground !== undefined && p.y > p.ground) {
        p.y = p.ground;
        p.vy = -Math.abs(p.vy) * (p.bounce ?? 0.3);
        p.vx *= 0.7;
      }
    }
  }
  /** Life left, 1 at birth to 0 at death. */
  static k(p) {
    return clamp(1 - p.age / p.life);
  }
}

__e.fly = fly; __e.flyV = flyV; __e.burst = burst; __e.cycle = cycle; __e.stream = stream; __e.Particles = Particles;
};

__M["fx/explosions/implosion.js"] = function (__e) {
// The gathering streaks, the pulse rings and the release (cross flare, rings, light) are adapted from Sprite Fusion's
// open-source energy charge (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, WHITE, hex, mix} = __req("core/index.js");
const {cull} = __req("fx/explosions/_lib.js");

const meta = {
  name: "Implosion",
  desc: "Everything is sucked in: streaks and grit rush inward, rings contract and a dark sphere collapses onto a crushed white point; a beat of stillness, then a sharp pop.",
  tags: ["implosion", "energy", "magic", "collapse", "pop", "one-shot"],
  size: [208, 184],
  origin: [104, 92],
  duration: 1.65,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#0a0614", "#1c1236", "#3a2470", "#6a44c0", "#a080f0", "#d8c8ff", "#ffffff"], seed: 2 },
};

const SUCK = 0.8, STILL = 1.02, VOID = hex("#05040a");

function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, sparks: [C[6], C[5], C[4], C[3]] }), lights = new Lights();
  // grit pulled in: specks that spiral toward the middle, faster and faster
  const grit = Array.from({ length: 70 }, () => {
    const t0 = R.range(0, 0.4);
    return { a: R.range(0, TAU), d: R.range(40, 86), t0, T: R.range(0.3, SUCK - 0.04 - t0), spin: R.sign() * R.range(0.6, 1.6), c: R.pick([C[2], C[3], C[4], hex("#4a4458"), hex("#6e6880")]) };
  });
  const rays = Array.from({ length: 4 }, (_, i) => (i * TAU) / 4 + Math.PI / 4);
  let t = 0, popped = false;
  return {
    update(dt) {
      t += dt;
      if (t < SUCK - 0.26) {
        // streaks of light rushing in from all round, accelerating, more of them as it goes
        const k = t / SUCK;
        for (let n = 0; n < 1 + Math.floor(k * 4); n++) {
          if (!R.chance(0.9)) continue;
          const a = R.range(0, TAU), D = R.range(34, 82) * (1 - 0.3 * k), T = R.range(0.14, 0.24), v = (D * 3) / (Math.exp(3 * T) - 1);
          ps.spawn(P.STREAK, Math.cos(a) * D, Math.sin(a) * D, -Math.cos(a) * v, -Math.sin(a) * v, T, R.chance(0.5) ? C[5] : C[4]);
        }
        // vapour drawn in along the way
        if (R.chance(14 * dt)) {
          const a = R.range(0, TAU), D = R.range(50, 80);
          ps.spawn(P.VAPOUR, Math.cos(a) * D, Math.sin(a) * D, -Math.cos(a) * 90, -Math.sin(a) * 90, R.range(0.4, 0.6), C[3], R.range(3, 5));
        }
      }
      if (!popped && t >= STILL) {
        popped = true;
        lights.add(0, 0, 90, C[4], 1, 0.4);
        lights.add(0, 0, 30, WHITE, 0.9, 0.08);
        for (let i = 0; i < 34; i++) {
          const a = R.range(0, TAU), sp = R.range(120, 330);
          ps.spawn(R.chance(0.6) ? P.MOTE : P.STAR, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.45), R.pick([C[6], C[5], C[4]]), R.range(0.8, 1.8));
        }
      }
      ps.update(dt);
      cull(ps, -meta.origin[0] + 3, -meta.origin[1] + 3, meta.size[0] - meta.origin[0] - 3, meta.size[1] - meta.origin[1] - 3);
      lights.update(dt);
    },
    draw(p) {
      const k = clamp(t / SUCK);
      if (t < STILL) {
        // the void: a dark sphere edged with light, collapsing onto the core
        const vr = 64 * (1 - ease.inCubic(k)) + 3;
        if (k < 1) {
          p.disc(0, 0, vr, VOID, 0.35 + 0.35 * k);
          p.ring(0, 0, vr + 1, 1, k < 0.5 ? C[3] : C[4], 0.5 + 0.5 * k);
          p.glowRing(0, 0, vr, 5, C[4], 0.18 + 0.3 * k);
        }
        // rings pulled in after it, one after another, brighter as they go
        for (let i = 0; i < 4; i++) {
          const u = (t - i * 0.17) / 0.34;
          if (u <= 0 || u >= 1) continue;
          const r = (70 - i * 8) * (1 - ease.inQuad(u)) + 2;
          p.ring(0, 0, r, u > 0.7 ? 2 : 1, u > 0.6 ? C[5] : C[3], 0.4 + 0.6 * u);
        }
        // the grit, spiralling in
        for (const q of grit) {
          const u = (t - q.t0) / q.T;
          if (u <= 0 || u >= 1) continue;
          const d = q.d * (1 - ease.inCubic(u)), a = q.a + q.spin * ease.inQuad(u) * 2, x = Math.cos(a) * d, y = Math.sin(a) * d;
          const x2 = Math.cos(a - q.spin * 0.1) * (d + 4 * u * u + 0.5), y2 = Math.sin(a - q.spin * 0.1) * (d + 4 * u * u + 0.5);
          p.line(x2, y2, x, y, (v) => (v < 0.5 ? mix(q.c, VOID, 0.4) : q.c));
        }
        // the core: growing hotter as it's crushed, then a white point trembling in the stillness
        const still = t > SUCK, jit = still ? (Math.floor(t * 40) % 2 ? 0.5 : -0.5) : 0, cr = still ? 1.6 : 1 + 3.5 * (1 - k) * k * 4;
        p.disc(jit, 0, cr + 3.5, VOID, 0.85);
        p.circle(jit, 0, cr + 1.2, C[4]);
        p.circle(jit, 0, cr, WHITE);
        p.glow(0, 0, 10 + 26 * k, C[4], 0.3 + 0.5 * k);
        if (still) p.glow(0, 0, 8, WHITE, 0.4 + 0.2 * Math.sin(t * 60));
      } else {
        // the pop: a white point bursting, a cross flare, a fast thin ring and a slower one
        const q = (t - STILL) / 0.5, e = ease.outCubic(clamp(q));
        if (q < 0.08) p.circle(0, 0, 6 * (1 - q / 0.08) + 1, WHITE);
        if (q < 0.35) {
          const L = (1 - q / 0.35) * 34 + 3;
          for (const a of rays) for (let d = 0; d <= L; d += 0.5) p.dot(Math.cos(a) * d, Math.sin(a) * d, d < L * 0.4 ? WHITE : C[5], d < L * 0.7 ? 1 : 1 - (d / L - 0.7) / 0.3);
          for (const a of rays) for (let d = 0; d <= L * 0.45; d += 0.5) p.dot(Math.cos(a + Math.PI / 4) * d, Math.sin(a + Math.PI / 4) * d, C[5], 1 - d / (L * 0.45));
        }
        if (q < 1) {
          p.ring(0, 0, 4 + 74 * e, Math.max(1, 2.5 * (1 - q)), q < 0.2 ? WHITE : C[5], 1.15 - q);
          p.ring(0, 0, 2 + 40 * ease.outCubic(clamp(q * 1.4)), 1, C[4], 1 - q);
        }
        if (q < 0.6) sparkle(p, 0, 0, 5 * (1 - q / 0.6), WHITE, C[5], 0.6);
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/explosions/_lib.js"] = function (__e) {
// Shared by the explosions. Not an effect (the leading _ keeps the tools away).
// The fire balls, rocks and scorch are adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.

const {P, PF, clamp, smooth, rand, TAU, WHITE, hex, mix, scale, rgb} = __req("core/index.js");

const OUTLINE = hex("#1a1422"), SOOT = hex("#0d0a12"), SOOT2 = hex("#17121d");

/** Stone colors from one body color: a lit face, the body, a shaded face, and the dust it makes. */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
}

/** A 9-step fire ramp, white-hot down to smouldering (the shape of FIRE_RAMP), from an 8-step palette (dark to bright). */
const fireRamp = (F) => [F[7], F[6], F[5], F[4], F[3], F[2], F[1], mix(F[1], F[0], 0.5), F[0]];

/** One FIRE particle drawn in the fire ramp FR: a darker rim, a lit core, a tongue on top, a hot heart. */
function fireBall(p, q, FR) {
  const k = q.life / q.max, age = 1 - k, n = FR.length, x = q.x, y = q.y;
  const heat = Math.min(0.999, Math.pow(age, 0.62) + (q.seed % 1) * 0.1), idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
  const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = FR[idx];
  if (idx >= n - 2) return p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
  // the hottest puffs get a rim a step darker still, so a mass of them reads as separate balls
  p.circle(x, y, r, FR[Math.min(n - 1, idx + (idx <= 2 ? 3 : 2))]);
  p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, FR[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
}

/** A particle system's layer ("back" or "front") with its FIRE puffs in the fire ramp FR, so a palette recolors them. */
function drawPs(p, ps, layer, FR) {
  const all = ps.list, fires = [], rest = [];
  for (const q of all) (q.k === P.FIRE ? fires : rest).push(q);
  const back = layer === "back";
  if (!back) for (const q of fires) if (q.delay <= 0 && !(q.flag & PF.BACK)) fireBall(p, q, FR);
  ps.list = rest;
  ps.draw(p, layer);
  ps.list = all;
  if (back) for (const q of fires) if (q.delay <= 0 && q.flag & PF.BACK) fireBall(p, q, FR);
}

const LIFTS = new Set([P.SMOKE, P.DUST, P.FIRE, P.EMBER, P.VAPOUR]);
/**
 * An updraft column at x: smoke, dust, fire and embers below `top` and within w of the axis are carried up
 * (up px/s²) and squeezed toward it; near the floor (within `low` px) they're drawn in from as far as `reach`:
 * the afterwinds that feed a blast's column. k scales it all.
 */
function draft(ps, dt, { x = 0, top = -Infinity, w = 12, up = 150, squeeze = 4, pull = 0, low = 10, reach = 100, k = 1 }) {
  if (k <= 0) return;
  for (const q of ps.list) {
    if (q.delay > 0 || !LIFTS.has(q.k) || q.y < top) continue;
    const dx = q.x - x, ax = Math.abs(dx), u = ax / w;
    if (u < 1) {
      const f = (1 - u * u) * k;
      q.vy -= up * f * dt;
      q.vx -= dx * squeeze * f * dt;
    }
    if (pull && q.y > -low && ax > w * 0.4 && ax < reach) q.vx -= Math.sign(dx) * pull * k * (1 - ax / reach) * dt;
  }
}

/** Drop particles that leave the box (local px), so nothing is drawn past the canvas. */
function cull(ps, x0, y0, x1, y1) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) L.splice(i, 1);
  }
}

const SOFT = new Set([P.SMOKE, P.DUST, P.VAPOUR]);
/**
 * Soft particles (smoke, dust, vapour) fade out over w px as they near the sides x0, x1 and go before they reach
 * them; y1, a bottom edge, gets a thin w of 6 (keep things off it by design).
 */
function fadeEdges(ps, x0, x1, w = 30, y1 = Infinity) {
  const L = ps.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    if (!SOFT.has(q.k)) continue;
    const r = q.size * 1.65, e = Math.min((Math.min(q.x - x0, x1 - q.x) - r) / w, (y1 - q.y - r) / 6);
    if (e <= 0) L.splice(i, 1);
    else if (e < 1) q.life = Math.min(q.life, q.max * 0.42 * e);
  }
}

/** A soft pool of light, an ellipse rx by ry at (x, y): light falling on the floor (keep ry small, it's perspective). */
function pool(p, x, y, rx, ry, c, k) {
  if (k <= 0.004 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}

/** A translucent ellipse (blended, never dithered): c and a may be functions of d (0 centre .. 1 rim). */
function haze(p, x, y, rx, ry, c, a) {
  if (rx < 0.5 || ry < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function";
  p.each(x - rx, y - ry, x + rx, y + ry, (lx, ly, sx, sy) => {
    const dx = (lx - x) / rx, dy = (ly - y) / ry, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const d = Math.sqrt(d2);
    p.blendPx(sx, sy, fc ? c(d) : c, fa ? a(d) : a);
  });
}

/** Heat for a scorch, from a fire ramp (bright to dark) down to cinders. */
const heatRamp = (FR) => [...FR.slice(0, 8), mix(FR[8], SOOT, 0.3), mix(FR[8], SOOT, 0.65)];

/**
 * The floor under a blast: a burn that spreads out in a blink, glows white-hot and cools through the heat ramp
 * HR to soot over `cool` seconds; a few cracks hold their glow twice as long. rows deep, fade 0..1.
 */
function scorch(p, HR, t, rx0, cool, fade, rows = 3) {
  if (fade <= 0) return;
  const rx = rx0 * Math.min(1, t / 0.08), ry = rows + 1.5, n = HR.length;
  for (let y = 0; y < rows; y++)
    for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
      const dx = (x + 0.5) / rx, dy = (y + 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) continue;
      const k = rand(x * 31 + y, 3), T = Math.pow(clamp(1 - t / cool), 1.4) * (1.25 - d) - k * 0.35;
      const crack = k > 0.88 && d < 0.85 ? Math.pow(clamp(1 - t / (cool * 2)), 1.2) * (1.15 - d) * 0.8 : 0, H = Math.max(T, crack);
      if (H > 0.06) {
        const c = HR[Math.min(n - 1, Math.floor((1 - Math.min(1, H)) * (n - 1)))];
        p.dot(x, y, c, fade);
        if ((x & 3) === 0 || crack > T) p.glow(x + 0.5, y, 6, c, 0.18 * H * fade);
      } else p.dot(x, y, d < 0.5 ? SOOT : SOOT2, (d < 0.95 - k * 0.3 ? 1 : 1 - d) * fade);
    }
}

/**
 * A rock (a Bits CHUNK): a lit side, a shaded side and an outline, turning as it spins. b.heat (0..1) makes
 * it molten: its heart and shaded side glow through the fire ramp FR and it gives off light, cooling to stone.
 */
function rock(p, b, st, FR) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4, heat = b.heat ?? 0;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    out.a = fade;
    if (d > r) return OUTLINE;
    const lit = dx * lx + dy * ly;
    if (heat > 0.08) {
      const g = heat * (1.1 - d / (r + 0.5)) + (lit > 0.3 ? heat * 0.45 : 0);
      if (g > 0.5) return FR[g > 1 ? 1 : g > 0.8 ? 2 : g > 0.62 ? 3 : 4];
      if (g > 0.32) return FR[5];
    }
    return lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
  });
  if (heat > 0.05) p.glow(b.x, b.y, r * 2 + 3, FR[3], 0.32 * heat * fade);
}

/**
 * Light hugging the upper half of a circle of radius R at (x, y) (a dome's shock), falling off over width w.
 * box [x0, y0, x1, y1] (local) keeps it inside a canvas.
 */
function glowDome(p, x, y, R, w, c, k, box = [-Infinity, -Infinity, Infinity, Infinity]) {
  if (k <= 0.004 || w < 1) return;
  p.shade(Math.max(box[0], x - R - w), Math.max(box[1], y - R - w), Math.min(box[2], x + R + w), Math.min(box[3], y + 0.5), (px, py, out) => {
    const d = Math.abs(Math.hypot(px - x, py - y) - R) / w;
    if (d >= 1) return;
    out.l = c;
    out.k = (1 - d) * (1 - d) * k;
  });
}

/**
 * A burning thing's trail: pts [{ x, y, t }] (oldest first) at time t, drawn as a ribbon that is fire near the
 * head (fire ramp FR) and swells into thin smoke behind (smoke ramp SM, light to dark) over life seconds.
 */
function trail(p, pts, t, FR, SM, life = 0.5, w = 1, heat = 1) {
  let lx = NaN, ly = NaN;
  for (let i = pts.length - 1; i >= 0; i--) {
    const q = pts[i], age = (t - q.t) / life;
    if (age >= 1) break;
    if (Math.hypot(q.x - lx, q.y - ly) < 1.6) continue;
    lx = q.x;
    ly = q.y;
    const r = w * (0.7 + age * 2.6);
    if (age < 0.12 * heat) p.circle(q.x, q.y - age * 6, r * 0.8, FR[age < 0.05 ? 3 : 5]);
    else p.disc(q.x, q.y - age * 6, r, SM[Math.min(SM.length - 1, 1 + Math.floor(age * 3))], 0.55 * (1 - age));
  }
}

/**
 * Draw a particle system's GRIT as dirt in flight: fast bits stretch into short streaks (a darker tail, the bit at
 * the head), slow ones are the usual 1 or 2 px chips. The rest of the system draws as usual. layer as in draw.
 */
function drawDirt(p, ps, layer) {
  const all = ps.list, grit = [], rest = [];
  for (const q of all) (q.k === P.GRIT ? grit : rest).push(q);
  ps.list = rest;
  ps.draw(p, layer);
  ps.list = all;
  if (layer === "back") return;
  for (const q of grit) {
    if (q.delay > 0) continue;
    const k = q.life / q.max, sp = Math.hypot(q.vx, q.vy);
    if (k < 0.25 && k * 4 < 0.5) continue;
    if (sp > 140) {
      const L = Math.min(5, sp * 0.012), ux = q.vx / sp, uy = q.vy / sp;
      p.line(q.x - ux * L, q.y - uy * L, q.x, q.y, (u) => (u < 0.5 ? scale(q.col, 0.7) : q.col));
    } else {
      p.px(q.x, q.y, q.col);
      if (q.size >= 2) p.px(q.x + 1, q.y, q.col), p.px(q.x, q.y + 1, scale(q.col, 0.8)), p.px(q.x + 1, q.y + 1, scale(q.col, 0.7));
    }
  }
}

/**
 * A crater in the floor at x: a dark pit (an ellipse in perspective) with its far wall lit, dirt heaped in a lip on
 * either side, and loose earth scattered round it. E: an earth ramp (dark to bright, 5+ steps); r: half-width;
 * k: 0..1 how far it has opened; a: alpha (fade it out).
 */
function crater(p, E, x, r, k, a = 1) {
  if (k <= 0 || a <= 0) return;
  const n = E.length, rx = r * k, ry = Math.max(1.5, r * 0.17 * k);
  for (let py = -1; py <= Math.ceil(ry) + 1; py++)
    for (let px = Math.floor(-rx - 1); px <= Math.ceil(rx + 1); px++) {
      const dx = (px + 0.5) / rx, dy = (py + 0.5 - ry * 0.35) / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1.08) continue;
      // the pit: darkest at its far side under the lit rim, the near wall a step lighter
      const c = d > 0.92 ? (dy < 0 ? E[n - 2] : E[2]) : dy < -0.2 ? E[0] : dy < 0.35 ? E[1] : E[2];
      p.dot(x + px, py, c, a);
    }
  // the lip: dirt heaped up either side, lit on top, and a scatter of loose earth
  for (const s of [-1, 1])
    for (let i = 0; i < 9; i++) {
      const u = i / 8, h = Math.round(Math.sin(Math.PI * u) * 2.2 * k + (rand(i, s > 0 ? 3 : 4) < 0.4 ? 1 : 0) * k);
      const hx = x + s * (rx * 0.82 + u * r * 0.55);
      for (let j = 0; j <= h; j++) p.dot(hx, -j, j === h ? E[n - 2] : j === h - 1 ? E[3] : E[2], a);
    }
  for (let i = 0; i < 26; i++) {
    const s = rand(i, 7) < 0.5 ? -1 : 1, d = rx * (1.05 + rand(i, 8) * 1.4), y = Math.round(rand(i, 9) * 3) - 1;
    if (rand(i, 10) < k) p.dot(x + s * d, y, rand(i, 11) < 0.5 ? E[3] : E[2], a);
  }
}

/** A hemisphere of white-hot air on the floor at x, radius r: an orange rim, a hot body, a white core; k 1 → 0 as it dies. */
function dome(p, F, x, r, k) {
  const e = 1.4 / r;
  p.shade(x - r - 1.5, -r - 1.5, x + r + 1.5, 0.5, (px, py) => {
    const d = Math.hypot(px - x, py) / r;
    if (d > 1 + e) return;
    return d > 1 ? F[2] : d > 0.8 ? (k > 0.45 ? F[6] : F[5]) : d > 0.5 ? (k > 0.45 ? WHITE : F[6]) : k > 0.2 ? WHITE : F[6];
  });
}

/**
 * A lobe of a billowing cloud, shaded like a ball. The sky lights it from the top left through the smoke ramp SM
 * (light to dark); fire (0..1) burns in its heart in the fire ramp FR (bright to dark), shrinking toward the
 * middle as it cools, with a darker band and a dark orange-red seam at its edge so a mass of burning lobes reads
 * apart; glow (0..1) lights its underside from below in fire colors. a: opacity (smoke edges stay soft); z: -1 far
 * .. 1 near (the far side sits a step darker); dark shifts the smoke down the ramp. style 1 cel-shades the smoke:
 * a lit crescent on top, a mid tone, a dark underside the fire tints while it's hot.
 */
function lobe(p, x, y, r, FR, SM, fire, glow, a, z = 0, dark = 0, style = 0) {
  if (r < 0.7 || a <= 0.01) return;
  const n = FR.length, m = SM.length, back = z < -0.35 ? 1 : 0, rim = 1 - Math.min(0.35, 1.6 / r), seam = 1 - Math.min(0.3, 1.3 / r);
  // the soft edge: a step more see-through than the body, less of a step as the whole lobe thins (no bubble rims)
  const D = (i) => SM[Math.min(m - 1, i + back + dark)], soft = 0.55 + 0.4 * (1 - Math.min(1, a));
  const px = (lx, ly, sx, sy) => {
    const dx = (lx - x) / r, dy = (ly - y) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) return;
    const d = Math.sqrt(d2), nz = Math.sqrt(1 - d2), sky = -0.5 * dx - 0.66 * dy + 0.56 * nz;
    const v = fire * (1.32 - 0.78 * d) + 0.14 * sky * fire;
    let c, k = 0, solid = false;
    if (v > 0.44) {
      let i = Math.min(n - 3, Math.max(0, Math.floor((1.3 - v) * (n - 1) * 0.78)));
      if (d > seam) i = Math.min(6, Math.max(4, i + 2));
      else if (d > seam - 0.22) i = Math.min(n - 3, i + 1);
      c = FR[i];
      k = 0.05 * fire;
      solid = true;
    } else if (style) {
      const lam = -0.42 * dx - 0.78 * dy + 0.46 * nz;
      if (lam > 0.66 && d > 0.4) c = D(0);
      else if (lam > 0.16) c = D(1);
      else if (lam > -0.3) c = D(2);
      else {
        c = D(lam < -0.64 ? 4 : 3);
        const g = glow * (0.6 + 0.4 * dy);
        if (g > 0.55) (c = FR[g > 0.8 ? 5 : 6]), (k = 0.08 * g);
        else if (g > 0.34) c = mix(c, FR[6], 0.6);
        else if (g > 0.16) c = mix(c, FR[7], 0.45);
      }
    } else {
      const g = glow * (0.82 * dy + 0.3 * nz);
      if (g > 0.45) (c = FR[g > 0.66 ? 4 : 5]), (k = 0.1 * glow);
      else if (g > 0.3) c = FR[6];
      else if (g > 0.2) c = FR[7];
      else {
        const s = sky * 0.5 + 0.5;
        c = D(s > 0.8 ? 0 : s > 0.62 ? 1 : s > 0.42 ? 2 : s > 0.22 ? 3 : 4);
      }
    }
    p.blendPx(sx, sy, c, solid || d <= rim ? a : a * soft);
    if (k > 0) p.add(sx, sy, c, k);
  };
  if (p.sn !== 0 || p.cs !== 1) return p.each(x - r, y - r, x + r, y + r, px);
  // unrotated (the usual case): walk the screen pixels directly
  const ax = p.tx + (x - r) * p.fx, bx = p.tx + (x + r) * p.fx;
  const sx0 = Math.max(p.ox, Math.floor(Math.min(ax, bx))), sx1 = Math.min(p.ox + p.w - 1, Math.ceil(Math.max(ax, bx)));
  const sy0 = Math.max(p.oy, Math.floor(p.ty + y - r)), sy1 = Math.min(p.oy + p.h - 1, Math.ceil(p.ty + y + r));
  for (let sy = sy0; sy <= sy1; sy++) {
    const ly = sy + 0.5 - p.ty, q = (ly - y) / r;
    if (q * q >= 1) continue;
    // only the span of this row inside the circle
    const hw = r * Math.sqrt(1 - q * q), cx = p.tx + x * p.fx;
    for (let sx = Math.max(sx0, Math.floor(cx - hw - 0.5)), e = Math.min(sx1, Math.ceil(cx + hw)); sx <= e; sx++) px((sx + 0.5 - p.tx) * p.fx, ly, sx, sy);
  }
}

/**
 * A rolling fireball. n lobes ride a vortex ring that climbs (rise px, slowing with time constant tau, then
 * drifting up at drift px/s), swells (tube and ring radii grow with time constant grow) and rolls (up through
 * the middle, out over the top, down the outside, back in underneath), while it cools from white-hot fire
 * into smoke that glows from inside, then thins away. Seen from a little below: the near side sits lower.
 * update(dt); draw(p, FR (fire ramp, bright to dark), SM (smoke ramp, light to dark), { mid }) (mid() is drawn
 * between the far and near lobes: a stem going up into it); shape() its centre and radii; hot() how hot its heart
 * still is; ember() how strongly its inside still glows. Options for a nuclear cap: style 1 (cel-shaded lobes),
 * inner (a glow that lingers inside and draws back to the middle as it cools), hollow (the underside sits a step
 * darker), fray [t0, rate, t1] with onFray(x, y, r, ux, uy) (the rim sheds small puffs late on).
 */
class Plume {
  constructor(R, o = {}) {
    this.o = o = {
      x: 0, y: -20, rise: 100, tau: 1.2, drift: 4, tube: [8, 20], ring: [1, 18], grow: 0.9, n: 40, size: [5, 10], swell: 0.5,
      spin: 2.4, spinTau: 1.6, heat: 1.15, cool: 0.45, under: 0.5, tilt: 0.2, squash: 0.7, fade: [4, 6], glow: 1, spread: 10,
      style: 0, inner: false, hollow: false, fray: null, ...o,
    };
    this.R = R;
    this.t = 0;
    this.roll = 0;
    this.onFray = null;
    // spread over the ring evenly: the roll angle on a golden-ratio walk, the turn round the axis in order
    this.lobes = Array.from({ length: o.n }, (_, i) => ({
      th: TAU * ((i * 0.618034 + R.range(-0.08, 0.08)) % 1), ph: (TAU * (i + R.range(-0.35, 0.35))) / o.n,
      j: R.range(-0.55, 0.12), s: R.range(o.size[0], o.size[1]), h: R.range(-0.22, 0.08), dx: R.range(-1, 1), dy: R.range(-1, 0.4),
      f: R.range(-0.9, 0.5), gv: R.range(0.55, 1.15),
    }));
  }
  shape(t = this.t) {
    const o = this.o, u = Math.max(0, t), g = 1 - Math.exp(-u / o.grow);
    return { x: o.x, y: o.y - o.rise * (1 - Math.exp(-u / o.tau)) - o.drift * u, tube: o.tube[0] + (o.tube[1] - o.tube[0]) * g, ring: o.ring[0] + (o.ring[1] - o.ring[0]) * g, g };
  }
  hot(t = this.t) {
    return clamp(this.o.heat - this.o.cool * t + 0.3);
  }
  /** How strongly the inside still glows (0..1), lingering well after the fire has gone. */
  ember(t = this.t) {
    return clamp((this.o.heat - this.o.cool * t + 1) / 1.1);
  }
  // where every lobe is at time t
  lobesAt(t) {
    const o = this.o, S = this.shape(t), base = o.heat - o.cool * t, span = S.ring + S.tube || 1, list = [];
    for (const q of this.lobes) {
      const fade = 1 - smooth(o.fade[0] + q.f, o.fade[1] + q.f * 0.5, t), loose = Math.pow(smooth(o.fade[0] - 1.8 + q.f, o.fade[1], t), 1.5) * o.spread;
      if (fade <= 0) continue;
      const th = q.th - this.roll, rt = S.tube * (1 + q.j), rho = S.ring + rt * Math.cos(th), up = Math.sin(th);
      const X = rho * Math.cos(q.ph), Z = rho * Math.sin(q.ph);
      // the outside cools first; the underside keeps its heat, fed from below
      const heat = base + q.h - 0.18 * Math.max(0, Math.cos(th)) * clamp(t * 2) + o.under * Math.max(0, -up) * clamp(base + 0.6);
      const r = q.s * (0.5 + 0.5 * S.g) * (1 + o.swell * clamp(1 - heat)) * (1 + 0.35 * (1 - fade));
      list.push({ x: S.x + X + q.dx * loose, y: S.y - rt * up * o.squash + Z * o.tilt + q.dy * loose, z: Z / span, up, out: Math.cos(th), heat, q, fade, r, d: Math.hypot(X, Z) / span, c: 1 - Math.min(1, Math.abs(X) / span) });
    }
    return list.sort((a, b) => a.z - b.z);
  }
  update(dt) {
    const o = this.o;
    this.t += dt;
    this.roll += o.spin * (0.12 + 0.88 * Math.exp(-this.t / o.spinTau)) * dt;
    // late on, the rim frays: lobes on the outside shed small puffs that drift off and thin
    if (o.fray && this.onFray && this.t > o.fray[0] && this.t < (o.fray[2] ?? Infinity)) {
      const S = this.shape(), k = o.fray[1] * dt * smooth(o.fray[0], o.fray[0] + 1, this.t);
      for (const e of this.lobesAt(this.t)) {
        if (e.out < 0.2 || !this.R.chance(k * e.fade)) continue;
        const ux = e.x - S.x, uy = e.y - S.y, l = Math.hypot(ux, uy) || 1;
        this.onFray(e.x + (ux / l) * e.r * 0.6, e.y + (uy / l) * e.r * 0.6, e.r, ux / l, uy / l);
      }
    }
  }
  draw(p, FR, SM, { mid } = {}) {
    const o = this.o, t = this.t;
    if (t >= o.fade[1] + 0.5) return;
    const S = this.shape(t), base = o.heat - o.cool * t, span = S.ring + S.tube || 1, list = this.lobesAt(t), age = clamp(t / o.fade[1]);
    const E = this.ember(t), reach = 0.3 + 1.15 * E;
    let drawn = false;
    for (const e of list) {
      if (!drawn && e.z >= 0 && mid) (drawn = true), mid();
      const h = e.heat, fade = e.fade, fire = clamp((h - 0.2) / 0.75);
      // the glow from inside: strongest under the middle, uneven from lobe to lobe; with inner, it draws back to the
      // middle as the cap cools
      const glow = o.inner
        ? E * clamp((reach - e.d) / 0.45) * (0.45 + 0.55 * Math.max(0, -e.up)) * e.q.gv * o.glow
        : clamp((base + 0.45) / 0.85) * o.glow * (0.4 + 0.35 * Math.max(0, -e.up) + 0.4 * e.c) * e.q.gv;
      lobe(p, e.x, e.y, e.r, FR, SM, fire, glow, fade * (0.82 + 0.18 * fire), e.z, (age > 0.72 ? 1 : 0) + (o.hollow && e.up < -0.35 ? 1 : 0), o.style);
      if (fire > 0.25) p.glow(e.x, e.y, e.r * 1.25 + 2, FR[2], 0.07 * fire);
    }
    if (!drawn && mid) mid();
    const hot = this.hot(t);
    if (hot > 0) p.glow(S.x, S.y, span * 1.8 + 14, FR[3], 0.32 * hot * o.glow);
    if (o.inner && E > 0.05) p.glow(S.x, S.y + S.tube * 0.3, span * (0.5 + 0.7 * E) + 8, FR[4], 0.22 * E * E);
  }
}

/**
 * A rising column: lobes boil up a stem from the floor into whatever sits on top, wide at the foot, swaying,
 * cooling from fire to smoke and dust. update(dt, top, feed): top is the y the stem rises to, feed 0..1 how
 * strongly it's still being fed (new lobes stop when it's 0, and the stem breaks up from the bottom).
 * draw(p, FR, SM, fire (0..1 heat at the foot), glow (0..1 under-light)).
 */
class Column {
  constructor(R, o = {}) {
    this.R = R;
    this.o = o = { w: 7, foot: 16, speed: 70, size: [5, 8], n: 18, sway: 2.5, fade: 0.5, style: 0, ...o };
    this.t = 0;
    this.lobes = [];
    this.acc = 0;
  }
  spawn(y) {
    const R = this.R, o = this.o;
    this.lobes.push({ y, x: R.range(-1, 1), s: R.range(o.size[0], o.size[1]), ph: R.range(0, TAU), a: 0, v: R.range(0.8, 1.2) });
  }
  update(dt, top, feed) {
    const o = this.o, L = Math.max(10, -top);
    this.t += dt;
    if (feed > 0) for (this.acc += dt * feed * o.n * (o.speed / L); this.acc > 1; this.acc--) this.spawn(-1);
    for (let i = this.lobes.length - 1; i >= 0; i--) {
      const b = this.lobes[i], u = clamp(-b.y / L);
      b.y -= o.speed * b.v * (0.45 + 0.55 * Math.min(1, -b.y / 24)) * dt;
      b.a = Math.min(1, b.a + dt * 4);
      if (b.y < top || (feed <= 0 && (b.a -= dt * (2 - u)) <= 0)) this.lobes.splice(i, 1);
    }
  }
  draw(p, top, FR, SM, fire, glow) {
    const o = this.o, L = Math.max(10, -top);
    // draw from the top down so the foot sits in front
    const list = [...this.lobes].sort((a, b) => a.y - b.y);
    for (const b of list) {
      const u = clamp(-b.y / L), foot = Math.pow(1 - u, 4), w = o.w + o.foot * foot;
      const x = b.x * w * 0.45 + Math.sin(this.t * 1.7 + b.ph + u * 3) * o.sway * u;
      const r = b.s * (0.75 + 0.5 * foot + 0.35 * u) * Math.min(1, b.a * 1.5);
      const end = 1 - smooth(0.85, 1, u);
      lobe(p, x, b.y - r * 0.3 * foot, r, FR, SM, clamp(fire * (1.1 - u * 0.9)), glow * smooth(0.55, 1, u), Math.min(1, b.a) * end * 0.9, 0, u > 0.5 ? 0 : 1, o.style);
    }
  }
}

__e.OUTLINE = OUTLINE; __e.stone = stone; __e.fireRamp = fireRamp; __e.fireBall = fireBall; __e.drawPs = drawPs; __e.draft = draft; __e.cull = cull; __e.fadeEdges = fadeEdges; __e.pool = pool; __e.haze = haze; __e.heatRamp = heatRamp; __e.scorch = scorch; __e.rock = rock; __e.glowDome = glowDome; __e.trail = trail; __e.drawDirt = drawDirt; __e.crater = crater; __e.dome = dome; __e.lobe = lobe; __e.Plume = Plume; __e.Column = Column;
};

__M["fx/ice/ice-spikes.js"] = function (__e) {
// The eruption recipe (a frost line racing ahead, each spike punching up white with a spray of shards, a puff
// and a glint, the floor frosting behind) is adapted from Sprite Fusion's open-source ice
// (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, B, Rng, fit, sparkle, clamp, smooth, seg, ease, rand, TAU, WHITE} = __req("core/index.js");
const {Panes, endBy, blade, splitPoly} = __req("fx/ice/_lib.js");

const meta = {
  name: "Ice spikes",
  desc: "A frost line races along the floor and clusters of jagged ice blades burst up behind it in a rising wave, glint, flash white together and shatter into toppling shards.",
  tags: ["ice", "spikes", "ground", "wave", "directional", "magic", "one-shot"],
  size: [264, 112],
  origin: [24, 96],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], reach: 172, height: 56, seed: 3 },
};

const START = 0.04, RUN = 0.44; // the frost line runs out
const SHIMMER = 0.74; // a glint runs down the line
const TREMBLE = 1.2, FLASH = 1.36, SHATTER = 1.42; // they shiver, flash white together and break
const MELT = 1.75; // the frost goes, oldest first

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), REACH = o.reach, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const splinter = (x, y, vx, n) => {
    for (let i = 0; i < n; i++) bits.add({ kind: B.SHARD, x: x + R.range(-2, 2), y: y - 1, vx: vx * 0.5 + R.range(-45, 45), vy: -R.range(30, 100), g: 0.8, drag: 0.6, bounce: 0.35, life: R.range(0.4, 0.75), a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(1.2, 2.4), c: C[R.int(4, 7)] });
  };
  const panes = new Panes({
    ground: floor,
    onCrumble: (q) => {
      splinter(q.x, 0, 0, 3);
      ps.spawn(P.VAPOUR, q.x, -1, R.range(-12, 12), -R.range(2, 8), R.range(0.4, 0.7), C[6], R.range(1.4, 2.2));
    },
    onLand: (q, x, y, v) => {
      if (v < 110) return;
      ps.spawn(P.VAPOUR, x, y - 1, R.range(-20, 20), -R.range(2, 8), R.range(0.4, 0.7), C[6], R.range(1.4, 2.4));
      splinter(x, y, q.vx, 3);
      if (R.chance(0.3)) ps.spawn(P.STAR, x, y - 2, 0, -5, R.range(0.2, 0.4), WHITE, R.range(0.8, 1.6));
    },
  });
  const front = (t) => REACH * (1 - Math.pow(1 - seg(t, START, START + RUN), 1.7));
  const reachedAt = (x) => START + RUN * (1 - Math.pow(1 - clamp(x / REACH), 1 / 1.7));

  // clusters along the line: a main blade leaning into the wave and two to four splayed round it, heights
  // swelling to a crest past the middle and falling off at the end
  const env = (q) => 0.28 + 0.72 * Math.exp(-(((q - 0.64) / 0.3) ** 2));
  const clusters = [];
  for (let x = 10; x < REACH - 2; x += R.range(20, 26)) {
    const q = x / REACH, H = o.height * env(q) * R.range(0.88, 1.06), W = clamp(H * 0.36, 5, 14), lean = H * R.range(0.2, 0.34);
    // a big blade leaning into the wave, a smaller one behind it leaning further, a stub in front of its foot
    const list = [
      { dx: W * R.range(0.35, 0.6), h: H * R.range(0.5, 0.7), w: W * 0.7, lean: H * R.range(0.4, 0.6), back: true, delay: R.range(0.02, 0.05), jag: R.chance(0.5) ? R.range(0.35, 0.6) : -1 },
      { dx: 0, h: H, w: W, lean, back: false, delay: 0, jag: R.chance(0.7) ? R.range(0.32, 0.58) : -1, main: true },
    ];
    if (H > 14) list.push({ dx: -W * R.range(0.35, 0.55), h: H * R.range(0.24, 0.4), w: W * 0.55, lean: -H * R.range(0, 0.12), back: false, delay: R.range(0.03, 0.07), jag: -1 });
    clusters.push({ x, q, H, W, blades: list, main: list[1], t0: reachedAt(x) + 0.012, up: false });
  }
  const crest = clusters.reduce((a, c) => (c.H > a.H ? c : a), clusters[0]);
  let t = 0, broke = false, trembled = false;

  // a blade's base, tip and look right now
  const pose = (c, b) => {
    const g = ease.outBack(clamp((t - c.t0 - b.delay) / 0.09), 2.2), x = c.x + b.dx;
    return { g, x, tx: x + b.lean * g, ty: -b.h * g, white: t - c.t0 - b.delay < 0.03 || (t >= FLASH && t < SHATTER) };
  };
  const drawClusters = (p) => {
    if (t >= SHATTER) return;
    for (const pass of [0, 1, 2])
      for (const c of clusters) {
        if (t < c.t0) continue;
        const jx = t >= TREMBLE && t < FLASH ? ((Math.floor(t * 40) + Math.round(c.x)) % 2 ? 1 : 0) : 0;
        for (const b of c.blades) {
          if ((pass === 0) !== b.back || (pass === 1) !== !!b.main) continue;
          const s = pose(c, b);
          if (s.g <= 0) continue;
          const gl = (t - SHIMMER - c.q * 0.34) / 0.2;
          blade(p, s.x + jx, 0, s.tx + jx, s.ty, b.w, C, { white: s.white, jag: b.jag, dim: b.back ? 1 : 0, glint: gl >= 0 && gl <= 1 ? gl : -1 });
        }
        if (pass === 2) {
          // light: a pop at the base as it bursts, a cold glow up its length while it stands
          const pop = clamp(1 - (t - c.t0) / 0.15), wh = t >= FLASH;
          p.glow(c.x + c.main.lean * 0.4, -c.H * 0.45, c.H * 0.9 + 10, C[4], (0.16 + 0.42 * pop + (wh ? 0.4 : 0)) * (0.85 + 0.15 * Math.sin(t * 3 + c.x)));
          if (pop > 0) p.glow(c.x, -2, 14, WHITE, 0.55 * pop);
        }
      }
  };

  // the frosted floor: a crust with rime tufts, a bloom under the surface, a white-hot head while it runs
  const drawFrost = (p) => {
    const fr = front(t);
    for (let x = -3; x <= Math.min(fr, REACH + 6); x++) {
      const q = clamp(x / REACH), age = t - reachedAt(Math.max(0, x)), a = 1 - smooth(MELT + q * 0.35, MELT + q * 0.35 + 0.6, t);
      if (a <= 0 || age < 0) continue;
      const h = rand(x, 17), grow = smooth(0, 0.3, age), head = fr - x < 3 && fr < REACH;
      p.dot(x, 0, head || age < 0.06 || h < 0.3 ? WHITE : C[6], a);
      const L = h < 0.45 ? Math.round(grow * (1 + rand(x, 5) * 2.6)) : 0;
      for (let j = 1; j <= L; j++) p.dot(x, -j, j === L ? WHITE : C[5], a);
      if (L > 1 && rand(x, 9) < 0.5) p.dot(x + 1, -L + 1, C[6], a);
      const D = grow * (2 + rand(x, 11) * 4) * (1 - q * 0.3);
      for (let j = 1; j <= D; j++) p.dot(x, j, rand(x * 31 + j, 7) < 0.06 ? WHITE : j < 2 ? C[5] : j < 4 ? C[4] : C[3], a * (1.1 - j / (D + 1)));
      if (head) p.dot(x, -1, WHITE);
    }
    if (fr < REACH && t > START) {
      p.glow(fr, -2, 16, C[6], 0.6);
      p.glow(fr, -1, 7, WHITE, 0.6);
    }
  };

  const breakBlade = (c, b) => {
    const s = pose(c, b), ax = s.tx - s.x, ay = s.ty, L = Math.hypot(ax, ay) || 1, nx = -ay / L, ny = ax / L, hw = b.w / 2;
    const tri = [[s.x - nx * hw, -ny * hw], [s.tx, s.ty], [s.x + nx * hw, ny * hw]];
    const ang = Math.atan2(ay, ax) + Math.PI / 2;
    let parts = [tri];
    if (b.h > 9) parts = parts.flatMap((poly) => splitPoly(poly, s.x + ax * 0.4, ay * 0.4, ang));
    if (b.h > 22) parts = parts.flatMap((poly) => (poly.some(([, y]) => y < ay * 0.5) ? splitPoly(poly, s.x + ax * 0.72, ay * 0.72, ang) : [poly]));
    for (const part of parts) {
      let mx = 0, my = 0;
      for (const [x, y] of part) (mx += x), (my += y);
      (mx /= part.length), (my /= part.length);
      const up = clamp(-my / 40);
      panes.add({
        pts: part.map(([x, y]) => [x - mx, y - my]), x: mx, y: my, vx: R.range(-25, 60), vy: -R.range(40, 130) * (0.5 + up), a: 0, va: R.range(-8, 8), f: R.range(-0.7, 0.7), vf: R.range(-6, 6),
        lit: b.back ? 0.45 : 0.75, g: 0.9, drag: 0.6, bounce: 0.3, solid: true, ridge: Math.atan2(ay, ax), brittle: b.h > 30 ? 2 : 1, crumble: R.range(0.12, 0.4), life: R.range(1, 1.4),
      });
    }
    for (let i = 0; i < 2 + b.h / 7; i++) {
      const u = R.next();
      bits.add({ kind: R.chance(0.15) ? B.CHUNK : B.SHARD, x: s.x + ax * u + R.range(-1.5, 1.5), y: ay * u, vx: R.range(-60, 90), vy: -R.range(60, 230), g: 0.9, drag: 0.6, bounce: 0.3, life: R.range(0.7, 1.3), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(1.2, 3.2), c: C[R.int(4, 7)], ramp: [C[1], C[3], C[4], C[6], C[7]] });
    }
  };

  return {
    update(dt) {
      t += dt;
      // the cast: a puff and a spray where the line starts
      if (t - dt <= START && t > START) {
        for (let i = 0; i < 4; i++) ps.spawn(P.VAPOUR, R.range(0, 6), -R.range(0, 3), R.range(10, 60), -R.range(2, 12), R.range(0.4, 0.7), C[6], R.range(2, 3.2));
        lights.add(4, -4, 26, C[5], 0.6, 0.25);
      }
      // the running front throws frost: streaks along the floor, motes, vapour
      const fr = front(t);
      if (t > START && fr < REACH - 1) {
        if (R.chance(0.5)) ps.spawn(P.STREAK, fr - R.range(4, 12), -R.range(1, 3), R.range(40, 80), -R.range(0, 6), R.range(0.08, 0.14), R.chance(0.5) ? C[6] : WHITE);
        if (R.chance(0.3)) ps.spawn(P.FLAKE, fr, -1, R.range(10, 50), -R.range(20, 70), R.range(0.5, 0.9), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.2));
        if (R.chance(0.12)) ps.spawn(P.VAPOUR, fr, -R.range(0, 3), R.range(20, 60), -R.range(2, 10), R.range(0.4, 0.7), C[6], R.range(1.6, 2.8));
      }
      for (const c of clusters) {
        if (c.up || t < c.t0) continue;
        c.up = true;
        // each cluster bursts up: shards sprayed forward, a puff, motes, a glint at the tip once it stands
        const big = c === crest, n = 3 + Math.round(c.H / 8);
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + R.range(-1.1, 1.0), sp = R.range(60, 190) * (0.45 + c.H / 44);
          bits.add({ kind: B.SHARD, x: c.x + R.range(-3, 3), y: -1, vx: Math.cos(a) * sp + 25, vy: Math.sin(a) * sp, g: 0.8, drag: 0.6, bounce: 0.3, life: R.range(0.6, 1.1), a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(1.2, 3), c: C[R.int(5, 7)] });
        }
        ps.spawn(P.VAPOUR, c.x, -1, R.range(-10, 40), -R.range(2, 10), R.range(0.5, 0.9), C[6], R.range(2.2, 3.4) * (0.6 + c.H / 60));
        for (let i = 0; i < 2; i++) ps.spawn(P.FLAKE, c.x + R.range(-4, 4), -R.range(2, c.H * 0.5), R.range(-20, 40), -R.range(20, 60), R.range(0.6, 1.1), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.3));
        if (c.H > 16) ps.spawn(P.STAR, c.x + c.main.lean, -c.H * 0.96, 0, -4, R.range(0.3, 0.5), WHITE, R.range(1.4, 2.6), 0.08);
        lights.add(c.x, -c.H * 0.4, 16 + c.H * 0.6, C[5], 0.5, 0.18);
        if (big) {
          lights.add(c.x, -c.H * 0.5, 54, WHITE, 0.5, 0.14);
          for (let i = 0; i < 4; i++) ps.spawn(P.VAPOUR, c.x + R.range(-6, 6), -R.range(0, 4), R.range(-40, 60), -R.range(4, 16), R.range(0.6, 1), C[6], R.range(3, 4.5));
        }
      }
      // while they stand: glints wink on the blades
      if (t > START + RUN && t < TREMBLE && R.chance(0.09)) {
        const c = R.pick(clusters), b = R.pick(c.blades), s = pose(c, b), u = R.range(0.3, 0.95);
        ps.spawn(P.STAR, s.x + (s.tx - s.x) * u, s.ty * u, 0, -3, R.range(0.25, 0.5), R.chance(0.6) ? WHITE : C[6], R.range(0.6, 2));
      }
      // they shiver: chips fall
      if (!trembled && t >= TREMBLE) {
        trembled = true;
        for (const c of clusters)
          for (let i = 0; i < 2; i++) bits.add({ kind: B.SHARD, x: c.x + R.range(-4, 4), y: -R.range(4, c.H * 0.8), vx: R.range(-20, 20), vy: -R.range(0, 30), g: 0.8, drag: 0.5, bounce: 0.3, life: R.range(0.3, 0.6), a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(1, 1.8), c: C[R.int(5, 7)] });
      }
      if (!broke && t >= SHATTER) {
        broke = true;
        // all at once: every blade breaks into toppling pieces, splinters and ice dust, light along the line
        for (const c of clusters) {
          for (const b of c.blades) breakBlade(c, b);
          for (let i = 0; i < 2; i++) ps.spawn(P.VAPOUR, c.x + R.range(-6, 6), -R.range(1, 8), R.range(-30, 50), -R.range(4, 18), R.range(0.6, 1.1), C[6], R.range(2.4, 4) * (0.7 + c.H / 60));
          if (R.chance(0.7)) ps.spawn(P.STAR, c.x + R.range(-6, 6), -R.range(4, c.H), R.range(-10, 10), -R.range(6, 20), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(1, 2.2));
          for (let i = 0; i < 2; i++) ps.spawn(P.FLAKE, c.x + R.range(-6, 6), -R.range(4, c.H), R.range(-30, 60), -R.range(30, 90), R.range(0.9, 1.5), R.chance(0.6) ? WHITE : C[6], R.range(0.5, 1.5));
          lights.add(c.x, -c.H * 0.5, 22 + c.H, WHITE, 0.45, 0.12);
        }
        for (let i = 0; i < 5; i++) lights.add((REACH * (i + 0.5)) / 5, -18, 40, C[4], 0.4, 0.5);
      }
      // the shatter's dust settles; glints on the debris
      if (broke && t < SHATTER + 0.8 && R.chance(0.1) && bits.list.length) {
        const b = R.pick(bits.list);
        ps.spawn(P.STAR, b.x, b.y - 1, 0, -3, R.range(0.2, 0.4), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.5));
      }
      ps.update(dt);
      bits.update(dt);
      panes.update(dt);
      lights.update(dt);
      endBy(t, meta.duration, ps, bits, panes);
    },
    drawBack(p) {
      drawFrost(p);
      ps.draw(p, "back");
    },
    draw(p) {
      drawClusters(p);
      // the cold light the frosted floor gives off
      const k = (1 - smooth(MELT, MELT + 0.9, t)) * smooth(START, START + 0.3, t), fr = front(t);
      for (let i = 0; i < 6; i++) p.glow((fr * (i + 0.5)) / 6, -3, 26, C[4], 0.15 * k);
      if (t >= FLASH && t < SHATTER + 0.1) for (const c of clusters) sparkle(p, c.x + c.main.lean, -c.H, 6 * (1 - clamp((t - FLASH) / 0.16)), C[6], C[4], 0.4);
      panes.draw(p, C);
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/ice/_lib.js"] = function (__e) {
// Shared by the ice effects: panes of ice that tumble and skid, polygon helpers, a character turned to ice,
// cracks that race through a shape. Files starting with _ are helpers, not effects.
// The crack walk and the faceted crystal shading are adapted from Sprite Fusion's open-source ice
// (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.

const {GRAVITY, clamp, luma, TAU, WHITE} = __req("core/index.js");

/** Is (x, y) inside the polygon pts [[x, y], ...]? (even-odd rule) */
function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** A polygon's centroid and area: { x, y, area }. */
function centroid(pts) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [x0, y0] = pts[j], [x1, y1] = pts[i], k = x0 * y1 - x1 * y0;
    a += k;
    cx += (x0 + x1) * k;
    cy += (y0 + y1) * k;
  }
  if (Math.abs(a) < 1e-6) {
    const n = pts.length;
    return { x: pts.reduce((s, q) => s + q[0], 0) / n, y: pts.reduce((s, q) => s + q[1], 0) / n, area: 0 };
  }
  return { x: cx / (3 * a), y: cy / (3 * a), area: Math.abs(a) / 2 };
}

/** Cut a polygon along the line through (x, y) at angle a: the pieces with three corners or more. */
function splitPoly(pts, x, y, a) {
  const nx = -Math.sin(a), ny = Math.cos(a), side = (q) => (q[0] - x) * nx + (q[1] - y) * ny, L = [], Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q);
    (sp >= 0 ? L : Rt).push(p);
    if (sp >= 0 !== sq >= 0) {
      const u = sp / (sp - sq), m = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      L.push(m);
      Rt.push(m);
    }
  }
  return [L, Rt].filter((s) => s.length >= 3);
}

/** A color turned to ice: its brightness picks a step of the ice ramp C (dark to bright), never the darkest. */
function iceOf(c, C) {
  const n = C.length, l = luma(c);
  return C[clamp(Math.round(((l < 0.12 ? 2 : 2 + l * 5.2) * (n - 1)) / 7), 1, n - 1)];
}

/** Fill a polygon with translucent color (true blending, no dither): glass, ice, light. */
function glassPoly(p, pts, c, a) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (inPoly(pts, x + 0.5, y + 0.5)) p.blend(x, y, c, a);
}

/**
 * Panes of ice: flat polygons that fly, spin and tumble end over end (they squash as they turn edge-on and
 * flash as they square up to the light), bounce on the floor, skid, settle and fade. Drawn as glass: a
 * translucent face, edges lit where they face the light, a glint.
 * add({ pts (corners around 0, 0), x, y, vx, vy, a (turn), va, f (tumble), vf, lit (0..1: how much light its
 * face catches), g, drag, bounce, life, brittle (breaks on that many hard landings), crumble (seconds it lies
 * still before it crumbles), solid (opaque: one `tone` 0..1, or shaded like a blade split along `ridge`, an angle) });
 * update(dt); draw(p, C)
 * with an ice ramp, dark to bright. onLand(q, x, y, speed) when one hits the floor hard, onCrumble(q) when one
 * that lay still crumbles away, onSkid(q, x, y) while one slides along the floor.
 */
class Panes {
  constructor(opts = {}) {
    this.list = [];
    this.ground = opts.ground ?? (() => Infinity);
    this.onLand = opts.onLand ?? null;
    this.onCrumble = opts.onCrumble ?? null;
    this.onSkid = opts.onSkid ?? null;
  }
  add(q) {
    const life = q.life ?? 1;
    this.list.push({ vx: 0, vy: 0, a: 0, va: 0, f: 0, vf: 0, lit: 0.6, g: 1, drag: 0.3, bounce: 0.35, rest: false, brittle: false, ...q, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  /** The pane's corners as drawn: tumbled (squashed across its own width), turned and placed. */
  corners(q) {
    const ca = Math.cos(q.a), sa = Math.sin(q.a), k = Math.cos(q.f);
    return q.pts.map(([x, y]) => {
      const yy = y * k;
      return [q.x + x * ca - yy * sa, q.y + x * sa + yy * ca];
    });
  }
  seat(q) {
    let low = -Infinity;
    for (const c of this.corners(q)) low = Math.max(low, c[1]);
    return low;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      if ((q.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const floor = this.ground(q.x) - 0.5;
      if (q.rest && q.crumble !== undefined && (q.restT = (q.restT ?? 0) + dt) > q.crumble) {
        this.onCrumble?.(q);
        this.list.splice(i, 1);
        continue;
      }
      if (q.rest) {
        // skidding: friction slows the slide and the spin, the pane stays seated on the floor
        if (Math.abs(q.vx) > 8) this.onSkid?.(q, q.x, floor + 0.5);
        q.x += q.vx * dt;
        q.vx -= q.vx * 7 * dt;
        q.a += q.va * dt;
        q.va -= q.va * 9 * dt;
        q.vf -= q.vf * 9 * dt;
        q.f += q.vf * dt;
        q.y -= this.seat(q) - floor;
        continue;
      }
      q.vy += GRAVITY * q.g * dt;
      q.vx -= q.vx * q.drag * dt;
      q.vy -= q.vy * q.drag * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.a += q.va * dt;
      q.f += q.vf * dt;
      const low = this.seat(q);
      if (q.g <= 0 || low < floor || q.vy <= 0) continue;
      q.y -= low - floor;
      if (q.vy > 70) (q.hits = (q.hits ?? 0) + 1), this.onLand?.(q, q.x, floor + 0.5, q.vy);
      if (q.brittle && q.vy > 70 && q.hits >= q.brittle) {
        this.list.splice(i, 1);
        continue;
      }
      if (q.vy > 70 && q.bounce > 0) {
        q.vy = -q.vy * q.bounce;
        q.vx *= 0.75;
        q.va *= 0.6;
        q.vf *= 0.5;
      } else {
        q.rest = true;
        q.vy = 0;
      }
    }
  }
  draw(p, C) {
    const n = C.length;
    for (const q of this.list) {
      const a = Math.min(1, q.life / 0.35), pts = this.corners(q), k = Math.cos(q.f), face = Math.abs(k);
      // the face: glassy, brighter the more it faces us and the more light it catches; it flashes as it squares up
      const lv = q.lit * (0.35 + 0.65 * face), flash = face > 0.97 && !q.rest;
      if (face > 0.25) {
        if (q.solid && q.tone !== undefined) {
          // a chunk of one face: its tone, brighter as it squares up to the light
          p.poly(pts, flash ? C[n - 1] : C[clamp(Math.round(1 + q.tone * 5 * (0.6 + 0.4 * face)), 1, n - 2)], a);
        } else if (q.solid) {
          // shaded like the blade it broke from: a lit side, a pale ridge, a deep side
          const rr = q.ridge ?? -Math.PI / 2, cr = Math.cos(rr), sr = Math.sin(rr), ca = Math.cos(q.a), sa = Math.sin(q.a);
          const rx = cr * ca - sr * k * sa, ry = cr * sa + sr * k * ca;
          let nx = -ry, ny = rx;
          if (nx * -0.55 + ny * -0.84 < 0) (nx = -nx), (ny = -ny);
          const lit = flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], deep = C[clamp(Math.round(1 + lv * 2), 1, 3)];
          p.poly(pts, (x, y) => {
            const d = (x - q.x) * nx + (y - q.y) * ny;
            return d > 0.6 ? lit : d > -0.6 ? C[n - 2] : deep;
          }, a);
        } else glassPoly(p, pts, flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], (0.3 + 0.35 * lv + (flash ? 0.3 : 0)) * a);
      }
      let cx = 0, cy = 0, top = 0;
      for (const [x, y] of pts) (cx += x), (cy += y);
      cx /= pts.length;
      cy /= pts.length;
      // edges: lit where they face the light (up and left), cool where they face away
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
        let nx = y1 - y0, ny = x0 - x1;
        if (nx * ((x0 + x1) / 2 - cx) + ny * ((y0 + y1) / 2 - cy) < 0) (nx = -nx), (ny = -ny);
        const l = Math.hypot(nx, ny) || 1, lit = (-nx * 0.55 - ny * 0.84) / l;
        p.line(x0, y0, x1, y1, face < 0.25 || lit > 0.35 ? C[n - 1] : lit > -0.25 ? C[n - 2] : q.solid ? C[1] : C[Math.max(2, n - 4)], a);
        if (pts[i][1] < pts[top][1]) top = i;
      }
      if (face > 0.7) p.dot(pts[top][0], pts[top][1], WHITE, a);
      p.glow(cx, cy, 5, C[n - 3], (flash ? 0.5 : 0.14) * a);
    }
  }
}

/**
 * A jagged ice blade standing on its base (bx, by), tip at (tx, ty), w wide at the base. Shaded in an ice ramp
 * C (dark to bright, 8 steps): a lit facet on the left with a pale edge, a bright ridge, a deep facet on the
 * right, a white tip, a dark rim, and a notch cut into one side so it reads as a shard, not a cone.
 * opts: { a (alpha), white (flash it white), glint (0..1: a highlight across it at that height, or -1),
 * jag (0..1: where the notch starts, or -1), dim (steps darker, for back rows) }.
 */
function blade(p, bx, by, tx, ty, w, C, opts = {}) {
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy);
  if (L < 1.5 || w < 0.5) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = opts.a ?? 1, dim = opts.dim ?? 0, jag = opts.jag ?? -1, glint = opts.glint ?? -1;
  const K = (i) => C[clamp(i - dim, 0, C.length - 1)], hw = w / 2;
  // half widths on the left (lit) and right (shadow) sides at height u; the notch steps the right side in
  const left = (u) => hw * (1 - u) + 0.35, right = (u) => hw * (1 - u) * (jag >= 0 && u > jag ? 0.55 : 1) + 0.35, ridge = (u) => -w * 0.12 * (1 - u);
  const pad = hw + 2;
  p.shade(Math.min(bx, tx) - pad, Math.min(by, ty) - pad, Math.max(bx, tx) + pad, Math.max(by, ty), (x, y, o) => {
    const rx = x - bx, ry = y - by, u = (rx * ux + ry * uy) / L, s = rx * nx + ry * ny;
    if (u < 0) return;
    const l = left(Math.min(u, 1)), r = right(Math.min(u, 1));
    if (u > 1 || s < -l || s > r) {
      // a dark rim just outside the blade
      const over = u > 1 ? (u - 1) * L : 0, out = Math.max(over, s < -l ? -l - s : s - r);
      if (out < 1 && u < 1 + 1 / L) {
        o.c = K(0);
        o.a = a;
      }
      return;
    }
    o.a = a;
    if (opts.white) return (o.c = WHITE);
    const rd = ridge(u);
    let c;
    if (u > 0.88) c = WHITE;
    else if (Math.abs(s - rd) < 0.55) c = K(6);
    else if (s < rd) c = s + l < 1 ? K(6) : (s + l) / Math.max(1, rd + l) > 0.55 ? K(5) : K(4);
    else c = r - s < 1.1 ? K(1) : (s - rd) / Math.max(1, r - rd) > 0.5 ? K(2) : K(3);
    // the notch's ledge catches light; a little glitter in the lit facet
    if (jag >= 0 && Math.abs(u - jag) * L < 0.8 && s > rd) c = K(6);
    else if (s < rd && c !== K(6) && ((Math.floor(x) * 73856093) ^ (Math.floor(y) * 19349663)) % 997 < 30) c = K(7);
    if (glint >= 0 && s <= rd + 0.6) {
      const g = Math.abs(u - glint) * L;
      if (g < 0.8) c = WHITE;
      else if (g < 1.8) c = K(6);
    }
    o.c = c;
  });
}

/**
 * A snowflake design, seeded: pairs of side branches along each arm ([where 0..1, length 0..1 of the arm]),
 * maybe a hexagonal plate round the heart, maybe forked tips.
 */
function flakeDesign(R) {
  const n = R.int(1, 3), branches = [];
  for (let i = 0; i < n; i++) branches.push([0.38 + (0.4 * (i + R.range(0.2, 0.8))) / n, R.range(0.24, 0.36) * (1 - i * 0.15)]);
  return { branches, plate: R.chance(0.45), fork: R.chance(0.45) };
}

/**
 * A six-armed snowflake of radius r turned by rot, crisp 1 px lines: pale arms, side branches at 60 degrees,
 * a plate or forked tips by design, a white heart, light. hot (0..1) makes it twinkle white.
 */
function snowflake(p, x, y, r, rot, d, C, opts = {}) {
  const n = C.length, a = opts.a ?? 1, hot = opts.hot ?? 0;
  rot = Math.round(rot / (Math.PI / 18)) * (Math.PI / 18); // turn in 10 degree ticks, like sprite frames
  if (r < 1.2) {
    p.dot(x, y, WHITE, a);
    return;
  }
  if (r < 2.6) {
    // too small for branches: a six-point star that flips between two poses as it turns
    const pose = Math.floor(((rot % (Math.PI / 3)) + Math.PI / 3) / (Math.PI / 6)) % 2;
    const pts = pose ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [-1, -1], [1, -1], [-1, 1]];
    for (const [dx, dy] of pts) p.dot(x + dx, y + dy, hot > 0.5 ? WHITE : C[n - 3], a);
    p.dot(x, y, WHITE, a);
    p.glow(x, y, 4, C[n - 3], 0.2 * a);
    return;
  }
  // detail by size: a bare star when small, one pair of branches when middling, the full design when big
  const arm = hot > 0.5 ? WHITE : C[n - 2], br = hot > 0.5 ? C[n - 2] : C[n - 3], big = r >= 7;
  const branches = r < 4 ? [] : big ? d.branches.slice(0, 2) : [[0.58, 0.36]];
  for (let k = 0; k < 6; k++) {
    const g = rot + (k * TAU) / 6, ca = Math.cos(g), sa = Math.sin(g);
    p.line(x, y, x + ca * r, y + sa * r, arm, a);
    for (const [u, l] of branches) {
      const bx = x + ca * r * u, by = y + sa * r * u, bl = Math.max(1, r * l);
      for (const s of [-1, 1]) p.line(bx, by, bx + Math.cos(g + (s * Math.PI) / 3) * bl, by + Math.sin(g + (s * Math.PI) / 3) * bl, br, a);
    }
    if (d.fork && big && !d.plate)
      for (const s of [-1, 1]) p.dot(x + ca * r + Math.cos(g + s * 0.9) * 1.2, y + sa * r + Math.sin(g + s * 0.9) * 1.2, br, a);
    p.dot(x + ca * r, y + sa * r, WHITE, a);
  }
  if (d.plate && big) {
    const q = r * 0.34;
    for (let k = 0; k < 6; k++) {
      const g0 = rot + Math.PI / 6 + (k * TAU) / 6, g1 = g0 + TAU / 6;
      p.line(x + Math.cos(g0) * q, y + Math.sin(g0) * q, x + Math.cos(g1) * q, y + Math.sin(g1) * q, C[n - 3], a);
    }
  }
  p.px(x, y, WHITE);
  p.glow(x, y, 3 + r * 1.2, C[n - 4], (0.14 + 0.35 * hot) * a);
  if (hot > 0.3) p.glow(x, y, 2 + r * 0.5, WHITE, 0.3 * hot * a);
}

/** Nothing outlives the effect: trims the life of every particle, bit and pane that would last past D. */
function endBy(t, D, ...systems) {
  const left = Math.max(0.001, D - 0.05 - t);
  for (const sys of systems) for (const q of sys.list) if (q.life > left) q.life = left;
}

/**
 * Cracks racing out from (x, y) through a shape: n jagged lines that wander, fork now and then and stop at
 * the shape's edge (inside(x, y) says what's in it). Each point carries its distance from the start along the
 * crack, so drawFractures can grow them at a speed. Returns polylines [[x, y, d], ...].
 */
function fractures(R, inside, x, y, n, opts = {}) {
  const out = [], step = opts.step ?? [1.6, 2.6], len = opts.len ?? 18, fork = opts.fork ?? 0.16, a0 = opts.a0 ?? R.range(0, TAU), spread = opts.spread ?? TAU;
  const walk = (x, y, d, a, len, depth) => {
    const pts = [[x, y, d]];
    for (let s = 0; s < len; s++) {
      a += R.range(-0.55, 0.55);
      const st = R.range(step[0], step[1]), nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st;
      if (!inside(nx, ny)) break;
      (x = nx), (y = ny), (d += st);
      pts.push([x, y, d]);
      if (depth < 2 && pts.length > 2 && R.chance(fork)) walk(x, y, d, a + R.sign() * R.range(0.6, 1.2), Math.ceil(len * 0.5), depth + 1);
    }
    if (pts.length > 1) out.push(pts);
  };
  for (let i = 0; i < n; i++) walk(x, y, 0, a0 + (i / n) * spread + R.range(-0.3, 0.3) * Math.min(1, spread / TAU), len, 0);
  return out;
}

/**
 * Draw cracks grown out to distance `reach` from their start: a bright line over a dark one a pixel lower (an
 * engraved fracture), a white-hot tip while they run, light leaking out along them. ox, oy shift them.
 */
function drawFractures(p, cracks, reach, C, opts = {}) {
  const n = C.length, ox = opts.ox ?? 0, oy = opts.oy ?? 0, hot = opts.hot ?? true, a = opts.a ?? 1;
  const seg = (pts, i) => {
    const [x0, y0, d0] = pts[i - 1], [x1, y1, d1] = pts[i];
    if (d0 >= reach) return null;
    const u = Math.min(1, (reach - d0) / Math.max(0.01, d1 - d0));
    return [x0 + ox, y0 + oy, x0 + ox + (x1 - x0) * u, y0 + oy + (y1 - y0) * u, reach - d1 < 3];
  };
  for (const pts of cracks)
    for (let i = 1; i < pts.length; i++) {
      const s = seg(pts, i);
      if (!s) break;
      p.line(s[0], s[1] + 1, s[2], s[3] + 1, C[Math.min(2, n - 1)], a);
    }
  for (const pts of cracks)
    for (let i = 1; i < pts.length; i++) {
      const s = seg(pts, i);
      if (!s) break;
      const tip = hot && s[4];
      p.line(s[0], s[1], s[2], s[3], tip ? WHITE : C[n - 2], a);
      if (tip) p.glow(s[2], s[3], 5, C[n - 3], 0.5 * a);
      else if (i % 2) p.glow(s[2], s[3], 3, C[n - 3], 0.18 * a);
    }
}

__e.inPoly = inPoly; __e.centroid = centroid; __e.splitPoly = splitPoly; __e.iceOf = iceOf; __e.glassPoly = glassPoly; __e.Panes = Panes; __e.blade = blade; __e.flakeDesign = flakeDesign; __e.snowflake = snowflake; __e.endBy = endBy; __e.fractures = fractures; __e.drawFractures = drawFractures;
};

__M["fx/ice/ice-shatter.js"] = function (__e) {
// The crack-and-burst recipe (cracks walking out from the point of impact, a white frame, the ice flung apart
// as shards with ice dust and glints) is adapted from Sprite Fusion's open-source ice
// (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, B, Rng, fit, sparkle, flare, clamp, smooth, seg, ease, rand, TAU, WHITE} = __req("core/index.js");
const {Panes, endBy, inPoly, centroid, splitPoly, fractures, drawFractures} = __req("fx/ice/_lib.js");

const meta = {
  name: "Ice shatter",
  desc: "A block of ice takes a hit from the left: it jolts, cracks race over its faces, it flashes white and bursts into chunks that tumble, bounce and skid off in a roll of ice dust.",
  tags: ["ice", "shatter", "break", "destroy", "impact", "directional", "one-shot"],
  size: [224, 112],
  origin: [68, 90],
  duration: 2.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], seed: 6 },
};

const HIT = 0.26, CRACK2 = 0.4, SHIVER = 0.54, FLASH = 0.62, BURST = 0.68;
// the block, seen from the front and a little above: a front face, a top, a side in shadow
const FRONT = [[-16, 0], [-16, -28], [12, -28], [12, 0]];
const TOP = [[-16, -28], [-8, -34], [20, -34], [12, -28]];
const SIDE = [[12, 0], [12, -28], [20, -34], [20, -6]];
const SIL = [[-16, 0], [-16, -28], [-8, -34], [20, -34], [20, -6], [12, 0]];
const HIT_AT = [-16, -15];
const PLANE = [[-16, -21], [-5, -28], [3, -13], [-16, -9]]; // a fracture plane inside, lighter
const SHADE = [[5, -28], [12, -28], [12, -10]]; // the far corner in shadow

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
  const bits = new Bits({ ground: floor }), lights = new Lights(), scuffs = [];
  const splinter = (x, y, vx, n) => {
    for (let i = 0; i < n; i++) bits.add({ kind: B.SHARD, x: x + R.range(-2, 2), y: y - 1, vx: vx * 0.6 + R.range(-35, 45), vy: -R.range(30, 100), g: 0.8, drag: 0.6, bounce: 0.35, life: R.range(0.4, 0.8), a: R.range(0, TAU), va: R.range(-18, 18), s: R.range(1.2, 2.4), c: C[R.int(4, 7)] });
  };
  const panes = new Panes({
    ground: floor,
    onLand: (q, x, y, v) => {
      // a chunk hitting the floor: a puff of ice dust, a few splinters, sometimes a glint
      if (v < 100) return;
      ps.spawn(P.VAPOUR, x, y - 1, q.vx * 0.3 + R.range(-15, 15), -R.range(2, 10), R.range(0.4, 0.7), C[6], R.range(1.6, 2.8));
      splinter(x, y, q.vx, 2);
      if (R.chance(0.3)) ps.spawn(P.STAR, x, y - 3, 0, -5, R.range(0.2, 0.4), WHITE, R.range(0.8, 1.6));
    },
    onSkid: (q, x) => {
      // sliding chunks scuff frost onto the floor
      if (R.chance(0.5)) scuffs.push({ x: Math.round(x + R.range(-1, 1)), t: 0 });
    },
    onCrumble: (q) => {
      splinter(q.x, 0, q.vx, 3);
      ps.spawn(P.VAPOUR, q.x, -1, R.range(-10, 14), -R.range(2, 6), R.range(0.4, 0.7), C[6], R.range(1.2, 2));
    },
  });

  // the ice's insides: veins of frost and trapped bubbles in the front face
  const veins = [], bubbles = [];
  for (let k = 0; k < 3; k++) {
    let x = R.range(-12, 8), y = R.range(-24, -6), a = R.range(0, TAU);
    for (let i = 0; i < 9; i++) {
      a += R.range(-0.6, 0.6);
      x += Math.cos(a) * 1.5;
      y += Math.sin(a) * 1.2;
      if (x < -14 || x > 10 || y < -26 || y > -2) break;
      veins.push([Math.floor(x), Math.floor(y)]);
    }
  }
  for (let k = 0; k < 5; k++) bubbles.push([R.int(-12, 8), R.int(-23, -4), R.chance(0.4) ? 1 : 0]);
  const inside = (x, y) => inPoly(SIL, x, y);
  const cracks = fractures(R, inside, HIT_AT[0] + 1, HIT_AT[1], 4, { len: 8, a0: -0.9, spread: 1.9 });
  const cracks2 = fractures(R, inside, HIT_AT[0] + 1, HIT_AT[1], 6, { len: 18, a0: -1.3, spread: 2.7, fork: 0.16 });

  let t = 0, struck = false, burst = false, wave2 = false, white = false;
  const jolt = () => (t >= HIT && t < HIT + 0.05 ? 2 : t >= HIT + 0.05 && t < HIT + 0.12 ? 1 : t >= SHIVER && t < FLASH ? (Math.floor(t * 40) % 2 ? 1 : 0) : 0);

  // the block: shaded faces, frost veins and bubbles inside, lit edges, a dark rim
  const drawBlock = (p) => {
    if (t >= BURST) return;
    const jx = jolt(), wh = t >= FLASH, sweep = -40 + 70 * seg(t, 0.04, 0.3);
    const sh = (pts) => pts.map(([x, y]) => [x + jx, y]);
    // rim
    p.poly(sh([[-17, 1], [-17, -28.5], [-8.3, -35.2], [21, -35.2], [21, -5.6], [12.5, 1]]), C[0]);
    if (wh) {
      p.poly(sh(SIL), WHITE);
      return;
    }
    // the front: lit at the top, deep at the foot, the far edges showing through, a fracture plane catching
    // light, reflections streaked across the upper left
    p.poly(sh(FRONT), (x, y) => {
      const lx = x - jx, d = lx + y * 0.8;
      if (Math.abs(d - sweep) < 1.3 && y < -6) return WHITE;
      if (y < -9 && (Math.abs(d + 21) < 1.1 || Math.abs(d + 16.5) < 0.6)) return C[6];
      if (((Math.abs(lx + 7.5) < 0.5 && y < -6) || (Math.abs(y + 5.5) < 0.5 && lx > -8)) && (Math.floor(lx) + Math.floor(y)) % 2 === 0) return C[5];
      if (inPoly(PLANE, lx, y)) return y < -25.5 ? C[6] : C[5];
      if (inPoly(SHADE, lx, y)) return C[3];
      return y < -25.5 ? C[5] : y < -8 ? C[4] : y < -2.5 ? C[3] : C[2];
    });
    p.poly(sh(TOP), (x, y) => (y > -29.5 ? C[7] : y < -32.5 ? C[5] : rand(Math.floor(x), Math.floor(y), 3) < 0.08 ? C[7] : C[6]));
    p.poly(sh(SIDE), (x, y) => {
      const lx = x - jx;
      return lx < 13.5 ? C[3] : Math.abs(lx - 16.5) < 0.6 && y < -8 ? C[3] : y > (lx - 12) * -0.75 - 3 ? C[1] : C[2];
    });
    for (const [x, y] of veins) p.px(x + jx, y, C[5]);
    for (const [x, y, big] of bubbles) {
      p.px(x + jx, y, C[6]);
      if (big) p.px(x + jx + 1, y, C[5]), p.px(x + jx, y + 1, C[5]);
    }
    const E = (a, b, c) => p.line(a[0] + jx, a[1], b[0] + jx, b[1], c);
    E([-16, -28], [12, -28], WHITE);
    E([-16, -28], [-8, -34], C[6]);
    E([-8, -34], [20, -34], C[5]);
    E([12, -28], [20, -34], C[7]);
    E([-16, -1], [-16, -28], C[5]);
    E([12, -1], [12, -28], C[6]);
    E([20, -6], [20, -34], C[3]);
    E([13, -1], [20, -6], C[1]);
    if (t >= HIT) drawFractures(p, cracks, (t - HIT) * 170, C, { ox: jx });
    if (t >= CRACK2) drawFractures(p, cracks2, (t - CRACK2) * 200, C, { ox: jx });
  };

  // the floor: a frost patch where the block stands, frost scuffed along by sliding chunks
  const drawFloor = (p) => {
    const out = 1 - smooth(BURST + 0.6, BURST + 1.5, t);
    if (out > 0)
      for (let x = -22; x <= 26; x++) {
        const d = Math.abs(x - 2) / 24, h = rand(x, 41), a = out * clamp((1.1 - d) / 0.25);
        if (a <= 0) continue;
        p.dot(x, 0, h < 0.35 ? WHITE : C[6], a);
        if (h < 0.4 && (x < -16 || x > 20)) p.dot(x, -1, C[5], a);
        for (let j = 1; j <= 1 + Math.round(rand(x, 7) * 3 * (1 - d)); j++) p.dot(x, j, j < 2 ? C[5] : C[4], a * (1 - j / 5));
      }
    for (const s of scuffs) {
      const a = 1 - s.t / 0.9;
      if (a > 0) p.dot(s.x, 0, s.t < 0.15 ? WHITE : C[6], a), p.dot(s.x, 1, C[4], a * 0.6);
    }
  };

  const explode = () => {
    // chunks of each face, cut at random, flung away from the hit, mostly right and up
    const chop = (pts, max, depth) => {
      const c = centroid(pts);
      return c.area < max || depth > 4 ? [pts] : splitPoly(pts, c.x + R.range(-1, 1), c.y + R.range(-1, 1), R.range(0, Math.PI)).flatMap((q) => chop(q, max, depth + 1));
    };
    for (const [face, tone, max] of [[FRONT, 0.6, 46], [TOP, 1, 40], [SIDE, 0.3, 46]])
      for (const part of chop(face, max, 0)) {
        const m = centroid(part), dx = m.x - HIT_AT[0], dy = m.y - HIT_AT[1], d = Math.hypot(dx, dy) || 1, sp = R.range(50, 150) * (0.7 + 0.3 * (1 - d / 40));
        panes.add({
          pts: part.map(([x, y]) => [x - m.x, y - m.y]), x: m.x, y: m.y, vx: (dx / d) * sp * 0.9 + R.range(40, 110), vy: (dy / d) * sp * 0.4 - R.range(60, 200),
          a: 0, va: R.range(-10, 10), f: R.range(-0.9, 0.9), vf: R.range(-7, 7), tone, lit: tone, g: 0.9, drag: 0.5, bounce: 0.38, solid: true, brittle: 3, crumble: R.range(0.25, 0.6), life: R.range(1.5, 1.9),
        });
      }
    for (let i = 0; i < 46; i++) {
      const x = R.range(-15, 19), y = -R.range(1, 33), dx = x - HIT_AT[0], dy = y - HIT_AT[1], d = Math.hypot(dx, dy) || 1, sp = R.range(60, 200);
      if (!inside(x, y)) continue;
      bits.add({ kind: R.chance(0.15) ? B.CHUNK : B.SHARD, x, y, vx: (dx / d) * sp * 0.8 + R.range(20, 90), vy: (dy / d) * sp * 0.4 - R.range(60, 240), g: 0.85, drag: 0.6, bounce: 0.32, life: R.range(0.8, 1.4), a: R.range(0, TAU), va: R.range(-22, 22), s: R.range(1.2, 3.4), c: C[R.int(4, 7)], ramp: [C[1], C[3], C[4], C[6], C[7]] });
    }
    // ice dust rolls out along the floor, vapour hangs where it stood, a flurry, glints, a flash of light
    for (let i = 0; i < 9; i++) ps.spawn(P.VAPOUR, R.range(-6, 18), -R.range(1, 6), R.range(10, 130), -R.range(2, 12), R.range(0.6, 1.1), C[6], R.range(2.2, 3.8));
    for (let i = 0; i < 5; i++) ps.spawn(P.DUST, R.range(-6, 16), -R.range(1, 4), R.range(30, 110), -R.range(2, 8), R.range(0.5, 0.9), C[5], R.range(1.6, 2.8));
    for (let i = 0; i < 4; i++) ps.spawn(P.VAPOUR, R.range(-8, 18), -R.range(8, 28), R.range(-10, 50), -R.range(8, 24), R.range(0.6, 1), C[6], R.range(2.6, 4));
    for (let i = 0; i < 16; i++) {
      const a = R.range(-Math.PI * 0.9, -0.1), sp = R.range(40, 140);
      ps.spawn(P.FLAKE, R.range(-8, 16), -R.range(6, 28), Math.cos(a) * sp + 20, Math.sin(a) * sp, R.range(1, 1.6), R.chance(0.6) ? WHITE : C[6], R.range(0.5, 1.6));
    }
    for (let i = 0; i < 7; i++) ps.spawn(P.STAR, R.range(-14, 40), -R.range(4, 40), R.range(-8, 16), -R.range(4, 16), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(1, 2.4));
    lights.add(2, -17, 64, WHITE, 0.85, 0.14);
    lights.add(16, -18, 86, C[4], 0.5, 0.55);
  };

  return {
    update(dt) {
      t += dt;
      // the hit: a flash on the left face, chips and sparks thrown back, the block jolts
      if (!struck && t >= HIT) {
        struck = true;
        lights.add(HIT_AT[0], HIT_AT[1], 24, WHITE, 0.6, 0.08);
        lights.add(HIT_AT[0] + 6, HIT_AT[1], 40, C[5], 0.4, 0.3);
        for (let i = 0; i < 12; i++) {
          const a = Math.PI + R.range(-0.9, 0.9), sp = R.range(50, 120);
          ps.spawn(P.SPARK, HIT_AT[0] - 1, HIT_AT[1], Math.cos(a) * sp, Math.sin(a) * sp - 40, R.range(0.15, 0.4));
        }
        for (let i = 0; i < 6; i++) {
          const a = Math.PI + R.range(-1, 0.8), sp = R.range(40, 100);
          bits.add({ kind: B.SHARD, x: HIT_AT[0] - 1, y: HIT_AT[1] + R.range(-2, 2), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 0.85, drag: 0.6, bounce: 0.3, life: R.range(0.5, 0.9), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(1.2, 2.4), c: C[R.int(5, 7)] });
        }
      }
      if (!wave2 && t >= CRACK2) {
        wave2 = true;
        lights.add(0, -16, 36, C[6], 0.35, 0.15);
        for (let i = 0; i < 3; i++) bits.add({ kind: B.SHARD, x: R.range(-14, 18), y: -R.range(4, 30), vx: R.range(-30, 30), vy: -R.range(10, 50), g: 0.85, drag: 0.6, bounce: 0.3, life: R.range(0.4, 0.7), a: R.range(0, TAU), va: R.range(-20, 20), s: R.range(1, 2), c: C[R.int(5, 7)] });
      }
      if (!white && t >= FLASH) {
        white = true;
        lights.add(2, -17, 44, WHITE, 0.7, 0.08);
      }
      if (!burst && t >= BURST) {
        burst = true;
        explode();
      }
      // glints wink on the settling debris
      if (burst && t < BURST + 1 && R.chance(0.08) && bits.list.length) {
        const b = R.pick(bits.list);
        ps.spawn(P.STAR, b.x, b.y - 1, 0, -3, R.range(0.2, 0.4), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.5));
      }
      for (let i = scuffs.length - 1; i >= 0; i--) if ((scuffs[i].t += dt) > 0.9) scuffs.splice(i, 1);
      ps.update(dt);
      bits.update(dt);
      panes.update(dt);
      lights.update(dt);
      endBy(t, meta.duration, ps, bits, panes);
    },
    drawBack(p) {
      drawFloor(p);
      ps.draw(p, "back");
    },
    draw(p) {
      drawBlock(p);
      // the hit: a star and a short flare on the left face
      const h = t - HIT;
      if (h >= 0 && h < 0.2) {
        sparkle(p, HIT_AT[0] - 1, HIT_AT[1], 9 * ease.outBack(Math.min(1, h / 0.04)) * (1 - h / 0.2), C[6], C[4], 0.7);
        if (h < 0.08) flare(p, HIT_AT[0] - 1, HIT_AT[1], 14 * (1 - h / 0.08), 1 - h / 0.08, C);
      }
      // cold light in the ice, brighter as it cracks; a pool on the floor
      const k = 1 - smooth(BURST, BURST + 0.4, t), crk = smooth(HIT, FLASH, t);
      if (k > 0) {
        p.glow(2, -17, 34, C[4], (0.16 + 0.22 * crk) * k);
        p.glow(2, -2, 30, C[4], 0.14 * k);
      }
      if (t >= FLASH && t < BURST + 0.12) flare(p, 2, -17, 26 * (1 - clamp((t - FLASH) / 0.18)), 1 - clamp((t - FLASH) / 0.18), C);
      panes.draw(p, C);
      bits.draw(p);
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/nature/quake.js"] = function (__e) {
// The ground's part (grit thrown up that bounces and settles, stones that tumble and kick up dust where they land,
// dust rolling out along the floor and climbing) is adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, PF, B, Rng, fit, clamp, smooth, ease, rand, TAU, WHITE, hex, mix} = __req("core/index.js");
const {stoneShape, drawRock} = __req("fx/nature/_lib.js");

const meta = {
  name: "Quake",
  desc: "The ground jolts three times: a rift tears out along the floor glowing deep inside, slabs of floor heave up and drop back askew, pebbles hop and dust bursts out of the split.",
  tags: ["nature", "earth", "quake", "rift", "aoe", "ground", "one-shot"],
  size: [288, 104],
  origin: [144, 88],
  duration: 3.1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#0e0c14", "#1a1724", "#211d2d", "#2b2639", "#3a3450", "#4a4263", "#6a6088", "#8e86a8"],
    glow: ["#4a1a0c", "#a8401a", "#ff8a2a", "#ffd27a", "#fff4d0"],
    reach: 118,
    seed: 12,
  },
};

const JOLTS = [0.06, 0.5, 0.92], CLOSE = 2.2;

function create(o) {
  const S = fit(o.palette, 8), G = fit(o.glow, 5), R = new Rng(o.seed), floor = () => 0, REACH = o.reach;
  const DUST = mix(S[6], hex("#8c8494"), 0.4), DUST2 = mix(S[5], hex("#6c6474"), 0.35);
  const ps = new Particles({ rng: R, ground: floor, sparks: [G[4], G[3], G[2], G[1]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  // the rift: a jagged line out both ways, its depth into the floor at each step
  const rift = [];
  for (let x = -REACH; x <= REACH; x += R.range(2.5, 5)) rift.push([x, R.int(0, 2)]);
  const slabs = [];
  for (let x = -REACH + 8; x < REACH - 6; x += R.range(12, 17)) slabs.push({ x: x + R.range(-2, 2), y: 0, vy: 0, a: 0, va: 0, rest: true, s: R.range(4.5, 6), side: R.sign(), pts: [[-1, -0.38], [1, -0.42], [1.02, 0.4], [-0.98, 0.38]] });
  let t = 0, j = 0;
  const open = () => ease.outCubic(clamp((t - JOLTS[0]) / 0.45)) * REACH * (0.55 + 0.45 * smooth(JOLTS[1], JOLTS[1] + 0.3, t));
  const gap = (x) => (1 - smooth(CLOSE, CLOSE + 0.5, t)) * (1 + 2.6 * (1 - Math.abs(x) / REACH)) * (0.6 + 0.4 * smooth(JOLTS[1], JOLTS[2] + 0.2, t));
  const heat = () => smooth(0, 0.3, t) * (1 - smooth(1.4, CLOSE + 0.3, t)) * (0.8 + 0.2 * Math.sin(t * 17));
  const shake = () => JOLTS.reduce((s, tj, i) => (t > tj ? s + Math.exp(-(t - tj) * 9) * Math.sin((t - tj) * 80) * (1.6 - i * 0.3) : s), 0);
  return {
    update(dt) {
      t += dt;
      const f = Math.min(1, dt * 120);
      while (j < JOLTS.length && t >= JOLTS[j]) {
        const k = 1 - j * 0.2, L = open() + 10;
        j++;
        lights.add(0, -2, 60, G[2], 0.5 * k, 0.5);
        lights.add(0, -2, 26, WHITE, 0.4 * k, 0.07);
        // the floor heaves: slabs along the split jump and twist, pebbles and stones hop, dust bursts out
        for (const s of slabs) {
          const d = Math.abs(s.x) / REACH;
          if (Math.abs(s.x) > L || R.chance(0.25 + d * 0.3)) continue;
          (s.rest = false), (s.vy = -R.range(70, 170) * k * (1 - d * 0.5)), (s.va = s.side * R.range(3, 8));
        }
        for (let i = 0; i < 70 * k; i++) {
          const x = R.range(-L, L), a = -Math.PI / 2 + R.range(-0.6, 0.6), sp = R.range(40, 200) * k;
          ps.spawn(P.GRIT, x, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.6, 1.2), R.pick([S[7], S[6], S[5], S[4]]), R.chance(0.35) ? 2 : 1);
        }
        for (let i = 0; i < 8 * k; i++) {
          const x = R.range(-L, L) * 0.8, a = -Math.PI / 2 + R.range(-0.9, 0.9), sp = R.range(100, 230) * k;
          bits.add({ kind: B.CHUNK, x, y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.5, bounce: 0.3, life: Math.min(R.range(1.1, 1.6), meta.duration - 0.1 - t), a: R.range(0, TAU), va: R.range(-14, 14), s: R.range(1.6, 3.2), pts: stoneShape(R) });
        }
        for (let i = 0; i < 14 * k; i++) {
          const x = R.range(-L, L) * 0.9;
          ps.spawn(P.SMOKE, x, -R.range(1, 4), R.range(-40, 40), -R.range(15, 55) * k, R.range(1, 1.7), R.chance(0.5) ? DUST : DUST2, R.range(4, 7) * k, R.range(0, 0.15), PF.BIG);
        }
        for (let i = 0; i < 10 * k; i++) {
          const x = R.range(-L, L) * 0.7, a = -Math.PI / 2 + R.range(-1, 1), sp = R.range(120, 300);
          ps.spawn(P.SPARK, x, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.12, 0.3));
        }
      }
      // between jolts the split keeps breathing grit and wisps of dust, embers float up out of it
      if (t > JOLTS[0] && t < CLOSE && R.chance(0.3 * f)) {
        const x = R.range(-1, 1) * open();
        ps.spawn(P.GRIT, x, -1, R.range(-20, 20), -R.range(20, 70), R.range(0.5, 0.8), R.pick([S[6], S[5]]), 1);
        if (R.chance(0.3)) ps.spawn(P.EMBER, x, -1, R.range(-10, 10), -R.range(20, 45), Math.min(R.range(0.6, 1.2), meta.duration - 0.1 - t), G[3], 1);
        if (R.chance(0.25)) ps.spawn(P.DUST, x, -1, R.range(-15, 15), -R.range(4, 14), R.range(0.5, 0.8), DUST2, R.range(2, 3.5));
      }
      for (const s of slabs) {
        if (s.rest) continue;
        s.vy += 950 * dt;
        s.y += s.vy * dt;
        s.a += s.va * dt;
        if (s.y >= 0 && s.vy > 0) {
          s.y = 0;
          s.a = clamp(s.a, -0.45, 0.45);
          if (s.vy > 160) (s.vy *= -0.25), (s.va *= -0.4);
          else {
            s.rest = true;
            for (let i = 0; i < 3; i++) ps.spawn(P.DUST, s.x + R.range(-5, 5), -0.5, R.sign() * R.range(10, 40), -R.range(2, 12), R.range(0.4, 0.7), DUST2, R.range(1.5, 3));
          }
        }
      }
      bits.update(dt);
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          ps.spawn(P.DUST, b.x, -0.5, R.sign() * R.range(8, 30), -R.range(2, 10), Math.min(R.range(0.3, 0.6), meta.duration - 0.1 - t), DUST2, R.range(1.3, 2.4));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the rift: lit along its upper lip, dark inside with a deep glow, opening out from the middle
      const L = open(), hk = heat(), jx = shake(), fade = 1 - smooth(CLOSE + 0.3, CLOSE + 0.7, t);
      if (t > JOLTS[0])
        for (let i = 1; i < rift.length; i++) {
          const [x0, d0] = rift[i - 1], [x1, d1] = rift[i];
          if (Math.abs(x0) > L) continue;
          for (let x = Math.ceil(x0); x < x1; x++) {
            const u = (x - x0) / (x1 - x0), d = Math.round(d0 + (d1 - d0) * u), w = gap(x), X = x + jx;
            if (w < 0.4) {
              p.dot(X, d, S[1], fade);
              continue;
            }
            p.dot(X, d - 1, S[6], fade);
            const deep = rand(Math.floor(x / 3), 41) + (w - 1.5) * 0.35, hot = hk * clamp(deep - 0.35, 0, 1) * 1.6;
            for (let y = 0; y < w; y++) p.dot(X, d + y, y > w / 2 - 1 && hot > 0.25 ? (hot > 0.9 && rand(x, Math.floor(t * 12)) < 0.6 ? G[3] : G[2]) : y > w / 2 - 1 && hot > 0.08 ? G[1] : S[0], fade);
            p.dot(X, d + Math.ceil(w), S[2], fade);
          }
          if (i % 3 === 0 && hk > 0) p.glow(x1 + jx, d1 + 1, 9, G[2], 0.35 * hk * (1 - Math.abs(x1) / (REACH * 1.2)));
        }
      ps.draw(p, "back");
    },
    draw(p) {
      // slabs of floor heaved up out of it, tilted, sinking back as it closes
      const jx = shake(), sink = smooth(CLOSE, CLOSE + 0.6, t);
      for (const s of slabs) if (!(s.rest && s.a === 0 && s.y === 0) && sink < 1) drawRock(p, s.x + jx, s.y - 1.5 + sink * 4, s.s, s.a, s.pts, S, 1 - sink);
      for (const b of bits.list) drawRock(p, b.x, b.y, b.s, b.a, b.pts, S, Math.min(1, b.life / 0.4));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/nature/_lib.js"] = function (__e) {
// Shared by the nature effects: faceted stones that tumble and break, the stone spike they break from, leaves,
// droplets, bubbles and gas. The gas (puffs that drift off their push, rise, swell and thin, a lit cap) is adapted
// from Sprite Fusion's open-source poison (https://www.spritefusion.com/pixel-art-vfx/poison), MIT License, Copyright (c) 2026 Hugo Duprez.
const {TAU, WHITE, GRAVITY, rand, clamp} = __req("core/index.js");

/** Corners of an irregular stone, unit size, in angular order. */
function stoneShape(R, n = R.int(5, 7)) {
  const pts = [], a0 = R.range(0, TAU), squash = R.range(0.7, 1);
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + R.range(-0.28, 0.28)) * TAU) / n, r = R.range(0.72, 1.12);
    pts.push([Math.cos(a) * r, Math.sin(a) * r * squash]);
  }
  return pts;
}

const LX = -0.6, LY = -0.8;
const inPoly = (V, x, y) => {
  let inside = false;
  for (let i = 0, j = V.length - 1; i < V.length; j = i++) {
    const [xi, yi] = V[i], [xj, yj] = V[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const MASK = new Uint8Array(64 * 64), FACE = new Int8Array(64 * 64), ROWS = 400, RL = new Float32Array(ROWS), RR = new Float32Array(ROWS), RU = new Float32Array(ROWS);

/**
 * A faceted stone at (x, y): corners pts (from stoneShape) scaled by s and turned by a. Each wedge between
 * neighbouring corners is a facet, lit by how squarely it faces the top left; edges facing the light catch a
 * bright rim, a dark rim goes round the rest. S: stone ramp, dark to bright (7+ steps). alpha dithers it out.
 */
function drawRock(p, x, y, s, a, pts, S, alpha = 1, white = false) {
  const n = S.length, top = n - 2, ca = Math.cos(a), sa = Math.sin(a);
  if (s < 1.4) {
    p.dot(x, y, S[top - 1], alpha);
    p.dot(x + 1, y, S[top - 3], alpha);
    return;
  }
  const V = pts.map(([u, v]) => [(u * ca - v * sa) * s, (u * sa + v * ca) * s]);
  const ang = V.map(([vx, vy]) => Math.atan2(vy, vx));
  // each facet's light: its edge's outward normal against the light
  const lit = V.map(([ax, ay], i) => {
    const [bx, by] = V[(i + 1) % V.length], ex = bx - ax, ey = by - ay, l = Math.hypot(ex, ey) || 1;
    let nx = ey / l, ny = -ex / l;
    if (nx * (ax + bx) + ny * (ay + by) < 0) (nx = -nx), (ny = -ny);
    return nx * LX + ny * LY;
  });
  const X0 = Math.floor(x) - Math.ceil(s * 1.25) - 1, Y0 = Math.floor(y) - Math.ceil(s * 1.25) - 1, N = Math.min(62, 2 * Math.ceil(s * 1.25) + 3);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const dx = X0 + i + 0.5 - x, dy = Y0 + j + 0.5 - y, k = j * 64 + i;
      MASK[k] = inPoly(V, dx, dy) ? 1 : 0;
      if (!MASK[k]) continue;
      const g = Math.atan2(dy, dx);
      let f = 0;
      for (let q = 0; q < ang.length; q++) {
        const a0 = ang[q], a1 = ang[(q + 1) % ang.length];
        let d = (g - a0) % TAU, span = (a1 - a0) % TAU;
        if (d < 0) d += TAU;
        if (span < 0) span += TAU;
        if (d <= span) {
          f = q;
          break;
        }
      }
      FACE[k] = f;
    }
  const at = (i, j) => i >= 0 && j >= 0 && i < N && j < N && MASK[j * 64 + i] === 1;
  for (let j = -1; j <= N; j++)
    for (let i = -1; i <= N; i++) {
      const X = X0 + i, Y = Y0 + j;
      if (!at(i, j)) {
        if (at(i - 1, j) || at(i + 1, j) || at(i, j - 1) || at(i, j + 1)) p.dot(X, Y, S[0], alpha);
        continue;
      }
      if (white) {
        p.dot(X, Y, WHITE, alpha);
        continue;
      }
      const L = lit[FACE[j * 64 + i]], edge = !at(i - 1, j) || !at(i + 1, j) || !at(i, j - 1) || !at(i, j + 1);
      let c = L > 0.55 ? S[top] : L > 0.15 ? S[top - 1] : L > -0.3 ? S[top - 2] : S[top - 3];
      if (edge) c = L > 0.3 ? S[top + 1] : L < -0.2 ? S[Math.max(1, top - 4)] : c;
      p.dot(X, Y, c, alpha);
    }
}

/**
 * A faceted stone spike standing on (x, base): h tall, w wide at the base, its tip `lean` px over. A ridge
 * splits a lit left face from a shaded right face; strata step across both; notches chip the edges; a dark
 * rim goes round it. sp: { notches: [{ u, side, d }], strata: [u], slope } from spikeLook(). S: stone ramp
 * (8 steps). opts: { a, white, glint (0..1 height of a sweeping highlight, or -1), clip (draw only u < clip, with a
 * ragged edge), half (-1 or 1: only the part left or right of the ridge), floor (draw nothing below this y),
 * cracks: [[[u, v], ...], ...] with crack (0..1 of each drawn), heat (0..1: cracks glow) and glowRamp }.
 */
function drawSpike(p, x, base, h, w, lean, sp, S, opts = {}) {
  if (h < 1.5) return;
  const a = opts.a ?? 1, white = opts.white, glint = opts.glint ?? -1, clip = opts.clip ?? 1, floorY = opts.floor ?? Infinity;
  const hw = (u, side) => {
    let v = (w / 2) * Math.pow(Math.max(0, 1 - u), 0.85) + 0.3;
    for (const n of sp.notches) if (n.side === side && u > n.u && u < n.u + 0.07) v -= n.d * (1 - u * 0.5);
    return Math.max(0, v);
  };
  const half = opts.half ?? 0, Y0 = Math.floor(base - h) - 2, NR = Math.min(ROWS, Math.ceil(base) - Y0 + 2);
  // each row's edges, once
  for (let k = 0; k < NR; k++) {
    const u = (base - (Y0 + k + 0.5)) / h;
    RU[k] = u;
    if (u < 0 || u > 1 || Y0 + k + 0.5 > floorY) (RL[k] = Infinity), (RR[k] = -Infinity);
    else (RL[k] = x + lean * u - hw(u, -1)), (RR[k] = x + lean * u + hw(u, 1));
  }
  const inside = (px, py) => {
    const k = py - Y0, fx = px + 0.5;
    if (k < 0 || k >= NR || fx < RL[k] || fx > RR[k]) return false;
    if (clip < 1 && RU[k] > clip + (rand(px, 77) - 0.5) * 0.07) return false;
    if (!half) return true;
    const q = ((fx - RL[k]) / Math.max(0.5, RR[k] - RL[k])) * 2 - 1;
    return half < 0 ? q < -0.18 : q >= -0.18;
  };
  const X0 = Math.floor(x - w / 2 - Math.abs(lean) - 2), X1 = Math.ceil(x + w / 2 + Math.abs(lean) + 2);
  for (let py = Math.floor(base - h) - 1; py < Math.ceil(base); py++)
    for (let px = X0; px <= X1; px++) {
      if (!inside(px, py)) {
        if (py + 0.5 <= floorY && (inside(px - 1, py) || inside(px + 1, py) || inside(px, py + 1) || (inside(px, py - 1) && py < base - 1))) p.dot(px, py, S[0], a);
        continue;
      }
      if (white) {
        p.dot(px, py, WHITE, a);
        continue;
      }
      const k0 = py - Y0, u = RU[k0], c = x + lean * u, l = RL[k0], r = RR[k0], fx = px + 0.5;
      // which stratum this row sits in: facets jog sideways at each bedding plane, like stacked rock
      let band = 0, st = false;
      for (const s of sp.strata) {
        const d = u * h - s * h - sp.slope * (fx - c);
        if (d > 0) band++;
        if (Math.abs(d) < 0.5) st = true;
      }
      const jog = (rand(band, sp.seed) - 0.5) * 0.3, q = ((fx - l) / Math.max(0.5, r - l)) * 2 - 1, qr = -0.18 + jog;
      let i;
      if (u > 0.93) i = q < qr + 0.3 ? 7 : 5;
      else if (Math.abs(q - qr) < Math.max(0.09, 0.55 / Math.max(1, r - l))) i = 7;
      else if (q < qr) i = fx - l < 1 ? 7 : q < -0.5 + jog ? 6 : 5;
      else i = r - fx < 1 ? 3 : q < 0.38 + jog ? 4 : 2;
      if (st && i < 7) i -= 1;
      const fleck = rand(px * 7 + 3, py * 13 + 5);
      if (fleck < 0.035) i = q < qr ? 7 : i - 1;
      else if (fleck > 0.965) i -= 1;
      if (glint >= 0 && q < qr + 0.1) {
        const g = Math.abs(u - glint);
        if (g < 0.035) i = 8;
        else if (g < 0.07) i = Math.max(i, 7);
      }
      p.dot(px, py, i >= 8 ? WHITE : S[clamp(i, 0, S.length - 1)], a);
    }
  // cracks spreading over it, a lit lip on one side of each
  if (opts.cracks && opts.crack > 0)
    for (const path of opts.cracks) {
      const m = Math.max(1, Math.floor(path.length * opts.crack));
      for (let k = 1; k < m; k++) {
        const [u0, v0] = path[k - 1], [u1, v1] = path[k];
        const P = ([u, v]) => [x + lean * u + v * hw(u, v < 0 ? -1 : 1), base - u * h];
        const [ax, ay] = P([u0, v0]), [bx, by] = P([u1, v1]);
        if (u1 > clip) break;
        if (!inside(Math.floor(ax), Math.floor(ay)) || !inside(Math.floor(bx), Math.floor(by))) continue;
        const hot = opts.heat ?? 0, Gl = opts.glowRamp;
        if (hot > 0.05 && Gl) {
          // a seam of light inside the crack, a dark lip below it
          p.line(ax + 1, ay, bx + 1, by, S[0], a);
          p.line(ax, ay, bx, by, hot > 0.7 ? Gl[4] : hot > 0.4 ? Gl[3] : hot > 0.2 ? Gl[2] : Gl[1], a);
          if (k % 2 === 0) p.glow(bx, by, 7, Gl[2], 0.35 * hot);
        } else {
          p.line(ax, ay, bx, by, S[0], a);
          p.dot(bx + 1, by - 1, S[6], a * 0.7);
        }
      }
    }
}

/** The random look of one spike: notches on its edges, strata across it. */
function spikeLook(R) {
  const notches = [], strata = [];
  for (let i = 0, n = R.int(3, 5); i < n; i++) notches.push({ u: R.range(0.1, 0.8), side: R.sign(), d: R.range(0.8, 1.8) });
  for (let i = 0, n = R.int(2, 4); i < n; i++) strata.push(R.range(0.12, 0.8));
  return { notches, strata, slope: R.range(-0.25, 0.25), seed: R.int(1, 9999) };
}

/** A crack that branches up a spike: points [u (height 0..1), v (-1 left edge..1 right edge)]. */
function spikeCrack(R, u0, v0, dir) {
  const pts = [[u0, v0]];
  let u = u0, v = v0;
  for (let i = 0; i < 9; i++) {
    u += R.range(0.03, 0.08);
    v += dir * R.range(0.05, 0.28) + R.range(-0.12, 0.12);
    if (u > 0.95 || Math.abs(v) > 1) break;
    pts.push([u, v]);
  }
  return pts;
}

/** A jagged floor crack from x = 0 out to side * len: points [x, y], y 0..3 into the floor. */
function floorCrack(R, side, len) {
  const pts = [[0, 0]];
  for (let x = 0; Math.abs(x) < len; ) {
    x += side * R.range(2, 5);
    pts.push([x, R.int(0, 2)]);
  }
  return pts;
}

/**
 * A leaf len px long and wid px across at its widest, centered on (x, y), turned by ang and flipping about its
 * midrib by fl (radians: edge on at pi/2, its paler underside showing past it). A pointed blade, lit along its
 * upper half and shaded along the lower, a darker midrib, a stem, a dark rim. pal: [dark, shade, body, light]
 * (dark to bright). alpha dithers it out.
 */
function drawLeaf(p, x, y, len, wid, ang, fl, pal, alpha = 1) {
  const ca = Math.cos(ang), sa = Math.sin(ang), sq = Math.cos(fl), w = Math.max(0.55, Math.abs(sq) * wid), under = sq < 0;
  const R = Math.ceil(len / 2 + 2), X = Math.round(x), Y = Math.round(y);
  const inside = (i, j) => {
    const u = (i + 0.5) * ca + (j + 0.5) * sa + len / 2, v = -(i + 0.5) * sa + (j + 0.5) * ca;
    if (u < 0 || u > len) return 0;
    const half = w * Math.pow(Math.sin((Math.PI * u) / len), 0.75);
    return Math.abs(v) <= half ? (v < 0 ? 1 : 2) : 0;
  };
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      const s = inside(i, j);
      if (!s) {
        if (inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1)) p.dot(X + i, Y + j, pal[0], alpha);
        continue;
      }
      const u = (i + 0.5) * ca + (j + 0.5) * sa + len / 2, v = -(i + 0.5) * sa + (j + 0.5) * ca;
      const rib = Math.abs(v) < 0.5 && u > len * 0.12 && u < len * 0.88 && w > 1.2;
      p.dot(X + i, Y + j, rib ? pal[1] : (s === 1) !== under ? pal[3] : pal[2], alpha);
    }
  // the stem trails off the base
  p.dot(X - ca * (len / 2 + 1), Y - sa * (len / 2 + 1), pal[1], alpha);
}

/**
 * Droplets of liquid: arc under gravity with a little drag, drawn as a bright bead with a short tail along
 * their motion, and land on the floor (onLand(d, y) in update, then they're gone). add(x, y, vx, vy, s, delay).
 */
class Drops {
  constructor(ground = () => 0) {
    this.list = [];
    this.ground = ground;
  }
  add(x, y, vx, vy, s = 1, delay = 0) {
    this.list.push({ x, y, vx, vy, s, delay });
  }
  update(dt, onLand) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const d = this.list[i];
      if (d.delay > 0) {
        d.delay -= dt;
        continue;
      }
      const drag = 0.6 / d.s, py = d.y;
      d.vy += GRAVITY * dt;
      d.vx -= d.vx * drag * dt;
      d.vy -= d.vy * drag * 0.5 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const g = this.ground(d.x);
      if (d.vy > 0 && py <= g && d.y >= g) {
        onLand?.(d, g);
        this.list.splice(i, 1);
      }
    }
  }
  /** C: the liquid's ramp, dark to bright (5+ steps). */
  draw(p, C) {
    const n = C.length;
    for (const d of this.list) {
      if (d.delay > 0) continue;
      const sp = Math.hypot(d.vx, d.vy) || 1, ux = d.vx / sp, uy = d.vy / sp, len = Math.min(5, 0.5 + sp * 0.012);
      p.line(d.x - ux * len, d.y - uy * len, d.x - ux, d.y - uy, C[n - 4]);
      p.px(d.x, d.y, C[n - 1]);
      if (d.s > 1) p.px(d.x - ux, d.y - uy, C[n - 2]), p.px(d.x + 1, d.y, C[n - 3]);
      p.glow(d.x, d.y, 3 + d.s * 1.5, C[n - 2], 0.3);
    }
  }
}

/** A puff of gas: a darker belly hanging low, a body, a denser core, a lit cap up and to the left (hi: a rim). */
function gasPuff(p, x, y, r, a, belly, body, cap, hi = 0) {
  if (a < 0.02 || r < 0.6) return;
  p.disc(x + r * 0.06, y + r * 0.28, r * 0.9, belly, a * 0.55);
  p.disc(x, y, r, body, a * 0.45);
  p.disc(x + r * 0.03, y - r * 0.02, r * 0.76, body, a * 0.5);
  p.disc(x - r * 0.2, y - r * 0.34, r * 0.52, cap, a * 0.45);
  if (hi) p.disc(x - r * 0.3, y - r * 0.55, r * 0.26, hi, a * 0.32);
}

/**
 * A bubble of radius r centered at (x, y): a 1 px skin (lit c1 on its upper left, c2 elsewhere), a
 * translucent belly, a white glint. dome: only the part above y (a bubble swelling on a surface).
 */
function bubble(p, x, y, r, c1, c2, fill, a = 1, dome = false) {
  const R = Math.ceil(r) + 1, X = Math.round(x), Y = Math.round(y);
  for (let j = -R; j <= (dome ? 0 : R); j++)
    for (let i = -R; i <= R; i++) {
      const d = Math.hypot(i, j);
      if (d > r + 0.45) continue;
      if (d > r - 0.6) p.dot(X + i, Y + j, i < 0 && j < -r * 0.2 ? c1 : c2, a);
      else p.blend(X + i, Y + j, fill, 0.3 * a);
    }
  if (r >= 1.5) p.dot(X - Math.round(r * 0.45), Y - Math.round(r * 0.5), WHITE, a);
}

/**
 * Puffs of gas with their own clock: add(t, x, y, vx, vy, r0, r1, end, rise) launches one at time t that drifts
 * off its push (fading drag), rises at `rise` px/s, sways, swells from r0 to r1 and thins out by `end`. Draw
 * them with draw(p, t, belly, body, cap, hi, k): layered translucent puffs, a little light on the big ones.
 */
class Gas {
  constructor() {
    this.list = [];
    this.n = 0;
  }
  add(t, x, y, vx, vy, r0, r1, end, rise = 0) {
    this.list.push({ x, y, vx, vy, r0, r1, t0: t, end, rise, seed: (this.n++ * 37.7) % 100 });
  }
  prune(t) {
    for (let i = this.list.length - 1; i >= 0; i--) if (t > this.list[i].end) this.list.splice(i, 1);
  }
  at(q, t) {
    const age = t - q.t0, e = 1 - Math.exp(-age * 2.2), sw = Math.min(1, age);
    const x = q.x + (q.vx / 2.2) * e + Math.sin(t * 1.7 + q.seed) * 2.5 * sw, y = q.y + (q.vy / 2.2) * e - q.rise * age + Math.sin(t * 1.3 + q.seed * 2) * 1.5 * sw;
    const u = clamp(age / Math.max(0.01, q.end - q.t0)), r = q.r0 + (q.r1 - q.r0) * (1 - Math.pow(1 - Math.min(1, age / 1.2), 3));
    return { x, y, r, a: clamp(age / 0.15) * (1 - clamp((u - 0.4) / 0.6)), u };
  }
  draw(p, t, belly, body, cap, hi = 0, k = 1, glow = 0) {
    for (const q of this.list) {
      const g = this.at(q, t);
      if (g.a <= 0.02) continue;
      gasPuff(p, g.x, g.y, g.r, g.a * k, belly, body, cap, g.u < 0.5 ? hi : 0);
      if (glow && g.r > 4) p.glow(g.x, g.y, g.r * 1.6, glow, 0.07 * g.a * k);
    }
  }
}

__e.stoneShape = stoneShape; __e.drawRock = drawRock; __e.drawSpike = drawSpike; __e.spikeLook = spikeLook; __e.spikeCrack = spikeCrack; __e.floorCrack = floorCrack; __e.drawLeaf = drawLeaf; __e.Drops = Drops; __e.gasPuff = gasPuff; __e.bubble = bubble; __e.Gas = Gas;
};

__M["fx/nature/earth-spike.js"] = function (__e) {
// The eruption (a spike punching up with overshoot and a white frame, a burst of debris, mist and glints, then
// breaking into tumbling pieces) is adapted from Sprite Fusion's open-source ice spikes, and the grit and
// rolling dust from his explosion (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, PF, B, Rng, fit, sparkle, clamp, smooth, ease, lerp, TAU, WHITE, hex, mix} = __req("core/index.js");
const {stoneShape, drawRock, drawSpike, spikeLook, spikeCrack, floorCrack} = __req("fx/nature/_lib.js");

const meta = {
  name: "Earth spike",
  desc: "The floor cracks with light and heaves, a faceted stone spike rams up with two side shards in a burst of chips, grit and dust; rubble rains, then it splits and crumbles.",
  tags: ["nature", "earth", "stone", "spike", "ground", "attack", "one-shot"],
  size: [272, 150],
  origin: [136, 132],
  duration: 3.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#120c0c", "#251917", "#3b2a24", "#553d31", "#715440", "#8f6e52", "#b8966e", "#e6d0a8"],
    glow: ["#4a1a0c", "#a8401a", "#ff8a2a", "#ffd27a", "#fff4d0"],
    height: 62,
    seed: 5,
  },
};

const UP = 0.34, RISE = 0.09, CRACK = 1.18, SPLIT = 1.5, PART = 0.1, FALL = 0.42, SINK = 0.55;

function create(o) {
  const S = fit(o.palette, 8), G = fit(o.glow, 5), R = new Rng(o.seed), floor = () => 0, H = o.height;
  const DUST = mix(S[6], hex("#8c8494"), 0.45), DUST2 = mix(S[5], hex("#6c6474"), 0.4);
  const ps = new Particles({ rng: R, ground: floor, sparks: [G[4], G[3], G[2], G[1]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  // the spike and two side shards leaning away from it, each with its own chips, strata and cracks
  const spikes = [
    { x: -H * 0.17, H: H * 0.52, w: H * 0.22, lean: -H * R.range(0.13, 0.18), at: UP + 0.045, split: SPLIT - 0.1, back: true },
    { x: H * 0.18, H: H * 0.4, w: H * 0.2, lean: H * R.range(0.11, 0.15), at: UP + 0.085, split: SPLIT + 0.08, back: false },
    { x: 0, H, w: H * 0.36, lean: R.range(-2, 2), at: UP, split: SPLIT, back: false, main: true },
  ];
  for (const s of spikes) {
    s.look = spikeLook(R);
    s.cracks = [spikeCrack(R, R.range(0.04, 0.16), R.range(-0.6, -0.1), 1), spikeCrack(R, R.range(0.22, 0.4), R.range(0.1, 0.6), -1), spikeCrack(R, R.range(0.42, 0.58), R.range(-0.4, 0.4), R.sign())];
    s.up = s.split0 = false;
    s.cut = R.range(0.24, 0.32);
    s.top = 1;
  }
  const cracks = [floorCrack(R, -1, R.range(34, 44)), floorCrack(R, 1, R.range(34, 44)), floorCrack(R, -1, R.range(14, 20)), floorCrack(R, 1, R.range(14, 20))];
  const slabs = [-1, 1].map((sd) => ({ sd, x: sd * R.range(13, 16), pts: [[-1.2, -0.32], [1.1, -0.42], [1.2, 0.36], [-1.1, 0.4]], s: R.range(5.5, 7), a: sd * R.range(0.45, 0.65) }));
  const rock = (b) => bits.add({ ...b, pts: stoneShape(R) });
  let t = 0;
  const grown = (s) => (t < s.at ? 0 : ease.outBack(clamp((t - s.at) / RISE), 2.2));
  const open = () => ease.outCubic(clamp((t - 0.02) / 0.24));
  const heat = () => (t < UP ? smooth(0, UP, t) : 1 - smooth(UP, UP + 0.9, t));
  // after the split the halves part, tip outwards and come down from the top as rubble
  const gap = (s) => smooth(s.split, s.split + PART, t) * (s.main ? 3 : 2);
  const tip = (s) => smooth(s.split, s.split + PART + FALL, t) * 0.12 * s.H;
  const topAt = (s) => lerp(1, s.cut, ease.inQuad(clamp((t - s.split - 0.04) / FALL)));

  const erupt = (s) => {
    const k = s.H / H;
    lights.add(s.x, -s.H * 0.4, 30 * k + 14, WHITE, 0.5 * k + 0.1, 0.1);
    lights.add(s.x, -10, 60 * k + 20, G[2], 0.34 * k, 0.5);
    for (let i = 0; i < Math.round(16 * k) + 3; i++) {
      const a = -Math.PI / 2 + R.range(-1.1, 1.1), sp = R.range(140, 360) * (0.6 + 0.4 * k);
      rock({ kind: B.CHUNK, x: s.x + R.range(-s.w / 3, s.w / 3), y: -R.range(1, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.35, bounce: 0.32, life: R.range(1.4, 2.4), a: R.range(0, TAU), va: R.range(-14, 14), s: R.range(1.6, 3.8) * (0.6 + 0.4 * k) });
    }
    for (let i = 0; i < Math.round(55 * k) + 10; i++) {
      const u = R.range(-1, 1), a = -Math.PI / 2 + u * 0.9, sp = R.range(90, 330) * (1 - 0.35 * Math.abs(u));
      ps.spawn(P.GRIT, s.x + u * s.w * 0.4, -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(1, 2), R.pick([S[6], S[5], S[4], S[4], S[3]]), R.chance(0.4) ? 2 : 1);
    }
    for (let i = 0; i < Math.round(9 * k) + 2; i++) {
      const a = -Math.PI / 2 + R.range(-1.2, 1.2), sp = R.range(160, 380);
      ps.spawn(P.SPARK, s.x, -R.range(2, 10), Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.15, 0.4));
    }
    // dust: a low skirt rolling out both ways, a few puffs hanging round the base
    for (let i = 0; i < Math.round(10 * k) + 3; i++) {
      const sd = R.sign();
      ps.spawn(P.SMOKE, s.x + sd * R.range(2, 10), -R.range(1, 4), sd * R.range(50, 170) * (0.5 + 0.5 * k), -R.range(3, 16), R.range(0.9, 1.6), R.chance(0.5) ? DUST : DUST2, R.range(3, 5.5) * (0.6 + 0.4 * k), R.range(0, 0.05), PF.BIG);
    }
    for (let i = 0; i < Math.round(14 * k) + 4; i++) {
      const sd = R.sign();
      ps.spawn(P.DUST, s.x + sd * R.range(0, 8), -R.range(0, 3), sd * R.range(40, 160), -R.range(2, 20), R.range(0.5, 1), R.chance(0.5) ? DUST : DUST2, R.range(1.5, 3.2));
    }
    for (let i = 0; i < Math.round(3 * k) + 1; i++)
      ps.spawn(P.SMOKE, s.x + R.range(-6, 6), -R.range(2, 12), R.range(-20, 20), -R.range(15, 45), R.range(1, 1.6), DUST, R.range(4, 6) * k + 2, R.range(0.02, 0.12), PF.BIG);
    if (s.main) {
      for (let i = 0; i < 3; i++) ps.spawn(P.STAR, s.x + R.range(-5, 5), -R.range(10, s.H * 0.9), 0, -3, R.range(0.25, 0.5), S[7], R.range(1, 2.2), R.range(0.1, 0.4));
      // rubble that went up high comes raining back down
      for (let i = 0; i < 14; i++) ps.spawn(P.GRIT, R.range(-60, 60), -R.range(110, 125), R.range(-15, 15), R.range(10, 60), R.range(1.2, 1.8), R.pick([S[5], S[4], S[3]]), R.chance(0.35) ? 2 : 1, R.range(0.25, 0.9));
    }
  };

  // one band of a spike, u0..u1, breaks off both halves into rubble that drops and tumbles
  const crumble = (s, u0, u1) => {
    const g = gap(s), lean = s.lean, tp = tip(s);
    for (const half of [-1, 1]) {
      const u = (u0 + u1) / 2, hw = (s.w / 2) * Math.pow(1 - u, 0.85), x = s.x + lean * u + half * (g / 2 + hw * 0.45 + tp * u), y = -u * s.H;
      if (hw < 0.8 && half > 0) continue;
      rock({ kind: B.CHUNK, x, y, vx: half * R.range(8, 40) + lean * 0.6, vy: -R.range(0, 50), g: 1, drag: 0.3, bounce: 0.3, life: Math.min(R.range(1.1, 1.6), meta.duration - 0.15 - t), a: R.range(0, TAU), va: R.range(-8, 8), s: clamp(hw * 0.62, 1.6, 4.8) });
      for (let i = 0; i < 3; i++) ps.spawn(P.GRIT, x + R.range(-2, 2), y + R.range(-2, 2), half * R.range(5, 45), -R.range(10, 70), R.range(0.9, 1.6), R.pick([S[6], S[5], S[4], S[3]]), R.chance(0.35) ? 2 : 1);
    }
    if (R.chance(0.5)) ps.spawn(P.DUST, s.x + lean * u1 + R.range(-4, 4), -u1 * s.H, R.sign() * R.range(15, 45), R.range(20, 60), R.range(0.35, 0.6), DUST, R.range(2, 3.5));
  };

  const drawShard = (p, s) => {
    const g = grown(s);
    if (g <= 0) return;
    if (t < s.split) {
      const white = t - s.at < 0.04 || t > s.split - 0.045, crack = smooth(CRACK + (s.main ? 0 : 0.05), s.split - 0.03, t);
      const sw = (t - s.at) * 0.9 - 0.15, glint = sw > 0 && sw % 1.2 < 0.55 ? (sw % 1.2) / 0.55 : -1;
      drawSpike(p, s.x, 0, s.H * g, s.w, s.lean * Math.min(1, g), s.look, S, { white, glint, cracks: s.cracks, crack, heat: smooth(CRACK, s.split, t), glowRamp: G });
      return;
    }
    // split: two halves part along the ridge and tip away, crumbling from the top; the stump sinks
    const top = topAt(s), gp = gap(s), tp = tip(s), sink = smooth(s.split + FALL, s.split + FALL + SINK, t) * s.H * (s.cut + 0.06);
    if (sink >= s.H * (s.cut + 0.05)) return;
    for (const half of [-1, 1]) drawSpike(p, s.x + (half * gp) / 2, sink, s.H, s.w, s.lean + half * tp, s.look, S, { half, clip: top, floor: 0, cracks: s.cracks, crack: 1, heat: 1 - smooth(s.split, s.split + 0.45, t), glowRamp: G });
  };

  return {
    update(dt) {
      t += dt;
      const f = Math.min(1, dt * 120);
      // the floor splits open: grit hops out of the cracks as they run, dust puffs from them
      if (t < UP) {
        const L = open();
        for (const c of cracks)
          if (R.chance(0.35 * f)) {
            const q = c[Math.min(c.length - 1, Math.floor(R.range(0, L) * c.length))];
            ps.spawn(P.GRIT, q[0], -1, R.range(-20, 20), -R.range(30, 110), R.range(0.5, 1), R.pick([S[5], S[4]]), 1);
            if (R.chance(0.25)) ps.spawn(P.DUST, q[0], -1, R.range(-15, 15), -R.range(4, 14), R.range(0.3, 0.6), DUST2, R.range(1.5, 3));
          }
        if (t > 0.12 && R.chance(0.2 * f)) ps.spawn(P.DUST, R.sign() * R.range(10, 16), -R.range(1, 4), R.sign() * R.range(10, 30), -R.range(4, 12), R.range(0.4, 0.7), DUST2, R.range(2, 3.5));
      }
      for (const s of spikes) {
        if (!s.up && t >= s.at) (s.up = true), erupt(s);
        if (!s.split0 && t >= s.split) {
          s.split0 = true;
          lights.add(s.x, -s.H * 0.5, 30, WHITE, 0.3, 0.08);
          ps.spawn(P.STAR, s.x + s.lean * 0.5, -s.H * 0.55, 0, -2, 0.3, S[7], 2.5);
        }
        // crumbling from the top: each band that goes turns to rubble
        if (t >= s.split) {
          const top = topAt(s);
          while (s.top - top > 0.045 || (top <= s.cut + 1e-6 && s.top > s.cut + 1e-6)) {
            const u1 = s.top, u0 = Math.max(top, s.top - 0.11);
            crumble(s, u0, u1);
            s.top = u0;
            if (u0 <= s.cut + 1e-6) break;
          }
        }
        // cracking: grit and dust dribble out of the cracks
        if (t < s.split && t > CRACK && R.chance(0.12 * f)) {
          const u = R.range(0.1, 0.7);
          ps.spawn(P.GRIT, s.x + s.lean * u + R.range(-2, 2), -u * s.H, R.range(-15, 15), -R.range(0, 20), R.range(0.6, 1.1), R.pick([S[5], S[4]]), 1);
          if (R.chance(0.3)) ps.spawn(P.DUST, s.x + s.lean * u, -u * s.H, R.range(-10, 10), -R.range(2, 8), R.range(0.4, 0.7), DUST, R.range(1.5, 2.5));
        }
        // while it stands, pebbles trickle off its flanks and light glints off its edges
        if (s.up && t < s.split && t > s.at + 0.2 && R.chance(0.05 * f)) {
          const u = R.range(0.2, 0.8), sd = R.sign();
          ps.spawn(P.GRIT, s.x + s.lean * u + sd * (s.w / 2) * (1 - u), -u * s.H, sd * R.range(10, 30), -R.range(0, 15), R.range(0.7, 1.2), R.pick([S[6], S[5]]), 1);
        }
        if (s.main && s.up && t < s.split && t > s.at + 0.25 && R.chance(0.03 * f))
          ps.spawn(P.STAR, s.x + R.range(-4, 2), -R.range(8, s.H * 0.85), 0, -2, R.range(0.25, 0.45), R.chance(0.5) ? S[7] : G[3], R.range(0.8, 2));
        // the stump sinking pushes up a last puff of dust
        if (t > s.split + FALL && t < s.split + FALL + SINK * 0.8 && R.chance(0.15 * f))
          ps.spawn(P.DUST, s.x + R.range(-s.w / 2, s.w / 2), -R.range(0, 2), R.sign() * R.range(20, 60), -R.range(0, 5), R.range(0.4, 0.7), DUST2, R.range(1.5, 3));
      }
      bits.update(dt);
      // stones that land hard kick up a little dust
      for (const b of bits.list)
        if (b.rest && !b.dusted) {
          b.dusted = true;
          for (let i = 0; i < 2; i++) ps.spawn(P.DUST, b.x + R.range(-1.5, 1.5), -0.5, R.sign() * R.range(8, 35), -R.range(2, 14), R.range(0.3, 0.6), DUST2, R.range(1.3, 2.6));
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the cracks in the floor: a glowing seam that cools to a dark scar, then fades
      const L = open(), hk = heat(), fade = 1 - smooth(meta.duration - 1.1, meta.duration - 0.3, t);
      for (const c of cracks) {
        const m = Math.max(2, Math.ceil(c.length * L));
        for (let k = 1; k < m; k++) {
          const [x0, y0] = c[k - 1], [x1, y1] = c[k];
          p.line(x0, y0 + 1, x1, y1 + 1, S[0], fade);
          p.line(x0, y0, x1, y1, hk > 0.65 ? G[4] : hk > 0.35 ? G[3] : hk > 0.12 ? G[2] : hk > 0.03 ? G[1] : S[1], fade);
          if (k % 2 === 0) p.glow(x1, y1, 6, G[2], 0.3 * hk);
        }
      }
      if (hk > 0) p.glow(0, -3, 26, G[2], 0.35 * hk);
      ps.draw(p, "back");
      for (const s of spikes) if (s.back) drawShard(p, s);
    },
    draw(p) {
      // before it breaks through, the floor heaves into a trembling mound
      if (t < UP + 0.02) {
        const k = smooth(0.06, UP, t), hm = 8 * k, jx = Math.sin(t * 95) * 0.8 * k;
        if (hm > 0.6)
          p.shade(-16, -hm - 1, 16, 1, (x, y, out) => {
            const dx = (x - jx) / 15, dy = y / hm, d = dx * dx + dy * dy;
            if (y > 0.5 || d > 1.18) return;
            out.c = d > 1 ? S[0] : dy < -0.72 ? S[6] : dx < -0.3 ? S[5] : dx > 0.35 ? S[3] : S[4];
          });
      }
      // slabs of floor shoved up around the base, sinking back as the spike crumbles
      if (t >= UP) {
        const sink = smooth(SPLIT + FALL, SPLIT + FALL + SINK, t) * 7, a = 1 - smooth(SPLIT + FALL, SPLIT + FALL + SINK, t);
        for (const sl of slabs) {
          const g = ease.outBack(clamp((t - UP) / 0.1), 2);
          if (a > 0) drawRock(p, sl.x, -1.5 + sink, sl.s * Math.min(1, g), sl.a * g, sl.pts, S, a, t - UP < 0.04);
        }
      }
      for (const s of spikes) if (!s.back) drawShard(p, s);
      const m0 = spikes[2], leak = smooth(CRACK, SPLIT, t) * (1 - smooth(SPLIT, SPLIT + 0.5, t));
      if (leak > 0) p.glowLine(m0.x, -4, m0.x + m0.lean * 0.6, -m0.H * 0.6, 20, G[2], 0.22 * leak);
      for (const b of bits.list) drawRock(p, b.x, b.y, b.s, b.a, b.pts, S, Math.min(1, b.life / 0.4));
      ps.draw(p, "front");
      // the hero frame: a flare where the tip breaks through, light running up the spike
      const m = spikes[2], e = t - m.at;
      if (e > 0 && e < 0.2) {
        const g = ease.outBack(clamp(e / RISE), 2.2);
        sparkle(p, m.x + m.lean, -m.H * g, 10 * (1 - e / 0.2), S[7], G[3], 0.5);
        p.glowLine(m.x, 0, m.x + m.lean, -m.H * g, 10, G[3], 0.3 * (1 - e / 0.2));
      }
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/fire/fire-ring.js"] = function (__e) {
// The flame-puff, smoke and spark recipe and the floor ring are adapted from Sprite Fusion's open-source explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), and the tongue from its fire
// (https://www.spritefusion.com/pixel-art-vfx/fire), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, PF, Rng, fit, band, clamp, smooth, ease, noise, rand, TAU, WHITE, hex, mix, rgb, READY} = __req("core/index.js");
const {hotFirst, flameTongue, simDraw, LAYERS, BACK_LAYERS} = __req("fx/fire/_lib.js");

const meta = {
  name: "Fire ring",
  desc: "A white flash at the feet, then flames race outward along the floor in a ring, flaring as the front passes and burning down behind it over a smouldering scorch.",
  tags: ["fire", "ring", "nova", "aoe", "spell", "ground", "one-shot"],
  size: [224, 128],
  origin: [112, 92],
  duration: 3.9,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    reach: 92,
    seed: 6,
  },
};

const HIGH = { turn: 1.15, crouch: 0, fx: -7, fy: -44, bx: 8, by: -44, ffx: -5, fbx: 6 };
const SLAM = { turn: 1.15, crouch: 8, lean: 3, fx: -9, fy: -8, bx: 11, by: -8, ffx: -8, fbx: 9 };
const EASE = { turn: 1, crouch: 2, fx: -8, fy: -17, bx: 9, by: -17, ffx: -4, fbx: 5 };
const act = {
  target: { x: 70 },
  poses: [
    [-0.32, READY],
    [0.02, HIGH],
    [0.27, { ...HIGH, y: -1 }],
    [0.32, SLAM, "snap"],
    [0.85, { ...SLAM, crouch: 7 }],
    [1.5, EASE],
    [2.4, READY],
    [3.9, READY],
  ],
  hits: [
    { t: 0.32, stop: 0.1, shake: 0.28, amp: 3, target: false },
    { t: 0.6, push: 1.2, straw: 10, y: -8, skin: "char" },
    { t: 3.5, push: 0, straw: 0, flash: 0, skin: null },
  ],
  dust: [{ t: 0.32, x: 10, n: 6, dir: 1 }, { t: 0.32, x: -10, n: 6, dir: -1 }],
};

const SY = 0.2, CHARGE = 0.32, SPREAD = 0.75, SOOT = hex("#0d0a12"), SOOT2 = hex("#17121d"), WARM = rgb(255, 176, 96);
// the dying flames: deep orange and red, no white heart
const EMBER_LAYERS = [[1, 1, 7], [0.7, 0.8, 6], [0.4, 0.55, 5]];

function create(o) {
  const F = fit(o.palette, 9), H = hotFirst(F), REACH = o.reach, R = new Rng(o.seed), floor = () => 0, S = o.seed * 7;
  const ps = new Particles({ rng: R, ground: floor, sparks: [H[1], H[2], H[4], H[5]] }), lights = new Lights();
  const GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25);
  const front = (t) => REACH * ease.outCubic(clamp((t - CHARGE) / SPREAD));
  const reachedAt = (d) => CHARGE + SPREAD * (1 - Math.cbrt(1 - Math.min(1, d / REACH)));
  // the flames: rings of tongues on the floor, each lit as the front reaches it, flaring then burning down
  const sites = [];
  for (let r = 10; r <= REACH; r += 9) {
    const per = TAU * Math.sqrt((r * r + (r * SY) ** 2) / 2), n = Math.max(5, Math.round(per / 8.5));
    for (let k = 0; k < n; k++) {
      const a = ((k + R.range(0.15, 0.85)) / n) * TAU, rr = r + R.range(-3, 3), q = Math.min(1, rr / REACH);
      // near the middle they flash and go out as the front passes; the rim, where it stops, burns on and down
      sites.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr * SY, back: Math.sin(a) < 0, t0: reachedAt(rr) + R.range(0, 0.04), life: (0.3 + 1.0 * q * q) * R.range(0.85, 1.2), h: R.range(9, 15) * (0.6 + 0.55 * q), w: R.range(1.8, 2.7) * (0.75 + 0.3 * q), n: R.int(0, 1e5) });
    }
  }
  sites.sort((a, b) => a.y - b.y);
  let t = 0, burst = false;

  const flames = (p, back) => {
    const NZ = (rate, seed = 0, off = 0) => noise(t * rate + off, seed);
    for (const s of sites) {
      if (s.back !== back) continue;
      const age = t - s.t0;
      if (age < 0 || age > s.life) continue;
      const u = age / s.life, rise = ease.outBack(clamp(age / 0.08), 2), fade = 1 - Math.pow(Math.max(0, (u - 0.1) / 0.9), 1.3);
      const h = s.h * rise * fade * (0.85 + 0.15 * noise(t * 3.3, s.n)) * (1 + 0.5 * Math.max(0, noise(t * 2.6, s.n + 70) - 0.55));
      if (h < 1) continue;
      // fresh flames white-hot, then cooling as they burn down; the far ones a step dimmer
      const L = u < 0.3 ? (back ? BACK_LAYERS : LAYERS) : u < 0.65 ? BACK_LAYERS : EMBER_LAYERS;
      flameTongue(p, s.x, s.y, h, s.w * (0.6 + 0.4 * fade), NZ(2.2, s.n + 40) * 1.5 - s.x * 0.02, NZ, s.n, H, L);
    }
  };
  // the scorch: a translucent stain of soot where the fire has crossed, sparse embers cooling in it
  const scorch = (p) => {
    const fr = front(t), end = 1 - smooth(meta.duration - 1.2, meta.duration - 0.15, t);
    if (fr < 1 || end <= 0) return;
    for (let y = Math.floor(-fr * SY); y <= Math.ceil(fr * SY); y++)
      for (let x = Math.floor(-fr); x <= Math.ceil(fr); x++) {
        const d = Math.hypot(x + 0.5, (y + 0.5) / SY);
        if (d > fr) continue;
        const since = t - reachedAt(d), h = rand(x, y, S), hot = 1 - since / (1.2 + h * 0.9);
        if (hot > 0 && h < 0.03 + 0.06 * hot) {
          p.px(x, y, hot > 0.7 ? H[3] : hot > 0.45 ? H[4] : hot > 0.2 ? H[5] : H[6]);
          p.light(x, y, H[4], 0.3 * hot);
          continue;
        }
        p.blend(x, y, h < 0.5 ? SOOT : SOOT2, Math.min(1, since * 3) * (0.55 - (d / REACH) * 0.25) * end);
      }
  };
  const ring = (p, back) => {
    const k = (t - CHARGE) / (SPREAD + 0.1);
    if (k < 0 || k >= 1) return;
    band(p, 0, 0, front(t) + 1.5, SY, Math.max(1.5, 6 * (1 - k)), k < 0.75 ? 1 : (1 - k) / 0.25, [H[6], H[4], H[2], H[1]], (g) => Math.sin(g) < 0 === back, k < 0.12);
  };

  return {
    update(dt) {
      t += dt;
      // the charge: streaks of fire spiral in to the feet, heat building there
      if (t < CHARGE - 0.05 && R.chance(0.9 * dt * 60)) {
        const a = R.range(0, TAU), d = R.range(26, 54), T = R.range(0.18, 0.26), v = (d * 3) / (Math.exp(3 * T) - 1);
        const x = Math.cos(a) * d, y = Math.min(-2, -6 + Math.sin(a) * d * 0.45), l = Math.hypot(x, y + 4) || 1;
        ps.spawn(P.STREAK, x, y, (-x / l) * v, ((-4 - y) / l) * v, T, R.chance(0.5) ? H[2] : H[3]);
      }
      if (t < CHARGE && R.chance(0.5 * dt * 60 * (t / CHARGE))) ps.spawn(P.FIRE, R.range(-4, 4), -1, R.range(-8, 8), -R.range(20, 40), R.range(0.12, 0.24), 0, R.range(1, 2.2));
      if (!burst && t >= CHARGE) {
        burst = true;
        lights.add(0, -18, 64, WARM, 0.85, 0.5);
        lights.add(0, -6, 30, WHITE, 0.8, 0.08);
        for (let i = 0; i < 40; i++) {
          const a = R.range(0, TAU), sp = R.range(80, 220);
          ps.spawn(P.SPARK, Math.cos(a) * 3, -2, Math.cos(a) * sp, Math.sin(a) * sp * 0.4 - R.range(40, 120), R.range(0.2, 0.5));
        }
      }
      // fire shed off the burning ring: puffs that rise and some cool into smoke, and embers
      if (t > CHARGE && t < CHARGE + SPREAD + 1.2)
        for (let i = 0; i < 3; i++) {
          if (!R.chance(0.75 * dt * 60)) continue;
          const s = R.pick(sites), age = t - s.t0;
          if (age < 0 || age > s.life * 0.7) continue;
          ps.spawn(P.FIRE, s.x + R.range(-1, 1), s.y - s.h * 0.6, R.range(-5, 5), -R.range(20, 40), R.range(0.2, 0.4), 0, R.range(1.2, 2.4), 0, R.chance(0.5) ? PF.SMOKES | (s.back ? PF.BACK : 0) : s.back ? PF.BACK : 0);
          if (R.chance(0.12)) ps.spawn(P.EMBER, s.x, s.y - s.h * 0.5, R.range(-15, 15), -R.range(30, 70), R.range(0.6, 1.3), H[3], 1, 0, s.back ? PF.BACK : 0);
        }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      scorch(p);
      ring(p, true);
      flames(p, true);
      simDraw(p, ps, H, "back");
      // light on the floor running with the front
      const fr = front(t), k = t < CHARGE ? 0 : 1 - smooth(CHARGE + SPREAD, CHARGE + SPREAD + 1.4, t);
      if (k > 0) for (let i = 0; i < 16; i++) p.glow(Math.cos((i / 16) * TAU) * fr, Math.sin((i / 16) * TAU) * fr * SY - 3, 16, GLOW, 0.2 * k);
    },
    draw(p) {
      ring(p, false);
      flames(p, false);
      simDraw(p, ps, H, "front");
      // the charge glowing at the feet, then the white flash as it goes
      if (t < CHARGE) p.glow(0, -3, 8 + 22 * (t / CHARGE), GLOW, 0.6 * (t / CHARGE));
      if (t >= CHARGE && t < CHARGE + 0.1) {
        const k = 1 - (t - CHARGE) / 0.1;
        p.ellipse(0, -1, 14 * (0.6 + 0.4 * k), 4, H[2]);
        p.ellipse(0, -1, 9 * (0.6 + 0.4 * k), 2.6, k > 0.5 ? WHITE : H[1]);
      }
      const k = smooth(CHARGE - 0.05, CHARGE, t) * (1 - smooth(CHARGE + SPREAD * 0.5, CHARGE + SPREAD + 1.2, t));
      if (k > 0) p.glow(0, -6, 92, GLOW, 0.3 * k);
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.act = act; __e.create = create;
};

__M["fx/fire/_lib.js"] = function (__e) {
// Shared by the fire effects (the leading _ keeps the tools from listing it as an effect).
// Flame tongues, licks, flame puffs that cool into smoke, embers and sparks, with their motion in closed form so
// looping effects can draw them from t alone and stay seamless. The tongue, lick, puff, smoke, ember and spark
// recipes are adapted from Sprite Fusion's open-source fire (https://www.spritefusion.com/pixel-art-vfx/fire),
// MIT License, Copyright (c) 2026 Hugo Duprez.

const {rand, rng, wrap, noise, mix, hex, clamp, WHITE, SMOKE_RAMP, P, PF} = __req("core/index.js");

/** Smooth value noise in [-1, 1] that repeats every `period` cells (a whole number). */
function pnoise(x, period, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = rand(wrap(i, period), seed), b = rand(wrap(i + 1, period), seed);
  return (a + (b - a) * u) * 2 - 1;
}

/**
 * Noise for a loop D seconds long: N(tt, rate, seed, off) wobbles about `rate` times a second and is the same at
 * tt and tt + D. Pass D = 0 for one-shots (plain noise, no repeat).
 */
function noiseFor(D) {
  if (!D) return (tt, rate, seed = 0, off = 0) => noise(tt * rate + off, seed);
  return (tt, rate, seed = 0, off = 0) => {
    const P = Math.max(1, Math.round(rate * D));
    return pnoise((tt / D) * P + off, P, seed);
  };
}

/**
 * Seamless particles for a loop D seconds long: count particles, each born at its own phase and reborn every D.
 * make(r, i) builds particle i from its own rng (the same every frame) and returns it with a .life (which may
 * be longer than D); draw(q, age, i) is called for every live copy.
 */
function looped(t, D, count, seed, make, draw) {
  for (let i = 0; i < count; i++) {
    const r = rng(seed, i), born = r.next() * D, q = make(r, i);
    for (let age = wrap(t - born, D); age < q.life; age += D) draw(q, age, i);
  }
}

/** Hugo's flicker, 0.74 to 1: a slow breath and a fast crackle. N(rate, seed) at the current time. */
const flicker = (N, s = 0) => 0.74 + 0.16 * N(7.3, 1 + s) + 0.1 * N(19, 2 + s);

/** A fire ramp hot-first (H[0] white .. H[8] smouldering) from a palette dark to bright, any length. */
const hotFirst = (F) => [...F].reverse();

/** Tongue layers [width share, height share, step of the hot-first ramp]: red rim, orange, yellow, white heart. */
const LAYERS = [[1, 1, 6], [0.76, 0.86, 4], [0.54, 0.68, 2], [0.3, 0.42, 0]];

/** Layers for big tongues: more orange and a smaller white heart, so the light doesn't wash them out. */
const BIG_LAYERS = [[1, 1, 6], [0.8, 0.9, 5], [0.62, 0.78, 4], [0.44, 0.6, 3], [0.26, 0.4, 1], [0.12, 0.22, 0]];

/** The same layers a step cooler, for flames further back: dark red rim, deep orange, gold, yellow. */
const BACK_LAYERS = [[1, 1, 7], [0.76, 0.86, 5], [0.54, 0.68, 3], [0.3, 0.42, 2]];

/**
 * A flame tongue standing at (x, y), h tall, w its half-width at the base, its tip swept sx px sideways: a red
 * rim round orange round yellow round a white heart, every row's width and centre jittered by noise so the
 * edges crackle. N(rate, seed, off) is the effect's noise at this frame; n seeds this tongue. H: hot-first ramp.
 * jit: how far the edges crackle (px); wob: how far the tip wanders (px).
 */
function flameTongue(p, x, y, h, w, sx, N, n, H, layers = LAYERS, jit = 0.5, wob = 1.1) {
  if (h < 1) return;
  for (const [lw, lh, ri] of layers) {
    const L = h * lh, c = H[ri];
    for (let r = 0; r <= L; r++) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const cx = x + sx * u * u * lh + N(4, n + 7, r * 0.2) * u * wob, Y = Math.round(y - r);
      for (let px = Math.round(cx - half), x1 = Math.round(cx + half); px <= x1; px++) p.px(px, Y, c);
    }
  }
}

/**
 * The same tongue lying along any direction (ux, uy) from its root (x, y): for jets, breath and comet tails.
 * len long, w half-width at the root, bend: px the tip is swept sideways (to the left of the direction).
 */
function flameBlade(p, x, y, ux, uy, len, w, bend, N, n, H, layers = LAYERS, jit = 0.5, wob = 1.1) {
  if (len < 1) return;
  const nx = -uy, ny = ux;
  for (const [lw, lh, ri] of layers) {
    const L = len * lh, c = H[ri];
    for (let r = 0; r <= L; r += 0.5) {
      const u = r / Math.max(1, L);
      const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + N(9, n, r * 0.45) * jit;
      if (half < 0.3) continue;
      const off = bend * u * u * lh + N(4, n + 7, r * 0.2) * u * wob, cx = x + ux * r + nx * off, cy = y + uy * r + ny * off;
      for (let q = -half; q <= half; q += 0.5) p.px(cx + nx * q, cy + ny * q, c);
    }
  }
}

/** A solid disc drawn straight in screen space (fast; a disc looks the same mirrored or turned). */
function solid(p, x, y, r, c) {
  if (r < 0.6) return p.px(x, y, c);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.put(sx, sy, c, 1);
  }
}

/** A translucent disc in screen space: smoke and haze. */
function soft(p, x, y, r, c, a) {
  if (a <= 0.004) return;
  if (r < 0.5) return p.blend(x, y, c, a);
  const cx = p.toX(x, y), cy = p.toY(x, y), r2 = r * r;
  for (let sy = Math.floor(cy - r); sy <= Math.ceil(cy + r); sy++) {
    const dy = sy + 0.5 - cy, s2 = r2 - dy * dy;
    if (s2 < 0) continue;
    const s = Math.sqrt(s2);
    for (let sx = Math.ceil(cx - s - 0.5); sx <= Math.floor(cx + s - 0.5); sx++) p.blendPx(sx, sy, c, a);
  }
}

/**
 * A ball of flame with life left k (1 new, 0 gone) cooling down the hot-first ramp H as it ages: a darker rim,
 * a lit core up and to the left, a little tongue on top, a hot heart while it's young, and its light.
 * frac (0..1) nudges how hot it starts. (tx, ty): which way its tongue points (up, unless it's streaming).
 */
function firePuff(p, x, y, k, size, frac, H, glowK = 0.18, tx = 0, ty = -1) {
  const age = 1 - k, n = H.length, heat = Math.min(0.999, Math.pow(age, 0.62) + frac * 0.1);
  const idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
  const r = size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = H[idx];
  if (idx >= n - 2) return soft(p, x, y, r, c, Math.min(1, k * 3) * 0.85);
  solid(p, x, y, r, H[Math.min(n - 1, idx + 2)]);
  if (r > 1.6 && ty > -0.99) solid(p, x + tx * r * 1.5, y + ty * r * 1.5, r * 0.3, H[Math.min(n - 1, idx + 1)]);
  solid(p, x - r * 0.16, y - r * 0.22, r * 0.78, c);
  if (r > 1.6) solid(p, x + tx * r * 0.9, y + ty * r * 0.9, r * 0.42, c);
  if (idx <= 3 && r > 1.8) solid(p, x - r * 0.28, y - r * 0.34, r * 0.36, H[Math.max(0, idx - 1)]);
  if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, glowK * k);
}

/** A lick: a blob of flame torn off a tongue's tip, a red rim round a yellow heart, shrinking as it rises. */
function lick(p, x, y, k, s, H) {
  const r = s * (0.4 + 0.6 * k);
  solid(p, x, y, r + 0.6, k > 0.5 ? H[5] : H[6]);
  if (k > 0.35) solid(p, x, y - 0.3, r * 0.6, k > 0.7 ? H[2] : H[4]);
}

const rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];

/**
 * A puff of smoke with life left k: three soft discs (a body, a denser core sitting low, a lit cap while it's
 * young), swelling and thinning. col tints it (0 for plain smoke); big for slower, fuller smoke.
 */
function smokePuff(p, x, y, k, size, col = 0, big = false, aMul = 1) {
  const age = 1 - k;
  const r = size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
  const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58) * aMul;
  const c = col ? mix(col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
  soft(p, x, y, r, c, a * 0.45);
  soft(p, x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (age < 0.5) soft(p, x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
}

/**
 * An ember with life left k: a hot pixel cooling through cols [hot, warm, cool, rim], flickering out near the
 * end (ph: its flicker phase), with its own light. Big ones (size 2) are a little cross with a darker rim.
 */
function ember(p, x, y, k, size, cols, ph) {
  if (k < 0.25 && Math.sin(ph) < 0) return;
  const c = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  if (size >= 2) {
    const rim = k > 0.45 ? cols[2] : cols[3];
    p.px(x - 1, y, rim), p.px(x + 1, y, rim), p.px(x, y - 1, rim), p.px(x, y + 1, rim);
    p.px(x, y, c);
    p.glow(x, y, 8, c, 0.4 * k);
    return;
  }
  p.px(x, y, c);
  if (size > 1.4) p.px(x, y + 1, cols[3]);
  p.glow(x, y, 3 + size, c, 0.35 * k);
}

/** A spark: a streak stretched along its velocity, a hot head and a cooler tail, and a point of light. */
function spark(p, x, y, vx, vy, k, cols) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len = Math.min(9, 1 + sp * 0.022);
  const head = k > 0.6 ? cols[0] : k > 0.3 ? cols[1] : cols[2];
  p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : cols[cols.length - 1]);
  p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
  p.glow(x, y, 3, head, 0.45 * k);
}

function along(x, v, a, k, t) {
  if (k <= 0) return [x + v * t + 0.5 * a * t * t, v + a * t];
  const e = Math.exp(-k * t), vt = a / k;
  return [x + vt * t + ((v - vt) * (1 - e)) / k, vt + (v - vt) * e];
}

/**
 * Where a body is t seconds after launch from (x, y) at (vx, vy), under acceleration (ax, ay) px/s² and linear
 * drag kx, ky (1/s): [x, y, vx, vy]. The particle kinds' own numbers: FIRE (0, -95, 5, 3.2), SMOKE
 * (0, -16, 1.6, 1.2), EMBER (0, -30, 1.6, 1.6), SPARK (0, 427, 2.2, 2.2).
 */
function drift(x, y, vx, vy, t, ax, ay, kx, ky) {
  const X = along(x, vx, ax, kx, t), Y = along(y, vy, ay, ky, t);
  return [X[0], Y[0], X[1], Y[1]];
}

/** A spark's flight: falls, drags, and bounces off the floor at y = floor, losing speed each time. */
function sparkAt(x, y, vx, vy, t, floor = 0, g = 427, k = 2.2) {
  let s = [x, y, vx, vy], left = t;
  for (let b = 0; b < 3; b++) {
    const e = drift(s[0], s[1], s[2], s[3], left, 0, g, k, k);
    if (e[1] < floor || s[1] >= floor) return e;
    let lo = 0, hi = left;
    for (let i = 0; i < 16; i++) {
      const m = (lo + hi) / 2;
      if (drift(s[0], s[1], s[2], s[3], m, 0, g, k, k)[1] < floor) lo = m;
      else hi = m;
    }
    const c = drift(s[0], s[1], s[2], s[3], hi, 0, g, k, k);
    s = [c[0], floor - 0.25, c[2] * 0.7, -Math.abs(c[3]) * 0.45];
    left -= hi;
  }
  const e = drift(s[0], s[1], s[2], s[3], left, 0, g, k, k);
  return e[1] < floor ? e : [e[0], floor - 0.25, e[2], 0];
}

/** A pool of light on the floor: an ellipse of glow, k at its middle falling to 0 at its rim. */
function floorLight(p, x, y, rx, ry, c, k) {
  if (k <= 0.004 || rx < 1 || ry < 0.5) return;
  p.shade(x - rx, y - ry, x + rx, y + ry, (px, py, out) => {
    const dx = (px - x) / rx, dy = (py - y) / ry, d = dx * dx + dy * dy;
    if (d >= 1) return;
    const f = 1 - Math.sqrt(d);
    out.l = c;
    out.k = f * f * k;
  });
}

/**
 * A core Particles system drawn with its flame puffs recoloured down the hot-first ramp H (the core draws them
 * in its own fire colours): smoke and back particles, then the flames, then sparks and the rest on top.
 */
function simDraw(p, ps, H, layer) {
  const all = ps.list, rest = [], fire = [];
  for (const q of all) (q.k === P.FIRE ? fire : rest).push(q);
  const puffs = (back) => {
    for (const q of fire) if (q.delay <= 0 && !!(q.flag & PF.BACK) === back) firePuff(p, q.x, q.y, q.life / q.max, q.size, q.seed % 1, H);
  };
  ps.list = rest;
  if (layer !== "front") ps.draw(p, "back"), puffs(true);
  if (layer !== "back") puffs(false), ps.draw(p, "front");
  ps.list = all;
}

const SMOKE1 = hex("#5b5566");

/**
 * A fire for loops, drawn from t alone. Tongues T: [[dx, dy, height share, half-width, back row?], ...] from the
 * base (o.x, o.y), back row first then outer to inner; licks torn off their tips, flame puffs that burn out into
 * smoke, a smoke plume curling off with the draught, embers, and the fire's light.
 * o: { H, D, NL (noiseFor(D)), S (seed), height, lean, rates per second: puffs and licks (per tongue), smoke,
 * embers; spread (how wide embers and smoke leave), glow (light strength), glowR, mid() (called after the
 * tongues, before what flies off them: draw what the fire burns out of there) }. Wide tongues get BIG_LAYERS.
 * Returns { tip(i, tt), fl (this frame's flicker) }.
 */
function burn(p, t, T, o) {
  const { H, D, NL, S } = o, HC = o.height, X = o.x ?? 0, Y = o.y ?? 0, W = o.spread ?? 6, G = o.glow ?? 1;
  const N = (rate, seed = 0, off = 0) => NL(t, rate, seed, off);
  const fla = (tt) => 0.74 + 0.16 * NL(tt, 7.3, S + 1) + 0.1 * NL(tt, 19, S + 2), fl = fla(t);
  const SMOKE = mix(SMOKE1, H[6], 0.25), EMB = [H[1], H[2], H[4], H[6]], GLOW = mix(mix(H[3], H[4], 0.5), WHITE, 0.25);
  const R = rng(S, 77), count = (rate) => Math.round(rate * D);
  const TT = T.map(([dx, dy, h, w, back], i) => ({ dx: dx + R.range(-0.3, 0.3), y: dy, h: 2 + HC * h * R.range(0.92, 1.08), w: w * R.range(0.92, 1.08), back, env: h, n: (S * 7 + i) * 13 }));
  const lean = (tt) => NL(tt, 0.67, S + 90) * (o.lean ?? 0.1);
  const height = (i, tt) => {
    const { h, n } = TT[i], leap = Math.max(0, NL(tt, 2.6, n + 70) - 0.55) * 1.4;
    return (h + 0.25 * h * NL(tt, 3.3, n) + h * leap) * (0.9 + 0.1 * fla(tt));
  };
  const sweep = (i, tt, h) => NL(tt, 2.2, TT[i].n + 40) * (1 + h * 0.08) + lean(tt) * h * 0.9 - clamp(TT[i].dx * 0.3, -2.5, 2.5);
  const tip = (i, tt) => {
    const h = height(i, tt);
    return [X + TT[i].dx + sweep(i, tt, h) * 0.85, Y + TT[i].y - h * 0.88 + 3, h];
  };
  const tongueAt = (i) => {
    const { dx, y, w, n, back } = TT[i], h = height(i, t);
    flameTongue(p, X + dx, Y + y, h, w, sweep(i, t, h), N, n, H, back ? BACK_LAYERS : w > 2.2 ? BIG_LAYERS : LAYERS, 0.5, 1.1 + h * 0.04);
  };

  // the plume: each puff keeps the sway the plume had when it left, so the wiggle climbs it
  looped(t, D, count(o.smoke ?? 12), S + 300, (r) => ({ x: r.range(-W, W) * 0.7, y: -HC * 0.8 - r.range(0, 6), vx: r.range(-2, 2), vy: -r.range(10, 17), life: r.range(...(o.smokeLife ?? [1.6, 2.6])), s: r.range(0.7, 1.1) * (o.smokeSize ?? 3) }), (q, age) => {
    const [x, y] = drift(q.x, q.y, q.vx, q.vy, age, o.wind ?? 3, -20, 1.6, 1);
    smokePuff(p, X + x + NL(t - age, 0.8, S + 60) * (1.5 + 2.5 * age), Y + y, 1 - age / q.life, q.s, SMOKE);
  });
  // flame puffs shed from the tips
  const puffs = [];
  looped(t, D, TT.length * count(o.puffs ?? 8), S + 200, (r, j) => {
    const i = j % TT.length, fire = r.range(0.14, 0.3), smokes = r.chance(0.45);
    return { i, fire, smokes, sl: r.range(0.8, 1.4), ox: r.range(-1, 1), oy: r.range(0, 4), vx: r.range(-4, 4), vy: -r.range(15, 30), s: r.range(0.8, 1.6) * (0.8 + 0.6 * TT[i].env), f: r.next(), life: fire + (smokes ? 1.4 : 0) };
  }, (q, age) => {
    const [tx, ty] = tip(q.i, t - age);
    const [x, y, vx, vy] = drift(tx + q.ox, ty + q.oy, q.vx, q.vy, Math.min(age, q.fire), 0, -95, 5, 3.2);
    if (age < q.fire) return puffs.push([x, y, 1 - age / q.fire, q.s, q.f]);
    if (age - q.fire > q.sl) return;
    const [sx, sy] = drift(x, y, vx * 0.6, vy * 0.6 - 6, age - q.fire, o.wind ?? 3, -16, 1.6, 1.2);
    smokePuff(p, sx, sy, 1 - (age - q.fire) / q.sl, q.s * 0.7, 0);
  });
  for (let i = 0; i < TT.length; i++) if (TT[i].back) tongueAt(i);
  for (let i = 0; i < TT.length; i++) if (!TT[i].back) tongueAt(i);
  o.mid?.(fl);
  // licks torn off the tips, rising and shrinking
  looped(t, D, TT.length * count(o.licks ?? 4), S + 220, (r, j) => ({ i: j % TT.length, vx: r.range(-3, 3), vy: -r.range(12, 22), s: r.range(0.9, 1.6) * (0.8 + 0.5 * TT[j % TT.length].env), life: 0.26 }), (q, age) => {
    const [tx, ty] = tip(q.i, t - age);
    lick(p, tx + q.vx * age, ty - 2 + q.vy * age, 1 - age / q.life, q.s, H);
  });
  for (const [x, y, k, s, f] of puffs) firePuff(p, x, y, k, s, f, H);
  // embers carried up by the heat, wandering and cooling
  looped(t, D, count(o.embers ?? 8), S + 500, (r) => ({ x: r.range(-W, W), y: -r.range(HC * 0.3, HC * 0.8), vx: r.range(-15, 15), vy: -r.range(25, 60), life: r.range(1.1, 2.4), s: r.chance(0.15) ? 2 : r.range(1, 1.6), a: r.range(0, 6.3), b: r.range(0, 6.3) }), (q, age) => {
    const [x, y] = drift(q.x, q.y, q.vx, q.vy, age, 0, -30, 1.6, 1.6);
    ember(p, X + x + 7 * (Math.sin(age * 2.3 + q.a) - Math.sin(q.a)), Y + y + 2 * (Math.sin(age * 3 + q.b) - Math.sin(q.b)), 1 - age / q.life, q.s, EMB, age * 40 + q.a);
  });
  // light: a broad warm wash, lights on the flames, a hot heart at the base
  if (G > 0) {
    const R1 = o.glowR ?? 46, lx = X + lean(t) * 12;
    p.glow(lx, Y - HC * 0.35, R1 * 1.5, GLOW, 0.22 * fl * G);
    p.glow(lx, Y - HC * 0.75, R1, GLOW, 0.34 * fl * G);
    p.glow(X, Y - HC * 0.2, R1 * 0.32, H[2], 0.2 * fl * G);
    p.glow(X, Y - 2, 8, H[0], 0.14 * fl * G);
  }
  return { tip, fl };
}

__e.pnoise = pnoise; __e.noiseFor = noiseFor; __e.looped = looped; __e.flicker = flicker; __e.hotFirst = hotFirst; __e.LAYERS = LAYERS; __e.BIG_LAYERS = BIG_LAYERS; __e.BACK_LAYERS = BACK_LAYERS; __e.flameTongue = flameTongue; __e.flameBlade = flameBlade; __e.solid = solid; __e.soft = soft; __e.firePuff = firePuff; __e.lick = lick; __e.smokePuff = smokePuff; __e.ember = ember; __e.spark = spark; __e.drift = drift; __e.sparkAt = sparkAt; __e.floorLight = floorLight; __e.simDraw = simDraw; __e.burn = burn;
};

__M["fx/holy/feather-burst.js"] = function (__e) {
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, WHITE, hex, mix} = __req("core/index.js");
const {Feathers} = __req("fx/holy/_lib.js");

const meta = {
  name: "Feather burst",
  desc: "A white puff pops and throws feathers that brake hard, then rock from side to side as they sink and fade, with down drifting after them.",
  tags: ["holy", "feather", "burst", "poof", "angel", "bird", "one-shot"],
  size: [160, 160],
  origin: [80, 60],
  duration: 3,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: ["#4a4560", "#7a7494", "#aaa5c2", "#d6d3e6", "#f4f3fa", "#ffffff"], glow: "#fff0c0", seed: 4 },
};

function create(o) {
  const F = fit(o.palette, 6), G = hex(o.glow), R = new Rng(o.seed);
  const ps = new Particles({ rng: R, ground: () => Infinity, sparks: [WHITE, F[4], F[3], F[2]] });
  const lights = new Lights(), loose = new Feathers(R, 1e6);
  // the puff: soft lobes thrown out from the pop, swelling and thinning
  const lobes = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * TAU + R.range(-0.25, 0.25), d = R.range(5, 14);
    return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, r0: R.range(2.5, 4), r1: R.range(6, 9.5), life: R.range(0.45, 0.8) };
  });
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU + R.range(-0.15, 0.15), sp = R.range(110, 230), up = Math.sin(a) < 0 ? 0.7 : 0.9;
    loose.add({ x: Math.cos(a) * 3, y: Math.sin(a) * 3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * up - 20, a: a + R.range(-0.5, 0.5), len: R.range(10, 14), wid: R.range(2.6, 3.4), life: R.range(1.9, 2.6), delay: R.range(0, 0.03), sink: R.range(26, 38), amp: R.range(8, 13) });
  }
  // small feathers and down, slower
  for (let i = 0; i < 10; i++) {
    const a = R.range(0, TAU), sp = R.range(50, 130);
    loose.add({ x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, a: R.range(0, TAU), len: R.range(6, 8), wid: R.range(1.8, 2.2), life: R.range(1.6, 2.4), back: true, sink: R.range(18, 28) });
  }
  for (let i = 0; i < 26; i++) {
    const a = R.range(0, TAU), sp = R.range(30, 140);
    ps.spawn(P.FLAKE, R.range(-3, 3), R.range(-3, 3), Math.cos(a) * sp, Math.sin(a) * sp - 15, R.range(1.4, 2.6), R.chance(0.6) ? WHITE : F[4], R.range(0.6, 1.6));
  }
  for (let i = 0; i < 10; i++) {
    const a = R.range(0, TAU), sp = R.range(60, 160);
    ps.spawn(P.STAR, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.3, 0.6), R.chance(0.5) ? WHITE : G, R.range(0.8, 2.2));
  }
  lights.add(0, 0, 50, G, 0.75, 0.45);
  lights.add(0, 0, 20, WHITE, 0.7, 0.1);
  let t = 0;

  function puff(p) {
    for (const l of lobes) {
      const u = t / l.life;
      if (u >= 1) continue;
      const e = ease.outCubic(u), x = l.x * (0.4 + e * 1.3), y = l.y * (0.4 + e * 1.3) - u * 5;
      const r = (l.r0 + (l.r1 - l.r0) * ease.outCubic(Math.min(1, u * 3))) * (1 - ease.inQuad(u));
      if (r < 0.6) continue;
      p.circle(x, y, r + 0.8, F[2]);
      p.circle(x, y, r, (d, a) => (d > 0.55 && Math.sin(a + 0.8) > 0.3 ? F[3] : d < 0.45 && Math.sin(a + 0.8) < -0.2 ? WHITE : F[4]));
    }
  }

  return {
    update(dt) {
      t += dt;
      // feathers catch the light as they turn
      if (t > 0.3 && t < 2.2 && loose.count && R.chance(0.14)) {
        const q = R.pick(loose.list);
        if (q.delay <= 0) ps.spawn(P.STAR, q.x + R.range(-2, 2), q.y + R.range(-1, 1), 0, 0, R.range(0.2, 0.4), R.chance(0.5) ? WHITE : G, R.range(1, 2.2));
      }
      ps.update(dt);
      loose.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      loose.draw(p, F, "back");
      ps.draw(p, "back");
      puff(p);
    },
    draw(p) {
      // the pop: a white flash and a ring of air
      if (t < 0.07) p.circle(0, 0, 9 * (1 - t / 0.14), WHITE);
      if (t < 0.25) {
        const u = t / 0.25;
        p.ring(0, 0, 6 + 24 * ease.outCubic(u), Math.max(1, 2.5 * (1 - u)), (v) => (v > 0.5 ? WHITE : mix(F[4], G, 0.4)), 1.1 - u);
      }
      if (t < 0.2) sparkle(p, 0, 0, 10 * (1 - t / 0.2), WHITE, G, 0.6);
      // the burst's warmth lingers a moment
      p.glow(0, 4, 46, G, 0.28 * (1 - smooth(0, 1.3, t)));
      loose.draw(p, F, "front");
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/holy/_lib.js"] = function (__e) {
// The plus sign's lit and shaded bevel is adapted from Sprite Fusion's open-source heal (https://www.spritefusion.com/pixel-art-vfx/heal),
// MIT License, Copyright (c) 2026 Hugo Duprez.
// Shared by the holy effects: gold, green and ash ramps, the character's silhouette and recolors, floor ovals,
// feathers of light (drawn, and simulated as they rock and sink) and plus signs.
// Files starting with _ are helpers, not effects.

const {WHITE, TAU, clamp, smooth, luma} = __req("core/index.js");

/** Holy gold, dark to bright: a plum shadow, rust, amber, gold, pale gold, cream, white. */
const GOLD = ["#3b1d2a", "#7a3a2c", "#c4652e", "#f0a040", "#ffd25e", "#fff0a0", "#fffbe0", "#ffffff"];
/** Healing green, warm: deep pine, leaf, spring green, a yellow-green highlight, cream. */
const GREEN = ["#0e2a24", "#14472f", "#1d6e3a", "#2f9a45", "#5cc654", "#a0e46c", "#dcffb4", "#ffffff"];
/** Ash: the colour of the fallen, a cool grey-violet, dark to light. */
const ASH = ["#16131c", "#26222f", "#3a3546", "#524c5e", "#6e6878", "#8c8796"];

// ---- the character

const SHAPES = new WeakMap();
/**
 * The actor's silhouette as local points, cached per mask: edge (its own rim pixels), out (the 1 px ring just
 * outside it), at(x, y) (inside?), top and bottom (y of the first row and one past the last).
 */
function shapeOf(A) {
  let s = SHAPES.get(A.mask);
  if (s && s.x === A.x && s.y === A.y) return s;
  const m = A.mask, inside = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.data[j * m.w + i] > 0;
  const edge = [], out = [];
  for (let j = -1; j <= m.h; j++)
    for (let i = -1; i <= m.w; i++) {
      const nb = inside(i - 1, j) + inside(i + 1, j) + inside(i, j - 1) + inside(i, j + 1);
      if (inside(i, j)) {
        if (nb < 4) edge.push([A.x + i, A.y + j]);
      } else if (nb) out.push([A.x + i, A.y + j]);
    }
  s = { x: A.x, y: A.y, edge, out, top: A.y, bottom: A.y + m.h, at: (x, y) => inside(Math.floor(x) - A.x, Math.floor(y) - A.y) };
  SHAPES.set(A.mask, s);
  return s;
}

/**
 * Draw the actor's own pixels recolored: fn(c, x, y) gives the new color for its pixel c at (x, y), or 0 to
 * leave that pixel alone (the character shows through). a: alpha, or a function of (x, y).
 */
function recolor(p, A, fn, a = 1) {
  const m = A.mask, P = A.pixels, fa = typeof a === "function";
  if (!P) return;
  for (let j = 0; j < m.h; j++)
    for (let i = 0; i < m.w; i++) {
      const c = P[j * m.w + i];
      if (!c) continue;
      const x = A.x + i, y = A.y + j, n = fn(c, x, y);
      if (n) p.dot(x, y, n, fa ? a(x, y) : a);
    }
}

/** A color mapped onto a ramp by its brightness (a tint that keeps the character's shading). */
const toneOf = (R, c, lift = 0) => R[clamp(Math.floor((luma(c) * 1.1 + lift) * R.length), 0, R.length - 1)];

// ---- floor and ovals

/**
 * A 1 px oval (a ring on a tilted plane): centre (cx, cy), radii rx, ry. c and a may be functions of the angle
 * g round it (sin(g) > 0 is the near side). keep(g) picks the part to draw.
 */
function oval(p, cx, cy, rx, ry, c, a = 1, keep = null) {
  if (rx < 0.5) return;
  const n = Math.ceil(Math.max(rx, ry) * TAU * 1.5) + 6, fc = typeof c === "function", fa = typeof a === "function";
  for (let j = 0; j < n; j++) {
    const g = (j / n) * TAU;
    if (keep && !keep(g)) continue;
    p.dot(cx + Math.cos(g) * rx, cy + Math.sin(g) * ry, fc ? c(g) : c, fa ? a(g) : a);
  }
}
const FAR = (g) => Math.sin(g) < 0;
const NEAR = (g) => Math.sin(g) >= 0;

// ---- feathers

/**
 * A feather of light from its quill at (x, y) pointing along ang, len px long, with a rounded tip; the
 * trailing vane, wid px wide, falls on side (1: clockwise of the shaft, -1: the other way), the leading vane
 * is under half that. R: a ramp, dark to bright (6+ steps). a: alpha. hot 0..1 whitens it (a flash). A white
 * shaft, a lit leading rim, a warm dark trailing edge that parts it from the next feather, a body that cools
 * from cream at the quill to gold, and a tip that thins into light.
 */
function feather(p, x, y, ang, len, wid, R, a = 1, side = 1, hot = 0, quill = 0.02) {
  if (len < 1.5 || a <= 0.02) return;
  const n = R.length, ca = Math.cos(ang), sa = Math.sin(ang), x1 = x + ca * len, y1 = y + sa * len, pad = wid + 1.2, h = hot > 0.5;
  const edge = h ? R[n - 3] : R[n - 5], lead = h ? WHITE : R[n - 2], B = h ? [WHITE, WHITE, R[n - 2]] : [R[n - 2], R[n - 3], R[n - 4]];
  p.each(Math.min(x, x1) - pad, Math.min(y, y1) - pad, Math.max(x, x1) + pad, Math.max(y, y1) + pad, (px, py, sx, sy) => {
    const dx = px - x, dy = py - y, u = (dx * ca + dy * sa) / len;
    if (u < 0 || u > 1.05) return;
    const v = (-dx * sa + dy * ca) * side, av = Math.abs(v);
    const w = wid * Math.sqrt(clamp((u - quill) / 0.22)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (u - 0.55) / 0.47), 2)));
    const lim = v < 0 ? w * 0.42 : w, fade = u < 0.72 ? 1 : 1 - (u - 0.72) * 1.6;
    if (av < 0.5 && u < 0.9) return p.put(sx, sy, u < 0.5 ? WHITE : B[0], a);
    if (av > lim + 0.05 || w < 0.5) return;
    if (lim - av < 1) return v > 0 ? p.put(sx, sy, u > 0.85 ? B[2] : edge, a * fade) : p.put(sx, sy, lead, a);
    if (u < 0.72) return p.put(sx, sy, u < 0.38 ? B[0] : B[1], a);
    p.blendPx(sx, sy, B[2], a * fade);
  });
}

/**
 * Loose feathers that are thrown, brake hard, then rock like a pendulum as they sink, tilting with each swing
 * and sinking fastest through the bottom of it; on the floor they lie flat and fade.
 * add({ x, y (centre), vx, vy, a (angle), len, wid, life, delay, back }); update(dt); draw(p, R, layer).
 */
class Feathers {
  constructor(rng, floor = 0) {
    this.R = rng;
    this.floor = floor;
    this.list = [];
  }
  add(f) {
    const R = this.R;
    this.list.push({ vx: 0, vy: 0, a: 0, len: 7, wid: 2, delay: 0, back: false, side: R.sign(), ph: R.range(0, TAU), w: R.range(3.2, 4.6), amp: R.range(6, 11), sink: R.range(14, 24), va: R.range(-9, 9), tilt: R.range(-0.35, 0.35), ...f, max: f.life, age: 0, landed: false });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const f = this.list[i];
      if (f.delay > 0) {
        f.delay -= dt;
        continue;
      }
      if ((f.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      f.age += dt;
      if (f.landed) {
        f.a += (Math.round(f.a / Math.PI) * Math.PI - f.a) * Math.min(1, dt * 10);
        continue;
      }
      // the throw: drag kills it fast while it spins
      f.vx -= f.vx * 3.4 * dt;
      f.vy -= f.vy * 3.4 * dt;
      const s = smooth(0.1, 0.6, f.age), ph = f.age * f.w + f.ph, c = Math.cos(ph);
      // the flutter: a swing across, a sink that's fastest through the bottom of each swing
      f.x += (f.vx + Math.sin(ph) * f.amp * s * 0.9) * dt;
      f.y += (f.vy + f.sink * s * (c * c * 1.5 - 0.2)) * dt;
      // it lies along its swing, tipping up at each end
      const rest = Math.round(f.a / Math.PI) * Math.PI + f.tilt + Math.sin(ph) * 0.6;
      f.a += f.va * dt * (1 - s) + (rest - f.a) * Math.min(1, dt * 5 * s);
      if (f.y >= this.floor - 0.5) {
        f.y = this.floor - 0.5;
        f.landed = true;
        f.life = Math.min(f.life, 0.6);
      }
    }
  }
  draw(p, R, layer) {
    for (const f of this.list) {
      if (f.delay > 0 || (layer && (f.back ? "back" : "front") !== layer)) continue;
      const k = f.life / f.max, a = Math.min(1, f.life / 0.45, f.age / 0.06), ca = Math.cos(f.a), sa = Math.sin(f.a);
      feather(p, f.x - (ca * f.len) / 2, f.y - (sa * f.len) / 2, f.a, f.len, f.wid, R, a, f.side, f.age < 0.06 ? 1 : 0, 0.2);
      p.glow(f.x, f.y, 4 + f.len * 0.5, R[R.length - 3], 0.22 * a * (0.4 + 0.6 * k));
    }
  }
}

// ---- plus signs

/**
 * A plus sign of light centred on (x, y): arm length L (1..4) and thickness th (1 or 3): a white heart and
 * spine, colored arms lit on the top and left, shaded on the bottom and right. R: a ramp, dark to bright.
 */
function plus(p, x, y, L, th, R, a = 1, glint = false) {
  const n = R.length, X = Math.round(x), Y = Math.round(y), w = th > 1 ? 1 : 0;
  const ins = (i, j) => (Math.abs(i) <= w && Math.abs(j) <= L) || (Math.abs(j) <= w && Math.abs(i) <= L);
  for (let j = -L - 1; j <= L + 1; j++)
    for (let i = -L - 1; i <= L + 1; i++) {
      if (!ins(i, j)) {
        if (w && (ins(i - 1, j) || ins(i + 1, j) || ins(i, j - 1) || ins(i, j + 1))) p.dot(X + i, Y + j, R[Math.max(0, n - 6)], a * 0.9);
        continue;
      }
      let c;
      if (!w) c = i === 0 && j === 0 ? WHITE : Math.abs(i) + Math.abs(j) >= L ? R[n - 3] : R[n - 2];
      else if (i === 0 && j === 0) c = WHITE;
      else if (i === 0 || j === 0) c = Math.abs(i) + Math.abs(j) < L ? R[n - 2] : R[n - 3];
      else c = i < 0 || j < 0 ? R[n - 3] : R[n - 5];
      if (glint && ((i === 0 && j === -L) || (i === -L && j === 0))) c = WHITE;
      p.dot(X + i, Y + j, c, a);
    }
}

__e.GOLD = GOLD; __e.GREEN = GREEN; __e.ASH = ASH; __e.shapeOf = shapeOf; __e.recolor = recolor; __e.toneOf = toneOf; __e.oval = oval; __e.FAR = FAR; __e.NEAR = NEAR; __e.feather = feather; __e.Feathers = Feathers; __e.plus = plus;
};

__M["fx/holy/sunburst.js"] = function (__e) {
const {fit, sparkle, cycle, clamp, TAU, WHITE} = __req("core/index.js");
const {GOLD} = __req("fx/holy/_lib.js");

const meta = {
  name: "Sunburst",
  desc: "A white-hot core in a gold corona; long and short rays turn slowly round it, breathing, with glints running out along them that wink at the tips.",
  tags: ["holy", "sun", "radiant", "rays", "light", "glow", "loop"],
  size: [128, 128],
  origin: [64, 64],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: GOLD, rays: 8, seed: 3 },
};

const CORE = 4.5, RING = 7.5, R0 = 9;
const frac = (x) => x - Math.floor(x);

// one tapered ray from radius R0 out to R0 + L at angle a: white at the root, cooling to gold, thinning into light
function ray(p, C, a, L, w0, k) {
  const ca = Math.cos(a), sa = Math.sin(a), x1 = ca * (R0 + L), y1 = sa * (R0 + L), pad = w0 + 1;
  p.shade(Math.min(0, x1) - pad, Math.min(0, y1) - pad, Math.max(0, x1) + pad, Math.max(0, y1) + pad, (x, y, out) => {
    const along = x * ca + y * sa - R0, u = along / L;
    if (u < 0 || u > 1) return;
    const across = Math.abs(-x * sa + y * ca), w = (w0 / 2) * (1 - u * 0.85) + 0.25;
    if (across > w) return;
    const spine = across < 0.5, rim = across > w - 0.6 && w > 0.9;
    out.c = spine ? (u < 0.4 ? WHITE : u < 0.75 ? C[6] : C[5]) : rim && u > 0.15 ? C[3] : u < 0.3 ? C[6] : u < 0.62 ? C[5] : C[4];
    out.a = u < 0.72 ? k : k * (1 - (u - 0.72) / 0.28) * 1.2;
  });
  p.glowLine(ca * R0, sa * R0, ca * (R0 + L * 0.8), sa * (R0 + L * 0.8), 5, C[5], 0.16 * k);
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), N = o.rays * 2, T = meta.duration, rot = (t / T) * ((2 * TAU) / N);
  p.glow(0, 0, 62, C[4], 0.3 + 0.06 * Math.sin((t / T) * TAU * 2));
  // fine threads of light between the rays
  for (let i = 0; i < N; i++) {
    const a = rot + ((i + 0.5) * TAU) / N, L = 14 + 6 * Math.sin(a * 3 + (t / T) * TAU);
    p.line(Math.cos(a) * (R0 + 1), Math.sin(a) * (R0 + 1), Math.cos(a) * (R0 + L), Math.sin(a) * (R0 + L), (u) => (u < 0.3 ? C[6] : C[5]), (u) => 0.7 - u * 0.8);
  }
  // the rays, long and short by turns, breathing as a wave runs round them
  for (let i = 0; i < N; i++) {
    const a = rot + (i * TAU) / N, long = i % 2 === 0, breathe = 0.86 + 0.14 * Math.sin(a * 3 - (t / T) * TAU * 2);
    const L = (long ? 36 : 21) * breathe;
    ray(p, C, a, L, long ? 4 : 2.6, 1);
    // a glint runs out along each long ray and winks at the tip
    if (long) {
      const g = frac((t / T) * 2 + (a * 3) / TAU), r = R0 + g * L;
      if (g < 0.9) {
        p.px(Math.cos(a) * r, Math.sin(a) * r, WHITE);
        p.glow(Math.cos(a) * r, Math.sin(a) * r, 5, C[6], 0.45 * (1 - g));
      } else sparkle(p, Math.cos(a) * (R0 + L), Math.sin(a) * (R0 + L), 1 + 3 * Math.sin(((g - 0.9) / 0.1) * Math.PI), WHITE, C[6], 0.5);
    }
  }
  // the corona and the core
  p.shade(-RING - 2, -RING - 2, RING + 2, RING + 2, (x, y, out) => {
    const d = Math.hypot(x, y);
    if (d > RING) return;
    const flick = 0.5 + 0.5 * Math.sin(Math.atan2(y, x) * 5 + (t / T) * TAU * 3);
    out.c = d < CORE ? WHITE : d < CORE + 1.5 ? (flick > 0.6 ? WHITE : C[6]) : flick > 0.5 ? C[5] : C[4];
  });
  p.glow(0, 0, 16, WHITE, 0.28);
  // twinkles round it
  cycle(t, T, 10, o.seed, (g) => g.range(0.35, 0.7), (age, life, R) => {
    const a = R.range(0, TAU), d = R.range(16, 44), k = Math.sin((age / life) * Math.PI);
    sparkle(p, Math.cos(a) * d, Math.sin(a) * d, 1 + 2.4 * k * R.range(0.5, 1), WHITE, C[5], 0.4 * k);
  });
}

__e.meta = meta; __e.draw = draw;
};

__M["fx/holy/smite.js"] = function (__e) {
const {Particles, Bits, Lights, P, PF, B, Rng, fit, sparkle, band, bolt, clamp, smooth, seg, lerp, ease, TAU, WHITE, hex, mix, scale} = __req("core/index.js");
const {GOLD, oval} = __req("fx/holy/_lib.js");

const meta = {
  name: "Smite",
  desc: "A glint marks the spot, then a bolt of light drops like a hammer: a white flash, a shockwave over the floor, stone chips flying and cracks that glow and cool.",
  tags: ["holy", "smite", "strike", "impact", "light", "ground", "one-shot"],
  size: [224, 176],
  origin: [112, 148],
  duration: 2.8,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: GOLD, stone: "#5a5066", seed: 9 },
};

const TOP = -148, SY = 0.38, MARK = 0.42, HIT = 0.54, LEN = 44;
const OUTLINE = hex("#1a1422");

// a chip of stone: lit side, shaded side, outline
function chip(p, b, st) {
  const r = 0.6 + b.s * 0.7, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.2, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.3 ? st[3] : lit > 0.5 ? st[1] : st[2];
    out.a = fade;
  });
}

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), s0 = hex(o.stone);
  const st = [scale(s0, 0.5), scale(s0, 0.75), s0, mix(scale(s0, 1.4), WHITE, 0.1)], dust = mix(s0, hex("#8a8094"), 0.4);
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [WHITE, C[6], C[5], C[3]] });
  const chips = new Bits({ ground: () => 0 }), lights = new Lights();
  // cracks across the floor, mostly out to the sides and towards us, each its own length
  const cracks = Array.from({ length: 7 }, (_, i) => {
    const a = 0.12 + (i / 6) * (Math.PI - 0.24) + R.range(-0.12, 0.12), L = R.range(30, 54) * (Math.abs(Math.sin(a)) > 0.7 ? 0.6 : 1);
    const pts = bolt(R, 0, 0, Math.cos(a) * L, Math.sin(a) * L, { jag: 0.28, depth: 4 }).map(([x, z]) => [x, z * SY]);
    const fork = pts.length > 6 ? bolt(R, ...pts[Math.floor(pts.length * 0.5)], pts[Math.floor(pts.length * 0.5)][0] + Math.cos(a + R.sign() * 0.7) * L * 0.35, pts[Math.floor(pts.length * 0.5)][1] + Math.sin(a + R.sign() * 0.7) * L * 0.35 * SY, { jag: 0.3, depth: 3 }) : null;
    return { pts, fork, L, cool: R.range(1.6, 2.1) };
  });
  let t = 0, hit = false;

  // the hammer of light: a heavy blunt bolt that falls faster and faster
  const tipY = (tt) => lerp(TOP - 6, 0, ease.inCubic(seg(tt, MARK, HIT)));

  function hammer(p) {
    if (t < MARK || t >= HIT + 0.06) return;
    const y1 = t >= HIT ? 0 : tipY(t), y0 = Math.max(TOP + 5, y1 - LEN * (t >= HIT ? 1 - (t - HIT) / 0.06 : 1)), white = t >= HIT;
    if (y1 < TOP + 12) return;
    // speed lines above it
    for (const [dx, k] of [[-5, 0.6], [-2, 0.9], [2, 0.8], [5, 0.5]]) if (y0 > TOP + 2) p.line(dx, Math.max(TOP, y0 - 70), dx, y0, (u) => (u > 0.7 ? C[6] : C[4]), (u) => u * k);
    if (y1 - 3 > y0) p.beam(0, y0, 0, y1 - 3, 9, (u, v) => (white || v < 0.35 ? WHITE : v < 0.7 ? C[6] : C[5]));
    // the head: wider, white hot
    p.beam(0, y1 - 6, 0, y1 - 1, 13, (u, v) => (v < 0.6 || white ? WHITE : C[6]));
    p.glowLine(0, y0 + 10, 0, y1, 16, C[5], 0.6);
    p.glow(0, y1 - 4, Math.min(22, y1 - TOP - 6), WHITE, 0.5);
  }

  function crack(p) {
    if (t < HIT) return;
    const grow = ease.outCubic(seg(t, HIT, HIT + 0.1));
    for (const c of cracks) {
      for (const path of c.fork ? [c.pts, c.fork] : [c.pts]) {
        const n = Math.max(1, Math.round((path.length - 1) * grow));
        for (let i = 0; i < n; i++) {
          const [x0, y0] = path[i], [x1, y1] = path[i + 1], d = Math.hypot(x0, y0 / SY) / c.L, heat = clamp(1 - (t - HIT) / c.cool - d * 0.5);
          if (heat <= 0) continue;
          const col = heat > 0.85 ? WHITE : heat > 0.65 ? C[6] : heat > 0.45 ? C[5] : heat > 0.3 ? C[4] : heat > 0.18 ? C[3] : C[2];
          p.line(x0, y0, x1, y1, col, heat < 0.12 ? heat / 0.12 : 1);
          // wide and deep near the heart, a hairline at the tips
          if (d < 0.45 && path === c.pts) p.line(x0, y0 + 1, x1, y1 + 1, heat > 0.5 ? C[4] : C[2], heat < 0.12 ? heat / 0.12 : 1);
          if (i % 2 === 0) p.glow(x0, y0, 10, C[4], 0.45 * heat);
        }
      }
    }
    // the crater glows at the heart and cools
    const h = clamp(1 - (t - HIT) / 1.6);
    if (h > 0) {
      oval(p, 0, 0, 5, 1.6, h > 0.6 ? WHITE : h > 0.3 ? C[5] : C[3], Math.min(1, h * 3));
      p.glow(0, 0, 18, C[4], 0.45 * h);
    }
  }

  return {
    update(dt) {
      t += dt;
      if (t < MARK && R.chance(0.25)) ps.spawn(P.STAR, R.range(-10, 10), -R.range(0, 18), 0, -R.range(4, 12), R.range(0.2, 0.4), R.chance(0.5) ? WHITE : C[6], R.range(0.5, 1.2));
      // sparks shed off the sides of the falling hammer
      if (t > MARK && t < HIT && tipY(t) > TOP + 50 && R.chance(0.6)) ps.spawn(P.MOTE, R.sign() * R.range(4, 7), tipY(t) - R.range(4, 30), R.range(-20, 20), -R.range(10, 40), R.range(0.15, 0.3), C[6], 0.7);
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(0, -24, 92, C[5], 1, 0.6);
        lights.add(0, -8, 40, WHITE, 0.9, 0.12);
        for (let i = 0; i < 60; i++) {
          const a = -Math.PI / 2 + R.range(-1.25, 1.25), sp = R.range(110, 280);
          ps.spawn(P.SPARK, R.range(-3, 3), -2, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.25, 0.75));
        }
        for (let i = 0; i < 16; i++) {
          const a = -Math.PI / 2 + R.range(-1, 1), sp = R.range(60, 160);
          ps.spawn(P.STAR, R.range(-4, 4), -4, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.4, 0.9), R.chance(0.5) ? WHITE : C[6], R.range(0.8, 2.4));
        }
        for (let i = 0; i < 14; i++) {
          const a = -Math.PI / 2 + R.range(-1.2, 1.2), sp = R.range(90, 230);
          chips.add({ kind: B.CHUNK, x: R.range(-5, 5), y: -2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1, drag: 0.4, bounce: 0.35, life: R.range(1.2, 1.8), a: R.range(0, TAU), va: R.range(-14, 14), s: R.int(1, 3) });
        }
        for (let i = 0; i < 34; i++) {
          const a = -Math.PI / 2 + R.range(-1, 1), sp = R.range(60, 220);
          ps.spawn(P.GRIT, R.range(-4, 4), -1, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.9, 1.5), R.pick(st.slice(1)), R.chance(0.4) ? 2 : 1);
        }
        // dust rolls out along the floor, a little smoke lifts off the crater
        for (let i = 0; i < 9; i++) {
          const s = R.sign();
          ps.spawn(P.SMOKE, s * R.range(2, 10), -R.range(1, 4), s * R.range(50, 130), -R.range(2, 12), R.range(0.7, 1.2), mix(dust, C[4], 0.18), R.range(3.5, 6), R.range(0, 0.06), PF.BIG);
        }
        for (let i = 0; i < 4; i++) ps.spawn(P.SMOKE, R.range(-4, 4), -R.range(2, 8), R.range(-8, 8), -R.range(20, 45), R.range(1.2, 1.8), mix(dust, C[5], 0.25), R.range(4, 6), R.range(0.05, 0.3));
      }
      // the cracks spit embers while they're hot
      if (t > HIT && t < HIT + 1.3 && R.chance(0.5)) {
        const c = R.pick(cracks), q = R.pick(c.pts);
        if (R.chance(0.75)) ps.spawn(P.EMBER, q[0], q[1] - 1, R.range(-8, 8), -R.range(15, 35), R.range(0.5, 0.9), C[5]);
        else ps.spawn(P.STAR, q[0], q[1] - 2, 0, -R.range(4, 12), R.range(0.3, 0.6), R.chance(0.5) ? WHITE : C[6], R.range(0.8, 1.8));
      }
      chips.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      crack(p);
      ps.draw(p, "back");
      const k = seg(t, HIT, HIT + 0.42);
      if (t >= HIT && k < 1) band(p, 0, 0, 6 + 84 * ease.outCubic(k), SY * 0.8, Math.max(1, 5 * (1 - k)), 1.15 - k, C.slice(3), (g) => Math.sin(g) < 0, k < 0.12);
    },
    draw(p) {
      // the mark: a glint on the floor and a ring closing on it
      if (t < HIT) {
        const u = seg(t, 0, MARK), k = smooth(0, 0.08, t), spin = t * 3, rr = lerp(26, 8, ease.inOutCubic(u));
        oval(p, 0, 0, rr, rr * SY, (g) => (Math.sin(g * 4 + spin) > 0 ? WHITE : C[5]), k * (0.65 + 0.35 * Math.sin(t * 40)));
        oval(p, 0, 1, rr, rr * SY, C[3], k * 0.6, (g) => Math.sin(g) > 0);
        const L = (3 + 8 * ease.outBack(clamp(t / 0.2), 2)) * (t > MARK ? 1 + 0.6 * seg(t, MARK, HIT) : 1);
        for (let i = 0; i < 4; i++) {
          const a = spin * 0.3 + (i * Math.PI) / 2, len = i % 2 ? L * 0.6 : L;
          p.line(0, -2, Math.cos(a) * len, -2 + Math.sin(a) * len, (v) => (v < 0.4 ? WHITE : C[5]), (v) => 1.2 - v);
        }
        p.px(0, -2, WHITE);
        p.glow(0, -2, 14 + 10 * u, C[5], 0.5 * k);
        p.glowLine(0, TOP + 6, 0, -2, 5, C[4], 0.12 * u);
      }
      hammer(p);
      // the bolt's afterimage: a thread of light from the sky to the mark, thinning out
      const ai = seg(t, HIT + 0.04, HIT + 0.55);
      if (t > HIT + 0.04 && ai < 1) {
        const w = 1 + 4 * Math.pow(1 - ai, 2);
        p.beam(0, TOP + 4, 0, -4, w, (u, v) => (v < 0.5 ? WHITE : C[5]), (u) => (0.3 + 0.7 * u) * (1 - ai * 0.5));
        p.glowLine(0, TOP + 16, 0, -6, 10, C[5], 0.4 * (1 - ai));
      }
      const k = seg(t, HIT, HIT + 0.42);
      if (t >= HIT && k < 1) band(p, 0, 0, 6 + 84 * ease.outCubic(k), SY * 0.8, Math.max(1, 5 * (1 - k)), 1.15 - k, C.slice(3), (g) => Math.sin(g) >= 0, k < 0.12);
      // the air shock: a dome of light thrown up over the hit
      const d = seg(t, HIT, HIT + 0.28);
      if (t >= HIT && d < 1) {
        const r = 8 + 40 * ease.outCubic(d);
        p.arc(0, 0, r, Math.max(1, 3 * (1 - d)), Math.PI, TAU, (u, v) => (d < 0.2 || v > 0.6 ? WHITE : C[5]), 1.1 - d);
        for (let g = Math.PI * 1.1; g < TAU - 0.2; g += 0.5) p.glow(Math.cos(g) * r, Math.sin(g) * r, 8, C[5], 0.3 * (1 - d));
      }
      // the white hero frame
      if (t >= HIT && t < HIT + 0.07) {
        p.circle(0, -6, 16, WHITE);
        p.circle(0, -6, 19, C[6], 0.6);
      }
      for (const b of chips.list) chip(p, b, st);
      ps.draw(p, "front");
      if (t >= HIT && t < HIT + 0.25) sparkle(p, 0, -8, 16 * (1 - (t - HIT) / 0.25), WHITE, C[5], 0.7);
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/holy/holy-pillar.js"] = function (__e) {
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, seg, lerp, ease, rand, TAU, WHITE} = __req("core/index.js");
const {GOLD, Feathers, oval} = __req("fx/holy/_lib.js");

const meta = {
  name: "Holy pillar",
  desc: "Light breaks through from above: a sun opens at the top and a fan of shafts converges on the mark, pulsing, while a sigil burns on the floor; then the fan folds shut.",
  tags: ["holy", "pillar", "light", "rays", "aoe", "sigil", "ground", "one-shot"],
  size: [192, 232],
  origin: [96, 204],
  duration: 3.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: GOLD, shafts: 7, seed: 3 },
};

const TOP = -204, PY = -1, SUN = TOP + 38, SY = 0.24, RX = 26;
// the sun opens, the fan unfolds and pours down, it holds and pulses, folds shut, the light lifts away
const OPEN = 0.3, HIT = 0.66, FOLD = 2.05, SHUT = 2.45, LIFT = 2.75;
const frac = (x) => x - Math.floor(x);

function create(o) {
  const C = fit(o.palette, 8), N = Math.max(3, o.shafts | 0), R = new Rng(o.seed), mid = (N - 1) / 2;
  const WING = [C[2], C[3], C[4], C[5], C[6], WHITE];
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [WHITE, C[6], C[5], C[3]] });
  const lights = new Lights(), feathers = new Feathers(R, 0);
  // the shafts: spread angle, how fast each widens, how bright, its pulse offset
  const shafts = Array.from({ length: N }, (_, i) => {
    const off = i - mid, far = Math.abs(off) / mid;
    return { th: off * (0.4 / mid) + R.range(-0.02, 0.02), spread: R.range(0.05, 0.085) * (1 - far * 0.25), b: (1 - far * 0.35) * R.range(0.8, 1), ph: R.range(0, 1), far };
  });
  const motes = Array.from({ length: 72 }, () => ({ x: R.range(-80, 80), y: R.range(0, 1), v: R.range(7, 18), amp: R.range(0.5, 2.5), f: R.range(0.6, 1.5), ph: R.range(0, TAU) }));
  for (let i = 0; i < 6; i++)
    feathers.add({ x: R.range(-46, 46), y: R.range(-150, -100), vx: R.range(-8, 8), vy: R.range(0, 8), a: R.range(-0.4, 0.4), len: R.range(7, 9), wid: R.range(1.9, 2.3), life: R.range(1.4, 1.7), sink: R.range(26, 36), back: i % 3 === 0, delay: HIT + 0.1 + i * 0.16 + R.range(0, 0.08) });
  const DMAX = PY - TOP, row = new Float32Array(192), core = new Uint8Array(192);
  let t = 0, hit = false, shut = false, glinted = false;

  // each shaft's angle now: unfolding from the middle with an overshoot, folding back shut at the end
  const angle = (s, tt) => {
    const st = s.far * 0.1, open = ease.outBack(seg(tt, OPEN + st, OPEN + st + 0.42), 1.5), fold = ease.inOutCubic(seg(tt, FOLD - s.far * 0.1, SHUT));
    return s.th * open * (1 - fold);
  };
  // how far down each shaft the light reaches (it pours from the sky), and where it lifts away at the end
  const frontD = (s, tt) => DMAX * (1 - ease.inQuad(seg(tt, OPEN + s.far * 0.06, HIT + s.far * 0.06)));
  const liftD = (tt) => DMAX * ease.inQuad(seg(tt, SHUT + 0.05, LIFT));
  const fade = (tt) => smooth(OPEN, OPEN + 0.1, tt) * (1 - smooth(LIFT - 0.05, LIFT + 0.05, tt));
  const width = (s, d, tt) => (1.4 + d * s.spread) * lerp(1, 0.25, smooth(SHUT, LIFT, tt));
  // brightness along a shaft: a pulse of light runs down each one, one after another
  const pulse = (s, d, tt) => {
    if (tt < HIT || tt > SHUT) return 1;
    const D = DMAX * (1 - frac((tt - HIT) / 0.6 + s.ph));
    return 1 + 0.9 * Math.exp(-(((d - D) / 12) ** 2));
  };
  // light of all the shafts at a point (for motes)
  const lightAt = (x, y) => {
    const dy = PY - y;
    if (dy <= 0) return 0;
    let I = 0;
    for (const s of shafts) {
      const a = angle(s, t), d = dy / Math.cos(a), xc = Math.tan(a) * dy, hw = width(s, d, t) / 2 / Math.cos(a);
      if (d < liftD(t) || d < frontD(s, t)) continue;
      const v = (x - xc) / hw;
      if (Math.abs(v) < 1) I += (1 - v * v) * s.b;
    }
    return I * fade(t);
  };

  function fan(p) {
    const k = fade(t);
    if (k <= 0) return;
    const lift = liftD(t);
    for (let y = Math.ceil(TOP); y < PY; y++) {
      const dy = PY - (y + 0.5);
      row.fill(0);
      core.fill(0);
      let any = false;
      for (const s of shafts) {
        const a = angle(s, t), ca = Math.cos(a), d = dy / ca;
        if (d < lift || d < frontD(s, t) - 6) continue;
        const xc = Math.tan(a) * dy, hw = width(s, d, t) / 2 / ca, soft = smooth(frontD(s, t) - 6, frontD(s, t) + 4, d) * smooth(lift, lift + 6, d);
        const I0 = s.b * pulse(s, d, t) * soft * k;
        for (let x = Math.floor(xc - hw); x <= Math.ceil(xc + hw); x++) {
          const v = (x + 0.5 - xc) / hw, i = x + 96;
          if (i < 0 || i >= 192 || Math.abs(v) >= 1) continue;
          row[i] += I0 * Math.pow(1 - v * v, 1.3);
          any = true;
        }
        const ci = Math.round(xc - 0.5) + 96;
        if (ci >= 0 && ci < 192) core[ci] = Math.max(core[ci], Math.min(255, I0 * 200));
      }
      if (!any) continue;
      for (let i = 0; i < 192; i++) {
        const I = row[i];
        if (I < 0.02) continue;
        const x = i - 96;
        p.blend(x, y, C[6], Math.min(0.6, I * 0.38));
        p.light(x, y, C[4], Math.min(0.9, I * 0.32));
        // a fine bright line runs down the middle of each shaft
        if (core[i]) p.dot(x, y, core[i] > 150 ? WHITE : C[6], Math.min(1, core[i] / 180));
      }
    }
    // where the shafts converge, the light gathers to a point
    if (t > HIT - 0.05) p.glow(0, PY - 3, 20, C[5], 0.5 * k);
  }

  // the sun: a halo that opens at the top like an iris, rays ticking round it, then closes with a glint
  function sun(p) {
    const r = 15 * ease.outBack(seg(t, 0.02, 0.45), 1.8) * (1 - ease.inBack(seg(t, SHUT, LIFT + 0.1), 1.5));
    if (r > 0.5) {
      const spin = t * 0.6;
      p.glow(0, SUN, Math.min(32, r * 3), C[4], 0.5);
      p.glow(0, SUN, r * 1.4, WHITE, 0.35);
      p.circle(0, SUN, r * 0.45, WHITE);
      oval(p, 0, SUN, r * 0.62, r * 0.62, C[6], 1);
      oval(p, 0, SUN, r, r, (g) => (Math.sin(g * 6 + spin * 4) > 0.5 ? WHITE : C[5]), 1);
      for (let j = 0; j < 16; j++) {
        const g = spin + (j * TAU) / 16, l = j % 2 ? 3 : 6;
        p.line(Math.cos(g) * (r + 2), SUN + Math.sin(g) * (r + 2), Math.cos(g) * (r + 2 + l), SUN + Math.sin(g) * (r + 2 + l), (u) => (u < 0.4 ? C[6] : C[4]), (u) => 1.1 - u);
      }
    }
    if (t > LIFT && t < LIFT + 0.3) sparkle(p, 0, SUN, 10 * (1 - (t - LIFT) / 0.3), WHITE, C[5], 0.6);
  }

  // the sigil burning on the floor: two rings and a turning band of marks; white-hot, then gold, then cooling
  function sigil(p, back) {
    if (t < HIT) return;
    const u = seg(t, HIT, HIT + 0.2), heat = 1 - smooth(SHUT, SHUT + 0.8, t), out = 1 - smooth(SHUT + 0.4, SHUT + 1, t);
    if (out <= 0) return;
    const keep = back ? (g) => Math.sin(g) < 0 : (g) => Math.sin(g) >= 0;
    // it burns in round from the front, both ways
    const burnt = (g) => Math.abs(((g - Math.PI / 2 + Math.PI) % TAU + TAU) % TAU - Math.PI) <= u * Math.PI + 0.01;
    const col = (g, hot) => {
      if (!burnt(g)) return 0;
      const flick = rand(Math.round(g * 40), Math.floor(t * 20)) < 0.18;
      return t < HIT + 0.08 || (flick && heat > 0.4) ? WHITE : heat > 0.6 ? (hot ? C[6] : C[5]) : heat > 0.3 ? C[4] : heat > 0.1 ? C[3] : C[2];
    };
    oval(p, 0, 0, RX, RX * SY, (g) => col(g, true), out, (g) => keep(g) && burnt(g));
    oval(p, 0, 0, RX * 0.72, RX * 0.72 * SY, (g) => col(g, false), out, (g) => keep(g) && burnt(g));
    // marks between the rings, turning slowly
    for (let j = 0; j < 12; j++) {
      const g = t * 0.35 + (j * TAU) / 12;
      if (!keep(g) || !burnt(g)) continue;
      const c = col(g, j % 2 === 0), r0 = RX * 0.78, r1 = RX * (j % 3 === 0 ? 0.95 : 0.88);
      if (c) p.line(Math.cos(g) * r0, Math.sin(g) * r0 * SY, Math.cos(g) * r1, Math.sin(g) * r1 * SY, c, out);
    }
    if (!back) {
      for (let i = -2; i <= 2; i++) p.glow(i * RX * 0.45, -2, 16, C[4], (0.34 - Math.abs(i) * 0.05) * out * (0.5 + 0.5 * heat));
      p.glow(0, -1, 10, WHITE, 0.3 * heat * out);
    }
  }

  return {
    update(dt) {
      t += dt;
      // light gathers to the sun as it opens
      if (t < OPEN + 0.1 && R.chance(0.5)) {
        const a = R.range(0, TAU), D = R.range(22, 34), x = Math.cos(a) * D, y = SUN + Math.sin(a) * D, T = R.range(0.18, 0.28), v = ((D - 10) * 3) / (Math.exp(3 * T) - 1);
        ps.spawn(P.STREAK, x, y, (-x / D) * v, ((SUN - y) / D) * v, T, R.chance(0.5) ? C[6] : C[5]);
      }
      if (!hit && t >= HIT) {
        hit = true;
        lights.add(0, -30, 64, C[5], 0.85, 0.5);
        lights.add(0, -6, 30, WHITE, 0.8, 0.12);
        for (let i = 0; i < 26; i++) {
          const a = -Math.PI / 2 + R.range(-1.2, 1.2), sp = R.range(70, 190);
          ps.spawn(P.SPARK, R.range(-3, 3), -2, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.25, 0.6));
        }
      }
      // while it holds: embers off the burning sigil, a few feathers drifting down through the shafts
      if (t > HIT && t < SHUT + 0.1 && R.chance(0.35)) {
        const g = R.range(0, TAU), r = RX * (R.chance(0.5) ? 1 : 0.72);
        ps.spawn(P.EMBER, Math.cos(g) * r, Math.sin(g) * r * SY - 1, R.range(-6, 6), -R.range(12, 30), R.range(0.5, 0.8), C[5], 1, 0, Math.sin(g) < 0 ? 4 : 0);
      }
      if (t > HIT && t < FOLD && R.chance(0.05)) ps.spawn(P.STAR, R.range(-1, 1) * 40, -R.range(20, 160), 0, R.range(2, 8), R.range(0.3, 0.6), R.chance(0.5) ? WHITE : C[6], R.range(0.8, 1.8));
      // the fan snaps shut on the mark: a flash where the shafts become one
      if (!shut && t >= SHUT) {
        shut = true;
        lights.add(0, -60, 70, C[5], 0.7, 0.35);
        for (let i = 0; i < 12; i++) ps.spawn(P.STAR, R.range(-4, 4), -R.range(10, 170), R.range(-25, 25), R.range(-10, 10), R.range(0.4, 0.8), R.chance(0.5) ? WHITE : C[6], R.range(0.8, 2));
      }
      if (!glinted && t >= LIFT) {
        glinted = true;
        lights.add(0, SUN, 40, WHITE, 0.6, 0.2);
      }
      ps.update(dt);
      feathers.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      fan(p);
      sigil(p, true);
      feathers.draw(p, WING, "back");
      ps.draw(p, "back");
    },
    draw(p) {
      sigil(p, false);
      // dust motes drifting down, lit only where a shaft catches them
      for (const m of motes) {
        const y = TOP + ((((m.y * DMAX + t * m.v) % DMAX) + DMAX) % DMAX), x = m.x + Math.sin(t * m.f + m.ph) * m.amp, I = lightAt(x, y);
        if (I < 0.2) continue;
        p.dot(x, y, I > 0.7 ? WHITE : C[6], Math.min(1, I * 1.3));
        p.light(x, y, C[5], 0.4 * Math.min(1, I));
      }
      sun(p);
      if (t > HIT - 0.02 && t < HIT + 0.25) sparkle(p, 0, PY - 2, 12 * (1 - (t - HIT) / 0.25), WHITE, C[5], 0.7);
      if (t > SHUT && t < SHUT + 0.2) sparkle(p, 0, PY - 2, 8 * (1 - (t - SHUT) / 0.2), WHITE, C[5], 0.5);
      feathers.draw(p, WING, "front");
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/water/splash.js"] = function (__e) {
// The droplet recipe (shaded beads with tails that fly, land and throw up a little crown of their own) is
// adapted from Sprite Fusion's open-source blood (https://www.spritefusion.com/pixel-art-vfx/blood),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, rand, noise, TAU, WHITE} = __req("core/index.js");
const {WATER, Drops, Ripples, Mist, bead, lace, pebble, rock} = __req("fx/water/_lib.js");

const meta = {
  name: "Splash",
  desc: "A stone drops into still water: a white hit, a crown that tears into droplets arcing out to plink down with rings, a jet that bounces back, foam and drifting mist.",
  tags: ["water", "splash", "impact", "drop", "liquid", "one-shot"],
  size: [176, 100],
  origin: [88, 78],
  duration: 2.5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: WATER, stone: true, seed: 3 },
};

const SY = 0.22, HIT = 0.16, G = 820, FINGERS = 12, JET = 0.3, TEAR = 0.11;

// the crown over time u after the hit: it leaps up in a few frames, flares out, then falls back
const height = (u) => 19 * ease.outCubic(clamp(u / 0.09)) * (1 - ease.inQuad(clamp((u - 0.12) / 0.3)));
const foot = (u) => 3 + 7.5 * ease.outCubic(clamp(u / 0.45));
const lip = (u) => foot(u) + height(u) * 0.42 + 3 * ease.outCubic(clamp(u / 0.25));
// the jet that bounces back up the middle once the crown has fallen
const jetH = (u) => 26 * (ease.outCubic(clamp(u / 0.12)) - ease.inQuad(clamp((u - 0.15) / 0.28)));

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), ST = rock(), phi = R.range(0, TAU);
  const ps = new Particles({ rng: R }), mist = new Mist(), lights = new Lights(), rings = new Ripples({ sy: SY });
  const plinks = [], bubbles = [], spikes = Array.from({ length: FINGERS }, (_, k) => ({ a: ((k * TAU) / FINGERS + phi) % TAU, L: R.range(0.2, 0.36) }));
  const drops = new Drops({
    sy: SY,
    g: G,
    onLand: (d) => {
      // every drop that comes down plinks: a white fleck, a ring, and the bigger ones throw up a tiny crown
      rings.add(d.x, d.z, 0.6, 2 + d.s * 1.8, 0.34 + d.s * 0.1, { n: 1, k: 0.95, hot: 0.06 });
      plinks.push({ x: d.x, y: d.z * SY, s: d.s, age: 0 });
      if (d.s > 1 && !d.small)
        for (let i = 0; i < d.s; i++) {
          const a = R.range(0, TAU), v = R.range(10, 34);
          drops.add({ x: d.x, z: d.z, h: 0.5, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(55, 110), s: 1, small: true, life: 1 });
        }
    },
  });
  let t = 0;
  const done = new Set(), once = (key, at) => !done.has(key) && t >= at && done.add(key);
  // the lip isn't level: it rises and dips round the crown
  const scallop = (a, h) => h * (0.86 + 0.14 * noise(Math.cos(a) * 2.2 + Math.sin(a) * 1.3 + phi * 3, o.seed));

  // the crown: a thin sheet from its foot to a rolled lip. The far wall's shadowed inside shows over the near
  // lip; the near wall is see-through between bright streaks, white down its lit edge; fingers rise off the lip
  function crown(p, back) {
    const u = t - HIT, h = height(u);
    if (u < 0 || h < 0.7) return;
    const r0 = foot(u), rt = lip(u), white = u < 0.045;
    const cells = new Map();
    const put = (x, y, c, a, rank) => {
      const X = Math.floor(x), Y = Math.floor(y), key = (Y + 4096) * 8192 + X + 4096, cur = cells.get(key);
      if (!cur || rank > cur.r) cells.set(key, { x: X, y: Y, c, a, r: rank });
    };
    const n = Math.ceil(rt * TAU * 1.6);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
      if (s < 0 !== back) continue;
      const lane = Math.floor(((a + phi) * rt) / 2.2), streak = rand(lane, 31) < 0.3, H = scallop(a, h);
      // as it falls, each lane of the sheet gives way from the top at its own moment
      const keep = 1 - clamp((u - 0.13 - 0.14 * rand(lane, 7)) / 0.1), steps = Math.ceil(H * 1.4) + 2;
      for (let k = 0; k <= steps * keep; k++) {
        const v = k / steps, r = r0 + (rt - r0) * Math.pow(v, 2.2), x = c * r, y = s * r * SY - H * v;
        if (white) put(x, y, WHITE, 1, 3);
        else if (back) put(x, y, v > 0.72 ? (streak ? C[5] : C[4]) : streak ? C[3] : C[2], 1, 1);
        else if (Math.abs(c) > 0.9) put(x, y, c < 0 ? (Math.abs(c) > 0.97 ? WHITE : C[6]) : C[4], 1, 2);
        else if (v < 0.1) put(x, y, v < 0.05 ? WHITE : C[6], 1, 2);
        else if (streak) put(x, y, c < -0.2 ? C[6] : C[5], 1, 1);
        else put(x, y, c < 0 ? C[5] : C[4], 0.22, 0);
      }
      // the rolled lip: a hard white line on the near side, softer on the far, gone where the lane broke
      if (!white && keep >= 1) {
        const x = c * rt, y = s * rt * SY - H;
        put(x, y, back ? C[5] : c < 0.45 ? WHITE : C[6], 1, 3);
        if (!back && c < 0.2) put(x, y + 1, C[6], 1, 2);
      }
    }
    for (const q of cells.values()) {
      if (q.r === 0) p.blend(q.x, q.y, q.c, q.a);
      else p.px(q.x, q.y, q.c);
    }
    // fingers: spikes running on up and out from the lip, a bead on each until it tears off
    const reach = 1 - smooth(TEAR, TEAR + 0.1, u);
    for (const f of spikes) {
      if (Math.sin(f.a) < 0 !== back || reach <= 0) continue;
      const H = scallop(f.a, h), L = h * f.L * reach, x0 = Math.cos(f.a) * rt, y0 = Math.sin(f.a) * rt * SY - H, x1 = x0 + Math.cos(f.a) * L * 0.45, y1 = y0 - L;
      if (L >= 1) p.line(x0, y0, x1, y1, white ? WHITE : back ? C[4] : C[6]);
      if (u > 0.04 && u < TEAR) bead(p, x1 - (back ? 0 : 0.5), y1 - 1, 0, -1, back ? 1 : 2, C);
      if (!back && Math.sin(f.a) > 0.3) p.glow(x0, y0, 6, C[5], 0.22 * reach);
    }
  }

  function jet(p) {
    const u = t - HIT - JET, h = jetH(u);
    if (u < 0 || h < 0.8) return;
    const top = -h;
    // a mound of water heaves up under it
    p.ellipse(0, 0, 5, 2.4, (d, a) => (Math.sin(a) > 0 ? null : d < 0.5 ? WHITE : Math.cos(a) < 0 ? C[6] : C[5]));
    p.shade(-3, top - 2, 3, 0, (x, y, out) => {
      const v = clamp((y - top) / h), w = 1.15 + 1.5 * v * v * v, q = x / w;
      if (Math.abs(q) > 1) return;
      out.c = q < -0.5 ? C[6] : q < 0.3 ? WHITE : q < 0.72 ? C[5] : C[4];
    });
    if (u < 0.12) {
      // the bulb at its tip, about to pinch off
      p.circle(0, top - 1, 1.7, C[5]);
      p.circle(-0.3, top - 1.3, 1.1, C[6]);
      p.px(-1, top - 2, WHITE);
    }
    p.glowLine(0, -1, 0, top, 7, C[5], 0.3);
  }

  return {
    update(dt) {
      t += dt;
      if (once("hit", HIT)) {
        lights.add(0, -6, 52, C[5], 0.6, 0.45);
        lights.add(0, -4, 16, WHITE, 0.5, 0.08);
        rings.add(0, 0, 8, 56, 2.0, { n: 2, gap: 3.4, k: 1.35, hot: 0.16, glint: 1 });
        rings.add(0, 0, 5, 38, 1.7, { n: 1, k: 0.9, delay: 0.14 });
        // the first sheet of spray, thrown up fast and fine
        for (let i = 0; i < 20; i++) {
          const a = R.range(0, TAU), v = R.range(50, 125);
          drops.add({ x: Math.cos(a) * 3, z: Math.sin(a) * 3, h: R.range(1, 6), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(160, 270), s: R.chance(0.25) ? 2 : 1, delay: R.range(0, 0.04) });
        }
        // mist rolls out low along the water
        for (let i = 0; i < 9; i++) {
          const s = i % 2 ? 1 : -1, x = s * R.range(4, 12);
          mist.add(x, -R.range(1, 7), s * R.range(25, 70), -R.range(4, 16), R.range(2.5, 4), R.range(7, 11), R.range(0.9, 1.5), R.chance(0.5) ? C[6] : C[5], R.range(0.3, 0.42), R.range(0, 0.1));
        }
      }
      if (once("spray", HIT + 0.04)) {
        for (let i = 0; i < 20; i++) {
          const a = R.range(0, TAU);
          ps.spawn(P.FLAKE, Math.cos(a) * 9, Math.sin(a) * 9 * SY - R.range(6, 15), Math.cos(a) * R.range(25, 90), -R.range(30, 100), R.range(0.7, 1.3), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.5));
        }
        for (let i = 0; i < 5; i++) ps.spawn(P.STAR, R.range(-13, 13), -R.range(6, 20), 0, -4, R.range(0.25, 0.55), C[6], R.range(1, 2.4), R.range(0, 0.15));
      }
      if (once("tear", HIT + TEAR)) {
        // the beads on the finger tips tear off and arc away
        const h = height(TEAR), rt = lip(TEAR);
        for (const f of spikes) {
          const a = f.a + R.range(-0.08, 0.08), v = R.range(32, 88), L = h * f.L;
          drops.add({ x: Math.cos(f.a) * (rt + L * 0.45), z: Math.sin(f.a) * rt, h: h + L + 1, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(90, 190), s: R.chance(0.3) ? 3 : 2 });
        }
      }
      // as the crown gives way its lip comes apart into drops
      const u = t - HIT;
      if (u > 0.13 && u < 0.3 && R.chance(0.3)) {
        const a = R.range(0, TAU), rt = lip(u), v = R.range(15, 45);
        drops.add({ x: Math.cos(a) * rt, z: Math.sin(a) * rt, h: scallop(a, height(u)) * R.range(0.6, 1), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(-10, 45), s: R.chance(0.3) ? 2 : 1 });
      }
      if (once("fall", HIT + 0.3)) {
        // the crown falls back, shedding a few heavy drops close in
        for (let i = 0; i < 8; i++) {
          const a = R.range(0, TAU), r = lip(0.3), v = R.range(15, 40);
          drops.add({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: R.range(3, 7), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(30, 80), s: R.chance(0.4) ? 2 : 1 });
        }
      }
      if (once("bead", HIT + JET + 0.12)) {
        // the jet's tip pinches off into a bead that hangs, then drops back
        drops.add({ x: 0, z: 0.2, h: jetH(0.12) + 1, vx: R.range(-6, 6), vz: 0, vh: 55, s: 3 });
        for (let i = 0; i < 3; i++) mist.add(R.range(-3, 3), -jetH(0.12) + R.range(2, 8), R.range(-14, 14), -R.range(4, 12), 2, R.range(4, 6), R.range(0.6, 1), C[6], 0.3);
      }
      if (once("slump", HIT + JET + 0.38)) {
        rings.add(0, 0, 3, 30, 1.5, { n: 2, gap: 2.6, k: 0.9 });
        for (let i = 0; i < 4; i++) mist.add(R.range(-6, 6), -R.range(1, 4), R.range(-30, 30), -R.range(3, 10), 2.5, R.range(6, 9), R.range(0.8, 1.2), C[5], 0.28);
      }
      // the stone sinks and lets go of its air: a few bubbles come up and pop
      for (const [i, at] of [[0, 0.95], [1, 1.2], [2, 1.5]])
        if (once("glug" + i, HIT + at)) bubbles.push({ x: R.range(-5, 5), z: R.range(-6, 6), t0: t, r: R.range(1.3, 2.3), popped: false });
      for (const b of bubbles)
        if (!b.popped && t - b.t0 > 0.2) {
          b.popped = true;
          rings.add(b.x, b.z, 1, 7, 0.6, { n: 1, k: 0.9 });
          plinks.push({ x: b.x, y: b.z * SY, s: 1, age: 0 });
          for (let i = 0; i < 2; i++) drops.add({ x: b.x, z: b.z, h: 1, vx: R.range(-20, 20), vz: R.range(-10, 10), vh: R.range(50, 90), s: 1, small: true, life: 1 });
        }
      for (let i = plinks.length - 1; i >= 0; i--) if ((plinks[i].age += dt) > 0.14) plinks.splice(i, 1);
      drops.update(dt);
      rings.update(dt);
      mist.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const u = t - HIT;
      // the cavity the stone punches, dark inside the foot of the crown
      if (u > 0 && u < 0.26) {
        const r = foot(u) * 0.85 * (1 - smooth(0.12, 0.26, u));
        p.ellipse(0, 0, r, r * SY + 0.6, (d, a) => (Math.sin(a) < 0 ? C[1] : C[2]));
      }
      rings.draw(p, C, -1);
      crown(p, true);
      drops.draw(p, C, "back");
    },
    draw(p) {
      const u = t - HIT;
      rings.draw(p, C, 1);
      if (u > 0.2) {
        const rx = 4 + 11 * ease.outCubic(clamp((u - 0.2) / 0.7)), k = smooth(0.2, 0.32, u) * (1 - smooth(0.5, 2.0, u)) * 0.9;
        lace(p, 0, 0, rx, rx * SY + 0.5, k, C, t, o.seed);
      }
      crown(p, false);
      jet(p);
      for (const b of bubbles) {
        const g = (t - b.t0) / 0.2;
        if (g > 1) continue;
        const r = b.r * ease.outBack(g), x = b.x, y = b.z * SY;
        for (let a = Math.PI; a <= TAU + 0.01; a += 0.5 / Math.max(1, r)) p.dot(x + Math.cos(a) * r, y + Math.sin(a) * r, C[6]);
        p.px(x - r * 0.4, y - r * 0.6, WHITE);
        p.glow(x, y - 1, 4, C[5], 0.25);
      }
      for (const q of plinks) {
        const k = q.age / 0.14;
        if (k < 0.5) p.px(q.x, q.y, WHITE);
        if (q.s > 1) p.line(q.x, q.y - 1, q.x, q.y - 1 - 3 * (1 - k), k < 0.4 ? WHITE : C[6]);
        p.glow(q.x, q.y, 4, C[5], 0.3 * (1 - k));
      }
      drops.draw(p, C, "front");
      // the hit: a flat white flash on the surface for two frames
      if (u >= 0 && u < 0.07) {
        p.ellipse(0, 0, 10, 2.4, (d) => (d < 0.6 ? WHITE : C[6]));
        sparkle(p, 0, -3, 5 * (1 - u / 0.07), C[6], C[5], 0.5);
      }
      // the stone, falling fast with a streak of air off it
      if (o.stone && t < HIT) {
        const v = t / HIT, y = -70 + 70 * (0.4 * v + 0.6 * v * v);
        p.line(0, y - 12, 0, y - 3, ST[4], (w) => w * 0.8);
        pebble(p, 0, y, 2.6, ST);
      }
      mist.draw(p, C[5]);
      ps.draw(p);
      lights.draw(p);
      // the disturbed water keeps a cool light on it while it settles
      if (u > 0) {
        p.glow(0, -2, 34, C[4], 0.2 * (1 - smooth(0, 1.6, u)));
        p.glow(0, 2, 64, C[3], 0.16 * (1 - smooth(0.1, 2.1, u)));
      }
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/water/_lib.js"] = function (__e) {
// Shared by the water effects: the water ramp, droplets that fly over a water surface seen at a low angle and
// land with rings, ripple trains, lacy foam, foam billows, wet stone. Files starting with _ are helpers.
// The droplet sprites (a pixel, a shaded 2x2, a round bead with a highlight, each trailing a tail along its
// motion) are adapted from Sprite Fusion's open-source blood (https://www.spritefusion.com/pixel-art-vfx/blood),
// MIT License, Copyright (c) 2026 Hugo Duprez.

const {noise, noise2, TAU, WHITE, hex} = __req("core/index.js");

/** Water, deep to white: deep color only in shadow, tinted middles, white crests. */
const WATER = ["#0a1630", "#123063", "#1b5596", "#2a7fc4", "#45a9e3", "#86d3f5", "#cdf1ff", "#ffffff"];
/** Wet stone for props (lips, basins, vents), outline to highlight. */
const ROCK = ["#141219", "#221f2b", "#34303f", "#4a4558", "#655f74", "#8a8498"];

/**
 * A droplet at (x, y) moving at (vx, vy) px/s: s 1 is a pixel, 2 a shaded 2x2, 3 a round bead with a
 * highlight; a tail trails back along its motion, longer the faster it goes. C: an 8-step water ramp.
 */
function bead(p, x, y, vx, vy, s, C, a = 1) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, tail = Math.min(5, sp * 0.011);
  if (tail >= 1) p.line(x - ux * (tail + 1), y - uy * (tail + 1), x - ux * 1.2, y - uy * 1.2, (u) => (u < 0.45 ? C[3] : s > 1 ? C[5] : C[4]), a);
  if (s >= 3) {
    p.circle(x, y, 1.75, C[4], a);
    p.circle(x - 0.25, y - 0.25, 1.15, C[6], a);
    p.dot(x - 0.7, y - 0.7, WHITE, a);
  } else if (s >= 2) {
    const X = Math.floor(x), Y = Math.floor(y);
    p.dot(X, Y, WHITE, a);
    p.dot(X + 1, Y, C[6], a);
    p.dot(X, Y + 1, C[5], a);
    p.dot(X + 1, Y + 1, C[4], a);
  } else p.dot(x, y, sp > 160 ? C[6] : C[5], a);
}

/**
 * Droplets in flight over a flat surface seen at a low angle: x across, z into the screen (negative is far),
 * h height above the surface; on screen they sit at (x, z * sy - h). Gravity pulls h down; when a drop
 * reaches the surface it calls onLand(drop) and is gone. add({ x, z, h, vx, vz, vh, s (1..3), life, delay }).
 */
class Drops {
  constructor({ sy = 0.22, g = 820, drag = 0.35, onLand = null } = {}) {
    this.sy = sy;
    this.g = g;
    this.drag = drag;
    this.onLand = onLand;
    this.list = [];
  }
  add(d) {
    const life = d.life ?? 4;
    this.list.push({ x: 0, z: 0, h: 0, vx: 0, vz: 0, vh: 0, s: 1, delay: 0, ...d, life, max: life });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    const k = this.drag * dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const d = this.list[i];
      if (d.delay > 0) {
        d.delay -= dt;
        continue;
      }
      if ((d.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      d.vh -= this.g * dt;
      d.vx -= d.vx * k;
      d.vz -= d.vz * k;
      d.vh -= d.vh * k * 0.5;
      d.x += d.vx * dt;
      d.z += d.vz * dt;
      d.h += d.vh * dt;
      if (d.h <= 0 && d.vh < 0) {
        d.h = 0;
        this.list.splice(i, 1);
        this.onLand?.(d);
      }
    }
  }
  /** Draw the drops behind z = 0 ("back"), in front of it ("front"), or all. */
  draw(p, C, layer) {
    for (const d of this.list) {
      if (d.delay > 0 || (layer === "back" && d.z >= 0) || (layer === "front" && d.z < 0)) continue;
      const x = d.x, y = d.z * this.sy - d.h;
      bead(p, x, y, d.vx, d.vz * this.sy - d.vh, d.s, C, Math.min(1, d.life / 0.2));
      p.glow(x, y, 2.5 + d.s, C[5], 0.1 + 0.05 * d.s);
    }
  }
}

/**
 * A ripple on a surface seen at a low angle: a train of n crests gap px apart around (cx, cy), squashed by sy,
 * the outer crest brightest. k 0..1+ strength: a crisp 1 px crest that steps down the ramp as k falls and
 * only breaks into dashes at the very end. half: 0 the whole ring, -1 the far half (draw it behind things),
 * 1 the near half. hot: a white crest. glint: a white catch-light on the near side. wob: px the crest wanders
 * in and out round the ring, so it isn't a perfect ellipse.
 */
function ring(p, cx, cy, r, sy, k, C, { n = 2, gap = 3, half = 0, hot = false, glint = 0, seed = 0, wob = 0 } = {}) {
  if (k <= 0.02 || r < 0.5) return;
  for (let j = 0; j < n; j++) {
    const rr = r - j * gap;
    if (rr < 0.6) break;
    const kj = k * (1 - j * 0.42), m = Math.max(6, Math.ceil(rr * TAU * 1.3)), need = 1.15 - 2.3 * Math.min(1, kj * 1.25);
    for (let i = 0; i < m; i++) {
      const a = (i / m) * TAU, s = Math.sin(a), near = s > 0;
      if ((half > 0 && !near) || (half < 0 && near)) continue;
      // as it weakens the crest breaks into glinting dashes (whole pixels, no dither), fixed to the ring
      if (noise(a * 4.7 + seed * 13.1 + j * 5.3, seed) * 0.65 + noise(a * 11.3 + seed * 7.7, seed + 3) * 0.35 < need) continue;
      // the near side and the side toward the light (upper left) read brighter
      const lit = kj * (near ? 1 : 0.7) * (0.88 - 0.12 * Math.cos(a));
      const c = hot && near && j === 0 ? WHITE : C[lit > 0.7 ? 6 : lit > 0.38 ? 5 : 4], ra = wob ? rr + wob * noise(a * 2.6 + seed * 1.9 + j, seed + 11) : rr;
      const x = cx + Math.cos(a) * ra, y = cy + s * ra * sy;
      p.dot(x, y, c);
      if (j === 0) p.light(x, y, C[4], 0.3 * lit);
    }
  }
  if (glint > 0 && half >= 0) {
    const x = cx + Math.cos(2.05) * r, y = cy + Math.sin(2.05) * r * sy;
    p.px(x, y, WHITE);
    p.glow(x, y, 3 + glint * 2, C[5], 0.35 * glint);
  }
}

/**
 * Ripples that spread and fade: add(x, z, r0, r1, life, { n, gap, k, hot (seconds of white crest), glint, delay }).
 * update(dt); draw(p, C, half) with half as in ring().
 */
class Ripples {
  constructor({ sy = 0.22 } = {}) {
    this.sy = sy;
    this.list = [];
  }
  add(x, z, r0, r1, life, o = {}) {
    this.list.push({ x, z, r0, r1, life, age: -(o.delay ?? 0), k: o.k ?? 1, n: o.n ?? 2, gap: o.gap ?? 3, hot: o.hot ?? 0.1, glint: o.glint ?? 0, seed: (this.seq = (this.seq ?? 0) + 1) });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].age += dt) >= this.list[i].life) this.list.splice(i, 1);
  }
  draw(p, C, half = 0) {
    for (const q of this.list) {
      if (q.age < 0) continue;
      const u = q.age / q.life, r = q.r0 + (q.r1 - q.r0) * (1 - Math.pow(1 - u, 2.6)), k = q.k * Math.pow(1 - u, 1.7);
      ring(p, q.x, q.z * this.sy, r, this.sy, k, C, { n: q.n, gap: q.gap * (0.55 + 0.6 * u), half, hot: q.age < q.hot, glint: q.glint * k, seed: q.seed });
    }
  }
}

/**
 * Lacy foam floating on the surface around (cx, cy), over an rx x ry patch: the crests of a noise field make
 * a white net with holes, thinning out as k falls (1 thick, 0 gone). t drifts it; seed picks the pattern.
 */
function lace(p, cx, cy, rx, ry, k, C, t, seed = 0) {
  if (k <= 0.01 || rx < 1) return;
  const sy = ry / rx;
  p.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
    const dx = (x - cx) / rx, dy = (y - cy) / ry, d = dx * dx + dy * dy;
    if (d > 1) return;
    const u = (x - cx) * 0.36, v = ((y - cy) / sy) * 0.36;
    const n = noise2(u + seed * 7.13, v - t * 0.35, seed), m = noise2(u * 2.2 - t * 0.3, v * 2.2 + seed * 3.1, seed + 9);
    const net = 1 - Math.abs(n) * 4.6 + m * 0.3, need = 1.02 - k * (1.15 - d * 0.9);
    if (net < need) return;
    o.c = net > need + 0.4 ? WHITE : C[6];
  });
}

/**
 * Mist: soft puffs with no hard edge (alpha falls off to the rim), lit on top, that swell, drift on a slowing
 * push and thin away. add(x, y, vx, vy, r0, r1, life, color, a, delay); update(dt); draw(p, haze).
 */
class Mist {
  constructor() {
    this.list = [];
  }
  add(x, y, vx, vy, r0, r1, life, c, a = 0.25, delay = 0) {
    this.list.push({ x, y, vx, vy, r0, r1, life, max: life, c: hex(c), a, delay });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i];
      if (m.delay > 0) {
        m.delay -= dt;
        continue;
      }
      if ((m.life -= dt) <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      m.vx -= m.vx * 2.4 * dt;
      m.vy -= m.vy * 2.4 * dt + 7 * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
    }
  }
  draw(p, haze) {
    for (const m of this.list) {
      if (m.delay > 0) continue;
      const age = 1 - m.life / m.max, r = m.r0 + (m.r1 - m.r0) * (1 - Math.pow(1 - age, 2.2));
      const a = m.a * Math.min(1, age / 0.12) * Math.pow(1 - age, 1.4);
      if (a < 0.01) continue;
      p.disc(m.x, m.y, r, m.c, (d) => a * (1 - d * d) * (1 - d * 0.5));
      p.disc(m.x - r * 0.2, m.y - r * 0.32, r * 0.55, WHITE, (d) => a * 0.25 * (1 - d) * (1 - d));
      if (haze) p.glow(m.x, m.y, r * 1.5, haze, (0.16 * a) / m.a * Math.min(1, m.a * 3));
    }
  }
}

/** A billow of churning foam: a shadowed underside, a white body, a lit cap. a < 1 dithers it away. */
function billow(p, x, y, r, C, a = 1) {
  if (r < 0.9) return p.dot(x, y, C[6], a);
  p.circle(x + r * 0.12, y + r * 0.2, r, C[4], a);
  p.circle(x, y, r * 0.84, C[6], a);
  if (r > 1.6) p.circle(x - r * 0.3, y - r * 0.32, r * 0.46, WHITE, a);
}

/** A pebble or rock: lit upper left, shaded lower right, a dark rim. ST: a 6-step stone ramp (ROCK). */
function pebble(p, x, y, r, ST) {
  p.shade(x - r - 1, y - r - 1, x + r + 1, y + r + 1, (px, py, o) => {
    const dx = px - x, dy = py - y, d = Math.hypot(dx * 1.1, dy);
    if (d > r + 0.8) return;
    const lit = (dx + dy) / Math.max(0.5, r);
    o.c = d > r ? ST[0] : lit < -0.7 ? ST[5] : lit < 0.2 ? ST[4] : lit < 0.8 ? ST[3] : ST[2];
  });
}

const rock = () => ROCK.map(hex);

__e.WATER = WATER; __e.ROCK = ROCK; __e.bead = bead; __e.Drops = Drops; __e.ring = ring; __e.Ripples = Ripples; __e.lace = lace; __e.Mist = Mist; __e.billow = billow; __e.pebble = pebble; __e.rock = rock;
};

__M["fx/impacts/crit-hit.js"] = function (__e) {
// The star, its key frames and the spark spray are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, B, Rng, fit, clamp, smooth, ease, TAU, WHITE} = __req("core/index.js");
const {spikes, star, brokenRing} = __req("fx/impacts/_lib.js");

const meta = {
  name: "Critical hit",
  desc: "A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.",
  tags: ["impact", "hit", "crit", "critical", "combat", "directional", "one-shot"],
  size: [216, 136],
  origin: [84, 106],
  duration: 0.9,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a0510", "#5c0a1c", "#a3142a", "#e0302c", "#ff7a2a", "#ffc23d", "#fff09a", "#ffffff"], height: 26, aim: 0.12, seed: 3 },
};

// the star's key frames: [from t, scale, thickness, alpha, colors (rim, body, inner, core) as steps of the ramp]
const KEYS = [
  [0, 1, 1, 1, [6, 7, 7, 7]],
  [0.025, 1.3, 1, 1, [2, 5, 6, 7]],
  [0.058, 1.05, 0.72, 1, [2, 4, 5, 6]],
  [0.092, 1.22, 0.3, 1, [1, 2, 3, 4]],
  [0.125],
];

// a lens flare: a long level streak, thick and white at the heart, a shorter upright one, on a bed of light
function flare(p, x, y, L, k, C) {
  for (const [dx, dy, len] of [[1, 0, L], [0, 1, L * 0.45], [0.7, 0.7, L * 0.16], [0.7, -0.7, L * 0.16]])
    for (const s of [-1, 1])
      for (let d = 1; d <= len; d++) {
        const u = d / len, a = u < 0.7 ? 1 : k * (1.6 - u);
        p.dot(x + s * dx * d, y + s * dy * d, u < 0.35 ? WHITE : u < 0.7 ? C[6] : C[5], a);
        if (dy === 0 && u < 0.42) for (const e of [-1, 1]) p.dot(x + s * d, y + e, u < 0.2 ? C[6] : C[5], u < 0.3 ? 1 : k);
      }
  p.glowLine(x - L, y, x + L, y, 6, C[6], 0.5 * k);
  p.glowLine(x, y - L * 0.45, x, y + L * 0.45, 4, C[6], 0.3 * k);
}

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), X = 0, Y = -o.height, A = o.aim, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[3]] });
  const bits = new Bits({ ground: floor }), lights = new Lights();
  const sp = spikes(R, 14, A, { len: [11, 15], w: [1.8, 2.5], fwd: 1.4, back: 0.6, jag: 0.5 });
  [...sp].sort((a, b) => b.len - a.len).slice(0, 2).forEach((s) => (s.len *= 1.3));
  const segs = Array.from({ length: 7 }, (_, i) => {
    const a = A + (i / 7) * TAU;
    return { a, gap: R.range(0.55, 0.85), dr: R.range(0.08, 0.4) + 0.15 * Math.max(0, Math.cos(a - A)), w: 0.7 + 0.5 * Math.max(0, Math.cos(a - A)) };
  });

  lights.add(X, Y, 84, C[5], 0.6, 0.5);
  lights.add(X, Y, 30, WHITE, 0.7, 0.1);
  lights.add(X, -4, 44, C[4], 0.3, 0.45);
  // sparks: most sprayed on along the blow, a few kicked back
  for (let i = 0; i < 36; i++) {
    const back = R.chance(0.22), a = (back ? A + Math.PI : A) + R.range(-1, 1) * (back ? 0.6 : 0.8), v = R.range(170, 430) * (back ? 0.6 : 1);
    ps.spawn(P.SPARK, X, Y, Math.cos(a) * v, Math.sin(a) * v - 50, R.range(0.15, 0.5), WHITE, 1, R.chance(0.3) ? R.range(0, 0.04) : 0);
  }
  // shards: bright splinters that tumble down, bounce and settle
  for (let i = 0; i < 10; i++) {
    const a = A + R.range(-1, 1) * 1.1 - 0.35, v = R.range(110, 280);
    bits.add({ kind: B.SHARD, x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 0.8, drag: 0.7, bounce: 0.35, life: R.range(0.55, 0.85), a: R.range(0, TAU), va: R.range(-25, 25), s: R.range(2, 4.5), c: R.pick([C[7], C[6], C[6], C[5]]) });
  }
  // embers of light drifting up and off, and glints that pop round the ring after the hit
  for (let i = 0; i < 12; i++) {
    const a = A - Math.PI / 2 + R.range(-1.4, 1.4), v = R.range(35, 110);
    ps.spawn(P.MOTE, X + Math.cos(a) * 4, Y + Math.sin(a) * 4, Math.cos(a) * v, Math.sin(a) * v - 15, R.range(0.35, 0.7), R.pick([C[6], C[5], C[5]]), 0.6, R.range(0, 0.05));
  }
  for (let i = 0; i < 5; i++) {
    const a = R.range(0, TAU), d = R.range(14, 34);
    ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, 0, -4, R.range(0.22, 0.38), R.chance(0.5) ? C[6] : WHITE, R.range(1.6, 3), R.range(0.08, 0.32));
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      bits.update(dt);
      lights.update(dt);
    },
    draw(p) {
      // the ring: it swells off the star, then breaks into arcs that fly on and cool
      const u = clamp((t - 0.03) / 0.37);
      if (t >= 0.03 && u < 1) {
        const r = 10 + 30 * ease.outCubic(u), brk = smooth(0.12, 0.6, u), th = Math.max(1, 3.6 * Math.pow(1 - u, 1.2));
        const i = u < 0.12 ? 7 : u < 0.3 ? 6 : u < 0.5 ? 5 : u < 0.75 ? 4 : 3;
        brokenRing(p, X, Y, r, th, segs, brk, C[i], C[Math.max(2, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
        if (u < 0.6) p.glowRing(X, Y, r, 6, C[5], 0.35 * Math.pow(1 - u / 0.6, 2));
      }
      bits.draw(p);
      ps.draw(p);
      // the flare blooms as the star collapses
      const f = (t - 0.04) / 0.28;
      if (f > 0 && f < 1) {
        flare(p, X, Y, 64 * Math.pow(1 - f, 1.3), 1 - f, C);
        p.glow(X, Y, 56, C[5], 0.4 * (1 - f));
      }
      // the starburst slams in: a white frame, an overshoot, a settle, then it breaks up
      for (let i = 0; i < KEYS.length - 1; i++)
        if (t >= KEYS[i][0] && t < KEYS[i + 1][0]) {
          const [, sc, th, a, cols] = KEYS[i];
          star(p, X, Y, sp, sc, th, cols.map((j) => C[j]), a, 2.6);
        }
      const pop = Math.exp(-t / 0.05);
      if (pop > 0.02) {
        p.glow(X, Y, 44, C[5], 0.4 * pop);
        p.glow(X, Y, 12, WHITE, 0.6 * pop);
      }
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/impacts/_lib.js"] = function (__e) {
// Shared by the impacts: the hit star, a ring that breaks into flying arcs, floor cracks that glow and cool,
// standing shock fronts, soft lumpy dust rings, faceted tumbling rocks, and the stone colors they share.
// The star and flying-arc recipes are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), and the stone colors from its explosion
// (https://www.spritefusion.com/pixel-art-vfx/explosion), MIT License, Copyright (c) 2026 Hugo Duprez.
// Files starting with _ are helpers, not effects.

const {clamp, rand, TAU, hex, mix, scale, rgb, WHITE} = __req("core/index.js");

const SOOT = hex("#0d0a12");
const OUTLINE = hex("#1a1422");
const LIGHT = Math.atan2(-1, -1); // light comes from the top left

/** Stone colors from one body color: light, body, shade, dust (lighter and greyer), lip (a lit broken edge). */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3), lip: mix(scale(c, 1.55), WHITE, 0.12) };
}

/**
 * Spikes for a hit star: n of them round the circle, longer towards aim (fwd) and a little behind it (back).
 * len and w: [min, max] base length and root half-width; jag scales every other spike (short teeth between).
 */
function spikes(R, n, aim, { len = [7, 10], w = [1.5, 2.1], fwd = 1.8, back = 0.6, jag = 1, jit = 0.18 } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const a = aim + (i / n) * TAU + R.range(-jit, jit), cb = Math.cos(a - aim);
    const L = R.range(len[0], len[1]) * (1 + fwd * Math.pow(Math.max(0, cb), 3) + back * Math.pow(Math.max(0, -cb), 3)) * (i % 2 ? jag : 1);
    return { a, len: L, w: R.range(w[0], w[1]) * (i % 2 ? Math.sqrt(jag) : 1) };
  });
}

/**
 * A hit star: tapered spikes in three passes (a rim, a body that's paler near the root, a hot core) round a
 * hot heart. sc stretches the spikes, th thins them, cols [rim, body, inner, core], a dithers it out.
 */
function star(p, x, y, list, sc, th, [rim, body, inner, core], a = 1, heart = 2.4) {
  for (let pass = 0; pass < 3; pass++)
    for (const s of list) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L = s.len * sc;
      for (let d = 0; d <= L; d += 0.5) {
        if (pass === 2 && d > L * 0.55) break;
        const hw0 = s.w * th * (1 - d / L) * Math.min(1, 0.5 + d / 3);
        const hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        const col = pass === 0 ? rim : pass === 1 ? (d < L * 0.35 ? inner : body) : core;
        for (let o = -hw; o <= hw; o += 0.5) p.dot(x + c * d - sn * o, y + sn * d + c * o, col, a);
      }
    }
  const r = heart * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner, a);
  p.circle(x, y, r, core, a);
}

/**
 * A ring that breaks into arcs: segs [{ a (centre angle), gap (0..1), dr (how fast it flies out), w (thickness
 * scale, default 1) }] evenly round the ring. brk 0 draws a whole ring th thick; as brk grows each arc shrinks,
 * tapers at both ends into a crescent and drifts out at its own speed. c is the outer edge's color, c2 the
 * inner's; sy squashes it onto a plane; nothing is drawn below maxY (a floor).
 */
function brokenRing(p, x, y, r, th, segs, brk, c, c2 = c, k = 1, sy = 1, maxY = Infinity) {
  if (r <= 0 || k <= 0) return;
  const full = TAU / segs.length;
  for (const s of segs) {
    const span = full * (1 - s.gap * brk) + 0.02, rr = r * (1 + s.dr * brk), m = Math.max(4, Math.ceil(rr * span * 1.8));
    for (let j = 0; j <= m; j++) {
      const u = j / m, ang = s.a + (u - 0.5) * span, w = Math.max(0.5, th * (s.w ?? 1) * (1 - brk * Math.pow(Math.abs(2 * u - 1), 1.6)));
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let o = -w / 2; o <= w / 2 + 0.01; o += 0.5) if (y + sa * (rr + o) * sy < maxY) p.dot(x + ca * (rr + o), y + sa * (rr + o) * sy, o > -0.26 ? c : c2, k);
    }
  }
}

// a jagged walk from (x, y) heading a for L px; each point is [x, y, distance along]
function walk(R, x, y, a, L, { jit = 0.55, steer = 0.45, step = [2, 4], maxY = Infinity, d0 = 0 } = {}) {
  const pts = [[x, y, d0]];
  let d = 0, cur = a;
  while (d < L - 0.01) {
    const s = Math.min(L - d, R.range(step[0], step[1]));
    cur += R.range(-jit, jit) + (a - cur) * steer;
    x += Math.cos(cur) * s;
    y = clamp(y + Math.sin(cur) * s, 0.5, maxY);
    d += s;
    pts.push([x, y, d0 + d]);
  }
  return pts;
}

/**
 * Cracks in the floor face below (0, 0): n jagged lines, alternately left and right, mostly shallow, a few
 * diving steeply, some forked. len [min, max], maxY how deep they may go, forks 0..1.
 */
function makeCracks(R, n, { len = [14, 40], dive = 0.85, maxY = 22, forks = 0.5, x0 = [1, 5] } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, dip = 0.06 + Math.pow(R.next(), 1.7) * dive, L = R.range(len[0], len[1]) * (1 - (0.5 * dip) / (dive + 0.06));
    const a = side > 0 ? dip : Math.PI - dip, pts = walk(R, side * R.range(x0[0], x0[1]), R.range(0.5, 1.5), a, L, { maxY });
    const c = { pts, len: L, t0: R.range(0, 0.035), kids: [] };
    for (let j = 2; j < pts.length - 1; j++)
      if (R.chance(forks * 0.4)) {
        const [fx, fy, fd] = pts[j];
        c.kids.push(walk(R, fx, fy, a + R.sign() * R.range(0.45, 1), R.range(3, 9) * (1 - (0.5 * j) / pts.length), { maxY, d0: fd, jit: 0.7, step: [1.5, 3] }));
      }
    out.push(c);
  }
  return out;
}

/**
 * Draw cracks grown to g(c) px of their length. heat(d) 0..1 at distance d along a crack lights it from the
 * hot ramp (bright to dark) before it cools to dark; lip is the lit lower edge; k dithers them out.
 * Returns nothing; adds a glow along the hot parts.
 */
function drawCracks(p, cracks, g, heat, hot, dark, lip, k = 1) {
  if (k <= 0) return;
  const col = (d) => {
    const h = heat(d);
    return h > 0.75 ? hot[0] : h > 0.5 ? hot[1] : h > 0.3 ? hot[2] : h > 0.12 ? hot[3] : dark;
  };
  for (const c of cracks) {
    const G = g(c);
    if (G <= 0) continue;
    for (const path of [c.pts, ...c.kids]) {
      for (let i = 1; i < path.length; i++) {
        const [x0, y0, d0] = path[i - 1], [x1, y1, d1] = path[i];
        if (d0 >= G) break;
        const f = d1 > G ? (G - d0) / (d1 - d0) : 1, ex = x0 + (x1 - x0) * f, ey = y0 + (y1 - y0) * f;
        p.line(x0, y0 + 1, ex, ey + 1, lip, (u) => (rand(Math.round(x0 + (ex - x0) * u), Math.round(y0 + (ey - y0) * u), 5) < 0.3 ? k * 0.8 : 0));
        p.line(x0, y0, ex, ey, (u) => col(d0 + (d1 - d0) * f * u), k);
        const h = heat(d0);
        if (h > 0.12) p.glow((x0 + ex) / 2, (y0 + ey) / 2, 4 + h * 4, hot[2], 0.22 * h * k);
      }
    }
  }
}

/**
 * A standing crescent shock front on the floor (y = 0): it leans back from a leading edge low at x, dir 1
 * racing right ")", -1 left "(". h tall, w thick at its widest (thick where it meets the floor, a point at
 * the top); cols [edge, body, back] bright to dark; k dithers it out.
 */
function frontCrescent(p, x, dir, h, w, cols, k = 1) {
  if (h < 1 || w < 0.3 || k <= 0) return;
  const ry = h * 0.8, cy = -h * 0.2, rx = Math.max(2, h * 0.55);
  const x0 = dir > 0 ? x - rx - w - 1 : x - 1, x1 = dir > 0 ? x + 1 : x + rx + w + 1;
  p.shade(x0, -h - 1, x1, 0, (px, py, out) => {
    if (py > 0) return;
    const ey = (py - cy) / ry;
    if (ey <= -1 || ey >= 1) return;
    const e2 = 1 - ey * ey, edge = rx * Math.sqrt(e2) - rx, wt = w * Math.pow(e2, 0.45), q = (edge - (px - x) * dir) / Math.max(0.5, wt);
    if (q < 0 || q > 1) return;
    out.c = q < 0.28 ? cols[0] : q < 0.62 ? cols[1] : cols[2];
    out.a = k * (ey < -0.8 ? 0.7 : 1) * (q > 0.7 ? 1.25 - q * 0.8 : 1);
  });
}

/**
 * A soft, lumpy ring of dust round (cx, cy): radius r, w thick (lumps swell it), alpha k, translucent and lit
 * on its upper side. sy squashes it onto the floor; brk 0..1 tears it into clumps as it thins; ph varies it;
 * nothing is drawn below maxY; half -1 draws only the far half (above cy), 1 only the near half.
 */
function dustRing(p, cx, cy, r, w, k, c, { sy = 1, ph = 0, brk = 0, lit = 0.35, maxY = Infinity, half = 0 } = {}) {
  if (k <= 0.01 || r <= 0) return;
  const W = w * 1.6, lite = mix(c, WHITE, lit);
  for (let y = Math.floor(cy - (r + W) * sy) - 1; y <= Math.min(maxY - 1, Math.ceil(cy + (r + W) * sy) + 1); y++)
    for (let x = Math.floor(cx - r - W) - 1; x <= Math.ceil(cx + r + W) + 1; x++) {
      const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) / sy, d = Math.hypot(dx, dy), g = Math.atan2(dy, dx);
      if ((half < 0 && dy >= 0) || (half > 0 && dy < 0)) continue;
      const lumpy = 0.6 + 0.3 * Math.sin(5 * g + ph) + 0.18 * Math.sin(11 * g + ph * 2.1) + 0.12 * Math.sin(17 * g + ph * 0.7);
      const wt = w * lumpy, off = Math.abs(d - r - w * 0.25 * Math.sin(7 * g + ph));
      if (off >= wt) continue;
      const tear = brk > 0 ? clamp((0.55 + 0.45 * Math.sin(6 * g + ph * 1.7) - brk) / 0.25) : 1;
      const a = k * (1 - Math.pow(off / wt, 2)) * tear;
      if (a > 0.01) p.blend(x, y, dy < 0 && d > r - wt * 0.3 ? lite : c, a);
    }
}

/** A rock's outline: n vertex radii round its centre. */
const rockShape = (R, n = 6) => Array.from({ length: n }, () => R.range(0.7, 1.12));

/**
 * A faceted rock tumbling at angle b.a: every facet shaded by how it faces the light, a lit top face, a dark
 * outline, dithering out over its last half second. b: { x, y, a, s (1..3), life, pts }, st: stone().
 */
function rock(p, b, st) {
  const r = 0.75 + b.s * 0.8, n = b.pts.length, fade = Math.min(1, b.life / 0.5), ca = Math.cos(b.a), sa = Math.sin(b.a);
  p.shade(b.x - r - 2, b.y - r - 2, b.x + r + 2, b.y + r + 2, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, d = Math.hypot(u, v);
    let ang = Math.atan2(v, u);
    if (ang < 0) ang += TAU;
    const f = (ang / TAU) * n, i = Math.floor(f) % n, w = f - Math.floor(f), edge = r * (b.pts[i] * (1 - w) + b.pts[(i + 1) % n] * w);
    if (d > edge + 0.85) return;
    out.a = fade;
    if (d > edge) return OUTLINE;
    const lit = Math.cos(((i + 0.5) / n) * TAU + b.a - LIGHT);
    if (d < edge * 0.42) return lit > 0.55 ? st.light : st.body;
    return lit > 0.35 ? st.light : lit < -0.4 ? st.shade : st.body;
  });
}

__e.SOOT = SOOT; __e.OUTLINE = OUTLINE; __e.stone = stone; __e.spikes = spikes; __e.star = star; __e.brokenRing = brokenRing; __e.makeCracks = makeCracks; __e.drawCracks = drawCracks; __e.frontCrescent = frontCrescent; __e.dustRing = dustRing; __e.rockShape = rockShape; __e.rock = rock;
};

__M["fx/nature/healing-bloom.js"] = function (__e) {
// The healing light (a soft column of glow, a lit ring on the floor, motes and bevelled crosses drifting up and
// glinting) is adapted from Sprite Fusion's open-source heal (https://www.spritefusion.com/pixel-art-vfx/heal),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, sparkle, band, clamp, smooth, ease, lerp, TAU, WHITE} = __req("core/index.js");
const {drawLeaf} = __req("fx/nature/_lib.js");

const meta = {
  name: "Healing bloom",
  desc: "A sprout pushes up and unfurls, a bud swells and opens round a glowing golden heart in a flare of healing light; its petals lift away one by one as motes.",
  tags: ["nature", "heal", "flower", "plant", "buff", "ground", "one-shot"],
  size: [124, 120],
  origin: [62, 108],
  duration: 3.3,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#0c1a10", "#173a1a", "#24582a", "#357a34", "#52a03e", "#86c84e", "#c4ec7a", "#f4ffd0"],
    petal: ["#4a1a3a", "#a8406e", "#ec8ab0", "#ffd8e8"],
    heart: ["#a8641a", "#f0b42e", "#ffe680", "#fffbe0"],
    seed: 4,
  },
};

const STEM = 0.42, BUD = 0.75, OPEN = 1.05, LIFT = 1.7, WILT = 2.4, H = 36, NPET = 6;

// a bevelled cross of light
function cross(p, x, y, L, C, a, glint) {
  const X = Math.round(x), Y = Math.round(y), ins = (dx, dy) => (dx === 0 && Math.abs(dy) <= L) || (dy === 0 && Math.abs(dx) <= L);
  for (let dy = -L - 1; dy <= L + 1; dy++)
    for (let dx = -L - 1; dx <= L + 1; dx++) {
      if (ins(dx, dy)) p.dot(X + dx, Y + dy, glint && !dx && !dy ? WHITE : dy < 0 || dx < 0 ? C[6] : C[5], a);
      else if (L > 1 && (ins(dx - 1, dy) || ins(dx + 1, dy) || ins(dx, dy - 1) || ins(dx, dy + 1))) p.dot(X + dx, Y + dy, C[2], a * 0.8);
    }
  p.glow(x, y, 5 + L * 2, C[6], 0.35 * a);
}

function create(o) {
  const C = fit(o.palette, 8), Pt = fit(o.petal, 4), Ht = fit(o.heart, 4), R = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [Ht[3], Ht[2], Ht[1], Ht[0]] });
  const lights = new Lights(), flying = [], glyphs = [];
  const petals = Array.from({ length: NPET }, (_, i) => ({ az: (i / NPET) * TAU + 0.3, off: (i * 0.7) % 1, gone: false, at: LIFT + ((i * 0.37) % 1) * 0.55 }));
  let t = 0, popped = false, sprouted = false;
  const grow = () => ease.outCubic(clamp(t / STEM)) * (1 - ease.inCubic(clamp((t - WILT) / 0.6)));
  const sway = () => Math.sin(t * 2.6) * 1.4 * smooth(0.2, 0.6, t);
  // the stem's points, base to tip: a gentle S that sways
  const stem = () => {
    const g = grow(), pts = [];
    for (let i = 0; i <= 12; i++) {
      const s = i / 12;
      pts.push([Math.sin(s * 3.2) * 2.2 * s + sway() * s * s, (1 - g) * H * 1.1 - s * H]);
    }
    return pts;
  };
  const open = () => ease.outBack(clamp((t - BUD) / (OPEN - BUD)), 1.4);
  return {
    update(dt) {
      t += dt;
      const f = Math.min(1, dt * 120), top = stem()[12];
      if (!sprouted) {
        sprouted = true;
        for (let i = 0; i < 8; i++) ps.spawn(P.GRIT, R.range(-3, 3), -1, R.range(-40, 40), -R.range(40, 100), R.range(0.5, 0.8), R.pick([C[2], C[3]]), 1);
        for (let i = 0; i < 3; i++) ps.spawn(P.DUST, R.range(-3, 3), -1, R.sign() * R.range(10, 30), -R.range(4, 10), R.range(0.4, 0.6), C[3], R.range(1.5, 2.5));
      }
      // the bud draws light in as it swells
      if (t > STEM && t < BUD && R.chance(0.3 * f)) {
        const a = R.range(0, TAU), d = R.range(14, 26), x = top[0] + Math.cos(a) * d, y = top[1] - 3 + Math.sin(a) * d * 0.8;
        ps.spawn(P.STREAK, x, y, (top[0] - x) * 3.4, (top[1] - 3 - y) * 3.4, R.range(0.18, 0.26), R.chance(0.5) ? Ht[2] : C[6]);
      }
      if (!popped && t >= OPEN - 0.12) {
        popped = true;
        lights.add(top[0], top[1] - 3, 22, WHITE, 0.45, 0.08);
        lights.add(top[0], top[1] - 3, 70, Ht[2], 0.5, 0.8);
        for (let i = 0; i < 16; i++) {
          const a = R.range(0, TAU), sp = R.range(40, 120);
          ps.spawn(P.MOTE, top[0], top[1] - 3, Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.4, 0.8), R.chance(0.5) ? Ht[3] : C[7], 0.7);
        }
        for (let i = 0; i < 5; i++) ps.spawn(P.STAR, top[0] + R.range(-10, 10), top[1] - R.range(0, 14), 0, -6, R.range(0.3, 0.6), Ht[3], R.range(1, 2.4), R.range(0, 0.3));
      }
      // while it blooms: crosses and motes of light drift up round it
      if (t > OPEN && t < WILT && R.chance(0.13 * f)) glyphs.push({ x: R.range(-22, 22), y: -R.range(2, 36), t0: t, life: Math.min(R.range(0.7, 1.1), meta.duration - 0.05 - t), L: R.chance(0.35) ? 3 : 2, seed: R.next() * 9 });
      if (t > OPEN - 0.1 && t < WILT && R.chance(0.35 * f)) ps.spawn(P.EMBER, R.range(-20, 20), -R.range(0, 8), R.range(-6, 6), -R.range(25, 55), Math.min(R.range(0.6, 1.1), meta.duration - 0.05 - t), R.chance(0.6) ? C[6] : Ht[2], R.chance(0.3) ? 2 : 1);
      for (let i = glyphs.length - 1; i >= 0; i--) if (t - glyphs[i].t0 > glyphs[i].life) glyphs.splice(i, 1);
      // petals let go one by one and lift away, turning, until they twinkle out
      for (const q of petals)
        if (!q.gone && t >= q.at) {
          q.gone = true;
          const e = Math.PI / 2 - 0.15, dx = Math.sin(e) * Math.cos(q.az), L = 10;
          flying.push({ x: top[0] + dx * L * 0.6, y: top[1] - 3 - Math.cos(e) * L * 0.6, vx: dx * 30 + R.range(-10, 10), vy: -R.range(25, 45), a: Math.atan2(-Math.cos(e), dx), va: R.range(-5, 5), fl: 0, vf: R.range(5, 9), life: Math.min(R.range(0.75, 1.0), meta.duration - 0.45 - t), max: 0 });
          flying[flying.length - 1].max = flying[flying.length - 1].life;
        }
      for (let i = flying.length - 1; i >= 0; i--) {
        const q = flying[i];
        if ((q.life -= dt) <= 0) {
          ps.spawn(P.STAR, q.x, q.y, 0, -8, Math.min(0.35, meta.duration - 0.05 - t), Pt[3], 1.8);
          flying.splice(i, 1);
          continue;
        }
        q.vx -= q.vx * 1.5 * dt;
        q.vy -= q.vy * 0.8 * dt + 10 * dt;
        q.x += q.vx * dt + Math.sin(q.fl) * 12 * dt;
        q.y += q.vy * dt;
        q.a += q.va * dt;
        q.fl += q.vf * dt;
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const bloom = smooth(OPEN - 0.15, OPEN + 0.2, t) * (1 - smooth(WILT - 0.2, WILT + 0.5, t)), top = stem()[12];
      // a column of soft healing light, and a lit ring on the floor that blooms out as it opens
      for (let h = 0; h < 70; h += 7) p.glow(0, -h, 22, C[5], 0.12 * bloom * (1 - h / 80));
      const k = clamp((t - OPEN + 0.12) / 0.6);
      if (k > 0 && k < 1) band(p, 0, 0.5, 6 + 30 * ease.outCubic(k), 0.18, Math.max(1, 3 * (1 - k)), 1.1 - k, [C[3], C[5], Ht[2], Ht[3]], (g) => Math.sin(g) < 0);
      const fw = 6 + 16 * smooth(0, 0.8, t);
      for (let x = Math.floor(-fw); x <= fw; x++) {
        const u = Math.abs(x) / fw, a = Math.sqrt(1 - u) * smooth(0, 0.4, t) * (1 - smooth(WILT, WILT + 0.6, t));
        p.dot(x, 0, u < 0.3 ? C[6] : u < 0.65 ? C[5] : C[4], a);
        if ((x % 5) === 0) p.glow(x, 0, 8, C[5], 0.2 * a * (1 - u));
      }
      // the far petals sit behind the heart
      if (t > BUD - 0.05) for (const q of petals) if (Math.sin(q.az) < 0 && !q.gone) petal(p, q, top);
      ps.draw(p, "back");
    },
    draw(p) {
      const pts = stem(), top = pts[12], g = grow();
      if (g > 0.02) {
        // the stem: a 2 px shoot, lit down its left side
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
          if (y1 > 0) continue;
          p.line(x0, y0, x1, y1, C[5]);
          p.line(x0 + 1, y0, x1 + 1, y1, C[3]);
        }
        // leaves unfurl off it
        for (const [i, sd, d] of [[4, -1, 0.1], [7, 1, 0.22]]) {
          const lk = ease.outBack(clamp((t - d - 0.12) / 0.3), 1.6) * (1 - smooth(WILT, WILT + 0.5, t) * 0.4), [x, y] = pts[i];
          if (lk <= 0 || y > -1) continue;
          const la = sd < 0 ? -2.6 + 0.4 * (1 - lk) : -0.55 - 0.4 * (1 - lk);
          drawLeaf(p, x + Math.cos(la) * 6 * lk, y + Math.sin(la) * 6 * lk, 12 * lk, 3.4, la, 0.25, [C[1], C[3], C[5], C[6]]);
        }
        // the bud, then the heart once it opens
        if (t > STEM - 0.1 && t < OPEN - 0.1) {
          const b = clamp((t - STEM + 0.1) / (BUD - STEM)), w = 2 + 2.5 * b, h = 3.5 + 5 * b;
          p.ellipse(top[0], top[1] - h * 0.6, w, h, (d, a) => (Math.cos(a) < -0.2 ? Pt[2] : d > 0.7 ? Pt[0] : Pt[1]));
          p.glow(top[0], top[1] - h * 0.6, 8 + 8 * b, Ht[2], 0.25 * b);
        }
      }
      for (const q of petals) if (Math.sin(q.az) >= 0 && !q.gone && t > BUD - 0.05) petal(p, q, top);
      if (t > OPEN - 0.12 && t < WILT + 0.3) {
        const pulse = 0.85 + 0.15 * Math.sin(t * 9), k = 1 - smooth(WILT - 0.3, WILT + 0.3, t), cy = top[1] - 4;
        p.circle(top[0], cy, 3.3 * k, Ht[1]);
        p.circle(top[0] - 0.5, cy - 0.5, 2.2 * k, Ht[2]);
        p.px(top[0] - 1, cy - 1, Ht[3]);
        p.glow(top[0], cy, 16 * pulse, Ht[2], 0.5 * k);
        p.glow(top[0], cy, 34, C[5], 0.2 * k);
      }
      const e = t - OPEN + 0.12;
      if (e > 0 && e < 0.16) sparkle(p, top[0], top[1] - 3, 10 * (1 - e / 0.16), Ht[3], Ht[2], 0.6);
      for (const q of flying) drawLeaf(p, q.x, q.y, 6, 2.2, q.a, q.fl, [Pt[0], Pt[1], Pt[2], Pt[3]], Math.min(1, q.life / 0.3));
      for (const q of glyphs) {
        const k = (t - q.t0) / q.life;
        cross(p, q.x + Math.sin(k * 5 + q.seed) * 2, q.y - k * 24, q.L, C, Math.sin(Math.PI * k), Math.sin(k * 14 + q.seed) > 0.8);
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };

  // a petal: from closed round the bud to splayed open round the heart, foreshortened by where it points
  function petal(p, q, top) {
    const op = open(), e = lerp(0.15, Math.PI / 2 - 0.2, op), dx = Math.sin(e) * Math.cos(q.az), dz = Math.sin(e) * Math.sin(q.az), dy = -Math.cos(e);
    const L = lerp(8, 12, op), len = L * Math.hypot(dx, dy), ang = Math.atan2(dy, dx), back = dz < 0, cy = top[1] - 3;
    if (len < 1.5) return;
    drawLeaf(p, top[0] + dx * L * 0.5, cy + dy * L * 0.5, len + 1, 3 + (1 - Math.abs(dz)) * 0.8, ang, back ? 0.9 : 0.2, back ? [Pt[0], Pt[0], Pt[1], Pt[2]] : [Pt[0], Pt[1], Pt[2], Pt[3]]);
  }
}

__e.meta = meta; __e.create = create;
};

__M["fx/melee/whip-crack.js"] = function (__e) {
// The pop's star and slivers follow Sprite Fusion's open-source impact, and the sparks his slash
// (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, clamp, smooth, ease, TAU, WHITE, READY} = __req("core/index.js");
const {star, sliver} = __req("fx/melee/_lib.js");

const meta = {
  name: "Whip crack",
  desc: "A whip rolls out to the right as a loop running down its length, faster and faster, until the tip flips over and cracks: a white pop, a ring of air, sparks and a puff of smoke.",
  tags: ["melee", "whip", "crack", "lash", "combat", "directional", "one-shot"],
  size: [192, 80],
  origin: [30, 68],
  duration: 0.85,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#2a1a10", "#5c3a1e", "#9c6a34", "#d8a45a", "#ffd890", "#fff4d6", "#ffffff"],
    sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
    length: 76,
    seed: 3,
  },
};

const STANCE = { ...READY, weapon: "handle", x: -7, sa: -0.3, fx: 13, fy: -21, bx: 7, by: -18 };
const COCK = { ...STANCE, crouch: 4, lean: -3, fx: -6, fy: -38, sa: -2.2, bx: 9, by: -23, armsFront: true, ffx: 9, fbx: -7 };
const CRACK_ = { ...STANCE, crouch: 4, lean: 5, fx: 18, fy: -21, sa: 0, bx: -8, by: -23, ffx: 12, fbx: -10, toeB: true };
const act = {
  target: { x: 94 },
  poses: [
    [-0.46, STANCE],
    [-0.22, COCK],
    [0.02, { ...COCK, lean: -4 }],
    [0.06, { ...CRACK_, fx: 15, fy: -34, sa: -0.7, lean: 2, ghost: 1 }, "snap"],
    [0.12, CRACK_, "snap"],
    [0.21, CRACK_],
    [0.26, { ...CRACK_, fx: 15, fy: -27, sa: -0.3, lean: 2, crouch: 3 }, "snap"],
    [0.44, { ...CRACK_, fx: 17, fy: -22, sa: 0.1, lean: 3, crouch: 3 }],
    [0.92, STANCE],
  ],
  hits: [{ t: 0.21, stop: 0.1, shake: 0.14, amp: 2, push: 2.4, straw: 14, y: -28 }],
  dust: [{ t: 0.06, x: 2, n: 4, dir: 1 }],
};

const ROLL0 = 0.02, ROLL = 0.19, CRACK = ROLL0 + ROLL; // the loop runs out; the tip cracks when it gets there
const RECOIL = 0.16;

function create(o) {
  const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks }), lights = new Lights();
  const L = o.length, HX = 11, HY = -21, TIP = [HX + L, HY - 1];
  // how far down the whip the loop has run: it starts a third of the way out, cocked, and accelerates
  const lam = (t) => L * (0.34 + 0.66 * ease.inQuad(clamp((t - ROLL0) / ROLL)));
  // the whip as points, handle to tip: straight out to the loop, round the loop, folded back under it
  const shape = (t) => {
    const l = lam(t), r = 6.5 - 3.5 * (l / L), pts = [];
    const recoil = smooth(CRACK + 0.04, CRACK + 0.04 + RECOIL, t), len = L * (1 - recoil * 0.85);
    for (let s = 0; s <= len; s += 1) {
      let x, y;
      if (s <= l) (x = HX + s), (y = HY - Math.sin((Math.PI * s) / Math.max(l, 1)) * 2.5 * (1 - l / L));
      else if (s <= l + Math.PI * r) {
        const th = (s - l) / r;
        (x = HX + l + Math.sin(th) * r), (y = HY + r - Math.cos(th) * r);
      } else (x = HX + l - (s - l - Math.PI * r)), (y = HY + 2 * r);
      // after the crack it sags as it's pulled back in
      if (recoil > 0) y += Math.sin((Math.PI * s) / L) * 6 * recoil;
      pts.push([x, y]);
    }
    return pts;
  };
  const spikes = [0, 0.8, 1.6, 2.4, 3.14, 3.9, 4.7, 5.5].map((a, i) => ({ a: a + Rg.range(-0.15, 0.15), len: (i === 0 ? 13 : i % 2 ? 6 : 9) + Rg.range(0, 3), w: 1.4 + Rg.range(0, 0.5) }));
  const slivers = [-1.2, -0.3, 0.5, 1.3].map((a) => ({ a: a + Rg.range(-0.2, 0.2), r: Rg.range(4, 6), v: Rg.range(80, 120), arc: Rg.range(0.4, 0.7) }));
  let t = 0, cracked = false;
  const tipTrail = [];
  return {
    update(dt) {
      t += dt;
      if (t > CRACK - 0.05 && t < CRACK + 0.01) {
        const pts = shape(t);
        tipTrail.push({ p: pts[pts.length - 1], t });
      }
      for (let i = tipTrail.length - 1; i >= 0; i--) if (t - tipTrail[i].t > 0.06) tipTrail.splice(i, 1);
      if (!cracked && t >= CRACK) {
        cracked = true;
        lights.add(TIP[0], TIP[1], 46, C[4], 0.6, 0.3);
        lights.add(TIP[0], TIP[1], 14, WHITE, 0.8, 0.07);
        for (let i = 0; i < 16; i++) {
          const a = Rg.range(-1.3, 1.2), sp = Rg.range(130, 300);
          ps.spawn(P.SPARK, TIP[0], TIP[1], Math.cos(a) * sp, Math.sin(a) * sp - 40, Rg.range(0.12, 0.36));
        }
        for (let i = 0; i < 3; i++) ps.spawn(P.SMOKE, TIP[0] + Rg.range(-2, 3), TIP[1] + Rg.range(-2, 2), Rg.range(10, 40), -Rg.range(6, 18), Rg.range(0.5, 0.8), C[2], Rg.range(2.5, 4), Rg.range(0.02, 0.06));
        for (let i = 0; i < 4; i++) ps.spawn(P.STAR, TIP[0] + Rg.range(-8, 10), TIP[1] + Rg.range(-8, 8), 0, -3, Rg.range(0.2, 0.4), Rg.chance(0.5) ? C[5] : WHITE, Rg.range(0.8, 1.8), Rg.range(0.05, 0.2));
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const end = CRACK + 0.04 + RECOIL;
      if (t < end) {
        const fade = 1 - smooth(end - 0.06, end, t);
        // afterimages of the whip a beat and two beats back: the loop's motion
        if (t < CRACK)
          for (const [lag, c, a] of [[0.03, C[1], 0.5], [0.015, C[2], 0.7]]) {
            const old = shape(Math.max(0, t - lag));
            for (let i = 1; i < old.length; i += 2) p.dot(old[i][0], old[i][1], c, a);
          }
        // the whip: thicker and lit near the handle, a single line to the tip
        const pts = shape(t), n = pts.length, l = lam(t), r = 6.5 - 3.5 * (l / L);
        for (let i = 1; i < n; i++) {
          const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], u = i / n, s = i;
          // the loop's leading half is moving fastest: it runs hot
          const inLoop = t < CRACK && s > l && s < l + Math.PI * r, lead = inLoop && Math.abs(s - l - (Math.PI * r) / 2) < r * 0.9;
          p.line(x0, y0, x1, y1, lead ? WHITE : inLoop ? C[5] : u < 0.5 ? C[4] : C[3], fade);
          if (u < 0.4) p.line(x0, y0 + 1, x1, y1 + 1, C[2], fade);
        }
        // the running loop is the fastest part: it shines
        if (t < CRACK) {
          const l = lam(t), r = 6.5 - 3.5 * (l / L);
          p.glow(HX + l + r, HY + r, 12, C[4], 0.4);
        }
      }
      // the tip's path just before the crack: a white-hot streak
      for (let i = 1; i < tipTrail.length; i++) {
        const k = 1 - (t - tipTrail[i].t) / 0.06;
        p.line(tipTrail[i - 1].p[0], tipTrail[i - 1].p[1], tipTrail[i].p[0], tipTrail[i].p[1], k > 0.6 ? WHITE : C[5], k);
      }
      // the crack: a white pop, a ring of air, slivers
      const q = t - CRACK;
      if (q >= 0 && q < 0.035) star(p, TIP[0], TIP[1], spikes, 1, 1, WHITE, C[5], C[6], C[4]);
      else if (q >= 0.035 && q < 0.07) star(p, TIP[0], TIP[1], spikes, 1.3, 0.5, C[6], C[5], C[5], C[3]);
      if (q >= 0.02 && q < 0.2) {
        const k = (q - 0.02) / 0.18, r = 4 + 16 * ease.outCubic(k), th = Math.max(1, 2.2 * (1 - k)), col = k < 0.25 ? WHITE : k < 0.5 ? C[5] : k < 0.75 ? C[4] : C[3];
        for (let a = 0; a < TAU; a += 0.6 / r)
          for (let o = 0; o < th; o += 0.5) p.dot(TIP[0] + Math.cos(a) * (r - o), TIP[1] + Math.sin(a) * (r - o) * 0.8, col, 1.15 - k);
        p.glow(TIP[0], TIP[1], r + 6, C[4], 0.25 * (1 - k));
      }
      if (q >= 0.04 && q < 0.16) {
        const k = (q - 0.04) / 0.12;
        for (const s of slivers) sliver(p, TIP[0], TIP[1], s.a, s.r + s.v * (q - 0.04), s.arc * (1 - 0.4 * k), k < 0.4 ? C[6] : C[5], 1 - k);
      }
      if (q >= 0 && q < 0.15) p.glow(TIP[0], TIP[1], 26, C[5], 0.7 * Math.exp(-q / 0.04));
      ps.draw(p);
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.act = act; __e.create = create;
};

__M["fx/melee/_lib.js"] = function (__e) {
// Shared by the melee effects: swings on a tilted circle (the smear, its dotted trace), floor cracks, rocks.
// The crescent and trace recipe is adapted from Sprite Fusion's open-source slash
// (https://www.spritefusion.com/pixel-art-vfx/slash), MIT License, Copyright (c) 2026 Hugo Duprez.
// Files starting with _ are helpers, not effects.

const {P, clamp, smooth, ease, hex, mix, scale, rgb, WHITE, TAU} = __req("core/index.js");

/**
 * A swing: a circle of radius R around (cx, cy), squashed to sy across its plane (1 stands up facing us, 0.16
 * lies on the floor) and turned by rot, swept from angle a0 in direction dir (+1 turns clockwise on screen).
 * k lifts the band into a shallow cone: a point dr inside the rim sits k * dr higher, so a level ring shows its
 * near half broad and its far half thin, like a blade angled down from the hilt (keep k below sy).
 * Positions along it are u, radians from a0 in the swing's direction.
 */
const swing = (o) => ({ cx: 0, cy: 0, R: 30, sy: 1, rot: 0, a0: 0, dir: 1, k: 0, ...o });

/** A swing on radius R whose arc passes through (x, y) heading along angle th, that point `at` of the way along span. */
function through(x, y, th, dir, R, span, at = 0.55, extra = {}) {
  const a = th - (dir * Math.PI) / 2;
  return swing({ cx: x - Math.cos(a) * R, cy: y - Math.sin(a) * R, R, sy: 1, rot: 0, a0: a - dir * span * at, dir, span, ...extra });
}

/** The screen point at plane radius r, u radians along the swing. */
function onSwing(s, r, u) {
  const a = s.a0 + s.dir * u, lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy - s.k * (s.R - r), c = Math.cos(s.rot), n = Math.sin(s.rot);
  return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
}

/** The on-screen unit direction the swing travels at u, and the in-plane angle there (sin < 0 is the far half). */
function travel(s, u) {
  const [x0, y0] = onSwing(s, s.R, u), [x1, y1] = onSwing(s, s.R, u + 0.01), l = Math.hypot(x1 - x0, y1 - y0) || 1;
  return { x: x0, y: y0, dx: (x1 - x0) / l, dy: (y1 - y0) / l, a: s.a0 + s.dir * u };
}

/** The plane radius and angle under a screen point (inverts onSwing, cone included). */
function plane(s, x, y) {
  const c = Math.cos(s.rot), n = Math.sin(s.rot), dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * n, ly = -dx * n + dy * c;
  if (!s.k) return [Math.hypot(lx, ly / s.sy), Math.atan2(ly / s.sy, lx)];
  // r sin(a) sy = m - k r, r cos(a) = lx  =>  r^2 (sy^2 - k^2) + 2 m k r - (lx^2 sy^2 + m^2) = 0
  const m = ly + s.k * s.R, A = s.sy * s.sy - s.k * s.k, B = 2 * m * s.k, Cc = lx * lx * s.sy * s.sy + m * m;
  const r = (-B + Math.sqrt(B * B + 4 * A * Cc)) / (2 * A);
  return [r, Math.atan2((m - s.k * r) / s.sy, lx)];
}

/**
 * Shade a swing's band from u0 to u1 (u1 - u0 at most a full turn), plane radius R + pad down to R - wMax - 1.
 * fn(u, r, out, a) shades each pixel: u along the swing, r its plane radius, a the in-plane angle. half: 0 the
 * whole band, -1 only the far half (behind a character), 1 only the near half.
 */
function smear(p, s, u0, u1, wMax, fn, half = 0, pad = 1) {
  if (u1 - u0 < 0.005) return;
  const c = Math.cos(s.rot), n = Math.sin(s.rot), A = s.R + pad + 1, Bn = A * s.sy + s.k * (wMax + 2);
  const hx = Math.hypot(A * c, Bn * n) + 1, hy = Math.hypot(A * n, Bn * c) + 1, rIn = s.R - wMax - 1;
  // each half only needs its side of the centre (plus what the tilt and the cone lift can reach across)
  const over = Math.abs(n) * A + s.k * (wMax + 2) + 2, y0 = half > 0 ? s.cy - over : s.cy - hy, y1 = half < 0 ? s.cy + over : s.cy + hy;
  p.shade(s.cx - hx, y0, s.cx + hx, y1, (x, y, out) => {
    const [r, a] = plane(s, x, y);
    if (r > s.R + pad || r < rIn) return;
    if (half && (Math.sin(a) < 0 ? -1 : 1) !== half) return;
    let u = (s.dir * (a - s.a0)) % TAU;
    if (u < 0) u += TAU;
    while (u < u0) u += TAU;
    if (u > u1) return;
    return fn(u, r, out, a);
  });
}

/** Dots along a swing at plane radius r from u0 to u1, every `step` px, alpha a(u) (dithered into a dotted trace). */
function trace(p, s, r, u0, u1, c, a, half = 0, step = 0.6) {
  const du = step / Math.max(4, r);
  for (let u = u0; u <= u1; u += du) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), k = typeof a === "function" ? a(u) : a;
    if (k > 0) p.dot(x, y, typeof c === "function" ? c(u) : c, k);
  }
}

/** Glow riding a swing from u0 to u1 (light along the arc). */
function glowAlong(p, s, r, u0, u1, rad, c, k, half = 0, step = 0.35) {
  for (let u = u0; u <= u1; u += step) {
    const g = s.a0 + s.dir * u;
    if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
    const [x, y] = onSwing(s, r, u), kk = typeof k === "function" ? k(u) : k;
    if (kk > 0.004) p.glow(x, y, rad, c, kk);
  }
}

/**
 * A slash crescent along swing s (Sprite Fusion's recipe): the edge whips out over s.span radians in s.sweep s,
 * holds, then the tail follows over s.trail, thinning and cooling down s.ramp (dark to bright); a dotted trace
 * lingers where it passed. s: a swing plus { span, W, t0, sweep, hold, trail, ramp, hot (0..1 flashes it white),
 * lens (thickest in the middle, not just behind the edge) }.
 */
function slash(p, s, t, half = 0) {
  const u = t - s.t0;
  if (u < 0) return;
  const R = s.ramp, n = R.length, life = s.sweep + s.hold + s.trail, hot = s.hot ?? 0;
  const head = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, life, u), age = clamp(u / life);
  const U = s.span * head, T = s.span * tail, W = s.W * (1 - tail * 0.55);
  if (tail < 1 && U - T > 0.01) {
    smear(p, s, T, U, W, (uu, r, out) => {
      const v = (uu - T) / (U - T), w = W * Math.pow(Math.sin(Math.PI * Math.pow(v, s.lens ? 1 : 2.2)), s.lens ? 0.75 : 0.6);
      if (w < 0.35) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = (q < 0.22 && age < 0.5) || q < hot * 0.7 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4 - hot * 3);
      out.c = R[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / (s.lens ? 0.1 : 0.4));
    }, half);
    glowAlong(p, s, s.R - W * 0.4, T, U, 5 + W, R[n - 3], (uu) => (0.22 + hot * 0.3) * (1 - age) * ((uu - T) / (U - T)), half, 0.3);
  }
  const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
  if (tail > 0.02 && th > 0) trace(p, s, s.R - 0.5, 0, T, R[2], (uu) => th * (0.4 + 0.6 * uu / s.span), half);
}

/** Where a slash's edge ends up, and which way it's travelling there. */
const slashEnd = (s) => travel({ ...s, R: s.R - s.W * 0.3 }, s.span);

/** Shavings flung off a slash's edge, outward from its circle (Sprite Fusion's slash). */
function shavings(ps, R, s, n, colors, from = 0.3) {
  for (let i = 0; i < n; i++) {
    const [x, y] = onSwing(s, s.R, s.span * R.range(from, 1)), ox = x - s.cx, oy = y - s.cy, l = Math.hypot(ox, oy) || 1, sp = R.range(30, 100);
    ps.spawn(P.MOTE, x, y, (ox / l) * sp, Math.min(25, (oy / l) * sp) - 10, R.range(0.25, 0.55), R.pick(colors), 0.6);
  }
}

/** Stone shades for rocks, grit and dust from one body color (as Sprite Fusion's explosion does). */
function stone(c) {
  c = hex(c);
  return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3), dark: scale(c, 0.42) };
}

const OUTLINE = hex("#1a1422");
/** A tumbling rock (a Bits CHUNK): a lit side, a shaded side, an outline, fading at the end of its life. */
function rock(p, b, st) {
  const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
  p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
    if (d > r + 0.9) return;
    const lit = dx * lx + dy * ly;
    out.c = d > r ? OUTLINE : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
    out.a = fade;
  });
}

/**
 * Jagged cracks splitting the floor from x0: each runs out along the floor's edge and zig-zags down into its
 * face (y from 0 to about depth), with short forks. n cracks alternate sides (bias > 0 sends more forward).
 * Returns [{ pts, at (0..1 how far out it starts), fork }]. Built once from an Rng.
 */
function cracks(R, x0, n, reach, depth = 7, bias = 0.3) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const side = R.chance(0.5 + bias * 0.5) ? 1 : -1, L = reach * R.range(0.45, 1) * (i < 2 ? 1 : 0.7), pts = [[x0 + side * R.range(0, 1.5), 0]];
    let x = pts[0][0], y = 0;
    while (Math.abs(x - x0) < L && y < depth) {
      x += side * R.range(1.5, 3.5);
      y = Math.min(depth, Math.max(0, y + R.range(-0.6, 1.6) * (Math.abs(x - x0) > 3 ? 1 : 0.3)));
      pts.push([Math.round(x), Math.round(y)]);
      if (R.chance(0.18) && pts.length > 3 && y < depth - 2) {
        const f = [[Math.round(x), Math.round(y)]];
        let fx = x, fy = y;
        for (let j = R.int(1, 3); j > 0; j--) (fx += side * R.range(1, 3)), (fy += R.range(0.8, 2)), f.push([Math.round(fx), Math.round(Math.min(depth + 1, fy))]);
        out.push({ pts: f, at: Math.abs(x - x0) / reach, fork: true });
      }
    }
    out.push({ pts, at: 0, fork: false });
  }
  return out;
}

/**
 * An impact star (after Sprite Fusion's impact): tapered spikes [{ a, len, w }] around (x, y), drawn in three
 * passes (rim, body, core) with a hot disc in the middle. sc stretches, th thins.
 */
function star(p, x, y, spikes, sc, th, core, body, inner, rim) {
  for (const pass of [0, 1, 2])
    for (const s of spikes) {
      const c = Math.cos(s.a), sn = Math.sin(s.a), L = s.len * sc;
      for (let d = 0; d <= L; d += 0.5) {
        const hw0 = s.w * th * (1 - d / L) * Math.min(1, 0.5 + d / 3), hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
        if (pass === 2 && d > L * 0.55) break;
        for (let o = -hw; o <= hw; o += 0.5) p.px(x + c * d - sn * o, y + sn * d + c * o, pass === 0 ? rim : pass === 1 ? (d < L * 0.35 ? inner : body) : core);
      }
    }
  const r = 2.4 * sc * Math.sqrt(th);
  p.circle(x, y, r + 0.8, inner);
  p.circle(x, y, r, core);
}

/** A thin arc flying out from (x, y): a sliver at radius r around angle a, arc radians long, dithered by k. */
function sliver(p, x, y, a, r, arc, c, k) {
  const n = Math.ceil(r * arc * 2.2);
  for (let j = 0; j <= n; j++) {
    const u = j / n - 0.5, th = a + u * arc, w = 1.4 * (1 - Math.abs(u) * 2);
    for (let o = -w * 0.5; o <= w * 0.5 + 0.01; o += 0.5) p.dot(x + Math.cos(th) * (r + o), y + Math.sin(th) * (r + o), c, k);
  }
}

/** Part of a polyline: the first `len` px of it. Calls fn(x0, y0, x1, y1, d) for each piece (d: distance along). */
function along(pts, len, fn) {
  let d = 0;
  for (let i = 1; i < pts.length && d < len; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0), f = Math.min(1, (len - d) / l);
    fn(x0, y0, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, d);
    d += l;
  }
}


__e.swing = swing; __e.through = through; __e.onSwing = onSwing; __e.travel = travel; __e.plane = plane; __e.smear = smear; __e.trace = trace; __e.glowAlong = glowAlong; __e.slash = slash; __e.slashEnd = slashEnd; __e.shavings = shavings; __e.stone = stone; __e.rock = rock; __e.cracks = cracks; __e.star = star; __e.sliver = sliver; __e.along = along;
};

__M["fx/melee/sword-slash.js"] = function (__e) {
// The crescent, echo, trail, glint and spark recipe is adapted from Sprite Fusion's open-source slash
// (https://www.spritefusion.com/pixel-art-vfx/slash), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, P, Rng, fit, sparkle, clamp, smooth, ease, TAU, READY} = __req("core/index.js");

const meta = {
  name: "Sword slash",
  desc: "A tilted crescent whips round in two frames, cools from white to deep blue as it trails off, glints at the tip and throws sparks.",
  tags: ["melee", "slash", "sword", "combat", "directional", "one-shot"],
  size: [136, 104],
  origin: [44, 92],
  duration: 0.75,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#b8c9e8", "#e8f1ff", "#ffffff"],
    sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
    radius: 42,
    seed: 2,
  },
};

const GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
// the blade goes back past his head, then lags behind the hand on the way through, so the wrist breaks and it whips
const WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
const CUT = { ...GUARD, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
const DOWN = { ...GUARD, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
const act = {
  target: { x: 58 },
  poses: [
    [-0.55, { ...GUARD, x: -8 }],
    [-0.3, WIND],
    [-0.08, { ...WIND, crouch: 5, lean: -5 }],
    [0, CUT, "snap"],
    [0.06, DOWN, "snap"],
    [0.3, { ...DOWN, x: 3, crouch: 6 }],
    [0.58, { ...GUARD, x: 1, crouch: 3, fx: 15, fy: -21, sa: 0.1, bx: -5, by: -21, ffx: 9, fbx: -7 }],
    [0.86, { ...GUARD, x: -8 }],
  ],
  hits: [{ t: 0.06, stop: 0.14, shake: 0.18, amp: 2, push: 2.8, straw: 18 }],
  dust: [{ t: 0.06, x: 16, n: 7, dir: 1 }, { t: 0.06, x: -11, n: 4, dir: -1 }],
};

// a point on the slash's tilted ellipse
function onArc(s, r, a) {
  const lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy, c = Math.cos(s.rot), n = Math.sin(s.rot);
  return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
}

// the smear: thickest just behind the leading edge, tapering to a hair at the tail, white on the outer rim,
// cooling down the ramp with age and towards the tail; the tail dissolves through the dither
function crescent(p, s, ta, L, W, age) {
  if (Math.abs(L) < 0.02 || W < 0.3) return;
  const R = s.ramp, n = R.length, dir = Math.sign(L), span = Math.abs(L), c = Math.cos(s.rot), sn = Math.sin(s.rot), B = s.R + 2;
  p.shade(s.cx - B, s.cy - B, s.cx + B, s.cy + B, (x, y, out) => {
    const dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * sn, ly = (-dx * sn + dy * c) / s.sy, r = Math.hypot(lx, ly);
    if (r > s.R + 0.5 || r < s.R - W - 1) return;
    let u = (dir * (Math.atan2(ly, lx) - ta)) % TAU;
    if (u < 0) u += TAU;
    if (u > span) return;
    const v = u / span, w = W * Math.pow(Math.sin(Math.PI * Math.pow(v, 2.2)), 0.6);
    if (w < 0.35) return;
    const q = (s.R - r) / w;
    if (q < 0 || q > 1) return;
    // brightest step at the rim while it's young, then darker steps inward, with age and towards the tail
    const ci = q < 0.22 && age < 0.5 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4);
    out.c = R[n - 1 - clamp(ci, 0, n - 1)];
    out.a = Math.min(1, v / 0.4);
  });
  for (let u = 0; u <= span; u += 0.3) {
    const [x, y] = onArc(s, s.R - W * 0.4, ta + dir * u);
    p.glow(x, y, 5 + W, R[n - 3], 0.22 * (1 - age) * (u / span));
  }
}

function drawSlash(p, s, t) {
  const u = t - s.t0;
  if (u < 0) return;
  const span = s.a1 - s.a0, head = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, s.sweep + s.hold + s.trail, u);
  const age = clamp(u / (s.sweep + s.hold + s.trail));
  if (tail < 1) crescent(p, s, s.a0 + span * tail, span * (head - tail), s.W * (1 - tail * 0.55), age);
  // a dotted trace of the blade's path lingers where the smear has already gone
  const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
  if (tail > 0.02 && th > 0)
    for (let k = 0; k <= tail; k += 0.6 / (Math.abs(span) * s.R)) {
      const [x, y] = onArc(s, s.R - 0.5, s.a0 + span * k);
      p.dot(x, y, s.ramp[1], th * (0.4 + 0.6 * k));
    }
}

function tipOf(s) {
  const [x, y] = onArc(s, s.R - s.W * 0.3, s.a1), [x2, y2] = onArc(s, s.R - s.W * 0.3, s.a1 + Math.sign(s.a1 - s.a0) * 0.05);
  const l = Math.hypot(x2 - x, y2 - y) || 1;
  return { x, y, dx: (x2 - x) / l, dy: (y2 - y) / l };
}

function create(o) {
  const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
  const R0 = o.radius, a0 = -2.55, a1 = 0.95;
  // the main smear, and a thinner echo just inside it a beat behind
  const A = { cx: 6, cy: -26, R: R0, sy: 0.6, rot: -0.38, a0, a1, W: 12, t0: 0, sweep: 0.06, hold: 0.06, trail: 0.24, ramp: C };
  const E = { ...A, R: R0 * (33 / 42), W: R0 * (4.5 / 42), a0: a0 + (a1 - a0) * 0.1, a1: a1 - (a1 - a0) * (0.15 / 3.5), t0: 0.017, hold: 0.03, trail: 0.2, ramp: C.slice(0, 6) };
  const tip = tipOf(A);
  let t = 0, landed = false;
  return {
    update(dt) {
      t += dt;
      if (!landed && t >= A.sweep) {
        landed = true;
        // sparks off the edge where it stops, and bright shavings flung off the arc
        for (let i = 0; i < 10; i++) {
          const a = Math.atan2(tip.dy, tip.dx) + Rg.range(-0.5, 0.5), sp = Rg.range(150, 400);
          ps.spawn(P.SPARK, tip.x, tip.y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.35));
        }
        for (let i = 0; i < 16; i++) {
          const a = a0 + (a1 - a0) * Rg.range(0.3, 1), [x, y] = onArc(A, A.R, a);
          const ox = x - A.cx, oy = y - A.cy, l = Math.hypot(ox, oy) || 1, sp = Rg.range(30, 100);
          ps.spawn(P.MOTE, x, y, (ox / l) * sp, (oy / l) * sp - 10, Rg.range(0.25, 0.55), C[4 + Rg.int(0, 1)], 0.6);
        }
      }
      ps.update(dt);
    },
    draw(p) {
      drawSlash(p, E, t);
      drawSlash(p, A, t);
      // the tip glints as the edge arrives
      const g = t - A.sweep * 0.6;
      if (g > 0 && g < 0.22) sparkle(p, tip.x, tip.y, 9 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.22), C[5], C[3], 0.6);
      // light rides the head of the swing
      if (t < 0.3) {
        const [x, y] = onArc(A, A.R - 4, A.a0 + (A.a1 - A.a0) * ease.outExpo(clamp(t / A.sweep)));
        p.glow(x, y, 40, C[3], 0.5 * (1 - t / 0.3));
      }
      ps.draw(p);
    },
  };
}

__e.meta = meta; __e.act = act; __e.create = create;
};

__M["fx/shadow/shadow-flames.js"] = function (__e) {
// Tongues built from nested layers, each narrower and shorter than the last, are adapted from Sprite Fusion's
// open-source fire (https://www.spritefusion.com/pixel-art-vfx/fire), MIT License, Copyright (c) 2026 Hugo Duprez.
// Here the layers run the other way: a pale skin outside, violet within, a black heart at the core.
const {cycle, fit, noise2, TAU, WHITE, mix} = __req("core/index.js");
const {VOID} = __req("fx/shadow/_lib.js");

const meta = {
  name: "Shadow flames",
  desc: "Inside-out fire on the floor: a black heart wrapped in violet flame with pale skin and tips, shedding embers and dark smoke.",
  tags: ["shadow", "fire", "flame", "ground", "dark", "magic", "loop"],
  size: [104, 112],
  origin: [52, 102],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: VOID, seed: 12 },
};

const D = 2.4, GX = 22, GY = 60;
// tongues: offset, base height, width, seed; the middle tallest
const TONGUES = [[-11, 20, 4.2, 1], [11, 22, 4.4, 2], [-6, 31, 5.4, 3], [6, 29, 5.2, 4], [0, 40, 6.6, 5]];
// layers from the outside in: width share, height share, which tone (3 is the black heart)
const LAYERS = [[1, 1, 0], [0.8, 0.88, 1], [0.54, 0.68, 2], [0.32, 0.48, 3]];

// noise that comes back to where it started each loop: a circle through 2D noise, offset by v
const lnoise = (t, v, seed, speed = 5) => noise2(Math.cos((TAU * t) / D) * speed + v, Math.sin((TAU * t) / D) * speed, seed);

function drawBack(p, t, o) {
  const C = fit(o.palette, 8), S = o.seed;
  // the scorched floor: a dark burn, violet light pooled on it
  p.ellipse(0, 0.5, 22, 3.2, (d) => (d < 0.6 ? C[0] : C[1]), (d) => (d < 0.85 ? 1 : (1 - d) * 6));
  p.glow(0, -2, 46, C[4], 0.3);
  // dark smoke climbing off the tips, a lit rim on its underside
  cycle(t, D, 14, S + 1, (r) => r.range(1.2, 1.9), (age, L, r) => {
    const u = age / L, x = r.range(-6, 6) + Math.sin(u * 4 + r.range(0, 6)) * 5 * u, y = -30 - u * r.range(36, 52), rad = 3 + u * 6;
    const a = Math.min(1, u * 6) * (1 - u) * 0.7;
    p.disc(x, y, rad, mix(mix(C[3], C[2], 0.5), C[1], u), a);
    p.disc(x - rad * 0.2, y - rad * 0.3, rad * 0.5, C[3], a * 0.4);
    p.disc(x, y + rad * 0.45, rad * 0.55, C[5], a * 0.45 * (1 - u));
  });
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), S = o.seed, TONE = [C[6], C[4], C[2], C[0]];
  // rasterize the tongues, outermost first, into a grid of tones
  const grid = new Int8Array(GX * 2 * GY).fill(-1), set = (x, y, v) => {
    const i = Math.round(x) + GX, j = Math.round(y) + GY;
    if (i >= 0 && j >= 0 && i < GX * 2 && j < GY) grid[j * GX * 2 + i] = v;
  };
  const order = TONGUES.map((_, i) => i).sort((a, b) => Math.abs(TONGUES[b][0]) - Math.abs(TONGUES[a][0]));
  for (const i of order) {
    const [dx, H0, w, n] = TONGUES[i], h = H0 * (0.78 + 0.22 * lnoise(t, n * 3, n, 4)), sway = lnoise(t, n * 7, n + 9, 3) * 3;
    for (const [lw, lh, tone] of LAYERS) {
      const Hl = h * lh;
      for (let r = 0; r <= Hl; r++) {
        const u = r / Math.max(1, Hl);
        const half = w * lw * Math.pow(1 - u, 0.85) * Math.min(1, (r + 1.5) / 3.5) + lnoise(t, r * 0.45 + n, n + 20, 6) * 1.1 + lnoise(t, r * 1.3 + n * 5, n + 50, 9) * 0.6;
        const cx = dx + sway * u * u * lh + lnoise(t, r * 0.2 + n * 2, n + 30, 5) * u * 1.4;
        if (half < 0.3) continue;
        for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
          // the skin breaks up near the top: pixels flicker out of it
          if (tone === 0 && u > 0.45 && lnoise(t, x * 0.9 + r * 0.7 + n, n + 60, 8) > 0.35) continue;
          set(x, -r, tone);
        }
      }
    }
  }
  // draw it: the pale skin whitening to its tips, the black heart pure black
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX * 2; i++) {
      const v = grid[j * GX * 2 + i];
      if (v < 0) continue;
      const x = i - GX, y = j - GY;
      let c = TONE[v];
      if (v === 0 && y < -24 && (grid[(j - 1) * GX * 2 + i] ?? -1) < 0) c = y < -32 ? WHITE : C[7];
      p.px(x + 0.5, y + 0.5, c);
    }
  // licks of pale flame breaking off the tips
  cycle(t, D, 34, S, (r) => r.range(0.25, 0.5), (age, L, r) => {
    const u = age / L, k = r.int(0, 4), [dx, H0] = TONGUES[k], x = dx + r.range(-4, 4) + u * r.range(-5, 5), y = -H0 * r.range(0.45, 0.85) - u * r.range(10, 20);
    const rad = r.range(1, 2.2) * (1 - u) + 0.3;
    p.circle(x, y, rad + 0.6, u < 0.5 ? C[6] : C[4]);
    if (rad > 1) p.circle(x, y + 0.4, rad * 0.5, u < 0.3 ? C[2] : C[4]);
  });
  // embers drifting up, flickering, cooling to violet
  cycle(t, D, 30, S + 2, (r) => r.range(1, 1.8), (age, L, r) => {
    const u = age / L, x = r.range(-12, 12) + Math.sin(u * 6 + r.range(0, 6)) * 5 * u, y = -10 - u * r.range(40, 70);
    if (u > 0.7 && Math.sin(age * 40 + x) < 0) return;
    p.px(x, y, u < 0.3 ? WHITE : u < 0.6 ? C[7] : C[6]);
    p.glow(x, y, 3, C[6], 0.35 * (1 - u));
  });
  // light: a violet bloom round it, but none on the black heart
  const fl = 0.85 + 0.15 * lnoise(t, 0, 77, 6);
  p.glow(0, -16, 52, C[4], 0.5 * fl);
  p.glow(0, -12, 26, C[6], 0.34 * fl);
  for (let j = 0; j < GY; j++)
    for (let i = 0; i < GX * 2; i++) if (grid[j * GX * 2 + i] === 3) {
      const sx = p.cellX(i - GX + 0.5, j - GY + 0.5) - p.ox, sy = p.cellY(i - GX + 0.5, j - GY + 0.5) - p.oy;
      if (sx >= 0 && sy >= 0 && sx < p.w && sy < p.h) p.L[sy * p.w + sx] = 0;
    }
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/shadow/_lib.js"] = function (__e) {
// The flame puff (after sim.js's FIRE) and the swirling pull (attract) are adapted from Sprite Fusion's
// open-source black-hole (https://www.spritefusion.com/pixel-art-vfx/black-hole),
// MIT License, Copyright (c) 2026 Hugo Duprez.
//
// Shared bits for the shadow effects (files starting with _ are helpers, not effects): the void palette,
// light that black shapes cut, smoke lit from one side, violet flame, obsidian slivers, ink drops.

const {hex, mix, ramp, clamp, noise, WHITE, GRAVITY} = __req("core/index.js");

/** Dark magic, dark to bright: void black, deep violet, a white-lilac edge. */
const VOID = ["#06040b", "#150c26", "#2a1150", "#461a84", "#6f2cc0", "#9d5cec", "#cfa6ff", "#f6eaff"];

/**
 * Take the light back off every pixel in a local box where dark(x, y) is true, keeping a share keep (0..1):
 * call it last, so black shapes stay black under every glow, spark and ring drawn before.
 */
function unlight(p, x0, y0, x1, y1, dark, keep = 0) {
  const L = p.L, w = p.w, ox = p.ox, oy = p.oy;
  p.each(x0, y0, x1, y1, (x, y, sx, sy) => {
    if (!dark(x, y)) return;
    const i = (sy - oy) * w + (sx - ox), d = L[i];
    if (!d) return;
    if (keep <= 0) L[i] = 0;
    else L[i] = (255 << 24) | ((((d >>> 16) & 255) * keep) << 16) | ((((d >>> 8) & 255) * keep) << 8) | ((d & 255) * keep);
  });
}

// the pixel cells of the annulus r0 <= d < r1 round (x, y), row by row, jumping the hole: fn(cx, cy, d)
function annulus(x, y, r0, r1, fn) {
  const r02 = r0 > 0 ? r0 * r0 : -1, r12 = r1 * r1;
  for (let py = Math.floor(y - r1); py <= Math.ceil(y + r1); py++) {
    const cy = py + 0.5, dy = cy - y, dy2 = dy * dy;
    if (dy2 >= r12) continue;
    const xo = Math.sqrt(r12 - dy2), xi = dy2 < r02 ? Math.sqrt(r02 - dy2) : 0;
    for (let px = Math.floor(x - xo), x1 = Math.ceil(x + xo); px <= x1; px++) {
      const cx = px + 0.5, dx = cx - x;
      if (xi > 0 && dx > -xi && dx < xi) {
        px = Math.max(px, Math.floor(x + xi) - 1);
        continue;
      }
      const d2 = dx * dx + dy2;
      if (d2 < r12 && d2 >= r02) fn(cx, cy, Math.sqrt(d2));
    }
  }
}

/**
 * A ring from radius r - w out to r round (x, y), like p.ring (c and a may be functions of v: 0 inner to 1
 * outer, and angle) but visiting only the band's own pixels, so a big thin shock ring stays cheap.
 */
function ringFast(p, x, y, r, w, c, a = 1) {
  if (r <= 0) return;
  const r0 = Math.max(0, r - w), fc = typeof c === "function", fa = typeof a === "function";
  annulus(x, y, r0, r, (cx, cy, d) => {
    const v = (d - r0) / (r - r0 || 1), ang = fc || fa ? Math.atan2(cy - y, cx - x) : 0;
    p.dot(cx, cy, fc ? c(v, ang) : c, fa ? a(v, ang) : a);
  });
}

/** Light hugging a circle of radius R at (x, y), falling off over w either side, only where keep(x, y). */
function ringLight(p, x, y, R, w, c, k, keep = null) {
  if (w < 1 || k <= 0.004) return;
  const col = hex(c);
  annulus(x, y, Math.max(0, R - w), R + w, (cx, cy, d) => {
    if (keep && !keep(cx, cy)) return;
    const f = 1 - Math.abs(d - R) / w;
    p.light(cx, cy, col, f * f * k);
  });
}

/** A ring of light hugging a black disc: k at radius r0, falling to nothing at r1, and none inside r0. */
function halo(p, x, y, r0, r1, c, k) {
  if (r1 <= r0 || k <= 0.004) return;
  const col = hex(c), w = r1 - r0;
  annulus(x, y, Math.max(0, r0), r1, (cx, cy, d) => {
    const f = 1 - (d - r0) / w;
    p.light(cx, cy, col, f * f * k);
  });
}

/**
 * A black star rasterized once: four long arms (L) and four short ones, turned rot, at (0, cy), its cells
 * in a grid. { at(x, y) } says if a local point is black; draw(p, c, rim, skip) fills it and burns a rim on
 * the cells just outside it (except where skip(x, y)). The arms keep a 1 px black spine to their tips.
 */
function blackStar(cy, L, rot, short = 0.46, q = 0.32) {
  const R0 = Math.ceil(L) + 2, n = R0 * 2 + 1, data = new Uint8Array(n * n);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const x = i - R0 + 0.5, y = cy + j - R0 + 0.5;
      if (inStar(x, y, 0, cy, L, rot, q) || inStar(x, y, 0, cy, L * short, rot + Math.PI / 4, q)) data[j * n + i] = 1;
    }
  for (let a = 0; a < 4; a++)
    for (let d = 0, ca = Math.cos(rot + (a * Math.PI) / 2), sa = Math.sin(rot + (a * Math.PI) / 2); d < L - 1; d += 0.5) {
      const i = Math.floor(ca * d) + R0, j = Math.floor(sa * d) + R0;
      data[j * n + i] = 1;
    }
  const at = (x, y) => {
    const i = Math.floor(x) + R0, j = Math.floor(y - cy) + R0;
    return i >= 0 && j >= 0 && i < n && j < n && data[j * n + i] === 1;
  };
  return {
    R0,
    at,
    /** take the light off its black cells (call last, like unlight) */
    unlight(p) {
      const Lb = p.L, w = p.w, h = p.h, ox = p.ox, oy = p.oy;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          if (!data[j * n + i]) continue;
          const x = i - R0 + 0.5, y = cy + j - R0 + 0.5, sx = p.cellX(x, y) - ox, sy = p.cellY(x, y) - oy;
          if (sx >= 0 && sy >= 0 && sx < w && sy < h) Lb[sy * w + sx] = 0;
        }
    },
    draw(p, c, rim, skip) {
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const x = i - R0 + 0.5, y = cy + j - R0 + 0.5;
          if (data[j * n + i]) p.px(x, y, c);
          else if (rim && !skip(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) p.px(x, y, rim);
        }
    },
  };
}

/** Is (x, y) inside a four-point star at (cx, cy), arms L long, turned rot? q < 1 hollows the sides into thin spikes. */
function inStar(x, y, cx, cy, L, rot, q = 0.42) {
  if (L <= 0) return false;
  const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy;
  const u = Math.abs(dx * c + dy * s) / L, v = Math.abs(-dx * s + dy * c) / L;
  // inside needs the smaller of u, v under 0.5^(1/q): most points fail that before any pow
  return u < 1 && v < 1 && Math.min(u, v) <= Math.pow(0.5, 1 / q) && Math.pow(u, q) + Math.pow(v, q) <= 1;
}

/**
 * Pull particles (anything with x, y, vx, vy) toward (x, y): gravity softened at r0, a swirl round it, drag
 * that grows inside reach. Those that reach r0 are eaten (removed); returns how many. w(q) weighs each one
 * (0 leaves it alone).
 */
function attract(list, x, y, G, reach, swirl, r0, dt, w = () => 1, vmax = Infinity) {
  let eaten = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const q = list[i], wt = w(q);
    if (!wt || q.delay > 0) continue;
    const dx = x - q.x, dy = y - q.y, d2 = dx * dx + dy * dy;
    if (d2 > reach * reach) continue;
    const d = Math.sqrt(d2) || 1;
    if (d < r0) {
      list.splice(i, 1);
      eaten++;
      continue;
    }
    const a = (G / (d2 + r0 * r0)) * Math.min(1, (reach - d) / (reach * 0.25)) * wt * dt, ux = dx / d, uy = dy / d;
    q.vx += (ux - uy * swirl) * a;
    q.vy += (uy + ux * swirl) * a;
    const drag = Math.min(0.2, (1 - d / reach) * 1.6 * dt);
    q.vx -= q.vx * drag;
    q.vy -= q.vy * drag;
    const v = Math.hypot(q.vx, q.vy);
    if (v > vmax) (q.vx *= vmax / v), (q.vy *= vmax / v);
  }
  return eaten;
}

/** Puff kinds: FLAME (a ball of flame cooling down a ramp), SOOT (dark smoke lit on the side facing a light). */
const PK = { FLAME: 0, SOOT: 1 };

/**
 * Violet flame and dark smoke. opts: { rng, flame: ramp white-hot to burnt out, soot: [fresh, old] smoke
 * colours, cap: the soot's dim lit top, rim: [hot, warm, dim] colours of its lit side, floor: (x) => y }.
 * spawn(kind, x, y, vx, vy, life, size, delay, smokes): smokes turns a dying flame into soot.
 * draw(p, kind, light): light = { x, y, k, reach } is what the soot's rims face (k 0 leaves them dark).
 */
class Puffs {
  constructor(o) {
    this.R = o.rng;
    this.list = [];
    this.t = 0;
    this.F = ramp(o.flame);
    this.soot = ramp(o.soot);
    this.cap = hex(o.cap);
    this.rim = ramp(o.rim);
    this.floor = o.floor ?? null;
  }
  spawn(k, x, y, vx, vy, life, size, delay = 0, smokes = false) {
    this.list.push({ k, x, y, vx, vy, life, max: life, size, delay, smokes, seed: this.R.next() * 100 });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    const t = this.t;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      if (q.delay > 0) {
        q.delay -= dt;
        continue;
      }
      if ((q.life -= dt) <= 0) {
        if (q.k === PK.FLAME && q.smokes) this.spawn(PK.SOOT, q.x, q.y - 1, q.vx * 0.5, q.vy * 0.5 - 6, this.R.range(0.9, 1.6), q.size * 1.25);
        this.list.splice(i, 1);
        continue;
      }
      if (q.k === PK.FLAME) {
        q.vy -= 95 * dt;
        q.vx += Math.sin(t * 17 + q.seed) * 30 * dt;
        q.vx -= q.vx * 5 * dt;
        q.vy -= q.vy * 3.2 * dt;
      } else {
        q.vy -= 18 * dt;
        q.vx += Math.sin(t * 1.3 + q.seed) * 8 * dt;
        q.vx -= q.vx * 1.6 * dt;
        q.vy -= q.vy * 1.3 * dt;
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      // smoke rolls along the floor rather than through it
      if (this.floor && q.k === PK.SOOT) {
        const f = this.floor(q.x) - q.size * 0.6;
        if (q.y > f) (q.y = f), (q.vy = Math.min(0, q.vy)), (q.vx *= 1 - 2 * dt);
      }
    }
  }
  draw(p, kind, light = null) {
    const F = this.F, n = F.length;
    for (const q of this.list) {
      if (q.delay > 0 || q.k !== kind) continue;
      const k = q.life / q.max, age = 1 - k, x = q.x, y = q.y;
      if (q.k === PK.FLAME) {
        // a ball of flame: a darker rim, a lit core up and left, a tongue on top, a hot heart while young
        const heat = Math.min(0.999, Math.pow(age, 0.62) + (q.seed % 1) * 0.1), idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
        const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = F[idx];
        if (idx >= n - 3) p.disc(x, y, r, c, Math.min(1, k * 3) * 0.8);
        else {
          p.circle(x, y, r, F[Math.min(n - 1, idx + 2)]);
          p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
          if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
          if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, F[Math.max(0, idx - 1)]);
          if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.2 * k);
        }
        continue;
      }
      // soot: a soft body and a denser core, a dim cap on top, and lit from the side facing the light by two
      // discs pushed toward it (a soft wash over the near half, a brighter lip at its edge)
      const r = q.size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * 0.45);
      const a = Math.min(1, age * 10) * Math.min(1, k * 2.2) * 0.72, body = mix(this.soot[0], this.soot[1], age);
      // one pass for the body: thinner at the edge, denser in the core (two layers' worth)
      const edge = a * 0.5, core = 1 - (1 - a * 0.5) * (1 - a * 0.62);
      p.disc(x, y + r * 0.06, r, body, (d) => (d < 0.72 ? core : edge));
      const lk = light ? light.k : 0;
      if (lk < 0.5) p.disc(x - r * 0.2, y - r * 0.32, r * 0.48, this.cap, a * 0.32 * (1 - age * 0.7) * (1 - lk * 2));
      if (lk <= 0.02) continue;
      const lx = light.x - x, ly = light.y - y, dl = Math.sqrt(lx * lx + ly * ly) || 1, ux = lx / dl, uy = ly / dl;
      const lit = Math.min(1, light.k * clamp(1.3 - dl / light.reach)) * a;
      if (lit <= 0.02) continue;
      const [hot, warm, dim] = this.rim;
      p.disc(x + ux * r * 0.26, y + uy * r * 0.26, r * 0.72, dim, lit * 0.55);
      p.disc(x + ux * r * 0.5, y + uy * r * 0.5, r * 0.46, warm, lit * 0.5);
      if (r > 3) p.disc(x + ux * r * 0.68, y + uy * r * 0.68, r * 0.24, hot, lit * 0.4);
    }
  }
}

/**
 * An obsidian shard from core Bits ({ x, y, a, s, life }): a thin triangle pointing along its spin angle, a
 * dark violet body, the long edge facing the light at (lx, ly) lit (brighter with lk), the other in shadow,
 * a white glint at the tip while the light is strong. C is an 8-step palette.
 */
function shard(p, b, C, lx, ly, lk) {
  const fa = Math.min(1, b.life / 0.4), ca = Math.cos(b.a), sa = Math.sin(b.a), L = Math.max(2, b.s), W = Math.max(2, L * 0.55);
  const side = -sa * (lx - b.x) + ca * (ly - b.y) > 0 ? 1 : -1;
  const rim = lk > 0.6 ? C[6] : lk > 0.3 ? C[5] : lk > 0.08 ? C[4] : C[3], E = L / 2 + 1.5;
  p.shade(b.x - E, b.y - E, b.x + E, b.y + E, (x, y, out) => {
    const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = (-dx * sa + dy * ca) * side;
    if (u < -L / 2 - 0.4 || u > L / 2 + 0.4) return;
    const half = ((W / 2) * (L / 2 - u)) / L + 0.4;
    if (Math.abs(v) > half) return;
    out.a = fa;
    if (u > L / 2 - 1.3 && lk > 0.3) return WHITE;
    if (v > half - 1) return u > -L / 4 ? rim : C[Math.max(3, C.indexOf(rim) - 1)];
    return v < -half + 1 ? C[1] : C[2];
  });
  if (lk > 0.04) p.glow(b.x, b.y, 3 + L * 0.6, C[5], 0.2 * lk * fa);
}

/**
 * Ink drops: fly under gravity, land on the floor (y = floor(x)) and call onLand(x, y, speed).
 * add(x, y, vx, vy, size); update(dt); draw(p, body, shine) draws a dark drop with a lit top.
 */
class Drops {
  constructor(o = {}) {
    this.list = [];
    this.floor = o.floor ?? (() => 0);
    this.onLand = o.onLand ?? null;
    this.g = o.g ?? 0.8;
  }
  add(x, y, vx, vy, size = 1) {
    this.list.push({ x, y, vx, vy, size });
  }
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const d = this.list[i];
      d.vy += GRAVITY * this.g * dt;
      d.vx -= d.vx * 0.4 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const f = this.floor(d.x);
      if (d.vy > 0 && d.y >= f) {
        this.onLand?.(d.x, f, d.vy, d.size);
        this.list.splice(i, 1);
      }
    }
  }
  draw(p, body, shine) {
    for (const d of this.list) {
      const up = d.vy < 0;
      p.px(d.x, d.y, body);
      if (d.size > 1.4) p.px(d.x, d.y + (up ? 1 : -1), body);
      p.px(d.x, d.y - (d.size > 1.4 && !up ? 1 : 0), shine);
    }
  }
}

/**
 * A dark pool opened in the floor, seen at a slant (radius rx, centred on the floor at x = 0): the far lip lit,
 * the near lip dark, ripples ({ x, t0, life, w }) running out across it, a sheen along the far side, a wet fringe.
 */
function floorPool(p, C, rx, t, ripples) {
  if (rx < 1) return;
  const ry = rx * 0.17 + 0.6;
  p.shade(-rx - 3, -ry - 2, rx + 3, ry + 2, (x, y) => {
    const dx = x / rx, dy = (y - 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1.18) return;
    if (d > 1) {
      if (dy < 0 && d < 1.09) return Math.abs(dx) < 0.55 ? C[6] : Math.abs(dx) < 0.85 ? C[5] : C[4];
      if (dy >= 0 && d < 1.09) return C[2];
      return y > -0.5 && noise(x * 0.7, 9) > 0.15 ? C[1] : undefined;
    }
    // ripples: ellipses on the slanted surface, kept about a pixel thick all the way round
    for (const r of ripples) {
      const age = t - r.t0, rr = age * 46 * r.w + 1, ex = x - r.x, ey = (y - 0.5) / 0.17, e = Math.sqrt(ex * ex + ey * ey) || 1;
      const g = Math.sqrt(ex * ex + (ey / 0.17) ** 2) / e;
      if (Math.abs(e - rr) < 0.55 * g && age < r.life) return age < r.life * 0.5 ? C[4] : C[3];
    }
    if (dy < -0.55 && dy > -0.85 && noise(x * 0.25 + t * 1.3, 4) > 0.2) return noise(x * 0.6 - t * 2, 6) > 0.55 ? C[5] : C[2];
    // the far inner wall catches the glow from below: violet just under the lip, falling to black
    if (dy < -0.35 && d > 0.72) return d > 0.9 ? C[3] : C[2];
    return d > 0.86 ? C[1] : C[0];
  });
}

__e.VOID = VOID; __e.unlight = unlight; __e.ringFast = ringFast; __e.ringLight = ringLight; __e.halo = halo; __e.blackStar = blackStar; __e.inStar = inStar; __e.attract = attract; __e.PK = PK; __e.Puffs = Puffs; __e.shard = shard; __e.Drops = Drops; __e.floorPool = floorPool;
};

__M["fx/projectiles/energy-disc.js"] = function (__e) {
// The tangent spark streaks are adapted from Sprite Fusion's open-source energy and impact effects
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
const {fit, rng, TAU, WHITE} = __req("core/index.js");
const {beat, wake, spark} = __req("fx/projectiles/_lib.js");

const meta = {
  name: "Energy disc",
  desc: "A sawblade of crackling energy spinning flat out as it flies: hooked teeth bright on their leading edges, a white hub, spiral arms churning, sparks flung off the teeth.",
  tags: ["projectile", "disc", "saw", "energy", "sci-fi", "directional", "loop"],
  size: [120, 52],
  origin: [92, 26],
  duration: 0.5,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: ["#0a0f2e", "#172a78", "#2550d0", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"], size: 9, teeth: 8, speed: 220, seed: 5 },
};

function draw(p, t, o) {
  const C = fit(o.palette, 7), R = o.size, N = o.teeth, V = o.speed, S = o.seed, D = meta.duration, left = -meta.origin[0] + 2;
  const rot = (TAU * 3 * t) / D, seg = TAU / N, frac = (x) => x - Math.floor(x);

  // speed lines peeling off the rim, top and bottom, stretching back and cooling
  beat(t, D, 8, S + 4, (r) => r.range(0.12, 0.22), (age, life, r) => {
    const k = age / life, side = r.chance(0.5) ? -1 : 1, x0 = -2 - age * r.range(180, 260), len = r.range(8, 16) * (0.5 + k), y = side * (R + r.range(0.5, 3));
    if (x0 - len < left) return;
    p.line(x0, y, x0 - len, y, k < 0.35 ? C[5] : k < 0.7 ? C[4] : C[3], (u) => (u < 0.65 ? 1 : (1 - u) / 0.35));
  });
  p.glowLine(-2, 0, -26, 0, 8, C[3], 0.35);

  // sparks flung off the tooth tips along the spin, then left behind in the air
  const SP = [WHITE, C[5], C[4], C[3]];
  beat(t, D, 20, S, (r) => r.range(0.12, 0.3), (age, life, r) => {
    const a = rot - r.range(0, TAU) * 0 + r.range(0, TAU), tip = R + 3.5, x0 = Math.cos(a) * tip, y0 = Math.sin(a) * tip, v = r.range(120, 230);
    const [x, y, vx, vy] = wake(x0, y0, -Math.sin(a) * v, Math.cos(a) * v, age, V * 0.6, 2.4, 60);
    if (x > left + 8 && Math.abs(y) < 23) spark(p, x, y, vx, vy, 1 - age / life, SP, 0.45, 0.014, 7);
  });

  // the disc: a white hub in a dark collar, spiral arms of energy churning, a bright rim; past the rim, hooked
  // teeth that run white on their leading faces, and a dim blur ring where the teeth have just been
  p.shade(-R - 5, -R - 5, R + 5, R + 5, (x, y) => {
    const r = Math.hypot(x, y), th = Math.atan2(y, x);
    if (r > R + 4.6) return;
    if (r <= R) {
      if (r < 1.8) return WHITE;
      if (r < 2.9) return C[1];
      if (r > R - 1.1) return C[5];
      const arm = Math.sin(3 * (th - rot * 0.5) - r * 0.85);
      return arm > 0.65 ? C[5] : arm > 0.2 ? C[4] : arm > -0.3 ? C[3] : C[2];
    }
    const ph = frac((th - rot) / seg), h = 4.2 * Math.pow(ph, 1.4);
    if (r - R < h) return ph > 0.86 ? WHITE : ph > 0.6 ? C[6] : ph > 0.35 ? C[5] : C[4];
    if (r - R < 1.6) return C[2];
  });
  // filaments of energy crackling from the hub to the rim, new every frame
  const fr = Math.floor(t * 30 + 1e-6);
  for (let j = 0; j < 3; j++) {
    const g = rng(fr, j, S), a0 = g.range(0, TAU), pts = [];
    for (let i = 0; i <= 4; i++) {
      const rr = 2.5 + ((R - 3) * i) / 4, a = a0 + i * 0.25 + (i ? g.range(-0.35, 0.35) : 0);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    p.polyline(pts, j ? C[6] : WHITE);
  }
  p.ring(0, 0, R + 0.5, 1, C[6]);
  // light: a soft pool, a hot hub, a glint riding the top of the rim
  p.glow(0, 0, 30, C[3], 0.4);
  p.glow(0, 0, 6, C[5], 0.35);
  p.glow(Math.cos(rot) * R, Math.sin(rot) * R, 5, C[6], 0.4);
}

__e.meta = meta; __e.draw = draw;
};

__M["fx/projectiles/_lib.js"] = function (__e) {
// Shared by the projectile effects: a steady emitter for loops, motion in a projectile's own frame, soft smoke
// puffs, speed-stretched sparks, muzzle-flash lobes, brass casings that bounce, and outlined pixel shapes.
// The smoke puff, spark streak, flash lobe and casing recipes are adapted from Sprite Fusion's open-source
// muzzle-flash and explosion (https://www.spritefusion.com/pixel-art-vfx/muzzle-flash),
// MIT License, Copyright (c) 2026 Hugo Duprez. Files starting with _ are helpers, not effects.

const {clamp, mix, rand, rng, wrap, WHITE} = __req("core/index.js");

/**
 * Like cycle(), but particle i is born exactly at i * period / n: an emitter with a steady beat, so a trail
 * has no clumps or gaps. Loops seamlessly over period. fn(age, life, r, i), r the same rng every period.
 */
function beat(t, period, n, seed, life, fn) {
  for (let i = 0; i < n; i++) {
    const L = typeof life === "function" ? life(rng(seed, i, 911)) : life;
    for (let age = wrap(t - (i * period) / n + 1e-7, period); age < L; age += period) fn(age, L, rng(seed, i), i);
  }
}

/**
 * Where something is after `age` seconds in the frame of a projectile that flies right at V px/s: launched
 * from (x, y) at (vx, vy) relative to the still air, slowed toward the air by drag k (1/s), pulled by g.
 * The air streams left at V, so whatever it carries streams left too. Returns [x, y, vx, vy] (screen motion).
 */
function wake(x, y, vx, vy, age, V, k, g = 0) {
  const e = Math.exp(-k * age), f = (1 - e) / k, vt = g / k;
  return [x + vx * f - V * age, y + vt * age + (vy - vt) * f, vx * e - V, vt + (vy - vt) * e];
}

/**
 * A soft smoke puff: a body, a denser core sitting low, a lit cap on top while it's young (cap 0..1), and
 * light from a fire on one side (warm 0..1 of color wc, coming from angle wa).
 */
function puff(p, x, y, r, a, c, cap = 1, warm = 0, wc = 0, wa = 0) {
  if (a <= 0.01 || r < 0.5) return;
  p.disc(x, y, r, c, a * 0.45);
  p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
  if (cap > 0.02) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.14), a * 0.42 * cap);
  if (warm > 0.02) p.disc(x + Math.cos(wa) * r * 0.32, y + Math.sin(wa) * r * 0.32, r * 0.55, wc, a * 0.7 * warm);
}

/**
 * Puffs [{ x, y, r, a, b (brightness 0..1), w (fire light 0..1) }] merged into one translucent volume: each
 * puff is lit on top and shaded underneath, densities add up, and tone and density come out in clean steps, so
 * a trail reads as one billowing cloud with lit crowns instead of a string of beads. R: smoke ramp, dark to
 * bright; WR: the same smoke lit by fire (a ramp as long as R), which young puffs (w) lean to. clip(x, y) can
 * keep it off part of the canvas.
 */
function cloud(p, list, R, WR, { dens = 1.5, max = 0.86, clip, lit = 1 } = {}) {
  if (!list.length) return;
  let X0 = Infinity, Y0 = Infinity, X1 = -Infinity, Y1 = -Infinity;
  for (const q of list) {
    X0 = Math.min(X0, Math.floor(q.x - q.r)); X1 = Math.max(X1, Math.ceil(q.x + q.r));
    Y0 = Math.min(Y0, Math.floor(q.y - q.r)); Y1 = Math.max(Y1, Math.ceil(q.y + q.r));
  }
  const W = X1 - X0 + 3, H = Y1 - Y0 + 3, D = new Float32Array(W * H), L = new Float32Array(W * H), F = new Float32Array(W * H);
  X0--, Y0--;
  for (const q of list) {
    const r = q.r, r2 = r * r;
    for (let y = Math.floor(q.y - r); y <= Math.ceil(q.y + r); y++) {
      const dy = y + 0.5 - q.y;
      for (let x = Math.floor(q.x - r); x <= Math.ceil(q.x + r); x++) {
        const dx = x + 0.5 - q.x, d2 = (dx * dx + dy * dy) / r2;
        if (d2 >= 1) continue;
        // a ball's thickness: flat in the middle, steep at the rim, so every lump keeps its own crown
        const k = Math.sqrt(1 - d2) * q.a, i = (y - Y0) * W + (x - X0);
        D[i] += k;
        L[i] += k * q.b;
        F[i] += k * q.w * (0.5 + 0.5 * clamp(0.5 + dx / r));
      }
    }
  }
  // light the merged surface: where density climbs downward the cloud faces up and catches the light. The
  // gradient comes off a blurred copy, so only lump-sized features catch it, never the crossing rims
  const B = blur(blur(D, W, H, 1, 2), W, H, W, 2), n = R.length;
  p.each(X0 + 1, Y0 + 1, X1 + 1, Y1 + 1, (lx, ly, sx, sy) => {
    const cx = Math.floor(lx) - X0, cy = Math.floor(ly) - Y0;
    if (cx < 1 || cy < 1 || cx >= W - 1 || cy >= H - 1) return;
    const i = cy * W + cx, d = D[i];
    if (d < 0.05 || (clip && !clip(lx, ly))) return;
    const a = Math.min(max, Math.ceil((1 - Math.exp(-d * dens)) * 6) / 6);
    if (a < 0.15) return;
    const gy = B[i + W] - B[i - W], gx = B[i + 1] - B[i - 1], up = clamp(0.5 + Math.atan((gy * 0.9 + gx * 0.35) / (B[i] * 0.16 + 0.03)) * 0.42 * lit);
    const w = F[i] / d, j = clamp(Math.round((L[i] / d) * (0.3 + 0.7 * up) * (n - 1) + 0.25 + w * 1.5), 0, n - 1);
    p.blendPx(sx, sy, w > 0.03 ? mix(R[j], WR[j], Math.min(0.9, Math.ceil(w * 10) / 10)) : R[j], a);
  });
}

/**
 * Simulated smoke for one-shots, drawn with cloud(): add({ x, y, vx, vy, r0, r1, life, a, b, warm, drag, rise,
 * grow, curl, delay }). Puffs push out, slow (drag, 1/s), lift (rise, px/s²), sway, swell from r0 to r1, thin away
 * and darken as they age; warm (fire light) fades fast; curl (rad/s) keeps turning a puff's heading, so a chain of
 * them hooks round into a curl. puffs() gives the live list for cloud().
 */
class Smoke {
  constructor(rng) {
    this.R = rng;
    this.list = [];
    this.t = 0;
  }
  add(q) {
    this.list.push({ vx: 0, vy: 0, drag: 2.5, rise: 12, grow: 2, curl: 0, a: 0.6, b: 0.85, warm: 0, delay: 0, age: 0, seed: this.R.next() * 100, ...q });
  }
  get count() {
    return this.list.length;
  }
  update(dt) {
    this.t += dt;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const q = this.list[i];
      if (q.delay > 0) {
        q.delay -= dt;
        continue;
      }
      if ((q.age += dt) >= q.life) {
        this.list.splice(i, 1);
        continue;
      }
      if (q.curl) {
        const c = Math.cos(q.curl * dt), s = Math.sin(q.curl * dt), vx = q.vx;
        q.vx = vx * c - q.vy * s;
        q.vy = vx * s + q.vy * c;
      }
      q.vy -= q.rise * dt;
      q.vx += Math.sin(this.t * 1.3 + q.seed) * 8 * dt;
      q.vx -= q.vx * q.drag * dt;
      q.vy -= q.vy * q.drag * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }
  puffs() {
    const out = [];
    for (const q of this.list) {
      if (q.delay > 0) continue;
      const k = q.age / q.life;
      out.push({ x: q.x, y: q.y, r: q.r0 + (q.r1 - q.r0) * (1 - Math.exp(-q.grow * q.age)), a: q.a * Math.min(1, q.age * 30) * Math.pow(1 - k, 1.3), b: q.b * (1 - k * 0.5), w: q.warm * Math.exp(-q.age * 5) });
    }
    return out;
  }
}

// a box blur of radius r along one axis of a w x h field (step 1 for rows, w for columns)
function blur(src, w, h, step, r) {
  const out = new Float32Array(src.length), n = step === 1 ? w : h, lines = step === 1 ? h : w, k = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l++) {
    const base = step === 1 ? l * w : l;
    let acc = 0;
    for (let j = -r; j <= r; j++) acc += j >= 0 && j < n ? src[base + j * step] : 0;
    for (let j = 0; j < n; j++) {
      out[base + j * step] = acc * k;
      const a = j - r, b = j + r + 1;
      if (a >= 0) acc -= src[base + a * step];
      if (b < n) acc += src[base + b * step];
    }
  }
  return out;
}

/**
 * A spark: a two-tone streak stretched along its screen velocity, its head cooling down S (hot, warm, cool,
 * tail colors) as k (life left, 1..0) falls, with a point of light.
 */
function spark(p, x, y, vx, vy, k, S, glow = 0.45, stretch = 0.022, max = 9) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len = Math.min(max, 1 + sp * stretch);
  const head = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2];
  p.line(x - ux * len, y - uy * len, x - ux * len * 0.4, y - uy * len * 0.4, k > 0.5 ? head : S[3]);
  p.line(x - ux * len * 0.45, y - uy * len * 0.45, x, y, head);
  p.glow(x, y, 3, head, glow * k);
}

/**
 * The lobes of one muzzle flash, drawn from rng r: a fat fireball at the muzzle, a spike forward, and a burst of
 * rays round it, longest forward, shortest blown back, each side on its own (diagonals, crossways, back),
 * so every shot is a different spiky star. Frame f 2 is the same shape cooled, shorter and thinner; the same r
 * sequence gives the same shape, so a shot keeps its shape across its frames.
 */
function flashShape(r, f, { size = 1, spike = [12, 20], diag = [5, 10], cross = [3, 6], back = [2, 4.5], core = 0.7 } = {}) {
  const k = f === 1 ? 1 : 0.6, w = f === 1 ? 1 : 0.72, S = size;
  const L = [
    { off: 0.5, a: r.range(-0.08, 0.08), len: r.range(5.5, 8) * S * k, wid: r.range(2.1, 2.6) * S * w, core: 0.5 * core },
    { off: 2, a: r.range(-0.07, 0.07), len: r.range(spike[0], spike[1]) * S * k, wid: r.range(1, 1.3) * S * w, core: 0.35 * core },
  ];
  const ray = (a, len, wid, on) => on && L.push({ off: r.range(0.5, 2), a, len: len * S * k, wid: wid * S * w, core: 0.25 * core });
  for (const s of [-1, 1]) {
    ray(s * r.range(0.3, 0.8), r.range(diag[0], diag[1]), r.range(1.1, 1.5), r.chance(0.85));
    ray(s * r.range(1.15, 1.7), r.range(cross[0], cross[1]), r.range(1, 1.3), r.chance(0.6));
    ray(s * r.range(2, 2.7), r.range(back[0], back[1]), 1, r.chance(0.7) && f === 1);
  }
  return L;
}
const profile = (l, u) => {
  const k = u / l.len;
  return l.wid * Math.pow(Math.max(0, 1 - k), 0.8) * Math.min(1, 0.45 + k * 3);
};

/**
 * Draw flash lobes L at (x, y) pointing along angle a: a white (or hot) core, a hot inner flame, a body and
 * a ragged rim, chosen by how deep a pixel sits inside its lobe. C: [core, inner, body, rim]. seed varies the
 * ragged edge. Returns the flash's reach.
 */
function flash(p, x, y, a, L, C, seed) {
  const c = Math.cos(a), s = Math.sin(a);
  let ext = 2;
  for (const l of L) ext = Math.max(ext, l.off + l.len + 2);
  p.shade(x - ext, y - ext, x + ext, y + ext, (px, py) => {
    const dx = px - x, dy = py - y, along = dx * c + dy * s, across = -dx * s + dy * c;
    let m = -9, hot = false, warm = false;
    for (const l of L) {
      const ca = Math.cos(l.a), sa = Math.sin(l.a), lu = (along - l.off) * ca + across * sa, lv = -(along - l.off) * sa + across * ca;
      if (lu < -1.5 || lu > l.len + 1) continue;
      const r = profile(l, Math.max(0, lu)), mm = r - Math.abs(lv);
      if (mm > m) m = mm;
      if (lu < l.len * l.core && Math.abs(lv) <= r * 0.5) hot = true;
      if (mm > r * 0.4) warm = true;
    }
    const dm = 1.6 - Math.hypot(along - 0.5, across);
    if (dm > m) m = dm;
    if (dm > 0.6) hot = true;
    m += (rand(Math.floor(px) * 73 + Math.floor(py) * 151, seed) - 0.5) * 0.5 * Math.min(1, ext / 14);
    if (m < -0.85) return;
    return m < 0 ? C[3] : hot ? C[0] : warm ? C[1] : C[2];
  });
  return ext;
}

/**
 * A brass casing thrown from (x, y) at (vx, vy) with spin va, falling under g onto a floor at y = floor:
 * it bounces (keeping `bounce` of its speed) until it's too slow, then slides to a stop. Closed form, so a
 * loop can draw it at any age. Returns { x, y, a (angle), rest, hit (seconds since the last bounce, or -1) }.
 */
function casing(x, y, vx, vy, va, age, g, floor, bounce = 0.42, a0 = 0) {
  let t0 = 0, a = a0, hit = -1;
  for (let n = 0; n < 6; n++) {
    // time to reach the floor from (x, y) moving (vx, vy)
    const d = floor - y, T = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * d))) / g;
    if (age - t0 < T) {
      const u = age - t0;
      return { x: x + vx * u, y: y + vy * u + 0.5 * g * u * u, a: a + va * u, rest: false, hit };
    }
    x += vx * T;
    a += va * T;
    t0 += T;
    hit = age - t0;
    const vin = vy + g * T;
    y = floor;
    if (vin * bounce < 45) {
      // too slow to hop again: slide to a stop, settling flat
      const u = age - t0, k = 7, s = (1 - Math.exp(-k * u)) / k;
      return { x: x + vx * 0.6 * s, y: floor, a: Math.round(a / Math.PI) * Math.PI, rest: true, hit };
    }
    vy = -vin * bounce;
    vx *= 0.55;
    va *= 0.6;
  }
  return { x, y: floor, a: Math.round(a / Math.PI) * Math.PI, rest: true, hit };
}

/** Draw a casing: a 3 px brass slug turned by its angle, lit on one end; a glint when it has just hit. */
function drawCasing(p, k, B, fade = 1) {
  const ca = Math.cos(k.a), sa = Math.sin(k.a), x = k.x, y = k.y - 0.5;
  p.dot(x - ca, y - sa, B[1], fade);
  p.dot(x, y, B[2], fade);
  p.dot(x + ca, y + sa, B[3], fade);
  if (k.hit >= 0 && k.hit < 0.07) {
    p.px(x + ca * 0.5, y - 1, WHITE);
    p.glow(x, y, 5, B[3], 0.55 * (1 - k.hit / 0.07));
  }
}

/**
 * A little sprite (rows of characters, pal mapping them to colors, "." empty) turned by ang about its pivot
 * (px, py in sprite pixels) placed at (x, y), sampled nearest-pixel so it stays hard-edged at any angle.
 */
function turnSprite(p, rows, pal, x, y, ang, px, py, a = 1) {
  const H = rows.length, W = rows[0].length, cs = Math.cos(ang), sn = Math.sin(ang), R = Math.hypot(Math.max(px, W - px), Math.max(py, H - py)) + 1;
  p.shade(x - R, y - R, x + R, y + R, (lx, ly, out) => {
    const dx = lx - x, dy = ly - y, i = Math.floor(dx * cs + dy * sn + px), j = Math.floor(-dx * sn + dy * cs + py);
    if (i < 0 || j < 0 || i >= W || j >= H) return;
    const c = pal[rows[j][i]];
    if (!c) return;
    out.c = c;
    out.a = a;
  });
}

/**
 * A pixel shape from a builder: build(set) calls set(px, py, ch) for every interior pixel; an outline ('o')
 * is added round it. Returns { rows, x0, y0 } ready for p.sprite at (x0, y0).
 */
function pixelShape(x0, y0, w, h, build) {
  const g = Array.from({ length: h }, () => Array(w).fill("."));
  const set = (px, py, ch) => {
    const i = px - x0, j = py - y0;
    if (i >= 0 && j >= 0 && i < w && j < h) g[j][i] = ch;
  };
  build(set);
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && g[j][i] !== "." && g[j][i] !== "o";
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (g[j][i] === "." && (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1))) g[j][i] = "o";
  return { rows: g.map((r) => r.join("")), x0, y0 };
}


__e.beat = beat; __e.wake = wake; __e.puff = puff; __e.cloud = cloud; __e.Smoke = Smoke; __e.spark = spark; __e.flashShape = flashShape; __e.flash = flash; __e.casing = casing; __e.drawCasing = drawCasing; __e.turnSprite = turnSprite; __e.pixelShape = pixelShape;
};

__M["fx/impacts/parry.js"] = function (__e) {
// The star's key frames and the spark spray are adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, clamp, smooth, ease, TAU, WHITE} = __req("core/index.js");
const {star, brokenRing} = __req("fx/impacts/_lib.js");

const meta = {
  name: "Parry",
  desc: "Two blades clash: their edges flash in an X, a white four-point star rings out, a ring breaks into arcs and a fan of gold sparks sprays up and rains down.",
  tags: ["impact", "parry", "block", "clash", "sword", "metal", "sparks", "one-shot"],
  size: [200, 112],
  origin: [100, 96],
  duration: 1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: ["#2a1a08", "#6a4410", "#b07a1a", "#e8b030", "#ffe066", "#fff6c4", "#ffffff"], height: 30, seed: 11 },
};

function create(o) {
  const C = fit(o.palette, 7), R = new Rng(o.seed), X = 0, Y = -o.height, floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[4], C[4], C[3], C[2]] });
  const lights = new Lights();
  // a hard four-point star: long arms on the axes, short ones between
  const sp = [];
  for (let i = 0; i < 8; i++) sp.push({ a: (i * Math.PI) / 4 + R.range(-0.04, 0.04), len: i % 2 ? R.range(6, 8) : i % 4 === 0 ? R.range(19, 22) : R.range(14, 17), w: i % 2 ? 1.2 : 2.2 });
  const segs = Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * TAU + R.range(-0.1, 0.1), gap: R.range(0.55, 0.8), dr: R.range(0.1, 0.35) }));
  // the two edges that met: lines crossing in an X
  const edges = [-0.62 + R.range(-0.08, 0.08), Math.PI + 0.62 + R.range(-0.08, 0.08)];

  lights.add(X, Y, 60, C[4], 0.65, 0.4);
  lights.add(X, Y, 22, WHITE, 0.8, 0.08);
  // the fan: sparks thrown up and out to both sides, arcing over and raining down to bounce on the floor
  for (let i = 0; i < 24; i++) {
    const s = i % 2 ? 1 : -1, a = -Math.PI / 2 + s * R.range(0.3, 1.3), v = R.range(130, 290);
    ps.spawn(P.SPARK, X + s * R.range(1, 3), Y, Math.cos(a) * v, Math.sin(a) * v, R.range(0.45, 0.85), WHITE, 1, i > 17 ? R.range(0.02, 0.07) : 0);
  }
  for (let i = 0; i < 8; i++) {
    const a = R.range(0, TAU), v = R.range(40, 110);
    ps.spawn(P.MOTE, X, Y, Math.cos(a) * v, Math.sin(a) * v - 20, R.range(0.3, 0.55), R.pick([C[5], C[6]]), 0.6, R.range(0, 0.04));
  }
  for (let i = 0; i < 3; i++) {
    const a = R.range(0, TAU), d = R.range(12, 26);
    ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d, 0, -3, R.range(0.22, 0.34), WHITE, R.range(1.6, 2.6), R.range(0.1, 0.3));
  }

  let t = 0;
  return {
    update(dt) {
      t += dt;
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      // the ring: rings out off the star and breaks into arcs that fly on and cool
      const u = (t - 0.03) / 0.36;
      if (u >= 0 && u < 1) {
        const r = 8 + 24 * ease.outCubic(u), brk = smooth(0.15, 0.6, u), i = u < 0.15 ? 6 : u < 0.35 ? 5 : u < 0.6 ? 4 : 3;
        brokenRing(p, X, Y, r, Math.max(1, 2.6 * Math.pow(1 - u, 1.2)), segs, brk, C[i], C[Math.max(2, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
        if (u < 0.5) p.glowRing(X, Y, r, 5, C[4], 0.3 * (1 - u / 0.5));
      }
      ps.draw(p);
      // the edges flash where they met
      if (t < 0.058)
        for (const a of edges) {
          const ca = Math.cos(a), sa = Math.sin(a), L = t < 0.025 ? 26 : 32, k = t < 0.025 ? 1 : 0.6;
          for (let d = -L; d <= L; d += 0.5) {
            const q = Math.abs(d) / L;
            p.dot(X + ca * d, Y + sa * d, q < 0.4 ? WHITE : q < 0.75 ? C[5] : C[4], q < 0.6 ? 1 : k * (1.3 - q));
          }
          p.glowLine(X - ca * L, Y - sa * L, X + ca * L, Y + sa * L, 4, C[5], 0.35 * k);
        }
      // the star: white, then bigger and gold as it thins, then just a glint
      if (t < 0.025) star(p, X, Y, sp, 1, 1, [C[4], WHITE, WHITE, WHITE], 1, 2.6);
      else if (t < 0.058) star(p, X, Y, sp, 1.25, 0.65, [C[2], C[5], C[6], WHITE], 1, 2.6);
      else if (t < 0.092) star(p, X, Y, sp, 1.4, 0.3, [C[2], C[4], C[5], C[6]], 1, 2);
      const pop = Math.exp(-t / 0.05);
      if (pop > 0.02) {
        p.glow(X, Y, 30, C[4], 0.5 * pop);
        p.glow(X, Y, 10, WHITE, 0.4 * pop);
      }
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/scifi/force-field.js"] = function (__e) {
// The hit recipe (a tracer from the right, a flash and a ripple over a hex shell mapped by longitude and
// latitude, sparks glancing off) is adapted from Sprite Fusion's open-source shield
// (https://www.spritefusion.com/pixel-art-vfx/shield), MIT License, Copyright (c) 2026 Hugo Duprez.
const {P, Rng, fit, sparkle, band, bolt, forks, clamp, smooth, rand, hex, TAU, WHITE, READY} = __req("core/index.js");
const {Ghosts, flash, since} = __req("fx/scifi/_lib.js");

const meta = {
  name: "Force field",
  desc: "A glassy dome of hex plates over the hero: plates glint, tracers from the right slam into it, a ripple and cracks of light race across, sparks glance off.",
  tags: ["scifi", "shield", "barrier", "dome", "hex", "hit", "defense", "loop"],
  size: [184, 104],
  origin: [76, 84],
  duration: 2.4,
  loop: true,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#0b1030", "#152a63", "#1d4f9e", "#2582d2", "#36b9ee", "#8ae8ff", "#d4fbff", "#ffffff"],
    sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
    radius: 44,
    seed: 5,
  },
};

const HOLD = { turn: 1, crouch: 3, lean: 1, fx: -9, fy: -38, bx: 10, by: -38, ffx: -5, fbx: 6 };
const HIT_ = { ...HOLD, x: -2, crouch: 5, lean: -3 };
const act = {
  poses: [
    [0, HOLD],
    [0.42, HOLD],
    [0.42, HIT_, "snap"],
    [0.7, { ...HOLD, x: -1 }],
    [1.1, HOLD],
    [1.5, HOLD],
    [1.5, { ...HIT_, crouch: 4, lean: -2 }, "snap"],
    [1.75, HOLD],
    [2.4, HOLD],
  ],
  hits: [{ t: 0.42, stop: 0.07, shake: 0.16, amp: 2 }, { t: 1.5, stop: 0.03, shake: 0.08, amp: 1 }],
};

const S3 = Math.sqrt(3), SA = 0.13, CA = Math.sqrt(1 - SA * SA); // we look down on the dome a little
const G = 6.3, KY = 1.12; // hex plates per radian of longitude, and their stretch in latitude
// the shots, once a loop: a heavy one that cracks the shell, a lighter one lower down that it shrugs off
const SHOTS = [
  { t: 0.42, lon: 0.66, lat: 0.62, big: true },
  { t: 1.5, lon: 0.95, lat: 0.26, big: false },
].map((s) => ({ ...s, N: [Math.cos(s.lat) * Math.sin(s.lon), Math.sin(s.lat), Math.cos(s.lat) * Math.cos(s.lon)] }));

// the pointy-top hex (corner radius 1) under grid point (gx, gy): its axial coords and center, how near its
// edge (1 on it) and how near one of its corners (0 on it)
function cell(gx, gy) {
  const fq = (S3 / 3) * gx - gy / 3, fr = (2 / 3) * gy, fs = -fq - fr;
  let q = Math.round(fq), r = Math.round(fr);
  const s = Math.round(fs), dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  const hx = S3 * (q + r / 2), hy = 1.5 * r, dx = gx - hx, dy = gy - hy, ax = Math.abs(dx);
  const e = Math.max(ax, Math.abs(ax / 2 + (dy * S3) / 2), Math.abs(ax / 2 - (dy * S3) / 2)) / (S3 / 2);
  const k = Math.round((Math.atan2(dy, dx) - Math.PI / 6) / (Math.PI / 3)), ca = Math.PI / 6 + (k * Math.PI) / 3;
  return { q, r, hx, hy, e, corner: Math.hypot(dx - Math.cos(ca), dy - Math.sin(ca)) };
}

// a point on the dome (longitude, latitude) to the screen: [x, y, facing (> 0 on the near side)]
function project(R, lon, lat) {
  const X = Math.cos(lat) * Math.sin(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.cos(lon);
  return [R * X, -R * (Y * CA - Z * SA), Y * SA + Z * CA];
}

// every pixel of the near and far shell, worked out once: where it sits on the sphere and on the plates, and
// whether it's a seam (the last pixel of a plate before the next) or a plate's lit top-left edge
const shells = new Map();
function shell(R) {
  let g = shells.get(R);
  if (g) return g;
  const near = [], far = [], N = Math.ceil(R) + 1, W = 2 * N + 1, ids = [new Map(), new Map()];
  for (let y = -N; y <= Math.ceil(R * SA) + 1; y++)
    for (let x = -N; x <= N; x++) {
      const u = (x + 0.5) / R, vy = -(y + 0.5) / R, q = u * u + vy * vy;
      if (q > 1) continue;
      const vz = Math.sqrt(1 - q);
      for (const s of [1, -1]) {
        const Y = vy * CA + s * vz * SA, Z = -vy * SA + s * vz * CA;
        if (Y < 0) continue;
        const lon = Math.atan2(u, Z), lat = Math.asin(Math.min(1, Y)), c = cell(lon * G, lat * G * KY), id = c.q * 1000 + c.r;
        (s > 0 ? near : far).push({ x, y, X: u, Y, Z, lon, lat, q: c.q, r: c.r, id, e: c.e, corner: c.corner, rim: 1 - vz, sil: (1 - Math.sqrt(q)) * R });
        ids[s > 0 ? 0 : 1].set((y + N) * W + x + N, id);
      }
    }
  [near, far].forEach((list, i) => {
    const at = (x, y) => ids[i].get((y + N) * W + x + N);
    for (const q of list) {
      const r = at(q.x + 1, q.y), d = at(q.x, q.y + 1), l = at(q.x - 1, q.y), u = at(q.x, q.y - 1);
      q.seam = (r !== undefined && r !== q.id) || (d !== undefined && d !== q.id);
      q.bevel = !q.seam && ((l !== undefined && l !== q.id) || (u !== undefined && u !== q.id));
    }
  });
  shells.set(R, (g = { near, far }));
  return g;
}

// fractures: jagged forked paths from the hit across the plates, laid out by longitude and latitude so they
// bend with the dome; each point carries how far along it is, so they can race out from the hit
const crackCache = new Map();
function cracks(R, seed, s) {
  const key = `${R}:${seed}`;
  if (crackCache.has(key)) return crackCache.get(key);
  const rn = new Rng(seed * 13 + 5), out = [];
  const toScreen = (path, u0, u1) => {
    const pts = [];
    for (let i = 0; i < path.length; i++) {
      const [lon, lat] = path[i];
      if (lat < 0.03 || lat > 1.52 || Math.abs(lon) > 1.5) break;
      pts.push([...project(R, lon, lat), u0 + ((u1 - u0) * i) / (path.length - 1)]);
    }
    return pts;
  };
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + rn.range(-0.35, 0.35), L = rn.range(0.42, 0.8);
    const path = bolt(rn, s.lon, s.lat, s.lon + (Math.cos(a) * L) / Math.cos(s.lat), s.lat + Math.sin(a) * L, { jag: 0.2, depth: 4 });
    out.push(toScreen(path, 0, 1));
    for (const f of forks(rn, path, { count: rn.int(0, 2), len: L * 0.5, jag: 0.25, spread: 0.9 })) {
      const j = path.findIndex((q) => q[0] === f[0][0] && q[1] === f[0][1]), u0 = Math.max(0, j) / (path.length - 1);
      out.push(toScreen(f, u0, u0 + 0.5));
    }
  }
  crackCache.set(key, out);
  return out;
}

// what the shots throw off and the glints on the plates, born once a loop
const ghostCache = new Map();
function ghosts(o, C, R) {
  const key = `${R}:${o.seed}:${o.sparks.join()}:${o.palette.join()}`;
  if (ghostCache.has(key)) return ghostCache.get(key);
  const W = meta.size[0] - meta.origin[0], rn = new Rng(o.seed), D = meta.duration;
  const g = new Ghosts(D, { ground: () => 0, sparks: o.sparks, box: [-70, -80, W - 6, 14] });
  for (const s of SHOTS) {
    const [hx, hy] = project(R, s.lon, s.lat), n = s.big ? 1 : 0.55;
    // glancing off the curve: up and away to the right, the way the shot was going when it was turned
    for (let i = 0; i < 24 * n; i++) {
      const a = (s.big ? -0.9 : -0.55) + rn.range(-0.7, 0.65), sp = rn.range(100, 280) * (0.7 + 0.3 * n);
      g.add(s.t + rn.range(0, 0.02), P.SPARK, hx, hy, Math.cos(a) * sp, Math.sin(a) * sp - 30, rn.range(0.25, 0.75));
    }
    for (let i = 0; i < 7 * n; i++) {
      const a = -0.9 + rn.range(-1.2, 1.2), sp = rn.range(30, 90);
      g.add(s.t + rn.range(0, 0.05), P.MOTE, hx, hy, Math.cos(a) * sp, Math.sin(a) * sp - 15, rn.range(0.3, 0.6), rn.pick([C[5], C[6], C[4]]), 0.7);
    }
    for (let i = 0; i < 3 * n; i++) g.add(s.t + 0.04 + i * 0.07, P.STAR, hx + rn.range(-6, 6), hy + rn.range(-5, 5), 0, -4, rn.range(0.3, 0.5), C[6], rn.range(1, 2));
    for (let i = 0; i < 3 * n; i++) g.add(s.t + 0.03 + i * 0.04, P.SMOKE, hx + 2 + rn.range(-2, 2), hy - 1, rn.range(8, 22), rn.range(-14, -4), rn.range(0.9, 1.3), hex("#5b5f78"), rn.range(2.2, 3.4));
  }
  // a star on each plate as it glints
  for (let r = 0; r < 12; r++)
    for (let q = -14; q <= 14; q++) {
      if (!glints(o.seed, q, r)) continue;
      const lon = (S3 * (q + r / 2)) / G, lat = (1.5 * r) / (G * KY), [x, y, f] = project(R, lon, lat);
      if (f < 0.25 || lat < 0.15 || lat > 1.45 || Math.abs(lon) > 1.3) continue;
      g.add(glintAt(o.seed, q, r) + 0.03, P.STAR, x, y, 0, -3, 0.4, C[6], 1.4 + rand(q, r, 9));
    }
  ghostCache.set(key, g);
  return g;
}
const glints = (S, q, r) => rand(S, q, r, 3) < 0.2;
// when a plate glints: only in the quiet part of the loop, so nothing competes with the big hit
const glintAt = (S, q, r) => {
  const g = rand(S, q, r) * 1.7;
  return g < 1.4 ? 1 + g : g - 1.4;
};

function drawShell(p, t, o, C, near) {
  const R = o.radius, D = meta.duration, S = o.seed, ph = t / D, { near: N, far: F } = shell(R);
  const ages = SHOTS.map((s) => since(t, s.t, D));
  // the scan: a band of light climbing the dome once a loop
  const sk = clamp((ph - 0.72) / 0.26), scanLat = -0.2 + sk * 2, scanK = Math.sin(Math.PI * sk);
  for (const q of near ? N : F) {
    const ff = q.rim * q.rim;
    // the ripples: a front racing out over the sphere from each hit, the plates behind it still humming
    let rp = 0, hot = 0;
    for (let i = 0; i < SHOTS.length; i++) {
      const s = SHOTS[i], age = ages[i];
      if (age >= 1) continue;
      const d = Math.acos(clamp(q.X * s.N[0] + q.Y * s.N[1] + q.Z * s.N[2], -1, 1)), f = 0.06 + 3.1 * age, k = (1 - age) * (s.big ? 1 : 0.7);
      rp = Math.max(rp, Math.exp(-(((d - f) / 0.15) ** 2)) * k, d < f ? 0.22 * k * k * (1 - d / f) : 0);
      const hr = s.big ? 0.3 : 0.17;
      if (age < 0.55 && d < hr) hot = Math.max(hot, age < 0.07 && d < hr * 0.75 ? 2 : (1 - age / 0.55) ** 1.5 * (1.1 - (0.6 * d) / hr));
    }
    // plates glint now and then
    let gl = 0;
    if (glints(S, q.q, q.r)) {
      const a = since(t, glintAt(S, q.q, q.r), D);
      if (a < 0.45) gl = 1 - a / 0.45;
    }
    const sc = scanK * Math.exp(-(((q.lat - scanLat) / 0.09) ** 2));
    if (!near) {
      // the far side, seen through the glass: dim seams, a breath of tint
      if (q.seam) p.blend(q.x + 0.5, q.y + 0.5, rp > 0.3 ? C[5] : C[3], clamp(0.18 + 0.25 * ff + 0.6 * rp + 0.3 * sc));
      else p.blend(q.x + 0.5, q.y + 0.5, C[2], 0.04 + 0.06 * ff + 0.15 * rp);
      continue;
    }
    if (q.sil < 1.15) {
      // the rim: a hard bright edge, whiter where the light catches it
      const lit = -q.X * 0.55 + q.Y * 0.85;
      p.px(q.x, q.y, rp > 0.4 || lit > 0.8 ? WHITE : lit > 0.3 ? C[6] : C[5]);
      p.light(q.x, q.y, C[4], 0.3);
      continue;
    }
    if (hot >= 2) {
      // the hero frame: the struck plates go white
      p.px(q.x, q.y, q.seam ? C[6] : WHITE);
      continue;
    }
    if (q.seam) {
      const I = 0.12 + 0.5 * ff + 0.08 * Math.sin(q.lon * 2.3 + q.lat * 3 - ph * TAU) + (q.corner < 0.32 ? 0.18 : 0) + 0.9 * gl + 0.7 * sc + 1.3 * rp + hot;
      const c = gl > 0.6 || rp > 0.55 || hot > 0.5 ? WHITE : I > 0.8 ? C[6] : I > 0.55 ? C[5] : C[4];
      if (I > 0.36) p.px(q.x, q.y, c);
      else p.blend(q.x + 0.5, q.y + 0.5, c, 0.3 + I);
      p.light(q.x, q.y, C[4], 0.04 + 0.08 * I);
    } else {
      // the glass: thin face-on, thicker toward the rim, a lit top-left edge on every plate
      const a = 0.05 + 0.34 * ff * q.rim + 0.1 * q.e ** 4 + (q.bevel ? 0.12 + 0.2 * ff : 0) + 0.35 * gl + 0.1 * sc + 0.3 * rp + 0.6 * hot;
      const c = hot > 0.6 ? WHITE : hot > 0.3 || gl > 0.5 ? C[6] : rp > 0.4 || q.bevel ? C[5] : ff > 0.5 ? C[4] : C[3];
      p.blend(q.x + 0.5, q.y + 0.5, c, clamp(a));
      if (rp > 0.1 || hot > 0 || gl > 0) p.light(q.x, q.y, C[4], 0.06 * (rp + hot + gl));
    }
  }
}

// the dome's foot: a ring on the floor with emitters round it, chasing
function drawFoot(p, t, C, R, near) {
  const D = meta.duration, keep = (g) => (Math.sin(g) >= 0) === near;
  band(p, 0, 0, R + 1, SA, 2, 1, [C[1], C[3], C[5], C[6]], keep);
  for (let i = 0; i < 10; i++) {
    const g = (i / 10) * TAU + 0.31;
    if (!keep(g)) continue;
    const x = Math.cos(g) * (R - 0.5), y = Math.sin(g) * R * SA, k = 0.5 + 0.5 * Math.cos(TAU * (2 * (t / D) - i / 10));
    p.px(x - 1, y, C[2]);
    p.px(x + 1, y, C[2]);
    p.px(x, y, k > 0.6 ? WHITE : C[5]);
    p.glow(x, y, 6 + 4 * k, C[4], (near ? 0.25 : 0.15) * (0.4 + k));
  }
}

function drawBack(p, t, o) {
  const C = fit(o.palette, 8), R = o.radius;
  for (let x = -R; x <= R; x += R / 3) p.glow(x, -1, 22, C[3], 0.1);
  drawFoot(p, t, C, R, false);
  drawShell(p, t, o, C, false);
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), SP = fit(o.sparks, 4), R = o.radius, D = meta.duration, W = meta.size[0] - meta.origin[0];
  drawShell(p, t, o, C, true);
  drawFoot(p, t, C, R, true);
  for (const s of SHOTS) {
    const age = since(t, s.t, D), [hx, hy] = project(R, s.lon, s.lat), n = s.big ? 1 : 0.6;
    // the fractures: race out from the hit white-hot, then cool down the ramp and fade
    if (s.big && age < 0.9) {
      const fade = 1 - smooth(0.35, 0.9, age), reach = clamp(age / 0.09);
      for (const pass of [0, 1])
        for (const c of cracks(R, o.seed, s))
          for (let i = 1; i < c.length; i++) {
            const [x0, y0, f0] = c[i - 1], [x1, y1, f1, u] = c[i];
            if (u > reach || f0 < 0.05 || f1 < 0.05) continue;
            const k = fade * (1.2 - u * 0.4);
            if (pass === 0) {
              if (age < 0.32) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, age < 0.12 ? C[6] : C[5], k * (1 - age / 0.32));
              continue;
            }
            p.line(x0, y0, x1, y1, age < 0.12 + u * 0.08 ? WHITE : age < 0.3 + u * 0.1 ? C[6] : C[5], k);
            if (i % 3 === 0) p.glow(x1, y1, 6, C[4], 0.35 * fade * (1 - u * 0.5));
          }
    }
    // the tracer, in from the right: a streak that comes out of the edge, its tail never past where it entered
    const tk = (t - (s.t - 0.1)) / 0.1;
    if (tk >= 0 && tk < 1) {
      const sx = W - 3, sy = hy - 12, L = Math.hypot(sx - hx, sy - hy), at = (d) => [sx + ((hx - sx) * Math.max(0, d)) / L, sy + ((hy - sy) * Math.max(0, d)) / L];
      const h = L * tk, [x, y] = at(h), [x2, y2] = at(h - 2), [x7, y7] = at(h - 7), [x16, y16] = at(h - 16);
      p.line(x16, y16, x7, y7, SP[3]);
      p.line(x7, y7, x2, y2, SP[1]);
      p.line(x2, y2, x, y, SP[0]);
      p.px(x, y, WHITE);
      p.glow(x, y, 9, SP[1], 0.55);
    }
    // the impact: a white star, light that flares and dies
    if (age < 0.14) sparkle(p, hx, hy, (7 * (1 - age / 0.14) + 1) * n, C[6], C[5], 0.4);
    flash(p, t, s.t, hx, hy, 56 * n, C[4], 0.45, 0.45);
    flash(p, t, s.t, hx, hy, 12, WHITE, 0.5 * n, 0.08);
    flash(p, t, s.t, hx + 3, hy, 22, SP[1], 0.4 * n, 0.15);
  }
  // the dome's own light, and what glances off
  const a0 = since(t, SHOTS[0].t, D);
  p.glow(0, -R * 0.45, R * 1.3, C[3], 0.11 + 0.1 * Math.max(0, 1 - a0 * 2));
  ghosts(o, C, R).at(t).draw(p);
}

__e.meta = meta; __e.act = act; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/scifi/_lib.js"] = function (__e) {
// Shared by the scifi effects. Ghosts: the toolkit's simulated particles for loops (sparks that fall and bounce,
// smoke that rises and thins) worked out from their birth each frame, so a loop is a function of t alone and has
// no seam. Also lights that flare in loops, and electric arcs stroked the way Hugo strokes his bolts. Their motion is the toolkit's (src/core/sim.js), which is adapted from Sprite Fusion's open-source
// pixel art VFX (https://www.spritefusion.com/pixel-art-vfx), MIT License, Copyright (c) 2026 Hugo Duprez.

const {Particles, P, PF, GRAVITY, hex, rand, WHITE, TAU} = __req("core/index.js");

const SOFT = new Set([P.VAPOUR, P.DUST, P.SMOKE]);
const STEP = 1 / 240;

// one toolkit step for one particle, with its own age standing in for the system clock (so it repeats)
function move(q, dt, age, ground) {
  switch (q.k) {
    case P.FIRE:
      q.vy -= 95 * dt;
      q.vx += Math.sin(age * 17 + q.seed) * 30 * dt;
      q.vx -= q.vx * 5 * dt;
      q.vy -= q.vy * 3.2 * dt;
      break;
    case P.GRIT: {
      q.vy += GRAVITY * dt;
      q.vx -= q.vx * 0.8 * dt;
      const g = ground(q.x), ny = q.y + q.vy * dt;
      q.x += q.vx * dt;
      if (q.vy > 0 && q.y <= g && ny >= g) {
        q.y = g - 0.25;
        if (q.vy > 130 && rand(q.seed * 1000, q.hops++) < 0.4) (q.vy = -q.vy * 0.25), (q.vx = q.vx * 0.5);
        else (q.vx = q.vy = 0), (q.life = Math.min(q.life, 0.5));
      } else q.y = ny;
      return;
    }
    case P.SPARK: {
      q.vy += GRAVITY * 0.45 * dt;
      q.vx -= q.vx * 2.2 * dt;
      q.vy -= q.vy * 2.2 * dt;
      const g = ground(q.x), ny = q.y + q.vy * dt;
      q.x += q.vx * dt;
      if (q.vy > 0 && q.y <= g && ny >= g) (q.vy = -q.vy * 0.45), (q.vx *= 0.7), (q.y = g - 0.25);
      else q.y = ny;
      return;
    }
    case P.STREAK: (q.vx += q.vx * 3 * dt), (q.vy += q.vy * 3 * dt); break;
    case P.FLAKE:
      q.vx -= q.vx * 2.2 * dt;
      q.vy -= q.vy * 2.2 * dt - 35 * dt;
      q.x += Math.sin(age * 2.5 + q.seed) * 7 * dt;
      break;
    case P.EMBER:
      q.vy += (-30 + Math.sin(age * 3 + q.seed) * 20) * dt;
      q.vx += Math.cos(age * 2.3 + q.seed) * 45 * dt;
      q.vx -= q.vx * 1.6 * dt;
      q.vy -= q.vy * 1.6 * dt;
      break;
    case P.SMOKE: {
      const big = q.flag & PF.BIG;
      q.vy -= (big ? 23 : 16) * dt;
      q.vx += Math.sin(age * 1.3 + q.seed) * 8 * dt;
      q.vx -= q.vx * 1.6 * dt;
      q.vy -= q.vy * 1.2 * dt;
      break;
    }
    case P.MOTE: q.vx -= q.vx * 0.6 * dt; q.vy -= q.vy * 0.6 * dt; break;
    default: {
      const drag = SOFT.has(q.k) ? 4 : 1.6;
      q.vx -= q.vx * drag * dt;
      q.vy -= q.vy * drag * dt + 5 * dt;
    }
  }
  q.x += q.vx * dt;
  q.y += q.vy * dt;
}

/**
 * Simulated particles for loops. add(born, ...Particles.spawn arguments) once, at build time, for each particle
 * born `born` seconds into the period; at(t) returns a Particles holding every particle alive at t, each moved
 * there from its birth by the toolkit's physics, ready for draw(p, layer). A particle born late in the period
 * carries on into the next one, so the loop has no seam. opts: the Particles options (ground, sparks, haze) and
 * box: [x0, y0, x1, y1], outside which particles are dropped (keeps sparks on the canvas).
 */
class Ghosts {
  constructor(period, opts = {}) {
    this.D = period;
    this.ground = opts.ground ?? (() => Infinity);
    this.box = opts.box ?? null;
    this.ps = new Particles({ ground: this.ground, sparks: opts.sparks, haze: opts.haze });
    this.specs = [];
  }
  add(born, k, x, y, vx, vy, life, col = WHITE, size = 1, flag = 0) {
    const n = this.specs.length, D = this.D;
    // a star's twinkle runs on the clock: pick its seed so the twinkle repeats with the period too
    let seed = rand(n, 41) * 100;
    if (k === P.STAR) {
      const m = Math.ceil((8 * D) / TAU), f = (TAU * m) / D - 8;
      if (f < 5) seed = f + 5 * Math.floor(rand(n, 43) * 19);
    }
    this.specs.push({ born: ((born % D) + D) % D, k, x, y, vx, vy, life, col: col ? hex(col) : 0, size, flag, seed });
  }
  get count() {
    return this.specs.length;
  }
  /** The state of one particle `age` seconds after its birth, or null if it's gone. */
  state(s, age) {
    const q = { k: s.k, x: s.x, y: s.y, vx: s.vx, vy: s.vy, life: s.life, max: s.life, col: s.col, size: s.size, seed: s.seed, delay: 0, flag: s.flag, hops: 0 };
    let a = 0;
    while (a < age - 1e-9) {
      const dt = Math.min(STEP, age - a);
      move(q, dt, a, this.ground);
      a += dt;
      q.life -= dt;
      if (q.life <= 0) {
        // a fire puff with SMOKES turns into smoke when it dies, as in the toolkit
        if (q.k !== P.FIRE || !(q.flag & PF.SMOKES)) return null;
        const big = q.flag & PF.BIG, L = big ? 1.3 + rand(s.seed * 7, 1) : 0.8 + rand(s.seed * 7, 1) * 0.6;
        Object.assign(q, { k: P.SMOKE, vx: q.vx * 0.6, vy: q.vy * 0.6 - 6, life: L, max: L, col: 0, size: q.size * (big ? 0.85 : 0.7), flag: big ? PF.BIG : 0 });
      }
    }
    if (this.box) {
      const [x0, y0, x1, y1] = this.box;
      if (q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) return null;
    }
    return q;
  }
  at(t) {
    const D = this.D, list = [];
    for (const s of this.specs) {
      // its age now, and in each earlier period it may still be alive from (smoke from fire lives longer)
      const span = s.k === P.FIRE && s.flag & PF.SMOKES ? s.life + 2.4 : s.life;
      for (let age = (((t - s.born) % D) + D) % D; age < span; age += D) {
        const q = this.state(s, age);
        if (q) list.push(q);
      }
    }
    this.ps.list = list;
    this.ps.t = t;
    return this.ps;
  }
}

/** A light that flares at t0 and dies over life, as the toolkit's Lights do, for loops: k falls with life². */
function flash(p, t, t0, x, y, r, c, k, life) {
  const a = t - t0;
  if (a < 0 || a >= life) return;
  const q = 1 - a / life;
  p.glow(x, y, r * (0.55 + 0.45 * q), c, k * q * q);
}

/** Smallest positive age of an event at t0 in a loop of period D, seen at t. */
const since = (t, t0, D) => (((t - t0) % D) + D) % D;

/**
 * An electric arc along a path [[x, y], ...], drawn the way Hugo strokes his bolts: a dark halo, a bright body,
 * a white-hot core while it's fresh, light along it. C: [halo, body, glow]; k: 1 fresh, falling to 0; w: weight.
 */
function strokeArc(p, pts, C, k = 1, w = 1) {
  const [halo, body, glow] = C;
  for (const pass of [0, 1, 2])
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.max(1, Math.hypot(bx - ax, by - ay));
      for (let d = 0; d <= L; d += 0.5) {
        const x = ax + ((bx - ax) * d) / L, y = ay + ((by - ay) * d) / L;
        if (pass === 0) p.circle(x, y, (k > 0.6 ? 1.6 : 1.1) * w, halo);
        else if (pass === 1) p.circle(x, y, (k > 0.6 ? 0.9 : 0.6) * w, body);
        else if (k > 0.3) p.px(x, y, WHITE);
      }
      if (pass === 0 && i % 3 === 0) p.glow(ax, ay, 9 * w, glow, 0.45 * k);
    }
}

__e.Ghosts = Ghosts; __e.flash = flash; __e.since = since; __e.strokeArc = strokeArc;
};

__M["fx/water/water-orb.js"] = function (__e) {
// The orb's build (a see-through body with a lit rim, an inner current drawn as streaks on a tilted plane, motes
// on tilted orbits split behind and in front, a pulsing light) follows Sprite Fusion's open-source energy orb
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.
const {fit, cycle, clamp, smooth, TAU, WHITE} = __req("core/index.js");
const {WATER, bead, ring} = __req("fx/water/_lib.js");

const meta = {
  name: "Water orb",
  desc: "A sphere of water floats and wobbles: a current circles inside it, the floor shows upside down through it, it shines, light gathers on the floor under it, and drips fall and plink.",
  tags: ["water", "orb", "sphere", "magic", "float", "ambient", "loop"],
  size: [100, 108],
  origin: [50, 100],
  duration: 3,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: WATER, radius: 19, seed: 2 },
};

const D = meta.duration, SY = 0.3, G = 700, DRIP = 1.5, LET = 0.5;

const center = (ph) => [0, -52 + Math.sin(ph * TAU) * 2];
// the skin wobbles: radius at angle a, and the belly sags into a drip before each one falls
const skin = (a, R, ph) => {
  const sag = Math.max(0, Math.sin(a)) ** 6 * 2.2 * smooth(0.1, LET, ((ph * D) % DRIP) / DRIP) * (((ph * D) % DRIP) / DRIP < LET ? 1 : 0);
  return R + Math.sin(a * 3 + ph * TAU * 2) * 0.6 + Math.sin(a * 5 - ph * TAU * 3) * 0.35 + sag;
};

// motes of spray on tilted orbits round it: position, and whether it's in front
function motes(ph, R) {
  return Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * TAU + ph * TAU * (i % 2 ? 1 : -1), r = R + 5 + (i % 3) * 3, tilt = (i - 3) * 0.22, x = Math.cos(a) * r, z = Math.sin(a);
    return { x: x * Math.cos(tilt), y: x * Math.sin(tilt) + z * r * 0.28, z, i };
  });
}

function drawBack(p, t, o) {
  const C = fit(o.palette, 8), ph = t / D, R = o.radius, [cx, cy] = center(ph);
  // light gathers on the floor under it, the orb's caustic
  p.glow(cx, 0, 22, C[5], 0.32);
  p.shade(cx - 9, -2, cx + 9, 2, (x, y, out) => {
    const d = (x - cx) ** 2 / 64 + (y * 2.5) ** 2 / 9;
    if (d > 1) return;
    out.c = d < 0.25 ? WHITE : d < 0.6 ? C[6] : C[5];
    out.a = 1.2 - d;
  });
  for (const m of motes(ph, R)) if (m.z < 0) p.px(cx + m.x, cy + m.y, C[4]);
  p.glow(cx, cy, R * 3.2, C[4], 0.3 + 0.05 * Math.sin(ph * TAU * 2));
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), ph = t / D, R = o.radius, [cx, cy] = center(ph), T = ph * TAU;
  // the body: see-through water, deeper toward the bottom; the floor seen upside down through its lower half
  p.shade(cx - R - 4, cy - R - 4, cx + R + 4, cy + R + 6, (x, y, out) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx), r = skin(a, R, ph);
    if (d > r) return;
    const q = d / r, lit = (-dx - dy) / Math.SQRT2 / Math.max(0.5, d);
    if (q > 0.9) {
      out.c = lit > 0.35 ? WHITE : lit > -0.2 ? C[5] : C[3];
      return;
    }
    // a lens of water: dark on the side the light comes from, the light gathering low on the far side inside
    const gather = Math.max(0, (dx + dy) / Math.SQRT2 / r) * q;
    p.blend(x, y, gather > 0.45 ? C[4] : gather > 0.25 ? C[3] : q > 0.7 ? C[2] : C[1], gather > 0.25 ? 0.7 : 0.35 + 0.3 * q);
  });
  // the current inside: streaks circling on a tilted plane, bright where they pass in front
  for (let k = 0; k < 3; k++) {
    const rr = R * (0.38 + 0.2 * k), tilt = -0.5 + k * 0.35, spin = T * (k % 2 ? -2 : 3) + k * 2;
    for (let s = 0; s < 1; s += 0.012) {
      const a = spin + s * TAU, x = Math.cos(a) * rr, z = Math.sin(a), y = x * Math.sin(tilt) * 0.6 + z * rr * 0.62, dash = (s * 3 + k * 0.3) % 1;
      if (dash > 0.62) continue;
      p.px(cx + x * Math.cos(tilt), cy + y, z > 0 ? (dash < 0.1 ? WHITE : dash < 0.4 ? C[6] : C[5]) : C[3]);
    }
  }
  // bubbles drift up inside it
  cycle(t, D, 8, o.seed, (g) => g.range(1, 1.8), (age, life, r) => {
    const k = age / life, x = r.range(-0.5, 0.5) * R + Math.sin(age * 4 + r.range(0, TAU)) * 1.5, y = R * 0.6 - k * R * 1.2;
    if (Math.hypot(x, y) > R * 0.8) return;
    p.px(cx + x, cy + y, k < 0.8 ? C[6] : WHITE);
    if (r.next() < 0.35) p.px(cx + x + 1, cy + y, C[5]);
  });
  // the shine: a bright crescent up on the left, a small refracted glint low on the right
  p.arc(cx, cy, R * 0.74, 1.8, Math.PI * 1.12, Math.PI * 1.4, (u, v) => (u > 0.25 && u < 0.75 && v > 0.4 ? WHITE : C[6]));
  p.px(cx - R * 0.45, cy - R * 0.62, WHITE);
  p.px(cx + R * 0.48, cy + R * 0.5, C[6]);
  p.px(cx + R * 0.48 + 1, cy + R * 0.5, C[5]);
  // motes in front
  for (const m of motes(ph, R))
    if (m.z >= 0) {
      p.px(cx + m.x, cy + m.y, WHITE);
      p.px(cx + m.x - (m.i % 2 ? -1 : 1), cy + m.y, C[5]);
      p.glow(cx + m.x, cy + m.y, 4, C[5], 0.35);
    }
  // drips: one swells on its belly and lets go every DRIP seconds, landing with a plink and a ring
  const dt = (t % DRIP) / DRIP, fall = (t % DRIP) - DRIP * LET, y0 = cy + R + 3, land = Math.sqrt((2 * -y0) / G);
  if (fall < 0 && dt > 0.2) {
    const s = smooth(0.2, LET, dt);
    p.circle(cx, cy + R + 1 + s * 1.5, 0.8 + s * 1.2, C[5]);
    p.px(cx - 0.5, cy + R + s * 1.5, C[6]);
  } else if (fall >= 0 && fall < land) bead(p, cx, y0 + 0.5 * G * fall * fall, 0, G * fall, 2, C);
  else if (fall >= land) {
    const since = fall - land;
    if (since < 0.08) p.px(cx, 0, WHITE);
    ring(p, cx, 0, 1.5 + since * 18, SY, 1.1 * (1 - since / 0.4), C, { n: 1, half: 1, seed: 3, hot: since < 0.05 });
  }
  // where the lens brings the light to a point, low on the far side: a bright fleck, pulsing
  const fx = cx + R * 0.36, fy = cy + R * 0.4, pulse = 0.8 + 0.2 * Math.sin(T * 4);
  p.circle(fx, fy, 1.6, C[6]);
  p.px(fx, fy, WHITE);
  p.glow(fx, fy, 9, C[5], 0.45 * pulse);
  p.glow(cx, cy, R * 1.4, C[5], 0.22);
  p.glow(cx - R * 0.4, cy - R * 0.5, 6, WHITE, 0.25);
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/shadow/black-hole.js"] = function (__e) {
// The dithered tone ramp and the brighter, bluer approaching side are adapted from Sprite Fusion's open-source
// black-hole (https://www.spritefusion.com/pixel-art-vfx/black-hole), MIT License, Copyright (c) 2026 Hugo Duprez.
const {cycle, fit, clamp, smooth, TAU, WHITE, hex, mix} = __req("core/index.js");
const {VOID, halo, unlight} = __req("fx/shadow/_lib.js");

const meta = {
  name: "Black hole",
  desc: "A tilted disk of banded rings turns round a black hole, its far side bent up over the top and under the bottom; debris spirals in, stretches and is swallowed.",
  tags: ["shadow", "black-hole", "void", "space", "gravity", "dark", "magic", "loop"],
  size: [184, 132],
  origin: [92, 124],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: VOID, rock: ["#120d1c", "#2e2440", "#544468", "#857399"], seed: 4 },
};

// the hole's centre, its shadow, how hard it bends light; the disk's tilt (screen angle, and how open it is)
// light bent over the top left the far side's upper face, so the arch sees the disk more face-on (SI_ARCH)
const Y = -70, RS = 13.5, E = 17.5, SI = 0.25, SI_ARCH = 0.46, TILT = -0.14, D = 4;
const CT = Math.cos(TILT), ST = Math.sin(TILT);
// rings with gaps between them, inner ones hotter and turning faster (whole turns of pattern a loop)
const BANDS = [
  { r0: 18, r1: 24, n: 5, hot: 1.35, k: 0.3 },
  { r0: 26, r1: 34, n: 3, hot: 0.92, k: 1.9 },
  { r0: 35.5, r1: 46, n: 2, hot: 0.64, k: 3.7 },
  { r0: 47.5, r1: 60, n: 1, hot: 0.42, k: 5.2 },
];
const ROUT = 60;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const ICE = hex("#e4f7ff");

// brightness of the disk at a point of its plane (X across, Z away from us), banded, streaked, turning
function disk(X, Z, t) {
  const rho = Math.sqrt(X * X + Z * Z);
  for (const b of BANDS) {
    if (rho < b.r0 || rho > b.r1) continue;
    const w = (rho - b.r0) / (b.r1 - b.r0), ph = Math.atan2(Z, X) - (TAU * b.n * t) / D;
    const streak = 0.62 + 0.22 * Math.cos(7 * ph + rho * 0.8 + b.k) + 0.16 * Math.cos(13 * ph - rho * 1.6 + b.k * 2);
    const lane = 0.72 + 0.28 * Math.cos(rho * 2.3 + b.k);
    const edge = smooth(0, 0.18, w) * (1 - smooth(0.78, 1, w));
    return { I: b.hot * streak * lane * (0.35 + 0.65 * edge), dop: -X / rho };
  }
  return null;
}

// the hole and its disk, ray by ray: the near half straight in front, the far half seen through the bend
// (above the hole, and as a thin second image below it), the shadow, and the photon ring at its edge
function hole(p, C, t, pulse) {
  const RAMP = [C[1], C[2], C[3], C[4], C[5], C[6], C[7], WHITE], n = RAMP.length;
  const W = ROUT + 2, H = 42;
  p.shade(-W, Y - H, W, Y + H, (x, y, out) => {
    const dx = x, dy = y - Y, u = dx * CT + dy * ST, v = -dx * ST + dy * CT, r = Math.sqrt(u * u + v * v);
    let s = null;
    if (v > 0) s = disk(u, -v / SI, t);
    if (!s && r > RS) {
      const k = 1 - (E * E) / (r * r), bu = u * k, bv = v * k, si = k > 0 ? SI_ARCH : SI;
      if (-bv / si > 0) s = disk(bu, -bv / si, t);
    }
    if (!s || s.I < 0.06) {
      if (r < RS - 0.4) return C[0];
      if (r < RS + 0.7) {
        const a = Math.atan2(v, u), f = 0.5 + 0.5 * Math.cos(3 * a + (TAU * 2 * t) / D) + pulse * 0.4;
        out.k = 0.3;
        return f > 0.55 ? WHITE : C[7];
      }
      return;
    }
    // tone: dithered between ramp steps; the side turning toward us brighter and icier
    const I = s.I * 1.3 * (1 + 0.55 * s.dop) * (1 + 0.25 * pulse), f = clamp(I) * (n - 1);
    let i = Math.floor(f);
    if (f - i > BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)]) i = Math.min(n - 1, i + 1);
    if (i === 0 && I < 0.12) return;
    let c = RAMP[i];
    if (s.dop > 0.35 && i >= n - 3) c = mix(c, ICE, Math.min(1, (s.dop - 0.35) * 2));
    if (s.dop < -0.4 && i >= 2 && i < n - 2) c = mix(c, C[3], 0.35);
    if (i >= n - 4 && ((Math.floor(x) + Math.floor(y)) & 1) === 0) out.k = 0.3 * Math.min(1, I - 0.35);
    return c;
  });
}

function drawBack(p, t, o) {
  const C = fit(o.palette, 8);
  p.glow(0, -1, 44, C[4], 0.12);
  p.glow(0, Y, 80, C[4], 0.32);
  p.glow(0, Y, 46, mix(C[6], C[5], 0.5), 0.45);
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), K = fit(o.rock, 4), S = o.seed;
  // a gulp as debris is swallowed, twice a loop
  const pulse = Math.max(0, Math.cos((TAU * 2 * t) / D)) ** 12;
  // pebbles torn off the floor, rising to join the disk
  cycle(t, D, 10, S + 3, (r) => r.range(1.6, 2.6), (age, L, r) => {
    const x0 = r.range(-60, 60), u = Math.pow(age / L, 1.5), tx = Math.sign(x0 || 1) * r.range(40, 56), ty = Y + r.range(4, 9);
    const x = x0 + (tx - x0) * u, y = -1 + (ty + 1) * u - Math.sin(Math.PI * u) * 10;
    p.px(x, y, u > 0.6 ? K[3] : K[2]);
    if (age < 0.25) p.disc(x0, -1.5, 2 + age * 8, K[2], 0.4 * (1 - age / 0.25));
  });
  hole(p, C, t, pulse);
  // motes streaking in from all round, turning with the disk as they fall
  cycle(t, D, 40, S + 7, (r) => r.range(0.5, 0.9), (age, L, r) => {
    const a0 = r.range(0, TAU), d0 = r.range(48, 76), q = Math.pow(age / L, 1.6), d = RS + 2 + (d0 - RS - 2) * (1 - q), a = a0 + 0.9 * q;
    const x = Math.cos(a) * d * 1.15, y = Y + Math.sin(a) * d * 0.75, q2 = Math.pow(Math.max(0, age - 0.09) / L, 1.6), d2 = RS + 2 + (d0 - RS - 2) * (1 - q2), a2 = a0 + 0.9 * q2;
    if (d < RS + 3 || y > -3 || y < -120 || Y + Math.sin(a2) * d2 * 0.75 < -120 || Math.abs(x) > 90) return;
    const col = r.pick([WHITE, C[7], C[6], C[5]]);
    p.line(Math.cos(a2) * d2 * 1.15, Y + Math.sin(a2) * d2 * 0.75, x, y, (u) => (u > 0.6 ? col : C[4]), Math.min(1, age * 6));
    p.glow(x, y, 3, col, 0.3);
  });
  // debris spiralling in: lumps of rock lit on the side toward the hole, stretched into hot streaks as they
  // fall, gone in a flash at the photon ring; behind the hole they're hidden by it
  cycle(t, D, 22, S, (r) => r.range(1.4, 2.4), (age, L, r) => {
    const ph0 = r.range(0, TAU), rho0 = r.range(58, 80), hgt = r.range(-8, 8), size = r.range(1.6, 2.8);
    const at = (aa) => {
      const q = clamp(aa / L), rho = RS + 1 + (rho0 - RS - 1) * (1 - Math.pow(q, 1.5)), ph = ph0 + 2.4 * Math.pow(q, 1.6) * (1 + 1.5 * q);
      const X = Math.cos(ph) * rho, Z = Math.sin(ph) * rho, sx = X, sy = -Z * SI + hgt * (1 - q);
      return { x: sx * CT - sy * ST, y: Y + sx * ST + sy * CT, Z, rho };
    };
    const a = at(age), b = at(age - 0.04), hidden = a.Z > 0 && Math.hypot(a.x, a.y - Y) < RS + 1;
    if (hidden) return;
    if (a.rho < RS + 3) {
      p.px(a.x, a.y, WHITE);
      p.glow(a.x, a.y, 6, C[6], 0.6);
      return;
    }
    const heat = 1 - smooth(16, 34, a.rho), len = 1 + heat * 7;
    if (heat > 0.05) {
      const dx = a.x - b.x, dy = a.y - b.y, l = Math.hypot(dx, dy) || 1;
      p.line(a.x - (dx / l) * len, a.y - (dy / l) * len, a.x, a.y, (u) => (u > 0.7 ? WHITE : u > 0.35 ? C[6] : C[4]));
      p.glow(a.x, a.y, 4, C[6], 0.4 * heat);
    } else {
      const lx = -a.x / (Math.hypot(a.x, a.y - Y) || 1), ly = -(a.y - Y) / (Math.hypot(a.x, a.y - Y) || 1);
      // a lump of rock: a fading wake along its orbit, a dark body, its face toward the hole lit violet
      const c = at(age - 0.09), d = at(age - 0.15);
      p.px(b.x, b.y, C[3]);
      p.dot(c.x, c.y, C[3], 0.7);
      p.dot(d.x, d.y, C[2], 0.5);
      const s2 = size > 2.2;
      p.px(a.x, a.y, K[2]);
      p.px(a.x + 1, a.y, K[1]);
      p.px(a.x, a.y + 1, K[1]);
      if (s2) (p.px(a.x + 1, a.y + 1, K[0]), p.px(a.x - 1, a.y, K[1]), p.px(a.x, a.y - 1, K[2]));
      p.px(a.x + Math.round(lx * 1.4), a.y + Math.round(ly * 1.4), s2 ? C[6] : C[5]);
      p.glow(a.x, a.y, 4, C[5], 0.15);
    }
  });
  halo(p, 0, Y, RS - 0.4, RS + 4, C[6], 0.35 + 0.3 * pulse);
  unlight(p, -RS, Y - RS, RS, Y + RS, (x, y) => {
    const dx = x, dy = y - Y, v = -dx * ST + dy * CT, u = dx * CT + dy * ST;
    return u * u + v * v < (RS - 0.6) ** 2 && !(v > 0 && disk(u, -v / SI, t));
  });
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/nature/root-snare.js"] = function (__e) {
// The hold-then-break (it closes round the character, holds with glints, cracks, then bursts into tumbling
// pieces, mist and light) is adapted from Sprite Fusion's open-source ice freeze (https://www.spritefusion.com/pixel-art-vfx/ice),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, lerp, rand, TAU, WHITE, READY} = __req("core/index.js");
const {drawRock, stoneShape, drawLeaf, floorCrack} = __req("fx/nature/_lib.js");

const meta = {
  name: "Root snare",
  desc: "The floor cracks and roots burst up round the character, spiralling round its legs; they cinch tight with a snap, hold, then crack and crumble into bark and dust.",
  tags: ["nature", "roots", "plant", "snare", "root", "status", "actor", "one-shot"],
  size: [128, 96],
  origin: [64, 78],
  duration: 2.7,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#140c08", "#2a1a10", "#46301e", "#64462a", "#86623a", "#a8824e", "#ccaa70", "#ecd6a0"],
    glow: ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"],
    seed: 7,
  },
};

const GRAB = { turn: 0.9, crouch: 3, fx: -12, fy: -34, bx: 12, by: -28, ffx: -2, fbx: 3 };
const act = {
  poses: [
    [-0.24, { ...READY, ffx: -2, fbx: 3 }],
    [0.3, { turn: 0.9, lean: -1, crouch: 2, fx: -10, fy: -24, bx: 11, by: -24, ffx: -2, fbx: 3 }],
    [0.62, GRAB, "snap"],
    [0.86, { ...GRAB, lean: -3, fy: -37, by: -27 }],
    [1.1, { ...GRAB, lean: 3, fy: -27, by: -37 }],
    [1.34, { ...GRAB, lean: -3, fy: -37, by: -27 }],
    [1.58, { ...GRAB, lean: 3, fy: -27, by: -37 }],
    [1.75, { ...GRAB, crouch: 6 }],
    [1.8, { turn: 1.1, crouch: -1, y: -3, fx: -14, fy: -36, bx: 15, by: -36, ffx: -3, ffy: -6, fbx: 4, fby: -6 }, "snap"],
    [2.05, { ...READY, y: 0, crouch: 5 }],
    [2.7, { ...READY, ffx: -2, fbx: 3 }],
  ],
  hits: [{ t: 0.62, stop: 0.05, shake: 0.1, amp: 1 }, { t: 1.75, stop: 0.04, shake: 0.14, amp: 2 }],
};

const SY = 0.34, CINCH = 0.62, BREAK = 1.75, NP = 48;

// one root: from the floor outside the feet it spirals in round the legs and climbs, thinning to its tip
function path(r, cinch) {
  const pts = [];
  for (let i = 0; i <= NP; i++) {
    const s = i / NP, th = r.th0 + r.dir * TAU * r.turns * s, rad = lerp(r.r0, r.leg - cinch * 1.6, ease.outCubic(Math.min(1, s * 3.5)));
    pts.push({ x: Math.cos(th) * rad, y: -r.h * Math.pow(s, 1.05) + Math.sin(th) * rad * SY, z: Math.sin(th), s });
  }
  return pts;
}

// a stroke of bark along the path: lit on its upper side, dark beneath, a ridge of grain, rootlet hairs
function root(p, pts, g, C, back, a) {
  const n = Math.floor(NP * g);
  for (let i = 0; i < n; i++) {
    const A = pts[i], Bp = pts[i + 1], front = (A.z + Bp.z) / 2 >= 0;
    if (front === back) continue;
    const dx = Bp.x - A.x, dy = Bp.y - A.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, up = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
    const w = (1.4 + 3.6 * Math.pow(1 - A.s, 0.8)) / 2 + 0.35, dim = back ? 1 : 0;
    for (let y = Math.floor(Math.min(A.y, Bp.y) - w - 1); y <= Math.ceil(Math.max(A.y, Bp.y) + w + 1); y++)
      for (let x = Math.floor(Math.min(A.x, Bp.x) - w - 1); x <= Math.ceil(Math.max(A.x, Bp.x) + w + 1); x++) {
        if (y > 0) continue;
        const px = x + 0.5 - A.x, py = y + 0.5 - A.y, u = (px * dx + py * dy) / (L * L);
        if (u < -0.2 || u > 1.2) continue;
        const d = px * nx + py * ny;
        if (Math.abs(d) > w) continue;
        const side = Math.sign(d) * up, q = Math.abs(d) / w;
        let i2 = q > 0.72 ? (side > 0 ? 7 : 1) : side > 0 ? (q > 0.3 ? 6 : 5) : q > 0.35 ? 2 : 3;
        if (q < 0.25 && rand(Math.round(A.s * 40), 3) < 0.4) i2 = 4;
        p.dot(x, y, C[Math.max(1, i2 - dim)], a);
      }
    // rootlet hairs off its underside now and then
    if (i % 7 === 3 && w > 1.2) p.dot(A.x - nx * up * (w + 1), A.y - ny * up * (w + 1), C[2 - dim], a);
  }
}

function create(o) {
  const C = fit(o.palette, 8), G = fit(o.glow, 4), R = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [G[3], G[2], G[1], G[0]] });
  const lights = new Lights(), chips = [];
  const roots = Array.from({ length: 5 }, (_, i) => ({
    th0: (i / 5) * TAU + R.range(-0.3, 0.3), dir: i % 2 ? 1 : -1, turns: R.range(1.1, 1.6), r0: R.range(14, 19), leg: R.range(8, 10),
    h: R.range(13, 21), at: 0.16 + i * 0.07 + R.range(0, 0.04), buds: [R.range(0.35, 0.55), R.range(0.6, 0.85)],
  }));
  const cracks = [floorCrack(R, -1, R.range(18, 26)), floorCrack(R, 1, R.range(18, 26))];
  let t = 0, cinched = false, broken = false;
  const grow = (r) => ease.outCubic(clamp((t - r.at) / 0.32));
  const squeeze = () => smooth(CINCH - 0.03, CINCH + 0.05, t) * (1 - 0.4 * smooth(CINCH + 0.05, CINCH + 0.25, t));
  return {
    update(dt) {
      t += dt;
      const f = Math.min(1, dt * 120);
      if (t < 0.4 && R.chance(0.3 * f)) {
        const sd = R.sign();
        ps.spawn(P.GRIT, sd * R.range(4, 22), -1, R.range(-20, 20), -R.range(30, 90), R.range(0.5, 0.9), R.pick([C[5], C[4]]), 1);
      }
      for (const r of roots)
        if (!r.burst && t >= r.at) {
          r.burst = true;
          const x = Math.cos(r.th0) * r.r0;
          for (let i = 0; i < 4; i++) chips.push({ x, y: -1, vx: R.range(-60, 60), vy: -R.range(60, 160), a: R.range(0, TAU), va: R.range(-15, 15), s: R.range(1.2, 2), pts: stoneShape(R), life: R.range(0.6, 0.9) });
          for (let i = 0; i < 3; i++) ps.spawn(P.DUST, x, -1, R.range(-25, 25), -R.range(4, 18), R.range(0.4, 0.8), C[5], R.range(2, 3.5));
          lights.add(x, -4, 20, G[2], 0.35, 0.3);
        }
      if (!cinched && t >= CINCH) {
        cinched = true;
        lights.add(0, -10, 40, G[3], 0.5, 0.3);
        lights.add(0, -10, 16, WHITE, 0.4, 0.06);
        for (let i = 0; i < 8; i++) ps.spawn(P.DUST, R.range(-12, 12), -R.range(0, 4), R.sign() * R.range(20, 60), -R.range(4, 14), R.range(0.5, 0.9), C[5], R.range(2, 3.5));
        for (let i = 0; i < 6; i++) ps.spawn(P.STAR, R.range(-9, 9), -R.range(4, 20), 0, -4, R.range(0.25, 0.5), G[3], R.range(0.8, 1.8), R.range(0, 0.1));
      }
      // while it holds, motes of green rise off the roots
      if (t > CINCH && t < BREAK && R.chance(0.06 * f)) ps.spawn(P.MOTE, R.range(-9, 9), -R.range(3, 18), R.range(-6, 6), -R.range(14, 30), R.range(0.5, 0.9), G[3], 0.6);
      if (!broken && t >= BREAK) {
        broken = true;
        lights.add(0, -10, 36, G[2], 0.4, 0.25);
        // every root crumbles into bark chunks and splinters along its length
        for (const r of roots) {
          const pts = path(r, 1);
          for (let i = 2; i < NP; i += 4) {
            const q = pts[i], w = 1.4 + 3.6 * Math.pow(1 - q.s, 0.8);
            chips.push({ x: q.x, y: Math.min(q.y, -1), vx: (Math.sign(q.x) || 1) * R.range(25, 85) + q.x * 3, vy: -R.range(50, 150), a: R.range(0, TAU), va: R.range(-10, 10), s: clamp(w * 0.75, 1.5, 3), pts: stoneShape(R), life: Math.min(R.range(0.7, 0.95), meta.duration - 0.05 - t) });
            if (i % 10 === 2) ps.spawn(P.GRIT, q.x, Math.min(q.y, -1), R.range(-40, 40), -R.range(20, 80), Math.min(R.range(0.6, 0.9), meta.duration - 0.05 - t), R.pick([C[4], C[3], C[2]]), R.chance(0.3) ? 2 : 1);
          }
        }
        for (let i = 0; i < 10; i++) ps.spawn(P.SMOKE, R.range(-12, 12), -R.range(2, 16), R.range(-25, 25), -R.range(5, 20), Math.min(R.range(0.6, 0.9), meta.duration - 0.05 - t), C[5], R.range(3, 5), 0, 0);
      }
      for (let i = chips.length - 1; i >= 0; i--) {
        const c = chips[i];
        if ((c.life -= dt) <= 0) chips.splice(i, 1);
        c.vy += 950 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.a += c.va * dt;
        if (c.y > 0 && c.vy > 0) c.vy > 110 ? ((c.y = 0), (c.vy *= -0.3), (c.vx *= 0.5)) : ((c.y = 0), (c.vy = c.vx = c.va = 0));
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // cracks run out from the feet, a mossy light seeping up from them
      const open = ease.outCubic(clamp(t / 0.25)), hot = smooth(0, 0.3, t) * (1 - smooth(0.5, 1.4, t)), fade = 1 - smooth(meta.duration - 0.6, meta.duration - 0.15, t);
      for (const c of cracks) {
        const m = Math.max(2, Math.ceil(c.length * open));
        for (let k = 1; k < m; k++) {
          const [x0, y0] = c[k - 1], [x1, y1] = c[k];
          p.line(x0, y0 + 1, x1, y1 + 1, C[0], fade);
          p.line(x0, y0, x1, y1, hot > 0.5 ? G[3] : hot > 0.2 ? G[2] : C[1], fade);
          if (k % 2 === 0) p.glow(x1, y1, 6, G[2], 0.3 * hot);
        }
      }
      const hold = smooth(0.3, CINCH, t) * (1 - smooth(BREAK, BREAK + 0.3, t)) * (0.8 + 0.2 * Math.sin(t * 8));
      if (hold > 0) p.glow(0, -12, 30, G[2], 0.3 * hold), p.glow(0, -1, 22, G[3], 0.16 * hold);
      if (t < BREAK) for (const r of roots) if (t > r.at) root(p, path(r, squeeze()), grow(r), C, true, 1);
      ps.draw(p, "back");
    },
    draw(p) {
      if (t < BREAK) {
        for (const r of roots) {
          if (t <= r.at) continue;
          const pts = path(r, squeeze()), g = grow(r);
          root(p, pts, g, C, false, 1);
          // buds open into small leaves once it has hold of them
          for (const b of r.buds) {
            const q = pts[Math.floor(b * NP)], lk = clamp((t - CINCH - 0.1 - b * 0.2) / 0.25);
            if (b > g || lk <= 0 || q.z < 0) continue;
            drawLeaf(p, q.x + 2, q.y - 2, 5 * lk, 1.6, -0.6 + Math.sin(t * 5 + b * 9) * 0.2, 0.3, [G[0], G[1], G[2], G[3]]);
          }
        }
        // the snap as they cinch
        const e = t - CINCH;
        if (e > 0 && e < 0.12) for (const [x, y] of [[-8, -6], [8, -10], [-7, -15]]) sparkle(p, x, y, 5 * (1 - e / 0.12), C[7], G[3], 0.4);
        // the white flash just before they go
        const w = BREAK - t;
        if (w > 0 && w < 0.05) for (const r of roots) for (const q of path(r, 1)) if (q.z >= 0) p.px(q.x, q.y, WHITE);
      }
      const BARK = [C[0], C[1], C[2], C[2], C[3], C[4], C[5]];
      for (const c of chips) drawRock(p, c.x, c.y, c.s, c.a, c.pts, BARK, Math.min(1, c.life / 0.25));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.act = act; __e.create = create;
};

__M["fx/arcane/time-stop.js"] = function (__e) {
// The cracks walking out from a point and the burst into tumbling shards, glints and light are adapted from
// Sprite Fusion's open-source ice shatter (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License,
// Copyright (c) 2026 Hugo Duprez.
const {Particles, Bits, Lights, P, B, Rng, PAL, fit, flare, clamp, smooth, ease, luma, rgb, TAU, WHITE} = __req("core/index.js");

const CY = -42, RC = 26, OPEN = 0.3, FREEZE = 1.75, CRACK = 2.2, SHATTER = 2.42;
// the second hand ticks, each wait longer than the last, until time stops
const TICKS = [0.36, 0.46, 0.57, 0.7, 0.85, 1.03, 1.24, 1.49];

const meta = {
  name: "Time stop",
  desc: "A clock face springs open, ticks slower and slower, freezes drained of colour, cracks, then shatters into falling shards.",
  tags: ["arcane", "time", "clock", "freeze", "stop", "shatter", "magic", "one-shot"],
  size: [196, 136],
  origin: [98, 118],
  duration: 3.6,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, seed: 14 },
};

// how far the hand has gone: a snap with a little overshoot at each tick
function hand(t) {
  let a = 0;
  for (const tk of TICKS) if (t > tk) a += ease.outBack(clamp((t - tk) / 0.07), 3);
  return -Math.PI / 2 + a * (TAU / 12);
}
// how fast time flows: full speed, slowing to nothing at the freeze
const flow = (t) => (t < OPEN ? 1 : Math.max(0, 1 - (t - OPEN) / (FREEZE - OPEN)) ** 1.6);
// the motes' clock: time itself, slowing down (integrated flow)
function clockTime(t) {
  let s = 0;
  for (let u = 0; u < Math.min(t, FREEZE); u += 1 / 120) s += flow(u) / 120;
  return s;
}

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed);
  // the drained ramp: each step's own lightness, cold grey
  const G = C.map((c) => {
    const l = luma(c) * 255;
    return rgb(l * 0.92, l * 0.96, Math.min(255, l * 1.06));
  });
  const ps = new Particles({ rng: R, ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]] }), bits = new Bits({ ground: () => 0 }), lights = new Lights();
  const motes = Array.from({ length: 14 }, (_, i) => ({ a: R.range(0, TAU), r: RC + R.range(5, 14), w: R.range(1.4, 2.6) * (i % 2 ? 1 : -1), tilt: R.range(-0.5, 0.5), c: R.pick([WHITE, C[6], C[5]]) }));
  // cracks: jagged walks out from a point on the face
  const ix = R.range(-6, 6), iy = R.range(-6, 6), cracks = [];
  const walk = (x, y, a, len, depth) => {
    const pts = [[x, y]];
    for (let s = 0; s < len; s++) {
      a += R.range(-0.55, 0.55);
      x += Math.cos(a) * R.range(1.6, 2.6);
      y += Math.sin(a) * R.range(1.6, 2.6);
      if (Math.hypot(x, y) > RC - 0.5) break;
      pts.push([x, y]);
      if (depth < 1 && pts.length > 3 && R.chance(0.14)) walk(x, y, a + R.sign() * R.range(0.6, 1.1), len / 2, depth + 1);
    }
    cracks.push(pts);
  };
  for (let i = 0; i < 7; i++) walk(ix, iy, (i / 7) * TAU + R.range(-0.3, 0.3), 16, 0);
  let t = 0, tc = 0, ticked = 0, shattered = false, frozen = false;

  // the face, in ramp K: glass, rims, ticks and dots, hands, hub
  function face(p, K, s, cracked) {
    const cy = CY, r = RC * s;
    if (r < 1) return;
    p.disc(0, cy, r, K[1], (d) => 0.3 + 0.35 * d * d);
    p.ring(0, cy, r + 0.5, 1, K[6]);
    p.ring(0, cy, r - 1.5, 1, K[4]);
    p.ring(0, cy, r + 2, 1, K[3], 0.6);
    // minute dots and hour ticks; the quarters long and bright
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      if (i % 5) p.dot(Math.cos(a) * (r - 3.5), cy + Math.sin(a) * (r - 3.5), K[4], 0.8);
      else {
        const q = i % 15 === 0, r0 = r - (q ? 8 : 6.5);
        p.line(Math.cos(a) * r0, cy + Math.sin(a) * r0, Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3), q ? K[7] : K[6]);
      }
    }
    p.ring(0, cy, r * 0.3, 1, K[4], 0.8);
    // the hour hand, then the second hand with its tail, then the hub
    const ha = -Math.PI / 2 + (hand(t) + Math.PI / 2) / 12 + 0.9, sa = hand(t) + (frozen ? Math.sin(t * 70) * 0.012 : 0);
    p.beam(0, cy, Math.cos(ha) * r * 0.48, cy + Math.sin(ha) * r * 0.48, 2.6, (u, v) => (v < 0.5 ? K[6] : K[4]));
    p.line(-Math.cos(sa) * 5, cy - Math.sin(sa) * 5, Math.cos(sa) * (r - 4), cy + Math.sin(sa) * (r - 4), (u) => (u > 0.75 ? K[7] : K[6]));
    p.line(-Math.cos(sa) * 5 + 0.5, cy - Math.sin(sa) * 5, -Math.cos(sa) * 2, cy - Math.sin(sa) * 2, K[5]);
    p.circle(0, cy, 2.2, K[5]);
    p.circle(0, cy, 1.2, K[7]);
    if (cracked > 0)
      for (const pts of cracks)
        for (let i = 0, n = Math.floor(pts.length * cracked); i < n; i++) {
          const [x, y] = pts[i], fresh = i > n - 3 && cracked < 1;
          p.px(x, cy + y, fresh ? WHITE : K[7]);
          if (!fresh) p.px(x, cy + y - 1, K[2]);
        }
  }

  return {
    update(dt) {
      t += dt;
      tc = clockTime(t);
      // each tick sends a ripple and a spark off the hand's tip
      while (ticked < TICKS.length && t >= TICKS[ticked]) {
        ticked++;
        const a = hand(t + 0.1);
        lights.add(Math.cos(a) * (RC - 4), CY + Math.sin(a) * (RC - 4), 22, C[6], 0.6, 0.12);
        for (let i = 0; i < 3; i++) ps.spawn(P.STAR, Math.cos(a) * (RC + 1), CY + Math.sin(a) * (RC + 1), Math.cos(a) * 30 + R.range(-15, 15), Math.sin(a) * 30 + R.range(-15, 15), R.range(0.2, 0.4), R.pick([WHITE, C[6]]), R.range(0.7, 1.3));
      }
      if (!frozen && t >= FREEZE) {
        frozen = true;
        lights.add(0, CY, 70, WHITE, 0.7, 0.2);
      }
      if (!shattered && t >= SHATTER) {
        shattered = true;
        lights.add(0, CY, 80, WHITE, 0.8, 0.16);
        lights.add(0, CY, 100, C[5], 0.6, 0.6);
        // the face bursts into shards and chunks, cold grey; colour sparks back into the world around them
        for (let i = 0; i < 64; i++) {
          const a = R.range(0, TAU), d = R.range(0, RC), x = Math.cos(a) * d, y = CY + Math.sin(a) * d, sp = R.range(40, 140);
          const dx = x - ix, dy = y - CY - iy, l = Math.hypot(dx, dy) || 1;
          bits.add({ kind: B.SHARD, x, y, vx: (dx / l) * sp + R.range(-25, 25), vy: (dy / l) * sp * 0.7 - R.range(40, 120), g: 0.9, drag: 0.5, bounce: 0.25, life: R.range(0.8, 1.15), a: R.range(0, TAU), va: R.range(-22, 22), s: R.range(1.5, 3.6), c: R.pick([G[7], G[6], G[6], G[5]]) });
        }
        for (let i = 0; i < 10; i++) {
          const a = R.range(0, TAU), sp = R.range(40, 110);
          bits.add({ kind: B.CHUNK, x: Math.cos(a) * RC * 0.6, y: CY + Math.sin(a) * RC * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - R.range(60, 130), g: 1, drag: 0.4, bounce: 0.3, life: R.range(0.9, 1.15), a: R.range(0, TAU), va: R.range(-14, 14), s: R.range(1.6, 3), ramp: [G[1], G[3], G[4], G[6], G[7]] });
        }
        for (let i = 0; i < 26; i++) {
          const a = R.range(0, TAU), sp = R.range(30, 110);
          ps.spawn(i % 2 ? P.STAR : P.MOTE, 0, CY, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.4, 0.8), R.pick([WHITE, C[6], C[5]]), R.range(0.8, 1.8));
        }
        for (let i = 0; i < 18; i++) {
          const a = R.range(0, TAU), sp = R.range(90, 200);
          ps.spawn(P.SPARK, 0, CY, Math.cos(a) * sp, Math.sin(a) * sp, R.range(0.2, 0.45));
        }
        // the stopped time it held lifts away as a cold vapour
        for (let i = 0; i < 12; i++) {
          const a = R.range(0, TAU), d = R.range(0, RC * 0.8);
          ps.spawn(P.VAPOUR, Math.cos(a) * d, CY + Math.sin(a) * d, Math.cos(a) * R.range(10, 40), Math.sin(a) * R.range(10, 30) - R.range(5, 20), R.range(0.6, 1), R.chance(0.5) ? G[5] : C[4], R.range(3, 6));
        }
      }
      bits.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the floor lit beneath the clock while it stands
      const k = smooth(0, OPEN, t) * (1 - smooth(SHATTER, SHATTER + 0.5, t)), cold = t >= FREEZE;
      if (k > 0) p.glow(0, -1, 40, cold ? G[5] : C[4], 0.25 * k);
      // the motes behind the face
      if (t < SHATTER) for (const m of motes) drawMote(p, m, true);
    },
    draw(p) {
      const cold = t >= FREEZE, s = t < OPEN ? ease.outBack(t / OPEN, 2.6) : 1;
      if (t < SHATTER) {
        // white for a beat as it freezes, then cold grey; white again in the moment it bursts
        const white = (t >= FREEZE && t < FREEZE + 0.06) || t >= SHATTER - 0.05;
        face(p, white ? G.map(() => WHITE) : cold ? G : C, s, clamp((t - CRACK) / 0.18));
        p.glow(0, CY, RC * 1.9, cold ? G[5] : C[4], 0.32 * s);
        p.glowRing(0, CY, RC, 7, cold ? G[6] : C[5], 0.28 * s);
        for (const m of motes) drawMote(p, m, false);
      }
      // springing open: a ring thrown out and a flare
      if (t < 0.35) {
        const q = t / 0.35;
        p.ring(0, CY, RC * (0.4 + 1.2 * ease.outCubic(q)), Math.max(1, 3 * (1 - q)), q < 0.3 ? WHITE : C[6], 1.2 - q);
        if (q < 0.5) flare(p, 0, CY, 26 * (1 - q * 2) + 2, 1 - q * 2, C);
      }
      // a ripple of time off each tick; ripples run on the clock's own slowing time, so they drag to a halt and
      // hang there, drained, until it all breaks
      if (t < SHATTER)
        for (const tk of TICKS) {
          if (t < tk) continue;
          const q = (tc - clockTime(tk)) / 0.32;
          if (q >= 1) continue;
          p.ring(0, CY, RC + 3 + 24 * ease.outCubic(q), 1, cold ? G[5] : C[5], (cold ? 0.6 : 0.8) * Math.pow(1 - q, 1.6));
        }
      if (t >= SHATTER && t < SHATTER + 0.2) {
        const q = (t - SHATTER) / 0.2;
        flare(p, 0, CY, 34 * (1 - q) + 2, 1 - q, C);
        p.ring(0, CY, RC + 30 * ease.outCubic(q), Math.max(1, 3 * (1 - q)), WHITE, 1.2 - q);
      }
      bits.draw(p);
      ps.draw(p);
      lights.draw(p);
    },
  };

  // a mote circling the clock on a tilted orbit, slowing with time; drained and still once it stops
  function drawMote(p, m, back) {
    const a = m.a + m.w * tc, z = Math.sin(a);
    if (z < 0 !== back) return;
    const x = Math.cos(a) * m.r, y = CY + Math.cos(a) * m.r * m.tilt + z * m.r * 0.3, cold = t >= FREEZE, v = flow(t) * m.w;
    const c = cold ? G[6] : m.c;
    p.dot(x, y, c, back ? 0.6 : 1);
    // a tail while it still moves
    if (Math.abs(v) > 0.2) for (let k = 1; k <= 3; k++) {
      const b = a - Math.sign(m.w) * k * 0.05 * Math.min(1, Math.abs(v));
      p.dot(Math.cos(b) * m.r, CY + Math.cos(b) * m.r * m.tilt + Math.sin(b) * m.r * 0.3, k < 2 ? C[5] : C[4], (back ? 0.5 : 0.9) * (1 - k / 4));
    }
    if (!back) p.glow(x, y, 5, cold ? G[6] : C[6], 0.3);
  }
}

__e.meta = meta; __e.create = create;
};

__M["fx/arcane/portal.js"] = function (__e) {
// The dithered light ramp and the streaked, knotted disc texture are adapted from Sprite Fusion's open-source
// black hole (https://www.spritefusion.com/pixel-art-vfx/black-hole), MIT License, Copyright (c) 2026 Hugo Duprez.
const {PAL, fit, cycle, tileNoise, smooth, ease, TAU, WHITE} = __req("core/index.js");
const {tone, mote, streak} = __req("fx/arcane/_lib.js");

const D = 2.4;

const meta = {
  name: "Portal",
  desc: "An upright rift: fibrous spiral arms wind down into the dark, a lit rim wobbles, motes and streaks are pulled in, the floor glows.",
  tags: ["arcane", "portal", "rift", "teleport", "magic", "ground", "loop"],
  size: [152, 116],
  origin: [76, 106],
  duration: D,
  loop: true,
  fps: 30,
  bg: "ground",
  options: { palette: PAL.arcane, width: 17, height: 29, seed: 4 },
};

const wrapPi = (a) => a - TAU * Math.floor((a + Math.PI) / TAU);

function setup(t, o) {
  const C = fit(o.palette, 8), rx = o.width, ry = o.height, ph = t / D, S = o.seed;
  const CY = -(ry + 5);
  // the rim's radius (1 = the oval) at angle th: slow noise rolling round it, plus a three-lobed breath
  const rim = (th) => 1 + 0.05 * tileNoise((th / TAU) * 10 + ph * 10, ph * 4, 10, 4, S) + 0.018 * Math.sin(th * 3 - ph * TAU * 2);
  // where a point at angle th and radius rho (1 = the rim) sits; outside, the field widens so motes come from round about
  const at = (th, rho) => {
    const out = Math.max(0, rho - 1), k = Math.min(1, rho);
    return [Math.cos(th) * (k * rx + out * 21), Math.min(-1, CY + Math.sin(th) * (k * ry + out * 16))];
  };
  // two hot spots chase round the rim with the spin, and a key light sits at the top left
  const spots = [ph * TAU * 2 - 0.6, ph * TAU * 2 + Math.PI - 0.6];
  const hot = (th) => Math.max(Math.exp(-(wrapPi(th - spots[0]) ** 2) / 0.12), 0.85 * Math.exp(-(wrapPi(th - spots[1]) ** 2) / 0.08)) + 0.35 * Math.max(0, Math.cos(th + 2.3));
  return { C, rx, ry, ph, S, CY, rim, at, hot, spots };
}

// the rift itself: the dark well, the fibrous arms winding down into it, the lit rim
function rift(p, s) {
  const { C, rx, ry, ph, CY, rim, hot } = s;
  p.shade(-rx - 4, CY - ry - 4, rx + 4, CY + ry + 4, (x, y, out) => {
    const u = x / rx, v = (y - CY) / ry, r = Math.hypot(u, v) || 1e-6, th = Math.atan2(v, u), R0 = rim(th);
    const g = Math.hypot(u / rx, v / ry) / r, e = (r - R0) / g, h = hot(th);
    if (e > 2.5) return;
    // outside the rim: a coloured line where it's lit, a dark one elsewhere, a faint halo past it
    if (e > 1.5) {
      if (h > 0.6) (out.c = C[3]), (out.a = 0.5);
      return;
    }
    if (e > 0.5) {
      out.c = h > 0.5 ? C[4] : C[2];
      return;
    }
    if (e > -0.5) {
      out.c = h > 0.42 ? WHITE : C[6];
      out.k = 0.25 + 0.4 * h;
      return;
    }
    // inside, in ramp steps: clean depth bands falling away to a dark well; three thin bright arms and three
    // faint ones on a log spiral, flowing inward a turn a loop, with knots of light running down them; the light
    // that spills in round the rim
    const d = r / R0, z = -Math.log(Math.max(0.02, d)), phi = 3 * th + 6.5 * z - TAU * 3 * ph;
    const c1 = 0.5 + 0.5 * Math.cos(phi), c2 = 0.5 + 0.5 * Math.cos(phi + Math.PI + 0.6 * z), lit = Math.pow(d, 1.5), sink = smooth(0.2, 0.62, d);
    const knot = Math.pow(Math.max(0, Math.cos(4 * z - phi / 3 + TAU * 5 * ph)), 6);
    let st = smooth(0.4, 0.7, d) + 0.6 * smooth(0.8, 0.95, d);
    const crest = Math.pow(c1, 16) * (0.6 + 5.6 * lit) * (1 + 0.5 * knot) * sink;
    st += crest + Math.pow(c1, 5) * 1.1 * lit;
    st += Math.pow(c2, 18) * (0.3 + 1.8 * lit) * sink;
    // rings of the tunnel shrinking away down the well, two a loop
    st += Math.pow(0.5 + 0.5 * Math.cos(TAU * (z * 1.5 - ph * 2)), 20) * 1.3 * sink * (1 - 0.5 * c1);
    // fine strands between the arms, a step brighter than the dark they run through
    st += Math.pow(0.5 + 0.5 * Math.cos(3 * phi + 2 * z + 1.3), 10) * 1.1 * lit * sink;
    st += 2.2 * Math.pow(smooth(0.8, 1, d), 2) * (0.75 + 0.45 * h);
    out.c = tone(C, st / 7, x, y, 0, 0.65);
    if (crest > 2.2) out.k = 0.12 + 0.05 * crest;
  });
}

// specks of light deep in the well, swept round with the arms and sinking towards the far end
function well(p, s) {
  const { C, rx, ry, ph, S, CY, rim } = s, t = ph * D;
  cycle(t, D, 18, S * 7 + 5, (g) => g.range(1.1, 1.8), (age, life, r) => {
    const q = age / life, th = r.range(0, TAU) + q * 2.6, rho = 0.92 * (1 - ease.inQuad(q) * 0.9), R0 = rim(th);
    const x = Math.cos(th) * rho * R0 * rx, y = CY + Math.sin(th) * rho * R0 * ry, tw = Math.sin(ph * TAU * r.int(14, 22) + r.range(0, TAU));
    const a = Math.min(1, q * 6) * (rho > 0.25 ? 1 : rho / 0.25);
    if (tw > -0.3) p.dot(x, y, rho > 0.6 && tw > 0.6 ? WHITE : rho > 0.45 ? C[6] : C[5], a);
  });
}

// motes riding round just outside the rim, sinking in as they go
function orbit(p, s) {
  const { C, rx, ry, ph, S, CY } = s;
  for (let i = 0; i < 7; i++) {
    const k = (ph * 2 + i / 7) % 1, th = ((i * 2.39 + S) % TAU) + ph * TAU * 2 + k * 2.5, rho = 1.2 + 0.35 * ((i * 0.618) % 1) - 0.3 * ease.inQuad(k);
    const x = Math.cos(th) * rho * rx, y = CY + Math.sin(th) * rho * ry, a = Math.min(1, Math.sin(k * Math.PI) * 2.2);
    mote(p, x, y, -Math.sin(th) * rx * 10, Math.cos(th) * ry * 10, i % 3 ? C[6] : WHITE, 0.6, a, 0.3);
  }
}

// motes and streaks pulled in from round about, spinning faster as they fall; inside they sink into the dark
function infall(p, s) {
  const { C, ph, S, rim, at } = s, t = ph * D;
  cycle(t, D, 60, S * 7 + 1, (g) => g.range(0.3, 0.5), (age, life, r) => {
    const a0 = r.range(0, TAU), d0 = r.range(1.8, 3), spin = r.range(0.8, 1.8) * (r.chance(0.8) ? 1 : 0.35), size = r.range(0.8, 1.5), hue = r.next();
    const pos = (q) => at(a0 + spin * q * q, d0 * (1 - Math.pow(q, 1.4)));
    const q = age / life, [x, y] = pos(q), [x2, y2] = pos(Math.min(1, q + 0.015)), vx = (x2 - x) / (0.015 * life), vy = (y2 - y) / (0.015 * life);
    const rho = d0 * (1 - Math.pow(q, 1.4)), R0 = rim(a0 + spin * q * q), fade = Math.min(1, q * 5);
    if (rho > R0 + 0.06) mote(p, x, y, vx, vy, hue < 0.25 ? WHITE : hue < 0.55 ? C[6] : hue < 0.8 ? C[5] : C[4], hue < 0.8 ? size : size * 1.4, fade, hue < 0.8 ? 0.4 : 0.15);
    else if (rho > 0.3) p.dot(x, y, rho > 0.65 ? C[6] : C[5], rho);
  });
  cycle(t, D, 12, S * 7 + 2, (g) => g.range(0.36, 0.5), (age, life, r) => {
    const a0 = r.range(0, TAU), d0 = r.range(2.3, 3), spin = r.range(0.2, 0.5);
    const qc = Math.sqrt(1 - 1.05 / d0), q = age / life;
    const pos = (q) => at(a0 + spin * q * q, d0 * (1 - q * q));
    if (q < qc) {
      const [x, y] = pos(q), [x2, y2] = pos(q + 0.015);
      streak(p, x, y, (x2 - x) / (0.015 * life), (y2 - y) / (0.015 * life), C[6], Math.min(1, q * 5));
    } else {
      // it hits the rim: a pinprick of white
      const k = 1 - (q - qc) / (1 - qc), [x, y] = pos(qc);
      if (k > 0.55) p.px(x, y, WHITE);
      p.glow(x, y, 7, C[6], 0.6 * k * k);
    }
  });
}

// grit and sparks skating in along the floor, lifting into the foot of the rift
function skaters(p, s) {
  const { C, ph, S, CY, ry } = s, t = ph * D, foot = CY + ry;
  cycle(t, D, 14, S * 7 + 3, (g) => g.range(0.7, 1.1), (age, life, r) => {
    const side = r.sign(), x0 = side * r.range(22, 50), y0 = -1 - r.range(0, 1.5), q = age / life, e = ease.inCubic(q);
    const x = x0 * (1 - e), y = y0 + (foot + 2) * smooth(0.55, 1, q);
    const [xb, yb] = [x0 * (1 - ease.inCubic(Math.max(0, q - 0.04))), y0 + (foot + 2) * smooth(0.55, 1, q - 0.04)];
    const big = r.chance(0.3);
    mote(p, x, y, (x - xb) * 25, (y - yb) * 25, big ? C[6] : C[5], big ? 0.9 : 0.6, Math.min(1, q * 4) * (1 - smooth(0.85, 1, q)), 0.3);
  });
}

function floor(p, s) {
  const { C, ph } = s, pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  for (let x = -36; x <= 36; x++) {
    const u = Math.abs(x + 0.5) / 36, a = (u < 0.55 ? 1 : 1 - (u - 0.55) / 0.45) * (0.8 + 0.2 * pulse);
    p.dot(x, 0, u < 0.2 ? WHITE : u < 0.5 ? C[6] : C[5], a);
    if (u < 0.3) p.dot(x, 1, u < 0.15 ? C[5] : C[4], u < 0.15 ? 1 : 0.5);
  }
}

function drawBack(p, t, o) {
  floor(p, setup(t, o));
}

function draw(p, t, o) {
  const s = setup(t, o), { C, CY, rx, ry, ph, rim, spots } = s, pulse = 0.85 + 0.15 * Math.sin(ph * TAU * 2);
  rift(p, s);
  well(p, s);
  orbit(p, s);
  infall(p, s);
  skaters(p, s);
  // light comes off the rim, not the void: a big soft pool, a halo hugging the rim, hot spots that shine, the floor lit
  p.glow(0, CY, ry * 5, C[4], 0.17 * pulse);
  p.glow(0, CY, ry * 2.6, C[4], 0.1 * pulse);
  for (let i = 0; i < 16; i++) {
    const th = (i / 16) * TAU, R0 = rim(th) * 1.08;
    p.glow(Math.cos(th) * R0 * rx, CY + Math.sin(th) * R0 * ry, 15, C[4], 0.15 * pulse);
  }
  for (const th of spots) p.glow(Math.cos(th) * rim(th) * rx, CY + Math.sin(th) * rim(th) * ry, 16, C[6], 0.42);
  for (let i = -3; i <= 3; i++) p.glow(i * 7, -1, 16, C[5], 0.12 * pulse);
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/arcane/_lib.js"] = function (__e) {
// Shared by the arcane effects: a dithered light ramp, closed-form motes and streaks for loops, crackling
// arcs, floor rings and an original rune alphabet. Files starting with _ are helpers, not effects.
// The dithered ramp (tone) is adapted from Sprite Fusion's open-source black hole
// (https://www.spritefusion.com/pixel-art-vfx/black-hole), and the arc drawing from its energy
// (https://www.spritefusion.com/pixel-art-vfx/energy), MIT License, Copyright (c) 2026 Hugo Duprez.

const {scale, clamp, bolt, luma, WHITE} = __req("core/index.js");

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** The 4x4 ordered-dither threshold (0..1) of the pixel cell holding (x, y). */
const bayer = (x, y) => BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)];

/**
 * Light intensity I (0..1) to a step of ramp R (dark to bright), dithering between neighbouring steps so a
 * gradient reads smooth at 1x; below lo it thins out through the dither and returns 0 (draw nothing).
 */
function tone(R, I, x, y, lo = 0.06, sharp = 0) {
  const b = bayer(x, y);
  if (I < lo && b > I / lo) return 0;
  const n = R.length - 1, f = clamp(I) * n;
  let i = Math.floor(f);
  // sharp (0..1) narrows the dithered zone between two steps, so broad areas stay clean and only edges dither
  const q = sharp > 0 ? clamp((f - i - 0.5) / (1 - sharp) + 0.5) : f - i;
  if (q > b) i = Math.min(n, i + 1);
  return R[i];
}

/** A drifting mote at (x, y) moving (vx, vy) px/s, drawn like the sim's MOTE: bright head, darker tail, light. */
function mote(p, x, y, vx, vy, c, size = 1, k = 1, glow = 0.4) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len = Math.min(16, 0.5 + sp * 0.026) * size, a = k < 0.35 ? k / 0.35 : 1;
  if (len > 1.2) p.line(x - ux * len, y - uy * len, x - ux * len * 0.35, y - uy * len * 0.35, scale(c, 0.55), a);
  p.line(x - ux * len * 0.4, y - uy * len * 0.4, x, y, c, a);
  if (glow > 0) p.glow(x, y, 2.5 + size, c, glow * k);
}

/** Energy rushing in, drawn like the sim's STREAK: a white tip, a colored body, a dim dotted tail. */
function streak(p, x, y, vx, vy, c, a = 1, maxLen = 7, glow = 0.4) {
  const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, L = clamp(sp / 30, 1, maxLen);
  for (let d = L; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L * 0.5 ? c : scale(c, 0.6), (d < L * 0.5 ? 1 : 1.2 - d / L) * a);
  if (glow > 0) p.glow(x, y, 4, c, glow * a);
}

/**
 * A crackling arc from (x0, y0) to (x1, y1): a jagged main path plus forks, as [{ pts, w }]. r is an Rng, so
 * re-seed it every couple of frames for flicker.
 */
function arc(r, x0, y0, x1, y1, { jag = 0.3, forks = 1, forkLen = 0.5 } = {}) {
  const L = Math.hypot(x1 - x0, y1 - y0), depth = Math.max(1, Math.min(5, Math.round(Math.log2(L / 1.5)))), main = bolt(r, x0, y0, x1, y1, { jag, depth });
  const out = [{ pts: main, w: 1 }];
  for (let k = 0; k < forks && main.length > 3; k++) {
    if (r.next() > 0.7) continue;
    const i = 1 + Math.floor(r.next() * (main.length - 2)), [x, y] = main[i], [px, py] = main[i - 1];
    const a = Math.atan2(y - py, x - px) + (r.next() < 0.5 ? -1 : 1) * (0.4 + r.next() * 0.6), l = L * forkLen * (0.4 + 0.6 * r.next()) * (1 - i / main.length);
    if (l > 1.5) out.push({ pts: bolt(r, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, { jag: jag * 1.1, depth: Math.max(1, depth - 2) }), w: 0.55 });
  }
  return out;
}

/**
 * Draw arc paths the way Sprite Fusion draws its bolts: a dithered halo while it's fresh, a body beside the
 * core, a white core, light along the path. cols: { core, body, halo, glow }; k: 1 fresh .. 0 gone.
 */
function drawArc(p, paths, cols, k = 1, glowK = 0.5) {
  const steps = (fn) => {
    for (const path of paths)
      for (let i = 0; i < path.pts.length - 1; i++) {
        const [ax, ay] = path.pts[i], [bx, by] = path.pts[i + 1], l = Math.max(1, Math.hypot(bx - ax, by - ay));
        for (let d = 0; d <= l; d += 0.5) fn(ax + ((bx - ax) * d) / l, ay + ((by - ay) * d) / l, path, i, d === 0);
      }
  };
  if (k > 0.45) steps((x, y, path) => { if (path.w >= 1) for (const [dx, dy] of CROSS) p.dot(x + dx * 1.5, y + dy * 1.5, cols.halo, (k - 0.45) * 1.6); });
  if (k > 0.25) steps((x, y, path) => { if (path.w > 0.4) (p.dot(x + 1, y, cols.body), p.dot(x, y + 1, cols.body)); });
  steps((x, y, path, i, first) => {
    p.px(x, y, path.w >= 1 && k > 0.3 ? cols.core : cols.body);
    if (first && i % 3 === 0) p.glow(x, y, (path.w >= 1 ? 9 : 5) * (0.5 + k * 0.5), cols.glow, glowK * k * path.w);
  });
}

/**
 * A ring lying on the floor (or any tilted plane): centre (cx, cy), radius r, squashed by sy, 1 px thick at
 * any size. c and a may be functions of the angle g around it (sin(g) > 0 is the near side, towards the viewer).
 * keep(g) picks which part to draw: (g) => Math.sin(g) < 0 is the far half, for drawBack.
 */
function floorRing(p, cx, cy, r, sy, c, a = 1, keep = null) {
  if (r < 0.5) return;
  const fc = typeof c === "function", fa = typeof a === "function", ry = r * sy;
  p.shade(cx - r - 1, cy - ry - 1, cx + r + 1, cy + ry + 1, (x, y, o) => {
    const nx = (x - cx) / r, ny = (y - cy) / Math.max(0.3, ry), d = Math.hypot(nx, ny);
    if (d < 1e-6) return;
    const g = Math.hypot(nx / r, ny / Math.max(0.3, ry)) / d;
    if (Math.abs(d - 1) / g > 0.5) return;
    const ang = Math.atan2(ny, nx);
    if (keep && !keep(ang)) return;
    o.c = fc ? c(ang) : c;
    o.a = fa ? a(ang) : a;
  });
}

// An original rune alphabet: angular 3 x 5 glyphs that stay readable standing upright at 1x.
const GLYPHS = [
  [".#.", "#.#", ".#.", ".#.", "#.#"],
  ["#.#", "#.#", ".#.", "#.#", "#.#"],
  ["##.", "#.#", "##.", "#..", "#.."],
  ["#..", "#.#", "###", "#.#", "..#"],
  [".##", "#..", ".#.", "..#", "##."],
  ["###", ".#.", "###", ".#.", ".#."],
  ["#.#", "###", "#.#", "..#", "..#"],
  [".#.", ".##", ".#.", "##.", ".#."],
];

/**
 * Rune i standing on (x, y): its bottom row sits on y, centred on x. c body color, a alpha (dithered), under an
 * optional darker color drawn a pixel lower so the glyph has a little thickness.
 */
function glyph(p, i, x, y, c, a = 1, under = 0) {
  const g = GLYPHS[((i % GLYPHS.length) + GLYPHS.length) % GLYPHS.length], X = Math.round(x) - 1, Y = Math.round(y) - g.length + 1;
  if (under) p.sprite(g, {}, X, Y + 1, { tint: under, a });
  p.sprite(g, {}, X, Y, { tint: c, a });
}

// Larger original sigils, 5 x 7, for runes that fly or hover on their own.
const SIGILS = [
  ["..#..", ".#.#.", "#.#.#", "..#..", ".###.", "..#..", ".#.#."],
  ["#...#", ".#.#.", "..#..", ".###.", "..#..", ".#.#.", "#...#"],
  ["#....", "##...", "#.#..", "#..#.", "#.#..", "##...", "#...."],
  ["..#..", "#.#.#", ".###.", "..#..", "..#..", ".#.#.", "#...#"],
  ["#.#.#", "#.#.#", "#####", "..#..", "..#..", "..#..", ".###."],
  ["#...#", "##.##", "#.#.#", "#...#", "#.#.#", "##.##", "#...#"],
  ["..#..", ".#.#.", "#...#", ".#.#.", "..#..", "..#..", "..#.."],
  ["#..#.", "#.#..", "##...", "#....", "##...", "#.#..", "#..#."],
];

/** Sigil i centred on (x, y) in color c, ringed by a 1 px edge in a darker color so it reads against anything. */
function sigil(p, i, x, y, c, a = 1, edge = 0) {
  const g = SIGILS[((i % SIGILS.length) + SIGILS.length) % SIGILS.length], X = Math.round(x) - 2, Y = Math.round(y) - 3;
  if (edge) for (const [dx, dy] of CROSS) p.sprite(g, {}, X + dx, Y + dy, { tint: edge, a });
  p.sprite(g, {}, X, Y, { tint: c, a });
}

/** A character's silhouette shaded by how light each pixel is: 1 its dark outline, 2 mid, 3 light (0 empty). */
function shades(A) {
  const s = new Uint8Array(A.w * A.h);
  for (let i = 0; i < s.length; i++) if (A.mask.data[i]) s[i] = A.pixels ? (luma(A.pixels[i]) < 0.24 ? 1 : luma(A.pixels[i]) < 0.62 ? 2 : 3) : 2;
  return s;
}

/**
 * Silhouette A (an actor) squeezed to sx of its width about its middle and shifted by dx: body color on its
 * pixels, edge color on its dark outline pixels. sh is shades(A). The blink's squeeze, adapted from Sprite Fusion.
 */
function squeezed(p, A, sh, sx, body, edge, a = 1, dx = 0) {
  if (sx <= 0.02) return;
  const cx = A.x + A.w / 2, half = A.w / 2 + 1;
  for (let y = 0; y < A.h; y++)
    for (let x = Math.floor(cx - half * sx); x <= Math.ceil(cx + half * sx); x++) {
      const i = Math.round(cx + (x + 0.5 - cx) / sx - 0.5) - A.x, v = i < 0 || i >= A.w ? 0 : sh[y * A.w + i];
      if (v) p.dot(x + dx, A.y + y, v === 1 ? edge : body, a);
    }
}

__e.bayer = bayer; __e.tone = tone; __e.mote = mote; __e.streak = streak; __e.arc = arc; __e.drawArc = drawArc; __e.floorRing = floorRing; __e.GLYPHS = GLYPHS; __e.glyph = glyph; __e.SIGILS = SIGILS; __e.sigil = sigil; __e.shades = shades; __e.squeezed = squeezed;
};

__M["fx/shadow/eclipse.js"] = function (__e) {
const {cycle, fit, clamp, smooth, rand, TAU, WHITE, mix} = __req("core/index.js");
const {VOID, halo, unlight} = __req("fx/shadow/_lib.js");

const meta = {
  name: "Eclipse",
  desc: "A black moon over the sun: a breathing pearl corona with long streamers, a thin white rim, and one diamond bead blazing on its edge.",
  tags: ["shadow", "eclipse", "moon", "sun", "corona", "sky", "magic", "loop"],
  size: [160, 144],
  origin: [80, 72],
  duration: 4,
  loop: true,
  fps: 30,
  bg: "sky",
  options: { palette: VOID, pearl: ["#5a4f8a", "#a99be0", "#e6defa", "#fffaf2"], seed: 3 },
};

// the moon's radius, the loop, where the bead blazes on the rim (radians, 0 = right, up is negative)
const R = 19, D = 4, BEAD = -0.72;
const breathe = (t, k, ph) => Math.sin((TAU * k * t) / D + ph);
// streamers: crowded toward the equator (left and right), longer there, each curving off as it goes out
const STREAMS = Array.from({ length: 30 }, (_, i) => {
  const side = i % 2 ? 0 : Math.PI, spread = (rand(i, 1) - 0.5) * (rand(i, 2) < 0.7 ? 1.3 : 3.1);
  const a = side + spread, eq = Math.abs(Math.cos(a));
  return { a, len: (10 + rand(i, 3) * 28) * (0.45 + 0.75 * eq), curl: (rand(i, 4) - 0.5) * 0.00018, k: 1 + (i % 3), ph: rand(i, 5) * TAU, w: rand(i, 6) };
});

function drawBack(p, t, o) {
  const C = fit(o.palette, 8), Q = fit(o.pearl, 4), S = o.seed;
  // stars twinkling in the dark sky round it
  cycle(t, D, 26, S, (r) => r.range(1.2, 2.6), (age, L, r) => {
    const x = r.range(-78, 78), y = r.range(-70, 70);
    if (Math.hypot(x, y) < R + 22) return;
    const k = Math.sin((Math.PI * age) / L);
    p.dot(x, y, k > 0.7 ? WHITE : Q[1], k * 1.2);
    if (k > 0.85 && r.next() < 0.4) (p.dot(x - 1, y, Q[0], 0.8), p.dot(x + 1, y, Q[0], 0.8));
  });
  // the outer corona's light: a wide pearly bloom, breathing
  const b = 1 + 0.08 * breathe(t, 1, 0);
  p.glow(0, 0, 72 * b, C[4], 0.38);
  p.glow(0, 0, 46 * b, Q[1], 0.34);
  // streamers: fine rays of pearl, white at the root, thinning to violet, curling as they go out
  for (const s of STREAMS) {
    const L = s.len * (1 + 0.18 * breathe(t, s.k, s.ph));
    for (let d = 4; d <= L; d += 0.5) {
      const u = d / L, a = s.a + s.curl * d * d, r = R + 1 + d, x = Math.cos(a) * r, y = Math.sin(a) * r;
      p.dot(x, y, u < 0.3 ? Q[2] : u < 0.65 ? Q[1] : C[5], u < 0.75 ? 1 : (1 - u) * 4);
    }
    p.glowLine(Math.cos(s.a) * (R + 4), Math.sin(s.a) * (R + 4), Math.cos(s.a) * (R + L * 0.6), Math.sin(s.a) * (R + L * 0.6), 3, Q[1], 0.12);
  }
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), Q = fit(o.pearl, 4), b = 1 + 0.08 * breathe(t, 1, 0);
  // the inner corona: a bright collar hugging the moon, finely streaked, fading out through pearl to violet
  const W = R + 10;
  p.shade(-W, -W, W, W, (x, y, out) => {
    const r = Math.sqrt(x * x + y * y);
    if (r < R - 0.5 || r > R + 9 * b) return;
    const a = Math.atan2(y, x), e = (r - R) / (9 * b);
    const streak = 0.55 + 0.3 * Math.cos(a * 23 + Math.sin(a * 5) * 2) + 0.15 * Math.cos(a * 41 - (TAU * t) / D);
    const I = (1 - e) ** 2.2 * streak * (0.75 + 0.4 * Math.abs(Math.cos(a)));
    if (r < R + 0.9) return Q[3];
    if (I < 0.1) return;
    if (I > 0.45 && ((Math.floor(x) + Math.floor(y)) & 1) === 0) out.k = 0.2 * I;
    return I > 0.72 ? Q[2] : I > 0.42 ? Q[1] : I > 0.22 ? C[5] : C[4];
  });
  // the moon: black, a whisper of earthshine on its left limb
  p.shade(-R, -R, R, R, (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    if (r >= R - 0.5) return;
    return r > R - 2.2 && x < -R * 0.45 ? C[1] : C[0];
  });
  // the diamond bead: a blazing point on the rim, rays flaring out and breathing
  const bx = Math.cos(BEAD) * (R + 0.4), by = Math.sin(BEAD) * (R + 0.4), k = 0.75 + 0.25 * breathe(t, 2, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.12, len = (i % 2 ? 7 : 22) * k * (i === 1 || i === 5 ? 1.6 : 1);
    for (let d = 1; d <= len; d += 0.5) {
      const u = d / len, x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
      if (x * x + y * y < (R - 0.5) ** 2) break;
      p.dot(x, y, u < 0.35 ? WHITE : u < 0.7 ? Q[2] : Q[1], u < 0.5 ? 1 : (1 - u) * 2.2);
    }
  }
  p.circle(bx, by, 3 * k, Q[2]);
  p.circle(bx, by, 2.2 * k, Q[3]);
  p.circle(bx, by, 1.4, WHITE);
  p.glow(bx, by, 46 * k, Q[2], 0.8 * k);
  p.glow(bx, by, 14, WHITE, 0.8);
  halo(p, 0, 0, R - 0.5, R + 16, Q[2], 0.35 * b);
  unlight(p, -R, -R, R, R, (x, y) => x * x + y * y < (R - 0.6) ** 2);
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

__M["fx/nature/thorns.js"] = function (__e) {
// The wave (spikes punching up one after another, each bigger, with overshoot, a white frame, a burst of debris
// and glints, a line running along the floor ahead of them) is adapted from Sprite Fusion's open-source ice
// spikes (https://www.spritefusion.com/pixel-art-vfx/ice), MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, clamp, smooth, ease, rand, TAU, WHITE} = __req("core/index.js");
const {drawRock, stoneShape, drawLeaf} = __req("fx/nature/_lib.js");

const meta = {
  name: "Thorns",
  desc: "A seam races along the floor and hooked thorns punch up out of it one after another, each bigger than the last, in bursts of dirt and green light; they hold, then sink.",
  tags: ["nature", "thorns", "plant", "spikes", "ground", "attack", "one-shot"],
  size: [232, 92],
  origin: [48, 78],
  duration: 2.4,
  loop: false,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#160c0e", "#2e1418", "#4e2224", "#743a30", "#9a5a3e", "#c08458", "#e2b484", "#fbe8c8"],
    glow: ["#123818", "#2f7a2a", "#6cb83a", "#c8f070"],
    soil: ["#120c0c", "#251917", "#3b2a24", "#553d31", "#715440", "#8f6e52", "#b8966e", "#e6d0a8"],
    count: 6,
    seed: 8,
  },
};

const RISE = 0.11, SINK = 0.36;

// a hooked thorn: a hardwood horn tapering from its foot, its point hooked forward; lit down its left edge with a
// bright ridge, shaded on the right, grain running up it, a pale point, a barb off its back, a dark rim
function thorn(p, s, h, C, opts) {
  if (h < 1.5) return;
  const { x, w, hook, lean } = s, base = opts.base ?? 0, white = opts.white;
  const cx = (u) => x + lean * u + hook * Math.pow(u, 2.4), hw = (u) => (w / 2) * Math.pow(1 - u, 0.9) + 0.25;
  const inside = (px, py) => {
    const u = (base - (py + 0.5)) / h;
    if (u < 0 || u > 1 || py + 0.5 > 0) return false;
    const c = cx(u), fx = px + 0.5;
    return Math.abs(fx - c) <= hw(u);
  };
  const X0 = Math.floor(x - w - 6), X1 = Math.ceil(x + w / 2 + Math.abs(lean) + Math.abs(hook) + 2);
  for (let py = Math.floor(base - h) - 1; py <= Math.min(0, Math.ceil(base)); py++)
    for (let px = X0; px <= X1; px++) {
      if (!inside(px, py)) {
        if (py <= 0 && (inside(px - 1, py) || inside(px + 1, py) || inside(px, py + 1) || inside(px, py - 1))) p.dot(px, py, C[0], opts.a ?? 1);
        continue;
      }
      if (white) {
        p.px(px, py, WHITE);
        continue;
      }
      const u = (base - (py + 0.5)) / h, c = cx(u), r = hw(u), q = (px + 0.5 - (c - r)) / (2 * r);
      let i = q < 0 ? 4 : q < 0.16 ? 6 : q < 0.36 ? 5 : q < 0.46 ? 7 : q < 0.7 ? 4 : q < 0.86 ? 3 : 2;
      if (u > 0.86) i = q < 0.6 ? 7 : 5;
      if (i < 7 && i > 2 && rand(px, Math.floor((py + 0.5 - base) / 3), s.seed) < 0.12) i -= 1;
      p.px(px, py, C[i]);
    }
  // a barb off its back, raking up and away
  if (!white && h > 14) {
    const u0 = 0.34, u1 = 0.46, y0 = base - u0 * h, y1 = base - u1 * h, e0 = cx(u0) - hw(u0), e1 = cx(u1) - hw(u1), L = w * 0.45;
    if (y0 <= 0) {
      p.tri(e0 + 0.5, y0, e1 + 0.5, y1, e1 - L, y1 - L * 0.7, C[3]);
      p.line(e1, y1, e1 - L, y1 - L * 0.7, C[6]);
      p.px(e1 - L, y1 - L * 0.7, C[7]);
      p.line(e0, y0 + 1, e1 - L + 1, y1 - L * 0.7 + 1, C[0]);
    }
  }
}

function create(o) {
  const C = fit(o.palette, 8), G = fit(o.glow, 4), S = fit(o.soil, 8), R = new Rng(o.seed), floor = () => 0, n = Math.max(2, o.count);
  const ps = new Particles({ rng: R, ground: floor, sparks: [G[3], G[2], G[1], G[0]] });
  const lights = new Lights(), chips = [];
  const list = Array.from({ length: n }, (_, i) => {
    const k = i / (n - 1), h = 12 + 36 * k + R.range(-1.5, 1.5);
    return { x: 10 + i * (104 / (n - 1)) + R.range(-3, 3), h, w: 6 + 9 * k, lean: R.range(-1, 1.5) + k * 2, hook: h * R.range(0.14, 0.22), at: 0.12 + i * 0.075, sink: 1.45 + i * 0.06, seed: R.int(1, 999), up: false, down: false };
  });
  const reach = list[n - 1].x + 8;
  let t = 0;
  const chip = (x, sp, nn) => {
    for (let i = 0; i < nn; i++) {
      const a = -Math.PI / 2 + R.range(-1.1, 1.1), v = R.range(60, 210) * sp;
      chips.push({ x: x + R.range(-3, 3), y: -1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a: R.range(0, TAU), va: R.range(-15, 15), s: R.range(1.3, 2.6) * Math.sqrt(sp), pts: stoneShape(R), life: Math.min(R.range(0.7, 1.1), meta.duration - 0.05 - t) });
    }
  };
  const grown = (s) => (t < s.at ? 0 : ease.outBack(clamp((t - s.at) / RISE), 2.4));
  const sunk = (s) => smooth(s.sink, s.sink + SINK, t);
  return {
    update(dt) {
      t += dt;
      const f = Math.min(1, dt * 120);
      for (const s of list) {
        const k = s.h / 48;
        if (!s.up && t >= s.at) {
          s.up = true;
          lights.add(s.x, -s.h * 0.5, 18 + 18 * k, WHITE, 0.45, 0.08);
          lights.add(s.x, -s.h * 0.4, 26 + 26 * k, G[2], 0.45, 0.4);
          chip(s.x, 0.6 + 0.6 * k, 3 + Math.round(5 * k));
          for (let i = 0; i < 10 + 18 * k; i++) {
            const a = -Math.PI / 2 + R.range(-1, 1), v = R.range(60, 230) * (0.6 + 0.6 * k);
            ps.spawn(P.GRIT, s.x + R.range(-s.w / 3, s.w / 3), -1, Math.cos(a) * v, Math.sin(a) * v, R.range(0.6, 1.1), R.pick([S[5], S[4], S[3]]), R.chance(0.3) ? 2 : 1);
          }
          for (let i = 0; i < 3 + 5 * k; i++) ps.spawn(P.SMOKE, s.x + R.range(-4, 4), -R.range(1, 4), R.sign() * R.range(20, 80), -R.range(5, 25), R.range(0.7, 1.2), S[5], R.range(3, 5.5) * (0.6 + 0.5 * k), 0, 0);
          for (let i = 0; i < 2 + 3 * k; i++) ps.spawn(P.STAR, s.x + s.hook * 0.8 + R.range(-3, 3), -s.h * R.range(0.5, 1), R.range(-10, 10), -R.range(5, 20), R.range(0.3, 0.6), G[3], R.range(0.8, 2), R.range(0, 0.12));
          for (let i = 0; i < 4; i++) ps.spawn(P.MOTE, s.x + R.range(-3, 3), -R.range(2, s.h * 0.6), R.range(-20, 20), -R.range(30, 70), R.range(0.4, 0.8), G[3], 0.7);
        }
        if (!s.down && t >= s.sink) {
          s.down = true;
          chip(s.x, 0.35, 2 + Math.round(2 * k));
          for (let i = 0; i < 3 + 3 * k; i++) ps.spawn(P.DUST, s.x + R.range(-s.w / 2, s.w / 2), -R.range(0, 3), R.sign() * R.range(15, 50), -R.range(2, 10), Math.min(R.range(0.4, 0.7), meta.duration - 0.05 - t), S[5], R.range(2, 4));
        }
        // while they stand, glints run up their lit edges
        if (s.up && !s.down && t > s.at + 0.2 && R.chance(0.05 * f)) ps.spawn(P.STAR, s.x + s.lean * 0.5 - s.w * 0.15, -s.h * R.range(0.3, 0.8), 0, -3, R.range(0.25, 0.45), C[7], R.range(0.8, 1.8));
      }
      for (let i = chips.length - 1; i >= 0; i--) {
        const c = chips[i];
        if ((c.life -= dt) <= 0) chips.splice(i, 1);
        c.vy += 950 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.a += c.va * dt;
        if (c.y > 0 && c.vy > 0) c.vy > 120 ? ((c.y = 0), (c.vy *= -0.3), (c.vx *= 0.6), (c.va *= 0.5)) : ((c.y = 0), (c.vy = c.vx = c.va = 0));
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the seam racing ahead along the floor: a dark split with a green glow in it, closing up again at the end
      const run = ease.outCubic(clamp((t - 0.04) / 0.5)) * reach, fade = 1 - smooth(1.9, 2.3, t);
      for (let x = -2; x <= run; x++) {
        const hot = clamp(1 - (run - x) / 18) * (1 - smooth(0.6, 1.2, t)), h = rand(x, 31);
        p.dot(x, 0, hot > 0.4 ? G[3] : hot > 0.1 ? G[2] : S[0], fade);
        if (h < 0.5) p.dot(x, 1, S[1], fade * 0.8);
        if (h < 0.15) p.dot(x, -1, S[4], fade);
        if (hot > 0.3 && (x & 3) === 0) p.glow(x, 0, 6, G[2], 0.3 * hot);
      }
      ps.draw(p, "back");
    },
    draw(p) {
      for (const s of list) {
        const g = grown(s), k = sunk(s);
        if (g <= 0 || k >= 1) continue;
        thorn(p, s, s.h * g, C, { white: t - s.at < 0.035, base: k * s.h * 1.05 });
        if (t - s.at < 0.3) p.glow(s.x, -s.h * 0.5 * g, s.h * 0.6 + 6, G[2], 0.35 * (1 - (t - s.at) / 0.3));
        // a collar of leaves round its foot, unfurling as it comes up and folding away as it sinks
        const lk = clamp((t - s.at - 0.04) / 0.18) * (1 - k), lw = s.w * 0.5;
        if (lk > 0.05)
          for (const [sd, a0, sz] of [[-1, -2.5, 1], [1, -0.55, 0.9], [-1, -1.9, 0.7]]) {
            const la = a0 + sd * 0.25 * (1 - lk) + Math.sin(t * 4 + s.x) * 0.06, L = (5 + s.w * 0.45) * sz * lk;
            drawLeaf(p, s.x + sd * lw + Math.cos(la) * L * 0.5, -1 + Math.sin(la) * L * 0.5, L, 1.4 + s.w * 0.1 * sz, la, 0.35, [G[0], G[1], G[2], G[3]]);
          }
        p.glow(s.x, -2, s.w + 6, G[2], 0.18 * lk);
      }
      for (const c of chips) drawRock(p, c.x, c.y, c.s, c.a, c.pts, S, Math.min(1, c.life / 0.25));
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/water/wave-crash.js"] = function (__e) {
// The lip's crescent (a thick arc, white on its outer rim, cooling to deep blue underneath, with light along it)
// follows Sprite Fusion's open-source slash (https://www.spritefusion.com/pixel-art-vfx/slash),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, sparkle, clamp, smooth, ease, noise, noise2, TAU, WHITE} = __req("core/index.js");
const {WATER, Drops, Ripples, Mist, billow} = __req("fx/water/_lib.js");

const meta = {
  name: "Wave crash",
  desc: "A swell rolls in and steepens, its lip throws forward and curls over a dark barrel, then crashes into a burst of white foam and spray that surges on and fades to lace.",
  tags: ["water", "wave", "crash", "surf", "foam", "spray", "one-shot"],
  size: [224, 104],
  origin: [112, 86],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: WATER, seed: 6 },
};

const SY = 0.22, G = 820, CRASH = 1.2, LIP0 = 0.62, EDGE = 110;

// the swell: where its crest is, how tall, how steep its face, as it rolls in, crashes and runs on as whitewater
const crestX = (t) => (t < CRASH ? -80 + 72 * ease.inOutSine(t / CRASH) : -8 + 30 * ease.outCubic(clamp((t - CRASH) / 1.4)));
const crestH = (t) => (t < CRASH ? 5 + 33 * ease.inOutSine(clamp(t / (CRASH * 0.92))) : 38 * (1 - ease.outCubic(clamp((t - CRASH) / 0.45))) + 5 * (1 - smooth(CRASH, CRASH + 1.6, t)));
const faceW = (t) => (t < CRASH ? 24 - 16 * smooth(0.3, CRASH, t) : 8 + 14 * smooth(CRASH, CRASH + 0.6, t));
// the lip: thrown forward off the crest and falling, until its tip hits the water at CRASH
const lipK = (t) => clamp((t - LIP0) / (CRASH - LIP0));

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), S = o.seed;
  const ps = new Particles({ rng: R }), mist = new Mist(), lights = new Lights(), rings = new Ripples({ sy: SY }), puffs = [], plinks = [];
  const drops = new Drops({
    sy: SY,
    g: G,
    onLand: (d) => {
      rings.add(d.x, d.z, 0.6, 2 + d.s * 1.8, 0.3 + d.s * 0.1, { n: 1, k: 0.9, hot: 0.05 });
      plinks.push({ x: d.x, y: d.z * SY, age: 0 });
    },
  });
  let t = 0, crashed = false;
  const height = (x, tt) => {
    const xc = crestX(tt), A = crestH(tt), dx = x - xc;
    return A * Math.exp(-((dx / (dx < 0 ? 30 : faceW(tt))) ** 2));
  };
  // a point on the lip at s (0 at the crest, 1 at its tip), and its thickness there
  const lip = (s, tt) => {
    const k = lipK(tt), xc = crestX(tt), A = crestH(tt);
    return [xc + 1 + s * 30 * Math.pow(k, 0.8), -A - 4 * s * (1 - s) * (1 + 4 * k) + s * s * A * ease.inQuad(k) * 0.98, (11 - 8.5 * s) * (0.5 + 0.5 * k)];
  };
  const puff = (x, y, vx, vy, r0, r1, life, delay = 0) => puffs.push({ x, y, vx, vy, r0, r1, life, max: life, delay });

  // the swell's body, column by column: deep blue down its back and base with wind lines, a lit rim along its
  // surface, white water at the crest, a lit window high on its face where the light comes through, and streaks of
  // foam drawn up the face
  function body(p, fade) {
    const xc = crestX(t), A = crestH(t);
    for (let X = -EDGE; X < EDGE; X++) {
      const x = X + 0.5, h = height(x, t), edge = 1 - smooth(EDGE - 24, EDGE, Math.abs(x));
      if (h < 0.6 || edge <= 0) continue;
      const face = x > xc, near = Math.exp(-(((x - xc) / 9) ** 2)), a = fade * edge * 1.4;
      for (let Y = Math.floor(-h); Y < 0; Y++) {
        const y = Y + 0.5, u = (y + h) / h, depth = y + h;
        let c;
        if (depth < 1) c = near > 0.5 && A > 14 && noise(x * 0.6 + t * 9, S) > -0.35 ? WHITE : face ? C[5] : C[6];
        else if (depth < 2.4 && near > 0.35 && A > 14) c = noise2(x * 0.5, y * 0.5 + t * 6, S + 1) > -0.1 ? WHITE : C[6];
        else {
          // face and back shade differently; blend the two across the crest so there's no seam
          const win = near * (1 - u) * 1.6, up = noise2((x * 0.9 - y * 0.35) * 0.8, y * 0.12 + t * 5, S + 2), wind = noise2(x * 0.18 - t * 2, y * 0.9, S + 3);
          const fi = up > 0.55 && u < 0.85 ? 6 : win > 0.8 ? 5 : win > 0.45 || up > 0.3 ? 4 : win > 0.2 || up > 0.05 ? 3 : u < 0.6 ? 2 : 1;
          const bi = u < 0.14 ? 4 : wind > 0.55 ? 4 : wind > 0.25 || u < 0.32 ? 3 : u < 0.7 ? 2 : 1;
          c = C[Math.round(bi + (fi - bi) * smooth(xc - 5, xc + 5, x))];
        }
        p.dot(X, Y, c, a);
      }
    }
  }

  // the lip: a thick arc thrown off the crest, white along its outer edge, tinted through, dark underneath
  function curl(p) {
    const k = lipK(t);
    if (k <= 0 || t >= CRASH) return;
    const cells = new Map();
    for (let s = 0; s <= 1; s += 0.012) {
      const [x, y, w] = lip(s, t), [x2, y2] = lip(Math.min(1, s + 0.012), t), tx = x2 - x, ty = y2 - y, l = Math.hypot(tx, ty) || 1, nx = ty / l, ny = -tx / l;
      for (let q = 0; q <= 1; q += 0.5 / Math.max(1, w)) {
        const px = x + nx * (q - 0.5) * w, py = y + ny * (q - 0.5) * w, key = Math.floor(py) * 1024 + Math.floor(px);
        // q 0 is the outer (upper) rim, 1 the underside
        const c = q < 0.18 ? WHITE : q < 0.36 ? (s > 0.8 ? WHITE : C[6]) : q < 0.56 ? C[5] : q < 0.76 ? C[4] : C[3];
        const cur = cells.get(key);
        if (!cur || q < cur.q) cells.set(key, { x: px, y: py, c, q });
      }
    }
    for (const c of cells.values()) p.px(c.x, c.y, c.c);
    for (let s = 0; s <= 1; s += 0.125) {
      const [x, y, w] = lip(s, t);
      p.glow(x, y, 6 + w, C[5], 0.24 * k);
    }
    // the tip glints as it throws
    const [tx, ty] = lip(1, t), g = Math.sin(Math.PI * clamp((k - 0.55) / 0.45));
    if (g > 0.05) sparkle(p, tx, ty, 6 * g, C[6], C[5], 0.5 * g);
    // light caught under the barrel
    const [bx, by] = lip(0.6, t);
    p.glow(bx - 3, by + 8, 16, C[4], 0.25 * k);
  }

  // the sea it rolls on: a lit line along the surface, dark water under it, glints sliding along
  function sea(p, fade) {
    for (let X = -EDGE; X < EDGE; X++) {
      const x = X + 0.5, edge = 1 - smooth(EDGE - 30, EDGE, Math.abs(x)), a = fade * edge;
      if (a <= 0.02) continue;
      const g = noise(x * 0.3 - t * 3, S + 4);
      p.dot(X, 0, g > 0.55 ? C[6] : C[4], a * 1.2);
      p.blend(x, 1.5, C[2], 0.6 * a);
      p.blend(x, 2.5, C[1], 0.45 * a);
    }
  }

  return {
    update(dt) {
      t += dt;
      const k = lipK(t);
      // wind tears spray off the crest; the lip's tip sheds drops as it throws
      if (t < CRASH && crestH(t) > 14 && R.chance(0.5)) {
        const xc = crestX(t), A = crestH(t);
        ps.spawn(P.FLAKE, xc + R.range(-4, 3), -A - R.range(0, 2), -R.range(20, 60), -R.range(10, 40), R.range(0.5, 0.9), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.3));
      }
      if (k > 0.3 && t < CRASH && R.chance(0.35)) {
        const [x, y] = lip(1, t);
        drops.add({ x, z: R.range(-3, 3), h: -y, vx: R.range(30, 90), vz: R.range(-10, 10), vh: R.range(-20, 40), s: R.chance(0.3) ? 2 : 1 });
      }
      if (!crashed && t >= CRASH) {
        crashed = true;
        const [X0] = lip(1, CRASH - 1e-3);
        lights.add(X0, -20, 56, C[5], 0.8, 0.55);
        lights.add(X0, -4, 22, WHITE, 0.6, 0.1);
        for (let i = 0; i < 46; i++) {
          const a = R.range(-0.9, 0.6) * Math.PI, v = R.range(30, 120);
          drops.add({ x: X0 + R.range(-6, 6), z: R.range(-4, 4), h: R.range(2, 8), vx: Math.cos(a) * v * 0.85 + 18, vz: Math.sin(a) * v * 0.5, vh: R.range(120, 320), s: R.chance(0.15) ? 3 : R.chance(0.35) ? 2 : 1, delay: R.range(0, 0.1) });
        }
        // the spit: a plume shot straight up where the lip lands
        for (let i = 0; i < 14; i++) drops.add({ x: X0 + R.range(-3, 3), z: R.range(-2, 2), h: R.range(2, 6), vx: R.range(-15, 25), vz: R.range(-8, 8), vh: R.range(220, 300), s: R.chance(0.3) ? 2 : 1, delay: R.range(0.04, 0.16) });
        for (let i = 0; i < 34; i++) puff(X0 + R.range(-12, 10), -R.range(2, 12), R.range(-40, 130), -R.range(30, 150), R.range(1, 2), R.range(1.8, 4.2), R.range(0.4, 0.95), R.range(0, 0.14));
        // fine spray hangs in the air over the burst
        for (let i = 0; i < 34; i++) {
          const a = R.range(-Math.PI * 0.95, -Math.PI * 0.05), v = R.range(40, 160);
          ps.spawn(P.FLAKE, X0 + R.range(-8, 8), -R.range(4, 14), Math.cos(a) * v + 25, Math.sin(a) * v, R.range(0.6, 1.3), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.4), R.range(0, 0.1));
        }
        for (let i = 0; i < 12; i++) mist.add(X0 + R.range(-10, 14), -R.range(3, 16), R.range(-20, 70), -R.range(6, 24), 3, R.range(9, 15), R.range(1.1, 1.7), R.chance(0.5) ? C[6] : WHITE, 0.26, R.range(0, 0.2));
        for (let i = 0; i < 10; i++) ps.spawn(P.STAR, X0 + R.range(-20, 24), -R.range(6, 40), 0, -5, R.range(0.3, 0.6), C[6], R.range(1, 2.4), R.range(0.05, 0.4));
        rings.add(X0, 0, 6, 40, 1.2, { n: 2, gap: 3, k: 1.1, hot: 0.12 });
      }
      // the whitewater surges on, boiling up foam at its front, then calms
      if (crashed && t < CRASH + 1.1 && R.chance(0.45 * (1 - (t - CRASH) / 1.1))) {
        const x = crestX(t) + R.range(-6, 14);
        puff(x, -R.range(1, 4), R.range(10, 40), -R.range(10, 40), R.range(0.9, 1.8), R.range(1.8, 3.6), R.range(0.4, 0.8));
      }
      if (crashed && t < CRASH + 0.8 && R.chance(0.12)) mist.add(crestX(t) + R.range(-8, 8), -R.range(2, 6), R.range(10, 40), -R.range(3, 10), 3, R.range(7, 11), R.range(0.8, 1.1), C[6], 0.2);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const f = puffs[i];
        if (f.delay > 0) {
          f.delay -= dt;
          continue;
        }
        if ((f.life -= dt) <= 0) {
          puffs.splice(i, 1);
          continue;
        }
        f.vx -= f.vx * 2.5 * dt;
        f.vy += (160 - f.vy * 2.5) * dt;
        f.x += f.vx * dt;
        f.y = Math.min(f.y + f.vy * dt, -1);
      }
      for (let i = plinks.length - 1; i >= 0; i--) if ((plinks[i].age += dt) > 0.12) plinks.splice(i, 1);
      drops.update(dt);
      rings.update(dt);
      mist.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      const fade = smooth(0, 0.25, t) * (1 - smooth(meta.duration - 0.7, meta.duration - 0.1, t));
      sea(p, fade);
      rings.draw(p, C, -1);
      drops.draw(p, C, "back");
    },
    draw(p) {
      const fade = smooth(0, 0.25, t) * (1 - smooth(meta.duration - 0.7, meta.duration - 0.1, t));
      body(p, fade);
      curl(p);
      rings.draw(p, C, 1);
      // lace left on the water behind the surge, thinning out
      if (crashed) {
        const k = 1 - smooth(CRASH + 0.4, meta.duration - 0.15, t), x0 = -20, x1 = crestX(t) + 10;
        for (let X = Math.floor(x0); X < x1; X++) {
          const x = X + 0.5, n = 1 - Math.abs(noise2(x * 0.35, t * 0.8, S + 7)) * 4;
          if (n > 1.15 - k * 1.1) p.px(X, 0, n > 1.4 - k ? WHITE : C[6]);
          if (n > 1.4 - k * 0.9) p.px(X, 1, C[5]);
        }
      }
      for (const f of puffs) {
        if (f.delay > 0) continue;
        const g = 1 - f.life / f.max, r = (f.r0 + (f.r1 - f.r0) * ease.outCubic(g)) * (1 - smooth(0.7, 1, g));
        if (r > 0.6) billow(p, f.x, f.y, r, C);
      }
      for (const q of plinks) {
        if (q.age < 0.06) p.px(q.x, q.y, WHITE);
        p.glow(q.x, q.y, 4, C[5], 0.25 * (1 - q.age / 0.12));
      }
      drops.draw(p, C, "front");
      // the crash: a white burst where the lip lands
      const f = (t - CRASH) / 0.08;
      if (f >= 0 && f < 1) {
        const [X0] = lip(1, CRASH - 1e-3);
        p.circle(X0, -3, 8 * (1 - f * 0.4), WHITE);
        p.ellipse(X0, 0, 14, 2.6, (d) => (d < 0.6 ? WHITE : C[6]));
      }
      ps.draw(p);
      mist.draw(p, C[5]);
      lights.draw(p);
      // light: the crest catches it while it stands, the whitewater after
      if (t < CRASH) {
        p.glow(crestX(t) + 4, -crestH(t) + 2, 26, C[4], 0.22 * smooth(0.2, CRASH, t));
        p.glowLine(crestX(t) - 26, -crestH(t) * 0.45, crestX(t), -crestH(t), 10, C[5], 0.14 * smooth(0.2, CRASH, t));
      }
      else p.glow(crestX(t), -10, 34, C[4], 0.26 * (1 - smooth(CRASH, meta.duration - 0.3, t)));
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/shadow/grasping-hands.js"] = function (__e) {
const {Particles, P, Rng, fit, clamp, smooth, ease, TAU, WHITE, mix} = __req("core/index.js");
const {VOID, Puffs, PK, Drops, floorPool, ringFast} = __req("fx/shadow/_lib.js");

const meta = {
  name: "Grasping hands",
  desc: "Shadow arms burst up out of a dark pool with a splash, clench their hands into claws, strain, and are dragged back under, fingers clawing at the air.",
  tags: ["shadow", "hands", "arms", "grab", "ground", "dark", "magic", "one-shot"],
  size: [200, 116],
  origin: [100, 100],
  duration: 3.1,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: VOID, seed: 5 },
};

const RX = 42, OPEN = 0.32, SHUT = 2.35, LX = -0.6, LY = -0.8;

// an arm at t: it rises out of the pool along its own shape, bent at the elbow, swaying; returns its spine
function arm(A, t) {
  const e = clamp((t - A.t0) / 0.22), d = clamp((t - A.td) / 0.34);
  if (e <= 0 || d >= 1) return null;
  const rise = ease.outBack(e, 1.6) * (1 - ease.inQuad(d)), hidden = (1 - rise) * A.L;
  const grip = gripOf(A, t), strain = t > A.t0 + 0.5 && t < A.td ? Math.sin(t * 47 + A.ph) * 0.03 : 0;
  const elbow = A.bend * (0.3 + 0.7 * grip) * (1 - d) + strain, lean = A.lean + 0.06 * Math.sin(t * 2.2 + A.ph) + d * A.lean * 0.6;
  let th = -Math.PI / 2 + lean, x = A.x - Math.cos(th) * hidden, y = A.y - Math.sin(th) * hidden;
  const pts = [], n = Math.ceil(A.L / 0.5);
  for (let i = 0; i <= n; i++) {
    const s = i * 0.5, u = s / A.L;
    pts.push({ x, y, th, w: A.W * (1 - 0.5 * u) + 0.4, u });
    th += 0.5 * (elbow * Math.exp(-(((u - 0.52) / 0.07) ** 2)) / (0.07 * Math.sqrt(Math.PI) * A.L) + A.curve / A.L);
    x += Math.cos(th) * 0.5;
    y += Math.sin(th) * 0.5;
  }
  return pts;
}
// how closed the hand is: opens as it rises, snaps shut into a claw, splays as it's dragged down
function gripOf(A, t) {
  const shut = ease.outBack(clamp((t - A.t0 - 0.3) / 0.12), 2.2), splay = smooth(A.td, A.td + 0.12, t);
  return shut * (1 - splay) - 0.35 * splay;
}

// the arm in cross-sections, lit like the tendrils: a near-black body, a bright edge toward the light
function drawArm(p, A, pts, C) {
  const surf = A.y;
  for (const q of pts) {
    if (q.y > surf) continue;
    const nx = -Math.sin(q.th), ny = Math.cos(q.th), ks = nx * LX + ny * LY >= 0 ? 1 : -1;
    for (let v = -q.w; v <= q.w; v += 0.5) {
      const x = q.x + nx * v, y = q.y + ny * v, u = (v / q.w) * ks;
      if (y <= surf) p.px(x, y, u > 0.55 ? C[2] : u > -0.45 ? C[1] : C[0]);
    }
  }
  for (const q of pts) {
    if (q.y > surf) continue;
    const nx = -Math.sin(q.th), ny = Math.cos(q.th), f = nx * LX + ny * LY, ks = f >= 0 ? 1 : -1, l = ks * q.w;
    if (q.y - ny * l <= surf) p.px(q.x - nx * l, q.y - ny * l, C[3]);
    if (q.y + ny * l <= surf) p.px(q.x + nx * l, q.y + ny * l, Math.abs(f) > 0.8 ? C[7] : C[6]);
  }
  const base = pts.find((q) => q.y <= surf);
  if (base) p.line(base.x - base.w - 1.5, surf, base.x + base.w + 1.5, surf, C[5]);
}

// a hand on the arm's end: a palm, four fingers and a thumb, each two bones with a lit edge and a pale claw
function drawHand(p, A, pts, C, t) {
  const tip = pts[pts.length - 1];
  if (tip.y > A.y - 2) return;
  const th = tip.th, dx = Math.cos(th), dy = Math.sin(th), nx = -dy, ny = dx, g = gripOf(A, t), side = A.curl;
  const cx = tip.x + dx * 2.6, cy = tip.y + dy * 2.6;
  p.shade(cx - 5, cy - 5, cx + 5, cy + 5, (x, y) => {
    const a = (x - cx) * dx + (y - cy) * dy, b = (x - cx) * nx + (y - cy) * ny, d = (a / 3) ** 2 + (b / 2.7) ** 2;
    if (d > 1.25) return;
    if (d > 1) return b * side < 0 ? C[6] : C[3];
    return b * side < -1 ? C[2] : C[1];
  });
  const bone = (x0, y0, ang, len, last) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, ox = Math.round(-Math.sin(ang) * side * -1), oy = Math.round(Math.cos(ang) * side * -1);
    p.line(x0, y0, x1, y1, C[1]);
    p.line(x0 + ox, y0 + oy, x1 + ox, y1 + oy, C[5]);
    if (last) (p.px(x1, y1, WHITE), p.px(x1 + Math.cos(ang), y1 + Math.sin(ang), C[7]));
    return [x1, y1];
  };
  const spread = 1 - 0.65 * Math.max(0, g), curl = g * 1.2;
  [-2.2, -0.75, 0.75, 2.2].forEach((o, i) => {
    const bx = cx + dx * 2.6 + nx * o * 0.9, by = cy + dy * 2.6 + ny * o * 0.9, len = i === 0 || i === 3 ? 2.6 : 3.2;
    const a0 = th + o * 0.2 * spread, [jx, jy] = bone(bx, by, a0 + curl * side * 0.6, len, false);
    bone(jx, jy, a0 + curl * side * 1.5, len * 0.85, true);
  });
  const [jx, jy] = bone(cx - nx * side * 2.4, cy - ny * side * 2.4, th - side * (1 - 0.6 * g), 2.4, false);
  bone(jx, jy, th - side * (0.6 - 1.4 * g), 2, true);
  p.glow(cx, cy, 8, C[5], 0.18 + 0.3 * Math.max(0, g));
}

function create(o) {
  const C = fit(o.palette, 8), DIM = [C[0], C[0], C[1], C[1], C[3], C[4], C[5], C[6]], R = new Rng(o.seed), floor = () => 0;
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[4] });
  const puffs = new Puffs({ rng: R, flame: [C[7], C[6], C[5], C[4], C[3], C[2], C[1], C[1], C[0]], soot: [mix(C[3], C[2], 0.55), mix(C[2], C[1], 0.5)], cap: mix(C[4], C[2], 0.5), rim: [C[6], C[5], C[4]], floor });
  const ripples = [], splats = [], lights = [];
  let t = 0, acc = 0;
  const rx = (tt) => RX * ease.outCubic(clamp(tt / OPEN)) * (1 - ease.inCubic(clamp((tt - SHUT) / 0.45)));
  const drops = new Drops({ onLand: (x, y, v, s) => (Math.abs(x) < rx(t) * 0.95 ? ripples.push({ x, t0: t, life: 0.5, w: 0.6 }) : splats.push({ x, t0: t, s })) });
  // four arms: two at the back, taller and dimmer, two in front; elbows bending toward the middle
  const LAY = [[-20, -2.5, 1], [17, -2.5, -1], [-30, 2.5, 1], [28, 2.5, -1]];
  const arms = LAY.map(([x, y, toward], i) => ({
    x: x + R.range(-3, 3), y, back: y < 0, L: y < 0 ? R.range(44, 52) : R.range(36, 44), W: y < 0 ? R.range(3.2, 3.8) : R.range(3.6, 4.2),
    lean: -toward * R.range(0.16, 0.3), bend: toward * R.range(0.35, 0.6), curve: toward * R.range(0.05, 0.15), curl: toward,
    t0: 0.3 + [1, 3, 0, 2][i] * 0.06 + R.range(0, 0.03), td: 1.45 + [2, 0, 3, 1][i] * 0.09 + R.range(0, 0.05), ph: R.range(0, TAU), up: false, shut: false, down: false,
  }));
  function splash(x, y, n, k) {
    for (let i = 0; i < n; i++) drops.add(x + R.range(-2, 2), y - 1, R.range(-70, 70) * k, -R.range(90, 220) * k, R.chance(0.4) ? 2 : 1);
    ripples.push({ x, t0: t, life: 0.7, w: 1 });
    lights.push({ x, y: y - 7, r: 30, k: 0.55 * k, life: 0.25, max: 0.25 });
  }
  return {
    update(dt) {
      t += dt;
      for (const A of arms) {
        if (!A.up && t >= A.t0) (A.up = true), splash(A.x, A.y, 12, 1);
        if (!A.shut && t >= A.t0 + 0.36) {
          // the clench: a snap of light at the fist, a puff of dark breath, a few sparks
          A.shut = true;
          const pts = arm(A, t);
          if (pts) {
            const q = pts[pts.length - 1];
            lights.push({ x: q.x, y: q.y, r: 22, k: 0.7, life: 0.2, max: 0.2 });
            A.snap = { x: q.x + Math.cos(q.th) * 4, y: q.y + Math.sin(q.th) * 4, t0: t };
            for (let i = 0; i < 6; i++) {
              const a = R.range(0, TAU), sp = R.range(60, 130);
              ps.spawn(P.SPARK, A.snap.x, A.snap.y, Math.cos(a) * sp, Math.sin(a) * sp - 20, R.range(0.12, 0.3));
            }
            puffs.spawn(PK.SOOT, A.snap.x, A.snap.y, 0, -12, 0.6, 3.5);
          }
        }
        if (!A.down && t >= A.td + 0.28) (A.down = true), splash(A.x, A.y, 8, 0.7);
      }
      const r = rx(t);
      if (r > 8 && t < SHUT - 0.4) {
        for (acc += dt * 8; acc > 1; acc--) puffs.spawn(PK.SOOT, R.range(-0.8, 0.8) * r, -R.range(1, 4), R.range(-8, 8), -R.range(14, 28), R.range(0.6, 0.85), R.range(3, 6));
        if (R.chance(dt * 12)) ps.spawn(P.MOTE, R.range(-0.8, 0.8) * r, -2, R.range(-8, 8), -R.range(30, 70), R.range(0.5, 0.9), R.pick([C[7], C[6], C[5]]), R.range(0.6, 1));
        if (R.chance(dt * 6)) ps.spawn(P.VAPOUR, R.range(-0.7, 0.7) * r, -R.range(2, 8), R.range(-6, 6), -R.range(10, 22), R.range(0.6, 0.9), R.chance(0.5) ? C[3] : C[4], R.range(3, 6));
        if (R.chance(dt * 3)) ripples.push({ x: R.range(-0.7, 0.7) * r, t0: t, life: 0.6, w: 0.5 });
      }
      for (const a of [ripples, splats]) for (let i = a.length - 1; i >= 0; i--) if (t - a[i].t0 > (a[i].life ?? 0.6)) a.splice(i, 1);
      for (let i = lights.length - 1; i >= 0; i--) if ((lights[i].life -= dt) <= 0) lights.splice(i, 1);
      drops.update(dt);
      puffs.update(dt);
      ps.update(dt);
    },
    drawBack(p) {
      const r = rx(t), k = r / RX;
      floorPool(p, C, r, t, ripples);
      if (k > 0) {
        p.glow(0, -16, 80, C[4], 0.2 * k);
        p.glow(0, -8, r * 1.7 + 12, C[4], 0.3 * k);
        p.glow(0, 0, r * 1.15, C[5], 0.16 * k);
      }
      puffs.draw(p, PK.SOOT, { x: 0, y: 6, k, reach: 70 });
      ps.draw(p, "back");
      for (const A of arms) if (A.back) {
        const pts = arm(A, t);
        if (pts) drawArm(p, A, pts, DIM), drawHand(p, A, pts, DIM, t);
      }
    },
    draw(p) {
      for (const A of arms) if (!A.back) {
        const pts = arm(A, t);
        if (pts) drawArm(p, A, pts, C), drawHand(p, A, pts, C, t);
      }
      for (const A of arms) if (A.snap && t - A.snap.t0 < 0.22) {
        const u = (t - A.snap.t0) / 0.22;
        ringFast(p, A.snap.x, A.snap.y, 2 + 5 * ease.outCubic(u), 1, u < 0.4 ? C[6] : u < 0.7 ? C[5] : C[3]);
      }
      drops.draw(p, C[1], C[5]);
      for (const s of splats) {
        const a = 1 - (t - s.t0) / 0.6;
        p.dot(s.x, -0.5, C[1], a * 1.5);
        p.dot(s.x + 1, -0.5, C[2], a);
        p.dot(s.x, -1.5, C[5], a);
      }
      ps.draw(p, "front");
      for (const l of lights) {
        const q = l.life / l.max;
        p.glow(l.x, l.y, l.r * (0.6 + 0.4 * q), C[5], l.k * q * q);
      }
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/shadow/shadow-tendrils.js"] = function (__e) {
const {Particles, P, Rng, fit, clamp, smooth, ease, noise, TAU, WHITE, mix} = __req("core/index.js");
const {VOID, Puffs, PK, Drops, floorPool} = __req("fx/shadow/_lib.js");

const meta = {
  name: "Shadow tendrils",
  desc: "A dark pool opens on the floor; tentacles with lit rims and hooked tips lash up out of it with a splash, writhe, and sink back as it closes.",
  tags: ["shadow", "tentacle", "tendril", "ground", "dark", "magic", "one-shot"],
  size: [208, 130],
  origin: [104, 106],
  duration: 3.2,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: VOID, seed: 3 },
};

const RX = 40, OPEN = 0.34, SHUT = 2.5, SINK = 0.5, LX = -0.6, LY = -0.8;

// a tentacle's spine at t: it rises out of the pool along its own curve, a wave writhes up it, its lean sways
// and sometimes whips, and its tip curls into a hook; points every 0.5 px with angle and half-width
function spine(T, t) {
  const e = clamp((t - T.t0) / 0.2), s1 = clamp((t - T.t1) / SINK);
  if (e <= 0 || s1 >= 1) return null;
  // it lashes up past its length and settles; going, it lifts a little, then slides back under
  const lift = 0.07 * Math.sin(Math.PI * clamp(s1 / 0.3)), down = ease.inOutCubic(clamp((s1 - 0.12) / 0.88));
  const rise = ease.outBack(e, 1.8) * (1 + lift) * (1 - down), hidden = (1 - rise) * T.L;
  const writhe = T.A * (0.25 + 0.75 * smooth(T.t0 + 0.08, T.t0 + 0.5, t));
  const hook = (0.04 + T.H * ease.outBack(clamp((t - T.t0 - 0.1) / 0.32), 2.5)) * (1 + 0.5 * s1) * (1 + 0.18 * Math.sin(t * 2.3 + T.ph));
  let lean = T.lean + 0.12 * Math.sin(t * 1.6 + T.ph);
  if (T.whip) lean += T.whip.a * Math.exp(-(((t - T.whip.t) / 0.14) ** 2));
  let th = -Math.PI / 2 + lean, x = T.x - Math.cos(th) * hidden, y = T.y - Math.sin(th) * hidden;
  const pts = [], n = Math.ceil(T.L / 0.5);
  for (let i = 0; i <= n; i++) {
    const s = i * 0.5, u = s / T.L;
    pts.push({ x, y, th, w: T.W * Math.pow(1 - u, 0.75) + 0.45, u, s });
    th += 0.5 * (writhe * Math.sin((s / T.lam) * TAU - T.om * t + T.ph) + T.curl * hook * smooth(0.58, 1, u));
    x += Math.cos(th) * 0.5;
    y += Math.sin(th) * 0.5;
  }
  return pts;
}

// a tentacle in cross-sections: a dark body with a lighter half toward the light, then the rims: bright where it
// faces the light (white where it faces it squarely), violet on the side the pool lights, suckers inside the hook
function tentacle(p, T, pts, C, t) {
  const surf = T.y;
  for (const q of pts) {
    if (q.y > surf) continue;
    const nx = -Math.sin(q.th), ny = Math.cos(q.th), ks = nx * LX + ny * LY >= 0 ? 1 : -1;
    for (let v = -q.w; v <= q.w; v += 0.5) {
      const x = q.x + nx * v, y = q.y + ny * v;
      const u = (v / q.w) * ks;
      if (y <= surf) p.px(x, y, u > 0.55 ? C[2] : u > -0.45 ? C[1] : C[0]);
    }
  }
  // a pulse of light runs up it as it lashes, then slower ones while it writhes
  const pulse = (t - T.t0) * 150, slow = (((t - T.t0) * 55) % (T.L * 1.8)) - 4;
  for (const q of pts) {
    if (q.y > surf) continue;
    const nx = -Math.sin(q.th), ny = Math.cos(q.th), f = nx * LX + ny * LY, ks = f >= 0 ? 1 : -1;
    const lit = ks * q.w, x0 = q.x + nx * lit, y0 = q.y + ny * lit, x1 = q.x - nx * lit, y1 = q.y - ny * lit;
    if (y1 <= surf) p.px(x1, y1, C[3]);
    if (y0 <= surf) p.px(x0, y0, Math.abs(f) > 0.8 && q.u > 0.15 ? C[7] : q.u > 0.85 ? C[6] : Math.abs(f) > 0.3 ? C[6] : C[5]);
    if (q.u > 0.62 && q.u < 0.93 && q.s % 3 < 0.5) p.px(q.x + nx * T.curl * q.w * 0.45, q.y + ny * T.curl * q.w * 0.45, C[4]);
    const dp = Math.min(Math.abs(q.s - pulse), Math.abs(q.s - slow) * 1.6);
    if (dp < 2.5) p.px(q.x, q.y, dp < 1 ? C[7] : C[5]);
  }
  // the tip catches the light, and light runs along it
  const tip = pts[pts.length - 1];
  if (tip.y <= surf) {
    p.px(tip.x, tip.y, WHITE);
    p.glow(tip.x, tip.y, 6, C[6], 0.25);
  }
  for (let i = 0; i < pts.length; i += 8) if (pts[i].y < surf) p.glow(pts[i].x, pts[i].y, 9, C[4], 0.1);
  const pq = pts[Math.min(pts.length - 1, Math.max(0, Math.round(pulse * 2)))];
  if (pulse < T.L && pq.y < surf) p.glow(pq.x, pq.y, 10, C[6], 0.45);
  // where it breaks the surface: a lit collar of ink
  const base = pts.find((q) => q.y <= surf);
  if (base) {
    const w = base.w + 1.5;
    p.line(base.x - w, surf, base.x + w, surf, C[5]);
    p.px(base.x - w - 1, surf + 0.5, C[3]);
    p.px(base.x + w + 1, surf + 0.5, C[3]);
  }
}

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), floor = () => 0;
  const DIM = [C[0], C[0], C[1], C[1], C[3], C[4], C[5], C[6]];
  const ps = new Particles({ rng: R, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[4] });
  const puffs = new Puffs({ rng: R, flame: [C[7], C[6], C[5], C[4], C[3], C[2], C[1], C[1], C[0]], soot: [mix(C[3], C[2], 0.55), mix(C[2], C[1], 0.5)], cap: mix(C[4], C[2], 0.5), rim: [C[6], C[5], C[4]], floor });
  const ripples = [], splats = [], lights = [];
  let t = 0, acc = 0;
  const rx = (tt) => RX * ease.outCubic(clamp(tt / OPEN)) * (1 - ease.inCubic(clamp((tt - SHUT) / 0.45)));
  const inPool = (x, tt) => Math.abs(x) < rx(tt) * 0.95;
  const drops = new Drops({
    onLand: (x, y, v, s) => {
      if (inPool(x, t)) ripples.push({ x, t0: t, life: 0.5, w: 0.6 });
      else splats.push({ x, t0: t, s });
    },
  });
  // seven tentacles in two rows: the back row taller and dimmer, hooks mostly curling inward
  const rows = [[-22, -2.5], [-8, -3], [7, -3], [21, -2.5], [-28, 2.5], [-1, 3], [27, 2.5]];
  const order = [3, 0, 5, 2, 4, 1, 6], last = [1, 5, 0, 6, 3, 2, 4];
  const tents = rows.map(([x, y], i) => {
    const back = y < 0, sx = Math.sign(x) || 1;
    return {
      x: x + R.range(-3, 3), y, back,
      L: back ? R.range(46, 62) : R.range(32, 46), W: back ? R.range(3.2, 4) : R.range(3.8, 4.6),
      lean: sx * (0.06 + Math.abs(x) / 120) + R.range(-0.06, 0.06), curl: R.chance(0.75) ? -sx : sx,
      lam: R.range(36, 50), om: R.range(4.5, 7) * R.sign(), ph: R.range(0, TAU), A: R.range(0.06, 0.085), H: R.range(0.15, 0.32),
      t0: 0.3 + order[i] * 0.045 + R.range(0, 0.03), t1: 1.5 + last[i] * 0.1 + R.range(0, 0.05),
      whip: R.chance(0.45) ? { t: R.range(0.9, 1.5), a: R.range(0.28, 0.45) * R.sign() } : null,
      up: false, down: false,
    };
  });

  function splash(x, y, n, power) {
    for (let i = 0; i < n; i++) drops.add(x + R.range(-2, 2), y - 1, R.range(-70, 70) * power, -R.range(90, 230) * power, R.chance(0.4) ? 2 : 1);
    ripples.push({ x, t0: t, life: 0.7, w: 1 });
    lights.push({ x, y: y - 7, r: 30, k: 0.6 * power, life: 0.25, max: 0.25 });
  }

  return {
    update(dt) {
      t += dt;
      for (const T of tents) {
        if (!T.up && t >= T.t0) {
          T.up = true;
          splash(T.x, T.y, 12, 1);
          for (let i = 0; i < 4; i++) ps.spawn(P.SPARK, T.x, T.y - 2, R.range(-80, 80), -R.range(120, 260), R.range(0.2, 0.45));
        }
        if (!T.down && t >= T.t1 + SINK * 0.8) {
          T.down = true;
          splash(T.x, T.y, 6, 0.6);
        }
        // glints run over the rims while they stand
        if (t > T.t0 + 0.2 && t < T.t1 && R.chance(dt * 1.6)) {
          const pts = spine(T, t), q = pts && pts[Math.floor(R.range(0.3, 0.95) * pts.length)];
          if (q && q.y < T.y) ps.spawn(P.STAR, q.x - Math.sin(q.th) * q.w, q.y + Math.cos(q.th) * q.w, 0, -4, R.range(0.25, 0.5), C[6], R.range(1, 2.2));
        }
      }
      // the pool breathes out wisps and motes while it's open
      const r = rx(t);
      if (r > 8 && t < SHUT - 0.4) {
        for (acc += dt * 9; acc > 1; acc--) puffs.spawn(PK.SOOT, R.range(-0.8, 0.8) * r, -R.range(1, 4), R.range(-8, 8), -R.range(14, 30), R.range(0.6, 0.85), R.range(3, 6));
        if (R.chance(dt * 16)) ps.spawn(P.MOTE, R.range(-0.8, 0.8) * r, -2, R.range(-8, 8), -R.range(30, 80), R.range(0.5, 1), R.pick([C[7], C[6], C[6], C[5]]), R.range(0.6, 1.1));
        if (R.chance(dt * 5)) ps.spawn(P.EMBER, R.range(-0.8, 0.8) * r, -3, R.range(-10, 10), -R.range(20, 45), R.range(0.6, 1), C[6]);
        if (R.chance(dt * 3)) ripples.push({ x: R.range(-0.7, 0.7) * r, t0: t, life: 0.6, w: 0.5 });
        // a violet haze hangs over the pool, lit from inside
        if (R.chance(dt * 7)) ps.spawn(P.VAPOUR, R.range(-0.7, 0.7) * r, -R.range(2, 8), R.range(-6, 6), -R.range(10, 22), R.range(0.6, 0.9), R.chance(0.5) ? C[3] : C[4], R.range(3, 6));
      }
      for (const a of [ripples, splats]) for (let i = a.length - 1; i >= 0; i--) if (t - a[i].t0 > (a[i].life ?? 0.6)) a.splice(i, 1);
      for (let i = lights.length - 1; i >= 0; i--) if ((lights[i].life -= dt) <= 0) lights.splice(i, 1);
      drops.update(dt);
      puffs.update(dt);
      ps.update(dt);
    },
    drawBack(p) {
      const r = rx(t), k = r / RX;
      floorPool(p, C, r, t, ripples);
      if (k > 0) {
        p.glow(0, -16, 86, C[4], 0.22 * k);
        p.glow(0, -8, r * 1.7 + 12, C[4], 0.32 * k * (0.9 + 0.1 * Math.sin(t * 5)));
        p.glow(0, 0, r * 1.15, C[5], 0.18 * k);
      }
      puffs.draw(p, PK.SOOT, { x: 0, y: 6, k: k, reach: 70 });
      ps.draw(p, "back");
      for (const T of tents) if (T.back) {
        const pts = spine(T, t);
        if (pts) tentacle(p, T, pts, DIM, t);
      }
    },
    draw(p) {
      for (const T of tents) if (!T.back) {
        const pts = spine(T, t);
        if (pts) tentacle(p, T, pts, C, t);
      }
      drops.draw(p, C[1], C[5]);
      for (const s of splats) {
        const a = 1 - (t - s.t0) / 0.6;
        p.dot(s.x, -0.5, C[1], a * 1.5);
        p.dot(s.x + 1, -0.5, C[2], a);
        if (s.s > 1) p.dot(s.x - 1, -0.5, C[2], a);
        p.dot(s.x, -1.5, C[5], a);
      }
      ps.draw(p, "front");
      for (const l of lights) {
        const q = l.life / l.max;
        p.glow(l.x, l.y, l.r * (0.6 + 0.4 * q), C[5], l.k * q * q);
      }
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/water/geyser.js"] = function (__e) {
// The column (a banded white core, strands running through it, light down its length) and the slam with its
// floor ring follow Sprite Fusion's open-source holy-light (https://www.spritefusion.com/pixel-art-vfx/holy-light),
// MIT License, Copyright (c) 2026 Hugo Duprez.
const {Particles, Lights, P, Rng, fit, clamp, smooth, ease, noise, noise2, rand, TAU, WHITE} = __req("core/index.js");
const {WATER, Drops, Ripples, Mist, ring, lace, billow} = __req("fx/water/_lib.js");

const meta = {
  name: "Geyser",
  desc: "A pool heaves and burbles faster and faster, then blasts a white column of water skyward with a churning foam head; it rains back down in drops and steam, slumps and sputters out.",
  tags: ["water", "geyser", "eruption", "steam", "column", "nature", "one-shot"],
  size: [184, 168],
  origin: [92, 146],
  duration: 5,
  loop: false,
  fps: 30,
  bg: "ground",
  options: { palette: WATER, height: 100, seed: 4 },
};

const SY = 0.22, G = 820, ERUPT = 1.15, FALL = 2.6, GONE = 3.3;
// small spurts while it builds, and the sputters after: [time, height]
const SPURTS = [[0.46, 7], [0.72, 12], [0.92, 9], [1.04, 15], [GONE + 0.15, 15], [GONE + 0.55, 8]];

function create(o) {
  const C = fit(o.palette, 8), R = new Rng(o.seed), HMAX = o.height, S = o.seed;
  const ps = new Particles({ rng: R }), mist = new Mist(), lights = new Lights(), rings = new Ripples({ sy: SY });
  const plinks = [], pops = [];
  const V0 = Math.sqrt(2 * G * HMAX);
  let t = 0;
  const poolR = (tt) => (12 + 7 * smooth(0, 1, tt) + 15 * ease.outCubic(clamp((tt - ERUPT) / 1.2))) * (1 - 0.25 * smooth(GONE, 4.6, tt));
  const poolK = (tt) => smooth(0, 0.2, tt) * (1 - smooth(4.0, 4.85, tt));
  const drops = new Drops({
    sy: SY,
    g: G,
    onLand: (d) => {
      const inPool = Math.hypot(d.x, d.z) < poolR(t);
      rings.add(d.x, d.z, 0.6, (inPool ? 2.5 : 1.5) + d.s * 1.6, 0.32 + d.s * 0.1, { n: 1, k: inPool ? 0.95 : 0.7, hot: 0.05 });
      plinks.push({ x: d.x, y: d.z * SY, s: d.s, age: 0 });
      if (d.s > 1 && !d.small)
        for (let i = 0; i < 2; i++) {
          const a = R.range(0, TAU), v = R.range(8, 28);
          drops.add({ x: d.x, z: d.z, h: 0.5, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(45, 95), s: 1, small: true, life: 1 });
        }
    },
  });
  // how tall the column stands: a fast blast, surging while it holds, slumping when the pressure goes
  const top = (tt) => {
    if (tt < ERUPT || tt > GONE) return 0;
    return HMAX * ease.outCubic(clamp((tt - ERUPT) / 0.3)) * (0.93 + 0.07 * noise(tt * 2.2, S)) * (1 - ease.inQuad(clamp((tt - FALL) / (GONE - FALL))));
  };
  const head = (tt) => smooth(ERUPT + 0.08, ERUPT + 0.3, tt) * (1 - smooth(FALL + 0.1, FALL + 0.45, tt));
  const spurt = (tt) => {
    let h = 0;
    for (const [s0, hs] of SPURTS) h = Math.max(h, hs * Math.sin(Math.PI * clamp((tt - s0) / 0.2)));
    return h;
  };
  const done = new Set(), once = (key, at) => !done.has(key) && t >= at && done.add(key);
  const emit = (rate, dt) => R.chance(Math.min(1, rate * dt));

  // the column: a white core banded out to blue edges, shadowed on the right; 1 px strands whose streaks run up
  // in jet time (fast and long low down, bunching where the water slows near the top); it spreads as it rises,
  // its sides ragged and running, a sway through it, light all the way up
  function column(p, H, thin) {
    if (H < 1) return;
    const tau = (h) => (V0 - Math.sqrt(Math.max(0, V0 * V0 - 2 * G * Math.min(h, HMAX * 0.96)))) / G;
    p.shade(-22, -H - 2, 22, 0, (x, y, out) => {
      const h = -y, v = h / H, sway = noise(t * 1.6 + h * 0.025, S + 5) * 2.5 * v;
      const rag = noise2(h * 0.2 - t * 11, x < sway ? 3 : 7, S + 6) * (0.5 + 1.8 * v);
      const w = (3.6 + 7.5 * Math.pow(v, 1.8)) * thin + rag, q = (x - sway) / Math.max(1, w), aq = Math.abs(q);
      if (aq > 1) return;
      const X = Math.floor(x), streak = noise2(X * 1.618 + 0.3, (tau(h) - t) * 14, S), body = noise2(Math.floor((x + 40) / 2) * 2.3, (tau(h) - t) * 5, S + 1);
      let lvl = aq < 0.42 ? 0 : aq < 0.7 ? 1 : aq < 0.9 ? 2 : 3;
      if (q > 0.38) lvl++;
      if (streak > 0.28) lvl--;
      if (body < -0.4) lvl++;
      out.c = [WHITE, C[6], C[5], C[4], C[3]][clamp(lvl, 0, 4)];
    });
    p.glowLine(0, 0, 0, -H, 16 + 8 * thin, C[5], 0.12 * thin);
  }

  // the head: water boiling over at the top and falling back round the column in an umbrella of streaks, foam
  // billows churning in it, shadowed underneath, lit on top
  function foamHead(p, H, k, back) {
    if (k <= 0.01 || H < 4) return;
    if (back) {
      // the umbrella: streaks pouring off the rim of the head, running down and thinning out
      for (let i = 0; i < 16; i++) {
        const side = i % 2 ? 1 : -1, x0 = side * (5 + 9 * rand(i, S + 20)) * k, len = (14 + 26 * rand(i, S + 21)) * k, speed = 70 + 50 * rand(i, S + 22);
        for (let j = 0; j < 3; j++) {
          const f = (t * speed / len + j / 3 + rand(i, S + 23)) % 1, y0 = -H + 2 + f * len, x = x0 + side * f * f * 6, L = 1 + 4 * f * (1 - f) * 2;
          if (f < 0.85) p.line(x, y0, x + side * 0.6, y0 + L, f < 0.4 ? C[6] : f < 0.7 ? C[5] : C[4]);
        }
      }
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + t * (i % 2 ? 1.3 : -1.1), z = Math.sin(a);
      if (z < 0 !== back) continue;
      const rho = (3 + 7 * rand(i, S)) * k, x = Math.cos(a) * rho * 1.25 + noise(t * 3 + i, S + 8) * 2.5;
      const y = -H + z * rho * 0.45 + (rho / 10) * 4 - 4 * (1 - rho / (10 * k)) + noise(t * 3 + i + 50, S + 9) * 2.5, r = (2 + 2.6 * rand(i, S + 2) + 0.7 * Math.sin(t * 7 + i)) * k;
      if (back) billow(p, x, y, r, [C[0], C[1], C[2], C[3], C[3], C[4], C[5], C[5]]);
      else {
        p.circle(x + r * 0.15, y + r * 0.25, r, C[4]);
        p.circle(x, y, r * 0.82, rho > 6 * k ? C[5] : C[6]);
        p.circle(x - r * 0.25, y - r * 0.3, r * 0.5, WHITE);
      }
    }
    if (!back) p.glow(0, -H - 2, 38, C[5], 0.34 * k);
  }

  return {
    update(dt) {
      t += dt;
      const H = top(t), hk = head(t), k = t / ERUPT;
      // building: bubbles burst on the heaving mound, faster and faster, steam starts to lift
      if (t < ERUPT && emit(1.5 + 9 * k * k, dt)) {
        const a = R.range(0, TAU), r = R.range(0, 7), x = Math.cos(a) * r, z = Math.sin(a) * r;
        pops.push({ x, y: z * SY - R.range(1, 3), age: 0, r: R.range(1, 2) });
        rings.add(x, z, 1, R.range(5, 9), 0.55, { n: 1, k: 0.85 });
        for (let i = 0; i < R.int(1, 3); i++) drops.add({ x, z, h: 2, vx: R.range(-25, 25), vz: R.range(-15, 15), vh: R.range(50, 120), s: 1, small: true, life: 1 });
      }
      if (t < ERUPT && emit(3 + 7 * k, dt)) mist.add(R.range(-8, 8), -R.range(1, 5), R.range(-10, 10), -R.range(6, 18), 2, R.range(5, 9), R.range(0.9, 1.5), C[6], 0.22);
      for (const [s0, hs] of SPURTS)
        if (once("spurt" + s0, s0 + 0.08))
          for (let i = 0; i < 3 + Math.round(hs / 4); i++) {
            const a = R.range(0, TAU), v = R.range(10, 40);
            drops.add({ x: 0, z: 0, h: hs * 0.8, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(20, 90), s: R.chance(0.3) ? 2 : 1 });
          }
      if (once("erupt", ERUPT)) {
        // the blast: light, a ring thrown across the ground, water flung high, steam rolling out
        lights.add(0, -26, 64, C[5], 0.85, 0.6);
        lights.add(0, -4, 28, WHITE, 0.75, 0.1);
        rings.add(0, 0, 6, 40, 1.2, { n: 2, gap: 3, k: 1.2, hot: 0.12, glint: 1 });
        for (let i = 0; i < 44; i++) {
          const a = R.range(0, TAU), v = R.range(30, 120);
          drops.add({ x: Math.cos(a) * 3, z: Math.sin(a) * 3, h: R.range(2, 10), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(180, 400), s: R.chance(0.15) ? 3 : R.chance(0.35) ? 2 : 1, delay: R.range(0, 0.12) });
        }
        for (let i = 0; i < 12; i++) {
          const s = i % 2 ? 1 : -1;
          mist.add(s * R.range(3, 9), -R.range(1, 6), s * R.range(30, 80), -R.range(4, 18), 3, R.range(9, 14), R.range(1.2, 1.9), R.chance(0.5) ? C[6] : WHITE, 0.3, R.range(0, 0.15));
        }
        for (let i = 0; i < 14; i++) ps.spawn(P.STAR, R.range(-16, 16), -R.range(8, 80), R.range(-10, 10), -6, R.range(0.3, 0.7), R.chance(0.5) ? WHITE : C[6], R.range(1, 2.6), R.range(0.05, 0.5));
      }
      // holding: the head sheds drops that rain back down, spray hangs off the column, steam pours off the top
      if (hk > 0) {
        if (emit(60 * hk, dt)) {
          const a = R.range(0, TAU), v = R.range(10, 60);
          drops.add({ x: R.range(-9, 9), z: R.range(-4, 4), h: H + R.range(-8, 3), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(-40, 60), s: R.chance(0.08) ? 3 : R.chance(0.3) ? 2 : 1 });
        }
        if (emit(9 * hk, dt)) mist.add(R.range(-8, 8), -H + R.range(-6, 2), R.range(-34, 34), -R.range(14, 34), 3, R.range(8, 13), R.range(0.9, 1.4), R.chance(0.6) ? C[6] : WHITE, 0.2);
        if (emit(5 * hk, dt)) mist.add(R.sign() * R.range(3, 9), -R.range(1, 6), R.sign() * R.range(20, 50), -R.range(2, 10), 3, R.range(8, 12), R.range(1, 1.6), C[6], 0.22);
        if (emit(40 * hk, dt)) {
          const s = R.sign(), hh = R.range(8, H * 0.95);
          ps.spawn(P.FLAKE, s * (3 + 6 * Math.pow(hh / H, 1.8)), -hh, s * R.range(10, 45), R.range(-20, 10), R.range(0.6, 1.2), R.chance(0.5) ? WHITE : C[6], R.range(0.6, 1.3));
        }
        if (emit(4 * hk, dt)) rings.add(R.range(-2, 2), R.range(-2, 2), 4, poolR(t) * R.range(0.7, 1), 0.9, { n: 1, k: 0.8 });
        if (emit(7 * hk, dt)) ps.spawn(P.STAR, R.range(-14, 14), -R.range(10, H + 8), R.range(-6, 6), -4, R.range(0.25, 0.55), R.chance(0.4) ? WHITE : C[6], R.range(0.8, 2.2), 0);
      }
      if (once("collapse", FALL + 0.12)) {
        // the head falls apart: a heavy rain of drops all at once
        for (let i = 0; i < 40; i++) {
          const a = R.range(0, TAU), v = R.range(15, 80);
          drops.add({ x: R.range(-6, 6), z: R.range(-3, 3), h: top(t) + R.range(-8, 4), vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: R.range(-40, 60), s: R.chance(0.12) ? 3 : R.chance(0.35) ? 2 : 1, delay: R.range(0, 0.25) });
        }
        for (let i = 0; i < 6; i++) mist.add(R.range(-8, 8), -top(t) + R.range(-6, 6), R.range(-34, 34), -R.range(10, 26), 4, R.range(9, 13), R.range(0.8, 1.2), C[6], 0.18);
      }
      for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].age += dt) > 0.12) pops.splice(i, 1);
      for (let i = plinks.length - 1; i >= 0; i--) if ((plinks[i].age += dt) > 0.14) plinks.splice(i, 1);
      drops.update(dt);
      rings.update(dt);
      mist.update(dt);
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      // the pool: dark see-through water, a lit far rim
      const pr = poolR(t), pk = poolK(t);
      if (pk > 0)
        p.each(-pr, -pr * SY, pr, pr * SY, (x, y, sx, sy) => {
          const d = (x / pr) ** 2 + (y / (pr * SY)) ** 2;
          if (d > 1) return;
          p.blendPx(sx, sy, d < 0.15 ? C[2] : C[1], 0.6 * pk * Math.min(1, (1 - d) * 4));
          if (y < 0 && d > 0.78 && d < 0.95) p.blendPx(sx, sy, C[4], 0.7 * pk);
        });
      rings.draw(p, C, -1);
      const u = (t - ERUPT) / 0.4;
      if (u > 0 && u < 1) ring(p, 0, 0.5, 6 + 42 * ease.outCubic(u), SY, 1.5 * (1 - u), C, { n: 3, gap: 1.6 + 2 * u, half: -1, hot: u < 0.3, seed: 9 });
      foamHead(p, top(t), head(t), true);
      drops.draw(p, C, "back");
    },
    draw(p) {
      const H = top(t), hk = head(t), k = clamp(t / ERUPT), thin = smooth(ERUPT, ERUPT + 0.12, t) * (1 - 0.55 * smooth(FALL, GONE, t));
      rings.draw(p, C, 1);
      const u = (t - ERUPT) / 0.4;
      if (u > 0 && u < 1) ring(p, 0, 0.5, 6 + 42 * ease.outCubic(u), SY, 1.5 * (1 - u), C, { n: 3, gap: 1.6 + 2 * u, half: 1, hot: u < 0.3, seed: 9 });
      // foam rides the pool round the foot of the column
      const fk = smooth(ERUPT, ERUPT + 0.3, t) * (1 - smooth(GONE - 0.3, 4.4, t));
      if (fk > 0) lace(p, 0, 0, 8 + 10 * fk, (8 + 10 * fk) * SY + 0.5, fk, C, t, S);
      // the heaving mound while it builds, beating faster
      if (t < ERUPT + 0.05) {
        const beat = Math.pow(Math.max(0, Math.sin(t * (8 + 18 * k * k))), 3), rd = 4 + 3.5 * k + 1.5 * beat, hd = 1.5 + 3 * k + 3 * beat;
        p.shade(-rd - 1, -hd - 1, rd + 1, 0.5, (x, y, out) => {
          const dx = x / rd, dy = y / hd, d = dx * dx + dy * dy;
          if (d > 1 || y > 0.5) return;
          // water heaving up: a white rim where it faces the light, a tinted body, shadow low on the right
          const lit = -dx * 0.7 - dy * 0.7, rim = d > 0.68;
          out.c = rim ? (lit > 0.3 ? WHITE : lit > -0.15 ? C[6] : C[4]) : lit > 0.55 ? C[6] : lit > 0.12 ? C[5] : lit > -0.3 ? C[4] : C[3];
        });
        p.px(-rd * 0.35, -hd * 0.6, WHITE);
        p.glow(0, -5, 16 + 16 * k + 8 * beat, C[5], 0.06 + 0.12 * k + 0.12 * beat);
      }
      // spurts while it builds and sputters as it dies: a short white jet with a bead on top
      const sp = spurt(t);
      if (sp > 1 && H < 1) {
        p.shade(-2, -sp - 1, 2, 0, (x, y, out) => {
          const q = x / (1 + 0.8 * (1 + y / sp));
          if (Math.abs(q) > 1) return;
          out.c = q < -0.3 ? C[6] : q < 0.35 ? WHITE : C[5];
        });
        p.circle(0, -sp, 1.3, C[6]);
        p.px(0, -sp - 1, WHITE);
        p.glowLine(0, 0, 0, -sp, 8, C[5], 0.3);
      }
      column(p, H, thin);
      // the foot: billows boil out round it
      if (hk > 0 || (H > 1 && t < GONE))
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU + t * 2.1, r = 4 + 2 * Math.sin(t * 5 + i * 1.7), x = Math.cos(a) * r * 1.3, y = Math.sin(a) * r * SY - 2;
          billow(p, x, y, (1.6 + 1.2 * rand(i, S + 4)) * Math.max(hk, thin * 0.6), C);
        }
      foamHead(p, H, hk, false);
      for (const q of pops) {
        const g = q.age / 0.12;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0.7, -0.7], [-0.7, -0.7], [0, -1]]) p.dot(q.x + dx * (q.r + 3 * g), q.y + dy * (q.r + 3 * g), C[6], 1 - g);
      }
      for (const q of plinks) {
        const g = q.age / 0.14;
        if (g < 0.5) p.px(q.x, q.y, WHITE);
        if (q.s > 1) p.line(q.x, q.y - 1, q.x, q.y - 1 - 3 * (1 - g), g < 0.4 ? WHITE : C[6]);
        p.glow(q.x, q.y, 4, C[5], 0.25 * (1 - g));
      }
      drops.draw(p, C, "front");
      // the blast's first two frames: a white burst at the vent
      const f = (t - ERUPT) / 0.07;
      if (f >= 0 && f < 1) {
        p.circle(0, -4, 7 * (1 - f * 0.4), WHITE);
        p.ellipse(0, 0, 12, 2.6, (d) => (d < 0.6 ? WHITE : C[6]));
      }
      ps.draw(p);
      mist.draw(p, C[5]);
      lights.draw(p);
      // light: the column and its head, the pool round its foot
      if (H > 1) p.glowLine(0, 0, 0, -H, 26, C[4], 0.2 * thin);
      p.glow(0, -2, 46, C[4], 0.24 * Math.max(hk, 0.3 * k * (t < ERUPT ? 1 : 0)));
      p.glow(0, 2, 60, C[3], 0.12 * poolK(t));
    },
  };
}

__e.meta = meta; __e.create = create;
};

__M["fx/nature/tornado.js"] = function (__e) {
const {cycle, fit, rand, rng, smooth, clamp, lerp, TAU, WHITE, mix, tileNoise, bolt} = __req("core/index.js");
const {drawRock, stoneShape, drawLeaf} = __req("fx/nature/_lib.js");

const meta = {
  name: "Tornado",
  desc: "A snaking funnel of spinning wind bands under a flared, churning top that flickers with lightning; leaves and debris whirl round it front and back, dust boils at its foot.",
  tags: ["nature", "wind", "tornado", "storm", "hazard", "ground", "loop"],
  size: [196, 168],
  origin: [98, 152],
  duration: 2,
  loop: true,
  fps: 30,
  bg: "ground",
  options: {
    palette: ["#141221", "#231f33", "#36314a", "#4d4762", "#68617d", "#8a839e", "#b3adc4", "#e2def0"],
    dust: ["#2a2018", "#4e3e2e", "#76624a", "#a08a6a", "#cbb894"],
    leaves: ["#4a200c", "#a8541c", "#e8962e", "#ffd27a", "#123818", "#2f7a2a", "#6cb83a", "#c8f070"],
    height: 112,
    seed: 4,
  },
};

const SY = 0.28;

// the funnel at time t: its axis snakes (a wave running up it), its radius flares at the top
function geo(o, t) {
  const ph = (TAU * t) / meta.duration, FH = o.height;
  return {
    FH,
    ph,
    ax: (u) => 8.5 * Math.sin(ph - 2.6 * u) * (0.2 + 0.8 * u) + 3 * Math.sin(2 * ph + 1.3 - 4.5 * u) * u,
    rad: (u) => 3 + 20 * Math.pow(u, 1.5) + 17 * Math.pow(smooth(0.78, 1, u), 2),
  };
}

// the body: a translucent column, thicker through its middle, lit from the left, with streaks of dust that
// shear past each other as rows spin at different speeds
function body(p, C, Dst, g, t, seed) {
  const { FH, ax, rad } = g;
  for (let y = -Math.ceil(FH) + 2; y <= 0; y++) {
    const u = -y / FH, cx = ax(u), r = rad(u), K = 2 + (rand(y, seed) < 0.35 ? 1 : 0), rot = (TAU * K * t) / meta.duration;
    const fade = Math.min(1, u * 8 + 0.25) * (1 - smooth(0.9, 1.02, u));
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const c = (x + 0.5 - cx) / r;
      if (Math.abs(c) > 1) continue;
      const n = tileNoise(((Math.acos(c) + rot) * 6) / TAU, y * 0.34, 6, 0, seed), v = -c * 0.55 + 0.15 + n * 0.55;
      let col = v > 0.6 ? C[6] : v > 0.28 ? C[5] : v > -0.05 ? C[4] : v > -0.4 ? C[3] : C[2];
      if (u < 0.3) col = mix(col, Dst[v > 0.3 ? 3 : v > -0.2 ? 2 : 1], 0.7 * (1 - u / 0.3));
      p.blend(x, y, col, (0.14 + 0.36 * Math.sqrt(1 - c * c)) * fade);
    }
  }
}

// wind bands: 1 px streaks wrapped round the funnel, bright at the head, fading along the tail; the far half
// goes behind, dimmer
function bands(p, C, g, t, seed, back) {
  const { FH, ax, rad } = g;
  for (let j = 0; j < 58; j++) {
    const R = rng(seed, j), u = (j + R.range(0.1, 0.9)) / 58, K = R.int(2, 4), span = R.range(0.7, 2.1), lvl = R.next();
    const cx = ax(u), r = rad(u) * R.range(1.0, 1.1), y0 = -u * FH, head = R.range(0, TAU) + (TAU * K * t) / meta.duration;
    if (u > 0.97) continue;
    for (let s = 0; s <= span; s += 0.5 / Math.max(2, r)) {
      const th = head - s, sn = Math.sin(th);
      if (sn > 0 === back) continue;
      const k = s / span, x = cx + r * Math.cos(th), y = y0 + r * SY * sn, lit = Math.cos(th) < 0.2;
      let i = lvl < 0.18 ? 2 : k < 0.15 && lvl > 0.55 ? 7 : k < 0.45 ? (lit ? 6 : 5) : lit ? 5 : 4;
      if (back) i = Math.max(1, i - 2);
      if (k < 0.5) p.dot(x, y, C[i]);
      else p.blend(x, y, C[i], 2 * (1 - k));
    }
    if (!back && lvl > 0.6 && Math.sin(head) > 0) {
      const hx = cx + r * Math.cos(head), hy = y0 + r * SY * Math.sin(head);
      p.dot(hx, hy, WHITE);
      p.glow(hx, hy, 5, C[6], 0.3);
    }
  }
}

// a soft flattened puff: rx wide, ry tall, blended
function blob(p, cx, cy, rx, ry, c, a) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.blend(x, y, c, a);
    }
}

// the flared top: a lid of cloud sheared into flat bands that ride round with the funnel, each thick in the
// middle and drawn out to a thin tail behind, lit along its upper rim, dark beneath; a dark mass at its core
function crown(p, C, g, t, seed, back, flash) {
  const { FH, ax, rad } = g, cx = ax(1), r = rad(1), L = (c) => mix(c, C[7], flash * 0.6), y0 = -FH - 3;
  if (back) {
    blob(p, cx, y0 + 1, r * 0.85, 6, C[1], 0.6);
    blob(p, cx - 4, y0 - 3, r * 0.6, 3.5, L(C[3]), 0.45);
  }
  for (let j = 0; j < 16; j++) {
    const R = rng(seed, j), rr = r * R.range(0.4, 1.15), K = R.int(1, 2), span = R.range(1.4, 2.8), head = R.range(0, TAU) + (TAU * K * t) / meta.duration;
    const th0 = R.range(3.2, 6), lift = R.range(-4, 3) - (1 - rr / (r * 1.15)) * 5;
    for (let s2 = 0; s2 <= span; s2 += 0.6 / rr) {
      const th = head - s2, sn = Math.sin(th);
      if (sn > 0 === back) continue;
      const k = s2 / span, th2 = th0 * Math.sin(Math.PI * Math.pow(1 - k, 0.7)), x = cx + rr * Math.cos(th), y = y0 + lift + rr * SY * sn;
      const T = Math.max(1, Math.round(th2)), d = back ? 1 : 0, lit = Math.cos(th) < 0.3;
      for (let i = 0; i < T; i++) {
        const c = i === 0 ? L(C[(lit ? 6 : 5) - d]) : i === T - 1 && T > 2 ? C[1] : L(C[(i === 1 ? 4 : 3) - d]);
        p.blend(x, y - T / 2 + i, c, (0.55 + 0.35 * (1 - k)) * (back ? 0.75 : 1));
      }
    }
  }
}

// leaves, twigs and pebbles spiralling up round it and flung off the top
function debris(p, C, L, g, t, seed, back, S) {
  const { FH, ax, rad } = g;
  cycle(t, meta.duration, 24, seed, (q) => q.range(1.3, 1.95), (age, life, R, i) => {
    // the first stretch skids in across the floor, then it spirals up and is flung off the top
    const k = age / life, sk = R.range(0.15, 0.3), q = clamp((k - sk) / (1 - sk)), u = lerp(0.03, 0.98, Math.pow(q, 0.85));
    const th = R.range(0, TAU) + R.range(2, 3.2) * TAU * k, sn = Math.sin(th);
    if (sn > 0 === back) return;
    const fling = smooth(0.78, 1, q), inward = 1 - smooth(0, sk, k), far = R.range(26, 44);
    const rr = lerp(Math.min(68, rad(u) * (1.12 + fling * 1.1) + R.range(2, 7)), far, inward), x = ax(u) + rr * Math.cos(th), y = Math.min(-1, -u * FH + rr * SY * sn - fling * 8);
    const a = Math.min(1, k * 8) * (1 - smooth(0.85, 1, k)), kind = R.next(), spin = R.range(-14, 14) * age, dk = back ? 1 : 0;
    if (kind < 0.62) {
      const o = R.next() < 0.5 ? 0 : 4, pal = [L[o], L[o + 1], L[o + 2 - dk], L[o + 3 - dk]];
      drawLeaf(p, x, y, R.range(6, 9), R.range(1.8, 2.6), spin, age * R.range(5, 10), pal, a);
    } else if (kind < 0.8) {
      const ca = Math.cos(spin) * 2.5, sa = Math.sin(spin) * 2.5;
      p.line(x - ca, y - sa, x + ca, y + sa, back ? L[0] : L[1], a);
      p.dot(x + ca, y + sa, L[2], a);
    } else drawRock(p, x, y, R.range(1.6, 2.6), spin, stoneShape(R, 5), S, a);
  });
}

// at its foot: dust boiling round and out, grit hopping, scuffs swept round the floor
function skirt(p, D, g, t, seed, back) {
  const cx0 = g.ax(0);
  cycle(t, meta.duration, 40, seed, (q) => q.range(0.7, 1.3), (age, life, R) => {
    const k = age / life, th = R.range(0, TAU) + R.range(5, 9) * age, sn = Math.sin(th);
    if (sn > 0 === back) return;
    const rr = 4 + k * R.range(14, 28), x = cx0 + rr * Math.cos(th), y = -1.5 - k * R.range(4, 16) + rr * 0.3 * sn, s = R.range(3, 6) * (0.6 + 0.8 * k);
    const a = Math.min(1, k * 6) * (1 - k) * 0.6;
    p.disc(x, y + s * 0.2, s, D[back ? 1 : 2], a);
    p.disc(x - s * 0.2, y - s * 0.3, s * 0.55, D[back ? 2 : 3], a * 0.8);
  });
  if (back) return;
  cycle(t, meta.duration, 16, seed + 7, (q) => q.range(0.35, 0.6), (age, life, R) => {
    const th = R.range(0, TAU), v = R.range(25, 55), x = cx0 + Math.cos(th) * (4 + v * age), y = Math.sin(th) * 2 - R.range(40, 80) * age + 260 * age * age;
    if (y < 0.5) p.dot(x, Math.min(0, y), R.next() < 0.5 ? D[3] : D[4], 1 - age / life);
  });
  for (let j = 0; j < 7; j++) {
    const R = rng(seed + 3, j), rr = R.range(12, 28), th0 = R.range(0, TAU) + (TAU * 3 * t) / meta.duration, span = R.range(0.5, 1.1);
    for (let s = 0; s < span; s += 0.6 / rr) {
      const th = th0 - s;
      p.dot(cx0 + rr * Math.cos(th), 0.5 + rr * 0.18 * Math.sin(th), D[s < span * 0.4 ? 3 : 2], 1 - s / span);
    }
  }
}

// once a loop the crown lights up from inside
function flashAt(t) {
  const q = t / meta.duration;
  return Math.max(0, 1 - Math.abs(q - 0.62) / 0.025) + 0.6 * Math.max(0, 1 - Math.abs(q - 0.69) / 0.015);
}

function drawBack(p, t, o) {
  const C = fit(o.palette, 8), D = fit(o.dust, 5), g = geo(o, t), f = flashAt(t);
  skirt(p, D, g, t, o.seed * 5 + 1, true);
  crown(p, C, g, t, o.seed * 7 + 2, true, f);
  bands(p, C, g, t, o.seed * 3 + 5, true);
  debris(p, C, fit(o.leaves, 8), g, t, o.seed * 11 + 3, true, C);
  body(p, C, D, g, t, o.seed);
}

function draw(p, t, o) {
  const C = fit(o.palette, 8), D = fit(o.dust, 5), g = geo(o, t), f = flashAt(t), cx = g.ax(1);
  bands(p, C, g, t, o.seed * 3 + 5, false);
  crown(p, C, g, t, o.seed * 7 + 2, false, f);
  skirt(p, D, g, t, o.seed * 5 + 1, false);
  debris(p, C, fit(o.leaves, 8), g, t, o.seed * 11 + 3, false, C);
  // light: a soft pale column, a cold pool at its foot, the crown's lightning
  p.glowLine(g.ax(0.1), -g.FH * 0.1, cx, -g.FH * 0.9, 26, C[5], 0.08);
  p.glow(g.ax(0), -2, 30, D[3], 0.12);
  if (f > 0.05) {
    const R = rng(o.seed, 99, Math.floor(t / meta.duration * 7)), path = bolt(R, cx - 18, -g.FH - 6, cx + 16, -g.FH + 2, { jag: 0.3, depth: 3 });
    p.polyline(path, f > 0.6 ? WHITE : C[7], Math.min(1, f * 1.5));
    p.glow(cx, -g.FH - 2, 70, C[7], 0.45 * f);
  }
}

__e.meta = meta; __e.drawBack = drawBack; __e.draw = draw;
};

const mods = {};
for (const id of ["nature/tornado", "water/geyser", "shadow/shadow-tendrils", "shadow/grasping-hands", "water/wave-crash", "nature/thorns", "shadow/eclipse", "arcane/portal", "arcane/time-stop", "nature/root-snare", "shadow/black-hole", "water/water-orb", "scifi/force-field", "impacts/parry", "projectiles/energy-disc", "shadow/shadow-flames", "melee/sword-slash", "melee/whip-crack", "nature/healing-bloom", "impacts/crit-hit", "water/splash", "holy/holy-pillar", "holy/smite", "holy/sunburst", "holy/feather-burst", "fire/fire-ring", "nature/earth-spike", "nature/quake", "ice/ice-shatter", "ice/ice-spikes", "explosions/implosion", "arcane/star-fall"]) { try { mods[id] = __req("fx/" + id + ".js"); } catch (err) { console.warn("pixelfx", id, err); } }
window.PIXELFX = { core: __req("core/index.js"), mods };
})();