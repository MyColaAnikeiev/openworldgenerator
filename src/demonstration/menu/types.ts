
/**
 * Privides a description of menu entry in `MenuList` component.
 * When user click on entry or if number of seconds specified by `timeout` 
 * had passed, function specified by `action` property will be called.
 * Pass `null` as `timeout` property and not `0`, unless you want it to triger 
 * action instantly.
 */
export type MenuListEntry = {
    text: string,
    action: () => void,
    timeout: null | number
}