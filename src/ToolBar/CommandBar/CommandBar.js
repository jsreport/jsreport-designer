import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../Button'
import DataInputCommand from './DataInputCommand'
import './CommandBar.css'

class CommandBar extends PureComponent {
  render () {
    const { dataInput, onCommandSave } = this.props

    return (
      <div className="CommandBar">
        <Button title="Data Input">
          <DataInputCommand dataInput={dataInput} onSave={onCommandSave} />
        </Button>
      </div>
    )
  }
}

CommandBar.propTypes = {
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onCommandSave: PropTypes.func
}

export default CommandBar
