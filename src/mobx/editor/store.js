// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observable } from 'mobx'

class Editor {
  // eslint-disable-next-line no-undef
  @observable defaultBaseWidth = null
  // eslint-disable-next-line no-undef
  @observable defaultRowHeight = null
  // eslint-disable-next-line no-undef
  @observable defaultNumberOfRows = null
  // eslint-disable-next-line no-undef
  @observable defaultNumberOfCols = null
  // eslint-disable-next-line no-undef
  @observable defaultLayoutMode = null
  // eslint-disable-next-line no-undef
  @observable currentDesign = null
  // eslint-disable-next-line no-undef
  @observable.ref apiError = null
}

let store = new Editor()

export { Editor }
export default store
