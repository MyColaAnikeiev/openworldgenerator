import { FilterFactory, FilterParams, NodeParamsUpdateChanges } from "./types";
import { GeneratorNode } from './generator-node'

/**
 * Input source, filter function or params could be changed on fly 
 */
export class NoiseFilter implements GeneratorNode{  
    private filter: (x:number, y:number) => number;

    /**
     * Takes `source` as input. Provide `filterFactory` function of choice with corresponding
     * to it `params` (see factory function description). 
     */
    constructor(
        private source: GeneratorNode, 
        private filterFactory: FilterFactory,
        private params: FilterParams
    )
    {
        this.filter = filterFactory(source, params);
    }

    getValue(x: number, y: number){
        return this.filter(x,y);
    }

    
    updateSource(source: GeneratorNode){
        this.source = source;
        this.filter = this.filterFactory(this.source, this.params);
    }

    updateFilter(
        filterFactory: (node: GeneratorNode, params: FilterParams) => ((x: number, y:number) => number),
        params: FilterParams
    ){
        this.filterFactory = filterFactory;
        this.params = params;
        this.filter = filterFactory(this.source, params);
    }

    /**
     * Unspecified parameters will preserve it's previous values.
     */   
    updateParameters(params: NodeParamsUpdateChanges){
        this.params = Object.assign({}, this.params, params);
        this.filter = this.filterFactory(this.source, this.params);
    }
}



/**********************
 *  Below are factory function for `NoiseFilter` class
 */

/**
 * Scales input value.
 * Set `scale` to -1.0 to inverse.
 * @param params.scale
 */
export function NoiseScaleFilterFactory(node: GeneratorNode, params : FilterParams){
    const scale = params.scale !== undefined ? params.scale : 1.0;
    const add = params.add !== undefined ? params.add : 0.0;
 
    return function(x: number, y: number){
        return node.getValue(x,y) * scale + add;
    }
}

/**
 * Similar to `ScaleFilter` but instead of constant scale value it uses
 * `GeneratorNode` provided by `params.controlNode` 
 * @param params.controlNode
 */
 export function NoiseDynamicScaleFilterFactory(node: GeneratorNode, params : FilterParams){
    if(params.controlNode !== undefined){
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
export function NoiseBinaryFilterFactory(node: GeneratorNode, params : FilterParams){
    const threshold = params.threshold !== undefined ? params.threshold : 0;
    const lowerValue = params.lowerValue !== undefined ? params.lowerValue : 0;
    const upperValue = params.upperValue !== undefined ? params.upperValue : 1;

    return function(x: number, y: number){
        return node.getValue(x,y) < threshold ? lowerValue : upperValue;
    }
}

export function NoiseLimiterFilterFactory(node: GeneratorNode, params: FilterParams){
    const maxValue = params.maxValue !== undefined ? params.maxValue : 1.0;
    const minValue = params.minValue !== undefined ? params.minValue : -1.0;

    return function(x: number, y: number){
        let val = node.getValue(x,y);
        if(val > maxValue){
            val = maxValue;
        }
        if(val < minValue){
            val = minValue;
        }
        return val;
    }
}

export function NoiseSmoothLimiterFilterFactory(node: GeneratorNode, params: FilterParams){
    const maxValue = params.maxValue !== undefined ? params.maxValue : 1.0;
    const minValue = params.minValue !== undefined ? params.minValue : -1.0;
    const midValue = (maxValue + minValue) / 2.0;
    const half = maxValue - midValue;

    return function(x: number, y: number){
        let val = node.getValue(x,y) - midValue;
        val = half * (val*val) / (0.3 * half + val*val) * Math.sign(val) + midValue;
        return val;
    }
}