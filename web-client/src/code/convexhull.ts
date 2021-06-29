import { Mesh } from "molstar/lib/mol-geo/geometry/mesh/mesh";
import { MeshBuilder } from "molstar/lib/mol-geo/geometry/mesh/mesh-builder";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra";
import { Shape } from "molstar/lib/mol-model/shape";
import { PluginStateObject as SO } from "molstar/lib/mol-plugin-state/objects";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { Representation, RepresentationContext, RepresentationParamsGetter } from "molstar/lib/mol-repr/representation";
import { ShapeRepresentation } from "molstar/lib/mol-repr/shape/representation";
import { StateTransformer } from "molstar/lib/mol-state";
import { RuntimeContext, Task } from "molstar/lib/mol-task";
import { Color } from "molstar/lib/mol-util/color";
import { ColorNames } from 'molstar/lib/mol-util/color/names';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { Model } from "molstar/lib/mol-model/structure";
import { BaseGeometry } from "molstar/lib/mol-geo/geometry/base";
import { addCylinder } from "molstar/lib/mol-geo/geometry/mesh/builder/cylinder";
import { DefaultCylinderProps } from "molstar/lib/mol-geo/primitive/cylinder";

interface ConvexHullData{
    vertices: number[],      // coordinates of all N vertices, flatted, i.e 1D array instead of (N,3) 2D array
    verticesLabel: string[], // labels of all N vertices
    indices: number[],       // vertex indices of all F facets, flatted, size: 3*F
    convexHullColor: Color, 
    opacity: number, 

    showEdges: boolean, 
    edgePairs: number[],  // flatted
}

const ConvexHullParams = {    
    ...Mesh.Params,
    ...BaseGeometry.Params,
    // alpha: { ...Mesh.Params.alpha, defaultValue: 0.7 },
}
type ConvexHullParams = typeof ConvexHullParams
type ConvexHullProps = PD.Values<ConvexHullParams>


function getConvexHullMesh(data: ConvexHullData, props: ConvexHullProps, mesh?: Mesh) {
    const state = MeshBuilder.createState(2048, 1024, mesh); 
       
    const a = Vec3();
    const b = Vec3();
    const c = Vec3();

    // iterate over all faces 
    for (let i = 0; i < data.indices.length; i += 3) {
        state.currentGroup = i/3;
        Vec3.fromArray(a, data.vertices, data.indices[i+0]*3);
        Vec3.fromArray(b, data.vertices, data.indices[i+1]*3);
        Vec3.fromArray(c, data.vertices, data.indices[i+2]*3);  
        MeshBuilder.addTriangle(state, a, b, c);       
    }
    
    // draw edges 
    if(data.showEdges){
        for(let j=0; j< data.edgePairs.length; j+=2 ){        
            state.currentGroup = data.indices.length/3 + j;  // set new group id

            let start = data.edgePairs[j], end = data.edgePairs[j+1];
            Vec3.fromArray(a, data.vertices, start * 3)
            Vec3.fromArray(b, data.vertices, end * 3)
            addCylinder(state, a, b, 1, { ...DefaultCylinderProps, radiusTop: 0.08, radiusBottom: 0.08 })
        }
    }
    
    // console.log(`in getConvexHullMesh created ${data.indices.length/3} triangles, ${data.edgePairs.length/2} edges`)
    return MeshBuilder.getMesh(state);
}

function getConvexHullShape(ctx: RuntimeContext, data: ConvexHullData, props: ConvexHullProps, shape?: Shape<Mesh>) {
    const geo = getConvexHullMesh(data, props, shape && shape.geometry);
    const label = (groupId: number) => { 
        if(groupId < data.indices.length/3 ){
            return `CONVEX HULL FACET ${groupId} <br/> 
                Vertex: ${data.verticesLabel[data.indices[groupId*3]]} <br/>
                Vertex: ${data.verticesLabel[data.indices[groupId*3+1]]} <br/>
                Vertex: ${data.verticesLabel[data.indices[groupId*3+2]]}`
        }
        else{
            const offset = groupId - data.indices.length/3
            return `CONVEX HULL EDGE <br/>
                Vertex: ${data.verticesLabel[data.edgePairs[offset]]} <br/>
                Vertex: ${data.verticesLabel[data.edgePairs[offset+1]]} <br/>`
        } 
    };
    const coloring = (groupId: number) => { 
        if(groupId < data.indices.length/3 ) return data.convexHullColor
        else return ColorNames.black
    }
    // console.log(`props.alpha ${props.alpha}`);
    return Shape.create("Convex hull", data, geo, coloring, () => 1, label);
}


const SphereVisuals = {
    'mesh': (ctx: RepresentationContext, 
        getParams: RepresentationParamsGetter<ConvexHullData, ConvexHullParams>) => 
        ShapeRepresentation(getConvexHullShape, Mesh.Utils),
};

type ConvexHullRepresentation = Representation<ConvexHullData, ConvexHullParams>

function ConvexHullRepresentation(ctx: RepresentationContext, getParams: RepresentationParamsGetter<ConvexHullData, ConvexHullParams>): ConvexHullRepresentation {
    return Representation.createMulti('Convex Hull', ctx, getParams, 
                Representation.StateBuilder, 
                SphereVisuals as unknown as Representation.Def<ConvexHullData, ConvexHullParams>
    );
}

const CreateTransformer: StateTransformer.Builder.Root = StateTransformer.builderFactory('peprmint-namespace');

export const CreateConvexHull = CreateTransformer({
    name: 'create-convex-hull',
    display: 'convex hull',
    from: SO.Molecule.Model , // data source
    to: SO.Shape.Representation3D,
    params: {
        vertices: PD.Value([] as number[]),
        verticesLabel: PD.Value([] as string[]),
        indices: PD.Value([] as number[]),
        convexHullColor: PD.Color(ColorNames.blue), 
        opacity: PD.Numeric( 0.5, { min: 0, max: 1, step: 0.01 }),

        showEdges: PD.Boolean(false),
        edgePairs: PD.Value([] as number[]),
    }  
})({
    canAutoUpdate({ oldParams, newParams }) {
        return true;
    },
    apply({ a , params }, plugin: PluginContext) {
        // const center = Model.getCenter(a.data);
        return Task.create('Custom Convex Hull', async ctx => {
            const repr = ConvexHullRepresentation({ 
                webgl: plugin.canvas3d?.webgl, 
                ...plugin.representation.structure.themes},  
                () => { return {
                            ...ConvexHullParams,     
                            alpha: { ...Mesh.Params.alpha, defaultValue: params.opacity },
                        }
                    }
               );
            await repr.createOrUpdate({}, params).runInContext(ctx);
            return new SO.Shape.Representation3D(
                { repr, sourceData: params }, 
                { label: `Convex Hull` });
        });
    },
    update({ a, b, newParams }) {
        // a is Model, b is representation, newParams: { vertices: [], indices: [], opacity: 0.2 }
        // Note the opacity is controlled by props 
        return Task.create('Custom Convex Hull', async ctx => {
            const props = { ...b.data.sourceData as object, alpha: newParams.opacity };
            await b.data.repr.createOrUpdate(props, newParams).runInContext(ctx);
            b.data.sourceData = newParams
            return StateTransformer.UpdateResult.Updated;
        });
     
    }
});