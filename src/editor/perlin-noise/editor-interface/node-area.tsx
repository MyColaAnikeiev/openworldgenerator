import { Component, MouseEvent, MouseEventHandler } from "react";
import { ContextMenu, MenuEntry } from "./context.menu";
import styles from "./node-area.module.scss";
import { SourceNode } from "./source-node";
import { NodeTreeBuilder } from "../perlin-node-tree";


export class NodeArea extends Component{

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
    
    constructor(props){
        super(props);

        this.state = {
            styles: {
                nodeAreaSizes: {
                    width: "1000px",
                    height: "600px"
                }
            },
            contextMenu: {
                on: false,
                position: { top: 0, left: 0 },
                menuEntries: this.getMenuEntries()
            }
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
            > 
                <canvas 
                    width={areaSizes.width}  
                    height={areaSizes.height}  
                    className={styles['node-area-bg-canvas']}
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

            if(nodeSchema.type == 'source'){
                const menuTrigger = (evt: MouseEvent) => this.handleNodeContextClick(evt, nodeSchema.id);
                const out = (changes: {}) => { 
                    this.props.nodeTreeBuilder.updateNode(nodeSchema.id, changes);
                    this.setState({});
                }
                const preview$ = this.props.nodeTreeBuilder.getPreviewStream(nodeSchema.id);

                return (
                    <SourceNode 
                        key={nodeSchema.id.toString()} 
                        schema={nodeSchema} 
                        contextMenuTrigger={menuTrigger}
                        outputTrigger={out}
                        preview$={preview$}
                    />
                )
            }

            return null;

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


    /* Maybe cache it latter.*/
    getMenuEntries(): MenuEntry[]{

        const addSourceAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("source",top - 30 ,left - 60)
        }

        const addCombinatorAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("combinator",top - 30 ,left - 60)
        }

        const addFilterAction = (evt) => {
            const {top, left} = this.getPositionFromEvent(evt)
            this.props.nodeTreeBuilder.addNode("filter",top - 30 ,left - 60)
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
                        action: addCombinatorAction,
                        submenu: []
                    },
                    {
                        text: "Filter",
                        action: addFilterAction,
                        submenu: [
                            {
                                text: "Identity",
                                action: () => {},
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