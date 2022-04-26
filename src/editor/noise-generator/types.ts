export type NodeSchemaType = 'source' | 'combinator' | 'filter';

export type NodeSchemaSubtype = 
    // Generators    
        'perlin' |
    // Combinators
        'combinator' | 'weighted-combinator' |
    // Filters
        "scale" | "dynamic-scale" | "binary";
 

export type SourceSchemaProperties = {
    size: number,
    seed: number
};

export type CombinatorSchemaProperties = {
    numOfInputs: number;
    weights?: number[];
};

export type NoiseFilterType = "scale" | "dynamic-scale" | "binary";

export type FilterSchemaProperties = {
    scale?: number,
    add?: number,
    threshold?: number,
    upperValue?: number,
    lowerValue?: number
}

export type NodeSchemaProperties = {
    size?: number,
    seed?: number,
    numOfInputs?: number,
    weights?: number[],
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
    subtype: NodeSchemaSubtype,
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