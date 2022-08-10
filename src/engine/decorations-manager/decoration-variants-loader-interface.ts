import { DecorationVariant } from "../chunk-manager/types";
import { DecorationVariantParams } from "../loader-types";

/**
 * INTERFACE for tools for loading and preprocessing models into 
 * DecorationVariants asyncronously.
 */
export interface DecorationVariantsLoaderI{

  /**
   * Note: Returned `DecorationVariant[]` needs to be disposed of when no 
   * longer needed by using {@link disposeOfDecorationVariants} method.
   * 
   * Return preprocesed model in a form that `{@link DecorationsChunkManager}`
   * is requiring, together with applied parameters and transformations 
   * specified by `DecorationVariantParams`.
   */
  loadDecorationVariants(params: DecorationVariantParams[]): Promise<DecorationVariant[]>;
  
  /**
   * Method for safe disposal of `DecorationVariant`'s objects obtained by 
   * using {@link loadDecorationVariants}.
   */
  disposeOfDecorationVariants(decorationVariants: DecorationVariant[]): void;

}