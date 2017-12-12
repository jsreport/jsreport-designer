import { action } from 'mobx'
import { store as editorStore, actions as editorActions } from './editor'
import { store as designsStore, actions as designsActions } from './designs'
import { store as dataInputStore, actions as dataInputActions } from './dataInput'

const setDefaultsForStores = action((stores, defaults) => {
  if (!stores || !defaults) {
    return
  }

  // initializing defaults for stores
  Object.keys(defaults).forEach((storeName) => {
    const currentStore = stores[storeName]
    const defaultsForCurrentStore = defaults[storeName]

    if (!currentStore || !defaultsForCurrentStore) {
      return
    }

    Object.keys(defaultsForCurrentStore).forEach((key) => {
      currentStore[key] = defaultsForCurrentStore[key]
    })
  })
})

export default function createStores (defaults) {
  const stores = {
    editorStore,
    designsStore,
    dataInputStore
  }

  const actions = {
    editorActions,
    designsActions,
    dataInputActions
  }

  setDefaultsForStores(stores, defaults)

  return {
    stores,
    actions
  }
}
