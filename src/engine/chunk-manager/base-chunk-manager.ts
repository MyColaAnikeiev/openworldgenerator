import { Object3D, Scene } from "three"
import { IndexPosition, PlanePosition } from "../types";
import { ChunkArea, ChunkGenState, ChunkInstance, ChunkReadyState } from "./types"



export abstract class BaseChunkManager{

    private chunks: (ChunkArea | null)[][];
    private chunksCenter: IndexPosition = {i: 0, j: 0};
    private curPosition: IndexPosition = {i: 0, j: 0};

    private updateChunksTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private taskRunnerTimeoutId: ReturnType<typeof setTimeout> | null = null;
    
    private genTaskQueue: ChunkGenState[] = [];
    private curGenTaskIndex: number = 0;

    private contentUpdateTaskQueue: ChunkArea[] = [];
    private contentUpdateTaskIndex: number = 0;

    /**
     * @param scene THREEJS scene object. 
     * @param viewPosition is a coordinates around which manager will build chunks.
     * @param chunkSize 
     * @param hysteresis determines how for from you have to move from first chunck in 
     * order for updateChanks to be triggered. 1 unit coresponds to chunckSize.
     * @param rounds around central chunk. (min: 1)
     */
    constructor(
        protected scene: Scene,
        private viewPosition: PlanePosition, 
        protected chunkSize: number, 
        private hysteresis: number,
        private rounds: number
    )
    {
        this.curPosition.i = Math.floor(viewPosition.x / chunkSize)
        this.curPosition.j = Math.floor(viewPosition.y / chunkSize)
        this.chunks = this.getEmptyChunkGrid(rounds);

        // Fill for first time.
        this.updateChunks();
    }


    /**
     * Based on distance from central chunk `round`, return chunk instance scheme with desired simplification level.
     */
    protected abstract getBlankInstance(round: number): ChunkInstance;

    /**
     * 
     * @param task object. Use `task.generationState` property to save intermediate results if needed and set it to null when finished.
     * @param executionTime used to decide if there is need to split task into smaller generation tasks if such spliting is implemented.
     * @return null if task still unfinished.
     */
    protected abstract runGenTask(task: ChunkGenState, executionTime: number): Object3D | null;

    /**
     * If task have any intermediate results then clean them up and revert task to it's
     * initial state. 
     */
    protected abstract cleanIntermediateResultsOfgenTask(task: ChunkGenState): void;

    /**
     * Takes and modifies 3d object on some update which is supposedly is comming from editing.
     * Unlike generation, this function should finish work in one run.
     */
    protected abstract runContentUpdateTask(chunkArea: ChunkArea): void;

    /**
     * Call dispose method on all objects generated during `runGenTast` call.
     */
    protected abstract disposeOfChunkObject(object: Object3D): void;


    /**
     * Privide current world position (of viewer or player) and based on chunk's state 
     * it will decide if chunk grid update need to be performed.
     * 
     * Even though generating could be very havy, it should be safe to call this function 
     * in loop sequance on different instances as update itself will be performed asyncronosly.
     */
    public setViewPosition(pos: PlanePosition){
        this.viewPosition = pos;
        const normalizedPos = { x: pos.x / this.chunkSize, y: pos.y / this.chunkSize }

        const centerX = this.curPosition.i  + 0.5;
        const centerY = this.curPosition.j  + 0.5;
        
        if(
            Math.abs(normalizedPos.x - centerX) > (0.5 + this.hysteresis) ||
            Math.abs(normalizedPos.y - centerY) > (0.5 + this.hysteresis)
        )
        {
            this.curPosition.i = Math.floor(normalizedPos.x);
            this.curPosition.j = Math.floor(normalizedPos.y);

            // updateChunks could be heavy and this function could be called
            // many times in one macrotask run.
            if(this.updateChunksTimeoutId === null){
                this.updateChunksTimeoutId = setTimeout(this.updateChunks.bind(this),);
            }
        }
    }
    

    /**
     * When view position is changed enough to trigger update, this function manages
     * chunks by removing one's that is out of range, swapping to one that has suitable optimization 
     * level if such instance is present, or requesting one if not. When suitable chunk instance 
     * is set up for generation, any currently used chunk in this `ChunkArea` will be keept in 
     * 3d secene until new instance is generated. Deleting and swapping is done during
     * current script event run. Generation is done asynchronously by task runner.
     */
    private updateChunks(){
        this.updateChunksTimeoutId = null;

        const gridSize = this.rounds*2 + 1;
        const newGrid = this.getEmptyChunkGrid(this.rounds);

        const deltaI = this.curPosition.i - this.chunksCenter.i;
        const deltaJ = this.curPosition.j - this.chunksCenter.j;

        /* Copy chunks that fits grid and removes when it out of grid. */
        for(let j = 0; j < gridSize; j++){
            for(let i = 0; i < gridSize; i++){
                const curChunk = this.chunks[j][i];
                if(curChunk){
                    const newJ = j - deltaJ;
                    const newI = i - deltaI;

                    if(newJ < 0 || newJ >= gridSize || newI < 0 || newI >= gridSize){
                        this.freeChunk(curChunk)
                    }else{
                        newGrid[newJ][newI] = curChunk;
                    }

                }
            }
        }

        this.chunks = newGrid;
        this.chunksCenter = {...this.curPosition};

        /* 
         * See which chunks instances should be used, if suitable is not present, 
         * then request it's generation. 
         */
        for(let j = 0; j < gridSize; j++){
            for(let i = 0; i < gridSize; i++){

                const curChunk = newGrid[j][i];
                const round = Math.max(Math.abs(j - this.rounds), Math.abs(i - this.rounds));

                if(curChunk){
                    curChunk.currentRound = round;

                    const suitableChunk = curChunk.instances.find(ins => {
                        const suitable = ins.maxRound >= round && ins.minRound <= round;
                        const usedOrPending = ins.state === ChunkReadyState.used || ins.state === ChunkReadyState.pending
                        return suitable && usedOrPending;
                    });
                    if(suitableChunk){
                        
                        // Other pending
                        curChunk.instances.filter(ins => {
                            return ins.maxRound < round || ins.minRound > round;
                        }).forEach(ins => {
                            if(ins.state === ChunkReadyState.pending){
                                ins.state = ChunkReadyState.stoped;
                            }
                        })
                    }
                    else{
                        this.requestSuitableChunkInstance(curChunk, round);
                    }
                }else{
                    const chunk: ChunkArea = {
                        i: i + this.curPosition.i - this.rounds,
                        j: j + this.curPosition.j - this.rounds,
                        currentRound: round,
                        instances: []
                    }
                    newGrid[j][i] = chunk;
                    this.requestChunkInstance(chunk, round);
                }
                
            }
        }


        // Stoped one will be removed from queue so there is potentially need for freeing resources. 
        this.genTaskQueue.forEach(ch => {
            if(ch => ch.instance.state === ChunkReadyState.stoped){
                this.cleanIntermediateResultsOfgenTask(ch)
            }
        });
        // Clear queue from stoped or used tasks
        this.genTaskQueue = this.genTaskQueue.filter(ch => ch.instance.state === ChunkReadyState.pending);
        // Closer to center is generated first
        this.genTaskQueue.sort((a, b) => a.chunkArea.currentRound - b.chunkArea.currentRound);
        this.curGenTaskIndex = 0;

        this.triggerTaskRunner();
    }


    protected updateChunksContent(): void{
        const gridSize = this.rounds * 2 + 1;

        this.contentUpdateTaskQueue = [];

        for(let j = 0; j < gridSize; j++){
            for(let i = 0; i < gridSize; i++){
                const curChunk = this.chunks[j][i];

                // Clean ready but unused one
                curChunk.instances
                    .filter(ins => ins.state === ChunkReadyState.ready)
                    .forEach(ins => {
                        this.disposeOfChunkObject(ins.object3D);
                        ins.state = ChunkReadyState.stoped;    
                    })
                
                curChunk.instances = curChunk.instances
                    .filter(ins => ins.state !== ChunkReadyState.stoped);

                
                const used = curChunk.instances.find(ins => ins.state === ChunkReadyState.used);
                if(used){
                    this.contentUpdateTaskQueue.push(curChunk);
                }
            }
        }

        this.contentUpdateTaskIndex = 0;
        this.contentUpdateTaskQueue.sort((a, b) => a.currentRound - b.currentRound);
        this.triggerTaskRunner();
    }


    private freeChunk(chunck: ChunkArea){
        chunck.instances.forEach(instance => {
            if(instance.state === ChunkReadyState.used){
                this.scene.remove(instance.object3D)
            }
            if(instance.state === ChunkReadyState.pending){
                instance.state = ChunkReadyState.stoped;
            }
            if(instance.object3D){
                this.disposeOfChunkObject(instance.object3D);
            }
        });
    }
    

    /**
     * Change for or request fitting optimization level based on round.
     */
    private requestSuitableChunkInstance(chunkArea: ChunkArea, round: number): void{
        // Cancel pending for this chunkArea
        chunkArea.instances.filter(ins => ins.state === ChunkReadyState.pending).forEach(ins => {
            ins.state = ChunkReadyState.stoped
        });

        // See if suitable instance is present
        const fittingChunk = chunkArea.instances.find(ins => {
            return ins.minRound <= round && ins.maxRound >= round;
        })
        
        if(fittingChunk){
            if(fittingChunk.state === ChunkReadyState.ready){
                const used = chunkArea.instances.find(ins => ins.state === ChunkReadyState.used);
                if(used){
                    this.scene.remove(used.object3D);
                    used.state = ChunkReadyState.ready;
                }

                this.scene.add(fittingChunk.object3D);
                fittingChunk.state = ChunkReadyState.used;
                return;
            }

            if(fittingChunk.state === ChunkReadyState.stoped){
                fittingChunk.state = ChunkReadyState.pending;
                this.genTaskQueue.push({chunkArea: chunkArea, instance: fittingChunk, generationState: null});
                return;
            }
        }else{
            const instance = this.getBlankInstance(round);
            chunkArea.instances.push(instance);
            this.genTaskQueue.push({chunkArea, instance, generationState: null})
        }
    }


    private requestChunkInstance(chunkArea: ChunkArea, round: number){
        const instance = this.getBlankInstance(round);
        chunkArea.instances.push(instance);
        this.genTaskQueue.push({chunkArea, instance, generationState: null})
    }

    private triggerTaskRunner(){
        if(this.taskRunnerTimeoutId !== null){
            return
        }

        if(this.contentUpdateTaskQueue.length !== 0){
            this.taskRunnerTimeoutId = setTimeout(this.contentUpdateTaskRunner.bind(this),0);
        }else if(this.genTaskQueue.length !== 0){
            this.taskRunnerTimeoutId = setTimeout(this.genTaskRunner.bind(this),0);
        }
    }

    
    private genTaskRunner(): void{
        const executionTime = 20; // Give approximetely 20ms
        const start = Date.now();
        this.taskRunnerTimeoutId = null;

        // Content update takes priority
        if(this.contentUpdateTaskQueue.length !== 0){
            this.triggerTaskRunner();
            return;
        }

        while(this.curGenTaskIndex < this.genTaskQueue.length){
            const curTask = this.genTaskQueue[this.curGenTaskIndex];

            if(curTask.instance.state !== ChunkReadyState.pending){
                this.curGenTaskIndex++;
                continue;
            }

            const executuionTimeLeft = executionTime - (Date.now() - start);
            const mesh = this.runGenTask(curTask, executuionTimeLeft);

            if(mesh){

                // Clear used instance in this chunkArea
                const used = curTask.chunkArea.instances.find(inst => inst.state === ChunkReadyState.used)
                if(used){
                    this.scene.remove(used.object3D)
                    used.state = ChunkReadyState.ready;
                }

                this.scene.add(mesh);
                curTask.instance.object3D = mesh;
                curTask.instance.state = ChunkReadyState.used;

                this.curGenTaskIndex++
            }
            
            if(Date.now() - start > executionTime){
                break;
            }
        }

        if(this.curGenTaskIndex >= this.genTaskQueue.length){
            // Stoped one will be removed from queue so there is potentially need for freeing resources. 
            this.genTaskQueue.forEach(ch => {
                if(ch => ch.instance.state === ChunkReadyState.stoped){
                    this.cleanIntermediateResultsOfgenTask(ch)
                }
            });
            this.genTaskQueue = this.genTaskQueue.filter(ins => ins.instance.state === ChunkReadyState.pending);

            if(this.genTaskQueue.length === 0){
                return
            }
            
            this.curGenTaskIndex = 0;
        }

        this.taskRunnerTimeoutId = setTimeout(this.genTaskRunner.bind(this),0);
    }

    private contentUpdateTaskRunner(): void{
        const executionTime = 20; // approximete run time around 20ms
        const start = Date.now();
        this.taskRunnerTimeoutId = null;

        while(this.contentUpdateTaskIndex < this.contentUpdateTaskQueue.length){
            const cur = this.contentUpdateTaskQueue[this.contentUpdateTaskIndex++];
            const used = cur.instances.find(ins => ins.state === ChunkReadyState.used);
            if(!used){
                continue;
            }
            
            this.runContentUpdateTask(cur);

            if(Date.now() - start > executionTime){
                break;
            }
        }

        if(this.contentUpdateTaskIndex >= this.contentUpdateTaskQueue.length){
            this.contentUpdateTaskQueue = [];
            this.triggerTaskRunner();
            return;
        }

        this.taskRunnerTimeoutId = setTimeout(this.contentUpdateTaskRunner.bind(this),0);
    }


    private getEmptyChunkGrid(rounds: number): (ChunkArea | null)[][]{
        const gridSize = rounds*2 + 1;
        return Array.from(Array(gridSize)).map(() => {
            return Array.from(Array(gridSize)).map(() => null)
        })
    }

    public dispose(){
        this.chunks.forEach(chunkRow => {
            chunkRow.forEach(chunk => this.freeChunk(chunk));
        })

        this.genTaskQueue.forEach(ch => this.cleanIntermediateResultsOfgenTask(ch) );
        this.genTaskQueue = [];

        this.contentUpdateTaskQueue = [];
    }
}