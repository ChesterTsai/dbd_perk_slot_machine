// Canvas 2D slot reel, replacing the former Pixi.js implementation.
// The tween/easing/position math is ported unchanged so the animation
// behaves exactly like before.

const SOURCE_SIZE = 256 // all perk icons are packed from 256x256 sources
const ROLL_TIME = 4000
// Pixi blur strength and CSS blur() px don't map 1:1; tuned by eye against production
const BLUR_SCALE = 0.5

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
    const blur = Math.abs(state.position - state.previousPosition) * 8 * BLUR_SCALE
    state.previousPosition = state.position

    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(state.background, 0, 0, size, size)

    if (!state.started) {
      ctx.drawImage(state.placeholder, 0, 0, size, size)
    } else {
      const count = state.frames.length
      if (supportsFilter && blur >= 0.1) {
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
    }
  }
}
