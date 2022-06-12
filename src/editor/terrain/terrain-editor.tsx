import { ReactElement } from "react";
import { EngineManager } from "../../engine-manager";
import { TerrainEditorSidebar } from "./terrain-editor-sidebar";

import styles from "./terrain-editor.module.scss";

type Props = {
    manager: EngineManager
}

export function TerrainEditor(props: Props): ReactElement{
    
    const setCanvas = (ref: HTMLElement | null) => {
        if(ref){
            props.manager.setEngineCanvasContainer(ref);
        }
    }

    return (
        <div className={styles["terrain-editor"]}>

            <div ref={setCanvas} className={styles["canvas-container"]}></div>

            { <TerrainEditorSidebar manager={props.manager} /> }
            
        </div>
    )
}