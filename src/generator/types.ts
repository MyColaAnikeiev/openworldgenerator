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
