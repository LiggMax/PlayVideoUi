<script setup>
import NavBar from './components/NavBar.vue'

</script>

<template>
  <div>
    <NavBar />
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: #ffffff;
  background-image: 
    radial-gradient(#e8f0ff 3px, transparent 4px),
    radial-gradient(#e8f0ff 3px, transparent 4px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  background-attachment: fixed;
  position: relative;
}

body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, rgba(255,255,255,0.3), rgba(220,230,255,0.5));
  z-index: -1;
}

#app {
  width: 100%;
  height: 100%;
}
</style>