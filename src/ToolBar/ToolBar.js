import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import ComponentBar from './ComponentBar'
import PropertiesEditor from './PropertiesEditor'
import CommandBar from './CommandBar'
import './ToolBar.css'

class ToolBar extends PureComponent {
  render () {
    const {
      propertiesEdition,
      componentCollection,
      dataInput,
      onCommandSave,
      onItemDragStart,
      onItemDragEnd
    } = this.props

    let extraProps = {}

    if (propertiesEdition != null) {
      extraProps['data-keep-selection'] = true
    }

    return (
      <div className="ToolBar" {...extraProps}>
        <div
          className="ToolBar-content"
          style={{
            transform: propertiesEdition ? 'translateX(-100%)' : null
          }}
        >
          <ComponentBar
            componentCollection={componentCollection}
            onItemDragStart={onItemDragStart}
            onItemDragEnd={onItemDragEnd}
          />
          <div className="ToolBar-offset" style={{ transform: propertiesEdition ? 'translateX(0)' : 'translateX(-200%)', opacity: propertiesEdition ? 1 : 0 }}>
            {propertiesEdition && (
              <PropertiesEditor
                key={propertiesEdition.id}
                type={propertiesEdition.type}
                dataInput={dataInput}
                properties={propertiesEdition.properties}
                onChange={propertiesEdition.onChange}
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
  propertiesEdition: PropTypes.object,
  componentCollection: PropTypes.array.isRequired,
  dataInput: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onCommandSave: PropTypes.func,
  onItemDragStart: PropTypes.func,
  onItemDragEnd: PropTypes.func
}

export default ToolBar
