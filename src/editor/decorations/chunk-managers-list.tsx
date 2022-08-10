import { Component } from "react"
import { DecorationsParamManager } from "../../engine/decorations-manager/decorations-manager"

import styles from "./chunk-managers-list.module.scss"

type Props = {
  decorationsManager: DecorationsParamManager,
  selectedChunkManagerId: number,
  selectCallback: (id: number) => void
}

/**
 * Creates and deletes DecorationsChunkManagers. Behaves as controlable input
 * component relative to DecorationChunkManager id selection. 
 */
export class ChunkManagersList extends Component{

  props: Props

  render(){
    const {decorationsManager : manager} = this.props

    const addChunkManager = () => {
      manager.addChunkManager()
      const managerList = manager.getParams().chunkManagers
      const lastId = managerList[managerList.length-1].id
      this.props.selectCallback(lastId)
    }

    return (
      <div className={styles["chunk-manager-list"]}>
        {
          this.getChunkManagersList()
        }

        <div className={styles["add-btn"]} onClick={addChunkManager}>
          Add
        </div>

      </div>
    )
  }

  getChunkManagersList(){
    const {decorationsManager} = this.props
    const {chunkManagers: chunkManagersParams} = decorationsManager.getParams()

    return chunkManagersParams.map(params => {
      const toggleDisplayed = () => {
        debugger
        decorationsManager.updateChunkManager(params.id, {displayed: !params.displayed})
        this.forceUpdate()
      }
      const select = () => this.props.selectCallback(params.id)
      const deleteChunkManager = () => {
        decorationsManager.removeChunkManager(params.id)
        if(params.id === this.props.selectedChunkManagerId){
          this.props.selectCallback(-1)
        }else{
          this.forceUpdate()
        }
      }

      let listItemClasses = styles["chunk-manager"]
      if(params.id === this.props.selectedChunkManagerId){
        listItemClasses += " " + styles["selected-chunk-manager"]
      }

      return (
        <div key={params.id} className={listItemClasses}>

          <div className={styles["visiability-indicator"]} onClick={toggleDisplayed}>
            {
              params.displayed === true
              ? <img src="public/assets/fontawesome/solid/circle-check.svg" />
              : <img src="public/assets/fontawesome/solid/circle.svg" />
            }
          </div>

          <div className={styles["blank"]} onClick={select}>
          </div>

          <div className={styles["remove-btn"]} onClick={deleteChunkManager}>
            <img src="public/assets/fontawesome/solid/trash-can.svg"></img>
          </div>

        </div>
      )
    })
  }

}