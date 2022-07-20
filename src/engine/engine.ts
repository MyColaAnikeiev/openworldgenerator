import { GeneratorNodeTree } from "../generator/node-tree-generator";
import { DecorationsManager } from "./decorations-manager/decorations-manager";
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

    getDecorationsManager(): DecorationsManager;

    getEngineObjects(): EngineObjects;
}

export class Engine implements EngineControllerInterface, EngineUserInterface{

    private loader: EngineLoader;

    private hostDomElement: HTMLElement;
    private nodeTree: GeneratorNodeTree;

    // This are objects owned and managed by engine.
    private engineScene: EngineScene;
    private objects: EngineObjects;
    private terrainManager: TerrainManager;
    private decorationsManager: DecorationsManager;

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

    public getDecorationsManager(): DecorationsManager {
        return this.decorationsManager
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
        this.decorationsManager.dispose();
    }

    private init(): void{        
        this.engineScene = new EngineScene(this, this.getDomElement(), this.loader);
        this.terrainManager = new TerrainManager(this.engineScene.getScene(), this.getGeneratorNodeTree(), this.loader);
        this.decorationsManager = new DecorationsManager(this, this.nodeTree, this.loader);
        this.objects = new EngineObjects(this, this.loader);
    }



    private loop(): void{
        if(!this.running){
            return
        }

        this.objects.step();
        const viewPos = this.objects.getMainPosition();
        this.terrainManager.setViewPosition(viewPos);
        this.decorationsManager.setViewPosition(viewPos);
        this.engineScene.render(this.objects.getCamera());

        this.animationRequestId = requestAnimationFrame(this.loop.bind(this));
    }

}