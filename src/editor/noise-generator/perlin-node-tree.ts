import { filter, map, Observable, startWith, Subject } from "rxjs";
import { 
    NodeWeightPair, 
    NoiseCombine, 
    NoiseCombineWeighted } from "../../generator/noise-combination-operators";

import { 
    NoiseBinaryFilterFactory, 
    NoiseDynamicScaleFilterFactory, 
    NoiseFilter, 
    NoiseLimiterFilterFactory, 
    NoiseScaleFilterFactory, 
    NoiseSmoothLimiterFilterFactory} from "../../generator/noise-filter-operators";

import { GeneratorNode } from "../../generator/generator-node"
import { PerlinNoise } from "../../generator/perlin-noise";
import { NodeParamsUpdateChanges } from "../../generator/types";
import { getImageFromGeneratorNode } from "./tools";

import { 
    CombinatorSchemaProperties,  
    NodeConnection, 
    NodeSchema, 
    NodeSchemaProperties, 
    NodeSchemaSubtype, 
    NodeSchemaType,    
    SourceSchemaProperties } from "./types"



export interface NodeTreeBuilder{
    getNodeSchemas(): NodeSchema[];
    getNodeConnections(): NodeConnection[];

    addNode(type: NodeSchemaType, subtype: NodeSchemaSubtype, top: number, left: number): void;
    removeNode(id: number): void;
    updateNodeParameters(id: number, changes: NodeParamsUpdateChanges): void;

    addConnection(conn: NodeConnection): void;

    getPreviewStream(
        id: number, scale?:number, width?: number, height?: number)
    : Observable<ImageData>;
}

export interface NodeTreeUser{
    getNodeInstance(id: number, depth: number): GeneratorNode | null;
    getNodeSchemas(): NodeSchema[];
    getNodeConnections(): NodeConnection[];
}

export class GeneratorNodeTree implements NodeTreeBuilder, NodeTreeUser {

    private nodes: Map<number, GeneratorNode> = new Map();

    public updated$: Subject<number> = new Subject();

    constructor(private nodeSchemas: NodeSchema[], private connections: NodeConnection[]){
    }


    addNode(
        type: NodeSchemaType, subtype: NodeSchemaSubtype,  top: number, left: number
    ){
        const maxId = this.getMaxOfSchemaProperty("id");

        let props: NodeSchemaProperties = {};
        switch (type){
            case "source":
                // Make default seeds apear with interval of 16 
                const maxSeed = Math.ceil((this.getMaxOfSchemaProperty("seed")+1)/8)*8;
                props = { size: 1.0, seed: maxSeed }
                break;
            case "combinator":
                props = { numOfInputs: 2, weights: [1.0, 1.0]};
                break;
            case "filter":
                switch(subtype){
                    case "scale":
                        props = { scale: 1.0, add: 0.0 }
                        break;
                    case "dynamic-scale":
                        break;
                    case "binary":
                        props = { threshold: 0.6, lowerValue: 0, upperValue: 1}
                        break;
                    case "limit":
                    case "smooth-limit":
                        props = { maxValue: 1.0 , minValue: -1.0 };
                        break
                }
                break;
        }


        this.nodeSchemas.push({
            id: maxId + 1,
            type,
            subtype,
            position: {top, left},
            properties: props
        })

        this.updated$.next(maxId + 1);
    }

    updateNodeParameters(id: number, changes: NodeParamsUpdateChanges){
        const schema = this.nodeSchemas.find(schema => schema.id === id);
        const node = this.getNodeInstance(id);

        if(node){
            node.updateParameters(changes);
        }

        /* Just copy */
        if(schema){
            schema.properties = Object.assign(schema.properties, changes);
        }

        /* Special cases */
        if(schema.subtype === "weighted-combinator"){

            if(changes.numOfInputs !== undefined){
                const prop = schema.properties;
                const numOfInputs = changes.numOfInputs;

                while(prop.weights.length < numOfInputs){
                    prop.weights.push(1.0);
                }
            }

            if(changes.weight !== undefined){
                if(schema.properties.weights.length > changes.weight.index){
                    schema.properties.weights[changes.weight.index] = changes.weight.value;
                }
            }
        }

        // May need to rebuild
        if(changes.numOfInputs !== undefined){
            // Clear unfited connections
            this.connections = this.connections.filter(conn => {
                return conn.idTo !== schema.id || conn.targetEntryNumber < changes.numOfInputs;
            })
            this.updateNodeConnections(id);
        }

        this.updated$.next(id);
    }

    updateNodeConnections(id: number){
        const schema = this.nodeSchemas.find(schema => schema.id === id);

        this.nodes.delete(id);
        this.getNodeInstance(id);

        this.connections.filter(conn => conn.idFrom === id)
            .forEach(conn => this.updateNodeConnections(conn.idTo));
    }

    getMaxOfSchemaProperty(prop: "id" | "seed"): number{
        switch(prop){
            case "id":
                return this.nodeSchemas.reduce(
                    (max, schema) => (max < schema.id ? schema.id : max)
                ,0);
            case "seed":
                return this.nodeSchemas
                    .map(schema => schema.properties.seed !== undefined ? schema.properties.seed : 0)
                    .reduce( (prev, seed) => seed > prev ? seed : prev
                    ,0);
        }
    }

    removeNode(id: number){
        const outConnections = this.connections.filter(conn => conn.idFrom === id);
        // Remove connections if present
        this.connections = this.connections
            .filter( (con: NodeConnection) => (con.idFrom !== id && con.idTo !== id));

        const index = this.nodeSchemas.findIndex(node => node.id == id);
        this.nodeSchemas.splice(index, 1);
        this.nodes.delete(id);

        outConnections.forEach((conn) => {
            this.updateNodeConnections(conn.idTo);
            this.updated$.next(conn.idTo);
        });
        this.updated$.next(id);
    }

    getNodeSchemas(): NodeSchema[]{
        return this.nodeSchemas;
    }


    addConnection(conn: NodeConnection): void{
        if(!this.checkConnectionForLoop(conn)){
            // Clear dublication or one that pointing to the same input
            this.connections = this.connections.filter(other => {
                return other.idTo !== conn.idTo || other.targetType !== conn.targetType
                    || other.targetEntryNumber !== conn.targetEntryNumber
            })

            this.connections.push(conn);
            this.updateNodeConnections(conn.idTo);
            this.updated$.next(conn.idTo);
        }
    }

    /**
     * @returns - returns `true` if connection causes loops. 
     */
    checkConnectionForLoop(connection: NodeConnection): boolean{
        const visited: boolean[] = this.connections.map(() => false);

        const checkForLoop = (curr: NodeConnection): boolean => {
            const curIndex = this.connections.findIndex(conn => conn === curr);
            if(curIndex !== undefined && visited[curIndex]){
                return false;
            }
            if(curr.idFrom === connection.idTo){
                return true;
            }
            if(curIndex !== undefined){
                visited[curIndex] = true;
            }

            return this.connections.filter(conn => conn.idTo === curr.idFrom)
                .some(checkForLoop);
        }

        return checkForLoop(connection);
    }


    getNodeConnections(): NodeConnection[]{
        return this.connections;
    } 


    /**
     * 
     * @param id `GeneratorNode` id.
     * @param scale tells how much pixels (for preview) corespond to one unit of perlin map. 
     * @param width `ImageData` width.
     * @param height `ImageData` height.
     * @returns `ImageData` that is sampled from specified `GeneratorNode`.
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
                    return getImageFromGeneratorNode(node, scale, width, height);
                }
                // Return blank if node can't be instantiated.
                return new ImageData(width, height);
            })
        )
    }


    /**
     * @returns `GeneratorNode` instance. In not present, than try to instantiate it from schema. If not posible, returns `null`.
     */
    getNodeInstance(id: number): GeneratorNode | null{
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
    
    private instantiateSource(schema: NodeSchema): GeneratorNode{
        const props = schema.properties as SourceSchemaProperties;
        const instance = new PerlinNoise(props.size, props.seed)
        this.nodes.set(schema.id, instance);
        return instance;
    }

    private instantiateCombinator(schema: NodeSchema): GeneratorNode{
        const inputs = this.getCombinatorInputs(schema);

        let instance: GeneratorNode;
        if(schema.subtype === "combinator"){
            instance = new NoiseCombine(<GeneratorNode[]>inputs);
        }else{
            instance = new NoiseCombineWeighted(<NodeWeightPair[]>inputs);
        }

        this.nodes.set(schema.id, instance);
        return instance;
    }

    private getCombinatorInputs(schema: NodeSchema): GeneratorNode[] | NodeWeightPair[]{
        const props = schema.properties as CombinatorSchemaProperties;

        const sources: GeneratorNode[] = [];
        let pairs: NodeWeightPair[];
        if(props.weights){
            pairs = props.weights.map(w => ({ node: null, weight: w }));
        }

        this.connections
            .filter(conn => conn.targetType === "default" && conn.idTo === schema.id)
            .forEach(conn => {
                const source = this.getNodeInstance(conn.idFrom);
                if(source){
                    if(schema.subtype === "weighted-combinator"){
                        pairs[conn.targetEntryNumber].node = source;
                    }else{
                        sources.push(source);
                    }
                }
        })

        return schema.subtype === "combinator" ? sources : pairs;
    }

    private instantiateFilter(schema: NodeSchema){
        const inputId = this.connections.find(conn => {
            return conn.idTo === schema.id && conn.targetType === "default";
        })?.idFrom;

        if(inputId === undefined){
            return null;
        }

        const source = this.getNodeInstance(inputId);
        if(!source){
            return null;
        }

        const props = schema.properties
        let instance: GeneratorNode;

        switch(schema.subtype){
            case "scale":
                instance = new NoiseFilter(source, NoiseScaleFilterFactory, {
                    scale: props.scale,
                    add: props.add
                })
                break;
            case "dynamic-scale":
                const controlId = this.connections
                    .find(conn => conn.idTo === schema.id && conn.targetType === "scale-filter.control")?.idFrom
                if(controlId === undefined){
                    return null;
                }
                const control = this.getNodeInstance(controlId);
                if(!control){
                    return null;
                }
                instance = new NoiseFilter(source, NoiseDynamicScaleFilterFactory, {
                    controlNode: control
                })
                break;
            case "binary":
                instance = new NoiseFilter(source, NoiseBinaryFilterFactory, {
                    threshold: props.threshold,
                    lowerValue: props.lowerValue,
                    upperValue: props.upperValue
                })
                break;
            case "limit":
                instance = new NoiseFilter(source,NoiseLimiterFilterFactory, {
                    maxValue: props.maxValue,
                    minValue: props.minValue
                })
                break;
            case "smooth-limit":
                instance = new NoiseFilter(source,NoiseSmoothLimiterFilterFactory, {
                    maxValue: props.maxValue,
                    minValue: props.minValue
                })
                break;
        }

        this.nodes.set(schema.id, instance);
        return instance;
    }

}