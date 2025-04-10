<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <h1>Excel Editor</h1>
    <RouterView />
  </div>
</template>

<style>
.app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #2c3e50;
}
</style>
