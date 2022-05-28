import { AmbientLight, DirectionalLight, Fog, FogBase, FogExp2, Scene, WebGLRenderer } from "three";
import { Camera } from "./cameras/camera";
import { EngineLoader } from "./engine-loader";
import { EngineSceneParams } from "./loader-types";

const defaultParams: EngineSceneParams = {
    fogType: 'linear',
    fogColor: 0xaaaaff,
    linearFogNear : 800,
    linearFogFar : 1700,
    exponentialFoxDensity: 0.001,
    sceneClearColor: 0xaaaaff,
    sceneBackgroundColor: 0xffffff,
    ambientLightIntensity: 0.05,
    ambientLightColor: 0xffffff,
    sunLightIntensity: 0.9,
    sunLightColor: 0xffffaa
}

export class EngineScene{

    private params: EngineSceneParams;

    private renderer: WebGLRenderer;
    private scene: Scene;

    private ambientLight: AmbientLight;
    private sun: DirectionalLight;
    private fog: FogBase;

    private resizeHandler: () => void;
    

    constructor(private hostElement: HTMLElement, private loader: EngineLoader){
        this.params = {...defaultParams, ...loader.getEngineSceneParams()};

        this.init();

        this.resizeHandler = this.resetSizes.bind(this);
        globalThis.window.addEventListener("resize", this.resizeHandler);
        this.resetSizes();
    }

    private init(){
        const {params} = this;

        this.renderer = new WebGLRenderer();
        this.scene = new Scene();

        this.renderer.setClearColor(params.sceneClearColor);

        this.sun = new DirectionalLight(params.sunLightColor,params.sunLightIntensity);
        this.sun.position.y = 20;
        this.sun.position.x = 2;
        this.scene.add(this.sun);

        this.ambientLight = new AmbientLight(params.ambientLightColor, params.ambientLightIntensity);
        this.scene.add(this.ambientLight);

        this.fog = null;
        if(params.fogType === "linear"){
            this.fog = new Fog(params.fogColor, params.linearFogNear, params.linearFogFar);
        }
        if(params.fogType === "exponantial"){
            this.fog = new FogExp2(params.fogColor, params.exponentialFoxDensity);
        }
        this.scene.fog = this.fog;

        this.hostElement.appendChild(this.renderer.domElement);
    }


    /**
     * Look at which properties was changed and updates scene accordingly.
     */
    public setParams(params: EngineSceneParams){
        if(this.params.linearFogNear !== params.linearFogNear){
            if(this.params.fogType === "linear"){
                const fog = <Fog>this.fog;
                fog.near = params.linearFogNear;
            }
        }
        if(this.params.linearFogFar !== params.linearFogFar){
            if(this.params.fogType === "linear"){
                const fog = <Fog>this.fog;
                fog.far = params.linearFogFar;
            }
        }

        /* And so on ... */

        this.params = Object.assign(this.params, params);
    }

    public getParams(): EngineSceneParams{
        return {...this.params};
    }

    /**
     * 
     * @returns a Thee.js scene object.
     */
    public getScene(): Scene{
        return this.scene;
    }


    public getRenderingCanvas(): HTMLCanvasElement{
        return this.renderer.domElement;
    }

    /**
     * Will move rendering canvas to new parent.
     */
    public changeHostElement(element: HTMLElement): void{
        this.hostElement.removeChild(this.getRenderingCanvas());
        this.hostElement = element;
        element.appendChild(this.getRenderingCanvas());

        this.resetSizes();
    }

    public render(camera: Camera){
        this.renderer.render(this.scene, camera.getCamera());
    }

    /** Free resources. */
    public dispose(){
        this.hostElement.removeChild(this.renderer.domElement);
        globalThis.window.removeEventListener("resize", this.resizeHandler);

        this.scene.remove(this.ambientLight);
        this.scene.remove(this.sun);
        this.ambientLight.dispose();
        this.sun.dispose();

        this.renderer.dispose();
    }

    private resetSizes(){
        const dim = this.hostElement.getBoundingClientRect();
        const width = dim.right - dim.left;
        const height = dim.bottom - dim.top;

        this.renderer.setSize(width, height);
    }
}