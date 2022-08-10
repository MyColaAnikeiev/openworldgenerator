import { DecorationManagerParams, EngineOjectsDescription, EngineSceneParams, TerrainManagerParams } from "./loader-types";



export interface EngineLoader {

    getEngineSceneParams(): EngineSceneParams;

    getTerrainManagerParams(): TerrainManagerParams;

    getDecorationsManagerParams(): DecorationManagerParams;

    getObjectDescription() : EngineOjectsDescription;
    
}