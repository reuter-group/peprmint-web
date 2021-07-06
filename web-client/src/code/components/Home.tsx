import React, { Component } from "react";
import * as ReactDOM from "react-dom";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ModuleCard } from "./Utils";
import PeprmintLogo from '../../image/peprmint_logo.svg';
import Pepr2visPic from '../../image/Convexhull_membrane.png';


export function Home(){
    return (
    <Container >        
        <Row className="justify-content-md-center"> 
            <ModuleCard title = { <span>PePr<sup>2</sup>Vis</span> }  link={"/pepr2vis"} imgSrc={Pepr2visPic} 
                cardSubtitle={"Peripheral protein protrusion visualisation"}/>
            
            <ModuleCard title = { <span>Coming soon: PePr<sup>2</sup>DB</span> }  link={"/"} imgSrc={PeprmintLogo} 
                cardSubtitle = { "Peripheral protein protrusion database" }/>                        
        </Row>
        {/* <Row className="border" style={{ height: 100 }}></Row> */}
    </Container>
    )
}
