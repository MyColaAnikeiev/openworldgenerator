import { MeshBasicMaterial, MeshLambertMaterial, Scene } from "three";
import { NodeTreeUser } from "../editor/noise-generator/node-tree-generator";
import { TerrainChunkManager } from "./chunk-manager/terrain-chunck-manager";
import { EngineLoader } from "./engine-loader";
import { TerrainManagerParams } from "./loader-types";
import { PlanePosition } from "./types";

const defaultParams: TerrainManagerParams = {
    chunkSize: 60,
    hysteresis: 0.1,
    rounds: 5,
    terrainResolution: 80,
    sourceNodeId: 1
}

export class TerrainManager{
    
    private params: TerrainManagerParams;
    private chunkManager: TerrainChunkManager;
    private terrainMaterial: MeshBasicMaterial;
    
    constructor(private scene: Scene, private nodeTree: NodeTreeUser, private loader: EngineLoader){
        this.params = {...defaultParams, ...loader.getTerrainManagerParams()};
        
        const {params} = this;
        this.terrainMaterial = new MeshLambertMaterial()
        const pos: PlanePosition = { x: 0, y: 0};

        this.chunkManager = new TerrainChunkManager(
            scene, pos, params.chunkSize, params.hysteresis, params.rounds, 
            nodeTree.getNodeInstance(params.sourceNodeId), 
            nodeTree.getNodeInstance$(params.sourceNodeId), 
            params.terrainResolution, this.terrainMaterial
        )

    }

    public setViewPosition(pos: PlanePosition){
        this.chunkManager.setViewPosition(pos);
    }


    public setParams(params: TerrainManagerParams){
        /* See what changed and update it. */
    }

    /**
     * Returns height on terrain plane at provided plane coordinates.
     */
    public getHeight(pos: PlanePosition){
        const node = this.nodeTree.getNodeInstance(this.params.sourceNodeId);
        return node.getValue(pos.x, pos.y);
    }

    /**
     * If memory leaks will start bother you, please call us.
     */
    public dispose(){
        this.terrainMaterial.dispose();

        // Dispose of chunks in chunkManager here.
    }
}