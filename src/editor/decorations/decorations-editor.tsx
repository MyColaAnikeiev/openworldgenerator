import { Component, ReactElement } from "react";
import { EngineManager } from "../../engine-manager";
import { DecorationsManager } from "../../engine/decorations-manager/decorations-manager";
import { EngineControllerInterface, EngineUserInterface } from "../../engine/engine";
import { DecorationVariantParams } from "../../engine/loader-types";
import { EditorTabBody } from "../common/editor-tab-body";
import { Headline } from "../common/materials/headline";
import { LabeledButton } from "../common/materials/labeled-button";
import { NodeSelectionPopup } from "../common/node-selection-popup";
import { ChunkManagerGeneralParams } from "./chunk-manager-general-params";
import { ChunkManagersList } from "./chunk-managers-list";
import { DecorationVariants } from "./decoration-variant";
import { ModelEditor } from "./model-editor";

type Props = {
  manager: EngineManager
}

type State = {
  selectedChunkManagerId: number
  nodeSelectionPopup: ReactElement | null,
  modelEditingPopup: ReactElement | null,
  modelEditingVariantId: number | null
}

export class DecorationsEditor extends Component{
  props: Props
  state: State

  engine: EngineUserInterface
  decorationsManager: DecorationsManager

  selectChunkManagerCallback: (id: number) => void
  showNodeSelectionCallback: () => void
  showModelEditingCallback: (variantId: number) => void
  

  constructor(props: Props){
    super(props)

    this.state = { 
      selectedChunkManagerId: 1, 
      nodeSelectionPopup: null,
      modelEditingPopup: null,
      modelEditingVariantId: null
    }

    this.engine = this.props.manager.getEngine()
    this.decorationsManager = this.engine.getDecorationsManager()

    this.selectChunkManagerCallback = (id: number) => this.setState({selectedChunkManagerId: id})
    this.showNodeSelectionCallback = this.showNodeSelection.bind(this)
    this.showModelEditingCallback = this.showModelEditing.bind(this)
  }

  render(){

    return (
      <EditorTabBody manager={this.props.manager} popups={this.getPopups()}>

        <Headline>Chunk Managers</Headline>
        <ChunkManagersList 
          decorationsManager={this.decorationsManager}
          selectedChunkManagerId={this.state.selectedChunkManagerId}
          selectCallback={this.selectChunkManagerCallback}
        />

        { Boolean(this.state.selectedChunkManagerId !== -1) &&
          <>

            <LabeledButton labelText="Probability Map" buttonText="select" action={this.showNodeSelectionCallback} />

            <ChunkManagerGeneralParams 
              key={this.state.selectedChunkManagerId}
              selectedChunkManagerId={this.state.selectedChunkManagerId}
              decorationsManager={this.decorationsManager}
            />

            <DecorationVariants
              decorationsManager={this.decorationsManager}
              selectedChunkManagerId={this.state.selectedChunkManagerId}
              startModelEditingCallback={this.showModelEditingCallback}
            />

          </>
        }

      </EditorTabBody>
    )
  }

  getPopups(): ReactElement[]{
    const popups = [];

    if(this.state.nodeSelectionPopup){
      popups.push([this.state.nodeSelectionPopup]);
    }
    if(this.state.modelEditingPopup){
      popups.push(this.state.modelEditingPopup)
    }

    return popups;
  }

  showNodeSelection(): void{
    const nodeTree = this.engine.getGeneratorNodeTree();
    
    const selectNode = (sourceNodeId: number ) => {
        this.engine.getDecorationsManager()
          .updateChunkManager(this.state.selectedChunkManagerId,{probabilityMapId: sourceNodeId})

        this.setState({
            nodeSelectionPopup: null
        })
    }

    const goBack = () => {
        this.setState({
            nodeSelectionPopup: null
        })
    }

    const nodeSelectionPopup = 
      <NodeSelectionPopup 
          key="generatorNodePicker"
          goBackCallback={goBack}
          nodeTree={nodeTree}
          selectionCallback={selectNode}
      />

    this.setState({nodeSelectionPopup})
  }

  showModelEditing(variantId: number): void{
    const {selectedChunkManagerId} = this.state
    const engine = this.props.manager.getEngine()
    const engineController: EngineControllerInterface = this.props.manager.getEngine()
    const decorationsManager = engine.getDecorationsManager()
    const params = decorationsManager.getParams().chunkManagers
    const decorationParams = params.find(param => param.id === selectedChunkManagerId)
    const variantParams = decorationParams.variants.find(params => params.id === variantId)
    
    engineController.stop()

    const resultCallback = (variantParams: DecorationVariantParams) => {
      decorationsManager.updateChunkManagerVariant(selectedChunkManagerId, variantId, variantParams)
      this.setState({
        modelEditingPopup: null
      })
    }

    const modelEditingPopup = <ModelEditor 
      mainEngine={engine}
      initialDecorationVariantParams={variantParams}
      resultCallback={resultCallback}
    />
    
    this.setState({
      modelEditingPopup,
      modelEditingVariantId: variantId
    })
  }

}