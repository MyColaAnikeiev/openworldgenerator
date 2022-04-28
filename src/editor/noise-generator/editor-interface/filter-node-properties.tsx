import { Component, FormEvent } from "react";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { FilterSchemaProperties, NodeSchema } from "../types";
import styles from "./filter-node-properties.module.scss";

export class FilterNodeProperties extends Component{
    
    props: { 
        schema: NodeSchema,
        selectionMode: boolean,
        outputCallback: (out: NodeParamsUpdateChanges) => void,
        connectionEndCallback: (connType: string, connInd: number) => void
    }

    render(){
        const properties = this.props.schema.properties as FilterSchemaProperties;

        return (
            <div className={styles.properties}>
                <div className={styles.row}>
                    <div 
                        className={styles['input-hook']}
                        onMouseUp={() => this.props.connectionEndCallback("default", 0)}
                    ></div>
                    <label className={styles['input-label']}>
                        Input
                    </label>
                </div>

                {this.getControls()}

            </div>
        )
    }

    getControls(){
        const {properties} = this.props.schema;

        switch(this.props.schema.subtype){
            case "scale":
                return [
                    (
                        <div key="scale" className={styles.row}>
                            <label>Scale:</label>
                            <input
                                name="scale"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.scale}
                            />
                        </div>
                    ),
                    (
                        <div key="add" className={styles.row}>
                            <label>Add:</label>
                            <input
                                name="add"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.add}
                            />
                        </div>
                    )
                ]
            case "dynamic-scale":
                return [
                    (
                        <div key="dynamic-scale" className={styles.row}>
                            <div 
                                className={styles['input-hook']}
                                onMouseUp={() => this.props.connectionEndCallback("scale-filter.control", 0)}
                            ></div>
                            <label className={styles['input-label']}>
                                Input
                            </label>
                        </div>
                    )
                ]
            case "binary": 
                return [(
                        <div key="threshold" className={styles.row}>
                            <label>Threshold:</label>
                            <input
                                name="threshold"
                                type="number" step="0.05"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.threshold}
                            />
                        </div>
                    ),
                    (
                        <div key="upperValue" className={styles.row}>
                            <label>top:</label>
                            <input
                                name="upperValue"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.upperValue}
                            />
                        </div>
                    ),
                    (
                        <div key="loverValue" className={styles.row}>
                            <label>bottom:</label>
                            <input
                                name="lowerValue"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.lowerValue}
                            />
                        </div>
                    )
                ]
            case "limit":
            case "smooth-limit":
                return [
                    (
                        <div key="maxValue" className={styles.row}>
                            <label>max:</label>
                            <input
                                name="maxValue"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.maxValue}
                            />
                        </div>
                    ),
                    (
                        <div key="minValue" className={styles.row}>
                            <label>min:</label>
                            <input
                                name="minValue"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.minValue}
                            />
                        </div>
                    )
                ]
        }
    }


    handleInput(evt: FormEvent){
        if(this.props.selectionMode){
            return;
        }

        const elm = evt.target as HTMLInputElement;
        
        if(elm.name === "scale"){
            this.props.outputCallback({scale: parseFloat(elm.value)})
        }
        if(elm.name === "add"){
            this.props.outputCallback({add: parseFloat(elm.value)})
        }

        if(elm.name === "threshold"){
            this.props.outputCallback({threshold: parseFloat(elm.value)})
        }
        if(elm.name === "upperValue"){
            this.props.outputCallback({ upperValue: parseFloat(elm.value)})
        }
        if(elm.name === "lowerValue"){
            this.props.outputCallback({ lowerValue: parseFloat(elm.value)})
        }

        if(elm.name === "maxValue"){
            this.props.outputCallback({ maxValue: parseFloat(elm.value)})
        }
        if(elm.name === "minValue"){
            this.props.outputCallback({ minValue: parseFloat(elm.value)})
        }
    }

}