import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ComponentItem from '../ComponentItem'

class ComponentsGroup extends Component {
  renderComponentItem (componentItem) {
    return (
      <ComponentItem
        type={componentItem.componentType}
        width={componentItem.defaultSize.width}
        height={componentItem.defaultSize.height}
        componentProps={componentItem.props}
      />
    )
  }

  renderComponents (components, baseColWidth) {
    let lastConsumedCol

    return (
      <div>
        {components.map((componentItem) => {
          let styles = {
            display: 'inline-block',
            verticalAlign: 'top'
          }

          let leftSpace
          let rightSpace

          if (lastConsumedCol == null) {
            leftSpace = componentItem.col.start * baseColWidth
          } else {
            leftSpace = ((componentItem.col.start - lastConsumedCol) - 1) * baseColWidth
          }

          rightSpace = (((componentItem.col.end - componentItem.col.start) + 1) * baseColWidth) - componentItem.defaultSize.width

          styles.paddingLeft = `${leftSpace}px`
          styles.paddingRight = `${rightSpace}px`

          lastConsumedCol = componentItem.col.end

          return (
            <div
              key={'ComponentItem-' + componentItem.id}
              style={styles}
            >
              {this.renderComponentItem(componentItem)}
            </div>
          )
        })}
      </div>
    )
  }

  render () {
    let {
      baseColWidth,
      topSpace,
      components
    } = this.props

    let styles = {}

    if (topSpace != null) {
      styles.paddingTop = `${topSpace}px`
    }

    return (
      <div
        style={styles}
      >
        {this.renderComponents(components, baseColWidth)}
      </div>
    )
  }
}

ComponentsGroup.propTypes = {
  baseColWidth: PropTypes.number.isRequired,
  topSpace: PropTypes.number,
  components: PropTypes.array.isRequired
}

export default ComponentsGroup
