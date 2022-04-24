import { NodePropUpdateChanges } from "./types";

/**
 * Provide a common interface for tree like structure of perlin noise sources,
 * filters and other operators. It should be noted that such operators do not 
 * check for loops, so such checks should be done at tree building stage.
 */
 export abstract class PerlinNode{
    abstract getValue(x: number, y: number): number;

    /**
     * 
     * @param props provides parameters for different `PerlinNode`s. Parameters that are unsupported by given `PerlinNode` type will be ignored.
     */
    abstract updateProperties(props: NodePropUpdateChanges): void;
}