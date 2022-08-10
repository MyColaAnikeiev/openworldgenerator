import { useState } from "react"
import styles from "./dropdown-menu.module.scss"
import { DropdownMenuEntry } from "./types"

type Props = {
    children: DropdownMenuEntry[]
}

export function DropdownMenu(props: Props){
    const [displayMenu, setDisplay] = useState(false);

    const toggle = () => {
        setDisplay(!displayMenu);
    }

    let menuClassName = styles["menu"];
    let listClassName = styles["menu-list"];
    if(displayMenu){
        menuClassName += " " + styles["on"];
        listClassName += " " + styles["display"];
    }

    return (
        <div onClick={toggle} className={menuClassName}>
            <span className={styles["title"]}>menu</span>

            <div className={listClassName}>
                {
                    props.children.map(entry => {
                        return (
                            <div key={entry.text} onClick={entry.action} className={styles["menu-entry"]}>
                                {entry.text}
                            </div>
                        )
                    })
                }
            </div>

        </div>
    )
}