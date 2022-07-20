import { NodeTreeSnapshot } from "../generator/types"
import { Orientation, PlanePosition } from "./types"


export type EngineSceneParams = {
    fogType?: 'none' | 'linear' | 'exponential',
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


// Terrain
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

// Decorations
export type DecorationVariantParams = {
    probability: number,
    modelSrc: string,
    gltfNodeName: string | null,
    scale: number,
    translate: {x: number, y: number, z: number},
    envMapIntensity?: number,
    alphaTest?: number,
    color?: number | string
}

/**
 * Used to specify changes to `DecorationVariantParams` (hence 'Diff' ending).
 * `null` option for `envMapIntensity`, `alphaCutoff` and `color` is there to
 * to tell that that such property should be deleted from 
 * `DecorationVariantParams`.
 */
export type DecorationVariantParamsDiff = {
    probability?: number,
    modelSrc?: string,
    gltfNodeName?: string | null,
    scale?: number,
    translate?: {x: number, y: number, z: number},
    envMapIntensity?: number | null,
    alphaTest?: number | null,
    color?: number | string | null
}

export type DecorationChunkParams = {
    displayed: boolean,
    chunkSize: number,
    hysteresis: number,
    rounds: number,
    probabilityMapId: number,
    density: number,
    variants: DecorationVariantParams[]
}

/**
 * Used to specify changes to `DecorationVariantParams` (hence 'Diff' ending).
 */
export type DecorationChunkParamsDiff = {
    displayed?: boolean,
    chunkSize?: number,
    hysteresis?: number,
    rounds?: number,
    probabilityMapId?: number,
    density?: number
}

export type DecorationManagerParams = {
    chunkManagers: DecorationChunkParams[];
}


// General

export type EnginePreset = {
    nodeTreeSnapshot: NodeTreeSnapshot,
    scene: EngineSceneParams,
    terrainManager: TerrainManagerParams,
    decorationManager: DecorationManagerParams,
    objectDescriptions: EngineOjectsDescription,
}