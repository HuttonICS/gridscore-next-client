<template>
  <b-input-group>
    <!-- Latitude and longitude inputs. Min, max and stepsize set -->
    <b-form-input :placeholder="$t('formPlaceholderLatitude')" :min="-90" :max="90" :step="0.001" type="number" lazy v-model.number.lazy="latitude" />
    <b-form-input :placeholder="$t('formPlaceholderLongitude')" :min="-180" :max="180" :step="0.001" type="number" lazy v-model.number.lazy="longitude" />

    <template #append v-if="supportsGps">
      <!-- Button that sets user's current position -->
      <b-button @click="setGps(true)" v-b-tooltip="$t('tooltipSetupGetLocation')"><IBiGeoAltFill /></b-button>
      <b-button @click="setGps(false)" variant="danger"><IBiX /></b-button>
    </template>
  </b-input-group>
</template>

<script>
/**
 * Component used to ask the user for a GPS location as decimal lat and lng. Current location can be used by pressing the button.
 */
export default {
  props: {
    /** The previous selection */
    currentPosition: {
      type: Object,
      default: () => { return { lat: null, lng: null } }
    }
  },
  data: function () {
    return {
      latitude: null,
      longitude: null,
      supportsGps: false
    }
  },
  watch: {
    currentPosition: function () {
      // Update the current position
      this.updateCurrentPosition()
    },
    latitude: function () {
      // Notify parent
      if (this.latitude && this.longitude && this.latitude !== '' && this.longitude !== '') {
        this.$emit('data-changed', { lat: this.latitude, lng: this.longitude })
      } else {
        this.$emit('data-changed', null)
      }
    },
    longitude: function () {
      // Notify parent
      if (this.latitude && this.longitude && this.latitude !== '' && this.longitude !== '') {
        this.$emit('data-changed', { lat: this.latitude, lng: this.longitude })
      } else {
        this.$emit('data-changed', null)
      }
    }
  },
  methods: {
    /** Set the current geolocation as the selected location */
    setGps: function (set) {
      if (set) {
        navigator.geolocation.getCurrentPosition(geolocation => {
          if (geolocation && geolocation.coords) {
            this.latitude = geolocation.coords.latitude
            this.longitude = geolocation.coords.longitude
          }
        })
      } else {
        this.latitude = null
        this.longitude = null
      }
    },
    /** Updates the current position based on the previous selection */
    updateCurrentPosition: function () {
      if (this.currentPosition) {
        this.latitude = this.currentPosition.lat
        this.longitude = this.currentPosition.lng
      }
    }
  },
  mounted: function () {
    this.updateCurrentPosition()

    this.supportsGps = navigator.geolocation !== undefined && navigator.geolocation !== null
  }
}
</script>

<style>

</style>
