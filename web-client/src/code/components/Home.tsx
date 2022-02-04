import React, { Component } from "react";
import * as ReactDOM from "react-dom";
import Image from 'react-bootstrap/Image';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ModuleCard } from "./Utils";
import { Button, Carousel } from "react-bootstrap";
import { Space } from "antd";
import GithubLogo from '../../image/GitHub-64px.png';
import PeprmintLogo from '../../image/peprmint_logo.svg';
import Pepr2visPic from '../../image/pepr2vis_cover.png';
import Pepr2dsPic from '../../image/pepr2ds_cover.png';
import ExamplePic1 from '../../image/ExamplePic1.png';
import ExamplePic2 from '../../image/ExamplePic2.png';

class Description extends Component {
    render() {
        return (
            <>
                <Row className="justify-content-md-center mt-4">
                    <Col className="col-6"> <Image src={PeprmintLogo} fluid />  </Col>
                </Row>

                <Row className="justify-content-md-center mb-3">
                    <Col className="col-auto">
                        <h3 className="font-weight-lighter"> Resources for
                            <span className="text-primary font-weight-normal"> Pe</span>ripheral
                            <span className="text-primary font-weight-normal"> Pr</span>otein-
                            <span className="text-primary font-weight-normal">M</span>embrane
                            <span className="text-primary font-weight-normal"> Int</span>eractions
                        </h3>
                    </Col>
                </Row>

                <Row className="justify-content-md-center mb-3">
                    <Space size="large">
                        <Button className="text-white" type="link" href="#learn-more">Learn more</Button>
                        <span>
                            <a href="https://github.com/reuter-group/peprmint-web"
                                title="Source code repository">
                                <Image src={GithubLogo} width={30} /> </a>
                        </span>
                    </Space>
                </Row>
            </>
        )
    }
}


export function Home() {
    return (
        <Container className="px-0" fluid >
            <Container>
                <Description />
                <Row className="justify-content-md-center">
                    <ModuleCard title={<span className="text-primary h5">PePr<sup>2</sup>Vis</span>} link={"/pepr2vis"} imgSrc={Pepr2visPic}
                        cardSubtitle={<span className="text-primary"> Visualisation </span>} />

                    <ModuleCard title={<span className="text-primary h5">PePr<sup>2</sup>DS<sup className="text-muted">BETA</sup></span>} link={"/pepr2ds"} imgSrc={Pepr2dsPic}
                        cardSubtitle={<span className="text-primary"> Dataset </span>} />
                </Row>

            </Container>

            <Container className="px-0 mt-5" id="learn-more" fluid>
                <Carousel>
                    <Carousel.Item>
                        <img className="d-block w-100" src={ExamplePic1} alt="First slide"/>
                        <Carousel.Caption>
                            <h3>Example picture 1 title (not necessary) </h3>
                            <p> Descriptions here... (How to use your own figure here: 
                                just replace the picture file 'ExamplePic.png', and check if its size fits the webpage well.) 
                                Tips: if you have text on your image, then just leave this paragraph empty                                 
                            </p>
                        </Carousel.Caption>
                    </Carousel.Item>
                    <Carousel.Item>
                        <img className="d-block w-100" src={ExamplePic2} />
                        <Carousel.Caption>
                            <h3>Example picture 2 title (not necessary) </h3>
                            <p> Descriptions here... (How to use your own figure here: 
                                just replace the picture file 'ExamplePic.png', and check if its size fits the webpage well.) 
                                Tips: if you have text on your image, then just leave this paragraph empty                               
                            </p>
                        </Carousel.Caption>
                    </Carousel.Item>
                </Carousel>
            </Container>
        </Container>
    )
}
