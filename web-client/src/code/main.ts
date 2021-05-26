
import { layoutInit } from "./components/BaseLayout";
import { MolStarWrapper } from "./molstar";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/antd.css';
import 'molstar/build/viewer/molstar.css';

import "../css/peprmint-theme.scss"
import "../css/main.css";


layoutInit('root');

export const PluginWrapper = new MolStarWrapper();

PluginWrapper.init('molstar-wrapper');

PluginWrapper.load({
    pdbId: '1rlw', 
    // format: 'pdb', 
    // isBinary: false, 
});
