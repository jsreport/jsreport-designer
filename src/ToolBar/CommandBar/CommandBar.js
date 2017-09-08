import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DataInputCommand from './DataInputCommand'
import './CommandBar.css'

class CommandBar extends PureComponent {
  render () {
    const { dataInput, onCommandSave } = this.props

    return (
      <div className="CommandBar">
        <div className="CommandBar-item">
          <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
          <span className="CommandBar-item-tooltip">Data Input</span>
        </div>
      </div>
    )
  }
}

CommandBar.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onCommandSave: PropTypes.func
}

export default CommandBar
