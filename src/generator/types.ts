export type NodeSchemaType = 'source' | 'combinator' | 'filter';

export type NodeSchemaSubtype = 
    // Generators    
        'perlin' | 'simple-noise' | 'simple-noise2' | 'voronoi' | "cellular" | "simplex" |
    // Combinators
        'combinator' | 'weighted-combinator' |
    // Filters
        "scale" | "dynamic-scale" | "binary" | "limit" | "smooth-limit";
 

export type SourceSchemaProperties = {
    size: number,
    seed: number
};

export type CombinatorSchemaProperties = {
    numOfInputs: number;
    weights?: number[];
};

export type NoiseFilterType = "scale" | "dynamic-scale" | "binary";

export type NodeSchemaProperties = {
    size?: number,
    seed?: number,
    numOfInputs?: number,
    weights?: number[],
    scale?: number,
    add?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number,
    maxValue?: number,
    minValue?: number,
    smoothness?: number
}

export interface NodeSchema{ 
    id: number,
    name?: string,
    previewOn: boolean,
    type: NodeSchemaType,
    subtype: NodeSchemaSubtype,
    position: {
        top: number,
        left: number
    },
    properties: NodeSchemaProperties
}

export type ConnectionTargetType = "default" | "scale-filter.control";

export interface NodeConnection {
    idTo: number,
    idFrom: number,
    targetType: ConnectionTargetType,
    targetEntryNumber?: number
}

export interface NodeTreeSnapshot{
    nodes: NodeSchema[]
    connections: NodeConnection[]
}