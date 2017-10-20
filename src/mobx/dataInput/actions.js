import { action } from 'mobx'
import store from './store'

const ACTION = 'DATAINPUT'

export const update = action(`${ACTION}_UPDATE`, (newDataObj) => {
  store.value = {
    ...newDataObj
  }
})
