import { createPlugin } from "molstar/lib/mol-plugin-ui";
import { AnimateCameraSpin } from 'molstar/lib/mol-plugin-state/animation/built-in/camera-spin';
import { createStructureRepresentationParams } from 'molstar/lib/mol-plugin-state/helpers/structure-representation-params';
import { PluginStateObject, PluginStateObject as PSO } from 'molstar/lib/mol-plugin-state/objects';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { PluginState } from 'molstar/lib/mol-plugin/state';
import {GeometryExport } from 'molstar/lib/extensions/geo-export'

import { StateBuilder, StateObject, StateObjectCell, StateSelection, StateTransformer } from 'molstar/lib/mol-state';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { getEdges, LoadParams, pointDistance, ProtrusionVisualLabel, RepresentationStyle, StateElements, SupportedFormats } from './helpers';
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { Script } from "molstar/lib/mol-script/script";
import { StructureSelection } from "molstar/lib/mol-model/structure/query";
import { ColorNames } from "molstar/lib/mol-util/color/names";
import { OrderedSet, Segmentation } from "molstar/lib/mol-data/int";
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { DefaultPluginUISpec, PluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { ResidueSet } from 'molstar/lib/mol-model/structure/model/properties/utils/residue-set';
import { Location } from "molstar/lib/mol-model/structure/structure/element/location";
import { StructureQueryHelper } from "molstar/lib/mol-plugin-state/helpers/structure-query";
import { ElementIndex, Structure, StructureElement, StructureProperties, Unit } from "molstar/lib/mol-model/structure";
import { StateTransformParameters } from "molstar/lib/mol-plugin-ui/state/common";
import { elementLabel } from 'molstar/lib/mol-theme/label';

import qh from 'quickhull3d';

import { ProtrusionVisualRef } from './helpers'
import { CreateSphere } from "./protrusion";
import { CreateConvexHull } from "./convexhull";
import { PluginSpec } from "molstar/lib/mol-plugin/spec";

export const LOW_DENSITY_THRESHOLD = 22;
export const DISTANCE_CUTOFF = 10;  // 1 nm
export const HYDROPHOBICS = ['LEU', 'ILE', 'PHE', 'TYR', 'TRP', 'CYS', 'MET'];

const URL_BCIF = (pdbId: string) => 'https://www.ebi.ac.uk/pdbe/entry-files/download/' + pdbId + '.bcif'
// const URL_CIF = (pdbId: string) => 'https://www.ebi.ac.uk/pdbe/entry-files/download/' + pdbId + '.cif'
const URL_PDB = (pdbId: string) => 'https://www.ebi.ac.uk/pdbe/entry-files/download/pdb' + pdbId + '.ent'


type CaCbSelectionParam = {
    chains: string [] | 'ALL';
    residues: string[] | 'ALL';
    atomNames: 'CA' | 'CB' | 'BOTH';
}

type AtomGroupInfo = {   
    id: number,
    name: string,
    resName: string,
    resId: number,
    chain: string,
    coordinate: number[],
    atomLabel: string,
}

export class MolStarWrapper {
   
    private defaultSpec: PluginUISpec; 
    private protrusionInitFlag: boolean; 
    plugin: PluginUIContext;
    
    representationStyle: RepresentationStyle = {
        sequence: {},  //{ coloring: 'proteopedia-custom' }, // or just { }
        hetGroups: {hide: true, kind: 'ball-and-stick' }, // or 'spacefill
        water: { hide: true },
        snfg3d: { hide: true },
    };
    
    private loadedParams: LoadParams = { pdbId: '', format: 'pdb', isBinary: false, assemblyId: '' };
    
    constructor(){        
        this.defaultSpec = {
            ...DefaultPluginUISpec(),
            animations: [
                // AnimateModelIndex, 
                AnimateCameraSpin,
            ],
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false,
                    controlsDisplay: 'reactive',
                    regionState: {
                        left: "collapsed",
                        top: "full",
                        right: "full",
                        bottom: "hidden",
                    }
                },
            },
            behaviors:[ PluginSpec.Behavior(GeometryExport) ],
            components: {
                remoteState: 'none', //remote server 
            },
            config: [
                [PluginConfig.Viewport.ShowAnimation, false],
                [PluginConfig.VolumeStreaming.Enabled, false],  //remove volume streaming 
            ]
        }

        this.plugin = new PluginUIContext(this.defaultSpec);
        this.protrusionInitFlag = false;
    }

    // call to bind HTMLElement
    init(targetId: string, options?: {
        customColorList?: number[]
    }) {
        this.plugin = createPlugin(document.getElementById(targetId)!, this.defaultSpec);

        // const customColoring = createProteopediaCustomTheme((options && options.customColorList) || []);
        // this.plugin.representation.structure.themes.colorThemeRegistry.add(customColoring);
        // this.plugin.representation.structure.themes.colorThemeRegistry.add(EvolutionaryConservation.colorThemeProvider!);
        // this.plugin.managers.lociLabels.addProvider(EvolutionaryConservation.labelProvider!);
        // this.plugin.customModelProperties.register(EvolutionaryConservation.propertyProvider, true);
    }

    // call to load a structure
    async load({pdbId, format = 'pdb', isBinary = false, assemblyId = ''}: LoadParams) {
        let url = format == 'pdb'? URL_PDB(pdbId): URL_BCIF(pdbId);
        const state = this.plugin!.state.data;

        if (this.loadedParams.pdbId !== pdbId || this.loadedParams.format !== format) {
            // remove current whole tree
            await PluginCommands.State.RemoveObject(this.plugin, { state, ref: state.tree.root.ref });
            const modelTree = this.model(this.download(state.build().toRoot(), url, isBinary, pdbId.toUpperCase()), format);
            await this.applyState(modelTree);                
            const structureTree = this.structure(assemblyId);
            await this.applyState(structureTree);
        } 

        await this.updateStyle(this.representationStyle);  // show the model
        // const model = this.getObj<PluginStateObject.Molecule.Model>('model');
        this.loadedParams = { pdbId, format, assemblyId };
        this.protrusionInitFlag = false;  // reload 
    }

    
    async loadFile(file:File, isBinary = false, assemblyId = '') {
        const state = this.plugin!.state.data;
        const format = file.name.endsWith('.cif')? 'cif':'pdb';
        
        // remove current whole tree
        await PluginCommands.State.RemoveObject(this.plugin, { state, ref: state.tree.root.ref });
        const modelTree = this.model(this.openFile(state.build().toRoot(), file, isBinary), format);
        await this.applyState(modelTree);
        const structureTree = this.structure(assemblyId);
        await this.applyState(structureTree);

        await this.updateStyle(this.representationStyle);  // show the model
        const model = this.getObj<PluginStateObject.Molecule.Model>('model');

        // this.loadedParams = { pdbId: file.name, format, assemblyId };
        this.protrusionInitFlag = false;
    }

    private openFile(b: StateBuilder.To<PSO.Root>, file: File, isBinary: boolean){        
        return b.apply(StateTransforms.Data.ReadFile , { file: Asset.File(file) , isBinary });
    }

    private download(b: StateBuilder.To<PSO.Root>, url: string, isBinary: boolean, label?: string) {
        // StateTransforms.Data.ReadFile
        return b.apply(StateTransforms.Data.Download, { url: Asset.Url(url), label: label, isBinary });
    }


    private model(b: StateBuilder.To<PSO.Data.Binary | PSO.Data.String>, format: SupportedFormats) {
        //  ???
        const parsed = format === 'cif'
            ? b.apply(StateTransforms.Data.ParseCif).apply(StateTransforms.Model.TrajectoryFromMmCif)
            : b.apply(StateTransforms.Model.TrajectoryFromPDB);

        return parsed
            .apply(StateTransforms.Model.ModelFromTrajectory, { modelIndex: 0 }, { ref: StateElements.Model });
    }

    private applyState(tree: StateBuilder) {
        return PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree });
    }


    get state() {
        return this.plugin.state.data;
    }

    private getObj<T extends StateObject>(ref: string): T['data'] {
        const state = this.state;
        const cell = state.select(ref)[0];
        if (!cell || !cell.obj) return void 0;
        return (cell.obj as T).data;
    }


    private visual(_style?: RepresentationStyle, partial?: boolean) {
        // check if structure exists 
        const structure = this.getObj<PluginStateObject.Molecule.Structure>(StateElements.Assembly);
        if (!structure) return;

        const style = _style || { };
        const update = this.state.build();

        if (!partial || (partial && style.sequence)) {
            const root = update.to(StateElements.Sequence);
            if (style.sequence && style.sequence.hide) {
                root.delete(StateElements.SequenceVisual);
            } else {
                root.applyOrUpdate(StateElements.SequenceVisual, StateTransforms.Representation.StructureRepresentation3D,
                    createStructureRepresentationParams(this.plugin, structure, {
                        type: (style.sequence && style.sequence.kind) || 'cartoon',
                        color: (style.sequence && style.sequence.coloring) || 'unit-index'
                    }));
            }
        }

        if (!partial || (partial && style.hetGroups)) {
            const root = update.to(StateElements.Het);
            if (style.hetGroups && style.hetGroups.hide) {
                root.delete(StateElements.HetVisual);
            } else {
                if (style.hetGroups && style.hetGroups.hide) {
                    root.delete(StateElements.HetVisual);
                } else {
                    root.applyOrUpdate(StateElements.HetVisual, StateTransforms.Representation.StructureRepresentation3D,
                        createStructureRepresentationParams(this.plugin, structure, {
                            type: (style.hetGroups && style.hetGroups.kind) || 'ball-and-stick',
                            color: style.hetGroups && style.hetGroups.coloring
                        }));
                }
            }
        }

        if (!partial || (partial && style.snfg3d)) {
            const root = update.to(StateElements.Het);
            if (style.hetGroups && style.hetGroups.hide) {
                root.delete(StateElements.HetVisual);
            } else {
                if (style.snfg3d && style.snfg3d.hide) {
                    root.delete(StateElements.Het3DSNFG);
                } else {
                    root.applyOrUpdate(StateElements.Het3DSNFG, StateTransforms.Representation.StructureRepresentation3D,
                        createStructureRepresentationParams(this.plugin, structure, { type: 'carbohydrate' }));
                }
            }
        }

        if (!partial || (partial && style.water)) {
            const root = update.to(StateElements.Water);
            if (style.water && style.water.hide) {
                root.delete(StateElements.WaterVisual);
            } else {
                root.applyOrUpdate(StateElements.WaterVisual, StateTransforms.Representation.StructureRepresentation3D,
                    createStructureRepresentationParams(this.plugin, structure, {
                        type: (style.water && style.water.kind) || 'ball-and-stick',
                        typeParams: { alpha: 0.51 },
                        color: style.water && style.water.coloring
                    }));
            }
        }

        return update;
    }

   
    async updateStyle(style?: RepresentationStyle, partial?: boolean) {
        const tree = this.visual(style, partial);
        if (!tree) return;
        await PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree });
    }

    
    selectAtomicElement(caCbstructure: Structure, selParm: CaCbSelectionParam) {
        // Note: assume
        const l = StructureElement.Location.create<Unit.Atomic>(caCbstructure);      

        let atomInfoArray: AtomGroupInfo[] = [];

        if(selParm.chains != 'ALL' && selParm.chains.length == 0) return atomInfoArray  ;  // selParm.chains = []
        if(selParm.residues != 'ALL' && selParm.residues.length == 0) return atomInfoArray ;  // selParm.residues = []

        for (const unit of caCbstructure.units) {
            if (unit.kind !== Unit.Kind.Atomic) continue;

            l.unit = unit;

            const { elements } = unit;
            const chainsIt = Segmentation.transientSegments(unit.model.atomicHierarchy.chainAtomSegments, elements);
            const residuesIt = Segmentation.transientSegments(unit.model.atomicHierarchy.residueAtomSegments, elements);
           
            while (chainsIt.hasNext) {
                const chainSegment = chainsIt.move();                                
                l.element = elements[chainSegment.start];  
                const chainName = StructureProperties.chain.label_asym_id(l);
                if (selParm.chains == 'ALL' || selParm.chains.includes(chainName)){                    
                    residuesIt.setSegment(chainSegment);
                    while (residuesIt.hasNext) {
                        const residueSegment = residuesIt.move();
                        l.element = elements[residueSegment.start];
                        const resId = StructureProperties.residue.label_seq_id(l);

                        for (let j = residueSegment.start, _j = residueSegment.end; j < _j; j++) {
                            l.element = elements[j];
                            const resName = StructureProperties.atom.label_comp_id(l);
                            const atomName = StructureProperties.atom.label_atom_id(l);
                            
                            if(selParm.residues == 'ALL' || selParm.residues.includes(resName)){
                                if(selParm.atomNames == 'BOTH' || selParm.atomNames == atomName){
                                    
                                    //select only one CB when there are multiple
                                    const alt_id = StructureProperties.atom.label_alt_id(l);
                                    if(selParm.atomNames != 'CA' && alt_id != "" && alt_id != 'A')
                                        continue 

                                    const i = l.element  // global unique 
                                    const coordinate = [ 
                                        l.unit.conformation.coordinates.x[i],
                                        l.unit.conformation.coordinates.y[i],
                                        l.unit.conformation.coordinates.z[i]
                                    ];

                                    atomInfoArray.push({
                                        id: i,
                                        name: atomName,
                                        resName: resName,
                                        resId: resId,
                                        chain: chainName,
                                        coordinate: coordinate,
                                        atomLabel: elementLabel(l, { granularity: 'element' })
                                    });
                                }                                                                               
                            }                                               
                        } // residue               
                    }             
                } // chain   
            }        
        }
        return atomInfoArray;
    }

    private calculateProtrusion(){
        const data = this.plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
        if (!data) return;

        //select all CA and CB atoms from the protein
        const selectionCaCb = Script.getStructureSelection(Q => Q.struct.generator.atomGroups({            
            'atom-test':    Q.core.logic.and([
                                Q.core.logic.not([Q.ammp('isHet')]), 
                                Q.core.logic.or([
                                        Q.core.rel.eq(['CA', Q.ammp('label_atom_id')]),  
                                        Q.core.rel.eq(['CB', Q.ammp('label_atom_id')])
                                ])
                            ]),                                      
            }), data);        

        // const loci = StructureSelection.toLociWithSourceUnits(selectionCaCb);

        // convert the selected atoms into an AtomInfo array
        const caCbAtomArray = this.selectAtomicElement(StructureSelection.unionStructure(selectionCaCb), 
            {chains: 'ALL', residues: 'ALL', atomNames: 'BOTH'} )
        
        // console.log(`selected ${caCbAtomArray.length} Ca Cb atoms`);
        
        // calculate convec hull
        console.time('calculating convex hull');
        const convexHullFaces = qh(caCbAtomArray.map(a => a.coordinate));
        console.timeEnd('calculating convex hull');

        // identify (hydrophobic) protrusions
        const vertexIndices = new Set<number>(convexHullFaces.flat());
        console.log(`convex hull info: faces ${convexHullFaces.length}, vertices ${vertexIndices.size}`);
       
        const cbIndices =  caCbAtomArray.filter(a => a.name == 'CB').map(a => a.id)
        const hydroCbIndices = caCbAtomArray.filter(a => HYDROPHOBICS.includes(a.resName) && a.name == 'CB').map(a => a.id)

        const protrusionCbAtomInfoArray: AtomGroupInfo[] = [];
        const hydroProtrusionCbAtomInfoArray: AtomGroupInfo[] = [];
       
        vertexIndices.forEach(i => {
            if(cbIndices.includes(caCbAtomArray[i].id)){ // find a Cb vertex
                let neiborCount = 0;
                for(let j=0; j< caCbAtomArray.length; j++){
                    if(i != j && pointDistance(caCbAtomArray[i].coordinate, caCbAtomArray[j].coordinate) < DISTANCE_CUTOFF )
                        neiborCount += 1;
                }
                if(neiborCount < LOW_DENSITY_THRESHOLD){  
                    protrusionCbAtomInfoArray.push(caCbAtomArray[i])                                     
                    if(hydroCbIndices.includes(caCbAtomArray[i].id)){ // hydrophobic protusion
                        hydroProtrusionCbAtomInfoArray.push(caCbAtomArray[i])
                    }
                }
            }            
        })

        return {
            normalCaCbAtomInfoArray: caCbAtomArray,
            hydroCaCbAtomInfoArray: caCbAtomArray.filter(a => HYDROPHOBICS.includes(a.resName)),
            protrusionCbAtomInfoArray: protrusionCbAtomInfoArray,
            hydroProtrusionCbAtomInfoArray: hydroProtrusionCbAtomInfoArray,
            convexHullFaces: convexHullFaces
         }
    }

   

    private async initProtrusion(){
        const protrusionData = this.calculateProtrusion()!;
        const edgePairs: number[][] = getEdges(protrusionData.convexHullFaces.flat()) //! indices in convex hull, not atom indices
        
        // calculate co-insertables 
        const edgePairAtomId = edgePairs.map((pair: number[])=> 
            // map convex hull vertex id to atom id, as string 
            `${protrusionData.normalCaCbAtomInfoArray[pair[0]].id}-${protrusionData.normalCaCbAtomInfoArray[pair[1]].id}`);
        let coinsertables: number[] = []
        let coinsertableLabels: string[] = []
        for(let i=0; i < protrusionData.hydroProtrusionCbAtomInfoArray.length; i++){
            const resICb = protrusionData.hydroProtrusionCbAtomInfoArray[i];
            const resICa = protrusionData.hydroCaCbAtomInfoArray.find( a =>
                a.chain == resICb.chain && a.resId == resICb.resId && a.name == 'CA' )!
            for(let j=i+1; j< protrusionData.hydroProtrusionCbAtomInfoArray.length; j++){
                const resJCb = protrusionData.hydroProtrusionCbAtomInfoArray[j];  
                const resJCa = protrusionData.hydroCaCbAtomInfoArray.find( a =>
                    a.chain == resJCb.chain && a.resId == resJCb.resId && a.name == 'CA' )!
                resPairLoop:
                for (let atomI of [resICb, resICa]){  // CB is preferred
                    for(let atomJ of [resJCb, resJCa]){
                        if(edgePairAtomId.includes(`${atomI.id}-${atomJ.id}`) || 
                           edgePairAtomId.includes(`${atomJ.id}-${atomI.id}`)) {
                            coinsertables.push(...atomI.coordinate, ...atomJ.coordinate);
                            coinsertableLabels.push(atomI.atomLabel, atomJ.atomLabel);
                            break resPairLoop
                        }   
                    }
                }          
            }   
        }

        // hydrophobic Ca, Cb: small, orange
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.HydroCaCb, CreateSphere, {
            centers: protrusionData.hydroCaCbAtomInfoArray.map(a => a.coordinate).flat(),  
            centersLabel: protrusionData.hydroCaCbAtomInfoArray.map(a => a.atomLabel),
            radius: 0.5,
            sphereColor: ColorNames.orange,
            stateLabel: ProtrusionVisualLabel.HydroCaCb
        }).commit();

        // normal Ca Cb: small, gray
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.NormalCaCb, CreateSphere, {
            centers:  protrusionData.normalCaCbAtomInfoArray.map(a => a.coordinate).flat(),  
            centersLabel: protrusionData.normalCaCbAtomInfoArray.map(a => a.atomLabel),
            radius: 0.4,
            sphereColor: ColorNames.gray,
            stateLabel: ProtrusionVisualLabel.NormalCaCb
        }).commit();

        // hydrophobe vertex: large, orange
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.HydroProtrusion, CreateSphere, {
            centers: protrusionData.hydroProtrusionCbAtomInfoArray.map(a => a.coordinate).flat(),  
            centersLabel: protrusionData.hydroProtrusionCbAtomInfoArray.map(a => a.atomLabel),
            radius:2,
            sphereColor: ColorNames.orange,
            stateLabel: ProtrusionVisualLabel.HydroProtrusion,
            coinsertables: coinsertables,
            coinsertableLabel: coinsertableLabels 
        }).commit();

        // normal vertex Cb: large, gray
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.NormalProtrusion, CreateSphere, {
            centers: protrusionData.protrusionCbAtomInfoArray.map(a => a.coordinate).flat(),  
            centersLabel: protrusionData.protrusionCbAtomInfoArray.map( a => a.atomLabel ),
            radius: 1.8,
            sphereColor: ColorNames.gray,
            stateLabel: ProtrusionVisualLabel.NormalProtrusion
        }).commit();

        // convex hull
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.ConvexHull, CreateConvexHull, {
            vertices: protrusionData.normalCaCbAtomInfoArray.map(a=>a.coordinate).flat(),  
            verticesLabel: protrusionData.normalCaCbAtomInfoArray.map(a=>a.atomLabel),
            indices: protrusionData.convexHullFaces.flat(),
            opacity: 0.7,
            edgePairs: edgePairs.flat(),
        }).commit();       

        // hide all the new visualizations at the initial
        const model = this.plugin.managers.structure.hierarchy.current.structures[0].model!;
        const reprList = model.genericRepresentations!
        for(let i=0; i<reprList.length; i++ ){
            PluginCommands.State.ToggleVisibility(this.plugin, 
                { state: reprList[i].cell.parent!, ref: reprList[i].cell.transform.ref });
        }

        this.protrusionInitFlag = true
    }


    async toggleProtrusion(reprRef: string){
        if(!this.protrusionInitFlag){
            await this.initProtrusion();
        }
        const model = this.plugin.managers.structure.hierarchy.current.structures[0].model;
        if(!model) return 
        const reprList = model.genericRepresentations!
        for(let i=0; i<reprList.length; i++ ){
            const ref = reprList[i].cell.transform.ref
            if(reprRef == ref){
                PluginCommands.State.ToggleVisibility(this.plugin, 
                    { state: reprList[i].cell.parent!, ref: reprRef });
                break
            }
        }
    }
    
    
    async togggleEdges(reprRef: ProtrusionVisualRef){
        const oldParams = this.getObj<PluginStateObject.Shape.Representation3D>(reprRef).sourceData as any;
        const newParams = {...oldParams as object, showEdges: !oldParams.showEdges}; // flip drawEdge
        const transfer = reprRef == ProtrusionVisualRef.ConvexHull ? CreateConvexHull : CreateSphere ;
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(reprRef, transfer, {
            ...newParams
        }).commit();   
    }

    async changeOpacity(opacity:number) {
        const oldParams = this.getObj<PluginStateObject.Shape.Representation3D>(ProtrusionVisualRef.ConvexHull).sourceData as any;
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.ConvexHull, CreateConvexHull, {
            ...oldParams,
            opacity: opacity,
        }).commit();       
    }
    
   

    private structure(assemblyId: string) {
        const model = this.state.build().to(StateElements.Model);
        const props = {
            type: assemblyId ? {
                name: 'assembly' as const,
                params: { id: assemblyId }
            } : {
                name: 'model' as const,
                params: { } 
            }
        };

        const s = model
            .apply(StateTransforms.Model.StructureFromModel, props, { ref: StateElements.Assembly });

        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-sequence' }, { ref: StateElements.Sequence });
        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'atomic-het' }, { ref: StateElements.Het });
        s.apply(StateTransforms.Model.StructureComplexElement, { type: 'water' }, { ref: StateElements.Water });
        
        return s;
    }

    // setBackground(color: number) {
    //     if (!this.plugin.canvas3d) return;
    //     const renderer = this.plugin.canvas3d.props.renderer;
    //     PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { renderer: { ...renderer,  backgroundColor: Color(color) } } });
    // }
}
