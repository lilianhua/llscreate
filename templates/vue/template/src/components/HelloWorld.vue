<script setup lang="ts">
defineProps<{ msg: string }>();
</script>

<template>
  <div class="card">
    <p>{{ msg }}</p>
  </div>
</template>

<style scoped>
.card {
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  font-family: Inter, system-ui, sans-serif;
}
</style>
