import { Component } from "react";
import { Demonstration } from "./demonstration/demonstration";
import { Editor } from "./editor/editor";
import { EngineManager } from "./engine-manager";


type AppProps = {
}

export class App extends Component{

    props: AppProps;

    state: {
        engineManager: EngineManager,
        displaying: "demonstration" | "editor"
    }


    constructor(props: AppProps){
        super(props);

        this.state = {
            engineManager: new EngineManager(),
            displaying: "demonstration"
        }
    }

    render() {
        const showDemonstration = () => {
            this.setState({
                displaying: "demonstration"
            })
        }

        const showEditor = () => {
            this.setState({
                displaying: "editor"
            })
        }

        return (
            <div className="app-container">

                { 
                    this.state.displaying == "demonstration" 
                    && 
                    <Demonstration 
                        manager={this.state.engineManager} 
                        switchToEditorCallback={showEditor}
                    />
                }

                { 
                    this.state.displaying == "editor" 
                    && 
                    <Editor 
                        manager={this.state.engineManager} 
                        switchToDemonstrationCallback={showDemonstration}
                    />
                }
            
            </div>
        )
    }

    componentWillUnmount(){
        this.state.engineManager.dispose();
    }
 
}