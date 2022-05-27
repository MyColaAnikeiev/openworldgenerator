import { NodeParamsUpdateChanges } from "./types";

/**
 * Provide a common interface for tree like structure of noise sources,
 * filters and other operators. It should be noted that such operators do not 
 * check for loops, so such checks should be done at tree building stage.
 */
 export abstract class GeneratorNode{
    abstract getValue(x: number, y: number): number;

    /**
     * 
     * @param props provides parameters for different `GeneratorNode`s. Parameters that are unsupported by given `GeneratorNode` type will be ignored.
     */
    abstract updateParameters(props: NodeParamsUpdateChanges): void;
}