
import { ChangeEvent, useState } from "react";
import styles from "./radio-group.module.scss";

type Props = {
    title: string,
    selected: string,
    children: Array<{ text: string, value: string}>
    changeCallback: (value: string) => void
}


/**
 * React component that displays and handles array of radio inputs.
 * 
 * props attributes:
 * 
 *  `title` - displayed at top, to indicate what this group of radio inputs is all about.
 * 
 *  `selected` - specify value of radio input that initially will be selected.
 * 
 *  `children` - is array of objects, used to describe radio inputs, with two 
 *  properties: `text` is displayed label of current radio input, and `value` is radio 
 *  input value attribute with which `changeCallback` with be called when this exact 
 *  input is selected.
 * 
 *  `changeCallback` - function to be called on each radio input selection with their corresponding
 *   value.
 */
export function RadioGroup(prop: Props){
    const [selected, setSelected] = useState(prop.selected);

    const handleChange = (evt: ChangeEvent) => {
        const trg = evt.target as HTMLInputElement;
        setSelected(trg.value);
        prop.changeCallback(trg.value);
    }
    
    return (
        <div className={styles["container"]}>
            <div className={styles["title"]}>
                {prop.title}
            </div>

            {
                prop.children.map(radio => {
                    return (
                        <div key={radio.text} className={styles["radio"]}>
                            <input 
                                type="radio" 
                                value={radio.value}
                                checked={radio.value === selected}
                                onChange={handleChange}
                            />
                            <label>{ radio.text }</label>
                        </div>
                    )
                })
            }

        </div>
    )
}