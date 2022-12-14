import { Component, FormEvent, MouseEvent } from "react";
import { NodeParamsUpdateChanges } from "../../generator/nodes/types"
import { CombinatorSchemaProperties, ConnectionTargetType, NodeSchema } from "../../generator/types";
import styles from "./combinator-node-properties.module.scss";

export class CombinatorNodeProperties extends Component{
    
    props: { 
        schema: NodeSchema,
        selectionMode: boolean,
        outputCallback: (out: NodeParamsUpdateChanges) => void,
        connectionEndCallback: (connType: string, connInd: number) => void,
        connectionRemoveCallback: (connType: ConnectionTargetType, connIndex?: number) => void
    }

    render(){
        const properties = this.props.schema.properties as CombinatorSchemaProperties;
        const inputs = this.getInputs();

        return (
            <div className={styles.properties}>
                <div className={styles.row}>
                    <label>Use:</label>
                    <input
                        name="numOfInputs"
                        type="number" min="2" max="255"
                        onInput={this.handleInput.bind(this)}
                        value={properties.numOfInputs}
                    />
                </div>
                <hr />
                { inputs }
            </div>
        )
    }

    getInputs(){
        const {schema} = this.props;
        const properties = schema.properties;
        const weighted =  schema.subtype === "weighted-combinator";

        const inputs = Array.from(Array(properties.numOfInputs)).map((_, ind: number) => {
            const handleInputHookContextClick = (evt: MouseEvent) => {
                evt.preventDefault();
                evt.stopPropagation();
                this.props.connectionRemoveCallback("default",ind)
            }

            return (
                <div key={ind.toString()} className={styles.row}>
                    <div 
                        className={styles['input-hook']}
                        onMouseUp={() => this.props.connectionEndCallback("default", ind)}
                        onContextMenu={handleInputHookContextClick}
                    ></div>
                    { weighted ?
                     <input
                        name="weight"
                        type="number" step="0.1"
                        onInput={(evt: FormEvent) => this.handleInput(evt, ind)}
                        value={properties.weights[ind]}
                    />
                    :
                    <label className={styles['input-label']}>Input</label>
                    }
                </div>
            )
        })

        return  inputs;
    }


    handleInput(evt: FormEvent, connectionIndex?: number){
        if(this.props.selectionMode){
            return;
        }

        const elm = evt.target as HTMLInputElement;

        if(elm.name === "weight"){
            this.props.outputCallback({ weight: { 
                    index: connectionIndex,
                    value: parseFloat(elm.value) 
                }
            })
        }
        if(elm.name === "numOfInputs"){
            this.props.outputCallback({numOfInputs: Number(elm.value)});
        }
    }


}