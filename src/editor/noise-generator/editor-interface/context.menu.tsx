import { Component, MouseEvent } from "react";
import styles from "./context-menu.module.scss";


export type MenuEntry = { 
    text: string,
    action: (evt: MouseEvent) => void,
    submenu: MenuEntry[]
}


export class ContextMenu extends Component{
    
    props: {
        on: boolean,
        position: { top: number, left: number},
        menuEntries: MenuEntry[]
    }

    constructor(props: any){
        super(props);
    }

    render(){
        const inlineStyles = {
            display: this.props.on ? 'block' : 'none',
            top: this.props.position.top.toString() + "px",
            left: this.props.position.left.toString() + "px"
        }

        return (
            <div 
                className={styles['context-menu']}
                style={inlineStyles}
            >
                {this.buildMenu(this.props.menuEntries)}
            </div>
        )
    }

    buildMenu(menu: MenuEntry[]){
        const entries = menu.map( (entry: MenuEntry, ind: number) => {
            return (
                <li
                    key={ind.toString()}
                    onMouseDown={entry.action}
                >
                    {entry.text}
                    <div>
                        { this.buildMenu(entry.submenu) }
                    </div>
                </li>
            )
        })

        return (
            <ul>
                {entries}
            </ul>
        )
    }

}
