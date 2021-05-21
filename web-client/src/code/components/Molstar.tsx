import React, { useEffect } from 'react';

import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { createPlugin } from 'molstar/lib/mol-plugin';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';

import { createPluginAsync } from 'molstar/lib/mol-plugin/index';
import { DefaultPluginSpec, PluginSpec } from 'molstar/lib/mol-plugin/spec';
import { PluginContextContainer } from 'molstar/lib/mol-plugin-ui/plugin';
import ReactDOM from 'react-dom';


function MolStarWrapper(props: any) {

    // const parent = React.createRef<HTMLDivElement>();
    // useEffect(() => {
    //                   let plugin: PluginContext | undefined = undefined;
    //                   async function init() {
    //                       // plugin = createPlugin(parent.current!, MySpec);
    //                       plugin = await createPluginAsync(parent.current!, MySpec);
    //                       const data = await plugin.builders.data.download(
    //                         { url: `https://www.ebi.ac.uk/pdbe/entry-files/download/pdb${props.pdbId}.ent` }, 
    //                         { state: { 
    //                           isGhost: true 
    //                         } });
    //                       const trajectory = await plugin.builders.structure.parseTrajectory(data, "pdb");
    //                       await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
    //                   }
    //                   init();
    //                   return () => { plugin?.dispose(); };
    //                 }, 
    //           );

    return <div id="molstar-wrapper" 
    // ref={parent} 
    style={{ height: 600 }} />;
}

export default MolStarWrapper;
