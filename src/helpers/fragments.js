
function getFragmentsNodes (rootNode) {
  const fragmentsSlotsIterator = document.createNodeIterator(
    rootNode,
    NodeFilter.SHOW_COMMENT,
    (node) => {
      const value = node.nodeValue.trim()

      return value.indexOf('jsreport-designer-fragment') === 0 ? (
        NodeFilter.FILTER_ACCEPT
      ) : NodeFilter.FILTER_REJECT
    }
  )

  let currentSlotNode = fragmentsSlotsIterator.nextNode()
  const fragmentsNodes = []

  while (currentSlotNode != null) {
    fragmentsNodes.push(currentSlotNode)
    currentSlotNode = fragmentsSlotsIterator.nextNode()
  }

  return fragmentsNodes
}

function mountFragmentsNodes (fragmentsNodes, fragmentsRefsCollection) {
  for (let i = 0; i < fragmentsNodes.length; i++) {
    const currentFragmentPlaceholderNode = fragmentsNodes[i]

    const value = currentFragmentPlaceholderNode.nodeValue.trim()
    const attrs = value.split('@').slice(1)

    if (attrs.length > 0) {
      const typeInfo = attrs[0].split('=')
      const instanceInfo = attrs[1].split('=')
      const typeValue = typeInfo[1]
      const instanceValue = instanceInfo[1]

      const fragmentMountNodes = fragmentsRefsCollection[typeValue] != null ? (
        fragmentsRefsCollection[typeValue].mountNodes
      ) : undefined

      if (fragmentMountNodes == null) {
        return
      }

      const currentFragmentInstanceNode = fragmentMountNodes[`${typeValue}.${instanceValue}`]

      if (currentFragmentInstanceNode == null) {
        return
      }

      currentFragmentPlaceholderNode.parentNode.replaceChild(currentFragmentInstanceNode, currentFragmentPlaceholderNode)
    }
  }
}

export { getFragmentsNodes }
export { mountFragmentsNodes }
