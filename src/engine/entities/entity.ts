import { EngineUserInterface } from "../engine";
import { EngineObjects } from "../engine-objects";
import { Orientation, Position } from "../types";


export abstract class Entity{
    
    constructor(
        public readonly id: number,
        protected hostEngine: EngineUserInterface,
        protected engineObjects: EngineObjects,
        protected position: Position, 
        protected orientation: Orientation
    ){}

    public abstract move(direction: string, step: number): void;
    
    public abstract rotate(horizontaly: number, verticaly: number): void;

    public abstract getPosition(): Position;

    public abstract getOrientaion(): Orientation;

}