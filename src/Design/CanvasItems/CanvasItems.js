import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ComponentsGroup from './ComponentsGroup'
import './CanvasItems.css'

class CanvasItems extends PureComponent {
  render () {
    const {
      baseColWidth,
      components
    } = this.props

    return (
      <div className="Canvas-items">
        {components.map((componentGroupMeta) => (
          <ComponentsGroup
            key={'ComponentsGroup-' + componentGroupMeta.id}
            baseColWidth={baseColWidth}
            topSpace={componentGroupMeta.topSpace}
            components={componentGroupMeta.group}
          />
        ))}
      </div>
    )
  }
}

CanvasItems.propTypes = {
  baseColWidth: PropTypes.number.isRequired,
  components: PropTypes.array.isRequired
}

export default CanvasItems
