import { NodeTreeSnapshot } from "../generator/types";
import { defaultPreset } from "./default-preset";
import { EngineLoader } from "./engine-loader";
import { EngineOjectsDescription, EnginePreset, EngineSceneParams, TerrainManagerParams } from "./loader-types";


export class PresetStorage implements EngineLoader{

    private currentPreset: EnginePreset = defaultPreset;

    constructor(presetName: string | null){
        if(presetName === null){
            this.loadLastSelected();
        }else{
            this.loadPreset(presetName);
        }
    }

    public getNodeTreeSnapshot(): NodeTreeSnapshot{
        return this.currentPreset.nodeTreeSnapshot;
    }

    public getEngineSceneParams(): EngineSceneParams{
        return this.currentPreset.scene;
    }

    public getTerrainManagerParams(): TerrainManagerParams{
        return this.currentPreset.terrainManager;
    }

    public getObjectDescription() : EngineOjectsDescription{
        return this.currentPreset.objectDescriptions;
    }

    /**
     * Get list of preset names that are stored in localStorage.
     */
    public getPresetList(): string[]{
        const listJsonStr = globalThis.localStorage.getItem("preset_list");
        if(listJsonStr === null){
            return [];
        }

        const list = JSON.parse(listJsonStr);
        if(typeof list !== "object" || !list.length){
            return [];
        }

        return list;
    }

    private loadLastSelected(){
        const lastSelected = globalThis.localStorage.getItem("last_selected");
        this.loadPreset(lastSelected);
    }
    
    /**
     * Loads defaults if not found.
     */
    private loadPreset(name: string){
        this.currentPreset = defaultPreset;

        const presetStr = globalThis.localStorage.getItem("preset_" + name);

        if(presetStr === null){
            return;
        }

        const preset = JSON.parse(presetStr) as EnginePreset;
        
        // Not going to check any farther than that as i going to save presets to
        // the storage strictly in reverce maner.
        if(typeof preset !== "object"){
            return;
        }

        globalThis.localStorage.setItem("last_selected", name);
        this.currentPreset = preset;
    }
}