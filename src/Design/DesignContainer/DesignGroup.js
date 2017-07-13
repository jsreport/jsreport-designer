import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignItem from './DesignItem'
import './DesignGroup.css'

class DesignGroup extends PureComponent {
  render () {
    let {
      numberOfCols,
      layoutMode,
      topSpace,
      items
    } = this.props

    let styles = {}
    let extraProps = {}

    if (topSpace != null) {
      styles.marginTop = `${topSpace}px`
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    return (
      <div
        className="DesignGroup"
        style={styles}
        {...extraProps}
      >
        {items.map((designItem) => {
          return (
            <DesignItem
              key={'DesignItem-' + designItem.id}
              numberOfCols={numberOfCols}
              layoutMode={layoutMode}
              leftSpace={designItem.leftSpace}
              space={designItem.space}
              components={designItem.components}
            />
          )
        })}
      </div>
    )
  }
}

DesignGroup.propTypes = {
  layoutMode: PropTypes.oneOf(['grid', 'fixed']).isRequired,
  topSpace: PropTypes.number,
  numberOfCols: PropTypes.number.isRequired,
  items: PropTypes.array.isRequired
}

export default DesignGroup
