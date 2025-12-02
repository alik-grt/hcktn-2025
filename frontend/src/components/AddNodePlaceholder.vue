<template>
  <div class="add-node-placeholder" @click.stop="onClick">
    <div class="plus-icon">+</div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [];
}>();

const onClick = () => {
  emit('click');
};
</script>

<style scoped>
.add-node-placeholder {
  width: 60px;
  height: 60px;
  border: 2px dashed #007bff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
  position: relative;
}

.add-node-placeholder:hover {
  border-color: #0056b3;
  background: #f0f8ff;
  transform: scale(1.1);
}

.plus-icon {
  font-size: 2rem;
  color: #007bff;
  font-weight: 300;
  line-height: 1;
}
</style>

