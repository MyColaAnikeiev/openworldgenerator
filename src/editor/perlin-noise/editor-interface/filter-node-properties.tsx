import { Component, FormEvent } from "react";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { FilterSchemaProperties, NodeSchema } from "../types";
import styles from "./filter-node-properties.module.scss";

export class FilterNodeProperties extends Component{
    
    props: { 
        schema: NodeSchema,
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
                    <label>
                        
                    </label>
                </div>

                {this.getControls()}

            </div>
        )
    }

    getControls(){
        const {properties} = this.props.schema;

        switch(this.props.schema.properties.filterType){
            case "scale":
                return [
                    (
                        <div key="scale" className={styles.row}>
                            <label>Scale</label>
                            <input
                                name="scale"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.scale}
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
                            <label>
                                
                            </label>
                        </div>
                    )
                ]
            case "binary": 
                return [(
                        <div key="threshold" className={styles.row}>
                            <label>Threshold</label>
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
                            <label>top</label>
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
                            <label>bottom</label>
                            <input
                                name="lowerValue"
                                type="number" step="0.1"
                                onInput={(evt: FormEvent) => this.handleInput(evt)}
                                value={properties.lowerValue}
                            />
                        </div>
                    )
                ]
        }
    }


    handleInput(evt: FormEvent){
        const elm = evt.target as HTMLInputElement;
        
        if(elm.name === "scale"){
            this.props.outputCallback({scale: parseFloat(elm.value)})
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
    }


}