import { NodeTreeSnapshot } from "../generator/types"
import { Orientation, PlanePosition } from "./types"


export interface EngineSceneParams{
    fogType: 'none' | 'linear' | 'exponential'
    fogColor: number | string
    linearFogNear: number
    linearFogFar: number
    exponentialFoxDensity: number
    sceneClearColor: number | string
    sceneBackgroundColor: number | string

    ambientLightIntensity: number
    ambientLightColor: number | string
    sunLightIntensity: number
    sunLightColor: number | string
}

/**
 * Objects
 */
export type EntityType = "viewer" | "orbital-viewer"

export interface EntityDescription {
    id: number
    type: EntityType
    position: PlanePosition
    orientation: Orientation
}


export type ControllerType = 'viewer';

export interface ControllerDescription {
    type: ControllerType
    targetId: number
}


export type CameraType = 'first-person';

export interface CameraDescription {
    type: CameraType
    targetId: number
}

export interface EngineOjectsDescription {
    entities: EntityDescription[]
    camera: CameraDescription
    controllers: ControllerDescription[]
}


// Terrain
export interface TerrainManagerParams{
    chunkSize: number
    hysteresis: number
    rounds: number
    terrainResolution: number
    sourceNodeId: number
    planeTextureMapSrc: string
    planeTextureSize: number
}

// Decorations
export interface DecorationVariantParams {
    id: number
    probability: number
    modelSrc: string
    gltfNodeName: string | null
    scale: number
    translate: {x: number, y: number, z: number}
    envMapIntensity?: number
    alphaTest?: number
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

export interface DecorationChunkParams {
    id: number
    seed: number
    displayed: boolean
    chunkSize: number
    hysteresis: number
    rounds: number
    probabilityMapId: number | null
    density: number
    variants: DecorationVariantParams[]
}

type DecorationChunkUpdatebleParams = 
  'displayed' | 
  'chunkSize' | 
  'hysteresis' | 
  'rounds' | 
  'probabilityMapId' |
  'density'

export type DecorationChunkParamsDiff = {
    [K in DecorationChunkUpdatebleParams]+?: DecorationChunkParams[K]
}

export interface DecorationManagerParams {
    chunkManagers: DecorationChunkParams[]
}

export interface EnginePreset {
    nodeTreeSnapshot: NodeTreeSnapshot
    scene: EngineSceneParams
    terrainManager: TerrainManagerParams
    decorationManager: DecorationManagerParams
    objectDescriptions: EngineOjectsDescription
}