import { Component } from "react";
import { EngineManager } from "../engine-manager";
import { DecorationsEditor } from "./decorations/decorations-editor";

import styles from "./editor.module.scss";
import { NodeEditor } from "./noise-generator/node-editor";
import { SceneEditor } from "./scene/scene-editor";
import { TerrainEditor } from "./terrain/terrain-editor";
import { TopBar } from "./top-bar/top-bar";
import { TopBarSwitchEntry } from "./top-bar/types";
import { EditorType } from "./types";

type Props = {
    manager: EngineManager,
    switchToDemonstrationCallback: () => void
}


export class Editor extends Component{

    props: Props;

    state: {
        editorType: EditorType
    }

    constructor(props: Props){
        super(props);

        this.state = {
            editorType: "scene-editor"
        }
    }
    
    render(){
        const topBarSwitchers: TopBarSwitchEntry[] = [
            {
                text: "scene",
                iconSrc:"public/assets/fontawesome/solid/image.svg",
                action: () => this.setState({editorType: "scene-editor"})
            },
            {
                text: "noise generator",
                iconSrc:"public/assets/fontawesome/solid/diagram-project.svg",
                action: () => this.setState({editorType: "node-editor"})
            },
            {
                text: "terrain",
                iconSrc:"public/assets/fontawesome/solid/earth-africa.svg",
                action: () => this.setState({editorType: "terrain-editor"})
            },
            {
                text: "decorations",
                iconSrc:"public/assets/fontawesome/solid/tree.svg",
                action: () => this.setState({editorType: "decorations-editor"})
            } 
        ];

        return (
            <div className={styles["editor-container"]}>
                <TopBar 
                    {...this.props} 
                    switchToEditorType={() => {}}
                >
                    {topBarSwitchers}
                </TopBar>
                
                {this.getEditor()}

            </div>
        )
    }

    getEditor(){
        const props = {
            manager: this.props.manager
        }

        switch(this.state.editorType){
            case "scene-editor":
                return <SceneEditor {...props} />
            case "node-editor":
                return <NodeEditor {...props} />
            case "terrain-editor":
                return <TerrainEditor {...props}/>
            case "decorations-editor":
                return <DecorationsEditor {...props} />
        }

        return null;
    }

}