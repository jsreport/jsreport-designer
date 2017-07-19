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
      selection,
      items,
      onClickComponent
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
              key={designItem.id}
              numberOfCols={numberOfCols}
              layoutMode={layoutMode}
              leftSpace={designItem.leftSpace}
              space={designItem.space}
              selection={selection && selection.item === designItem.id ? selection.data[selection.item] : undefined}
              components={designItem.components}
              onClickComponent={onClickComponent}
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
  selection: PropTypes.object,
  items: PropTypes.array.isRequired,
  onClickComponent: PropTypes.func
}

export default DesignGroup
