import { PerlinNode } from "../../generator/perlin-node"
import { NodeConnection, NodeSchema, NodeSchemaType } from "./types"

export class NodeTreeBuilder {
    // Builded PerlinNodes from Schema and connections
    nodes: PerlinNode[] = [];

    nodeSchemas: NodeSchema[] = [
        
        {
            id: 1,
            type: 'source',
            position: { top: 70, left: 200 },
            properties: {}
        },
        {
            id: 2,
            type: 'source',
            position: { top: 100, left: 500 },
            properties: {}
        }
        
    ];
    schemaIdToPerlinNodeIndex: Map<number, number>;
    connections: NodeConnection[] = [];

    // 
    registers: { 
        name: string,
        output:  ((node: PerlinNode) => void)
    }[] = [];

    constructor(){

    }


    updateNode(id: number){

    }

    addNode(type: NodeSchemaType, top: number, left: number){
        const maxId = this.nodeSchemas.reduce(
            (max, schema) => (max < schema.id ? schema.id : max)
        ,0);

        this.nodeSchemas.push({
            id: maxId + 1,
            type,
            position: {top, left},
            properties: {}
        })
    }

    removeNode(id: number){
        // Remove connections if present
        this.connections = this.connections
            .filter( (con: NodeConnection) => (con.idFrom !== id && con.idTo !== id));

        const index = this.nodeSchemas.findIndex(node => node.id == id);
        this.nodeSchemas.splice(index, 1);
    }

    getNodeSchemas(): NodeSchema[]{
        return this.nodeSchemas;
    }

    getNodeConnections(): NodeConnection[]{
        return this.connections;
    } 

    
    setRegistrator(nodeName: string, register: (node: PerlinNode) => void){

    }

}