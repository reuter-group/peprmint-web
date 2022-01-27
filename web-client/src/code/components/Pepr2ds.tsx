import { Button, Card, Collapse, Input, Select, Space, Statistic, Table } from "antd";
import React, { PureComponent, useEffect, useState, useRef } from "react";
import { Col, Container, Row, Button as BButton } from "react-bootstrap";
import { CheckCircleTwoTone, DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { References, PageHeader, PageHeaders, COLORS20 } from "./Utils";
import Papa from "papaparse";
import { validCathId, validPdbID } from "../helpers";
// import { presetPalettes } from '@ant-design/colors';
import { BarChart,Bar, XAxis, YAxis, Tooltip, CartesianGrid,  PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const { Panel } = Collapse;

// configurable options
export const DOMAINS = ['ANNEXIN', 'C1', 'C2', 'C2DIS', 'PH', 'PLA', 'PLD', 'PX', 'START'];
const defaultDomain = DOMAINS[1]; // C1


export const DATA_SOURCES = ['CATH', 'AlphaFold'];
export const ExperimentalMethod = ['X-ray diffraction', 'Solution NMR', 'AFmodel', 'unknown']
export const RESIDUES = ['ALA', 'ARG', 'ASN', 'ASP', 'CYS',
    'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
    'LEU', 'LYS', 'MET', 'PHE', 'PRO',
    'SER', 'THR', 'TRP', 'TYR', 'VAL'];

// import all csv files under datasets/
function importAllDatasets(r: __WebpackModuleApi.RequireContext) {
    let datasets: any = {};
    r.keys().map((fileName: string) => { datasets[fileName] = r(fileName).default; });
    return datasets;
}

const DATASET_IMPORTS = importAllDatasets(require.context('../../datasets/', true, /\.csv$/));
const csvUrl = (domain: string) => DATASET_IMPORTS[`./domain_${domain.toUpperCase()}.csv`];


const loadCsvTable = async (domain: string) => {
    const csvData = await fetch(csvUrl(domain)).then(res => res.text());
    const table = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    console.log(`loaded ${table.data.length} row data`);
    return table.data.map((data: any, i) => {
        return { ...data, key: `${domain}-${i}` }
    });
}

let selectedDomains = new Set<string>();

export function Pepr2ds() {

    const title = <span> PePr<sup>2</sup>DS </span>;

    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [resCompData, setResCompData] = useState<any[]>([]);

    const addDomainTableData = async (domain: string) => {
        setLoading(true);
        selectedDomains.add(domain);
        const newData = await loadCsvTable(domain);
        setTableData([...tableData, ...newData]);
        setLoading(false);
    };

    const deleteDomainTableData = (domain: string) => {
        console.log('deleting..', domain, tableData.filter(d => d.dm != domain).length)
        if (selectedDomains.has(domain)) selectedDomains.delete(domain);
        setTableData(tableData.filter(d => d.dm != domain));
    }

    const calcResComp = () => {
        let resComp = new Map<string, number>(RESIDUES.map(r => [r, 0]));
        for (let record of tableData) {
            resComp.set(record.rna, (resComp.get(record.rna) || 0) + 1)
        }
        setResCompData(Array.from(resComp, ([k, v]) => ({ name: k, value: v })));
    }


    useEffect(() => {
        addDomainTableData(defaultDomain); // load default dataset     
        console.log(selectedDomains);
    }, []);


    const trueFalseRender = (b: any) => (b && b.toLowerCase() == 'true')
        ? <CheckCircleTwoTone twoToneColor="#52c41a" />
        : <> - </>

    const trueFalseFilter = [{ text: 'True', value: 'true' }, { text: 'False', value: 'false' }];

    const getColumnSearchProps = (dataIndex: string, columnTitle: string) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${columnTitle}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),

        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,

        onFilter: (value: any, record: any) =>
            record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                : '',
    });


    const handleSearch = (selectedKeys: any, confirm: any, dataIndex: any) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters: any) => {
        clearFilters();
        setSearchText('');
    };

    const defaultColumns = [
        // NOTE: dataIndex must be the same as the headers in CSV table
        // { title: '#', dataIndex: 'key', width: 70, },
        {
            title: 'Domain', dataIndex: 'dm', width: 70,
            sorter: (a: any, b: any) => DOMAINS.indexOf(a.dm) - DOMAINS.indexOf(b.dm),
            // sortDirections: ['descend'],
            // filters: DOMAINS.map(domain => { return { text: domain, value: domain.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.domain.toLowerCase().includes(value)
        },
        {
            title: 'PDB ID', dataIndex: 'pdb', width: 55,
            render: (pdbid: any) => validPdbID(pdbid) ? <Link to={"/pepr2vis/" + pdbid}> {pdbid} </Link> : <>{pdbid}</>,
            ...getColumnSearchProps('pdb', 'PDB ID')
        },
        {
            title: 'CATH ID', dataIndex: 'cath', width: 65, render: (cathId: any) =>
                validCathId(cathId) ? <Link to={"/pepr2vis/" + cathId}> {cathId} </Link> : <>{cathId}</>,
            ...getColumnSearchProps('cath', 'CATH ID')
        },
        { title: 'Chain', dataIndex: 'chain', width: 60, ...getColumnSearchProps('chain', 'Chain') },
        {
            title: 'Residue',
            children: [
                {
                    title: <small> name </small>, dataIndex: 'rna', width: 65, key: 'resname',
                    filters: RESIDUES.map(r => { return { text: r, value: r } }),
                    onFilter: (value: any, record: any) => record.rna.includes(value)
                },
                { title: <small> id </small>, dataIndex: 'rnu', width: 45, key: 'resnum' },
            ]
        },
        {
            title: 'IBS', dataIndex: 'ibs', width: 50, render: trueFalseRender, filters: trueFalseFilter,
            onFilter: (value: any, record: any) => record.ibs && record.ibs.toLowerCase().includes(value)
        },

        {
            title: 'Protrusion information *',
            children: [
                {
                    title: 'V', dataIndex: 'cv', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.cv && record.cv.toLowerCase().includes(value)
                },

                {
                    title: 'P', dataIndex: 'pro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.pro && record.pro.toLowerCase().includes(value)
                },

                {
                    title: 'H', dataIndex: 'hypro', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.hypro && record.hypro.toLowerCase().includes(value)
                },

                {
                    title: 'C', dataIndex: 'coin', width: 40, render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.coin && record.coin.toLowerCase().includes(value)
                },
                {
                    title: 'E', dataIndex: 'expo', width: 40,
                    render: trueFalseRender, filters: trueFalseFilter,
                    onFilter: (value: any, record: any) => record.expo && record.expo.toLowerCase().includes(value)
                },
                { title: 'D', dataIndex: 'den', width: 40, render: (v: string) => v && parseInt(v) > 0 ? v : <>-</> },
                {
                    title: 'neighboursID', dataIndex: 'nbl', width: 120, ellipsis: true,
                }
            ]
        },

    ];

    const optionalColumns = [
        {
            title: 'Atom number', dataIndex: 'anu', width: 75,
            sorter: (a: any, b: any) => a.anu - b.anu,
        },
        { title: 'Bfactor', dataIndex: 'bf', width: 80 },

        {
            title: 'CATH cluster id', children: [
                { title: <small> S35 </small>, dataIndex: 's35', width: 40, },
                { title: <small> S60 </small>, dataIndex: 's60', width: 40, },
                { title: <small> S95 </small>, dataIndex: 's95', width: 60, },
                { title: <small> S100 </small>, dataIndex: 's100', width: 70, },]
        },

        {
            title: 'Data source', dataIndex: 'dt', width: 110,
            // filters: ['CathPDB', 'AlphaFold'].map(ds => { return { text: ds, value: ds.toLowerCase() } }),
            // onFilter: (value: any, record: any) => record.dt.includes(value.toLowerCase())
        },

        { title: 'Experimental method', dataIndex: 'em', width: 110, ellipsis: true },
        { title: 'NMR resolution', dataIndex: 'rsl', width: 90 },

        {
            title: 'Secondary structure', dataIndex: 'ss', width: 70,
            filters: ['H', 'E', 'C'].map(ss => { return { text: ss, value: ss } }),
            onFilter: (value: any, record: any) => record.ss.includes(value)
        },

        {
            title: 'Uniprot accession', dataIndex: 'uacc', width: 100, render: (uacc: any) =>
                uacc ? <a href={"https://www.uniprot.org/uniprot/" + uacc}> {uacc} </a> : <>{uacc}</>
        },
        { title: 'Uniprot ID', dataIndex: 'uid', width: 120 },

        {
            title: 'Uniprot cluster id', children: [
                { title: <small> uref50 </small>, dataIndex: 'u50', width: 80, },
                { title: <small> uref90 </small>, dataIndex: 'u90', width: 80, },
                { title: <small> uref100 </small>, dataIndex: 'u100', width: 80, }
            ]
        },

        { title: 'Protein Block', dataIndex: 'pb', width: 70 },
        { title: 'Origin', dataIndex: 'origin', width: 80 },
        { title: 'Location', dataIndex: 'loc', width: 100, ellipsis: true },
        { title: 'Taxon', dataIndex: 'taxon', width: 100, ellipsis: true }
    ];


    const [columns, setColumns] = useState<any[]>(defaultColumns);


    const { Option } = Select;

    const domainSelectOptions = DOMAINS.map(domain =>
        <Option value={domain} key={domain}> {domain} </Option>)

    const optionalColumnSelections = optionalColumns.map((oc, i) =>
        <Option value={oc.title} key={i}> {oc.title} </Option>)


    function changeTable(pagination: any, filters: any, sorter: any, extra: any) {
        console.log('change table...', pagination, filters, sorter, extra);
        setTableData(extra.currentDataSource)
    }

    const changeDomainSelections = (domains: string[]) => {
        console.log(`selected ${domains}`, selectedDomains);

        if (domains.length >= selectedDomains.size) {
            console.log('adding...', domains.filter(d => !selectedDomains.has(d)))
            domains.filter(d => !selectedDomains.has(d)).map(addDomainTableData)
        } else {
            selectedDomains.forEach(d => {
                if (!domains.includes(d)) deleteDomainTableData(d);
            })
        }

    }

    const changeColumnSelections = (selectedColumns: string[]) => {
        const selectedOptionalColumns = selectedColumns.map((sc: string) => optionalColumns.find(oc => oc.title == sc));
        setColumns([...defaultColumns, ...selectedOptionalColumns]);
    }

    // const tableTitle = () => { 
    //     let domainLengthRender = [];
    //     for (let d of DOMAINS) { 
    //         const domainLength = tableData.filter(r=>r.dm == d).length;
    //         if(domainLength >0 ) domainLengthRender.push(
    //             <span key={d} className="text-muted"> <b>{d} </b> {domainLength}; </span>)  
    //     }     
    //     const prefix = domainLengthRender.length > 0 ? <span>, including </span> : <> </>
    //     return <span>Loaded <b>{tableData.length} </b> rows {prefix} {domainLengthRender}</span>
    // }    

    return (
        <Container>
            <PageHeader headerList={[PageHeaders.Home, PageHeaders.Pepr2ds]}
                title={title}
                subtitle={"Peripheral Protein Protrusion DataSet"}
            />
            <Row className="mb-5">
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein structures" value={6084} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" > <Statistic title="Protein domains" value={DOMAINS.length} /> </Col>
                <Col md={2} className="bg-light mx-4 py-2 border" >
                    <Statistic title="Complete dataset" value="156 MB" />
                    <small><a className="text-muted" href="https://github.com/reuter-group/pepr2ds/blob/main/Ressources/datasets/PePr2DS.csv">
                        <DownloadOutlined /> download</a> </small></Col>
            </Row>

            <Row className="my-4">
                <Col md={5}>
                    Domains: &nbsp;
                    <Select defaultValue={[defaultDomain]}
                        mode="multiple"
                        allowClear
                        placeholder="Select domains"
                        onChange={changeDomainSelections}
                        style={{ width: 350 }}>
                        {domainSelectOptions}
                    </Select>
                </Col>
                <Col md={7}>
                    Optional columns: &nbsp;
                    <Select defaultValue={[]} style={{ width: 400 }}
                        allowClear
                        mode="multiple"
                        placeholder="Select columns to display"
                        onChange={changeColumnSelections}>
                        {optionalColumnSelections}
                    </Select>
                </Col>
            </Row>


            {/* <Row className="my-4"> */}

            <Table bordered
                tableLayout="fixed"
                loading={loading}
                // title={tableTitle}
                columns={columns}
                dataSource={tableData}
                onChange={changeTable}
                scroll={{ y: 600 }}
                size="small"
                pagination={{
                    pageSize: 50,
                    position: ['topLeft'],
                    showTotal: (total) => <span> Total <b>{total}</b> items, </span>,
                    showQuickJumper: true
                }}
                footer={() => <span> <b>V</b>: convex hull vertex; <b>P</b>: protrusion; <b>H</b>: hydrophobic protrusion;
                    <b>C</b>: co-insertable H; <b>E</b>: {"if Residue is exposed (RSA > 20%) or not (RSA <= 20%)"}
                    <b>D</b>: protein density
                </span>}
            />

            {/* </Row> */}

            <Container className="my-5 border border-primary bg-light">
                <Row className="py-3 pl-4 bg-secondary">
                    <h4> Dataset Analyses </h4>
                </Row>

                <Row className="my-4 mx-2">
                    <Col md={6} className="px-2 ">
                        <Card title="Residue Composition" extra={<BButton onClick={() => calcResComp()} > update </BButton>} bordered={false}>
                            <PieChart width={450} height={400}>
                                <Pie
                                    dataKey="value"
                                    isAnimationActive={true}
                                    data={resCompData}
                                    cx={200}
                                    cy={200}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    label
                                >
                                    {resCompData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS20[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </Card>
                    </Col>

                    <Col md={6} className="px-2 ">
                        <Card title="Neighborhood Residue Composition" extra={<BButton onClick={() => calcResComp()}> update </BButton>} bordered={false}>
                          
                            <BarChart width={450} height={400} data={resCompData}>
                                <XAxis dataKey="name" stroke="#8884d8" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" barSize={20} />
                            </BarChart>
                           
                        </Card>
                    </Col>
                </Row>

            </Container>
        </Container>
    )
}
