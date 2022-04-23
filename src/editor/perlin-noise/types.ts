export type NodeSchemaType = 'source' | 'combinator' | 'weighted-combinator' | 'filter';

export type SourceSchemaProperties = {
    size: number,
    seed: number
};

export type CombinatorSchemaProperties = {
    weighted: boolean;
    weights?: number[];
};

export type FilterSchemaProperties = {
    filterType: "scale" | "dynamic-scale" | "binary";
    scale?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number
}

export type NodeSchemaProperties = 
    SourceSchemaProperties | CombinatorSchemaProperties | FilterSchemaProperties;

export interface NodeSchema{ 
    id: number,
    name?: string
    type: NodeSchemaType,
    position: {
        top: number,
        left: number
    },
    properties: NodeSchemaProperties
}

export type NodeConnection = {
    idTo: number,
    idFrom: number,
    targetType: "default" | "scale-filter.control"
}