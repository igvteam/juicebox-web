# Juicebox Web

The web application that wraps [juicebox.js](https://github.com/aidenlab/juicebox.js) — a viewer for Hi-C contact maps. The viewer itself is the library's concern; this repo owns everything around it: the catalogs a user picks data from, the load and share surfaces, and the shipped distributions.

## Language

### The application

**Viewer**:
The juicebox.js library instance that draws contact maps and tracks. Everything it renders is the library's responsibility, not this repo's.
_Avoid_: juicebox, the app, hic

**Browser**:
A single viewer panel with its own loaded map, tracks, and locus. Several can be open at once.
_Avoid_: panel, instance, window

**Current browser**:
The browser the shell's menus read: the one whose genome, map and size they interrogate to decide what to offer. Exactly one whenever any browser exists, and shown by its border. It is what a menu is *about*, which is no longer the same as what a load *reaches* — see Target set.
_Avoid_: selected browser, active browser, focused browser

**Target set**:
The browsers a track load reaches: the current browser, plus any others the user has aimed at. Aiming is shift-click on a browser's navbar; a plain click clears the aim. Owned by juicebox.js — the shell asks for the set, it does not maintain one.
_Avoid_: multi-select, selection, selected browsers. Not a *sync group*: a target set is what a **track load** reaches and the user picks it; a sync group is what a **locus change** reaches and nobody picks it.

**Aim**:
The act of choosing a target set, and the state of having chosen one. A user aims at browsers; a load then reaches them.
_Avoid_: multi-selecting, targeting

**Sync group**:
The browsers whose locus follows one another's. Membership is derived, not chosen: juicebox.js pairs two browsers when their maps are the same assembly and carry the same chromosomes. It is settled when a map loads and does not change as the user pans, so a browser is either in a group for as long as that map is loaded, or in none. Distinct from a target set in both what it carries and who decides it.
_Avoid_: linked panels, locked panels, target set

**Sync refusal**:
The state of a browser that belongs to no sync group while other browsers are open — because its map is a different assembly, because it lacks chromosomes the others carry, or because the host opted it out. Shown on the panel itself, by the viewer. A browser that is merely the only one open has not been refused; there is nothing to sync with.
_Avoid_: sync error, unsynced, sync failure

**Shell**:
The parts of the page this repo owns — menus, modals, widgets, and the catalogs behind them. Distinct from the viewer it surrounds.
_Avoid_: chrome, wrapper, frontend

**Widget**:
A shell-owned interface element for getting data into the viewer — a load menu, a file input, a modal, a share dialog. Not the viewer's own controls.
_Avoid_: component, control

**Distribution**:
A build of the shell for a particular deployment — the default one and the AidenLab one, which differ in branding and entry page. Selected by build mode, not at runtime.
_Avoid_: flavor, variant, target, environment

**Embed**:
A page that hosts a bare viewer with no shell — no menus, no catalogs — for placing a map inside someone else's page.
_Avoid_: iframe, widget mode

### Contact maps

**Contact map**:
A Hi-C dataset (a `.hic` file) giving contact frequency between every pair of genomic loci in a genome. The primary thing a user loads.
_Avoid_: heatmap, matrix, hic file, dataset

**Control map**:
A second contact map loaded alongside the first for comparison. The interface calls the pair "A" and "B"; the control map is B.
_Avoid_: B map, comparison map, secondary map

**Map menu**:
The curated, searchable catalog of published contact maps offered in the load menu, each entry carrying its publication, organism, cell type, and protocol.
_Avoid_: map list, file list, hicfiles

**Datasource**:
An adapter that turns one external catalog — the curated map menu, ENCODE-hosted maps, 4DN maps — into rows of a searchable table. One per catalog; they differ in columns and in how they are queried.
_Avoid_: provider, backend, source, repository

**Resolution**:
The bin size at which a contact map is displayed. Changing it changes counts per bin, so the color scale must change with it.
_Avoid_: zoom level, granularity

### Genomic annotation

**Genome**:
The reference assembly a contact map is aligned to, named by its identifier (`hg19`, `mm10`). It is the key to nearly every catalog in the shell: switching genomes re-derives the track menus.
_Avoid_: assembly, reference, build

**Track**:
A one-dimensional annotation displayed along a map axis, positioned by a single genomic interval.
_Avoid_: 1D track, signal, feature track

**2D annotation**:
An annotation positioned by a *pair* of intervals, so it draws on the face of the map rather than along an axis. Loops and domains are 2D annotations.
_Avoid_: 2D track, feature pair, overlay

**Track menu**:
The genome-keyed catalog of curated tracks and 2D annotations offered for the currently loaded genome.
_Avoid_: annotation datalist, track list

**Track registry**:
The mapping from genome to the ENCODE track catalogs available for it. Determines which ENCODE load options a genome offers at all.
_Avoid_: track index, catalog

**Genome-derived track**:
A track that comes from the genome definition rather than a catalog — the reference sequence and its gene annotation. Toggled on and off rather than loaded and removed. There are exactly two, one per checkbox in the track menu.
_Avoid_: built-in track, default track

**Toggle**:
A checkbox in the track menu standing for a genome-derived track. Unlike every other load surface in the shell it both loads and unloads, which is what makes it the hard case under an aim: one control describing, and acting on, a whole target set.
_Avoid_: switch, button, control

### Session and sharing

**Session**:
The complete restorable state of the shell and its viewers — maps loaded, tracks loaded, loci, color scales. Saved to and loaded from a JSON file.
_Avoid_: state, workspace, config

**Share URL**:
A session compressed into a link, shortened for distribution and also offered as a QR code. Opening one restores the session it encodes.
_Avoid_: permalink, session link, short URL
