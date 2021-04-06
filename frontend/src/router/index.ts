// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import { Route, NavigationGuardNext } from 'vue-router/types/router';
import { Auth } from '@aws-amplify/auth';
import Home from '../views/Home.vue';
import Echo from '../views/Echo.vue';

Vue.use(VueRouter);

const auth = async (to: Route, from: Route, next: NavigationGuardNext) => {
  try {
    const currentSession = await Auth.currentSession();

    if (currentSession && currentSession.isValid()) {
      next();
    } else {
      next({ name: 'Home' });
    }
  } catch (e) {
    next({ name: 'Home' });
  }
};

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/echo',
    name: 'Echo',
    component: Echo,
    beforeEnter: auth,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
