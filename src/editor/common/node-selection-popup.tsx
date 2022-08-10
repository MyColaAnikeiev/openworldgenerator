import { NodeTreeBuilder } from '../../generator/node-tree-generator'
import { NodeArea } from '../noise-generator/node-area'
import styles from './node-selection-popup.module.scss'

type Props = {
  goBackCallback: () => void,
  nodeTree: NodeTreeBuilder,
  selectionCallback: (nodeId: number) => void
}

export function NodeSelectionPopup(props: Props){
  return (
    <div className={styles["node-selection-popup"]}>
    <div className={styles["top"]}>
        <span>Select source node.</span>
        <button onClick={props.goBackCallback}>Cancel</button>    
    </div>
    <div className={styles["node-area-container"]}>
        <NodeArea
            nodeTreeBuilder={props.nodeTree} 
            selectionMode={true}
            selectionCallback={props.selectionCallback}
        />
    </div>
</div>
  )
}