<template>
  <div class="slot-container" :style="cssProps">
    <div class="slot" ref="slot"
         @mouseenter="onHover(true)"
         @mouseleave="onHover(false)">
      <canvas ref="canvas"
              :width="elementLength"
              :height="elementLength"
              @pointerdown="onPointerDown"></canvas>
    </div>
    <div v-show="tooltipVisible && !popupDisabled"
         ref="tooltip"
         class="popper"
         :style="{ transform: `translateX(calc(-50% + ${tooltipShift}px))` }"
         v-html="perkDescription">
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { createSlotReel } from '../lib/slotReel'
import type { SlotReel } from '../lib/slotReel'
import type { Perk } from '../types'

export default defineComponent({
  name: 'PerkSlot',
  emits: ['reRollRequested'],
  data: function () {
    return {
      reel: null as SlotReel | null,
      active: false,
      hasRolled: false,
      targetPerkId: null as number | null,
      popupDisabled: true,
      tooltipVisible: false,
      tooltipShift: 0,
      perkDescription: '',
      newPerkDescription: ''
    }
  },
  computed: {
    cssProps () {
      return {
        '--elementlength': this.elementLength,
        '--containerpadding': `${this.elementLength}px`
      }
    }
  },
  props: {
    lang: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    colorized: {
      type: Boolean,
      default: false,
      required: false
    },
    elementLength: {
      type: Number,
      required: true
    },
    perkData: {
      type: Array as PropType<string[]>,
      required: true
    },
    slotIndex: {
      type: Number,
      required: true
    }
  },
  methods: {
    onPointerDown: function (ev: PointerEvent) {
      if (!this.hasRolled) {
        this.$emit('reRollRequested')
      } else {
        this.$emit('reRollRequested', this.slotIndex, ev)
      }
    },
    onHover: function (entered: boolean) {
      this.tooltipVisible = entered
      if (!entered) {
        this.tooltipShift = 0
        return
      }
      this.$nextTick(() => {
        const tip = this.$refs.tooltip as HTMLDivElement | undefined
        if (!tip) return
        const rect = tip.getBoundingClientRect()
        const margin = 8
        if (rect.left < margin) {
          this.tooltipShift = margin - rect.left
        } else if (rect.right > window.innerWidth - margin) {
          this.tooltipShift = (window.innerWidth - margin) - rect.right
        }
      })
    },
    rollWheel: function (targetId: Perk, newPerkDescription: string) {
      if (this.active) return
      this.perkDescription = ''
      if (!newPerkDescription.startsWith('perks.')) this.newPerkDescription = newPerkDescription
      this.popupDisabled = true
      this.targetPerkId = targetId.index
      this.hasRolled = true
      this.active = true
      const reel = this.reel as SlotReel
      reel.ready.then(() => {
        reel.rollTo(this.targetPerkId as number, this._reelComplete)
      })
      return true
    },
    _reelComplete: function () {
      this.active = false
      const perkName = this.$t(`perks.${this.type === 'Surv' ? 'survivor' : 'killer'}.${this.perkData[this.targetPerkId as number]}`).toUpperCase()
      ;(this.reel as SlotReel).showLabel(perkName)
      this.perkDescription = this.newPerkDescription
      if (this.perkDescription && this.perkDescription.length > 0) {
        this.popupDisabled = false
      }
    }
  },
  mounted () {
    this.reel = createSlotReel(this.$refs.canvas as HTMLCanvasElement, {
      size: this.elementLength,
      atlasJsonUrl: `/sprites/${this.type.toLowerCase()}${this.colorized ? 'color' : ''}-hd.json`,
      backgroundUrl: '/img/perkBg.png',
      placeholderUrl: `/img/placeholder_${this.type}.png`
    })
  },
  beforeUnmount () {
    if (this.reel) this.reel.destroy()
  }
})
</script>

<style lang="scss" scoped>
    .popper {
      background-color: #151513;
      text-align: left;
      padding: 0.4rem;
      color: white;
      width: 512px;
      max-width: calc(100vw - 16px);
      position: absolute;
      top: calc(100% + 10px);
      left: 50%;
      z-index: 200000;
      font-size: 14px;
      border-radius: 3px;
      border: 1px #ebebeb solid;
      box-shadow: rgb(58, 58, 58) 0 0 6px 0;
    }

    .slot-container {
      max-width: var(--elementlength)px;
      display: inline-block;
      position: relative;
      padding: 0;
      margin: 0;
    }

    .slot {
        height: var(--elementlength)px;
        width: var(--elementlength)px;
        position: relative;
        display: inline-block;
        padding: 0;
        margin: 0;
    }
</style>
