import { Component, MouseEvent } from "react"
import { delay, Observable, Subject, takeUntil } from "rxjs";
import { NodePropUpdateChanges } from "../../../generator/types";
import { NodeSchema, SourceSchemaProperties } from "../types"
import { CombinatorNodeProperties } from "./combinator-node-properties";
import styles from './perlin-node.module.scss';
import { SourceNodeProperties } from "./source-node-properties";

export class PerlinNodeComponent extends Component{

    unsubscriber$: Subject<void> = new Subject();

    canvasRef: HTMLCanvasElement;
    
    props: { 
        schema: NodeSchema,
        contextMenuTrigger: (evt: MouseEvent) => void,
        outputCallback: (out: NodePropUpdateChanges) => void,
        connectionStartCallback: () => void;
        connectionEndCallback: (connType: string, connIndex: number) => void;
        preview$: Observable<ImageData>;
    }

    state: {
        drag: {
            on: boolean,
            lastX: number,
            lastY: number,
        }
    }

    constructor(props){
        super(props);

        this.state = {
            drag:  { on: false, lastX: 0, lastY: 0 }
        }

        this.props.preview$.pipe(
            delay(0),
            takeUntil(this.unsubscriber$)
        )
            .subscribe((img: ImageData) => {
                this.canvasRef.getContext('2d').putImageData(img, 0,0);
            })
    }

    render(){
        const inineStyle = {
            top: this.props.schema.position.top.toString() + 'px',
            left: this.props.schema.position.left.toString() + 'px'
        }
        const properties = this.props.schema.properties as SourceSchemaProperties;

        return (
            <div 
                key={this.props.schema.id.toString()}
                className={styles.node + ' ' + styles['source-node']}
                style={inineStyle}
                onContextMenu={(evt: MouseEvent) => evt.stopPropagation()}
            >
                <div 
                    onMouseDown={this.dragStart.bind(this)}
                    onMouseMove={this.drag.bind(this)}
                    onMouseUp={this.dragOver.bind(this)}
                    onMouseLeave={this.dragOver.bind(this)}
                    onContextMenu={this.contextMenu.bind(this)}
                >
                    <div className={styles.head}></div>
                    <div className={styles.preview}>
                            <canvas 
                                ref={ref => this.canvasRef = ref}
                                width="180" height="120"
                            ></canvas>
                    </div>
                </div>

                <div className={styles.body}>
                    
                    {this.getPropertyControls()}

                    <div 
                        className={styles.hook} 
                        onMouseDown={() => this.props.connectionStartCallback()}
                    >
                    </div>
                </div>
            </div>
        )      
    }

    getPropertyControls(){
        const {schema} = this.props;
        const {outputCallback: outputCallback} = this.props;

        switch(schema.type){
            case "source":
                return <SourceNodeProperties schema={schema} outputCallback={outputCallback}/>
            case "combinator":
            case "weighted-combinator":
                return (
                    <CombinatorNodeProperties schema={schema} 
                        outputCallback={outputCallback}
                        connectionEndCallback={this.props.connectionEndCallback}
                    />
                )
        }

    }

    handleInput(evt: InputEvent){
        const elm = evt.target as HTMLInputElement;
        this.props.outputCallback({ [elm.name] : elm.value });
    }

    contextMenu(evt: MouseEvent){
        evt.preventDefault();
        evt.stopPropagation();
        this.props.contextMenuTrigger(evt);
    }

    dragStart(evt: MouseEvent){
        if(evt.button != 0){
            return;
        }

        this.setState({
            drag: {
                on: true,
                lastX: evt.clientX,
                lastY: evt.clientY
            }
        })
    }

    drag(evt: MouseEvent){
        if(this.state.drag.on === false){
            return;
        }

        const {position} = this.props.schema;

        position.left += evt.clientX - this.state.drag.lastX;
        position.top += evt.clientY - this.state.drag.lastY;

        this.setState({
            drag: {
                on: true,
                lastX: evt.clientX,
                lastY: evt.clientY
            }
        })

    }

    dragOver(){
        this.setState({
            drag: {
                on: false,
                lastX: 0,
                lastY: 0
            }
        })
    }


    componentWillUnmount(){
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}