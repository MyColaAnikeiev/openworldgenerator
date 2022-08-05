import { AmbientLight, DirectionalLight, Fog, FogBase, FogExp2, Object3D, PMREMGenerator, Scene, Texture, WebGLRenderer } from "three";
import { Camera } from "./objects/cameras/camera";
import { Engine } from "./engine";
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

    private pmremGenerator: PMREMGenerator;

    private resizeHandler: () => void;
    

    constructor(private hostEngine: Engine, private hostElement: HTMLElement, private loader: EngineLoader){
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
        this.sun.position.y = 500;
        this.sun.position.x = 2;
        this.scene.add(this.sun);

        this.ambientLight = new AmbientLight(params.ambientLightColor, params.ambientLightIntensity);
        this.scene.add(this.ambientLight);

        this.fog = null;
        if(params.fogType === "linear"){
            this.fog = new Fog(params.fogColor, params.linearFogNear, params.linearFogFar);
        }
        if(params.fogType === "exponential"){
            this.fog = new FogExp2(params.fogColor, params.exponentialFoxDensity);
        }
        this.scene.fog = this.fog;

        this.hostElement.appendChild(this.renderer.domElement);
    }


    public getEnvironmentMap(): Texture{
        if(!this.pmremGenerator){
            this.pmremGenerator = new PMREMGenerator(this.renderer);
        }

        return this.pmremGenerator.fromScene(this.scene).texture;
    }

    /**
     * Look at which properties was changed and updates scene accordingly.
     */
    public setParams(params: EngineSceneParams){
        if(params.fogType !== undefined && params.fogType !== this.params.fogType){
            const tmpParams = {...this.params, ...params}

            switch(params.fogType){
                case "none":
                    this.fog = null;
                    this.scene.fog = null;
                    break;
                case "linear":
                    this.fog = new Fog(tmpParams.fogColor, tmpParams.linearFogNear, tmpParams.linearFogFar);
                    this.scene.fog = this.fog;
                    break;
                case "exponential":
                    this.fog = new FogExp2(tmpParams.fogColor, tmpParams.exponentialFoxDensity);
                    this.scene.fog = this.fog;
                    break;
            }
        }

        if(params.linearFogNear !== undefined){
            if(this.params.fogType === "linear"){
                (this.fog as Fog).near = params.linearFogNear;
            }
        }

        if(params.linearFogFar !== undefined){
            if(this.params.fogType === "linear"){
                (this.fog as Fog).far = params.linearFogFar;
            }
        }

        if(params.fogColor !== undefined){
            if(this.fog){
                this.fog.color.set(params.fogColor);
            }
        }

        if(params.exponentialFoxDensity !== undefined){
            if(this.params.fogType === "exponential"){
                (this.fog as FogExp2).density = params.exponentialFoxDensity;
            }
        }

        if(params.sceneClearColor !== undefined){
            this.renderer.setClearColor(params.sceneClearColor);
        }

        if(params.ambientLightColor !== undefined){
            this.ambientLight.color.set(params.ambientLightColor);
        }

        if(params.ambientLightIntensity !== undefined){
            this.ambientLight.intensity = params.ambientLightIntensity;
        }

        if(params.sunLightColor !== undefined){
            this.sun.color.set(params.sunLightColor);
        }

        if(params.sunLightIntensity !== undefined){
            this.sun.intensity = params.sunLightIntensity;
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

    /**
     * @param obj - three.js Object3d to be added to scene.
     */
    public addSceneObject(obj: Object3D): void{
        this.scene.add(obj)
    }

    /**
     * 
     * @param obj - three.js Object3d to be removed from scene.
     */
    public removeSceneObject(obj: Object3D): void{
        this.scene.remove(obj)
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

        if(this.pmremGenerator) this.pmremGenerator.dispose()
        this.renderer.dispose()
    }

    private resetSizes(){
        const dim = this.hostElement.getBoundingClientRect();
        const width = dim.right - dim.left;
        const height = dim.bottom - dim.top;

        this.hostEngine.getEngineObjects()?.getCamera().setParams({
            aspect: width / height
        })

        this.renderer.setSize(width, height);
    }
}