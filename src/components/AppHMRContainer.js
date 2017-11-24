import React, { Component } from 'react'
import deepForceUpdate from 'react-deep-force-update'

// this component is used only on development to help HMR
// when component templates/definition source changes
class AppHMRContainer extends Component {
  componentWillReceiveProps() {
    // Force-update the whole tree when hot reloading, including
    // components that refuse to update.
    deepForceUpdate(this)
  }

  render() {
    return this.props.children
  }
}

export default AppHMRContainer
