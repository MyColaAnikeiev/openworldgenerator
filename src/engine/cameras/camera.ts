import { PerspectiveCamera } from "three";
import { Entity } from "../entities/entity";


export abstract class Camera{
    
    constructor(){}

    public abstract getCamera(): PerspectiveCamera;

    /**
     * Trigger cammera update.
     */
    abstract step(): void;
}