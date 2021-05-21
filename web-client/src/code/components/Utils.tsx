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
                    <ReferenceItem title={"Fuglebakk E, Reuter N (2018) A model for hydrophobic protrusions on peripheral membrane proteins. PLoS Comput Biol 14(7): e1006325."} 
                    href={"https://doi.org/10.1371/journal.pcbi.1006325"} />
                    {/* <ReferenceItem title={"publication 2"} href={"xxx"} /> */}
                </ul>
            </Container>
        )
    }
}

class ReferenceItem extends Component<any, any>{
    constructor(props: any) {
        super(props);
    }
    title = this.props.title;
    href = this.props.href;

    render() {
        return (<li> <a className="text-primary" href={this.props.href}> {this.title} </a> </li>
        );
    }
}

export { References }
// export { PeprmintUpload } ;
