import { Component, FormEvent, ReactNode } from "react";
import styles from "./labeled-number-input.module.scss"

type Props = {
    label: string,
    min?: number,
    max?: number,
    step?: number,
    title?: string,
    initialValue?: number
    inputCallbeck: (value: number) => void
}

type InputParams = {
    min?: number,
    max?: number,
    step?: number
}

type State = {
    inputValue: number
}

export class LabeledNumberInput extends Component{

    props: Props;
    state: State;

    inputHandler: (evt: FormEvent<HTMLInputElement>) => void;

    constructor(props: Props){
        super(props);

        this.state = {
            inputValue: props.initialValue !== undefined ? props.initialValue : props.min !== undefined ? props.min : 0
        }

        this.inputHandler = this.handleInput.bind(this);
    }


    render(): ReactNode {
        const params: InputParams = {};
        ["min","max","step"].forEach(prm =>{
            if(prm in this.props){
                params[prm] = this.props[prm];
            }
        })

        const labelParams: { title?: string } = {};
        if(this.props.title){
            labelParams.title = this.props.title;
        } 

        return (
            <div className={styles["container"]}>

                <label {...labelParams}>{this.props.label}</label>

                <input 
                    onInput={this.inputHandler}
                    value={this.state.inputValue} 
                    type="number" 
                    {...params}
                />

            </div>
        )
    }

    handleInput(evt: FormEvent<HTMLInputElement>): void{
        const value = Number((evt.target as HTMLInputElement).value);

        if(isFinite(value)){
            this.props.inputCallbeck(value)
            this.setState({inputValue: value});
        }
    }

}