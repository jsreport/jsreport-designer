
export default function getConsumedColsFromWidth ({ baseColWidth, width }) {
  return Math.ceil(
    width < baseColWidth ? 1 : width / baseColWidth
  )
}
