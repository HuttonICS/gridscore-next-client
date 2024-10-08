<template>
  <div id="app" class="d-flex flex-column ">
    <b-navbar toggleable="xl" variant="dark" v-b-color-mode="'dark'" >
      <b-navbar-brand :to="{ name: 'home' }" class="d-flex align-items-center">
        <img src="/img/gridscore-next.svg" height="40px" class="d-inline-block align-top me-3" alt="GridScore">
        {{ $t('appTitle') }}
      </b-navbar-brand>

      <!-- Trial information OUTSIDE of the collapse for small screens -->
      <b-navbar-nav class="ms-auto me-3 d-block d-xl-none">
        <TrialInformationDropdown v-if="selectedTrial && showSelectedTrialMenuItem" :trial="selectedTrial" />
      </b-navbar-nav>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :active="$route.name === 'home'" :to="{ name: 'home' }"><IBiHouse /> {{ $t('menuHome') }}</b-nav-item>
          <b-nav-item :disabled="menuItemsDisabled" :active="$route.name === 'data-entry'" :to="{ name: 'data-entry' }"><IBiUiChecksGrid /> {{ $t('menuDataEntry') }}</b-nav-item>
          <b-nav-item-dropdown :disabled="menuItemsDisabled">
            <template #button-content>
              <IBiEasel /> {{ $t('menuDataVisualization') }}
            </template>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-timeline' }"><IBiGraphUp /> {{ $t('menuVisualizationTimeline') }}</b-dropdown-item>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-heatmap' }"><IBiGridFill /> {{ $t('menuVisualizationHeatmap') }}</b-dropdown-item>
            <!-- <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-scatter' }"><IBiDice3 flip-h /> {{ $t('menuVisualizationScatter') }}</b-dropdown-item> -->
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-statistics' }"><IBiBarChartSteps /> {{ $t('menuVisualizationStatistics') }}</b-dropdown-item>
            <b-dropdown-item :disabled="menuItemsDisabled" :to="{ name: 'visualization-map' }"><IBiPinMapFill /> {{ $t('menuVisualizationMap') }}</b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item :disabled="menuItemsDisabled" :active="$route.name === 'trial-export'" :to="{ name: 'trial-export' }"><IBiCloudDownload /> {{ $t('menuDataExport') }}</b-nav-item>
          <b-nav-item :active="$route.name === 'data-statistics'" :to="{ name: 'data-statistics' }"><IBiClipboardData /> {{ $t('menuDataStatistics') }}</b-nav-item>
          <b-nav-item :active="$route.name === 'settings'" :to="{ name: 'settings' }"><IBiGear /> {{ $t('menuSettings') }}</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ms-auto">
          <!-- Trial information INSIDE of the collapse for small screens -->
          <TrialInformationDropdown v-if="selectedTrial && showSelectedTrialMenuItem" :trial="selectedTrial" class="d-none d-xl-block" />
          <b-nav-item href="#" @click.prevent="toggleDarkMode">
            <IBiMoon v-if="storeDarkMode" />
            <IBiSun v-else /> <span> {{ $t('menuToggleDarkMode') }}</span>
          </b-nav-item>
          <b-nav-item-dropdown right>
            <template #button-content>
              <IBiFlag /> <span> {{ $t('menuLocale') }}</span>
            </template>
            <b-dropdown-item v-for="language in languages" :key="`locale-${language.locale}`" @click="onLocaleChanged(language)">
              <span class="me-2">{{ language.icon }}</span> <span>{{ language.name }}</span>
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item :to="{ name: 'about' }"><IBiInfoCircle /> {{ $t('menuAbout') }}</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <div class="d-flex flex-column flex-fill">
      <router-view id="router-view" />

      <footer :class="`mt-auto py-3 border-top ${storeDarkMode ? 'bg-dark border-dark' : 'bg-light border-light'}`" v-if="$route.name !== 'data-entry'">
        <b-container>
          <b-row>
            <b-col cols=12 md=4 class="d-flex align-items-center justify-content-center justify-content-md-start">
              <span class="text-muted">&copy; {{ new Date().getFullYear() }} GridScore: <a class="text-muted" href="https://www.hutton.ac.uk">The James Hutton Institute</a></span>
            </b-col>

            <b-col cols=12 md=4 class="d-flex align-items-center justify-content-center">
              <a href="#" @click.prevent="showChangelog" class="text-muted">{{ $t('pageFooterVersion', { version: gridScoreVersion }) }}</a>
            </b-col>

            <b-col cols=12 md=4>
              <ul class="nav justify-content-center justify-content-md-end list-unstyled d-flex">
                <li class="mx-2"><a class="text-muted" href="https://ics.hutton.ac.uk/get-gridscore"><IBiGlobe2 /></a></li>
                <li class="mx-2"><a class="text-muted" href="https://twitter.com/GerminateHub"><IBiTwitter /></a></li>
                <li class="mx-2"><a class="text-muted" href="https://github.com/cropgeeks/gridscore-next-client"><IBiGithub /></a></li>
              </ul>
            </b-col>
          </b-row>
        </b-container>
      </footer>
    </div>

    <BrapiModal v-model="brapiSettingsModalVisible"
                :title="'modalTitleBrapiSettings'"
                :okTitle="'buttonOk'"
                :cancelTitle="'buttonCancel'"
                :okDisabled="true"
                :preventHide="false"
                :errorMessage="brapiErrorMessage"
                @brapi-settings-changed="onBrapiSettingsChanged"
                no-fade />

    <b-modal v-model="loadingConfig.visible" hide-header hide-footer no-close-on-backdrop no-close-on-esc hide-header-close>
      <div class="text-center">
        <b-spinner style="width: 3rem; height: 3rem;" variant="primary" type="grow" />
        <p class="text-muted mt-3" v-if="$t('modalTextLoading')">{{ $t('modalTextLoading') }}</p>

        <b-progress :value="loadingConfig.progress" v-if="(loadingConfig.progress !== undefined) && (loadingConfig.progress !== null)" striped animated />
      </div>
    </b-modal>

    <ChangelogModal :prevVersion="changelogVersionNumber" ref="changelogModal" />
    <MissingTrialModal />

    <b-modal :title="$t('modalTitleAppUpdateAvailable')"
             :ok-title="$t('buttonUpdate')"
             id="update-modal"
             v-model="updateExists"
             @ok="refreshApp"
             no-fade
             no-close-on-esc
             no-close-on-backdrop
             :cancel-title="$t('buttonCancel')">
      <p>{{ $t('modalTextAppUpdateAvailable') }}</p>
    </b-modal>

    <TrialCommentModal :trialId="trialForComments.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="trialForComments" />
    <TrialEventModal :trialId="trialForEvents.localId" @hidden="showTrialEvents(null)" ref="trialEventModal" v-if="trialForEvents" />
    <TrialShareCodeModal :trial="trialForShare" @hidden="showTrialShare(null)" ref="trialShareModal" v-if="trialForShare" />

    <ConfirmModal />

    <BToastOrchestrator />
  </div>
</template>

<script>
import TrialInformationDropdown from '@/components/dropdowns/TrialInformationDropdown.vue'
import BrapiModal from '@/components/modals/BrapiModal.vue'
import ChangelogModal from '@/components/modals/ChangelogModal.vue'
import MissingTrialModal from '@/components/modals/MissingTrialModal.vue'
import TrialCommentModal from '@/components/modals/TrialCommentModal.vue'
import TrialShareCodeModal from '@/components/modals/TrialShareCodeModal.vue'
import TrialEventModal from '@/components/modals/TrialEventModal.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import { loadLanguageAsync, locales } from '@/plugins/i18n'
import { init } from '@/plugins/datastore'
import { axiosCall, getServerSettings } from '@/plugins/api'
import Plausible from 'plausible-tracker'
import { useToast } from 'bootstrap-vue-next'

import { getId } from '@/plugins/id'
import { gridScoreVersion } from '@/plugins/constants'

import { UAParser } from 'ua-parser-js'
import { getTrialById, initDb } from '@/plugins/idb'
import emitter from 'tiny-emitter/instance'
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

// Set base URL based on environment
let baseUrl = './api/'
if (import.meta.env.VITE_BASE_URL) {
  baseUrl = import.meta.env.VITE_BASE_URL
}

const trialInfoPages = ['data-entry', 'guided-walk', 'trial-export', 'visualization-heatmap', 'visualization-timeline', 'visualization-statistics', 'visualization-map']

export default {
  components: {
    BrapiModal,
    ChangelogModal,
    MissingTrialModal,
    TrialInformationDropdown,
    TrialCommentModal,
    TrialEventModal,
    TrialShareCodeModal,
    ConfirmModal
  },
  data: function () {
    return {
      gridScoreVersion,
      languages: locales,
      loadingConfig: {
        visible: false,
        progress: null
      },
      refreshing: false,
      registration: null,
      selectedTrial: null,
      trialForComments: null,
      trialForEvents: null,
      trialForShare: null,
      updateExists: false,
      changelogVersionNumber: null,
      brapiErrorMessage: null,
      brapiSettingsModalVisible: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeLocale',
      'storeDarkMode',
      'storeSelectedTrial',
      'storePlausible',
      'storeUniqueClientId',
      'storeRunCount',
      'storeChangelogVersionNumber'
    ]),
    menuItemsDisabled: function () {
      return this.storeSelectedTrial === undefined || this.storeSelectedTrial === null
    },
    showSelectedTrialMenuItem: function () {
      const page = this.$route.name

      return trialInfoPages.includes(page)
    }
  },
  watch: {
    storeDarkMode: function (newValue) {
      this.setDarkMode(newValue)
    },
    storeSelectedTrial: function () {
      this.updateSelectedTrial()
    },
    '$route.name': function (newValue) {
      this.setRouterClass(newValue)
    }
  },
  methods: {
    setRouterClass: function (routeName) {
      if (routeName === 'data-entry') {
        document.body.classList.add('data-entry')
      } else {
        document.body.classList.remove('data-entry')
      }
    },
    setDarkMode: function (value) {
      if (value) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
        document.documentElement.classList.remove('light-mode')
        document.documentElement.classList.add('dark-mode')
      } else {
        document.documentElement.setAttribute('data-bs-theme', 'light')
        document.documentElement.classList.add('light-mode')
        document.documentElement.classList.remove('dark-mode')
      }
    },
    showTrialComments: function (trial) {
      this.trialForComments = trial
      this.trialForEvents = null
      this.trialForShare = null

      if (trial) {
        this.$nextTick(() => this.$refs.trialCommentModal.show())
      }
    },
    showTrialEvents: function (trial) {
      this.trialForComments = null
      this.trialForEvents = trial
      this.trialForShare = null

      if (trial) {
        this.$nextTick(() => this.$refs.trialEventModal.show())
      }
    },
    showTrialShare: function (trial) {
      this.trialForComments = null
      this.trialForEvents = null
      this.trialForShare = trial

      if (trial) {
        this.$nextTick(() => this.$refs.trialShareModal.show())
      }
    },
    updateSelectedTrial: function () {
      if (this.storeSelectedTrial) {
        getTrialById(this.storeSelectedTrial)
          .then(trial => {
            this.selectedTrial = trial
          })
      } else {
        this.selectedTrial = null
      }
    },
    updateSelectedTrialData: function (localId) {
      if (this.storeSelectedTrial === localId) {
        getTrialById(this.storeSelectedTrial)
          .then(trial => {
            this.selectedTrial = trial

            if (this.trialForEvents && this.trialForEvents.localId === trial.localId) {
              this.trialForEvents = trial
            }
            if (this.trialForComments && this.trialForComments.localId === trial.localId) {
              this.trialForComments = trial
            }
            if (this.trialForShare && this.trialForShare.localId === trial.localId) {
              this.trialForShare = trial
            }
          })
      }
    },
    onBrapiSettingsChanged: function (config) {
      emitter.emit('brapi-settings-changed', config)
    },
    toggleDarkMode: function () {
      emitter.emit('plausible-event', { key: 'settings-changed', props: { darkMode: !this.storeDarkMode } })
      this.coreStore.setDarkMode(!this.storeDarkMode)
    },
    onLocaleChanged: function (language) {
      loadLanguageAsync(language.locale).then(() => {
        this.$i18n.locale = language.locale
        this.coreStore.setLocale(language.locale)

        emitter.emit('plausible-event', { key: 'locale-changed', props: { locale: language.locale } })
      })
    },
    enablePlausible: function () {
      if (this.storePlausible) {
        this.plausible = Plausible({
          domain: this.storePlausible.plausibleDomain,
          apiHost: this.storePlausible.plausibleApiHost,
          trackLocalhost: false,
          hashMode: this.storePlausible.plausibleHashMode || true
        })

        this.plausible.enableAutoPageviews()

        this.plausibleEvent({ key: 'app-load', props: { version: this.gridScoreVersion } })
      }
    },
    plausibleEvent: function (data) {
      if (this.plausible && this.storePlausible.plausibleDomain && data) {
        if (data.props) {
          this.plausible.trackEvent(data.key, { props: data.props })
        } else {
          this.plausible.trackEvent(data.key)
        }
      }
    },
    handleApiError: function (error) {
      console.log(error)
      emitter.emit('show-confirm', {
        title: 'modalTitleApiError',
        message: this.$t('modalTextApiError', { error: JSON.stringify(error) }),
        okTitle: 'buttonOk',
        okOnly: true,
        okVariant: 'primary'
      })
    },
    showBrapiSettings: function (message = null) {
      this.brapiErrorMessage = message
      this.brapiSettingsModalVisible = true
    },
    showToast: function (p) {
      const { show } = useToast()
      show({
        props: {
          title: p.title,
          body: p.message,
          variant: p.variant,
          pos: 'bottom-end',
          interval: p.autoHideDelay || 1000
        }
      })
    },
    showLoading: function (visible, progress) {
      this.loadingConfig = {
        visible: visible,
        progress: visible ? progress : null
      }
    },
    handleVisibilityChange: async function () {
      // If the apps visibility changed (tab changed or window minimized), re-aquire the lock after return
      if (this.wakeLock !== null && document.visibilityState === 'visible') {
        await this.toggleWakeLock(true)
      }
    },
    toggleWakeLock: async function (acquire) {
      if (this.wakeLock === null && acquire) {
        try {
          // Get the lock
          this.wakeLock = await navigator.wakeLock.request()
          // Listen for changes to it
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null
          })
        } catch (err) {
          this.wakeLock = null
        }
      } else if (this.wakeLock && !acquire) {
        // Release it
        this.wakeLock.release()
        this.wakeLock = null
      }
    },
    isLocalhost: function () {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === ''
    },
    updateAvailable: function (event) {
      this.plausibleEvent({ key: 'update-shown', props: { from: this.gridScoreVersion } })
      console.log('swUpdated called', event.detail)
      this.registration = event.detail
      this.updateExists = true
    },
    refreshApp: function () {
      console.log('refreshApp')
      this.updateExists = false

      if (this.registration) {
        this.plausibleEvent({ key: 'update-finished', props: { from: this.gridScoreVersion } })
        this.registration()
      }
    },
    showChangelog: function () {
      if (this.$route.name === 'about') {
        emitter.emit('show-changelog')
      } else {
        this.$router.push({ name: 'about', query: { showChangelog: true } })
      }
    }
  },
  mounted: function () {
    loadLanguageAsync(this.storeLocale.replace('_', '-'))

    this.setDarkMode(this.storeDarkMode)
    this.setRouterClass(this.$route.name)

    init()

    if (!this.storePlausible || !this.storePlausible.plausibleDomain) {
      getServerSettings()
        .then(result => {
          if (result) {
            this.coreStore.setPlausible(result)
            this.enablePlausible()
          }
        })
    } else {
      this.enablePlausible()
    }

    if ('wakeLock' in navigator) {
      this.toggleWakeLock(true)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }

    const config = new UAParser().getResult()
    this.coreStore.setDeviceConfig(config)

    // Log the run
    if (!this.isLocalhost()) {
      let id = this.storeUniqueClientId
      if (!id) {
        id = getId()

        this.coreStore.setUniqueClientId(id)
      }

      if (config.os !== undefined && config.os !== null && config.os.name !== undefined && config.os.name !== null && config.os.name !== 'Search Bot') {
        const data = {
          application: 'GridScore',
          runCount: this.storeRunCount + 1,
          id,
          version: `${gridScoreVersion}`,
          locale: this.storeLocale,
          os: `${config.os.name} ${config.os.version}`
        }
        axiosCall({ baseUrl: 'https://ics.hutton.ac.uk/app-logger/', url: 'log', params: data, method: 'get', ignoreErrors: true, checkRemote: false })
          .then(() => {
            // If the call succeeds, reset the run count
            this.coreStore.setRunCount(0)
          })
          .catch(() => {
            // If this call fails (e.g. no internet), remember the run
            this.coreStore.setRunCount(this.storeRunCount + 1)
          })
      }
    }

    this.changelogVersionNumber = this.storeChangelogVersionNumber
    if (this.changelogVersionNumber !== null && this.changelogVersionNumber !== gridScoreVersion) {
      this.$refs.changelogModal.show()
      this.coreStore.setChangelogVersionNumber(gridScoreVersion)
    } else if (this.changelogVersionNumber === null) {
      this.coreStore.setChangelogVersionNumber(gridScoreVersion)
    }

    emitter.on('trial-properties-changed', this.updateSelectedTrialData)
    emitter.on('show-trial-comments', this.showTrialComments)
    emitter.on('show-trial-events', this.showTrialEvents)
    emitter.on('show-trial-share', this.showTrialShare)
    emitter.on('plausible-event', this.plausibleEvent)
    emitter.on('api-error', this.handleApiError)
    emitter.on('show-brapi-settings', this.showBrapiSettings)
    emitter.on('show-loading', this.showLoading)
    emitter.on('show-toast', this.showToast)

    this.updateSelectedTrial()
  },
  beforeUnmount: function () {
    emitter.off('trial-properties-changed', this.updateSelectedTrialData)
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('show-trial-events', this.showTrialEvents)
    emitter.off('show-trial-share', this.showTrialShare)
    emitter.off('plausible-event', this.plausibleEvent)
    emitter.off('api-error', this.handleApiError)
    emitter.off('show-brapi-settings', this.showBrapiSettings)
    emitter.off('show-loading', this.showLoading)
    emitter.off('show-toast', this.showToast)
  },
  created: function () {
    // Listen for our custom event from the SW registration
    document.addEventListener('swUpdated', this.updateAvailable, { once: true })

    this.coreStore.setServerUrl(baseUrl)

    // Prevent multiple refreshes
    // navigator.serviceWorker.addEventListener('controllerchange', () => {
    //   console.log('controllerchange called')
    //   if (this.refreshing) {
    //     return
    //   }
    //   this.refreshing = true
    //   // Here the actual reload of the page occurs
    //   console.log('reloading')
    //   window.location.reload(true)
    // })

    initDb()
  }
}
</script>

<style lang="scss">
$primary: #3498db;
$secondary: #bdc3c7;
$light: #ecf0f1;
$dark: #2c3e50;
// $info: #60a3bc;
$success: #A3CB38;
$info: #12CBC4;
$warning: #FFC312;
$danger: #EA2027;

@import '~bootswatch/dist/cosmo/variables';
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-vue-next/src/styles/styles.scss';
@import '~bootswatch/dist/cosmo/bootswatch';

@each $breakpoint in map-keys($grid-breakpoints) {
  @include media-breakpoint-up($breakpoint) {
    $infix: breakpoint-infix($breakpoint, $grid-breakpoints);

    .border#{$infix}-top {      border-top: $border-width solid $border-color !important; }
    .border#{$infix}-right {    border-right: $border-width solid $border-color !important; }
    .border#{$infix}-bottom {   border-bottom: $border-width solid $border-color !important; }
    .border#{$infix}-left {     border-left: $border-width solid $border-color !important; }

    .border#{$infix}-top-0 {    border-top: 0 !important; }
    .border#{$infix}-right-0 {  border-right: 0 !important; }
    .border#{$infix}-bottom-0 { border-bottom: 0 !important; }
    .border#{$infix}-left-0 {   border-left: 0 !important; }

    .border#{$infix}-x {
      border-left: $border-width solid $border-color !important;
      border-right: $border-width solid $border-color !important;
    }

    .border#{$infix}-y {
      border-top: $border-width solid $border-color !important;
      border-bottom: $border-width solid $border-color !important;
    }
  }
}

.modal-fullscreen {
  padding: 0 !important; // override inline padding-right added from js
}

.modal-fullscreen .modal-dialog {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
}

.modal-fullscreen .modal-content {
  min-height: 100vh;
  border: 0;
  border-radius: 0;
}

.modal-fullscreen .modal-body {
  overflow-y: auto;
}

@import '@/assets/css/dark-mode';

.form-switch .form-check-input {
  border-radius: 1em;
}

.input-group .form-range {
  height: unset;
}

.toast {
  --bs-bg-opacity: 0.65;
}

.modal.show {
  display: block;
}
.modal-dialog {
  z-index: 1051;
}
form div[role=group]:not(.input-group):not(.btn-group) {
  margin-bottom: 1rem;
}
.form-input-file {
  input[type='file'] {
    margin-left: -2px !important;

    &::-webkit-file-upload-button {
      display: none;
    }

    &::file-selector-button {
      display: none;
    }
  }

  &:hover {
    label {
      background-color: #dde0e3;
      cursor: pointer;
    }
  }
}

html {
  position: relative !important;
  min-height: 100vh !important;
}

body.data-entry {
  overflow-y: scroll !important; /* Show vertical scrollbar to prevent main canvas from jumping */
}

body {
  min-height: 100vh !important;
}

#app {
  min-height: 100vh !important;
}

.display-1, .display-2, .display-3, .display-4 {
  word-break: break-word;
}

.b-offcanvas {
  top: 65px;
  max-height: calc(100% - 65px);
}

.modal-banner {
  margin: -1rem -1rem 0 -1rem
}

.button-disabled:hover {
  cursor: default;
}
</style>
