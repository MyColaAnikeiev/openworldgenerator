import { Component } from "react"
import { DecorationsManager } from "../../engine/decorations-manager/decorations-manager"
import { LabeledNumberInput } from "../common/materials/labeled-number-input"

type Props = {
  selectedChunkManagerId: number,
  decorationsManager: DecorationsManager
}

type State = {
  density: number,
  chunkSize: number,
  rounds: number,
  hysteresis: number
}

export class ChunkManagerGeneralParams extends Component{
  props: Props
  state: State

  updateDensity: (density: number) => void
  updateChunkSize: (chunkSize: number) => void
  updateRounds: (rounds: number) => void
  updateHysteresis: (hysteresis: number) => void

  constructor(props: Props){
    super(props)

    this.updateDensity = this.updateChunkManagerParams.bind(this,'density')
    this.updateChunkSize = this.updateChunkManagerParams.bind(this, 'chunkSize')
    this.updateRounds = this.updateChunkManagerParams.bind(this, 'rounds')
    this.updateHysteresis = this.updateChunkManagerParams.bind(this, 'hysteresis')
  }

  render(){
    const selectedChunkManagerParams = this.props.decorationsManager.getParams().chunkManagers
      .find(chunkManagerParams => chunkManagerParams.id === this.props.selectedChunkManagerId)

    if(!selectedChunkManagerParams){
      return null
    }

    return (
      <>
        <LabeledNumberInput
              label="Density"
              min={0}
              step={0.001}
              initialValue={selectedChunkManagerParams.density}
              inputCallbeck={this.updateDensity}
            />

            <LabeledNumberInput
              label="Chunk Size"
              min={1}
              step={1}
              initialValue={selectedChunkManagerParams.chunkSize}
              inputCallbeck={this.updateChunkSize}
            />

            <LabeledNumberInput
              label="Rounds"
              min={0}
              step={1}
              initialValue={selectedChunkManagerParams.rounds}
              inputCallbeck={this.updateRounds}
            />

            <LabeledNumberInput
              label="Hysteresis"
              min={0.001}
              step={0.001}
              initialValue={selectedChunkManagerParams.hysteresis}
              inputCallbeck={this.updateHysteresis}
            />
      </>
    )
  }

  updateChunkManagerParams(key: string, value: number): void{
    const chunkManagerId = this.props.selectedChunkManagerId
    this.props.decorationsManager.updateChunkManager(chunkManagerId, {[key]: value})
  }

}