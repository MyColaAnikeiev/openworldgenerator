import { FormEvent, useState } from "react"
import styles from "./labeled-checkbox.module.scss"

type Props = {
    label: string,
    on: boolean,
    switchCallbeck: (on : boolean) => void
}

/**
 * React Component that provides checkbox and label.
 * 
 * props attributes:
 * 
 *  `label` - label to be displayed.
 * 
 *  `on` - spesify initial checkbox state.
 * 
 *  `switchCallbeck` - will be called with `true` when checkbox is checked and `false` when unchecked.
 */
export function LabeledCheckBox(props: Props){
    const [checked, setChecked] = useState(props.on); 

    const onChange = (evt: FormEvent) => {
        const target = evt.target as HTMLInputElement;
        setChecked(target.checked);
        props.switchCallbeck(target.checked);
    }

    return (
        <div className={styles["container"]}>
            <input 
                checked={checked} 
                type="checkbox" 
                //onInput={onInput}
                onChange={onChange}
            />
            <label>{props.label}</label>
        </div>
    )

}