import { GeneratorNode } from "./generator-node";

export interface NodeParamsUpdateChanges{
    /* Source */
    seed?: number;
    size?: number;

    /* Combinator */
    numOfInputs?: number;
    weight?: {
        index: number;
        value: number;
    }

    /** Filters **/
    
    // Scale filter
    scale?: number;
    add?: number

    // Binary filter
    threshold?: number;
    upperValue?: number;
    lowerValue?: number;

    // Limiter
    maxValue?: number,
    minValue?: number,
    smoothness?: number
}

export type FilterParams = { 
    // Scale filter
    scale?: number,
    add?: number,

    // Binary filter
    threshold?: number
    upperValue?: number,
    lowerValue?: number

    // Dynamic scale
    controlNode?: GeneratorNode
    
    // Limiter
    maxValue?: number,
    minValue?: number,
    smoothness?: number
}

export type FilterFactory = (node: GeneratorNode, params: FilterParams) => ((x: number, y:number) => number)
