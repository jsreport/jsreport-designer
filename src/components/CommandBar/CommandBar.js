import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CommandButton from '../CommandButton'
import DataInputCommand from './DataInputCommand'
import './CommandBar.css'

class CommandBar extends PureComponent {
  render () {
    const { dataInput, onCommandSave } = this.props

    return (
      <div className="CommandBar">
        <CommandButton title="Data Input">
          <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
        </CommandButton>
      </div>
    )
  }
}

CommandBar.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onCommandSave: PropTypes.func
}

export default CommandBar
