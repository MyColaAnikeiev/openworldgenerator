import { Component, ReactElement } from "react";
import { EngineManager } from "../../engine-manager";
import { EditorTabBody } from "../common/editor-tab-body";
import { LabeledNumberInput } from "../common/materials/labeled-number-input";
import { NodeArea } from "../noise-generator/node-area";

import styles from "./terrain-editor.module.scss";
import { TerrainTextureInputSection } from "./terrain-texture-input-section";

type Props = {
    manager: EngineManager
}

type State = {
    mode: 'default' | 'nodeSelection'
}

export class TerrainEditor extends Component{
    
    props: Props;
    state: State;

    chunkSizeUpdate: (size: number) => void;
    hysteresisUpdate: (hysteresis: number) => void;
    roundsUpdate: (rounds: number) => void;
    terrainResolutionUpdate: (terrainResolution: number) => void;
    planeTextureSizeUpdate: (planeTextureSize: number) => void;
    
    switchToNodeSelectionMode: () => void;

    constructor(props: Props){
        super(props);

        this.state = { mode: "default" }

        this.setUpCallbacks();
    }

    render(): ReactElement{
        const params = this.props.manager.getEngine().getTerrainManager().getParams();

        return (
            <EditorTabBody 
                manager={this.props.manager}
                popups={this.getPopups()}
            >
                
                <LabeledNumberInput
                    label="Chunk size" 
                    inputCallbeck={this.chunkSizeUpdate} 
                    initialValue={params.chunkSize} 
                    min={1}

                />

                <LabeledNumberInput 
                    label="Hysteresis" 
                    inputCallbeck={this.hysteresisUpdate} 
                    initialValue={params.hysteresis}
                    min={0.1}
                    max={1}
                    title="Tells how far away you from middle chunk you need to get, in order to trigger chunk regeneration. So, for example, one unit corresponds to chunkSize so 0.1 is one tenth of chunkSize."
                />

                <LabeledNumberInput 
                    label="Rounds" 
                    inputCallbeck={this.roundsUpdate}
                    initialValue={params.rounds} 
                    min={0}
                    title="Tells how much chunks to put at each direction from middle chunk in such way that every next round completely surounds previous one. Set to 0 and start increasing it by one to get an idea of how many rounds you need."
                />

                <LabeledNumberInput 
                    label="Terrain resolution" 
                    inputCallbeck={this.terrainResolutionUpdate}
                    initialValue={params.terrainResolution} 
                    min={1}
                    title=""
                />

                <div className={styles["node-selection"]}>
                    <label>Heightmap source node({params.sourceNodeId})</label>
                    <button onClick={this.switchToNodeSelectionMode}>
                        Select
                    </button>
                </div>

                <TerrainTextureInputSection 
                    manager={this.props.manager.getEngine().getTerrainManager()} 
                />


                <LabeledNumberInput 
                    label="Texture size" 
                    inputCallbeck={this.planeTextureSizeUpdate}
                    initialValue={params.planeTextureSize} 
                    min={1}
                />

            </EditorTabBody>
        )

    }

    private getPopups(): ReactElement[]{
        const popups = [];

        if(this.state.mode === "nodeSelection"){
            popups.push([this.getNodeSelectionPopup()]);
        }

        return popups;
    }

    private getNodeSelectionPopup(){
        const engine = this.props.manager.getEngine();
        const nodeTree = engine.getGeneratorNodeTree();
        
        const selectNode = (sourceNodeId: number ) => {
            engine.getTerrainManager().setParams({
                sourceNodeId
            })

            this.setState({
                mode: "default"
            })
        }

        const goBack = () => {
            this.setState({
                mode: "default"
            })
        }

        return (
            <div className={styles["node-selection-popup"]}>
                <div className={styles["top"]}>
                    <span>Select source node.</span>
                    <button onClick={goBack}>Cancel</button>    
                </div>
                <div className={styles["node-area-container"]}>
                    <NodeArea
                        nodeTreeBuilder={nodeTree} 
                        selectionMode={true}
                        selectionCallback={selectNode}
                    />
                </div>
            </div>
        )
    }

    private setUpCallbacks(): void{
        this.chunkSizeUpdate = (chunkSize: number) => {
            const terrainManager = this.props.manager.getEngine().getTerrainManager();

            terrainManager.setParams({ chunkSize })
        }

        this.hysteresisUpdate = (hysteresis: number) => {
            const terrainManager = this.props.manager.getEngine().getTerrainManager();

            terrainManager.setParams({ hysteresis })
        }

        this.roundsUpdate = (rounds: number) => {
            const terrainManager = this.props.manager.getEngine().getTerrainManager();

            terrainManager.setParams({ rounds })
        }

        this.terrainResolutionUpdate = (terrainResolution: number) => {
            const terrainManager = this.props.manager.getEngine().getTerrainManager();

            terrainManager.setParams({ terrainResolution })
        }

        this.planeTextureSizeUpdate = (planeTextureSize: number) => {
            const terrainManager = this.props.manager.getEngine().getTerrainManager();

            terrainManager.setParams({ planeTextureSize })
        }


        this.switchToNodeSelectionMode = () => {
            this.setState({mode: "nodeSelection"})
        }
    }

}