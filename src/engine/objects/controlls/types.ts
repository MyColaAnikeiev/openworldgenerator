
export type DragEventListener = (deltaX: number, deltaY: number) => void;

export type KeyCommandEvent = {
    [command: string]: boolean
};

export type KeyCommandListener = (event: KeyCommandEvent) => void;
