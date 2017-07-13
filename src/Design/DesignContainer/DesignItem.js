import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignComponent from '../../DesignComponent'
import './DesignItem.css'

class DesignItem extends PureComponent {
  getWidthInPercentage ({ numberOfCols, consumedCols }) {
    return 100 / (numberOfCols / consumedCols)
  }

  render () {
    const {
      numberOfCols,
      layoutMode,
      leftSpace,
      space,
      components
    } = this.props

    let extraProps = {}
    let itemStyles = {}

    if (layoutMode === 'grid') {
      itemStyles.width = `${this.getWidthInPercentage({ numberOfCols, consumedCols: space })}%`

      if (leftSpace != null) {
        itemStyles.marginLeft = `${this.getWidthInPercentage({ numberOfCols, consumedCols: leftSpace })}%`
      }
    } else {
      itemStyles.width = `${space}px`

      if (leftSpace != null) {
        itemStyles.marginLeft = `${leftSpace}px`
      }
    }

    extraProps[`data-layout-${layoutMode}-mode`] = true

    return (
      <div
        className="DesignItem"
        style={itemStyles}
        {...extraProps}
      >
        {components.map((component) => (
          <DesignComponent
            key={component.id}
            type={component.type}
            componentProps={component.props}
          />
        ))}
      </div>
    )
  }
}

DesignItem.propTypes = {
  numberOfCols: PropTypes.number.isRequired,
  layoutMode: PropTypes.oneOf(['grid', 'fixed']).isRequired,
  leftSpace: PropTypes.number,
  space: PropTypes.number.isRequired,
  components: PropTypes.array.isRequired
}

export default DesignItem
