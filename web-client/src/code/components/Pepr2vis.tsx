import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { MolStarWrapper } from "../molstar";
import { ControlArea, InputArea } from "./PeprmintControl";
import { References, PageHeader, PageHeaders } from "./Utils";

const molstarId = 'molstar-div';

export let PluginWrapper : MolStarWrapper;

export function Pepr2vis (){
    const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
    const [convexHullKey, setconvexHullKey] = useState<React.Key[]>([]);
    const [recalculateKey, setRecalculateKey] = useState<React.Key[]>([]);

    useEffect ( () => {
        console.log('running useEffect ')
        PluginWrapper = new MolStarWrapper();
        PluginWrapper.init(molstarId);
        PluginWrapper.load({
            pdbId: '1rlw', 
            // format: 'pdb', 
            // isBinary: false, 
        }); 
        // return () => {       
        //     console.log('cleaned up');        
        // };
    }, []);

    // TODO: set slider value also controlled
    const title = <span> PePr<sup>2</sup>Vis </span>
    return (
        <Container>
            <PageHeader headerList={ [ PageHeaders.Home, PageHeaders.Pepr2vis ] } 
                title = { title } 
                subtitle = { "Peripheral Protein Protrusion Visualisation"  } 
            />

            <Row > 
                <Col className="col-4">
                    <InputArea setCheckedKeys={setCheckedKeys} setConvexHullKey={setconvexHullKey} setRecalculateKey={setRecalculateKey}/>   
                    <ControlArea checkedKeys ={checkedKeys} setCheckedKeys={setCheckedKeys} 
                                    convexHullKey={convexHullKey} setConvexHullKey={setconvexHullKey} 
                                    recalculateKey={recalculateKey} setRecalculateKey={setRecalculateKey} />                            
                </Col>
                <Col className="pt-4"> <div id="molstar-div" style={{ height: 650 }} /> </Col>
            </Row>

            <References />
        </Container>
    );   
}