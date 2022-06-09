import { Component, MouseEvent } from "react";

import styles from "./slider.module.scss"

type Props = {
    value: number,
    outputCallback: (value: number) => void
}
type State = {
    value: number,
    lastValue: number
}

/**
 * React Component that provides slider number input UI.
 * 
 * props attributes: 
 *
 *  `value`  must be in `0.0`-`1.0` range.
 * 
 *  `outputCallback` will be called when slider position change with resulting slider value.
 */
export class MSlider extends Component{

    props: Props;
    state: State;

    sliderRef: HTMLElement;
    hookSize = 16;

    mouseDownHandler: (evt: MouseEvent) => void;
    mouseMoveHandler: (evt: MouseEvent) => void;
    mouseOutHandler: (evt: MouseEvent) => void;
    preventMouseOutHandler: (evt: MouseEvent) => void;

    drag: { on: boolean, lastX: number }


    constructor(props: Props){
        super(props);

        const value = this.cropToRange(props.value,0,1);
        this.state = { 
            value,
            lastValue: value
        };

        this.drag = { on: false, lastX: 0 }

        this.mouseDownHandler = this.handleMouseDown.bind(this);
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseOutHandler = this.handleMouseOut.bind(this);
        this.preventMouseOutHandler = this.preventMouseOut.bind(this);
    }


    static getDerivedStateFromProps(props: Props, state: State){
        // Need to update state only when props change
        if(state.lastValue !== props.value){
            return {
                value: props.value,
                lastValue: props.value
            }
        }

        return null;
    }

    componentDidMount(){
        // Need to know slide width to correctly render.
        this.forceUpdate();
    }
    
    render(){
        const p = this.props;

        // Hook won't be rendered until container width will become known.
        let percent = 0.0;
        if(this.sliderRef){
            const {left, right} = this.sliderRef.getBoundingClientRect();
            const width = right - left;
            percent = 100*this.state.value;
            percent *= width/(width + this.hookSize);
        }
        
        const sliderRef = (ref: HTMLElement | null) => {
            if(ref){
                this.sliderRef = ref
            }
        }

        return (
            <div 
                className={styles["m-slider-body"]}
                onMouseMove={this.mouseMoveHandler} 
                onMouseOut={this.mouseOutHandler} 
                onMouseUp={this.mouseOutHandler}
            >
                {
                    this.drag.on &&
                    <div
                        className={styles["m-slider-bg"]}
                    ></div>
                }

                <div 
                    ref={sliderRef} 
                    onMouseOut={this.preventMouseOutHandler}
                    className={styles["m-slider-bg-mark"]}
                >
                    {
                        Boolean(this.sliderRef) &&
                        <div 
                            onMouseDown={this.mouseDownHandler} 
                            style={{left: percent.toFixed(2) + "%"}} 
                            className={styles["m-slider-hook"]}>
                        </div>
                    }
                </div>
            </div>
        )
    }

    
    handleMouseDown(evt: MouseEvent){
        this.drag.on = true;
        this.drag.lastX = evt.clientX;
    }


    triggerOutput(val: number){
        this.props.outputCallback(val);
    }

    handleMouseMove(evt: MouseEvent){
        if(this.drag.on && this.sliderRef){
            const {left, right} = this.sliderRef.getBoundingClientRect();
            // Width adjusted so hook stays inside it's container.
            const width = right - left - this.hookSize;
            // delta v should become zero when pointer is out of slider horizontal boundaries. 
            const x = this.cropToRange(evt.clientX, left, right);

            const dv = (x - this.drag.lastX) / width;
            this.drag.lastX = x;

            this.setState((state: State) => {
                const val = this.cropToRange(state.value + dv, 0,1);
                this.triggerOutput(val);
                return {value: val}
            });
        }
    }

    handleMouseOut(evt: MouseEvent){
        evt.eventPhase
        this.drag.on = false;
        this.forceUpdate();
    }

    preventMouseOut(evt: MouseEvent){
        evt.stopPropagation();
    }

    
    cropToRange(val: number, min: number, max: number): number{
        let ret = Math.max(min, val);
        ret = Math.min(max, ret);

        return ret;
    }
}