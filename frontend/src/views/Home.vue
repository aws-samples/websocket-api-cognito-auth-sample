<template>
  <div class="container is-widescreen pt-6 is-centered">
    <div class="is-flex is-justify-content-center">

      <template v-if="!isLoggedIn">
        <amplify-authenticator
          username-alias="email"
          :auth-config="{ signUpConfig }">
        </amplify-authenticator>
      </template>

      <template v-else>
        <amplify-sign-out></amplify-sign-out>
      </template>
    </div>

    <div class="block is-flex is-justify-content-center">
      <router-link tag="button" class="button is-primary" :disabled="!isLoggedIn" :to="{ name: 'Echo' }">
        WebSocket画面へ
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Component, Vue } from 'vue-property-decorator';
import { AmplifyEventBus } from 'aws-amplify-vue';
import { Auth } from '@aws-amplify/auth';

@Component
export default class Home extends Vue {
  isLoggedIn = false;

  signUpConfig = {
    hiddenDefaults: ['phone_number'],
  };

  async updateLoginStatus(): Promise<void> {
    try {
      const currentSession = await Auth.currentSession();

      if (currentSession && currentSession.isValid()) {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    } catch (e) {
      this.isLoggedIn = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await Auth.signOut();
      await this.updateLoginStatus();
    } catch (e) {
      alert(e.message || JSON.stringify(e));
    }
  }

  async mounted(): Promise<void> {
    await this.updateLoginStatus();

    AmplifyEventBus.$on('authState', (info: string) => {
      if (info === 'signedIn') {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }
}
</script>
