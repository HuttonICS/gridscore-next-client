<template>
  <div>
    <b-row>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowColumn', { row: 1, column: 1 })" label-for="top-left">
          <!-- Top left corner -->
          <GpsInput :currentPosition="corners.topLeft" @changed="corner => { corners.topLeft = corner }" id="top-left" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowColumn', { row: rows, column: 1 })" label-for="bottom-left">
          <!-- Bottom left corner -->
          <GpsInput :currentPosition="corners.bottomLeft" @changed="corner => { corners.bottomLeft = corner }" id="bottom-left" />
        </b-form-group>
      </b-col>
      <b-col cols=6>
        <b-form-group :label="$t('formLabelFieldLayoutRowColumn', { row: 1, column: columns })" label-for="top-right">
          <!-- Top right corner -->
          <GpsInput :currentPosition="corners.topRight" @changed="corner => { corners.topRight = corner }" id="top-right" />
        </b-form-group>
        <b-form-group :label="$t('formLabelFieldLayoutRowColumn', { row: rows, column: columns })" label-for="bottom-right">
          <!-- Bottom right corner -->
          <GpsInput :currentPosition="corners.bottomRight" @changed="corner => { corners.bottomRight = corner }" id="bottom-right" />
        </b-form-group>
      </b-col>
    </b-row>

    <div ref="map" class="layout-map" />

    <div class="d-none">
      <div ref="popoverContent" v-if="supportsGps">
        <p>{{ $t('formLabelFieldLayoutUseAsCorner') }}</p>
        <b-row>
          <b-col cols=6>
            <b-button block class="mb-2" @click="setGps('topLeft')">{{ $t('formLabelFieldLayoutRowColumn', { row: 1, column: 1 }) }}</b-button>
          </b-col>
          <b-col cols=6>
            <b-button block class="mb-2" @click="setGps('topRight')">{{ $t('formLabelFieldLayoutRowColumn', { row: 1, column: columns }) }}</b-button>
          </b-col>
          <b-col cols=6>
            <b-button block class="mb-2" @click="setGps('bottomLeft')">{{ $t('formLabelFieldLayoutRowColumn', { row: rows, column: 1 }) }}</b-button>
          </b-col>
          <b-col cols=6>
            <b-button block class="mb-2" @click="setGps('bottomRight')">{{ $t('formLabelFieldLayoutRowColumn', { row: rows, column: columns }) }}</b-button>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script>
import GpsInput from '@/components/GpsInput'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'
import { isGeographyValid, toGeoJson, isLocationValid, trialLayoutToPlots } from '@/plugins/location'

// Set the leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
})

/**
 * Shows the field layout corner points selection components as well as the map
 */
export default {
  components: {
    GpsInput
  },
  data: function () {
    return {
      corners: {
        topLeft: null,
        topRight: null,
        bottomRight: null,
        bottomLeft: null
      },
      supportsGps: false
    }
  },
  props: {
    layout: {
      type: Object,
      default: null
    }
  },
  computed: {
    rows: function () {
      if (this.layout) {
        return this.layout.rows
      } else {
        return 1
      }
    },
    columns: function () {
      if (this.layout) {
        return this.layout.columns
      } else {
        return 1
      }
    }
  },
  watch: {
    corners: {
      deep: true,
      handler: function (newValue) {
        this.$emit('change', newValue)

        this.updateGrid()
      }
    }
  },
  methods: {
    updateGrid: function () {
      // Remove the old geojson layer if required
      if (this.geoJsonLayer) {
        this.map.removeLayer(this.geoJsonLayer)
      }

      if (this.marker) {
        this.marker.remove()
        this.marker = null
      }

      // Add visual markers to corners
      if (this.markerTopLeft) {
        this.map.removeLayer(this.markerTopLeft)
      }
      if (isLocationValid(this.corners.topLeft)) {
        this.markerTopLeft = L.marker([this.corners.topLeft.lat, this.corners.topLeft.lng])
        this.markerTopLeft.addTo(this.map)
      }
      if (this.markerTopRight) {
        this.map.removeLayer(this.markerTopRight)
      }
      if (isLocationValid(this.corners.topRight)) {
        this.markerTopRight = L.marker([this.corners.topRight.lat, this.corners.topRight.lng])
        this.markerTopRight.addTo(this.map)
      }
      if (this.markerBottomLeft) {
        this.map.removeLayer(this.markerBottomLeft)
      }
      if (isLocationValid(this.corners.bottomLeft)) {
        this.markerBottomLeft = L.marker([this.corners.bottomLeft.lat, this.corners.bottomLeft.lng])
        this.markerBottomLeft.addTo(this.map)
      }
      if (this.markerBottomRight) {
        this.map.removeLayer(this.markerBottomRight)
      }
      if (isLocationValid(this.corners.bottomRight)) {
        this.markerBottomRight = L.marker([this.corners.bottomRight.lat, this.corners.bottomRight.lng])
        this.markerBottomRight.addTo(this.map)
      }

      if (isGeographyValid(this.corners)) {
        const data = trialLayoutToPlots(this.corners, this.layout.rows, this.layout.columns)

        const polygons = [].concat(...data)

        const geoJson = toGeoJson(polygons)
        this.geoJsonLayer = L.geoJSON(geoJson, {
          fillColor: '#00a0f1',
          color: '#00a0f1',
          weight: 1
        })
        this.geoJsonLayer.addTo(this.map)
      }
    },
    setGps: function (corner) {
      if (this.marker) {
        const latLng = this.marker.getLatLng()
        this.corners[corner] = {
          lat: latLng.lat,
          lng: latLng.lng
        }

        this.marker.closePopup()
      }
    },
    /**
     * Invalidates the map size on uncollapsing of the collapse element to fix display issues
     */
    invalidateSize: function () {
      this.$nextTick(() => {
        if (this.map) {
          this.map.invalidateSize()

          this.updateGrid()
        }
      })
    },
    /**
     * Returns the selected corner points
     */
    getCornerPoints: function () {
      return this.corners
    },
    update: function () {
      if (this.layout && this.layout.corners) {
        this.corners = JSON.parse(JSON.stringify(this.layout.corners))
      }
    },
    initMap: function () {
      this.map = L.map(this.$refs.map)

      this.map.setView([22.5937, 2.1094], 3)

      // Add OSM as the default
      const openstreetmap = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        id: 'OpenStreetMap',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 21,
        maxNativeZoom: 19
      })

      this.map.addLayer(openstreetmap)

      // Add an additional satellite layer
      const satellite = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        id: 'Esri WorldImagery',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 21,
        maxNativeZoom: 19
      })

      const baseMaps = {
        OpenStreetMap: openstreetmap,
        'Esri WorldImagery': satellite
      }

      L.control.layers(baseMaps).addTo(this.map)

      // Disable zoom until focus gained, disable when blur
      this.map.scrollWheelZoom.disable()
      this.map.on('focus', () => this.map.scrollWheelZoom.enable())
      this.map.on('blur', () => this.map.scrollWheelZoom.disable())
      this.map.on('click', e => {
        const latLng = e.latlng

        if (this.marker) {
          this.marker.setLatLng([latLng.lat, latLng.lng])
        } else {
          this.marker = L.marker([latLng.lat, latLng.lng])
          this.marker.addTo(this.map)
        }

        this.marker.bindPopup(this.$refs.popoverContent).openPopup()
      })
    }
  },
  mounted: function () {
    this.update()

    this.supportsGps = navigator.geolocation !== undefined && navigator.geolocation !== null

    this.initMap()
  }
}
</script>

<style>
.leaflet-popup-content-wrapper {
  border-radius: 0;
}
.leaflet-popup-content {
  line-height: 1em;
  height: auto !important;
  width: auto !important;
  min-width: 300px;
}
</style>
<style scoped>
.layout-map {
  height: 50vh;
}
</style>