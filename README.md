[<img width="661" alt="image" src="https://user-images.githubusercontent.com/5687628/119658928-f8afab00-be2d-11eb-933e-61e8ae20b957.png">](https://reuter-group.github.io/peprmint-web.html)

## Build:
```bash
cd web-client/ 
npm install  # only needed for the first time
npx webpack  # development mode, automatically re-compile for new file changes
```

## Development plan:
### V1.0
- [x] display the information of each protrusion in a proper way/interactive design
- [x] auto-deploy script added

### V1.1
 - [x] visualize edges for convex hull (and thus co-insertables), related to [#3](/../../issues/3)
 - [ ] re-calculate for user selected sequence/chains, related to [#2](/../../issues/2)
 - [x] support download of domains from CATH, [#1](/../../issues/1)
 - [ ] Add a license

### V1.2
- [ ] export report/script for external use, e.g. in PyMol


## Other notes:

- Environment set-up for running [python API](https://github.com/reuter-group/peprmint-web/blob/main/protrusion_for_dandan.py) (contributed by [Thibault Tubiana](https://github.com/tubiana))
```
$ conda env create -f peprmint-web_conda_env.txt  # on Mac
```

- the nice PePrMInt logo is credited to: [Emmanuel Moutoussamy](https://www.uib.no/en/persons/Emmanuel.Edouard.Moutoussamy)
