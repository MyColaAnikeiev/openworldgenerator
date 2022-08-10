import { Component, FormEvent, ReactNode } from "react";
import styles from "./labeled-number-input.module.scss"
import { NumberInput } from "./number-input";

type Props = {
    label: string,
    min?: number,
    max?: number,
    step?: number,
    title?: string,
    initialValue?: number
    inputCallbeck: (value: number) => void
}

export class LabeledNumberInput extends Component{

    props: Props;

    lastInitialValue: number;

    inputHandler: (evt: FormEvent<HTMLInputElement>) => void;

    constructor(props: Props){
        super(props);

        this.lastInitialValue = props.initialValue
    }

    render(): ReactNode {
        const labelParams: { title?: string } = {};
        if(this.props.title){
            labelParams.title = this.props.title;
        } 

        return (
            <div className={styles["container"]}>

                <label {...labelParams}>{this.props.label}</label>

                <NumberInput {...this.props} />

            </div>
        )
    }

}