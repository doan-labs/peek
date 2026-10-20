# Variants

How a Peek avatar is put together, and how a name picks one. The rules here
hold for every style. Each style fills in its own tables.

## Two layers

```
variant          peek · haze · bloc                picked by the caller
├─ identity      hashed from the name, any axis overridable
│  ├─ face       the body silhouette
│  ├─ color      a body ink and its deep partner
│  └─ anatomy    discrete parts + continuous proportions + accessories
└─ state         passed in by the caller or driven by the rig, never hashed
   ├─ expression one shared vocabulary, 11 states
   └─ gaze       x, y in -1..1
```

- **A variant is how a face is drawn, never who it is.** Every variant
  reads the same `peek@1` identity, so the seeds below never include the
  variant and a name keeps its face, color, parts and persona in all of
  them. `peek` is the default and its bytes never move.
- **Identity is what a face is. State is what it does.** A name decides
  identity and nothing else. The caller picks the state, and may override
  single identity axes by name (see Overrides); the rest stays hashed.
- **Every identity axis is independent.** Any face can wear any color, part
  and trait. No axis looks at another axis when it picks.
- **State is a contract across variants.** Every variant draws all 11
  expressions and any gaze. A variant may draw two states alike (Bloc reads
  11 through 3 moulds), but it never rejects one.
- **Static first.** Every variant renders a static SVG from (identity,
  state) with no runtime deps. Animation is the rig tweening state over
  time, not a separate variant.

## The hash

```
tidy(name) = NFC, trim, collapse spaces, lowercase
seed(axis) = fnv1a(`${style}@${version}:${axis}:${tidy(name)}`)

face    = FACES[seed('face') % FACES.length]
color   = COLORS[seed('color') % COLORS.length]
<part>  = PARTS[part][seed(part) % PARTS[part].length]
persona = mulberry32(seed('persona'))   // continuous proportions, fixed draw order
```

- **One seed per axis.** Changing one axis never moves another.
- **Lists are append-only and ordered.** Never reorder or remove an entry.
- **Any change that alters an existing name's result bumps the style
  version**: a list grows, a persona range or draw order changes. The old
  version keeps rendering, so a stored `peek@1` face stays put.
- The caller can pin a version. Unpinned means latest.

## The `peek` style

Shipped as `@doan-labs/peek` (`packages/peek`), style version `peek@1`.
Tables in `packages/peek/src/tables.ts`; `VERSIONS` pins how much of each
list a version picks from.

### Overrides

A name decides identity unless the caller overrides an axis. An explicit
`face`, `color`, `eyes`, `brows`, `mouth`, `cheeks`, `trait`, `eyewear`, `headwear` or `neckwear` wins over the
hash, and every other axis stays as the name made it. The persona cannot be
overridden.

### Face

`diamond · semicircle · circle · triangle`, geometry transcribed from
`SHAPES` in the v1.2 page. Each face carries the anchors every part needs:
eye centers, brow line, mouth point, cheek points, and a crown outline (a
convex polygon grown by a radius) that every trait sits on.

### Color

Seven body inks, each with a deep partner at the same hue. The body ink
fills the face and the lids. The deep ink carries the cheeks and the trait.
Eyes stay paper, and features stay ink, on every color.

| # | Ink | Body | Deep |
| --- | --- | --- | --- |
| 0 | lavender | `#D8CDF0` | `#BDAEE6` |
| 1 | fog | `#C8D6E8` | `#A8BCDC` |
| 2 | clay | `#F1CDBF` | `#E2A893` |
| 3 | mint | `#CFE7D6` | `#A5CDB1` |
| 4 | butter (provisional) | `#ECE2B9` | `#D9C284` |
| 5 | rose (provisional) | `#EFCAD7` | `#DFA4BA` |
| 6 | aqua (provisional) | `#BDE1E5` | `#8FC7D1` |

The provisional inks match the first four in OKLCH lightness and chroma.
Tuning one of them before release is free; after release it bumps the
version.

Bone, paper and ink are structure, and signal is interface only. None of
them is a body color.

### Anatomy: parts

Each part is drawn once and positioned by the face's own anchors. Every
part reads the channels of its feature, so all 11 expressions read on every
part.

| Part | Types, in list order |
| --- | --- |
| eyes | `oval` (pupil, shine, lids), `bead` (bare ink bead), `ring` (rimmed, the lid edges inked) |
| brows | `arch`, `bar` (heavy, flat), `wedge` (tapered to the inner end), `dash` (short) |
| mouth | `poly`, `round`, `line` (one open stroke), `box` (trapezoid) |
| cheeks | `oval`, `dots`, `lines` |
| trait | `square`, `fin`, `ring`, `dot`, `peak` (the mark's triangle) |

Each trait keeps its v1.2 motion, measured from a seat on the crown outline:
a distance from the outline and a walk along it from the top. That is why any
trait fits any face. On its own v1.2 face each trait lands where it did.

### Anatomy: accessories

Three independent wardrobe slots, each individually overridable:

| Slot | Types, in list order |
| --- | --- |
| eyewear | `none`, `glasses`, `sunglasses` |
| headwear | `none`, `bow`, `cap`, `sprout` |
| neckwear | `none`, `tie` |

At `peek@1` the version pins each accessory list to its first entry, `none`.
Explicit overrides can use the full lists. Existing names and default SVG
bytes remain unchanged; automatically picking non-empty accessories would
require a new style version.

Glasses surround the eye sockets, and sunglasses cover the eyes without
removing them. Both track eye proportions and keep gaze and blinking intact.
Headwear sits on the crown outline, on the side away from the trait. The
cap is paper and ink, the bow has one red knot, and the sprout uses mint
and deep mint. The tie follows the mouth's lowest edge and is clipped by
the same floor as the body. All accessories share the body's transform.

The six accessories are transcribed from the Phụ kiện reference sheet;
placement adapts to the library's independent traits and seeded persona.

The explicit wardrobe has 3 × 4 × 2 = 24 combinations per identity. This
does not change the count of name-selected looks at `peek@1`.

### Anatomy: proportions

The persona from the v1.2 page, drawn in this order: eye spread, blink
rate, brow Y, brow tilt, brow arch, lean, hair, gaze bias, mouth Y, eye
size, pupil, brow weight, mouth width. Persona offsets are added to the
state, so they shift every expression the same way.

### Count

4 faces x 7 colors x 3 eyes x 4 brows x 4 mouths x 3 cheeks x 5 traits =
20,160 looks at `peek@1`, before the persona.

## Variants

`variant` picks the drawing: `peek` (default), `haze` or `bloc`. Tables in
`packages/peek/src/tables.ts` (`HAZE`, `WHEEL`, `BLOC`); Haze is drawn in
`draw.ts`, Bloc in `bloc.ts`. Both share the frame, riso, dim filter and
body transform with `peek`, so every expression, gaze and frame works.

### Haze

Transcribed from the Haze sheet, level Vừa. The body is its ink plus three
radial blobs cut to the outline: deep at the bottom, a tint low on the outer
edge, a glow at the top, on the side away from the tint. The tint is the
`HAZE` tint of a neighbor on `WHEEL`: warm is the entry before, cool the
one after.

```
rnd  = mulberry32(fnv1a('haze:' + tidy(name)))
warm = rnd() < .5       left = rnd() < .5       t = rnd()
tint at (.04 + .174t, .649 + .202t) of the body box, from its own side
glow inset .38 - .12 rnd(), height .12 + .099 rnd()
deep inset .251 - .151 rnd()
tint angle 90 - 180 rnd()
```

The seed and draw order are the sheet's own, fitted to its 12 names: never
reorder them. Below 32px the blobs drop to level Nhẹ. The lids paint the
same hazed body, so they never read as flat patches.

### Bloc

Transcribed from the Bloc sheet, direction A, palette P2. The four
silhouettes stay; the triangle's round joins are cut sharp and it fills the
300 box. The body is split down x = 170: the `BLOC` strong ink left, the
light ink right (body on `ink` and `none` frames, deep on `bone` and
`paper`). One ink bar replaces both brows, eyes are discs, beads or rings,
mouths are a turned square, a half disc, a bar or a block, and the trait is
a block on the upper right outline. Cheeks and accessories are not drawn.

Expressions read the same channels as `peek` through three moulds: round
eyes and a whole bar at rest; a level cut from below (`lower`) or above
(`lid`); a tilted cut (`lidTilt`) with the bar broken into a V or a caret
(`browTilt`). The bar is always two halves and never leaves the body. Lines
thicken 2.6x below 30px, eyes and trait grow 12 to 25%.
