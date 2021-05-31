import { createPlugin } from "molstar/lib/mol-plugin-ui";
import { AnimateCameraSpin } from 'molstar/lib/mol-plugin-state/animation/built-in/camera-spin';
import { createStructureRepresentationParams } from 'molstar/lib/mol-plugin-state/helpers/structure-representation-params';
import { PluginStateObject, PluginStateObject as PSO } from 'molstar/lib/mol-plugin-state/objects';
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { PluginState } from 'molstar/lib/mol-plugin/state';
import { StateBuilder, StateObject, StateObjectCell, StateSelection, StateTransformer } from 'molstar/lib/mol-state';
import { Asset } from 'molstar/lib/mol-util/assets';
import { Color } from 'molstar/lib/mol-util/color';
import { LoadParams, pointDistance, ProtrusionVisualLabel, RepresentationStyle, StateElements, SupportedFormats } from './helpers';
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

import qh from 'quickhull3d';

import { ProtrusionVisualRef, ProtrusionData } from './helpers'
import { CreateSphere } from "./protrusion";
import { CreateConvexHull } from "./convexhull";

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

type AtomSelectionInfo = {   
    id: number;
    name: string;    
    resName: string; 
    coordinate: number[];
}

export class MolStarWrapper {
    
    // private _ev = RxEventHelper.create();
    // readonly events = {
    //     modelInfo: this._ev<ModelInfo>()
    // };
   
    private defaultSpec: PluginUISpec; 
    private protrusionData: ProtrusionData; 
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
            // components: {
            //     remoteState: 'none', //remote server 
            // },
            config: [
                [PluginConfig.Viewport.ShowAnimation, false],
                [PluginConfig.VolumeStreaming.Enabled, false],  //remove volume streaming 
            ]
        }

        this.plugin = new PluginUIContext(this.defaultSpec);

        this.protrusionData = {
            initProtrusionFlag: false,
            caCbCoordinates: [],  
            caCbAtomIndices: [],
            convexHullFaces: [],    
        }

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

            this.protrusionData.initProtrusionFlag  = false;
        } 

        await this.updateStyle(this.representationStyle);  // show the model
        // const model = this.getObj<PluginStateObject.Molecule.Model>('model');
        this.loadedParams = { pdbId, format, assemblyId };
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

        this.protrusionData.initProtrusionFlag = false;
        // this.loadedParams = { pdbId, format, assemblyId };
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

        // // add protrusion
        // const root = update.to(StateElements.Protrusions);
        // if (style.protrusions && style.protrusions.hide) {
        //     root.delete(StateElements.Protrusions);
        // } else {
        //     root.applyOrUpdate(StateElements.ProtrusionsVisual
        //         , StateTransforms.Representation.StructureRepresentation3D,
        //         createStructureRepresentationParams(this.plugin, structure, {
        //             type: (style.protrusions && style.protrusions.kind) || 'ball-and-stick',
        //             typeParams: { alpha: 0.51 },
        //             color: style.protrusions && style.protrusions.coloring
        //         }));
        // }


        return update;
    }

   
    async updateStyle(style?: RepresentationStyle, partial?: boolean) {
        const tree = this.visual(style, partial);
        if (!tree) return;
        await PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree });
    }

    

    selectAtomicElement(structure: Structure, selParm: CaCbSelectionParam) {
        // check https://github.com/molstar/molstar/commit/a8541d5967e2374d0831855643c98f9c8de21405
        const l = StructureElement.Location.create<Unit.Atomic>(structure);
        let atomInfoArray: AtomSelectionInfo[] = [];
        // let coodsArray: number[][] = [];

        if(selParm.chains != 'ALL' && selParm.chains.length == 0) return atomInfoArray  ;  // selParm.chains = []
        if(selParm.residues != 'ALL' && selParm.residues.length == 0) return atomInfoArray ;  // selParm.residues = []

        for (const unit of structure.units) {
            if (unit.kind !== Unit.Kind.Atomic) continue;

            l.unit = unit;

            const { elements } = unit;
            const chainsIt = Segmentation.transientSegments(unit.model.atomicHierarchy.chainAtomSegments, elements);
            const residuesIt = Segmentation.transientSegments(unit.model.atomicHierarchy.residueAtomSegments, elements);
            let count=0;

            while (chainsIt.hasNext) {
                const chainSegment = chainsIt.move();                                
                l.element = elements[chainSegment.start];  
                if (selParm.chains == 'ALL' || selParm.chains.includes(StructureProperties.chain.label_asym_id(l))) {                 

                    residuesIt.setSegment(chainSegment);
                    while (residuesIt.hasNext) {
                        const residueSegment = residuesIt.move();
                        l.element = elements[residueSegment.start];
                    
                        for (let j = residueSegment.start, _j = residueSegment.end; j < _j; j++) {
                            l.element = elements[j];
                            const resName = StructureProperties.atom.label_comp_id(l);
                            const atomName = StructureProperties.atom.label_atom_id(l);

                            if(selParm.residues == 'ALL' || selParm.residues.includes(resName)){
                                if(selParm.atomNames == 'BOTH' || selParm.atomNames == atomName){
                                    const i = l.element
                                    const coordinate = [ 
                                        l.unit.conformation.coordinates.x[i],
                                        l.unit.conformation.coordinates.y[i],
                                        l.unit.conformation.coordinates.z[i]
                                    ];
                                    atomInfoArray.push({
                                        id: i,
                                        name: atomName,
                                        resName: resName,
                                        coordinate: coordinate
                                    });
                                    count += 1;  
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
        // OrderedSet.forEach(loci.elements[0].indices, i => { // elements[0] refers to Entity 0, i.e, protein(?)
        //     const x = loci.elements[0].unit.conformation.coordinates.x[i];
        //     const y = loci.elements[0].unit.conformation.coordinates.y[i];
        //     const z = loci.elements[0].unit.conformation.coordinates.z[i];
        //     this.protrusionData.caCbCoordinates.push([x,y,z]);
        //     this.protrusionData.caCbAtomIndices.push(i);
        // })

        // convert the selected atoms into an AtomInfo array
        const caCbAtomArray = this.selectAtomicElement(StructureSelection.unionStructure(selectionCaCb), 
            {chains: 'ALL', residues: 'ALL', atomNames: 'BOTH'} )
        
        console.log(`selected ${caCbAtomArray.length} Ca Cb atoms`);

        this.protrusionData.caCbAtomIndices = caCbAtomArray.map(atomInfo => atomInfo.id )
        this.protrusionData.caCbCoordinates = caCbAtomArray.map(atomInfo => atomInfo.coordinate)
        
        // calculate convec hull
        console.time('calculating convex hull');
        this.protrusionData.convexHullFaces = qh(this.protrusionData.caCbCoordinates);
        console.timeEnd('calculating convex hull');

        // identify (hydrophobic) protrusions
        const convexHullIndices = new Set(this.protrusionData.convexHullFaces.flat());  // 39
        console.log(`convex hull info: faces ${this.protrusionData.convexHullFaces.length}, vertices ${convexHullIndices.size}`);
       
        const cbIndices =  caCbAtomArray.filter(a => a.name == 'CB').map(a => a.id)
        const hydroCbIndices = caCbAtomArray.filter(a => HYDROPHOBICS.includes(a.resName) && a.name == 'CB').map(a => a.id)

        const protrusionCbAtomIndices: number[] = [];
        const hydroProtrusionCbAtomIndices: number[] = [];
       
        convexHullIndices.forEach(i => {
            const atomId = this.protrusionData.caCbAtomIndices[i];
            if(cbIndices.includes(atomId)){ // find a Cb vertex
                let neiborCount = 0;
                for(let j=0; j< this.protrusionData.caCbCoordinates.length; j++){
                    if(i != j && pointDistance(this.protrusionData.caCbCoordinates[i], this.protrusionData.caCbCoordinates[j]) < DISTANCE_CUTOFF )
                        neiborCount += 1;
                }
                if(neiborCount < LOW_DENSITY_THRESHOLD){  
                    protrusionCbAtomIndices.push(atomId);                                        
                    if(hydroCbIndices.includes(atomId)){ // hydrophobic protusion
                        hydroProtrusionCbAtomIndices.push(atomId);
                    }
                }
            }            
        })

        console.log(`normal protrusions: `);
        console.log(protrusionCbAtomIndices.sort((a,b) => a - b));

        console.log(`hydrophobic indices: `);  // [ 652, 146, 177, 169, 671 ]
        console.log(hydroProtrusionCbAtomIndices);

        // TODO: addcoInsertablePair
        return {
            hydrophobicCaCbIndices: caCbAtomArray.filter(a => HYDROPHOBICS.includes(a.resName)).map(a => a.id),
            protrusionCbAtomIndices: protrusionCbAtomIndices,
            hydroProtrusionCbAtomIndices: hydroProtrusionCbAtomIndices
         }
    }


    private async initProtrusion(){
        const atomIndices = this.calculateProtrusion()!;
        
        // const normalCaCb = []; 
        const hydroCaCb: number[] = [];
        const normalProtrusions: number[] = []; //
        const hydrophobicProtrusions: number[] = [];

        for(let i=0; i < this.protrusionData.caCbCoordinates.length; i++){
            const atomId = this.protrusionData.caCbAtomIndices[i];
            if(atomIndices.hydroProtrusionCbAtomIndices.includes(atomId))
                hydrophobicProtrusions.push(...this.protrusionData.caCbCoordinates[i]);

            if(atomIndices.protrusionCbAtomIndices.includes(atomId) )
                normalProtrusions.push(...this.protrusionData.caCbCoordinates[i]) 

            if(atomIndices.hydrophobicCaCbIndices.includes(atomId))
                hydroCaCb.push(...this.protrusionData.caCbCoordinates[i])
        }
        console.log(normalProtrusions.length/3) // 5
      
        // Note: for spheres drawing at the same center with same radius,
        // the one drawn earlier will cover the one later
        // So here the orange ones can always cover the gray ones

        // hydrophobic Ca, Cb: small, orange
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.HydroCaCb, CreateSphere, {
            centers: hydroCaCb,  
            radius: 0.5,
            sphereColor: ColorNames.orange,
            label: ProtrusionVisualLabel.HydroCaCb
        }).commit();

        // normal Ca Cb: small, gray
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.NormalCaCb, CreateSphere, {
            centers: this.protrusionData.caCbCoordinates.flat(),  
            radius: 0.5,
            sphereColor: ColorNames.gray,
            label: ProtrusionVisualLabel.NormalCaCb
        }).commit();

        // hydrophobe vertex: large, orange
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.HydroProtrusion, CreateSphere, {
            centers: hydrophobicProtrusions,  
            radius:2,
            sphereColor: ColorNames.orange,
            // sphereColor: Color.fromRgb(0,255,0) // green
            label: ProtrusionVisualLabel.HydroProtrusion
        }).commit();

        // normal vertex Cb: large, gray
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.NormalProtrusion, CreateSphere, {
            centers: normalProtrusions,  
            radius: 2,
            sphereColor: ColorNames.gray,
            label: ProtrusionVisualLabel.NormalProtrusion
        }).commit();

        // convex hull
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.ConvexHull, CreateConvexHull, {
            vertices: this.protrusionData.caCbCoordinates.flat(),  
            indices: this.protrusionData.convexHullFaces.flat(),
            opacity: 0.7
        }).commit();       

        // hide all the new visualizations at the initial
        const model = this.plugin.managers.structure.hierarchy.current.structures[0].model!;
        const reprList = model.genericRepresentations!
        for(let i=0; i<reprList.length; i++ ){
            PluginCommands.State.ToggleVisibility(this.plugin, 
                { state: reprList[i].cell.parent!, ref: reprList[i].cell.transform.ref });
        }

        this.protrusionData.initProtrusionFlag = true
    }

    async toggleProtrusion(reprRef: string){
        if(!this.protrusionData.initProtrusionFlag){
            this.protrusionData.caCbAtomIndices = [];
            this.protrusionData.caCbCoordinates = []
            this.protrusionData.convexHullFaces = []
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
    
    // async hideProtrusion(){
    //     // Solution1: delete the visual directly (?)
    //     // const update = this.state.build();
    //     // const root = update.to(StateElements.Model);
    //     // root.delete(StateElements.ProtrusionsVisual);
    //     // // if (!update) return;
    //     // await PluginCommands.State.Update(this.plugin, { state: this.plugin.state.data, tree:update });
    // }
    

    async changeOpacity(opacity:number) {
        console.log('changing opactiy')
        await this.plugin.build().to(StateElements.Model).applyOrUpdate(ProtrusionVisualRef.ConvexHull, CreateConvexHull, {
            vertices: this.protrusionData.caCbCoordinates.flat(),  
            indices: this.protrusionData.convexHullFaces.flat(),
            opacity: opacity
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

    // toggleSpin() {
    //     if (!this.plugin.canvas3d) return;
    //     const trackball = this.plugin.canvas3d.props.trackball;
    //     PluginCommands.Canvas3D.SetSettings(this.plugin, { settings: { trackball: { ...trackball, spin: !trackball.spin } } });
    // }

    // viewport = {
    //     setSettings: (settings?: Canvas3DProps) => {
    //         PluginCommands.Canvas3D.SetSettings(this.plugin, {
    //             settings: settings || DefaultCanvas3DParams
    //         });
    //     }
    // };


    // }
}
