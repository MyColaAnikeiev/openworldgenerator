import { Object3D } from "three"


export enum ChunkReadyState{
    stoped, // Not generated. Was canceled
    pending, // If not stoped, when finished, generator will set state `used`
    ready, // When it generated but not used.
    used // When it generated and used
}

export type ChunkInstance = {
    // Min and max distance from central chunk that correspond to same simplificationLevel
    minRound: number, 
    maxRound: number,
    // Used for optimization based on distance from central chunk.
    simplificationLevel: number,
    // Set stoped when generation need to be canceled. 
    state: ChunkReadyState,
    object3D: Object3D | null
}

export type ChunkArea = { 
    i: number, 
    j: number,
    currentRound: number, // Current distance (manhattan metric) from central chunk
    instances: ChunkInstance[]
}

export type ChunkGenState = {
    readonly chunkArea: ChunkArea,
    readonly instance: ChunkInstance,
    // May be used by generation task runner to save intermediate results if task is split midway.
    generationState: null | {
        [key:string]: any
    }
}