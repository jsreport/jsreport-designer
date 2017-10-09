
class Designer {

}

let designer

export const createDesigner = (store) => (designer = new Designer(store))

export default designer
