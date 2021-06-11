
import { ModelSymmetry } from 'molstar/lib/mol-model-formats/structure/property/symmetry';
import { Model, ResidueIndex } from 'molstar/lib/mol-model/structure';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { StructureRepresentationRegistry } from 'molstar/lib/mol-repr/structure/registry';
import { ColorTheme } from 'molstar/lib/mol-theme/color';

// export interface ModelInfo {
//     hetResidues: { name: string, indices: ResidueIndex[] }[],
//     assemblies: { id: string, details: string, isPreferred: boolean }[],
//     preferredAssemblyId: string | undefined
// }

// export namespace ModelInfo {
//     async function getPreferredAssembly(ctx: PluginContext, model: Model) {
//         if (model.entryId.length <= 3) return void 0;
//         try {
//             const id = model.entryId.toLowerCase();
//             const src = await ctx.runTask(ctx.fetch({ url: `https://www.ebi.ac.uk/pdbe/api/pdb/entry/summary/${id}` })) as string;
//             const json = JSON.parse(src);
//             const data = json && json[id];

//             const assemblies = data[0] && data[0].assemblies;
//             if (!assemblies || !assemblies.length) return void 0;

//             for (const asm of assemblies) {
//                 if (asm.preferred) {
//                     return asm.assembly_id;
//                 }
//             }
//             return void 0;
//         } catch (e) {
//             console.warn('getPreferredAssembly', e);
//         }
//     }

//     export async function get(ctx: PluginContext, model: Model, checkPreferred: boolean): Promise<ModelInfo> {
//         const { _rowCount: residueCount } = model.atomicHierarchy.residues;
//         const { offsets: residueOffsets } = model.atomicHierarchy.residueAtomSegments;
//         const chainIndex = model.atomicHierarchy.chainAtomSegments.index;
//         // const resn = SP.residue.label_comp_id, entType = SP.entity.type;

//         const pref = checkPreferred
//             ? getPreferredAssembly(ctx, model)
//             : void 0;

//         const hetResidues: ModelInfo['hetResidues'] = [];
//         const hetMap = new Map<string, ModelInfo['hetResidues'][0]>();

//         for (let rI = 0 as ResidueIndex; rI < residueCount; rI++) {
//             const cI = chainIndex[residueOffsets[rI]];
//             const eI = model.atomicHierarchy.index.getEntityFromChain(cI);
//             const entityType = model.entities.data.type.value(eI);
//             if (entityType !== 'non-polymer' && entityType !== 'branched') continue;

//             const comp_id = model.atomicHierarchy.atoms.label_comp_id.value(residueOffsets[rI]);

//             let lig = hetMap.get(comp_id);
//             if (!lig) {
//                 lig = { name: comp_id, indices: [] };
//                 hetResidues.push(lig);
//                 hetMap.set(comp_id, lig);
//             }
//             lig.indices.push(rI);
//         }

//         const preferredAssemblyId = await pref;
//         const symmetry = ModelSymmetry.Provider.get(model);

//         return {
//             hetResidues: hetResidues,
//             assemblies: symmetry ? symmetry.assemblies.map(a => ({ id: a.id, details: a.details, isPreferred: a.id === preferredAssemblyId })) : [],
//             preferredAssemblyId
//         };
//     }
// }

export type SupportedFormats = 'cif' | 'pdb'
export interface LoadParams {
    pdbId: string, 
    format?: SupportedFormats,
    isBinary?: boolean,
    assemblyId?: string,
    representationStyle?: RepresentationStyle
}

export interface RepresentationStyle {
    sequence?: RepresentationStyle.Entry,
    hetGroups?: RepresentationStyle.Entry,
    snfg3d?: { hide?: boolean },
    water?: RepresentationStyle.Entry,
}

export namespace RepresentationStyle {
    export type Entry = { 
        hide?: boolean, 
        kind?: StructureRepresentationRegistry.BuiltIn, 
        coloring?: ColorTheme.BuiltIn }
}

export function pointDistance(a: number[], b: number[]) {
    const x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x * x + y * y + z * z);
}

export function getEdges(flatFacets: number[]){
    // to save only half of all triangles' edges // a bit ugly 
    const edges = new Map<string, number[]>(); 
    for (let i = 0; i < flatFacets.length; i += 3) {
        const sortedIndices = [flatFacets[i+0],flatFacets[i+1],flatFacets[i+2]].sort((a, b) => a - b); // ! numeric sort
        edges.set(`${sortedIndices[0]}-${sortedIndices[1]}`, [sortedIndices[0], sortedIndices[1]])
        edges.set(`${sortedIndices[0]}-${sortedIndices[2]}`, [sortedIndices[0], sortedIndices[2]])
        edges.set(`${sortedIndices[1]}-${sortedIndices[2]}`, [sortedIndices[1], sortedIndices[2]])
    }
    return Array.from(edges.values())  // return vertex pairs
}

export enum ProtrusionVisualLabel {
    NormalCaCb = 'Normal C-α, C-β',
    HydroCaCb = 'Hydrophobic C-α, C-β',
    NormalProtrusion = 'Normal protrusions',
    HydroProtrusion = 'Hydrophobic protrusions',
    ConvexHull = 'Convex Hull'
}


export enum ProtrusionVisualRef {
    NormalCaCb = 'normal-ca-cb',
    HydroCaCb = 'hydro-ca-cb',
    NormalProtrusion = 'normal-protrusions',
    HydroProtrusion = 'hydro-protrusions',
    ConvexHull = 'convex-hull'
}

export enum StateElements {
    Model = 'model',
    ModelProps = 'model-props',
    Assembly = 'assembly',

    VolumeStreaming = 'volume-streaming',

    Sequence = 'sequence',
    SequenceVisual = 'sequence-visual',
    Protrusions = 'protrusions',
    ProtrusionsVisual = 'protrusions-visual',

    Het = 'het',
    HetVisual = 'het-visual',
    Het3DSNFG = 'het-3dsnfg',
    Water = 'water',
    WaterVisual = 'water-visual',    
    HetGroupFocus = 'het-group-focus',
    HetGroupFocusGroup = 'het-group-focus-group',
  
}