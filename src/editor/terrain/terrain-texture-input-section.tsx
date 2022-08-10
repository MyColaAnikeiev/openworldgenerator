import { Component, FormEvent, FormEventHandler, ReactElement } from "react";
import { debounceTime, filter, Subject, tap } from "rxjs";
import { TerrainManager } from "../../engine/terrain-manager";
import { LoadingTextAnimation } from "./loading-text-animation";
import styles from "./terrain-texture-input-section.module.scss";

enum Status{
    empty,
    pending,
    loaded,
    failed
}

type Props = {
    manager: TerrainManager
}

type State = {
    textureSrc: string,
    status: Status
}

export class TerrainTextureInputSection extends Component{
    
    props: Props;
    state: State;

    inputSubject: Subject<string> = new Subject();

    inputHandler: FormEventHandler;

    constructor(props: Props){
        super(props);

        this.state = {
            textureSrc: props.manager.getParams().planeTextureMapSrc,
            status: Status.empty
        }

        this.inputHandler = this.handleInput.bind(this);
    }

    componentDidMount(): void {
        this.inputSubject.pipe(
            tap((url) => {
                this.setState({textureSrc: url})
                if(!url && this.state.status !== Status.pending){
                    this.setState({status: Status.empty})
                }
            }),
            debounceTime(1000)
        )
        .subscribe(src => {
            if(!src){
                this.props.manager.setParams({planeTextureMapSrc: ""});
                return;
            }

            this.props.manager.loadTextureFromSrc(src, (loaded) => {
                if(loaded){
                    this.setState({status: Status.loaded})
                }else{
                    this.setState({status: Status.failed})
                }
            })

            this.setState({status: Status.pending})
        })

        if(this.state.textureSrc){
            this.inputSubject.next(this.state.textureSrc);
        }
    }

    handleInput(evt: FormEvent): void{
        const url = (evt.target as HTMLInputElement).value;
        this.inputSubject.next(url);
    }
    
    render(): ReactElement{
        this.props.manager

        return (
            <div className={styles["terrain-texture-input"]}>
                {
                    this.state.status === Status.pending 
                    ? <LoadingTextAnimation />
                    : <p className={styles["title"]}>Terrain texture</p>
                }

                <div className={styles["url-input"]}>
                    <label>Paste URL:</label>
                    <input 
                        value={this.state.textureSrc} 
                        type="text" 
                        onInput={this.inputHandler}
                    />
                    <button onClick={() => this.inputSubject.next("")}>Clear</button>
                </div>

                {
                    this.state.status === Status.failed
                        &&
                    <div className={styles["error-msg"]}>
                        Failed to fetch image. Check if url is correct or make sure site hosting this image allows it's usage by other sites.
                    </div>
                }

                {
                    this.state.status === Status.loaded 
                        &&
                    <div className={styles["preview"]}>
                        <img src={this.state.textureSrc} />
                    </div>
                }

            </div>
        )
    }

    componentWillUnmount(): void {
        this.inputSubject.complete();
    }

}