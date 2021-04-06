<template>
  <div class="fixed-height container pt-6 is-centered has-text-centered">
    <h1 class="title">WebSocket画面</h1>
    <h2 class="subtitle">ステータス: {{ statusText }}</h2>

    <div class="block mt-6">
      <h2 class="subtitle">メッセージの送信</h2>
      <div class="field is-grouped">
        <p class="control is-expanded">
          <input class="input is-primary" type="text" placeholder="任意のテキスト" v-model="text">
        </p>
        <p class="control">
          <button class="button is-primary" @click="sendText">
            送信
          </button>
        </p>
      </div>
    </div>

    <div class="messages block mt-6">
      <h2 class="subtitle">受信したメッセージ (送信したメッセージと同じ)</h2>

      <template v-if="messages.length > 0">
        <p v-for="(message, idx) in messages" :key="idx">
          {{ message }}
        </p>
      </template>

      <template v-else>
        <p>なし</p>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint @typescript-eslint/no-explicit-any: 0 */
import { w3cwebsocket } from 'websocket';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { AmplifyEventBus } from 'aws-amplify-vue';
import { Auth } from '@aws-amplify/auth';
import config from '../aws-exports';

@Component
export default class Echo extends Vue {
  client?: typeof w3cwebsocket = null;
  forceCloseFlag = false;
  isLoggedIn = false;
  messages: string[] = [];
  statusText = '未接続';
  text = '';

  async connect(): Promise<void> {
    const currentSession = await Auth.currentSession();
    const idToken = currentSession.getIdToken();
    const jwtToken = idToken.getJwtToken();

    this.statusText = '接続中';

    this.client = new w3cwebsocket(`${config.WebSocketEndpoint}?idToken=${jwtToken}`);

    this.client.onopen = () => {
      this.statusText = '接続済み';
    };

    this.client.onerror = (e: any) => {
      this.statusText = 'エラー (再接続)';

      console.error(e);

      setTimeout(async () => {
        await this.connect();
      });
    };

    this.client.onclose = () => {
      if (!this.forceCloseFlag) {
        this.statusText = '接続切れ (再接続)';

        setTimeout(async () => {
          await this.connect();
        });
      } else {
        this.statusText = '切断';
      }
    };

    this.client.onmessage = async (message: any) => {
      const messageObj = JSON.parse(message.data);
      this.messages.push(messageObj.message);
    };
  }

  async mounted(): Promise<void> {
    await this.connect();

    AmplifyEventBus.$on('authState', (info: string) => {
      if (info === 'signedIn') {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  destroyed(): void {
    if (this.client) {
      this.forceCloseFlag = true;
      this.client.close();
    }
  }

  @Watch('isLoggedIn')
  onLoginStatusChanged(): void {
    if (!this.isLoggedIn) {
      this.$router.push({ name: 'Home' });
    }
  }

  sendText(): void {
    if (this.client) {
      this.client.send(this.text);
      this.text = '';
    }
  }
}
</script>
