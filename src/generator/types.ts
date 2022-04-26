import { PerlinNode } from "./perlin-node";

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
}

export type FilterParams = { 
    scale?: number,
    add?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number
    controlNode?: PerlinNode
}
export type FilterFactory = (node: PerlinNode, params: FilterParams) => ((x: number, y:number) => number)
