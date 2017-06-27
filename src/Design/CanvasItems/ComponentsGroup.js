import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ComponentItem from './ComponentItem'

class ComponentsGroup extends PureComponent {
  renderComponents (components, baseColWidth) {
    let lastConsumedCol

    return (
      <div>
        {components.map((componentItem) => {
          let leftSpace
          let rightSpace

          if (lastConsumedCol == null) {
            leftSpace = componentItem.col.start * baseColWidth
          } else {
            leftSpace = ((componentItem.col.start - lastConsumedCol) - 1) * baseColWidth
          }

          rightSpace = (((componentItem.col.end - componentItem.col.start) + 1) * baseColWidth) - componentItem.defaultSize.width

          lastConsumedCol = componentItem.col.end

          return (
            <ComponentItem
              key={'ComponentItem-' + componentItem.id}
              leftSpace={leftSpace}
              rightSpace={rightSpace}
              component={componentItem}
            />
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
