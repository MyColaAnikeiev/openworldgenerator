/**
 * All parameters ranging from 0.0 to 1.0 
 * 
 * `color` starts from red (0.0) and goes through
 * all rainbow color all the way to red again (1.0).
 * 
 * `saturation` - ranging from 0.0 (white, black or shades of grey) to 1.0 
 * (distinct rainbow color).
 * 
 * `brigntness` - specifies max color intensity.
 */
 export type MColor = {
    color: number,
    saturation: number,
    brightness: number
}