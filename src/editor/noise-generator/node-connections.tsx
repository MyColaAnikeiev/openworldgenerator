import { Component, MouseEvent } from "react";
import { NodeTreeBuilder } from "../../generator/node-tree-generator";
import { NodeConnection } from "../../generator/types";
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
        const ctx = this.canvasRef.getContext("2d");
        
        const sizes = this.props.styles.nodeAreaSizes;
        ctx.clearRect(0,0, parseInt(sizes.width), parseInt(sizes.height))
        ctx.strokeStyle="#ddd";
        ctx.lineWidth = 3;
        connections.forEach(conn => {
            const from = this.getNodeOutputPosition(conn.idFrom);
            const to = this.getNodeInputPosition(conn);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.bezierCurveTo(from.x+80,from.y, to.x - 80,to.y, to.x, to.y);
            ctx.stroke();
        })

        if(this.props.connectionDrag.on){
            const from = this.getNodeOutputPosition(this.props.connectionDrag.outputId);
            const to = this.getPositionFromEvent(evt);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.bezierCurveTo(from.x+80,from.y, to.left - 80,to.top, to.left, to.top);
            ctx.stroke();
        }
    }


    getNodeInputPosition(connection: NodeConnection){
        const schema = this.props.nodeTreeBuilder.getNodeSchemas()
            .find(schema => schema.id === connection.idTo);

        let x: number, y: number;

        if(schema.type === "combinator"){
            const connIndex = connection.targetEntryNumber;
            x = schema.position.left + 2;
            y = schema.position.top + 224 + connIndex * 26;
        }
        else if(schema.type === "filter"){
            x = schema.position.left; 
            y = schema.position.top + 168;

            if(schema.subtype === "dynamic-scale"){
                if(connection.targetType === "scale-filter.control"){
                    y = schema.position.top + 192;
                }
            }
        }

        if(!schema.previewOn){
            y -= 130;
        }
        return {x, y}
    }

    getNodeOutputPosition(id: number){
        const schema = this.props.nodeTreeBuilder.getNodeSchemas()
            .find(schema => schema.id === id);

        const x = schema.position.left + 170;
        let y = schema.position.top;
        switch(schema.type){
            case "source":
                y += 234;
                break;
            case "combinator":
                const weights = schema.properties.numOfInputs;
                y += 226 + weights * 26;
                break;
            case "filter":
                switch(schema.subtype){
                    case "scale":
                    case "limit":
                        y += 248;
                        break;
                    case "dynamic-scale":
                        y += 222;
                        break;
                    case "binary":
                    case "smooth-limit":
                        y += 275;
                        break
                }
                break;
        }

        if(!schema.previewOn){
            y -= 130;
        }
        return {x,y};
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