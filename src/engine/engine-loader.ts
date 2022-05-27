import { EngineOjectsDescription, EngineSceneParams, TerrainManagerParams } from "./loader-types";



export interface EngineLoader {

    getEngineSceneParams(): EngineSceneParams;

    getTerrainManagerParams(): TerrainManagerParams;

    getObjectDescription() : EngineOjectsDescription;
    
}