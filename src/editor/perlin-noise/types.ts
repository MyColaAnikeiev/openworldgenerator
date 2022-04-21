export type NodeSchemaType = 'source' | 'combinator' | 'filter';

export interface NodeSchema{
    id: number,
    name?: string
    type: NodeSchemaType,
    position: {
        top: number,
        left: number
    },
    properties: any
}

export type NodeConnection = {
    idTo: number,
    idFrom: number
}