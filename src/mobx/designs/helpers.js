import omit from 'lodash/omit'
import { DesignGroup, DesignItem, DesignComponent, DesignFragment } from './store'

function generateGroup ({ layoutMode, items, topSpace, placeholder }) {
  let groupDefaults = {
    layoutMode
  }

  if (topSpace != null) {
    groupDefaults.topSpace = topSpace
  }

  groupDefaults.items = items != null ? items : []

  if (placeholder != null) {
    groupDefaults.placeholder = placeholder
  }

  return new DesignGroup(groupDefaults)
}

function generateItem ({
  colWidth,
  baseSize,
  layoutMode,
  start,
  end,
  minSpace,
  components = [],
  parent
}) {
  let itemDefaults
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

  itemDefaults = {
    start,
    end,
    minSpace: currentMinSpace,
    space,
    components: components
  }

  if (parent != null) {
    itemDefaults.parent = parent
  }

  return new DesignItem(itemDefaults)
}

function generateComponent (compDefaults) {
  return new DesignComponent(compDefaults)
}

function generateFragment (fragDefaults) {
  return new DesignFragment(fragDefaults)
}

function findProjectedFilledArea ({
  design,
  targetGroup,
  targetColInfo,
  colsToConsume,
  noConflictItem
}) {
  const { numberOfCols, colWidth } = design
  let currentGroup = design.canvasRegistry.get(targetGroup).element
  let { index: startCol, startOffset } = targetColInfo
  let filled = false
  let conflict = false
  let endCol
  let visuallyConsumedCols
  let areaBox
  let targetItem

  if (startOffset == null) {
    endCol = (startCol + colsToConsume) - 1
  } else {
    endCol = ((startCol - startOffset) + colsToConsume) - 1
    endCol = endCol > 0 ? endCol : 0
  }

  endCol = endCol < numberOfCols ? endCol : numberOfCols - 1
  visuallyConsumedCols = (endCol - startCol) + 1

  areaBox = {
    width: visuallyConsumedCols * colWidth,
    height: targetColInfo.height,
    top: targetColInfo.top,
    left: targetColInfo.left
  }

  for (let i = 0; i < currentGroup.items.length; i++) {
    let currentItem = currentGroup.items[i]

    if (
      targetItem == null &&
      // checking if cursor col index is in between the item
      currentItem.start <= targetColInfo.cursorIndex &&
      currentItem.end >= targetColInfo.cursorIndex
    ) {
      targetItem = currentItem.id
    }

    if (conflict && targetItem != null) {
      break
    }

    if (conflict) {
      continue
    }

    if (noConflictItem != null && currentItem.id === noConflictItem) {
      continue
    }

    // does the projected preview has some conflic with other item in the group?
    if (
      // checking if start col is in between the item
      (currentItem.start <= startCol && currentItem.end >= startCol) ||
      // checking if end col is in between the item
      (currentItem.start <= endCol && currentItem.end >= endCol) ||
      // checking if item start is in between the start-end col range
      (startCol <= currentItem.start && endCol >= currentItem.start) ||
      // checking if item end is in between the start-end col range
      (startCol <= currentItem.end && endCol >= currentItem.end)
    ) {
      conflict = true
    }
  }

  // does the projected preview fills inside the selected area?
  if (visuallyConsumedCols !== colsToConsume) {
    filled = false
  } else {
    filled = numberOfCols - startCol
    filled = filled >= colsToConsume
  }

  return {
    filled,
    conflict,
    // group that is behind the cursor
    group: targetGroup,
    // item that is behind the cursor
    item: targetItem,
    start: startCol,
    end: endCol,
    areaBox
  }
}

function findProjectedFilledAreaWhenResizing ({
  design,
  element,
  newResizePosition
}) {
  const { colWidth, numberOfCols, canvasRegistry } = design
  const { minSpace, space: originalSpace, isResizing } = element
  let currentGroup = element.parent
  let layoutMode = currentGroup.layoutMode
  let shouldCalculate = false
  let isGrowing = false
  let newHighlightedArea
  let newSelectionIsEmpty
  let step
  let nextCol

  if (!isResizing) {
    return
  }

  let {
    direction,
    position: prevPosition,
    baseHighlightedArea,
    highlightedArea
  } = element.resizing

  let {
    minLeft,
    minRight,
    maxLeft,
    maxRight
  } = element.resizing.limits

  if (direction === 'left') {
    step = -1
  } else {
    step = 1
  }

  if (prevPosition > newResizePosition) {
    step = step * -1
  }

  if (
    (direction === 'left' && step === -1) ||
    (direction === 'right' && step === 1)
  ) {
    isGrowing = true
  }

  if (layoutMode === 'grid') {
    let baseLeft
    let currentOffset
    let colReference
    let colLimit
    let sizeLimit

    baseLeft = Math.round(baseHighlightedArea.areaBox.left - (baseHighlightedArea.start * colWidth))

    if (direction === 'left') {
      currentOffset = baseHighlightedArea.areaBox.left - newResizePosition
    } else {
      currentOffset = baseHighlightedArea.areaBox.left + baseHighlightedArea.areaBox.width + newResizePosition
    }

    colReference = Math.floor((currentOffset - baseLeft) / colWidth)

    if (isGrowing) {
      colLimit = direction === 'left' ? 0 : numberOfCols - 1
      sizeLimit = direction === 'left' ? maxLeft : maxRight
    } else {
      if (direction === 'left') {
        colLimit = baseHighlightedArea.start + Math.abs(originalSpace - minSpace)
      } else {
        colLimit = baseHighlightedArea.end - Math.abs(originalSpace - minSpace)
      }

      sizeLimit = direction === 'left' ? minLeft : minRight
    }

    if (newResizePosition === sizeLimit) {
      shouldCalculate = true
      nextCol = colLimit
    } else {
      let evaluatedCol

      if (direction === 'left') {
        evaluatedCol = highlightedArea.start
      } else {
        evaluatedCol = highlightedArea.end
      }

      if (isGrowing) {
        shouldCalculate = Math.abs(evaluatedCol - colReference) > 1
      } else {
        if (newResizePosition === sizeLimit && Math.abs(evaluatedCol - colReference) >= 1) {
          shouldCalculate = true
        } else if (Math.abs(evaluatedCol - colReference) === 1) {
          shouldCalculate = false
        } else {
          shouldCalculate = true
        }
      }

      if (direction === 'left') {
        nextCol = colReference + 1
      } else {
        nextCol = colReference - 1
      }
    }
  } else {
    let consumedCols = Math.floor(newResizePosition / colWidth)
    let evaluatedCol
    let factor

    if (direction === 'left') {
      evaluatedCol = baseHighlightedArea.start
      factor = -1
    } else {
      evaluatedCol = baseHighlightedArea.end
      factor = 1
    }

    if (newResizePosition === 0) {
      nextCol = evaluatedCol
    } else {
      let newCol = evaluatedCol + (consumedCols * factor)

      if (
        newCol !== 0 &&
        newCol !== numberOfCols - 1
      ) {
        newCol = newCol + factor
      }

      nextCol = newCol
    }

    if (
      (nextCol === evaluatedCol &&
      baseHighlightedArea.areaBox.width === highlightedArea.areaBox.width) ||
      (nextCol === 0 && newResizePosition === prevPosition) ||
      (nextCol === numberOfCols - 1 &&
      newResizePosition === prevPosition)
    ) {
      shouldCalculate = false
    } else {
      shouldCalculate = true
    }
  }

  if (
    !shouldCalculate ||
    nextCol < 0 ||
    nextCol > (numberOfCols - 1)
  ) {
    return
  }

  newHighlightedArea = {
    ...highlightedArea
  }

  newHighlightedArea.areaBox = {
    ...highlightedArea.areaBox
  }

  if (layoutMode === 'grid') {
    let distanceX
    let fromCol
    let toCol

    newHighlightedArea.start = direction === 'left' ? nextCol : highlightedArea.start
    newHighlightedArea.end = direction === 'right' ? nextCol : highlightedArea.end

    fromCol = direction === 'left' ? nextCol : baseHighlightedArea.end + 1
    toCol = direction === 'left' ? baseHighlightedArea.start - 1 : nextCol

    distanceX = ((toCol - fromCol) + 1) * colWidth

    newHighlightedArea.areaBox.width = baseHighlightedArea.areaBox.width + distanceX

    newHighlightedArea.areaBox.left = direction === 'left' ? (
      baseHighlightedArea.areaBox.left - distanceX
    ) : baseHighlightedArea.areaBox.left

    if (direction === 'left') {
      let prevItem

      if (canvasRegistry.get(element.id).index - 1 >= 0) {
        prevItem = currentGroup.items[canvasRegistry.get(element.id).index - 1]
      }

      newSelectionIsEmpty = !prevItem || (prevItem.end < fromCol)
    } else {
      let nextItem

      if (canvasRegistry.get(element.id).index + 1 < currentGroup.items.length) {
        nextItem = currentGroup.items[canvasRegistry.get(element.id).index + 1]
      }

      newSelectionIsEmpty = !nextItem || (nextItem.start > toCol)
    }
  } else {
    newHighlightedArea.start = direction === 'left' ? nextCol : highlightedArea.start
    newHighlightedArea.end = direction === 'right' ? nextCol : highlightedArea.end

    newHighlightedArea.areaBox.width = baseHighlightedArea.areaBox.width + newResizePosition

    newHighlightedArea.areaBox.left = direction === 'left' ? (
      baseHighlightedArea.areaBox.left - newResizePosition
    ) : baseHighlightedArea.areaBox.left

    // TODO: do a proper calculation when finishing the fixed mode support
    newSelectionIsEmpty = true
  }

  if (
    (newResizePosition <= 0) ||
    newSelectionIsEmpty
  ) {
    newHighlightedArea.conflict = false
  } else {
    newHighlightedArea.conflict = true
  }

  return newHighlightedArea
}

function findMarkedArea ({
  design,
  referencePoint,
  moveType,
  originElementId,
  targetDimensions,
  targetIsBlock,
  targetType,
  targetElementId
}) {
  const { canvasRegistry } = design

  let markTop = targetDimensions.top
  let markLeft = targetDimensions.left
  let markSize
  let targetReferenceNode
  let targetReferenceNodeDimensions
  let containerNode
  let containerNodeDimensions

  let move = {
    id: null,
    type: 'before'
  }

  // don't show mark when over the same component origin
  if (originElementId != null && originElementId === targetElementId) {
    return
  }

  const targetXCenter = targetDimensions.left + (targetDimensions.width / 2)
  const targetYCenter = targetDimensions.top + (targetDimensions.height / 2)
  const targetElementRecord = canvasRegistry.get(targetElementId)

  const targetElement = targetElementRecord != null ? (
    targetElementRecord.element
  ) : undefined

  if (!targetElement) {
    return
  }

  if (moveType == null) {
    if (targetIsBlock === true) {
      if (referencePoint.y < targetYCenter) {
        move.type = 'before'
      } else {
        move.type = 'after'
      }
    } else {
      if (referencePoint.x < targetXCenter) {
        move.type = 'before'
      } else {
        move.type = 'after'
      }
    }
  } else {
    move.type = moveType
  }

  if (targetType === 'component') {
    if (targetElement.elementType === 'component') {
      move.id = targetElement.id
      targetReferenceNode = document.getElementById(targetElement.id)
      containerNode = document.getElementById(targetElement.parent.id)
    } else if (targetElement.elementType === 'item') {
      const itemNode = document.getElementById(targetElement.id)
      let componentInItem

      // when target is item, then show mark over first/last component of item
      // depending on the move.type operation
      if (move.type === 'before') {
        componentInItem = targetElement.components[0]
      } else {
        componentInItem = targetElement.components[targetElement.components.length - 1]
      }

      if (originElementId != null && originElementId === componentInItem.id) {
        return
      }

      move.id = componentInItem.id

      if (targetIsBlock === true) {
        targetReferenceNode = itemNode
      } else {
        targetReferenceNode = document.getElementById(componentInItem.id)
      }

      containerNode = itemNode
    }

    if (!containerNode || !targetReferenceNode) {
      return
    }

    targetReferenceNodeDimensions = targetReferenceNode.getBoundingClientRect()
    containerNodeDimensions = containerNode.getBoundingClientRect()

    markSize = targetIsBlock ? containerNodeDimensions.width : targetReferenceNodeDimensions.height

    if (move.type === 'before') {
      markTop = targetReferenceNodeDimensions.top
      markLeft = targetIsBlock ? containerNodeDimensions.left : targetReferenceNodeDimensions.left
    } else {
      markTop = targetReferenceNodeDimensions.top + (targetIsBlock ? targetReferenceNodeDimensions.height : 0)
      markLeft = targetIsBlock ? containerNodeDimensions.left : targetReferenceNodeDimensions.left + targetReferenceNodeDimensions.width
    }
  }

  if (move.id == null || markSize == null) {
    return
  }

  return {
    isBlock: targetIsBlock,
    top: markTop,
    left: markLeft,
    size: markSize,
    move
  }
}

function addComponentToDesign ({
  design,
  component,
  componentSize,
  targetArea
}) {
  const {
    canvasRegistry,
    groups,
    colWidth
  } = design

  let targetGroupRecord = canvasRegistry.get(targetArea.group)
  let targetGroupIndex = targetGroupRecord.index
  let layoutMode = targetGroupRecord.element.layoutMode
  let compProps = component.props || {}
  let newRecordForComponent = {}
  let newComponent
  let placeholderGroupIndex

  // get placeholder group (last one)
  if (groups.length > 0 && groups[groups.length - 1].placeholder === true) {
    placeholderGroupIndex = groups.length - 1
  }

  // component information
  newComponent = generateComponent({
    // omit fragments because we are adding by calling
    // a method above
    ...omit(component, ['fragments']),
    props: compProps
  })

  if (
    component.fragments != null &&
    Object.keys(component.fragments).length > 0
  ) {
    addFragmentToComponentInDesign({
      design,
      component: newComponent,
      fragment: Object.keys(component.fragments).map(fragName => component.fragments[fragName])
    })
  }

  newRecordForComponent.element = newComponent

  // check to see if we should create a new group or update an existing one
  if (placeholderGroupIndex != null && placeholderGroupIndex === targetGroupIndex) {
    let newGroup
    let newItem
    let leftSpaceBeforeItem

    // creating new item with component
    newItem = generateItem({
      colWidth,
      baseSize: componentSize,
      layoutMode,
      start: targetArea.start,
      end: targetArea.end,
      minSpace: targetArea.minSpace,
      components: [newComponent]
    })

    newComponent.parent = newItem

    if (layoutMode === 'grid') {
      leftSpaceBeforeItem = targetArea.start
    } else {
      leftSpaceBeforeItem = targetArea.start * colWidth
    }

    if (leftSpaceBeforeItem > 0) {
      newItem.leftSpace = leftSpaceBeforeItem
    }

    // creating a new group with item
    newGroup = generateGroup({
      layoutMode,
      items: [newItem]
    })

    newItem.parent = newGroup

    canvasRegistry.set(newItem.id, {
      index: 0,
      element: newItem
    })

    canvasRegistry.set(newGroup.id, {
      index: targetGroupIndex,
      element: newGroup
    })

    newRecordForComponent.index = 0

    // adding group before placeholder (before the last group)
    groups.splice(Math.max(0, groups.length - 1), 0, newGroup)

    // updating index of placeholder group
    canvasRegistry.get(groups[groups.length - 1].id).index = groups.length - 1
  } else {
    let currentGroup
    let currentItem
    let itemBeforeNewIndex
    let itemAfterNewIndex
    let existingItemIndex

    // getting existing group
    currentGroup = targetGroupRecord.element

    if (targetArea.item == null) {
      // if an existing item was not the target then
      // search for a item before/after the new one
      currentGroup.items.forEach((item, index) => {
        if (
          existingItemIndex == null &&
          item.start <= targetArea.start &&
          item.end >= targetArea.start
        ) {
          // getting the index of the first item
          existingItemIndex = index
        }

        if (itemAfterNewIndex == null && targetArea.end < item.start) {
          // getting the index of the first item after
          itemAfterNewIndex = index
        }

        if (item.end < targetArea.start) {
          // getting the index of the last item before
          itemBeforeNewIndex = index
        }
      })
    } else {
      // if item was the target then just find the
      // before/after item more easily
      existingItemIndex = canvasRegistry.get(targetArea.item).index
    }

    if (existingItemIndex != null) {
      const componentReferenceIndex = canvasRegistry.get(targetArea.componentAt.id).index
      let newComponentIndex

      currentItem = currentGroup.items[existingItemIndex]

      if (targetArea.componentAt.type === 'before') {
        newComponentIndex = componentReferenceIndex
      } else {
        newComponentIndex = componentReferenceIndex + 1
      }

      newRecordForComponent.index = newComponentIndex

      newComponent.parent = currentItem

      // adding component to existing item
      currentItem.components.splice(newComponentIndex, 0, newComponent)

      // updating indexes in registry
      for (let i = newComponentIndex + 1; i < currentItem.components.length; i++) {
        const componentToUpdate = currentItem.components[i]
        const componentToUpdateRecord = canvasRegistry.get(componentToUpdate.id)

        componentToUpdateRecord.index = componentToUpdateRecord.index + 1
      }
    } else {
      let leftSpaceBeforeItem

      // creating new item
      currentItem = generateItem({
        colWidth,
        baseSize: componentSize,
        layoutMode,
        start: targetArea.start,
        end: targetArea.end,
        minSpace: targetArea.minSpace,
        components: [newComponent],
        parent: currentGroup
      })

      newComponent.parent = currentItem

      newRecordForComponent.index = 0

      if (layoutMode === 'grid') {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = (targetArea.start - currentGroup.items[itemBeforeNewIndex].end) - 1
        } else {
          leftSpaceBeforeItem = targetArea.start
        }
      } else {
        if (itemBeforeNewIndex != null) {
          leftSpaceBeforeItem = ((targetArea.start - currentGroup.items[itemBeforeNewIndex].end) - 1) * colWidth
        } else {
          leftSpaceBeforeItem = targetArea.start * colWidth
        }
      }

      if (leftSpaceBeforeItem > 0) {
        currentItem.leftSpace = leftSpaceBeforeItem
      }

      if (itemAfterNewIndex == null) {
        canvasRegistry.set(currentItem.id, {
          index: currentGroup.items.length,
          element: currentItem
        })

        // if there is no item after the new item, insert it as the last
        currentGroup.items.push(currentItem)
      } else {
        let nextItem = currentGroup.items[itemAfterNewIndex]
        let newLeftSpaceForNextItem

        canvasRegistry.set(currentItem.id, {
          index: itemAfterNewIndex,
          element: currentItem
        })

        // first updating item indexes that are next of the item of the added component
        for (let i = itemAfterNewIndex, last = currentGroup.items.length - 1; i <= last; i++) {
          let itemEvaluated = currentGroup.items[i]

          canvasRegistry.get(itemEvaluated.id).index = canvasRegistry.get(itemEvaluated.id).index + 1

          itemEvaluated.components.forEach((comp) => {
            let currentRecord = canvasRegistry.get(comp.id)
            currentRecord.itemIndex = currentRecord.itemIndex + 1
          })
        }

        if (layoutMode === 'grid') {
          newLeftSpaceForNextItem = (nextItem.start - targetArea.end) - 1
        } else {
          newLeftSpaceForNextItem = ((nextItem.start - targetArea.end) - 1) * colWidth
        }

        // updating left space (if necessary) of item after the new one
        if (
          (nextItem.leftSpace == null && newLeftSpaceForNextItem !== 0) ||
          (nextItem.leftSpace != null && nextItem.leftSpace !== newLeftSpaceForNextItem)
        ) {
          nextItem.leftSpace = newLeftSpaceForNextItem
        }

        // then updating items order with the new item
        currentGroup.items.splice(itemAfterNewIndex, 0, currentItem)
      }
    }
  }

  canvasRegistry.set(newComponent.id, newRecordForComponent)

  return {
    newComponent
  }
}

function addFragmentToComponentInDesign ({
  design,
  component,
  fragment
}) {
  const { canvasRegistry } = design
  let fragmentInstance

  if (!Array.isArray(fragment)) {
    fragmentInstance = generateFragment(fragment)

    fragmentInstance.parent = component

    canvasRegistry.set(fragmentInstance.id, {
      element: fragmentInstance
    })

    component.fragments.set(fragmentInstance.name, fragmentInstance)
  } else {
    fragment.forEach(item => {
      fragmentInstance = generateFragment(item)

      fragmentInstance.parent = component

      canvasRegistry.set(fragmentInstance.id, {
        element: fragmentInstance
      })

      component.fragments.set(fragmentInstance.name, fragmentInstance)
    })
  }
}

function removeComponentInDesign ({
  design,
  componentId
}) {
  const { canvasRegistry } = design
  let componentToRemoveIndex = canvasRegistry.get(componentId).index
  let componentToRemove = canvasRegistry.get(componentId).element
  let parentItem = componentToRemove.parent
  let parentItemIndex = canvasRegistry.get(parentItem.id).index
  let parentGroup = parentItem.parent
  let nextItem
  let prevComponent
  let nextComponent

  if (parentItemIndex < parentGroup.items.length - 1) {
    nextItem = parentGroup.items[parentItemIndex + 1]
  }

  if (componentToRemoveIndex > 0) {
    prevComponent = parentItem.components[componentToRemoveIndex - 1]
  }

  if (componentToRemoveIndex < parentItem.components.length - 1) {
    nextComponent = parentItem.components[componentToRemoveIndex + 1]
  }

  // removing fragments from canvas registry
  componentToRemove.fragments.values().forEach((fragment) => {
    if (!canvasRegistry.has(fragment.id)) {
      return
    }

    canvasRegistry.delete(fragment.id)
  })

  // first updating component indexes that are next of the removed component
  for (let i = componentToRemoveIndex + 1, last = parentItem.components.length - 1; i <= last; i++) {
    let componentToUpdate = parentItem.components[i]
    canvasRegistry.get(componentToUpdate.id).index = canvasRegistry.get(componentToUpdate.id).index - 1
  }

  // removing the component
  parentItem.components.splice(componentToRemoveIndex, 1)
  canvasRegistry.delete(componentId)

  // if item is left empty then we should remove it
  if (parentItem.components.length === 0) {
    if (nextItem) {
      // since we will remove the item we need to
      // re-calculate the leftSpace of next item
      nextItem.leftSpace = nextItem.leftSpace == null ? 0 : nextItem.leftSpace
      nextItem.leftSpace += parentItem.space
      nextItem.leftSpace += parentItem.leftSpace == null ? 0 : parentItem.leftSpace
    }

    // before removing the item we need to update the
    // indexes of the items that are next
    for (let i = parentItemIndex + 1, last = parentGroup.items.length - 1; i <= last; i++) {
      let itemToUpdate = parentGroup.items[i]
      canvasRegistry.get(itemToUpdate.id).index = canvasRegistry.get(itemToUpdate.id).index - 1
    }

    // removing the item if there is no more components in there
    parentGroup.items.splice(parentItemIndex, 1)
    canvasRegistry.delete(parentItem.id)
  }

  return {
    prevComponent,
    nextComponent
  }
}

function updateComponentInDesign ({
  design,
  component,
  props,
  bindings,
  expressions,
  template
}) {
  if (props !== undefined) {
    component.props = { ...props }
  }

  if (expressions !== undefined) {
    if (expressions === null) {
      component.expressions = null
    } else {
      component.expressions = { ...expressions }
    }
  }

  if (bindings !== undefined) {
    if (bindings === null) {
      component.bindings = null
    } else {
      component.bindings = { ...bindings }
    }
  }

  if (template !== undefined) {
    if (template === null) {
      component.template = null
    } else {
      component.template = template
    }
  }
}

function updateItemSize ({
  design,
  item,
  start,
  end
}) {
  const { canvasRegistry } = design
  let itemIndex = canvasRegistry.get(item.id).index
  let prevStart = item.start
  let prevEnd = item.end
  let group = item.parent
  let nextItem

  if (itemIndex < group.items.length - 1) {
    nextItem = group.items[itemIndex + 1]
  }

  if (group.layoutMode === 'grid') {
    item.start = start
    item.end = end
    item.space = (end - start) + 1

    if (prevStart !== start) {
      item.leftSpace = item.leftSpace == null ? 0 : item.leftSpace
      item.leftSpace += (start - prevStart)
    }
  }

  if (nextItem) {
    if (end !== prevEnd) {
      nextItem.leftSpace = nextItem.leftSpace == null ? 0 : nextItem.leftSpace
      nextItem.leftSpace += (prevEnd - end)
    }
  }
}

export { generateGroup }
export { generateItem }
export { generateComponent }
export { generateFragment }
export { findProjectedFilledArea }
export { findProjectedFilledAreaWhenResizing }
export { findMarkedArea }
export { addComponentToDesign }
export { addFragmentToComponentInDesign }
export { removeComponentInDesign }
export { updateComponentInDesign }
export { updateItemSize }
