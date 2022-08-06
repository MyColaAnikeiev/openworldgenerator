import { Component } from "react";
import { EngineManager } from "../../engine-manager";
import { PresetListItem } from "./preset-list-item";

import styles from "./preset-manager.module.scss";

type Props = {
    engineManager: EngineManager,
    closeSelfCallback: () => void
}

export class PresetManager extends Component{

    props: Props;

    constructor(props: Props){
        super(props);
    }

    render(){
        return (
            <div className={styles["preset-list-body"]}>
                <div className={styles["preset-list-head"]}>
                    <h3>Saved presets:</h3>
                </div>

                <div className={styles["preset-list-items"]}>
                    { this.getPresetList() }
                </div>

                <div className={styles["foot-controls"]}>
                    <div className={styles["btn"]} onClick={this.props.closeSelfCallback}>
                        Back
                    </div>

                    <div className={styles["btn"]} onClick={this.loadFromFile.bind(this)}>
                        Load from file
                    </div>
                </div>
            </div>
        )
    }

    getPresetList(){
        const storageMng = this.props.engineManager.getStorageManager();
        const list = storageMng.getPresetList();
        
        return list.map(presetName => {
            const mng = this.props.engineManager.getStorageManager();
            const selected = mng.getCurrentPresetName() === presetName

            const props = {
                presetName,
                selectCallback: (presetName: string) => {
                    this.props.engineManager.loadPeset(presetName);
                    this.props.closeSelfCallback();
                },
                renameCallback: mng.renamePreset.bind(mng),
                saveToFileCallback: this.saveToFile.bind(this),
                deleteCallback: mng.removePreset.bind(mng)
            }

            return <PresetListItem selected={selected} key={presetName} {...props} />
        })
    }


    loadFromFile(){
        const mng = this.props.engineManager.getStorageManager();
        const fInput = document.createElement("input");
        
        fInput.type = "file";
        fInput.click();

        fInput.onchange = (evt: InputEvent) => {
            const files = (evt.target as HTMLInputElement ).files;
            if(!files || files.length != 1){
                return;
            }

            const file = files[0];
            if(file.type != "application/json"){
                return;
            }

            file.text().then((text) => {
                const preset = JSON.parse(text);
                mng.setCurrentPreset("loaded",preset);
                mng.savePreset();
                // Update preset List.
                this.setState({});
            })
        }
    }

    saveToFile(presetName: string){
        const storage = this.props.engineManager.getStorageManager();
        const previousPreset = storage.getCurrentPresetName();
        storage.selectPreset(presetName);
        const preset = storage.getCurrentPreset();
        storage.selectPreset(previousPreset);

        const blob = new Blob([JSON.stringify(preset)], {type: "text/json"});
        const a = document.createElement("a");

        a.download = "preset.json";
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
    }

}