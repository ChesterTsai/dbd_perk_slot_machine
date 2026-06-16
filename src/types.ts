// One perk as used by the roulette views; `index` is the numeric prefix of
// the icon file name, `name` the full atlas frame key (e.g. "01_agitation")
export interface Perk {
  index: number
  name: string
}

// Home.vue's config grid additionally tracks the on/off state per perk
export interface SelectablePerk extends Perk {
  checked: boolean
}

// TexturePacker "JSON (hash)" atlas format, emitted by
// scripts/build-sprites.mjs (public/sprites/*-hd.json)
export interface AtlasFrame {
  frame: { x: number, y: number, w: number, h: number }
  rotated: boolean
  trimmed: boolean
  spriteSourceSize: { x: number, y: number, w: number, h: number }
  sourceSize: { w: number, h: number }
}

export interface AtlasJson {
  frames: Record<string, AtlasFrame>
  meta: {
    image: string
    size: { w: number, h: number }
  }
}
