import { EngineManager } from "../../engine-manager";
import { ReactChild, ReactElement } from "react";
import { Sidebar } from "./sidebar";
import styles from "./editor-tab-body.module.scss"

type Props = {
    manager: EngineManager,
    children: ReactChild | ReactChild[],
    popups: ReactElement[]
}

/**
 * React component that provides template for engine preview and sidebar.
 * 
 * props attributes:
 *  
 *  `manager` - engine manager instance.
 * 
 *  `children` - will be placed as content inside sidebar.
 * 
 *  `popups` - array of elements with absolute positioning to be placed over everything inside a tab.
 *  Tab conteiner element itself have relative positioning.
 */
export function EditorTabBody(props: Props){
    const setCanvas = (ref: HTMLElement | null) => {
        if(ref){
            props.manager.setEngineCanvasContainer(ref);
        }
    }

    return (
        <div className={styles["editor-tab"]}>

            <div ref={setCanvas} className={styles["canvas-container"]}></div>

            <Sidebar>{props.children}</Sidebar>
            
            { props.popups }

        </div>
    )

}