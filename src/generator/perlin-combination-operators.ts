import { NodeParamsUpdateChanges } from "./types";
import { PerlinNode } from './perlin-node'

/**
 *  Sums up outputs of `PerlinNode` array.
 */
export class PerlinCombine implements PerlinNode{

    constructor(private sources: PerlinNode[]) {
    }


    updateParameters(props: NodeParamsUpdateChanges){
        /* This node don't take any params. */
    }

    getValue(x: number, y: number): number {
        return this.sources.reduce( (prev: number, node: PerlinNode) => {
            return prev + node.getValue(x,y);
        }, 0)
    }

    updateSources(sources: PerlinNode[]){
        this.sources = sources;
    }

}


export type NodeWeightPair = { node: PerlinNode, weight: number};
/**
 *  Sums up weighted outputs of provided `PerlinNode` array.
 */
export class PerlinCombineWeighted implements PerlinNode{
    constructor( private sources: NodeWeightPair[] ) 
    {}

    getValue(x: number, y: number): number {
        return this.sources.reduce((prev: number, pair: NodeWeightPair) => {
            return prev + pair.node.getValue(x,y) * pair.weight;
        }, 0)
    }

    updateSources(sources: NodeWeightPair[]){
        this.sources = sources;
    }

    updateParameters(props: NodeParamsUpdateChanges){
        if(props.weight !== undefined){
            if(this.sources.length > props.weight.index){
                this.sources[props.weight.index].weight = props.weight.value;
            }
        }
    }
    
}