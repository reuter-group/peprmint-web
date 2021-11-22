import { Select, Spin, Statistic, Table } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, VirtualTable } from "./Utils";
import Papa from "papaparse";

// CSV data file
// import csvPath from '../../datasets/CB.csv';  // set and use this to pack CSV file (?)
import csvPath from '../../datasets/domain_PH.csv';

// const CSVFILE = 'asset/CB.csv';
const CSVFILE = (domain:string) => `asset/domain_${domain}.csv`;

// configurable options
export const DOMAINS = ['ANNEXIN', 'C1', 'C2', 'C2DIS', 'ENTH', 'PH', 'PLA', 'PLD', 'PX', 'START'];
export const DATA_SOURCES = ['CATH', 'AlphaFold'];

const defaultDomain = DOMAINS[5] ; // PH 


export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [tableData, setTableData] = useState<any[]>([])
    const [tableLength, setTableLength] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadData = async () => {
            console.log(`loading ${csvPath}`);
            const csvData = await fetch(CSVFILE(defaultDomain)).then(res => res.text());
            const table = Papa.parse(csvData, { header: true });
            console.log(`loaded ${table.data.length} rows `);

            const rawTableData = table.data.map((data: any, i) => {
                return { ...data, key: i + 1 }
            });

            setTableData(rawTableData);
            setTableLength(rawTableData.length);
            setLoading(false);
        };

        loadData();

    }, []);


    const trueFalseRender = (b: any) => (b && b.toLowerCase() == 'true')
        ? <CheckCircleTwoTone twoToneColor="#52c41a" />
        : <> - </>

    const trueFalseFilter = [{ text: 'True', value: 'true' }, { text: 'False', value: 'false' }];

    const columns = [
        // NOTE: dataIndex must be the same as the headers in CSV table
        // { title: '#', dataIndex: 'key', width: 70, },
        {
            title: 'Domain', dataIndex: 'dm', width: 80,
            // filters: DOMAINS.map(domain => { return { text: domain, value: domain.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.domain.toLowerCase().includes(value)

        },
        { title: 'Cath ID', dataIndex: 'cath', width: 80, render: (cathId:any) => 
            // <Link to={ {pathname: "/pepr2vis/"+cathId, } }  > {cathId} </Link>
            <Link to= {"/pepr2vis/" + cathId }> {cathId} </Link>

        },     
        {
            title: 'Atom number', dataIndex: 'anu', width: 75,
            sorter: (a: any, b: any) => a.atom_number - b.atom_number,
        },
        { title: 'Chain', dataIndex: 'chain', width: 60, },
        {
            title: 'Residue',
            children: [
                { title: <span className="font-weight-light"> name </span>, dataIndex: 'rna', width: 60, key: 'resname' },
                { title: <span className="font-weight-light"> id </span>, dataIndex: 'rnu', width: 60, key: 'resnum' },
            ]
        },
        // { title: 'Atom name', dataIndex: 'atom_name', width:}, 
        {
            title: 'IBS', dataIndex: 'ibs', width: 60, render: trueFalseRender, filters: trueFalseFilter,
            onFilter: (value: any, record: any) => record.IBS && record.IBS.toLowerCase().includes(value)
        },

        {
            title: 'Protrusion information *',
            children: [
                {
                    title: 'V', dataIndex: 'cv', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.convhull_vertex && record.convhull_vertex.toLowerCase().includes(value)
                },

                {
                    title: 'P', dataIndex: 'pro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.protrusion && record.protrusion.toLowerCase().includes(value)
                },

                {
                    title: 'H', dataIndex: 'hypro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.is_hydrophobic_protrusion && record.is_hydrophobic_protrusion.toLowerCase().includes(value)
                },

                {
                    title: 'C', dataIndex: 'coin', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.is_hydrophobic_protrusion && record.is_co_insertable.toLowerCase().includes(value)
                },
                {
                    title: 'neighboursID', dataIndex: 'nbl', width: 120
                }
            ]
        },
        { title: 'SS*', dataIndex: 'ss', width: 60, },
        { title: 'PDB ID', dataIndex: 'pdb', width: 60, },
        { title: 'Uniprot_acc', dataIndex: 'uacc', width: 100 },
        { title: 'Uniprot ID', dataIndex: 'uid', width: 110, },
        { title: 'Experimental Method', dataIndex: 'em', width: 110}
    ];


    const { Option } = Select;

    const domainSelectOptions = DOMAINS.map(domain =>
        <Option value={domain.toLowerCase()} key={domain.toLowerCase()}> {domain} </Option>)

    const dataSourceOptions = DATA_SOURCES.map(ds =>
        <Option value={ds.toLowerCase()} key={ds.toLowerCase()}> {ds} </Option>)

    const changeTable = () => {
        console.log('change table...')
        setTableLength(tableData.length);
    }

    const loadDomainDataset = (domains:string[]) => {
        console.log(`selected ${domains}`);
    }

    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={"Peripheral Protein Protrusion DataSet"}
            />
            <Row>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Protein structures" value={6084} /> </Col>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Protein domains" value={10} /> </Col>
                <Col md={2} className="bg-light mx-2 py-2" > <Statistic title="Download dataset" value={"156 MB"} /> </Col>
            </Row>

            <Row className="my-4">
                <Col md={6}>
                    Domain: &nbsp;
                    <Select defaultValue={[defaultDomain]} 
                        mode="multiple"
                        allowClear
                        placeholder="Select domains"
                        onChange={loadDomainDataset}
                        style={{ width: 450 }}>
                        {domainSelectOptions}
                    </Select>
                </Col>
                <Col md={3}>
                    Data source: &nbsp;
                    <Select defaultValue={DATA_SOURCES[0].toLowerCase()} style={{ width: 90 }} >
                        {dataSourceOptions}
                    </Select>
                </Col>
            </Row>


            <Row className="my-4">
                <Col>
                    <Table bordered
                        loading={loading}
                        title={() => `Loaded ${tableLength} rows`}
                        columns={columns}
                        dataSource={tableData}
                        onChange={changeTable}
                        scroll={{ y: 600, x: '100vw' }}
                        size="small"
                        pagination={{ pageSize: 100 }}
                        footer={() => <span> <b>V</b>: convex hull vertex; <b>V</b>: protrusion; <b>H</b>: hydrophobic protrusion; <b>C</b>: co-insertable H<br/> 
                                        <b>SS</b>: secondary structure </span> }
                    />
                </Col>
            </Row>

        </Container>
    )
}