import { Component, MouseEvent, MouseEventHandler } from "react"
import { delay, Observable, Subject, takeUntil } from "rxjs";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { ConnectionTargetType, NodeSchema, SourceSchemaProperties } from "../types"
import { CombinatorNodeProperties } from "./combinator-node-properties";
import { FilterNodeProperties } from "./filter-node-properties";
import styles from './generator-node.module.scss';
import { SourceNodeProperties } from "./source-node-properties";

export class GeneratorNodeComponent extends Component{

    unsubscriber$: Subject<void> = new Subject();

    canvasRef: HTMLCanvasElement;
    
    props: { 
        schema: NodeSchema,
        selectionMode: boolean,
        contextMenuTrigger: (evt: MouseEvent) => void,
        outputCallback: (out: NodeParamsUpdateChanges) => void,
        connectionStartCallback: () => void,
        connectionEndCallback: (connType: ConnectionTargetType, connIndex: number) => void,
        connectionRemoveCallback: (connType: ConnectionTargetType, connIndex?: number) => void,
        selectionCallback: () => void,
        preview$: Observable<ImageData>
    }

    state: {
        drag: {
            on: boolean
        }
    }

    dragging = {
        lastX: 0,
        lastY: 0
    };


    constructor(props){
        super(props);

        this.state = {
            drag:  { on: false }
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
        // 
        const dragHelper = { display: this.state.drag.on ? 'block' : 'none' }

        return (
            <div 
                key={this.props.schema.id.toString()}
                className={styles.node + ' ' + styles['source-node']}
                style={inineStyle}
                onClick={this.handleNodeClick.bind(this)}
                onContextMenu={(evt: MouseEvent) => evt.stopPropagation()}
            >
                <div 
                    onMouseDown={this.handleMousedown.bind(this)}
                    onMouseMove={this.handleMousemove.bind(this)}
                    onMouseUp={this.handleMouseup.bind(this)}
                    onContextMenu={this.handleContextMenu.bind(this)}
                >
                    <div 
                        className={styles['drag-helper']} style={dragHelper}
                        onMouseLeave={this.handleMouseleve.bind(this)}
                    ></div>

                    <div className={styles.head}>
                        <span>{this.getNodeTitle()}</span>
                    </div>
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
                        onMouseDown={this.handleOutputConnectionStart.bind(this)}
                    >
                    </div>
                </div>
            </div>
        )      
    }

    getNodeTitle(): string{
        const {schema} = this.props;
        return schema.subtype;
    }

    getPropertyControls(){
        const {schema} = this.props;
        const {outputCallback} = this.props;
        const {selectionMode} = this.props; 

        switch(schema.type){
            case "source":
                return (
                    <SourceNodeProperties 
                        schema={schema} 
                        selectionMode={selectionMode} 
                        outputCallback={outputCallback}
                    />
                )
            case "combinator":
                return (
                    <CombinatorNodeProperties schema={schema} 
                        selectionMode={selectionMode}
                        outputCallback={outputCallback}
                        connectionEndCallback={this.props.connectionEndCallback}
                        connectionRemoveCallback={this.props.connectionRemoveCallback}
                    />
                )
            case "filter":
                return (
                    <FilterNodeProperties schema={schema}
                        selectionMode={selectionMode} 
                        outputCallback={outputCallback}
                        connectionEndCallback={this.props.connectionEndCallback}
                        connectionRemoveCallback={this.props.connectionRemoveCallback}
                    />
                )
        }

    }

    handleNodeClick(){
        if(this.props.selectionMode){
            this.props.selectionCallback();
        }
    }

    handleMousedown(evt: MouseEvent){
        if(this.props.selectionMode){
            return;
        }

        this.dragStart(evt);
    }
    handleMousemove(evt: MouseEvent){
        this.drag(evt);
    }
    handleMouseup(evt:MouseEvent){
        this.dragOver();
    }
    handleMouseleve(evt: MouseEvent){
        this.dragOver();
    }
    handleContextMenu(evt: MouseEvent){
        evt.preventDefault();
        evt.stopPropagation();

        if(this.props.selectionMode){
            return;
        }

        this.props.contextMenuTrigger(evt);
    }
    handleOutputConnectionStart(evt: MouseEvent){
        if(this.props.selectionMode){
            return;
        }

        this.props.connectionStartCallback();
    }


    dragStart(evt: MouseEvent){
        if(evt.button != 0){
            return;
        }

        this.dragging.lastX = evt.clientX;
        this.dragging.lastY = evt.clientY;

        /* Start dragging */
        this.setState({
            drag: {
                on: true
            }
        })
    }
    drag(evt: MouseEvent){
        if(this.state.drag.on === false){
            return;
        }

        const {position} = this.props.schema;

        position.left += evt.clientX - this.dragging.lastX;
        position.top += evt.clientY - this.dragging.lastY;

        this.dragging.lastX = evt.clientX;
        this.dragging.lastY = evt.clientY;

        this.setState({})
    }

    dragOver(){
        this.setState({
            drag: {
                on: false
            }
        })
    }


    componentWillUnmount(){
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}