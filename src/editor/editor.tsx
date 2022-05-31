import { Component } from "react";
import { EngineManager } from "../engine-manager";

type Props = {
    manager: EngineManager,
    switchToDemonstrationCallback: () => void
}


export class Editor extends Component{

    props: Props;

    constructor(props: Props){
        super(props);
    }
    
    render(){
        return (
            <div className="editor-container">
                Editor
            </div>
        )
    }

}