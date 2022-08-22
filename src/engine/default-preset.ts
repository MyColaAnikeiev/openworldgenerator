import { NodeConnection, NodeSchema, NodeTreeSnapshot } from "../generator/types";
import { DecorationManagerParams, EngineOjectsDescription, EnginePreset, EngineSceneParams, TerrainManagerParams } from "./preset-types";

export const nodeSchemas: NodeSchema[] = [
    {
        id: 1,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 70, left: 200 },
        properties: {
            size: 6,
            seed: 0
        }
    },
    {
        id: 3,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 300, left: 120 },
        properties: {
            size: 18,
            seed: 1
        }
    },
    {
        id: 2,
        previewOn: true,
        type: 'combinator',
        subtype: "weighted-combinator",
        position: { top: 320, left: 420 },
        properties: {
            numOfInputs: 6,
            weights: [0.9,3.8,9, 17,45,110]
        }
    },
    {
        id: 4,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 70, left: 200 },
        properties: {
            size: 45,
            seed: 2
        }
    },
    {
        id: 5,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 70, left: 200 },
        properties: {
            size: 105,
            seed: 5
        }
    },
    {
        id: 6,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 70, left: 200 },
        properties: {
            size: 405,
            seed: 6
        }
    },
    {
        id: 7,
        previewOn: true,
        type: 'source',
        subtype: "perlin",
        position: { top: 70, left: 200 },
        properties: {
            size: 1505,
            seed: 7
        }
    }
];

export const nodeConnections: NodeConnection[] = [
    { targetType: "default", idFrom: 1, idTo: 2, targetEntryNumber: 0},
    { targetType: "default", idFrom: 3, idTo: 2, targetEntryNumber: 1},
    { targetType: "default", idFrom: 4, idTo: 2, targetEntryNumber: 2},
    { targetType: "default", idFrom: 5, idTo: 2, targetEntryNumber: 3},
    { targetType: "default", idFrom: 6, idTo: 2, targetEntryNumber: 4},
    { targetType: "default", idFrom: 7, idTo: 2, targetEntryNumber: 5}
];


const nodeTreeSnapshot: NodeTreeSnapshot = {
    nodes: nodeSchemas,
    connections: nodeConnections
}

const scene: EngineSceneParams = {
    fogType: 'none',
    fogColor: 0xffffff,
    linearFogNear: 100,
    linearFogFar: 1000,
    exponentialFoxDensity: 0.002,
    sceneClearColor: 0xffffff,
    sceneBackgroundColor: 0xffffff,
    ambientLightIntensity: 0.15,
    ambientLightColor: 0xffffff,
    sunLightIntensity: 0.85,
    sunLightColor: 0xffffff
};

const terrainManager: TerrainManagerParams = {
    chunkSize: 100,
    hysteresis: 0.1,
    rounds: 15,
    terrainResolution: 100,
    sourceNodeId: 2,
    planeTextureMapSrc: '',
    planeTextureSize: 1.0
};

const objectDescriptions: EngineOjectsDescription = {
    entities: [
        {
            id: 1,
            type: "viewer",
            position: {x:0, y:0},
            orientation: {horizontal: 0, vertical: 0}
        }
    ],
    camera: {
        type: "first-person",
        targetId: 1
    },
    controllers: [
        {
            type: "viewer",
            targetId: 1
        }
    ]
}   

const decorationManager: DecorationManagerParams = {
    chunkManagers: []
}


export const defaultPreset: EnginePreset = {
    nodeTreeSnapshot,
    scene,
    terrainManager,
    decorationManager,
    objectDescriptions
};