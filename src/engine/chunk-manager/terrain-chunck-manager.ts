import { Observable } from "rxjs";
import { BufferAttribute, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Scene } from "three";
import { GeneratorNode } from "../../generator/nodes/generator-node";
import { PlanePosition } from "../types";
import { BaseChunkManager } from "./base-chunk-manager";
import { ChunkArea, ChunkGenState, ChunkInstance, ChunkReadyState } from "./types";


export class TerrainChunkManager extends BaseChunkManager{
    
    /**
     * @param scene THREEJS scene object. 
     * @param viewPosition is a coordinates around which manager will place generated terrain chunks.
     * @param chunkSize 
     * @param hysteresis determines how for from you have to move from first chunck in 
     * order for updateChanks to be triggered. 1 unit coresponds to chunckSize.
     * @param rounds around central chunk. If for ex. `rounds` is 2 then we will have 5x5 chunk grid. 
     * @param noiseGenerator `GeneratorNode` used for heightmap generating.
     * @param noiseGenerator$ stream used in editing mode when heightmap source could change.
     * @param terrainResolution tell's how much vertexes used in one of square sides of a plane,
     * in case where chunk(plane) is not simplified.
     * @param planeMaterial
     */
    constructor(
        scene: Scene,
        viewPosition: PlanePosition, 
        chunkSize: number, 
        hysteresis: number,
        rounds: number,
        private noiseGenerator: GeneratorNode,
        private noiseGenerator$: Observable<GeneratorNode> | null,
        private terrainResolution: number,
        private planeMaterial: MeshBasicMaterial
    ){
        super(scene, viewPosition, chunkSize, hysteresis, rounds);

        if(noiseGenerator$){
            noiseGenerator$.subscribe(gen => {
                if(gen){
                    this.noiseGenerator = gen;
                    this.updateChunksContent();
                }
            })
        }
    }


    /**
     * Assign an optimization level depending on `round`(distance from central chunk).
     */
    protected getBlankInstance(round: number): ChunkInstance{
        let minRound: number, maxRound: number;
        let simplificationLevel: number;

        if(round <= 1){
            minRound = 0;
            maxRound = 1;
            simplificationLevel = 0;
        }else if(round <= 3){
            minRound = 2;
            maxRound = 3;
            simplificationLevel = 1;
        }else if(round <= 6){
            minRound = 4;
            maxRound = 6;
            simplificationLevel = 2;
        }else{
            minRound = 7;
            maxRound = Infinity;
            simplificationLevel = 3;
        }

        const inst = {
            minRound, maxRound, 
            simplificationLevel,
            state: ChunkReadyState.pending, 
            object3D: null
        }
        return inst;
    }


    protected runGenTask(task: ChunkGenState, executionTime: number): Object3D | null{
        const start = Date.now();
        const pos = { i: task.chunkArea.i, j: task.chunkArea.j };
        const {simplificationLevel} = task.instance;


        if(task.generationState === null){
            const resolution = this.getResolutionFromSimplificationLeve(task.instance.simplificationLevel);
            const segmentSize = this.chunkSize / (resolution - 3);
            const size = this.chunkSize + 2*segmentSize;
            const plane = new PlaneGeometry(size, size, 
                resolution - 1, resolution - 1);
            const vertexArray = new Float32Array(plane.attributes.position.array);
            const normals = new Float32Array(resolution*resolution*3);
            const jIndex = 0;

            task.generationState = {
                resolution, segmentSize, size, plane,
                vertexArray, normals, jIndex
            }
        }

        if(task.generationState){
            const state = task.generationState;

            while(true){
                if(state.jIndex >= state.resolution){
                    break;
                }

                for(let i = 0; i < state.resolution; i++){
                    const x = (pos.i* this.chunkSize) + ((i /(state.resolution-1)) )*state.size - state.segmentSize;
                    const y = (pos.j* this.chunkSize) + ((state.jIndex /(state.resolution-1)) )*state.size - state.segmentSize;
                    const {height, normal} = this.getHeightAndNormal(x,y); 

                    state.vertexArray[(state.resolution*state.jIndex + i) * 3 + 2] = height;

                    state.normals[(state.jIndex*state.resolution+i)*3 + 0] = normal[0];
                    state.normals[(state.jIndex*state.resolution+i)*3 + 1] = normal[1];
                    state.normals[(state.jIndex*state.resolution+i)*3 + 2] = normal[2];
                }

                state.jIndex++;

                if(Date.now() - start > executionTime){
                    return null;
                }
            }

            this.moveEdgesDown(state.vertexArray, state.resolution);
            state.plane.setAttribute("position", new BufferAttribute(state.vertexArray,3));
            state.plane.setAttribute("normal", new BufferAttribute(state.normals,3));


            const planeMesh = new Mesh(state.plane, this.planeMaterial);
            planeMesh.rotation.x = -Math.PI/2;
            planeMesh.position.x = pos.i * this.chunkSize + this.chunkSize/2;
            planeMesh.position.z = pos.j * this.chunkSize + this.chunkSize/2;

            return planeMesh;
        }
    }


    /**
     * Move each of plane eadge vertexes down, so they can be stack together nicely  
     * even if they have different number of segments.
     */
    private moveEdgesDown(verts: Float32Array, size: number){
        const altitude =  400;
        const shift = 20;

        for(let i  = 0; i < size; i++){
            verts[i * 3 + 0] -= shift;
            verts[i * 3 + 2] -= altitude;
        }

        const lastRow = size * (size-1) * 3;
        for(let i = 0; i < size; i++){
            verts[lastRow + i * 3 + 0] += shift;
            verts[lastRow + i * 3 + 2] -= altitude;
        }
        
        for(let i = 0; i < size; i++){
            verts[size * i * 3 + 1] -= shift;
            verts[size * i * 3 + 2] -= altitude;
        }
        
        for(let i = 0; i < size; i++){
            verts[(size * i + (size-1) ) * 3 + 1] += shift;
            verts[(size * i + (size-1) ) * 3 + 2] -= altitude;
        }
    }

  

    private getResolutionFromSimplificationLeve(simplificationLevel: number): number{
        let resolution = this.terrainResolution;
        switch(simplificationLevel){
            case 0:
                break;
            case 1:
                resolution = Math.ceil(resolution / 2);
                break;
            case 2: 
                resolution = Math.ceil(resolution / 6);
                break;
            case 3:
                resolution = Math.ceil(resolution / 20);
                break;
        }

        return  Math.max(4, resolution + 2);
    }

    protected runContentUpdateTask(chunkArea: ChunkArea): void {

        const used = chunkArea.instances.find(ins => ins.state === ChunkReadyState.used);
        if(used){
            const mesh =  <Mesh>used.object3D;
            const resolution = this.getResolutionFromSimplificationLeve(used.simplificationLevel);
            const segmentSize = this.chunkSize / (resolution - 3);
            const size = this.chunkSize + segmentSize*2;
            const geometry = mesh.geometry;

            const normals = new Float32Array(resolution*resolution*3);
            
            for(let j = 0; j < resolution; j++){
                for(let i = 0; i < resolution; i++){
                    const x = chunkArea.i * this.chunkSize + i/(resolution-1)*size - segmentSize;
                    const y = chunkArea.j * this.chunkSize + j/(resolution-1)*size - segmentSize;
                    const {height, normal} = this.getHeightAndNormal(x,y); 
                    
                    if(j > 0 && j < resolution-1 && i > 0 && i < resolution-1){
                        geometry.attributes.position.setZ(j*resolution + i, height);
                    }

                    normals[(j*resolution+i)*3 + 0] = normal[0];
                    normals[(j*resolution+i)*3 + 1] = normal[1];
                    normals[(j*resolution+i)*3 + 2] = normal[2];
                }
            }

            geometry.setAttribute("normal",new BufferAttribute(normals,3));
            geometry.attributes.position.needsUpdate = true;
        }
    }


    private getHeightAndNormal( x: number, y: number): {height: number, normal: number[]} {
        const height = this.noiseGenerator.getValue(x,y);

        const dhx = (this.noiseGenerator.getValue(x+0.0001,y)-height)*10000;
        const dhy = (this.noiseGenerator.getValue(x,y+0.0001)-height)*10000;
        const magn = 1 / Math.sqrt(1 + dhx*dhx + dhy*dhy);

        return {height, normal:[-dhx*magn, -dhy*magn, 1*magn]};
    }

    protected disposeOfChunkObject(object: Object3D): void{
        const mesh = <Mesh>object;
        mesh.geometry.dispose();
    }


    protected cleanIntermediateResultsOfgenTask(task: ChunkGenState): void {
        if(task.generationState){
            if(task.generationState.plane){
                const plane: PlaneGeometry = task.generationState.plane;
                plane.dispose(); 
            }
        }

        task.generationState = null;
    }

}