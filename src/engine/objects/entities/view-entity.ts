import { EngineUserInterface } from "../../engine";
import { EngineObjects } from "../engine-objects";
import { Orientation, PlanePosition, Position } from "../../types";
import { Entity } from "./entity";


export class ViewEntity extends Entity{

    private movementSpeed = 0.01;
    private rotationSpeed = 0.002;

    private viewHeight = 0.0;

    private altitudeHysteresisDynamic = 0.0
    private lastTerrainHeight: number
    
    constructor(id: number, hostEngine: EngineUserInterface, engineObjects: EngineObjects, pos: PlanePosition, orientaion: Orientation){
        const height = 0.0;
        super(id, hostEngine, engineObjects, {...pos, height}, orientaion);

        this.lastTerrainHeight = this.hostEngine.getTerrainManager().getHeight(this.position)
    }

    /**
     * @param direction
     * @param step
     */
    public move(direction: string, step: number){
        const change = this.movementSpeed * step;

        switch(direction){
            case 'forward':
                this.position.y -= change * Math.cos(this.orientation.horizontal);
                this.position.x -= change * Math.sin(this.orientation.horizontal);
                break
            case 'beckward':
                this.position.y += change * Math.cos(this.orientation.horizontal);
                this.position.x += change * Math.sin(this.orientation.horizontal);
                break
            case 'left':
                this.position.x -= change * Math.cos(this.orientation.horizontal);
                this.position.y += change * Math.sin(this.orientation.horizontal);
                break;
            case 'right':
                this.position.x += change * Math.cos(this.orientation.horizontal);
                this.position.y -= change * Math.sin(this.orientation.horizontal);
                break;
            case 'up':
                this.viewHeight += change; 
                break;
            case 'down':
                this.viewHeight = Math.max(0, this.viewHeight - change) 
                break;
        }

        const currentTerrainHeight = this.hostEngine.getTerrainManager().getHeight(this.position)
        // Make camera up and down movement more smooth
        const altitudeDiff = currentTerrainHeight - this.lastTerrainHeight
        this.lastTerrainHeight = currentTerrainHeight
        this.altitudeHysteresisDynamic -= altitudeDiff
        const rateOfReturn = this.altitudeHysteresisDynamic * 0.01 
        const rateOfReturnLimit = Math.abs(rateOfReturn) > 0.05 ? 0.05*Math.sign(rateOfReturn) : rateOfReturn
        this.altitudeHysteresisDynamic -= rateOfReturnLimit
        const relativeAltitude = Math.max(0.4, this.viewHeight  + this.altitudeHysteresisDynamic)

        this.position.height = relativeAltitude + currentTerrainHeight
    }

    public rotate(horizontaly: number, verticaly: number){
        this.orientation.horizontal += horizontaly * this.rotationSpeed;
        this.orientation.vertical += verticaly * this.rotationSpeed;
    }

    public getPosition(): Position{
        return this.position;
    }

    public getOrientaion(): Orientation{
        return this.orientation;
    }

}