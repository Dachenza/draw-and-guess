<template>
  <div id="app-root">
    <router-view />
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import ToastContainer from './components/ToastContainer.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
</script>
