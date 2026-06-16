import { describe, it, expect, vi, afterEach } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  parseIconName,
  gridLayout,
  sheetSize,
  buildAtlasJson,
  buildCss,
  scanIcons,
  COLUMNS,
  GUTTER,
  SOURCE_SIZE,
  CSS_SIZE
} from '../scripts/build-sprites.mjs'

describe('parseIconName', () => {
  it('parses the NN_camelCase scheme', () => {
    expect(parseIconName('07_bloodhound.png')).toEqual({ index: 7, name: '07_bloodhound' })
    expect(parseIconName('100_nowhereToHide.png')).toEqual({ index: 100, name: '100_nowhereToHide' })
  })

  it('accepts hyphens in perk names', () => {
    expect(parseIconName('33_open-Handed.png')).toEqual({ index: 33, name: '33_open-Handed' })
  })

  it('rejects raw game exports and other files', () => {
    expect(parseIconName('T_UI_iconsPerks_Rampage.png')).toBeNull()
    expect(parseIconName('IconsPerks_FlowState.png')).toBeNull()
    expect(parseIconName('07_bloodhound.jpg')).toBeNull()
    expect(parseIconName('.DS_Store')).toBeNull()
  })
})

describe('gridLayout', () => {
  it('places icons on a fixed-column grid with a gutter', () => {
    const stride = SOURCE_SIZE + 2 * GUTTER
    expect(gridLayout(0, SOURCE_SIZE)).toEqual({ x: GUTTER, y: GUTTER })
    expect(gridLayout(1, SOURCE_SIZE)).toEqual({ x: stride + GUTTER, y: GUTTER })
    expect(gridLayout(COLUMNS, SOURCE_SIZE)).toEqual({ x: GUTTER, y: stride + GUTTER })
    expect(gridLayout(COLUMNS + 2, SOURCE_SIZE)).toEqual({ x: 2 * stride + GUTTER, y: stride + GUTTER })
  })

  it('sheetSize covers all rows and caps width at the column count', () => {
    const stride = SOURCE_SIZE + 2 * GUTTER
    expect(sheetSize(3, SOURCE_SIZE)).toEqual({ w: 3 * stride, h: stride })
    expect(sheetSize(139, SOURCE_SIZE)).toEqual({ w: COLUMNS * stride, h: 9 * stride })
  })
})

describe('buildAtlasJson', () => {
  it('emits TexturePacker-compatible untrimmed frames in input order', () => {
    const atlas = buildAtlasJson(['00_a', '01_b'], 'kill-hd.png')
    expect(Object.keys(atlas.frames)).toEqual(['00_a', '01_b'])
    expect(atlas.frames['01_b']).toEqual({
      frame: { x: 262, y: 2, w: 256, h: 256 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 256, h: 256 },
      sourceSize: { w: 256, h: 256 }
    })
    expect(atlas.meta.image).toBe('kill-hd.png')
    expect(atlas.meta.size).toEqual(sheetSize(2, SOURCE_SIZE))
  })

  it('keeps numeric order even where string sort would differ', () => {
    // names arrive pre-sorted by scanIcons; key insertion order must survive
    const names = Array.from({ length: 101 }, (_, i) => `${i}_p`)
    const atlas = buildAtlasJson(names, 'x.png')
    const keys = Object.keys(atlas.frames)
    expect(keys[9]).toBe('9_p')
    expect(keys[100]).toBe('100_p')
  })
})

describe('buildCss', () => {
  it('emits the sheet rule and ._NN_name selectors PerkSwitch builds', () => {
    const css = buildCss(['00_aNursesCalling', '01_agitation'], 'sprite-killer', 'kill-css.png')
    expect(css).toContain('.sprite-killer {display:inline-block; overflow:hidden; background-repeat: no-repeat;background-image:url(kill-css.png);}')
    expect(css).toContain(`._00_aNursesCalling {width:${CSS_SIZE}px; height:${CSS_SIZE}px; background-position: -2px -2px}`)
    expect(css).toContain(`._01_agitation {width:${CSS_SIZE}px; height:${CSS_SIZE}px; background-position: -134px -2px}`)
  })
})

describe('scanIcons', () => {
  let dir: string

  async function makeDir (files: string[]) {
    dir = await mkdtemp(path.join(tmpdir(), 'dpsm-icons-'))
    for (const f of files) await writeFile(path.join(dir, f), '')
    return dir
  }

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  it('returns names in numeric order, skipping non-scheme files with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const names = await scanIcons(await makeDir(['1_b.png', '0_a.png', '2_c.png', 'T_UI_iconsPerks_Rampage.png']))
    expect(names).toEqual(['0_a', '1_b', '2_c'])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('T_UI_iconsPerks_Rampage.png')
    warn.mockRestore()
  })

  it('errors on a gap, naming the missing index', async () => {
    await expect(scanIcons(await makeDir(['0_a.png', '2_c.png'])))
      .rejects.toThrow(/missing perk index 1/)
  })

  it('errors on a duplicate index', async () => {
    await expect(scanIcons(await makeDir(['0_a.png', '1_b.png', '01_z.png'])))
      .rejects.toThrow(/duplicate perk index 1/)
  })
})
