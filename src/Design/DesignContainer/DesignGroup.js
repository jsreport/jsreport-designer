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
      onClickComponent,
      onRemoveComponent,
      onResizeItemStart,
      onResizeItem,
      onResizeItemEnd
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
        {items.map((designItem, didx) => {
          return (
            <DesignItem
              key={designItem.id}
              id={designItem.id}
              index={didx}
              numberOfCols={numberOfCols}
              layoutMode={layoutMode}
              leftSpace={designItem.leftSpace}
              minSpace={designItem.minSpace}
              space={designItem.space}
              selection={selection && selection.item === designItem.id ? selection.data[selection.item] : undefined}
              components={designItem.components}
              onClickComponent={onClickComponent}
              onRemoveComponent={onRemoveComponent}
              onResizeStart={onResizeItemStart}
              onResize={onResizeItem}
              onResizeEnd={onResizeItemEnd}
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
  onClickComponent: PropTypes.func,
  onRemoveComponent: PropTypes.func,
  onResizeItemStart: PropTypes.func,
  onResizeItem: PropTypes.func,
  onResizeItemEnd: PropTypes.func
}

export default DesignGroup
