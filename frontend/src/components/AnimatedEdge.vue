<template>
  <g>
    <path
      :id="pathId"
      :d="path"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      fill="none"
      class="vue-flow__edge-path"
    />
    <circle
      v-if="hasParticleAnimation"
      :cx="particleX"
      :cy="particleY"
      r="5"
      :fill="particleColor"
      class="edge-particle"
    />
  </g>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue';
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

const particleColor = '#007bff';
const stroke = '#b1b1b7';
const strokeWidth = 2;

const particleX = ref(0);
const particleY = ref(0);
const pathId = computed(() => `edge-path-${props.id}`);

const path = computed(() => {
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

const updateParticlePosition = () => {
  if (!hasParticleAnimation.value || !path.value) {
    return;
  }

  const progress = Math.max(0, Math.min(1, animationProgress.value || 0));
  if (progress <= 0) {
    return;
  }

  const pathElement = document.getElementById(pathId.value);
  if (!pathElement || !(pathElement instanceof SVGPathElement)) {
    return;
  }

  try {
    const pathLength = pathElement.getTotalLength();
    const point = pathElement.getPointAtLength(pathLength * progress);

    particleX.value = point.x;
    particleY.value = point.y;
  } catch (error) {
    // Path might not be ready yet
  }
};

let animationFrame: number | null = null;

const animate = () => {
  if (!hasParticleAnimation.value) {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    return;
  }

  updateParticlePosition();
  if (animationProgress.value < 1) {
    animationFrame = requestAnimationFrame(animate);
  }
};

watch(
  () => animationProgress.value,
  () => {
    updateParticlePosition();
  },
  { immediate: true },
);

watch(
  () => hasParticleAnimation.value,
  (isActive) => {
    if (isActive && animationProgress.value > 0 && animationProgress.value < 1) {
      if (animationFrame === null) {
        animate();
      }
    } else {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (hasParticleAnimation.value && animationProgress.value > 0) {
    updateParticlePosition();
  }
});

onUnmounted(() => {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<style scoped>
.edge-particle {
  filter: drop-shadow(0 0 4px rgba(0, 123, 255, 0.9));
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
