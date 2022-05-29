import { NodeTreeSnapshot } from "../generator/types";
import { defaultPreset } from "./default-preset";
import { EngineUserInterface } from "./engine";
import { EngineLoader } from "./engine-loader";
import { EngineOjectsDescription, EnginePreset, EngineSceneParams, TerrainManagerParams } from "./loader-types";


export interface PresetStorageManager{

    /**
     * Returns array of preset names that are stored in browser local storage.
     */
    getPresetList(): string[];

    /**
     * Get current preset name on which storage manager is working.
     */
    getCurrentPresetName(): string;

    /**
     * Get current preset on which storage manager is working.
     */
    getCurrentPreset(): EnginePreset;



    // Methods influencing class inner state (parameters and current presetName):

    /**
     * Loads preset from browser storage using provided preset `name`.
     */
    selectPreset(name: string): void;

    /**
     * Change name for currently loaded params.
     * Useful when you want to save copy of loaded preset with different name.
     */
    renameCurrentPreset(newName: string): void;

     /**
     * Extracts parameters from provided `engine` and update with it inner class state. 
     * To save it to browser storage call `savePreset()`.
     */
    extractParams(engine: EngineUserInterface): void;

    /**
     * Sets current preset and preset name to manager inner state.
     */
    setCurrentPreset(name: string, preset: EnginePreset): void;



    // Methods only influencing browser local storage:

    /**
     * Save currently loaded preset parameters to curently selected name in browser local storage.
     * If in browser local storage exits preset with name equal to currently selected name, then
     * it will be overwriten. If you want to create a copy or save both original and modified 
     * presets then change currently selected name to something else with `renameCurrentPreset()`
     * before saving.
     */
    savePreset(): void;

    /**
     * Renames preset in browser storage. Currently loaded preset prarams and name won't be changed.
     */
    renamePreset(oldName: string, newName: string): void;

    /**
     * Removes preset from browser storage. Currently loaded preset prarams and name won't be changed.
     */
    removePreset(name: string): void;
}

export class PresetStorage implements EngineLoader,PresetStorageManager{

    private currentPreset: EnginePreset = defaultPreset;
    private curPresetName: string = 'default';

    /**
     * If `presetName` is `null` then last selected preset name will be used, or
     * default if there isn't any.
     */
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

    getCurrentPresetName(): string {
        return this.curPresetName;
    }

    getCurrentPreset(): EnginePreset {
        return this.currentPreset;
    }

    /**
     * Loads preset from browser storage.
     */
    public selectPreset(name: string): void{
        this.loadPreset(name);
    }

    /**
     * Save currently loaded preset parameters to curently selected name in browser local storage.
     */
    public savePreset(): void{
        
        if(this.curPresetName == "default"){
            let ind = 0;
            while (true){
                if(globalThis.localStorage.getItem("default_" + String(ind))){
                    ind++;
                }else{
                    break;
                }
            }

            this.curPresetName = "default_" + String(ind);
        }

        this.addPresetName(this.curPresetName);
        globalThis.localStorage.setItem("preset_" + this.curPresetName, JSON.stringify(this.currentPreset));
    }

    /**
     * Change name for currently loaded params but without affecting browser storage.
     * Useful when you want to save copy of loaded preset with different name.
     */
    public renameCurrentPreset(newName: string): void{
        this.curPresetName = newName;
    }

    /**
     * Renames preset in browser storage. Currently loaded preset prarams and name won't be changed.
     */
    public renamePreset(oldName: string, newName: string): void{
        const presetStr = globalThis.localStorage.getItem("preset_"+oldName);
        if(presetStr === null){
            return;
        }

        this.removePreset(oldName);
        
        globalThis.localStorage.setItem("preset_" + newName, presetStr);
        this.addPresetName(newName);
    }

    /**
     * Removes preset from browser storage. Currently loaded preset prarams and name won't be changed.
     */
    public removePreset(name: string): void{
        globalThis.localStorage.removeItem("preset_"+name);
        
        // Remove from list
        const listStr = localStorage.getItem("preset_list");
        if(listStr !== null){
            let list = JSON.parse(listStr) as string[];
            list = list.filter(cur => cur != name);
            globalThis.localStorage.setItem("preset_list", JSON.stringify(list));
        }
    }

    setCurrentPreset(name: string, preset: EnginePreset): void {
        this.curPresetName = name;
        this.currentPreset = preset;
    }
    
    /**
     * Extracts parameters from provided `engine` and update with it inner class state. 
     * To save it to browser storage call `savePreset()`.
     */
    public extractParams(engine: EngineUserInterface): void{
        const cur = this.currentPreset;        

        const sceneParms = engine.getEngineScene().getParams();
        cur.scene = {...cur.scene, ...sceneParms};

        const terrainParams = engine.getTerrainManager().getParams();
        cur.terrainManager = {...cur.terrainManager, ...terrainParams};

        const nodeTreeSnapshot = engine.getGeneratorNodeTree().getNodeTreeSnapshot()
        cur.nodeTreeSnapshot = nodeTreeSnapshot;
    }

    /**
     * Adds preset name to preset list.
     */
    private addPresetName(name: string): void{
        const listStr = globalThis.localStorage.getItem("preset_list");
        let list = [];
        if(listStr !== null){
            list = JSON.parse(listStr);
        }

        const exist = list.some(cur => cur == name);
        if(!exist){
            list.push(name);
        }
        
        globalThis.localStorage.setItem("preset_list", JSON.stringify(list));
    }

    private loadLastSelected(): void{
        const lastSelected = globalThis.localStorage.getItem("last_selected");
        this.loadPreset(lastSelected);
    }
    

    private loadPreset(name: string): void{
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

        this.curPresetName = name;
        globalThis.localStorage.setItem("last_selected", name);
        this.currentPreset = preset;
    }

}