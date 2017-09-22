import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ComponentBar from './ComponentBar'
import ComponentEditor from './ComponentEditor'
import CommandBar from './CommandBar'
import './ToolBar.css'

class ToolBar extends PureComponent {
  render () {
    const {
      componentEdition,
      componentCollection,
      dataInput,
      onComponentEditionChange,
      onCommandSave,
      onItemDragStart,
      onItemDragEnd
    } = this.props

    let extraProps = {}

    if (componentEdition != null) {
      extraProps['data-keep-selection'] = true
    }

    return (
      <div className="ToolBar" {...extraProps}>
        <div
          className="ToolBar-content"
          style={{
            transform: componentEdition ? 'translateX(-100%) translateZ(0)' : 'translateZ(0)'
          }}
        >
          <ComponentBar
            componentCollection={componentCollection}
            onItemDragStart={onItemDragStart}
            onItemDragEnd={onItemDragEnd}
          />
          <div className="ToolBar-offset" style={{ transform: componentEdition ? 'translateX(0) translateZ(0)' : 'translateX(-200%) translateZ(0)', opacity: componentEdition ? 1 : 0 }}>
            {componentEdition && (
              <ComponentEditor
                key={componentEdition.id}
                type={componentEdition.type}
                dataInput={dataInput}
                template={componentEdition.template}
                properties={componentEdition.props}
                bindings={componentEdition.bindings}
                onChange={onComponentEditionChange}
              />
            )}
          </div>
        </div>
        <div className="ToolBar-footer">
          <CommandBar dataInput={dataInput} onCommandSave={onCommandSave} />
        </div>
      </div>
    )
  }
}

ToolBar.propTypes = {
  componentEdition: PropTypes.object,
  componentCollection: PropTypes.array.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onComponentEditionChange: PropTypes.func,
  onCommandSave: PropTypes.func,
  onItemDragStart: PropTypes.func,
  onItemDragEnd: PropTypes.func
}

export default ToolBar
