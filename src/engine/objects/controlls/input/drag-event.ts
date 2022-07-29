import { DragEventListener } from "../types";


/**
 * Listens to draging on provided element reference and calls all registered
 * listeners with coordinate deltas. `DragEventEmitter` will remain passive when
 * there is no registered listeners.
 */
export class DragEventEmitter{

    private dragOn: boolean = false;
    private dragStartHandler: (evt: MouseEvent) => void;
    private dragMoveHandler: (evt: MouseEvent) => void;
    private dragEndHandler: () => void;
    private handlersAreUsed: boolean = false;

    private lastX = 0.0;
    private lastY = 0.0;

    private listeners: DragEventListener[] = []; 

    /**
     * @param domElement dragging of which will cause this class to emit x and y deltas.
     */
    constructor(private domElement: HTMLElement){
        this.dragStartHandler = this.dragStart.bind(this);
        this.dragMoveHandler = this.dragMove.bind(this);
        this.dragEndHandler = this.dragEnd.bind(this);
    }

    /**
     * @param listener callback function will be called with coordinate difference
     * when user is dragging on provided html element.
     */
    public registerListener(listener: DragEventListener){
        this.listeners.push(listener);

        if(!this.handlersAreUsed){
            this.setUpHandlers();
        }
    }

    /**
     * Provide a previously registered function to unregister. 
     */
    public unregisterListener(listener: DragEventListener){
        this.listeners = this.listeners.filter(curListener => curListener != listener);

        if(this.listeners.length === 0 && this.handlersAreUsed){
            this.unmountHandlers();
        }
    }

    /**
     * Call to free resources and get rid of listeners if emiter is no longer needed.
     */
    public unregisterAllListeners(){
        this.listeners = [];

        this.unmountHandlers();
    }


    private unmountHandlers(){
        this.domElement.removeEventListener("mousedown", this.dragStartHandler);
        globalThis.window.removeEventListener("mousemove", this.dragMoveHandler);
        globalThis.window.removeEventListener("mouseout", this.dragEndHandler);
        globalThis.window.removeEventListener("mouseup", this.dragEndHandler);
    }


    private setUpHandlers(){
        this.handlersAreUsed = true;

        this.domElement.addEventListener("mousedown", this.dragStartHandler);
        globalThis.window.addEventListener("mousemove", this.dragMoveHandler);
        globalThis.window.addEventListener("mouseout", this.dragEndHandler);
        globalThis.window.addEventListener("mouseup", this.dragEndHandler);

        // Touchscreen
        this.domElement.addEventListener("touchstart", this.dragStartHandler);
        globalThis.window.addEventListener("touchmove", this.dragMoveHandler);
        globalThis.window.addEventListener("touchcancel", this.dragEndHandler);
        globalThis.window.addEventListener("touchend", this.dragEndHandler);
    }


    /* Handlers */

    private dragStart(evt: MouseEvent){
        this.dragOn = true;
        this.lastX = evt.clientX;
        this.lastY = evt.clientY;
    }

    private dragMove(evt: MouseEvent){
        if(!this.dragOn){
            return;
        }

        const dX = evt.clientX - this.lastX;
        const dY = evt.clientY - this.lastY;

        this.lastX = evt.clientX;
        this.lastY = evt.clientY;
        
        this.listeners.forEach(listener => listener(dX, dY));
    }

    private dragEnd(){
        this.dragOn = false;
    }
}