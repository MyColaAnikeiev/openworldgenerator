import { Engine, EngineUserInterface } from "./engine/engine";
import { PresetStorage, PresetStorageManager } from "./engine/preset-storage"
import { GeneratorNodeTree } from "./generator/node-tree-generator";


export class EngineManager{

    private loader: PresetStorage;
    private nodeTree: GeneratorNodeTree;
    private engine: Engine

    private engineHostContainer: HTMLElement;

    constructor(){
        this.loader = new PresetStorage(null);
    }

    /**
     * @param elm will be set as container for canvas on which 3d scene is rendered. Previous container
     * will be dismissed.
     */
    public setEngineCanvasContainer(elm: HTMLElement): void{
        this.engineHostContainer = elm;

        if(this.engine){
            this.engine.changeHostElement(elm);
        }else{
            this.nodeTree = new GeneratorNodeTree(this.loader.getNodeTreeSnapshot());
            this.engine = new Engine(elm, this.nodeTree, this.loader);
            this.engine.start();
        }
    }    

    public getStorageManager(): PresetStorageManager{
        return this.loader;
    }
    
    public getEngine(): Engine | undefined{
        return this.engine;
    }

    public loadPeset(presetName: string){
        this.loader.selectPreset(presetName);
        
        if(this.engine && this.engineHostContainer){
            this.engine.dispose();
            this.nodeTree.dispose();
            
            this.nodeTree = new GeneratorNodeTree(this.loader.getNodeTreeSnapshot());
            this.engine = new Engine(this.engineHostContainer, this.nodeTree, this.loader);
            this.engine.start();
        }
    }

    /**
     * Provide `presetName` when you want to save preset under different name unstead
     * of updating existing one.
     */
    public savePreset(presetName?: string): void{
        if(!this.engine){
            return;
        }

        // Get current parameters from engine.
        this.loader.extractParams(this.engine);
        
        if(presetName){
            this.loader.renameCurrentPreset(presetName);
        }

        this.loader.savePreset();
    }

    /**
     * Free resourses.
     */
    public dispose(): void{
        this.engine.dispose();
        this.nodeTree.dispose();
    }
}