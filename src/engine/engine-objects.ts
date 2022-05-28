import { Camera } from "./cameras/camera";
import { ViewCamera } from "./cameras/view-camera";
import { EntityController } from "./controlls/controller";
import { ViewController } from "./controlls/view-controller";
import { EngineUserInterface } from "./engine";
import { EngineLoader } from "./engine-loader";
import { Entity } from "./entities/entity";
import { ViewEntity } from "./entities/view-entity";
import { EngineOjectsDescription } from "./loader-types";
import { PlanePosition } from "./types";


export class EngineObjects{
    private camera: Camera;
    private entityControllers: EntityController[] = [];
    private entities: Entity[] = [];
    
    private objectDescroptions: EngineOjectsDescription;

    constructor(private hostEngine: EngineUserInterface, private loader: EngineLoader){
        this.objectDescroptions = this.loader.getObjectDescription();

        this.instantiateEntities();
        this.instantiateCamera();
        this.instantiateControlers();
    }

    /**
     * Call before instantiating camera and controllers.
     */
     private instantiateEntities(){
        this.objectDescroptions.entities.forEach(desc => {

            switch (desc.type){
                case "viewer":
                    this.entities.push(
                      new ViewEntity(desc.id, this.hostEngine, this, desc.position, desc.orientation)  
                    );
                    break;
            }

        })
    }


    private instantiateControlers(){
        this.objectDescroptions.controllers.forEach(desc => {

            switch(desc.type){
                case "viewer":
                    const targetEntity = this.entities.find(entity => entity.id === desc.targetId);    
                    if(!targetEntity){
                        break;
                    }

                    this.entityControllers.push(
                        new ViewController(this.hostEngine.getDomElement(), targetEntity)
                    )
                    break;
            }

        })
    }

    private instantiateCamera(){
        const desc = this.objectDescroptions.camera;
        const targetEntity = this.entities.find(entity => entity.id === desc.targetId) || null;

        switch(desc.type){
            case "first-person":
                this.camera = new ViewCamera(targetEntity);
                break;
        }
    }

    public getCamera(){
        return this.camera;
    }

    public getMainPosition(): PlanePosition{
        const pos = this.camera.getCamera().position;
        return {x: pos.x, y: pos.z};
    }
        
    public step(): void{
        this.entityControllers.forEach(controller => {
            controller.step();
        })
        this.camera.step();
    }

}