export type NodeSchemaType = 'source' | 'combinator' | 'weighted-combinator' | 'filter';

export type SourceSchemaProperties = {
    size: number,
    seed: number
};

export type CombinatorSchemaProperties = {
    numOfInputs: number;
    weights?: number[];
};

export type PerlinFilterType = "scale" | "dynamic-scale" | "binary";

export type FilterSchemaProperties = {
    filterType: PerlinFilterType
    scale?: number,
    add?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number
}

export type NodeSchemaProperties = {
    size?: number,
    seed?: number
    numOfInputs?: number;
    weights?: number[];
    filterType?: PerlinFilterType
    scale?: number,
    add?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number
}

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
    targetType: "default" | "scale-filter.control",
    // 
    targetEntryNumber?: number
}