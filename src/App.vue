<template>
  <div id="app-container">
    <!-- Optional: Navigation for easy testing -->
    <nav style="margin-bottom: 1rem; padding: 0.5rem; background-color: #f0f0f0;">
      <router-link to="/">Home</router-link> |
      <router-link to="/options">Settings</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup lang="ts">
// No specific script needed for just router-view
</script>

<style>
/* Add some basic styling if needed */
#app-container {
  padding: 10px;
}
</style>
