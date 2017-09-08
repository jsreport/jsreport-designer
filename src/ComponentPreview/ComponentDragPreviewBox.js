import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Component as DesignComponent } from '../DesignComponent'

class ComponentDragPreviewBox extends PureComponent {
  constructor (props) {
    super(props)

    this.getDataInput = this.getDataInput.bind(this)
  }

  getDataInput () {
    return this.props.dataInput
  }

  render () {
    const {
      width,
      componentMeta
    } = this.props

    return (
      <div style={{
        width: `${width}px`,
        opacity: '0.7'
      }}>
        <DesignComponent
          type={componentMeta.name}
          getDataInput={this.getDataInput}
          componentProps={componentMeta.props}
          selectedPreview={true}
        />
      </div>
    )
  }
}

ComponentDragPreviewBox.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  width: PropTypes.number.isRequired,
  componentMeta: PropTypes.object.isRequired
}

export default ComponentDragPreviewBox
