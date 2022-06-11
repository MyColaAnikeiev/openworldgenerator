import { NodeTreeSnapshot } from "../generator/types"
import { Orientation, PlanePosition } from "./types"


export type EngineSceneParams = {
    fogType?: 'none' | 'linear' | 'exponantial',
    fogColor?: number | string,
    linearFogNear?: number,
    linearFogFar?: number,
    exponentialFoxDensity?: number,

    sceneClearColor?: number | string,
    sceneBackgroundColor?: number | string,

    ambientLightIntensity?: number,
    ambientLightColor?: number | string,
    sunLightIntensity?: number,
    sunLightColor?: number | string
}


/**
 * Objects
 */
export type EntityType = "viewer"

export type EntityDescription = {
    id: number,
    type: EntityType,
    position: PlanePosition,
    orientation: Orientation
}


export type ControllerType = 'viewer';

export type ControllerDescription = {
    type: ControllerType,
    targetId: number
}


export type CameraType = 'first-person';

export type CameraDescription = {
    type: CameraType,
    targetId: number
}

export type EngineOjectsDescription = {
    entities: EntityDescription[],
    camera: CameraDescription,
    controllers: ControllerDescription[]
}



export type TerrainManagerParams = {
    chunkSize?: number,
    hysteresis?: number,
    rounds?: number,
    terrainResolution?: number,
    sourceNodeId?: number,
    planeTextureMapSrc?: string,
    planeTextureSize?: number
}

export type TerreinManagerDescription = {
    params: TerrainManagerParams
}

export type EnginePreset = {
    nodeTreeSnapshot: NodeTreeSnapshot,
    scene: EngineSceneParams,
    terrainManager: TerrainManagerParams,
    objectDescriptions: EngineOjectsDescription
}