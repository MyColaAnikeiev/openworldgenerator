import { Component } from "react";
import { CombinatorSchemaProperties, NodeSchema } from "../types";
import styles from "./combinator-node-properties.module.scss";

export class CombinatorNodeProperties extends Component{
    
    props: { 
        schema: NodeSchema,
        outputTrigger: (out: { [key: string]: any }) => void,
    }

    render(){
        const properties = this.props.schema.properties as CombinatorSchemaProperties;
        const inputs = this.getInputs();

        return (
            <div className={styles.properties}>
                <div className={styles.row}>
                    <label>Use:</label>
                    <input
                        name="num-of-inputs"
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
        const properties = this.props.schema.properties as CombinatorSchemaProperties;
        const weighted =  this.props.schema.type === "weighted-combinator";

        const inputs = Array.from(Array(properties.numOfInputs)).map((_, ind: number) => {
            return (
                <div key={ind.toString()} className={styles.row}>
                    <div className={styles['input-hook']}></div>
                    { weighted && 
                     <input
                        name={ "weight-" + ind.toString()}
                        type="number" step="0.1"
                        onInput={this.handleInput.bind(this)}
                        value={properties.weights[ind]}
                    />
                    }
                </div>
            )
        })

        return  inputs;
    }


    handleInput(evt: InputEvent){
        const elm = evt.target as HTMLInputElement;
        this.props.outputTrigger({ [elm.name] : elm.value });
    }

}