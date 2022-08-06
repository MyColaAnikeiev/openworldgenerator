import { Component } from "react"
import { Engine } from "../../engine/engine"
import { DecorationVariantParams } from "../../engine/loader-types"
import { ModelPreviewer } from "../../engine/model-preview"
import { MColorPicker } from "../common/materials/color-picker"
import { LabeledNumberInput } from "../common/materials/labeled-number-input"
import { LabeledSelector } from "../common/materials/labeled-selector"
import { LabeledStringInput } from "../common/materials/labeled-string-input"

import styles from './model-editor.module.scss'

export type ModelEditorResultCallback = (variant: DecorationVariantParams) => void

type Props = {
  mainEngine: Engine,
  initialDecorationVariantParams: DecorationVariantParams,
  resultCallback: ModelEditorResultCallback
}

type State = {

}

export class ModelEditor extends Component{

  props: Props
  state: State

  currentParams: DecorationVariantParams

  modelEditorPreview: ModelPreviewer

  previewCanvasConteiner: HTMLElement | null = null

  modelSourceChangeHandler!: (src: string) => void
  modelNodeNameSelectionHandler!: (name: string) => void
  scalePramHandler!: (value: number) => void
  colorMaskParamHandler!: (color: string | number) => void
  alphaTestParamHandler!: (value: number) => void
  envMapIntensityParamHandler!: (value: number) => void
  translationHandler!: (direction: 'x' | 'y' | 'z', value: string) => void

  constructor(props: Props){
    super(props)

    this.state = {}
    this.currentParams = {...props.initialDecorationVariantParams}

    this.modelSourceChangeHandler = this.handleModelSourceChange.bind(this)
    this.modelNodeNameSelectionHandler = this.handleParameterChange.bind(this, "gltfNodeName")
    this.scalePramHandler = this.handleParameterChange.bind(this,"scale")
    this.alphaTestParamHandler = this.handleParameterChange.bind(this,"alphaTest")
    this.envMapIntensityParamHandler = this.handleParameterChange.bind(this,"envMapIntensity")
    this.translationHandler = this.handleTranslateChange.bind(this)
    this.colorMaskParamHandler = this.handleParameterChange.bind(this, "color")
  }

  render(){
    const params = this.currentParams

    const setPreviewContainer = (elm: HTMLElement) => this.previewCanvasConteiner = elm
    const goBackDiscard = () => this.props.resultCallback(this.props.initialDecorationVariantParams)
    const goBackSave = () => this.props.resultCallback(this.currentParams)

    const childNodeNames = this.modelEditorPreview?.getChildNodeList() ?? ['']

    return (
      <div className={styles["model-editor-container"]}>
        <div ref={setPreviewContainer} className={styles["preview-canvas"]}></div>

        <div className={styles["side-panel"]}>
          <button onClick={goBackDiscard}>Discard and Quit</button>
          <button onClick={goBackSave}>Save and go back</button>

          <LabeledStringInput 
            labelText="model source url:"
            initialValue={params.modelSrc}
            outputCallback={this.modelSourceChangeHandler}
          />

          <LabeledSelector 
            label="Select child node"
            value={params.gltfNodeName}
            optionList={childNodeNames}
            selectionCallback={this.modelNodeNameSelectionHandler}
          />

          <LabeledNumberInput 
            label="scale"
            initialValue={params.scale}
            min={0}
            step={0.1}
            inputCallbeck={this.scalePramHandler}
          />
          <LabeledNumberInput 
            label="translateX"
            initialValue={params.translate.x}
            step={0.1}
            inputCallbeck={this.handleTranslateChange.bind(this,'x')}
          />
          <LabeledNumberInput 
            label="translateY"
            initialValue={params.translate.y}
            step={0.1}
            inputCallbeck={this.handleTranslateChange.bind(this,'y')}
          />
          <LabeledNumberInput 
            label="translateZ"
            initialValue={params.translate.z}
            step={0.1}
            inputCallbeck={this.handleTranslateChange.bind(this,'z')}
          />

          <MColorPicker 
            initialHexColor={params.color ?? 0xffffff}
            outputCallback={this.colorMaskParamHandler}
          />

          <LabeledNumberInput 
            label="alphaTest"
            initialValue={params.alphaTest}
            min={0.0}
            max={1.0}
            step={0.05}
            inputCallbeck={this.alphaTestParamHandler}
          />

          <LabeledNumberInput 
            label="environment map intensity"
            initialValue={params.envMapIntensity}
            min={0}
            step={0.05}
            inputCallbeck={this.envMapIntensityParamHandler}
          />
        </div>

      </div>
    )
  }

  handleTranslateChange(direction: 'x' | 'y' | 'z', value: number): void{
    this.currentParams.color
    this.currentParams = {
      ...this.currentParams,
      translate: {
        ...this.currentParams.translate,
        [direction]: value
      }
    }

    this.modelEditorPreview.updateModelVariant(this.currentParams)
  }

  handleParameterChange(param: string, value: number | string): void{
    this.currentParams = {
      ...this.currentParams,
      [param]: value
    }

    this.modelEditorPreview.updateModelVariant(this.currentParams)
  }

  handleModelSourceChange(src: string): void{
    this.currentParams = {
      ...this.currentParams,
      modelSrc: src
    }

    this.modelEditorPreview.updateModelVariant(this.currentParams)
  }

  componentDidMount(): void {
    this.modelEditorPreview = new ModelPreviewer(this.props.mainEngine, this.props.initialDecorationVariantParams)
    this.modelEditorPreview.getUpdateObservable().subscribe(
      () => this.forceUpdate()
    )
    this.modelEditorPreview.bindToContainer(this.previewCanvasConteiner)
  }

  componentWillUnmount(): void {
    this.modelEditorPreview.dispose()
  }

}