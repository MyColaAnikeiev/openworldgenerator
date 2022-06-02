import { Component } from "react";

import styles from './menu-list.module.scss';
import { MenuListEntry } from "./types";


type Props = {
    children: MenuListEntry[]
}

/**
 * Displays menu, entries of which is described by `MenuListEntry[]` array.
 * `MenuListEntry[]` is provided through `children` property.
 */
export class MenuList extends Component{
    
    props: Props;

    timeoutId: ReturnType<typeof setTimeout> = null;
    actionFired: boolean = false;

    state: {
        time: number
    }

    constructor(props: Props){
        super(props);
        
        this.state = {
            time: 0
        }
    }
    
    render(){
        return( 
            <div className={styles["main-menu-body"]}> 
                {this.getMenuEntries()} 
            </div>
        )
    }

    setTimeoutClock(){
        if(this.timeoutId !== null){
            return;
        }

        const clock = () => {
            this.setState({time: this.state.time + 1});

            this.timeoutId = setTimeout(clock, 1000);
        }

        this.timeoutId = setTimeout(clock, 1000);
    }

    getMenuEntries(){
        return this.props.children.map(entry => {
            this.checkForTimoutAction(entry);

            const click = () => {
                if(this.timeoutId !== null){
                    clearTimeout(this.timeoutId);
                }
                
                entry.action();
            }

            return (
                <div onClick={click} key={entry.text} className={styles["main-menu-entry"]} >

                    <span className={styles["text"]}>{entry.text}</span>

                    { 
                        entry.timeout !== null 
                        && 
                        <span className={styles["timeout"]}>({entry.timeout - this.state.time})</span> 
                    }

                </div>
            )
        })
    }

    checkForTimoutAction(entry: MenuListEntry){
        if(entry.timeout !== null && !this.actionFired){
                
            if(this.timeoutId === null){
              this.setTimeoutClock();
            }

            // Trigger action when entry.timeout seconds have passed.
            if(this.state.time >= entry.timeout){
                entry.action();
                this.actionFired = true;
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
          }
    }

    componentWillUnmount(){
        if(this.timeoutId !== null){
            clearTimeout(this.timeoutId);
        }
    }
}