import { EyeOutlined, HomeOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";
import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { MolStarWrapper } from "../molstar";
import { ControlArea, InputArea } from "./PeprmintControl";
import { References } from "./Utils";

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
    return (
        <Container>
            <Row className="mt-3 mb-4 px-3"> 
                <Breadcrumb>
                    <Breadcrumb.Item> <span> <Link className="text-primary" to="/"><HomeOutlined className="align-middle" /> PePrMInt </Link></span> </Breadcrumb.Item>
                    <Breadcrumb.Item> <span> <EyeOutlined className="align-middle"/> PePr<sup>2</sup>Vis</span> </Breadcrumb.Item>
                </Breadcrumb>
            </Row>

            <Row className="mb-4"> 
                <Col className="col-auto"> 
                    <h2> PePr<sup>2</sup>Vis: Peripheral Protein Protrusion Visualisation </h2>                           
                </Col>
                {/* <Col className="col-1"> 
                    <a href="https://github.com/reuter-group/peprmint-web" 
                        title="Source code repository">
                    <Image src={GithubLogo} width={30}/> </a> </Col> */}
            </Row>

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

