from scipy.spatial import ConvexHull
import scipy.spatial.distance as scidist
from biopandas.pdb import PandasPdb

import numpy as np
import pandas as pd

def calc_protrusions_on_group(
            pdbdata,
            atom_selection=["CA", "CB"],
            sel_lowdens=["CA", "CB"],
            DISTANCECUTOFF=10,
            LOWDENSITYTHRESHOLD=22,
            CI_DISTANCECUTOFF=15,
    ):

        HYDROPHOBICS = ['LEU', 'ILE', 'PHE', 'TYR', 'TRP', 'CYS', 'MET']

        pd.options.mode.chained_assignment = (
            None  # default='warn', remove pandas warning when adding a new column
        )
        #####################################
        # PROTRUSION CALCULATION
        #####################################
        # instantiate the convexhull flag value
        N = len(pdbdata)  # pdbdata shape (1001,21)

        pdbdata["convhull_vertex"] = 0  # shape (1001,22)
        # Taking only atoms selected
        subsel = pdbdata.query("atom_name in @atom_selection")  # (248,22)

        # keeping 3D coordinate like [[x,y,z],[x,y,z],....] of the SUBSELECTION
        coords = subsel[["x_coord", "y_coord", "z_coord"]].values  #(248,3)

        # Calculating convexhull on the SUBSELECTION
        hull = ConvexHull(coords)  
        # hull.simplices.shape:  1rlw (74,3)
        # hull.vertices.shape: (39,)
       
        # Changing convexhull flag (0 the atom is not a vertex, 1 it is) IN THE SUBSELECTION
        # this step is needed because the convexhull indexes match the subselection indexes (with iloc).
        # BUT subsel.index match the original subdataset index
        subsel.iloc[hull.vertices, subsel.columns.get_loc("convhull_vertex")] = 1
        # now we can change the values in the ORIGINAL GROUPED DATASET
        pdbdata["convhull_vertex"][subsel.query("convhull_vertex == 1").index] = 1
        # pdbdata["convhull_vertex"] = convhull_vertex

        #####################################
        # LOW DENSITY PROTRUSION CALCULATION (AND NEIGHBOURS)
        #####################################

        # original implementation
        subset = pdbdata.query(
            "atom_name in @sel_lowdens")  # carefull, of matches if we want to change this. TODO : work only with indexes.
        subset["density"] = 0
        subset["protrusion"] = 0  # subset.shape = (248,24)

        # to speed up calculation, save the data in a list to access them faster with numpy ;)
        Nsubset = len(subset)
        columnNeighbours = [np.nan] * Nsubset  # [nan, ...] 248
        columnDensity = np.repeat(0, Nsubset)  # [0,...]  248
        columnLowDens = np.repeat(0, Nsubset)
        columnHydroProt = np.repeat(0, Nsubset)
        columnIdx = np.repeat(-1, Nsubset)
        columnCoInsertable = np.repeat(0, Nsubset)
        columnsCoInsertableNeighbors = [[]] * Nsubset  # [[],[] ...] 248

        convhullinfo = subset["convhull_vertex"].values  # (248,)
        resnameinfo = subset["residue_name"].values
        resnumber = subset["residue_number"].values
        atomnameinfo = subset["atom_name"].values

        distVect = scidist.pdist(subset[["x_coord", "y_coord", "z_coord"]].values)  #(30628,)
        distmat = scidist.squareform(distVect)  # (248, 248), (248**2 - 248)/2 = 30628          

        result = []  # to adapt the co_insertable protrusion calculation

        # low density atoms on the convex hull
        lowdens_index = []
        for i, row in enumerate(distmat):
            ######################################
            # NEIGHBOURS
            ######################################
            if atomnameinfo[i] == "CB":
                density = row[row < DISTANCECUTOFF].shape[0] - 1
                # calculate density for convexhull verteces only
                if convhullinfo[i] == 1:
                    # close = distance of atoms below a certain cutoff
                    close = np.where(row < DISTANCECUTOFF)[0]

                    # HERE WE WILL SEARCH FOR CLOSE RESIDUE, TO MAKE STAT ON THEM
                    neighbours = []
                    for neighbor in close:  # TODO OPTIMIZE
                        if not neighbor == i:  # ignore current atom
                            neighborID = resnumber[neighbor]
                            if neighborID not in neighbours:
                                neighbours.append(resnumber[neighbor])  # add the resname in the list

                    neighboursIDAsString = ';'.join(list(map(str, neighbours)))
                    columnNeighbours[i] = neighboursIDAsString
                    columnDensity[i] = density

                    # if the number of close atoms (-1,because on the distance you also have the distance with itself) are bellow a certain threshold
                    if density < LOWDENSITYTHRESHOLD:
                        # we consider vertex as a low density protrusion.
                        columnLowDens[i] = 1
                        if resnameinfo[i] in HYDROPHOBICS:
                            columnHydroProt[i] = 1
                columnIdx[i] = i

        subset["neighboursID"] = columnNeighbours
        subset["density"] = columnDensity
        subset["protrusion"] = columnLowDens
        subset["is_hydrophobic_protrusion"] = columnHydroProt
        subset["idx"] = columnIdx  # To keep the idx object for the distance matrix
        subset.iloc[lowdens_index, subset.columns.get_loc("protrusion")] = 1

        # COINSERTABLE
        simplices = pd.DataFrame(hull.simplices, columns=["v1", "v2", "v3"])  # Vertex 1, vertex2, vertex3
        protrusions = subset.query("is_hydrophobic_protrusion == 1")
        co_insertable = []
        for residue in protrusions.iterrows():
            # Get 0-based residue index (same used for convexhull)
            idx = residue[1]["idx"]

            # Get all triangles where the current residue is found
            dd = simplices.query(" (v1 == " + str(idx) + " or v2 == " + str(idx) + " or v3 == " + str(idx) + ")")
            # remove duplicates, we just want which vertex our residue is attached to.
            uniques = np.unique(dd.values)
            # remove itself
            uniques = uniques[uniques != idx]
            # Look on protrusions

            # add it to the coinsertable list.
            uniques = [x for x in uniques if x in protrusions['idx'].to_numpy()]

            # Last check, for long edges, it has to be bellow our cutoff distance
            uniques = [x for x in uniques if distmat[idx][x] < CI_DISTANCECUTOFF]

            # Add the co-insertable neighbors
            columnsCoInsertableNeighbors[idx] = [resnumber[x] for x in uniques]

            co_insertable.extend(uniques)
        # remove duplicates
        co_insertable = np.unique(co_insertable)

        # Collect data
        if len(co_insertable) > 0:
            columnCoInsertable[co_insertable] = 1

        subset["is_co_insertable"] = columnCoInsertable
        subset["co_insertable_neighbors"] = columnsCoInsertableNeighbors
        # now we can change the values in the original dataset

        newcolumns = subset.columns.difference(pdbdata.columns).drop("idx")

        # t = subset[["protrusion", "neighbours","density"]]
        pdbdata = pd.concat([pdbdata, subset[newcolumns]], axis=1)

        return pdbdata


# ppdb=PandasPdb().read_pdb('test_data/rcsb_2da0_mdl1.pdb')
# ppdb = PandasPdb().fetch_pdb('2da0')
ppdb = PandasPdb().read_pdb('test_data/pdb1rlw.ent')
ppdbdf = ppdb.df['ATOM']
output = calc_protrusions_on_group(ppdbdf)
print(output.head())

# protrusions = output.query("protrusion == 1")
# print(list(protrusions["atom_number"])) 
# # [5, 142, 147, 170, 178, 298, 305, 389, 397, 457, 543, 560, 653, 665, 672, 780, 827, 888, 995, 1001]

# print(list(protrusions.query("is_hydrophobic_protrusion == 1")["atom_number"]))
# #147, 170, 178, 653, 672]

# print(list(protrusions.query("convhull_vertex == 1")["atom_number"]))

# [5, 142, 147, 170, 178, 298, 305, 389, 397, 457, 543, 560, 653, 665, 672, 780, 827, 888, 995, 1001]

# convexhull_vexter -> if the residue belongs to a convexhull vertex
# density -> number of CA/CB atoms in a radius of 1nm around the residue (CB)
# protrusion -> Is the residue a protrusion (density < 22)
# is_hydrophobic_protrusion -> Is the residue a HYDROPHOBIC protrusion
# is_co_insertable -> Is the residue a co-insertable (2 protrusion conected by a convexhull edge)?
# neighboursID -> Protrusion's Neighbours list (atom_number)
# co_insertable_neighbors -> Co-instertable's neighbours list
