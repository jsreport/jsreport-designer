
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

function mountFragmentsNodes (fragmentsNodes, fragmentsCollection) {
  for (let i = 0; i < fragmentsNodes.length; i++) {
    const currentFragmentNode = fragmentsNodes[i]

    const value = currentFragmentNode.nodeValue.trim()
    const attrs = value.split('#').slice(1)

    if (attrs.length > 0) {
      const nameInfo = attrs[0].split('=')
      const nameValue = nameInfo[1]
      const fragmentInstance = fragmentsCollection[nameValue]

      if (fragmentInstance != null) {
        currentFragmentNode.parentNode.replaceChild(fragmentInstance.mountNode, currentFragmentNode)
      }
    }
  }
}

export { getFragmentsNodes }
export { mountFragmentsNodes }
