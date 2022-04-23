/**
 * Provide a common interface for tree like structure of perlin noise sources,
 * filters and other operators. It should be noted that such operators do not 
 * check for loops, so such checks should be done at tree building stage.
 */
 export abstract class PerlinNode{
    abstract getValue(x: number, y: number): number;

    abstract updateProperties(props: {[key: string]: number});
}