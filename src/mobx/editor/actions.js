import { action } from 'mobx'
import { store as designsStore } from '../designs'
import store from './store'

const ACTION = 'EDITOR'

export const openDesign = action(`${ACTION}_OPEN_DESIGN`, (designId) => {
  if (!designsStore.designs.has(designId)) {
    return
  }

  store.currentDesign = designsStore.designs.get(designId)
})

export const update = action(`${ACTION}_UPDATE`, (changes) => {
  // TODO: check here to only update observable properties?
  Object.keys(changes).forEach((key) => { store[key] = changes[key] })
})
