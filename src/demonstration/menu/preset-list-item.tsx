import { Component, FormEvent } from "react";

import styles from "./preset-list-item.module.scss";

type Props = {
    presetName: string,
    selectCallback: (name: string) => void,
    renameCallback: (oldName: string, newName: string) => void,
    deleteCallback: (name: string) => void,
    saveToFileCallback: (name: string) => void
}

export class PresetListItem extends Component{

    props: Props;

    state: {
        deleted: boolean,
        name: string,
        inputName: string,
        edit: boolean
    }

    constructor(props: Props){
        super(props);

        this.state = {
            deleted: false,
            name: props.presetName,
            inputName: props.presetName,
            edit: false
        }
    }

    render(){
        if(this.state.deleted){
            return null;
        }

        const select = () => this.props.selectCallback(this.state.name);
        const rename = () => this.setState({edit: true});
        const saveToFile = () => this.props.saveToFileCallback(this.state.name)
        const del = () => {
            this.props.deleteCallback(this.state.name);
            this.setState({deleted: true});
        }

        const nameChange = (evt: FormEvent) => {
            this.setState({ inputName: (evt.target as HTMLInputElement).value });
        }
        const update = () => {
            this.props.renameCallback(this.state.name, this.state.inputName);
            this.setState({name: this.state.inputName, edit: false});
        }

        return (
            <div className={styles["preset"]}>
                {
                  this.state.edit === false && <>
                    <div className={styles["title"]} onClick={select}>{this.state.name}</div>
                    <div className={styles["btn"]} onClick={rename}>Rename</div>
                    <div className={styles["btn"]} onClick={saveToFile}>Save to file</div>
                    <div className={styles["btn"]} onClick={del}>Del</div>
                  </>
                }
                {
                  this.state.edit === true && <>
                    <input type="text" value={this.state.inputName} onInput={nameChange} />
                    <div className={styles["btn"]} onClick={update}>Ok</div>
                  </>
                }

            </div>
        )
    }

}