import { ChangeEvent } from 'react';

import styles from './labeled-selector.module.scss'

type Props = {
  label?: string,
  value: string,
  optionList: string[],
  selectionCallback: (option: string) => void
}

/**
 * Controlled input component.
 */
export function LabeledSelector(props: Props){
  const onSelect = (evt: ChangeEvent<HTMLSelectElement>) => {
    props.selectionCallback(evt.currentTarget.value)
  }

  return (
    <div className={styles["container"]}>

      {
        Boolean(props.label) &&
        <p className={styles["label"]}>{props.label}</p>
      }

      <select className={styles["select-element"]} value={props.value} onInput={onSelect}>
        {
          props.optionList.map(optionString => {
            return <option key={optionString} value={optionString}>{optionString}</option>
          })
        }
      </select>

    </div>
  )
}