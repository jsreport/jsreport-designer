import React, { Component } from 'react'
import styles from './Separator.scss'

class Separator extends Component {
  render () {
    return (
      <span className={styles.separator}>
        <span className={styles.separatorLabel}>{' '}</span>
      </span>
    )
  }
}

export default Separator
