import { DISPLAY_ORDER_LEFT_TO_RIGHT, DISPLAY_ORDER_TOP_TO_BOTTOM, NAVIGATION_MODE_DRAG } from '@/plugins/constants'
import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import { getTrialById } from '@/plugins/idb'

const emitter = require('tiny-emitter/instance')

let name = process.env.VUE_APP_INSTANCE_NAME

if (!name) {
  name = 'gridscore-next-' + window.location.pathname
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    serverUrl: null,
    locale: 'en_GB',
    darkMode: false,
    hideCitationMessage: false,
    displayRowOrder: DISPLAY_ORDER_TOP_TO_BOTTOM,
    displayColumnOrder: DISPLAY_ORDER_LEFT_TO_RIGHT,
    displayMarkerIndicators: true,
    displayMinCellWidth: 4,
    gpsEnabled: true,
    voiceFeedbackEnabled: false,
    navigationMode: NAVIGATION_MODE_DRAG,
    traitColors: ['#910080', '#ff7c00', '#5ec418', '#00a0f1', '#c5e000', '#ff007a', '#222183', '#c83831', '#fff600'],
    selectedTrial: null,
    hiddenTraits: [],
    plausible: {
      plausibleDomain: null,
      plausibleHashMode: true,
      plausibleApiHost: null
    },
    brapiConfig: {
      url: null,
      token: null
    }
  },
  getters: {
    storeLocale: (state) => state.locale,
    storeDarkMode: (state) => state.darkMode,
    storeHideCitationMessage: (state) => state.hideCitationMessage,
    storeDisplayRowOrder: (state) => state.displayRowOrder,
    storeDisplayColumnOrder: (state) => state.displayColumnOrder,
    storeDisplayMarkerIndicators: (state) => state.displayMarkerIndicators,
    storeDisplayMinCellWidth: (state) => state.displayMinCellWidth,
    storeGpsEnabled: (state) => state.gpsEnabled,
    storeVoiceFeedbackEnabled: (state) => state.voiceFeedbackEnabled,
    storeNavigationMode: (state) => state.navigationMode,
    storeTraitColors: (state) => state.traitColors,
    storeSelectedTrial: (state) => state.selectedTrial,
    storeHiddenTraits: (state) => state.hiddenTraits,
    storePlausible: (state) => state.plausible,
    storeServerUrl: (state) => state.serverUrl,
    storeBrapiConfig: (state) => state.brapiConfig
  },
  mutations: {
    ON_HIDDEN_TRAITS_CHANGED: function (state, newHiddenTraits) {
      state.hiddenTraits = newHiddenTraits
    },
    ON_SELECTED_TRIAL_CHANGED: function (state, newSelectedTrial) {
      /* Remember to reset everything here */
      state.selectedTrial = newSelectedTrial
      state.hiddenTraits = []

      if (newSelectedTrial) {
        getTrialById(newSelectedTrial)
          .then(trial => {
            if (trial.brapiConfig) {
              state.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(trial.brapiConfig)))
            } else {
              state.brapiConfig = {
                url: null,
                token: null
              }
            }
          })
      } else {
        state.brapiConfig = {
          url: null,
          token: null
        }
      }

      emitter.emit('trial-selected')
    },
    ON_DARK_MODE_CHANGED: function (state, newDarkMode) {
      state.darkMode = newDarkMode
    },
    ON_LOCALE_CHANGED: function (state, newLocale) {
      state.locale = newLocale
    },
    ON_HIDE_CITATION_MESSAGE_CHANGED: function (state, newHideCitationMessage) {
      state.hideCitationMessage = newHideCitationMessage
    },
    ON_DISPLAY_ROW_ORDER_CHANGED: function (state, newDisplayRowOrder) {
      state.displayRowOrder = newDisplayRowOrder
    },
    ON_DISPLAY_COLUMN_ORDER_CHANGED: function (state, newDisplayColumnOrder) {
      state.displayColumnOrder = newDisplayColumnOrder
    },
    ON_DISPLAY_MARKER_INDICATORS_CHANGED: function (state, newDisplayMarkerIndicators) {
      state.displayMarkerIndicators = newDisplayMarkerIndicators
    },
    ON_DISPLAY_MIN_CELL_WIDTH_CHANGED: function (state, newDisplayMinCellWidth) {
      state.displayMinCellWidth = newDisplayMinCellWidth
    },
    ON_GPS_ENABLED_CHANGED: function (state, newGpsEnabled) {
      state.gpsEnabled = newGpsEnabled
    },
    ON_VOICE_FEEDBACK_ENABLED_CHANGED: function (state, newVoiceFeedbackEnabled) {
      state.voiceFeedbackEnabled = newVoiceFeedbackEnabled
    },
    ON_NAVIGATION_MODE_CHANGED: function (state, newNavigationMode) {
      state.navigationMode = newNavigationMode
    },
    ON_TRAIT_COLORS_CHANGED: function (state, newTraitColors) {
      state.traitColors = newTraitColors
    },
    ON_PLAUSIBLE_CHANGED: function (state, newPlausible) {
      state.plausible = newPlausible
    },
    ON_SERVER_URL_CHANGED: function (state, newServerUrl) {
      state.serverUrl = newServerUrl
    },
    ON_BRAPI_CONFIG_CHANGED: function (state, newBrapiConfig) {
      if (newBrapiConfig) {
        state.brapiConfig = Object.assign({ url: null, token: null }, JSON.parse(JSON.stringify(newBrapiConfig)))
      } else {
        state.brapiConfig = {
          url: null,
          token: null
        }
      }
    }
  },
  actions: {
    setHiddenTraits: function ({ commit }, hiddenTraits) {
      commit('ON_HIDDEN_TRAITS_CHANGED', hiddenTraits)
    },
    setSelectedTrial: function ({ commit }, selectedTrial) {
      commit('ON_SELECTED_TRIAL_CHANGED', selectedTrial)
    },
    setDarkMode: function ({ commit }, darkMode) {
      commit('ON_DARK_MODE_CHANGED', darkMode)
    },
    setLocale: function ({ commit }, locale) {
      commit('ON_LOCALE_CHANGED', locale)
    },
    setHideCitationMessage: function ({ commit }, hideCitationMessage) {
      commit('ON_HIDE_CITATION_MESSAGE_CHANGED', hideCitationMessage)
    },
    setDisplayRowOrder: function ({ commit }, displayRowOrder) {
      commit('ON_DISPLAY_ROW_ORDER_CHANGED', displayRowOrder)
    },
    setDisplayColumnOrder: function ({ commit }, displayColumnOrder) {
      commit('ON_DISPLAY_COLUMN_ORDER_CHANGED', displayColumnOrder)
    },
    setDisplayMarkerIndicators: function ({ commit }, displayMarkerIndicators) {
      commit('ON_DISPLAY_MARKER_INDICATORS_CHANGED', displayMarkerIndicators)
    },
    setDisplayMinCellWidth: function ({ commit }, displayMinCellWidth) {
      commit('ON_DISPLAY_MIN_CELL_WIDTH_CHANGED', displayMinCellWidth)
    },
    setGpsEnabled: function ({ commit }, gpsEnabled) {
      commit('ON_GPS_ENABLED_CHANGED', gpsEnabled)
    },
    setVoiceFeedbackEnabled: function ({ commit }, voiceFeedbackEnabled) {
      commit('ON_VOICE_FEEDBACK_ENABLED_CHANGED', voiceFeedbackEnabled)
    },
    setNavigationMode: function ({ commit }, navigationMode) {
      commit('ON_NAVIGATION_MODE_CHANGED', navigationMode)
    },
    setTraitColors: function ({ commit }, traitColors) {
      commit('ON_TRAIT_COLORS_CHANGED', traitColors)
    },
    setPlausible: function ({ commit }, plausible) {
      commit('ON_PLAUSIBLE_CHANGED', plausible)
    },
    setServerUrl: function ({ commit }, serverUrl) {
      commit('ON_SERVER_URL_CHANGED', serverUrl)
    },
    setBrapiConfig: function ({ commit }, brapiConfig) {
      commit('ON_BRAPI_CONFIG_CHANGED', brapiConfig)
    }
  },
  modules: {
  },
  plugins: [createPersistedState({
    key: name
  })]
})