import { Component, MouseEvent } from "react";
import { NodeTreeBuilder } from "../node-tree-generator";
import { NodeConnection } from "../types";
import styles from "./node-connections.module.scss";


export class NodeConnectionsComponent extends Component{

    props : {
        nodeTreeBuilder: NodeTreeBuilder,
        styles: {
            nodeAreaSizes: {
                width: string
                height: string
            }
        },
        connectionDrag: {
            on: boolean,
            outputId: number
        },
        updateCallback: (callback: (evt: MouseEvent | null) => void) => void;
    }

    canvasRef: HTMLCanvasElement;

    constructor(props){
        super(props);

        this.props.updateCallback((evt) => this.renderConnections(evt));
    }

    componentDidMount(){
        this.renderConnections();
    }

    render(){
        const {nodeAreaSizes: areaSizes} = this.props.styles;

        return (
            <canvas
                width={areaSizes.width}  
                height={areaSizes.height}  
                className={styles['node-area-bg-canvas']}
                ref={ref => this.canvasRef = ref}
            ></canvas>
        )
    }


    renderConnections(evt?: MouseEvent){
        const connections = this.props.nodeTreeBuilder.getNodeConnections();
        const nodes = this.props.nodeTreeBuilder.getNodeSchemas();
        const ctx = this.canvasRef.getContext("2d");

        function getOutputPosition(id){
            const scheme = nodes.find(scheme => scheme.id === id);
            const x = scheme.position.left + 170;
            let y = scheme.position.top;
            switch(scheme.type){
                case "source":
                    y += 234;
                    break;
                case "combinator":
                    const weights = scheme.properties.numOfInputs;
                    y += 226 + weights * 26;
                    break;
                case "filter":
                    switch(scheme.subtype){
                        case "scale":
                        case "limit":
                        case "smooth-limit":
                            y += 248;
                            break;
                        case "dynamic-scale":
                            y += 222;
                            break;
                        case "binary":
                            y += 275;
                            break
                    }
                    break;
            }

            return {x,y};
        }

        function getInputPosition(connection: NodeConnection){
            const scheme = nodes.find(scheme => scheme.id === connection.idTo);

            if(scheme.type === "combinator"){
                const connIndex = connection.targetEntryNumber;
                const x = scheme.position.left + 2;
                const y = scheme.position.top + 224 + connIndex * 26;
                return {x,y}
            }

            if(scheme.type === "filter"){
                if(scheme.subtype === "dynamic-scale"){
                    if(connection.targetType === "scale-filter.control"){
                        return {x: scheme.position.left, y: scheme.position.top + 192}
                    }
                }

                return {x: scheme.position.left, y: scheme.position.top + 168}
            }
        }
        
        const sizes = this.props.styles.nodeAreaSizes;
        ctx.clearRect(0,0, parseInt(sizes.width), parseInt(sizes.height))
        ctx.strokeStyle="#ddd";
        ctx.lineWidth = 3;
        connections.forEach(conn => {
            const from = getOutputPosition(conn.idFrom);
            const to = getInputPosition(conn);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.bezierCurveTo(from.x+80,from.y, to.x - 80,to.y, to.x, to.y);
            ctx.stroke();
        })

        if(this.props.connectionDrag.on){
            const from = getOutputPosition(this.props.connectionDrag.outputId);
            const to = this.getPositionFromEvent(evt);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.bezierCurveTo(from.x+80,from.y, to.left - 80,to.top, to.left, to.top);
            ctx.stroke();
        }
    }


    /**
     * Get mouse event position relative to canvas element top and left.
     * Canvas element and node-area should be aligned.
     */
     getPositionFromEvent(evt: MouseEvent){
        const {top: sTop, left: sLeft} = this.canvasRef.getBoundingClientRect();
        return {
            top: evt.clientY - sTop,
            left: evt.clientX - sLeft
        }
    }
}