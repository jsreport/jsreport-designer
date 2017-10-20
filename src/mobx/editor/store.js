import { observable } from 'mobx'

class Editor {
  @observable defaultBaseWidth = null
  @observable defaultRowHeight = null
  @observable defaultNumberOfRows = null
  @observable defaultNumberOfCols = null
  @observable defaultLayoutMode = null
  @observable currentDesign = null
}

let store = new Editor()

export { Editor }
export default store
