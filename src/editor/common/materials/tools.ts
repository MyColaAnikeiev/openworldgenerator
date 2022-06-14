import { MColor } from "./types";


/**
 * Checks if `hex` is a string is in format #XXXXXX where X is hexadecimal number.
 */
export function isValidHexColor(hex: string): boolean{
    if(hex.length != 7 || hex[0] !== "#"){
        return false;
    }

    return hex.slice(1).split("").every(ch => !isNaN(parseInt(ch,16)));
}

/**
 * 
 * @param hex is an string in format #XXXXXX where X is hexadecimal number.
 * @returns array with rgb value where each value is in 0-255 range.
 */
function fromHexToRgb(hex: string): [number,number,number]{
    const r = hex.slice(1,3);
    const g = hex.slice(3,5);
    const b = hex.slice(5,7);
    return [parseInt(r,16), parseInt(g,16), parseInt(b,16)];
}

/**
 * Takes `hex` and converts it to `MColor` parameters.
 * 
 * @param hex is an string in format #XXXXXX where X is hexadecimal number.
 */
export function convertFromHexToMColor(hex: string): MColor{
    const rgb = fromHexToRgb(hex);
    
    const brightness = Math.max(...rgb) / 255;
    const saturation = 1 - (Math.min(...rgb) / 255);
    
    // In order to extract color information (without brightness and saturation) in form
    // of single number in range 0.0-1.0 a model with 3 equaly distantiated points on
    // unit circle was used. This unit circle is placed in 2D plane at coordinates (0, 0) and
    // first point is placed at (1, 0) is corresponding to Red color and next one 
    // correspondind to green is derived by rotating first point on unit cicle counterclockwise 
    // by 120 degrees and so on. Then by using RGB value, center of mass could be calculated.
    // Then what is left is to normalize center of mass vector so angle between red point and
    // center of mass will be proportional to our desired color parameter.
    let vector = [0,0];
    const third = Math.PI * 2 / 3;
    for(let i = 0; i < 3; i++){
        vector[0] += Math.cos(third*i) * rgb[i];
        vector[1] += Math.sin(third*i) * rgb[i];
    }

    const vecLenght = Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1]);
    if(vecLenght < 1){
        return {color: 0, saturation, brightness}
    }

    const normVec = vector.map(i => i / vecLenght);
    
    const acos = Math.acos(normVec[0]);
    const asin = Math.asin(normVec[1]);
    let radians = acos;

    if(asin < 0){
        radians = 2*Math.PI - acos;
    }

    const color = radians / (2*Math.PI);
    return {color, saturation, brightness};
}

/**
 * Converts `MColor` parameters to css hex color string (in format #XXXXXX where 'X' is hexadecimal number). 
 */
export function fromMColorParamsToHex(color: MColor): string{
    const v = color.color * 6;
    // Shift v which is number in range 0.0-6.0 in such a way that coresponting
    // color center will end up at position 2.0 in numberline.
    const subV = [2, 0, -2].map(d => (v + d)%6);
    const rgb = subV.map(arg => {
        // When distance from color position in numberline is less then 1 then
        // intensity koeficient is equal 1, then when distance from color position
        // is 1 and greater, intensity fades lineary to zero at distance 2.0
        const distance = (2 - Math.abs(arg - 2));
        let koef = Math.max(0, distance);
        koef = Math.min(1, koef);

        koef = (1-color.saturation) + color.saturation * koef;
        koef = koef * color.brightness;

        return Math.round(koef * 255);
    })

    return "#" + rgb.map(num => {
        const s = num.toString(16);
        return s.length === 2 ? s : '0' + s
    }).join("");
}


export function convertNumberColorToHex(col: number): string{
    const right = col.toString(16);
    const left = "#000000";
    return left.slice(0, 9 - right.length) + right;
}