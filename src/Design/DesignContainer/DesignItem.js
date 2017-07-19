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
      selection,
      components,
      onClickComponent
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

    if (selection != null) {
      extraProps['data-selected'] = true
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
            id={component.id}
            type={component.type}
            selected={selection && selection.component === component.id ? true : undefined}
            componentProps={component.props}
            onClick={onClickComponent}
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
  selection: PropTypes.object,
  components: PropTypes.array.isRequired,
  onClickComponent: PropTypes.func
}

export default DesignItem
