import { action } from 'mobx'
import store from './store'

const ACTION = 'DATAINPUT'

export const update = action(`${ACTION}_UPDATE`, ({ value, computedFieldsValues }) => {
  store.value = { ...value }

  if (computedFieldsValues == null && store.computedFieldsValues == null) {
    return
  }

  if (Object.keys(computedFieldsValues.source).length === 0 || computedFieldsValues.order.length === 0) {
    store.computedFieldsValues = undefined
  } else {
    store.computedFieldsValues = { ...computedFieldsValues }
  }
})
