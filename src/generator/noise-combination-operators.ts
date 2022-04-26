import { NodeParamsUpdateChanges } from "./types";
import { GeneratorNode } from './generator-node'

/**
 *  Sums up outputs of `GeneratorNode` array.
 */
export class NoiseCombine implements GeneratorNode{

    constructor(private sources: GeneratorNode[]) {
    }


    updateParameters(props: NodeParamsUpdateChanges){
        /* This node don't take any params. */
    }

    getValue(x: number, y: number): number {
        return this.sources.reduce( (prev: number, node: GeneratorNode) => {
            return prev + node.getValue(x,y);
        }, 0)
    }

    updateSources(sources: GeneratorNode[]){
        this.sources = sources;
    }

}


export type NodeWeightPair = { node: GeneratorNode, weight: number};
/**
 *  Sums up weighted outputs of provided `GeneratorNode` array.
 */
export class NoiseCombineWeighted implements GeneratorNode{
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