import { KeyCommandEvent, KeyCommandListener } from "../types";

type KeyBinding = {
    key: string,
    command: string,
    exclude: string[]
}


const keyBindings: KeyBinding[] = [
    {
        key: 'w', command: 'forward', exclude: ['beckward']
    },
    {
        key: 'arrowup', command: 'forward', exclude: ['beckward']
    },
    {
        key: 's', command: 'beckward', exclude: ['forward']
    },
    {
        key: 'arrowdown', command: 'beckward', exclude: ['forward']
    },
    { 
        key: 'a', command: 'left', exclude: ['right']
    },
    { 
        key: 'arrowleft', command: 'left', exclude: ['right']
    },
    { 
        key: 'd', command: 'right', exclude: ['left']
    },
    { 
        key: 'arrowright', command: 'right', exclude: ['left']
    },
    {
        key: 'shift', command: 'shift', exclude: []
    },
    {
        key: 'u', command: 'up', exclude: ['down']
    },
    {
        key: 'h', command: 'down', exclude: ['up']
    }
];


export class KeyCommandEmiter{

    private keyDownHandler: (evt: KeyboardEvent) => void;
    private keyUpHandler: (evt: KeyboardEvent) => void;

    private handlersAreUsed: boolean = false;

    private keyBindings: KeyBinding[] = keyBindings;
    private activeCommands: KeyBinding[] = [];

    private shiftOn: boolean = false;

    private listeners: KeyCommandListener[] = [];

    constructor(){
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.keyUpHandler = this.handleKeyUp.bind(this);
    }


    public registerListener(listener: KeyCommandListener){
        this.listeners.push(listener);

        if(!this.handlersAreUsed){
            this.mountHandlers();
            this.handlersAreUsed = true;
        }
    }

    public unregisterListener(listener: KeyCommandListener){
        this.listeners = this.listeners.filter(curListener => curListener !== listener);

        if(this.listeners.length === 0){
            this.unmountHandlers();
            this.handlersAreUsed = false;
        }
    }

    public unregisterAllListeners(){
        this.listeners = [];
        
        if(this.handlersAreUsed){
            this.unmountHandlers();
            this.handlersAreUsed = false;
        }
    }

    private mountHandlers(){
        globalThis.window.addEventListener("keydown", this.keyDownHandler);
        globalThis.window.addEventListener("keyup", this.keyUpHandler);
    }

    private unmountHandlers(){
        globalThis.window.removeEventListener("keydown", this.keyDownHandler);
        globalThis.window.removeEventListener("keyup", this.keyUpHandler);
    }

    private handleKeyDown(evt: KeyboardEvent){
        const alreadyActive = this.activeCommands.find(
            binding => binding.key == evt.key.toLowerCase()
        ) 
        if(alreadyActive){
            return;
        }

        const matchedKeyBinding = this.keyBindings.find(keyBinding => keyBinding.key === evt.key.toLowerCase());
        
        if(matchedKeyBinding){
            const commandEvent: KeyCommandEvent = {};

            /* 
             * Some commands are mutualy exclusive so if for ex. command `{ 'left': true }` 
             * was emited and key for 'right' was pressed then `{ 'left': false }` need to be
             * send to cancel it.
             */
            matchedKeyBinding.exclude.forEach(toExclude => {
                const toExcludeIsActive = this.activeCommands.find(binding => binding.command === toExclude);
                
                if(toExcludeIsActive){
                    commandEvent[toExclude] = false;

                    this.activeCommands = this.activeCommands.filter(binding => binding.command !== toExclude);
                }
            })

            commandEvent[matchedKeyBinding.command] = true;

            this.listeners.forEach(listener => listener(commandEvent));

            this.activeCommands.push(matchedKeyBinding);
        }
    }


    private handleKeyUp(evt: KeyboardEvent){
        const match = this.activeCommands
            .find(binding => binding.key == evt.key.toLowerCase())

        if(match){
            const commandToCancel = match.command;

            this.activeCommands = this.activeCommands
                .filter(binding => binding.key != evt.key.toLowerCase());

            const activeDouble = this.activeCommands
                .find(binding => binding.command == commandToCancel);

            /* 
             * See if there aren't any other key left that bind to this command, you generaly
             * don't want to cancel command if only one or more of assigned key to be still down.
             */
            if(!activeDouble){
                const commandEvent: KeyCommandEvent = {
                    [commandToCancel]: false
                }

                this.listeners.forEach(listener => listener(commandEvent));
            }
        }

        
    }

}
