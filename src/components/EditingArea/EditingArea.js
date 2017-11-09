import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Design from '../Design'
import styles from './EditingArea.scss'

const IS_DEV = true

let DevTools

if (IS_DEV) {
  DevTools = require('../DevTools').default
}

@observer
class EditingArea extends Component {
  render () {
    const { canvasRef, design } = this.props
    const { baseWidth } = design

    let paddingLeftRight = 25

    let areaStyles = {
      minWidth: baseWidth + (paddingLeftRight * 2) + 'px',
      paddingLeft: paddingLeftRight + 'px',
      paddingRight: paddingLeftRight + 'px',
      paddingBottom: '40px',
      paddingTop: '40px'
    }

    return (
      <div
        className={styles.editingArea}
        style={areaStyles}
      >
        {DevTools && (
          <DevTools
            design={design}
          />
        )}
        <Design
          canvasRef={canvasRef}
          design={design}
        />
      </div>
    )
  }
}

EditingArea.propTypes = {
  canvasRef: PropTypes.func,
  design: MobxPropTypes.observableObject.isRequired
}

export default EditingArea
