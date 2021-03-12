import { ICompiledMenuNode, ICompiledProduct, NodeTypes } from "@djonnyx/tornado-types";

export const clearParentNodes = (node: ICompiledMenuNode): void => {
    node.parent = null;

    if (node.content && node.type === NodeTypes.PRODUCT) {
        const productStructure = (node.content as ICompiledProduct).structure;
        if (productStructure) {
            clearParentNodes(productStructure);
        }
    }

    for (const child of node.children) {
        clearParentNodes(child);
    }
}