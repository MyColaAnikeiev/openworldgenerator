import { Component } from "react";
import { EngineManager } from "../engine-manager";
import { Menu } from "./menu/menu";

import styles from "./demonstration.module.scss"

type Props = {
    manager: EngineManager,
    switchToEditorCallback: () => void
}

export class Demonstration extends Component{

    props: Props;

    state: {
        menuOn: boolean;
    }

    constructor(props: Props){
        super(props);

        this.state = {
            menuOn: true
        }
    }

    render(){
        const ref = (elm) => {
            if(elm){
                this.props.manager.setEngineCanvasContainer(elm);
            }
        }

        return (
            <div className={styles["demonstration"]}>

                <div 
                    className={styles["canvas-container"]}
                    ref={ref}
                ></div>

                { 
                  this.state.menuOn 
                    && 
                  <Menu engineManager={this.props.manager} /> 
                }

            </div>
        )
    }
} 