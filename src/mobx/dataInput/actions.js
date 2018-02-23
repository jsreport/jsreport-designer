import { action } from 'mobx'
import store from './store'

const ACTION = 'DATAINPUT'

export const update = action(`${ACTION}_UPDATE`, ({ value, computedFields }) => {
  if (value != null) {
    store.value = Array.isArray(value) ? [ ...value ] : { ...value }
  }

  if (computedFields == null && store.computedFields == null) {
    return
  }

  store.computedFields = [ ...computedFields ]
})
