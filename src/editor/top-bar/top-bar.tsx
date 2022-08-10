import styles from "./top-bar.module.scss";
import { EngineManager } from "../../engine-manager";
import { EditorType } from "./../types";
import { DropdownMenu } from "./dropdown-menu";
import { TopBarSwitchEntry } from "./types";

type Props = {
    manager: EngineManager,
    switchToDemonstrationCallback: () => void,
    switchToEditorType: (type: EditorType) => void,
    children: TopBarSwitchEntry[]
}

export function TopBar(props: Props){
    const currentPresetName = props.manager.getCurrentPresetName()

    const saveCurrentPreset = () => {
        const mng = props.manager.getStorageManager();
        mng.extractParams(props.manager.getEngine());
        mng.savePreset();
    }

    const saveAs = () => { 
       const presetName = prompt("Preset name", "")
       props.manager.savePreset(presetName)
    }

    return (
        <div className={styles["top-bar"]}>
            <DropdownMenu>{[
                {
                    text: 'Save as "' + currentPresetName + '"',
                    action: saveCurrentPreset  
                },
                {
                    text: "Save as",
                    action: saveAs
                },
                {
                    text: "Exit editor",
                    action: props.switchToDemonstrationCallback
                }
            ]}</DropdownMenu>

            <div className={styles["switchers"]}>
                <span className={styles["label"]}>Edit:</span>

                {
                    props.children.map(switcher => {
                        return (
                            <div key={switcher.text} onClick={switcher.action} className={styles["switcher"]}>
                                <img src={switcher.iconSrc} />
                                <span className={styles["text"]}> {switcher.text} </span>
                            </div>
                        )
                    })
                }
            </div>
            
        </div>
    )
}