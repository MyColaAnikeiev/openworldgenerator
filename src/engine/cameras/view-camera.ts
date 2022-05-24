import { PerspectiveCamera } from "three";
import { Entity } from "../entities/entity";
import { Camera } from "./camera";


export class ViewCamera extends Camera{

    perspectiveCamera: PerspectiveCamera;

    /**
     * @param bindedEntity is an instance that camera will follow.
     */
    constructor(private bindedEntity: Entity | null){
        super();

        this.perspectiveCamera = new PerspectiveCamera(50,1, 0.1, 1500);
        this.perspectiveCamera.rotation.order = "ZYX";
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


    public unbindEntity(){
        this.bindEntity = null;
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

}