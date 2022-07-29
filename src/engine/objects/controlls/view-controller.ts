import { Entity } from "../entities/entity";
import { EntityController } from "./controller";
import { DragEventEmitter } from "./input/drag-event";
import { KeyCommandEmiter } from "./input/key-command-event";
import { KeyCommandEvent } from "./types";

export class ViewController extends EntityController{

    private active: boolean = false;
    
    private dragEmiter: DragEventEmitter;
    private commandEmitter: KeyCommandEmiter;

    private timeSnapshot : number | null = null;
    private activeCommands: Set<string> = new Set();

    constructor(private assosiatedDom: HTMLElement, entity: Entity | null){
        super(entity);

        this.dragEmiter = new DragEventEmitter(assosiatedDom);
        this.commandEmitter = new KeyCommandEmiter();

        if(entity){
            this.mountEntity();
        }
    }

    /**
     * Trigger time step.
     */
    public step(){
        if(!this.active){
            return;
        }

        if(this.timeSnapshot === null){
            this.timeSnapshot = Date.now();
            return;
        }

        const curTime = Date.now();
        let step = curTime - this.timeSnapshot;
        this.timeSnapshot = curTime;

        if(this.activeCommands.has("shift")){
            step *= 5;
        }

        this.activeCommands.forEach(command => {
            this.entity.move(command, step);
        })
    }

    /**
     * @param entity to controll. If controller was not active, it will be activated. 
     */
    public setEntity(entity: Entity){
        this.unmountEntity();
        this.entity = entity;
        this.mountEntity();
    }

    private mountEntity(){
        this.dragEmiter.registerListener(this.dragCallback.bind(this));
        this.commandEmitter.registerListener(this.keyCommandCallback.bind(this));
        this.active = true;
    }

    private dragCallback(dx: number, dy: number){
        this.entity.rotate(dx, dy);
    }

    private keyCommandCallback(keyCommands: KeyCommandEvent){
        Object.getOwnPropertyNames(keyCommands)
        .forEach(commName => {
            //
            if(keyCommands[commName] === true){
                this.activeCommands.add(commName);
            }else{
                if(this.activeCommands.has(commName)){
                    const timDiff = Date.now() - this.timeSnapshot;
                    this.entity.move(commName, timDiff);
                    this.activeCommands.delete(commName)
                }
            }
        })
    }

    private unmountEntity(){
        this.deactivateController();
        this.active = false;
    }

    /**
     * Call to free resources.
     */
    public deactivateController(): void{
        this.dragEmiter.unregisterAllListeners();
        this.commandEmitter.unregisterAllListeners();
    }

}