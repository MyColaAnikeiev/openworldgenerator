import { Component } from "react";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { NodeSchema, SourceSchemaProperties } from "../types";

import styles from "./source-node-properties.module.scss";

export class SourceNodeProperties extends Component{

    props: { 
        schema: NodeSchema,
        outputCallback: (out: NodeParamsUpdateChanges) => void,
    }


    render(){
        const properties = this.props.schema.properties as SourceSchemaProperties;

        return (
            <div className={styles.properties}>
                        <div className={styles.row}>
                            <label>Seed</label>
                            <input
                                name="seed"
                                type="number" min="0" max="255"
                                onInput={this.handleInput.bind(this)}
                                value={properties.seed}
                            />
                        </div>
                        <div className={styles.row}>
                            <label>Size</label>
                            <input 
                                name="size"
                                type="number" min="0.0001" step="0.1"
                                onInput={this.handleInput.bind(this)}
                                value={properties.size}
                            />
                        </div>
            </div>
        )
    }

    handleInput(evt: InputEvent){
        const elm = evt.target as HTMLInputElement;
        this.props.outputCallback({ [elm.name] : elm.value });
    }
}