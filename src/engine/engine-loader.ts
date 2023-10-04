import { DecorationManagerParams, EngineOjectsDescription, EngineSceneParams, TerrainManagerParams } from "./preset-types";



export interface EngineLoader {

    getEngineSceneParams(): EngineSceneParams;

    getTerrainManagerParams(): TerrainManagerParams;

    getDecorationsManagerParams(): DecorationManagerParams;

    getObjectDescription() : EngineOjectsDescription;
    
}