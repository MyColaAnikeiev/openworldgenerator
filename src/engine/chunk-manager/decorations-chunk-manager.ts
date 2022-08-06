import { Observable, Subscription } from "rxjs";
import { Mesh, Object3D, Scene} from "three";
import  * as  BufferGeometryUtils  from "three/examples/jsm/utils/BufferGeometryUtils"
import { GeneratorNode } from "../../generator/nodes/generator-node";
import { PlanePosition } from "../types";
import { BaseChunkManager } from "./base-chunk-manager";
import { ChunkArea, ChunkInstance, ChunkReadyState, DecorationsChunkGenState, DecorationVariant } from "./types";
import { alea } from "seedrandom";
import { TerrainManager } from "../terrain-manager";

export class DecorationsChunkManager extends BaseChunkManager{

    private maxDecQuantity: number;
    private noiseGeneratorSubscription: Subscription;
    
    /**
     * @param scene THREEJS scene object. 
     * @param viewPosition is a coordinates around which manager will place generated terrain chunks.
     * @param chunkSize 
     * @param hysteresis determines how for from you have to move from first chunck in 
     * order for updateChanks to be triggered. 1 unit coresponds to chunckSize.
     * @param rounds around central chunk. If for ex. `rounds` is 2 then we will have 5x5 chunk grid. 
     * @param noiseGenerator `GeneratorNode` used as probability map of decorations to apear.
     * @param noiseGenerator$ stream used in editing mode to update `GeneratorNode` on a fly.
     * @param density tells manager of how much, on average, individual decorations to put on one unit square.
     */
    constructor(
        scene: Scene,
        viewPosition: PlanePosition, 
        chunkSize: number, 
        hysteresis: number,
        rounds: number,
        private terrainManager: TerrainManager,
        private noiseGenerator: GeneratorNode,
        private noiseGenerator$: Observable<GeneratorNode | null> | null,
        private density: number,
        private variants: DecorationVariant[]
    ){
        super(scene, viewPosition, chunkSize, hysteresis, rounds);

        this.setDensity(density)
    }

    /**
     * Updates probability map generator source.
     */
    public setProbabilityMapSource(gen: GeneratorNode, gen$: Observable<GeneratorNode>): void{
        this.noiseGenerator = gen;
        this.noiseGenerator$ = gen$;
        if(this.noiseGeneratorSubscription){
            this.noiseGeneratorSubscription.unsubscribe();    
        }
        if(gen$){
            this.noiseGeneratorSubscription = gen$.subscribe(gen => {
                if(gen){
                    this.noiseGenerator = gen;
                    this.updateChunksContent();
                }
            })
        }

        this.setChunksAsToBeReplaced();
        this.updateChunks();
    }

    /**
     * @param density tells decoration chunk manager of how much, on average, 
     * to put individual decoration into one square unit, if probability map 
     * equals 1.0 for that unit square.
     */
    public setDensity(density: number): void{
        this.density = density
        this.maxDecQuantity = Math.ceil(this.chunkSize*this.chunkSize * density);
        this.setChunksAsToBeReplaced();
        this.updateChunks();
    }

    public setChunkSize(newSize: number): void{
        this.maxDecQuantity = Math.ceil(newSize*newSize * this.density);
        super.setChunkSize(newSize)
    }

    protected getBlankInstance(round: number): ChunkInstance {
        return {
            minRound: 0,
            maxRound: Infinity,
            simplificationLevel: 0,
            state: ChunkReadyState.pending,
            object3D: null
        }
    } 

    private runGenTaskInit(task: DecorationsChunkGenState): void{
        const chunkObject = new Object3D();
        // Geometries that comes from same mesh (by cloning) and as a consequence use the same materials
        // will be put in same array and after transformation (local to chunk) will be merged together.
        // So if for ex. source model had three meshes, then only three draw calls by openGL is needed to
        // draw single chunk. 
        const variantsFragmentsBatches = this.variants.map(variant => variant.modelFragments.map(() => []));
        const randGenerator = alea(task.chunkArea.i.toString() +","+ task.chunkArea.j.toString());
        const chunkShiftX = task.chunkArea.i * this.chunkSize;
        const chunkShiftY = task.chunkArea.j * this.chunkSize;

        chunkObject.position.set(chunkShiftX, 0, chunkShiftY);

        task.generationState = {
            stage: "generation",
            chunkObject,
            variantsFragmentsBatches,
            randGenerator,
            chunkShiftX,
            chunkShiftY,
            generatedDecorations: 0
        }
    }

    private runGenTaskGeneration(task: DecorationsChunkGenState, startTime: number, timeLeft: number): boolean{
        const {
            generatedDecorations,
            variantsFragmentsBatches,
            chunkShiftX,
            chunkShiftY,
            randGenerator: rand
        } = task.generationState;

        for(let i = generatedDecorations ; i < this.maxDecQuantity; i++){
            const posX =  this.chunkSize * rand();
            const posY =  this.chunkSize * rand();
            const absPosX = chunkShiftX + posX;
            const absPosY = chunkShiftY + posY;
            const probability = this.noiseGenerator.getValue(absPosX, absPosY);

            if(probability > rand()){
                const height = this.terrainManager.getHeight({x: absPosX, y: absPosY});
                const variantIndex = this.getDecVariantIndex(rand());
                const {modelFragments} = this.variants[variantIndex];
                const fragmentsBatches = variantsFragmentsBatches[variantIndex];

                const helper = new Object3D();
                const scale = 0.6 + rand()
                helper.scale.set(scale,scale,scale);
                helper.position.set(posX, height, posY);
                helper.updateWorldMatrix(true, true);

                modelFragments.forEach((mesh, index) => {
                    const geometry = mesh.geometry.clone();
                    geometry.applyMatrix4(helper.matrixWorld);
                    fragmentsBatches[index].push(geometry);
                })

            }else if(this.variants.length > 1){
                rand(); rand();
            }


            if(i % 100 === 99 && Date.now() - startTime > timeLeft){
                task.generationState.generatedDecorations = i + 1;
                return false
            }

        }

        task.generationState.stage = "merging";
        return true;
    }

    private runGenTaskMerging(task: DecorationsChunkGenState){
        const {
            variantsFragmentsBatches,
            chunkObject
        } = task.generationState;

        const mergedGeometries = variantsFragmentsBatches.map(batches => {
            return batches.map(batch => {
                if(batch.length > 0){
                    return BufferGeometryUtils.mergeBufferGeometries(batch);
                }
                return null
            })
        })

        this.variants.forEach(((variant, variantIndex) => {
            variant.modelFragments.forEach((mesh, meshIndex) => {
                const geometry = mergedGeometries[variantIndex][meshIndex];
                if(geometry){
                    const newMesh = new Mesh(geometry, mesh.material);
                    chunkObject.add(newMesh);
                }
            })
        }))
    }

    protected runGenTask(task: DecorationsChunkGenState, executionTime: number): Object3D | null {
        const start = Date.now();

        if(!task.generationState){
            this.runGenTaskInit(task);
        }
     
        if(task.generationState.stage === "generation"){
            const finished = this.runGenTaskGeneration(task, start, executionTime);

            if(!finished){
                return null;
            }
        }
        
        if(task.generationState.stage === "merging"){
            this.runGenTaskMerging(task);
            this.cleanIntermediateResultsOfgenTask(task);

            return task.generationState.chunkObject;
        }
        
        return null;
    }

    protected cleanIntermediateResultsOfgenTask(task: DecorationsChunkGenState): void {
        if(!task.generationState){
            return;
        }

        task.generationState.variantsFragmentsBatches.forEach(fragmentsBatches => {
            fragmentsBatches.forEach(batche => {
                batche.forEach(geometry => {
                    geometry.dispose();
                })
            })
        })
    }

    protected runContentUpdateTask(chunkArea: ChunkArea): void {
    }

    protected disposeOfChunkObject(object: Object3D): void {
        object.children.forEach(obj => {
            if(obj.type === "Mesh"){
                const mesh = obj as Mesh;
                mesh.geometry.dispose();
                if("length" in mesh.material){
                    mesh.material.forEach(material => material.dispose());
                }else{
                    mesh.material.dispose();
                }
            }
        })
    }

    private getDecVariantIndex(randValue: number): number{
        let curInd = 0;
        let sum = 0.0;
        for(let i = 0; i < this.variants.length - 1; i++){
            sum += this.variants[i].normalizedProbability;

            if(randValue > sum){
                curInd++;
            }else{
                break;
            }

        }

        return curInd;        
    }

}