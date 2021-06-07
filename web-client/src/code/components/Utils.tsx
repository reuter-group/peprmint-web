import React, { Component } from "react";
import Container from 'react-bootstrap/Container';

import { message, Upload, Button as AntdButton } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { UploadFile } from "antd/lib/upload/interface";


// class PeprmintUpload extends React.Component {
//     // fl: UploadFile<any> = {
//     //     uid: '-1',
//     //     name: 'xxx.png',
//     //     status: 'done',
//     //     size : 2000,
//     //     url: 'http://xxx.png',
//     //     type: "png",
//     // };

//     state = {
//         fileList:  [          
//         ],
//     };

//     handleChange = (info: { fileList: UploadFile<any>[]; }) => {
//         let fileList = [...info.fileList];

//         // 1. Limit the number of uploaded files
//         // Only to show two recent uploaded files, and old ones will be replaced by the new
//         fileList = fileList.slice(-1);

//         // 2. Read from response and show file link
//         fileList = fileList.map(file => {
//             if (file.response) {
//                 // Component will show file.url as link
//                 file.url = file.response.url;
//             }
//             return file;
//         });

//         this.setState({ fileList });
//     };

//     render() {
//         const props = {
//             // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',  // file link
//             onChange: this.handleChange,
//             multiple: false,
//             // beforeUpload: file => {
//             //     if (file.type !== 'image/png') {
//             //       message.error(`${file.name} is not a png file`);
//             //     }
//             //     return file.type === 'image/png' ? true : Upload.LIST_IGNORE;
//             //   },
//         };
//         return (
//             <Upload {...props} fileList={this.state.fileList} maxCount={1}>
//                 <AntdButton icon={<UploadOutlined />}>Upload</AntdButton>
//             </Upload>
//         );
//     }
// }



class References extends Component {
    render() {
        return (
            <Container className="my-3 p-3 bg-light">
                <h5> References: </h5>
                <ul>
                    <ReferenceItem authors={"Fuglebakk E, Reuter N (2018) "}
                        title="A model for hydrophobic protrusions on peripheral membrane proteins."
                        url="https://doi.org/10.1371/journal.pcbi.1006325"
                        journal="PLoS Comput Biol 14(7): e1006325."
                        />                   
                    <ReferenceItem 
                        description="The molecule viewer plugin used on this website is developed based on Mol* Viewer: "
                        authors="David Sehnal, Sebastian Bittrich, Mandar Deshpande, Radka Svobodová, Karel Berka, Václav Bazgier, Sameer Velankar, Stephen K Burley, Jaroslav Koča, Alexander S Rose"
                        title = " Mol* Viewer: modern web app for 3D visualization and analysis of large biomolecular structures" 
                        url="https://doi.org/10.1093/nar/gkab314"
                        journal= "Nucleic Acids Research, 2021"
                    /> 
                </ul>
            </Container>
        )
    }
}

function ReferenceItem(props: { authors: string, title: string, url?: string, journal?:string, description?:string}){
    return (<li> 
            {props.description} 
            <span className="font-weight-light">{props.authors} </span>
            <a className="text-primary" href={props.url}> {props.title} </a> 
            <span className="font-weight-light font-italic"> {props.journal} </span>
            </li>
    );
}

export { References }
