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
    updateNode(id: number, changes: {}): void;

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
                size: 1,
                seed: 0
            }
        }
    ];

    private nodes: Map<number, PerlinNode> = new Map();
    private connections: NodeConnection[] = [];

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
                props = { weighted: false}
                break;
            case "weighted-combinator":
                props = { weighted: true , weights: [1.0, 1.0]};
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

    updateNode(id: number, changes: {}){
        const node = this.nodeSchemas.find( node => node.id === id );
        if(node){
            node.properties = Object.assign(node.properties, changes);
        }

        // Tmp
        const instance = this.getNodeInstance(id) as PerlinNoise;
        if(instance){
            instance.updateProperties(changes);
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
        const props = schema.properties as CombinatorSchemaProperties;

        const sources: PerlinNode[] = [];
        const pairs: NodeWeightPair[] = [];

        this.connections.forEach(conn => {
            if(conn.targetType === "default" && conn.idTo === schema.id){
                const source = this.getNodeInstance(conn.idFrom);
                if(source){
                    if(props.weighted){
                        const weightInd = pairs.length;
                        pairs.push({
                            node: source,
                            weight: props.weights[weightInd]
                        })
                    }else{
                        sources.push(source);
                    }
                }
            }
        })

        let instance: PerlinNode;
        if(props.weighted){
            instance = new PerlinCombineWeighted(pairs);
        }else{
            instance = new PerlinCombine(sources);
        }

        this.nodes.set(schema.id, instance);
        return instance;
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