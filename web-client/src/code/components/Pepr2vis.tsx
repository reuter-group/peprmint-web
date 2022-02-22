import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { ProtrusionVisualRef } from "../helpers";
import { MolStarWrapper } from "../molstar";
import { ControlArea, InputArea } from "./PeprmintControl";
import { References, PageHeader, PageHeaders } from "./Utils";

const molstarId = 'molstar-div';
const DEFAULT_PDB = '1rlw';

export let PluginWrapper: MolStarWrapper;

export function Pepr2vis() {
    let { pdbid } = useParams<{ pdbid: string }>(); // url with pdbid as parameter

    const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
    const [convexHullKey, setconvexHullKey] = useState<React.Key[]>([]);
    const [recalculateKey, setRecalculateKey] = useState<React.Key[]>([]);

    useEffect(() => {
        console.log(`loading ${pdbid || DEFAULT_PDB}`)

        PluginWrapper = new MolStarWrapper();
        PluginWrapper.init(molstarId).then(() => {
            PluginWrapper.load({
                pdbId: pdbid || DEFAULT_PDB,
                // format: 'pdb', 
                // isBinary: false, 
            }).then( () => {
                // if (pdbid) { //TT: I commented it to have the convexhull with the protrusions visualized per default.
                    // TAG: DEFAULT VISUALISATION OPTIONS.
                    // The two next lines are to check the checkbox for visualisation options (under Basic Settings). They are just checkboxes, they do not trigger the 
                    // visualisation yet.
                    setCheckedKeys(['0-0', '0-0-0', '0-0-0-0']); // 0-0: "Show protrusions", 0-0-0: "Hydrophobic protrusions", "0-0-0-0": "co-insertable pairs"
                    setconvexHullKey(['0-0', '0-0-0']); // 0-0: "Show convex hull", 0-0-0:"Show edges"
                    
                    // This is where you trigger the visualisation. To avoir bugs, if you remove something from here, remove it as well from the two previous lines
                    // (remove the corresponding "0-0-x" key )
                    PluginWrapper.toggleProtrusion(ProtrusionVisualRef.NormalProtrusion).then(()=> {
                        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroProtrusion);
                        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.ConvexHull).then(()=> {
                            PluginWrapper.togggleEdges(ProtrusionVisualRef.ConvexHull);    
                            PluginWrapper.togggleEdges(ProtrusionVisualRef.HydroProtrusion);    
                        });
                    });               
                // } // endif (pdbid)
            });
        });
        
        // return () => {       
        //     console.log('cleaned up');   
        // };
    }, []);

    // TODO: set slider value also controlled
    const title = <span> PePr<sup>2</sup>Vis </span>
    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2vis]}
                title={title}
                subtitle={"Peripheral Protein Protrusion Visualisation"}
            />

            <Row >
                <Col className="col-4">
                    <InputArea setCheckedKeys={setCheckedKeys} setConvexHullKey={setconvexHullKey} setRecalculateKey={setRecalculateKey} />
                    <ControlArea checkedKeys={checkedKeys} setCheckedKeys={setCheckedKeys}
                        convexHullKey={convexHullKey} setConvexHullKey={setconvexHullKey}
                        recalculateKey={recalculateKey} setRecalculateKey={setRecalculateKey} />
                </Col>
                <Col className="pt-4"> <div id="molstar-div" style={{ height: 685 }} /> </Col>
            </Row>

            <References />
        </Container>
    );
}