import { EngineOjectsDescription, EngineSceneParams, TerrainManagerParams } from "./loader-types";



export class EngineLoader{

    constructor(storageName: string = 'default'){
    }

    public getEngineSceneParams(): EngineSceneParams{
        return {}
    }

    public getTerrainManagerParams(): TerrainManagerParams{
        return {
            chunkSize: 100,
            hysteresis: 0.1,
            rounds: 15,
            terrainResolution: 100,
            sourceNodeId: 2
        }
    }


    public getObjectDescription() : EngineOjectsDescription{
        return {
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
    }

}