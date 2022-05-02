import { Component, MouseEvent } from "react";
import { delay, delayWhen, interval, Observable, of, startWith, Subject, takeUntil } from "rxjs";
import { GeneratorNode } from "../../../generator/generator-node";
import styles from "./node-viewer.module.scss";

type PropertiesType = {
    selectionMode: boolean,
    nodeUpdate$: Observable<GeneratorNode | null>
    closeCallback: () => void,
    top: number,
    left: number
}

type StateType = {
    dragState: 'none' | 'window-draging' | 'image-draging' 
    top: number,
    left: number
}

type ViewStateType = {
    // Image scroll position
    positionX: number,
    positionY: number,

    mouseLastX: number,
    mouseLastY: number,

    scale: number,

    imageData: ImageData,
    source: GeneratorNode | null,
    rendering: {
        activeRectTimeoutId: ReturnType<typeof setTimeout> | null,
        fillImageTimeoutId: ReturnType<typeof setTimeout> | null

        linesInBatch: number,
        renderedLines: number,
        linePosition: number,
        
        activeRect: {
            top: number,
            right: number,
            bottom: number,
            left: number
        }
    }
}

const canvasWidth = 340;
const canvasHeight = 340;
// 
const batchRenderTime = 20;

export class NodeViewer extends Component{

    props: PropertiesType;
    state: StateType;

    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    canvasWheelHandler: (evt: globalThis.WheelEvent) => void;

    scaleIndicatorRef: HTMLDivElement;

    unsubscriber$: Subject<number> = new Subject();

    viewState: ViewStateType;

    constructor(props: PropertiesType){
        super(props);

        this.state = {
            dragState: 'none',
            top: props.top,
            left: props.left
        }
        
        this.viewState = {
            positionX: 0, positionY: 0,
            scale: 16.0,
            mouseLastX: 0, mouseLastY: 0,

            imageData: new ImageData(canvasWidth, canvasHeight),
            source: null,
            rendering: {
                activeRectTimeoutId: null,
                fillImageTimeoutId: null,
                
                linesInBatch: 32,
                renderedLines: 0,
                linePosition: 0,
                activeRect: {top: 0, right: canvasWidth, bottom: canvasHeight, left: 0}
            }
        }

        this.canvasWheelHandler = this.handleCanvasWheel.bind(this);
    }

    componentDidMount(){
        this.props.nodeUpdate$
        .pipe( takeUntil(this.unsubscriber$) )
        .subscribe(node => {
            this.viewState.source = node;

            if(node === null){
                this.resetCanvas();
            }else{
                this.renderCanvas();
            }
        })

        this.canvasElement.addEventListener("wheel", this.canvasWheelHandler);
    }

    componentWillUnmount(){
        this.unsubscriber$.next(0);
        this.unsubscriber$.complete();

        this.canvasElement.removeEventListener("wheel", this.canvasWheelHandler);
    }

    render(){
        // Hide preview when selecting
        if(this.props.selectionMode){
            return [];
        }

        const wrapperInlineStyles = {
            top: String(this.state.top) + 'px',
            left: String(this.state.left) + 'px'
        }

        const dragAreaStyle = {
            display: this.state.dragState === "window-draging" ? 'block' : 'none'
        }

        const getContext = (ref: HTMLCanvasElement) => {
            if(ref){
                this.canvasElement = ref;
                this.canvasContext = ref.getContext("2d");
            }
        }

        return (
            <div 
                className={styles.wrapper}
                style={wrapperInlineStyles}
                
                onMouseMove={this.hanldeMouseMove.bind(this)}
                onMouseUp={this.handleMouseUp.bind(this)}
                onMouseLeave ={this.handleMouseLeave.bind(this)}
            > 

                <div 
                    className={styles.header}
                    onMouseDown={this.handlerHeaderMouseDown.bind(this)}
                >
                    <div 
                        className={styles["beck-drag-area"]} 
                        style={dragAreaStyle}
                    ></div>
                    <div 
                        className={styles.close} 
                        onClick={this.props.closeCallback}
                    >Close</div>
                </div>
                <div className={styles.body}>
                    <canvas 
                        ref={getContext}
                        width={canvasWidth}
                        height={canvasHeight}
                        onMouseDown={this.handleCanvasMouseDown.bind(this)}
                    >
                    </canvas>
                    <div 
                        className={styles['scale-indicator']}
                        ref={ref => this.scaleIndicatorRef = ref}
                    >
                        {'scale: ' + this.viewState.scale.toFixed(1)}
                    </div>
                </div>
            </div>
        )
    }


    renderCanvas(){
        if(!this.viewState.source){
            return;
        }

        const { rendering } = this.viewState;
        const {activeRect} = rendering;

        rendering.renderedLines = 0;

        /* Stop previous second stage rendering (ouwards). */
        if(rendering.fillImageTimeoutId !== null){
            clearTimeout(rendering.fillImageTimeoutId);
            rendering.fillImageTimeoutId = null;
        }
        /* Stop previous first stage rendering (top-down). */
        if(rendering.activeRectTimeoutId !== null){
            clearTimeout(rendering.activeRectTimeoutId);
        }else{
            rendering.linePosition = activeRect.top;
        }

        /* First stage rendering. Will draw from top to bottom on subrectangle determined
         * by activeRect. activeRect could get smaller between renderActiveRect function calls.
         */
        const renderActiveRect = () => {
            const activeHeight = activeRect.bottom - activeRect.top;

            if( rendering.renderedLines >= activeHeight){
                rendering.activeRectTimeoutId = null;
                this.fillShiftedImage();
                return;
            }
            
            let linesToRender = rendering.linesInBatch;
            if(rendering.linePosition + linesToRender > activeRect.bottom){
                linesToRender = activeRect.bottom - rendering.linePosition;
            }
            if(rendering.renderedLines + linesToRender > activeHeight){
                linesToRender = activeHeight - rendering.renderedLines;
            }

            const x1 = activeRect.left;
            const y1 = rendering.linePosition;
            const x2 = activeRect.right;
            const y2 = y1 + linesToRender;
            this.renderRectOnCanvas(x1,y1,x2,y2);

            rendering.renderedLines += linesToRender;
            rendering.linePosition += linesToRender;
            if(rendering.linePosition >= activeHeight){
                rendering.linePosition = (rendering.linePosition - activeRect.top) % activeHeight + activeRect.top;
            }

            rendering.activeRectTimeoutId = setTimeout(renderActiveRect, 0);
        }

        rendering.activeRectTimeoutId = setTimeout(renderActiveRect, 0);
    }

    /**
     * Returns time it took to run.
     */
    renderRectOnCanvas(x1: number, y1: number, x2: number, y2: number){
        const {source} =this.viewState;
        const {positionX, positionY} = this.viewState;
        const {scale} = this.viewState;
        const {imageData} = this.viewState;

        const start = Date.now();

        for(let j = y1; j < y2; j++){
            for(let i = x1; i < x2; i++){
                const x = i + positionX;
                const y = j + positionY;
                const val = source.getValue(x/scale, y/scale) * 127 + 128;

                imageData.data[j * canvasHeight * 4 + i*4 + 0] = val;
                imageData.data[j * canvasHeight * 4 + i*4 + 1] = val;
                imageData.data[j * canvasHeight * 4 + i*4 + 2] = val;
                imageData.data[j * canvasHeight * 4 + i*4 + 3] = 255;
            }
        }

        if(this.canvasContext){
            this.canvasContext.putImageData(imageData, 0,0);
        }

        // Butch size adjusting
        const approximateLines = (x2-x1)*(y2-y1) / canvasWidth * 1.2;
        if(approximateLines){
            const lineRenderTime = (Date.now() - start) / approximateLines;
            this.viewState.rendering.linesInBatch = Math.ceil(batchRenderTime / lineRenderTime);
        }
    }

    /**
     * Second stage of rendering (outwards). Will be started after renderActiveRect is finished.
     */
    fillShiftedImage(){
        const { rendering } = this.viewState;
        const { activeRect } = rendering;

        if(rendering.activeRectTimeoutId !== null){
            return;
        }
        if(rendering.fillImageTimeoutId !== null){
            return;
        }
        if(!this.viewState.source){
            return;
        }

        const fillGaps = () => {
            const activeHeight = activeRect.bottom - activeRect.top;
            const activeWidth = activeRect.right - activeRect.left;

            if(canvasWidth - activeWidth == 0 && canvasHeight - activeHeight == 0){
                rendering.fillImageTimeoutId = null;
                return;
            }

            // Choose side with largest gap
            // Vertical
            if(canvasHeight - activeHeight > canvasWidth - activeWidth){
                const x1 = activeRect.left;
                const x2 = activeRect.right;
                let y1: number, y2: number;

                // Top
                if(activeRect.top > canvasHeight - activeRect.bottom){
                    y1 = activeRect.top - rendering.linesInBatch;
                    if(y1 < 0){
                        y1 = 0;
                    }
                    y2 = activeRect.top;
                    activeRect.top = y1;

                }
                // Bottom                
                else{
                    y1 = activeRect.bottom;
                    y2 = y1 + rendering.linesInBatch;
                    if(y2 > canvasHeight){
                        y2 = canvasHeight;
                    }
                    activeRect.bottom = y2;
                }

                this.renderRectOnCanvas(x1,y1,x2,y2);
            // Horizontal
            }else{
                const y1 = activeRect.top;
                const y2 = activeRect.bottom;
                let x1: number, x2: number;
                
                // Left
                if(activeRect.left > canvasWidth - activeRect.right){
                    x1 = activeRect.left - rendering.linesInBatch;
                    if(x1 < 0){
                        x1 = 0;
                    }
                    x2 = activeRect.left;
                    activeRect.left = x1;
                }
                // Right
                else{
                    x1 = activeRect.right;
                    x2 = x1 + rendering.linesInBatch;
                    if(x2 > canvasWidth){
                        x2 = canvasWidth;
                    }
                    activeRect.right = x2;
                }

                this.renderRectOnCanvas(x1,y1,x2,y2);
            }

            // Rendering in activeRect area takes priority.
            if(rendering.activeRectTimeoutId === null){
                rendering.fillImageTimeoutId = setTimeout(fillGaps, 0);
            }else{
                rendering.fillImageTimeoutId = null;
            }
        }

        rendering.fillImageTimeoutId = setTimeout(fillGaps, 0);
    }    

    resetCanvas(){
        this.canvasContext.putImageData(
            new ImageData(canvasWidth, canvasHeight), 
            0, 0
        )
    }


    // .wrapper handlers

    handleMouseLeave(){
        if(this.state.dragState !== "none"){
            this.setState({dragState: "none"});
        }
    }

    hanldeMouseMove(evt: MouseEvent){   
        if(this.state.dragState === "image-draging"){
            this.dragImage(evt);
        }
        if(this.state.dragState === "window-draging"){
            this.dragWindow(evt);
        }
    }

    handleMouseUp(){
        if(this.state.dragState !== "none"){
            this.setState({dragState: "none"});
        }
    }

    // .header handlers

    handlerHeaderMouseDown(evt: MouseEvent){
        if(this.state.dragState === "none"){
            this.viewState.mouseLastX = evt.clientX;
            this.viewState.mouseLastY = evt.clientY;

            this.setState({ dragState: "window-draging" })
        }
    }

    // canvas handlers

    handleCanvasMouseDown(evt: MouseEvent){
        if(this.props.selectionMode){
            return;
        }

        if(this.state.dragState === "none"){
            this.viewState.mouseLastX = evt.clientX;
            this.viewState.mouseLastY = evt.clientY;

            this.setState({dragState: "image-draging"})
        }
    }

    /**
     * Zoom in and out
     */
    handleCanvasWheel(evt: globalThis.WheelEvent){
        evt.preventDefault();
        evt.stopPropagation();
        if(evt.deltaY == 0){
            return;
        }

        let rescaleCoefs = 0.95;
        if(evt.deltaY < 0){
            rescaleCoefs = 1 / rescaleCoefs; 
        }

        const { viewState } = this;

        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;

        viewState.positionX = ( (viewState.positionX + halfWidth) * rescaleCoefs ) - halfWidth;
        viewState.positionY = ( (viewState.positionY + halfHeight) * rescaleCoefs ) - halfHeight;
        viewState.scale *= rescaleCoefs; 
        this.scaleIndicatorRef.innerText = 'scale: ' + viewState.scale.toFixed(1);       

        //rendering
        const { rendering } = this.viewState;
        const { activeRect } =  rendering;
        // Start rerendering with 70x70 cube
        activeRect.top = halfHeight - 35;
        activeRect.bottom = halfHeight + 35;
        activeRect.left = halfWidth - 35;
        activeRect.right = halfWidth + 35;

        rendering.linePosition = activeRect.top;
        this.renderCanvas();
    }


    dragWindow(evt: MouseEvent){
        const {viewState} = this;
        const dX = evt.clientX - viewState.mouseLastX;
        const dY = evt.clientY - viewState.mouseLastY;
        viewState.mouseLastX = evt.clientX;
        viewState.mouseLastY = evt.clientY;

        this.setState({ top: this.state.top+dY, left: this.state.left+dX });
    }

    dragImage(evt: MouseEvent){
        const {viewState} = this;
        const {activeRect} = this.viewState.rendering
        const dX = evt.clientX - viewState.mouseLastX;
        const dY = evt.clientY - viewState.mouseLastY;
        viewState.mouseLastX = evt.clientX;
        viewState.mouseLastY = evt.clientY;
        

        const {imageData} = this.viewState;
        const shiftedImage = new ImageData(canvasWidth, canvasHeight);

        for(let y = 0; y < canvasHeight; y++){
            for(let x = 0; x < canvasWidth; x++){
                const sx = x - dX;
                const sy = y - dY;

                let val: number;

                if(sx < 0 || sy < 0 || sx >= canvasWidth || sy >= canvasHeight){
                    val = 0;
                }else{
                    val = imageData.data[(4*sy*canvasWidth) + 4*sx];
                }

                shiftedImage.data[(4*y*canvasWidth) + 4*x + 0] = val;
                shiftedImage.data[(4*y*canvasWidth) + 4*x + 1] = val;
                shiftedImage.data[(4*y*canvasWidth) + 4*x + 2] = val;
                shiftedImage.data[(4*y*canvasWidth) + 4*x + 3] = 255;
            }
        }

        this.viewState.imageData = shiftedImage;
        this.canvasContext.putImageData(shiftedImage,0,0);

        // Asjust position
        this.viewState.positionX -= dX;
        this.viewState.positionY -= dY; 

        // Adjust activeRect
        activeRect.left += dX;
        activeRect.right += dX;

        if(activeRect.left < 0)
            activeRect.left = 0;
        if(activeRect.right > canvasWidth)
            activeRect.right = canvasWidth;
        if(activeRect.left > activeRect.right)
            activeRect.left = activeRect.right;

        const top = activeRect.top;
        const bottom = activeRect.bottom;
        activeRect.top += dY;
        activeRect.bottom += dY;

        if(activeRect.top < 0)
            activeRect.top = 0;
        if(activeRect.bottom > canvasHeight)
            activeRect.bottom = canvasHeight;
        if(activeRect.top > activeRect.bottom)
            activeRect.top = activeRect.bottom;

        viewState.rendering.renderedLines -= top - activeRect.top + bottom - activeRect.bottom; 

        viewState.rendering.linePosition += dY;
        if(viewState.rendering.linePosition < activeRect.top){
            viewState.rendering.linePosition = activeRect.top;
        }
        if(viewState.rendering.linePosition > activeRect.bottom){
            viewState.rendering.linePosition = activeRect.bottom;
        }

        this.fillShiftedImage();
    }
}