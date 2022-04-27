import { Component, MouseEvent } from "react";
import { ContextMenu, MenuEntry } from "./context.menu";
import styles from "./node-area.module.scss";
import { PerlinNodeComponent } from "./perlin-node";
import { NodeTreeBuilder } from "../perlin-node-tree";
import { NodeSchemaSubtype, NodeSchemaType } from "../types";
import { NodeParamsUpdateChanges } from "../../../generator/types";
import { NodeConnectionsComponent } from "./node-connections";


export class NodeArea extends Component{

    props: {
        nodeTreeBuilder: NodeTreeBuilder,
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
            const connectionEndCallback = (connType: "default" | "scale-filter.control", connInd: number) => {
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

            const preview$ = this.props.nodeTreeBuilder.getPreviewStream(nodeSchema.id);

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
        this.setState({ connectionDrag : {
            on: false, outputId: 0}
        })
    }

    handleContextClick(evt: MouseEvent): void{
        evt.preventDefault();

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