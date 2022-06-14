import { ReactChild, ReactFragment } from "react";
import styles from "./sidebar.module.scss";

type Props = {
    children: ReactChild | ReactChild[]
}

export function Sidebar(props: Props){

    return (
        <div className={styles["side-bar"]}>
            {props.children}
        </div>
    )

}
