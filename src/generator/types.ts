export interface NodePropUpdateChanges{
    seed?: number,
    size?: number,
    numOfInputs?: number,
    weight?: {
        index: number
        value: number,
    }
}
