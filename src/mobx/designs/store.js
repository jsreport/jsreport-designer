import nanoid from 'nanoid'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { toJS, observable, computed } from 'mobx'

function setDefaults (instance, defaults) {
  if (!defaults) {
    return
  }

  Object.keys(defaults).forEach((name) => {
    instance[name] = defaults[name]
  })
}

// filter elements and order them in ASC
function getSortedElementsByType (type, elements) {
  let filteredElements = elements.filter((record) => {
    return record.element.elementType === type
  })

  if (type !== 'fragment') {
    filteredElements.sort((a, b) => a.index - b.index)
  }

  return filteredElements.map((record) => {
    let recordEntity = {
      id: record.element.id,
      element: record.element
    }

    if (record.index != null) {
      recordEntity.index = record.index
    }

    return recordEntity
  })
}

class Designs {
  // eslint-disable-next-line no-undef
  designs = observable.map({}, 'designs')
}

class Design {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable baseWidth = null
  // eslint-disable-next-line no-undef
  @observable defaultNumberOfRows = null
  // eslint-disable-next-line no-undef
  @observable numberOfCols = null
  // eslint-disable-next-line no-undef
  @observable rowHeight = null
  // eslint-disable-next-line no-undef
  @observable groups = []
  // eslint-disable-next-line no-undef
  @observable.ref selection = null
  // eslint-disable-next-line no-undef
  @observable.ref highlightedArea = null
  // eslint-disable-next-line no-undef
  canvasRegistry = observable.map({}, 'canvasRegistry')
  // eslint-disable-next-line no-undef
  @observable isDragging = false
  // eslint-disable-next-line no-undef
  @observable isResizing = false
  // eslint-disable-next-line no-undef
  @observable isCanvasReady = false
  // eslint-disable-next-line no-undef
  @observable gridLinesRemarked = false

  // eslint-disable-next-line no-undef
  @computed get colWidth () {
    return this.baseWidth / this.numberOfCols
  }

  // eslint-disable-next-line no-undef
  // just for debugging
  @computed get groupsInCanvasRegistry () {
    return getSortedElementsByType('group', this.canvasRegistry.values())
  }

  // eslint-disable-next-line no-undef
  // just for debugging
  @computed get itemsInCanvasRegistry () {
    return getSortedElementsByType('item', this.canvasRegistry.values())
  }

  // eslint-disable-next-line no-undef
  // just for debugging
  @computed get componentsInCanvasRegistry () {
    return getSortedElementsByType('component', this.canvasRegistry.values())
  }

  // eslint-disable-next-line no-undef
  // just for debugging
  @computed get fragmentsInCanvasRegistry () {
    return getSortedElementsByType('fragment', this.canvasRegistry.values())
  }

  toJS () {
    let design = {
      baseWidth: this.baseWidth,
      numberOfCols: this.numberOfCols,
      defaultNumberOfRows: this.defaultNumberOfRows,
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
      this.id = `D-${nanoid(7)}`
    }
  }
}

class DesignGroup {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable layoutMode = null
  // eslint-disable-next-line no-undef
  @observable topSpace = null
  // eslint-disable-next-line no-undef
  @observable items = []
  // eslint-disable-next-line no-undef
  @observable placeholder = null
  // eslint-disable-next-line no-undef
  @observable parent = null
  // eslint-disable-next-line no-undef
  @observable selected = false
  // eslint-disable-next-line no-undef
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
      this.id = `DG-${nanoid(7)}`
    }
  }
}

class DesignItem {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable leftSpace = null
  // eslint-disable-next-line no-undef
  @observable start = null
  // eslint-disable-next-line no-undef
  @observable end = null
  // eslint-disable-next-line no-undef
  @observable minSpace = null
  // eslint-disable-next-line no-undef
  @observable space = null
  // eslint-disable-next-line no-undef
  @observable components = []
  // eslint-disable-next-line no-undef
  @observable parent = null
  // eslint-disable-next-line no-undef
  @observable selected = false
  // eslint-disable-next-line no-undef
  @observable.ref resizing = null

  // eslint-disable-next-line no-undef
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

    if (this.minSpace != null) {
      item.minSpace = this.minSpace
    }

    item.components = this.components.map((comp) => {
      return comp.toJS()
    })

    return item
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DI-${nanoid(7)}`
    }
  }
}

class DesignComponent {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable type = null
  // eslint-disable-next-line no-undef
  @observable.ref props = null
  // eslint-disable-next-line no-undef
  @observable.ref bindings = null
  // eslint-disable-next-line no-undef
  @observable.ref expressions = null
  // eslint-disable-next-line no-undef
  @observable template = null
  // eslint-disable-next-line no-undef
  fragments = observable.map({}, 'fragments')
  // eslint-disable-next-line no-undef
  @observable parent = null
  // eslint-disable-next-line no-undef
  @observable selected = false

  get elementType () {
    return 'component'
  }

  toJS (includeId) {
    let comp = {}

    if (includeId === true) {
      comp.id = this.id
    }

    comp.type = this.type
    comp.props = this.props

    if (this.bindings != null) {
      comp.bindings = this.bindings
    }

    if (this.expressions != null) {
      comp.expressions = this.expressions
    }

    if (this.template != null) {
      comp.template = this.template
    }

    if (this.fragments.size > 0) {
      comp.fragments = this.fragments.values().reduce((acu, frag) => {
        acu[frag.name] = frag.toJS(includeId)
        return acu
      }, {})
    }

    return comp
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DC-${nanoid(7)}`
    }
  }
}

class DesignFragment {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable name = null
  // eslint-disable-next-line no-undef
  @observable type = null
  // eslint-disable-next-line no-undef
  @observable ownerType = null
  // eslint-disable-next-line no-undef
  @observable mode = null
  // eslint-disable-next-line no-undef
  @observable instances = []
  // eslint-disable-next-line no-undef
  fragments = observable.map({}, 'fragments')
  // eslint-disable-next-line no-undef
  @observable parent = null
  // eslint-disable-next-line no-undef
  @observable selected = false

  get elementType () {
    return 'fragment'
  }

  generalToJS (includeId) {
    let frag = {}

    if (includeId === true) {
      frag.id = this.id
      frag.name = this.name
      frag.type = this.type
      frag.ownerType = this.ownerType
    }

    frag.mode = this.mode

    if (this.fragments.size > 0) {
      frag.fragments = this.fragments.values().reduce((acu, currentFrag) => {
        acu[currentFrag.name] = currentFrag.toJS(includeId)
        return acu
      }, {})
    }

    if (includeId === true) {
      frag.instances = this.instances.map((ins) => {
        return ins.toJS(includeId)
      })
    }

    return frag
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      this.id = `DF-${nanoid(7)}`
    }
  }
}

class DesignFragmentInline extends DesignFragment {
  // eslint-disable-next-line no-undef
  @observable.ref props = null

  toJS (includeId) {
    debugger
    const frag = this.generalToJS(includeId)

    frag.props = this.props

    return frag
  }
}

class DesignFragmentComponent extends DesignFragment {
  // eslint-disable-next-line no-undef
  @observable components = []

  toJS (includeId) {
    debugger
    const frag = this.generalToJS(includeId)

    frag.components = this.components.map((comp) => {
      return comp.toJS(includeId)
    })

    return frag
  }
}

class DesignFragmentInstance {
  // eslint-disable-next-line no-undef
  @observable id = null
  // eslint-disable-next-line no-undef
  @observable tag = null
  // eslint-disable-next-line no-undef
  @observable sketch = null
  // eslint-disable-next-line no-undef
  @observable.ref template = null
  // eslint-disable-next-line no-undef
  @observable style = null
  // eslint-disable-next-line no-undef
  @observable fragmentId = null

  get elementType () {
    return 'fragmentInstance'
  }

  toJS (includeId) {
    let ins = {}

    if (includeId === true) {
      ins.id = this.id
    }

    ins.tag = this.tag

    if (this.sketch != null) {
      ins.sketch = this.sketch
    }

    if (this.template != null) {
      ins.template = this.template
    }

    return ins
  }

  constructor (defaults) {
    setDefaults(this, defaults)

    if (this.id == null) {
      throw new Error('Fragment instance must have an id')
    }
  }
}

let store = new Designs()

export {
  Design,
  DesignGroup,
  DesignItem,
  DesignComponent,
  DesignFragmentInline,
  DesignFragmentComponent,
  DesignFragmentInstance
}

export default store
