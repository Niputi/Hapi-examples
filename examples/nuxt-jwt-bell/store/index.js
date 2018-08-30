import CookieParser from 'cookieparser';
import axios from 'axios'

export const state = () => ({
  authUser: null
})

export const mutations = {
  SET_USER: function (state, user) {
    state.authUser = user
  }
}

export const actions = {
  // nuxtServerInit is called by Nuxt.js before server-rendering every page
  nuxtServerInit({ commit }, { req }) {
    if (req.headers && req.headers.cookie) {
      let requestCookies = CookieParser.parse(req.headers.cookie);
      if (requestCookies.hasOwnProperty('token')) {
        commit('SET_USER', requestCookies.token)
      }
    }
  }

}
