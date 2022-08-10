import { debounceTime, Observable, Subject } from "rxjs";
import { AxesHelper, Mesh, Object3D } from "three";
import { ModelLoaderI } from "../common/tools/model-loader/model-loader-interface";
import { DecorationVariant } from "./chunk-manager/types";
import { DecorationVariantsLoader } from "./decorations-manager/decoration-variant-loader";
import { DecorationVariantsLoaderI } from "./decorations-manager/decoration-variants-loader-interface";
import { Engine } from "./engine";
import { EngineLoader } from "./engine-loader";
import { DecorationManagerParams, DecorationVariantParams, DecorationVariantParamsDiff, EngineOjectsDescription, EngineSceneParams, TerrainManagerParams } from "./loader-types";
import { PlanePosition } from "./types";

const editPosition: PlanePosition = { x: 30, y: 30}

/**
 * Gets Scene and Terrain params from donor Engine, and puts orbital camera
 * at central point (0, 0).
 */
class DummyLoader implements EngineLoader{
  constructor(private mainEngine: Engine){}

  public getEngineSceneParams(): EngineSceneParams {
    return this.mainEngine.getEngineScene().getParams()
  }

  public getTerrainManagerParams(): TerrainManagerParams {
    const donorParams = this.mainEngine.getTerrainManager().getParams()
    return {
      ...donorParams,
      rounds: 2,
      chunkSize: Math.max(10, donorParams.chunkSize),
      terrainResolution: Math.min(200, donorParams.terrainResolution),
      hysteresis: 2
    }
  }

  public getDecorationsManagerParams(): DecorationManagerParams {
    return {
      chunkManagers: []
    }
  }

  public getObjectDescription(): EngineOjectsDescription {
    return {
      entities: [
        {
          id: 1,
          type: "orbital-viewer",
          position: editPosition,
          orientation: {vertical: 0, horizontal: 0}
        }
      ],
      camera: {
        type: "first-person",
        targetId: 1
      },
      controllers: [
        {
          type: "viewer",
          targetId: 1
        }
      ]
    }
  }
}


export class ModelPreviewer{

  private engine: Engine
  private previwerInited: boolean = false

  private modelLoader?: ModelLoaderI
  private variantionModelLoader?: DecorationVariantsLoaderI
  private variantRequestId: number = 0
  private decorationVariant?: DecorationVariant
  private model?: Object3D
  private originalModel: Object3D | null = null
  private axesHelper!: AxesHelper;

  private updateFinishedSubject: Subject<number> = new Subject()
  private updateSubject: Subject<number> = new Subject()

  
  constructor(private mainEngine: Engine, private modelVariant: DecorationVariantParams){
    this.modelLoader = this.mainEngine.getDecorationsManager().getModelLoader()
    this.updateSubject.pipe(
      debounceTime(75)
    )
    .subscribe(() => this.requestModelUpdate())

    this.axesHelper = new AxesHelper(1.0)
    this.axesHelper.position.setX(editPosition.x)
    this.axesHelper.position.setZ(editPosition.y)
  }

  /**
   * @param params 
   */
  public updateModelVariant(params: DecorationVariantParamsDiff){
    if(!this.previwerInited || !this.model){
      this.modelVariant = {...this.modelVariant, ...params}
      return
    }

    // Todo: optimization. 
    this.modelVariant = {...this.modelVariant, ...params}
    this.requestModelUpdateBounced()
  }

  /**
   * Warning: Could be heavy function as it inits new engine.
   * @param container - html container element to put engine.
   */
  public bindToContainer(container: HTMLElement){
    const dummyLoader = new DummyLoader(this.mainEngine)
    const nodetree = this.mainEngine.getGeneratorNodeTree()
    this.engine = new Engine(container, nodetree, dummyLoader)
    this.variantionModelLoader = new DecorationVariantsLoader(this.engine, this.modelLoader)
    this.axesHelper.position.setY(this.engine.getTerrainManager().getHeight(editPosition))
    this.engine.getEngineScene().addSceneObject(this.axesHelper)
    this.mainEngine.stop()
    this.engine.start()

    this.previwerInited = true
    this.requestModelUpdate()
  }

  public getChildNodeList(): string[]{
    debugger
    if(!this.originalModel){
      return ['']
    }

    const nodeNames = ['']
    this.originalModel.traverse(obj => {
      if(obj.name){
        nodeNames.push(obj.name)
      }
    })

    return nodeNames
  }

  private requestModelUpdateBounced(): void{
    this.updateSubject.next(0)
  }

  private requestModelUpdate(): void{
    const requestId = ++this.variantRequestId
    this.originalModel = null

    this.variantionModelLoader.loadDecorationVariants([this.modelVariant]).then(result => {
      const variant = result[0]

      if(requestId !== this.variantRequestId){
        this.variantionModelLoader.disposeOfDecorationVariants([variant])
        return
      }

      this.originalModel = this.modelLoader.getModel(this.modelVariant.modelSrc)

      this.updateModel(variant)
      this.updateFinishedSubject.next(0)
    })
  }

  private updateModel(modelVariant: DecorationVariant): void{
    const newModel = new Object3D()
    modelVariant.modelFragments.forEach(fragment => {
      newModel.add(new Mesh(fragment.geometry, fragment.material))
    })
    newModel.position.setX(editPosition.x)
    newModel.position.setZ(editPosition.y)
    newModel.position.setY(this.engine.getTerrainManager().getHeight(editPosition))

    if(this.model){
      this.engine.getEngineScene().removeSceneObject(this.model)
    }
    this.model = newModel
    this.engine.getEngineScene().addSceneObject(this.model)

    if(this.decorationVariant){
      this.variantionModelLoader.disposeOfDecorationVariants([this.decorationVariant])
    }
    this.decorationVariant = modelVariant
    
  }

  public getUpdateObservable(): Observable<unknown>{
    return this.updateFinishedSubject
  }

  public dispose(): void{
    if(this.decorationVariant){
      this.variantionModelLoader.disposeOfDecorationVariants([this.decorationVariant])
    }

    this.engine.getEngineScene().removeSceneObject(this.axesHelper)
    this.axesHelper.dispose()
    this.engine.dispose()
    this.mainEngine.start()
    this.updateSubject.complete()
    this.updateFinishedSubject.complete()
  }

}