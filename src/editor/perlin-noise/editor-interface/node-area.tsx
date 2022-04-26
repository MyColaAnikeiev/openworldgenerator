import { Component, MouseEvent, MouseEventHandler } from "react";
import { ContextMenu, MenuEntry } from "./context.menu";
import styles from "./node-area.module.scss";
import { PerlinNodeComponent } from "./perlin-node";
import { NodeTreeBuilder } from "../perlin-node-tree";
import { CombinatorSchemaProperties, NodeConnection } from "../types";
import { NodeParamsUpdateChanges } from "../../../generator/types";


export class NodeArea extends Component{

    bgCanvasRef: HTMLCanvasElement;
    nodeAreaHolderRef: HTMLDivElement;

    props: {
        nodeTreeBuilder: NodeTreeBuilder
    }

    state: {
        styles: {
            nodeAreaSizes: {
                width: string,
                height: string
            }
        },
        contextMenu: {
            on: boolean,
            position: { top: number, left: number},
            menuEntries: MenuEntry[]
        }
    }

    connectionDrag = {
        on: false,
        outputId: 0
    } 
    
    constructor(props){
        super(props);

        this.state = {
            styles: {
                nodeAreaSizes: {
                    width: "1300px",
                    height: "700px"
                }
            },
            contextMenu: {
                on: false,
                position: { top: 0, left: 0 },
                menuEntries: this.getMenuEntries()
            }
        };

        setTimeout( () => {
            this.renderConnections(null);
        }, 0);
    }

    render(){
        const {nodeAreaSizes: areaSizes} = this.state.styles; 
        const nodes = this.getNodes();
        const cancelConnection = () => { this.connectionDrag.on = false };

        return (
            <div 
                className={styles['node-area']} 
                style={areaSizes}
                onMouseDown={this.handleMouseDown.bind(this)}
                onMouseMove={(evt) => this.renderConnections(evt)}
                onMouseUp={cancelConnection}
            > 
                <canvas 
                    width={areaSizes.width}  
                    height={areaSizes.height}  
                    className={styles['node-area-bg-canvas']}
                    ref={ref => this.bgCanvasRef = ref}
                ></canvas>

                <div 
                    className={styles['node-area-holder']}
                    ref={ref => this.nodeAreaHolderRef = ref}
                    onContextMenu={this.getHandlerOfContextClick()}
                >
                    {nodes}
                </div>

                <ContextMenu 
                    on={this.state.contextMenu.on} 
                    position={this.state.contextMenu.position}
                    menuEntries={this.state.contextMenu.menuEntries}
                />

            </div>
        )
    }

    private getNodes(){
        const nodeSchemas = this.props.nodeTreeBuilder.getNodeSchemas();

        return nodeSchemas.map( nodeSchema => {

            const menuTrigger = (evt: MouseEvent) => this.handleNodeContextClick(evt, nodeSchema.id);
            const out = (changes: NodeParamsUpdateChanges) => { 
                this.props.nodeTreeBuilder.updateNodeParameters(nodeSchema.id, changes);
                this.setState({});
            }
            const preview$ = this.props.nodeTreeBuilder.getPreviewStream(nodeSchema.id);
            const connectionStartCallback = () => {
                this.connectionDrag.on = true;
                this.connectionDrag.outputId = nodeSchema.id;
            }
            const connectionEndCallback = (connType: "default" | "scale-filter.control", connInd: number) => {
                if(this.connectionDrag.on){

                    this.props.nodeTreeBuilder.addConnection({
                        idFrom: this.connectionDrag.outputId,
                        idTo: nodeSchema.id,
                        targetType: connType,
                        targetEntryNumber: connInd
                    });
                    this.connectionDrag.on = false;
                }
            }

            return (
                <PerlinNodeComponent 
                    key={nodeSchema.id.toString()} 
                    schema={nodeSchema} 
                    contextMenuTrigger={menuTrigger}
                    outputCallback={out}
                    connectionStartCallback={connectionStartCallback}
                    connectionEndCallback={connectionEndCallback}
                    preview$={preview$}
                />
            )

        })
    }


    getHandlerOfContextClick(): MouseEventHandler<HTMLDivElement>{
        const context: NodeArea = this;

        return function(evt: MouseEvent): void{
            evt.preventDefault();

            context.setState({ 
                contextMenu: { 
                    on: true,
                    position: {
                        ...context.getPositionFromEvent(evt)
                    },
                    menuEntries: context.getMenuEntries()
                }
            })
        }
    }


    handleNodeContextClick(evt: MouseEvent, nodeId: number){
        evt.preventDefault();
        
        const menu: MenuEntry[] = [
            {
                text: "Remove",
                action: () => this.props.nodeTreeBuilder.removeNode(nodeId),
                submenu: []
            }
        ]

        this.setState({ 
            contextMenu: { 
                on: true,
                position: {
                    ...this.getPositionFromEvent(evt)
                },
                menuEntries: menu
            }
        })
    }


    handleMouseDown(evt: MouseEvent){
        if(this.state.contextMenu.on === false){
            return;
        }

        this.setState({
            contextMenu: {
                on: false,
                position: { top: 0, left: 0},
                menuEntries: this.state.contextMenu.menuEntries
            }
        })
    }


    /**
     * Get mouse event position relative to node-area top and left.
     */
    getPositionFromEvent(evt: MouseEvent){
        const {top: sTop, left: sLeft} = this.nodeAreaHolderRef.getBoundingClientRect();
        return {
            top: evt.clientY - sTop,
            left: evt.clientX - sLeft
        }
    }

    renderConnections(evt: MouseEvent){
        const connections = this.props.nodeTreeBuilder.getNodeConnections();
        const nodes = this.props.nodeTreeBuilder.getNodeSchemas();
        const ctx = this.bgCanvasRef.getContext("2d");

        function getOutputPosition(id){
            const scheme = nodes.find(scheme => scheme.id === id);
            const x = scheme.position.left + 170;
            let y = scheme.position.top;
            switch(scheme.type){
                case "source":
                    y += 234;
                    break;
                case "combinator":
                case "weighted-combinator":
                    const weights = (scheme.properties as CombinatorSchemaProperties ).numOfInputs;
                    y += 226 + weights * 26;
                    break;
                case "filter":
                    switch(scheme.properties.filterType){
                        case "scale":
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
            
            if(scheme.type === "combinator" || scheme.type === "weighted-combinator"){
                const props = scheme.properties as CombinatorSchemaProperties;
                const connIndex = connection.targetEntryNumber;
                const x = scheme.position.left + 2;
                const y = scheme.position.top + 224 + connIndex * 26;
                return {x,y}
            }

            if(scheme.type === "filter"){
                if(scheme.properties.filterType === "dynamic-scale"){
                    if(connection.targetType === "scale-filter.control"){
                        return {x: scheme.position.left, y: scheme.position.top + 192}
                    }
                }

                return {x: scheme.position.left, y: scheme.position.top + 168}
            }
        }
        
        const sizes = this.state.styles.nodeAreaSizes;
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

        if(this.connectionDrag.on){
            const from = getOutputPosition(this.connectionDrag.outputId);
            const to = this.getPositionFromEvent(evt);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.bezierCurveTo(from.x+80,from.y, to.left - 80,to.top, to.left, to.top);
            ctx.stroke();
        }
    }


    /* Maybe cache it latter.*/
    getMenuEntries(): MenuEntry[]{

        const addSourceAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("source", null, top - 30 ,left - 60)
        }

        const addCombinatorAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("combinator", null, top - 30 ,left - 60)
        }
        const addWeightedCombinatorAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("weighted-combinator", null, top - 30 ,left - 60)
        }

        const addScaleFilterAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("filter", "scale", top - 30 ,left - 60)
        }
        const addDynamicScaleFilterAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("filter", "dynamic-scale", top - 30 ,left - 60)
        }
        const addBinaryFilterAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("filter", "binary", top - 30 ,left - 60)
        }

        return [
            {
                text: "Add",
                action: () => {},
                submenu: [
                    {
                        text: "Source",
                        action: addSourceAction,
                        submenu: []
                    },
                    {
                        text: "Combinator",
                        action: () => {},
                        submenu: [
                            {
                                text: "Sum",
                                action: addCombinatorAction,
                                submenu: []
                            },
                            {
                                text: "Weighted sum",
                                action: addWeightedCombinatorAction,
                                submenu: []
                            }
                        ]
                    },
                    {
                        text: "Filter",
                        action: () => {},
                        submenu: [
                            {
                                text: "Scale",
                                action: addScaleFilterAction,
                                submenu: []
                            },
                            {
                                text: "DynamicScale",
                                action: addDynamicScaleFilterAction,
                                submenu: []
                            },
                            {
                                text: "Binary",
                                action: addBinaryFilterAction,
                                submenu: []
                            }
                        ]
                    }
                ] 
            },
            {
                text: "Cancel",
                action: () => {},
                submenu: []
            }
        ];
    }


    componentDidMount(){
    }

    componentWillUnmount(){
    }
}