import { addSphere } from "molstar/lib/mol-geo/geometry/mesh/builder/sphere";
import { addCylinder } from 'molstar/lib/mol-geo/geometry/mesh/builder/cylinder';
import { Mesh } from "molstar/lib/mol-geo/geometry/mesh/mesh";
import { MeshBuilder } from "molstar/lib/mol-geo/geometry/mesh/mesh-builder";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra";
import { Shape } from "molstar/lib/mol-model/shape";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { Representation, RepresentationContext, RepresentationParamsGetter } from "molstar/lib/mol-repr/representation";
import { ShapeRepresentation } from "molstar/lib/mol-repr/shape/representation";
import { StateTransformer } from "molstar/lib/mol-state";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { Color } from "molstar/lib/mol-util/color";
import { ColorNames } from 'molstar/lib/mol-util/color/names';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { ProtrusionVisualLabel } from "./helpers";
import { DefaultCylinderProps } from "molstar/lib/mol-geo/primitive/cylinder";


interface SphereData{
    centers: number[],
    centersLabel: string [],

    radius: number,
    sphereColor: Color,
    stateLabel: string,

    showEdges: boolean,  // only for hydrophobic protrusions
    coinsertables: number [],  // flatted coinsertable pairs (of coordinates)
    coinsertableLabel: string []
}

const SphereParams = {
    ...Mesh.Params,
}
type SphereParams = typeof SphereParams
type SphereProps = PD.Values<SphereParams>


function getSphereMesh(data: SphereData, props: SphereProps, mesh?: Mesh) {
    const state = MeshBuilder.createState(1024, 256, mesh);  // ?
    
    for(let i=0; i < data.centers.length; i +=3){
        state.currentGroup = i/3;
        addSphere(state, Vec3.create(data.centers[i],data.centers[i+1],data.centers[i+2]), data.radius, 3);
    }

    if(data.stateLabel == ProtrusionVisualLabel.HydroProtrusion && data.showEdges){
        for(let i=0; i < data.coinsertables.length; i +=6){
            state.currentGroup = data.centers.length/3 + i/3;  // set group id
            const s = i, e = i+3;  // start, end
            const a = Vec3.create(data.coinsertables[s], data.coinsertables[s+1],data.coinsertables[s+2])
            const b = Vec3.create(data.coinsertables[e], data.coinsertables[e+1],data.coinsertables[e+2])        
            addCylinder(state, a, b, 1, { ...DefaultCylinderProps, radiusTop: 0.2, radiusBottom: 0.2 })
        }
    }
    // console.log(`in getSphereMesh created ${data.centers.length/3} spheres`)
    return MeshBuilder.getMesh(state);
}

function getSphereShape(ctx: RuntimeContext, data: SphereData, props: SphereProps, shape?: Shape<Mesh>) {
    const geo = getSphereMesh(data, props, shape && shape.geometry);
    const getLabel = (groupId:number) =>  { 
        if(groupId < data.centers.length/3){
            if(data.stateLabel == ProtrusionVisualLabel.NormalProtrusion){
                return `PROTRUSION ${groupId+1} <br/> ${data.centersLabel[groupId]}`
            }else if (data.stateLabel == ProtrusionVisualLabel.HydroProtrusion){
                return `HYDROPHOBIC PROTRUSION <br/> ${data.centersLabel[groupId]}`
            } else {
                return `${data.centersLabel[groupId]}`
            }
        } else {
            const lableOffset = groupId - data.centers.length/3 
            return `CO-INSERTABLE PAIR <br/> 
                Vertex: ${data.coinsertableLabel[lableOffset]} <br/>
                Vertex: ${data.coinsertableLabel[lableOffset+1]}`
        }
    }
    // const coloring = (groupId: number) => {}
    return Shape.create("Sphere group", data, geo, () => data.sphereColor, () => 1, getLabel);
}


const SphereVisuals = {
    'mesh': (ctx: RepresentationContext, 
        getParams: RepresentationParamsGetter<SphereData, SphereParams>) => 
        ShapeRepresentation(getSphereShape, Mesh.Utils),
};

type SphereRepresentation = Representation<SphereData, SphereParams>

function SphereRepresentation(ctx: RepresentationContext, getParams: RepresentationParamsGetter<SphereData, SphereParams>): SphereRepresentation {
    return Representation.createMulti('Sphere Group', ctx, getParams, 
                Representation.StateBuilder, 
                SphereVisuals as unknown as Representation.Def<SphereData, SphereParams>
    );
}

const CreateTransformer: StateTransformer.Builder.Root = StateTransformer.builderFactory('peprmint-namespace');

export const CreateSphere = CreateTransformer({
    name: 'create-sphere',
    display: 'Sphere',
    from: PluginStateObject.Molecule.Model , // data source
    to: PluginStateObject.Shape.Representation3D,
    params: {
        centers: PD.Value([] as number[]),
        centersLabel: PD.Value([] as string[]),

        radius: PD.Numeric(3),
        sphereColor: PD.Color(ColorNames.gray),
        stateLabel: PD.Text(),  
        
        showEdges: PD.Boolean(false),
        coinsertables: PD.Value([] as number[]),
        coinsertableLabel: PD.Value([] as string[]),
    }  
})({
    canAutoUpdate({ oldParams, newParams }) {
        return true;
    },
    apply({ a , params }, plugin: PluginContext) {
        return Task.create('Custom sphere', async ctx => {
            const repr = SphereRepresentation({ 
                webgl: plugin.canvas3d?.webgl, 
                ...plugin.representation.structure.themes }, 
                () => SphereParams
               );
            
               await repr.createOrUpdate({}, params).runInContext(ctx);                                                                                                                             
            return new PluginStateObject.Shape.Representation3D(
                { repr, sourceData: params}, 
                { label: params.stateLabel }
            );
        });
    },
    update({a, b, newParams}){
        return Task.create('Custom sphere', async ctx => {
            await b.data.repr.createOrUpdate({}, newParams).runInContext(ctx);
            b.data.sourceData = newParams
            return StateTransformer.UpdateResult.Updated;
        });
     
    }
});

