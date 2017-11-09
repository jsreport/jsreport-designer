import React, { PureComponent } from 'react'
// import { toolbarComponents } from '../../lib/configuration'
import DataInputCommand from './DataInputCommand'
import CommandButton from '../CommandButton'
import styles from './CommandBar.scss'

class CommandBar extends PureComponent {
  // renderGeneralCommands () {
  //   return toolbarComponents.generalCommands.map((comp, idx) => React.createElement(comp, {
  //     key: idx
  //   }))
  // }

  render () {
    return (
      <div className={styles.commandBar}>
        <CommandButton title="Data Input">
          <DataInputCommand />
        </CommandButton>
        {/* TODO: render with this when i have Mobx store ready */}
        {/* {this.renderGeneralCommands()} */}
      </div>
    )
  }
}

CommandBar.propTypes = {}

export default CommandBar
