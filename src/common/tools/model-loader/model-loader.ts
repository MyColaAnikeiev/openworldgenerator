import { Material, Object3D, ObjectLoader, Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ErrorCallback, FinishCallback, ModelLoaderI } from "./model-loader-interface";

interface Request{
  /**
   * Indicate which entries from `sourceList` with the same index is resolved
   * (when model is either loaded or failed to do so).
   */
  finished: boolean[];

  /**
   * List of unique model source URLs for this request.
   */
  sourceList: string[];

  /**
   * Model source URLs with preserved order and dublications as it was 
   * originaly provided. To be used for mapping URLs to models when 
   * calling `finishCallback`. 
   */
  originalSourceList: string[];

  finishCallback: FinishCallback;

  onErrorCallback: ErrorCallback;
}

interface ModelRequest{
  sourceURL: string;

  /**
   * Indicate that model format stored at URL source is known or not. In case
   * when model format is unknown, all available loaders will be tried one by 
   * one. If format is known but unsupported, then it just finish as failed. 
   */
  knownFormat: boolean;
  /**
   * Values starting from 0 is corresponding to specific model loader see 
   * {@link ModelLoader.proceedModelRequest} for exact values.
   * Value -2 means format is known but unsuported, and -1 means that it failed
   * to determine model format from URL string.
   */
  targetLoaderIndex: number;

  targetRequests: Request[];
}

/**
 * Implementation of {@link ModelLoaderI} interface.
 */
export class ModelLoader implements ModelLoaderI{

  private pendingModelRequests: Map<string, ModelRequest>
  private stored: Map<string, Object3D>

  private gltfLoader: GLTFLoader
  private objLoader: ObjectLoader

  constructor(){
    this.gltfLoader = new GLTFLoader()
    this.objLoader = new ObjectLoader()

    this.pendingModelRequests = new Map()
    this.stored = new Map()
  }

  public requestModels(
    sources: string[], 
    finishCallback?: FinishCallback, 
    onErrorCallback?: ErrorCallback
  ): void 
  {
    const uniqueURLs = [...(new Set(sources)).values()]
    const request: Request = {
      finished: uniqueURLs.map(() => false),
      sourceList: uniqueURLs,
      originalSourceList: sources,
      finishCallback : finishCallback ?? (() => {}),
      onErrorCallback: onErrorCallback ?? (() => {})
    }

    uniqueURLs.forEach(url => this.requestModel(url, request))
  }

  public getListOfLoadedModels(): string[] {
    return [...this.stored.keys()]
  }

  public getModel(url: string): Object3D | null {
    return this.stored.get(url) ?? null
  }

  public disposeOf(...URLs: string[]): void {
    URLs.forEach(url => {
      if(!this.stored.has(url)){
        return
      }

      ModelLoader.disposeModel(this.stored.get(url))
      this.stored.delete(url)
    })
  }

  public dispose(): void {
    this.disposeOf(...this.stored.keys())
  }

  /**
   * Expects an model URL string to end with model file extension, so 
   */
  private requestModel(URL: string, request: Request): void{
    // Check if it's cached
    if(this.stored.has(URL)){
      this.markModelRequestAsFinished(URL, request)
      return
    }

    // Ckeck if model request is in panding state
    if(this.pendingModelRequests.has(URL)){
      const modelRequest = this.pendingModelRequests.get(URL)
      modelRequest.targetRequests.push(request)
      return
    }

    const loaderIndex = this.guessLoaderIndex(URL)
    const knownFormat = loaderIndex !== -1
    const modelRequest: ModelRequest = {
      sourceURL: URL,
      knownFormat,
      targetLoaderIndex: knownFormat ? loaderIndex : 0,
      targetRequests: [request]
    }
    this.pendingModelRequests.set(URL, modelRequest)

    this.proceedModelRequest(modelRequest)
  }

  private markModelRequestAsFinished(URL: string, request: Request | Request[]): void{
    if(Array.isArray(request)){
      request.forEach(req => this.markModelRequestAsFinished(URL, req))
      return;
    }

    const ind = request.sourceList.findIndex(cur => cur === URL)
    if(ind === -1){
      return
    }

    request.finished[ind] = true
    
    const requestCompleted = request.finished.every(fin => fin)
    if(requestCompleted){
      request.finishCallback(
        request.originalSourceList.map(url => this.stored.get(url) ?? null)
      )
    }
  }

  /**
   * Probe URL string for format and return loader index if format is known,
   * -1 if unknown, and -2 if known bun unsupported.
   */
  private guessLoaderIndex(URL: string): number{
    if( /\.(gltf|glb)$/.test(URL) ){
      return 0
    }

    if( /\.obj$/.test(URL)){
      return 1
    }

    if(/\.(stl|fbx|x3d|blend)$/.test(URL)){
      return -2
    }

    return -1
  }

  private proceedModelRequest(modelRequest: ModelRequest): void{
    // Known and unsupported
    if(modelRequest.knownFormat && modelRequest.targetLoaderIndex < 0){
      this.markModelRequestAsFinished(modelRequest.sourceURL, modelRequest.targetRequests)
      return
    }

    switch(modelRequest.targetLoaderIndex++){
      case 0:
        this.loadGLTF(modelRequest)
        break
      case 1:
        this.loadObj(modelRequest)
        break

      // When all loaders failed.
      default:
        const errMsg = "All loaders failed to load: " + modelRequest.sourceURL
        modelRequest.targetRequests.forEach(req => {
          req.onErrorCallback(modelRequest.sourceURL, errMsg)
        })
        this.markModelRequestAsFinished(modelRequest.sourceURL, modelRequest.targetRequests)
    }
  }

  private proccessLoadSuccess(modelRequest: ModelRequest, model: Object3D): void{
    this.stored.set(modelRequest.sourceURL, model)
    this.markModelRequestAsFinished(modelRequest.sourceURL, modelRequest.targetRequests)
  }
  
  private proccessLoadFailure(modelRequest: ModelRequest): void{
    if(modelRequest.knownFormat){
      modelRequest.targetRequests.forEach(req => {
        req.onErrorCallback(modelRequest.sourceURL, "Failed to load model.")
      })
      this.markModelRequestAsFinished(modelRequest.sourceURL, modelRequest.targetRequests)
    }else{
      this.proceedModelRequest(modelRequest)
    }
  }

  private loadGLTF(modelRequest: ModelRequest): void{
    this.gltfLoader.loadAsync(modelRequest.sourceURL).then(
      (gltf) => this.proccessLoadSuccess(modelRequest, gltf.scene),
      (error) => this.proccessLoadFailure(modelRequest)
    )
  }

  private loadObj(modelRequest: ModelRequest): void{
    this.objLoader.loadAsync(modelRequest.sourceURL).then(
      (model) => this.proccessLoadSuccess(modelRequest, model),
      (error) => this.proccessLoadFailure(modelRequest)
    )
  }
  
  private static disposeModel(model: Object3D): void{
    if("dispose" in model){
      (model as any).dispose?.()
    }
    if("material" in model){
      ModelLoader.disposeMaterial((model as any).material)
    }
    if("geometry" in model){
      (model as any).geometry.dispose?.()
    }

    model.children.forEach(ModelLoader.disposeModel)
  }

  private static disposeMaterial(mat: Material): void{
    const mapKeys = ['map','alphaMap', 'aoMap', 'envMap', 'lightMap', 'specularMap']

    mapKeys.forEach(key => {
      if(key in mat){
        (mat[key] as Texture)?.dispose()
      }
    })
  }
}