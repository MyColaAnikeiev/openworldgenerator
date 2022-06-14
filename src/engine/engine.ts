import { GeneratorNodeTree } from "../generator/node-tree-generator";
import { EngineLoader } from "./engine-loader";
import { EngineObjects } from "./engine-objects";
import { EngineScene } from "./engine-scene";
import { TerrainManager } from "./terrain-manager";

export interface EngineControllerInterface{
    /**
     * Start main loop.
     */
    start(): void;
    /**
     * Stop (pause engine) main loop.
     */
    stop(): void;

    /**
     * Change container element for rendering canvas.
     */
    changeHostElement(container: HTMLElement): void;

    /**
     * Free resurces.
     */
    dispose(): void;
}

export interface EngineUserInterface{
 
    getDomElement(): HTMLElement;
    
    getEngineScene(): EngineScene;
 
    getGeneratorNodeTree(): GeneratorNodeTree;
 
    getTerrainManager(): TerrainManager;
}

export class Engine implements EngineControllerInterface, EngineUserInterface{

    private loader: EngineLoader;

    private hostDomElement: HTMLElement;
    private nodeTree: GeneratorNodeTree;

    // This are objects owned and managed by engine.
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
        console.log(this)
    }

    public start(): void{
        if(this.running){
            this.stop();
        }

        this.running = true;
        this.loop();
    }

    public stop(): void{
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

    public getEngineObjects(): EngineObjects{
        return this.objects;
    }

    public getGeneratorNodeTree(): GeneratorNodeTree{
        return this.nodeTree;
    }


    public getTerrainManager(): TerrainManager{
        return this.terrainManager;
    }

    public changeHostElement(element: HTMLElement): void {
        this.hostDomElement = element;
        this.getEngineScene().changeHostElement(element);
    }

    public dispose(): void{
        this.stop();

        this.engineScene.dispose();
        this.objects.dispose();
        this.terrainManager.dispose();
    }

    private init(): void{        
        this.engineScene = new EngineScene(this, this.getDomElement(), this.loader);
        this.terrainManager = new TerrainManager(this.engineScene.getScene(), this.getGeneratorNodeTree(), this.loader);
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