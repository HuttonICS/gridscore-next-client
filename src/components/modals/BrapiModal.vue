<template>
  <b-modal :title="$t(title)"
           :ok-title="$t(okTitle)"
           :cancel-title="$t(cancelTitle)"
           :ok-disabled="okDisabled"
           scrollable
           no-fade
           @ok="$emit('submit')"
           :size="size"
           ref="brapiModal">
    <b-form @submit.prevent="updateBrapiUrl">
      <b-form-group label-for="brapiUrl">
        <template v-slot:label>
          <span v-html="$t('formLabelBrapiUrl')" />
        </template>
        <template slot="description">
          <span v-html="$t('formDescriptionBrapiUrl')" />
        </template>
        <!-- BrAPI URL input field -->
        <b-form-input v-model="brapiUrl" id="brapiUrl" />
      </b-form-group>
      <b-form-group label-for="brapiToken" :label="$t('formLabelBrapiToken')" :description="$t('formDescriptionBrapiToken')">
        <!-- BrAPI token input field -->
        <b-form-input id="brapiToken" v-model="brapiToken" />
      </b-form-group>

      <!-- Button to update the BrAPI URL in the store -->
      <b-button @click="updateBrapiUrl"><IBiArrowClockwise /> {{ $t('buttonUpdate') }}</b-button>

      <p class="text-danger" v-if="errorMessage">{{ $t(errorMessage) }}</p>
    </b-form>

    <!-- Slot that wrapping components can use to fill in their content -->
    <div class="mt-3">
      <slot name="content" />
    </div>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import { updateTrialBrapiConfig } from '@/plugins/idb'

import emitter from 'tiny-emitter/instance'

/**
 * Base modal used to show a BrAPI URL input field at the top. Wrapping components can use the `content` slot to add their own content.
 */
export default {
  data: function () {
    return {
      brapiUrl: null,
      brapiToken: null
    }
  },
  props: {
    /** The modal `title` i18n identifier */
    title: {
      type: String,
      default: ''
    },
    /** The modal `ok` button i18n identifier */
    okTitle: {
      type: String,
      default: 'buttonOk'
    },
    /** The modal `cancel` button i18n identifier */
    cancelTitle: {
      type: String,
      default: 'buttonCancel'
    },
    okDisabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeBrapiConfig',
      'storeSelectedTrial'
    ])
  },
  methods: {
    /**
     * Shows the modal and gets the current BrAPI URL from the configuration
     */
    show: function () {
      this.brapiUrl = this.storeBrapiConfig && this.storeBrapiConfig.url ? this.storeBrapiConfig.url : null
      this.brapiToken = this.storeBrapiConfig && this.storeBrapiConfig.token ? this.storeBrapiConfig.token : null
      this.$nextTick(() => this.$refs.brapiModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.brapiModal.hide())
    },
    /**
     * Returns the BrAPI URL
     */
    getBrapiUrl: function () {
      return this.brapiUrl
    },
    /**
     * Pushes the changed BrAPI URL to the store
     */
    updateBrapiUrl: function () {
      const config = {
        url: this.brapiUrl,
        token: this.brapiToken
      }
      this.$store.commit('ON_BRAPI_CONFIG_CHANGED', config)

      if (this.storeSelectedTrial) {
        updateTrialBrapiConfig(this.storeSelectedTrial, config)
          .then(() => {
            this.$emit('brapi-settings-changed', config)
            emitter.emit('trial-selected')
            // this.hide()
          })
      } else {
        this.$emit('brapi-settings-changed', config)
        // this.hide()
      }
    }
  }
}
</script>

<style>

</style>
