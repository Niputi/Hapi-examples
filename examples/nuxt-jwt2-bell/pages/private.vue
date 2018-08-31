<template>
  <section class="container">
    <div>
      <h2>
        Nuxt.js private route
      </h2>
    </div>
  </section>
</template>

<script>
export default {
  middleware: 'auth'
}
</script>

