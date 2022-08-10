import { EngineManager } from "../../engine-manager"
import styles from "./node-editor.module.scss"
import { NodeArea } from "./node-area"
import { Component, MouseEvent } from "react"
import { identity } from "rxjs"


type Props = {
    manager: EngineManager
}
type State = {
    gapPosition: number
}


export class NodeEditor extends Component{

    props: Props;
    state: State;

    dragState: {
        on: boolean,
        lastPos: {
            x: number,
            y: number 
        }
    }

    editorContainerRef: HTMLElement;

    constructor(props: Props){
        super(props);

        this.state = {
            gapPosition: 0.3
        }

        this.dragState = {
            on: false,
            lastPos: { x:0,y:0 }
        }
    }
    

    render(){

        const setEditorContainerRef = (ref: null | HTMLElement) => {
            if(ref){
                this.editorContainerRef = ref;
            }
        }

        const setAsCanvasContainer = (ref: null | HTMLElement) => {
            if(ref){
                this.props.manager.setEngineCanvasContainer(ref);
            }
        }

        const nodeAreaProps = {
            nodeTreeBuilder: this.props.manager.getEngine().getGeneratorNodeTree(),
            selectionMode: false,
            selecrionCallback: () => {}
        }

        const canvasContainerStyle = {
            width: "calc(" + (this.state.gapPosition*100).toFixed(1) + "% - 10px)"
        }
        const nodeAreaStyle = {
            width: (100 - this.state.gapPosition*100).toFixed(1) + "%"
        }

        return (
            <div 
                onMouseMove={this.drag.bind(this)}
                onMouseUp={this.dragStop.bind(this)}
                onMouseLeave={this.dragStop.bind(this)}
                className={styles["node-editor"]} 
                ref={setEditorContainerRef}
            >
                
                <div ref={setAsCanvasContainer} className={styles["canvas-container"]} style={canvasContainerStyle}></div>

                <div onMouseDown={this.dragStart.bind(this)} className={styles["dragger"]}></div>

                <div className={styles["node-area"]} style={nodeAreaStyle}>
                    <NodeArea {...nodeAreaProps} />
                </div>

            </div>
        )
    }


    dragStart(evt: MouseEvent){
        this.dragState.on = true;
        this.dragState.lastPos = {x: evt.clientX, y: evt.clientY};
    }

    drag(evt: MouseEvent){
        if(this.dragState.on && this.editorContainerRef){
            const {left, right} = this.editorContainerRef.getBoundingClientRect();
            const width = right - left;

            const dX = evt.clientX - this.dragState.lastPos.x;
            this.dragState.lastPos = {x: evt.clientX, y: evt.clientY};

            this.setState((prevState: State) => ({ 
                gapPosition: prevState.gapPosition + dX/width
            }))
        }
    }

    dragStop(evt: MouseEvent){
        this.dragState.on = false;
    }

}