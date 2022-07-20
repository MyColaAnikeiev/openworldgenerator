import { NodeTreeUser } from "../../generator/node-tree-generator";
import { DecorationsChunkManager } from "../chunk-manager/decorations-chunk-manager";
import { EngineLoader } from "../engine-loader";
import { DecorationChunkParams, DecorationChunkParamsDiff, DecorationManagerParams, DecorationVariantParamsDiff } from "../loader-types";
import { PlanePosition } from "../types";
import { EngineUserInterface } from "../engine";
import { DecorationVariantsLoaderI } from "./decoration-variants-loader-interface";
import { DecorationVariantsLoader } from "./decoration-variant-loader";
import { ModelLoader } from "../../common/tools/model-loader/model-loader";
import { DecorationVariant } from "../chunk-manager/types";
import { ModelLoaderI } from "../../common/tools/model-loader/model-loader-interface";
import { SimpleStateMachine, SimpleStateMachineTransition } from "../../common/tools/state-machine";


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
    stateHolder: SimpleStateMachine<DecManagerStates>,
    instance: DecorationsChunkManager | null,
    decorationVariants: DecorationVariant[]
}

/**
 * Class for object responsible for creating, disposing and updating 
 * {@link DecorationsChunkManager}'s.
 */
export class DecorationsManager{

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
        console.log("DecManager", this)
    }

    public getParams(): DecorationManagerParams{
        return this.deepCopyParams(this.params)
    }

    /**
     * @param decorationIndex index of chankManager parameter of which to update
     * @param params one or more {@link DecorationsChunkManager} parameters to 
     * update. See {@link DecorationChunkParamsPart} for available params.
     */
    public updateDecParams(decorationIndex: number, params: DecorationChunkParamsDiff): void{
        if(this.chunkManagers.length <= decorationIndex){
            return
        }

        const decManagerParams = this.params.chunkManagers[decorationIndex]
        const chunkManager = this.chunkManagers[decorationIndex]

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

    /**
     * @param decorationIndex - decoration chunk manager index.
     * @param variantIndex - decoration variant index.
     */
    public deleteDecVariant(decorationIndex: number, variantIndex: number): void{
        const chunkManager = this.chunkManagers[decorationIndex]
        const chunkManagerParams = this.params.chunkManagers[decorationIndex]
        chunkManagerParams.variants.splice(variantIndex, 1)

        this.triggerChunkManagerStateChange("off", chunkManager)
        this.triggerChunkManagerStateChange("on", chunkManager)
    }

    /**
     * 
     * @param decorationIndex - index of decoration chunk manager.
     * @param variantIndex - index of decoration variant.
     * @param param - one or more of {@link DecorationVariantParams} parameters
     * to update {@link DecorationVariant} with.
     */
    public updateDecVariant(decorationIndex: number, variantIndex: number, param: DecorationVariantParamsDiff): void{
        const decorationManagerParams = this.params.chunkManagers[decorationIndex]
        const variantParams = decorationManagerParams.variants[variantIndex]
        const chunkManager = this.chunkManagers[decorationIndex]
        const decorationVariant = chunkManager.decorationVariants[variantIndex]

        let needReload = false

        ;["gltfNodeName", "modelSrc", "probability", "scale", "translate"].forEach(paramKey => {
            if(param[paramKey] !== undefined && variantParams[paramKey] !== param[paramKey]){
                needReload = true
                variantParams[paramKey] = param[paramKey]
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
                    decorationVariant.modelFragments.forEach(fragment => {
                        if(fragment.material[paramKey].set){
                            fragment.material[paramKey].set(param[paramKey])
                        }else{
                            fragment.material[paramKey] = param[paramKey]
                        }
                    })
                }
            }
        })

        if(needReload){
            this.triggerChunkManagerStateChange("off", chunkManager)
            this.triggerChunkManagerStateChange("on", chunkManager)
        }
    }

    /**
     * @param decorationIndex - index of decoration chunk manager to delete.
     */
    public deleteDecChunkManager(decorationIndex:number): void{
        const chunkManager = this.chunkManagers[decorationIndex]
        this.chunkManagers.splice(decorationIndex,1)
        this.params.chunkManagers.splice(decorationIndex,1)

        this.triggerChunkManagerStateChange("delete", chunkManager)
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
        this.chunkManagers = this.params.chunkManagers.map(() => ({
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
                chunkManager.stateHolder.setState("NOTLOADED")
                return
            }

            const scene = this.hostEngine.getEngineScene().getScene()
            chunkManager.instance = new DecorationsChunkManager(
                scene, this.lastViewPosition, params.chunkSize, 
                params.hysteresis, params.rounds, this.hostEngine.getTerrainManager(), 
                probabilityMap, probabilityMap$, params.density, variants
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