import { Select, Spin, Statistic, Table } from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, VirtualTable } from "./Utils";
import Papa from "papaparse";

// CSV data file
// import csvPath from '../../data/CB.csv';  // set and use this to pack CSV file (?)
import csvPath from '../../data/4ekuA03.csv';

// const CSVFILE = 'asset/CB.csv';
const CSVFILE = 'asset/4ekuA03.csv'

// configurable options
export const DOMAINS = ['ANNEXIN', 'C1', 'C2', 'C2DIS', 'ENTH', 'PH', 'PLA', 'PLD', 'PX', 'START'];
export const DATA_SOURCES = ['CATH', 'AlphaFold'];


export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [tableData, setTableData] = useState<any[]>([])
    const [tableLength, setTableLength] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadData = async () => {
            console.log(`loading ${csvPath}`);
            const csvData = await fetch(CSVFILE).then(res => res.text());
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
        : <> </>


    const trueFalseFilter = [{ text: 'True', value: 'true' }, { text: 'False', value: 'false' }];

    const columns = [
        // NOTE: dataIndex must be the same as the headers in CSV table
        { title: '#', dataIndex: 'key', width: 70, },
        {
            title: 'Domain', dataIndex: 'domain', width: 80,
            filters: DOMAINS.map(domain => { return { text: domain, value: domain.toLowerCase() } }),
            onFilter: (value: any, record: any) => record.domain.toLowerCase().includes(value)

        },
        { title: 'Cath ID', dataIndex: 'cathpdb', width: 80, },
        { title: 'PDB ID', dataIndex: 'pdb', width: 60, },
        { title: 'Uniprot_acc', dataIndex: 'uniprot_acc', width: 90 },
        { title: 'Uniprot ID', dataIndex: 'uniprot_id', width: 110, },
        {
            title: 'Atom number', dataIndex: 'atom_number', width: 70,
            sorter: (a: any, b: any) => a.atom_number - b.atom_number,
        },
        { title: 'Chain', dataIndex: 'chain_id', width: 60, },
        {
            title: 'Residue',
            children: [
                { title: 'name', dataIndex: 'residue_name', width: 80, key: 'resname' },
                { title: 'id', dataIndex: 'residue_number', width: 60, key: 'resnum' },
            ]
        },
        // { title: 'Atom name', dataIndex: 'atom_name', width:}, 
        {
            title: 'IBS', dataIndex: 'IBS', width: 60, render: trueFalseRender, filters: trueFalseFilter,
            onFilter: (value: any, record: any) => record.IBS && record.IBS.toLowerCase().includes(value)
        },

        {
            title: 'Protrusion information *',
            children: [
                {
                    title: 'V', dataIndex: 'convhull_vertex', width: 50, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.convhull_vertex && record.convhull_vertex.toLowerCase().includes(value)
                },

                {
                    title: 'P', dataIndex: 'protrusion', width: 50, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.protrusion && record.protrusion.toLowerCase().includes(value)
                },

                {
                    title: 'H', dataIndex: 'is_hydrophobic_protrusion', width: 50, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.is_hydrophobic_protrusion && record.is_hydrophobic_protrusion.toLowerCase().includes(value)
                },

                {
                    title: 'C', dataIndex: 'is_co_insertable', width: 50, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.is_hydrophobic_protrusion && record.is_co_insertable.toLowerCase().includes(value)
                },
            ]
        }
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
                <Col md={3}>
                    Domain: &nbsp;
                    <Select defaultValue={DOMAINS[0].toLowerCase()} style={{ width: 120 }}>
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
                        footer={() => 'V: convex hull vertex; P: protrusion; H: hydrophobic protrusion; C: co-insertable'}
                    />
                </Col>
            </Row>

        </Container>
    )
}