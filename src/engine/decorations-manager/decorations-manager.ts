import { NodeTreeUser } from "../../generator/node-tree-generator";
import { DecorationsChunkManager } from "../chunk-manager/decorations-chunk-manager";
import { EngineLoader } from "../engine-loader";
import { DecorationChunkParams, DecorationChunkParamsDiff, DecorationManagerParams, DecorationVariantParamsDiff } from "../preset-types";
import { PlanePosition } from "../types";
import { EngineUserInterface } from "../engine";
import { DecorationVariantsLoaderI } from "./decoration-variants-loader-interface";
import { DecorationVariantsLoader } from "./decoration-variant-loader";
import { ModelLoader } from "../../common/tools/model-loader/model-loader";
import { DecorationVariant } from "../chunk-manager/types";
import { ModelLoaderI } from "../../common/tools/model-loader/model-loader-interface";
import { SimpleStateMachine, SimpleStateMachineTransition } from "../../common/tools/state-machine";

/**
 * INTERFACE for retriving and editing {@link DecorationsManager} parameters.
 */
export interface DecorationsParamManager{

    /**
     * Obtain latest Params of {@link DecorationsManager}.
     */
    getParams(): DecorationManagerParams;

    /**
     * Create and add blank decoration chunk manager.
     */
    addChunkManager(): void;

    /**
     * @param managerId - id of {@link DecorationsChunkManager} to update
     * @param params one or more {@link DecorationsChunkManager} parameters to 
     * update. See {@link DecorationChunkParamsDiff} for available params.
     */
    updateChunkManager(id: number, param: DecorationChunkParamsDiff): void;
    
    /**
     * @param managerId - id of {@link DecorationsChunkManager} to deleted.
     */
    removeChunkManager(id: number): void;

    /**
     * Creates and adds blank decoration variant.
     * 
     * @param managerId - decoration chunk manager id to which decoration 
     * variant will be added.
     */
    addChunkManagerVariant(managerId: number): void;

    /**
     * 
     * @param managerId id of {@link DecorationsChunkManager} to whom 
     * DecorationVariant belongs to.
     * @param variantId id of {@link DecorationVariant} to be updated.
     * @param param one or more {@link DecorationVariantParams} parameters to
     * update.
     */
    updateChunkManagerVariant(managerId: number, variantId: number, param: DecorationVariantParamsDiff): void;

    /**
     * 
     * @param managerId id of {@link DecorationsChunkManager} to whom 
     * DecorationVariant belongs to.
     * @param variantId id of {@link DecorationVariant} to be deleted.
     */
    removeChunkManagerVariant(managerId: number, variantId: number): void;

}

type DecManagerStates = "NOTLOADED" | "LOADING" | "LOADED" | "CANCELED" | "DELETED"
const decManagerStateTransitions: SimpleStateMachineTransition<DecManagerStates>[] = [
    {fromState: "NOTLOADED", toState: "LOADING"},
    {fromState: "LOADING", toState: "LOADED"},
    {fromState: "LOADING", toState: "CANCELED"},
    {fromState: "CANCELED", toState: "NOTLOADED"},
    {fromState: "LOADED", toState: "NOTLOADED"},
    {fromState: "*", toState: "DELETED"}
]
interface ChunkManager {
    id: number,
    stateHolder: SimpleStateMachine<DecManagerStates>,
    instance: DecorationsChunkManager | null,
    decorationVariants: DecorationVariant[]
}

/**
 * Class for object responsible for creating, disposing and updating 
 * {@link DecorationsChunkManager}'s.
 */
export class DecorationsManager implements DecorationsParamManager{

    private params: DecorationManagerParams;
    private chunkManagers: ChunkManager[];
    private modelLoader: ModelLoaderI;
    private decorationVariantsLoader: DecorationVariantsLoaderI;
    private lastViewPosition: PlanePosition;
    
    constructor(private hostEngine: EngineUserInterface, private nodeTree: NodeTreeUser, private presetLoader: EngineLoader){
        this.modelLoader = new ModelLoader()
        this.decorationVariantsLoader = new DecorationVariantsLoader(hostEngine, this.modelLoader)

        const params = presetLoader.getDecorationsManagerParams();
        this.params = this.deepCopyParams(params)

        this.lastViewPosition = {x: 0, y: 0}

        this.initChunkManagers()
    }

    public getParams(): DecorationManagerParams{
        return this.deepCopyParams(this.params)
    }

    public addChunkManager(): void {
        const idList = this.params.chunkManagers.map(mng => mng.id)
        const newId = Math.max(0,...idList) + 1
        const seed =  parseInt(newId + (Math.floor(Math.random() * 1000) + 1000).toString())

        this.params.chunkManagers.push({
            id: newId,
            seed,
            displayed: true,
            chunkSize: 10,
            hysteresis: 0.1,
            rounds: 1,
            probabilityMapId: null,
            density: 0,
            variants: []
        })

        this.chunkManagers.push({
            id: newId,
            stateHolder: new SimpleStateMachine(decManagerStateTransitions, "NOTLOADED"),
            instance: null, 
            decorationVariants: []
        })
    }

    public updateChunkManager(managerId: number, params: DecorationChunkParamsDiff): void{
        const decManagerParams = this.params.chunkManagers.find(managerParams => managerParams.id === managerId)
        const chunkManager = this.chunkManagers.find(manager => manager.id === managerId)
        if(!decManagerParams || ! chunkManager){
            return
        }

        const diffParams: DecorationChunkParamsDiff = {}
        // Filter out params that haven't changed, and also copy one that have.
        Object.getOwnPropertyNames(params).forEach(key => {
            if(decManagerParams[key] !== params[key]){
                diffParams[key] = params[key]
                // Copy changed properties
                decManagerParams[key] = params[key]
            }
        })

        // On whether it displayed, depends how we should handle other params.
        if(diffParams.displayed !== undefined){
            // Turn off or cancel
            if(diffParams.displayed === false){
                this.triggerChunkManagerStateChange("off", chunkManager)
            }else{
                this.triggerChunkManagerStateChange("on", chunkManager)
            }
        }

        if(chunkManager.stateHolder.state !== "LOADED"){
            if(decManagerParams.displayed){
                this.triggerChunkManagerStateChange("off", chunkManager)
                this.triggerChunkManagerStateChange("on", chunkManager)
            }
            return
        }

        if(diffParams.chunkSize !== undefined){
            chunkManager.instance.setChunkSize(diffParams.chunkSize)
        }

        if(diffParams.hysteresis !== undefined){
            chunkManager.instance.setHysteresis(diffParams.hysteresis)
        }

        if(diffParams.rounds !== undefined){
            chunkManager.instance.setRounds(diffParams.rounds)
        }

        if(diffParams.probabilityMapId !== undefined){
            chunkManager.instance.setProbabilityMapSource( 
                this.nodeTree.getNodeInstance(diffParams.probabilityMapId),
                this.nodeTree.getNodeInstance$(diffParams.probabilityMapId)
            )
        }

        if(diffParams.density !== undefined){
            chunkManager.instance.setDensity(diffParams.density)
        }
    }

    public removeChunkManager(id :number): void{
        const chunkManager = this.chunkManagers.find(manager => manager.id === id)
        if(!chunkManager){
            return
        }

        this.chunkManagers = this.chunkManagers.filter(manager => manager.id !== id)
        this.params.chunkManagers = this.params.chunkManagers.filter(managerParam => managerParam.id !== id)

        this.triggerChunkManagerStateChange("delete", chunkManager)
    }

    public addChunkManagerVariant(managerId: number): void {
        const managerParams = this.params.chunkManagers.find(mp => mp.id === managerId)
        if(!managerParams){
            return 
        }

        const idList = managerParams.variants.map(variant => variant.id)
        const newId = Math.max(0, ...idList) + 1
        managerParams.variants.push({
            id: newId,
            probability: 1,
            modelSrc: "",
            gltfNodeName: null,
            scale: 1.0,
            translate: {x:0, y: 0, z: 0},
        })

        const chunkManager = this.chunkManagers.find(manager => manager.id === managerId)
        this.triggerChunkManagerStateChange("off", chunkManager)
        this.triggerChunkManagerStateChange("on", chunkManager)
    }

    public updateChunkManagerVariant(managerId: number, variantId: number, param: DecorationVariantParamsDiff): void{
        const decorationManagerParams = this.params.chunkManagers.find(managerParams => managerParams.id === managerId)
        if(!decorationManagerParams){
            return 
        }
        const variantParams = decorationManagerParams.variants.find(variantParams => variantParams.id === variantId)
        if(!variantParams){
            return
        }
        const chunkManager = this.chunkManagers.find(manager => manager.id === managerId)
        const decorationVariant = chunkManager.decorationVariants.find(variant => variant.id === variantId)

        let needReload = false

        ;["gltfNodeName", "modelSrc", "probability", "scale", "translate"].forEach(paramKey => {
            if(param[paramKey] !== undefined && variantParams[paramKey] !== param[paramKey]){
                needReload = true
                variantParams[paramKey] = param[paramKey]

                if(paramKey === "modelSrc"){
                    needReload = true
                }
            }
        })

        if(param.probability !== undefined && variantParams.probability !== param.probability){
            needReload = true
            variantParams.probability = param.probability
        }

        ;["envMapIntensity", "alphaTest", "color"] .forEach(paramKey => {
            if(paramKey in param && variantParams[paramKey] !== param[paramKey]){
                if(param[paramKey] === null){
                    delete variantParams[paramKey]
                    needReload = true
                }else{
                    variantParams[paramKey] = param[paramKey]

                    if(decorationVariant){
                        decorationVariant.modelFragments.forEach(fragment => {
                            if(fragment.material[paramKey].set){
                                fragment.material[paramKey].set(param[paramKey])
                            }else{
                                fragment.material[paramKey] = param[paramKey]
                            }
                        })
                    }
                }
            }
        })

        if(needReload){
            this.triggerChunkManagerStateChange("off", chunkManager)
            this.triggerChunkManagerStateChange("on", chunkManager)
        }
    }

    public removeChunkManagerVariant(managerId: number, variantId: number): void{
        const chunkManager = this.chunkManagers.find(manager => manager.id === managerId)
        const chunkManagerParams = this.params.chunkManagers.find(managerParam => managerParam.id === managerId)
        chunkManagerParams.variants = chunkManagerParams.variants.filter(variantParam => variantParam.id !== variantId)

        this.triggerChunkManagerStateChange("off", chunkManager)
        this.triggerChunkManagerStateChange("on", chunkManager)
    }

    public getModelLoader(): ModelLoaderI{
        return this.modelLoader
    }

    public setViewPosition(pos: PlanePosition){
        this.lastViewPosition = pos

        this.chunkManagers.forEach(manager => {
            manager.instance?.setViewPosition(pos);
        });
    }
    
    public dispose(){
        this.chunkManagers.forEach(chunkManager => {
            this.triggerChunkManagerStateChange("off", chunkManager)
        })
        this.modelLoader.dispose()
    }

    private initChunkManagers(): void{
        this.chunkManagers = this.params.chunkManagers.map(chunkParams => ({
            id: chunkParams.id,
            stateHolder: new SimpleStateMachine(decManagerStateTransitions, "NOTLOADED"),
            instance: null, 
            decorationVariants: []
        }))

        this.chunkManagers.forEach(chunkManager => {
            this.triggerChunkManagerStateChange("on",chunkManager)
        })
    }

    /**
     * Triggers chunkManagers state transitions. Transition will occur only if
     * all required conditions are met.
     */
    private triggerChunkManagerStateChange(
        trigger: "on" | "off" | "delete", 
        chunkManager: ChunkManager
    ): void
    {
        if(trigger === "on"){
            this.tryToSwitchOnChunkManagers(chunkManager)
        }
        if(trigger === "off" && chunkManager){
            if(chunkManager.stateHolder.state === "LOADED"){
                this.disposeOfChunkManager(chunkManager)
                chunkManager.stateHolder.setState("NOTLOADED")
            }
            if(chunkManager.stateHolder.state === "LOADING"){
                chunkManager.stateHolder.setState("CANCELED")
            }
         }
        if(trigger === "delete" && chunkManager){
            if(chunkManager.stateHolder.state === "LOADED"){
                this.disposeOfChunkManager(chunkManager)
            }
            chunkManager.stateHolder.setState("DELETED")
        }
    }

    /**
     * Tries to instantiate chunk manager if its still not loaded and have
     * display property equal `true`.  
     */
    private tryToSwitchOnChunkManagers(chunkManager: ChunkManager){
        const index = this.chunkManagers.findIndex(mng => mng === chunkManager)
        if(index === -1){
            return
        }

        const chunkParam = this.params.chunkManagers[index]
        if(chunkParam.displayed === false){
            return
        }
        if(chunkManager.stateHolder.state !== "NOTLOADED"){
            return
        }

        this.instantiateChunckManager(index, chunkParam)
    }

    private instantiateChunckManager(chunkIndex: number, params: DecorationChunkParams): void{
        const chunkManager = this.chunkManagers[chunkIndex]
        if(chunkManager.stateHolder.state !== "NOTLOADED"){
            return
        }
        chunkManager.stateHolder.setState("LOADING")

        this.decorationVariantsLoader.loadDecorationVariants(params.variants).then(variants => {

            if(chunkManager.stateHolder.state === "DELETED"){
                this.decorationVariantsLoader.disposeOfDecorationVariants(variants)
                return
            }

            if(chunkManager.stateHolder.state === "CANCELED"){
                this.decorationVariantsLoader.disposeOfDecorationVariants(variants)
                chunkManager.stateHolder.setState("NOTLOADED")
                // Check if param.displayed become true again. 
                this.tryToSwitchOnChunkManagers(chunkManager)
                return
            }

            const probabilityMap = this.nodeTree.getNodeInstance(params.probabilityMapId);
            const probabilityMap$ = this.nodeTree.getNodeInstance$(params.probabilityMapId);

            if(!probabilityMap || variants.length === 0){
                this.decorationVariantsLoader.disposeOfDecorationVariants(variants)
                chunkManager.stateHolder.setState("CANCELED")
                chunkManager.stateHolder.setState("NOTLOADED")
                return
            }

            const scene = this.hostEngine.getEngineScene().getScene()
            chunkManager.instance = new DecorationsChunkManager(
                scene, this.lastViewPosition, params.chunkSize, 
                params.hysteresis, params.rounds, this.hostEngine.getTerrainManager(), 
                probabilityMap, probabilityMap$, params.density, 
                variants, params.seed
            );

            chunkManager.decorationVariants = variants
            chunkManager.stateHolder.setState("LOADED")
        })
    }

    private disposeOfChunkManager(chunkManager: ChunkManager): void{
        chunkManager.instance.dispose()
        chunkManager.instance = null
        this.decorationVariantsLoader.disposeOfDecorationVariants(chunkManager.decorationVariants)
        chunkManager.decorationVariants = null
    }

    private deepCopyParams(params: DecorationManagerParams): DecorationManagerParams{
        return { 
            chunkManagers: params.chunkManagers.map(dec => {
                return {
                    ...dec, 
                    variants: dec.variants.map(variant => ({...variant}))
                }
            })
        }
    }
}