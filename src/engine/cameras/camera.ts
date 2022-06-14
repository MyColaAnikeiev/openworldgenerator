import { PerspectiveCamera } from "three";
import { CameraParameters } from "./types";


export abstract class Camera{
    
    constructor(){}

    public abstract getCamera(): PerspectiveCamera;

    /**
     * Trigger cammera update.
     */
    abstract step(): void;

    /**
     * Takes one or more parameters and apdate camera with it.
     */
    abstract setParams(params: CameraParameters): void;
    
}