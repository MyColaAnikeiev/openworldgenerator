import { Component } from "react";
import { EngineManager } from "../../engine-manager";
import { EditorTabBody } from "../common/editor-tab-body";
import { MColorPicker } from "../common/materials/color-picker";
import { LabeledCheckBox } from "../common/materials/labeled-checkbox";
import { LabeledNumberInput } from "../common/materials/labeled-number-input";
import { RadioGroup } from "../common/materials/radio-group";

import styles from "./scene-editor.module.scss";


type Props = {
    manager: EngineManager
}

type State = {
    sceneClearColor: string | number,
    ambientLightIntensity: number,
    ambientLightColor: string | number,
    sunLightIntensity: number,
    sunLightColor: string | number,
    fogType: "none" | "linear" | "exponential",
    fogColor: number | string,
    linearFogNear: number,
    linearFogFar: number,
    exponentialFoxDensity: number
}

export class SceneEditor extends Component{

    props: Props;
    state: State;

    fogCheckboxHandler: (value: boolean) => void;
    fogTypeSelectionHandler: (fogType: string) => void;

    constructor(props: Props){
        super(props);

        const params = this.props.manager.getEngine().getEngineScene().getParams();
        this.state = {
            sceneClearColor: params.sceneClearColor,
            ambientLightIntensity: params.ambientLightIntensity,
            ambientLightColor: params.ambientLightColor,
            sunLightIntensity: params.sunLightIntensity,
            sunLightColor: params.sunLightColor,
            fogType: params.fogType,
            fogColor: params.fogColor,
            linearFogNear: params.linearFogNear,
            linearFogFar: params.linearFogFar,
            exponentialFoxDensity: params.exponentialFoxDensity
        }

        this.fogCheckboxHandler = this.handleFogCheckbox.bind(this);
        this.fogTypeSelectionHandler = this.handleFogTypeSelection.bind(this);
    }

    render(){

        return (
            <EditorTabBody
                manager={this.props.manager}
                popups={[]}
            >
                <div className={styles["parameters-group"]}>
                    <label>Clear color:</label>
                    <MColorPicker 
                        initialHexColor={this.state.sceneClearColor}
                        outputCallback={this.handleColorInput.bind(this,"sceneClearColor")}
                    />
                </div>

                <div className={styles["parameters-group"]}>
                    <label>Ambient light</label>
                    <MColorPicker 
                        initialHexColor={this.state.ambientLightColor}
                        outputCallback={this.handleColorInput.bind(this,"ambientLightColor")}
                    />
                    <LabeledNumberInput 
                        label="intensity"
                        min={0}
                        step={0.05}
                        initialValue={this.state.ambientLightIntensity}
                        inputCallbeck={this.handleNumberInput.bind(this,"ambientLightIntensity")}
                    />
                </div>

                <div className={styles["parameters-group"]}>
                    <label>Sun light</label>
                    <MColorPicker 
                        initialHexColor={this.state.sunLightColor}
                        outputCallback={this.handleColorInput.bind(this,"sunLightColor")}
                    />
                    <LabeledNumberInput 
                        label="intensity"
                        min={0}
                        step={0.05}
                        initialValue={this.state.sunLightIntensity}
                        inputCallbeck={this.handleNumberInput.bind(this,"sunLightIntensity")}
                    />
                </div>

                { this.getFogFields() }

            </EditorTabBody>
        )

    }

    getFogFields(){
        return (
            <div className={styles["parameters-group"]}>

                <LabeledCheckBox 
                    label="Fog"
                    on={this.state.fogType !== "none"}
                    switchCallbeck={this.fogCheckboxHandler}
                />

                {
                    this.state.fogType !== "none" &&
                    <>
                        <RadioGroup 
                            title="Fog type:" 
                            selected={this.state.fogType}
                            changeCallback={this.fogTypeSelectionHandler}
                        >
                            {[
                                {
                                    text: "Linear",
                                    value: "linear"
                                },
                                {
                                    text: "Exponential",
                                    value: "exponential"
                                }
                            ]}
                        </RadioGroup>

                        <MColorPicker 
                            initialHexColor={this.state.fogColor}
                            outputCallback={this.handleColorInput.bind(this, "fogColor")}
                        />
                    </>
                }

                {
                    this.state.fogType === "linear"
                        &&
                    <>
                        <LabeledNumberInput 
                            label="near"
                            min={0}
                            initialValue={this.state.linearFogNear}
                            inputCallbeck={this.handleNumberInput.bind(this, "linearFogNear")}
                        />
                        <LabeledNumberInput 
                            label="far"
                            min={this.state.linearFogNear}
                            initialValue={this.state.linearFogFar}
                            inputCallbeck={this.handleNumberInput.bind(this, "linearFogFar")}
                        />
                    </>
                }

                {
                    this.state.fogType === "exponential"
                        &&
                    <LabeledNumberInput 
                        label="density"
                        min={0}
                        step={0.001}
                        initialValue={this.state.exponentialFoxDensity}
                        inputCallbeck={this.handleNumberInput.bind(this, "exponentialFoxDensity")}
                    />
                }

            </div>
        )
    }

    handleFogCheckbox(value: boolean): void{
        const scene = this.props.manager.getEngine().getEngineScene();

        if(value){
            this.setState({fogType: "linear"})
            scene.setParams({fogType: "linear"});
            
        }else{
            this.setState({fogType: "none"})
            scene.setParams({fogType: "none"})
        }
    }

    handleFogTypeSelection(fogType: "linear" | "exponential"): void{
        const scene = this.props.manager.getEngine().getEngineScene();

        this.setState({fogType});
        scene.setParams({fogType});
    }

    handleNumberInput(param: string, value: number): void{
        const scene = this.props.manager.getEngine().getEngineScene();
        this.setState({[param]: value});
        scene.setParams({[param]: value});
    }

    handleColorInput(param: string, color: string): void{
        const scene = this.props.manager.getEngine().getEngineScene();
        // Convert css hex string to number.
        const numColor = parseInt((color.slice(1)),16);
        this.setState({[param]: color});
        scene.setParams({[param]: numColor});
    }

}