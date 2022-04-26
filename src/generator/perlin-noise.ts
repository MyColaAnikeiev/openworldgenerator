import { NodeParamsUpdateChanges } from "./types";
import { PerlinNode } from "./perlin-node";

const permutation = [151,160,137,91,90,15,                 // Hash lookup table as defined by Ken Perlin.  This is a randomly
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,    // arranged array of all numbers from 0-255 inclusive.
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];

export class PerlinNoise implements PerlinNode{
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

    /**
     * @returns perlin value for provided x and y map position.
     */
    getValue(x: number,y: number){
        // Scale it 
        x /= this.size;
        y /= this.size;

        // After 255 it will repeat
        let xi = Math.floor(x) % 256;
        let yi = Math.floor(y) % 256;
        // Third demention is used for 
        let zi = Math.floor(this.seed) % 256;

        // Needed to support negative values of x and y
        if(xi < 0)
          xi = 256 + xi;
        if(yi < 0)
          yi = 256 + yi;
    
        let xf = x % 1.0;
        let yf = y % 1.0;
        if (xf < 0)
          xf = 1 + xf;
        if (yf < 0)
          yf = 1 + yf;
    
    
        const u = this.fade(xf);
        const v = this.fade(yf);
    
        const p = permutation;
        const aaa = p[(p[(p[xi] + yi) % 256] + zi) %256];
        const aba = p[(p[(p[xi] + yi+1) % 256] + zi) %256];
        const baa = p[(p[(p[(xi+1)%256] + yi)%256] + zi) %256];
        const bba = p[(p[(p[(xi+1)%256] + yi+1)%256] + zi) %256];
    
        const a1 = this.interp(this.grad(aaa, xf, yf), this.grad(baa, xf-1, yf), u);
        const a2 = this.interp(this.grad(aba, xf, yf-1), this.grad(bba, xf-1, yf-1), u);
    
        return this.interp(a1, a2, v);
    }


    private grad(hash: number, x: number, y: number)
      {
        const z = 0.0;
    
        switch(hash & 0xF)
        {
            case 0x0: return  x + y;
            case 0x1: return -x + y;
            case 0x2: return  x - y;
            case 0x3: return -x - y;
            case 0x4: return  x + z;
            case 0x5: return -x + z;
            case 0x6: return  x - z;
            case 0x7: return -x - z;
            case 0x8: return  y + z;
            case 0x9: return -y + z;
            case 0xA: return  y - z;
            case 0xB: return -y - z;
            case 0xC: return  y + x;
            case 0xD: return -y + z;
            case 0xE: return  y - x;
            case 0xF: return -y - z;
            default: return 0;
        }
    }

    // Linear interpolation
    private interp(a: number,b: number, w: number){
      return a + w*(b - a);
    }

    private fade(t: number){
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

}