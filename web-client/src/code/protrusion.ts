import { addSphere } from "molstar/lib/mol-geo/geometry/mesh/builder/sphere";
import { addCylinder } from 'molstar/lib/mol-geo/geometry/mesh/builder/cylinder';
import { Mesh } from "molstar/lib/mol-geo/geometry/mesh/mesh";
import { MeshBuilder } from "molstar/lib/mol-geo/geometry/mesh/mesh-builder";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra";
import { Shape } from "molstar/lib/mol-model/shape";
import { spheres } from "molstar/lib/mol-model/structure/query/queries/internal";
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


interface SphereData{
    centers: number[],
    centersLabel: string [],

    radius: number,
    sphereColor: Color,
    stateLabel: string,
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
    console.log(`in getSphereMesh created ${data.centers.length/3} spheres`)
    return MeshBuilder.getMesh(state);
}

function getSphereShape(ctx: RuntimeContext, data: SphereData, props: SphereProps, shape?: Shape<Mesh>) {
    const geo = getSphereMesh(data, props, shape && shape.geometry);
    const getLabel = (groupId:number) =>  { 
        if(data.stateLabel == ProtrusionVisualLabel.NormalProtrusion){
            return `PROTRUSION <br/> ${data.centersLabel[groupId]}`
        }else if (data.stateLabel == ProtrusionVisualLabel.HydroProtrusion){
            return `HYDROPHOBIC PROTRUSION <br/> ${data.centersLabel[groupId]}`
        } else {
            return `${data.centersLabel[groupId]}`
        }
    }
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
        stateLabel: PD.Text(`Ca-Cb`),  
    }  
})({
    canAutoUpdate({ oldParams, newParams }) {
        return true;
    },
    apply({ a , params }, plugin: PluginContext) {
        return Task.create('Custom Sphere', async ctx => {
            // const data = getSphereDate(a.data);
            const repr = SphereRepresentation({ 
                webgl: plugin.canvas3d?.webgl, 
                ...plugin.representation.structure.themes }, 
                () => SphereParams
               );
            

               await repr.createOrUpdate( {}, params).runInContext(ctx);                                                                                                                             
            return new PluginStateObject.Shape.Representation3D(
                { repr, sourceData: a.data}, 
                { label: params.stateLabel }
            );
        });
    }
});

