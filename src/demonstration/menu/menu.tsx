import { Component } from "react";
import { EngineManager } from "../../engine-manager";
import { MenuList } from "./menu-list";

import styles from "./menu.module.scss"
import { PresetManager } from "./preset-manager";

type Props = {
    engineManager: EngineManager,
    switchToEditorCallback: () => void,
    closeSelfCallback: () => void
}

export class Menu extends Component{

    props: Props;

    state: {
        context: "main-menu" | "presets" 
    }

    constructor(props: Props){
        super(props);

        this.state = {
            context: "main-menu"
        }
    }

    render(){
        return (
            <div className={styles["menu-container"]}>
                { this.getMenu() }
            </div>
        )
    }

    private getMenu(){
        switch(this.state.context){
            case "main-menu":
                return this.getMainMenu();
            case "presets":
                return this.getPresetsManager();
        }
    }

    private getMainMenu(){
        const selectPresetsManager = () => { this.setState({ context: "presets" }) };

        const entries = [];

        return <MenuList>{[
            { text: "Close menu", action: this.props.closeSelfCallback, timeout: 10},
            { text: "Edit", action: this.props.switchToEditorCallback, timeout: null },
            { text: "Select preset", action: selectPresetsManager, timeout: null }
        ]}</MenuList>
    }

    private getPresetsManager(){
        const props = {
            engineManager: this.props.engineManager,
            // Switch back to main menu.
            closeSelfCallback: () => {
                this.setState({ context: "main-menu"})
            }
        }

        return <PresetManager {...props} />
    }

}