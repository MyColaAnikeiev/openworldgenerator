import { PerlinNode } from './perlin-node'

/* Type declarations */
export type FilterParams = { 
    scale?: number,
    threshold?: number
    upperValue?: number,
    lowerValue?: number
    controlNode?: PerlinNode
}
export type FilterFactory = (node: PerlinNode, params: FilterParams) => ((x: number, y:number) => number)



/**
 * Input source, filter function or params could be changed on fly 
 */
export class PerlinFilter implements PerlinNode{  
    private filter: (x:number, y:number) => number;

    /**
     * Takes `source` as input. Provide `filterFactory` function of choice with corresponding
     * to it `params` (see factory function description). 
     */
    constructor(
        private source: PerlinNode, 
        private filterFactory: FilterFactory,
        private params: FilterParams
    )
    {
        this.filter = filterFactory(source, params);
    }

    getValue(x: number, y: number){
        return this.filter(x,y);
    }

    
    updateSource(source: PerlinNode){
        this.source = source;
        this.filter = this.filterFactory(this.source, this.params);
    }

    updateFilter(
        filterFactory: (node: PerlinNode, params: FilterParams) => ((x: number, y:number) => number),
        params: FilterParams
    ){
        this.filterFactory = filterFactory;
        this.params = params;
        this.filter = filterFactory(this.source, params);
    }

    /**
     * Unspecified parameters will preserve it's previous values.
     */
    updateParams(params: FilterParams){
        this.params = Object.assign({}, this.params, params);
        this.filter = this.filterFactory(this.source, params);
    }
}



/**********************
 *  Below are factory function for `PerlinFilter` class
 */

/**
 * Scales input value.
 * Set `scale` to -1.0 to inverse.
 * @param params.scale
 */
export function PerlinScaleFilterFactory(node: PerlinNode, params : FilterParams){
    const scale = "scale" in params ? params.scale : 1.0;

    return function(x: number, y: number){
        return node.getValue(x,y) * scale;
    }
}

/**
 * Similar to `ScaleFilter` but instead of constant scale value it uses
 * `PerlinNode` provided by `params.controlNode` 
 * @param params.controlNode
 */
 export function PerlinDynamicScaleFilterFactory(node: PerlinNode, params : FilterParams){
    if("controlNode" in params){
        const control = params.controlNode;

        return function(x: number, y: number){
            return node.getValue(x,y) * control.getValue(x,y)
        }
    }
    
    return (x: number, y: number) => 0;
}


/**
 * Outputs only two numbers `lowerValue` or `upperValue` depending on treshhold set by `threshold`. 
 * 
 * @param params.threshold - if input value from `node` is less then `threshold` then filter outputs `lowerValue`, and `upperValue` otherwise. (default 0)
 * @param params.lowerValue default 0
 * @param params.upperValue default 1
 * 
 * @usageNotes
 * 
 * Providing params where `lowerValue` > `upperValue` is alowed.
 */
export function PerlinBinaryFilterFactory(node: PerlinNode, params : FilterParams){
    const threshold = "threshold" in params ? params.threshold : 0;
    const lowerValue = "lowerValue" in params ? params.lowerValue : 0;
    const upperValue = "upperValue" in params ? params.upperValue : 1;

    return function(x: number, y: number){
        return node.getValue(x,y) < threshold ? lowerValue : upperValue;
    }
}

