import { EngineUserInterface } from "../../engine";
import { EngineObjects } from "../engine-objects";
import { TerrainManager } from "../../terrain-manager";
import { Orientation, PlanePosition, Position } from "../../types";
import { Entity } from "./entity";


export class OrbitalViewEntity extends Entity{
    private movementSpeed = 0.01
    private rotationSpeed = 0.002

    private distance = 5
    private minViewHeight = 0.6
    private viewHeight: number

    private terrainManager: TerrainManager;
    
    constructor(id: number, hostEngine: EngineUserInterface, engineObjects: EngineObjects, pos: PlanePosition, orientaion: Orientation){
        super(id, hostEngine, engineObjects, {...pos, height: 0.6}, orientaion)

        this.terrainManager = hostEngine.getTerrainManager()
        this.viewHeight = this.minViewHeight
        this.position.height = this.viewHeight + this.terrainManager.getHeight(this.position)
    }

    /**
     * @param direction
     * @param step
     */
    public move(direction: string, step: number){
        const movementSpeed = 0.25

        switch(direction){
            case 'forward':
                this.distance = Math.max(0, this.distance - movementSpeed)
                break
            case 'beckward':
                this.distance += movementSpeed
                break
            case 'up':
                this.viewHeight += movementSpeed
                break
            case 'down':
                this.viewHeight = Math.max(0.5, this.viewHeight - movementSpeed)
                break
        }

        this.position.height = this.viewHeight + this.terrainManager.getHeight(this.position);

    }

    public rotate(horizontaly: number, verticaly: number){
        this.orientation.horizontal += horizontaly * this.rotationSpeed;
        this.orientation.vertical += verticaly * this.rotationSpeed;
    }

    public getPosition(): Position{
        const pos = this.position
        const distance = Math.cos(this.orientation.vertical) * this.distance
        const shiftHeight = -Math.sin(this.orientation.vertical) * this.distance
        const shiftX = distance * Math.sin(this.orientation.horizontal)
        const shiftY = distance * Math.cos(this.orientation.horizontal)
        const cameraPos = {
            x: pos.x + shiftX,
            y: pos.y + shiftY
        }
        const cameraHeight = this.terrainManager.getHeight(cameraPos) + shiftHeight

        return {
            ...cameraPos,
            height: Math.max(pos.height, cameraHeight)
        }
    }

    public getOrientaion(): Orientation{
        return this.orientation;
    }

}