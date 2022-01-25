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
                if (pdbid) {
                    setCheckedKeys(['0-0', '0-0-0', '0-0-0-0']);
                    setconvexHullKey(['0-0', '0-0-0']);
                    PluginWrapper.toggleProtrusion(ProtrusionVisualRef.NormalProtrusion).then(()=> {
                        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.HydroProtrusion);
                        PluginWrapper.toggleProtrusion(ProtrusionVisualRef.ConvexHull).then(()=> {
                            PluginWrapper.togggleEdges(ProtrusionVisualRef.ConvexHull);    
                            PluginWrapper.togggleEdges(ProtrusionVisualRef.HydroProtrusion);    
                        });
                    });               
                }
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
                <Col className="pt-4"> <div id="molstar-div" style={{ height: 650 }} /> </Col>
            </Row>

            <References />
        </Container>
    );
}