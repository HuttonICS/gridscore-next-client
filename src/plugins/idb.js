import { openDB } from 'idb'
import { getId } from '@/plugins/id'
import store from '@/store'

let db

const getDb = async () => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db)
    } else {
      openDB('gridscore-next-' + window.location.pathname, 1, {
        upgrade: function (db, oldVersion, newVersion, transaction) {
          let trials
          let data
          let transactions
          if (oldVersion === undefined || oldVersion < 1) {
            trials = db.createObjectStore('trials', { keyPath: 'localId', autoIncrement: false })
            trials.createIndex('shareCodes', 'shareCodes', { unique: false })
            trials.createIndex('name', 'name', { unique: false })
            trials.createIndex('description', 'description', { unique: false })
            trials.createIndex('layout', 'layout', { unique: false })
            trials.createIndex('traits', 'traits', { unique: false })
            trials.createIndex('brapiConfig', 'brapiConfig', { unique: false })
            trials.createIndex('createdOn', 'createdOn', { unique: false })
            trials.createIndex('updatedOn', 'updatedOn', { unique: false })
            trials.createIndex('lastSyncedOn', 'lastSyncedOn', { unique: false })
            trials.createIndex('comments', 'comments', { unique: false })

            data = db.createObjectStore('data', { keyPath: ['trialId', 'row', 'column'] })
            data.createIndex('trialId', 'trialId', { unique: false })
            data.createIndex('row', 'row', { unique: false })
            data.createIndex('column', 'column', { unique: false })
            data.createIndex('germplasm', 'germplasm', { unique: false })
            data.createIndex('rep', 'rep', { unique: false })
            data.createIndex('brapiId', 'brapiId', { unique: false })
            data.createIndex('measurements', 'measurements', { unique: false })
            data.createIndex('geography', 'geography', { unique: false })
            data.createIndex('comments', 'comments', { unique: false })
            data.createIndex('isMarked', 'isMarked', { unique: false })

            transactions = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true })
            transactions.createIndex('trialId', 'trialId', { unique: false })
            transactions.createIndex('operation', 'operation', { unique: false })
            transactions.createIndex('trialId-operation-timestamp', ['trialId', 'operation', 'timestamp'], { unique: false })
            transactions.createIndex('content', 'content', { unique: false })
            transactions.createIndex('timestamp', 'timestamp', { unique: false })
          }
        }
      }).then(db => resolve(db))
    }
  })
}

const getTrials = async () => {
  const db = await getDb()

  return db.getAll('trials')
    .then(trials => {
      if (trials) {
        trials.forEach(trial => {
          if (trial) {
            if (trial.traits) {
              trial.traits.forEach((t, i) => {
                t.color = store.getters.storeTraitColors[i % store.getters.storeTraitColors.length]
              })
            }

            if (trial.shareCodes) {
              trial.editable = (trial.shareCodes.ownerCode !== undefined && trial.shareCodes.ownerCode !== null) || (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null)
            } else {
              trial.editable = true
            }
          }
        })
      }

      return trials
    })
}

const updateTrial = async (localId, updatedTrial) => {
  const trial = await getTrialById(localId)

  if (trial) {
    const db = await getDb()
    return db.put('trials', updatedTrial)
  } else {
    return new Promise(resolve => resolve())
  }
}

const updateTrialBrapiConfig = async (localId, brapiConfig) => {
  const trial = await getTrialById(localId)

  if (trial) {
    trial.brapiConfig = brapiConfig
    const db = await getDb()
    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve())
  }
}

const getTrialById = async (localId) => {
  const db = await getDb()

  return db.get('trials', localId)
    .then(trial => {
      if (trial) {
        if (trial.traits) {
          trial.traits.forEach((t, i) => {
            t.color = store.getters.storeTraitColors[i % store.getters.storeTraitColors.length]
          })
        }

        if (trial.shareCodes) {
          trial.editable = (trial.shareCodes.ownerCode !== undefined && trial.shareCodes.ownerCode !== null) || (trial.shareCodes.editorCode !== undefined && trial.shareCodes.editorCode !== null)
        } else {
          trial.editable = true
        }
      }

      if (trial) {
        store.dispatch('setBrapiConfig', trial.brapiConfig)
      }

      return trial
    })
}

const deleteTrial = async (localId) => {
  const db = await getDb()

  const trial = await getTrialById(localId)

  if (trial) {
    return db.delete('trials', localId)
      .then(() => {
        const range = IDBKeyRange.bound([localId, 0, 0], [localId, trial.layout.rows, trial.layout.columns])
        return db.delete('data', range)
      })
      .then(() => {
        db.transaction('transactions', 'readwrite').store.index('trialId').openCursor(IDBKeyRange.only(localId))
          .then(async (cursor) => {
            while (cursor) {
              cursor.delete()
              cursor = await cursor.continue()
            }
          })

        return new Promise(resolve => resolve())
      })
  } else {
    return new Promise(resolve => resolve())
  }
}

const addTrial = async (trial) => {
  const db = await getDb()

  const id = trial.localId || getId()

  await db.add('trials', {
    localId: id,
    shareCodes: trial.shareCodes,
    name: trial.name,
    description: trial.description,
    layout: trial.layout,
    traits: trial.traits,
    brapiConfig: trial.brapiConfig,
    createdOn: trial.createdOn || new Date().toISOString(),
    updatedOn: trial.updatedOn || new Date().toISOString(),
    lastSyncedOn: trial.lastSyncedOn,
    comments: trial.comments || []
  })

  return new Promise(resolve => {
    const tx = db.transaction('data', 'readwrite')

    const allData = []

    Object.keys(trial.data).forEach(k => {
      const [row, column] = k.split('|').map(c => +c)
      const cell = trial.data[k]

      allData.push({
        trialId: id,
        row: row,
        column: column,
        germplasm: cell.germplasm,
        rep: cell.rep,
        brapiId: cell.brapiId,
        measurements: cell.measurements,
        geography: cell.geography,
        comments: cell.comments,
        isMarked: cell.isMarked
      })
    })

    Promise.all(allData.map(cell => tx.store.add(cell)))
      .then(() => {
        resolve(id)
        return tx.done
      })
  })
}

const getCell = async (trialId, row, column) => {
  const db = await getDb()

  return db.get('data', [trialId, row, column])
    .then(c => {
      let displayName = c.germplasm

      if (c.rep) {
        displayName += '-' + c.rep
      }

      c.displayName = displayName

      return c
    })
}

const getTrialData = async (trialId) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()
    const range = IDBKeyRange.bound([trialId, 0, 0], [trialId, trial.layout.rows, trial.layout.columns])
    return db.getAll('data', range)
      .then(grid => {
        const result = {}
        if (grid) {
          grid.forEach(c => {
            let displayName = c.germplasm

            if (c.rep) {
              displayName += '-' + c.rep
            }

            c.displayName = displayName

            result[`${c.row}|${c.column}`] = c
          })
        }
        return result
      })
  } else {
    return new Promise(resolve => resolve({}))
  }
}

const deleteTrialComment = async (trialId, comment) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    trial.comments = trial.comments.filter(c => c.timestamp !== comment.timestamp && c.content !== comment.content)
    trial.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      let cursor = await db.transaction('transactions', 'readwrite').store.index('trialId-operation-timestamp').openCursor([trialId, 'TRIAL_COMMENT_ADDED', comment.timestamp])

      let matchFound = false
      while (cursor) {
        if (cursor.value.content.content === comment.content) {
          cursor.delete()
          matchFound = true
        }
        cursor = await cursor.continue()
      }

      if (!matchFound) {
        const transaction = {
          trialId: trial.localId,
          operation: 'TRIAL_COMMENT_DELETED',
          content: comment,
          timestamp: new Date().toISOString()
        }

        await db.put('transactions', transaction)
      }
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

const addTrialTraits = async (trialId, traits) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = {
        trialId: trialId,
        operation: 'TRIAL_TRAITS_ADDED',
        content: traits,
        timestamp: new Date().toISOString()
      }

      await db.put('transactions', transaction)
    }

    traits.forEach(t => {
      trial.traits.push(t)
    })
    trial.updatedOn = new Date().toISOString()

    await db.put('trials', trial)

    let cursor = await db.transaction('data', 'readwrite').store.openCursor(IDBKeyRange.bound([trial.localId, 0, 0], [trial.localId, trial.layout.rows, trial.layout.columns]))

    while (cursor) {
      if (cursor.value && cursor.value.measurements) {
        traits.forEach(t => {
          cursor.value.measurements[t.id] = []
        })

        cursor = await cursor.continue()
      }
    }

    return new Promise(resolve => resolve(trial))
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

const addTrialComment = async (trialId, commentContent) => {
  const trial = await getTrialById(trialId)

  if (trial) {
    if (!trial.comments) {
      trial.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString()
    }

    trial.comments.push(newComment)
    trial.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const transaction = {
        trialId: trialId,
        operation: 'TRIAL_COMMENT_ADDED',
        content: newComment,
        timestamp: newComment.timestamp
      }

      await db.put('transactions', transaction)
    }

    return db.put('trials', trial)
  } else {
    return new Promise(resolve => resolve(trial))
  }
}

const setPlotMarked = async (trialId, row, column, isMarked) => {
  const trial = await getTrialById(trialId)
  const cell = await getCell(trialId, row, column)

  if (trial && cell) {
    if (isMarked) {
      cell.isMarked = isMarked
    } else {
      delete cell.isMarked
    }
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      let cursor = await db.transaction('transactions', 'readwrite').store.index('trialId-operation-timestamp').openCursor(IDBKeyRange.bound([trialId, 'PLOT_MARKED_CHANGED', '1990-01-01T00:00:00.000Z'], [trialId, 'PLOT_MARKED_CHANGED', '2999-12-31T23:59:59.999Z']))

      let matchFound = false
      while (cursor) {
        // Search for any match based on row and column, because this is a boolean flag
        if (cursor.value.content.row === row && cursor.value.content.column === column) {
          cursor.delete()
          matchFound = true
        }
        cursor = await cursor.continue()
      }

      if (!matchFound) {
        const transaction = {
          trialId: trialId,
          operation: 'PLOT_MARKED_CHANGED',
          content: {
            row: cell.row,
            column: cell.column,
            isMarked: isMarked
          },
          timestamp: cell.updatedOn
        }

        await db.put('transactions', transaction)
      }
    }

    return db.put('data', cell)
  }
}

const deletePlotComment = async (trialId, row, column, comment) => {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    cell.comments = cell.comments.filter(c => c.timestamp !== comment.timestamp && c.content !== comment.content)
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const copy = JSON.parse(JSON.stringify(comment))
      copy.row = row
      copy.column = column

      let cursor = await db.transaction('transactions', 'readwrite').store.index('trialId-operation-timestamp').openCursor([trialId, 'PLOT_COMMENT_ADDED', comment.timestamp])

      let matchFound = false
      while (cursor) {
        if (cursor.value.content.content === comment.content) {
          cursor.delete()
          matchFound = true
        }
        cursor = await cursor.continue()
      }

      if (!matchFound) {
        const transaction = {
          trialId: trialId,
          operation: 'PLOT_COMMENT_DELETED',
          content: copy,
          timestamp: new Date().toISOString()
        }

        await db.put('transactions', transaction)
      }
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve(cell))
  }
}

const addPlotComment = async (trialId, row, column, commentContent) => {
  const cell = await getCell(trialId, row, column)
  const trial = await getTrialById(trialId)

  if (trial && cell) {
    if (!cell.comments) {
      cell.comments = []
    }

    const newComment = {
      content: commentContent,
      timestamp: new Date().toISOString()
    }

    cell.comments.push(newComment)
    cell.updatedOn = new Date().toISOString()
    const db = await getDb()

    if (logTransactions(trial)) {
      const copy = JSON.parse(JSON.stringify(newComment))
      copy.row = row
      copy.column = column

      const transaction = {
        trialId: trialId,
        operation: 'PLOT_COMMENT_ADDED',
        content: copy,
        timestamp: newComment.timestamp
      }

      await db.put('transactions', transaction)
    }

    return db.put('data', cell)
  } else {
    return new Promise(resolve => resolve(cell))
  }
}

const logTransactions = (trial) => {
  if (!trial || !trial.shareCodes || (Object.keys(trial.shareCodes).length < 1)) {
    return false
  } else {
    return true
  }
}

export {
  getDb,
  getCell,
  getTrials,
  getTrialById,
  getTrialData,
  deleteTrial,
  addTrial,
  deleteTrialComment,
  deletePlotComment,
  addPlotComment,
  addTrialComment,
  setPlotMarked,
  updateTrial,
  updateTrialBrapiConfig,
  addTrialTraits
}
