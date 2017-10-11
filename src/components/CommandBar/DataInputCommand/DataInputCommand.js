import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import DataInputEditor from './DataInputEditor'

class DataInputCommand extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      showEditor: false
    }

    this.handleClick = this.handleClick.bind(this)
    this.closeEditor = this.closeEditor.bind(this)
  }

  handleClick () {
    this.setState((prevState) => {
      return {
        showEditor: !prevState.showEditor
      }
    })
  }

  closeEditor () {
    this.setState({
      showEditor: false
    })
  }

  render () {
    const { dataInput, onSave } = this.props
    const { showEditor } = this.state

    return (
      <div className="CommandBar-command">
        <button className="CommandBar-button" onClick={this.handleClick}>
          <span className="fa fa-database"></span>
        </button>
        {showEditor && (
          <DataInputEditor
            dataInput={dataInput}
            onSave={onSave}
            onClose={this.closeEditor}
          />
        )}
      </div>
    )
  }
}

DataInputCommand.propTypes = {
  dataInput: PropTypes.object,
  onSave: PropTypes.func,
  onClose: PropTypes.func
}

export default DataInputCommand
