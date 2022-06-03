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
    

    const saveCurrentPreset = () => {
        const mng = props.manager.getStorageManager();
        mng.extractParams(props.manager.getEngine());
        mng.savePreset();
    }


    return (
        <div className={styles["top-bar"]}>
            <DropdownMenu>{[
                {
                    text: "Save",
                    action: saveCurrentPreset  
                },
                {
                    text: "Save as",
                    action: () => {}
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