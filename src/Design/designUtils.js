import shortid from 'shortid'

const DEFAULT_LAYOUT_MODE = 'grid'

function getConsumedColsFromWidth ({ baseColWidth, width }) {
  return Math.ceil(
    width < baseColWidth ? 1 : width / baseColWidth
  )
}

function generateDesignGroup ({ items, layoutMode, topSpace } = {}) {
  let newGroup = {
    id: 'DG-' + shortid.generate(),
    items: items != null ? items : [],
    layoutMode: layoutMode != null ? layoutMode : DEFAULT_LAYOUT_MODE
  }

  if (topSpace != null) {
    newGroup.topSpace = topSpace
  }

  return newGroup
}

function generateDesignGroups ({ numberOfRows }) {
  let groups = []

  for (let i = 0; i < numberOfRows; i++) {
    groups.push(generateDesignGroup())
  }

  return groups
}

function generateDesignItem ({
  colWidth,
  layoutMode,
  start,
  end,
  minSpace,
  components = [],
  baseSize
}) {
  let space
  let currentMinSpace

  if (minSpace != null) {
    if (layoutMode === 'grid') {
      currentMinSpace = minSpace
    } else {
      currentMinSpace = Math.ceil(minSpace)
    }
  }

  if (layoutMode === 'grid') {
    space = (end - start) + 1

    if (currentMinSpace == null) {
      currentMinSpace = space
    }
  } else {
    space = ((end - start) + 1) * colWidth

    if (currentMinSpace == null) {
      currentMinSpace = Math.ceil(baseSize.width)
    }
  }

  return {
    id: 'DI-' + shortid.generate(),
    start,
    end,
    minSpace: currentMinSpace,
    space,
    components: components
  }
}

function updateDesignItem ({
  designGroups,
  referenceGroup,
  referenceItem,
  current
}) {
  let newDesignGroup
  let newDesignItem
  let nextDesignItem
  let currentDesignItem

  newDesignGroup = {
    ...designGroups[referenceGroup]
  }

  currentDesignItem = newDesignGroup.items[referenceItem]

  newDesignItem = {
    ...newDesignGroup.items[referenceItem]
  }

  nextDesignItem = newDesignGroup.items[referenceItem + 1]

  if (newDesignGroup.layoutMode === 'grid') {
    newDesignItem.start = current.start
    newDesignItem.end = current.end
    newDesignItem.space = (current.end - current.start) + 1

    if (currentDesignItem.start !== current.start) {
      newDesignItem.leftSpace = newDesignItem.leftSpace == null ? 0 : newDesignItem.leftSpace
      newDesignItem.leftSpace += (current.start - currentDesignItem.start)
    }
  }

  if (nextDesignItem) {
    if (current.end !== currentDesignItem.end) {
      nextDesignItem = { ...nextDesignItem }
      nextDesignItem.leftSpace = nextDesignItem.leftSpace == null ? 0 : nextDesignItem.leftSpace
      nextDesignItem.leftSpace += (currentDesignItem.end - current.end)
    }

    newDesignGroup.items = [
      ...newDesignGroup.items.slice(0, referenceItem),
      newDesignItem,
      nextDesignItem,
      ...newDesignGroup.items.slice(referenceItem + 2)
    ]
  } else {
    newDesignGroup.items = [
      ...newDesignGroup.items.slice(0, referenceItem),
      newDesignItem,
      ...newDesignGroup.items.slice(referenceItem + 1)
    ]
  }

  return [
    ...designGroups.slice(0, referenceGroup),
    newDesignGroup,
    ...designGroups.slice(referenceGroup + 1)
  ]
}

function addComponentToDesign (component, {
  baseWidth,
  emptyGroupHeight,
  numberOfCols,
  componentsInfo,
  componentSize,
  designGroups,
  referenceGroup,
  area
}) {
  let layoutMode = designGroups[referenceGroup].layoutMode
  let colWidth = baseWidth / numberOfCols
  let compProps = component.props || {}
  let componentMinSpace
  let currentGroup
  let newComponent
  let newDesignGroups
  let newComponentsInfo
  let newComponentInfo = {}
  let placeholderGroupIndex

  // get placeholder group (last one)
  if (designGroups.length > 0 && designGroups[designGroups.length - 1].placeholder === true) {
    placeholderGroupIndex = designGroups.length - 1
  }

  newComponentsInfo = {
    ...componentsInfo
  }

  // component information
  if (component.id != null) {
    newComponent = {
      ...component,
      props: compProps
    }
  } else {
    newComponent = {
      ...component,
      id: 'DC-' + shortid.generate(),
      props: compProps
    }
  }

  if (layoutMode === 'grid') {
    componentMinSpace = (area.end - area.start) + 1
  } else {
    componentMinSpace = Math.ceil(componentSize.width)
  }

  // check to see if we should create a new group or update an existing one
  if (placeholderGroupIndex != null && placeholderGroupIndex === referenceGroup) {
    let newItem
    let leftSpaceBeforeItem

    // creating new item with component
    newItem = generateDesignItem({
      colWidth,
      layoutMode,
      start: area.start,
      end: area.end,
      minSpace: area.minSpace,
      components: [newComponent],
      baseSize: componentSize
    })

    if (layoutMode === 'grid') {
      leftSpaceBeforeItem = area.start
    } else {
      leftSpaceBeforeItem = area.start * colWidth
    }

    if (leftSpaceBeforeItem > 0) {
      newItem.leftSpace = leftSpaceBeforeItem
    }

    // creating a new group with item
    currentGroup = generateDesignGroup({
      layoutMode,
      items: [newItem]
    })

    newComponentInfo.index = 0
    newComponentInfo.groupId = currentGroup.id
    newComponentInfo.groupIndex = referenceGroup
    newComponentInfo.itemId = newItem.id
    newComponentInfo.itemIndex = 0

    // adding group before placeholder
    newDesignGroups = [
      ...designGroups.slice(0, -1),
      currentGroup,
      ...designGroups.slice(-1)
    ]
  } else {
    let currentItem
    let itemBeforeNewIndex
    let itemAfterNewIndex
    let componentInExistingItemIndex

    // getting existing group
    currentGroup = { ...designGroups[referenceGroup] }

    // searching for a item before/after the new one, or if there
    // is already an existing item in current position
    currentGroup.items.forEach((item, index) => {
      if (
        componentInExistingItemIndex == null &&
        item.start <= area.start &&
        item.end >= area.start
      ) {
        // getting the index of the first item
        componentInExistingItemIndex = index
      }

      if (itemAfterNewIndex == null && area.end < item.start) {
        // getting the index of the first item after
        itemAfterNewIndex = index
      }

      if (item.end < area.start) {
        // getting the index of the last item before
        itemBeforeNewIndex = index
      }
    })

    if (componentInExistingItemIndex != null) {
      currentItem = currentGroup.items[componentInExistingItemIndex]

      newComponentInfo.index = currentItem.components.length

      // adding component to existing item
      currentItem = {
        ...currentItem,
        minSpace: componentMinSpace > currentItem.minSpace ? componentMinSpace : currentItem.minSpace,
        components: [
          ...currentItem.components,
          newComponent
        ]
      }
    } else {
      let leftSpaceBeforeItem

      newComponentInfo.index = 0

      // creating new item
      currentItem = generateDesignItem({
        colWidth,
        layoutMode,
        start: area.start,
        end: area.end,
        minSpace: area.minSpace,
        components: [newComponent],
        baseSize: componentSize
      })

      if (layoutMode === 'grid') {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = (area.start - currentGroup.items[itemBeforeNewIndex].end) - 1
        } else {
          leftSpaceBeforeItem = area.start
        }
      } else {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = ((area.start - currentGroup.items[itemBeforeNewIndex].end) - 1) * colWidth
        } else {
          leftSpaceBeforeItem = area.start * colWidth
        }
      }

      if (leftSpaceBeforeItem > 0) {
        currentItem.leftSpace = leftSpaceBeforeItem
      }

      if (componentInExistingItemIndex != null) {
        newComponentInfo.itemIndex = componentInExistingItemIndex

        currentGroup.items = [
          ...currentGroup.items.slice(0, componentInExistingItemIndex),
          currentItem,
          ...currentGroup.items.slice(componentInExistingItemIndex + 1)
        ]
      } else {
        if (itemAfterNewIndex == null) {
          newComponentInfo.itemIndex = currentGroup.items.length

          // if there is no item after the new item, insert it as the last
          currentGroup.items = [
            ...currentGroup.items,
            currentItem
          ]
        } else {
          newComponentInfo.itemIndex = itemAfterNewIndex

          // updating items order with the new item
          currentGroup.items = [
            ...currentGroup.items.slice(0, itemAfterNewIndex),
            currentItem,
            // updating left space of item after the new one
            ...currentGroup.items.slice(itemAfterNewIndex, itemAfterNewIndex + 1).map((item) => {
              let newLeftSpace

              if (layoutMode === 'grid') {
                newLeftSpace = (item.start - area.end) - 1
              } else {
                newLeftSpace = ((item.start - area.end) - 1) * colWidth
              }

              // updating left space if necessary
              if (
                (item.leftSpace == null && newLeftSpace !== 0) ||
                (item.leftSpace != null && item.leftSpace !== newLeftSpace)
              ) {
                return {
                  ...item,
                  leftSpace: newLeftSpace
                }
              }

              return item
            }),
            ...currentGroup.items.slice(itemAfterNewIndex + 1)
          ]
        }
      }

      newComponentInfo.groupId = currentGroup.id
      newComponentInfo.itemId = currentItem.id

      newComponentInfo.groupIndex = referenceGroup

      newDesignGroups = [
        ...designGroups.slice(0, referenceGroup),
        currentGroup,
        ...designGroups.slice(referenceGroup + 1)
      ]
    }
  }

  newComponentsInfo[newComponent.id] = newComponentInfo

  return {
    designGroups: newDesignGroups,
    newComponent,
    componentsInfo: newComponentsInfo
  }
}

function updateComponentInDesign ({
  designGroups,
  referenceGroup,
  referenceItem,
  referenceComponent,
  props
}) {
  let newDesignGroups
  let newDesignGroup
  let newDesignItem
  let newDesignComponent

  newDesignGroup = {
    ...designGroups[referenceGroup]
  }

  newDesignItem = {
    ...newDesignGroup.items[referenceItem]
  }

  newDesignComponent = {
    ...newDesignItem.components[referenceComponent]
  }

  newDesignComponent.props = { ...props }

  newDesignItem.components = [
    ...newDesignItem.components.slice(0, referenceComponent),
    newDesignComponent,
    ...newDesignItem.components.slice(referenceComponent + 1)
  ]

  newDesignGroup.items = [
    ...newDesignGroup.items.slice(0, referenceItem),
    newDesignItem,
    ...newDesignGroup.items.slice(referenceItem + 1),
  ]

  newDesignGroups = [
    ...designGroups.slice(0, referenceGroup),
    newDesignGroup,
    ...designGroups.slice(referenceGroup + 1)
  ]

  return {
    designGroups: newDesignGroups,
    updatedComponent: null
  }
}

function removeComponentInDesign ({
  componentsInfo,
  designGroups,
  referenceGroup,
  referenceItem,
  componentId
}) {
  let newDesignGroups
  let newComponentsInfo
  let newDesignGroup
  let newDesignItem
  let nextDesignItem

  newComponentsInfo = {
    ...componentsInfo
  }

  newDesignGroup = {
    ...designGroups[referenceGroup]
  }

  newDesignItem = {
    ...newDesignGroup.items[referenceItem]
  }

  nextDesignItem = newDesignGroup.items[referenceItem + 1]

  // removing the component
  newDesignItem.components = newDesignItem.components.filter((comp) => {
    return comp.id !== componentId
  })

  if (newDesignItem.components.length === 0) {
    if (nextDesignItem) {
      // since we will remove the item we need to
      // re-calculate the leftSpace of next item
      nextDesignItem = { ...nextDesignItem }
      nextDesignItem.leftSpace = nextDesignItem.leftSpace == null ? 0 : nextDesignItem.leftSpace
      nextDesignItem.leftSpace += newDesignItem.space
      nextDesignItem.leftSpace += newDesignItem.leftSpace == null ? 0 : newDesignItem.leftSpace

      // deleting the item and updating the next one
      newDesignGroup.items = [
        ...newDesignGroup.items.slice(0, referenceItem),
        nextDesignItem,
        ...newDesignGroup.items.slice(referenceItem + 2)
      ]
    } else {
      // deleting the item if there is no more components in there
      newDesignGroup.items = [
        ...newDesignGroup.items.slice(0, referenceItem),
        ...newDesignGroup.items.slice(referenceItem + 1)
      ]
    }
  } else {
    // updating the items
    newDesignGroup.items = [
      ...newDesignGroup.items.slice(0, referenceItem),
      newDesignItem,
      ...newDesignGroup.items.slice(referenceItem + 1)
    ]
  }

  // updating the group
  newDesignGroups = [
    ...designGroups.slice(0, referenceGroup),
    newDesignGroup,
    ...designGroups.slice(referenceGroup + 1)
  ]

  delete newComponentsInfo[componentId]

  return {
    designGroups: newDesignGroups,
    componentsInfo: newComponentsInfo,
    updatedDesignItem: newDesignItem
  }
}

function selectComponentInDesign ({ componentId, componentsInfo }) {
  let found = componentsInfo[componentId] !== null
  let componentInGroupInfo

  if (!found) {
    return null
  }

  componentInGroupInfo = componentsInfo[componentId]

  return {
    group: componentInGroupInfo.groupId,
    index: componentInGroupInfo.groupIndex,
    data: {
      [componentInGroupInfo.groupId]: {
        item: componentInGroupInfo.itemId,
        index: componentInGroupInfo.itemIndex,
        data: {
          [componentInGroupInfo.itemId]: {
            component: componentId,
            index: componentInGroupInfo.index
          }
        }
      }
    }
  }
}

function findProjectedFilledArea ({
  baseWidth,
  totalCols,
  designGroups,
  referenceGroup,
  colInfo,
  consumedCols,
  noConflictItem
}) {
  let currentGroup = designGroups[referenceGroup]
  let colWidth = baseWidth / totalCols
  let { index: startCol } = colInfo
  let endCol = startCol + (consumedCols - 1)
  let filled = false
  let conflict = false
  let visuallyConsumedCols
  let areaBox

  endCol = endCol < totalCols ? endCol : totalCols - 1
  visuallyConsumedCols = (endCol - startCol) + 1

  areaBox = {
    width: visuallyConsumedCols * colWidth,
    height: colInfo.height,
    top: colInfo.top,
    left: colInfo.left
  }

  for (let i = 0; i < currentGroup.items.length; i++) {
    let currentItem = currentGroup.items[i]

    if (conflict) {
      break;
    }

    if (noConflictItem != null && i === noConflictItem) {
      continue;
    }

    // does the projected preview has some conflic with other item in the group?
    if (
      (currentItem.start <= startCol && currentItem.end >= startCol) ||
      (currentItem.start <= endCol && currentItem.end >= endCol)
    ) {
      conflict = true
    }
  }

  // does the projected preview fills inside the selected area?
  filled = (
    totalCols - startCol >= consumedCols
  )

  return {
    filled,
    conflict,
    group: referenceGroup,
    start: startCol,
    end: endCol,
    areaBox
  }
}

function findProjectedFilledAreaWhenResizing ({
  baseWidth,
  totalCols,
  designGroups,
  referenceGroup,
  referenceItem,
  originalHighlightedArea,
  highlightedArea,
  minSpace,
  originalSpace,
  resize
}) {
  let currentGroup = designGroups[referenceGroup]
  let layoutMode = currentGroup.layoutMode
  let colWidth = baseWidth / totalCols
  let shouldCalculate = false
  let isGrowing = false
  let newSelectedArea
  let newSelectionIsEmpty
  let step
  let nextCol

  if (resize.direction === 'left') {
    step = -1
  } else {
    step = 1
  }

  if (
    resize.prevPosition > resize.position
  ) {
    step = step * -1
  }

  if (
    (resize.direction === 'left' && step === -1) ||
    (resize.direction === 'right' && step === 1)
  ) {
    isGrowing = true
  }

  if (layoutMode === 'grid') {
    let baseLeft
    let currentOffset
    let colReference
    let colLimit
    let sizeLimit

    baseLeft = Math.round(originalHighlightedArea.areaBox.left - (originalHighlightedArea.start * colWidth))

    if (resize.direction === 'left') {
      currentOffset = originalHighlightedArea.areaBox.left - resize.position
    } else {
      currentOffset = originalHighlightedArea.areaBox.left + originalHighlightedArea.areaBox.width + resize.position
    }

    colReference = Math.floor((currentOffset - baseLeft) / colWidth)

    if (isGrowing) {
      colLimit = resize.direction === 'left' ? 0 : totalCols - 1
      sizeLimit = resize.direction === 'left' ? resize.maxLeft : resize.maxRight
    } else {
      if (resize.direction === 'left') {
        colLimit = originalHighlightedArea.start + Math.abs(originalSpace - minSpace)
      } else {
        colLimit = originalHighlightedArea.end - Math.abs(originalSpace - minSpace)
      }

      sizeLimit = resize.direction === 'left' ? resize.minLeft : resize.minRight
    }

    if (resize.position === sizeLimit) {
      shouldCalculate = true
      nextCol = colLimit
    } else {
      let evaluatedCol

      if (resize.direction === 'left') {
        evaluatedCol = highlightedArea.start
      } else {
        evaluatedCol = highlightedArea.end
      }

      if (isGrowing) {
        shouldCalculate = Math.abs(evaluatedCol - colReference) > 1
      } else {
        if (resize.position === sizeLimit && Math.abs(evaluatedCol - colReference) >= 1) {
          shouldCalculate = true
        } else if (Math.abs(evaluatedCol - colReference) === 1) {
          shouldCalculate = false
        } else {
          shouldCalculate = true
        }
      }

      if (resize.direction === 'left') {
        nextCol = colReference + 1
      } else {
        nextCol = colReference - 1
      }
    }
  } else {
    let consumedCols = Math.floor(resize.position / colWidth)
    let evaluatedCol
    let factor

    if (resize.direction === 'left') {
      evaluatedCol = originalHighlightedArea.start
      factor = -1
    } else {
      evaluatedCol = originalHighlightedArea.end
      factor = 1
    }

    if (resize.position === 0) {
      nextCol = evaluatedCol
    } else {
      let newCol = evaluatedCol + (consumedCols * factor)

      if (
        newCol !== 0 &&
        newCol !== totalCols - 1
      ) {
        newCol = newCol + factor
      }

      nextCol = newCol
    }

    if (
      (nextCol === evaluatedCol &&
      originalHighlightedArea.areaBox.width === highlightedArea.areaBox.width) ||
      (nextCol === 0 && resize.position === resize.prevPosition) ||
      (nextCol === totalCols - 1 &&
      resize.position === resize.prevPosition)
    ) {
      shouldCalculate = false
    } else {
      shouldCalculate = true
    }
  }

  if (
    !shouldCalculate ||
    nextCol < 0 ||
    nextCol > (totalCols - 1)
  ) {
    return
  }

  newSelectedArea = {
    ...highlightedArea,
  }

  newSelectedArea.areaBox = {
    ...highlightedArea.areaBox
  }

  if (layoutMode === 'grid') {
    let distanceX
    let fromCol
    let toCol

    newSelectedArea.start = resize.direction === 'left' ? nextCol : highlightedArea.start
    newSelectedArea.end = resize.direction === 'right' ? nextCol : highlightedArea.end

    fromCol = resize.direction === 'left' ? nextCol : originalHighlightedArea.end + 1
    toCol = resize.direction === 'left' ? originalHighlightedArea.start - 1 : nextCol

    distanceX = ((toCol - fromCol) + 1) * colWidth

    newSelectedArea.areaBox.width = originalHighlightedArea.areaBox.width + distanceX

    newSelectedArea.areaBox.left = resize.direction === 'left' ? (
      originalHighlightedArea.areaBox.left - distanceX
    ) : originalHighlightedArea.areaBox.left

    if (resize.direction === 'left') {
      let prevItem = currentGroup.items[referenceItem - 1]
      newSelectionIsEmpty = !prevItem || (prevItem.end < fromCol)
    } else {
      let nextItem = currentGroup.items[referenceItem + 1]
      newSelectionIsEmpty = !nextItem || (nextItem.start > toCol)
    }
  } else {
    newSelectedArea.start = resize.direction === 'left' ? nextCol : highlightedArea.start
    newSelectedArea.end = resize.direction === 'right' ? nextCol : highlightedArea.end

    newSelectedArea.areaBox.width = originalHighlightedArea.areaBox.width + resize.position

    newSelectedArea.areaBox.left = resize.direction === 'left' ? (
      originalHighlightedArea.areaBox.left - resize.position
    ) : originalHighlightedArea.areaBox.left

    // TODO: do a proper calculation when finishing the fixed mode support
    newSelectionIsEmpty = true
  }

  if (
    (resize.position <= 0) ||
    newSelectionIsEmpty
  ) {
    newSelectedArea.conflict = false
  } else {
    newSelectedArea.conflict = true
  }

  return newSelectedArea
}

export { getConsumedColsFromWidth }
export { generateDesignGroups }
export { addComponentToDesign }
export { updateComponentInDesign }
export { removeComponentInDesign }
export { selectComponentInDesign }
export { findProjectedFilledArea }
export { findProjectedFilledAreaWhenResizing }
export { updateDesignItem }
