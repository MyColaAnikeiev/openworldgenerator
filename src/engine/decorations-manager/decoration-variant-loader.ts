import { Material, Mesh, MeshStandardMaterial, Object3D } from "three";
import { DecorationModelFragment, DecorationVariant } from "../chunk-manager/types";
import { EngineUserInterface } from "../engine";
import { DecorationVariantParams } from "../loader-types";
import { DecorationVariantsLoaderI } from "./decoration-variants-loader-interface";
import { ModelLoaderI } from "../../common/tools/model-loader/model-loader-interface";


export class DecorationVariantsLoader implements DecorationVariantsLoaderI{

  loadedModels: Map<string, Object3D> = new Map()

  constructor(private hostEngine: EngineUserInterface, private modelLoader: ModelLoaderI) {}

  public loadDecorationVariants(params: DecorationVariantParams[]): Promise<DecorationVariant[]> {
    const urlList = params.map(param => param.modelSrc)
    
    const promise = new Promise<DecorationVariant[]>(resolve => {
      if(urlList.every(url => this.loadedModels.has(url))){
        resolve(this.getDecorationVariants(params))
        return
      }

      this.modelLoader.requestModels(urlList, results => {
        for(let i = 0; i < urlList.length; i++){
          if(results[i]){
            this.loadedModels.set(urlList[i], results[i])
          }
        }

        resolve(this.getDecorationVariants(params))        
      })  
    })

    return promise
  }

  disposeOfDecorationVariants(decorationVariants: DecorationVariant[]): void {
    decorationVariants.forEach(variant => {
      // Note: Fragments are copies of geometry and material, but not textures.
      variant.modelFragments.forEach(fragment => {
        fragment.geometry?.dispose()
        fragment.material?.dispose()
      })
    })
  }

  private getDecorationVariants(variantsParams: DecorationVariantParams[]): DecorationVariant[]{
    const totalProbability = variantsParams.reduce((prev, variant) => prev + variant.probability, 0)

    return variantsParams.map(variantParams => {
        return { 
            normalizedProbability: variantParams.probability / totalProbability,
            modelFragments: this.getFragments(variantParams)
        }
    })
  }

  private getFragments(variantParams: DecorationVariantParams): DecorationModelFragment[]{
    const list: DecorationModelFragment[] = []
    let model = this.loadedModels.get(variantParams.modelSrc) ?? new Object3D()

    if(variantParams.gltfNodeName){
      model = model.getObjectByName(variantParams.gltfNodeName)
    }

    if(!model){
      return []
    }

    const {translate} = variantParams
    const {scale} = variantParams 
    const helper = new Object3D()
    helper.position.set(translate.x, translate.y, translate.z)
    helper.scale.set(scale, scale, scale)
    helper.updateMatrixWorld();
  
    model.traverse(obj => {
      if(obj.type === "Mesh"){
        const mesh = obj as Mesh;
        mesh.updateWorldMatrix(true, false);
        const material = this.cloneMaterial(mesh.material, variantParams);

        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);
        geometry.applyMatrix4(helper.matrixWorld);

        list.push({ geometry, material })
      }
    })

    return list;
  }


  /**
   * Return cloned material with applied parameters.
   */
  private cloneMaterial(srcMat: Material | Material[], params: DecorationVariantParams): MeshStandardMaterial{
    let meshMaterial = !Array.isArray(srcMat) 
      ? srcMat 
      : srcMat[0] ?? new MeshStandardMaterial()
    if(!meshMaterial || meshMaterial.type !== 'MeshStandardMaterial'){
      meshMaterial = new MeshStandardMaterial()
    }

    const mat = meshMaterial.clone() as MeshStandardMaterial

    mat.depthWrite = true
    mat.envMap = this.hostEngine.getEngineScene().getEnvironmentMap()

    if(params.envMapIntensity !== undefined){
      mat.envMapIntensity = params.envMapIntensity
    }
    mat.alphaTest = Math.max(0.5, meshMaterial.alphaTest)
    if(params.alphaTest !== undefined){
      mat.alphaTest = params.alphaTest
    }
    if(params.color !== undefined){
      mat.color.set(params.color)
    }
  
    mat.metalness = Math.min(0.5, mat.metalness)
    
    mat.needsUpdate = true

    return mat
  } 

  private getVariantCacheKey(param: DecorationVariantParams): string{
    return param.modelSrc + "_" + param.gltfNodeName
  }
}