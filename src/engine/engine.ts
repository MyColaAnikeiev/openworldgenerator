import { GeneratorNodeTree } from "../generator/node-tree-generator";
import { EngineLoader } from "./engine-loader";
import { EngineObjects } from "./engine-objects";
import { EngineScene } from "./engine-scene";
import { TerrainManager } from "./terrain-manager";


export class Engine{

    private loader: EngineLoader;

    private hostDomElement: HTMLElement;
    private nodeTree: GeneratorNodeTree;

    private engineScene: EngineScene;
    private objects: EngineObjects;
    private terrainManager: TerrainManager;

    // Loop 
    private animationRequestId: number;
    private running: boolean = false;

    constructor(
        hostDomElement: HTMLElement,
        nodeTree: GeneratorNodeTree,
        loader: EngineLoader
    ){
        this.hostDomElement = hostDomElement;
        this.nodeTree = nodeTree;
        this.loader = loader;

        this.init();
    }

    public start(){
        if(this.running){
            this.stop();
        }

        this.running = true;
        this.loop();
    }

    public stop(){
        if(this.running){
            this.running = false;
            cancelAnimationFrame(this.animationRequestId);
        }
    }

    /**
     * @returns an element containing canvas that used for rendering by this engine.
     */
    public getDomElement(): HTMLElement{
        return this.hostDomElement;
    }

    public getEngineScene(): EngineScene{
        return this.engineScene;
    }


    public getGeneratorNodeTree(): GeneratorNodeTree{
        return this.nodeTree;
    }


    public getTerrainManager(): TerrainManager{
        return this.terrainManager;
    }


    public dispose(): void{
        this.engineScene.dispose();
    }

    private init(): void{        
        this.engineScene = new EngineScene(this.hostDomElement, this.loader);
        this.terrainManager = new TerrainManager(this.engineScene.getScene(), this.nodeTree, this.loader);
        this.objects = new EngineObjects(this, this.loader);
    }



    private loop(): void{
        if(!this.running){
            return
        }

        this.objects.step();
        this.terrainManager.setViewPosition(this.objects.getMainPosition());
        this.engineScene.render(this.objects.getCamera());

        this.animationRequestId = requestAnimationFrame(this.loop.bind(this));
    }
}