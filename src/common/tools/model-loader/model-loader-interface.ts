import { Object3D } from "three";

export type FinishCallback = (models: (Object3D | null)[]) => void;
export type ErrorCallback = (errURL: string, errMessage: string) => void;

/**
 * Async model loading INTERFACE. 
 */
export interface ModelLoaderI{
    
    /**
     * @param sources {string[]} list of URLs of models that you want to 
     * load.
     * @param finishCallback is called when `sources` list is resolved ( each 
     * model is whether seccessfully loaded or failed to do so). This callback
     * will recieve as first argument an array of results for each `sources` 
     * URL that is effectively is mapping from URL to loaded three.js object in 
     * case when load succeeds or to null when such load is failed.
     * @param onErrorCallback if provided, then on each model request fail, 
     * this callback will be called with it's URL and brief error message.
     * 
     * Note: 
     *  1) do not dispose of models yourself. Use `disposeOf` or `dispose` 
     * methods instead.
     * 
     *  2) When one or more or even all models is failed to be retrived, 
     * `finishCallback` passed to {@link requestModels} will still be called
     * but with `null` instead of three.js model object, at corresponding array
     * index.
     * 
     *  3) Each successfully loaded model should be cached.
     */
    requestModels(
        sources: string[], 
        finishCallback?: FinishCallback,
        onErrorCallback?: ErrorCallback    
    ): void;

    /**
     * Returns list of cached models URLs.
     */
    getListOfLoadedModels(): string[];

    /**
     * Returns three.js model retrived from cache if present, or `null` if not.
     * 
     * @param url model source URL.
     */
    getModel(url: string): Object3D | null;

    /**
     * Take one or more model URL source strings, where each provided string 
     * will be used as a key for model to be desposed of.
     */
    disposeOf(...URLs: string[]): void;

    /**
     * Disposes of all stored models. 
     */
    dispose(): void;
}
