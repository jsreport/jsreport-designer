import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ComponentBar from '../ComponentBar'
import { ComponentEditor } from '../Editor'
import CommandBar from '../CommandBar'
import './SideBar.css'

class SideBar extends PureComponent {
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
      <div className="SideBar" {...extraProps}>
        <div
          className="SideBar-content"
          style={{
            transform: componentEdition ? 'translateX(-100%)' : undefined
          }}
        >
          <ComponentBar
            componentCollection={componentCollection}
            onItemDragStart={onItemDragStart}
            onItemDragEnd={onItemDragEnd}
          />
          <div className="SideBar-offset" style={{ transform: componentEdition ? 'translateX(0)' : 'translateX(-200%)', opacity: componentEdition ? 1 : 0 }}>
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
        <div className="SideBar-footer">
          <CommandBar dataInput={dataInput} onCommandSave={onCommandSave} />
        </div>
      </div>
    )
  }
}

SideBar.propTypes = {
  componentEdition: PropTypes.object,
  componentCollection: PropTypes.array.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onComponentEditionChange: PropTypes.func,
  onCommandSave: PropTypes.func,
  onItemDragStart: PropTypes.func,
  onItemDragEnd: PropTypes.func
}

export default SideBar
