import React, { Component } from 'react'
import PropTypes from 'prop-types'
// (we disable the rule because eslint can recognize decorator usage in our setup)
// eslint-disable-next-line no-unused-vars
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import { DragLayer } from 'react-dnd'
import { ComponentDragTypes } from '../../Constants'
import ComponentDragSnapshootBox from './ComponentDragSnapshootBox'
import styles from './ComponentDragLayer.scss'

function getDragLayerStyles (dragItemType, props) {
  const {
    initialSourceOffset,
    currentSourceOffset,
    initialPointerOffset
  } = props

  let pointerPosition = {
    x: 0,
    y: 0
  }

  if (!initialSourceOffset || !initialPointerOffset || !currentSourceOffset) {
    return {
      display: 'none'
    }
  }

  if (props.componentMeta.pointerPreviewPosition) {
    pointerPosition = props.componentMeta.pointerPreviewPosition
  } else {
    pointerPosition = {
      x: initialPointerOffset.x - initialSourceOffset.x,
      y: initialPointerOffset.y - initialSourceOffset.y
    }
  }

  let movementX, movementY

  let previewItemDistanceXRelativeToSource = (
    initialPointerOffset.x - (initialSourceOffset.x + pointerPosition.x)
  )

  let previewItemDistanceYRelativeToSource = (
    initialPointerOffset.y - (initialSourceOffset.y + pointerPosition.y)
  )

  movementX = currentSourceOffset.x + previewItemDistanceXRelativeToSource
  movementY = currentSourceOffset.y + previewItemDistanceYRelativeToSource

  const transform = `translate(${movementX}px, ${movementY}px)`

  return {
    transform,
    WebkitTransform: transform,
    MsTransform: transform
  }
}

function collect (monitor) {
  return {
    componentMeta: monitor.getItem(),
    dragItemType: monitor.getItemType(),
    initialSourceOffset: monitor.getInitialSourceClientOffset(),
    initialPointerOffset: monitor.getInitialClientOffset(),
    currentSourceOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  }
}

@observer
class ComponentDragLayer extends Component {
  componentWillReceiveProps (nextProps) {
    const { design, updateDesign } = nextProps
    const props = this.props

    if (!design) {
      return
    }

    if (props.isDragging === false && nextProps.isDragging === true) {
      updateDesign(design.id, { isDragging: true })
    } else if (props.isDragging === true && nextProps.isDragging === false) {
      updateDesign(design.id, { isDragging: false })
    }
  }

  renderPreview (dataInput, dragItemType, colWidth, componentMeta) {
    switch (dragItemType) {
      case ComponentDragTypes.COMPONENT_BAR:
      case ComponentDragTypes.COMPONENT:
        return (
          <ComponentDragSnapshootBox
            dragItemType={dragItemType}
            dataInput={dataInput}
            width={colWidth * (componentMeta.consumedCols != null ? componentMeta.consumedCols : 1)}
            componentMeta={componentMeta}
          />
        )
      default:
        return undefined
    }
  }

  render () {
    const {
      dataInput,
      design,
      componentMeta,
      dragItemType,
      isDragging
    } = this.props

    let inlineStyles

    if (!isDragging) {
      inlineStyles = {
        display: 'none'
      }
    } else {
      inlineStyles = getDragLayerStyles(dragItemType, this.props)
    }

    return (
      <div className={styles.componentDragLayer}>
        <div style={inlineStyles}>
          {isDragging && this.renderPreview(dataInput, dragItemType, design.colWidth, componentMeta)}
        </div>
      </div>
    )
  }
}

ComponentDragLayer.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  design: MobxPropTypes.observableObject.isRequired,
  componentMeta: PropTypes.object,
  dragItemType: PropTypes.string,
  // eslint-disable-next-line react/no-unused-prop-types
  initialSourceOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  // eslint-disable-next-line react/no-unused-prop-types
  initialPointerOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  // eslint-disable-next-line react/no-unused-prop-types
  currentSourceOffset: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  }),
  isDragging: PropTypes.bool.isRequired,
  updateDesign: PropTypes.func.isRequired
}

export default inject((injected) => ({
  dataInput: injected.dataInputStore.value,
  updateDesign: injected.designsActions.update
}))(
  DragLayer(collect)(ComponentDragLayer)
)
