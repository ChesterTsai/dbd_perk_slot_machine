// Canvas 2D slot reel, replacing the former Pixi.js implementation.
// The tween/easing/position math is ported unchanged so the animation
// behaves exactly like before.

const SOURCE_SIZE = 256 // all perk icons are packed from 256x256 sources
const ROLL_TIME = 4000
// Symmetric CSS blur() fallback for browsers without SVG canvas filters;
// kept low because it also softens horizontally
const BLUR_SCALE = 0.09
// Vertical-only SVG blur along the reel motion, like the old Pixi blurY
// (Gaussian sigma ≈ Pixi blur strength / 2)
const DIRECTIONAL_BLUR_SCALE = 0.5

export function lerp (a1, a2, t) {
  return a1 * (1 - t) + a2 * t
}

export function backout (amount) {
  return (t) => {
    return (--t * t * ((amount + 1) * t + amount) + 1)
  }
}

export function symbolY (position, j, count, size) {
  return (position + j) % count * size - size
}

export function targetPosition (count, targetIndex) {
  return (count + 1) - targetIndex
}

export function fitFontSize (ctx, text, maxWidth, sizeScale, startSize = 16) {
  let fontSize = startSize
  while (fontSize > 1) {
    ctx.font = `bold ${fontSize * sizeScale}px Arial`
    const width = ctx.measureText(text).width
    if (width <= maxWidth || width <= 0) break
    fontSize--
  }
  return fontSize
}

let filterIdCounter = 0

// SVG filter with a two-value stdDeviation gives a vertical-only Gaussian,
// which canvas can use via ctx.filter = 'url(#...)'
function createDirectionalBlurFilter () {
  const ns = 'http://www.w3.org/2000/svg'
  const id = `slot-reel-blur-${filterIdCounter++}`
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.position = 'absolute'
  const filter = document.createElementNS(ns, 'filter')
  filter.setAttribute('id', id)
  // widen the filter region so long vertical streaks don't get clipped
  filter.setAttribute('x', '-50%')
  filter.setAttribute('y', '-50%')
  filter.setAttribute('width', '200%')
  filter.setAttribute('height', '200%')
  const blur = document.createElementNS(ns, 'feGaussianBlur')
  blur.setAttribute('stdDeviation', '0 0')
  filter.appendChild(blur)
  svg.appendChild(filter)
  document.body.appendChild(svg)
  return { id, blurEl: blur, svg }
}

// A browser that parses url() but can't resolve the SVG filter renders
// nothing at all, so probe by actually drawing through the filter.
function directionalBlurWorks (filter) {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 8
  const t = c.getContext('2d')
  t.filter = `url(#${filter.id})`
  if (t.filter === 'none' || t.filter === '') return false
  t.fillStyle = '#ffffff'
  t.fillRect(0, 0, 8, 8)
  if (t.getImageData(4, 4, 1, 1).data[3] === 0) return false
  // verify stdDeviation mutations are picked up between draws
  filter.blurEl.setAttribute('stdDeviation', '0 4')
  t.clearRect(0, 0, 8, 8)
  t.filter = 'none'
  t.filter = `url(#${filter.id})`
  t.fillRect(2, 2, 4, 4)
  const blurred = t.getImageData(4, 0, 1, 1).data[3] > 0 // smeared above the rect
  filter.blurEl.setAttribute('stdDeviation', '0 0')
  return blurred
}

function loadImage (url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

export function createSlotReel (canvas, { size, atlasJsonUrl, backgroundUrl, placeholderUrl }) {
  const ctx = canvas.getContext('2d')
  const supportsFilter = typeof ctx.filter === 'string'
  const scale = size / SOURCE_SIZE

  let directionalBlur = null
  if (supportsFilter) {
    const filter = createDirectionalBlurFilter()
    if (directionalBlurWorks(filter)) {
      directionalBlur = filter
    } else {
      filter.svg.remove()
    }
  }

  const state = {
    frames: [], // [{ frame, rotated, spriteSourceSize }] in atlas JSON order
    atlas: null,
    background: null,
    placeholder: null,
    position: 0,
    previousPosition: 0,
    tweening: [],
    label: null,
    started: false, // placeholder is shown until the first roll
    rafId: null,
    destroyed: false
  }

  const ready = (async () => {
    const res = await fetch(atlasJsonUrl)
    const atlasData = await res.json()
    const atlasImageUrl = atlasJsonUrl.replace(/[^/]+$/, atlasData.meta.image)
    const [atlas, background, placeholder] = await Promise.all([
      loadImage(atlasImageUrl),
      loadImage(backgroundUrl),
      loadImage(placeholderUrl)
    ])
    state.frames = Object.values(atlasData.frames)
    state.atlas = atlas
    state.background = background
    state.placeholder = placeholder
    if (!state.destroyed) {
      state.rafId = window.requestAnimationFrame(frameLoop)
    }
  })()

  function tweenTo (object, property, target, time, easing, onchange, oncomplete) {
    const tween = {
      object: object,
      property: property,
      propertyBeginValue: object[property],
      target: target,
      easing: easing,
      time: time,
      change: onchange,
      complete: oncomplete,
      start: Date.now()
    }
    state.tweening.push(tween)
    return tween
  }

  function updateTweens () {
    const now = Date.now()
    const remove = []
    for (let i = 0; i < state.tweening.length; i++) {
      const t = state.tweening[i]
      const phase = Math.min(1, (now - t.start) / t.time)

      t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase))
      if (t.change) t.change(t)
      if (phase === 1) {
        t.object[t.property] = t.target
        if (t.complete) t.complete(t)
        remove.push(t)
      }
    }
    for (let i = 0; i < remove.length; i++) {
      state.tweening.splice(state.tweening.indexOf(remove[i]), 1)
    }
  }

  function drawSymbol (entry, y) {
    const f = entry.frame
    const sss = entry.spriteSourceSize
    const dx = sss.x * scale
    const dy = y + sss.y * scale
    const dw = f.w * scale
    const dh = f.h * scale
    if (entry.rotated) {
      // stored rotated 90° clockwise in a h×w region; un-rotate to display
      ctx.save()
      ctx.translate(dx + dw / 2, dy + dh / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.drawImage(state.atlas, f.x, f.y, f.h, f.w, -dh / 2, -dw / 2, dh, dw)
      ctx.restore()
    } else {
      ctx.drawImage(state.atlas, f.x, f.y, f.w, f.h, dx, dy, dw, dh)
    }
  }

  function drawLabel (text) {
    const textBoxBorder = size * 0.012
    const textBoxY = size * 0.9
    const textBoxWidth = size * 0.967
    const textBoxHeight = size * 0.1

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(textBoxBorder, textBoxY, textBoxWidth, textBoxHeight)

    const fontSize = fitFontSize(ctx, text, textBoxWidth, scale)
    ctx.font = `bold ${fontSize * scale}px Arial`
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(text, size / 2, size * 0.91)
  }

  function frameLoop () {
    updateTweens()

    // blur depends on per-frame movement; like the Pixi version this is
    // deliberately frame-rate dependent — it's part of the look
    const speed = Math.abs(state.position - state.previousPosition) * 8
    const blur = speed * (directionalBlur ? DIRECTIONAL_BLUR_SCALE : BLUR_SCALE)
    state.previousPosition = state.position

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(state.background, 0, 0, size, size)

    if (!state.started) {
      ctx.drawImage(state.placeholder, 0, 0, size, size)
    } else {
      const count = state.frames.length
      if (directionalBlur && blur >= 0.1) {
        directionalBlur.blurEl.setAttribute('stdDeviation', `0 ${blur}`)
        ctx.filter = `url(#${directionalBlur.id})`
      } else if (supportsFilter && blur >= 0.1) {
        ctx.filter = `blur(${blur}px)`
      }
      for (let j = 0; j < count; j++) {
        const y = symbolY(state.position, j, count, size)
        if (y <= -size || y >= size) continue
        drawSymbol(state.frames[j], y)
      }
      if (supportsFilter) {
        ctx.filter = 'none'
      }
      if (state.label !== null) {
        drawLabel(state.label)
      }
    }

    state.rafId = window.requestAnimationFrame(frameLoop)
  }

  return {
    ready,
    rollTo (targetIndex, oncomplete) {
      state.started = true
      state.label = null
      state.tweening = []
      tweenTo(state, 'position', targetPosition(state.frames.length, targetIndex), ROLL_TIME, backout(0.6), null, oncomplete)
    },
    showLabel (text) {
      state.label = text
    },
    destroy () {
      state.destroyed = true
      if (state.rafId !== null) {
        window.cancelAnimationFrame(state.rafId)
      }
      if (directionalBlur) {
        directionalBlur.svg.remove()
      }
    }
  }
}
