import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DesignComponent from '../../DesignComponent'

class ComponentItem extends PureComponent {
  render () {
    const {
      leftSpace,
      rightSpace,
      component
    } = this.props

    let styles = {
      display: 'inline-block',
      verticalAlign: 'top'
    }

    styles.paddingLeft = `${leftSpace}px`
    styles.paddingRight = `${rightSpace}px`

    return (
      <div style={styles}>
        <DesignComponent
          type={component.componentType}
          width={component.defaultSize.width}
          height={component.defaultSize.height}
          componentProps={component.props}
        />
      </div>
    )
  }
}

ComponentItem.propTypes = {
  leftSpace: PropTypes.number,
  rightSpace: PropTypes.number,
  component: PropTypes.object.isRequired
}

export default ComponentItem
