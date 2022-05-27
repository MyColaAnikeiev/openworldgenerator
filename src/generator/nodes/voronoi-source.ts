import { GeneratorNode } from "./generator-node";
import { NodeParamsUpdateChanges } from "./types";

export class VoronoiGenerator implements GeneratorNode{
    /**
     * 
     * @param {number} size - number of x or y units that corresponds to
     * one cycle of frequency of 1.0 (use size to indirectly set desirable frequency).
     * @param {number} seed
     * @param {boolean} cellular use fade function to made it look more like body cell. 
     */
    constructor(private size: number, private seed: number = 0, private cellular: boolean = false){
        this.seed = Math.abs( Math.floor(seed) );
    }

    updateParameters(params: NodeParamsUpdateChanges){
        if('size' in params){
        this.size = params.size;
        }
        if('seed' in params){
        this.seed = params.seed;
        }
    }

    rand(i, j): {x: number,y: number} {
        const xw = Math.sin(i*127.1 + j*311.7 + 2408.6069*this.seed) * 4378.5453;
        const x = xw - Math.floor(xw);
        const yw = Math.sin(i*269.5 + j*183.3 + 2408.6069*this.seed) * 4758.5453;
        const y = yw - Math.floor(yw);

        return {x, y};
    }

    fade(t: number){  
        return t * t *(3 - 2*t);
    }

    getValue(x: number, y: number): number {
        const normalizeCoef = 2 / Math.sqrt(2);

        x /= this.size;
        y /= this.size;

        const ix = Math.floor(x);
        const iy = Math.floor(y);
        let localX = (x - ix);
        let localY = (y - iy);
        if(this.cellular){
            localX = this.fade(localX);
            localY = this.fade(localY);
        }

        let minDistance = 2.0;
        for(let j = -1; j <= 1; j++){
            for(let i = -1; i <= 1; i++){
                const voronoy = this.rand(i+ix,j+iy);
                const dX = i + voronoy.x - localX;
                const dY = j + voronoy.y - localY;
                const dist = Math.sqrt(dX*dX + dY*dY);
                if(minDistance > dist){
                    minDistance = dist;
                }
            }
        }

        return minDistance / normalizeCoef - 1.0;
    }
}
