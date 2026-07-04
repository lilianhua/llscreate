<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <div class="app">
    <h1><%= projectName %></h1>
    <HelloWorld msg="Hello from your fresh Vue project" />
  </div>
</template>

<style scoped>
.app {
  font-family: Inter, system-ui, sans-serif;
  color: #213547;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}

h1 {
  color: #42b883;
}
</style>
