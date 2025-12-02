<template>
  <g>
    <path
      ref="pathRef"
      :id="pathId"
      :d="edgePath"
      :stroke="edgeStyle.stroke"
      :stroke-width="edgeStyle.strokeWidth"
      fill="none"
      class="vue-flow__edge-path"
    />
    <circle
      v-if="hasParticleAnimation && particlePosition"
      :cx="particlePosition.x"
      :cy="particlePosition.y"
      :r="5"
      :fill="particleColor"
      class="edge-particle"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { getBezierPath } from '@vue-flow/core';
import type { EdgeProps } from '@vue-flow/core';

type Props = EdgeProps;

const props = defineProps<Props>();

const hasParticleAnimation = computed(() => {
  return props.data?.hasParticleAnimation === true;
});

const animationProgress = computed(() => {
  return props.data?.animationProgress || 0;
});

const particleColor = '#28a745';

const edgePath = computed(() => {
  if (!props.sourceX || !props.sourceY || !props.targetX || !props.targetY) {
    return '';
  }

  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });

  return path;
});

const edgeStyle = computed(() => ({
  stroke: '#b1b1b7',
  strokeWidth: 2,
}));

const pathId = computed(() => `edge-path-${props.id}`);
const pathRef = ref<SVGPathElement | null>(null);
const particlePosition = ref<{ x: number; y: number } | null>(null);

const updateParticlePosition = () => {
  if (!hasParticleAnimation.value || !pathRef.value || !edgePath.value) {
    particlePosition.value = null;
    return;
  }

  const progress = Math.max(0, Math.min(1, animationProgress.value || 0));

  if (progress <= 0) {
    particlePosition.value = null;
    return;
  }

  try {
    const pathLength = pathRef.value.getTotalLength();
    const point = pathRef.value.getPointAtLength(pathLength * progress);
    particlePosition.value = { x: point.x, y: point.y };
  } catch (error) {
    particlePosition.value = null;
  }
};

watch(
  [() => animationProgress.value, () => hasParticleAnimation.value, () => edgePath.value],
  () => {
    nextTick(() => {
      updateParticlePosition();
    });
  },
  { immediate: true },
);

onMounted(() => {
  nextTick(() => {
    updateParticlePosition();
  });
});
</script>

<style scoped>
.edge-particle {
  filter: drop-shadow(0 0 4px rgba(40, 167, 69, 0.9));
  animation: pulse 0.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}
</style>
