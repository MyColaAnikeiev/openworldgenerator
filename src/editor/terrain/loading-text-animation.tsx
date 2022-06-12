import { Component, ReactNode } from "react";

type Props = {};
type State = {
    frameIndex: number
}

const textKeyFrames = [
    "Loading    ",
    "Loading .  ",
    "Loading .. ",
    "Loading ...",
    "Loading  ..",
    "Loading   .",
]

export class LoadingTextAnimation extends Component{
    props: Props;
    state: State;

    intervalId: ReturnType<typeof setInterval>;

    constructor(props: Props){
        super(props);

        this.state = { frameIndex: 0 }
    }

    componentDidMount(): void {
        this.intervalId = setInterval(() => {
            this.setState((state: State) => {
                return {frameIndex: (state.frameIndex + 1) % textKeyFrames.length }
            })
        },500)
    }

    componentWillUnmount(): void {
        clearInterval(this.intervalId);
    }

    render(): ReactNode {
        return <pre>{textKeyFrames[this.state.frameIndex]}</pre>
    }
    

}