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

    keydownHandler: (evt: KeyboardEvent) => void;

    constructor(props: Props){
        super(props);

        this.state = {
            menuOn: true
        }

        this.keydownHandler = (evt: KeyboardEvent) => {
            if(evt.key == "Escape" && !this.state.menuOn){
                this.setState({menuOn: true});
            }
        }
        globalThis.window.addEventListener("keydown",this.keydownHandler);
    }

    render(){
        const ref = (elm) => {
            if(elm){
                this.props.manager.setEngineCanvasContainer(elm);
            }
        }

        const closeMenu = () => this.setState({ menuOn: false });

        return (
            <div className={styles["demonstration"]}>

                <div 
                    className={styles["canvas-container"]}
                    ref={ref}
                ></div>

                { 
                  this.state.menuOn 
                    && 
                  <Menu 
                    closeSelfCallback={closeMenu}
                    engineManager={this.props.manager} 
                    switchToEditorCallback={this.props.switchToEditorCallback} 
                  /> 
                }

            </div>
        )
    }

    componentWillUnmount(){
        globalThis.window.removeEventListener("keydown",this.keydownHandler);
    }
} 