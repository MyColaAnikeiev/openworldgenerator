import { PerlinNode } from "../../generator/perlin-node";


export function getImageFromPerlinNode(
    node: PerlinNode, scale: number, width: number, height: number
): ImageData{
    const imgData = new ImageData(width, height);

    for(let y = 0; y < height; y++){
        for(let x = 0; x < width; x++){
            const val = node.getValue(x / scale, y / scale) * 100 + 128;

            imgData.data[(y*width*4) + x*4 + 0] = val;
            imgData.data[(y*width*4) + x*4 + 1] = val;
            imgData.data[(y*width*4) + x*4 + 2] = val;
            imgData.data[(y*width*4) + x*4 + 3] = 255;
        }
    }

    return imgData;
}