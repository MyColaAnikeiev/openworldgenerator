import { MeshBasicMaterial, MeshLambertMaterial, RepeatWrapping, Scene, Texture, TextureLoader } from "three";
import { NodeTreeUser } from "../generator/node-tree-generator";
import { TerrainChunkManager } from "./chunk-manager/terrain-chunck-manager";
import { EngineLoader } from "./engine-loader";
import { TerrainManagerParams } from "./loader-types";
import { PlanePosition } from "./types";

const defaultParams: TerrainManagerParams = {
    chunkSize: 60,
    hysteresis: 0.1,
    rounds: 5,
    terrainResolution: 80,
    sourceNodeId: 1,
    planeTextureMapSrc: "public/assets/textures/plane.jpeg",
    planeTextureSize: 4.0
}

export class TerrainManager{
    
    private params: TerrainManagerParams;
    private chunkManager: TerrainChunkManager;
    private terrainMaterial: MeshBasicMaterial;
    private terrainTexture: Texture;
    private terrainTextureRequestId: number = 0;
    private textureLoader: TextureLoader;
    
    constructor(private scene: Scene, private nodeTree: NodeTreeUser, private loader: EngineLoader){
        this.params = {...defaultParams, ...loader.getTerrainManagerParams()};
        
        const {params} = this;
        const pos: PlanePosition = { x: 0, y: 0};
        this.textureLoader = new TextureLoader();
        this.terrainMaterial = new MeshLambertMaterial();

        this.chunkManager = new TerrainChunkManager(
            scene, pos, params.chunkSize, params.hysteresis, params.rounds, 
            nodeTree.getNodeInstance(params.sourceNodeId), 
            nodeTree.getNodeInstance$(params.sourceNodeId), 
            params.terrainResolution, this.terrainMaterial
        )

        if(params.planeTextureMapSrc !== undefined ){
            this.loadTextureFromSrc(params.planeTextureMapSrc);
        }

        console.log(this)
    }

    public setViewPosition(pos: PlanePosition){
        this.chunkManager.setViewPosition(pos);
    }

    /**
     * Takes any number of supported params (see `TerrainManagerParams`) and
     * updates them on a fly.
     */
    public setParams(params: TerrainManagerParams): void{
        /* See what changed and update it. */
        if("chunkSize" in params){
            this.chunkManager.setChunkSize(Math.max(1,params.chunkSize));
            const texSize = "planeTextureSize" in params ? params.planeTextureSize : this.params.planeTextureSize;
            this.terrainTexture.repeat.set(
                params.chunkSize / texSize,
                params.chunkSize / texSize
            );  
            this.terrainTexture.needsUpdate = true;
        }
        if("hysteresis" in params){
            this.chunkManager.setHysteresis(Math.max(0,params.hysteresis));
        }
        if("rounds" in params){
            this.chunkManager.setRounds(Math.max(0,params.rounds));
        }
        if("terrainResolution" in params){
            this.chunkManager.setTerrainResolution(Math.max(1,params.terrainResolution));
        }
        if("sourceNodeId" in params){
            const gen = this.nodeTree.getNodeInstance(params.sourceNodeId);
            const gen$ = this.nodeTree.getNodeInstance$(params.sourceNodeId);
            this.chunkManager.setNoiseSource(gen, gen$);
        }
        if("planeTextureMapSrc" in params){
            if(params.planeTextureMapSrc){
                this.loadTextureFromSrc(params.planeTextureMapSrc);
            }else{
                this.setPlainTexture(null);
            }
        }
        if("planeTextureSize" in  params){
            const chunkSize = "chunkSize" in params ? params.chunkSize : this.params.chunkSize;
            this.terrainTexture.repeat.set(
                chunkSize / params.planeTextureSize,
                chunkSize / params.planeTextureSize
            );  
            this.terrainTexture.needsUpdate = true;
        }

        this.params = {...this.params, ...params};
    }

    public getParams(): TerrainManagerParams {
        return this.params;
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
        if(this.terrainTexture){
            this.terrainTexture.dispose();
        }
        this.chunkManager.dispose();
    }

    /**
     *  Loads image from `src` as texture in async mode. And provides `callback`
     *  to notify when load is seccesfull or failed by calling it with `true` and
     *  `false` respectively. Previous requests, if still pending, are efectively
     *  canceled so `callbeck` for them wont be called at all.
     */
    public loadTextureFromSrc(src: string, callback?: (loaded: boolean) => void): void{
        this.params.planeTextureMapSrc = src;

        this.terrainTextureRequestId++;
        const curId = this.terrainTextureRequestId;

        this.textureLoader.loadAsync(this.params.planeTextureMapSrc)
        .then(texture => {
            // Promise can't be canceled but i expect posibility of new request to be
            // send while previous one is still pending. 
            if(curId !== this.terrainTextureRequestId){
                texture.dispose();
                return;
            }

            this.setPlainTexture(texture);

            if(callback){
                callback(true);
            }
        })
        .catch(reason => {
            if(curId === this.terrainTextureRequestId && callback){
                callback(false);
            }
        })
    }

    /**
     * Updates terrain material with new texture or just disposing of current one
     * if `texture` is `null`.
     */
    private setPlainTexture(texture: Texture | null): void{
        if(texture){
            texture.wrapS = RepeatWrapping
            texture.wrapT = RepeatWrapping;
            texture.repeat.set(
                this.params.chunkSize / this.params.planeTextureSize,
                this.params.chunkSize / this.params.planeTextureSize
            );            
        }

        this.terrainMaterial.map = texture;

        if(this.terrainTexture){
            this.terrainTexture.dispose();
        }
        this.terrainTexture = texture;

        this.terrainMaterial.needsUpdate = true;
    }
}
