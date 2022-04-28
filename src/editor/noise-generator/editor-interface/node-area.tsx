import { Component, MouseEvent } from "react";
import { ContextMenu, MenuEntry } from "./context.menu";
import styles from "./node-area.module.scss";
import { GeneratorNodeComponent } from "./generator-node";
import { NodeTreeBuilder } from "../node-tree-generator";
import { ConnectionTargetType, NodeSchemaSubtype, NodeSchemaType } from "../types";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { NodeConnectionsComponent } from "./node-connections";


export class NodeArea extends Component{

    props: {
        nodeTreeBuilder: NodeTreeBuilder,
        selectionMode: boolean,
        selectionCallback?: (id: number) => void
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
        },
        connectionDrag:{
            on: false,
            outputId: number
        }
    }

    connectionsRenderCallback!: (evt: MouseEvent | null) => void;

    nodeAreaHolderRef: HTMLDivElement;
    

    constructor(props){
        super(props);

        this.state = {
            styles: {
                nodeAreaSizes: {
                    width: "2000px",
                    height: "2000px"
                }
            },
            contextMenu: {
                on: false,
                position: { top: 0, left: 0 },
                menuEntries: this.getMenuEntries()
            },
            connectionDrag: { on: false, outputId: 0}
        };
    }

    render(){
        const {nodeAreaSizes: areaSizes} = this.state.styles; 
        const nodes = this.getNodes();

        return (
            <div 
                className={styles['node-area']} 
                style={areaSizes}

                onMouseDown={this.handleMouseDown.bind(this)}
                onMouseMove={this.handleMousemove.bind(this)}
                onMouseUp={this.handleMouseup.bind(this)}
                onContextMenu={this.handleContextClick.bind(this)}
            >
                <NodeConnectionsComponent 
                    nodeTreeBuilder={this.props.nodeTreeBuilder}
                    styles={this.state.styles}
                    connectionDrag={this.state.connectionDrag}
                    updateCallback={(callback) => {this.connectionsRenderCallback = callback}}
                />

                <div 
                    className={styles['node-area-holder']}
                    ref={ref => this.nodeAreaHolderRef = ref}
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
            const connectionStartCallback = () => {
                this.setState({connectionDrag: {
                    on: true,
                    outputId: nodeSchema.id
                }})
            }
            const connectionEndCallback = (connType: ConnectionTargetType, connInd: number) => {
                if(this.state.connectionDrag.on){

                    this.props.nodeTreeBuilder.addConnection({
                        idFrom: this.state.connectionDrag.outputId,
                        idTo: nodeSchema.id,
                        targetType: connType,
                        targetEntryNumber: connInd
                    });
                    this.setState({ connectionDrag : { on: false, outputId: 0}});
                }
            }
            const connectionRemoveCallback = (connType: ConnectionTargetType, connInd: number) => {
                if(!this.props.selectionMode){
                    this.props.nodeTreeBuilder.removeConnection(nodeSchema.id, connType, connInd);
                }
            }

            const preview$ = this.props.nodeTreeBuilder.getPreviewStream(nodeSchema.id);
            const selectionCallback = this.getNodeSelectionCallback(nodeSchema.id);

            return (
                <GeneratorNodeComponent 
                    key={nodeSchema.id.toString()} 
                    schema={nodeSchema}
                    selectionMode={this.props.selectionMode}
                    selectionCallback={selectionCallback}
                    contextMenuTrigger={menuTrigger}
                    outputCallback={out}
                    connectionStartCallback={connectionStartCallback}
                    connectionEndCallback={connectionEndCallback}
                    connectionRemoveCallback={connectionRemoveCallback}
                    preview$={preview$}
                />
            )

        })
    }


    handleMouseDown(evt: MouseEvent){
        setTimeout( () =>  this.connectionsRenderCallback && this.connectionsRenderCallback(evt)
        ,0);

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

    handleMousemove(evt: MouseEvent){
        if(this.connectionsRenderCallback){
            this.connectionsRenderCallback(evt)     
        }
    }

    handleMouseup(evt: MouseEvent){
        if(this.state.connectionDrag.on){
            this.setState({ connectionDrag : {
                on: false, outputId: 0}
            })

            setTimeout(() => this.connectionsRenderCallback(evt), 0);
        }
    }

    handleContextClick(evt: MouseEvent): void{
        evt.preventDefault();

        if(this.props.selectionMode){
            return;
        }

        this.setState({ 
            contextMenu: { 
                on: true,
                position: {
                    ...this.getPositionFromEvent(evt)
                },
                menuEntries: this.getMenuEntries()
            }
        })
    }


    getNodeSelectionCallback(id: number){
        return () => {
            if(this.props.selectionMode && this.props.selectionCallback){
                this.props.selectionCallback(id);
            }
        }
    }

    handleNodeContextClick(evt: MouseEvent, nodeId: number){
        evt.preventDefault();

        if(this.props.selectionMode){
            return;
        }
        
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

    
    getMenuEntries(): MenuEntry[]{
        
        const nodeAdder = (type: NodeSchemaType, subtype: NodeSchemaSubtype) => {
            return (evt:MouseEvent) => {
                const {top, left} = this.getPositionFromEvent(evt)
                this.props.nodeTreeBuilder.addNode(type, subtype, top - 50 ,left - 100)
            }
        }

        return [
            {
                text: "Add",
                action: () => {},
                submenu: [
                    {
                        text: "Source",
                        action: nodeAdder("source", "perlin"),
                        submenu: []
                    },
                    {
                        text: "Combinator",
                        action: () => {},
                        submenu: [
                            {
                                text: "Sum",
                                action: nodeAdder("combinator", "combinator"),
                                submenu: []
                            },
                            {
                                text: "Weighted sum",
                                action: nodeAdder("combinator", "weighted-combinator"),
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
                                action: nodeAdder("filter", "scale"),
                                submenu: []
                            },
                            {
                                text: "DynamicScale",
                                action: nodeAdder("filter", "dynamic-scale"),
                                submenu: []
                            },
                            {
                                text: "Binary",
                                action: nodeAdder("filter", "binary"),
                                submenu: []
                            },
                            {
                                text: "Limit",
                                action: nodeAdder("filter", "limit"),
                                submenu: []
                            },
                            {
                                text: "Smooth limit",
                                action: nodeAdder("filter", "smooth-limit"),
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

}