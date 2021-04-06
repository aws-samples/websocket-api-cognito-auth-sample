<template>
  <div>
    <nav class="navbar">
      <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
          <router-link tag="a" :to="{ name: 'Home' }" class="navbar-item">
            Home
          </router-link>
        </div>
      </div>
    </nav>
    <div class="container">
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {}
</script>

<style lang="scss">
 @import "./assets/common.scss";
</style>
