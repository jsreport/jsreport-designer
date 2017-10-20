import shortid from 'shortid'
import { observable, computed } from 'mobx'

function setDefaults (instance, defaults) {
  if (!defaults) {
    return
  }

  Object.keys(defaults).forEach((name) => instance[name] = defaults[name])
}

// filter elements and order them in ASC
function getSortedElementsByType (type, elements) {
  let filteredElements = elements.filter((record) => {
    return record.element.elementType === type
  })

  filteredElements.sort((a, b) => a.index - b.index)

  return filteredElements.map((record) => ({
    id: record.element.id,
    index: record.index,
    element: record.element
  }))
}

class Designs {
  designs = observable.map({}, 'designs')
}

class Design {
  @observable id = null
  @observable baseWidth = null
  @observable numberOfRows = null
  @observable numberOfCols = null
  @observable rowHeight = null
  @observable groups = []
  @observable.ref selection = null
  @observable.ref highlightedArea = null
  canvasRegistry = observable.map({}, 'canvasRegistry')
  @observable isResizing = false
  @observable isCanvasReady = false
  @observable gridLinesRemarked = false

  @computed get colWidth () {
    return this.baseWidth / this.numberOfCols
  }

  // just for debugging
  @computed get groupsInCanvasRegistry () {
    return getSortedElementsByType('group', this.canvasRegistry.values())
  }

  // just for debugging
  @computed get itemsInCanvasRegistry () {
    return getSortedElementsByType('item', this.canvasRegistry.values())
  }

  // just for debugging
  @computed get componentsInCanvasRegistry () {
    return getSortedElementsByType('component', this.canvasRegistry.values())
  }

  toJS () {
    let design = {
      baseWidth: this.baseWidth,
      numberOfCols: this.numberOfCols,
      rowHeight: this.rowHeight
    }

    design.groups = this.groups.map((group) => {
      return group.toJS()
    })

    return design
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `D-${shortid.generate()}`
    }
  }
}

class DesignGroup {
  @observable id = null
  @observable layoutMode = null
  @observable topSpace = null
  @observable items = []
  @observable placeholder = null
  @observable parent = null
  @observable selected = false
  @observable itemsRemarked = false

  get elementType () {
    return 'group'
  }

  toJS () {
    let group = {
      layoutMode: this.layoutMode
    }

    if (this.topSpace != null) {
      group.topSpace = this.topSpace
    }

    group.items = this.items.map((item) => {
      return item.toJS()
    })

    return group
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DG-${shortid.generate()}`
    }
  }
}

class DesignItem {
  @observable id = null
  @observable leftSpace = null
  @observable start = null
  @observable end = null
  @observable minSpace = null
  @observable space = null
  @observable components = []
  @observable parent = null
  @observable selected = false
  @observable.ref resizing = null

  @computed get isResizing () {
    return this.resizing != null
  }

  get elementType () {
    return 'item'
  }

  toJS () {
    let item = {}

    if (this.leftSpace != null) {
      item.leftSpace = this.leftSpace
    }

    item.space = this.space

    item.components = this.components.map((comp) => {
      return comp.toJS()
    })

    return item
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DI-${shortid.generate()}`
    }
  }
}

class DesignComponent {
  @observable id = null
  @observable type = null
  @observable.ref props = null
  @observable.ref bindings = null
  @observable template = null
  @observable parent = null
  @observable selected = false

  get elementType () {
    return 'component'
  }

  toJS () {
    let comp = {
      id: this.id,
      type: this.type,
      props: this.props
    }

    if (this.bindings != null) {
      comp.bindings = this.bindings
    }

    if (this.template != null) {
      comp.template = this.template
    }

    return comp
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DC-${shortid.generate()}`
    }
  }
}

let store = new Designs()

export { Design, DesignGroup, DesignItem, DesignComponent }
export default store
