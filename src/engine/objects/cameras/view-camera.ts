import { PerspectiveCamera } from "three";
import { Entity } from "../entities/entity";
import { Camera } from "./camera";
import { CameraParameters } from "./types";

const defaultParams: CameraParameters = {
    aspect: 1,
    near: 0.5,
    far: 1500
}

export class ViewCamera extends Camera{

    perspectiveCamera: PerspectiveCamera;
    params: CameraParameters;

    /**
     * @param bindedEntity is an entity instance that camera will follow.
     */
    constructor(private bindedEntity: Entity | null){
        super();

        this.params = {...defaultParams};
        this.instantiateCamera();

        this.step();
    }

    /** Get three.js camera object. */
    public getCamera(): PerspectiveCamera {
        return this.perspectiveCamera;
    }

    /**
     * Bind camera to new `entity`.
     */
    public bindEntity(entity: Entity){
        this.bindedEntity = entity;
    }

    public step(): void {
        if(!this.bindedEntity){
            return
        }

        const pos = this.bindedEntity.getPosition();
        this.perspectiveCamera.position.setX(pos.x);
        this.perspectiveCamera.position.setZ(pos.y);
        this.perspectiveCamera.position.setY(pos.height + 3.0);

        const orientation = this.bindedEntity.getOrientaion();
        this.perspectiveCamera.rotation.x = orientation.vertical;
        this.perspectiveCamera.rotation.y = orientation.horizontal;
    }

    public setParams(params: CameraParameters): void{
        this.params = {...this.params, ...params};

        this.instantiateCamera();
    }

    private instantiateCamera(){
        this.perspectiveCamera = new PerspectiveCamera(50,this.params.aspect, this.params.near, this.params.far);
        this.perspectiveCamera.rotation.order = "ZYX";
    }

}