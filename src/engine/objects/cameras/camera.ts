import { PerspectiveCamera } from "three";
import { Entity } from "../entities/entity";
import { CameraParameters } from "./types";


export abstract class Camera{
    
    constructor(){}

    public abstract getCamera(): PerspectiveCamera;

    /**
     * Checks the position and orientation of binded Entity and trigger cammera
     * update.
     */
    public abstract step(): void;

    /**
     * Binds camera to a new `Entity` for camera to folow.
     */
    public abstract bindEntity(entity: Entity): void;

    /**
     * Takes one or more parameters and apdate camera with it.
     */
    abstract setParams(params: CameraParameters): void;
    
}