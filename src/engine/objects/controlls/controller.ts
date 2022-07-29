import { Entity } from "../entities/entity";


export abstract class EntityController{

    constructor(protected entity: Entity | null){}

    /**
     * Trigger time step.
     */
    public abstract step(): void;

    /**
     * 
     * @param entity - set entity to control. If  
     */
    public abstract setEntity(entity: Entity): void;

    /**
     * Call to free resources.
     */
    public abstract deactivateController(): void;

}