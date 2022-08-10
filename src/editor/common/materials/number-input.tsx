import { Component, FormEvent, ReactNode } from "react";

type Props = {
    min?: number,
    max?: number,
    step?: number,
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

export class NumberInput extends Component{

    props: Props;
    state: State;

    lastInitialValue: number;

    inputHandler: (evt: FormEvent<HTMLInputElement>) => void;

    constructor(props: Props){
        super(props);

        this.lastInitialValue = props.initialValue
        this.state = {
            inputValue: props.initialValue ?? props.min ?? 0
        }

        this.inputHandler = this.handleInput.bind(this);
    }

    componentDidUpdate(prevProps: Readonly<Props>): void {
        if(this.props.initialValue !== this.lastInitialValue){
            this.lastInitialValue = this.props.initialValue
            this.setState({inputValue: this.props.initialValue})
        }
    }

    render(): ReactNode {
        const params: InputParams = {};
        ["min","max","step"].forEach(prm =>{
            if(prm in this.props){
                params[prm] = this.props[prm];
            }
        })

        return <input 
            onInput={this.inputHandler}
            value={this.state.inputValue} 
            type="number" 
            {...params} />
    }

    handleInput(evt: FormEvent<HTMLInputElement>): void{
        const value = Number((evt.target as HTMLInputElement).value);

        if(isFinite(value)){
            this.props.inputCallbeck(value)
            this.setState({inputValue: value});
        }
    }

}