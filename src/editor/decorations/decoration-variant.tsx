import { Component, ReactNode } from "react"
import { DecorationsParamManager } from "../../engine/decorations-manager/decorations-manager"
import { DecorationChunkParams } from "../../engine/preset-types"
import { NumberInput } from "../common/materials/number-input"

import styles from './decoration-variant.module.scss'

type Props = {
  decorationsManager: DecorationsParamManager,
  selectedChunkManagerId: number,
  startModelEditingCallback: (variantId: number) => void
}



export class DecorationVariants extends Component{
  props: Props

  render(): ReactNode {
    const {decorationsManager} = this.props
    const {selectedChunkManagerId} = this.props

    const chunkParams = decorationsManager.getParams().chunkManagers.find(
      chunkParams => chunkParams.id === selectedChunkManagerId
    )
    if(!chunkParams){
      return null
    }
  
    const addVariant = () => {
      decorationsManager.addChunkManagerVariant(chunkParams.id)
      this.forceUpdate()
    }
  
    return (
      <div className={styles["container"]}>
  
        <div className={styles["label"]}>
          <p>Decoration Variants</p>
        </div>
  
        <div className={styles["list-head"]}></div>
  
        <div className={styles["scrollable-body"]}>
          { this.getVarinatns(chunkParams) }
        </div>
  
        <div className={styles["add-btn"]} onClick={addVariant}>Add</div>
  
      </div>
    )
  }

  private getVarinatns(chunkParams: DecorationChunkParams): ReactNode{
    if(!chunkParams){
      return null
    }

    const {decorationsManager} = this.props
    const {selectedChunkManagerId} = this.props

    return chunkParams.variants.map(varianParams => {
  
      const probabilityInputCallback = (prob: number) => {
        decorationsManager.updateChunkManagerVariant(
            selectedChunkManagerId,
            varianParams.id,
            { probability: prob }
          )
      }
      const startModelEditing = this.props.startModelEditingCallback.bind(null, varianParams.id)
      const deleteVariant = () => {
          decorationsManager.removeChunkManagerVariant(selectedChunkManagerId, varianParams.id)
        this.forceUpdate()
      }

      return (
        <div className={styles["variant"]} key={varianParams.id}>
          <div className={styles["probability-input"]}>
            <NumberInput min={0} step={1} 
              initialValue={varianParams.probability}
              inputCallbeck={probabilityInputCallback}
            />
          </div>
          <div className={styles["model-edit-btn"]} onClick={startModelEditing}>Edit Model</div>
          <div className={styles["delete-btn"]} onClick={deleteVariant}>Del</div>
        </div>
      )
    })
  }
}