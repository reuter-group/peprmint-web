
[<img width="600" alt="image" src="https://user-images.githubusercontent.com/5687628/124143879-c5df7f00-da8b-11eb-9add-2c3f20337dfa.png">](https://reuter-group.github.io/peprmint)


## Build:
```bash
cd web-client/ 
npm install  # only needed for the first time

## local usage: 
npx webpack serve  # development mode, automatically re-compile for new file changes
# then page should be available at 
## http://localhost:8080
```

## Development plan:
### V1.0
- [x] display the information of each protrusion in a proper way/interactive design
- [x] auto-deploy script added

### V1.1
 - [x] visualize edges for convex hull (and thus co-insertables), related to [#3](/../../issues/3)
 - [x] re-calculate for user selected sequence/chains, related to [#2](/../../issues/2)
 - [x] support download of domains from CATH, [#1](/../../issues/1)
 
### V1.2
- [x] update logo, name (PePr^2Vis), and page layout
- [x] add neighborhood information
- [ ] add license
- [ ] migrate website URL (to affiliated institute domain) for formal release


### Features TBD
- [ ] export report/script for external use, e.g. in PyMol


## Other notes:

- Environment set-up for running [python API](https://github.com/reuter-group/peprmint-web/blob/main/protrusion_for_dandan.py) (contributed by [Thibault Tubiana](https://github.com/tubiana))
```
$ conda env create -f peprmint-web_conda_env.txt  # on Mac
```

- the nice PePrMInt logo is credited to: [Emmanuel Moutoussamy](https://www.uib.no/en/persons/Emmanuel.Edouard.Moutoussamy)
