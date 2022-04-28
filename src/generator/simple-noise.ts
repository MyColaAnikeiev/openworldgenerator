import { GeneratorNode } from "./generator-node";
import { NodeParamsUpdateChanges } from "./types";


export class SimpleNoiseGenerator implements GeneratorNode{
    /**
     * 
     * @param {number} size - number of x or y units that corresponds to
     * one cycle of frequency of 1.0 (use size to indirectly set desirable frequency).
     * @param {number} seed
     */
    constructor(private size: number, private seed: number = 0){
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

    rand(i, j): number{
        const whole = Math.sin(i*12.9898 + j*78.233 + 2408.6069*this.seed) * 43758.5453;
        const frac = whole - Math.floor(whole);
        return (frac + frac) - 1.0;
    }

    getValue(x: number, y: number): number {
        x /= this.size;
        y /= this.size;

        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const localX = x - ix;
        const localY = y - iy;

        const left = this.rand(ix,iy) * (1- localY) + this.rand(ix, iy+1)* localY;
        const right = this.rand(ix+1,iy) * (1- localY) + this.rand(ix+1, iy+1)* localY;

        return left * (1 - localX) + right * localX
    }
}

export class SimpleNoiseGenerator2 implements GeneratorNode{

    /**
     * 
     * @param {number} size - number of x or y units that corresponds to
     * one cycle of frequency of 1.0 (use size to indirectly set desirable frequency).
     * @param {number} seed
     */
    constructor(private size: number, private seed: number = 0){
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

    rand(i, j): number{
        const whole = Math.sin(i*12.9898 + j*78.233 + 2408.6069*this.seed) * 43758.5453;
        const frac = whole - Math.floor(whole);
        return (frac + frac) - 1.0;
    }

    fade(t: number){  
          return t * t *(3 - 2*t);
    }
  

    getValue(x: number, y: number): number {
        x /=  this.size;
        y /= this.size;

        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const localX = this.fade(x - ix);
        const localY = this.fade(y - iy);

        const left = this.rand(ix,iy) * (1- localY) + this.rand(ix, iy+1)* localY;
        const right = this.rand(ix+1,iy) * (1- localY) + this.rand(ix+1, iy+1)* localY;

        return left * (1 - localX) + right * localX
    }
}