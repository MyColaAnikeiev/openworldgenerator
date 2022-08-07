import { debounce, filter, interval, map, Observable, startWith, Subject } from "rxjs";
import { 
    NodeWeightPair, 
    NoiseCombine, 
    NoiseCombineWeighted } from "./nodes/noise-combination-operators";

import { 
    NoiseBinaryFilterFactory, 
    NoiseDynamicScaleFilterFactory, 
    NoiseFilter, 
    NoiseLimiterFilterFactory, 
    NoiseScaleFilterFactory, 
    NoiseSmoothLimiterFilterFactory} from "./nodes/noise-filter-operators";

import { GeneratorNode } from "./nodes/generator-node"
import { PerlinNoise } from "./nodes/perlin-noise";
import { getImageFromGeneratorNode } from "./tools";

import { 
    CombinatorSchemaProperties,  
    ConnectionTargetType,  
    NodeConnection, 
    NodeSchema, 
    NodeSchemaProperties, 
    NodeSchemaSubtype, 
    NodeSchemaType, 
    NodeTreeSnapshot
} from "./types"
import { SimpleNoiseGenerator, SimpleNoiseGenerator2 } from "./nodes/simple-noise";
import { VoronoiGenerator } from "./nodes/voronoi-source";
import { SimplexNoise } from "./nodes/simplex-noise";
import { NodeParamsUpdateChanges } from "./nodes/types";



export interface NodeTreeBuilder{
    getNodeSchemas(): NodeSchema[];
    getNodeConnections(): NodeConnection[];
    getNodeInstance$(id: number): Observable<GeneratorNode | null>;

    addNode(type: NodeSchemaType, subtype: NodeSchemaSubtype, top: number, left: number): void;
    removeNode(id: number): void;
    updateNodeParameters(id: number, changes: NodeParamsUpdateChanges): void;

    addConnection(conn: NodeConnection): void;
    removeConnection(idTo: number, type: ConnectionTargetType, entryNumber?: number): void;

    getPreviewStream(
        id: number, scale?:number, width?: number, height?: number)
    : Observable<ImageData>;
}

export interface NodeTreeUser{
    getNodeInstance(id: number): GeneratorNode | null;
    /** 
     * Stream will emit GeneratorNode (could be the same object or `null`) when 
     * node with provided `id` could have changed.
     */
    getNodeInstance$(id: number): Observable<GeneratorNode | null>;

    getNodeSchemas(): NodeSchema[];
    
    getNodeConnections(): NodeConnection[];

    /**
     * Returns deep copy of current node and connection parameters.
     */
    getNodeTreeSnapshot(): NodeTreeSnapshot;
}

export class GeneratorNodeTree implements NodeTreeBuilder, NodeTreeUser {

    private nodeSchemas: NodeSchema[]; 
    private connections: NodeConnection[];

    private nodes: Map<number, GeneratorNode> = new Map();

    public updated$: Subject<number> = new Subject();

    constructor(private nodeTree : NodeTreeSnapshot){
        this.nodeSchemas = nodeTree.nodes;
        this.connections = nodeTree.connections;
    }   


    addNode(
        type: NodeSchemaType, subtype: NodeSchemaSubtype,  top: number, left: number
    ){
        const maxId = this.getMaxOfSchemaProperty("id");

        let props: NodeSchemaProperties = {};
        switch (type){
            case "source":
                // Make default seeds apear with interval of 8
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
            previewOn: false,
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
        // Remove Node
        const index = this.nodeSchemas.findIndex(node => node.id == id);
        this.nodeSchemas.splice(index, 1);
        this.nodes.delete(id);

        this.updated$.next(id);

        outConnections.forEach((conn) => {
            this.updateNodeConnections(conn.idTo);
            this.updated$.next(conn.idTo);  
        });
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

    removeConnection(idTo: number, type: ConnectionTargetType, entryNumber?: number){
        this.connections = this.connections.filter(conn => { 
            return conn.idTo !== idTo || conn.targetType !== type 
            || ( entryNumber !== undefined && conn.targetEntryNumber !== entryNumber )
        })

        this.updateNodeConnections(idTo);
        this.updated$.next(idTo);
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
     * Returns deep copy of current node and connection parameters.
     */
    getNodeTreeSnapshot(): NodeTreeSnapshot {
        return {
            nodes: this.nodeSchemas.map(node => ({...node})),
            connections: this.connections.map(conn => ({...conn}))
        }    
    }


    /**
     * @id that will be emited every time when node with that id is changed.
     */
    getUpdateStream$(id: number): Observable<number>{
        return this.updated$.pipe(
            filter((changedId) => {
                if(id === changedId){
                    return true;
                }

                const isRelated = (curId: number, depth: number = 20) => {
                    if(depth <= 0){
                        return false;
                    }

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
            map(() => id)
        )
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
        
        // Time it took to generate previous preview image.
        let generationTime = 0;

        return this.getUpdateStream$(id).pipe(
            // The node that you are curently editing is more likely to be
            // updated first.
            debounce( () => {
                return interval(generationTime);
            }),
            map(() => {
                const node = this.getNodeInstance(id);
                if(node){
                    const beg = Date.now();
                    const image = getImageFromGeneratorNode(node, scale, width, height);
                    const end = Date.now();
                    generationTime = (end - beg) * 1.35;
                    return image;
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
        const props = schema.properties;
        let instance: GeneratorNode;

        switch(schema.subtype){
            case "perlin":
                instance = new PerlinNoise(props.size, props.seed)
                break;
            case "simplex":
                instance = new SimplexNoise(props.size, props.seed)
                break;
            case "simple-noise":
                instance = new SimpleNoiseGenerator(props.size, props.seed);
                break;
            case "simple-noise2":
                instance = new SimpleNoiseGenerator2(props.size, props.seed);
                break;
            case "voronoi":
                instance = new VoronoiGenerator(props.size, props.seed);
                break;
            case "cellular":
                instance = new VoronoiGenerator(props.size, props.seed, true);
                break;
        }
        this.nodes.set(schema.id, instance);
        return instance;
    }


    /**
     * Will emit node instance (it could be the same class instance) on every change.  
     */
    getNodeInstance$(id: number): Observable<GeneratorNode | null>{
        return this.getUpdateStream$(id).pipe(
            map(id => {
                return this.getNodeInstance(id);
            })
        )
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

    /**
     * To avoid any potential memoty leaks.
     */
    public dispose(){
        this.updated$.complete();
    }
}