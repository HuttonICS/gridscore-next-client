import { i18n } from '@/plugins/i18n.js'
import { getId } from '@/plugins/id'
import { trialLayoutToPlots } from '@/plugins/location'
import store from '@/store'

const categoryColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

/**
 * For the given trait, return the i18n text
 * @param trait The trait for which to return the text
 */
const getTraitTypeText = (trait, short = false) => {
  switch (trait.dataType) {
    case 'date':
      return i18n.t(short ? 'traitTypeShortDate' : 'traitTypeDate')
    case 'int':
      return i18n.t(short ? 'traitTypeShortInt' : 'traitTypeInt')
    case 'float':
      return i18n.t(short ? 'traitTypeShortFloat' : 'traitTypeFloat')
    case 'text':
      return i18n.t(short ? 'traitTypeShortText' : 'traitTypeText')
    case 'categorical':
      return i18n.t(short ? 'traitTypeShortCategorical' : 'traitTypeCategorical')
    default:
      return null
  }
}

const downloadText = (text, filename) => {
  const downloadLink = document.createElement('a')
  downloadLink.href = text
  downloadLink.target = '_blank'
  downloadLink.rel = 'noopener noreferrer'
  if (filename) {
    downloadLink.download = filename
  }
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

const padZerosTo = (str, length) => {
  while (str.length < length) {
    str = '0' + str
  }

  return str
}

const toLocalDateString = (date = null) => {
  const d = date === null ? new Date() : new Date(date)
  const month = padZerosTo('' + (d.getMonth() + 1), 2)
  const day = padZerosTo('' + d.getDate(), 2)
  const year = d.getFullYear()

  return [year, month, day].join('-')
}

const toLocalDateTimeString = (str) => {
  const date = toLocalDateString(str)
  const d = new Date(str)

  const hours = padZerosTo('' + d.getHours(), 2)
  const minutes = padZerosTo('' + d.getMinutes(), 2)
  const seconds = padZerosTo('' + d.getSeconds(), 2)

  const time = [hours, minutes, seconds].join('-')

  return date + '_' + time
}

const migrateOldGridScoreTrial = (old) => {
  return new Promise((resolve, reject) => {
    const converted = {
      name: old.name,
      description: 'GridScore trial imported from old version on: ' + (new Date().toLocaleDateString()),
      comments: (old.comment !== undefined && old.comment !== null && old.comment !== '') ? [{ content: old.comment, timestamp: new Date().toISOString() }] : [],
      traits: old.traits.map(t => {
        return {
          name: t.name,
          dataType: t.type,
          allowRepeats: t.mType === 'multi',
          setSize: 1,
          restrictions: t.restrictions,
          id: getId()
        }
      }),
      layout: {
        rows: old.rows,
        columns: old.cols
      },
      data: {}
    }

    let plotCorners = null

    if (old.cornerPoints && old.cornerPoints.length === 4 && old.cornerPoints.filter(c => c !== null).length === 4) {
      converted.layout.corners = {
        topLeft: {
          lat: old.cornerPoints[3][0],
          lng: old.cornerPoints[3][1]
        },
        topRight: {
          lat: old.cornerPoints[2][0],
          lng: old.cornerPoints[2][1]
        },
        bottomRight: {
          lat: old.cornerPoints[1][0],
          lng: old.cornerPoints[1][1]
        },
        bottomLeft: {
          lat: old.cornerPoints[0][0],
          lng: old.cornerPoints[0][1]
        }
      }

      plotCorners = trialLayoutToPlots(converted.layout.corners, converted.layout.rows, converted.layout.columns)
    }

    if (old.markers) {
      converted.layout.markers = {
        everyColumn: old.markers.everyCol,
        everyRow: old.markers.everyRow,
        anchor: null
      }

      switch (old.markers.corner) {
        case 'topleft':
          converted.layout.markers.anchor = 'topLeft'
          break
        case 'topright':
          converted.layout.markers.anchor = 'topRight'
          break
        case 'bottomright':
          converted.layout.markers.anchor = 'bottomRight'
          break
        case 'bottomleft':
          converted.layout.markers.anchor = 'bottomLeft'
          break
      }
    }

    if (old.brapiConfig) {
      converted.brapiConfig = old.brapiConfig
    }

    for (let y = 0; y < old.rows; y++) {
      for (let x = 0; x < old.cols; x++) {
        const cell = old.data[y][x]

        if (cell) {
          const newCell = {
            germplasm: cell.name,
            measurements: {},
            geography: {}
          }

          if (cell.isMarked) {
            newCell.isMarked = true
          }
          if (cell.rep) {
            newCell.rep = cell.rep
          } else {
            newCell.rep = null
          }

          converted.traits.forEach(t => {
            const oldIndex = old.traits.findIndex(ot => ot.name === t.name)
            newCell.measurements[t.id] = []

            const values = cell.values[oldIndex]
            const dates = cell.dates[oldIndex]

            if (Array.isArray(values)) {
              for (let i = 0; i < values.length; i++) {
                if (values[i] === undefined || values[i] === null || values[i] === '') {
                  continue
                }

                newCell.measurements[t.id].push({
                  values: t.dataType === 'categorical' ? [t.restrictions.categories.indexOf(values[i])] : [values[i]],
                  timestamp: new Date(dates[i]).toISOString()
                })
              }
            } else {
              if (values !== undefined && values !== null && values !== '') {
                newCell.measurements[t.id].push({
                  values: t.dataType === 'categorical' ? [t.restrictions.categories.indexOf(values)] : [values],
                  timestamp: new Date(dates).toISOString()
                })
              }
            }
          })

          if (cell.geolocation && cell.geolocation.lat !== undefined && cell.geolocation.lat !== null && cell.geolocation.lng !== undefined && cell.geolocation.lng !== null) {
            newCell.geography.center = {
              lat: cell.geolocation.lat,
              lng: cell.geolocation.lng
            }
          }

          if (plotCorners) {
            newCell.geography.corners = plotCorners[y][x]
          }

          if (cell.comment && cell.comment !== '') {
            newCell.comments = [{
              content: cell.comment,
              timestamp: new Date().toISOString()
            }]
          }

          converted.data[`${y}|${x}`] = newCell
        }
      }
    }

    converted.createdOn = new Date().toISOString()
    converted.updatedOn = new Date().toISOString()

    resolve(converted)
  })
}

const isOffline = () => 'onLine' in navigator && !navigator.onLine

const checkDataMatchesTraitType = (trait, value, checkDatesAndCategories = true) => {
  const trimmed = (typeof value === 'string') ? value.trim() : value

  if (trait.dataType === 'int' || trait.dataType === 'float') {
    try {
      const int = Number(trimmed)
      if (isNaN(trimmed) || isNaN(int) || (trait.dataType === 'int' && !Number.isInteger(int))) {
        return false
      }

      const r = trait.restrictions

      if (r) {
        if (r.min !== undefined && r.min !== null) {
          if (value < r.min) {
            return false
          }
        }
        if (r.max !== undefined && r.max !== null) {
          if (value > r.max) {
            return false
          }
        }
      }
    } catch (err) {
      return false
    }
  } else if (trait.dataType === 'categorical' && trait.restrictions && trait.restrictions.categories && checkDatesAndCategories) {
    return trait.restrictions.categories.includes(value)
  } else if (trait.dataType === 'date' && checkDatesAndCategories) {
    return isValidDateString(value)
  }

  return true
}

const isValidDateString = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/
  if (!dateString.match(regEx)) {
    // Invalid format
    return false
  }
  const d = new Date(dateString)
  const dNum = d.getTime()
  if (!dNum && dNum !== 0) {
    // NaN value, Invalid date
    return false
  }
  return d.toISOString().slice(0, 10) === dateString
}

/**
 * Formats the given value into a human-readable number (e.g. 1.000 -> 1K, 1.000.000 -> 1G)
 * @param {Number} value The value to format
 * @param {Number} decimals The decimal places
 * @param {Number} k The thousand value (e.g. 1000 or 1024)
 * @param {String} separator The separator between the number and the letter
 */
const getNumberWithSuffix = (value, decimals = 2, k = 1000, separator = '') => {
  if (value === undefined || value === null || value === 0) {
    return '0'
  }

  // Check if advanced number formatting is available
  if ('Intl' in window && Intl.NumberFormat) {
    const locale = (store.getters.storeLocale || 'en_GB').replace('_', '-')
    let formatter
    if (k === 1024) {
      // Handle byte values
      const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte']
      let size = Math.abs(Number(value))
      let u = 0
      while (size >= 1024 && u < UNITS.length - 1) {
        size /= 1024
        ++u
      }
      formatter = Intl.NumberFormat(locale, { style: 'unit', unit: UNITS[u], unitDisplay: 'short', maximumFractionDigits: decimals })
      value = size
    } else {
      // Handle regular numeric values
      formatter = Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: decimals })
    }

    return formatter.format(value)
  } else {
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
    const i = Math.floor(Math.log(value) / Math.log(k))

    return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + separator + sizes[i]
  }
}

export {
  getTraitTypeText,
  downloadText,
  toLocalDateString,
  toLocalDateTimeString,
  migrateOldGridScoreTrial,
  isOffline,
  checkDataMatchesTraitType,
  isValidDateString,
  categoryColors,
  getNumberWithSuffix
}
