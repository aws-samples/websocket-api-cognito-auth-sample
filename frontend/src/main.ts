// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Vue from 'vue';
import App from './App.vue';
import router from './router';
import Amplify, * as AmplifyModules from 'aws-amplify';
import { AmplifyPlugin } from 'aws-amplify-vue';
import config from './aws-exports';

Amplify.configure({
  Auth: {
    region: config.Region,
    userPoolId: config.UserPoolId,
    userPoolWebClientId: config.UserPoolWebClientId,
  },
});

Vue.use(AmplifyPlugin, AmplifyModules);

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
