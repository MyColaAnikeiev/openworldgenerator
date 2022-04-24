import { filter, map, Observable, startWith, Subject } from "rxjs";
import { 
    NodeWeightPair, 
    PerlinCombine, 
    PerlinCombineWeighted } from "../../generator/perlin-combination-operators";

import { 
    PerlinBinaryFilterFactory, 
    PerlinDynamicScaleFilterFactory, 
    PerlinFilter, 
    PerlinScaleFilterFactory } from "../../generator/perlin-filter-operators";

import { PerlinNode } from "../../generator/perlin-node"
import { PerlinNoise } from "../../generator/perlin-noise";
import { NodePropUpdateChanges } from "../../generator/types";
import { getImageFromPerlinNode } from "./tools";

import { 
    CombinatorSchemaProperties, 
    FilterSchemaProperties, 
    NodeConnection, 
    NodeSchema, 
    NodeSchemaProperties, 
    NodeSchemaType,  
    SourceSchemaProperties } from "./types"



export interface NodeTreeBuilder{
    getNodeSchemas(): NodeSchema[];
    getNodeConnections(): NodeConnection[];

    addNode(type: NodeSchemaType, top: number, left: number): void;
    removeNode(id: number): void;
    updateNode(id: number, changes: NodePropUpdateChanges): void;

    addConnection(conn: NodeConnection): void;

    getPreviewStream(
        id: number, scale?:number, width?: number, height?: number)
    : Observable<ImageData>;
}

export interface NodeTreeUser{
    getNodeInstance(id: number, depth: number): PerlinNode | null;
}

export class PerlinNodeTree implements NodeTreeBuilder, NodeTreeUser {

    private nodeSchemas: NodeSchema[] = [
        {
            id: 1,
            type: 'source',
            position: { top: 70, left: 200 },
            properties: {
                size: 0.6,
                seed: 0
            }
        },
        {
            id: 3,
            type: 'source',
            position: { top: 300, left: 120 },
            properties: {
                size: 1.8,
                seed: 1
            }
        },
        {
            id: 2,
            type: 'weighted-combinator',
            position: { top: 320, left: 420 },
            properties: {
                numOfInputs: 2,
                weights: [0.6,1.0]
            }
        }
    ];

    private nodes: Map<number, PerlinNode> = new Map();
    private connections: NodeConnection[] = [
        { targetType: "default", idFrom: 1, idTo: 2, targetEntryNumber: 0},
        { targetType: "default", idFrom: 3, idTo: 2, targetEntryNumber: 1}
    ];

    // 
    public updated$: Subject<number> = new Subject();

    constructor(){
    }


    addNode(type: NodeSchemaType, top: number, left: number){
        const maxId = this.nodeSchemas.reduce(
            (max, schema) => (max < schema.id ? schema.id : max)
        ,0);

        let props: NodeSchemaProperties;
        switch (type){
            case "source":
                props = { size: 1.0, seed: 0 }
                break;
            case "combinator":
                props = { numOfInputs: 2}
                break;
            case "weighted-combinator":
                props = { numOfInputs: 2, weights: [1.0, 1.0]};
                break;
            case "filter":
                props = { filterType: "scale",  scale: 1.0 }
        }


        this.nodeSchemas.push({
            id: maxId + 1,
            type,
            position: {top, left},
            properties: props
        })

        this.updated$.next(maxId + 1);
    }

    updateNode(id: number, changes: NodePropUpdateChanges){
        const schema = this.nodeSchemas.find(schema => schema.id === id);
        const node = this.getNodeInstance(schema.id)

        if(node){
            node.updateProperties(changes);
        }

        if(schema.type === "source"){
            schema.properties = Object.assign(schema.properties, changes);
        }


        if(schema.type === "combinator" || schema.type === "weighted-combinator"){
            debugger
            const prop = schema.properties as CombinatorSchemaProperties;

            if(changes.numOfInputs !== undefined){
                let numOfInputs = changes.numOfInputs;
                numOfInputs = numOfInputs >= 2 ? numOfInputs : 2;

                if(schema.type === "weighted-combinator"){
                    if(prop.weights.length < numOfInputs){
                        for(let i = 0; i < numOfInputs - prop.numOfInputs; i++){
                            prop.weights.push(1.0);
                        }
                    }
                }
                prop.numOfInputs = numOfInputs;
            }

            if(changes.weight !== undefined){
                prop.weights[changes.weight.index] = changes.weight.value;
            }

            if(schema.type === "combinator"){
                const comb = node as PerlinCombine;
                comb.updateSources(<PerlinNode[]>this.getCombinatorInputs(schema))
            }
            if(schema.type === "weighted-combinator"){
                const comb = node as PerlinCombineWeighted;
                comb.updateSources(<NodeWeightPair[]>this.getCombinatorInputs(schema))
            }

        }
        
        this.updated$.next(id);
    }

    removeNode(id: number){
        // Remove connections if present
        this.connections = this.connections
            .filter( (con: NodeConnection) => (con.idFrom !== id && con.idTo !== id));

        const index = this.nodeSchemas.findIndex(node => node.id == id);
        this.nodeSchemas.splice(index, 1);
        this.updated$.next(id);
    }

    getNodeSchemas(): NodeSchema[]{
        return this.nodeSchemas;
    }


    addConnection(conn: NodeConnection): void{
        // Clear dublication or one that pointing to the same input
        this.connections = this.connections.filter(other => {
            return other.idTo !== conn.idTo || other.targetType !== conn.targetType
                || other.targetEntryNumber !== conn.targetEntryNumber
        })
        this.connections.push(conn);

        this.updateNode(conn.idTo, {});
    }

    getNodeConnections(): NodeConnection[]{
        return this.connections;
    } 


    /**
     * 
     * @param id `PerlinNode` id.
     * @param scale tells how much pixels (for preview) corespond to one unit of perlin map. 
     * @param width `ImageData` width.
     * @param height `ImageData` height.
     * @returns `ImageData` that is sampled from specified `PerlinNode`.
     */
    getPreviewStream(
        id: number, scale:number = 16, width: number = 180, height: number = 120)
    : Observable<ImageData>
    {

        return this.updated$.pipe(
            filter(changedId => {
                if(id === changedId){
                    return true;
                }

                const isRelated = (curId: number, depth: number = 20) => {
                    if(this.connections.some(conn => conn.idTo === curId && conn.idFrom === changedId)){
                        return true;
                    }
                    
                    return this.connections
                        .filter(conn => conn.idTo === curId)
                        .some(conn => isRelated(conn.idFrom, depth-1));
                }

                return isRelated(id);
            }),
            startWith(id),
            map(() => {
                const node = this.getNodeInstance(id);
                if(node){
                    return getImageFromPerlinNode(node, scale, width, height);
                }
                // Return blank if node can't be instantiated.
                return new ImageData(width, height);
            })
        )
    }


    /**
     * @returns `PerlinNode` instance. In not present, than try to instantiate it from schema. If not posible, returns `null`.
     */
    getNodeInstance(id: number): PerlinNode | null{
        if(this.nodes.has(id)){
            return this.nodes.get(id);
        }

        const schema = this.nodeSchemas.find(schema => schema.id === id);
        if(!schema){
            return null;
        }

        switch(schema.type){
            case "source":
                return this.instantiateSource(schema);
            case "combinator":
            case "weighted-combinator":
                return this.instantiateCombinator(schema);
            case "filter":
                return this.instantiateFilter(schema);
        }
    }
    
    private instantiateSource(schema: NodeSchema): PerlinNode{
        const props = schema.properties as SourceSchemaProperties;
        const instance = new PerlinNoise(props.size, props.seed)
        this.nodes.set(schema.id, instance);
        return instance;
    }

    private instantiateCombinator(schema: NodeSchema): PerlinNode{
        const inputs = this.getCombinatorInputs(schema);

        let instance: PerlinNode;
        if(schema.type === "combinator"){
            instance = new PerlinCombine(<PerlinNode[]>inputs);
        }else{
            instance = new PerlinCombineWeighted(<NodeWeightPair[]>inputs);
        }

        this.nodes.set(schema.id, instance);
        return instance;
    }

    private getCombinatorInputs(schema: NodeSchema): PerlinNode[] | NodeWeightPair[]{
        const props = schema.properties as CombinatorSchemaProperties;

        const sources: PerlinNode[] = [];
        const pairs: NodeWeightPair[] = [];

        this.connections.forEach(conn => {
            if(conn.targetType === "default" && conn.idTo === schema.id){
                if(schema.type == 'weighted-combinator' && conn.targetEntryNumber >= props.numOfInputs){
                    return;
                }

                const source = this.getNodeInstance(conn.idFrom);
                if(source){
                    if(schema.type === "weighted-combinator"){
                        pairs.push({
                            node: source,
                            weight: props.weights[conn.targetEntryNumber]
                        })
                    }else{
                        sources.push(source);
                    }
                }
            }
        })

        return schema.type === "combinator" ? sources : pairs;
    }

    private instantiateFilter(schema: NodeSchema){
        const inputId = this.connections.find(conn => {
            return conn.idTo === schema.id && conn.targetType === "default";
        }).idFrom;

        if(inputId === undefined){
            return null;
        }

        const source = this.getNodeInstance(inputId);
        if(!source){
            return null;
        }

        const props = schema.properties as FilterSchemaProperties;
        let instance: PerlinNode;

        switch(props.filterType){
            case "scale":
                instance = new PerlinFilter(source, PerlinScaleFilterFactory, {
                    scale: props.scale
                })
                break;
            case "dynamic-scale":
                const controlId = this.connections
                    .find(conn => conn.idTo === schema.id && conn.targetType === "scale-filter.control").idFrom
                if(controlId === undefined){
                    return null;
                }
                const control = this.getNodeInstance(controlId);
                if(!control){
                    return null;
                }
                instance = new PerlinFilter(source, PerlinDynamicScaleFilterFactory, {
                    controlNode: control
                })
                break;
            case "binary":
                instance = new PerlinFilter(source, PerlinBinaryFilterFactory, {
                    threshold: props.threshold,
                    lowerValue: props.lowerValue,
                    upperValue: props.upperValue
                })
                break;
        }

        this.nodes.set(schema.id, instance);
        return instance;
    }

}