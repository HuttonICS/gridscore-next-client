<template>
  <div v-if="sortedTrials && sortedTrials.length > 0">
    <h2>{{ $t('widgetTrialSelectorTitle') }}</h2>
    <p>{{ $t('widgetTrialSelectorText') }}</p>
    <b-row>
      <b-col cols=12 sm=6 md=4 lg=3 v-for="trial in sortedTrials" :key="`trial-selector-${trial.localId}`"  class="mb-3">
        <b-card class="h-100" no-body :border-variant="trial.localId === storeSelectedTrial ? 'info' : null" :bg-variant="trial.localId === storeSelectedTrial ? 'light' : null">
          <TrialInformation :trial="trial" />
          <b-card-footer class="d-flex justify-content-between">
            <b-button @click="loadTrial(trial)" variant="primary"><BIconJournalArrowUp /> {{ $t('buttonLoadTrial') }}</b-button>
            <b-dropdown>
              <template #button-content>
                <BIconGear />
              </template>
              <b-dropdown-item @click="showShareCodes(trial)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-qr-code-scan" viewBox="0 0 16 16"><path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5ZM4 4h1v1H4V4Z"/><path d="M7 2H2v5h5V2ZM3 3h3v3H3V3Zm2 8H4v1h1v-1Z"/><path d="M7 9H2v5h5V9Zm-4 1h3v3H3v-3Zm8-6h1v1h-1V4Z"/><path d="M9 2h5v5H9V2Zm1 1v3h3V3h-3ZM8 8v2h1v1H8v1h2v-2h1v2h1v-1h2v-1h-3V8H8Zm2 2H9V9h1v1Zm4 2h-1v1h-2v1h3v-2Zm-4 2v-1H8v1h2Z"/><path d="M12 9h2V8h-2v1Z"/></svg> {{ $t('buttonShare') }}</b-dropdown-item>
              <b-dropdown-divider />
              <b-dropdown-item variant="danger" @click="deleteTrial(trial)"><BIconTrash /> {{ $t('buttonDelete') }}</b-dropdown-item>
            </b-dropdown>
          </b-card-footer>
        </b-card>
      </b-col>
    </b-row>

    <TrialCommentModal :trialId="selectedTrial.localId" @hidden="showTrialComments(null)" ref="trialCommentModal" v-if="selectedTrial" />
    <TrialShareCodeModal :trial="selectedTrial" ref="trialShareCodeModal" v-if="selectedTrial" />
  </div>
</template>

<script>
import TrialInformation from '@/components/TrialInformation'
import TrialCommentModal from '@/components/modals/TrialCommentModal'
import TrialShareCodeModal from '@/components/modals/TrialShareCodeModal'
import { mapGetters } from 'vuex'
import { deleteTrial, getTrials } from '@/plugins/idb'
import { BIconJournalArrowUp, BIconGear, BIconTrash } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    TrialInformation,
    TrialCommentModal,
    TrialShareCodeModal,
    BIconJournalArrowUp,
    BIconGear,
    BIconTrash
  },
  computed: {
    ...mapGetters([
      'storeSelectedTrial'
    ]),
    sortedTrials: function () {
      if (this.trials) {
        return this.trials.concat().sort((a, b) => new Date(b.updatedOn) - new Date(a.updatedOn))
      } else {
        return []
      }
    }
  },
  data: function () {
    return {
      trials: [],
      selectedTrial: null
    }
  },
  methods: {
    showShareCodes: function (trial) {
      this.selectedTrial = trial

      this.$nextTick(() => this.$refs.trialShareCodeModal.show())
    },
    loadTrial: function (trial) {
      this.$store.commit('ON_SELECTED_TRIAL_CHANGED', trial.localId)
      this.$router.push({ name: 'data-entry' })
    },
    deleteTrial: function (trial) {
      this.$bvModal.msgBoxConfirm(this.$t('modalTextDeleteTrial'), {
        title: this.$t('modalTitleDeleteTrial'),
        okTitle: this.$t('buttonYes'),
        okVariant: 'danger',
        cancelTitle: this.$t('buttonNo')
      })
        .then(value => {
          if (value) {
            this.$store.commit('ON_SELECTED_TRIAL_CHANGED', null)
            deleteTrial(trial.localId).then(() => {
              this.update()
            })

            emitter.emit('plausible-event', { key: 'trial-deleted' })
          }
        })
    },
    showTrialComments: function (trial) {
      this.selectedTrial = trial

      if (trial) {
        this.$nextTick(() => this.$refs.trialCommentModal.show())
      }
    },
    update: function () {
      getTrials().then(trials => {
        this.trials = trials
        if (this.selectedTrial) {
          this.selectedTrial = this.trials.find(t => t.localId === this.selectedTrial.localId)
        }
      })
    }
  },
  mounted: function () {
    this.update()

    emitter.on('show-trial-comments', this.showTrialComments)
    emitter.on('trial-properties-changed', this.update)
  },
  beforeDestroy: function () {
    emitter.off('show-trial-comments', this.showTrialComments)
    emitter.off('trial-properties-changed', this.update)
  }
}
</script>

<style scoped>

</style>