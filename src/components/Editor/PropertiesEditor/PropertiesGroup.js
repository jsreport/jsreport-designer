import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

class PropertiesGroup extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      expanded: true
    }

    this.toogle = this.toogle.bind(this)
  }

  toogle () {
    this.setState((prevState) => ({ expanded: !prevState.expanded }))
  }

  render () {
    const { expanded } = this.state
    const { name, children } = this.props
    const propsToAdd = {}

    if (expanded) {
      propsToAdd['data-expanded'] = true
    }

    return (
      <div className='propertiesEditor-group'>
        <div className='propertiesEditor-group-header' onClick={this.toogle}>
          <span>{name}</span>
        </div>
        <div className='propertiesEditor-group-content' {...propsToAdd}>
          {children}
        </div>
      </div>
    )
  }
}

PropertiesGroup.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ])
}

export default PropertiesGroup
