import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { ComponentDragTypes } from '../../Constants'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragSnapshootBox extends PureComponent {
  render () {
    const {
      dragItemType,
      dataInput,
      width,
      componentMeta
    } = this.props

    let componentProps

    if (dragItemType === ComponentDragTypes.COMPONENT) {
      // when dragging from component we are not passing any props
      // so we assing an empty object to avoid prop types validation error
      componentProps = {}
    } else {
      componentProps = componentMeta.props
    }

    return (
      <div style={{
        width: `${width}px`,
        opacity: '0.4'
      }}>
        <DesignComponent
          id={`dragPreview${componentMeta.name}`}
          type={componentMeta.name}
          dataInput={dataInput}
          componentProps={componentProps}
          rawContent={componentMeta.rawContent}
          snapshoot
          dragDisabled
        />
      </div>
    )
  }
}

ComponentDragSnapshootBox.propTypes = {
  dragItemType: PropTypes.string.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  width: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragSnapshootBox
