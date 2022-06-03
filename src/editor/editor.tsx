import { Component } from "react";
import { EngineManager } from "../engine-manager";

import styles from "./editor.module.scss";
import { NodeEditor } from "./noise-generator/node-editor";
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
            editorType: "node-editor"
        }
    }
    
    render(){
        const topBarSwitchers: TopBarSwitchEntry[] = [
            {
                text: "noise generator",
                iconSrc:"public/assets/fontawesome/solid/diagram-project.svg",
                action: () => this.setState({editorType: "node-editor"})
            },
            {
                text: "scene",
                iconSrc:"public/assets/fontawesome/solid/image.svg",
                action: () => this.setState({editorType: "scene-editor"})
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
            case "node-editor":
                return <NodeEditor {...props} />
            case "scene-editor":
                return null
        }

        return null;
    }

}