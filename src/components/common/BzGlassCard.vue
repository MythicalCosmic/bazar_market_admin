<template>
  <component
    :is="tag"
    class="bz-glasscard"
    :class="[{ 'bz-glasscard--strong': strong, 'bz-glasscard--hover': hover, 'bz-glasscard--glow': glow }]"
    :style="{ padding: typeof pad === 'number' ? pad + 'px' : pad, borderRadius: radius }"
  >
    <slot />
  </component>
</template>

<script setup>
// Canonical glass surface. `strong` enables live blur (use sparingly, for
// fixed/elevated panels); default is the cheap translucent-fill variant.
defineProps({
  tag:    { type: String, default: 'div' },
  strong: { type: Boolean, default: false },
  hover:  { type: Boolean, default: false },
  glow:   { type: Boolean, default: false },
  pad:    { type: [Number, String], default: 0 },
  radius: { type: String, default: 'var(--bz-radius-lg)' },
})
</script>

<style scoped>
.bz-glasscard {
  position: relative;
  background: var(--bz-glass-bg);
  border: 1px solid var(--bz-border);
  box-shadow: var(--bz-shadow-sm), inset 0 1px 0 var(--bz-glass-highlight);
  transition: box-shadow var(--bz-dur) var(--bz-ease),
              transform var(--bz-dur) var(--bz-ease),
              border-color var(--bz-dur) var(--bz-ease);
}
.bz-glasscard--strong {
  background: var(--bz-glass-bg-strong);
  -webkit-backdrop-filter: blur(var(--bz-glass-blur)) saturate(160%);
  backdrop-filter: blur(var(--bz-glass-blur)) saturate(160%);
  border-color: var(--bz-glass-border);
  box-shadow: var(--bz-shadow-md), inset 0 1px 0 var(--bz-glass-highlight);
}
.bz-glasscard--glow { box-shadow: var(--bz-glow-soft), var(--bz-shadow-md), inset 0 1px 0 var(--bz-glass-highlight); }
.bz-glasscard--hover { cursor: pointer; }
.bz-glasscard--hover:hover {
  transform: translateY(-3px);
  border-color: var(--bz-primary-glow);
  box-shadow: var(--bz-glow-soft), var(--bz-shadow-md), inset 0 1px 0 var(--bz-glass-highlight);
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .bz-glasscard--strong { background: var(--bz-glass-bg-solid); }
}
</style>
