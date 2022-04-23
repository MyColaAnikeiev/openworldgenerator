import { Component, MouseEvent } from "react"
import { debounceTime, delay, Observable, Subject, takeUntil } from "rxjs";
import { NodeSchema } from "../types"
import styles from './source-node.module.scss';

export class SourceNode extends Component{

    bouncer: Subject<{}> = new Subject();
    unsubscriber$: Subject<void> = new Subject();

    canvasRef: HTMLCanvasElement;
    
    props: { 
        schema: NodeSchema,
        contextMenuTrigger: (evt: MouseEvent) => void,
        outputTrigger: (out: { [key: string]: any }) => void,
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

        this.bouncer.pipe(
            debounceTime(250),
            takeUntil(this.unsubscriber$)
        ).subscribe((changes) => {
            this.props.outputTrigger(changes);
        })

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
                    
                    <div className={styles.properties}>
                        <div className={styles.row}>
                            <label>Seed</label>
                            <input
                                name="seed"
                                type="number" min="0" max="255"
                                onInput={this.handleInput.bind(this)}
                            />
                        </div>
                        <div className={styles.row}>
                            <label>Size</label>
                            <input 
                                name="size"
                                type="number" min="0.0001" step="0.1"
                                onInput={this.handleInput.bind(this)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        )      
    }

    handleInput(evt: InputEvent){
        const elm = evt.target as HTMLInputElement;
        this.props.outputTrigger({ [elm.name] : elm.value });
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